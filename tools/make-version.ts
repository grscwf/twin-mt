#!/usr/bin/env ts-node
/*
 * ts-node make-version.ts $version [--deploy]
 *
 * Create a new version and tag it.
 */

import { Command } from "@commander-js/extra-typings";
import { runP } from "./lib";
import fsP from "fs/promises";

const top = `${__dirname}/..`;
const versionJS = `${top}/tw-code/c0-Game-Version.js`;

function fatal(message: string, ...args: unknown[]): never {
  if (args.length) {
    console.error(message, ...args);
  }
  throw new Error(message);
}

function nonfatal(
  force: boolean | undefined,
  message: string,
  ...args: unknown[]
) {
  if (force) {
    console.error(message, ...args);
  } else {
    fatal(message, ...args);
  }
}

async function main(argv: string[]) {
  const program = new Command()
    .option("--deploy", "deploy the new version to mt2")
    .option("--push", "push to origin")
    .option("--force", "ignore error checks");
  program.argument("<version>");
  program.parse(argv);
  const opts = program.opts();

  const status = await runP("git status --porcelain", { echo: true });
  if (status !== "") {
    nonfatal(opts.force, "checkout is not clean");
  }

  const text = await fsP.readFile(versionJS, "utf-8");
  const m = /(setup\.version = ")(.+)"/.exec(text);
  if (m == null) {
    fatal(`couldn't find version in ${versionJS}`);
  }

  const oldVersion = m[2]!;
  if (!/-nero-wip$/.test(oldVersion)) {
    nonfatal(opts.force, `Expected version to be -nero-wip, not ${oldVersion}`);
  }

  const version = program.args[0]!;

  const versionRE = /^v2[.]0-beta-\d+$/;
  if (!versionRE.test(version)) {
    nonfatal(opts.force, `Version ${version} does not match ${versionRE}`);
  }

  const newText =
    text.slice(0, m.index + m[1]!.length) +
    version +
    text.slice(m.index + m[0].length - 1);

  await fsP.writeFile(versionJS, newText);
  await runP(`ts-node ${top}/tools/tw-to-html.ts`);

  await runP(`git commit -am "${version}"`, { echo: true });
  await runP(`git tag "${version}"`, { echo: true });

  if (opts.deploy) {
    await runP(`ts-node ${top}/tools/deploy.ts`, { echo: true });
  }

  await fsP.writeFile(versionJS, text);
  await runP(`ts-node ${top}/tools/tw-to-html.ts`);
  await runP(`git commit -am "Revert to ${oldVersion}"`, { echo: true });
  if (opts.push) {
    await runP(`git push origin HEAD "${version}" 2>&1`, { echo: true });
  }
}

main(process.argv).catch((e) => {
  throw e;
});
