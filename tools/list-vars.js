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
  let passage = "-";
  lines.forEach((line, lno) => {
    const m = /^:: (.*)/.exec(line);
    if (m != null) {
      passage = m[1].replace(/ [\[{].*/, "");
    }
    passageMap[lno] = passage;

    // $varname
    for (const m of line.matchAll(/[$](\w+)/g)) {
      vars[m[1]] ??= new Set();
      vars[m[1]].add(lno);
    }
    // v.varname
    for (const m of line.matchAll(/\bv[.](\w+)/g)) {
      vars[m[1]] ??= new Set();
      vars[m[1]].add(lno);
    }
    // setup.name
    for (const m of line.matchAll(/\b(setup[.]\w+)/g)) {
      vars[m[1]] ??= new Set();
      vars[m[1]].add(lno);
    }
  });

  const varnames = Object.keys(vars).sort();
  const counts = [];
  varnames.forEach((v) => (counts[v] = vars[v].size));

  const many = 5;

  for (let c = 1; c < many; ++ c) {
    const subset = varnames.filter(v => counts[v] === c);
    if (subset.length !== 0) {
      console.log(`=== count ${c} ===`);
      console.log('');
      list(subset);
      console.log("");
    }
  }

  console.log(`=== count >= ${many} ===`);
  list(varnames.filter((v) => counts[v] >= many));

  function list(subset) {
    for (const varname of subset) {
      console.log(varname);
      const lnos = Array.from(vars[varname]).sort((a, b) => b - a);
      for (const lno of lnos) {
        // XXX group by passage name
        // XXX trim line context to < 80 chars
        console.log(`   ${passageMap[lno]}:${lno}: ${lines[lno]}`);
      }
    }
  }
}

main(process.argv.slice(2));
