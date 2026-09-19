# Last Archer Portable Environment Kit

This kit contains nine independent, game-ready GLB files plus the editable Blender source. Each GLB can be copied into another Three.js, Unity, Godot, or Blender project without bringing the rest of the kit with it.

## Folders

- `individual-assets/` — one binary `.glb` per asset
- `previews/` — one PNG preview per asset
- `manifest.md` and `manifest.json` — dimensions, triangle counts, and file sizes
- `last-archer-environment-kit.blend` — editable Blender master scene

## Three.js example

```js
const loader = new THREE.GLTFLoader();

loader.load('individual-assets/la-vendingmachine.glb', (gltf) => {
  const vendingMachine = gltf.scene;
  vendingMachine.position.set(0, 0, 0); // base-center pivot sits on the ground
  scene.add(vendingMachine);
});
```

The exported files use meters, glTF Y-up coordinates, flat-shaded geometry, simple material colors, and no external textures. Materials whose names begin with `AD_SURFACE_` identify sponsor-ready panels that can be recolored, hidden, or covered with a dynamic Three.js canvas texture.
