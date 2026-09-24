const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const source = path.join(root, 'prototypes', 'v2.6-hero-slice.html');
const oldWeapon = path.join(root, 'prototypes', 'v2.6-weapon.js');
const replacement = path.join(root, 'prototypes', 'v2.8b-arm-visual.js');
const target = path.join(root, 'prototypes', 'v2.8b-arm-visual.html');
const normalize = text => text.replace(/\r\n/g, '\n');

let html = normalize(fs.readFileSync(source, 'utf8'));
const old = normalize(fs.readFileSync(oldWeapon, 'utf8'));
const next = normalize(fs.readFileSync(replacement, 'utf8'));
const count = html.split(old).length - 1;
if (count !== 1) throw new Error(`Expected one V2.6 weapon block, found ${count}.`);

html = html.replace(old, next)
  .replace('Last Archer V2.6 — Nakamachi', 'Last Archer V2.8b — Animated Arms')
  .replace('LAST ARCHER / V2.6', 'LAST ARCHER / V2.8b')
  .replace('Local visual preview', 'Layered gloves and animated arms · local preview');
fs.writeFileSync(target, html, 'utf8');
console.log(target);
