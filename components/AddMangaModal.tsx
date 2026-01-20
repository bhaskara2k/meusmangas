import React, { useState, useEffect } from 'react';
import { MangaSearchResult, Publisher, MangaVolume, MangaStatus, SeriesStatusCollection } from '../types';
import { PUBLISHERS } from '../constants';
import { XIcon } from './icons/Icons';
import { getMangaVolumesWithCovers, getProxiedImageUrl } from '../services/mangaDexService';
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
    const controller = new AbortController();

    const fetchVolumes = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const volumes = await getMangaVolumesWithCovers(manga.id, controller.signal);
        setAllVolumes(volumes);
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          setError("Não foi possível carregar os volumes. Tente novamente.");
          console.error(err);
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    };

    fetchVolumes();

    return () => {
      controller.abort();
    };
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
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-slate-900/95 backdrop-blur-xl rounded-3xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col border border-white/10 animate-scale-in overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header Premium */}
        <header className="relative p-6 border-b border-white/10">
          {/* Brilho no topo */}
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-500/50 to-transparent" />

          <div className="flex justify-between items-start gap-4">
            <div className="flex-1">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent mb-1">
                Adicionar Volumes
              </h2>
              <p className="text-gray-400 text-sm line-clamp-1" title={manga.title}>
                {manga.title}
              </p>
            </div>

            {/* Botão fechar premium */}
            <button
              onClick={onClose}
              className="relative p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-red-500/20 hover:border-red-500/50 transition-all duration-300 group"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-red-500/0 to-red-500/0 group-hover:from-red-500/20 group-hover:to-pink-500/20 rounded-xl transition-all duration-300" />
              <XIcon className="w-6 h-6 text-gray-400 group-hover:text-red-400 relative z-10 transition-colors" />
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Info Section */}
          <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6">
            {/* Capa */}
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl blur-xl opacity-0 group-hover:opacity-50 transition-opacity duration-500" />
              <div className="relative bg-slate-900/60 backdrop-blur-sm border border-white/10 rounded-2xl p-3 overflow-hidden">
                <img
                  src={getProxiedImageUrl(manga.mainCoverUrl)}
                  alt={manga.title}
                  className="rounded-xl w-full aspect-[2/3] object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>

            {/* Configurações */}
            <div className="space-y-6">
              {/* Editora */}
              <div className="space-y-2">
                <label htmlFor="publisher" className="block text-sm font-semibold text-gray-300 uppercase tracking-wider">
                  Editora
                </label>
                <div className="relative group">
                  <select
                    id="publisher"
                    value={publisher}
                    onChange={(e) => setPublisher(e.target.value as Publisher)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-300 appearance-none cursor-pointer hover:bg-white/10"
                  >
                    {PUBLISHERS.map(p => <option key={p} value={p} className="bg-slate-900">{p}</option>)}
                  </select>
                  {/* Ícone de seta */}
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Status */}
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-gray-300 uppercase tracking-wider">
                  Status da Publicação
                </label>
                <div className="flex gap-4">
                  {[
                    { value: MangaStatus.ONGOING, label: 'Em Andamento', color: 'from-blue-600 to-cyan-600' },
                    { value: MangaStatus.FINISHED, label: 'Finalizado', color: 'from-green-600 to-emerald-600' }
                  ].map(({ value, label, color }) => (
                    <label
                      key={value}
                      className={`
                        flex-1 relative cursor-pointer group
                        ${status === value ? 'scale-105' : 'scale-100 hover:scale-102'}
                        transition-transform duration-300
                      `}
                    >
                      <input
                        type="radio"
                        name="manga-status"
                        value={value}
                        checked={status === value}
                        onChange={() => setStatus(value)}
                        className="sr-only"
                      />
                      <div className={`
                        relative p-4 rounded-xl border-2 transition-all duration-300
                        ${status === value
                          ? `border-transparent bg-gradient-to-r ${color}`
                          : 'border-white/10 bg-white/5 hover:bg-white/10'
                        }
                      `}>
                        {status === value && (
                          <div className={`absolute inset-0 bg-gradient-to-r ${color} rounded-xl blur opacity-50`} />
                        )}
                        <div className="relative flex items-center justify-center gap-2">
                          <div className={`
                            w-5 h-5 rounded-full border-2 flex items-center justify-center
                            ${status === value ? 'border-white' : 'border-gray-400'}
                          `}>
                            {status === value && (
                              <div className="w-2.5 h-2.5 rounded-full bg-white" />
                            )}
                          </div>
                          <span className={`font-semibold text-sm ${status === value ? 'text-white' : 'text-gray-400'}`}>
                            {label}
                          </span>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Divisor */}
          <div className="relative py-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            </div>
          </div>

          {/* Volumes Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-primary-gradient">
                Selecione os Volumes
              </h3>

              <div className="flex items-center gap-4">
                {!isLoading && !error && allVolumes.length > 0 && (
                  <button
                    onClick={() => {
                      const selectableVolumes = allVolumes.filter(v => !existingVolumes.has(v.volume));
                      if (selectedVolumes.size === selectableVolumes.length) {
                        setSelectedVolumes(new Map());
                      } else {
                        const newMap = new Map();
                        selectableVolumes.forEach(v => newMap.set(v.volume, v));
                        setSelectedVolumes(newMap);
                      }
                    }}
                    className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-primary transition-all duration-300 hover:scale-105 active:scale-95"
                  >
                    {selectedVolumes.size === allVolumes.filter(v => !existingVolumes.has(v.volume)).length && selectedVolumes.size > 0
                      ? 'Desmarcar Todos'
                      : 'Selecionar Todos'}
                  </button>
                )}
                <div className="px-4 py-2 rounded-xl bg-primary-gradient text-white text-xs font-black uppercase tracking-wider shadow-lg shadow-primary/20">
                  {selectedVolumes.size} selecionado{selectedVolumes.size !== 1 ? 's' : ''}
                </div>
              </div>
            </div>

            {/* Loading */}
            {isLoading && (
              <div className="flex flex-col items-center justify-center py-12 space-y-4">
                <LoadingSpinner />
                <p className="text-gray-400 text-sm animate-pulse">Carregando volumes...</p>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                <p className="text-red-400 text-center">{error}</p>
              </div>
            )}

            {/* Volumes Grid */}
            {!isLoading && !error && (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-4">
                {allVolumes.length > 0 ? allVolumes.map((vol, index) => {
                  const isSelected = selectedVolumes.has(vol.volume);
                  const alreadyExists = existingVolumes.has(vol.volume);

                  return (
                    <button
                      key={vol.volume}
                      onClick={() => !alreadyExists && handleVolumeToggle(vol)}
                      disabled={alreadyExists}
                      className={`
                        relative group aspect-[2/3] rounded-xl overflow-hidden transition-all duration-300
                        ${alreadyExists ? 'cursor-not-allowed opacity-50' : 'hover:scale-105 cursor-pointer'}
                        ${isSelected ? 'ring-4 ring-purple-500 shadow-lg shadow-purple-500/50' : 'ring-2 ring-white/10'}
                        animate-fade-in-up
                      `}
                      style={{ animationDelay: `${index * 30}ms` }}
                      title={alreadyExists ? `Volume ${vol.volume} já na coleção` : `Volume ${vol.volume}`}
                    >
                      {/* Imagem */}
                      <img
                        src={getProxiedImageUrl(vol.coverUrl)}
                        alt={`Volume ${vol.volume}`}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />

                      {/* Overlay */}
                      <div className={`
                        absolute inset-0 flex items-center justify-center transition-all duration-300
                        ${isSelected
                          ? 'bg-gradient-to-t from-primary/90 via-primary/60 to-transparent'
                          : 'bg-gradient-to-t from-black/80 via-black/40 to-transparent'
                        }
                        ${!alreadyExists && !isSelected ? 'group-hover:from-primary/60 group-hover:via-primary/30' : ''}
                      `}>
                        <span className="text-white text-2xl font-bold drop-shadow-2xl">
                          {vol.volume}
                        </span>
                      </div>

                      {/* Check icon */}
                      {isSelected && !alreadyExists && (
                        <div className="absolute top-2 right-2">
                          <div className="relative">
                            <div className="absolute inset-0 bg-primary-gradient rounded-full blur opacity-75" />
                            <div className="relative bg-primary-gradient p-1.5 rounded-full">
                              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Badge "Na Coleção" */}
                      {alreadyExists && (
                        <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-sm flex flex-col items-center justify-center">
                          <svg className="w-8 h-8 text-green-500 mb-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          <span className="text-green-400 text-xs font-bold uppercase">Na Coleção</span>
                        </div>
                      )}
                    </button>
                  );
                }) : (
                  <div className="col-span-full text-center py-12">
                    <div className="inline-flex flex-col items-center gap-3">
                      <div className="bg-slate-800/60 backdrop-blur-sm border border-white/10 rounded-full p-6">
                        <svg className="w-12 h-12 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                      </div>
                      <p className="text-gray-400">Nenhum volume encontrado</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </main>

        {/* Footer */}
        <footer className="relative p-6 border-t border-white/10">
          {/* Brilho no topo */}
          <div className="absolute top-0 left-0 right-0 h-px bg-primary-gradient opacity-50" />

          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-gray-300 font-semibold hover:bg-white/10 transition-all duration-300"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={selectedVolumes.size === 0}
              className="relative px-8 py-3 rounded-xl font-bold text-white overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed group transition-all duration-300 shadow-primary-glow hover:scale-105 disabled:hover:scale-100"
            >
              <div className="absolute inset-0 bg-primary-gradient" />
              <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <span className="relative flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
                Adicionar à Coleção
              </span>
            </button>
          </div>
        </footer>
      </div>

      {/* Animações */}
      <style>{`
        @keyframes scale-in {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        
        .animate-scale-in {
          animation: scale-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default AddMangaModal;