import React, { useMemo } from 'react';
import { CollectionItem, Publisher } from '../types';
import { PUBLISHERS } from '../constants';

const publisherColorMap: { [key: string]: string } = {
  "Panini": "bg-red-600",
  "JBC": "bg-blue-600",
  "NewPOP": "bg-pink-500",
  "MPEG": "bg-green-600",
  "Conrad": "bg-yellow-500",
};

interface StatisticsViewProps {
  collection: CollectionItem[];
}

interface StatCardProps {
  title: string;
  value: number | string;
  description: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, description }) => (
  <div className="bg-card border border-border p-6 rounded-lg shadow-lg flex flex-col items-center text-center">
    <dt className="text-sm font-medium text-muted-foreground">{title}</dt>
    <dd className="mt-1 text-5xl font-extrabold text-primary">{value}</dd>
    <p className="mt-2 text-sm text-muted-foreground/80">{description}</p>
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
    PUBLISHERS.forEach(p => publisherCounts.set(p, 0)); // Initialize all with 0

    for (const publisher of titleMap.values()) {
        publisherCounts.set(publisher, (publisherCounts.get(publisher) || 0) + 1);
    }

    return { totalVolumes, totalTitles, publisherCounts };
  }, [collection]);

  if (collection.length === 0) {
    return (
      <div className="text-center py-16">
        <h2 className="text-2xl font-semibold text-muted-foreground">Sua Coleção está Vazia</h2>
        <p className="text-muted-foreground/80 mt-2">Adicione mangás para ver as estatísticas da sua coleção.</p>
      </div>
    );
  }

  const sortedPublisherStats = Array.from(stats.publisherCounts.entries())
    .filter(([, count]) => count > 0)
    .sort(([, countA], [, countB]) => countB - countA);

  const maxCount = sortedPublisherStats.length > 0 ? sortedPublisherStats[0][1] : 1;

  return (
    <div className="max-w-4xl mx-auto space-y-10">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-foreground">Estatísticas da Coleção</h2>
        <p className="text-muted-foreground mt-2">Um resumo da sua paixão por mangás.</p>
      </div>

      <dl className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <StatCard 
            title="Volumes Totais"
            value={stats.totalVolumes}
            description="O número total de volumes físicos na sua estante."
        />
        <StatCard 
            title="Títulos Únicos"
            value={stats.totalTitles}
            description="O número de séries diferentes que você coleciona."
        />
      </dl>

      <div>
        <h3 className="text-2xl font-bold text-foreground text-center mb-6">Títulos por Editora</h3>
        <div className="bg-card border border-border p-6 rounded-lg shadow-lg space-y-4">
          {sortedPublisherStats.length > 0 ? (
            sortedPublisherStats.map(([publisher, count]) => (
                <div key={publisher} className="flex items-center gap-4">
                    <span className="font-semibold text-muted-foreground w-20 text-right">{publisher}</span>
                    <div className="flex-1 bg-muted rounded-full h-6">
                        <div 
                            className={`${publisherColorMap[publisher] || 'bg-gray-500'} h-6 rounded-full flex items-center justify-end pr-3 transition-all duration-500 ease-out`}
                            style={{ width: `${Math.max((count / maxCount) * 100, 0)}%` }}
                        >
                           <span className="text-sm font-bold text-white">{count}</span>
                        </div>
                    </div>
                </div>
            ))
          ) : (
            <p className="text-center text-muted-foreground">Nenhum título adicionado ainda.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default StatisticsView;