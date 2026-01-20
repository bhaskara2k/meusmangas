import React, { useState } from 'react';
import { MangaSearchResult } from '../types';
import { PlusIcon } from './icons/Icons';

interface MangaCardProps {
  manga: MangaSearchResult;
  onSelect: (manga: MangaSearchResult) => void;
}

const MangaCard: React.FC<MangaCardProps> = ({ manga, onSelect }) => {
  const [imageLoaded, setImageLoaded] = useState(false);

  return (
    <div className="group relative bg-white dark:bg-slate-900/40 backdrop-blur-sm rounded-2xl overflow-hidden border border-gray-200 dark:border-white/10 transition-all duration-500 hover:scale-105 hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/20 shadow-md dark:shadow-none">
      {/* Brilho animado no hover */}
      <div className="absolute inset-0 bg-primary-gradient opacity-0 group-hover:opacity-10 transition-all duration-500 pointer-events-none z-10" />

      {/* Skeleton loader */}
      {!imageLoaded && (
        <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-900 animate-pulse" />
      )}

      {/* Imagem da capa */}
      <div className="relative overflow-hidden">
        <img
          src={manga.mainCoverUrl}
          alt={manga.title}
          className={`w-full h-auto aspect-[2/3] object-cover transition-all duration-700 ${imageLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-110'
            } group-hover:scale-110`}
          loading="lazy"
          onLoad={() => setImageLoaded(true)}
        />

        {/* Gradiente overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent opacity-80 group-hover:opacity-90 transition-opacity duration-300" />
      </div>

      {/* Conteúdo */}
      <div className="absolute bottom-0 left-0 right-0 p-4 transform translate-y-0 group-hover:translate-y-0 transition-transform duration-300">
        {/* Título */}
        <h3
          className="text-sm font-bold text-white line-clamp-2 mb-2 drop-shadow-lg group-hover:text-primary transition-colors duration-300"
          title={manga.title}
        >
          {manga.title}
        </h3>

        {/* Botão de adicionar - aparece no hover */}
        <button
          onClick={() => onSelect(manga)}
          className="w-full py-2 px-4 bg-primary-gradient text-white font-semibold rounded-lg opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300 hover:shadow-primary-glow flex items-center justify-center gap-2"
        >
          <PlusIcon className="w-5 h-5" />
          <span className="text-sm">Adicionar</span>
        </button>
      </div>

      {/* Ícone flutuante (alternativa ao botão inline) */}
      <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-300 transform scale-0 group-hover:scale-100">
        <div className="relative">
          <div className="absolute inset-0 bg-primary-gradient rounded-full blur-md opacity-75" />
          <div className="relative bg-primary-gradient p-2 rounded-full shadow-lg">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>
      </div>

      {/* Borda brilhante animada */}
      <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
        <div className="absolute top-0 left-0 right-0 h-px bg-primary opacity-50" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-primary opacity-50" />
      </div>
    </div>
  );
};

export default MangaCard;