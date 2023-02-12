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
import fglob from "fast-glob";
import fsp from "fs/promises";
import path from "path";
import { runP, setupEnv } from "./lib";
import { Rule, rules } from "./rules";

const headerRE = /^:: ([^\[{]+)(?:\s[\[{].*)?$/gm;

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
    console.log(command);
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
  const rule = rules.find((r) => (r.target = htmlFile));
  if (rule == null) {
    throw new Error(`No rule for ${htmlFile}`);
  }

  const existing = await findExisting(rule);
  const twee = await runP(`tweego -d ${htmlFile}`, { echo: false });

  let newFiles = 0;
  let updated = 0;

  const headers = Array.from(twee.matchAll(headerRE));
  for (let i = 0; i < headers.length; i++) {
    const title = headers[i]![1]!;
    const start = headers[i]!.index;
    const end = i + 1 < headers.length ? headers[i + 1]!.index : twee.length;
    const passage = twee.slice(start, end);

    const f = existing.get(title);
    if (f == null) {
      await makeNew(rule, title, passage);
      newFiles++;
    } else {
      updated += await maybeUpdate(f, passage) ? 1 : 0;
    }
  }

  console.log(`Updated ${updated} files`);
  console.log(`Created ${newFiles} new files`);
}

/** Returns a map of existing passage title -> filename */
async function findExisting(rule: Rule) {
  const existing = new Map<string, string>();
  const patterns = rule.dirs.map((d) => `${d}/**/*.tw`);
  console.log("Searching for existing twee files in", patterns);
  const files = await fglob(patterns);
  for (const file of files) {
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

    const f = filenameForTitle(title);
    if (f !== path.basename(file)) {
      console.log(`Note: [[${title}]] expected filename is ${f}, not ${file}`);
    }

    existing.set(title, file);
  }
  return existing;
}

/** Creates a new .tw file for a passage. */
async function makeNew(rule: Rule, fname: string, passage: string) {
  const dir = rule.dirs.at(-1)!;
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
  const current = await fsp.readFile(fname, "utf8");
  if (current === value) return false;
  console.log(`Updating ${fname}`);
  fsp.writeFile(fname, value);
  return true;
}

/** Returns a normal filename for a passage title. */
function filenameForTitle(title: string): string {
  return title.replaceAll(/[()']/g, "").replaceAll(/[/\s]+/g, "-") + ".tw";
}

main(process.argv).catch((e) => {
  throw e;
});
