# V2.5 stage handoff

## Current checkpoint

Stage 1 proposal complete. User has not yet approved the concept. Branch: `anime-city-v1`, based on rollback commit `c4429ed`. Live game: V2.3.1. No runtime edits or deployment in Stage 1. Read `STYLE-GUIDE.md` and view `concept-sheet.png` before implementing. `concept-prompt.txt` records the single built-in generation prompt.

## Next task — only after the user approves the direction and says continue

Recommended model: GPT-5.6 Terra, high reasoning. Build Stage 2 only: a local renderer and placement study. Do not build the entire city or new characters yet.

1. Confirm branch and working tree. Preserve all user changes. Save reproducible baseline camera positions and a deterministic test layout; capture baseline screenshots.
2. Inspect and fix the bus/fuel-stop Y/Z placement error in the prototype. Update world matrices before extracting collider positions; verify them visually and through bounds. Do not delete the functional platform based on the previous mistaken diagnosis.
3. Build an isolated preview under a dedicated prototype path. Reuse a few existing GLBs and simple street blocks. Retain the production entrypoint untouched for this checkpoint.
4. Audit sRGB/data texture handling and procedural/imported colors; test swatches, a gray cube, one GLB and one sponsor face. Do not repeat the washed-out V2.4 global exposure change.
5. Implement a dark cel-lighting preset and selective outline experiment; keep bloom off. Add quality controls if necessary. No new image generation unless the user asks for a concept revision.
6. Verify opening/intersection/alley views, no console/shader errors, grounded objects, colliders and texture loading. Record draw calls, triangles, browser/device and frame-time samples. Desktop mobile emulation verifies layout only.
7. Deliver a local playable preview with same-camera comparisons and explain remaining limitations. Save the next handoff and stop for user review. No push to main, merge or live deployment.

## Subsequent stages

3. Terra medium: modular city assets, individual GLBs and manifest.
4. Terra high: one rigged shambler, then additional types only after it works.
5. Terra high: correct POV bow, hands, nocking/draw/release and trajectory tests.
6. Terra medium: assemble the intersection and alley with colliders and ads.
7. Terra medium (or Luna for simple file bookkeeping): measured performance/packaging cleanup. Rendering optimization is not merely a renaming task.
8. Astra high: final visual and regression review; user approval before live release.

The style guide is authoritative over extra details accidentally invented in generated concept art. Preserve existing gameplay tuning unless a stage explicitly calls for a behavior change. Stage completion means its preview and validation are delivered, not that every future stage is finished.
