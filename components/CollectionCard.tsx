import React from 'react';
import { CollectionItem } from '../types';
import { XIcon } from './icons/Icons';

interface CollectionCardProps {
  item: CollectionItem;
  onRemove: (itemId: string) => void;
}

const publisherColorMap: { [key: string]: string } = {
  "Panini": "bg-red-600",
  "JBC": "bg-blue-600",
  "NewPOP": "bg-pink-500",
  "MPEG": "bg-green-600",
  "Conrad": "bg-yellow-500",
};

const CollectionCard: React.FC<CollectionCardProps> = ({ item, onRemove }) => {
  const formattedVolume = item.volume.padStart(3, '0');
  const fullTitle = `${item.title} - Volume #${formattedVolume}`;

  return (
    <div>
      <div className="group relative rounded-lg overflow-hidden shadow-lg">
        <img
          src={item.imageUrl}
          alt={`${item.title} Vol. ${item.volume}`}
          className="w-full h-auto aspect-[2/3] object-cover"
          loading="lazy"
        />
        {/* Remove Button */}
        <button
          onClick={() => onRemove(item.id)}
          className="absolute top-2 right-2 flex items-center justify-center w-8 h-8 bg-red-600/80 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-red-400"
          aria-label={`Remover ${item.title} Vol. ${item.volume} da coleção`}
        >
          <XIcon className="w-5 h-5" />
        </button>
      </div>

      <div className="pt-3">
        <h3 className="text-sm font-semibold text-foreground truncate" title={fullTitle}>
          {fullTitle}
        </h3>
        <div className="mt-2">
           <span className={`inline-block px-2 py-1 text-xs font-bold text-white rounded-md ${publisherColorMap[item.publisher] || 'bg-gray-500'}`}>
            {item.publisher}
          </span>
        </div>
      </div>
    </div>
  );
};

export default CollectionCard;