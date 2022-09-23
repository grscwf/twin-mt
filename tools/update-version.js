#!/usr/bin/env node
/**
 * Usage: node update-version.js $file
 *
 * Updates story-version in .tw or .html file.
 */

const fs = require("fs");

function usage() {
  fail("Usage: node update-version.js $file ...");
}

function fail(msg) {
  console.error(msg);
  process.exit(1);
}

function main(args) {
  if (args.length === 0) usage();
  args.forEach(updateVersion);
}

const pattern =
  /(div id=(?:"|&quot;)story-version(?:"|&quot;)(?:>|&gt;)\s*)(v[\d.]+)/s;

function updateVersion(file) {
  const text = fs.readFileSync(file, "utf-8");
  const m = pattern.exec(text);
  if (m == null) fail(`story-version not found in ${file}`);

  const matchStart = m.index + m[1].length;
  const matchEnd = m.index + m[0].length;
  const version = m[2];
  const newVersion = genVersion(version);
  console.log(`Changing version from ${version} to ${newVersion} in ${file}`);

  const newText = text.slice(0, matchStart) + newVersion + text.slice(matchEnd);
  fs.writeFileSync(file, newText, "utf-8");
}

function genVersion(oldVersion) {
  const parts = oldVersion.split(/[.]/);
  const today = getToday();
  if (today === parts[1]) {
    parts[2] = String(1 + parseInt(parts[2], 10));
  }
  parts[1] = today;
  return parts.join(".");
}

function getToday() {
  const d = new Date().toISOString();
  return d.replace(/T.*/, '').replace(/-/g, '');
}

main(process.argv.slice(2));
