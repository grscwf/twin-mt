#!/usr/bin/env node

const fs = require("fs");

function usage(msg) {
  if (msg != null) console.log(`Error: ${msg}`);
  console.log("Usage: node sort-tw.js fname");
  process.exit(1);
}


function main(fname) {
  if (fname == null) usage("missing fname arg");
  const src = fs.readFileSync(fname, "utf-8");
  const passages = src.split(/^::/mg).slice(1).map(p => "::" + p);

  const sections = {
    story0: [],
    story1: [],
    init0: [],
    init1: [],
    initDrekkar: [],
    initNero: [],
    start: [],
    other: [],
    nero: [],
  };
  for (const p of passages) {
    if (/^:: Story /.test(p)) {
      sections.story1.push(p);
    } else if (/^:: Story/.test(p)) {
      sections.story0.push(p);
    } else if (/^:: Init 0/.test(p)) {
      sections.init0.push(p);
    } else if (/^:: Init Drekkar/.test(p)) {
      sections.initDrekkar.push(p);
    } else if (/^:: Init Nero/.test(p)) {
      sections.initNero.push(p);
    } else if (/^:: Init /.test(p)) {
      sections.init1.push(p);
    } else if (/^:: n[0-9]/.test(p)) {
      sections.nero.push(p);
    } else if (/^:: (Title Screen|Bound |Credits|Choose Character|Content Warning|Passage Notes|Archives)/.test(p)) {
      sections.start.push(p);
    } else {
      sections.other.push(p);
    }
  }

  sections.init0.sort();
  sections.init1.sort();
  sections.initDrekkar.sort();
  sections.initNero.sort();

  // sort nero
  const keyed = sections.nero.map(p => {
    const m = /^:: (n\d+[^/]*)/.exec(p);
    if (m == null) throw new Error(`failed to match nero: ${p}`);
    return [m[1], p];
  });
  keyed.sort((a, b) => a[0] < b[0] ? -1 : a[0] > b[0] ? +1 : 0);
  sections.nero = keyed.map(p => p[1]);

  Object.values(sections).forEach(passages => {
    passages.forEach(p => process.stdout.write(p));
  });
}

main(process.argv[2]);