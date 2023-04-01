#!/usr/bin/env ts-node
/*
 * ts-node builder.ts [--watch]
 *
 * Combine .tw files into Twine .html files.
 *
 * In watch mode, continually watch .tw files and rebuild if .tw files change.
 * Complains and exits if someone else changes the .html files.
 */

import { Command } from "@commander-js/extra-typings";
import chokidar from "chokidar";
import { createHash } from "crypto";
import type { Stats } from "fs";
import fsp from "fs/promises";
import { runP, setupEnv, timestamp } from "./lib";
import type { Rule } from "./rules";
import { rules } from "./rules";
import fastGlob from "fast-glob";
import ansi from 'ansi-colors';

const buildDelay = 200; // msec

async function main(argv: string[]) {
  setupEnv();
  const program = new Command()
    .option("--force", "rebuild, even if already up-to-date")
    .option("--watch", "Watch and rebuild whenever files change")
    .parse(argv);
  const opts = program.opts();
  if (opts.watch) {
    await watch(!!opts.force);
  } else {
    await buildOnce(!!opts.force);
  }
}

async function buildOnce(force: boolean) {
  for (const rule of rules) {
    if (await needsBuild(rule, force)) {
      await buildRule(rule);
    }
  }
}

function log(msg: string) {
  console.log(ansi.dim.cyan(timestamp()), msg);
}

async function needsBuild(rule: Rule, force: boolean) {
  const tStat = await fsp.stat(rule.target);
  if (tStat == null) {
    log(`${rule.target} does not exist`);
    return true;
  }
  const patterns = rule.dirs.map((d) => `${d}/**/*.tw`);
  const deps = await fastGlob(patterns);
  for (const dep of deps) {
    const dStat = await fsp.stat(dep);
    if (dStat == null) {
      log(`${rule.target} dep ${dep} does not exist`);
      return true;
    }
    if (dStat.mtime > tStat.mtime) {
      log(`${rule.target} dep ${dep} is more recent`);
      return true;
    }
  }
  if (force) {
    log(`${rule.target} already up-to-date, but --force build anyway`);
    return true;
  } else {
    log(`${rule.target} already up-to-date`);
    return false;
  }
}

async function buildRule(rule: Rule): Promise<void> {
  let dirs = await fastGlob(rule.dirs, { onlyFiles: false });
  if (rule.omit != null) {
    const omit = await fastGlob(rule.omit, { onlyFiles: false });
    dirs = dirs.filter(d => !omit.includes(d));
  }
  const cmd = `tweego -o ${rule.target} ${dirs.join(" ")}`;
  log(cmd);
  await runP(cmd, { echo: true });
  log("done");
}

async function watch(force: boolean) {
  const targets = rules.map((r) => r.target);

  // We record the time a build started, because if a dep changes during
  // a build, the result might be stale, so we need to build again.
  const buildStartedTime = new Map<string, number>();

  const now = Date.now();
  for (const t of targets) {
    buildStartedTime.set(t, now);
  }

  await buildOnce(force);
  log("Watching...");

  // We want to avoid overwriting a target if something else changes it.
  // Unfortunately, if a file is being watched in WSL, Twine in Windows
  // somehow writes to the file without changing its mtime.
  // So we detect changes by checksumming the file.

  const checksums = new Map<string, string>();
  for (const target of targets) {
    checksums.set(target, await checksum(target));
  }

  const isBuilding = new Set<string>();
  const buildPending = new Set<string>();
  const needsRebuild = new Set<string>();

  /** Exit if target has changed unexpected. */
  const checkTarget = async (target: string) => {
    if (isBuilding.has(target)) return;
    const ck = await checksum(target);
    if (ck !== checksums.get(target)) {
      log(`Exiting: someone else changed ${target}`);
      log(`expected: ${checksums.get(target)}`);
      log(`currently: ${ck}`);
      process.exit(1);
    }
  };

  for (const target of targets) {
    setInterval(() => checkTarget(target), 4000);
  }

  for (const rule of rules) {
    const target = rule.target;
    const rebuild = async () => {
      if (isBuilding.has(target)) return;
      if (buildPending.has(target)) return;

      buildPending.add(target);
      await timeout(buildDelay);
      await checkTarget(target);

      buildStartedTime.set(target, Date.now());
      buildPending.delete(target);
      isBuilding.add(target);

      try {
        await buildRule(rule);
        checksums.set(target, await checksum(target));
        isBuilding.delete(target);
        if (needsRebuild.has(target)) {
          log(`${target} deps changed during build, rebuilding`);
          needsRebuild.delete(target);
          await rebuild();
        }
      } catch (e) {
        console.error(e);
        process.exit(1);
      }
    };
    const maybeRebuild = async (path: string, stat: Stats | undefined) => {
      if (buildPending.has(target)) return;
      if (isBuilding.has(target)) {
        const t = buildStartedTime.get(target);
        if (t == null || stat == null || stat.mtime.getTime() >= t) {
          log(`${path} changed during build of ${target}`);
          needsRebuild.add(target);
        }
        return;
      }
      log(`${path} changed, rebuilding ${target}`);
      rebuild();
    };
    const dirs = await fastGlob(rule.dirs, { onlyFiles: false });
    const watcher = chokidar.watch(dirs, { ignoreInitial: true });
    watcher.on("add", maybeRebuild);
    watcher.on("change", maybeRebuild);
    watcher.on("unlink", maybeRebuild);
    watcher.on("error", (e) => {
      console.error(e);
      process.exit(1);
    });
  }
}

async function checksum(file: string): Promise<string> {
  const data = await fsp.readFile(file);
  const hasher = createHash("sha256"); // overkill, but not expensive
  hasher.update(data);
  const hash = hasher.digest("hex");
  const st = await fsp.stat(file);
  const time = st.mtime.getTime();
  return `${time} ${hash}`;
}

function timeout(msec: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, msec));
}

main(process.argv).catch((e) => {
  throw e;
});
