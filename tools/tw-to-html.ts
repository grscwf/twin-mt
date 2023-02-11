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

  const isBuilding = new Set();

  const targetChanged = (path: string) => {
    if (!isBuilding.has(path)) {
      console.error(`Exiting due to unexpected change to ${path}`);
      process.exit(1);
    }
  };

  const targets = rules.map((r) => r.target);
  const tWatcher = chokidar.watch(targets, { ignoreInitial: true });
  tWatcher.on("add", targetChanged);
  tWatcher.on("change", targetChanged);
  tWatcher.on("unlink", targetChanged);
  tWatcher.on("error", (e) => {
    console.error(e);
    process.exit(1);
  });

  for (const rule of rules) {
    const startRebuild = (path: string) => {
      if (isBuilding.has(rule.target)) return;
      console.log(`${path} changed, rebuilding ${rule.target}`);
      isBuilding.add(rule.target);
      buildRule(rule)
        .then(() => {
          isBuilding.delete(rule.target);
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

function timestamp(): string {
  const now = new Date().toISOString();
  return now.replace("T", " ");
}

(async () => {
  await main(process.argv);
})();
