# Last Archer — Godot handoff

## Open this first

Open `godot/project.godot` with Godot 4.3 or newer. The project has already been imported and run successfully with Godot 4.7.2.

## Current contents

- `godot/scenes/Main.tscn` — dark first-person starter scene.
- `godot/scripts/main.gd` — WASD movement and mouse look.
- `godot/scripts/weapon_preview.gd` — recurve bow and arrow foreground preview.
- `godot/scripts/environment_preview.gd` — places a billboard, vending machine, streetlight, barricade, supply crate, and car.
- `godot/assets/bow/` — bow and arrow GLBs.
- `godot/assets/environment/` — nine reusable city props as individual GLB files.

## Visual direction

The target is a dark, realistic-anime city street: crisp low-poly forms, layered storefronts, cool blue shadows, restricted warm lamps, wet pavement, and restrained fog. Use the browser reference build at `prototypes/v2.9-hero-refinement.html` and the bow notes at `assets/v2.8-bow/ART_DIRECTION.md` as visual reference only.

## Existing browser game

`index.html` remains the published Three.js game. Do not replace it while the Godot version is under construction. Browser prototypes in `prototypes/` preserve the gameplay and visual experiments that should be ported deliberately.

## Recommended next task

Port the player loop into Godot in this order:

1. CharacterBody3D collision and camera movement.
2. First-person bow draw, release, projectile, and hit detection.
3. One shambler with walk, attack, damage, death, and restart.
4. Waves, pickups, HUD, then expand the single street slice.

Keep assets as separate GLBs and preserve the attribution in `CREDITS.md` for the CC BY bow source.
