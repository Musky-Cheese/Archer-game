# Playable reference corner — local review

Open `prototypes/v2.5-corner-playable.html`. This is a separate, self-contained
preview; the approved art study, prior gameplay preview and production
`index.html` are unchanged.

## Integrated systems

- The approved corner composition supplies the street, shuttered mart, sidewalks,
  lamps, sedan, dumpster, vending machine, billboard, cover and dark lighting.
- Existing V2.5 movement, measured wall/prop collision, first-person bow,
  projectile sweeps, enemy contact damage, waves, score, pickup buffs, pause,
  game-over and restart are active.
- The corner shambler GLB replaces the old district display actor for gameplay.
  It supplies Idle and Walk animation. Defeated zombies fall over procedurally;
  a dedicated death animation is a later character-art task.
- The portable corner props and legacy bow/hands are embedded so this page runs
  offline as a single local HTML file. Sponsor slots remain available through
  `LastArcherAds.update`.

## Validation

`node tools/test_v25_corner_playable.cjs` passed in Chrome with no page or
console errors. It checks asset load, movement, near/medium/far arrow hits,
pickups, enemy damage, actual game-over, restart, touch cancellation, stable
weapon resources and portrait layout. It captured actual browser renders:
`corner-playable-hero.png`, `corner-playable-mart.png`,
`corner-playable-street.png` and `corner-playable-phone.png`.

The final test snapshot reported 14 embedded assets, 34 scene placements,
23 collision solids, 299 draw calls and 10,510 rendered triangles in headless
Chrome. That is a useful integration check, not a phone performance claim.

## Remaining visual work

The arena carries the approved street's architecture and lighting, but this is
an integration pass rather than a further art redesign. The bow uses the working
gameplay implementation and still needs the more natural arm/hand presentation
from the art study. The corner also needs a dedicated zombie death animation,
more building variation and device performance testing before any release call.

No GitHub push, deployment, merge or production-file change was made.
