# Dani's Backyard

A serialized crossover-fiction narrative and worldbuilding companion, built as a static site with [Astro](https://astro.build).

**[→ d4n1-0.github.io/Dani-s-Backyard](https://d4n1-0.github.io/Dani-s-Backyard/)**

---

## The Stories

Two scenarios. Two worlds colliding. One linked universe.

| Scenario | Mashup | Chapters | Vibe |
| :--- | :--- | :--- | :--- |
| **Genesis** | Trench Crusade (1914) × Modern Earth (2026) | 10 | Theological horror meets geopolitical thriller. The Anomaly reconnects. |
| **Titan** | Attack on Titan × Modern East Asian geopolitics | 3 | The Gate opens in the Yellow Sea. Titans meet carrier strike groups. |

Each scenario has a full **Almanac** — characters, factions, locations, items, and concepts — all cross-linked with Obsidian-style wikilinks.

---

## Repo Structure

```
.
├── The Stories/          ← Obsidian vault (gitignored — canonical content lives here)
│   ├── Story/Genesis/    ← Trench Crusade scenario
│   ├── Story/Titan/      ← Attack on Titan scenario
│   └── _attachments/     ← Images and assets
│
├── web-app/              ← Astro 6.4 static site (deployed to GitHub Pages)
│   ├── src/
│   │   ├── content/      ← Synced copy of vault chapters + almanac
│   │   ├── pages/        ← Astro page routes
│   │   ├── layouts/      ← Page layouts (MainLayout, scenario theming)
│   │   ├── lib/          ← Custom remark wikilink plugin
│   │   └── styles/       ← global.css (dark glassmorphism theme)
│   ├── scripts/          ← sync-vault.mjs (vault → web-app pipeline)
│   └── public/           ← Static assets, favicon
│
├── AGENTS.md             ← AI agent instructions for working in this repo
├── README.md             ← You are here
└── docs/                 ← AI Agent persistent memory, architecture plans, and context
```

---

## Getting Started

### Prerequisites

- **Node.js** ≥ 22.12.0
- npm (ships with Node)

### Install

```bash
cd web-app
npm install
```

### Development

```bash
# Sync the latest vault content into the web app
npm run sync

# Start the dev server
npm run dev
```

Open [http://localhost:4321](http://localhost:4321).

### Build

```bash
npm run sync   # always sync before building if vault content changed
npm run build  # outputs static site to web-app/dist/
```

### Preview the production build

```bash
npm run preview
```

---

## Content Pipeline

The canonical content lives in the Obsidian vault (`The Stories/`), which is **not** tracked in git. The web app works from a synced copy.

```
The Stories/Story/{Scenario}/Story/*.md     → web-app/src/content/chapters/{scenario}/*.md
The Stories/Story/{Scenario}/Almanac/*/*.md → web-app/src/content/almanac/{scenario}/{category}/*.md
The Stories/_attachments/*                   → web-app/dist/_attachments/* (Served dynamically in dev, copied at build)
```

**Sync command:** `npm run sync` (runs `scripts/sync-vault.mjs`)

The sync script:
1. Clears and repopulates `src/content/chapters/` and `src/content/almanac/`
2. Slugifies filenames during copy (e.g., `Chapter 01 — Adam and Eve.md` → `chapter-01-adam-and-eve.md`)

*(Note: Images from `_attachments` are no longer copied by the sync script to keep the codebase pure. They are loaded dynamically via Vite during development and compiled straight to `dist/` during a production build).*

### Wikilinks

Obsidian `[[wikilinks]]` are converted to HTML links at build time by a custom remark plugin:

- `[[Chapter 01 — Adam and Eve]]` → links to `/chapters/chapter-01-adam-and-eve`
- `[[Alice Hartley]]` → links to `/almanac/alice-hartley`
- `![[map.png]]` → embeds the image from `/_attachments/map.png`

### Frontmatter Remapping

The Astro content config (`content.config.ts`) automatically remaps Obsidian frontmatter keys:

| Obsidian key | Astro field |
| :--- | :--- |
| `chapter_title` | `title` |
| `chapter_number` | `chapterNumber` |
| `date_in_world` | `releaseDate` |
| `outcome` | `description` |
| `type` / `subtype` | `category` |

So you keep writing Obsidian-style frontmatter — the build handles the rest.

---

## Deployment

The site deploys to **GitHub Pages** via a CI workflow (`.github/workflows/deploy.yml`) that triggers on push to `main`.

- **Base path:** `/Dani-s-Backyard` (configured in `astro.config.mjs`)
- **Output:** Static HTML, CSS, JS in `web-app/dist/`

---

## Design

- **Dark theme** — zinc/pitch-black palette with glassmorphism
- **Fonts** — Outfit (UI) + Lora (reading)
- **Scenario theming** — accent color shifts per scenario: crimson red for Genesis, steel blue for Titan, gold for the home page
- **Responsive** — desktop sidebar + slide-in mobile nav drawer
- **Mermaid diagrams** — rendered client-side for inline diagrams in chapters/almanac

---

## Tech Stack

| Layer | Technology |
| :--- | :--- |
| Framework | [Astro 6.4](https://astro.build) |
| Content | MDX + Astro Content Collections |
| Styling | Plain CSS (custom properties, glassmorphism) |
| Diagrams | [Mermaid 10](https://mermaid.js.org) (client-side) |
| Hosting | GitHub Pages (static) |
| Source | Obsidian vault (gitignored) → sync script → Astro build |
