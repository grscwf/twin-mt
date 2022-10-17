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
    const m = /^:: ((n\d+)\w*(\/\w)?) /.exec(part);
    if (m == null) return;
    const wc = wordCount(split[i + 1]);
    addTo(`section ${m[2]}`, wc);
    addTo(`section ${m[2]}${m[3]}`, wc);
    addTo("total", wc);
    addTo(`total ${m[3]}`, wc);
  });

  for (const counter of Object.keys(passages).sort()) {
    const p = String(passages[counter]).padStart(4);
    const w = String(words[counter]).padStart(6);
    console.log(`${p} ${w} ${counter}`);
  }

  // one-line summary
  let sum = `nero stats ${timestamp} UTC - `;
  sum += `${words["total /F"] || 0} (${passages["total /F"] || 0}) /F`;
  sum += ` - ${words["total /D"] || 0} (${passages["total /D"] || 0}) /D`;
  sum += ` - ${words["total /P"] || 0} (${passages["total /P"] || 0}) /P`;
  sum += ` - ${words["total /S"] || 0} (${passages["total /S"] || 0}) /S`;
  console.log(sum);
}

function wordCount(s) {
  if (s == null) return 0;
  const words = Array.from(s.matchAll(/\w+/g));
  return words.length;
}

main(process.argv.slice(2));