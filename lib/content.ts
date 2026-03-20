import fs from 'fs';
import path from 'path';

const CONTENT_DIR = path.join(process.cwd(), 'public', 'content');

export interface DocumentMeta {
  title: string;
  anchorId: string;
  slug: string;
}

export interface SubModule {
  title: string;
  slug: string;
  documents: DocumentMeta[];
}

export interface Module {
  title: string;
  slug: string;
  documents: DocumentMeta[];
  subModules: SubModule[];
}

export interface Navigation {
  modules: Module[];
}

export interface DocumentContent {
  title: string;
  html: string;
  anchorId: string;
}

export function getNavigation(): Navigation | null {
  const navPath = path.join(CONTENT_DIR, 'navigation.json');
  if (!fs.existsSync(navPath)) return null;
  const raw = fs.readFileSync(navPath, 'utf-8');
  return JSON.parse(raw) as Navigation;
}

export function getModuleBySlug(slug: string): Module | null {
  const nav = getNavigation();
  if (!nav) return null;
  return nav.modules.find(m => m.slug === slug) ?? null;
}

export function getDocumentContent(moduleSlug: string, docSlug: string): DocumentContent | null {
  const filePath = path.join(CONTENT_DIR, moduleSlug, `${docSlug}.json`);
  if (!fs.existsSync(filePath)) return null;
  const raw = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(raw) as DocumentContent;
}

export function getAllModuleSlugs(): string[] {
  const nav = getNavigation();
  if (!nav) return [];
  return nav.modules.map(m => m.slug);
}

/** Alle documenten van een module inclusief sub-modules plat */
export function getAllDocumentsForModule(module: Module): Array<DocumentMeta & { groupTitle?: string }> {
  const docs: Array<DocumentMeta & { groupTitle?: string }> = [];
  for (const doc of module.documents) {
    docs.push(doc);
  }
  for (const sub of module.subModules) {
    for (const doc of sub.documents) {
      docs.push({ ...doc, groupTitle: sub.title });
    }
  }
  return docs;
}
