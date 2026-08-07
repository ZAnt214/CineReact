export interface CreatorFundingGoal {
  id: string;
  title: string;
  subtitle?: string;
  targetReais: number;
  currentReais: number;
  status: 'active' | 'upcoming' | 'completed';
}

export const DEMO_CREATOR_FUNDING_GOALS: CreatorFundingGoal[] = [
  {
    id: 'goal-interstellar',
    title: 'Assistir Interstellar',
    subtitle: 'React completo com comentários ao vivo',
    targetReais: 300,
    currentReais: 187,
    status: 'active',
  },
  {
    id: 'goal-duna-3',
    title: 'Reagir a Duna: Parte Três',
    subtitle: 'Estreia assim que o trailer oficial sair',
    targetReais: 450,
    currentReais: 312,
    status: 'active',
  },
  {
    id: 'goal-arcane-s3',
    title: 'Maratona Arcane — temporada 3',
    subtitle: 'Meta definida pelo criador',
    targetReais: 250,
    currentReais: 250,
    status: 'completed',
  },
];

export function formatReais(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
