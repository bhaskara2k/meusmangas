import React from 'react';
import { MangaSearchResult } from '../types';
import { PlusIcon } from './icons/Icons';

interface MangaCardProps {
  manga: MangaSearchResult;
  onSelect: (manga: MangaSearchResult) => void;
}

const MangaCard: React.FC<MangaCardProps> = ({ manga, onSelect }) => {
  return (
    <div className="group relative bg-card rounded-lg shadow-lg overflow-hidden transition-transform transform hover:scale-105 duration-300">
      <img
        src={manga.mainCoverUrl}
        alt={manga.title}
        className="w-full h-auto aspect-[2/3] object-cover"
        loading="lazy"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
      <div className="absolute bottom-0 left-0 p-3 w-full">
        <h3 className="text-sm font-bold text-white truncate" title={manga.title}>{manga.title}</h3>
      </div>
      <button
        onClick={() => onSelect(manga)}
        className="absolute top-2 right-2 flex items-center justify-center w-10 h-10 bg-primary rounded-full text-primary-foreground opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-ring"
        aria-label={`Adicionar ${manga.title} à coleção`}
      >
        <PlusIcon className="w-6 h-6" />
      </button>
    </div>
  );
};

export default MangaCard;