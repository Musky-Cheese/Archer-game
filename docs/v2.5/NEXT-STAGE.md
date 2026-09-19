# V2.5 stage handoff

## Current checkpoint

Stages 1 and 2 are complete locally. Branch: `anime-city-v1`, based on rollback commit `c4429ed`. Live game: V2.3.1. Read `STYLE-GUIDE.md`, view `concept-sheet.png`, then review `STAGE-2-RESULTS.md` and the local renderer lab before implementing further work. The production entrypoint remains unchanged. `concept-prompt.txt` records the single built-in generation prompt.

## Next task — only after the user approves the renderer direction and says continue

Recommended model: GPT-5.6 Terra, medium reasoning. Build Stage 3 only: the modular city-block kit and a local 32 × 32 m intersection. Do not build zombies, bow hands or a production map yet.

1. Confirm branch and working tree. Preserve all user changes. Save reproducible baseline camera positions and a deterministic test layout; capture baseline screenshots.
2. Create five to seven reusable modular city assets: storefront facade, corner facade, alley wall, sidewalk/curb, road/intersection, streetlight and dumpster. Keep each as a separate GLB with a base-centre pivot, existing asset budgets and manifest data.
3. Build a fixed 32 × 32 m intersection from those modules in a separate local preview. Reuse the approved lighting preset; no production entrypoint edits yet.
4. Add intended collision shapes after world transforms update and validate every grounded object and sign mount.
5. Compare the new block against the Stage 2 fixed views; inspect desktop and touch layouts, assets, console errors and geometry/draw-call counts. Do not claim mobile performance without a phone measurement.
6. Deliver an asset manifest, editable Blender source, local preview screenshots and the next handoff. Stop for user review. No push to main, merge or live deployment.

## Subsequent stages

4. Terra high: one rigged shambler, then additional types only after it works.
5. Terra high: correct POV bow, hands, nocking/draw/release and trajectory tests.
6. Terra medium: assemble the intersection and alley with colliders and ads.
7. Terra medium (or Luna for simple file bookkeeping): measured performance/packaging cleanup. Rendering optimization is not merely a renaming task.
8. Astra high: final visual and regression review; user approval before live release.

The style guide is authoritative over extra details accidentally invented in generated concept art. Preserve existing gameplay tuning unless a stage explicitly calls for a behavior change. Stage completion means its preview and validation are delivered, not that every future stage is finished.
