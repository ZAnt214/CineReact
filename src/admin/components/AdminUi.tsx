import React from 'react';
import type { LucideIcon } from 'lucide-react';

export function AdminStatCard({
  label,
  value,
  sub,
  icon: Icon,
  accent = 'text-cine-accent-light',
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: LucideIcon;
  accent?: string;
}) {
  return (
    <div className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-4 md:p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">{label}</p>
          <p className="text-2xl md:text-3xl font-black text-white mt-1 tabular-nums">{value}</p>
          {sub && <p className="text-xs text-zinc-500 mt-1">{sub}</p>}
        </div>
        <div className={`p-2.5 rounded-xl bg-neutral-950 border border-neutral-800 ${accent}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}

export function AdminPanelCard({
  title,
  description,
  children,
  actions,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-neutral-800 bg-neutral-900/30 overflow-hidden">
      <div className="px-5 py-4 border-b border-neutral-800/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-sm font-black uppercase tracking-wider text-white">{title}</h2>
          {description && <p className="text-xs text-zinc-500 mt-0.5">{description}</p>}
        </div>
        {actions}
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

export function AdminBadge({ children, tone = 'default' }: { children: React.ReactNode; tone?: 'default' | 'success' | 'warning' | 'danger' }) {
  const tones = {
    default: 'bg-neutral-800 text-zinc-300 border-neutral-700',
    success: 'bg-green-950/50 text-green-300 border-green-500/30',
    warning: 'bg-amber-950/50 text-amber-300 border-amber-500/30',
    danger: 'bg-red-950/50 text-red-300 border-red-500/30',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border ${tones[tone]}`}>
      {children}
    </span>
  );
}
