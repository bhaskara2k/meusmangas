import React, { useState, useMemo, useCallback } from 'react';
import { CollectionItem, MangaVolume } from '../types';
import { getMangaVolumesWithCovers } from '../services/mangaDexService';
import LoadingSpinner from './LoadingSpinner';
import { XIcon, CompletenessIcon } from './icons/Icons';
import { useUser } from '../contexts/UserContext';
import * as firestoreService from '../services/firestoreService';

export type TrackedVolumesConfig = Record<string, string[]>; // { [mangaId]: volume[] }
export type HiddenVolumesConfig = Record<string, string[]>; // { [mangaId]: volume[] }

interface CompletenessViewProps {
  collection: CollectionItem[];
  trackedVolumes: TrackedVolumesConfig;
  setTrackedVolumes: React.Dispatch<React.SetStateAction<TrackedVolumesConfig>>;
  hiddenVolumes: HiddenVolumesConfig;
  setHiddenVolumes: (val: HiddenVolumesConfig | ((prev: HiddenVolumesConfig) => HiddenVolumesConfig)) => void;
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
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [apiVolumes, setApiVolumes] = useState<string[]>([]);
  const [ownedVolumes, setOwnedVolumes] = useState<Set<string>>(new Set());

  const uniqueMangaSeries = useMemo<UniqueManga[]>(() => {
    const mangaMap = new Map<string, string>();
    collection.forEach((item: CollectionItem) => {
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
      const allApiVolumesResult: MangaVolume[] = await getMangaVolumesWithCovers(mangaId);
      const allApiVolumeNumbers = allApiVolumesResult.map(v => v.volume);
      allApiVolumeNumbers.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
      setApiVolumes(allApiVolumeNumbers);

      const ownedVolumeNumbers = new Set(
        collection
          .filter((item: CollectionItem) => item.mangaId === mangaId)
          .map((item: CollectionItem) => item.volume)
      );
      setOwnedVolumes(ownedVolumeNumbers);

      if (!trackedVolumes[mangaId] && user) {
        const newTracked = { ...trackedVolumes, [mangaId]: [...allApiVolumeNumbers] };
        setTrackedVolumes(newTracked);
        await firestoreService.updateMangaVolumeConfigs(
          user.uid,
          mangaId,
          allApiVolumeNumbers,
          hiddenVolumes[mangaId] || []
        );
      }

    } catch (err) {
      setError('Falha ao buscar volumes. A API pode estar indisponível.');
      console.error(err);
      setApiVolumes([]);
    } finally {
      setIsLoading(false);
    }
  }, [collection, trackedVolumes, hiddenVolumes, setTrackedVolumes, user]);

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const mangaId = e.target.value;
    setSelectedMangaId(mangaId);
    handleFetchVolumes(mangaId);
  };

  const saveVolumeChanges = async (mangaId: string, newTracked: string[], newHidden: string[]) => {
    if (!user || isUpdating) return;

    setError(null);
    setIsUpdating(true);

    const originalTracked = trackedVolumes[mangaId] || [];
    const originalHidden = hiddenVolumes[mangaId] || [];

    // Optimistic UI update
    setTrackedVolumes((prev: TrackedVolumesConfig) => ({ ...prev, [mangaId]: newTracked }));
    setHiddenVolumes((prev: HiddenVolumesConfig) => ({ ...prev, [mangaId]: newHidden }));

    try {
      await firestoreService.updateMangaVolumeConfigs(
        user.uid,
        mangaId,
        newTracked,
        newHidden
      );
    } catch (err) {
      console.error("Failed to save volume changes:", err);
      setError("Não foi possível salvar a alteração. Tente novamente.");
      // Rollback on failure
      setTrackedVolumes((prev: TrackedVolumesConfig) => ({ ...prev, [mangaId]: originalTracked }));
      setHiddenVolumes((prev: HiddenVolumesConfig) => ({ ...prev, [mangaId]: originalHidden }));
    } finally {
      setIsUpdating(false);
    }
  };

  const handleToggleTrackedVolume = (volume: string) => {
    if (!selectedMangaId) return;

    const currentTracked = new Set<string>(trackedVolumes[selectedMangaId] || []);
    if (currentTracked.has(volume)) {
      currentTracked.delete(volume);
    } else {
      currentTracked.add(volume);
    }
    const newTrackedSorted = Array.from<string>(currentTracked).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

    saveVolumeChanges(selectedMangaId, newTrackedSorted, (hiddenVolumes[selectedMangaId] || []) as string[]);
  };

  const handleHideVolume = (volumeToHide: string) => {
    if (!selectedMangaId) return;

    const currentHidden = (hiddenVolumes[selectedMangaId] || []) as string[];
    if (currentHidden.includes(volumeToHide)) return;

    const newHidden = [...currentHidden, volumeToHide].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
    const newTracked = ((trackedVolumes[selectedMangaId] || []) as string[]).filter(v => v !== volumeToHide);

    saveVolumeChanges(selectedMangaId, newTracked, newHidden);
  };

  const handleRestoreHiddenVolumes = () => {
    if (!selectedMangaId || (hiddenVolumes[selectedMangaId] || []).length === 0) return;
    saveVolumeChanges(selectedMangaId, (trackedVolumes[selectedMangaId] || []) as string[], []);
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
    if (isLoading) return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <LoadingSpinner />
        <p className="text-slate-500 dark:text-gray-400 text-sm animate-pulse font-bold">Sincronizando volumes...</p>
      </div>
    );

    if (!selectedMangaId || (apiVolumes.length === 0 && !isLoading)) {
      if (error && !isLoading) return (
        <div className="mt-8 bg-red-500/10 border border-red-500/20 p-6 rounded-2xl text-center shadow-lg transition-all">
          <p className="text-red-600 dark:text-red-400 font-black">{error}</p>
        </div>
      );
      return null;
    }

    const isComplete = missingVolumes.length === 0;
    const hasHiddenVolumes = (hiddenVolumes[selectedMangaId]?.length || 0) > 0;

    return (
      <div className="mt-8 space-y-10 animate-fade-in-up">
        {/* Status Section */}
        <div className={`relative p-10 rounded-[2.5rem] border shadow-2xl overflow-hidden transition-all duration-700 ${isComplete
          ? 'bg-green-500/[0.03] dark:bg-green-500/5 border-green-500/20 dark:border-green-500/30'
          : 'bg-yellow-500/[0.03] dark:bg-yellow-500/5 border-yellow-500/20 dark:border-yellow-500/30'
          }`}>
          {/* Background Gradient Glow */}
          <div className={`absolute -right-20 -top-20 w-80 h-80 blur-[120px] opacity-10 dark:opacity-20 pointer-events-none transition-all duration-1000 ${isComplete ? 'bg-green-400' : 'bg-yellow-400'
            }`} />

          <div className="relative z-10 flex flex-col items-center text-center space-y-6">
            <div className={`p-6 rounded-3xl shadow-xl shadow-black/10 transition-transform duration-500 hover:scale-110 ${isComplete ? 'bg-gradient-to-br from-green-500 to-emerald-700' : 'bg-gradient-to-br from-yellow-500 to-orange-600 font-black'
              }`}>
              {isComplete ? (
                <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <span className="text-4xl text-white font-black">{missingVolumes.length}</span>
              )}
            </div>

            <div className="space-y-2">
              <h3 className={`text-4xl font-black tracking-tight ${isComplete ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-400'
                }`}>
                {isComplete ? 'Coleção Completa!' : 'Coleção Incompleta'}
              </h3>
              <p className="text-slate-600 dark:text-gray-400 font-bold text-lg">
                {isComplete
                  ? 'Parabéns! Você possui todos os volumes rastreados.'
                  : `Ops! Ainda faltam ${missingVolumes.length} volumes para fechar a série.`}
              </p>
            </div>

            {!isComplete && (
              <div className="w-full mt-6 p-6 bg-white dark:bg-black/20 backdrop-blur-md border border-gray-200 dark:border-white/10 rounded-3xl shadow-inner shadow-gray-200 dark:shadow-none">
                <div className="flex flex-wrap justify-center gap-2.5 max-h-40 overflow-y-auto custom-scrollbar pr-3">
                  {missingVolumes.map(vol => (
                    <span key={vol} className="bg-white dark:bg-slate-800 text-yellow-600 dark:text-yellow-400/80 text-xs font-black px-4 py-2 rounded-xl border border-yellow-500/20 dark:border-yellow-500/10 shadow-sm uppercase tracking-wider transition-all hover:scale-105 hover:bg-yellow-50 dark:hover:bg-yellow-950/20">
                      Vol. {vol}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Management Section */}
        <div className="bg-white dark:bg-slate-900/40 backdrop-blur-md border border-gray-200 dark:border-white/10 p-10 rounded-[2.5rem] shadow-xl dark:shadow-2xl space-y-8 transition-colors">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
            <div className="space-y-1">
              <h4 className="text-2xl font-black bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-gray-400 bg-clip-text text-transparent italic tracking-tight">
                Rastreamento Inteligente
              </h4>
              <p className="text-sm text-slate-500 dark:text-gray-400 font-bold uppercase tracking-widest">
                Personalize sua estante virtual
              </p>
            </div>

            {hasHiddenVolumes && (
              <button
                onClick={handleRestoreHiddenVolumes}
                className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-purple-600/10 border border-purple-500/20 text-purple-600 dark:text-purple-400 hover:bg-purple-600 hover:text-white transition-all duration-500 group font-black shadow-sm"
                disabled={isUpdating}
              >
                <span>Restaurar {hiddenVolumes[selectedMangaId]?.length} ocultos</span>
              </button>
            )}
          </div>

          <div className="flex flex-wrap justify-center gap-4 p-8 bg-gray-50/50 dark:bg-black/20 rounded-3xl border border-gray-100 dark:border-white/5 max-h-[30rem] overflow-y-auto custom-scrollbar shadow-inner">
            {visibleApiVolumes.map((vol, index) => {
              const isOwned = ownedVolumes.has(vol);
              const isTracked = trackedVolumes[selectedMangaId]?.includes(vol);

              let buttonStyles = 'bg-white dark:bg-slate-800 border-gray-200 dark:border-white/10 text-slate-400 dark:text-gray-600 hover:border-purple-500/50 hover:text-purple-600 dark:hover:text-white shadow-sm';
              if (isOwned) buttonStyles = 'bg-gradient-to-br from-green-600 to-emerald-800 dark:from-green-500 dark:to-emerald-700 text-white border-transparent shadow-lg shadow-green-900/20 dark:shadow-green-900/40';
              else if (isTracked) buttonStyles = 'bg-gradient-to-br from-purple-600 to-indigo-800 dark:from-purple-600 dark:to-indigo-700 text-white border-transparent shadow-lg shadow-purple-900/20 dark:shadow-purple-900/40';

              return (
                <div
                  key={vol}
                  className="relative group animate-fade-in-up"
                  style={{ animationDelay: `${index * 15}ms` }}
                >
                  <button
                    disabled={isOwned || isUpdating}
                    onClick={() => handleToggleTrackedVolume(vol)}
                    className={`
                      min-w-[85px] px-5 py-3 rounded-2xl text-base font-black tracking-tighter transition-all duration-300 border
                      flex items-center justify-center gap-3
                      ${buttonStyles}
                      ${isUpdating ? 'opacity-50 cursor-wait' : 'hover:scale-110 active:scale-90 shadow-md hover:shadow-xl'}
                    `}
                  >
                    {isOwned ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <div className={`w-3.5 h-3.5 rounded-full border-2 transition-all ${isTracked ? 'bg-white border-white shadow-[0_0_10px_white]' : 'border-gray-300 dark:border-gray-600'}`} />
                    )}
                    <span>{vol}</span>
                  </button>

                  {!isOwned && (
                    <button
                      onClick={() => handleHideVolume(vol)}
                      disabled={isUpdating}
                      className="absolute -top-2.5 -right-2.5 w-7 h-7 bg-red-600 border-2 border-white dark:border-slate-900 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all duration-500 hover:scale-125 hover:rotate-90 shadow-xl z-10"
                      aria-label={`Ocultar volume ${vol}`}
                    >
                      <XIcon className="w-4 h-4" />
                    </button>
                  )}
                </div>
              );
            })}

            {visibleApiVolumes.length === 0 && apiVolumes.length > 0 && (
              <div className="flex flex-col items-center py-20 opacity-40">
                <svg className="w-16 h-16 text-slate-400 dark:text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                <p className="text-slate-600 dark:text-gray-500 text-xl font-black italic">Todos os volumes estão ocultos.</p>
              </div>
            )}
          </div>

          <div className="flex items-center justify-center gap-3 py-2">
            <div className="h-px w-8 bg-gray-200 dark:bg-white/10" />
            <p className="text-[10px] text-slate-400 dark:text-gray-600 uppercase tracking-[0.2em] font-black">
              Passe o mouse para ocultar permanentemente
            </p>
            <div className="h-px w-8 bg-gray-200 dark:bg-white/10" />
          </div>
        </div>
      </div>
    );
  };


  if (collection.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 px-4 animate-fade-in">
        <div className="relative mb-8">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full blur-3xl opacity-10 dark:opacity-20" />
          <div className="relative bg-white dark:bg-slate-900/60 backdrop-blur-xl border border-gray-100 dark:border-white/10 rounded-full p-10 shadow-2xl">
            <CompletenessIcon className="w-20 h-20 text-gray-400 dark:text-gray-500" />
          </div>
        </div>
        <h2 className="text-3xl font-black bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-gray-400 bg-clip-text text-transparent mb-4">
          Nada para Verificar
        </h2>
        <p className="text-slate-600 dark:text-gray-400 text-lg max-w-md text-center font-bold">
          Sua coleção está vazia. Adicione mangás para que possamos ajudar você a completar suas séries favoritas.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-12 animate-fade-in px-4">
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(139, 92, 246, 0.2);
          border-radius: 20px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(139, 92, 246, 0.4);
        }
      `}</style>

      {/* Header section */}
      <div className="text-center space-y-4">
        <div className="inline-block px-5 py-2 rounded-full bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 backdrop-blur-md shadow-sm transition-all duration-300">
          <span className="text-xs font-black uppercase tracking-[0.2em] text-purple-600 dark:text-purple-400">Verificador Elite</span>
        </div>
        <h2 className="text-5xl font-black text-slate-900 dark:text-white tracking-tighter">Integridade da <span className="bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400 bg-clip-text text-transparent italic">Coleção</span></h2>
        <p className="text-slate-500 dark:text-gray-400 text-xl font-bold">Gerencie o que falta para completar sua estante de luxo</p>
      </div>

      {/* Selection Filter */}
      <div className="relative group max-w-2xl mx-auto">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-[2rem] blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
        <div className="relative">
          <select
            value={selectedMangaId}
            onChange={handleSelectChange}
            aria-label="Selecionar série para verificar"
            className="w-full pl-8 pr-16 py-6 bg-white dark:bg-slate-900/40 backdrop-blur-md border-2 border-gray-200 dark:border-white/10 rounded-[2rem] text-slate-900 dark:text-white font-black text-xl focus:outline-none focus:ring-4 focus:ring-purple-500/10 appearance-none transition-all duration-500 hover:border-purple-500/50 cursor-pointer shadow-xl dark:shadow-none"
          >
            <option value="" className="bg-white dark:bg-slate-900">-- Selecione um Título --</option>
            {uniqueMangaSeries.map(manga => (
              <option key={manga.mangaId} value={manga.mangaId} className="bg-white dark:bg-slate-900">{manga.title}</option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-8 text-purple-600 dark:text-purple-400">
            <svg className="w-8 h-8 transition-transform group-hover:translate-y-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>

      <div className="transition-all duration-700">
        {renderResult()}
      </div>

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes fade-in-up {
          from { 
            opacity: 0; 
            transform: translateY(40px); 
          }
          to { 
            opacity: 1; 
            transform: translateY(0); 
          }
        }
        .animate-fade-in {
          animation: fade-in 1s ease-out forwards;
        }
        .animate-fade-in-up {
          animation: fade-in-up 1s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
      `}</style>
    </div>
  );
};

export default CompletenessView;