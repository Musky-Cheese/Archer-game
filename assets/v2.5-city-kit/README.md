# V2.5 dark anime city kit

Stage 8 contains eleven separate GLBs, including two building modules, a skinned shambler with five clips, a recurve bow and two hands. The remaining city props come from the initial kit. See `manifest.md` for dimensions, triangle counts and sizes. Units are metres; up is +Y.

The GLBs are directly reusable in Three.js and Blender. For the current editable scene, open `import-stage8-assets.py` in Blender's Scripting workspace and run it. It imports the exact exported meshes, rig, colours and clips into a new collection and saves a new `.blend` beside the assets. It leaves existing scene objects intact. This recipe has been syntax-checked but could not be run here: the Windows Store Blender executable returned Access Denied even when launched outside the sandbox.

`last-archer-v2.5-city-kit-source.blend` is the **legacy copied starter**, not an authored Stage 8 scene. Likewise `blender-build-v2.5-city-kit.py` is the historical Stage 3 recipe, not the current geometry. Do not use either as evidence that the Stage 8 Blender scene has been verified.

Rebuild from the repository root using Python: run `tools/build_v25_city_kit.py`, then `tools/refine_v25_assets.py`, then `tools/build_v25_city_block.py`. The second step writes the refined GLBs; the third embeds them into the standalone review page. No Python packages or network access are needed.
