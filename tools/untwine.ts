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
import { runP, setupEnv } from "./lib";
import { rules } from "./rules";


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
    const stdout = await runP(command);
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

async function untwineOne(htmlFile: string) {}

main(process.argv).catch((e) => {
  throw e;
});
