# Theme & Layout Architecture Notes

## Theme System (Light / Dark Mode)
- **Attribute:** Theme state is controlled via `data-theme="light"` or `data-theme="dark"` on `<html>`.
- **Backgrounds:**
  - Backgrounds are rendered inside a `body::before` pseudo-element with `filter: brightness(0.7)`. This darkens the images to 70% brightness without affecting typography.
  - Sizing & Fitting: `background-size: auto 100%` and `background-position: center center` prioritize vertical top-to-bottom fit without clipping the image height.
  - Mobile Scroll Stability: Rendered with `position: fixed; inset: 0; height: 100dvh; transform: translateZ(0)` without `background-attachment: fixed` to eliminate scroll jitter and moving background glitches on mobile WebKit/Blink browsers.
  - Dark Mode: `url('/Dani-s-Backyard/images/Darkmode.jpg')` (`--bg-image-dark`)
  - Light Mode: `url('/Dani-s-Backyard/images/Whitemode.jpg')` (`--bg-image-light`)
- **Typography:**
  - Text colors are unified to **white/light** in both modes (`--text-primary: #f4f4f5`, `--text-secondary: #a1a1aa`).
  - Text body (`.story-reader`) is completely transparent (no background container) with rich text shadows for readability.
- **Glass Panels:**
  - Header, sidebar TOC, scenario cards, and chapter content lists use neutral, semi-transparent frosted overlays (`rgba(24, 24, 28, 0.45)`) to blend smoothly with background themes.

## Dev Watcher Fix
- Vite server watch paths ignore `node_modules`, `.git`, `dist`, and `.astro` in `astro.config.mjs` to prevent `EMFILE: too many open files` errors.
