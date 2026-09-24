const fs = require('fs');
const path = require('path');

const file = path.resolve(__dirname, '..', 'prototypes', 'v2.8b-arm-visual.html');
const html = fs.readFileSync(file, 'utf8');
const scripts = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)]
  .map(match => match[1])
  .filter(source => source.trim());
const required = [
  'Last Archer V2.8b — Animated Arms', 'heroWeapon.leftSegments',
  'supportWrist', 'function resetGame', 'function releaseShot', 'window.LastArcherV26'
];
for (const token of required) if (!html.includes(token)) throw new Error(`Missing expected token: ${token}`);
for (const [index, source] of scripts.entries()) {
  try { new Function(source); }
  catch (error) { throw new Error(`Inline script ${index + 1} has a syntax error: ${error.message}`); }
}
console.log(`V2.8b preview structure and ${scripts.length} inline script block(s) validated.`);
