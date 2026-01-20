import React, { useState, useCallback, useEffect } from 'react';
import { CollectionItem, Publisher, View, MangaSearchResult, MangaVolume, SeriesStatusCollection, MangaStatus } from './types';
import { searchManga as fetchManga, getPopularManga } from './services/mangaDexService';
import Header from './components/Header';
import SearchView from './components/SearchView';
import CollectionView from './components/CollectionView';
import AddMangaModal from './components/AddMangaModal';
import CompletenessView, { TrackedVolumesConfig, HiddenVolumesConfig } from './components/CompletenessView';
import StatisticsView from './components/StatisticsView';
import { useUser } from './contexts/UserContext';
import LoginView from './components/LoginView';
import ProfileSetup from './components/ProfileSetup';
import LoadingSpinner from './components/LoadingSpinner';
import * as firestoreService from './services/firestoreService';
import { useThemeColor } from './hooks/useThemeColor';
import ProfileModal from './components/ProfileModal';
import ChaptersView from './components/ChaptersView';
import InstallPrompt from './components/InstallPrompt';

const MainApp: React.FC = () => {
  const { user } = useUser();
  useThemeColor(); // Aplica a cor personalizada do usuário

  const [collection, setCollection] = useState<CollectionItem[]>([]);
  const [seriesStatus, setSeriesStatus] = useState<SeriesStatusCollection>({});
  const [trackedVolumes, setTrackedVolumes] = useState<TrackedVolumesConfig>({});
  const [hiddenVolumes, setHiddenVolumes] = useState<HiddenVolumesConfig>({});

  const [currentView, setCurrentView] = useState<View>(View.SEARCH);
  const [searchResults, setSearchResults] = useState<MangaSearchResult[]>([]);
  const [initialManga, setInitialManga] = useState<MangaSearchResult[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [isSearchLoading, setIsSearchLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedManga, setSelectedManga] = useState<MangaSearchResult | null>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) return;
      setIsDataLoading(true);

      try {
        const [
          collectionData,
          seriesStatusData,
          trackedVolumesData,
          hiddenVolumesData
        ] = await Promise.all([
          firestoreService.getCollection(user.uid),
          firestoreService.getSeriesStatus(user.uid),
          firestoreService.getTrackedVolumes(user.uid),
          firestoreService.getHiddenVolumes(user.uid),
        ]);

        // Processar collection
        if (collectionData) {
          setCollection(collectionData.map((item: any) => ({
            id: item.item_id,
            mangaId: item.manga_id,
            title: item.title,
            volume: item.volume,
            imageUrl: item.image_url,
            publisher: item.publisher as Publisher,
          })));
        }

        // Processar series status
        if (seriesStatusData) {
          const statusMap = seriesStatusData.reduce((acc: any, item: any) => {
            acc[item.manga_id] = item.status as MangaStatus;
            return acc;
          }, {} as SeriesStatusCollection);
          setSeriesStatus(statusMap);
        }

        // Processar tracked volumes
        if (trackedVolumesData) {
          const trackedMap = trackedVolumesData.reduce((acc: any, item: any) => {
            acc[item.manga_id] = item.volumes;
            return acc;
          }, {} as TrackedVolumesConfig);
          setTrackedVolumes(trackedMap);
        }

        // Processar hidden volumes
        if (hiddenVolumesData) {
          const hiddenMap = hiddenVolumesData.reduce((acc: any, item: any) => {
            acc[item.manga_id] = item.volumes;
            return acc;
          }, {} as HiddenVolumesConfig);
          setHiddenVolumes(hiddenMap);
        }
      } catch (err) {
        console.error('Erro ao carregar dados do usuário:', err);
      } finally {
        setIsDataLoading(false);
      }
    };

    fetchUserData();
  }, [user]);


  useEffect(() => {
    const fetchInitialManga = async () => {
      try {
        const popularManga = await getPopularManga();
        setInitialManga(popularManga);
      } catch (err) {
        setError('Não foi possível carregar mangás populares. Tente recarregar a página.');
        console.error(err);
      } finally {
        setIsSearchLoading(false);
      }
    };

    fetchInitialManga();
  }, []);

  const [abortController, setAbortController] = useState<AbortController | null>(null);

  const handleSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    // Cancelar busca anterior se houver
    if (abortController) {
      abortController.abort();
    }

    const newController = new AbortController();
    setAbortController(newController);

    setIsSearchLoading(true);
    setError(null);
    try {
      const results = await fetchManga(query, newController.signal);
      setSearchResults(results);
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setError('Falha ao buscar mangás. Por favor, tente novamente mais tarde.');
        console.error(err);
      }
    } finally {
      if (!newController.signal.aborted) {
        setIsSearchLoading(false);
      }
    }
  }, [abortController]);

  const handleAddToCollection = async (manga: MangaSearchResult, volumes: MangaVolume[], publisher: Publisher, status: MangaStatus) => {
    if (!user) return;

    try {
      const newItemsToInsert = volumes.map(volume => ({
        user_id: user.uid,
        item_id: `${manga.id}-${volume.volume}`,
        manga_id: manga.id,
        title: manga.title,
        volume: volume.volume,
        image_url: volume.coverUrl,
        publisher,
      }));

      // Adicionar itens à coleção
      await firestoreService.addToCollection(user.uid, newItemsToInsert);

      // Atualizar estado local
      const newCollectionItems = newItemsToInsert.map(item => ({
        id: item.item_id,
        mangaId: item.manga_id,
        title: item.title,
        volume: item.volume,
        imageUrl: item.image_url,
        publisher: item.publisher as Publisher,
      }));

      setCollection(prev => [...prev, ...newCollectionItems]
        .sort((a, b) => a.title.localeCompare(b.title) || a.volume.localeCompare(b.volume, undefined, { numeric: true }))
      );

      // Atualizar status da série
      await firestoreService.updateSeriesStatus(user.uid, manga.id, status);
      setSeriesStatus(prev => ({ ...prev, [manga.id]: status }));

    } catch (error) {
      console.error("Erro ao adicionar à coleção:", error);
    }

    setSelectedManga(null);
  };

  const handleRemoveFromCollection = async (itemId: string) => {
    if (!user) return;

    try {
      await firestoreService.removeFromCollection(user.uid, itemId);
      setCollection(prev => prev.filter(item => item.id !== itemId));
    } catch (error) {
      console.error("Erro ao remover da coleção:", error);
    }
  };

  if (isDataLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gradient-to-br dark:from-slate-950 dark:via-purple-950 dark:to-slate-900 text-slate-900 dark:text-foreground font-sans flex flex-col relative overflow-hidden transition-colors duration-500">
      {/* Efeitos de luz de fundo */}
      <div className="fixed top-0 -left-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 dark:opacity-10 animate-blob" />
      <div className="fixed top-0 -right-40 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 dark:opacity-10 animate-blob animation-delay-2000" />
      <div className="fixed -bottom-40 left-20 w-80 h-80 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 dark:opacity-10 animate-blob animation-delay-4000" />

      <Header
        currentView={currentView}
        setCurrentView={setCurrentView}
        onProfileClick={() => setIsProfileModalOpen(true)}
      />

      <main className="container mx-auto p-4 md:p-8 flex-grow relative z-10">
        {currentView === View.SEARCH && (
          <SearchView
            onSearch={handleSearch}
            results={searchResults}
            isLoading={isSearchLoading}
            error={error}
            onSelectManga={setSelectedManga}
            initialManga={initialManga}
          />
        )}
        {currentView === View.COLLECTION && (
          <CollectionView collection={collection} onRemove={handleRemoveFromCollection} />
        )}
        {currentView === View.CHAPTERS && (
          <ChaptersView />
        )}
        {currentView === View.COMPLETENESS && (
          <CompletenessView
            collection={collection}
            trackedVolumes={trackedVolumes}
            setTrackedVolumes={setTrackedVolumes}
            hiddenVolumes={hiddenVolumes}
            setHiddenVolumes={setHiddenVolumes}
          />
        )}
        {currentView === View.STATISTICS && (
          <StatisticsView collection={collection} />
        )}
      </main>

      {selectedManga && (
        <AddMangaModal
          manga={selectedManga}
          existingVolumes={new Set(collection.filter(item => item.mangaId === selectedManga.id).map(item => item.volume))}
          seriesStatus={seriesStatus}
          onClose={() => setSelectedManga(null)}
          onSave={handleAddToCollection}
        />
      )}

      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />

      <InstallPrompt />

      <footer className="relative z-10 w-full text-center p-6 text-sm border-t border-white/10 bg-slate-900/50 backdrop-blur-sm">
        <div className="flex items-center justify-center gap-2">
          <span className="text-gray-400">Desenvolvido com</span>
          <svg className="w-4 h-4 text-red-500 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
          </svg>
          <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent font-semibold">Delta Studio</span>
        </div>
      </footer>

      {/* Animações CSS */}
      <style>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
        
        .animate-blob {
          animation: blob 7s infinite;
        }
        
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div >
  );
};


const App: React.FC = () => {
  const { session, user } = useUser();
  const [showProfileSetup, setShowProfileSetup] = useState(false);

  // Verificar se precisa mostrar setup
  useEffect(() => {
    if (user) {
      const needsSetup = localStorage.getItem('needsProfileSetup');
      console.log('🔍 App.tsx - Verificando setup:', { needsSetup, userId: user.uid });
      if (needsSetup === 'true') {
        console.log('✨ App.tsx - Mostrando ProfileSetup');
        setShowProfileSetup(true);
      }
    }
  }, [user]);

  const handleProfileSetupComplete = () => {
    console.log('✅ App.tsx - Setup completo, removendo flag');
    localStorage.removeItem('needsProfileSetup');
    setShowProfileSetup(false);
  };

  if (!session) {
    return <LoginView />;
  }

  if (showProfileSetup) {
    console.log('🎨 App.tsx - Renderizando ProfileSetup');
    return <ProfileSetup onComplete={handleProfileSetupComplete} />;
  }

  return <MainApp />;
};


export default App;