export interface Obra {
  id: string;
  titulo: string;
  tipo: 'filme' | 'serie' | 'anime' | 'jogo' | 'canal';
  sinopse: string;
  synopsis?: string;
  ano: number;
  generos: string[];
  banner: string;
  poster: string;
  trailerUrl: string;
  destacado?: boolean;
  channelId?: string;
  /** E-mail da conta verificada do criador oficial na plataforma */
  officialCreatorEmail?: string;
}

export interface ReactVideo {
  id: string; // ID do YouTube
  titulo: string;
  canalNome: string;
  canalId?: string;
  publicadoEm: string;
  duracao: string;
  visualizacoes: number;
  thumbnailUrl: string;
  obraId: string;
  episodioNum?: number;
  isRecomendado?: boolean;
  likes?: number;
  moderationStatus?: 'pending' | 'approved' | 'rejected' | 'hidden';
  isPinnedHome?: boolean;
  scheduledAt?: string;
  isLaunch?: boolean;
}

import type { PublicProfileDisplay } from './types/gamification.ts';
import type { CreatorSocialLinks } from './utils/socialLinks.ts';

export type { CreatorSocialLinks };

export interface PublicUserProfile {
  email: string;
  nome: string;
  avatar?: string;
  descricao?: string;
  socialLinks?: CreatorSocialLinks;
  isVerifiedCreator: boolean;
  profileDisplay: PublicProfileDisplay;
}

export interface Comentario {
  id: string;
  obraId: string;
  usuarioNome: string;
  usuarioEmail: string;
  texto: string;
  nota?: number; // 1 a 5 (legacy)
  likes?: number; // Contador de curtidas CineReact
  criadoEm: string;
  avatar?: string;
  isDonor?: boolean;
  profileDisplay?: PublicProfileDisplay;
  publicProfile?: PublicUserProfile;
  moderationStatus?: 'pending' | 'approved' | 'rejected' | 'hidden';
}

export interface ListaPersonalizada {
  id: string;
  nome: string;
  descricao: string;
  usuarioEmail: string;
  obraIds: string[];
}

export interface ContinueWatchingItem {
  reactId: string;
  obraId: string;
  progress: number;
  updatedAt: number;
}

export interface UserState {
  isLoggedIn: boolean;
  nome: string;
  email: string;
  avatar?: string;
  isAdmin?: boolean;
  isDonor?: boolean;
  isBanned?: boolean;
  isSuspended?: boolean;
  suspendedUntil?: string;
  accountBlocked?: boolean;
  accountBlockMessage?: string;
  continueWatching?: ContinueWatchingItem[];
  descricao?: string;
  socialLinks?: CreatorSocialLinks;
}

export interface Notificacao {
  id: string;
  titulo: string;
  mensagem: string;
  lida: boolean;
  criadoEm: string;
  canalNome?: string;
  obraId?: string;
  usuarioEmail?: string;
}

export interface UserAccount {
  id: string;
  username: string;
  email: string;
  password?: string;
  createdAt: string;
  isAdmin?: boolean;
  avatar?: string;
  isDonor?: boolean;
  continueWatching?: ContinueWatchingItem[];
  descricao?: string;
  socialLinks?: CreatorSocialLinks;
  role?: 'user' | 'moderator' | 'curator' | 'admin';
  isSuspended?: boolean;
  suspendedUntil?: string;
  isBanned?: boolean;
  bannedAt?: string;
  lastActiveAt?: string;
}

