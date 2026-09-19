# V2.5 Stage 2 — Renderer and placement study

Status: complete locally; awaiting review. Branch: `anime-city-v1`. No changes were made to `index.html`, `main`, GitHub Pages or the live game.

## Run locally

Open [`../../prototypes/v2.5-render-lab.html`](../../prototypes/v2.5-render-lab.html) in Chrome, or run [`../../prototypes/test-v2.5-render-lab.cjs`](../../prototypes/test-v2.5-render-lab.cjs) with the workspace Node/Playwright runtime. The lab uses the full embedded game engine and the existing 12 portable GLBs, but pauses gameplay and adds a renderer panel.

It includes fixed Intersection, Alley and Street views; Baseline, Cel night and Dark night presets; optional selective GLB outlines; calibration swatches; asset state; draw calls/triangles; frame timing; and grounded-object audit results. The panel explicitly labels this as a prototype. The default is Baseline so a user must choose a visual experiment.

## Preview captures

| Capture | Result |
|---|---|
| [Baseline](../../prototypes/v2.5-render-lab-baseline.png) | Unmodified rendering behavior, fixed intersection camera |
| [Cel night](../../prototypes/v2.5-render-lab-anime.png) | Three-band toon-material trial with warm key/cool fill and optional outlines |
| [Dark night](../../prototypes/v2.5-render-lab-night.png) | Lower-exposure dark readability trial at the fixed alley camera |
| [Mobile layout](../../prototypes/v2.5-render-lab-mobile-layout.png) | 390 × 844 layout check only; this is not a device-performance test |

The existing blockout assets are intentionally still visible. This stage proves how the new rendering direction behaves with the old content; it does not claim the old low-poly props already look like final anime city assets.

## Placement correction

The lab corrects two source-coordinate mistakes without changing production:

| Object | Production source position | Lab position | Ground check |
|---|---|---|---|
| Bus | `(-31, 13, 0)` | `(-31, 0, 13)` | world bounds min Y `0.03 m` |
| Fuel stop | `(38, 42, 0)` | `(38, 0, 42)` | world bounds min Y `0.00 m` |

The source uses Three.js' Y-up coordinates, so the former second argument placed both models in the air. `solidLocal` also forces a world-matrix update before extracting collider positions in the lab. The existing platform/ramp remains in place; it was not the cause of these floating structures.

## Rendering findings

- The clean cel preset uses a nearest-filtered three-step gradient and converts only standard-lit mesh materials; sponsor faces remain canvas/text-based rather than being flattened by the toon pass.
- It uses sRGB output plus Reinhard tone mapping in the test only. The scene then uses a warm amber primary directional light, restrained blue secondary fill and low ambient fill. The `Dark night` preset lowers exposure again while retaining readable signs and props.
- The first outline implementation exposed a group-transform defect. It now copies each mesh's world matrix, so outlines follow their GLB geometry. That check should remain in future tests.
- On this scene the clean cel pass retained the baseline `253` draw calls and `6,908` triangles. Enabling every existing portable-prop outline raised draw calls to `330` while triangles stayed the same. This makes global outlines unsuitable for the city. Keep them off by default and test them later only on zombies, the bow or large hero props.
- Headless Chromium frame samples cluster near `16.6 ms` at `1440 × 900`, with expected spikes while switching materials/outlines. This confirms the loop runs; it is not a hardware performance claim. No phone was measured.
- The 390 × 844 emulated layout retained a visible `374 px` lab panel inside the `390 px` viewport. This validates layout only.

All 12 embedded GLBs loaded, no console or page errors occurred, both corrected objects passed grounding checks, and Baseline/Cel/Dark presets completed under the automated test.

## What is deliberately not being promoted yet

This is not a production renderer. It does not add new city assets, rigged zombies, real first-person bow hands, post-processing, shadow-quality changes, a shader migration or gameplay changes. It also does not establish final mobile performance. Do not copy the prototype's material conversion or outline experiment wholesale into the main game.

## Review decision requested

Review the local lab with **Cel night** first, then compare **Dark night** from the same view. Decide whether its darkness, amber/cool balance and restrained outlines are the direction to carry into the first finished city block. The next bounded task should begin only after approval.
