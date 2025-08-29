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
import { supabase } from './supabase';
import LoadingSpinner from './components/LoadingSpinner';

const MainApp: React.FC = () => {
  const { user } = useUser();
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

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) return;
      setIsDataLoading(true);
      
      const [
        collectionRes, 
        seriesStatusRes,
        trackedVolumesRes,
        hiddenVolumesRes
      ] = await Promise.all([
        supabase.from('collection').select('*').order('title').order('volume', { ascending: true }),
        supabase.from('series_status').select('*'),
        supabase.from('tracked_volumes').select('*'),
        supabase.from('hidden_volumes').select('*'),
      ]);

      if (collectionRes.data) {
        setCollection(collectionRes.data.map(item => ({
          id: item.item_id,
          mangaId: item.manga_id,
          title: item.title,
          volume: item.volume,
          imageUrl: item.image_url,
          publisher: item.publisher as Publisher,
        })));
      }
       if (seriesStatusRes.data) {
        const statusMap = seriesStatusRes.data.reduce((acc, item) => {
          acc[item.manga_id] = item.status as MangaStatus;
          return acc;
        }, {} as SeriesStatusCollection);
        setSeriesStatus(statusMap);
      }
      if (trackedVolumesRes.data) {
        const trackedMap = trackedVolumesRes.data.reduce((acc, item) => {
          acc[item.manga_id] = item.volumes;
          return acc;
        }, {} as TrackedVolumesConfig);
        setTrackedVolumes(trackedMap);
      }
       if (hiddenVolumesRes.data) {
        const hiddenMap = hiddenVolumesRes.data.reduce((acc, item) => {
          acc[item.manga_id] = item.volumes;
          return acc;
        }, {} as HiddenVolumesConfig);
        setHiddenVolumes(hiddenMap);
      }
      setIsDataLoading(false);
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

  const handleSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    setIsSearchLoading(true);
    setError(null);
    try {
      const results = await fetchManga(query);
      setSearchResults(results);
    } catch (err) {
      setError('Falha ao buscar mangás. Por favor, tente novamente mais tarde.');
      console.error(err);
    } finally {
      setIsSearchLoading(false);
    }
  }, []);

  const handleAddToCollection = async (manga: MangaSearchResult, volumes: MangaVolume[], publisher: Publisher, status: MangaStatus) => {
    if (!user) return;
    
    const newItemsToInsert = volumes.map(volume => ({
      user_id: user.id,
      item_id: `${manga.id}-${volume.volume}`,
      manga_id: manga.id,
      title: manga.title,
      volume: volume.volume,
      image_url: volume.coverUrl,
      publisher,
    }));

    const { data: insertedItems, error: insertError } = await supabase
      .from('collection')
      .insert(newItemsToInsert)
      .select();

    if (insertError) {
        console.error("Error adding to collection:", insertError);
        return;
    }
    
    if(insertedItems) {
      const newCollectionItems = insertedItems.map(item => ({
        id: item.item_id,
        mangaId: item.manga_id,
        title: item.title,
        volume: item.volume,
        imageUrl: item.image_url,
        publisher: item.publisher as Publisher,
      }));
      setCollection(prev => [...prev, ...newCollectionItems]
        .sort((a,b) => a.title.localeCompare(b.title) || a.volume.localeCompare(b.volume, undefined, { numeric: true }))
      );
    }

    const { error: statusError } = await supabase
        .from('series_status')
        .upsert({ user_id: user.id, manga_id: manga.id, status: status });

    if (!statusError) {
        setSeriesStatus(prev => ({ ...prev, [manga.id]: status, }));
    } else {
        console.error("Error updating series status", statusError);
    }


    setSelectedManga(null);
  };

  const handleRemoveFromCollection = async (itemId: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('collection')
      .delete()
      .eq('item_id', itemId)
      .eq('user_id', user.id);
    
    if (!error) {
      setCollection(prev => prev.filter(item => item.id !== itemId));
    } else {
        console.error("Error removing from collection:", error);
    }
  };

  if(isDataLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground font-sans flex flex-col">
      <Header currentView={currentView} setCurrentView={setCurrentView} />
      
      <main className="container mx-auto p-4 md:p-8 flex-grow">
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
      
      <footer className="w-full text-center p-4 text-sm text-muted-foreground border-t border-border">
        Desenvolvido por Delta Studio
      </footer>
    </div>
  );
};


const App: React.FC = () => {
  const { session } = useUser();

  if (!session) {
    return <LoginView />;
  }

  return <MainApp />;
};


export default App;