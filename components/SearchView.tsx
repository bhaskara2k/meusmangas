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

const SearchView: React.FC<SearchViewProps> = ({ onSearch, results, isLoading, error, onSelectManga, initialManga }) => {
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
    <div className="space-y-8">
      <form onSubmit={handleSubmit} className="relative">
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
          className="w-full pl-12 pr-4 py-3 bg-card border-2 border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary transition-colors duration-200"
        />
        <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-muted-foreground" />
      </form>

      {isLoading && <LoadingSpinner />}
      {error && <p className="text-center text-red-500 dark:text-red-400">{error}</p>}
      
      {!isLoading && !error && (
        <>
          {/* Case 1: A search was attempted and yielded results */}
          {searchAttempted && results.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
              {results.map(manga => (
                <MangaCard key={manga.id} manga={manga} onSelect={onSelectManga} />
              ))}
            </div>
          )}

          {/* Case 2: A search was attempted but yielded no results */}
          {searchAttempted && results.length === 0 && (
            <p className="text-center text-muted-foreground py-16">Nenhum resultado encontrado para "{query}".</p>
          )}

          {/* Case 3: No search has been attempted yet, show initial popular manga */}
          {!searchAttempted && initialManga.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold text-center text-foreground/80 mb-6">
                Mangás Populares
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
                {initialManga.map(manga => (
                  <MangaCard key={manga.id} manga={manga} onSelect={onSelectManga} />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default SearchView;