# Multi-Scenario Website Support + Reader-First UI Upgrades

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Extend the Astro static site to fully support 4 scenarios (Genesis, Titan, Disco, The Sundered World) with dynamic UI, proper theming, and navigation. Layer on reader-first features: scene TOC, reading progress, continue-reading, global search, filter tabs, and View Transitions.

**Architecture:** Replace hardcoded scenario logic with a data-driven approach using a central scenario registry. Homepage becomes a 4-card grid with counts and activity badges. Desktop chapter pages get a sticky scene TOC. Global Pagefind search, localStorage continue-reading, almanac filter tabs, and View Transitions complete the reading experience.

**Tech Stack:** Astro 6.4, TypeScript, vanilla CSS, Pagefind

**Grill-me decisions baked in:**
- ✅ Sticky scene TOC (desktop only)
- ✅ Flat 2×2 grid + counts + recent badges
- ✅ Pagefind global search (full index, header, scenario chips)
- ✅ localStorage continue-reading (cards + scenario hubs)
- ✅ Almanac filter tabs (timeline deferred)
- ✅ View Transitions
- ❌ No scenario switcher in header
- ✅ Reading progress bar (no reading time)
- ❌ Textures deferred
- ✅ Combined pages kept + filter tabs

---

## Current State Analysis

### What Works
- Content sync script (`sync-vault.mjs`) already syncs all 4 scenarios
- Content schema handles all scenarios generically
- Chapter/almanac entry pages (`[...slug].astro`) are fully dynamic
- Wikilink plugin works generically

### What's Hardcoded
| File | Issue |
|:-----|:------|
| `src/pages/index.astro` | Only shows Genesis + Titan split-screen cards |
| `src/pages/[scenario]/index.astro` | Hardcoded `getStaticPaths` for genesis/titan only |
| `src/pages/[scenario]/chapters.astro` | Hardcoded `getStaticPaths` for genesis/titan only |
| `src/pages/[scenario]/almanac.astro` | Hardcoded `getStaticPaths` for genesis/titan only |
| `src/layouts/MainLayout.astro` | Only detects genesis/titan from URL path |
| `src/styles/global.css` | Accent colors for genesis/titan only; uses splitscreen styles |

### Scenario Data
| Scenario | Slug | Chapters | Almanac | Accent |
|:---------|:-----|:---------|:--------|:-------|
| Genesis | `genesis` | 10 | ~80 | `#ff4d4d` (red) |
| Titan | `titan` | 17 | ~200+ | `#50b3e6` (blue) |
| Disco | `disco` | 4 | ~100+ | `#c9a227` (gold) |
| The Sundered World | `the-sundered-world` | 1 | ~50+ | `#8b5cf6` (violet) |

---

## Task 1: Create Scenario Registry

**Objective:** Single source of truth for all scenario metadata.

**Files:**
- Create: `web-app/src/lib/scenarios.ts`

**Implementation:**

```typescript
// web-app/src/lib/scenarios.ts

export interface ScenarioMeta {
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  accent: string;
  accentRgb: string;
  cardImage?: string;
  mermaid?: string;
}

export const scenarios: Record<string, ScenarioMeta> = {
  genesis: {
    slug: 'genesis',
    title: 'Genesis',
    subtitle: 'The Anomaly Reconnects',
    description: 'Follow the dual timeline where 1914 Trench Crusade and 2026 Modern Earth collide.',
    accent: '#ff4d4d',
    accentRgb: '255, 77, 77',
    cardImage: '/images/card-genesis.png',
  },
  titan: {
    slug: 'titan',
    title: 'Titan',
    subtitle: 'The Gate of the Yellow Sea',
    description: 'Follow the clash of modern East Asian geopolitics and the dark fantasy of the Attack on Titan world.',
    accent: '#50b3e6',
    accentRgb: '80, 179, 230',
    cardImage: '/images/card-titan.jpg',
  },
  disco: {
    slug: 'disco',
    title: 'Disco',
    subtitle: 'The Reclamation of Martinaise',
    description: 'A Wild Pines engineer arrives to build a security apparatus in the wake of the Tribunal.',
    accent: '#c9a227',
    accentRgb: '201, 162, 39',
  },
  'the-sundered-world': {
    slug: 'the-sundered-world',
    title: 'The Sundered World',
    subtitle: 'A Dieselpunk Convergence',
    description: 'Childhood friends separated by census and transmigration policy find each other again at the edge of a border dispute.',
    accent: '#8b5cf6',
    accentRgb: '139, 92, 246',
  },
};

export const scenarioList = Object.values(scenarios);

export function getScenario(slug: string): ScenarioMeta | undefined {
  return scenarios[slug.toLowerCase()];
}

export function getScenarioFromPath(pathname: string): ScenarioMeta | undefined {
  const lower = pathname.toLowerCase();
  for (const s of scenarioList) {
    if (lower.includes(`/${s.slug}`)) return s;
  }
  return undefined;
}
```

**Verify:** `cd web-app && npx astro check` → no errors

---

## Task 2: Homepage — 4-Card Grid with Counts + Activity Badges

**Objective:** Replace 2-panel split with a responsive 4-card grid showing chapter/entry counts and a "recently updated" badge per scenario.

**Files:**
- Modify: `web-app/src/pages/index.astro`
- Modify: `web-app/src/styles/global.css`

### Step 1: Rewrite `index.astro`

The homepage needs to compute per-scenario stats (chapter count, entry count, last modified date). This requires importing content collections:

```astro
---
import MainLayout from '../layouts/MainLayout.astro';
import { scenarioList } from '../lib/scenarios';
import { getCollection } from 'astro:content';

const base = import.meta.env.BASE_URL;
const allChapters = await getCollection('chapters');
const allEntries = await getCollection('almanac');

// Compute per-scenario stats
const scenarioStats = scenarioList.map(s => {
  const chapters = allChapters.filter(
    ch => ch.data.scenario.toLowerCase() === s.slug
  );
  const entries = allEntries.filter(
    e => e.data.scenario.toLowerCase() === s.slug
  );

  // Find most recent modification date
  const dates = [
    ...chapters.map(ch => ch.data.releaseDate || ''),
    // almanac entries don't have dates in schema, skip
  ].filter(Boolean).sort().reverse();

  return {
    ...s,
    chapterCount: chapters.length,
    entryCount: entries.length,
    lastUpdated: dates[0] || null,
    hasContent: chapters.length > 0 || entries.length > 0,
  };
});
---

<MainLayout title="Home" activeTab="home">
  <div class="scenario-grid-container">
    <header class="home-header">
      <h1 class="home-title">Dani's Backyard</h1>
      <p class="home-subtitle">Serialized narratives and worldbuilding companions</p>
    </header>

    <div class="scenario-grid">
      {scenarioStats.map(s => (
        <a href={`${base}/${s.slug}`} class="scenario-card" id={`card-${s.slug}`}>
          <div
            class="scenario-card-bg"
            style={s.cardImage ? `background-image: url(${base}${s.cardImage})` : undefined}
          ></div>
          <div class="scenario-card-overlay"></div>
          <div class="scenario-card-content">
            <div class="scenario-card-meta">
              {s.chapterCount > 0 && (
                <span class="scenario-card-stat">{s.chapterCount} chapters</span>
              )}
              {s.entryCount > 0 && (
                <span class="scenario-card-stat">{s.entryCount} entries</span>
              )}
            </div>
            <h2 class="scenario-card-title">{s.title}</h2>
            <p class="scenario-card-subtitle">{s.subtitle}</p>
            <p class="scenario-card-description">{s.description}</p>
            <div class="scenario-card-footer">
              <span class="scenario-card-cta">Enter {s.title}</span>
              {/* Continue-reading slot filled by client-side JS */}
              <span class="scenario-card-continue" data-scenario={s.slug}></span>
            </div>
          </div>
        </a>
      ))}
    </div>
  </div>
</MainLayout>
```

### Step 2: Add grid styles to `global.css`

Replace lines ~592-739 (the `.splitscreen-container` block and all its children) with:

```css
/* =================================
   SCENARIO GRID HOMEPAGE
   ================================= */
.scenario-grid-container {
  width: 100%;
  min-height: 100vh;
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  padding: 80px 60px 60px;
}

.home-header {
  text-align: center;
  margin-bottom: 48px;
}

.home-title {
  font-size: 2.5rem;
  font-weight: 800;
  color: var(--text-primary);
  letter-spacing: -0.03em;
  margin-bottom: 8px;
}

.home-subtitle {
  font-size: 0.95rem;
  color: var(--text-secondary);
}

.scenario-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24px;
  flex: 1;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
}

@media (max-width: 768px) {
  .scenario-grid {
    grid-template-columns: 1fr;
  }
  .scenario-grid-container {
    padding: 60px 24px 40px;
  }
}

.scenario-card {
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  min-height: 320px;
  border-radius: 16px;
  overflow: hidden;
  text-decoration: none;
  border: 1px solid var(--border-color);
  transition: all var(--transition-normal);
}

.scenario-card:hover {
  transform: translateY(-4px);
  border-color: var(--border-color-hover);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
}

.scenario-card-bg {
  position: absolute;
  inset: 0;
  background-size: cover;
  background-position: center;
  filter: grayscale(35%) brightness(40%);
  transition: transform var(--transition-slow), filter var(--transition-slow);
}

.scenario-card:hover .scenario-card-bg {
  transform: scale(1.05);
  filter: grayscale(20%) brightness(50%);
}

/* Fallback gradient when no image */
.scenario-card-bg:not([style]) {
  background: linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg-primary) 100%);
}

.scenario-card-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(10, 10, 12, 0.95) 0%, rgba(10, 10, 12, 0.4) 50%, transparent 100%);
  z-index: 1;
}

.scenario-card-content {
  position: relative;
  z-index: 2;
  padding: 32px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.scenario-card-meta {
  display: flex;
  gap: 12px;
  margin-bottom: 4px;
}

.scenario-card-stat {
  font-size: 0.7rem;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  background: rgba(255, 255, 255, 0.06);
  padding: 3px 10px;
  border-radius: 999px;
  border: 1px solid var(--border-color);
}

.scenario-card-title {
  font-size: 2rem;
  font-weight: 800;
  color: #fff;
  letter-spacing: -0.03em;
  margin: 0;
}

.scenario-card-subtitle {
  font-size: 0.85rem;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-weight: 600;
}

.scenario-card-description {
  font-size: 0.9rem;
  color: var(--text-secondary);
  line-height: 1.5;
  margin-top: 8px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.scenario-card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 16px;
}

.scenario-card-cta {
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--accent);
  display: inline-flex;
  align-items: center;
  gap: 8px;
  transition: gap var(--transition-fast), color var(--transition-fast);
}

.scenario-card:hover .scenario-card-cta {
  gap: 16px;
  color: #fff;
}

.scenario-card-cta::after {
  content: '→';
  font-size: 1rem;
}

.scenario-card-continue {
  font-size: 0.72rem;
  color: var(--accent);
  font-weight: 600;
}

/* Per-card accent colors */
#card-genesis { --accent: #ff4d4d; --accent-rgb: 255, 77, 77; }
#card-titan { --accent: #50b3e6; --accent-rgb: 80, 179, 230; }
#card-disco { --accent: #c9a227; --accent-rgb: 201, 162, 39; }
#card-the-sundered-world { --accent: #8b5cf6; --accent-rgb: 139, 92, 246; }
```

### Step 3: Remove old homepage CSS overrides

In `global.css`, also remove/update:
- `.is-root-home` overrides (lines ~90-112) — simplify since homepage no longer fills viewport
- `.is-root-home .site-header` invisibility (lines ~183-200) — keep the transparent header for homepage, but ensure the desktop nav is still hidden

**Verify:** `cd web-app && npm run build` → homepage renders 4 cards with counts

---

## Task 3: Dynamic Scenario Pages

**Objective:** Replace hardcoded `getStaticPaths` in all `[scenario]/*` pages with dynamic generation from the registry.

**Files:**
- Modify: `web-app/src/pages/[scenario]/index.astro`
- Modify: `web-app/src/pages/[scenario]/chapters.astro`
- Modify: `web-app/src/pages/[scenario]/almanac.astro`

### Step 1: `[scenario]/index.astro` — Scenario Hub

```astro
---
import MainLayout from '../../layouts/MainLayout.astro';
import { scenarios, getScenario } from '../../lib/scenarios';

export async function getStaticPaths() {
  return Object.keys(scenarios).map(slug => ({ params: { scenario: slug } }));
}

const { scenario } = Astro.params;
const base = import.meta.env.BASE_URL;
const currentMeta = getScenario(scenario);

if (!currentMeta) return Astro.redirect(`${base}/`);
---

<MainLayout title={currentMeta.title} activeTab="home" scenario={scenario}>
  <a href={base} class="back-link">All Scenarios</a>

  <div class="scenario-hub">
    <header class="scenario-header">
      <h1>{currentMeta.title}</h1>
      <p class="scenario-description">{currentMeta.description}</p>
    </header>

    <div class="scenario-nav-grid">
      <a href={`${base}/${scenario}/chapters`} class="nav-block">
        <div>
          <div class="nav-block-title">Story Chapters</div>
          <p class="nav-block-description">
            Read through the serialized narrative of the {currentMeta.title} arc.
          </p>
        </div>
        <span class="nav-block-cta">Read Story</span>
      </a>
      <a href={`${base}/${scenario}/almanac`} class="nav-block">
        <div>
          <div class="nav-block-title">Almanac Lore</div>
          <p class="nav-block-description">
            Explore the characters, factions, concepts, items, and locations.
          </p>
        </div>
        <span class="nav-block-cta">Browse Almanac</span>
      </a>
    </div>
  </div>
</MainLayout>
```

### Step 2: `[scenario]/chapters.astro`

Same pattern — import `scenarios` + `getScenario`, dynamic `getStaticPaths`, use `currentMeta.title` instead of inline ternary. (Full code same as current but with registry imports; see plan file for complete listing.)

### Step 3: `[scenario]/almanac.astro`

Same pattern. (Full code same as current but with registry imports.)

**Verify:** `cd web-app && npm run build` → all 4 scenario pages generate

---

## Task 4: Update MainLayout for Dynamic Scenario Detection

**Objective:** Use the scenario registry for URL detection and theming.

**Files:**
- Modify: `web-app/src/layouts/MainLayout.astro`

Replace the hardcoded genesis/titan detection (lines ~37-42) with:

```typescript
import { getScenarioFromPath, getScenario } from '../lib/scenarios';

// ...existing props...

let currentScenario = scenarioProp
  ? getScenario(scenarioProp)
  : getScenarioFromPath(Astro.url.pathname);

const themeStyles = currentScenario
  ? `--accent: ${currentScenario.accent}; --accent-rgb: ${currentScenario.accentRgb};`
  : '';
```

**Verify:** `cd web-app && npm run build` → correct accent colors on all pages

---

## Task 5: Placeholder Card Images

**Objective:** Create placeholder card backgrounds for Disco and Sundered World.

**Files:**
- Create: `web-app/public/images/card-disco.jpg`
- Create: `web-app/public/images/card-the-sundered-world.jpg`

Use Python/PIL since ImageMagick may not be available:

```python
from PIL import Image, ImageDraw

for name, color1, color2 in [
    ('card-disco', '#1a1a2e', '#c9a227'),
    ('card-the-sundered-world', '#1a1a2e', '#8b5cf6'),
]:
    img = Image.new('RGB', (800, 600), color1)
    draw = ImageDraw.Draw(img)
    for i in range(600):
        r = int(int(color1[1:3], 16) + (int(color2[1:3], 16) - int(color1[1:3], 16)) * i / 600)
        g = int(int(color1[3:5], 16) + (int(color2[3:5], 16) - int(color1[3:5], 16)) * i / 600)
        b = int(int(color1[5:7], 16) + (int(color2[5:7], 16) - int(color1[5:7], 16)) * i / 600)
        draw.line([(0, i), (800, i)], fill=(r, g, b))
    img.save(f'web-app/public/images/{name}.jpg', quality=85)
```

**Verify:** `ls -la web-app/public/images/` → 4 card images present

---

## Task 6: Sync Script — Scenario Name Normalization

**Objective:** Normalize `scenario` field in frontmatter from display names to slugs.

**Files:**
- Modify: `web-app/scripts/sync-vault.mjs`

Add to the script (before the file-writing loop):

```javascript
const SCENARIO_SLUG_MAP = {
  'Genesis': 'genesis',
  'Titan': 'titan',
  'Disco': 'disco',
  'The Sundered World': 'the-sundered-world',
};

function normalizeScenarioField(content) {
  return content.replace(
    /^scenario:\s*["']?([^"'\n]+)["']?$/m,
    (match, name) => {
      const slug = SCENARIO_SLUG_MAP[name.trim()] || slugify(name);
      return `scenario: "${slug}"`;
    }
  );
}
```

Apply `normalizeScenarioField` to content before writing each file.

**Verify:** `cd web-app && npm run sync && npm run build` → all content builds

---

## Task 7: CSS — Scenario Accents & Cleanup

**Objective:** Ensure all 4 accent colors are supported. Remove lingering splitscreen CSS that's no longer referenced.

**Files:**
- Modify: `web-app/src/styles/global.css`

The accent system works via `<html style="--accent: ...">` from MainLayout, so minimal CSS changes needed. Just document the accent colors in a comment and remove any `.split-*` classes that aren't used by the new grid.

**Verify:** `cd web-app && npm run build` → build succeeds, no broken styles

---

## Task 8: Install Pagefind + Global Search

**Objective:** Add full-site search with scenario filter chips in the header.

**Files:**
- Modify: `web-app/package.json` (add pagefind dependency)
- Modify: `web-app/astro.config.mjs` (add post-build integration)
- Create: `web-app/src/components/SearchUI.astro` (search trigger + overlay)
- Modify: `web-app/src/layouts/MainLayout.astro` (include SearchUI)

### Step 1: Install Pagefind

```bash
cd web-app && npm install --save-dev pagefind
```

### Step 2: Add post-build hook in `astro.config.mjs`

```javascript
import { execSync } from 'child_process';

// Add to the vaultAttachmentsIntegration (or as a separate integration):
{
  name: 'pagefind-index',
  hooks: {
    'astro:build:done': async ({ dir }) => {
      execSync(`npx pagefind --site ${fileURLToPath(dir)}`, { stdio: 'inherit' });
    },
  },
}
```

### Step 3: Create `src/components/SearchUI.astro`

A search trigger button (magnifying glass icon in the header) that opens an overlay with:
- Text input (auto-focused)
- Results list (from Pagefind)
- Scenario filter chips ("All | Genesis | Titan | Disco | Sundered")
- Keyboard nav (↑↓ Enter Escape)

```astro
<button id="search-trigger" class="search-trigger" aria-label="Search">
  <svg><!-- magnifying glass icon --></svg>
</button>

<div id="search-overlay" class="search-overlay" aria-hidden="true">
  <div class="search-panel">
    <div class="search-input-row">
      <input id="search-input" type="text" placeholder="Search chapters and almanac..." />
      <button id="search-close" aria-label="Close search">✕</button>
    </div>
    <div class="search-filters" id="search-filters">
      <!-- Generated by JS from scenario list -->
    </div>
    <div id="search-results" class="search-results"></div>
  </div>
</div>
```

Client-side JS: `import('pagefind').then(...)` → initialize Pagefind, wire up search/click/keyboard events, render results with highlighted snippets.

### Step 4: Add search trigger to `MainLayout.astro` header

Place `<SearchUI />` inside the `.site-header` next to the nav.

**Verify:**
1. `npm run build` → `dist/pagefind/` directory exists
2. `npm run preview` → click search icon, search for "Gate", see Titan results

---

## Task 9: Sticky Scene TOC on Chapter Pages

**Objective:** Parse h3 scene headings from rendered chapter content, display as sticky right-side mini-TOC on desktop.

**Files:**
- Modify: `web-app/src/pages/chapters/[...slug].astro`
- Create/modify CSS in: `web-app/src/styles/global.css`

### Approach

The TOC needs to extract h3 headings from the MDX content. Since Astro renders MDX reactively, we can't pre-parse it in the frontmatter. Instead, use client-side JavaScript:

1. After the page loads, scan `.story-reader h3` elements
2. Build a TOC list from their `innerText`
3. Wire up `IntersectionObserver` to highlight the current scene
4. Click-to-scroll navigation

### Layout

- When viewport ≥ 1200px: chapter page uses `grid-template-columns: 1fr 240px` with the TOC in the right column, sticky
- Below 1200px: TOC is hidden (mobile retains centered column)

### CSS additions

```css
.chapter-with-toc {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 240px;
  gap: 48px;
  align-items: start;
}

.chapter-toc {
  position: sticky;
  top: calc(var(--sticky-offset) + 24px);
  font-family: var(--font-ui);
}

.chapter-toc-title {
  font-size: 0.68rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--text-muted);
  margin-bottom: 16px;
}

.chapter-toc-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.chapter-toc-list a {
  display: block;
  padding: 6px 12px;
  font-size: 0.8rem;
  color: var(--text-secondary);
  text-decoration: none;
  border-radius: 6px;
  border-left: 2px solid transparent;
  transition: all var(--transition-fast);
}

.chapter-toc-list a:hover {
  color: var(--text-primary);
  background: var(--bg-tertiary);
}

.chapter-toc-list a.active {
  color: var(--accent);
  border-left-color: var(--accent);
  background: var(--bg-tertiary);
}

@media (max-width: 1199px) {
  .chapter-toc {
    display: none;
  }
}
```

### Client JS (inline in chapter page or as component)

```javascript
document.addEventListener('DOMContentLoaded', () => {
  const headings = document.querySelectorAll('.story-reader h3');
  if (headings.length < 2) return; // Don't show TOC for chapters with <2 scenes

  const article = document.querySelector('article');
  const toc = document.createElement('nav');
  toc.className = 'chapter-toc';
  toc.setAttribute('aria-label', 'Scene navigation');
  toc.innerHTML = '<div class="chapter-toc-title">Scenes</div><ul class="chapter-toc-list"></ul>';
  const list = toc.querySelector('.chapter-toc-list')!;

  headings.forEach((h, i) => {
    // Add id to heading for anchor linking
    const id = `scene-${i}`;
    h.id = id;
    const a = document.createElement('a');
    a.href = `#${id}`;
    a.textContent = h.textContent;
    list.appendChild(a);
  });

  // Wrap article content in grid
  const wrapper = document.createElement('div');
  wrapper.className = 'chapter-with-toc';
  const contentDiv = document.createElement('div');
  // Move all article children into contentDiv
  while (article!.firstChild) contentDiv.appendChild(article!.firstChild);
  wrapper.appendChild(contentDiv);
  wrapper.appendChild(toc);
  article!.appendChild(wrapper);

  // IntersectionObserver for active state
  const links = list.querySelectorAll('a');
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      const id = entry.target.id;
      const link = list.querySelector(`[href="#${id}"]`);
      if (entry.isIntersecting) {
        links.forEach(l => l.classList.remove('active'));
        link?.classList.add('active');
      }
    });
  }, { rootMargin: '-80px 0px -60% 0px' });

  headings.forEach(h => observer.observe(h));
});
```

**Verify:** Open a chapter with 3+ scenes (Sundered World Ch.1 is perfect), see TOC on right, scroll to confirm highlighting

---

## Task 10: Reading Progress Bar

**Objective:** Thin colored bar at top of viewport showing scroll progress through chapter content.

**Files:**
- Modify: `web-app/src/pages/chapters/[...slug].astro` (add progress bar element)
- Add CSS to: `web-app/src/styles/global.css`

### Implementation

Add a `<div id="reading-progress" class="reading-progress"></div>` at the top of the chapter article. Client JS uses `scroll` event to set its width as percentage.

```css
.reading-progress {
  position: fixed;
  top: 0;
  left: 0;
  width: 0%;
  height: 3px;
  background: var(--accent);
  z-index: 200;
  transition: width 0.1s linear;
}
```

```javascript
const progressBar = document.getElementById('reading-progress');
window.addEventListener('scroll', () => {
  const scrollTop = window.scrollY;
  const docHeight = document.documentElement.scrollHeight - window.innerHeight;
  const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
  if (progressBar) progressBar.style.width = `${progress}%`;
});
```

**Verify:** Scroll any chapter, see progress bar fill

---

## Task 11: Continue Reading (localStorage)

**Objective:** Remember last-read chapter per scenario, show "Continue: Chapter X" on homepage cards and scenario hubs.

**Files:**
- Create: `web-app/src/components/ContinueReading.astro` (client-side only)
- Include in: `web-app/src/pages/index.astro`, `web-app/src/pages/[scenario]/index.astro`

### Storage schema

```javascript
// localStorage key: 'danis-backyard-reading'
// Value: { [scenarioSlug]: { slug: string, title: string, timestamp: number } }
```

### On each chapter page view

```javascript
// Inline script on chapter [...slug].astro
const scenario = document.documentElement.dataset.scenario; // set by MainLayout
const data = JSON.parse(localStorage.getItem('danis-backyard-reading') || '{}');
data[scenario] = {
  slug: window.location.pathname,
  title: document.title,
  timestamp: Date.now(),
};
localStorage.setItem('danis-backyard-reading', JSON.stringify(data));
```

### On homepage and scenario hubs

```javascript
// Inline script reads localStorage and populates the .scenario-card-continue slots
document.querySelectorAll('.scenario-card-continue').forEach(el => {
  const scenario = el.dataset.scenario;
  const data = JSON.parse(localStorage.getItem('danis-backyard-reading') || '{}');
  if (data[scenario]) {
    el.textContent = `Continue: ${data[scenario].title}`;
  }
});
```

**Verify:** Visit a chapter, go back to homepage → "Continue" link appears on that scenario's card

---

## Task 12: Almanac Filter Tabs

**Objective:** Add category filter pills at top of scenario almanac pages and combined almanac page, replacing the one-big-scroll approach.

**Files:**
- Modify: `web-app/src/pages/[scenario]/almanac.astro`
- Modify: `web-app/src/pages/almanac/index.astro`
- Add CSS to: `web-app/src/styles/global.css`

### Implementation

Add filter pills above the category grid:

```astro
<div class="filter-tabs" id="almanac-filters">
  <button class="filter-tab active" data-filter="all">All</button>
  {categories.filter(cat => (entriesByCategory[cat] || []).length > 0).map(cat => (
    <button class="filter-tab" data-filter={cat.toLowerCase()}>
      {cat} ({entriesByCategory[cat].length})
    </button>
  ))}
</div>
```

```css
.filter-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 32px;
}

.filter-tab {
  padding: 8px 18px;
  font-size: 0.78rem;
  font-weight: 600;
  font-family: var(--font-ui);
  color: var(--text-secondary);
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 999px;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.filter-tab:hover {
  color: var(--text-primary);
  border-color: var(--border-color-hover);
}

.filter-tab.active {
  color: var(--accent);
  border-color: var(--accent);
  background: rgba(var(--accent-rgb), 0.1);
}
```

Client JS hides/shows category sections based on active filter.

**Verify:** Click filter tabs on Titan almanac → only matching category shown

---

## Task 13: Combined Pages — Scenario Filter Tabs

**Objective:** Add scenario filter tabs to `/chapters` and `/almanac` combined pages.

**Files:**
- Modify: `web-app/src/pages/chapters/index.astro`
- Modify: `web-app/src/pages/almanac/index.astro`

### Implementation

Same filter-tab pattern as Task 12, but with scenario names:

```astro
<div class="filter-tabs">
  <button class="filter-tab active" data-filter="all">All Scenarios</button>
  {scenarioList.map(s => (
    <button class="filter-tab" data-filter={s.slug}>
      {s.title}
    </button>
  ))}
</div>
```

Each content section gets a `data-scenario` attribute; JS show/hides on filter change.

**Verify:** Visit `/chapters`, click "Titan" filter → only Titan chapters shown

---

## Task 14: View Transitions

**Objective:** Add smooth page-to-page crossfade transitions.

**Files:**
- Modify: `web-app/src/layouts/MainLayout.astro`

### Implementation

Add the ViewTransitions component to `<head>`:

```astro
---
import { ViewTransitions } from 'astro:transitions';
---

<head>
  <ViewTransitions />
  <!-- ... existing head content ... -->
</head>
```

That's it. Astro handles the rest. The `astro:after-swap` event already used by existing scripts (LinkPreview, ImageLightbox, Mermaid) will continue to work.

**Verify:** Navigate between pages → pages crossfade instead of hard-cut

---

## Task 15: Final Integration Testing

**Objective:** Verify everything works end-to-end.

```bash
cd web-app
npm run sync
npm run build
npm run preview
```

### Validation Checklist

- [ ] `npm run sync` completes without errors
- [ ] `npm run build` completes with 0 errors, `dist/pagefind/` exists
- [ ] Homepage renders 4 scenario cards with chapter/entry counts
- [ ] All 4 scenario hubs accessible and themed correctly
- [ ] Chapter lists populate for all scenarios
- [ ] Almanac pages render for all scenarios with filter tabs working
- [ ] Chapter reader shows sticky scene TOC on desktop (hidden on mobile)
- [ ] Reading progress bar fills as you scroll
- [ ] Continue-reading appears on cards after visiting a chapter
- [ ] Global search opens overlay, filters by scenario, returns results
- [ ] View Transitions smooth between pages
- [ ] Combined `/chapters` and `/almanac` pages show scenario filter tabs
- [ ] Wikilinks, link preview, image lightbox still work
- [ ] No 404s on any content page

### Commit

```bash
git add -A
git commit -m "feat: 4-scenario support + reader-first UI (scene TOC, search, progress bar, continue-reading, filter tabs, view transitions)"
```

---

## Files Changed Summary

| File | Change |
|:-----|:-------|
| `web-app/src/lib/scenarios.ts` | **Created** — central scenario registry |
| `web-app/src/pages/index.astro` | **Rewritten** — 4-card grid with counts + continue slot |
| `web-app/src/pages/[scenario]/index.astro` | **Rewritten** — dynamic from registry |
| `web-app/src/pages/[scenario]/chapters.astro` | **Modified** — dynamic getStaticPaths |
| `web-app/src/pages/[scenario]/almanac.astro` | **Modified** — dynamic + filter tabs |
| `web-app/src/pages/chapters/index.astro` | **Modified** — scenario filter tabs |
| `web-app/src/pages/almanac/index.astro` | **Modified** — scenario filter tabs |
| `web-app/src/pages/chapters/[...slug].astro` | **Modified** — scene TOC + progress bar + localStorage write |
| `web-app/src/layouts/MainLayout.astro` | **Modified** — dynamic scenario detection + ViewTransitions + search trigger |
| `web-app/src/components/SearchUI.astro` | **Created** — Pagefind search overlay |
| `web-app/src/components/ContinueReading.astro` | **Created** — localStorage continue-reading |
| `web-app/src/styles/global.css` | **Modified** — grid styles, TOC styles, progress bar, filter tabs, removed splitscreen |
| `web-app/public/images/card-disco.jpg` | **Created** — placeholder |
| `web-app/public/images/card-the-sundered-world.jpg` | **Created** — placeholder |
| `web-app/scripts/sync-vault.mjs` | **Modified** — scenario slug normalization |
| `web-app/astro.config.mjs` | **Modified** — Pagefind post-build integration |
| `web-app/package.json` | **Modified** — pagefind devDependency |

---

## Risks & Open Questions

1. **Card images for Disco/Sundered World:** Placeholder gradients. Swap for real art later.
2. **Scene TOC relies on h3 elements:** If chapters change heading structure, TOC breaks. All current chapters use h3 for scene titles — verify this holds.
3. **Pagefind post-build hook:** Ensure `pagefind` binary is available in build environment (npm install works; CI may need explicit install step).
4. **View Transitions + Mermaid:** Mermaid renders on `astro:after-swap`. View Transitions fire the same event, so this should be fine, but test explicitly.
5. **Continue-reading across rebuilds:** localStorage keys on scenario slug, not URL. If slugs change, data is orphaned. Slugs are stable.
6. **The Sundered World has 1 chapter:** Scene TOC will not appear (< 2 h3s detected). Reading progress bar works fine. Chapter list shows single entry. All graceful.
