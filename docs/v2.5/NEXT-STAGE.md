# V2.5 handoff — Stage 8

The local review and corrective polish are complete. Read `STAGE-8-REVIEW.md`
and open `prototypes/v2.5-anime-city-block.html` from the repository root.

This is a review candidate on `anime-city-v1`. `index.html` and the live V2.3.1
game have not been replaced. Stages 3–7 were previously overstated as complete;
the Stage 8 report records the integration defects found and fixed.

Next: the user reviews the intersection, west alley, enemy/bow close-up and
play controls. Collect their visual feedback before a release decision.
Do not merge, push to main or deploy without preview approval.

Remaining release checks: hands-on phone gameplay/performance; run the supplied
Blender import recipe and inspect the resulting editable scene. The GLBs have
been loaded and rendered independently, but this environment cannot launch the
Windows Store Blender executable (Access Denied).

Rebuild: `python tools/build_v25_city_kit.py`, `python tools/refine_v25_assets.py`,
then `python tools/build_v25_city_block.py`. Test with
`node tools/test_v25_city_block.cjs` (Playwright and Chrome required; set
`CHROME_PATH` if needed). `node tools/preview_v25_assets.cjs` renders each GLB.
