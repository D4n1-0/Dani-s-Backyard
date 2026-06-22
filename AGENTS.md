# AGENTS.md

This repo has two halves that share data but live in separate gitignored directories.

## Repo structure

```
The Stories/       ← Obsidian vault (gitignored at root, but .obsidian/ config is tracked)
  Story/Genesis/   ← Trench Crusade scenario
  Story/Titan/     ← Attack on Titan scenario
  General/         ← Vault guide, templates
web-app/           ← Astro 6.4 static site (deployed to GitHub Pages)
```

The vault is **not** tracked at the repo root level — only its `.obsidian/` config and `.gitignore` are committed. The web-app has its own `.gitignore`.

## Commands (all from `web-app/`)

| Command          | Purpose                                              |
| :--------------- | :--------------------------------------------------- |
| `npm run dev`    | Dev server at `localhost:4321`                        |
| `npm run build`  | Build static site to `dist/`                          |
| `npm run sync`   | Copy vault content → `src/content/` + `public/_attachments/` |
| `npm run preview`| Preview the production build locally                  |

**Critical order:** Run `npm run sync` before `npm run build` (or `dev`) if vault content has changed. The build reads from `src/content/`, not from the vault directly.

Node >= 22.12.0 is required (`package.json` engines field).

## Build & deploy

- **Static output** with `base: '/Dani-s-Backyard'` (GitHub Pages repo name)
- CI (`deploy.yml`) triggers on push to `main`/`master`, builds from `web-app/`, deploys to GitHub Pages
- No lint, typecheck, or test scripts exist in either half of the repo

## Content pipeline (vault → web)

```
The Stories/Story/{Scenario}/Story/*.md    → src/content/chapters/{scenario}/*.md
The Stories/Story/{Scenario}/Almanac/*/*.md → src/content/almanac/{scenario}/{category}/*.md
The Stories/_attachments/*                  → public/_attachments/*
```

The sync script (`scripts/sync-vault.mjs`) hardcodes two scenarios: `genesis` and `titan`. It slugifies filenames during copy.

### Frontmatter remapping

`content.config.ts` preprocesses Obsidian frontmatter keys into the Astro schema:

| Obsidian key        | Astro schema field  |
| :------------------ | :------------------ |
| `chapter_title`     | `title`             |
| `chapter_number`    | `chapterNumber`     |
| `date_in_world`     | `releaseDate`       |
| `outcome`           | `description`       |
| `type` / `subtype`  | `category`          |

### Obsidian wikilinks → HTML

A custom remark plugin (`src/lib/remark-wikilink.mjs`) converts `[[Target]]` / `[[Target|Label]]` to links:
- Targets starting with `Chapter` → `/Dani-s-Backyard/chapters/{slug}`
- Everything else → `/Dani-s-Backyard/almanac/{slug}`
- `![[image.png]]` → `<img>` pointing to `/_attachments/{filename}`

### Routing

Chapters and almanac entries resolve by **flat slug** (the last path segment of their content ID). Both `almanac/[...slug].astro` and `chapters/[...slug].astro` generate dual routes (full path + flat slug) via `getStaticPaths`.

## Vault conventions

For editing narrative content (chapters, Almanac entries), read `The Stories/AGENTS.md` **first**. That file covers:
- YAML frontmatter requirements and templates
- Wikilink syntax rules (bold/italic markers go **outside** `[[` `]]`, not inside)
- Broken-link scanning before finishing any edit session
- Canon research workflow (check Trench Crusade / Attack on Titan wikis before writing lore)
- Dual-timeline date format: `"Day N — YYYY-MM-DD TC / YYYY-MM-DD Modern"`
