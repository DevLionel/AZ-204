'use client';

import { useState, useEffect } from 'react';

interface Props {
  moduleSlug: string;
  docSlug: string;
  anchorId: string;
  title: string;
  index: number;
  groupTitle?: string;
}

export default function DocumentContent({ moduleSlug, docSlug, anchorId, title, index, groupTitle }: Props) {
  const [html, setHtml] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [visible, setVisible] = useState(false);

  // IntersectionObserver: only fetch when section scrolls into view
  useEffect(() => {
    const el = document.getElementById(anchorId);
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect(); } },
      { rootMargin: '200px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [anchorId]);

  useEffect(() => {
    if (!visible || html !== null) return;
    setLoading(true);
    fetch(`/content/${moduleSlug}/${docSlug}.json`)
      .then(r => r.json())
      .then(data => setHtml(data.html))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [visible, moduleSlug, docSlug, html]);

  return (
    <section
      id={anchorId}
      data-section
      className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden"
    >
      {/* Header */}
      <div className="px-8 py-6 border-b border-slate-100 bg-slate-50/80 flex items-start gap-4">
        <div className="w-8 h-8 rounded-full bg-azure text-white flex items-center justify-center text-sm font-bold shrink-0 mt-0.5">
          {index + 1}
        </div>
        <div className="flex-1 min-w-0">
          {groupTitle && (
            <p className="text-xs text-azure font-semibold uppercase tracking-wider mb-1">{groupTitle}</p>
          )}
          <h2 className="text-lg font-bold text-slate-800 leading-snug">{title}</h2>
        </div>
        <a href={`#${anchorId}`} className="text-slate-400 hover:text-azure text-xs transition-colors shrink-0 mt-1" title="Directe link">#</a>
      </div>

      {/* Content */}
      <div className="px-8 py-8">
        {loading && (
          <div className="flex items-center gap-3 text-slate-400 text-sm py-8">
            <span className="inline-block w-5 h-5 border-2 border-slate-200 border-t-azure rounded-full animate-spin" />
            Inhoud laden…
          </div>
        )}
        {error && <p className="text-red-400 italic text-sm">Document kon niet worden geladen.</p>}
        {html && (
          <div
            className="prose prose-slate max-w-none prose-headings:scroll-mt-20"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        )}
        {!loading && !error && !html && !visible && (
          <div className="h-24 bg-slate-50 rounded-lg animate-pulse" />
        )}
      </div>
    </section>
  );
}
