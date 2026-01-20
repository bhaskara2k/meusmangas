import React, { useMemo } from 'react';
import { CollectionItem, Publisher } from '../types';
import { PUBLISHERS } from '../constants';
import { CollectionIcon, StatisticsIcon } from './icons/Icons';

const publisherLogoMap: { [key: string]: string } = {
  "Panini": "/logos/panini.png",
  "JBC": "/logos/jbc.png",
  "NewPOP": "/logos/newpop.png",
  "MPEG": "/logos/mpeg.png",
  "Conrad": "/logos/conrad.png",
};

const publisherColorMap: { [key: string]: string } = {
  "Panini": "from-red-600 to-red-800",
  "JBC": "from-blue-600 to-blue-800",
  "NewPOP": "from-pink-500 to-pink-700",
  "MPEG": "from-emerald-600 to-teal-800",
  "Conrad": "from-amber-500 to-orange-700",
};

interface StatisticsViewProps {
  collection: CollectionItem[];
}

interface StatCardProps {
  title: string;
  value: number | string;
  description: string;
  icon: React.ReactNode;
  gradient: string;
  delay: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, description, icon, gradient, delay }) => (
  <div
    className={`relative group bg-white dark:bg-slate-900/40 backdrop-blur-md border border-gray-200 dark:border-white/10 p-8 rounded-[2rem] shadow-xl dark:shadow-2xl overflow-hidden transition-all duration-500 hover:scale-105 hover:border-purple-500/30 animate-fade-in-up`}
    style={{ animationDelay: delay }}
  >
    {/* Background Glow */}
    <div className={`absolute -right-10 -top-10 w-40 h-40 bg-gradient-to-br ${gradient} opacity-5 dark:opacity-10 blur-3xl group-hover:opacity-20 transition-opacity duration-500`} />

    <div className="relative z-10 flex flex-col items-center text-center">
      <div className={`p-4 rounded-2xl bg-gradient-to-br ${gradient} shadow-lg mb-4 text-white transform transition-transform group-hover:rotate-6`}>
        {icon}
      </div>
      <dt className="text-sm font-black text-slate-500 dark:text-gray-400 uppercase tracking-widest mb-1">{title}</dt>
      <dd className={`text-6xl font-black bg-gradient-to-br ${gradient} bg-clip-text text-transparent drop-shadow-sm`}>
        {value}
      </dd>
      <p className="mt-4 text-sm text-slate-600 dark:text-gray-500 font-bold leading-relaxed">{description}</p>
    </div>

    {/* Bottom Shine */}
    <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-purple-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
  </div>
);

const StatisticsView: React.FC<StatisticsViewProps> = ({ collection }) => {

  const stats = useMemo(() => {
    if (collection.length === 0) {
      return {
        totalVolumes: 0,
        totalTitles: 0,
        publisherCounts: new Map<Publisher, number>(),
      };
    }

    const totalVolumes = collection.length;

    const titleMap = new Map<string, Publisher>(); // mangaId -> publisher
    collection.forEach(item => {
      if (!titleMap.has(item.mangaId)) {
        titleMap.set(item.mangaId, item.publisher);
      }
    });

    const totalTitles = titleMap.size;

    const publisherCounts = new Map<Publisher, number>();
    PUBLISHERS.forEach(p => publisherCounts.set(p, 0));

    for (const publisher of titleMap.values()) {
      publisherCounts.set(publisher, (publisherCounts.get(publisher) || 0) + 1);
    }

    return { totalVolumes, totalTitles, publisherCounts };
  }, [collection]);

  if (collection.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 px-4 animate-fade-in">
        <div className="relative mb-8">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full blur-3xl opacity-10 dark:opacity-20" />
          <div className="relative bg-white dark:bg-slate-900/60 backdrop-blur-xl border border-gray-100 dark:border-white/10 rounded-full p-10 shadow-2xl">
            <StatisticsIcon className="w-20 h-20 text-gray-400 dark:text-gray-500" />
          </div>
        </div>
        <h2 className="text-3xl font-black bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-gray-400 bg-clip-text text-transparent mb-4">
          Estatísticas Indisponíveis
        </h2>
        <p className="text-slate-600 dark:text-gray-400 text-lg max-w-md text-center font-medium">
          Adicione volumes à sua coleção para ver um resumo detalhado da sua estante.
        </p>
      </div>
    );
  }

  const sortedPublisherStats = Array.from(stats.publisherCounts.entries())
    .filter(([, count]) => count > 0)
    .sort(([, countA], [, countB]) => countB - countA);

  const maxCount = sortedPublisherStats.length > 0 ? sortedPublisherStats[0][1] : 1;

  return (
    <div className="max-w-5xl mx-auto space-y-16 animate-fade-in px-4">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="inline-block px-5 py-2 rounded-full bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 backdrop-blur-md shadow-sm transition-all duration-300">
          <span className="text-xs font-black uppercase tracking-[0.2em] text-purple-600 dark:text-purple-400">Dashboard Elite</span>
        </div>
        <h2 className="text-5xl font-black text-slate-900 dark:text-white tracking-tighter italic">Estatísticas da <span className="bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400 bg-clip-text text-transparent">Coleção</span></h2>
        <p className="text-slate-500 dark:text-gray-400 text-xl font-bold">Uma análise visual da sua paixão por mangás</p>
      </div>

      {/* Main Stats */}
      <dl className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <StatCard
          title="Volumes Totais"
          value={stats.totalVolumes}
          description="O número total de edições físicas catalogadas na sua estante virtual."
          icon={<CollectionIcon className="w-8 h-8" />}
          gradient="from-purple-600 to-blue-600"
          delay="0ms"
        />
        <StatCard
          title="Títulos Únicos"
          value={stats.totalTitles}
          description="O número de séries diferentes que compõem sua coleção."
          icon={<svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>}
          gradient="from-pink-600 to-rose-600"
          delay="100ms"
        />
      </dl>

      {/* Publisher Breakdown */}
      <div className="space-y-8 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
        <div className="flex items-center gap-4">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-300 dark:via-white/10 to-transparent" />
          <h3 className="text-2xl font-black text-slate-800 dark:text-white px-4 italic">Distribuição por Editora</h3>
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-300 dark:via-white/10 to-transparent" />
        </div>

        <div className="bg-white dark:bg-slate-900/40 backdrop-blur-md border border-gray-200 dark:border-white/10 p-10 rounded-[2.5rem] shadow-xl dark:shadow-2xl space-y-8">
          {sortedPublisherStats.length > 0 ? (
            sortedPublisherStats.map(([publisher, count], index) => (
              <div key={publisher} className="space-y-3 animate-slide-in-left" style={{ animationDelay: `${300 + index * 100}ms` }}>
                <div className="flex justify-between items-end mb-1 px-1">
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 bg-gray-100 dark:bg-black/40 rounded-lg border border-gray-200 dark:border-white/5 shadow-sm">
                      <img src={publisherLogoMap[publisher]} alt="" className="h-5 w-auto object-contain brightness-110" />
                    </div>
                    <span className="font-black text-slate-700 dark:text-gray-300 tracking-wide">{publisher}</span>
                  </div>
                  <span className="text-xl font-black text-slate-900 dark:text-white">{count} <span className="text-xs text-slate-400 dark:text-gray-500 font-black uppercase ml-1">Títulos</span></span>
                </div>
                <div className="relative group">
                  <div className="w-full bg-gray-100 dark:bg-white/5 rounded-full h-5 relative overflow-hidden shadow-inner">
                    <div
                      className={`absolute inset-y-0 left-0 bg-gradient-to-r ${publisherColorMap[publisher] || 'from-gray-500 to-gray-700'} rounded-full transition-all duration-1000 ease-out shadow-lg`}
                      style={{ width: `${Math.max((count / maxCount) * 100, 0)}%` }}
                    >
                      <div className="absolute inset-0 bg-white/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-slate-400 dark:text-gray-500 font-bold py-10 italic">Nenhum título adicionado ainda.</p>
          )}
        </div>
      </div>

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes fade-in-up {
          from { 
            opacity: 0; 
            transform: translateY(30px); 
          }
          to { 
            opacity: 1; 
            transform: translateY(0); 
          }
        }
        @keyframes slide-in-left {
          from { 
            opacity: 0; 
            transform: translateX(-30px); 
          }
          to { 
            opacity: 1; 
            transform: translateX(0); 
          }
        }
        .animate-fade-in {
          animation: fade-in 0.8s ease-out forwards;
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.8s ease-out both;
        }
        .animate-slide-in-left {
          animation: slide-in-left 0.8s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
      `}</style>
    </div>
  );
};

export default StatisticsView;