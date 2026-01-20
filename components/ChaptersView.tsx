import React, { useState, useEffect } from 'react';
import { ChapterProgress, MangaSearchResult } from '../types';
import { SearchIcon, BookOpenIcon, PlusIcon, TrashIcon, PencilIcon, CheckIcon, XIcon } from './icons/Icons';
import { searchManga, getLatestChapter } from '../services/mangaDexService';
import { useUser } from '../contexts/UserContext';
import * as firestoreService from '../services/firestoreService';
import LoadingSpinner from './LoadingSpinner';

const ChaptersView: React.FC = () => {
    const { user } = useUser();
    const [progressList, setProgressList] = useState<ChapterProgress[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<MangaSearchResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [isAdding, setIsAdding] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [editingMangaId, setEditingMangaId] = useState<string | null>(null);
    const [editingValue, setEditingValue] = useState<string>('');

    useEffect(() => {
        if (user) {
            loadProgress();
        }
    }, [user]);

    const loadProgress = async () => {
        if (!user) return;
        setIsLoading(true);
        try {
            const data = await firestoreService.getChapterProgress(user.uid);
            const progresses = data as ChapterProgress[];

            // Mostrar lista imediata do Firestore
            setProgressList(progresses);

            // Atualizar capítulos em lotes para não sobrecarregar a API
            const updatedList = [...progresses];
            const batchSize = 3;

            for (let i = 0; i < updatedList.length; i += batchSize) {
                const batch = updatedList.slice(i, i + batchSize);
                await Promise.all(batch.map(async (p, idx) => {
                    try {
                        const lastChapter = await getLatestChapter(p.mangaId);
                        updatedList[i + idx] = { ...p, lastChapter };
                    } catch (err) {
                        console.error(`Error fetching chapter for ${p.title}:`, err);
                    }
                }));
                // Atualizar UI progressivamente após cada lote
                setProgressList([...updatedList]);

                // Pequena pausa entre lotes se a API estiver lenta
                if (i + batchSize < updatedList.length) {
                    await new Promise(resolve => setTimeout(resolve, 500));
                }
            }
        } catch (error) {
            console.error("Error loading chapter progress:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSearch = async () => {
        if (!searchQuery.trim()) return;
        setIsSearching(true);
        try {
            const results = await searchManga(searchQuery);
            setSearchResults(results);
        } catch (error) {
            console.error("Search error:", error);
        } finally {
            setIsSearching(false);
        }
    };

    const addManga = async (manga: MangaSearchResult) => {
        if (!user || isAdding) return;

        if (progressList.find(p => p.mangaId === manga.id)) {
            setSearchQuery('');
            setSearchResults([]);
            return;
        }

        setIsAdding(manga.id);
        try {
            const lastChapter = await getLatestChapter(manga.id);
            const newProgress: ChapterProgress = {
                mangaId: manga.id,
                title: manga.title,
                imageUrl: manga.mainCoverUrl,
                currentChapter: 1,
                lastChapter: lastChapter,
                updatedAt: new Date()
            };

            await firestoreService.updateChapterProgress(user.uid, manga.id, newProgress);
            setProgressList(prev => [newProgress, ...prev]);
            setSearchQuery('');
            setSearchResults([]);
        } catch (error) {
            console.error("Error adding manga:", error);
        } finally {
            setIsAdding(null);
        }
    };

    const updateChapter = async (mangaId: string, increment: number) => {
        if (!user) return;
        const item = progressList.find(p => p.mangaId === mangaId);
        if (!item) return;

        const newChapter = Math.max(0, item.currentChapter + increment);
        await saveChapter(mangaId, newChapter);
    };

    const saveChapter = async (mangaId: string, newValue: number) => {
        if (!user) return;
        const item = progressList.find(p => p.mangaId === mangaId);
        if (!item) return;

        const updatedItem = { ...item, currentChapter: newValue, updatedAt: new Date() };
        setProgressList(prev => prev.map(p => p.mangaId === mangaId ? updatedItem : p));

        try {
            await firestoreService.updateChapterProgress(user.uid, mangaId, { currentChapter: newValue });
            setEditingMangaId(null);
        } catch (error) {
            console.error("Error updating chapter:", error);
            loadProgress();
        }
    };

    const startEditing = (item: ChapterProgress) => {
        setEditingMangaId(item.mangaId);
        setEditingValue(item.currentChapter.toString());
    };

    const handleManualSubmit = (mangaId: string) => {
        const val = parseFloat(editingValue);
        if (!isNaN(val)) {
            saveChapter(mangaId, val);
        } else {
            setEditingMangaId(null);
        }
    };

    const removeManga = async (mangaId: string) => {
        if (!user) return;
        if (!confirm("Remover este marcador?")) return;

        await firestoreService.removeChapterProgress(user.uid, mangaId);
        setProgressList(prev => prev.filter(p => p.mangaId !== mangaId));
    };

    if (isLoading) return <div className="py-20 flex justify-center"><LoadingSpinner /></div>;

    return (
        <div className="space-y-12 animate-fade-in">
            {/* Header Section */}
            <div className="relative rounded-[3rem] bg-primary-gradient p-8 md:p-12 shadow-2xl">
                <div className="absolute inset-0 overflow-hidden rounded-[3rem] pointer-events-none">
                    <div className="absolute top-0 right-0 -m-12 w-64 h-64 bg-white/10 rounded-full blur-3xl opacity-50" />
                    <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-pink-500/20 rounded-full blur-3xl opacity-30" />
                </div>

                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
                    <div className="space-y-4">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white text-xs font-black uppercase tracking-widest leading-none">
                            <BookOpenIcon className="w-4 h-4" />
                            Meus Marcadores
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black text-white italic tracking-tighter">
                            Controle de <span className="text-yellow-300">Capítulos</span>
                        </h1>
                        <p className="text-indigo-100 text-lg font-bold max-w-xl">
                            Nunca mais se perca na leitura. Acompanhe cada passo da sua jornada mangaística.
                        </p>
                    </div>

                    <div className="w-full md:w-96 relative">
                        <div className="relative group">
                            <div className="absolute inset-0 bg-white/20 rounded-2xl blur-xl opacity-50 group-hover:opacity-100 transition-opacity" />
                            <div className="relative flex gap-2">
                                <div className="relative flex-1">
                                    <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-indigo-200" />
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                        placeholder="Adicionar novo mangá..."
                                        className="w-full pl-12 pr-4 py-4 bg-white/10 backdrop-blur-md border-2 border-white/20 rounded-2xl text-white placeholder:text-indigo-200 font-bold focus:outline-none focus:border-white/50 transition-all"
                                    />
                                </div>
                                <button
                                    onClick={handleSearch}
                                    disabled={isSearching}
                                    className="p-4 bg-yellow-400 text-indigo-900 rounded-2xl font-black hover:scale-110 active:scale-95 transition-all shadow-lg flex items-center justify-center min-w-[3.5rem]"
                                >
                                    {isSearching ? <div className="w-5 h-5 border-2 border-indigo-900/30 border-t-indigo-900 rounded-full animate-spin" /> : <PlusIcon className="w-6 h-6" />}
                                </button>
                            </div>

                            {searchResults.length > 0 && (
                                <div className="absolute top-full left-0 right-0 mt-4 bg-white dark:bg-slate-800 rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-gray-100 dark:border-white/10 overflow-hidden z-[100] animate-scale-in">
                                    <div className="max-h-80 overflow-y-auto p-3 space-y-1 custom-scrollbar">
                                        {searchResults.map(manga => (
                                            <button
                                                key={manga.id}
                                                disabled={!!isAdding}
                                                onClick={() => addManga(manga)}
                                                className="w-full flex items-center gap-4 p-3 hover:bg-indigo-50 dark:hover:bg-primary/10 rounded-2xl transition-all text-left group disabled:opacity-50"
                                            >
                                                <div className="relative w-12 h-16 flex-none">
                                                    <img src={manga.mainCoverUrl} className="w-full h-full object-cover rounded-xl shadow-md" alt="" />
                                                    {isAdding === manga.id && (
                                                        <div className="absolute inset-0 bg-black/40 rounded-xl flex items-center justify-center">
                                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex-1">
                                                    <p className="font-black text-slate-800 dark:text-white line-clamp-1 italic text-sm">{manga.title}</p>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5 group-hover:text-primary transition-colors">
                                                        {isAdding === manga.id ? 'Adicionando...' : 'Clique para adicionar'}
                                                    </p>
                                                </div>
                                                <div className="p-2 bg-primary/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <PlusIcon className="w-4 h-4 text-primary" />
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                    <div className="p-3 bg-gray-50 dark:bg-black/20 border-t border-gray-100 dark:border-white/5">
                                        <button onClick={() => setSearchResults([])} className="text-[10px] font-black text-slate-400 hover:text-red-500 uppercase tracking-widest w-full py-2 transition-colors">Cancelar Busca</button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {progressList.map((item) => {
                    const isAtrasado = item.lastChapter && item.currentChapter < item.lastChapter;
                    const diff = item.lastChapter ? item.lastChapter - item.currentChapter : 0;
                    const isEditing = editingMangaId === item.mangaId;

                    return (
                        <div key={item.mangaId} className="group relative bg-white dark:bg-slate-900 rounded-[2.5rem] border border-gray-100 dark:border-white/10 p-6 flex gap-6 hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 overflow-hidden">
                            <div className={`absolute top-0 right-0 w-32 h-32 blur-3xl opacity-10 rounded-full transition-opacity ${isAtrasado ? 'bg-red-500' : 'bg-green-500'}`} />

                            <div className="relative w-32 flex-none">
                                <div className="absolute inset-0 bg-primary/20 blur-xl opacity-0 group-hover:opacity-50 transition-opacity" />
                                <img src={item.imageUrl} className="relative w-full aspect-[2/3] object-cover rounded-[1.5rem] shadow-xl border-2 border-white dark:border-slate-800" alt={item.title} />
                                {isAtrasado && (
                                    <div className="absolute -top-3 -right-3 bg-red-500 text-white text-[10px] font-black px-3 py-1 rounded-full shadow-lg animate-bounce border-2 border-white dark:border-slate-900">
                                        -{Math.floor(diff)} CAPS
                                    </div>
                                )}
                            </div>

                            <div className="flex-1 flex flex-col justify-between py-2">
                                <div className="space-y-4">
                                    <div className="flex justify-between items-start gap-2">
                                        <h3 className="text-xl font-black text-slate-800 dark:text-white tracking-tight line-clamp-2 leading-tight italic">{item.title}</h3>
                                        <button onClick={() => removeManga(item.mangaId)} className="p-2 text-slate-300 hover:text-red-500 transition-colors">
                                            <TrashIcon className="w-4 h-4" />
                                        </button>
                                    </div>

                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Status</span>
                                            <div className={`w-2 h-2 rounded-full ${isAtrasado ? 'bg-red-500' : 'bg-green-500'}`} />
                                            <span className={`text-[10px] font-black uppercase tracking-widest ${isAtrasado ? 'text-red-500' : 'text-green-500'}`}>
                                                {isAtrasado ? 'Atrasado' : 'Em dia'}
                                            </span>
                                        </div>
                                        <p className="text-xs font-bold text-slate-500 dark:text-gray-400">Último: {item.lastChapter || '?'}</p>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex items-center justify-between min-h-[2.5rem]">
                                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Capítulo</span>
                                        {isEditing ? (
                                            <div className="flex items-center gap-1 animate-scale-in">
                                                <input
                                                    type="number"
                                                    value={editingValue}
                                                    onChange={(e) => setEditingValue(e.target.value)}
                                                    onKeyDown={(e) => e.key === 'Enter' && handleManualSubmit(item.mangaId)}
                                                    autoFocus
                                                    className="w-16 px-2 py-1 bg-gray-100 dark:bg-white/10 rounded-lg text-lg font-black text-primary text-center focus:outline-none border-2 border-primary/30"
                                                />
                                                <button onClick={() => handleManualSubmit(item.mangaId)} className="p-1 text-green-500 hover:scale-110 transition-transform"><CheckIcon className="w-5 h-5" /></button>
                                                <button onClick={() => setEditingMangaId(null)} className="p-1 text-red-400 hover:scale-110 transition-transform"><XIcon className="w-5 h-5" /></button>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2 group/edit">
                                                <span className="text-2xl font-black text-primary italic">#{item.currentChapter}</span>
                                                <button onClick={() => startEditing(item)} className="p-1.5 opacity-0 group-hover/edit:opacity-100 text-slate-400 hover:text-primary transition-all">
                                                    <PencilIcon className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => updateChapter(item.mangaId, -1)}
                                            className="flex-1 py-3 bg-gray-100 dark:bg-white/5 rounded-xl font-black text-slate-500 hover:bg-gray-200 dark:hover:bg-white/10 transition-all text-sm"
                                        >
                                            -1
                                        </button>
                                        <button
                                            onClick={() => updateChapter(item.mangaId, 1)}
                                            className="flex-[2] py-3 bg-primary-gradient text-white rounded-xl font-black shadow-primary-glow hover:brightness-110 active:scale-95 transition-all text-sm uppercase tracking-widest"
                                        >
                                            Próximo
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}

                {progressList.length === 0 && (
                    <div className="col-span-full py-32 flex flex-col items-center justify-center bg-white dark:bg-slate-900/50 rounded-[4rem] border-4 border-dashed border-gray-100 dark:border-white/10 text-center px-6">
                        <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                            <BookOpenIcon className="w-12 h-12 text-primary opacity-30" />
                        </div>
                        <h2 className="text-3xl font-black text-slate-800 dark:text-white italic mb-2">Sua lista está vazia</h2>
                        <p className="text-slate-500 dark:text-gray-400 font-bold max-w-sm">Use o campo de busca acima para começar a acompanhar seus mangás favoritos por capítulos!</p>
                    </div>
                )}
            </div>

            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(139, 92, 246, 0.2); border-radius: 20px; }
                @keyframes scale-in { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
                .animate-scale-in { animation: scale-in 0.2s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
            `}</style>
        </div>
    );
};

export default ChaptersView;
