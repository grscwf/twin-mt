#!/usr/bin/env node

const fs = require("fs");
const os = require("os");
const path = require("path");


function main(args) {
  const [src, dest] = args;

  const tw = fs.readFileSync(src, "utf8");
  fs.mkdirSync(dest, { recursive: true });

  const passages = tw.split(/^(?=:: )/m);
  passages.forEach(passage => {
    const m = /^:: ([^{\[\r\n]+)/.exec(passage);
    if (m == null) {
      console.error({ passage });
      throw new Error("Unparseable passage");
    }
    const title = m[1].trim();
    const fname = path.join(dest, fixTitle(title));
    fs.writeFileSync(fname, passage, { encoding: "utf8", flag: "w" });
  });
}

function fixTitle(title) {
  return title.replaceAll('/', '-');
}

main(process.argv.slice(2));
