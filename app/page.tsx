import Link from 'next/link';
import { getNavigation } from '@/lib/content';
import SearchBar from '@/components/SearchBar';

const MODULE_ICONS: Record<string, string> = {
  'requirements': '📋',
  'virtual-machines': '🖥️',
  'azure-app-service': '🌐',
  'containers': '📦',
  'azure-function-apps': '⚡',
  'azure-storage-accounts': '🗄️',
  'cosmosdb': '🌌',
  'azure-authentication': '🔐',
  'data-encryption-with-storage-accounts-and-sql-database': '🔒',
  'caching-and-content-delivery-networks': '⚡',
  'troubleshoot-solutions-by-application-insights': '🔍',
  'monitoring-and-logging': '📊',
  'consuming-azure-services': '🔌',
  'development-event-based-solutions': '📡',
  'application-messaging': '💬',
  'notes': '📝',
  'prepare-for-the-renewal-assessment': '🎓',
};

function getIcon(slug: string): string {
  for (const [key, icon] of Object.entries(MODULE_ICONS)) {
    if (slug.includes(key) || key.includes(slug)) return icon;
  }
  return '📄';
}

export default function HomePage() {
  const navigation = getNavigation();

  if (!navigation) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center p-12">
          <div className="text-6xl mb-6">⚠️</div>
          <h1 className="text-2xl font-bold text-slate-700 mb-4">Content nog niet gegenereerd</h1>
          <p className="text-slate-500 mb-6">Voer eerst het parse script uit:</p>
          <code className="bg-slate-100 px-4 py-2 rounded text-sm font-mono">
            node scripts/parse-docs.js
          </code>
        </div>
      </div>
    );
  }

  const totalDocs = navigation.modules.reduce((acc, m) => {
    let count = m.documents.length;
    for (const sub of m.subModules) count += sub.documents.length;
    return acc + count;
  }, 0);

  return (
    <div className="min-h-screen">
      {/* Hero sectie */}
      <div className="bg-linear-to-br from-slate-900 via-[#0f2a4a] to-azure text-white px-8 py-16 lg:py-24">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur flex items-center justify-center text-2xl font-bold border border-white/20 shadow-xl">
              AZ
            </div>
            <div>
              <p className="text-azure-light text-sm font-semibold uppercase tracking-widest">Microsoft Azure</p>
              <h1 className="text-3xl lg:text-4xl font-bold">AZ-204 Study Guide</h1>
            </div>
          </div>
          <p className="text-slate-300 text-lg max-w-2xl mb-8 leading-relaxed">
            Complete Study Guide for <strong className="text-white">Developing Solutions for Microsoft Azure</strong> certification.
            Click on a module in the sidebar or below to get started.
          </p>
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="bg-white/10 backdrop-blur px-4 py-2 rounded-full border border-white/20">
              📚 {navigation.modules.length} modules
            </div>
            <div className="bg-white/10 backdrop-blur px-4 py-2 rounded-full border border-white/20">
              📄 {totalDocs} documents
            </div>
            <div className="bg-white/10 backdrop-blur px-4 py-2 rounded-full border border-white/20">
              🎓 Certification: AZ-204
            </div>
          </div>
        </div>
      </div>

      {/* Module kaarten */}
      <div className="max-w-5xl mx-auto px-8 py-12">
        <div className="flex justify-center mb-8">
          <SearchBar navigation={navigation} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {navigation.modules.map((module, i) => {
            const icon = getIcon(module.slug);
            const docCount = module.documents.length +
              module.subModules.reduce((acc, s) => acc + s.documents.length, 0);

            return (
              <Link
                key={module.slug}
                href={`/module/${module.slug}`}
                className="group bg-white rounded-xl border border-slate-200 p-5 hover:border-azure hover:shadow-lg transition-all duration-200 flex flex-col gap-3"
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{icon}</span>
                  <div className="flex-1 min-w-0">
                    <span className="text-xs text-slate-400 font-medium">{String(i + 1).padStart(2, '0')}</span>
                    <h3 className="text-sm font-semibold text-slate-800 group-hover:text-azure transition-colors leading-snug">
                      {module.title}
                    </h3>
                  </div>
                </div>
                <div className="text-xs text-slate-400 mt-auto">
                  {docCount} {docCount === 1 ? 'document' : 'documenten'}
                  {module.subModules.length > 0 && ` · ${module.subModules.length} sub-modules`}
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
