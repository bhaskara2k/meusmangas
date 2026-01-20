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
    return Array.from(titles).sort((a: string, b: string) => a.localeCompare(b));
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
      <div className="flex flex-col items-center justify-center py-24 px-4 animate-fade-in">
        <div className="relative mb-8">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full blur-3xl opacity-10 dark:opacity-20" />
          <div className="relative bg-white dark:bg-slate-900/60 backdrop-blur-xl border border-gray-100 dark:border-white/10 rounded-full p-10 shadow-2xl">
            <svg className="w-20 h-20 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
        </div>
        <h2 className="text-3xl font-black bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-gray-400 bg-clip-text text-transparent mb-4 text-center italic">
          Sua Coleção está Vazia
        </h2>
        <p className="text-slate-500 dark:text-gray-400 text-lg max-w-md text-center font-bold">
          Comece a adicionar seus tesouros! Use a aba <span className="text-purple-600 dark:text-purple-400 font-black cursor-pointer hover:underline">Buscar</span> para preencher sua estante virtual.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-fade-in px-4">
      {/* Filtros Premium */}
      <div className="flex flex-col md:flex-row gap-6 justify-center items-center">
        {/* Title Filter */}
        <div className="relative w-full md:max-w-xs group">
          <div className="absolute inset-0 bg-primary-gradient opacity-0 group-hover:opacity-10 rounded-2xl blur-lg transition-opacity duration-500" />
          <div className="relative">
            <select
              value={selectedTitle}
              onChange={(e) => setSelectedTitle(e.target.value)}
              aria-label="Filtrar por série de mangá"
              className="w-full pl-6 pr-12 py-4 bg-white dark:bg-slate-900/40 backdrop-blur-md border-2 border-gray-100 dark:border-white/10 rounded-2xl text-slate-900 dark:text-white font-black focus:outline-none focus:ring-4 focus:ring-primary/10 appearance-none transition-all duration-300 hover:border-primary/50 cursor-pointer shadow-xl dark:shadow-none"
            >
              <option value="" className="bg-white dark:bg-slate-900 font-bold">Todos os Títulos</option>
              {uniqueTitles.map(title => (
                <option key={title} value={title} className="bg-white dark:bg-slate-900 font-bold">{title}</option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-primary">
              <svg className="w-6 h-6 transition-transform group-hover:translate-y-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>

        {/* Publisher Filter */}
        <div className="relative w-full md:max-w-xs group">
          <div className="absolute inset-0 bg-primary-gradient opacity-0 group-hover:opacity-10 rounded-2xl blur-lg transition-opacity duration-500" />
          <div className="relative">
            <select
              value={selectedPublisher}
              onChange={(e) => setSelectedPublisher(e.target.value as Publisher | '')}
              aria-label="Filtrar por editora"
              className="w-full pl-6 pr-12 py-4 bg-white dark:bg-slate-900/40 backdrop-blur-md border-2 border-gray-100 dark:border-white/10 rounded-2xl text-slate-900 dark:text-white font-black focus:outline-none focus:ring-4 focus:ring-primary/10 appearance-none transition-all duration-300 hover:border-primary/30 cursor-pointer shadow-xl dark:shadow-none"
            >
              <option value="" className="bg-white dark:bg-slate-900 font-bold">Todas as Editoras</option>
              {PUBLISHERS.map(pub => (
                <option key={pub} value={pub} className="bg-white dark:bg-slate-900 font-bold">{pub}</option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-primary">
              <svg className="w-6 h-6 transition-transform group-hover:translate-y-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Grid de Coleção */}
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-300 dark:via-white/10 to-transparent" />
          <span className="text-slate-500 dark:text-gray-400 text-xs font-black uppercase tracking-[0.3em] italic">
            {filteredCollection.length} {filteredCollection.length === 1 ? 'Volume' : 'Volumes'}
          </span>
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-300 dark:via-white/10 to-transparent" />
        </div>

        {filteredCollection.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6 md:gap-8">
            {filteredCollection.map((item, index) => (
              <div
                key={item.id}
                className="animate-fade-in-up"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <CollectionCard item={item} onRemove={onRemove} />
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 px-4">
            <div className="bg-white dark:bg-slate-900/40 backdrop-blur-md border border-gray-100 dark:border-white/10 rounded-[2.5rem] p-10 max-w-sm w-full text-center shadow-xl dark:shadow-none">
              <svg className="w-16 h-16 text-slate-300 dark:text-gray-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <p className="text-slate-600 dark:text-gray-400 text-xl font-black italic">Ops! Nenhum tesouro encontrado com esses filtros.</p>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes fade-in-up {
          from { 
            opacity: 0; 
            transform: translateY(20px); 
          }
          to { 
            opacity: 1; 
            transform: translateY(0); 
          }
        }
        .animate-fade-in {
          animation: fade-in 0.5s ease-out forwards;
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default CollectionView;