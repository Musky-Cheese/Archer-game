# Stage 8 — review and corrective polish

Local review candidate, 19 September 2026. No release, merge or deployment.

## What the review found

The previous report overstated completion. The three new shamblers were static
display objects, while gameplay still spawned sprites. Facades faced away from
the playable street. The bow used depth-disabled world geometry and was poorly
framed. Removed environment objects still left old pickups and platform logic.
The renderer used a colour-space property unavailable in Three.js r134. Tests
asserted loading and object counts rather than shooting or gameplay behaviour.

## Changes

- Replaced the two facades with solid three/four-storey modules, street-facing
  windows and consistent floor heights. Built connected street walls, sidewalks,
  two crossings, utility details, cover, a sedan and supported sponsor signs.
- Used the r134 output-encoding API and consistent sRGB-to-linear conversion.
  The static environment is batched into one vertex-colour cel-shaded mesh.
  Contact shadows are instanced; warm accents remain restrained against the
  dark sky and cool roads. Bloom stays off.
- Replaced display zombies and combat sprites with the same skinned shambler.
  The 788-triangle actor has an angular jaw, hair, jacket, belt and eleven-bone
  rig. Its GLB contains Idle, Walk, Attack, Hit and Death. Runtime uses Idle,
  Walk and Death; attack damage keeps the original immediate-contact behaviour.
  Runners retain their speed/tuning and use a slimmer scaled version of this
  rig; a separately authored runner is future work.
- Built the recurve bow, separate grip/draw hands, string and forward-pointing
  arrow in a dedicated foreground pass with normal depth testing between parts.
  Drawing moves the hand/nock, flexes limbs and updates the existing string
  buffer. Release hides the arrow briefly and adds small recovery motion.
  Foreground framing adapts to portrait screens.
- Replaced circular approximation colliders with measured rectangles. Movement
  and projectiles use those same solids. Grounding explicitly derives from
  minimum world Y, so map Z can never silently become height.
- Restored eight visible functional buff pickups, removed ghost platform logic,
  kept baseline wave timing/rewards/upgrades and isolated the review save keys.
  Skeleton resources are released on hits, contact damage and restart.

## Intentional gameplay changes

The 32 m district uses valid spawn approaches instead of the large arena's
26–40 m spawn radius. Enemy speeds and spawn timers are retained.

Arrows now sweep through the segment travelled each update, so a nearby wall
wins before an enemy behind it. They start from a camera-relative bow release
point and aim towards the reticle target with gravity compensation. Launch
speed, gravity and charge range retain baseline values. Headshots were not added.

Touch cancellation clears the draw without firing. Input pause/restart also
clears the draw. These are functional corrections, not just art changes.

## Validation

`tools/review_v25.cjs` checks asset loading, grounding, actual animated combat
actors, keyboard movement, pause, aimed hits at 3/8/16 m, cover occlusion,
pickups, touch release/cancellation, pause while drawing, restart, save writing,
ad replacement, geometry/texture stability during 160 draw updates and a
40-actor sample. It also captures 1440 × 900 desktop, 390 × 844 portrait and
844 × 390 landscape views. No shader or runtime errors were observed.

Results: `stage8-test-results.json`. All eleven separate GLBs also load in the
independent asset renderer; their images are in `assets/v2.5-city-kit/previews`.

| Sample | Total draw calls, both passes | Triangles |
|---|---:|---:|
| Intersection, 3 rigged actors | 37 | 9,186 |
| Stress sample, 40 rigged actors | 74 | 38,786 |

160 draw updates left geometry and texture counts unchanged. Restart releases
actor bone textures. These are headless desktop Chrome checks, not phone FPS
measurements or proof of a game's maximum possible population.

## Files and remaining checks

Review `prototypes/v2.5-anime-city-block.html`: use the view selector before
entering, then WASD/arrow keys or touch controls; hold and release Fire.
`stage8-intersection.png`, `stage8-alley.png`, `stage8-close.png`,
`stage8-drawing.png`, `stage8-portrait.png`, and `stage8-landscape.png` document
the review. The self-contained page is about 1.23 MiB. The largest individual
GLB is the shambler, about 146 KiB; no photorealistic texture maps are used.

The prior `.blend` file is a copied legacy starter, not an authored V2.5 source.
`import-stage8-assets.py` imports the exact exported GLBs and saves a new editable
Blender copy without deleting existing scene objects. Its syntax is checked,
but execution remains unverified: Windows denied launching the Store Blender
executable even outside the sandbox. Independent GLB loading/rendering passed.

User visual approval, hands-on phone gameplay/performance and verification of
the Blender import remain release checks. The art is deliberately a lightweight
low-poly interpretation, not a reproduction of the detailed concept painting.
