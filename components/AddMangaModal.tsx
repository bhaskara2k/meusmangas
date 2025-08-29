import React, { useState, useEffect } from 'react';
import { MangaSearchResult, Publisher, MangaVolume, MangaStatus, SeriesStatusCollection } from '../types';
import { PUBLISHERS } from '../constants';
import { XIcon } from './icons/Icons';
import { getMangaVolumesWithCovers } from '../services/mangaDexService';
import LoadingSpinner from './LoadingSpinner';

interface AddMangaModalProps {
  manga: MangaSearchResult;
  existingVolumes: Set<string>;
  seriesStatus: SeriesStatusCollection;
  onClose: () => void;
  onSave: (manga: MangaSearchResult, volumes: MangaVolume[], publisher: Publisher, status: MangaStatus) => void;
}

const AddMangaModal: React.FC<AddMangaModalProps> = ({ manga, existingVolumes, seriesStatus, onClose, onSave }) => {
  const [selectedVolumes, setSelectedVolumes] = useState<Map<string, MangaVolume>>(new Map());
  const [publisher, setPublisher] = useState<Publisher>(PUBLISHERS[0]);
  const [status, setStatus] = useState<MangaStatus>(seriesStatus[manga.id] || MangaStatus.ONGOING);
  const [allVolumes, setAllVolumes] = useState<MangaVolume[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchVolumes = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const volumes = await getMangaVolumesWithCovers(manga.id);
        setAllVolumes(volumes);
      } catch (err) {
        setError("Não foi possível carregar os volumes. Tente novamente.");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchVolumes();
  }, [manga.id]);

  const handleVolumeToggle = (volume: MangaVolume) => {
    setSelectedVolumes(prev => {
      const newMap = new Map(prev);
      if (newMap.has(volume.volume)) {
        newMap.delete(volume.volume);
      } else {
        newMap.set(volume.volume, volume);
      }
      return newMap;
    });
  };

  const handleSave = () => {
    if (selectedVolumes.size > 0) {
      onSave(manga, Array.from(selectedVolumes.values()), publisher, status);
    }
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div 
        className="bg-card rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col border border-border"
        onClick={e => e.stopPropagation()}
      >
        <header className="flex justify-between items-center p-4 border-b border-border">
          <h2 className="text-xl font-bold text-foreground truncate" title={manga.title}>Adicionar Volumes de "{manga.title}"</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-accent transition-colors">
            <XIcon className="w-6 h-6 text-muted-foreground" />
          </button>
        </header>

        <main className="p-6 overflow-y-auto space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <img src={manga.mainCoverUrl} alt={manga.title} className="rounded-lg w-full max-w-xs mx-auto aspect-[2/3] object-cover" />
            <div className="space-y-6">
              <div>
                <label htmlFor="publisher" className="block text-sm font-medium text-foreground/90 mb-2">Editora</label>
                <select
                  id="publisher"
                  value={publisher}
                  onChange={(e) => setPublisher(e.target.value as Publisher)}
                  className="w-full bg-input border border-border rounded-md px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {PUBLISHERS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground/90">Status da Publicação</label>
                <div className="mt-2 flex gap-x-6">
                   <label className="flex items-center gap-2 cursor-pointer text-foreground">
                      <input
                        type="radio"
                        name="manga-status"
                        value={MangaStatus.ONGOING}
                        checked={status === MangaStatus.ONGOING}
                        onChange={() => setStatus(MangaStatus.ONGOING)}
                        className="h-4 w-4 accent-primary bg-input border-border focus:ring-ring focus:ring-2"
                      />
                      <span>{MangaStatus.ONGOING}</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-foreground">
                      <input
                        type="radio"
                        name="manga-status"
                        value={MangaStatus.FINISHED}
                        checked={status === MangaStatus.FINISHED}
                        onChange={() => setStatus(MangaStatus.FINISHED)}
                        className="h-4 w-4 accent-primary bg-input border-border focus:ring-ring focus:ring-2"
                      />
                      <span>{MangaStatus.FINISHED}</span>
                    </label>
                </div>
              </div>
            </div>
          </div>
          
          <hr className="border-border" />

          <div>
            <h3 className="text-lg font-semibold text-foreground/90 mb-4">Selecione os Volumes ({selectedVolumes.size} selecionados)</h3>
            {isLoading && <LoadingSpinner />}
            {error && <p className="text-center text-red-500 dark:text-red-400">{error}</p>}
            {!isLoading && !error && (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
                {allVolumes.length > 0 ? allVolumes.map(vol => {
                  const isSelected = selectedVolumes.has(vol.volume);
                  const alreadyExists = existingVolumes.has(vol.volume);
                  return (
                    <button
                      key={vol.volume}
                      onClick={() => handleVolumeToggle(vol)}
                      disabled={alreadyExists}
                      className={`
                        relative w-full aspect-[2/3] rounded-md overflow-hidden transition-all duration-200 transform
                        focus:outline-none focus:ring-4
                        ${alreadyExists ? 'cursor-not-allowed grayscale' : 'hover:scale-105'}
                        ${isSelected ? 'ring-primary' : 'ring-transparent'}
                        ${!alreadyExists && !isSelected ? 'hover:ring-primary/80' : ''}
                      `}
                      title={alreadyExists ? `Volume ${vol.volume} já na coleção` : `Selecionar volume ${vol.volume}`}
                    >
                      <img src={vol.coverUrl} alt={`Capa do Volume ${vol.volume}`} className="w-full h-full object-cover"/>
                      <div className={`absolute inset-0 flex items-center justify-center transition-colors duration-200 ${isSelected ? 'bg-black/60' : 'bg-black/20 group-hover:bg-black/40'}`}>
                        <span className="text-white text-2xl font-bold drop-shadow-lg">{vol.volume}</span>
                      </div>
                       {alreadyExists && <div className="absolute inset-0 bg-card/80 flex items-center justify-center"><span className="text-foreground text-xs font-bold">NA COLEÇÃO</span></div>}
                    </button>
                  );
                }) : <p className="col-span-full text-muted-foreground text-center py-4">Nenhuma capa de volume encontrada para este título.</p>}
              </div>
            )}
          </div>
        </main>
        
        <footer className="p-4 border-t border-border flex justify-end">
          <button
            onClick={handleSave}
            disabled={selectedVolumes.size === 0}
            className="px-6 py-2 bg-primary text-primary-foreground font-semibold rounded-md hover:bg-primary/90 transition-colors disabled:bg-muted disabled:cursor-not-allowed"
          >
            Adicionar à Coleção
          </button>
        </footer>
      </div>
    </div>
  );
};

export default AddMangaModal;