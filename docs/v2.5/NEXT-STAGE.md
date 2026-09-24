# V2.5 handoff — reference corner review

**Newest checkpoint: V2.6.1 bow and hands study.** See
`docs/v2.6.1/REVIEW.md`, `docs/v2.6.1/comparison.html`, and
`prototypes/v2.6.1-bow-study.html`. Separate foreground-only preview; four
portable GLBs are in `assets/v2.6.1-bow/`. Stop for visual review. No deployment.

**Latest local checkpoint: V2.6 hero slice.** Open
`prototypes/v2.6-hero-slice.html` and `docs/v2.6/comparison.html`.
Read `docs/v2.6/REVIEW.md` for verified behavior and remaining visual gaps.
The V2.5 integration lost architectural detail; V2.6 restores the intact world,
adds new surface paint/reflections, a revised shambler and a connected bow rig.
It is still visibly simpler than the concept. Stop for user review. No push,
deployment or production-file replacement. The older checkpoints below are history.

**Current checkpoint:** The user rejected the Stage 8 appearance. Open
`prototypes/v2.5-reference-corner.html` and read `REFERENCE-CORNER-REVIEW.md`.
This new bounded art study has a denser street, warm local lighting, a new
shambler and revised foreground arms. It still looks simpler than the concept.
Collect visual feedback on this sample before expanding the look. It is an
explorable art study with a draw pose, not a wave/combat implementation.

Eleven portable modules, a manifest and individual renders are in
`assets/reference-corner/`. Production and the previous prototype are preserved.
Do not merge, push to main or deploy without preview approval.

## Playable corner checkpoint

`prototypes/v2.5-corner-playable.html` now brings the approved corner into the
working V2.5 gameplay loop. Read `CORNER-PLAYABLE-REVIEW.md` and review the
`corner-playable-*.png` captures. This integration preserves the source art
study and previous gameplay preview. It has not been deployed or pushed.

Next recommended task after visual review: refine the foreground bow/hands and
add a purpose-built shambler death animation, then test on an actual phone.

## Previous Stage 8 checkpoint

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
