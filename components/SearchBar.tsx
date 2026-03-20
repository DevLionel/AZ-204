'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import type { Navigation } from '@/lib/content';

// Lichtgewicht titel-index (gebouwd uit navigation prop)
interface TitleEntry {
  moduleSlug: string;
  moduleTitle: string;
  moduleIcon: string;
  docTitle: string;
  anchorId: string;
  subModuleTitle?: string;
}

// Volledige zoekindex (lazy geladen uit search-index.json)
interface FullEntry extends Omit<TitleEntry, 'moduleIcon'> {
  text: string;
}

interface SearchResult extends TitleEntry {
  snippet?: string;
  matchType: 'title' | 'content';
}

const MODULE_ICONS: Record<string, string> = {
  requirements: '📋',
  'virtual-machines': '🖥️',
  'azure-app-service': '🌐',
  containers: '📦',
  'azure-function-apps': '⚡',
  'azure-storage-accounts': '🗄️',
  cosmosdb: '🌌',
  'azure-authentication': '🔐',
  'data-encryption': '🔒',
  caching: '⚡',
  troubleshoot: '🔍',
  monitoring: '📊',
  consuming: '🔌',
  'event-based': '📡',
  messaging: '💬',
  notes: '📝',
  prepare: '🎓',
};

function getIcon(slug: string): string {
  for (const [key, icon] of Object.entries(MODULE_ICONS)) {
    if (slug.includes(key)) return icon;
  }
  return '📄';
}

function highlight(text: string, query: string): React.ReactNode {
  if (!query.trim()) return text;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-yellow-200 text-yellow-900 rounded px-0.5">
        {text.slice(idx, idx + query.length)}
      </mark>
      {text.slice(idx + query.length)}
    </>
  );
}

function getSnippet(text: string, query: string, radius = 120): string {
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text.slice(0, radius) + '…';
  const start = Math.max(0, idx - radius);
  const end = Math.min(text.length, idx + query.length + radius);
  return (start > 0 ? '…' : '') + text.slice(start, end) + (end < text.length ? '…' : '');
}

function buildTitleIndex(navigation: Navigation): TitleEntry[] {
  const entries: TitleEntry[] = [];
  for (const mod of navigation.modules) {
    const icon = getIcon(mod.slug);
    for (const doc of mod.documents) {
      entries.push({ moduleSlug: mod.slug, moduleTitle: mod.title, moduleIcon: icon, docTitle: doc.title, anchorId: doc.anchorId });
    }
    for (const sub of mod.subModules) {
      for (const doc of sub.documents) {
        entries.push({ moduleSlug: mod.slug, moduleTitle: mod.title, moduleIcon: icon, docTitle: doc.title, anchorId: doc.anchorId, subModuleTitle: sub.title });
      }
    }
  }
  return entries;
}

export default function SearchBar({ navigation }: { navigation: Navigation }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [indexLoaded, setIndexLoaded] = useState(false);
  const [indexLoading, setIndexLoading] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const titleIndexRef = useRef<TitleEntry[]>(buildTitleIndex(navigation));
  const fullIndexRef = useRef<FullEntry[] | null>(null);

  // Laad de volledige zoekindex de eerste keer dat de gebruiker typt
  const loadFullIndex = useCallback(async () => {
    if (fullIndexRef.current || indexLoading) return;
    setIndexLoading(true);
    try {
      const res = await fetch('/content/search-index.json');
      if (res.ok) {
        fullIndexRef.current = await res.json();
        setIndexLoaded(true);
      }
    } catch {
      // Valt terug op titel-zoeken
    } finally {
      setIndexLoading(false);
    }
  }, [indexLoading]);

  const search = useCallback((q: string) => {
    const term = q.trim().toLowerCase();
    if (!term) { setResults([]); setIsOpen(false); return; }

    const seen = new Set<string>();
    const out: SearchResult[] = [];

    // 1. Titelmatches (altijd beschikbaar)
    for (const e of titleIndexRef.current) {
      if (
        e.docTitle.toLowerCase().includes(term) ||
        e.moduleTitle.toLowerCase().includes(term) ||
        (e.subModuleTitle?.toLowerCase().includes(term) ?? false)
      ) {
        seen.add(e.anchorId);
        out.push({ ...e, matchType: 'title' });
      }
    }

    // 2. Inhoudsmatches (alleen als de volledige index geladen is)
    if (fullIndexRef.current) {
      for (const e of fullIndexRef.current) {
        if (seen.has(e.anchorId)) continue;
        if (e.text.toLowerCase().includes(term)) {
          seen.add(e.anchorId);
          out.push({
            moduleSlug: e.moduleSlug,
            moduleTitle: e.moduleTitle,
            moduleIcon: getIcon(e.moduleSlug),
            docTitle: e.docTitle,
            anchorId: e.anchorId,
            subModuleTitle: e.subModuleTitle,
            snippet: getSnippet(e.text, q.trim()),
            matchType: 'content',
          });
        }
      }
    }

    setResults(out.slice(0, 25));
    setIsOpen(true);
  }, []);

  // Herzoek zodra de volledige index geladen is
  useEffect(() => {
    if (indexLoaded && query.trim()) search(query);
  }, [indexLoaded, query, search]);

  useEffect(() => {
    search(query);
  }, [query, search]);

  // Sluit resultaten bij klik buiten
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    if (val.trim() && !fullIndexRef.current) loadFullIndex();
  };

  const handleClear = () => {
    setQuery(''); setResults([]); setIsOpen(false);
    inputRef.current?.focus();
  };

  const handleResultClick = () => { setIsOpen(false); setQuery(''); };

  const titleCount = results.filter(r => r.matchType === 'title').length;
  const contentCount = results.filter(r => r.matchType === 'content').length;

  return (
    <div ref={containerRef} className="relative w-full max-w-2xl mb-8">
      {/* Zoekbalk */}
      <div className="relative flex items-center bg-white rounded-xl border border-slate-200 shadow-sm focus-within:border-azure focus-within:ring-2 focus-within:ring-azure/20 transition-all">
        <span className="absolute left-4 text-slate-400 pointer-events-none">
          {indexLoading ? (
            <span className="inline-block w-4 h-4 border-2 border-slate-300 border-t-azure rounded-full animate-spin" />
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
            </svg>
          )}
        </span>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleChange}
          onFocus={() => query.trim() && setIsOpen(true)}
          placeholder="Enter Search"
          className="w-full bg-transparent pl-11 pr-10 py-3.5 text-slate-800 placeholder-slate-400 text-sm rounded-xl outline-none"
        />
        {query && (
          <button
            onClick={handleClear}
            className="absolute right-3 w-6 h-6 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 text-xs transition-colors"
            aria-label="Wissen"
          >
            ✕
          </button>
        )}
      </div>

      {/* Resultatenlijst */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden z-30 max-h-120 overflow-y-auto">
          {results.length === 0 ? (
            <div className="px-5 py-6 text-center text-slate-400 text-sm">
              {indexLoading
                ? 'Documenten doorzoeken…'
                : <><strong className="text-slate-600">"{query}"</strong> niet gevonden</>
              }
            </div>
          ) : (
            <>
              <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <span className="text-xs text-slate-500">
                  {results.length} {results.length !== 1 ? 'resultaten' : 'resultaat'}
                  {titleCount > 0 && contentCount > 0 && (
                    <span className="text-slate-400"> · {titleCount} in titels, {contentCount} in inhoud</span>
                  )}
                </span>
                {!fullIndexRef.current && (
                  <span className="text-xs text-slate-400 italic">Inhoud wordt geladen…</span>
                )}
              </div>
              <ul>
                {results.map((r, i) => (
                  <li key={`${r.anchorId}-${i}`} className="border-b border-slate-50 last:border-0">
                    <Link
                      href={`/module/${r.moduleSlug}#${r.anchorId}`}
                      onClick={handleResultClick}
                      className="flex items-start gap-3 px-4 py-3 hover:bg-slate-50 transition-colors group"
                    >
                      <span className="text-lg shrink-0 mt-0.5">{r.moduleIcon}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-slate-400 mb-0.5 truncate">
                          {highlight(r.moduleTitle, query)}
                          {r.subModuleTitle && (
                            <> <span className="text-slate-300">›</span> {highlight(r.subModuleTitle, query)}</>
                          )}
                        </p>
                        <p className="text-sm font-medium text-slate-700 group-hover:text-azure transition-colors truncate">
                          {highlight(r.docTitle, query)}
                        </p>
                        {r.snippet && (
                          <p className="text-xs text-slate-400 mt-1 leading-relaxed line-clamp-2">
                            {highlight(r.snippet, query)}
                          </p>
                        )}
                      </div>
                      <span className={`text-xs px-1.5 py-0.5 rounded shrink-0 mt-0.5 font-medium ${
                        r.matchType === 'title'
                          ? 'bg-azure/10 text-azure'
                          : 'bg-slate-100 text-slate-400'
                      }`}>
                        {r.matchType === 'title' ? 'titel' : 'inhoud'}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}
    </div>
  );
}
