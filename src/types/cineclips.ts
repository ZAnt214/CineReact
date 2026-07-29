export type CineClipSourceType = 'youtube' | 'upload';
export type CineClipStatus = 'draft' | 'processing' | 'published' | 'hidden' | 'rejected';
export type CineClipImportStatus = 'queued' | 'processing' | 'completed' | 'failed';
export type CineClipReportReason = 'spam' | 'inappropriate' | 'copyright' | 'misleading' | 'other';

export interface CineClip {
  id: string;
  sourceType: CineClipSourceType;
  sourceUrl?: string;
  youtubeId?: string;
  titulo: string;
  descricao: string;
  criadorNome: string;
  criadorEmail?: string;
  criadorCanalId?: string;
  thumbnailUrl: string;
  duracao: string;
  duracaoSegundos: number;
  categorias: string[];
  tags: string[];
  hashtags: string[];
  visualizacoes: number;
  likes: number;
  shares: number;
  favorites: number;
  commentsCount: number;
  trendingScore: number;
  isTrending: boolean;
  status: CineClipStatus;
  publicadoEm: string;
  criadoEm: string;
  atualizadoEm: string;
}

export interface CineClipComment {
  id: string;
  clipId: string;
  usuarioNome: string;
  usuarioEmail: string;
  texto: string;
  likes: number;
  criadoEm: string;
  moderationStatus?: 'pending' | 'approved' | 'rejected' | 'hidden';
}

export interface CineClipLike {
  usuarioEmail: string;
  clipId: string;
  criadoEm: string;
}

export interface CineClipFavorite {
  usuarioEmail: string;
  clipId: string;
  criadoEm: string;
}

export interface CineClipShare {
  clipId: string;
  usuarioEmail?: string;
  criadoEm: string;
}

export interface CineClipWatchEvent {
  usuarioEmail: string;
  clipId: string;
  watchSeconds: number;
  completed: boolean;
  criadoEm: string;
}

export interface CineClipReport {
  id: string;
  clipId: string;
  usuarioEmail: string;
  usuarioNome: string;
  reason: CineClipReportReason;
  details?: string;
  status: 'pending' | 'reviewed' | 'dismissed';
  criadoEm: string;
}

export interface CineClipImportJob {
  id: string;
  sourceUrl: string;
  sourceType: CineClipSourceType;
  status: CineClipImportStatus;
  progress: number;
  titulo?: string;
  descricao?: string;
  criadorNome?: string;
  thumbnailUrl?: string;
  categorias?: string[];
  tags?: string[];
  clipId?: string;
  error?: string;
  errorCode?: string;
  alternatives?: string[];
  createdBy: string;
  criadoEm: string;
  atualizadoEm: string;
  completedAt?: string;
}

export interface CineClipsFeedResponse {
  clips: CineClip[];
  nextCursor: string | null;
  trending: CineClip[];
}

export const CINECLIPS_CATEGORIES = [
  'Reação',
  'Filme',
  'Série',
  'Anime',
  'Jogo',
  'Humor',
  'Surpresa',
  'Crítica',
  'Viral',
] as const;
