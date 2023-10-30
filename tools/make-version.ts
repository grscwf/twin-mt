#!/usr/bin/env ts-node
/*
 * ts-node make-version.ts [--publish]
 *
 * Create a new version and tag it.
 */

import { Command } from "@commander-js/extra-typings";
import { runP } from "./lib";
import fsP from "fs/promises";

const top = `${__dirname}/..`;
const storyJS = `${top}/tw-twine/Story-JavaScript.tw`;

async function main(argv: string[]) {
  const program = new Command()
    .option("--deploy", "deploy the new version to mt2")
    .option("--push", "push to origin")
    .parse(argv);
  const opts = program.opts();

  const status = await runP("git status --porcelain", { echo: true });
  if (status !== "") {
    throw new Error(`checkout is not clean`);
  }

  const text = await fsP.readFile(storyJS, "utf-8");
  const m = /(setup\.version = ")(.+)"/.exec(text);
  if (m == null) {
    throw new Error(`Couldn't find version in ${storyJS}`);
  }

  const oldVersion = m[2]!;
  if (!/-nero-wip$/.test(oldVersion)) {
    throw new Error(`Expected version to be -nero-wip, not ${oldVersion}`);
  }

  const time = new Date().toISOString()
    .replace(/\..*/, "")
    .replace(/[-:]/g, "")
    .replace(/T/, "-");

  const version = `v2.0-beta-${time}`;

  const newText =
    text.slice(0, m.index + m[1]!.length)
    + version
    + text.slice(m.index + m[0].length - 1);

  await fsP.writeFile(storyJS, newText);
  await runP(`ts-node ${top}/tools/tw-to-html.ts`)

  await runP(`git commit -am "${version}"`, { echo: true });
  await runP(`git tag "${version}"`, { echo: true });

  if (opts.deploy) {
    await runP(`ts-node ${top}/tools/publish.ts`, { echo: true });
  }

  await fsP.writeFile(storyJS, text);
  await runP(`ts-node ${top}/tools/tw-to-html.ts`)
  await runP(`git commit -am "Revert to ${oldVersion}"`, { echo: true });
  if (opts.push) {
    await runP(`git push origin HEAD "${version}"`, { echo: true });
  }
}

main(process.argv).catch(e => {
  throw e;
});
