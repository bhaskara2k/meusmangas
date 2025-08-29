
import { MangaSearchResult, MangaVolume } from '../types';

const PROXY_URL = 'https://cors-anywhere-proxy.workers.dev/';
const API_BASE_URL = `${PROXY_URL}https://api.mangadex.org`;
const COVER_BASE_URL = 'https://uploads.mangadex.org';

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

export const searchManga = async (query: string): Promise<MangaSearchResult[]> => {
  if (!query) return [];
  try {
    const response = await fetch(
      `${API_BASE_URL}/manga?title=${encodeURIComponent(query)}&includes[]=cover_art&order[relevance]=desc&limit=20&contentRating[]=safe&contentRating[]=suggestive`
    );
    if (!response.ok) {
      throw new Error(`MangaDex API error: ${response.statusText}`);
    }
    const data: MangaDexResponse = await response.json();
    
    return data.data.map(manga => {
      const coverArt = manga.relationships.find(rel => rel.type === 'cover_art');
      const fileName = coverArt?.attributes?.fileName;
      const coverUrl = fileName ? `${COVER_BASE_URL}/covers/${manga.id}/${fileName}.256.jpg` : 'https://via.placeholder.com/256x362.png?text=No+Cover';

      return {
        id: manga.id,
        title: getMangaTitle(manga),
        mainCoverUrl: coverUrl.startsWith('https://via.placeholder.com') ? coverUrl : `${PROXY_URL}${coverUrl}`
      };
    });

  } catch (error) {
    console.error("Failed to fetch manga from MangaDex:", error);
    throw error;
  }
};

export const getPopularManga = async (): Promise<MangaSearchResult[]> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/manga?includes[]=cover_art&order[followedCount]=desc&limit=12&contentRating[]=safe&contentRating[]=suggestive`
    );
    if (!response.ok) {
      throw new Error(`MangaDex API error: ${response.statusText}`);
    }
    const data: MangaDexResponse = await response.json();
    
    return data.data.map(manga => {
      const coverArt = manga.relationships.find(rel => rel.type === 'cover_art');
      const fileName = coverArt?.attributes?.fileName;
      const coverUrl = fileName ? `${COVER_BASE_URL}/covers/${manga.id}/${fileName}.256.jpg` : 'https://via.placeholder.com/256x362.png?text=No+Cover';

      return {
        id: manga.id,
        title: getMangaTitle(manga),
        mainCoverUrl: coverUrl.startsWith('https://via.placeholder.com') ? coverUrl : `${PROXY_URL}${coverUrl}`
      };
    });

  } catch (error) {
    console.error("Failed to fetch popular manga from MangaDex:", error);
    throw error;
  }
};


export const getMangaVolumesWithCovers = async (mangaId: string): Promise<MangaVolume[]> => {
    try {
        const response = await fetch(`${API_BASE_URL}/cover?manga[]=${mangaId}&limit=100&order[volume]=asc`);
        if (!response.ok) {
            throw new Error(`MangaDex Cover API error: ${response.statusText}`);
        }
        const data: CoverArtResponse = await response.json();

        const volumeMap = new Map<string, MangaVolume>();

        // Filtra e mapeia para o formato MangaVolume, dando preferência para versões mais recentes
        data.data.forEach(cover => {
            if (cover.attributes.volume) {
                const volumeKey = cover.attributes.volume;
                // Se já temos uma capa para este volume, não substituímos (a primeira é geralmente a melhor)
                if (!volumeMap.has(volumeKey)) {
                    volumeMap.set(volumeKey, {
                        volume: volumeKey,
                        coverUrl: `${PROXY_URL}${COVER_BASE_URL}/covers/${mangaId}/${cover.attributes.fileName}.512.jpg`,
                    });
                }
            }
        });

        // Converte o mapa para um array e ordena numericamente
        return Array.from(volumeMap.values()).sort((a, b) => 
            a.volume.localeCompare(b.volume, undefined, { numeric: true })
        );
    } catch (error) {
        console.error("Failed to fetch manga volumes from MangaDex:", error);
        throw error;
    }
}
