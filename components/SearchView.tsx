import React, { useState } from 'react';
import { MangaSearchResult } from '../types';
import { SearchIcon } from './icons/Icons';
import MangaCard from './MangaCard';
import LoadingSpinner from './LoadingSpinner';

interface SearchViewProps {
  onSearch: (query: string) => void;
  results: MangaSearchResult[];
  isLoading: boolean;
  error: string | null;
  onSelectManga: (manga: MangaSearchResult) => void;
  initialManga: MangaSearchResult[];
}

const SearchView: React.FC<SearchViewProps> = ({
  onSearch,
  results,
  isLoading,
  error,
  onSelectManga,
  initialManga
}) => {
  const [query, setQuery] = useState('');
  const [searchAttempted, setSearchAttempted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      setSearchAttempted(true);
    }
    onSearch(query);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Search Bar Premium */}
      <form onSubmit={handleSubmit} className="relative group">
        <div className="relative">
          {/* Brilho de fundo */}
          <div className="absolute inset-0 bg-primary-gradient opacity-0 group-hover:opacity-10 rounded-2xl blur-xl transition-opacity duration-500" />

          {/* Input Container */}
          <div className="relative bg-white dark:bg-slate-900/40 backdrop-blur-sm border border-gray-200 dark:border-white/10 rounded-2xl overflow-hidden group-hover:border-primary/50 transition-all duration-300 shadow-lg dark:shadow-none">
            {/* Ícone de busca */}
            <div className="absolute left-5 top-1/2 -translate-y-1/2 z-10">
              <div className="relative">
                <div className="absolute inset-0 bg-primary-gradient rounded-full blur opacity-50" />
                <div className="relative bg-primary-gradient p-2 rounded-full shadow-lg">
                  <SearchIcon className="w-5 h-5 text-white" />
                </div>
              </div>
            </div>

            {/* Input */}
            <input
              type="text"
              value={query}
              onChange={(e) => {
                const newQuery = e.target.value;
                setQuery(newQuery);
                if (newQuery.trim() === '') {
                  setSearchAttempted(false);
                  onSearch('');
                }
              }}
              placeholder="Procure por um título de mangá..."
              className="w-full pl-16 pr-6 py-4 bg-transparent text-slate-900 dark:text-white placeholder-gray-400 focus:outline-none text-lg font-medium"
            />

            {/* Borda brilhante inferior */}
            <div className="absolute bottom-0 left-0 right-0 h-px bg-primary-gradient opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </div>
        </div>
      </form>

      {/* Loading State */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <LoadingSpinner />
          <p className="text-gray-500 dark:text-gray-400 text-sm animate-pulse font-medium">Buscando mangás...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 shadow-sm">
            <p className="text-red-500 dark:text-red-400 text-center font-bold">{error}</p>
          </div>
        </div>
      )}

      {/* Results */}
      {!isLoading && !error && (
        <>
          {/* Search Results */}
          {searchAttempted && results && results.length > 0 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-primary/30 to-transparent dark:via-primary/50" />
                <h2 className="text-xl font-black text-primary-gradient italic">
                  {results.length} resultado{results.length !== 1 ? 's' : ''} encontrado{results.length !== 1 ? 's' : ''}
                </h2>
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-primary/30 to-transparent dark:via-primary/50" />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                {results.map((manga, index) => (
                  <div
                    key={manga.id}
                    className="animate-fade-in-up"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <MangaCard manga={manga} onSelect={onSelectManga} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* No Results */}
          {searchAttempted && (!results || results.length === 0) && (
            <div className="flex flex-col items-center justify-center py-20 space-y-4 animate-fade-in">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full blur-2xl opacity-10 dark:opacity-20" />
                <div className="relative bg-white dark:bg-slate-900/60 backdrop-blur-sm border border-gray-100 dark:border-white/10 rounded-full p-8 shadow-xl">
                  <svg className="w-16 h-16 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <p className="text-gray-600 dark:text-gray-400 text-lg font-bold">Nenhum resultado para <span className="text-purple-600 dark:text-purple-400 italic">"{query}"</span></p>
              <p className="text-gray-400 dark:text-gray-500 text-sm font-medium tracking-wide">Tente buscar por outro título mágico</p>
            </div>
          )}

          {/* Popular Manga */}
          {!searchAttempted && initialManga && initialManga.length > 0 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
                <h2 className="text-2xl font-bold text-primary-gradient flex items-center gap-2">
                  <svg className="w-6 h-6 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  Mangás Populares
                </h2>
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-pink-500/50 to-transparent" />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                {initialManga.map((manga, index) => (
                  <div
                    key={manga.id}
                    className="animate-fade-in-up"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <MangaCard manga={manga} onSelect={onSelectManga} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Animações CSS */}
      <style>{`
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
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
          animation: fade-in 0.5s ease-out;
        }
        
        .animate-fade-in-up {
          animation: fade-in-up 0.6s ease-out both;
        }
      `}</style>
    </div>
  );
};

export default SearchView;