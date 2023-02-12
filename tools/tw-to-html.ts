#!/usr/bin/env ts-node
/*
 * ts-node builder.ts [--watch]
 *
 * Combine .tw files into .html files.
 *
 * In watch mode, continually watch .tw files and rebuild if .tw files change.
 * Complains and exits if someone else changes the .html files.
 */

import { Command } from "@commander-js/extra-typings";
import cp from "child_process";
import chokidar from "chokidar";
import fsp from "fs/promises";
import { createHash } from "crypto";

type Rule = {
  target: string;
  deps: string[];
  command: string;
};

// Note: pathnames are relative to cwd
const rules: Rule[] = [
  {
    target: "nero.html",
    deps: ["nero.tw"],
    command: "tweego nero.tw -o nero.html",
  },
  {
    target: "index.html",
    deps: ["story.tw"],
    command: "tweego story.tw -o index.html",
  }
];

function setupEnv() {
  const env = process.env;
  env["TWEEGO_PATH"] = "./assets";
  if (env["WSLENV"] != null) {
    env["WSLENV"] = `${env["WSLENV"]}:TWEEGO_PATH/l`;
  }
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

function buildRule(rule: Rule): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      console.log(timestamp(), rule.command);
      const proc = cp.spawn(rule.command, { shell: true, stdio: "inherit" });
      proc.on("error", (e) => reject(e));
      proc.on("exit", (code, sig) => {
        if (code === 0) {
          resolve();
        } else {
          let msg = `Failure when running: ${rule.command}\n`;
          msg += `Exited with ${code} ${sig}`;
          reject(new Error(msg));
        }
      });
    } catch (e) {
      reject(e);
    }
  });
}

async function watch(force: boolean) {
  await buildOnce(force);
  console.log("Watching...");

  // We want to avoid overwriting a target if something else changes it.
  // Unfortunately, if a file is being watched in WSL, Twine in Windows
  // somehow writes to the file without changing its mtime.
  // So we detect changes by checksumming the file.

  const targets = rules.map((r) => r.target);
  const checksums = new Map<string, string>();
  for (const target of targets) {
    checksums.set(target, await checksum(target));
  }

  const isBuilding = new Set<string>();

  const checkTarget = async (target: string) => {
    if (isBuilding.has(target)) return;
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
    const startRebuild = async (path: string) => {
      const target = rule.target;
      if (isBuilding.has(target)) return;
      await checkTarget(target);
      console.log(`${path} changed, rebuilding ${target}`);
      isBuilding.add(target);
      buildRule(rule)
        .then(async () => {
          checksums.set(target, await checksum(target));
          isBuilding.delete(target);
        })
        .catch((e) => {
          console.error(e);
          process.exit(1);
        });
    };
    const watcher = chokidar.watch(rule.deps, { ignoreInitial: true });
    watcher.on("add", startRebuild);
    watcher.on("change", startRebuild);
    watcher.on("unlink", startRebuild);
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

(async () => {
  await main(process.argv);
})();
