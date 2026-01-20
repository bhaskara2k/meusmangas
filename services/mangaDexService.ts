
import { MangaSearchResult, MangaVolume } from '../types';

const API_BASE_URL = '/mangadex-api';
const COVER_BASE_URL = '/mangadex-covers';

// Cache simples para evitar requisições repetidas
const cache = {
  search: new Map<string, MangaSearchResult[]>(),
  volumes: new Map<string, MangaVolume[]>(),
  chapters: new Map<string, number>(),
  popular: null as MangaSearchResult[] | null,
};

// Tipagem para a resposta da API MangaDex
interface MangaDexResponse {
  data: MangaDexManga[];
}

interface MangaDexManga {
  id: string;
  type: string;
  attributes: {
    title: {
      [lang: string]: string;
    };
    altTitles: { [lang: string]: string }[];
  };
  relationships: {
    id: string;
    type: string;
    attributes?: {
      fileName: string;
    }
  }[];
}

interface CoverArtResponse {
  data: CoverArt[];
}

interface CoverArt {
  id: string;
  type: string;
  attributes: {
    volume: string | null;
    fileName: string;
    description: string;
    version: number;
  }
}

// Função auxiliar para encontrar o título mais apropriado
const getMangaTitle = (manga: MangaDexManga): string => {
  const titles = manga.attributes.title;
  return titles['pt-br'] || titles['en'] || titles['ja-ro'] || Object.values(titles)[0] || 'Título Desconhecido';
};

export const searchManga = async (query: string, signal?: AbortSignal): Promise<MangaSearchResult[]> => {
  if (!query) return [];
  if (cache.search.has(query)) return cache.search.get(query)!;

  try {
    const response = await fetch(
      `${API_BASE_URL}/manga?title=${encodeURIComponent(query)}&includes[]=cover_art&order[relevance]=desc&limit=20&contentRating[]=safe&contentRating[]=suggestive`,
      { signal }
    );
    if (!response.ok) {
      throw new Error(`MangaDex API error: ${response.statusText}`);
    }
    const data: MangaDexResponse = await response.json();

    const results = data.data.map(manga => {
      const coverArt = manga.relationships.find(rel => rel.type === 'cover_art');
      const fileName = coverArt?.attributes?.fileName;
      const coverUrl = fileName ? `${COVER_BASE_URL}/covers/${manga.id}/${fileName}.256.jpg` : 'https://via.placeholder.com/256x362.png?text=No+Cover';

      return {
        id: manga.id,
        title: getMangaTitle(manga),
        mainCoverUrl: coverUrl
      };
    });

    cache.search.set(query, results);
    return results;

  } catch (error: any) {
    if (error.name === 'AbortError') return [];
    console.error("Failed to fetch manga from MangaDex:", error);
    throw error;
  }
};

export const getPopularManga = async (signal?: AbortSignal): Promise<MangaSearchResult[]> => {
  if (cache.popular) return cache.popular;

  try {
    const response = await fetch(
      `${API_BASE_URL}/manga?includes[]=cover_art&order[followedCount]=desc&limit=12&contentRating[]=safe&contentRating[]=suggestive`,
      { signal }
    );
    if (!response.ok) {
      throw new Error(`MangaDex API error: ${response.statusText}`);
    }
    const data: MangaDexResponse = await response.json();

    const results = data.data.map(manga => {
      const coverArt = manga.relationships.find(rel => rel.type === 'cover_art');
      const fileName = coverArt?.attributes?.fileName;
      const coverUrl = fileName ? `${COVER_BASE_URL}/covers/${manga.id}/${fileName}.256.jpg` : 'https://via.placeholder.com/256x362.png?text=No+Cover';

      return {
        id: manga.id,
        title: getMangaTitle(manga),
        mainCoverUrl: coverUrl
      };
    });

    cache.popular = results;
    return results;

  } catch (error: any) {
    if (error.name === 'AbortError') return [];
    console.error("Failed to fetch popular manga from MangaDex:", error);
    throw error;
  }
};


export const getMangaVolumesWithCovers = async (mangaId: string, signal?: AbortSignal): Promise<MangaVolume[]> => {
  if (cache.volumes.has(mangaId)) return cache.volumes.get(mangaId)!;

  try {
    console.log('🔍 Buscando volumes para:', mangaId);
    const allCovers: CoverArt[] = [];
    let offset = 0;
    const limit = 100;
    let hasMore = true;
    let attempts = 0;
    const maxAttempts = 3; // Reduzido para ser mais rápido (até 300 volumes)

    // Buscar todas as capas com paginação
    while (hasMore && attempts < maxAttempts) {
      attempts++;
      const url = `${API_BASE_URL}/cover?manga[]=${mangaId}&limit=${limit}&offset=${offset}&order[volume]=asc`;

      const response = await fetch(url, { signal });

      if (!response.ok) {
        throw new Error(`MangaDex Cover API error: ${response.statusText}`);
      }

      const data: CoverArtResponse = await response.json();
      allCovers.push(...data.data);

      if (data.data.length < limit) {
        hasMore = false;
      } else {
        offset += limit;
      }
    }

    const volumeMap = new Map<string, MangaVolume>();

    allCovers.forEach(cover => {
      if (cover.attributes.volume) {
        const volumeKey = cover.attributes.volume;
        // Priorizar capas em PT-BR ou EN se houver descrição (heurística simples)
        if (!volumeMap.has(volumeKey)) {
          volumeMap.set(volumeKey, {
            volume: volumeKey,
            coverUrl: `${COVER_BASE_URL}/covers/${mangaId}/${cover.attributes.fileName}.512.jpg`,
          });
        }
      }
    });

    const volumes = Array.from(volumeMap.values()).sort((a, b) =>
      a.volume.localeCompare(b.volume, undefined, { numeric: true })
    );

    cache.volumes.set(mangaId, volumes);
    return volumes;
  } catch (error: any) {
    if (error.name === 'AbortError') return [];
    console.error("❌ Erro ao buscar volumes:", error);
    throw error;
  }
}

export const getLatestChapter = async (mangaId: string, signal?: AbortSignal): Promise<number> => {
  if (cache.chapters.has(mangaId)) return cache.chapters.get(mangaId)!;

  try {
    const response = await fetch(`${API_BASE_URL}/manga/${mangaId}/aggregate?translatedLanguage[]=en&translatedLanguage[]=pt-br`, { signal });
    if (!response.ok) throw new Error("Failed to fetch aggregate");
    const data = await response.json();

    let maxChapter = 0;
    const volumes = data.volumes || {};

    Object.values(volumes).forEach((vol: any) => {
      Object.values(vol.chapters || {}).forEach((chap: any) => {
        const chapterNum = parseFloat(chap.chapter);
        if (!isNaN(chapterNum) && chapterNum > maxChapter) {
          maxChapter = chapterNum;
        }
      });
    });

    cache.chapters.set(mangaId, maxChapter);
    return maxChapter;
  } catch (error: any) {
    if (error.name === 'AbortError') return 0;
    console.error("Error getting latest chapter:", error);
    return 0;
  }
};