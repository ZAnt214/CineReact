import type { Obra, ReactVideo } from '../types.ts';
import {
  DEMO_CREATOR_AVATAR,
  DEMO_CREATOR_EMAIL,
  DEMO_CREATOR_NAME,
} from '../constants/demoCreator.ts';

export interface VideoCreatorNavItem {
  id: string;
  nome: string;
  poster?: string;
  reactCount: number;
  isVerified?: boolean;
  isDemo?: boolean;
  kind: 'canal' | 'demo';
  demoEmail?: string;
}

function countReactsForCanal(
  canalId: string,
  channelId: string | undefined,
  canalNome: string,
  reacts: ReactVideo[]
): number {
  const normalizedName = canalNome.trim().toLowerCase();

  return reacts.filter((react) => {
    if (react.obraId === canalId) return true;
    if (channelId && react.canalId === channelId) return true;
    return react.canalNome.trim().toLowerCase() === normalizedName;
  }).length;
}

export function buildVideoCreatorsNavList(
  obras: Obra[],
  reacts: ReactVideo[]
): VideoCreatorNavItem[] {
  const demoItem: VideoCreatorNavItem = {
    id: 'demo-verified-creator',
    nome: DEMO_CREATOR_NAME,
    poster: DEMO_CREATOR_AVATAR,
    reactCount: 0,
    isVerified: true,
    isDemo: true,
    kind: 'demo',
    demoEmail: DEMO_CREATOR_EMAIL,
  };

  const canalItems = obras
    .filter((obra) => obra.tipo === 'canal')
    .map((canal) => {
      const nome = canal.titulo.replace(/^Canal\s+/i, '').trim();
      return {
        id: canal.id,
        nome,
        poster: canal.poster || canal.banner,
        reactCount: countReactsForCanal(canal.id, canal.channelId, nome, reacts),
        kind: 'canal' as const,
      };
    })
    .filter((item) => item.reactCount > 0 || item.poster)
    .sort((a, b) => {
      if (b.reactCount !== a.reactCount) return b.reactCount - a.reactCount;
      return a.nome.localeCompare(b.nome, 'pt-BR');
    });

  return [demoItem, ...canalItems];
}
