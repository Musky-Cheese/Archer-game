# Last Archer — Godot handoff

This is the portable Godot workspace for the game. It is a clean starting point for moving the browser prototype into Godot without overwriting the working Three.js version.

## On the PC

1. Install Godot 4.3 or newer.
2. Clone the `Musky-Cheese/Archer-game` GitHub repository.
3. Open the `godot` folder in Godot using **Import** and select `project.godot`.
4. Wait for Godot to import the GLB models, then press **F6** or **F5**.

The project opens a dark playable scene with first-person movement. The bow, arrow, and arm GLBs are in `assets/bow/`; their source manifests remain in the browser project folders.

## What belongs here

- `assets/` — reusable GLB models and compact texture assets.
- `scenes/` — Godot scenes.
- `scripts/` — gameplay and visual scripts.
- `reference/` — browser prototypes and visual handoff notes; these are reference only, not runtime assets.

The browser game remains in the repository root. Do not delete it while the Godot version is being built.
