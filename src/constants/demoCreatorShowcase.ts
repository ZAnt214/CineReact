import type { ReactVideo } from '../types.ts';

export interface CreatorReactGoal {
  id: string;
  title: string;
  subtitle: string;
  currentVotes: number;
  targetVotes: number;
  status: 'active' | 'upcoming' | 'completed';
}

export const DEMO_CREATOR_REACT_GOALS: CreatorReactGoal[] = [
  {
    id: 'goal-duna-3',
    title: 'Reagir a Duna: Parte Três',
    subtitle: 'Quando o trailer oficial estrear',
    currentVotes: 2847,
    targetVotes: 5000,
    status: 'active',
  },
  {
    id: 'goal-interstellar',
    title: 'Maratona Interstellar com chat ao vivo',
    subtitle: 'Especial de cinema pedido pela comunidade',
    currentVotes: 1204,
    targetVotes: 3000,
    status: 'active',
  },
  {
    id: 'goal-arcane-s3',
    title: 'Arcane — temporada 3',
    subtitle: 'Próxima votação aberta em breve',
    currentVotes: 890,
    targetVotes: 2500,
    status: 'upcoming',
  },
];

/** Destaques de exemplo — usa reacts reais da plataforma quando disponíveis. */
export function pickDemoFeaturedReacts(reacts: ReactVideo[], limit = 3): ReactVideo[] {
  const pool = reacts.filter((r) => r.moderationStatus !== 'rejected' && r.moderationStatus !== 'hidden');
  const pinned = pool.filter((r) => r.isPinnedHome || r.isRecomendado);
  const source = pinned.length > 0 ? pinned : pool;
  return source.slice(0, limit);
}
