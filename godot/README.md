# Last Archer — Godot

Open `project.godot` with Godot 4.7 or newer and press F5. The main scene is the playable Night District training range. The earlier asset preview remains at `scenes/Main.tscn`.

Click the game to capture the mouse. WASD moves, Shift sprints, Space jumps, hold left mouse to draw and release to fire. Escape pauses and frees the mouse. Shoot all five green targets; R resets the cleared range.

The training range includes a nighttime street, target scoring, arrow gravity and collision, and six fictional sponsor signs. Its bow and city are procedural placeholders. The handoff's reusable GLB bow, arrow, and environment assets remain in `assets/` for integration. This is a playable Godot prototype, not yet the full browser game's zombies, waves, upgrades, mobile controls, or audio. The published browser game remains at the repository root.

For a quick headless gameplay check, run Godot from this folder with `--headless -- --smoke-test`. The check covers grounded movement, target creation, projectile collision, and score.

See [the handoff notes](../docs/GODOT_HANDOFF.md) and [credits](../CREDITS.md) before replacing placeholder art.
