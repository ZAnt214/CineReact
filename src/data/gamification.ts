import type {
  AchievementDefinition,
  CosmeticItem,
  InfluenceTier,
  LevelDefinition,
  MissionDefinition,
  SealDefinition,
} from '../types/gamification.ts';

export const INFLUENCE_TIERS: InfluenceTier[] = [
  'Espectador',
  'Entusiasta',
  'Explorador',
  'Crítico',
  'Especialista',
  'Curador',
  'Influenciador',
  'Ícone',
  'Lenda',
  'Elite CineReact',
];

export const LEVELS: LevelDefinition[] = [
  { tier: 'Espectador', minXp: 0, rewardSpotlight: 0, unlockCosmetic: 'title-espectador', description: 'Começando sua jornada no CineReact.' },
  { tier: 'Entusiasta', minXp: 100, rewardSpotlight: 25, unlockCosmetic: 'title-entusiasta', description: 'Você já sente o clima da plateia.' },
  { tier: 'Explorador', minXp: 300, rewardSpotlight: 40, unlockCosmetic: 'badge-explorador', description: 'Descobre novos conteúdos com frequência.' },
  { tier: 'Crítico', minXp: 600, rewardSpotlight: 60, unlockCosmetic: 'frame-critico', description: 'Sua opinião começa a importar na comunidade.' },
  { tier: 'Especialista', minXp: 1000, rewardSpotlight: 80, unlockCosmetic: 'title-especialista', description: 'Domina categorias e franquias.' },
  { tier: 'Curador', minXp: 1500, rewardSpotlight: 100, unlockCosmetic: 'badge-curador', description: 'Cria listas que inspiram outros membros.' },
  { tier: 'Influenciador', minXp: 2200, rewardSpotlight: 150, unlockCosmetic: 'frame-influencer', description: 'Destaque visual e presença na comunidade.' },
  { tier: 'Ícone', minXp: 3000, rewardSpotlight: 200, unlockCosmetic: 'theme-icone', description: 'Referência para novos espectadores.' },
  { tier: 'Lenda', minXp: 4000, rewardSpotlight: 300, unlockCosmetic: 'badge-lenda', description: 'História viva do CineReact.' },
  { tier: 'Elite CineReact', minXp: 5500, rewardSpotlight: 500, unlockCosmetic: 'frame-elite', description: 'O ápice da influência na plataforma.' },
];

export const XP_REWARDS: Record<string, number> = {
  daily_login: 15,
  watch_progress: 5,
  watch_complete: 35,
  favorite: 20,
  comment: 25,
  rate: 15,
  list_create: 40,
  share: 15,
  follow_creator: 30,
  discover_creator: 50,
  lunch_pick: 10,
};

export const STREAK_SPOTLIGHT: Record<number, number> = {
  3: 30,
  7: 75,
  14: 150,
  30: 400,
  60: 800,
  100: 1500,
};

export const ACHIEVEMENTS: AchievementDefinition[] = [
  { id: 'first-watch', name: 'Primeira Reação', description: 'Assista sua primeira reação na plataforma.', icon: 'Play', rarity: 'comum', xpReward: 50, spotlightReward: 20 },
  { id: 'watch-10', name: 'Maratonista Iniciante', description: 'Assista 10 reações completas.', icon: 'Film', rarity: 'comum', xpReward: 80, spotlightReward: 30 },
  { id: 'watch-50', name: 'Maratonista Dedicado', description: 'Assista 50 reações completas.', icon: 'Clapperboard', rarity: 'raro', xpReward: 200, spotlightReward: 80 },
  { id: 'watch-100', name: 'Maratonista Lendário', description: 'Assista 100 reações completas.', icon: 'Trophy', rarity: 'épico', xpReward: 400, spotlightReward: 200 },
  { id: 'watch-500', name: 'Imortal do Streaming', description: 'Assista 500 reações completas.', icon: 'Crown', rarity: 'lendário', xpReward: 1000, spotlightReward: 500 },
  { id: 'first-comment', name: 'Voz da Plateia', description: 'Publique seu primeiro comentário.', icon: 'MessageCircle', rarity: 'comum', xpReward: 40, spotlightReward: 15 },
  { id: 'comments-25', name: 'Comentarista Ativo', description: 'Publique 25 comentários.', icon: 'MessagesSquare', rarity: 'raro', xpReward: 150, spotlightReward: 60 },
  { id: 'comments-100', name: 'Oráculo da Comunidade', description: 'Publique 100 comentários.', icon: 'Sparkles', rarity: 'épico', xpReward: 350, spotlightReward: 150 },
  { id: 'first-favorite', name: 'Coração Aquecido', description: 'Favorite seu primeiro conteúdo.', icon: 'Heart', rarity: 'comum', xpReward: 30, spotlightReward: 10 },
  { id: 'favorites-20', name: 'Colecionador', description: 'Favorite 20 obras ou vídeos.', icon: 'Bookmark', rarity: 'raro', xpReward: 120, spotlightReward: 50 },
  { id: 'first-list', name: 'Curador em Formação', description: 'Crie sua primeira lista personalizada.', icon: 'List', rarity: 'comum', xpReward: 60, spotlightReward: 25 },
  { id: 'lists-5', name: 'Mestre das Listas', description: 'Crie 5 listas personalizadas.', icon: 'Library', rarity: 'raro', xpReward: 180, spotlightReward: 70 },
  { id: 'streak-3', name: 'Presença Constante', description: 'Mantenha sequência de 3 dias.', icon: 'Flame', rarity: 'comum', xpReward: 50, spotlightReward: 30 },
  { id: 'streak-7', name: 'Semana de Fogo', description: 'Mantenha sequência de 7 dias.', icon: 'Flame', rarity: 'raro', xpReward: 120, spotlightReward: 75 },
  { id: 'streak-30', name: 'Lenda da Sequência', description: 'Mantenha sequência de 30 dias.', icon: 'Zap', rarity: 'épico', xpReward: 300, spotlightReward: 200 },
  { id: 'streak-100', name: 'Inquebrável', description: 'Mantenha sequência de 100 dias.', icon: 'Award', rarity: 'lendário', xpReward: 800, spotlightReward: 500 },
  { id: 'discover-1', name: 'Descobridor', description: 'Descubra um novo criador.', icon: 'Compass', rarity: 'comum', xpReward: 60, spotlightReward: 25 },
  { id: 'discover-10', name: 'Caçador de Talentos', description: 'Descubra 10 criadores diferentes.', icon: 'Radar', rarity: 'raro', xpReward: 200, spotlightReward: 90 },
  { id: 'discover-25', name: 'Olho de Águia', description: 'Descubra 25 criadores diferentes.', icon: 'Eye', rarity: 'épico', xpReward: 400, spotlightReward: 180 },
  { id: 'category-filme', name: 'Cineasta', description: 'Assista reações de 5 filmes diferentes.', icon: 'Film', rarity: 'comum', xpReward: 70, spotlightReward: 30 },
  { id: 'category-anime', name: 'Otaku da Plateia', description: 'Assista reações de 5 animes diferentes.', icon: 'Tv', rarity: 'comum', xpReward: 70, spotlightReward: 30 },
  { id: 'category-jogo', name: 'Gamer React', description: 'Assista reações de 5 jogos diferentes.', icon: 'Gamepad2', rarity: 'comum', xpReward: 70, spotlightReward: 30 },
  { id: 'category-serie', name: 'Binge Watcher', description: 'Assista reações de 5 séries diferentes.', icon: 'MonitorPlay', rarity: 'comum', xpReward: 70, spotlightReward: 30 },
  { id: 'watch-time-60', name: 'Uma Hora de Pura Arte', description: 'Acumule 60 minutos assistidos.', icon: 'Clock', rarity: 'comum', xpReward: 60, spotlightReward: 25 },
  { id: 'watch-time-600', name: 'Maratona Épica', description: 'Acumule 10 horas assistidas.', icon: 'Timer', rarity: 'raro', xpReward: 200, spotlightReward: 80 },
  { id: 'watch-time-3000', name: 'Vida no CineReact', description: 'Acumule 50 horas assistidas.', icon: 'Hourglass', rarity: 'épico', xpReward: 500, spotlightReward: 250 },
  { id: 'share-5', name: 'Embaixador', description: 'Compartilhe 5 páginas ou vídeos.', icon: 'Share2', rarity: 'raro', xpReward: 100, spotlightReward: 40 },
  { id: 'follow-5', name: 'Fã de Verdade', description: 'Siga 5 canais diferentes.', icon: 'UserPlus', rarity: 'comum', xpReward: 80, spotlightReward: 35 },
  { id: 'rate-10', name: 'Crítico Nato', description: 'Avalie 10 conteúdos.', icon: 'Star', rarity: 'raro', xpReward: 120, spotlightReward: 50 },
  { id: 'influence-100', name: 'Voz Influente', description: 'Alcance 100 pontos de Índice de Influência.', icon: 'TrendingUp', rarity: 'raro', xpReward: 150, spotlightReward: 60 },
  { id: 'influence-500', name: 'Pilar da Comunidade', description: 'Alcance 500 pontos de Índice de Influência.', icon: 'Gem', rarity: 'épico', xpReward: 350, spotlightReward: 150 },
  { id: 'influence-1000', name: 'Elite da Influência', description: 'Alcance 1000 pontos de Índice de Influência.', icon: 'Crown', rarity: 'lendário', xpReward: 700, spotlightReward: 350 },
  { id: 'lunch-10', name: 'Almoço com Estilo', description: 'Use Hora do Almoço 10 vezes.', icon: 'UtensilsCrossed', rarity: 'comum', xpReward: 80, spotlightReward: 35 },
  { id: 'seal-collector', name: 'Colecionador de Selos', description: 'Desbloqueie 5 selos de franquia.', icon: 'Stamp', rarity: 'raro', xpReward: 180, spotlightReward: 80 },
  { id: 'seal-master', name: 'Mestre dos Selos', description: 'Desbloqueie todos os selos disponíveis.', icon: 'Medal', rarity: 'lendário', xpReward: 600, spotlightReward: 300 },
  { id: 'tier-influenciador', name: 'Status Influenciador', description: 'Alcance o nível Influenciador.', icon: 'Sparkles', rarity: 'épico', xpReward: 250, spotlightReward: 120 },
  { id: 'tier-elite', name: 'Elite Absoluta', description: 'Alcance Elite CineReact.', icon: 'Shield', rarity: 'lendário', xpReward: 1000, spotlightReward: 500 },
];

export const DAILY_MISSION_TEMPLATES: Omit<MissionDefinition, 'id'>[] = [
  { title: 'Sessão do Dia', description: 'Assista 2 reações completas.', period: 'daily', target: 2, xpReward: 40, spotlightReward: 20, eventType: 'watch_complete' },
  { title: 'Crítico do Dia', description: 'Publique 1 comentário.', period: 'daily', target: 1, xpReward: 30, spotlightReward: 15, eventType: 'comment' },
  { title: 'Explorador Diário', description: 'Descubra 1 novo criador.', period: 'daily', target: 1, xpReward: 35, spotlightReward: 20, eventType: 'discover_creator' },
  { title: 'Favorito Express', description: 'Favorite 1 conteúdo.', period: 'daily', target: 1, xpReward: 25, spotlightReward: 10, eventType: 'favorite' },
  { title: 'Compartilhe a Magia', description: 'Compartilhe 1 página ou vídeo.', period: 'daily', target: 1, xpReward: 20, spotlightReward: 10, eventType: 'share' },
  { title: 'Avaliador', description: 'Avalie 1 conteúdo.', period: 'daily', target: 1, xpReward: 25, spotlightReward: 12, eventType: 'rate' },
];

export const WEEKLY_MISSION_TEMPLATES: Omit<MissionDefinition, 'id'>[] = [
  { title: 'Maratona Semanal', description: 'Assista 10 reações completas.', period: 'weekly', target: 10, xpReward: 150, spotlightReward: 80, eventType: 'watch_complete' },
  { title: 'Comunidade Ativa', description: 'Publique 5 comentários.', period: 'weekly', target: 5, xpReward: 120, spotlightReward: 60, eventType: 'comment' },
  { title: 'Caçador de Talentos', description: 'Descubra 3 novos criadores.', period: 'weekly', target: 3, xpReward: 100, spotlightReward: 50, eventType: 'discover_creator' },
  { title: 'Curador da Semana', description: 'Crie 1 lista personalizada.', period: 'weekly', target: 1, xpReward: 80, spotlightReward: 40, eventType: 'list_create' },
  { title: 'Categorias Variadas', description: 'Assista conteúdos de 3 categorias.', period: 'weekly', target: 3, xpReward: 90, spotlightReward: 45, eventType: 'watch_complete' },
];

export const FRANCHISE_SEALS: SealDefinition[] = [
  { id: 'seal-marvel', franchiseId: 'marvel', name: 'Selo Marvel', description: 'Acompanhou reações do universo Marvel.', icon: 'Shield', requiredWatches: 3 },
  { id: 'seal-harry-potter', franchiseId: 'harry-potter', name: 'Selo Bruxaria', description: 'Mergulhou no mundo de Harry Potter.', icon: 'Wand2', requiredWatches: 3 },
  { id: 'seal-gta', franchiseId: 'gta', name: 'Selo GTA', description: 'Viveu o caos de Los Santos.', icon: 'Car', requiredWatches: 3 },
  { id: 'seal-one-piece', franchiseId: 'one-piece', name: 'Selo Pirata', description: 'Navegou pelos reacts de One Piece.', icon: 'Anchor', requiredWatches: 3 },
  { id: 'seal-tlou', franchiseId: 'the-last-of-us', name: 'Selo Sobrevivência', description: 'Sobreviveu ao apocalipse de TLOU.', icon: 'Leaf', requiredWatches: 3 },
];

export const COSMETIC_SHOP: CosmeticItem[] = [
  { id: 'frame-amber', name: 'Moldura Âmbar', description: 'Borda dourada elegante para seu avatar.', type: 'frame', cost: 100, rarity: 'comum', previewClass: 'ring-2 ring-cine-accent/80 shadow-[0_0_20px_rgba(212,132,92,0.3)]' },
  { id: 'frame-neon', name: 'Moldura Neon', description: 'Brilho cyberpunk para perfis ousados.', type: 'frame', cost: 200, rarity: 'raro', previewClass: 'ring-2 ring-cyan-400/80 shadow-[0_0_25px_rgba(34,211,238,0.4)]' },
  { id: 'frame-royal', name: 'Moldura Real', description: 'Moldura premium com gradiente violeta.', type: 'frame', cost: 400, rarity: 'épico', previewClass: 'ring-2 ring-purple-500/80 shadow-[0_0_30px_rgba(168,85,247,0.4)]' },
  { id: 'frame-critico', name: 'Moldura Crítico', description: 'Desbloqueada no nível Crítico.', type: 'frame', cost: 0, rarity: 'raro', previewClass: 'ring-2 ring-rose-500/70' },
  { id: 'frame-influencer', name: 'Moldura Influenciador', description: 'Destaque exclusivo para influenciadores.', type: 'frame', cost: 0, rarity: 'épico', previewClass: 'ring-2 ring-cine-accent-light shadow-[0_0_35px_rgba(251,191,36,0.5)]' },
  { id: 'frame-elite', name: 'Moldura Elite', description: 'A moldura definitiva do CineReact.', type: 'frame', cost: 0, rarity: 'lendário', previewClass: 'ring-[3px] ring-cine-cream shadow-[0_0_40px_rgba(252,211,77,0.6)]' },
  { id: 'title-espectador', name: 'Título: Espectador', description: 'Para quem curte reações do sofá.', type: 'title', cost: 0, rarity: 'comum' },
  { id: 'title-entusiasta', name: 'Título: Entusiasta', description: 'Para fãs que vivem cada cena.', type: 'title', cost: 0, rarity: 'comum' },
  { id: 'title-cinefilo', name: 'Título: Cinéfilo', description: 'Pipoca, créditos e plot twists.', type: 'title', cost: 80, rarity: 'comum' },
  { id: 'title-maratonista', name: 'Título: Maratonista', description: 'Para quem não para de assistir.', type: 'title', cost: 0, rarity: 'incomum' },
  { id: 'title-especialista', name: 'Título: Especialista', description: 'Reconhecimento por maratonar conteúdo.', type: 'title', cost: 0, rarity: 'raro' },
  { id: 'title-curador', name: 'Título: Organizador', description: 'Para quem monta listas e favoritos.', type: 'title', cost: 150, rarity: 'raro' },
  { id: 'title-lenda', name: 'Título: Lenda', description: 'Título lendário para fãs veteranos.', type: 'title', cost: 500, rarity: 'lendário' },
  { id: 'title-luzes-camera', name: 'Título: Luzes, Câmera', description: 'Coleção Estreia CineReact.', type: 'title', cost: 200, rarity: 'épico' },
  { id: 'badge-explorador', name: 'Emblema Explorador', description: 'Distintivo para descobridores.', type: 'badge', cost: 0, rarity: 'comum' },
  { id: 'badge-curador', name: 'Emblema Curador', description: 'Para mestres das listas.', type: 'badge', cost: 0, rarity: 'raro' },
  { id: 'badge-lenda', name: 'Emblema Lenda', description: 'Distintivo lendário exclusivo.', type: 'badge', cost: 0, rarity: 'lendário' },
  { id: 'badge-spotlight', name: 'Emblema Spotlight', description: 'Brilho extra no perfil.', type: 'badge', cost: 120, rarity: 'comum' },
  { id: 'theme-midnight', name: 'Tema Midnight', description: 'Tons azulados no seu perfil.', type: 'theme', cost: 180, rarity: 'raro' },
  { id: 'theme-icone', name: 'Tema Ícone', description: 'Tema exclusivo do nível Ícone.', type: 'theme', cost: 0, rarity: 'épico' },
  { id: 'effect-particles', name: 'Efeito Partículas', description: 'Partículas douradas no perfil.', type: 'effect', cost: 250, rarity: 'épico' },
  { id: 'effect-aurora', name: 'Efeito Aurora', description: 'Aurora boreal animada no perfil.', type: 'effect', cost: 450, rarity: 'lendário' },
];

export const RARITY_STYLES: Record<string, { border: string; bg: string; text: string; glow: string }> = {
  comum: { border: 'border-zinc-700', bg: 'bg-zinc-900/50', text: 'text-zinc-300', glow: '' },
  raro: { border: 'border-blue-500/40', bg: 'bg-blue-950/30', text: 'text-blue-300', glow: 'shadow-[0_0_15px_rgba(59,130,246,0.15)]' },
  épico: { border: 'border-purple-500/50', bg: 'bg-purple-950/30', text: 'text-purple-300', glow: 'shadow-[0_0_20px_rgba(168,85,247,0.2)]' },
  lendário: { border: 'border-cine-accent/60', bg: 'bg-cine-surface/30', text: 'text-cine-cream', glow: 'shadow-[0_0_25px_rgba(212,132,92,0.25)]' },
};

export function getTierFromXp(xp: number): LevelDefinition {
  let current = LEVELS[0];
  for (const level of LEVELS) {
    if (xp >= level.minXp) current = level;
    else break;
  }
  return current;
}

export function getNextTier(xp: number): LevelDefinition | undefined {
  const current = getTierFromXp(xp);
  const idx = LEVELS.findIndex((l) => l.tier === current.tier);
  return LEVELS[idx + 1];
}

export function getXpProgress(xp: number): { current: number; needed: number; percent: number } {
  const tier = getTierFromXp(xp);
  const next = getNextTier(xp);
  if (!next) return { current: xp - tier.minXp, needed: 0, percent: 100 };
  const current = xp - tier.minXp;
  const needed = next.minXp - tier.minXp;
  return { current, needed, percent: Math.min(100, Math.round((current / needed) * 100)) };
}
