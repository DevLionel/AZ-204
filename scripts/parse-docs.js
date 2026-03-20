#!/usr/bin/env node
/**
 * parse-docs.js
 * Leest alle .docx bestanden uit de bovenliggende mappen,
 * converteert ze naar HTML met mammoth, en slaat de output
 * op als JSON in public/content/.
 */

const mammoth = require('mammoth');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT_DIR = path.resolve(__dirname, '../../'); // Azure AZ-204 map
const OUTPUT_DIR = path.resolve(__dirname, '../public/content');
const IMAGES_DIR = path.resolve(__dirname, '../public/content/images');

// Hulpfunctie: maak een URL-vriendelijke slug van een bestandsnaam
function toSlug(name) {
  return name
    .toLowerCase()
    .replace(/^\d+\.\s*/, '')   // verwijder "01. " prefix
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Hulpfunctie: verwijder nummering van displaynaam
function toDisplayName(name) {
  return name.replace(/^\d+\.\s*/, '').trim();
}

// Hulpfunctie: maak anchor ID van document naam
function toAnchorId(folderSlug, docName) {
  const docSlug = toSlug(docName.replace(/\.docx?$/i, ''));
  return `${folderSlug}--${docSlug}`;
}

// Strip HTML-tags naar platte tekst voor de zoekindex
function stripHtml(html) {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

async function parseDocx(filePath) {
  try {
    console.log(`  Parsing: ${path.basename(filePath)}`);

    if (!fs.existsSync(IMAGES_DIR)) {
      fs.mkdirSync(IMAGES_DIR, { recursive: true });
    }

    const result = await mammoth.convertToHtml(
      { path: filePath },
      {
        convertImage: mammoth.images.imgElement(async (image) => {
          const buffer = await image.read();
          const ext = image.contentType.split('/')[1] || 'png';
          const hash = crypto.createHash('md5').update(buffer).digest('hex');
          const filename = `${hash}.${ext}`;
          const imgPath = path.join(IMAGES_DIR, filename);
          if (!fs.existsSync(imgPath)) {
            fs.writeFileSync(imgPath, buffer);
          }
          return { src: `/content/images/${filename}` };
        }),
      }
    );
    return result.value;
  } catch (err) {
    console.error(`  FOUT bij ${filePath}: ${err.message}`);
    return `<p class="text-red-500">Fout bij laden van document: ${err.message}</p>`;
  }
}

async function processModule(folderPath, folderName, searchEntries) {
  const slug = toSlug(folderName);
  const displayName = toDisplayName(folderName);
  const outputModuleDir = path.join(OUTPUT_DIR, slug);

  if (!fs.existsSync(outputModuleDir)) {
    fs.mkdirSync(outputModuleDir, { recursive: true });
  }

  const items = fs.readdirSync(folderPath);
  const docxFiles = items.filter(f => f.match(/\.docx?$/i));
  const subDirs = items.filter(f => {
    try {
      return fs.statSync(path.join(folderPath, f)).isDirectory();
    } catch { return false; }
  });

  const documents = [];

  // Verwerk directe .docx bestanden
  for (const docFile of docxFiles.sort()) {
    const docPath = path.join(folderPath, docFile);
    const docName = docFile.replace(/\.docx?$/i, '');
    const anchorId = toAnchorId(slug, docFile);
    const html = await parseDocx(docPath);

    const docOutputPath = path.join(outputModuleDir, `${toSlug(docName)}.json`);
    fs.writeFileSync(docOutputPath, JSON.stringify({ title: docName, html, anchorId }, null, 2));

    documents.push({ title: docName, anchorId, slug: toSlug(docName) });
    searchEntries.push({ moduleSlug: slug, moduleTitle: displayName, docTitle: docName, anchorId, text: stripHtml(html) });
  }

  // Verwerk sub-mappen (voor "Prepare for renewal assessment")
  const subModules = [];
  for (const subDir of subDirs.sort()) {
    const subDirPath = path.join(folderPath, subDir);
    const subSlug = toSlug(subDir);
    const subDisplayName = toDisplayName(subDir);
    const subDocs = [];

    const subItems = fs.readdirSync(subDirPath).filter(f => f.match(/\.docx?$/i)).sort();
    for (const docFile of subItems) {
      const docPath = path.join(subDirPath, docFile);
      const docName = docFile.replace(/\.docx?$/i, '');
      const anchorId = toAnchorId(`${slug}--${subSlug}`, docFile);
      const html = await parseDocx(docPath);

      const docOutputPath = path.join(outputModuleDir, `${subSlug}--${toSlug(docName)}.json`);
      fs.writeFileSync(docOutputPath, JSON.stringify({ title: docName, html, anchorId }, null, 2));

      subDocs.push({ title: docName, anchorId, slug: `${subSlug}--${toSlug(docName)}` });
      searchEntries.push({ moduleSlug: slug, moduleTitle: displayName, docTitle: docName, anchorId, subModuleTitle: subDisplayName, text: stripHtml(html) });
    }

    subModules.push({ title: subDisplayName, slug: subSlug, documents: subDocs });
  }

  return { title: displayName, slug, documents, subModules };
}

async function main() {
  console.log('=== AZ-204 Document Parser ===\n');

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const rootItems = fs.readdirSync(ROOT_DIR).sort();
  const modules = [];
  const searchEntries = [];

  // Negeer de az-204-site map zelf en het claude.md bestand
  const skipItems = ['az-204-site', 'claude.md', '.git', 'node_modules'];

  for (const item of rootItems) {
    if (skipItems.includes(item)) continue;
    const itemPath = path.join(ROOT_DIR, item);

    let isDir = false;
    try {
      isDir = fs.statSync(itemPath).isDirectory();
    } catch { continue; }

    if (!isDir) continue;

    console.log(`\nModule: ${item}`);
    const moduleData = await processModule(itemPath, item, searchEntries);
    modules.push(moduleData);
  }

  // Sla de navigatiestructuur op
  const navPath = path.join(OUTPUT_DIR, 'navigation.json');
  fs.writeFileSync(navPath, JSON.stringify({ modules }, null, 2));

  // Sla de zoekindex op
  const searchPath = path.join(OUTPUT_DIR, 'search-index.json');
  fs.writeFileSync(searchPath, JSON.stringify(searchEntries));

  console.log(`\n✓ Klaar! Navigatie opgeslagen in ${navPath}`);
  console.log(`✓ Zoekindex opgeslagen in ${searchPath} (${searchEntries.length} documenten geïndexeerd)`);
  console.log(`✓ ${modules.length} modules verwerkt`);
}

main().catch(console.error);
