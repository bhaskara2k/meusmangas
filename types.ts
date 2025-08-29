export interface MangaSearchResult {
  id: string;
  title: string;
  mainCoverUrl: string;
}

export interface MangaVolume {
  volume: string;
  coverUrl: string;
}

export interface CollectionItem {
  id: string; // mangaId-volume
  mangaId: string;
  title: string;
  volume: string;
  imageUrl: string;
  publisher: Publisher;
}

export enum Publisher {
  PANINI = "Panini",
  JBC = "JBC",
  NEWPOP = "NewPOP",
  MPEG = "MPEG",
  CONRAD = "Conrad",
}

export enum View {
  SEARCH = 'search',
  COLLECTION = 'collection',
  COMPLETENESS = 'completeness',
  STATISTICS = 'statistics',
}

export enum MangaStatus {
  ONGOING = "Em Lançamento",
  FINISHED = "Finalizado",
}

export type SeriesStatusCollection = Record<string, MangaStatus>; // { [mangaId]: MangaStatus }