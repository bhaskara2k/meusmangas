import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { CollectionItem } from '../types';
import { getMangaVolumesWithCovers } from '../services/mangaDexService';
import LoadingSpinner from './LoadingSpinner';
import { XIcon } from './icons/Icons';
import { supabase } from '../supabase';
import { useUser } from '../contexts/UserContext';

export type TrackedVolumesConfig = Record<string, string[]>; // { [mangaId]: volume[] }
export type HiddenVolumesConfig = Record<string, string[]>; // { [mangaId]: volume[] }
interface CompletenessViewProps {
  collection: CollectionItem[];
  trackedVolumes: TrackedVolumesConfig;
  setTrackedVolumes: React.Dispatch<React.SetStateAction<TrackedVolumesConfig>>;
  hiddenVolumes: HiddenVolumesConfig;
  setHiddenVolumes: React.Dispatch<React.SetStateAction<HiddenVolumesConfig>>;
}

interface UniqueManga {
  title: string;
  mangaId: string;
}

const CompletenessView: React.FC<CompletenessViewProps> = ({ 
  collection, 
  trackedVolumes, 
  setTrackedVolumes,
  hiddenVolumes,
  setHiddenVolumes
}) => {
  const { user } = useUser();
  const [selectedMangaId, setSelectedMangaId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [apiVolumes, setApiVolumes] = useState<string[]>([]);
  const [ownedVolumes, setOwnedVolumes] = useState<Set<string>>(new Set());
  
  const uniqueMangaSeries = useMemo<UniqueManga[]>(() => {
    const mangaMap = new Map<string, string>();
    collection.forEach(item => {
      if (!mangaMap.has(item.mangaId)) {
        mangaMap.set(item.mangaId, item.title);
      }
    });
    return Array.from(mangaMap, ([mangaId, title]) => ({ mangaId, title }))
      .sort((a, b) => a.title.localeCompare(b.title));
  }, [collection]);

  const handleFetchVolumes = useCallback(async (mangaId: string) => {
    if (!mangaId) {
      setApiVolumes([]);
      setOwnedVolumes(new Set());
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const allApiVolumesResult = await getMangaVolumesWithCovers(mangaId);
      const allApiVolumeNumbers = allApiVolumesResult.map(v => v.volume);
      allApiVolumeNumbers.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
      setApiVolumes(allApiVolumeNumbers);

      const ownedVolumeNumbers = new Set(
        collection
          .filter(item => item.mangaId === mangaId)
          .map(item => item.volume)
      );
      setOwnedVolumes(ownedVolumeNumbers);

      if (!trackedVolumes[mangaId] && user) {
        const newTrackedVolumes = { ...trackedVolumes, [mangaId]: [...allApiVolumeNumbers] };
        setTrackedVolumes(newTrackedVolumes);
        await supabase
          .from('tracked_volumes')
          .upsert({ user_id: user.id, manga_id: mangaId, volumes: allApiVolumeNumbers });
      }

    } catch (err) {
      setError('Falha ao buscar volumes. A API pode estar indisponível.');
      console.error(err);
      setApiVolumes([]);
    } finally {
      setIsLoading(false);
    }
  }, [collection, trackedVolumes, setTrackedVolumes, user]);

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const mangaId = e.target.value;
    setSelectedMangaId(mangaId);
    handleFetchVolumes(mangaId);
  };
  
  const handleToggleTrackedVolume = async (volume: string) => {
    if (!selectedMangaId || !user) return;

    const currentTracked = new Set(trackedVolumes[selectedMangaId] || []);
    if (currentTracked.has(volume)) {
      currentTracked.delete(volume);
    } else {
      currentTracked.add(volume);
    }
    
    const sorted = Array.from(currentTracked).sort((a,b) => a.localeCompare(b, undefined, {numeric: true}));

    setTrackedVolumes(prev => ({ ...prev, [selectedMangaId]: sorted }));
    await supabase
      .from('tracked_volumes')
      .upsert({ user_id: user.id, manga_id: selectedMangaId, volumes: sorted });
  };

  const handleHideVolume = async (volumeToHide: string) => {
    if (!selectedMangaId || !user) return;

    const currentHidden = hiddenVolumes[selectedMangaId] || [];
    if (!currentHidden.includes(volumeToHide)) {
      const newHidden = [...currentHidden, volumeToHide];
      setHiddenVolumes(prev => ({ ...prev, [selectedMangaId]: newHidden }));
      await supabase
        .from('hidden_volumes')
        .upsert({ user_id: user.id, manga_id: selectedMangaId, volumes: newHidden });
    }

    const currentTracked = trackedVolumes[selectedMangaId] || [];
    if (currentTracked.includes(volumeToHide)) {
      const newTracked = currentTracked.filter(v => v !== volumeToHide);
      setTrackedVolumes(prev => ({ ...prev, [selectedMangaId]: newTracked }));
       await supabase
        .from('tracked_volumes')
        .upsert({ user_id: user.id, manga_id: selectedMangaId, volumes: newTracked });
    }
  };

  const handleRestoreHiddenVolumes = async () => {
    if (!selectedMangaId || !user) return;
    
    setHiddenVolumes(prev => {
      const newHidden = { ...prev };
      delete newHidden[selectedMangaId];
      return newHidden;
    });

    await supabase
      .from('hidden_volumes')
      .delete()
      .eq('user_id', user.id)
      .eq('manga_id', selectedMangaId);
  };


  const missingVolumes = useMemo(() => {
    if (!selectedMangaId || !trackedVolumes[selectedMangaId]) return [];
    
    const trackedSet = new Set(trackedVolumes[selectedMangaId]);
    return Array.from(trackedSet).filter(vol => !ownedVolumes.has(vol));
  }, [selectedMangaId, trackedVolumes, ownedVolumes]);

  const visibleApiVolumes = useMemo(() => {
    if (!selectedMangaId) return [];
    const hiddenSet = new Set(hiddenVolumes[selectedMangaId] || []);
    return apiVolumes.filter(vol => !hiddenSet.has(vol));
  }, [apiVolumes, hiddenVolumes, selectedMangaId]);


  const renderResult = () => {
    if (isLoading) return <LoadingSpinner />;
    if (error) return <p className="text-center text-red-500 dark:text-red-400 mt-6">{error}</p>;
    if (!selectedMangaId || (apiVolumes.length === 0 && !isLoading)) return null;

    const isComplete = missingVolumes.length === 0;
    const hasHiddenVolumes = (hiddenVolumes[selectedMangaId]?.length || 0) > 0;

    return (
      <div className="mt-8 bg-card/50 border border-border p-6 rounded-lg">
        <div className="text-center mb-6">
          {isComplete ? (
             <div className="text-center bg-green-100 dark:bg-green-900/50 border border-green-300 dark:border-green-700 p-4 rounded-lg">
                <h3 className="text-2xl font-bold text-green-800 dark:text-green-300">Coleção Completa!</h3>
                <p className="text-green-700 dark:text-green-400 mt-2">Parabéns! Você tem todos os volumes rastreados.</p>
             </div>
          ) : (
             <div className="text-center bg-yellow-100 dark:bg-yellow-900/50 border border-yellow-300 dark:border-yellow-700 p-4 rounded-lg">
                <h3 className="text-2xl font-bold text-yellow-800 dark:text-yellow-300">Coleção Incompleta</h3>
                <p className="text-muted-foreground mt-2">Faltam <span className="font-bold text-foreground">{missingVolumes.length}</span> volumes para completar a série:</p>
                <div className="mt-4 max-h-32 overflow-y-auto custom-scrollbar p-2 bg-background/50 rounded-md">
                    <div className="flex flex-wrap justify-center gap-2">
                        {missingVolumes.map(vol => (
                            <span key={vol} className="bg-muted text-muted-foreground text-xs font-mono px-2 py-1 rounded">
                                {vol}
                            </span>
                        ))}
                    </div>
                </div>
             </div>
          )}
        </div>

        <div>
           <div className="flex justify-between items-center mb-2">
            <h4 className="text-lg font-semibold text-foreground">Gerenciar Volumes Rastreáveis</h4>
            {hasHiddenVolumes && (
              <button onClick={handleRestoreHiddenVolumes} className="text-sm text-primary hover:text-primary/80 transition-colors">
                Restaurar Ocultos ({hiddenVolumes[selectedMangaId]?.length})
              </button>
            )}
          </div>
          <p className="text-sm text-muted-foreground mb-4">Desmarque os volumes que você não deseja colecionar. Passe o mouse para ocultar.</p>
          <div className="flex flex-wrap justify-center gap-2 max-h-80 overflow-y-auto p-2 bg-background/50 rounded-md custom-scrollbar">
            {visibleApiVolumes.map(vol => {
              const isOwned = ownedVolumes.has(vol);
              const isTracked = trackedVolumes[selectedMangaId]?.includes(vol);
              
              let bgColor = 'bg-muted hover:bg-accent';
              if (isOwned) bgColor = 'bg-green-600 text-white cursor-not-allowed';
              else if (isTracked) bgColor = 'bg-primary hover:bg-primary/90 text-primary-foreground';

              return (
                <div key={vol} className="relative group">
                  <button 
                    disabled={isOwned}
                    onClick={() => handleToggleTrackedVolume(vol)}
                    className={`
                      w-20 text-center px-3 py-2 rounded-md text-sm font-semibold transition-colors duration-150
                      focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background focus:ring-ring
                      ${bgColor}
                    `}
                  >
                    <div className="flex items-center justify-center gap-2">
                      {isOwned ? 
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg> : 
                        <div className={`w-4 h-4 rounded border-2 ${isTracked ? 'bg-white border-white' : 'border-muted-foreground'}`}></div>
                      }
                      <span>{vol}</span>
                    </div>
                  </button>
                  {!isOwned && (
                    <button
                      onClick={() => handleHideVolume(vol)}
                      className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-red-500 focus:outline-none focus:ring-2 focus:ring-red-400"
                      aria-label={`Ocultar volume ${vol}`}
                    >
                      <XIcon className="w-3 h-3" />
                    </button>
                  )}
                </div>
              );
            })}
             {visibleApiVolumes.length === 0 && apiVolumes.length > 0 && (
                <p className="text-muted-foreground text-center w-full py-4">Todos os volumes estão ocultos.</p>
              )}
          </div>
        </div>
      </div>
    );
  };
  

  if (collection.length === 0) {
    return (
      <div className="text-center py-16">
        <h2 className="text-2xl font-semibold text-muted-foreground">Sua Coleção está Vazia</h2>
        <p className="text-muted-foreground/80 mt-2">Adicione mangás à sua coleção para poder verificar se estão completos.</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: hsl(var(--muted));
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: hsl(var(--primary));
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: hsl(var(--primary) / 0.8);
        }
      `}</style>
      <div className="text-center">
        <h2 className="text-3xl font-bold text-foreground">Verificador de Coleção</h2>
        <p className="text-muted-foreground mt-2">Selecione uma série para gerenciar e verificar sua completude.</p>
      </div>
      
      <div className="relative mt-8">
        <select
          value={selectedMangaId}
          onChange={handleSelectChange}
          aria-label="Selecionar série para verificar"
          className="w-full pl-4 pr-10 py-3 bg-card border-2 border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary transition-colors duration-200 block appearance-none"
        >
          <option value="">-- Selecione um Título --</option>
          {uniqueMangaSeries.map(manga => (
            <option key={manga.mangaId} value={manga.mangaId}>{manga.title}</option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-muted-foreground">
          <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
        </div>
      </div>

      <div className="mt-4">
        {renderResult()}
      </div>
    </div>
  );
};

export default CompletenessView;