# Last Archer — Godot handoff

Open `godot/project.godot` with Godot 4.7 or newer. Press F5 to play `godot/scenes/NightDistrict.tscn`.

The playable survival scene has first-person movement, bow draw and release, arrows with gravity and collision, animated shamblers, damage, score, escalating waves, and restart after game over. `godot/scenes/TrainingRange.tscn` retains the five-target practice range. `godot/scenes/Main.tscn` retains the earlier asset preview.

The Godot scene uses individual GLBs from `godot/assets/environment/` and `godot/assets/enemies/`. The imported recurve bow and arrow remain in `godot/assets/bow/`; the playable bow is procedural for now because the preview model still needs first-person placement and orientation. Preserve attribution in `CREDITS.md` when changing the bow source.

`index.html` remains the published Three.js game. Browser prototypes in `prototypes/` are references for later Godot work, particularly pickups, upgrades, mobile controls, audio, and additional enemy behavior. The current Godot build is a playable prototype, not yet a full feature port.

To verify locally, run `godot --headless --path godot -- --smoke-test` from the repository root. The check fires at a shambler and verifies damage, score, health, and wave setup. You can also open the training scene directly to test its target range.
