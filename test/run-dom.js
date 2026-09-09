/**
 * Runs test/dom.html in headless Chrome and reports the results.
 *
 * The DOM half of the extension cannot be exercised in plain node, and pulling
 * in a headless-browser dependency for it would be heavier than the extension
 * itself. Chrome is already on the machine of anyone developing a Chrome
 * extension, so this shells out to it and reads the results out of the page.
 *
 * Usage: npm run test:dom   (set CHROME_PATH to point at a specific binary)
 */
'use strict';

const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const CANDIDATES = [
  process.env.CHROME_PATH,
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser'
].filter(Boolean);

const chrome = CANDIDATES.filter(function (candidate) {
  try { return fs.statSync(candidate).isFile(); } catch (err) { return false; }
})[0];

if (!chrome) {
  console.log('\n  skipped: no Chrome found. Set CHROME_PATH to run the DOM tests.\n');
  process.exit(0);
}

const page = 'file://' + path.join(__dirname, 'dom.html');
const dom = execFileSync(chrome, [
  '--headless=new', '--disable-gpu', '--no-sandbox',
  '--virtual-time-budget=4000', '--dump-dom', page
], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], maxBuffer: 32 * 1024 * 1024 });

const match = dom.match(/<pre id="results">([\s\S]*?)<\/pre>/);
if (!match) {
  console.error('\n  could not read the results out of the page -- did a script throw?\n');
  process.exit(1);
}

const text = match[1]
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  .replace(/&quot;/g, '"').replace(/&#39;/g, "'")
  .replace(/&amp;/g, '&')
  .trim();

if (!text) {
  console.error('\n  the page ran no tests -- a script probably threw before finishing.\n');
  process.exit(1);
}

const lines = text.split('\n');
const failures = lines.filter(function (line) { return line.indexOf('FAIL') === 0; });

console.log('');
failures.forEach(function (line) { console.log('  ' + line); });
if (failures.length) {
  console.log('\n  ' + (lines.length - failures.length) + ' passed, ' + failures.length + ' failed (DOM)\n');
  process.exit(1);
}
console.log('  ' + lines.length + ' passed (DOM, in Chrome)\n');
