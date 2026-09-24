const fs = require('fs');
const path = require('path');
const file = path.resolve(__dirname, '..', 'prototypes', 'v2.9-hero-refinement.html');
const html = fs.readFileSync(file, 'utf8');
const required = [
  'Last Archer V2.9 — Hero Refinement', 'V29_SHARP_STREET_DETAILS',
  'V29_LAYERED_JACKET', 'V29_SUBTLE_EYES', 'heroWeapon.leftSegments',
  'function resetGame', 'function releaseShot', 'window.LastArcherV26'
];
for (const token of required) if (!html.includes(token)) throw new Error(`Missing expected token: ${token}`);
const scripts = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)]
  .map(match => match[1]).filter(source => source.trim());
for (const [index, source] of scripts.entries()) {
  try { new Function(source); }
  catch (error) { throw new Error(`Inline script ${index + 1} has a syntax error: ${error.message}`); }
}
console.log(`V2.9 preview structure and ${scripts.length} inline script block(s) validated.`);
