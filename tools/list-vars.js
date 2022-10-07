#!/usr/bin/env node
/**
 * Usage: node list-vars.js $twFile [$varListTxt [$regexFilter]]
 *
 * Lists all vars and their usages in $twFile. Useful for spotting typos
 * and unused vars.
 *
 * If $varListTxt is non-empty, it's a file of expected var names,
 * one per line. Vars that are not in that file are flagged.
 *
 * If $regexFilter is non-empty, only vars that match that regex are shown.
 */

const fs = require("fs");

function usage() {
  console.log("Usage: node list-vars.js $twFile [$varListTxt [$regexFilter]]");
  process.exit(1);
}

function main(args) {
  if (args.length < 1 || 3 < args.length) usage();
  listVars(args[0], args[1], args[2]);
}

function listVars(twFile, varListTxt, regexFilter) {
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
    // assert-big-mood
    for (const m of line.matchAll(/assert-big-mood (\w+)/g)) {
      addMatch(m[1], m.index);
    };
    // TO[D]O-big-mood
    for (const m of line.matchAll(/TO[D]O-big-mood ([\w\s]+)/g)) {
      for (const m2 of m[1].matchAll(/\w+/g)) {
        addMatch(m2[0], m.index + m2.index);
      }
    }
  });

  let varnames = Object.keys(vars).sort();

  if (regexFilter != null && regexFilter !== '') {
    const regex = new RegExp(regexFilter);
    varnames = varnames.filter(v => regex.test(v));
  }

  const counts = [];
  varnames.forEach((v) => (counts[v] = vars[v].size));

  const unknown = new Set();
  if (varListTxt != null && varListTxt !== '') {
    const varList = fs.readFileSync(varListTxt, 'utf-8');
    const known = new Set();
    for (const m of varList.matchAll(/^\s*(\w+)/gm)) {
      known.add(m[1]);
    }
    for (const vn of varnames.filter(vn => !known.has(vn))) {
      unknown.add(vn);
    }
    if (unknown.size > 0) {
      console.log("unknown vars:");
      for (const vn of [...unknown].sort()) {
        console.log(`    ${vn}`);
      }
    }
  }

  list(varnames);

  function list(subset) {
    for (const vn of subset) {
      const lnos = Array.from(vars[vn]).sort((a, b) => b - a);
      if (unknown.has(vn)) {
        console.log(`${vn} \x1b[41m*** not known ***\x1b[0m`);
      } else if (lnos.length === 1) {
        console.log(`${vn} \x1b[41m*** used once ***\x1b[0m`);
      } else if (lnos.length === 2) {
        console.log(`${vn} \x1b[43m(used twice)\x1b[0m`);
      } else {
        console.log(vn);
      }
      for (const lno of lnos) {
        console.log(`    [[${passageMap[lno]}]] ${lno}: ${contexts[vn][lno]}`);
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
