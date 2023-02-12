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
import cp from "child_process";
import chokidar from "chokidar";
import { createHash } from "crypto";
import type { Stats } from "fs";
import fsp from "fs/promises";
import { promisify } from "util";
import { setupEnv } from "./lib";
import type { Rule } from "./rules";
import { rules } from "./rules";

const execP = promisify(cp.exec);
type ExecPException = cp.ExecException & {
  stdout?: string | undefined;
  stderr?: string | undefined;
}

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

async function needsBuild(rule: Rule, force: boolean) {
  const tStat = await fsp.stat(rule.target);
  if (tStat == null) {
    console.log(`${rule.target} does not exist`);
    return true;
  }
  for (const dep of rule.deps) {
    const dStat = await fsp.stat(dep);
    if (dStat == null) {
      console.log(`${rule.target} dep ${dep} does not exist`);
      return true;
    }
    if (dStat.mtime > tStat.mtime) {
      console.log(`${rule.target} dep ${dep} is more recent`);
      return true;
    }
  }
  if (force) {
    console.log(`${rule.target} already up-to-date, but --force build anyway`);
    return true;
  } else {
    console.log(`${rule.target} already up-to-date`);
    return false;
  }
}

async function buildRule(rule: Rule): Promise<void> {
  console.log(timestamp(), rule.toHtml);
  try {
    const { stdout, stderr } = await execP(rule.toHtml);
    process.stdout.write(stdout);
    process.stderr.write(stderr);
  } catch (e) {
    const err = e as ExecPException;
    process.stdout.write(err.stdout ?? "");
    process.stderr.write(err.stderr ?? "");
    throw e;
  }
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
  console.log("Watching...");

  // We want to avoid overwriting a target if something else changes it.
  // Unfortunately, if a file is being watched in WSL, Twine in Windows
  // somehow writes to the file without changing its mtime.
  // So we detect changes by checksumming the file.

  const checksums = new Map<string, string>();
  for (const target of targets) {
    checksums.set(target, await checksum(target));
  }

  const isBuilding = new Set<string>();
  const needsRebuild = new Set<string>();

  /** Exit if target has changed unexpected. */
  const checkTarget = async (target: string) => {
    const ck = await checksum(target);
    if (ck !== checksums.get(target)) {
      console.log(`Exiting: someone else changed ${target}`);
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
      isBuilding.add(target);
      buildStartedTime.set(target, Date.now());
      await checkTarget(target);
      try {
        await buildRule(rule);
        checksums.set(target, await checksum(target));
        isBuilding.delete(target);
        if (needsRebuild.has(target)) {
          console.log(`${target} deps changed during build, rebuilding`);
          needsRebuild.delete(target);
          await rebuild();
        }
      } catch (e) {
        console.error(e);
        process.exit(1);
      }
    };
    const maybeRebuild = async (path: string, stat: Stats | undefined) => {
      if (isBuilding.has(target)) {
        const t = buildStartedTime.get(target);
        if (t == null || stat == null || stat.mtime.getTime() >= t) {
          console.log(`${path} changed during build of ${target}`);
          needsRebuild.add(target);
        }
        return;
      }
      console.log(`${path} changed, rebuilding ${target}`);
      rebuild();
    };
    const watcher = chokidar.watch(rule.deps, { ignoreInitial: true });
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
  const hash = createHash("sha256"); // overkill, but not expensive
  hash.update(data);
  return hash.digest("hex");
}

function timestamp(): string {
  const now = new Date().toISOString();
  return now.replace("T", " ");
}

main(process.argv).catch((e) => {
  throw e;
});
