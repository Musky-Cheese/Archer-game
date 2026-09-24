# Blender source checkpoint

The editable Blender scene is generated from the four shipped V2.6.1 GLBs so
the browser-facing files stay the source for runtime placement and validation.

In Blender, open the **Scripting** workspace, choose **Open**, and select:

`Archer-game/tools/create_v261_bow_blend.py`

Click **Run Script**. The script writes these local-only files beside this
document:

- `last-archer-v261-bow-source.blend` — editable source scene
- `blender-roundtrip/la-recurve-v261-roundtrip.glb` — one export proof

The source scene has one collection for each asset. Keep the object origin at
base-centre, use metres/Y-up, keep flat shading, and stay within the triangle
budget recorded in `manifest.json`. The round-trip export is deliberately only
the bow: it proves the pipeline before we invest time refining the arms.
