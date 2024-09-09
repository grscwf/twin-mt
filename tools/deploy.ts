#!/usr/bin/env ts-node
/*
 * ts-node deploy.ts [--force]
 *
 * Publishes docroot to mt2.canids.net
 */

import { Command } from "@commander-js/extra-typings";
import { fatal, nonfatal, runP } from "./lib";
import fsP from "fs/promises";

const top = `${__dirname}/..`;
const src = `${__dirname}/../docroot/`;
const dest = `mt2.canids.net:mt2.canids.net/`;
const versionJS = `${top}/tw-code/c0-Game-Version.js`;

async function main(argv: string[]) {
  const program = new Command()
    .option("-n, --dry-run", "show what will happen")
    .option("--force", "ignore sanity checks")
    .parse(argv);
  const opts = program.opts();

  await checkVersion(opts.force || opts.dryRun);

  const dryRun = opts.dryRun ? "-n" : "";
  const cmd = `rsync ${dryRun} -aiL --no-p --chmod=D755,F644 --delete ${src} ${dest}`;
  await runP(cmd, { echo: true });
}

async function checkVersion(force: boolean | undefined) {
  const text = await fsP.readFile(versionJS, "utf-8");
  const m = /setup\.version = "(.+)"/.exec(text);
  if (m == null) {
    fatal(`Couldn't find version in ${versionJS}`);
  }
  const version = m[1]!;
  if (!/\d+$/.test(version)) {
    nonfatal(force, `Should not publish version ${version}`);
  }
}

main(process.argv).catch((e) => {
  throw e;
});
