# Tank 2026

Browser tank shooter (Battle City inspired), mobile landscape first. Portfolio project; the owner does not write code, so Claude builds everything and explains decisions in Vietnamese.

## Read first
- `docs/GDD.md`: every agreed design decision. Items marked [CHỐT] are settled; do not change them without the owner. [ĐỀ XUẤT] items are open.
- `prototype/control-lab.html`: single-file playable prototype (controls, 3/4 camera, aim lock, rotation inertia, dispersion, cell-based destruction with 5 materials). It is the reference implementation for feel; port its logic, do not grow it further.

## Code
- TypeScript + Vite + PixiJS 8, no game framework. `npm run build` type-checks and builds.
- `?play=tank|apc` (optionally `&level=N`) skips the menu and exposes `window.__game()` / `window.__app` for headless tests.
- Headless Chromium has no GPU (SwiftShader): fps there is fill-rate bound and not representative; measure JS time per frame instead and ask the owner to test on a phone.

## Working rules
- Test on a phone-sized landscape viewport (844×390) in headless Chromium before handing anything over; report fps and errors honestly.
- Performance floor: 60fps on iPhone 12 / Galaxy A54.
- Keep docs/GDD.md updated when a decision changes.
