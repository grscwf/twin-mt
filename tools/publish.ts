#!/usr/bin/env ts-node
/*
 * ts-node publish.ts [--force]
 *
 * Publishes docroot to mt2.canids.net
 */

import { Command } from "@commander-js/extra-typings";
import { runP } from "./lib";
import fsP from "fs/promises";

const top = `${__dirname}/..`;
const src = `${__dirname}/../docroot/`;
const dest = `mt2.canids.net:mt2.canids.net/`;
const storyJS = `${top}/tw-twine/Story-JavaScript.tw`;

async function main(argv: string[]) {
  const program = new Command()
    .option("--force", "skip version check")
    .parse(argv);
  const opts = program.opts();

  if (!opts.force) {
    await checkVersion();
  }

  const cmd = `rsync -aiL --delete ${src} ${dest}`;
  console.log(cmd);
  await runP(cmd, { echo: true });
}

async function checkVersion() {
  const text = await fsP.readFile(storyJS, "utf-8");
  const m = /setup\.version = "(.+)"/.exec(text);
  if (m == null) {
    throw new Error(`Couldn't find version in ${storyJS}`);
  }
  const version = m[1]!;
  if (!/\d+$/.test(version)) {
    throw new Error(`Should not publish version ${version}`);
  }
}

main(process.argv).catch((e) => {
  throw e;
});