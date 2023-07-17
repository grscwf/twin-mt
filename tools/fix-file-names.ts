#!/usr/bin/env ts-node
/*
 * ts-node fix-file-names.ts
 *
 * Rename files to match passage name.
 */

import fastGlob from "fast-glob";
import fsp from "fs/promises";
import { basename, dirname } from "path";
import { fnameForTitle, headerRE } from "./lib";

async function main() {
  const files = await fastGlob("**/*.tw");
  const renames: Record<string, string> = {};
  for (const file of files) {
    const desired = await needsRename(file);
    if (desired != null) {
      renames[file] = desired;
    }
  }
  await cyclicRename(renames);
}

async function cyclicRename(renames: Record<string, string>) {
  let keys = Object.keys(renames);
  while (keys.length) {
    const from = keys.pop()!;
    let to = renames[from]!;
    const todo: [string, string][] = [[from, to]];
    while (renames[to] != null && to !== from) {
      keys = keys.filter(k => k !== to);
      todo.push([to, renames[to]!]);
      to = renames[to]!;
    }
    if (to === from) {
      todo.push([to, "rename-tmp"]);
      todo[0]![0] = "rename-tmp";
    }
    while (todo.length) {
      const [from, to] = todo.pop()!;
      console.log(`rename ${from} to ${to}`);
      try {
        await fsp.access(to);
        throw new Error(`${to} already exists?`);
      } catch {}
      await fsp.rename(from, to);
    }
  }
}

async function needsRename(file: string): Promise<string | null> {
  const dir = dirname(file);
  const base = basename(file);
  const twee = await fsp.readFile(file, "utf8");
  const m = Array.from(twee.matchAll(headerRE));
  if (m.length === 0) {
    throw new Error(`Couldn't find twee header in ${file}`);
  }
  const title = m[0]![1]!;
  const desired = fnameForTitle(title);
  if (base === desired) return null;
  return dir + "/" + desired;
}

main().catch((e) => {
  throw e;
});
