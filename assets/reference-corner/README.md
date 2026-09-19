# Last Archer — reference corner modules

Eleven separate GLBs from the local street-corner art study. All use metres,
Y-up and a base-centred origin. Import each file through Blender's glTF import
or Three.js GLTFLoader. Geometry, colours and any small PNGs are embedded.

`manifest.md` lists dimensions, triangle counts and sizes. `previews/` contains
renders of the actual exports. The shambler has a skeleton and in-place Idle
and Walk clips. No third-party textures are included.

The mart shell deliberately excludes windows, balconies and air conditioners:
those are separate reusable modules so each environment file stays under 800
triangles. Place copies of the modules onto the shell. Building fronts face +Z;
the character faces -Z. `sourceOffset` in the JSON manifest records the shift
applied to centre an exported module relative to its original local coordinates.

Lighting, fog, cables and pavement dressing belong to the browser study; the
GLBs do not bake the scene's lighting. The existing bow and the preview's
procedural hands are not part of this eleven-module package.

The GLBs were loaded and rendered in Three.js. They have not been inspected in
the Blender application. This is an art-review kit, not a finished city pack.

Source in the repository: `tools/build_corner_character.py`,
`prototypes/reference-corner.js`, and `tools/export_corner_modules.cjs`.
