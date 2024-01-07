#!/usr/bin/env ts-node
/*
 * ts-node untwine.ts $htmlFile
 *
 * Disassemble Twine .html files into .tw files, one per passage.
 * - The .tw files are distributed into subdirs.
 * - If any passage has an existing tw file in a subdir,
 *   that tw file is updated.
 * - Otherwise, a new tw file is created in the last subdir.
 */

import { Command } from "@commander-js/extra-typings";
import fastGlob from "fast-glob";
import fsp from "fs/promises";
import path from "path";
import { fnameForTitle, headerRE, runP, setupEnv } from "./lib";
import { Rule, rules } from "./rules";

const repr = JSON.stringify;

async function main(argv: string[]) {
  setupEnv();
  const program = new Command()
    .argument("[htmlFile...]", "Twine html file")
    .option("--ignore-dirty", "Continue even if git repo is dirty")
    .parse(argv);

  const opts = program.opts();
  await checkGit(!!opts.ignoreDirty);

  if (program.args.length === 0) {
    await untwine(rules.map((r) => r.target));
  } else {
    await untwine(program.args);
  }
}

async function checkGit(ignoreDirty: boolean): Promise<void> {
  try {
    const command = "git status --porcelain";
    const stdout = await runP(command, { echo: true });
    if (stdout === "") {
      console.log("Repo is clean.");
      return;
    }
    if (ignoreDirty) {
      console.log("Ignoring dirty repo, because --ignore-dirty");
      return;
    }
    console.error("Error: Repo is dirty.");
  } catch (e) {
    console.error(e);
    if (ignoreDirty) {
      console.log("Ignoring git error, because --ignore-dirty");
      return;
    }
    console.error("Error: Unable to determine if repo is clean.");
  }
  console.error("Untwine can be destructive.");
  console.error("Please commit changes first (or run with --ignore-dirty)");
  process.exit(1);
}

async function untwine(htmlFiles: string[]) {
  for (const h of htmlFiles) {
    await untwineOne(h);
  }
}

async function untwineOne(htmlFile: string) {
  console.log("");

  const rule = rules.find((r) => r.target === htmlFile);
  if (rule == null) {
    throw new Error(`No rule for ${htmlFile}`);
  }

  const existing = await findExisting(rule);
  const cmd = `tweego -d ${htmlFile}`;
  const twee = await runP(cmd, { echo: false });

  let newFiles = 0;
  let unchanged = 0;
  let updated = 0;

  const maybeWrite = async (title: string, passage: string) => {
    const f = existing.get(title);
    if (f == null) {
      await makeNew(rule, title, passage);
      newFiles++;
    } else if (await maybeUpdate(f, passage)) {
      updated++;
    } else {
      unchanged++;
    }
  };

  const splitJoined = async (passage: string) => {
    const re1 = /(^[/][*] twine-user-(?:script|stylesheet) .*?\r?\n)/gm;
    const parts = passage.split(re1);
    const re2 = /twine-user-(?:script|stylesheet) #\d+: "(.*?)"/;
    // First section should be the main Story JavaScript or Stylesheet
    {
      const m = re2.exec(parts[1]!);
      const title = m![1]!;
      if (!/^Story (JavaScript|Stylesheet)$/.test(title)) {
        throw new Error(`Unexpected joined structure ${parts[0]}`);
      }
      // attach twine header to that section
      maybeWrite(title, parts[0]! + parts[2]!);
    }
    // rest are individual files
    for (let i = 3; i < parts.length; i += 2) {
      const head = parts[i]!;
      const body = parts[i + 1]!;
      const m = re2.exec(head);
      if (m == null) {
        throw new Error(`couldn't parse header? ${repr(head[0])}`);
      }
      const title = m[1]!;
      maybeWrite(title, body);
    }
  };

  const headers = Array.from(twee.matchAll(headerRE));
  for (let i = 0; i < headers.length; i++) {
    const title = headers[i]![1]!;
    const start = headers[i]!.index;
    const end = i + 1 < headers.length ? headers[i + 1]!.index : twee.length;

    let passage = twee.slice(start, end).trimEnd();
    passage += passage.includes("\r") ? "\r\n" : "\n";

    if (/^[/][*] twine-user-/m.test(passage)) {
      await splitJoined(passage);
    } else {
      await maybeWrite(title, passage);
    }
  }

  console.log(`${newFiles} files created`);
  console.log(`${updated} files updated`);
  console.log(`${unchanged} files unchanged`);
}

/** Returns a map of existing passage title -> filename */
async function findExisting(rule: Rule) {
  const existing = new Map<string, string>();
  const patterns = rule.dirs.map((d) => `${d}/**`);
  console.log("Searching", patterns);
  const files = await fastGlob(patterns);
  for (const file of files) {
    if (/[.](css|js)$/.test(file)) {
      const title = path.basename(file);
      if (existing.has(title)) {
        const other = existing.get(title);
        throw new Error(`duplicate filenames ${file} and ${other}`);
      }
      existing.set(title, file);
      continue;
    }

    const twee = await fsp.readFile(file, "utf8");
    const headers = Array.from(twee.matchAll(headerRE));
    if (headers.length !== 1) {
      throw new Error(
        `Expected only one :: header,` +
          ` but found ${headers.length} headers in ${file}`
      );
    }

    const title = headers[0]![1]!;
    if (existing.has(title)) {
      const other = existing.get(title);
      throw new Error(`[[${title}]] is duplicated in ${file} and ${other}`);
    }

    const f = fnameForTitle(title);
    if (f !== path.basename(file)) {
      console.log(`Note: [[${title}]] expected filename is ${f}, not ${file}`);
    }

    existing.set(title, file);
  }
  return existing;
}

/** Creates a new .tw file for a passage. */
async function makeNew(rule: Rule, title: string, passage: string) {
  const dir = rule.dirs.at(-1)!;
  await fsp.mkdir(dir, { recursive: true });
  const fname = fnameForTitle(title);
  const fpath = path.join(dir, fname);
  try {
    const fh = await fsp.open(fpath, "wx");
    await fh.write(passage);
    await fh.close();
  } catch (e) {
    throw new Error(`Failed to create new file ${fpath}: ${e}`);
  }
}

/**
 * Updates file if file contents are different from value.
 * Returns true if file needed updating.
 */
async function maybeUpdate(fname: string, value: string) {
  let current = await fsp.readFile(fname, "utf8");
  current = current.replaceAll(/\r\n/g, "\n");
  value = value.replaceAll(/\r\n/g, "\n");
  if (current === value) return false;
  fsp.writeFile(fname, value);
  return true;
}

main(process.argv).catch((e) => {
  throw e;
});
