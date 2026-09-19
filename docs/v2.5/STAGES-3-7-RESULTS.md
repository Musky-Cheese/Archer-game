# V2.5 stages 3–7 review

This branch is a local art-and-gameplay prototype. It does not change the
published V2.3.1 page or `index.html`.

## Stage 3 — modular anime city kit

`assets/v2.5-city-kit/` holds each reusable object as its own binary GLB:
facades, alley wall, sidewalk, road tile, streetlight, dumpster, shambler and
recurve bow. They use base-centre pivots, metre units, flat materials and no
texture files. The full manifest is in
[`manifest.md`](../../assets/v2.5-city-kit/manifest.md).

The companion Blender source starter and rebuild recipe are also in that
directory. The portable builder is deterministic, which made it possible to
create and test the kit on this machine while Blender was unavailable.

## Stage 4 — zombie direction

`la-zombie-shambler-anime.glb` is a toxic-green, faceted 1.99 m shambler with
a high-contrast face and readable dangling-arm silhouette. The city preview
spawns three instances and gives them a low-cost idle sway. The next production
pass can replace that sway with an authored Blender armature and walk clip
without changing level placement.

## Stage 5 — first-person bow

`la-bow-recurve-pov.glb` is a small recurve bow built for a camera rig. The
review scene follows the camera with it and includes a 3D arrow plus moving
string: holding fire draws the nock toward the player and releasing uses the
existing projectile direction. The old painted canvas bow is removed from this
preview.

## Stage 6 — playable city assembly and ads

[`v2.5-anime-city-block.html`](../../prototypes/v2.5-anime-city-block.html)
is a self-contained 32 × 32 m playable intersection. It keeps keyboard move,
aim, charge and arrow firing while adding solid city collisions, street props,
the city kit, a dark cel-lit palette and the existing replaceable `AD_SLOTS`
configuration.

The visible signs use `BILLBOARD_01`, `BILLBOARD_02`, `ROAD_SIGN_01`,
`WALL_AD_01`, `CRATE_SPONSOR`, `BARRICADE_SPONSOR` and `VENDING_01`. Their
creative remains editable through `LastArcherAds.update(slotId, patch)`.

## Stage 7 — portability and checks

The city-block file embeds its nine small GLBs only so it works when opened
directly from the filesystem. The actual individual files remain beside it for
future Three.js, Blender or other-engine use. The runtime test verifies all
placed GLBs load, collision surfaces exist, three shamblers are present, the
camera-following bow is present and the renderer draws triangles.

Run locally from the repo root:

```powershell
& C:\Users\fouad\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe Archer-game\tools\build_v25_city_kit.py
& C:\Users\fouad\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe Archer-game\tools\build_v25_city_block.py
$env:NODE_PATH='C:\Users\fouad\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\node_modules'
& C:\Users\fouad\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe Archer-game\tools\test_v25_city_block.cjs
```

The automated review run reported 25/25 placed assets loaded, zero failures,
26 collision surfaces and a rendered scene. The preview image is
[`city-block-preview.png`](city-block-preview.png).
