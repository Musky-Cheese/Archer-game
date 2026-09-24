const fs = require('fs');
const path = require('path');

const file = path.resolve(__dirname, '..', 'prototypes', 'v2.8-arm-motion.html');
const html = fs.readFileSync(file, 'utf8');
const scripts = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)]
  .map(match => match[1])
  .filter(source => source.trim());

if (!html.includes('Last Archer V2.8a — First-Person Arm Motion')) throw new Error('Wrong preview title.');
if (!html.includes('heroWeapon.motion.walk')) throw new Error('Arm-motion code was not embedded.');
if (!html.includes('First-person arm motion · local preview')) throw new Error('Preview label was not embedded.');

for (const [index, source] of scripts.entries()) {
  try { new Function(source); }
  catch (error) { throw new Error(`Inline script ${index + 1} has a syntax error: ${error.message}`); }
}
console.log(`V2.8a preview structure and ${scripts.length} inline script block(s) validated.`);
