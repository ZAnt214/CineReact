import { localDb } from '../db/local_db.ts';
import { VERIFIED_PROFILE_BADGE_ID } from '../data/rewardsCatalog.ts';
import {
  DEMO_CREATOR_AVATAR,
  DEMO_CREATOR_EMAIL,
  DEMO_CREATOR_NAME,
} from '../constants/demoCreator.ts';
import { ensureDemoCreatorProfile } from './demoCreator.ts';
import { findOfficialCreatorEmailForChannel } from './publicUserProfile.ts';
import { hasReward, migrateProfile } from './rewardsEngine.ts';
import { isVerifiedCreatorLoadout } from './verifiedCreator.ts';

export interface VideoCreatorListItem {
  id: string;
  nome: string;
  poster?: string;
  reactCount: number;
  isVerified: boolean;
  isDemo?: boolean;
  kind: 'canal' | 'demo';
  demoEmail?: string;
}

function countReactsForCanal(
  canalId: string,
  channelId: string | undefined,
  canalNome: string
): number {
  const reacts = localDb.getReacts();
  const normalizedName = canalNome.trim().toLowerCase();

  return reacts.filter((react) => {
    if (react.obraId === canalId) return true;
    if (channelId && react.canalId === channelId) return true;
    return react.canalNome.trim().toLowerCase() === normalizedName;
  }).length;
}

function isChannelVerified(canalId: string, officialCreatorEmail?: string): boolean {
  const email = findOfficialCreatorEmailForChannel(canalId, officialCreatorEmail);
  if (!email) return false;

  const profile = migrateProfile(localDb.getGamificationProfile(email));
  return (
    isVerifiedCreatorLoadout(profile.loadout) ||
    hasReward(profile, VERIFIED_PROFILE_BADGE_ID)
  );
}

export function listVideoCreators(): VideoCreatorListItem[] {
  ensureDemoCreatorProfile();

  const demoItem: VideoCreatorListItem = {
    id: 'demo-verified-creator',
    nome: DEMO_CREATOR_NAME,
    poster: DEMO_CREATOR_AVATAR,
    reactCount: 0,
    isVerified: true,
    isDemo: true,
    kind: 'demo',
    demoEmail: DEMO_CREATOR_EMAIL,
  };

  const canalItems: VideoCreatorListItem[] = localDb
    .getObras()
    .filter((obra) => obra.tipo === 'canal')
    .map((canal) => {
      const nome = canal.titulo.replace(/^Canal\s+/i, '').trim();
      return {
        id: canal.id,
        nome,
        poster: canal.poster || canal.banner,
        reactCount: countReactsForCanal(canal.id, canal.channelId, nome),
        isVerified: isChannelVerified(canal.id, canal.officialCreatorEmail),
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

/** @deprecated Use listVideoCreators */
export function listPlatformCreators(): VideoCreatorListItem[] {
  return listVideoCreators();
}

export type PlatformCreatorListItem = VideoCreatorListItem;
