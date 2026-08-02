import React from 'react';
import { Target, Users } from 'lucide-react';
import type { CreatorReactGoal } from '../../constants/demoCreatorShowcase.ts';

export interface CreatorShowcaseGoalsProps {
  goals: CreatorReactGoal[];
}

function formatVotes(value: number): string {
  return value.toLocaleString('pt-BR');
}

function GoalCard({ goal }: { goal: CreatorReactGoal }) {
  const progress = Math.min(100, Math.round((goal.currentVotes / goal.targetVotes) * 100));
  const isUpcoming = goal.status === 'upcoming';

  return (
    <article className={`creator-showcase-goal ${isUpcoming ? 'creator-showcase-goal--upcoming' : ''}`}>
      <div className="creator-showcase-goal-head">
        <span className="creator-showcase-goal-icon" aria-hidden>
          <Target className="w-3.5 h-3.5" strokeWidth={2.25} />
        </span>
        <div className="min-w-0">
          <h3 className="creator-showcase-goal-title">{goal.title}</h3>
          <p className="creator-showcase-goal-sub">{goal.subtitle}</p>
        </div>
      </div>

      <div className="creator-showcase-goal-bar" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
        <span className="creator-showcase-goal-bar-fill" style={{ width: `${progress}%` }} />
      </div>

      <p className="creator-showcase-goal-meta">
        <Users className="w-3 h-3 shrink-0" />
        <span>
          {formatVotes(goal.currentVotes)} / {formatVotes(goal.targetVotes)} votos da comunidade
        </span>
        <span className="creator-showcase-goal-pct">{progress}%</span>
      </p>
    </article>
  );
}

export default function CreatorShowcaseGoals({ goals }: CreatorShowcaseGoalsProps) {
  if (goals.length === 0) return null;

  return (
    <section className="creator-showcase-section" aria-labelledby="creator-showcase-goals-heading">
      <div className="creator-showcase-section-head">
        <h2 id="creator-showcase-goals-heading" className="creator-showcase-section-title">
          Metas para reagir
        </h2>
        <p className="creator-showcase-section-sub">
          A comunidade vota no que o criador reage em seguida
        </p>
      </div>
      <div className="creator-showcase-goals">
        {goals.map((goal) => (
          <GoalCard key={goal.id} goal={goal} />
        ))}
      </div>
    </section>
  );
}
