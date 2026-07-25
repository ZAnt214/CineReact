import type { RewardVisualStyle, UnlockMethod } from '../types/gamification.ts';

export interface VisualStyleConfig {
  label: string;
  gradient: string;
  gradientCss?: string;
  ring: string;
  glow: string;
  accent: string;
  /** Text contrast on themed profile surfaces */
  tone?: 'dark' | 'light';
  particles?: 'stars' | 'sparkles' | 'bubbles' | 'confetti';
  animated?: boolean;
  shimmer?: boolean;
}

export const VISUAL_STYLES: Record<RewardVisualStyle, VisualStyleConfig> = {
  amber: {
    label: 'Âmbar',
    gradient: 'from-amber-700 via-orange-600 to-yellow-500',
    gradientCss: 'linear-gradient(135deg, #b45309, #ea580c, #eab308)',
    ring: 'ring-amber-400/70 shadow-[0_0_20px_rgba(245,158,11,0.35)]',
    glow: 'shadow-[0_0_18px_rgba(245,158,11,0.25)]',
    accent: 'text-amber-300',
    animated: true,
    shimmer: true,
  },
  neon: {
    label: 'Neon',
    gradient: 'from-cyan-500 via-blue-500 to-fuchsia-500',
    gradientCss: 'linear-gradient(135deg, #06b6d4, #3b82f6, #d946ef)',
    ring: 'ring-cyan-400/80 shadow-[0_0_25px_rgba(34,211,238,0.45)]',
    glow: 'shadow-[0_0_22px_rgba(34,211,238,0.35)]',
    accent: 'text-cyan-300',
    animated: true,
    particles: 'sparkles',
  },
  royal: {
    label: 'Real',
    gradient: 'from-violet-700 via-purple-600 to-fuchsia-500',
    gradientCss: 'linear-gradient(135deg, #6d28d9, #9333ea, #d946ef)',
    ring: 'ring-purple-400/70 shadow-[0_0_28px_rgba(168,85,247,0.4)]',
    glow: 'shadow-[0_0_24px_rgba(168,85,247,0.3)]',
    accent: 'text-purple-200',
    animated: true,
    shimmer: true,
  },
  rainbow: {
    label: 'Arco-íris',
    gradient: 'from-rose-500 via-amber-400 via-emerald-400 via-sky-400 to-violet-500',
    gradientCss: 'linear-gradient(135deg, #f43f5e, #f59e0b, #22c55e, #38bdf8, #a855f7, #ec4899)',
    ring: 'ring-white/30 shadow-[0_0_30px_rgba(236,72,153,0.35)]',
    glow: 'shadow-[0_0_28px_rgba(168,85,247,0.35)]',
    accent: 'text-white',
    animated: true,
    shimmer: true,
    particles: 'sparkles',
  },
  galaxy: {
    label: 'Galáxia',
    gradient: 'from-indigo-950 via-purple-900 to-violet-950',
    gradientCss: 'radial-gradient(ellipse at 30% 20%, #4c1d95 0%, #1e1b4b 40%, #0f0a1e 100%)',
    ring: 'ring-violet-400/50 shadow-[0_0_35px_rgba(139,92,246,0.4)]',
    glow: 'shadow-[0_0_30px_rgba(99,102,241,0.35)]',
    accent: 'text-violet-200',
    animated: true,
    particles: 'stars',
  },
  candy: {
    label: 'Candy',
    gradient: 'from-pink-400 via-fuchsia-300 to-sky-300',
    gradientCss: 'linear-gradient(135deg, #f9a8d4, #e879f9, #c4b5fd, #7dd3fc)',
    ring: 'ring-pink-300/60 shadow-[0_0_25px_rgba(244,114,182,0.4)]',
    glow: 'shadow-[0_0_22px_rgba(236,72,153,0.3)]',
    accent: 'text-pink-900',
    tone: 'light',
    animated: true,
    particles: 'bubbles',
  },
  holographic: {
    label: 'Holográfico',
    gradient: 'from-cyan-400 via-purple-400 to-pink-400',
    gradientCss: 'linear-gradient(135deg, #22d3ee, #a78bfa, #f472b6, #34d399, #22d3ee)',
    ring: 'ring-white/40 shadow-[0_0_35px_rgba(34,211,238,0.35)]',
    glow: 'shadow-[0_0_32px_rgba(168,85,247,0.35)]',
    accent: 'text-cyan-100',
    animated: true,
    shimmer: true,
    particles: 'sparkles',
  },
  nebula: {
    label: 'Nebulosa',
    gradient: 'from-indigo-950 via-purple-950 to-fuchsia-950',
    gradientCss: 'radial-gradient(ellipse at 70% 30%, #581c87 0%, #312e81 45%, #0c0a14 100%)',
    ring: 'ring-indigo-400/40 shadow-[0_0_28px_rgba(99,102,241,0.35)]',
    glow: 'shadow-[0_0_26px_rgba(139,92,246,0.3)]',
    accent: 'text-indigo-200',
    animated: true,
    particles: 'stars',
  },
  aurora: {
    label: 'Aurora',
    gradient: 'from-emerald-900 via-purple-900 to-cyan-900',
    gradientCss: 'linear-gradient(160deg, #064e3b, #4c1d95, #0e7490)',
    ring: 'ring-emerald-400/40 shadow-[0_0_30px_rgba(52,211,153,0.3)]',
    glow: 'shadow-[0_0_28px_rgba(34,211,238,0.25)]',
    accent: 'text-emerald-200',
    animated: true,
    particles: 'sparkles',
  },
  gold: {
    label: 'Ouro',
    gradient: 'from-yellow-600 via-amber-500 to-yellow-300',
    gradientCss: 'linear-gradient(135deg, #ca8a04, #f59e0b, #fde047)',
    ring: 'ring-yellow-300/80 shadow-[0_0_36px_rgba(252,211,77,0.55)]',
    glow: 'shadow-[0_0_32px_rgba(245,158,11,0.5)]',
    accent: 'text-yellow-100',
    animated: true,
    shimmer: true,
  },
  midnight: {
    label: 'Midnight',
    gradient: 'from-slate-950 via-blue-950 to-slate-900',
    gradientCss: 'linear-gradient(145deg, #020617 0%, #172554 45%, #0f172a 100%)',
    ring: 'ring-blue-400/55 shadow-[0_0_28px_rgba(59,130,246,0.4)]',
    glow: 'shadow-[0_0_26px_rgba(59,130,246,0.35)]',
    accent: 'text-blue-200',
    animated: true,
    shimmer: true,
    particles: 'stars',
  },
  cinema: {
    label: 'Cinema',
    gradient: 'from-red-950 via-zinc-950 to-black',
    gradientCss: 'radial-gradient(ellipse at 50% 0%, #7f1d1d 0%, #18181b 50%, #000 100%)',
    ring: 'ring-red-400/60 shadow-[0_0_30px_rgba(239,68,68,0.45)]',
    glow: 'shadow-[0_0_28px_rgba(185,28,28,0.4)]',
    accent: 'text-red-200',
    animated: true,
    shimmer: true,
  },
  ember: {
    label: 'Brasa',
    gradient: 'from-orange-700 via-red-600 to-amber-500',
    gradientCss: 'linear-gradient(135deg, #c2410c, #dc2626, #f59e0b)',
    ring: 'ring-orange-400/60 shadow-[0_0_24px_rgba(249,115,22,0.4)]',
    glow: 'shadow-[0_0_22px_rgba(234,88,12,0.35)]',
    accent: 'text-orange-200',
    animated: true,
    shimmer: true,
    particles: 'sparkles',
  },
  crystal: {
    label: 'Cristal',
    gradient: 'from-sky-400 via-cyan-300 to-blue-400',
    gradientCss: 'linear-gradient(135deg, #38bdf8, #67e8f9, #60a5fa)',
    ring: 'ring-sky-300/60 shadow-[0_0_24px_rgba(56,189,248,0.35)]',
    glow: 'shadow-[0_0_20px_rgba(14,165,233,0.3)]',
    accent: 'text-sky-100',
    animated: true,
    shimmer: true,
  },
  halloween: {
    label: 'Halloween',
    gradient: 'from-orange-950 via-zinc-950 to-purple-950',
    ring: 'ring-orange-500/70 shadow-[0_0_28px_rgba(249,115,22,0.4)]',
    glow: 'shadow-[0_0_24px_rgba(168,85,247,0.3)]',
    accent: 'text-orange-300',
    animated: true,
    particles: 'sparkles',
  },
  natal: {
    label: 'Natal',
    gradient: 'from-red-900 via-emerald-950 to-sky-950',
    ring: 'ring-red-400/50 shadow-[0_0_25px_rgba(239,68,68,0.35)]',
    glow: 'shadow-[0_0_22px_rgba(34,197,94,0.25)]',
    accent: 'text-red-200',
    animated: true,
    particles: 'confetti',
  },
  rose: {
    label: 'Rosa',
    gradient: 'from-rose-700 via-pink-600 to-rose-400',
    gradientCss: 'linear-gradient(135deg, #be123c, #db2777, #fb7185)',
    ring: 'ring-rose-400/60 shadow-[0_0_22px_rgba(244,63,94,0.35)]',
    glow: 'shadow-[0_0_20px_rgba(236,72,153,0.3)]',
    accent: 'text-rose-200',
    animated: true,
    shimmer: true,
  },
  forest: {
    label: 'Floresta',
    gradient: 'from-green-900 via-emerald-950 to-zinc-950',
    gradientCss: 'linear-gradient(145deg, #14532d, #064e3b, #09090b)',
    ring: 'ring-emerald-500/50 shadow-[0_0_20px_rgba(34,197,94,0.3)]',
    glow: 'shadow-[0_0_18px_rgba(22,163,74,0.25)]',
    accent: 'text-emerald-300',
    animated: true,
    particles: 'stars',
  },
  slate: {
    label: 'Grafite',
    gradient: 'from-zinc-800 via-zinc-900 to-zinc-950',
    gradientCss: 'linear-gradient(145deg, #52525b, #27272a, #09090b)',
    ring: 'ring-zinc-400/50 shadow-[0_0_18px_rgba(161,161,170,0.25)]',
    glow: 'shadow-[0_0_16px_rgba(113,113,122,0.2)]',
    accent: 'text-zinc-300',
    animated: true,
    shimmer: true,
  },
  creator: {
    label: 'Criador',
    gradient: 'from-fuchsia-600 via-pink-500 to-rose-400',
    ring: 'ring-pink-400/50 shadow-[0_0_22px_rgba(236,72,153,0.3)]',
    glow: 'shadow-[0_0_20px_rgba(244,114,182,0.25)]',
    accent: 'text-pink-100',
    shimmer: true,
  },
};

export const UNLOCK_METHOD_INFO: Record<
  UnlockMethod,
  { label: string; shortLabel: string }
> = {
  default: { label: 'Padrão', shortLabel: 'Incluso' },
  shop: { label: 'Loja Spotlight', shortLabel: 'Comprar' },
  level: { label: 'Por nível', shortLabel: 'Nível' },
  achievement: { label: 'Conquista', shortLabel: 'Conquista' },
  follow_creator: { label: 'Seguir criador', shortLabel: 'Seguir canal' },
  watch_creator: { label: 'Assistir criador', shortLabel: 'Assistir reacts' },
  seasonal: { label: 'Evento sazonal', shortLabel: 'Evento' },
  promo_code: { label: 'Código promocional', shortLabel: 'Código' },
  event: { label: 'Evento especial', shortLabel: 'Evento' },
  streak: { label: 'Sequência diária', shortLabel: 'Sequência' },
  legacy: { label: 'Legado', shortLabel: 'Legado' },
};

export function getVisualStyle(style?: RewardVisualStyle): VisualStyleConfig {
  return VISUAL_STYLES[style || 'slate'];
}

const RARITY_FALLBACK: Partial<Record<string, RewardVisualStyle>> = {
  comum: 'slate',
  incomum: 'crystal',
  raro: 'neon',
  épico: 'royal',
  lendário: 'gold',
  mítico: 'holographic',
  exclusivo: 'rainbow',
};

export function resolveVisualStyle(
  item: { id?: string; visualStyle?: RewardVisualStyle; rarity?: string; category?: string },
): RewardVisualStyle {
  if (item.visualStyle) return item.visualStyle;
  if (item.id && ITEM_VISUAL_MAP[item.id]) return ITEM_VISUAL_MAP[item.id];
  if (item.category === 'tag') return 'creator';
  return RARITY_FALLBACK[item.rarity || 'comum'] || 'slate';
}

const ITEM_VISUAL_MAP: Record<string, RewardVisualStyle> = {
  'frame-amber': 'amber', 'frame-neon': 'neon', 'frame-royal': 'royal', 'frame-critico': 'rose',
  'frame-influencer': 'gold', 'frame-elite': 'holographic', 'frame-pulse': 'neon',
  'frame-halloween-2026': 'halloween', 'frame-natal-2026': 'natal',
  'title-entusiasta': 'slate', 'title-especialista': 'crystal', 'title-curador': 'royal',
  'title-lenda': 'gold', 'title-oraculo': 'aurora', 'title-aniversario-cinereact': 'rainbow',
  'avatar-popcorn': 'amber', 'avatar-clapper': 'royal', 'avatar-royal': 'gold', 'avatar-ghost': 'halloween',
  'badge-explorador': 'forest', 'badge-curador': 'royal', 'badge-lenda': 'gold',
  'badge-spotlight': 'galaxy', 'badge-streak-30': 'ember',
  'theme-midnight': 'midnight', 'theme-icone': 'gold', 'theme-aurora': 'aurora',
  'effect-particles': 'gold', 'effect-aurora': 'aurora', 'effect-sparkle': 'crystal',
  'effect-confetti-ano-novo': 'rainbow',
  'bg-cinema': 'cinema', 'bg-nebula': 'galaxy', 'bg-gold': 'gold', 'bg-halloween-2026': 'halloween',
  'reaction-fire': 'ember', 'reaction-mindblown': 'galaxy', 'emoji-clap': 'candy', 'emoji-crown': 'gold',
  'emoji-halloween-bat': 'halloween',
  'card-classic': 'slate', 'card-premium': 'gold', 'card-holographic': 'holographic', 'card-natal-2026': 'natal',
  'theme-rainbow': 'rainbow', 'theme-galaxy': 'galaxy', 'theme-candy': 'candy',
  'bg-rainbow': 'rainbow', 'bg-candy-clouds': 'candy',
  'effect-rainbow-aura': 'rainbow', 'frame-rainbow': 'rainbow',
};

export function formatObtainText(
  item: { unlockMethod?: UnlockMethod; obtainHint: string; cost: number; owned: boolean },
): string {
  if (item.owned) return 'Você já possui este item';
  const method = item.unlockMethod || 'shop';
  const info = UNLOCK_METHOD_INFO[method];
  if (method === 'shop' && item.cost > 0) {
    return `${info.label} · ${item.cost} Spotlight`;
  }
  return item.obtainHint || info.label;
}
