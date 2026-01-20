import React, { useState, useEffect } from 'react';
import { XIcon, UserIcon, SearchIcon, CheckIcon } from './icons/Icons';
import { useUser } from '../contexts/UserContext';

const THEME_COLORS = [
    { name: 'Roxo (Padrão)', value: '263.4 70% 50.4%' },
    { name: 'Azul', value: '217.2 91.2% 59.8%' },
    { name: 'Verde', value: '142.1 76.2% 36.3%' },
    { name: 'Vermelho', value: '0 72.2% 50.6%' },
    { name: 'Laranja', value: '24.6 95% 53.1%' },
    { name: 'Rosa', value: '322.2 93.9% 48.2%' },
    { name: 'Ciano', value: '188.7 78.5% 41.2%' },
    { name: 'Amarelo', value: '47.9 95.8% 51.2%' },
];

interface ProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose }) => {
    const { userData, updateProfile } = useUser();
    const [username, setUsername] = useState(userData?.username || '');
    const [selectedColor, setSelectedColor] = useState(userData?.themeColor || THEME_COLORS[0].value);
    const [selectedPhoto, setSelectedPhoto] = useState(userData?.photoURL || '');
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [searchSource, setSearchSource] = useState<'jikan' | 'anilist'>('jikan');

    useEffect(() => {
        if (userData) {
            setUsername(userData.username);
            setSelectedColor(userData.themeColor);
            setSelectedPhoto(userData.photoURL);
        }
    }, [userData, isOpen]);

    const searchCharacters = async () => {
        if (!searchQuery.trim()) return;
        setIsSearching(true);
        setSearchResults([]);

        try {
            if (searchSource === 'jikan') {
                // Jikan Search
                const response = await fetch(`https://api.jikan.moe/v4/characters?q=${encodeURIComponent(searchQuery)}&limit=15`);
                const data = await response.json();
                setSearchResults(data.data || []);
            } else {
                // AniList Search (GraphQL)
                const query = `
                query ($search: String) {
                    Page (perPage: 15) {
                        characters (search: $search) {
                            id
                            name { full }
                            image { large }
                        }
                    }
                }`;

                const response = await fetch('https://graphql.anilist.co', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ query, variables: { search: searchQuery } })
                });
                const result = await response.json();
                const aniListChars = result.data.Page.characters.map((char: any) => ({
                    mal_id: `anilist-${char.id}`,
                    name: char.name.full,
                    images: { jpg: { image_url: char.image.large } }
                }));
                setSearchResults(aniListChars);
            }
        } catch (error) {
            console.error("Error searching characters:", error);
        } finally {
            setIsSearching(false);
        }
    };

    const fetchGaleery = async (charId: number | string) => {
        if (typeof charId !== 'number') return; // Only Jikan has gallery for now
        setIsSearching(true);
        try {
            const response = await fetch(`https://api.jikan.moe/v4/characters/${charId}/pictures`);
            const data = await response.json();
            if (data.data) {
                const galleryResults = data.data.map((pic: any, index: number) => ({
                    mal_id: `gal-${charId}-${index}`,
                    name: "Galeria",
                    images: pic
                }));
                setSearchResults(prev => [...galleryResults, ...prev]);
            }
        } catch (error) {
            console.error("Error fetching gallery:", error);
        } finally {
            setIsSearching(false);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await updateProfile({
                username: username.trim(),
                themeColor: selectedColor,
                photoURL: selectedPhoto
            });
            document.documentElement.style.setProperty('--primary', selectedColor);
            onClose();
        } catch (error) {
            console.error("Error saving profile:", error);
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-fade-in">
            <div className="relative bg-white dark:bg-slate-900 w-full max-w-2xl rounded-[2.5rem] shadow-2xl border border-gray-200 dark:border-white/10 animate-scale-in flex flex-col my-auto overflow-hidden max-h-[90vh]">
                {/* Header */}
                <div className="flex-none relative p-6 sm:p-8 border-b border-gray-100 dark:border-white/5 flex justify-between items-center bg-gray-50/50 dark:bg-white/5">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-primary/10 rounded-2xl">
                            <UserIcon className="w-6 h-6 text-primary" />
                        </div>
                        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white italic tracking-tight">Personalizar Perfil</h2>
                    </div>
                    <button onClick={onClose} className="p-3 hover:bg-gray-200 dark:hover:bg-white/10 rounded-2xl transition-all hover:rotate-90">
                        <XIcon className="w-6 h-6 text-slate-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 p-6 sm:p-10 space-y-10 overflow-y-auto custom-scrollbar">
                    {/* Main Info */}
                    <div className="flex flex-col md:flex-row gap-10 items-center md:items-start">
                        <div className="flex flex-col items-center gap-4 flex-none">
                            <div className="relative group">
                                <div className="absolute inset-0 bg-gradient-to-br from-primary to-pink-500 rounded-full blur-2xl opacity-20 group-hover:opacity-40 transition-opacity" />
                                <div className="relative w-36 h-36 rounded-full border-4 border-white dark:border-slate-800 shadow-2xl overflow-hidden bg-gray-100 dark:bg-slate-800">
                                    {selectedPhoto ? (
                                        <img src={selectedPhoto} alt="Avatar" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <UserIcon className="w-16 h-16 text-gray-400" />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 space-y-8 w-full">
                            <div className="space-y-3">
                                <label className="text-xs font-black text-slate-500 dark:text-gray-400 uppercase tracking-[0.2em] ml-1">Seu Nome</label>
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="w-full px-7 py-5 bg-gray-50 dark:bg-white/5 border-2 border-transparent focus:border-primary/20 dark:focus:border-primary/40 rounded-[1.5rem] text-slate-900 dark:text-white font-black text-lg focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all outline-none shadow-inner"
                                    placeholder="Ex: MangakaMaster"
                                />
                            </div>

                            <div className="space-y-4">
                                <label className="text-xs font-black text-slate-500 dark:text-gray-400 uppercase tracking-[0.2em] ml-1">Estilo Visual</label>
                                <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
                                    {THEME_COLORS.map((color) => (
                                        <button
                                            key={color.value}
                                            onClick={() => setSelectedColor(color.value)}
                                            className={`h-11 rounded-xl border-4 transition-all flex items-center justify-center ${selectedColor === color.value
                                                ? 'border-slate-900 dark:border-white scale-110 shadow-xl'
                                                : 'border-transparent hover:scale-110 opacity-80 hover:opacity-100'
                                                }`}
                                            style={{ backgroundColor: `hsl(${color.value})` }}
                                            title={color.name}
                                        >
                                            {selectedColor === color.value && <CheckIcon className="w-6 h-6 text-white mix-blend-difference stroke-[3]" />}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Manga Avatar Search */}
                    <div className="space-y-8 pt-10 border-t border-gray-100 dark:border-white/5">
                        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                            <div className="space-y-2">
                                <h3 className="text-2xl font-black text-slate-800 dark:text-white italic tracking-tight">Buscar Avatar</h3>
                                <p className="text-sm text-slate-500 dark:text-gray-400 font-bold">Escolha entre milhares de personagens.</p>
                            </div>

                            <div className="flex bg-gray-100 dark:bg-white/5 p-1 rounded-xl border border-gray-200 dark:border-white/10">
                                <button
                                    onClick={() => setSearchSource('jikan')}
                                    className={`px-4 py-2 rounded-lg text-xs font-black transition-all ${searchSource === 'jikan' ? 'bg-primary-gradient text-white shadow-lg' : 'text-slate-500 hover:text-slate-700 dark:hover:text-white'}`}
                                >
                                    MyAnimeList
                                </button>
                                <button
                                    onClick={() => setSearchSource('anilist')}
                                    className={`px-4 py-2 rounded-lg text-xs font-black transition-all ${searchSource === 'anilist' ? 'bg-primary-gradient text-white shadow-lg' : 'text-slate-500 hover:text-slate-700 dark:hover:text-white'}`}
                                >
                                    AniList
                                </button>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3">
                            <div className="relative flex-1">
                                <SearchIcon className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && searchCharacters()}
                                    placeholder={searchSource === 'jikan' ? "Pesquisar no MAL..." : "Pesquisar no AniList..."}
                                    className="w-full pl-14 pr-6 py-4 bg-gray-50 dark:bg-white/5 border-2 border-transparent focus:border-primary/20 rounded-2xl text-slate-900 dark:text-white font-bold focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all shadow-inner"
                                />
                            </div>
                            <button
                                onClick={searchCharacters}
                                disabled={isSearching}
                                className="px-8 py-4 bg-primary-gradient text-white font-black rounded-2xl hover:brightness-110 active:scale-95 transition-all disabled:opacity-50 shadow-primary-glow"
                            >
                                {isSearching ? '...' : 'Buscar'}
                            </button>
                        </div>

                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-5">
                            {searchResults.map((char: any) => (
                                <div key={char.mal_id} className="relative group">
                                    <button
                                        onClick={() => setSelectedPhoto(char.images.jpg.image_url)}
                                        className={`relative w-full rounded-2xl overflow-hidden aspect-square border-4 transition-all hover:scale-105 ${selectedPhoto === char.images.jpg.image_url
                                            ? 'border-primary -rotate-2 shadow-2xl'
                                            : 'border-transparent'
                                            }`}
                                    >
                                        <img src={char.images.jpg.image_url} alt={char.name} className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center p-2 text-center">
                                            <span className="text-[9px] text-white font-black leading-tight mb-1">{char.name}</span>
                                        </div>
                                    </button>

                                    {/* Action buttons on hover */}
                                    {typeof char.mal_id === 'number' && (
                                        <button
                                            onClick={() => fetchGaleery(char.mal_id)}
                                            className="absolute -top-2 -right-2 bg-indigo-600 text-white text-[8px] font-black px-2 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                                        >
                                            + FOTOS
                                        </button>
                                    )}
                                </div>
                            ))}

                            {searchResults.length === 0 && !isSearching && (
                                <div className="col-span-full py-16 flex flex-col items-center justify-center opacity-30 bg-gray-50 dark:bg-white/5 rounded-[2rem] border-2 border-dashed border-gray-200 dark:border-white/10">
                                    <UserIcon className="w-16 h-16 mb-4" />
                                    <p className="text-base font-black italic">Milhares de personagens ao seu alcance...</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex-none p-6 sm:p-8 bg-gray-50 dark:bg-black/20 border-t border-gray-100 dark:border-white/5 flex flex-col sm:flex-row justify-end gap-4">
                    <button
                        onClick={onClose}
                        className="px-10 py-4 rounded-2xl font-black text-slate-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10 transition-all text-sm uppercase tracking-widest"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isSaving || !username.trim()}
                        className="px-12 py-4 bg-primary text-white font-black rounded-2xl shadow-xl shadow-primary/30 hover:scale-110 active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100 text-sm uppercase tracking-widest"
                    >
                        {isSaving ? 'Salvando...' : 'Confirmar Alterações'}
                    </button>
                </div>
            </div>

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
                @keyframes scale-in {
                    from { opacity: 0; transform: scale(0.9) translateY(20px); }
                    to { opacity: 1; transform: scale(1) translateY(0); }
                }
                .animate-scale-in {
                    animation: scale-in 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
                }
                @keyframes fade-in {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                .animate-fade-in {
                    animation: fade-in 0.3s ease-out forwards;
                }
            `}</style>
        </div>
    );
};

export default ProfileModal;
