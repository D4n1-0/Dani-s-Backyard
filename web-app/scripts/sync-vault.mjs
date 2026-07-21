import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const VAULT_ROOT = path.resolve(__dirname, '../../The Stories');
const WEB_APP_ROOT = path.resolve(__dirname, '../');

const DEST_CONTENT_CHAPTERS = path.join(WEB_APP_ROOT, 'src/content/chapters');
const DEST_CONTENT_ALMANAC = path.join(WEB_APP_ROOT, 'src/content/almanac');
const DEST_PUBLIC_ATTACHMENTS = path.join(WEB_APP_ROOT, 'public/_attachments');
const DEST_ROOT_ATTACHMENTS = path.join(__dirname, '../../synced-attachments');

const SCENARIOS = [
  { slug: 'genesis', folder: 'Genesis' },
  { slug: 'titan', folder: 'Titan' },
  { slug: 'disco', folder: 'Disco' },
  { slug: 'the-sundered-world', folder: 'The Sundered World' },
];

// Map display-name scenario values (as found in frontmatter) to URL slugs.
const SCENARIO_SLUG_MAP = {
  'Genesis': 'genesis',
  'Titan': 'titan',
  'Disco': 'disco',
  'The Sundered World': 'the-sundered-world',
};

function normalizeScenarioField(content, scenarioName) {
  // If the file already has a `scenario:` field, normalize the value to a slug.
  if (/^scenario:/m.test(content)) {
    return content.replace(
      /^scenario:\s*["']?([^"'\n]+)["']?$/m,
      (match, name) => {
        const slug = SCENARIO_SLUG_MAP[name.trim()] || slugify(name);
        return `scenario: "${slug}"`;
      }
    );
  }
  // Otherwise, inject the slug at the end of the frontmatter block.
  const slug = SCENARIO_SLUG_MAP[scenarioName] || slugify(scenarioName);
  return content.replace(
    /^---\s*\n([\s\S]*?\n)---\s*\n/,
    (match, body) => `---\n${body}scenario: "${slug}"\n---\n`
  );
}

function slugify(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove accents
    .replace(/[^a-z0-9\s-]/g, '')     // remove non-alphanumeric except space and hyphen
    .trim()
    .replace(/[\s_]+/g, '-')          // replace spaces with hyphens
    .replace(/-+/g, '-');             // replace multiple hyphens with single
}

// Recursively find files
function getFilesRec(dir, ext = '.md') {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getFilesRec(filePath, ext));
    } else if (filePath.endsWith(ext)) {
      results.push(filePath);
    }
  });
  return results;
}

// Clean target directory
function cleanDir(dir) {
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
  fs.mkdirSync(dir, { recursive: true });
}

async function main() {
  console.log('--- Starting Vault Sync ---');
  // 1. Sync attachments to public/_attachments and root synced-attachments
  console.log('Syncing attachments to web-app public/_attachments and root synced-attachments...');
  const srcAttachments = path.join(VAULT_ROOT, '_attachments');
  if (fs.existsSync(srcAttachments)) {
    if (!fs.existsSync(DEST_PUBLIC_ATTACHMENTS)) {
      fs.mkdirSync(DEST_PUBLIC_ATTACHMENTS, { recursive: true });
    }
    if (!fs.existsSync(DEST_ROOT_ATTACHMENTS)) {
      fs.mkdirSync(DEST_ROOT_ATTACHMENTS, { recursive: true });
    }
    const files = fs.readdirSync(srcAttachments);
    let copyCount = 0;
    files.forEach(file => {
      const srcFile = path.join(srcAttachments, file);
      const destFilePublic = path.join(DEST_PUBLIC_ATTACHMENTS, file);
      const destFileRoot = path.join(DEST_ROOT_ATTACHMENTS, file);
      if (fs.statSync(srcFile).isFile()) {
        fs.copyFileSync(srcFile, destFilePublic);
        fs.copyFileSync(srcFile, destFileRoot);
        copyCount++;
      }
    });
    console.log(`Copied ${copyCount} attachments to public/_attachments/ and synced-attachments/`);
  } else {
    console.warn(`No attachments folder found at ${srcAttachments}`);
  }

  // 2. Clear content folders
  console.log('Cleaning destination content folders...');
  cleanDir(DEST_CONTENT_CHAPTERS);
  cleanDir(DEST_CONTENT_ALMANAC);

  // 3. Process each scenario
  for (const { slug: scenario, folder: scenarioUpper } of SCENARIOS) {
    console.log(`Processing scenario: ${scenarioUpper}...`);
    
    // Find the scenario root folder in Obsidian (e.g. "The Stories/Story/Genesis")
    const scenarioVaultRoot = path.join(VAULT_ROOT, 'Story', scenarioUpper);
    
    if (!fs.existsSync(scenarioVaultRoot)) {
      console.error(`Error: Scenario root not found at ${scenarioVaultRoot}`);
      continue;
    }
    
    // Chapters
    const chaptersSrcDir = path.join(scenarioVaultRoot, 'Story');
    const chaptersDestDir = path.join(DEST_CONTENT_CHAPTERS, scenario);
    fs.mkdirSync(chaptersDestDir, { recursive: true });
    
    const chapterFiles = getFilesRec(chaptersSrcDir, '.md');
    console.log(`Found ${chapterFiles.length} chapter files for ${scenarioUpper}.`);
    
    chapterFiles.forEach(filePath => {
      const destName = slugify(path.basename(filePath, '.md')) + '.md';

      const destPath = path.join(chaptersDestDir, destName);
      const content = fs.readFileSync(filePath, 'utf8');
      fs.writeFileSync(destPath, normalizeScenarioField(content, scenarioUpper), 'utf8');
    });
    
    // Almanac
    const almanacSrcDir = path.join(scenarioVaultRoot, 'Almanac');
    const almanacDestDir = path.join(DEST_CONTENT_ALMANAC, scenario);
    fs.mkdirSync(almanacDestDir, { recursive: true });
    
    if (fs.existsSync(almanacSrcDir)) {
      // Find all categories
      const categories = fs.readdirSync(almanacSrcDir);
      categories.forEach(cat => {
        const catPath = path.join(almanacSrcDir, cat);
        if (fs.statSync(catPath).isDirectory()) {
          const catLower = cat.toLowerCase();
          const catDestPath = path.join(almanacDestDir, catLower);
          fs.mkdirSync(catDestPath, { recursive: true });
          
          const almanacFiles = getFilesRec(catPath, '.md');
          console.log(`Found ${almanacFiles.length} files under Almanac/${cat} for ${scenarioUpper}.`);
          
          almanacFiles.forEach(filePath => {
            const fileName = path.basename(filePath, '.md');
            const destName = slugify(fileName) + '.md';
            const destPath = path.join(catDestPath, destName);

            const content = fs.readFileSync(filePath, 'utf8');
            fs.writeFileSync(destPath, normalizeScenarioField(content, scenarioUpper), 'utf8');
          });
        }
      });
    } else {
      console.warn(`No Almanac folder found for ${scenarioUpper} at ${almanacSrcDir}`);
    }
  }
  
  console.log('--- Vault Sync Completed! ---');
}

main().catch(console.error);
