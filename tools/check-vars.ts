#!/usr/bin/env ts-node

import { rules } from "./rules";
import { headerRE } from "./lib";
import fsp from "fs/promises";
import fastGlob from "fast-glob";

const declsFile = `${__dirname}/../nero-vars.txt`;

const varPatterns = [
  /[$]([A-Za-z_]\w*)/g,
  /\b[vVU][01]?[.](\w+)/g,
  /\b(setup[.]\w+)/g,
  /\b(n[0-9]_\w+):/g,
  /\b(n_\w+):/g,
  /\bState[.]variables[.](\w+)/g,
  /\b(?:mdSet|mdUncachedGet|mdDef\w+)\("(\w+)"/g,
  /\b(?:mdSet|mdUncachedGet|mdDef\w+)\('(\w+)'/g,
  /[<]arc-barbs\s+(\w+)/g,
  /[<]arc-select\s+(\w+)/g,
  /[<]random-once\s+(\w+)/g,
  /[<]checkpoint-action\s+(\w+)/g,
  /[<]checkpoint-load\s+(\w+)/g,
  /[<]checkpoint-save\s+(\w+)/g,
  /[<]ending-(?:bad|good)\s+(\w+)/g,
  /[<]vi-always\s+(\w+)/g,
  /[<]vi-always-if\s+(\w+\s+\w+)/g,
  /[<]vi-ignore\s+(\w+(?:\s+\w+)*)/g,
  /[<]vi-ignore-if\s+(\w+(?:\s+\w+)+)/g,
];

const MAX_CONTEXT = 60;

type Declarations = {
  vars: Set<string>;
  once: Set<string>;
  twice: Set<string>;
};

type Location = {
  fname: string;
  passage: string;
  lno: number;
  context: string;
};

type Usages = {
  locs: Record<string, Location[]>;
};

async function main() {
  const decls = await readDecls(declsFile);
  const nero = rules.find((r) => r.target === "nero.html")!;
  const analysis = await scanDirs(nero.dirs);
  report(decls, analysis);
}

async function readDecls(fname: string) {
  const text = await fsp.readFile(fname, "utf8");
  const decls: Declarations = {
    vars: new Set(),
    once: new Set(),
    twice: new Set(),
  };
  const re = /^\s*((?:setup\.)?\w+)/;
  for (const line of text.split(/\r?\n/)) {
    const m = re.exec(line);
    if (m != null) {
      const vName = m[1]!;
      decls.vars.add(vName);
      if (/@once/.test(line)) decls.once.add(vName);
      if (/@twice/.test(line)) decls.twice.add(vName);
    }
  }
  return decls;
}

async function scanDirs(dirs: string[]) {
  const patterns = dirs.map((d) => `${d}/**/*.tw`);
  const files = await fastGlob(patterns);
  const usages: Usages = { locs: {} };
  for (const f of files) {
    await scanFile(f, usages);
  }
  return usages;
}

async function scanFile(fname: string, usages: Usages) {
  const text = await fsp.readFile(fname, "utf8");
  const m = new RegExp(headerRE).exec(text);
  const passage = m == null ? "" : m[1]!;
  const lines = text.split(/\r?\n/);
  // might be faster to match whole text then find lno of matches,
  // but this is fast enough for the size of this project.
  lines.forEach((line, lno) => {
    // quick hack to ignore varNames in comments
    if (/^\s*(?:\/[/*]|[*])/.test(line)) return;

    for (const re of varPatterns) {
      const stripped = line.replace(/\/[/*].*/, "");
      for (const m of stripped.matchAll(re)) {
        const vNames = m[1]!.split(/\s+/);
        for (const vn of vNames) {
          const context = getContext(line, m.index!);
          usages.locs[vn] ??= [];
          usages.locs[vn]!.push({ fname, passage, lno, context });
        }
      }
    }
  });
}

function getContext(line: string, pos: number) {
  line = line.trim();
  if (line.length > MAX_CONTEXT) {
    const left = Math.max(0, pos - MAX_CONTEXT / 2);
    line = line.slice(left, left + MAX_CONTEXT);
  }
  return line;
}

function report(decls: Declarations, usages: Usages) {
  const usedOnce = Object.keys(usages.locs).filter(
    (vn) => decls.vars.has(vn) && usages.locs[vn]!.length === 1
  );
  const unexpectedOnce = usedOnce.filter(vn => !decls.once.has(vn));
  if (unexpectedOnce.length) {
    console.log("\nUsed once, but not marked @once:");
    showUsages(unexpectedOnce, usages);
  }

  usedOnce.forEach(vn => decls.once.delete(vn));
  if (decls.once.size) {
    console.log("\nMarked @once, but not used exactly once:");
    showUsages(Array.from(decls.once), usages);
  }

  const undeclared = Object.keys(usages.locs).filter(
    (vn) => !decls.vars.has(vn)
  );
  if (undeclared.length) {
    console.log("\nUndeclared vars:");
    showUsages(undeclared, usages);
  }

  const unused = Array.from(decls.vars).filter((vn) => usages.locs[vn] == null);
  if (unused.length) {
    console.log("\nUnused vars:");
    for (const vn of unused.sort()) {
      console.log(`  ${vn}`);
    }
  }
}

function showUsages(vnames: string[], usages: Usages) {
  for (const vn of Array.from(vnames).sort()) {
    const locs = usages.locs[vn];
    if (locs == null) {
      console.log(`  ${vn} (no usages)`);
    } else {
      showLocs(vn, locs);
    }
  }
}

function showLocs(vn: string, locs: Location[]) {
  const MAX_SHOW = 4;
  console.log(`  ${vn}`);
  const n = locs.length > MAX_SHOW ? MAX_SHOW - 1 : MAX_SHOW;
  for (const loc of locs.slice(0, n)) {
    console.log(`    [${loc.passage}] ${loc.context}`);
  }
  if (locs.length > MAX_SHOW) {
    console.log(`    ...`);
  }
}

main().catch((e) => {
  throw e;
});
