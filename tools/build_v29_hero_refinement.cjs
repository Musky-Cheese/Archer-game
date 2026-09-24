const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const normalize = text => text.replace(/\r\n/g, '\n');
const source = path.join(root, 'prototypes', 'v2.6-hero-slice.html');
const oldWeapon = path.join(root, 'prototypes', 'v2.6-weapon.js');
const foreground = path.join(root, 'prototypes', 'v2.9-hero-foreground.js');
const refinement = path.join(root, 'prototypes', 'v2.9-world-refinement.js');
const target = path.join(root, 'prototypes', 'v2.9-hero-refinement.html');

let html = normalize(fs.readFileSync(source, 'utf8'));
const old = normalize(fs.readFileSync(oldWeapon, 'utf8'));
const weapon = normalize(fs.readFileSync(foreground, 'utf8'));
const world = normalize(fs.readFileSync(refinement, 'utf8'));
if (html.split(old).length - 1 !== 1) throw new Error('Expected exactly one V2.6 weapon block.');
if (html.split('  installHeroSlice();').length - 1 !== 1) throw new Error('Hero installation marker changed.');

html = html.replace(old, weapon)
  .replace('Last Archer V2.6 — Nakamachi', 'Last Archer V2.9 — Hero Refinement')
  .replace('LAST ARCHER / V2.6', 'LAST ARCHER / V2.9')
  .replace('Local visual preview', 'Sharp-detail hero slice · local preview')
  .replace('  installHeroSlice();', `${world}\n\n  installHeroSlice();`);
fs.writeFileSync(target, html, 'utf8');
console.log(target);
