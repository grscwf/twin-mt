#!/usr/bin/env node
/**
 * Usage: node list-vars.js file.tw
 *
 * Lists all vars and their usages in file.tw. Useful for spotting typos
 * and unused vars.
 */

const fs = require("fs");

function usage() {
  console.log("Usage: node list-vars.js file.tw");
  process.exit(1);
}

function main(args) {
  if (args.length !== 1) usage();
  listVars(args[0]);
}

function listVars(twFile) {
  const text = fs.readFileSync(twFile, "utf-8");
  const lines = text.split(/\r?\n/);
  const vars = [];
  const passageMap = [];
  const contexts = [];
  let passage = "-";

  lines.forEach((line, lno) => {

    const addMatch = (v, start) => {
      vars[v] ??= new Set();
      vars[v].add(lno);
      contexts[v] ??= [];
      contexts[v][lno] = trimContext(line, start);
    }

    const m = /^:: (.*)/.exec(line);
    if (m != null) {
      passage = m[1].replace(/ [\[{].*/, "");
    }
    passageMap[lno] = passage;

    // $varname
    for (const m of line.matchAll(/[$](\w+)/g)) {
      addMatch(m[1], m.index);
    }
    // v.varname
    for (const m of line.matchAll(/\bv[.](\w+)/g)) {
      addMatch(m[1], m.index);
    }
    // setup.name
    for (const m of line.matchAll(/\b(setup[.]\w+)/g)) {
      addMatch(m[1], m.index);
    }
  });

  const varnames = Object.keys(vars).sort();
  const counts = [];
  varnames.forEach((v) => (counts[v] = vars[v].size));

  const many = 5;

  for (let c = 1; c < many; ++c) {
    const subset = varnames.filter((v) => counts[v] === c);
    if (subset.length !== 0) {
      console.log(`=== count ${c} ===`);
      console.log("");
      list(subset);
      console.log("");
    }
  }

  console.log("=== count any ===");
  list(varnames);

  function list(subset) {
    for (const varname of subset) {
      console.log(varname);
      const lnos = Array.from(vars[varname]).sort((a, b) => b - a);
      for (const lno of lnos) {
        console.log(`    [[${passageMap[lno]}]] ${lno}: ${contexts[varname][lno]}`);
      }
    }
  }
}

const MAX_CONTEXT = 60;

function trimContext(line, pos) {
  line = line.trim();
  if (line.length > MAX_CONTEXT) {
    const left = Math.max(0, pos - MAX_CONTEXT / 2);
    line = line.slice(left, left + MAX_CONTEXT);
  }
  return line;
}

main(process.argv.slice(2));
