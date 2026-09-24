# V2.6 — single street review checkpoint

Open `prototypes/v2.6-hero-slice.html`. Compare actual captures in
`docs/v2.6/comparison.html` with the approved concept. No deployment or push.

## What changed

The V2.5 playable integration had lost visible windows, balconies, cables,
fire escapes, original lighting and the foreground weapon. Base-centred GLB
shells were placed as if they still used the source scene's front-centred
origins. The opposing shell also faced away from the camera. V2.6 reuses the
intact source-world construction, preserving its coordinates and details.

The new layer adds procedural 256 px plaster, brick, asphalt and stain paint;
deep window reveals; service boxes, awnings and notices; drains and a manhole;
and a masked planar reflection of the actual scene. No concept pixels are
used in the game. Street geometry remains batched by material. Two shadowed
warm streetlights, cool sky fill and restrained fog carry the lighting.

The new shambler is a separate GLB, 1.807 m tall, 1,256 triangles, approximately
240 KiB. Layered collar/lapels, cuffs, pockets, fingers and emissive eyes are
part of the asset. Idle, Walk, Attack and Death are embedded clips. Death
articulates the limbs and moves the hips down over 1.12 seconds; bodies remain
briefly before being cleaned up. The existing contact-damage rule is retained;
the Attack clip is available in the asset but not used for a new attack mechanic.

The foreground bow and arms are newly authored procedural geometry. The glove,
wrist, elbow and sleeve form connected limbs. A shared nock landmark drives
the arrow, string and draw hand, with limb flex and release follow-through.
The game’s original ballistic aiming and projectile damage remain in use.
These foreground pieces currently live in `prototypes/v2.6-weapon.js`; unlike
the shambler, they are not separate exported GLB files.

Street gates and pickup locations are fitted to this slice. Old enemy steering
clamps no longer snap distant spawns into the old square arena. Boundary
barricades limit the playable street. This is one slice, not a map expansion.

## Verified

`tools/review_v26.cjs` passed with no browser errors. It exercises keyboard
movement; an actual movement attempt into a storefront; arrow hits at three
distances; a wall-occluded shot; nine projectile kills advancing the wave;
walking into a pickup; unobstructed placement of all eight pickups; a distant
enemy approaching without snapping; enemy contact damage; game over and restart;
pause; touch draw cancellation; stable geometry/texture counts during repeated
draw/release; and portrait layout. The exported death pose was evaluated on
the skinned vertices: Y bounds approximately 0.009–0.473 m, above ground.

Actual Chrome captures are `hero-gameplay.png`, `hero-wide.png`,
`hero-corner.png`, `hero-mart.png`, `hero-enemy.png`, `hero-draw.png`,
`hero-death.png` and `hero-phone.png`. `test-results.json` stores the checks.
The comparison page displays the concept next to the actual wide capture.

The initial three-enemy frame recorded about 654 draw calls and 207k submitted
triangles, including reflection and shadow passes. This is not a mobile
performance guarantee. A real phone and a long crowded-wave soak remain untested.

## Remaining visual gap / recommended next task

This is a clearer, richer low-poly street, not a match for the concept's finished
anime illustration. The close-up hands and face remain simplified, clothing
lacks painted fold depth, the car is relatively undamaged and the storefronts
repeat. The billboard portrait is schematic. The next visual task should be
one artist-quality shambler and one bow/hand asset, judged in this exact street
and lighting before expanding the world. Keep any performance pass separate
from that art review. Do not claim the concept target is achieved.

## Rebuild and boundaries

Run `python tools/build_v26_character.py`, then `python tools/build_v26_hero.py`.
Run `node tools/review_v26.cjs` with Playwright available in NODE_PATH.
The builder consumes V2.5 source as a reusable foundation and writes only V2.6
outputs. Production `index.html`, approved reference corner, prior playable
corner and all older assets remain untouched. No commit, push or deploy was
performed for this checkpoint.
