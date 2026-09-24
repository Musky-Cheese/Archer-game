# V2.6 portable character

| File | Description | Approximate dimensions |
|---|---|---|
| la-shambler-v26.glb | Layered worker shambler, subtle glowing eyes, skinned rig; Idle, Walk, Attack, Death clips | 0.83 × 1.807 × 0.426 m |

Y up, metres, origin at base centre in the bind pose. 1,256 triangles, 240 KiB,
two vertex-colour materials, no external textures. The Death clip includes
root translation; do not apply separate downward motion during playback.

Source: `tools/build_v26_character.py`. Close-up gameplay preview:
`docs/v2.6/hero-enemy.png`. Dimensions/bytes are also in `manifest.json`.

The new bow/arms and world are currently code-authored geometry, not GLB exports.
The previous portable environment modules remain in `assets/reference-corner`.
