# Last Archer — Godot

Open `project.godot` with Godot 4.7 or newer and press F5. The main scene is **Night District**, a first-person bow survival prototype. Click the game to capture the mouse. Use WASD to move, Shift to sprint, Space to jump, hold the left mouse button to draw, release to fire, and Escape to pause.

Shamblers pursue and damage you. Each takes two arrows to defeat. Clear a wave to start the next; your score, health, and wave appear on screen. You have three health points, and R restarts after game over. The street includes the handoff's billboard, vending machine, streetlight, barricade, crate, and car models.

The earlier five-target range remains at `scenes/TrainingRange.tscn`, and the original GLB asset preview remains at `scenes/Main.tscn`. The playable bow is still procedural while its GLB integration is refined. Pickups, upgrades, mobile controls, and audio from the browser game are not yet ported. The browser game remains at the repository root.

Run `godot --headless --path . -- --smoke-test` from this folder to check arrow damage, scoring, health, and the initial wave. See [the handoff notes](../docs/GODOT_HANDOFF.md) and [credits](../CREDITS.md) for asset context.
