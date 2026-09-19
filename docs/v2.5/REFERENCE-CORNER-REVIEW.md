# Reference corner — local visual review

Open `prototypes/v2.5-reference-corner.html`. It is a self-contained offline
Three.js art study, with three camera views, drag-to-look, WASD movement, a bow
visibility switch and an F-key draw pose. It does not implement waves/combat.

This study responds to the rejected Stage 8 appearance. The reference remains
`concept-sheet.png`; screenshots named `corner-*.png` are actual browser renders.
The concept image is not used as scenery, a background, or a screen overlay.

## What changed

- A continuous street with shuttered shops, return walls, balconies, fire escape,
  air conditioners, utility wires, curbs, an abandoned sedan and refuse.
- Warm local light pools, cool dark fill, selective shadows, restrained haze,
  shared tiny surface textures and pavement glints.
- A separate 1.87 m, 1,012-triangle shambler with narrower proportions, a jacket,
  angular face, fingers, and idle/walk clips. The study uses three idle actors.
- A foreground recurve bow with connected tapered arms and finger geometry.
  Its draw pose is interactive; this is not a shooting-mechanics change.
- Replaceable billboard and vending text through `CornerReview.updateAd` and
  the `ads` configuration in the source. Ad replacement disposes old resources.
- Eleven base-centred reusable GLBs exported separately, with a manifest and
  individual preview renders.

## Visual assessment

The street framing, night palette and environmental vocabulary are closer to
the concept. This remains visibly simpler: the painted illustration has richer
irregular architecture, more natural clothing/hand anatomy and subtler surface
wear. The prototype still shows repeated masonry and faceted silhouettes.
Do not describe this as an exact match or a finished game-wide art conversion.
Review this one corner before expanding the approach.

## Verification

Chrome/Playwright loaded the offline HTML with no page or console errors and
all four embedded GLB loads succeeded. Checked camera presets, forward movement,
bow visibility, drawing/release, and desktop/phone-size rendering. Repeated
billboard/vending replacements kept texture and geometry counts stable.

Captured: `corner-hero.png`, `corner-shop.png`, `corner-street.png`,
`corner-draw.png`, and `corner-phone.png`. The phone capture verifies layout,
not full touch gameplay or hardware performance.

All eleven exports loaded independently in Three.js. Buffer validation checked
finite geometry, binary format, embedded images <=256 px, base-centred pivots,
props <=800 triangles, character <=1,500 triangles and individual files <500 KB.
Actual files range from about 7–185 KiB. Export review caught and corrected
inverted texture coordinates and overlapping vending labels.

The hero view reports roughly 256 draw calls and 149k rendered triangles,
including shadow passes and foreground geometry. These are diagnostic counts,
not a phone-performance claim. More batching/light-budget work is needed before
scaling this lighting across a full map.

## Rebuild

From the repository root, with Python, Node, Playwright and Chrome available:

```text
python tools/build_corner_character.py
python tools/build_reference_corner.py
node tools/export_corner_modules.cjs
python tools/validate_corner_assets.py
node tools/review_reference_corner.cjs
node tools/preview_v25_assets.cjs assets/reference-corner front
python tools/package_reference_corner.py
```

The previous city prototype and production `index.html` are preserved. The next
decision is visual approval of this sample. No push, merge or deployment was
performed for this review.
