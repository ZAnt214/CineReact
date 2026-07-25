import type { PromoCodeDefinition, RewardItemDefinition, RewardRarity } from '../types/gamification.ts';

export const RARITY_ORDER: RewardRarity[] = [
  'comum', 'incomum', 'raro', 'épico', 'lendário', 'mítico', 'exclusivo',
];

export const RARITY_STYLES: Record<RewardRarity, { border: string; bg: string; text: string; glow: string; label: string }> = {
  comum: { border: 'border-zinc-700', bg: 'bg-zinc-900/50', text: 'text-zinc-300', glow: '', label: 'Comum' },
  incomum: { border: 'border-emerald-500/40', bg: 'bg-emerald-950/25', text: 'text-emerald-300', glow: 'shadow-[0_0_12px_rgba(16,185,129,0.12)]', label: 'Incomum' },
  raro: { border: 'border-blue-500/40', bg: 'bg-blue-950/30', text: 'text-blue-300', glow: 'shadow-[0_0_15px_rgba(59,130,246,0.15)]', label: 'Raro' },
  épico: { border: 'border-purple-500/50', bg: 'bg-purple-950/30', text: 'text-purple-300', glow: 'shadow-[0_0_20px_rgba(168,85,247,0.2)]', label: 'Épico' },
  lendário: { border: 'border-amber-500/60', bg: 'bg-amber-950/30', text: 'text-amber-300', glow: 'shadow-[0_0_25px_rgba(245,158,11,0.25)]', label: 'Lendário' },
  mítico: { border: 'border-rose-500/60', bg: 'bg-rose-950/35', text: 'text-rose-300', glow: 'shadow-[0_0_30px_rgba(244,63,94,0.3)]', label: 'Mítico' },
  exclusivo: { border: 'border-cyan-400/70', bg: 'bg-gradient-to-br from-cyan-950/40 to-purple-950/40', text: 'text-cyan-200', glow: 'shadow-[0_0_35px_rgba(34,211,238,0.35)]', label: 'Exclusivo' },
};

export const CATEGORY_LABELS: Record<string, string> = {
  frame: 'Molduras',
  tag: 'Tags de Perfil',
  title: 'Títulos',
  avatar: 'Avatares',
  badge: 'Emblemas',
  theme: 'Temas',
  effect: 'Efeitos',
  background: 'Fundos',
  reaction: 'Reações',
  emoji: 'Emojis',
  profile_card: 'Cartões de Perfil',
};

const CREATOR_TAGS: RewardItemDefinition[] = [
  {
    id: 'tag-fan-isabela-roza',
    name: 'Fã Isabela Roza',
    description: 'Tag oficial para fãs do canal Isabela Roza.',
    category: 'tag',
    rarity: 'raro',
    cost: 0,
    unlockMethod: 'follow_creator',
    obtainHint: 'Siga o canal Isabela Roza',
    creatorId: 'isabela-roza-canal',
    creatorName: 'Isabela Roza',
    creatorColors: { from: '#ec4899', to: '#f472b6', text: '#fce7f3' },
  },
  {
    id: 'tag-squad-isabela-roza',
    name: 'Squad Isabela Roza',
    description: 'Assista 5 reações do canal para desbloquear.',
    category: 'tag',
    rarity: 'épico',
    cost: 0,
    unlockMethod: 'watch_creator',
    obtainHint: 'Assista 5 reações de Isabela Roza',
    creatorId: 'isabela-roza-canal',
    creatorName: 'Isabela Roza',
    creatorColors: { from: '#db2777', to: '#f9a8d4', text: '#fff1f2' },
  },
  {
    id: 'tag-fan-janela-da-rua',
    name: 'Comunidade Janela da Rua',
    description: 'Tag da comunidade oficial Janela da Rua.',
    category: 'tag',
    rarity: 'raro',
    cost: 0,
    unlockMethod: 'follow_creator',
    obtainHint: 'Siga o canal Janela da Rua',
    creatorId: 'janela-da-rua-canal',
    creatorName: 'Janela da Rua',
    creatorColors: { from: '#2563eb', to: '#60a5fa', text: '#dbeafe' },
  },
  {
    id: 'tag-vip-janela-da-rua',
    name: 'VIP Janela da Rua',
    description: 'Exclusiva para quem assistiu 10 reações do canal.',
    category: 'tag',
    rarity: 'lendário',
    cost: 0,
    unlockMethod: 'watch_creator',
    obtainHint: 'Assista 10 reações de Janela da Rua',
    creatorId: 'janela-da-rua-canal',
    creatorName: 'Janela da Rua',
    creatorColors: { from: '#1d4ed8', to: '#93c5fd', text: '#eff6ff' },
  },
  {
    id: 'tag-fan-gamer-bisonho',
    name: 'Fã Gamer Bisonho',
    description: 'Mostre seu apoio ao Gamer Bisonho.',
    category: 'tag',
    rarity: 'raro',
    cost: 0,
    unlockMethod: 'follow_creator',
    obtainHint: 'Siga o canal Gamer Bisonho',
    creatorId: 'gamer-bisonho-canal',
    creatorName: 'Gamer Bisonho',
    creatorColors: { from: '#16a34a', to: '#4ade80', text: '#dcfce7' },
  },
  {
    id: 'tag-fan-fanit-lin',
    name: 'Fã Fanit & Lin',
    description: 'Tag oficial da dupla mãe e filha.',
    category: 'tag',
    rarity: 'raro',
    cost: 0,
    unlockMethod: 'follow_creator',
    obtainHint: 'Siga o canal Fanit & Lin',
    creatorId: 'canal-fanit-lin',
    creatorName: 'Fanit & Lin',
    creatorColors: { from: '#e11d48', to: '#fb7185', text: '#ffe4e6' },
  },
  {
    id: 'tag-squad-fanit-lin',
    name: 'Squad Fanit & Lin',
    description: 'Para membros dedicados da comunidade.',
    category: 'tag',
    rarity: 'épico',
    cost: 0,
    unlockMethod: 'watch_creator',
    obtainHint: 'Assista 5 reações de Fanit & Lin',
    creatorId: 'canal-fanit-lin',
    creatorName: 'Fanit & Lin',
    creatorColors: { from: '#be123c', to: '#fda4af', text: '#fff1f2' },
  },
  {
    id: 'tag-fan-carol-rhay',
    name: 'Comunidade Carol e Rhay',
    description: 'Tag exclusiva dos fãs do canal.',
    category: 'tag',
    rarity: 'raro',
    cost: 0,
    unlockMethod: 'follow_creator',
    obtainHint: 'Siga o canal Carol e Rhay',
    creatorId: 'carol-e-rhay-canal',
    creatorName: 'Carol e Rhay',
    creatorColors: { from: '#7c3aed', to: '#a78bfa', text: '#ede9fe' },
  },
];

const SEASONAL: RewardItemDefinition[] = [
  {
    id: 'frame-halloween-2026',
    name: 'Moldura Halloween',
    description: 'Edição limitada de Halloween 2026.',
    category: 'frame',
    rarity: 'épico',
    cost: 0,
    unlockMethod: 'seasonal',
    obtainHint: 'Evento Halloween 2026',
    seasonalEvent: 'halloween-2026',
    limited: true,
    previewClass: 'ring-2 ring-orange-500/80 shadow-[0_0_25px_rgba(249,115,22,0.4)]',
    animated: true,
  },
  {
    id: 'bg-halloween-2026',
    name: 'Fundo Abóbora',
    description: 'Fundo assustadoramente estiloso.',
    category: 'background',
    rarity: 'raro',
    cost: 180,
    unlockMethod: 'seasonal',
    obtainHint: 'Loja Spotlight — Halloween',
    seasonalEvent: 'halloween-2026',
    previewGradient: 'from-orange-950 via-zinc-950 to-purple-950',
  },
  {
    id: 'emoji-halloween-bat',
    name: 'Emoji Morcego',
    description: 'Reação exclusiva de Halloween.',
    category: 'emoji',
    rarity: 'incomum',
    cost: 80,
    unlockMethod: 'seasonal',
    obtainHint: 'Evento Halloween',
    emojiChar: '🦇',
    seasonalEvent: 'halloween-2026',
  },
  {
    id: 'frame-natal-2026',
    name: 'Moldura Natal',
    description: 'Brilho festivo de fim de ano.',
    category: 'frame',
    rarity: 'épico',
    cost: 0,
    unlockMethod: 'seasonal',
    obtainHint: 'Evento Natal 2026',
    seasonalEvent: 'natal-2026',
    limited: true,
    previewClass: 'ring-2 ring-red-500/70 shadow-[0_0_25px_rgba(239,68,68,0.35)]',
    animated: true,
  },
  {
    id: 'card-natal-2026',
    name: 'Cartão Nevasca',
    description: 'Cartão de perfil com flocos de neve animados.',
    category: 'profile_card',
    rarity: 'lendário',
    cost: 350,
    unlockMethod: 'seasonal',
    obtainHint: 'Loja — Natal 2026',
    seasonalEvent: 'natal-2026',
    previewGradient: 'from-sky-900/80 via-zinc-900 to-blue-950/80',
    animated: true,
  },
  {
    id: 'title-aniversario-cinereact',
    name: 'Título: Pioneiro',
    description: 'Celebre o aniversário da plataforma.',
    category: 'title',
    rarity: 'exclusivo',
    cost: 0,
    unlockMethod: 'event',
    obtainHint: 'Evento Aniversário CineReact',
    seasonalEvent: 'aniversario-cinereact',
    limited: true,
  },
  {
    id: 'effect-confetti-ano-novo',
    name: 'Efeito Confete',
    description: 'Confetes dourados no seu perfil.',
    category: 'effect',
    rarity: 'épico',
    cost: 220,
    unlockMethod: 'seasonal',
    obtainHint: 'Ano Novo 2027',
    seasonalEvent: 'ano-novo-2027',
    animated: true,
  },
];

export const REWARDS_CATALOG: RewardItemDefinition[] = [
  // Molduras
  { id: 'frame-amber', name: 'Moldura Âmbar', description: 'Borda dourada elegante.', category: 'frame', rarity: 'comum', cost: 100, unlockMethod: 'shop', obtainHint: 'Loja Spotlight', previewClass: 'ring-2 ring-amber-500/80 shadow-[0_0_20px_rgba(245,158,11,0.3)]' },
  { id: 'frame-neon', name: 'Moldura Neon', description: 'Brilho cyberpunk.', category: 'frame', rarity: 'raro', cost: 200, unlockMethod: 'shop', obtainHint: 'Loja Spotlight', previewClass: 'ring-2 ring-cyan-400/80 shadow-[0_0_25px_rgba(34,211,238,0.4)]', animated: true },
  { id: 'frame-royal', name: 'Moldura Real', description: 'Gradiente violeta premium.', category: 'frame', rarity: 'épico', cost: 400, unlockMethod: 'shop', obtainHint: 'Loja Spotlight', previewClass: 'ring-2 ring-purple-500/80', animated: true },
  { id: 'frame-critico', name: 'Moldura Crítico', description: 'Desbloqueada no nível Crítico.', category: 'frame', rarity: 'raro', cost: 0, unlockMethod: 'level', obtainHint: 'Alcance o nível Crítico', previewClass: 'ring-2 ring-rose-500/70' },
  { id: 'frame-influencer', name: 'Moldura Influenciador', description: 'Para membros influentes.', category: 'frame', rarity: 'épico', cost: 0, unlockMethod: 'level', obtainHint: 'Nível Influenciador', previewClass: 'ring-2 ring-amber-400 shadow-[0_0_35px_rgba(251,191,36,0.5)]', animated: true },
  { id: 'frame-elite', name: 'Moldura Elite', description: 'A moldura definitiva.', category: 'frame', rarity: 'mítico', cost: 0, unlockMethod: 'level', obtainHint: 'Elite CineReact', previewClass: 'ring-[3px] ring-amber-300 shadow-[0_0_40px_rgba(252,211,77,0.6)]', animated: true },
  { id: 'frame-pulse', name: 'Moldura Pulse', description: 'Animação pulsante suave.', category: 'frame', rarity: 'incomum', cost: 150, unlockMethod: 'shop', obtainHint: 'Loja Spotlight', previewClass: 'ring-2 ring-violet-400/70', animated: true },

  // Títulos
  { id: 'title-entusiasta', name: 'Entusiasta', description: 'Exiba abaixo do seu nome.', category: 'title', rarity: 'comum', cost: 0, unlockMethod: 'level', obtainHint: 'Nível Entusiasta' },
  { id: 'title-especialista', name: 'Especialista', description: 'Domínio de conteúdo.', category: 'title', rarity: 'raro', cost: 0, unlockMethod: 'level', obtainHint: 'Nível Especialista' },
  { id: 'title-curador', name: 'Curador', description: 'Mestre das listas.', category: 'title', rarity: 'raro', cost: 150, unlockMethod: 'shop', obtainHint: 'Loja Spotlight' },
  { id: 'title-lenda', name: 'Lenda', description: 'Título lendário.', category: 'title', rarity: 'lendário', cost: 500, unlockMethod: 'shop', obtainHint: 'Loja Spotlight' },
  { id: 'title-oraculo', name: 'Oráculo', description: 'Para os maiores comentaristas.', category: 'title', rarity: 'épico', cost: 0, unlockMethod: 'achievement', obtainHint: 'Conquista Oráculo da Comunidade' },

  // Avatares
  { id: 'avatar-popcorn', name: 'Avatar Pipoca', description: 'Clássico do cinema com balde dourado.', category: 'avatar', rarity: 'incomum', cost: 120, unlockMethod: 'shop', obtainHint: 'Loja Spotlight', avatarVisual: 'popcorn', previewGradient: 'from-amber-600 via-orange-500 to-yellow-400' },
  { id: 'avatar-clapper', name: 'Avatar Claquete', description: 'Diretor da sua própria sessão.', category: 'avatar', rarity: 'incomum', cost: 120, unlockMethod: 'shop', obtainHint: 'Loja Spotlight', avatarVisual: 'clapperboard', previewGradient: 'from-violet-700 via-purple-600 to-fuchsia-500' },
  { id: 'avatar-royal', name: 'Avatar Real', description: 'Coroa dourada exclusiva com brilho premium.', category: 'avatar', rarity: 'lendário', cost: 600, unlockMethod: 'shop', obtainHint: 'Loja Spotlight', avatarVisual: 'crown', previewGradient: 'from-yellow-600 via-amber-500 to-yellow-300', animated: true },
  { id: 'avatar-ghost', name: 'Avatar Fantasma', description: 'Edição Halloween com aura espectral.', category: 'avatar', rarity: 'raro', cost: 0, unlockMethod: 'seasonal', obtainHint: 'Halloween 2026', avatarVisual: 'ghost', previewGradient: 'from-slate-600 via-zinc-500 to-purple-400', seasonalEvent: 'halloween-2026', animated: true },

  // Emblemas
  { id: 'badge-explorador', name: 'Explorador', description: 'Descobridor de conteúdos.', category: 'badge', rarity: 'comum', cost: 0, unlockMethod: 'level', obtainHint: 'Nível Explorador' },
  { id: 'badge-curador', name: 'Curador', description: 'Listas inspiradoras.', category: 'badge', rarity: 'raro', cost: 0, unlockMethod: 'level', obtainHint: 'Nível Curador' },
  { id: 'badge-lenda', name: 'Lenda', description: 'Distintivo lendário.', category: 'badge', rarity: 'lendário', cost: 0, unlockMethod: 'level', obtainHint: 'Nível Lenda' },
  { id: 'badge-spotlight', name: 'Spotlight', description: 'Brilho extra no perfil.', category: 'badge', rarity: 'incomum', cost: 120, unlockMethod: 'shop', obtainHint: 'Loja Spotlight' },
  { id: 'badge-streak-30', name: 'Chama Eterna', description: '30 dias de sequência.', category: 'badge', rarity: 'épico', cost: 0, unlockMethod: 'streak', obtainHint: 'Sequência de 30 dias' },

  // Temas
  { id: 'theme-midnight', name: 'Midnight', description: 'Tons azulados profundos.', category: 'theme', rarity: 'raro', cost: 180, unlockMethod: 'shop', obtainHint: 'Loja Spotlight', previewGradient: 'from-slate-900 to-blue-950' },
  { id: 'theme-icone', name: 'Ícone', description: 'Tema do nível Ícone.', category: 'theme', rarity: 'épico', cost: 0, unlockMethod: 'level', obtainHint: 'Nível Ícone', previewGradient: 'from-amber-950 to-zinc-950' },
  { id: 'theme-aurora', name: 'Aurora', description: 'Gradiente aurora boreal.', category: 'theme', rarity: 'lendário', cost: 320, unlockMethod: 'shop', obtainHint: 'Loja Spotlight', previewGradient: 'from-purple-900 via-zinc-900 to-cyan-950' },

  // Efeitos
  { id: 'effect-particles', name: 'Partículas Douradas', description: 'Partículas flutuantes.', category: 'effect', rarity: 'épico', cost: 250, unlockMethod: 'shop', obtainHint: 'Loja Spotlight', animated: true },
  { id: 'effect-aurora', name: 'Aurora Boreal', description: 'Luzes dançantes no perfil.', category: 'effect', rarity: 'lendário', cost: 450, unlockMethod: 'shop', obtainHint: 'Loja Spotlight', animated: true },
  { id: 'effect-sparkle', name: 'Brilho Sutil', description: 'Micro brilhos elegantes.', category: 'effect', rarity: 'incomum', cost: 90, unlockMethod: 'shop', obtainHint: 'Loja Spotlight', animated: true },

  // Fundos
  { id: 'bg-cinema', name: 'Sala de Cinema', description: 'Cortinas vermelhas e holofotes.', category: 'background', rarity: 'incomum', cost: 140, unlockMethod: 'shop', obtainHint: 'Loja Spotlight', previewGradient: 'from-red-950 via-zinc-950 to-black' },
  { id: 'bg-nebula', name: 'Nebulosa', description: 'Espaço sideral profundo.', category: 'background', rarity: 'raro', cost: 200, unlockMethod: 'shop', obtainHint: 'Loja Spotlight', previewGradient: 'from-indigo-950 via-purple-950 to-zinc-950' },
  { id: 'bg-gold', name: 'Ouro Líquido', description: 'Luxo absoluto.', category: 'background', rarity: 'épico', cost: 280, unlockMethod: 'shop', obtainHint: 'Loja Spotlight', previewGradient: 'from-amber-900/40 via-zinc-900 to-amber-950/60' },

  // Reações / Emojis
  { id: 'reaction-fire', name: 'Reação Fogo', description: 'Para reacts incríveis.', category: 'reaction', rarity: 'comum', cost: 60, unlockMethod: 'shop', obtainHint: 'Loja Spotlight', emojiChar: '🔥' },
  { id: 'reaction-mindblown', name: 'Reação Mente Explodiu', description: 'Quando o plot twist chega.', category: 'reaction', rarity: 'incomum', cost: 80, unlockMethod: 'shop', obtainHint: 'Loja Spotlight', emojiChar: '🤯' },
  { id: 'emoji-clap', name: 'Emoji Palmas', description: 'Aplausos da plateia.', category: 'emoji', rarity: 'comum', cost: 50, unlockMethod: 'shop', obtainHint: 'Loja Spotlight', emojiChar: '👏' },
  { id: 'emoji-crown', name: 'Emoji Coroa', description: 'Você é royalty.', category: 'emoji', rarity: 'raro', cost: 100, unlockMethod: 'shop', obtainHint: 'Loja Spotlight', emojiChar: '👑' },

  // Cartões de perfil
  { id: 'card-classic', name: 'Cartão Clássico', description: 'Layout limpo e elegante.', category: 'profile_card', rarity: 'comum', cost: 80, unlockMethod: 'shop', obtainHint: 'Loja Spotlight', previewGradient: 'from-zinc-900 to-zinc-950' },
  { id: 'card-premium', name: 'Cartão Premium', description: 'Bordas douradas e brilho.', category: 'profile_card', rarity: 'épico', cost: 300, unlockMethod: 'shop', obtainHint: 'Loja Spotlight', previewGradient: 'from-amber-950/50 via-zinc-900 to-zinc-950', animated: true },
  { id: 'card-holographic', name: 'Cartão Holográfico', description: 'Efeito holográfico exclusivo.', category: 'profile_card', rarity: 'mítico', cost: 0, unlockMethod: 'promo_code', obtainHint: 'Código promocional exclusivo', previewGradient: 'from-cyan-900/40 via-purple-900/40 to-pink-900/40', animated: true },

  ...CREATOR_TAGS,
  ...SEASONAL,
];

export const PROMO_CODES: PromoCodeDefinition[] = [
  { code: 'CINEREACT2026', rewardItemId: 'card-holographic', maxUses: 10000 },
  { code: 'SPOTLIGHTVIP', rewardItemId: 'title-lenda', expiresAt: '2027-12-31' },
  { code: 'FANITLIN', rewardItemId: 'tag-squad-fanit-lin' },
];

export const CREATOR_WATCH_REQUIREMENTS: Record<string, { itemId: string; watches: number }[]> = {
  'isabela-roza-canal': [{ itemId: 'tag-squad-isabela-roza', watches: 5 }],
  'janela-da-rua-canal': [{ itemId: 'tag-vip-janela-da-rua', watches: 10 }],
  'canal-fanit-lin': [{ itemId: 'tag-squad-fanit-lin', watches: 5 }],
};

export const CREATOR_FOLLOW_REWARDS: Record<string, string> = {
  'isabela-roza-canal': 'tag-fan-isabela-roza',
  'janela-da-rua-canal': 'tag-fan-janela-da-rua',
  'gamer-bisonho-canal': 'tag-fan-gamer-bisonho',
  'canal-fanit-lin': 'tag-fan-fanit-lin',
  'carol-e-rhay-canal': 'tag-fan-carol-rhay',
};

export function getRewardById(id: string): RewardItemDefinition | undefined {
  return REWARDS_CATALOG.find((r) => r.id === id);
}

export function getRewardsByCategory(category: string): RewardItemDefinition[] {
  return REWARDS_CATALOG.filter((r) => r.category === category);
}

// Legacy alias for engine compatibility
export const COSMETIC_SHOP = REWARDS_CATALOG.filter((r) =>
  ['frame', 'title', 'badge', 'theme', 'effect'].includes(r.category)
).map((r) => ({
  id: r.id,
  name: r.name,
  description: r.description,
  type: r.category as 'frame' | 'title' | 'badge' | 'theme' | 'effect',
  cost: r.cost,
  rarity: (['comum', 'raro', 'épico', 'lendário'].includes(r.rarity) ? r.rarity : 'épico') as 'comum' | 'raro' | 'épico' | 'lendário',
  previewClass: r.previewClass,
}));
