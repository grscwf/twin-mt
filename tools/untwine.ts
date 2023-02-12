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
import { setupEnv } from "./lib";
import type { Rule } from "./rules";
import { rules } from "./rules";
import cp from "child_process";
import { promisify } from "util";

const execP = promisify(cp.exec);
type ExecPException = cp.ExecException & {
  stdout?: string | undefined;
  stderr?: string | undefined;
}

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
    const { stdout, stderr } = await execP(command);
    process.stdout.write(stdout);
    process.stderr.write(stderr);
    if (stdout === "" && stderr === "") {
      console.log("repo is clean");
      return;
    }
    if (ignoreDirty) {
      console.log("ignoring dirty repo, because --ignore-dirty");
      return;
    }
    console.error("repo is dirty. Untwine may be destructive.");
    console.error("Please commit changes first (or run with --ignore-dirty");
    process.exit(1);
  } catch (e) {
    const err = e as ExecPException;
    process.stdout.write(err.stdout ?? "");
    process.stderr.write(err.stderr ?? "");
    if (ignoreDirty) {
      console.log("Ignoring git error, because --ignore-dirty");
      return;
    }
    throw e;
  }
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
