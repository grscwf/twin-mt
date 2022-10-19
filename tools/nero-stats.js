#!/usr/bin/env node

const fs = require("fs");

function usage() {
  console.error("usage: nero-size.js $twFile")
}

function main(args) {
  if (args.length !== 1) usage();
  const fname = args[0];
  const twText = fs.readFileSync(fname, "utf-8");
  const mtime = fs.statSync(fname).mtime;
  const timestamp = mtime.toISOString()
    .replace(/T/, ' ').replace(/\..*/, '');

  const passages = {};
  const words = {};

  const addTo = (counter, wc) => {
    passages[counter] = 1 + (passages[counter] || 0);
    words[counter] = wc + (words[counter] || 0);
  };

  const split = twText.split(/^(:: .*)$/m);
  split.forEach((part, i) => {
    const m = /^:: ((n\d+)\w*\/(\w)?) /.exec(part);
    if (m == null) return;
    const wc = wordCount(split[i + 1]);
    addTo(`section ${m[2]}`, wc);
    addTo(`section ${m[2]}/${m[3]}`, wc);
    addTo("total", wc);
    addTo(`total /${m[3]}`, wc);
    if (/^[FDP]$/.test(m[3])) {
      addTo(`total /FDP`, wc);
    }
  });

  for (const counter of Object.keys(passages).sort()) {
    const p = String(passages[counter]).padStart(4);
    const w = String(words[counter]).padStart(6);
    console.log(`${p} ${w} ${counter}`);
  }

  // one-line summary
  const all = passages["total /FDP"];
  const pctF = Math.floor(100 * passages["total /F"] / all);
  const pctD = Math.floor(100 * passages["total /D"] / all);
  const pctP = Math.floor(100 * passages["total /P"] / all);
  let sum = `nero#`;
  sum += ` ${words["total /FDP"] || 0}-${passages["total /FDP"] || 0}/FDP`;
  sum += ` : ${words["total /F"] || 0}-${passages["total /F"] || 0}/F`;
  sum += ` ${pctF}%`;
  sum += ` : ${words["total /D"] || 0}-${passages["total /D"] || 0}/D`;
  sum += ` ${pctD}%`;
  sum += ` : ${words["total /P"] || 0}-${passages["total /P"] || 0}/P`;
  sum += ` ${pctP}%`;
  sum += ` : ${words["total /S"] || 0}-${passages["total /S"] || 0}/S`;
  sum += ` : ${timestamp} UTC`;
  console.log(sum);
}

function wordCount(s) {
  if (s == null) return 0;
  const words = Array.from(s.matchAll(/\w+/g));
  return words.length;
}

main(process.argv.slice(2));