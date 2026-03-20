'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { Navigation, SubModule } from '@/lib/content';

interface SidebarProps {
  navigation: Navigation;
}

// Azure module iconen op basis van trefwoorden
function getModuleIcon(title: string): string {
  const t = title.toLowerCase();
  if (t.includes('virtual machine')) return '🖥️';
  if (t.includes('app service')) return '🌐';
  if (t.includes('container')) return '📦';
  if (t.includes('function')) return '⚡';
  if (t.includes('storage')) return '🗄️';
  if (t.includes('cosmos')) return '🌌';
  if (t.includes('auth')) return '🔐';
  if (t.includes('encrypt')) return '🔒';
  if (t.includes('cach') || t.includes('cdn')) return '⚡';
  if (t.includes('insight') || t.includes('troubleshoot')) return '🔍';
  if (t.includes('monitor') || t.includes('log')) return '📊';
  if (t.includes('consum') || t.includes('api')) return '🔌';
  if (t.includes('event')) return '📡';
  if (t.includes('messag') || t.includes('queue')) return '💬';
  if (t.includes('note')) return '📝';
  if (t.includes('require')) return '📋';
  if (t.includes('renew') || t.includes('prepare') || t.includes('assess')) return '🎓';
  return '📄';
}

export default function Sidebar({ navigation }: SidebarProps) {
  const pathname = usePathname();
  const [openModules, setOpenModules] = useState<Set<string>>(new Set());
  const [openSubModules, setOpenSubModules] = useState<Set<string>>(new Set());
  const [activeAnchor, setActiveAnchor] = useState<string>('');
  const [mobileOpen, setMobileOpen] = useState(false);

  // Open de huidige module automatisch
  useEffect(() => {
    const currentSlug = pathname.split('/')[2];
    if (currentSlug) {
      setOpenModules(prev => new Set([...prev, currentSlug]));
    }
  }, [pathname]);

  // IntersectionObserver voor actieve sectie
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveAnchor(entry.target.id);
            break;
          }
        }
      },
      { rootMargin: '-80px 0px -60% 0px', threshold: 0 }
    );

    const sections = document.querySelectorAll('[data-section]');
    sections.forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, [pathname]);

  const toggleModule = useCallback((slug: string) => {
    setOpenModules(prev => {
      const next = new Set(prev);
      if (next.has(slug)) { next.delete(slug); } else { next.add(slug); }
      return next;
    });
  }, []);

  const toggleSubModule = useCallback((key: string) => {
    setOpenSubModules(prev => {
      const next = new Set(prev);
      if (next.has(key)) { next.delete(key); } else { next.add(key); }
      return next;
    });
  }, []);

  const handleAnchorClick = (moduleSlug: string, anchorId: string) => {
    setMobileOpen(false);
    // Als we al op de juiste pagina zijn, scroll direct
    const el = document.getElementById(anchorId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const isCurrentModule = (slug: string) => pathname === `/module/${slug}`;

  function renderDocLinks(
    moduleSlug: string,
    documents: Array<{ title: string; anchorId: string; slug: string }>,
    depth = 0
  ) {
    return documents.map(doc => {
      const isActive = isCurrentModule(moduleSlug) && activeAnchor === doc.anchorId;
      return (
        <Link
          key={doc.anchorId}
          href={`/module/${moduleSlug}#${doc.anchorId}`}
          onClick={() => handleAnchorClick(moduleSlug, doc.anchorId)}
          className={`
            flex items-start gap-2 py-1.5 px-3 rounded text-sm leading-snug transition-all duration-150
            ${depth > 0 ? 'ml-3' : ''}
            ${isActive
              ? 'sidebar-link-active font-medium'
              : 'text-slate-300 hover:text-white hover:bg-white/10'
            }
          `}
        >
          <span className="mt-0.5 opacity-50 text-xs">›</span>
          <span className="flex-1">{doc.title}</span>
        </Link>
      );
    });
  }

  function renderSubModule(moduleSlug: string, sub: SubModule) {
    const key = `${moduleSlug}--${sub.slug}`;
    const isOpen = openSubModules.has(key);
    return (
      <div key={key} className="ml-2">
        <button
          onClick={() => toggleSubModule(key)}
          className="flex items-center gap-1.5 w-full py-1.5 px-2 text-xs font-semibold uppercase tracking-wider text-slate-400 hover:text-slate-200 transition-colors"
        >
          <span className={`transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`}>▶</span>
          <span className="flex-1 text-left">{sub.title}</span>
        </button>
        {isOpen && (
          <div className="ml-2 border-l border-slate-700 pl-2 space-y-0.5">
            {renderDocLinks(moduleSlug, sub.documents, 1)}
          </div>
        )}
      </div>
    );
  }

  const sidebarContent = (
    <nav className="flex flex-col h-full">
      {/* Logo/Header */}
      <div className="px-4 py-5 border-b border-slate-700/60">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-lg bg-azure flex items-center justify-center text-white font-bold text-sm shadow-lg group-hover:bg-azure-dark transition-colors">
            AZ
          </div>
          <div>
            <div className="text-white font-semibold text-sm leading-tight">AZ-204</div>
            <div className="text-slate-400 text-xs">Study Guide</div>
          </div>
        </Link>
      </div>

      {/* Modules lijst */}
      <div className="flex-1 overflow-y-auto py-4 space-y-1 px-2">
        {navigation.modules.map(module => {
          const isOpen = openModules.has(module.slug);
          const isCurrent = isCurrentModule(module.slug);
          const icon = getModuleIcon(module.title);

          return (
            <div key={module.slug}>
              {/* Module header knop */}
              <button
                onClick={() => toggleModule(module.slug)}
                className={`
                  flex items-center gap-2.5 w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150
                  ${isCurrent
                    ? 'bg-azure/20 text-azure-light'
                    : 'text-slate-300 hover:bg-white/8 hover:text-white'
                  }
                `}
              >
                <span className="text-base leading-none">{icon}</span>
                <span className="flex-1 text-left leading-snug">{module.title}</span>
                <span className={`text-xs opacity-50 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
                  ▾
                </span>
              </button>

              {/* Documenten */}
              {isOpen && (
                <div className="mt-1 ml-2 space-y-0.5 border-l border-slate-700 pl-2">
                  {renderDocLinks(module.slug, module.documents)}
                  {module.subModules.map(sub => renderSubModule(module.slug, sub))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-slate-700/60">
        <p className="text-xs text-slate-500 text-center">Powered by Lionel · 2026</p>
      </div>
    </nav>
  );

  return (
    <>
      {/* Mobile toggle knop */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center text-white shadow-lg"
        aria-label="Menu openen"
      >
        {mobileOpen ? '✕' : '☰'}
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/60"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar — desktop: altijd zichtbaar, mobiel: slide-in */}
      <aside
        className={`
          sidebar fixed top-0 left-0 h-full z-40 bg-slate-900 border-r border-slate-700/50 overflow-hidden
          transition-transform duration-300 shadow-2xl
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
