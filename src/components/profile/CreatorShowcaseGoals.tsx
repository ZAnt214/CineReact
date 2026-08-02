import React, { useState } from 'react';
import { Heart } from 'lucide-react';
import {
  DEMO_CREATOR_FUNDING_GOALS,
  formatReais,
  type CreatorFundingGoal,
} from '../../constants/demoCreatorShowcase.ts';

export interface CreatorShowcaseGoalsProps {
  goals?: CreatorFundingGoal[];
}

function GoalRow({
  goal,
  onDonate,
  donated,
}: {
  goal: CreatorFundingGoal;
  onDonate: (id: string) => void;
  donated: boolean;
}) {
  const progress = Math.min(100, Math.round((goal.currentReais / goal.targetReais) * 100));
  const isCompleted = goal.status === 'completed' || progress >= 100;
  const remaining = Math.max(0, goal.targetReais - goal.currentReais);

  return (
    <li className={`creator-premium-goal ${isCompleted ? 'creator-premium-goal--done' : ''}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-[var(--premium-cream)] leading-snug">{goal.title}</p>
          {goal.subtitle && (
            <p className="text-xs text-[var(--premium-muted)] mt-0.5">{goal.subtitle}</p>
          )}
        </div>
        <span className="creator-premium-goal-target shrink-0">{formatReais(goal.targetReais)}</span>
      </div>

      <div
        className="creator-premium-goal-bar mt-3"
        role="progressbar"
        aria-valuenow={progress}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${formatReais(goal.currentReais)} de ${formatReais(goal.targetReais)}`}
      >
        <span className="creator-premium-goal-bar-fill" style={{ width: `${progress}%` }} />
      </div>

      <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2">
        <p className="text-[11px] text-[var(--premium-muted)]">
          <span className="text-[var(--premium-gold-light)] font-semibold">
            {formatReais(goal.currentReais)}
          </span>
          {' '}de {formatReais(goal.targetReais)}
          {!isCompleted && (
            <span className="text-zinc-600"> · faltam {formatReais(remaining)}</span>
          )}
        </p>
        {!isCompleted && (
          <button
            type="button"
            onClick={() => onDonate(goal.id)}
            className="creator-premium-goal-donate"
          >
            <Heart className="w-3 h-3" strokeWidth={2.25} />
            {donated ? 'Doação enviada' : 'Doar'}
          </button>
        )}
        {isCompleted && (
          <span className="creator-premium-goal-badge">Meta batida</span>
        )}
      </div>
    </li>
  );
}

export default function CreatorShowcaseGoals({ goals = DEMO_CREATOR_FUNDING_GOALS }: CreatorShowcaseGoalsProps) {
  const [donatedGoals, setDonatedGoals] = useState<Set<string>>(new Set());

  if (goals.length === 0) return null;

  const handleDonate = (id: string) => {
    setDonatedGoals((prev) => new Set(prev).add(id));
  };

  return (
    <section className="creator-premium-section" aria-labelledby="creator-goals-title">
      <p className="creator-premium-label">Metas</p>
      <h2 id="creator-goals-title" className="creator-premium-title">
        Vaquinha para reacts
      </h2>
      <p className="creator-premium-desc">
        Definidas pelo criador — os fãs doam até bater o valor e o react acontece.
      </p>

      <ul className="space-y-2.5 mt-4">
        {goals.map((goal) => (
          <GoalRow
            key={goal.id}
            goal={goal}
            onDonate={handleDonate}
            donated={donatedGoals.has(goal.id)}
          />
        ))}
      </ul>
    </section>
  );
}
