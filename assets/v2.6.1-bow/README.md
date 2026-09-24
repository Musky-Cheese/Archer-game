# V2.6.1 reusable bow and arms

Each file is a self-contained GLB in metres, Y-up, with a base-centred pivot.
These are static ready-pose assets. The game animates the bow, string, nock and arm landmarks in `prototypes/v2.6.1-weapon.js`. No baked animation or skeleton is claimed.

| File | What it is | Dimensions (m) | Triangles | KiB |
|---|---|---|---:|---:|
| la-recurve-v261.glb | Carved laminated recurve, grip wrap and arrow shelf | 0.102 × 1.512 × 0.219 | 732 | 150.6 |
| la-grip-arm-v261.glb | Left glove, anatomical forearm and rolled sleeve | 0.714 × 0.751 × 0.558 | 1226 | 130.3 |
| la-draw-arm-v261.glb | Right three-finger draw glove, forearm and sleeve | 0.612 × 0.728 × 0.801 | 1148 | 122.0 |
| la-arrow-v261.glb | Shaft, broadhead, three feathers and split nock | 0.029 × 0.029 × 0.907 | 82 | 76.0 |

`sourceOffset` in the JSON manifest restores each asset’s runtime placement. The string is a dynamic line in the game and is not baked into the bow GLB. The two arm assets use character-scale budgets (under 1,500 triangles each); the bow stays below 800 triangles.
One 256 × 256 colour-grain image is embedded where needed; no normal or roughness maps.
Preview PNGs show each GLB loaded independently in Three.js.
