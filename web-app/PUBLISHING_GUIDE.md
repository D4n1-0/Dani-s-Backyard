# Publishing Guide: Vault to Companion Site

This guide explains how to copy new chapters and Almanac entries from your raw Obsidian vault (`The Stories/`) into the web application (`web-app/`) and format them for the website.

---

## 📂 Folder Mapping

When you want to publish new content from Obsidian, copy the files from `The Stories/` to their corresponding location in `web-app/src/content/`:

| Source in Obsidian (`The Stories/`) | Destination in Web App (`web-app/src/content/`) | Example Target Path |
| :--- | :--- | :--- |
| `[Scenario]/Story/[Part]/[Chapter].md` | `chapters/[scenario]/[slug].md` | `src/content/chapters/genesis/chapter-01.md` |
| `[Scenario]/Almanac/[Category]/[Entry].md` | `almanac/[scenario]/[category]/[slug].md` | `src/content/almanac/genesis/characters/alice-hartley.md` |

---

## 🛠️ Auto-Format mapping (Frontmatter)

The web app is configured to automatically parse Obsidian frontmatter during the build phase. You do **not** need to manually rename frontmatter keys. The system maps them as follows:

### Chapters mapping:
- `chapter_title` ➡️ `title`
- `chapter_number` ➡️ `chapterNumber` (automatically converted to a number)
- `date_in_world` ➡️ `releaseDate`
- `outcome` ➡️ `description`
- `scenario` ➡️ `scenario` (required)

### Almanac mapping:
- `type` (e.g. `character`) ➡️ `category` (automatically converted to `Characters`)
- `scenario` ➡️ `scenario` (required)
- `title` ➡️ `title`
- `aliases` ➡️ `aliases`
- `tags` ➡️ `tags`

---

## 🔗 Wikilink Resolution (`[[Link]]`)

Our custom markdown parser converts standard double-bracket Obsidian links (`[[Target]]` or `[[Target|Label]]`) into HTML links on the website:
1. If the link starts with the word `"Chapter"` (case-insensitive), it routes to `/chapters/[flat-slug]` (e.g., `/chapters/chapter-01-adam-and-eve`).
2. Otherwise, it routes to the Almanac `/almanac/[flat-slug]` (e.g., `/almanac/alice-hartley`).

*Note: Since the router resolves both nested and flat URLs, you can use flat wikilinks like `[[Alice Hartley]]` inside your chapters, and they will link correctly to `/almanac/alice-hartley`!*

---

## 🚀 Commands

Navigate to the `web-app/` directory in your terminal to run these commands:

### 1. Run local development server
To preview your companion site locally:
```bash
npm run dev
```
Open your browser to `http://localhost:4321/` to view the site.

### 2. Build for production (GitHub Pages)
To verify that everything compiles correctly and generate static HTML files:
```bash
npm run build
```
The static files will be generated in `web-app/dist/` ready to be pushed to GitHub Pages.
