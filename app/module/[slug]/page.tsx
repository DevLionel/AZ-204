import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
  getNavigation,
  getModuleBySlug,
  getDocumentContent,
  getAllDocumentsForModule,
  getAllModuleSlugs,
  type SubModule,
} from '@/lib/content';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const slugs = getAllModuleSlugs();
  return slugs.map(slug => ({ slug }));
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const module = getModuleBySlug(slug);
  return {
    title: module ? `${module.title} · AZ-204` : 'Module niet gevonden',
  };
}

type DocEntry = {
  slug: string;
  title: string;
  anchorId: string;
  groupTitle?: string;
  html: string;
};

function SubModuleGrid({ subModules }: { subModules: SubModule[] }) {
  return (
    <div className="mb-12">
      <h2 className="text-base font-semibold text-slate-500 uppercase tracking-wider mb-4">Sub-modules</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {subModules.map((sub, i) => (
          <div
            key={sub.slug}
            className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col gap-3 hover:border-azure hover:shadow-md transition-all duration-200"
          >
            {/* Sub-module header */}
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-azure text-white flex items-center justify-center text-xs font-bold shrink-0">
                {String(i + 1).padStart(2, '0')}
              </div>
              <h3 className="text-sm font-semibold text-slate-800 leading-snug">{sub.title}</h3>
            </div>

            {/* Document links */}
            <ul className="space-y-1 pl-1">
              {sub.documents.map(doc => (
                <li key={doc.anchorId}>
                  <a
                    href={`#${doc.anchorId}`}
                    className="flex items-start gap-1.5 text-xs text-slate-500 hover:text-azure transition-colors group"
                  >
                    <span className="mt-0.5 text-slate-300 group-hover:text-azure">›</span>
                    <span>{doc.title}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

export default async function ModulePage({ params }: Props) {
  const { slug } = await params;
  const module = getModuleBySlug(slug);

  if (!module) notFound();

  const nav = getNavigation();
  const modules = nav?.modules ?? [];
  const currentIndex = modules.findIndex(m => m.slug === slug);
  const prevModule = currentIndex > 0 ? modules[currentIndex - 1] : null;
  const nextModule = currentIndex < modules.length - 1 ? modules[currentIndex + 1] : null;

  const allDocs = getAllDocumentsForModule(module);
  const loadedDocs: DocEntry[] = [];

  for (const doc of allDocs) {
    const content = getDocumentContent(slug, doc.slug);
    if (content) {
      loadedDocs.push({ ...doc, html: content.html });
    }
  }

  const hasSubModules = module.subModules.length > 0;

  return (
    <div className="max-w-5xl mx-auto px-4 lg:px-8 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-slate-400 mb-6">
        <Link href="/" className="hover:text-azure transition-colors">Home</Link>
        <span>›</span>
        <span className="text-slate-700 font-medium">{module.title}</span>
      </nav>

      {/* Module header */}
      <div className="bg-linear-to-r from-slate-900 to-[#1a3a5c] text-white rounded-2xl px-8 py-10 mb-10 shadow-xl">
        <h1 className="text-2xl lg:text-3xl font-bold mb-3">{module.title}</h1>
        <p className="text-slate-300 text-sm">
          {loadedDocs.length} {loadedDocs.length === 1 ? 'document' : 'documenten'}
          {hasSubModules && ` · ${module.subModules.length} sub-modules`}
        </p>

        {/* Inhoudsopgave alleen voor modules zónder sub-modules */}
        {!hasSubModules && loadedDocs.length > 1 && (
          <div className="mt-6 pt-6 border-t border-white/10">
            <p className="text-xs uppercase tracking-widest text-slate-400 mb-3">Inhoudsopgave</p>
            <div className="flex flex-wrap gap-2">
              {loadedDocs.map(doc => (
                <a
                  key={doc.anchorId}
                  href={`#${doc.anchorId}`}
                  className="text-xs bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-full text-slate-200 transition-colors"
                >
                  {doc.title}
                </a>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Sub-module kaartgrid (alleen voor modules met sub-modules) */}
      {hasSubModules && (
        <SubModuleGrid subModules={module.subModules} />
      )}

      {/* Document secties — gegroepeerd per sub-module indien aanwezig */}
      <div className="space-y-12">
        {hasSubModules ? (
          module.subModules.map((sub, subIndex) => {
            const subDocs = loadedDocs.filter(d => d.groupTitle === sub.title);
            if (subDocs.length === 0) return null;
            return (
              <div key={sub.slug}>
                {/* Sub-module scheidingskop */}
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-8 h-8 rounded-lg bg-slate-200 text-slate-600 flex items-center justify-center text-xs font-bold shrink-0">
                    {String(subIndex + 1).padStart(2, '0')}
                  </div>
                  <h2 className="text-lg font-bold text-slate-700">{sub.title}</h2>
                  <div className="flex-1 h-px bg-slate-200" />
                </div>
                <div className="space-y-8">
                  {subDocs.map((doc, i) => (
                    <DocumentSection key={doc.anchorId} doc={doc} index={i} />
                  ))}
                </div>
              </div>
            );
          })
        ) : (
          loadedDocs.map((doc, i) => (
            <DocumentSection key={doc.anchorId} doc={doc} index={i} />
          ))
        )}
      </div>

      {/* Navigatie knoppen */}
      <div className="mt-16 pt-8 border-t border-slate-200 flex justify-between gap-4">
        {prevModule ? (
          <Link
            href={`/module/${prevModule.slug}`}
            className="flex items-center gap-2 px-5 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:border-azure hover:text-azure transition-all shadow-sm"
          >
            <span>←</span>
            <span className="max-w-[180px] truncate">{prevModule.title}</span>
          </Link>
        ) : <div />}

        {nextModule ? (
          <Link
            href={`/module/${nextModule.slug}`}
            className="flex items-center gap-2 px-5 py-3 bg-azure text-white rounded-xl text-sm font-medium hover:bg-azure-dark transition-all shadow-sm"
          >
            <span className="max-w-[180px] truncate">{nextModule.title}</span>
            <span>→</span>
          </Link>
        ) : <div />}
      </div>
    </div>
  );
}

function DocumentSection({ doc, index }: { doc: DocEntry; index: number }) {
  return (
    <section
      id={doc.anchorId}
      data-section
      className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden"
    >
      <div className="px-8 py-6 border-b border-slate-100 bg-slate-50/80 flex items-start gap-4">
        <div className="w-8 h-8 rounded-full bg-azure text-white flex items-center justify-center text-sm font-bold shrink-0 mt-0.5">
          {index + 1}
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-bold text-slate-800 leading-snug">{doc.title}</h2>
        </div>
        <a
          href={`#${doc.anchorId}`}
          className="text-slate-400 hover:text-azure text-xs transition-colors shrink-0 mt-1"
          title="Directe link"
        >
          #
        </a>
      </div>
      <div className="px-8 py-8">
        {doc.html ? (
          <div
            className="prose prose-slate max-w-none prose-headings:scroll-mt-20"
            dangerouslySetInnerHTML={{ __html: doc.html }}
          />
        ) : (
          <p className="text-slate-400 italic">Document kon niet worden geladen.</p>
        )}
      </div>
    </section>
  );
}
