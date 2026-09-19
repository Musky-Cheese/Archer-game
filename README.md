# Last Archer V2.3.1

Last Archer is a browser-based first-person zombie survival game built with Three.js. Move through an expanded low-poly district, draw and release arrows, survive enemy waves, collect temporary powers, and earn permanent upgrades between runs. V2.3.1 places the Blender-built environment kit prominently around the starting district.

## Play

The GitHub Pages deployment is configured at:

**https://musky-cheese.github.io/Archer-game/**

The game is self-contained in `index.html`. Three.js, the GLB loader, and the runtime environment models are embedded, so the deployed game does not depend on a third-party CDN.

## Controls

- Move: WASD, arrow keys, or the on-screen pad
- Aim: mouse or drag the arena on touch devices
- Shoot: hold click or FIRE to draw, then release
- Pause: Escape, P, or the pause button

## Portable environment kit

`assets/environment-kit/` contains nine reusable Blender-made assets:

- Billboard
- Vending machine
- Sponsored barricade
- Supply crate
- Highway sign
- Streetlight
- Concrete roadblock
- Abandoned car
- Shipping container

Every model is an independent binary GLB with a base-center pivot, meter scale, flat colors, no external textures, and its own preview. See [`assets/environment-kit/manifest.md`](assets/environment-kit/manifest.md) for dimensions, triangle counts, and file sizes.

## Project files

- `index.html` — current playable V2.3.1 build
- `preview.png` — tested gameplay preview
- `style-lab.html` — earlier zombie style comparison
- `assets/environment-kit/` — GLBs, previews, manifest, and editable Blender source

## Deployment

Pushing to `main` triggers the GitHub Pages workflow in `.github/workflows/pages.yml`.
