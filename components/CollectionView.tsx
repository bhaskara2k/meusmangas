import React, { useState, useMemo } from 'react';
import { CollectionItem, Publisher } from '../types';
import CollectionCard from './CollectionCard';
import { PUBLISHERS } from '../constants';

interface CollectionViewProps {
  collection: CollectionItem[];
  onRemove: (itemId: string) => void;
}

const CollectionView: React.FC<CollectionViewProps> = ({ collection, onRemove }) => {
  const [selectedTitle, setSelectedTitle] = useState('');
  const [selectedPublisher, setSelectedPublisher] = useState<Publisher | ''>('');

  const uniqueTitles = useMemo(() => {
    const titles = new Set(collection.map(item => item.title));
    return Array.from(titles).sort((a, b) => a.localeCompare(b));
  }, [collection]);

  const filteredCollection = useMemo(() => {
    return collection.filter(item => {
      const titleMatch = !selectedTitle || item.title === selectedTitle;
      const publisherMatch = !selectedPublisher || item.publisher === selectedPublisher;
      return titleMatch && publisherMatch;
    });
  }, [collection, selectedTitle, selectedPublisher]);

  if (collection.length === 0) {
    return (
      <div className="text-center py-16">
        <h2 className="text-2xl font-semibold text-muted-foreground">Sua Coleção está Vazia</h2>
        <p className="text-muted-foreground/80 mt-2">Use a aba Buscar para encontrar e adicionar mangás à sua coleção.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
       <div className="flex flex-col md:flex-row gap-4 justify-center">
        {/* Title Filter */}
        <div className="relative w-full md:max-w-xs">
          <select
            value={selectedTitle}
            onChange={(e) => setSelectedTitle(e.target.value)}
            aria-label="Filtrar por série de mangá"
            className="w-full pl-4 pr-10 py-3 bg-card border-2 border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary transition-colors duration-200 block appearance-none"
          >
            <option value="">Todos os Títulos</option>
            {uniqueTitles.map(title => (
              <option key={title} value={title}>{title}</option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-muted-foreground">
            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
          </div>
        </div>

        {/* Publisher Filter */}
        <div className="relative w-full md:max-w-xs">
          <select
            value={selectedPublisher}
            onChange={(e) => setSelectedPublisher(e.target.value as Publisher | '')}
            aria-label="Filtrar por editora"
            className="w-full pl-4 pr-10 py-3 bg-card border-2 border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary transition-colors duration-200 block appearance-none"
          >
            <option value="">Todas as Editoras</option>
            {PUBLISHERS.map(pub => (
              <option key={pub} value={pub}>{pub}</option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-muted-foreground">
            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
          </div>
        </div>
      </div>

      {filteredCollection.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
          {filteredCollection.map(item => (
            <CollectionCard key={item.id} item={item} onRemove={onRemove} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <p className="text-muted-foreground">Nenhum mangá encontrado com seu filtro.</p>
        </div>
      )}
    </div>
  );
};

export default CollectionView;