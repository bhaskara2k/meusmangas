import React, { useState } from 'react';
import { CollectionItem } from '../types';
import { XIcon } from './icons/Icons';
import { getProxiedImageUrl } from '../services/mangaDexService';

interface CollectionCardProps {
  item: CollectionItem;
  onRemove: (itemId: string) => void;
}

const publisherLogoMap: { [key: string]: string } = {
  "Panini": "/logos/panini.png",
  "JBC": "/logos/jbc.png",
  "NewPOP": "/logos/newpop.png",
  "MPEG": "/logos/mpeg.png",
  "Conrad": "/logos/conrad.png",
};

const CollectionCard: React.FC<CollectionCardProps> = ({ item, onRemove }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const formattedVolume = item.volume.padStart(3, '0');

  return (
    <div className="group relative">
      {/* Container Principal com Glassmorphism */}
      <div className="relative bg-white dark:bg-slate-900/40 backdrop-blur-sm rounded-2xl overflow-hidden border border-gray-200 dark:border-white/10 transition-all duration-500 hover:scale-105 hover:border-purple-500/50 hover:shadow-2xl hover:shadow-purple-500/20 shadow-md dark:shadow-none">

        {/* Glow animado no hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-purple-600/0 via-purple-600/0 to-purple-600/0 group-hover:from-purple-600/20 group-hover:via-purple-600/10 group-hover:to-transparent transition-all duration-500 pointer-events-none z-10" />

        {/* Skeleton loader */}
        {!imageLoaded && (
          <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-slate-800 dark:to-slate-900 animate-pulse" />
        )}

        {/* Imagem */}
        <div className="relative aspect-[2/3] overflow-hidden">
          <img
            src={getProxiedImageUrl(item.imageUrl)}
            alt={`${item.title} Vol. ${item.volume}`}
            className={`w-full h-full object-cover transition-all duration-700 ${imageLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-110'
              } group-hover:scale-110`}
            loading="lazy"
            referrerPolicy="no-referrer"
            onLoad={() => setImageLoaded(true)}
          />

          {/* Overlay de Gradiente */}
          <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black via-black/40 to-transparent dark:from-slate-950 dark:via-slate-950/60 opacity-70 group-hover:opacity-85 transition-opacity duration-300" />

          {/* Logo da Editora (Flutuante no Topo) */}
          <div className="absolute top-3 left-3 z-20">
            <div className="px-2 py-1 bg-white/60 dark:bg-black/40 backdrop-blur-md rounded-lg border border-gray-200 dark:border-white/10 flex items-center justify-center shadow-lg transition-colors">
              <img
                src={publisherLogoMap[item.publisher]}
                alt={item.publisher}
                className="h-4 object-contain brightness-110 contrast-125"
              />
            </div>
          </div>

          {/* Botão de Remover Premium */}
          <button
            onClick={() => onRemove(item.id)}
            className="absolute top-2 right-2 z-30 flex items-center justify-center w-8 h-8 bg-red-500/20 backdrop-blur-md border border-red-500/30 rounded-full text-red-500 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-[-10px] group-hover:translate-y-0 hover:bg-red-500 hover:text-white hover:scale-110 hover:shadow-lg hover:shadow-red-500/40"
            aria-label={`Remover ${item.title} da coleção`}
          >
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Informações Inferiores */}
        <div className="absolute bottom-0 left-0 right-0 p-4 z-20 transform transition-transform duration-300">
          <div className="flex flex-col gap-1">
            <h3 className="text-[10px] font-black text-gray-400 dark:text-gray-400 uppercase tracking-widest truncate drop-shadow-md" title={item.title}>
              {item.title}
            </h3>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-bold text-white">Vol.</span>
              <span className="text-2xl font-black bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent drop-shadow-md">
                {formattedVolume}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CollectionCard;