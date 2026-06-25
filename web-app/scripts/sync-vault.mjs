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

const SCENARIOS = ['genesis', 'titan'];

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
  
  // 1. Clean up old attachments directory if it exists
  console.log('Cleaning up old attachments folder...');
  if (fs.existsSync(DEST_PUBLIC_ATTACHMENTS)) {
    fs.rmSync(DEST_PUBLIC_ATTACHMENTS, { recursive: true, force: true });
    console.log('Removed old attachments folder from web-app.');
  }

  // 2. Clear content folders
  console.log('Cleaning destination content folders...');
  cleanDir(DEST_CONTENT_CHAPTERS);
  cleanDir(DEST_CONTENT_ALMANAC);

  // 3. Process each scenario
  for (const scenario of SCENARIOS) {
    const scenarioUpper = scenario === 'genesis' ? 'Genesis' : 'Titan';
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
      fs.writeFileSync(destPath, content, 'utf8');
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
            fs.writeFileSync(destPath, content, 'utf8');
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
