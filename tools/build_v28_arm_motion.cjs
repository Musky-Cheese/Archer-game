const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const source = path.join(root, 'prototypes', 'v2.6-hero-slice.html');
const oldWeapon = path.join(root, 'prototypes', 'v2.6-weapon.js');
const newWeapon = path.join(root, 'prototypes', 'v2.8-arm-motion.js');
const target = path.join(root, 'prototypes', 'v2.8-arm-motion.html');

const normalize = text => text.replace(/\r\n/g, '\n');
let html = normalize(fs.readFileSync(source, 'utf8'));
const old = normalize(fs.readFileSync(oldWeapon, 'utf8'));
const replacement = normalize(fs.readFileSync(newWeapon, 'utf8'));
const count = html.split(old).length - 1;
if (count !== 1) throw new Error(`Expected one V2.6 weapon block, found ${count}.`);

html = html.replace(old, replacement)
  .replace('Last Archer V2.6 — Nakamachi', 'Last Archer V2.8a — First-Person Arm Motion')
  .replace('LAST ARCHER / V2.6', 'LAST ARCHER / V2.8a')
  .replace('Local visual preview', 'First-person arm motion · local preview');
fs.writeFileSync(target, html, 'utf8');
console.log(target);
