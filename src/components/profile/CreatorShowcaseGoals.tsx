import React from 'react';
import type { CreatorReactGoal } from '../../constants/demoCreatorShowcase.ts';

export interface CreatorShowcaseGoalsProps {
  goals: CreatorReactGoal[];
}

function formatVotes(value: number): string {
  return value.toLocaleString('pt-BR');
}

function GoalRow({ goal }: { goal: CreatorReactGoal }) {
  const progress = Math.min(100, Math.round((goal.currentVotes / goal.targetVotes) * 100));

  return (
    <li className="rounded-xl border border-neutral-800/60 bg-neutral-950/35 px-4 py-3.5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-zinc-100 leading-snug">{goal.title}</p>
          <p className="text-xs text-zinc-500 mt-0.5">{goal.subtitle}</p>
        </div>
        <span className="text-xs font-mono font-bold text-cine-accent shrink-0">{progress}%</span>
      </div>
      <div
        className="mt-3 h-1 rounded-full bg-neutral-800 overflow-hidden"
        role="progressbar"
        aria-valuenow={progress}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-full rounded-full bg-cine-accent"
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="mt-2 text-[11px] text-zinc-500">
        {formatVotes(goal.currentVotes)} de {formatVotes(goal.targetVotes)} votos
      </p>
    </li>
  );
}

export default function CreatorShowcaseGoals({ goals }: CreatorShowcaseGoalsProps) {
  if (goals.length === 0) return null;

  return (
    <section className="pt-8 border-t border-neutral-800/60" aria-labelledby="creator-goals-title">
      <p className="text-[11px] uppercase tracking-[0.32em] text-zinc-500 font-semibold">Comunidade</p>
      <h2 id="creator-goals-title" className="font-display text-lg sm:text-xl font-bold text-white mt-1">
        Próximos reacts
      </h2>
      <p className="text-sm text-zinc-500 mt-1 mb-4">Votação aberta na plataforma</p>

      <ul className="space-y-2.5">
        {goals.map((goal) => (
          <GoalRow key={goal.id} goal={goal} />
        ))}
      </ul>
    </section>
  );
}
