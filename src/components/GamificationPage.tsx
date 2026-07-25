import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Trophy,
  Target,
  Stamp,
  Crown,
  Flame,
  Clock,
  Eye,
  MessageCircle,
  Heart,
  Compass,
  Sparkles,
  TrendingUp,
  Medal,
  ShoppingBag,
  Package,
  Palette,
  ChevronRight,
  Star,
  Film,
  Users,
} from 'lucide-react';
import { INFLUENCE_TIERS, getXpProgress } from '../data/gamification.ts';
import { RARITY_STYLES as ACH_RARITY, RARITY_STYLES } from '../data/rewardsCatalog.ts';
import GamificationBar from './GamificationBar.tsx';
import ProfileAvatar from './profile/ProfileAvatar.tsx';
import ProfileSurface from './profile/ProfileSurface.tsx';
import ProfileNameRow from './profile/ProfileNameRow.tsx';
import RewardInventory from './rewards/RewardInventory.tsx';
import ProfileCustomizer from './rewards/ProfileCustomizer.tsx';
import type { GamificationMeResponse, LeaderboardType, ProfileLoadout } from '../types/gamification.ts';
import type { UserState } from '../types.ts';

const ICON_MAP: Record<string, React.ElementType> = {
  Trophy, Target, Stamp, Crown, Flame, Clock, Eye, MessageCircle, Heart, Compass,
  Sparkles, TrendingUp, Medal, Star, Film, Play: Film, Gamepad2: Target, Tv: Eye,
  Clapperboard: Film, MessagesSquare: MessageCircle, Bookmark: Heart, List: Target,
  Library: Stamp, Zap: Sparkles, Award: Medal, Radar: Compass, Share2: Compass,
  UserPlus: Users, Shield: Crown, Gem: Sparkles, UtensilsCrossed: Target, MonitorPlay: Film,
  Timer: Clock, Hourglass: Clock, Wand2: Sparkles, Car: Target, Anchor: Compass, Leaf: Target,
};

interface GamificationPageProps {
  user: UserState;
  data: GamificationMeResponse | null;
  loading: boolean;
  onRefresh: () => void;
  onPurchase: (id: string) => Promise<boolean>;
  onEquip: (id: string) => Promise<boolean>;
  onUnequip: (id: string) => Promise<boolean>;
  onSaveLoadout: (loadout: ProfileLoadout) => Promise<boolean>;
  onRedeemCode: (code: string) => Promise<boolean>;
  onLoadLeaderboard: (type: LeaderboardType) => void;
  leaderboards: Partial<Record<LeaderboardType, import('../types/gamification.ts').LeaderboardEntry[]>>;
}

type TabId = 'overview' | 'inventory' | 'customize' | 'achievements' | 'missions' | 'seals' | 'rankings';

const LEADERBOARD_TABS: { id: LeaderboardType; label: string }[] = [
  { id: 'xp', label: 'XP Geral' },
  { id: 'influence', label: 'Influência' },
  { id: 'streak', label: 'Sequência' },
  { id: 'watch_time', label: 'Tempo Assistido' },
  { id: 'comments', label: 'Comentaristas' },
  { id: 'discoverers', label: 'Descobridores' },
  { id: 'curators', label: 'Curadores' },
];

export default function GamificationPage({
  user,
  data,
  loading,
  onRefresh,
  onPurchase,
  onEquip,
  onUnequip,
  onSaveLoadout,
  onRedeemCode,
  onLoadLeaderboard,
  leaderboards,
}: GamificationPageProps) {
  const [tab, setTab] = useState<TabId>('overview');
  const [lbTab, setLbTab] = useState<LeaderboardType>('influence');

  useEffect(() => {
    if (tab === 'rankings') onLoadLeaderboard(lbTab);
  }, [tab, lbTab, onLoadLeaderboard, data?.profile.loadout]);

  if (!user.isLoggedIn) {
    return (
      <motion.div className="cine-container py-28 text-center">
        <Crown className="w-12 h-12 text-amber-500/50 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">CineReact Club</h2>
        <p className="text-zinc-500 text-sm">Faça login para acessar seu progresso, conquistas e rankings.</p>
      </motion.div>
    );
  }

  const profile = data?.profile;
  const progress = profile ? getXpProgress(profile.xp) : null;

  const tabs: { id: TabId; label: string; icon: React.ElementType }[] = [
    { id: 'overview', label: 'Visão Geral', icon: TrendingUp },
    { id: 'inventory', label: 'Inventário', icon: Package },
    { id: 'customize', label: 'Personalizar', icon: Palette },
    { id: 'achievements', label: 'Conquistas', icon: Trophy },
    { id: 'missions', label: 'Missões', icon: Target },
    { id: 'seals', label: 'Selos', icon: Stamp },
    { id: 'rankings', label: 'Rankings', icon: Crown },
  ];


  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="cine-container py-24 pb-32 space-y-8"
    >
      {/* Hero */}
      <ProfileSurface loadout={profile?.loadout} variant="hero" className="border-zinc-800/60">
        <div className="relative flex flex-col lg:flex-row gap-8 items-start">
          <div className="flex items-center gap-5">
            <div className="relative">
              <ProfileAvatar
                photoUrl={user.avatar}
                alt={user.nome}
                size="lg"
                loadout={profile?.loadout}
              />
              {profile?.featuredInfluencer && (
                <span className="absolute -bottom-2 -right-2 px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 text-[9px] font-black text-black uppercase z-20">
                  VIP
                </span>
              )}
            </div>
            <div>
              <p className="text-[10px] font-mono uppercase tracking-[0.25em] text-amber-500/70 mb-1">CineReact Club</p>
              <ProfileNameRow name={user.nome} loadout={profile?.loadout} nameSize="lg" />
              <p className="text-amber-400 font-bold text-sm mt-1">{data?.tier || 'Espectador'}</p>
              {profile?.earlyAccess && (
                <span className="inline-flex items-center gap-1 mt-2 text-[10px] text-purple-400 font-bold uppercase tracking-wider">
                  <Sparkles className="w-3 h-3" /> Acesso Antecipado
                </span>
              )}
            </div>
          </div>
          <div className="flex-1 w-full max-w-md lg:ml-auto">
            <GamificationBar data={data} />
          </div>
        </div>

        {/* Level progression */}
        <div className="mt-8 overflow-x-auto pb-2">
          <div className="flex gap-2 min-w-max">
            {INFLUENCE_TIERS.map((t) => {
              const idx = INFLUENCE_TIERS.indexOf(t);
              const currentIdx = data?.tier ? INFLUENCE_TIERS.indexOf(data.tier) : 0;
              const active = idx <= currentIdx;
              return (
                <div
                  key={t}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wide border transition-all ${
                    active
                      ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                      : 'bg-zinc-900/40 border-zinc-800 text-zinc-600'
                  }`}
                >
                  {t}
                </div>
              );
            })}
          </div>
        </div>
      </ProfileSurface>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {tabs.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                tab === t.id
                  ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                  : 'bg-zinc-900/40 text-zinc-500 border border-zinc-800/60 hover:text-zinc-300'
              }`}
            >
              <Icon className="w-4 h-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {loading && !data && (
        <div className="text-center py-20 text-zinc-500 text-sm">Carregando seu progresso...</div>
      )}

      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
        >
          {tab === 'overview' && profile && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Reações vistas', value: profile.stats.reactsWatched, icon: Eye },
                { label: 'Tempo assistido', value: `${Math.floor(profile.stats.totalWatchTimeMinutes / 60)}h ${profile.stats.totalWatchTimeMinutes % 60}m`, icon: Clock },
                { label: 'Comentários', value: profile.stats.commentsCount, icon: MessageCircle },
                { label: 'Criadores descobertos', value: profile.stats.creatorsDiscovered.length, icon: Compass },
                { label: 'Favoritos', value: profile.stats.favoritesCount, icon: Heart },
                { label: 'Listas criadas', value: profile.stats.listsCreated, icon: Target },
                { label: 'Sequência atual', value: `${profile.currentStreak} dias`, icon: Flame },
                { label: 'Índice de Influência', value: profile.influenceIndex, icon: TrendingUp },
              ].map((stat) => {
                const Icon = stat.icon;
                return (
                  <div
                    key={stat.label}
                    className="p-4 rounded-2xl bg-zinc-900/40 border border-zinc-800/60 hover:border-zinc-700/80 transition-colors"
                  >
                    <Icon className="w-4 h-4 text-amber-500/70 mb-2" />
                    <p className="text-xl font-black text-white">{stat.value}</p>
                    <p className="text-[10px] text-zinc-500 mt-1 uppercase tracking-wide">{stat.label}</p>
                  </div>
                );
              })}
            </div>
          )}

          {tab === 'inventory' && data && profile && (
            <RewardInventory
              items={data.inventory}
              spotlight={profile.spotlight}
              userName={user.nome}
              userAvatar={user.avatar}
              onEquip={onEquip}
              onUnequip={onUnequip}
              onPurchase={onPurchase}
              onRedeemCode={onRedeemCode}
            />
          )}

          {tab === 'customize' && data && profile && (
            <ProfileCustomizer
              user={user}
              inventory={data.inventory}
              loadout={profile.loadout}
              onSave={onSaveLoadout}
            />
          )}

          {tab === 'achievements' && data && (
            <motion.div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.achievements.map((a) => {
                const unlocked = profile?.unlockedAchievements.includes(a.id);
                const achRarity = a.rarity as keyof typeof ACH_RARITY;
                const style = ACH_RARITY[achRarity] || RARITY_STYLES.comum;
                const Icon = ICON_MAP[a.icon] || Trophy;
                return (
                  <div
                    key={a.id}
                    className={`p-4 rounded-2xl border transition-all ${style.border} ${style.bg} ${style.glow} ${
                      unlocked ? 'opacity-100' : 'opacity-40 grayscale'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2.5 rounded-xl bg-zinc-950/50 ${style.text}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <motion.div className="flex items-center gap-2 mb-0.5">
                          <h3 className="font-bold text-sm text-white truncate">{a.name}</h3>
                          <span className={`text-[9px] uppercase font-mono ${style.text}`}>{a.rarity}</span>
                        </motion.div>
                        <p className="text-[11px] text-zinc-500 leading-snug">{a.description}</p>
                        <p className="text-[10px] text-amber-500/80 mt-2 font-mono">+{a.xpReward} XP · +{a.spotlightReward} Spotlight</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </motion.div>
          )}

          {tab === 'missions' && data && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xs font-mono uppercase tracking-widest text-zinc-500 mb-3">Missões Diárias</h3>
                <div className="grid gap-3">
                  {data.dailyMissions.map((m) => {
                    const progress = profile?.missionProgress[m.id] || 0;
                    const done = !!profile?.completedMissions[m.id];
                    const pct = Math.min(100, Math.round((progress / m.target) * 100));
                    return (
                      <MissionCard key={m.id} title={m.title} description={m.description} progress={pct} done={done} xp={m.xpReward} spotlight={m.spotlightReward} current={progress} target={m.target} />
                    );
                  })}
                </div>
              </div>
              <div>
                <h3 className="text-xs font-mono uppercase tracking-widest text-zinc-500 mb-3">Missões Semanais</h3>
                <motion.div className="grid gap-3">
                  {data.weeklyMissions.map((m) => {
                    const progress = profile?.missionProgress[m.id] || 0;
                    const done = !!profile?.completedMissions[m.id];
                    const pct = Math.min(100, Math.round((progress / m.target) * 100));
                    return (
                      <MissionCard key={m.id} title={m.title} description={m.description} progress={pct} done={done} xp={m.xpReward} spotlight={m.spotlightReward} current={progress} target={m.target} weekly />
                    );
                  })}
                </motion.div>
              </div>
            </div>
          )}

          {tab === 'seals' && data && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.seals.map((s) => {
                const unlocked = profile?.unlockedSeals.includes(s.id);
                const watches = profile?.stats.franchisesWatched[s.franchiseId] || 0;
                const Icon = ICON_MAP[s.icon] || Stamp;
                return (
                  <div
                    key={s.id}
                    className={`p-5 rounded-2xl border text-center transition-all ${
                      unlocked
                        ? 'border-amber-500/40 bg-amber-950/20 shadow-[0_0_25px_rgba(245,158,11,0.1)]'
                        : 'border-zinc-800 bg-zinc-900/30 opacity-70'
                    }`}
                  >
                    <div className={`w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-3 ${
                      unlocked ? 'bg-amber-500/20 text-amber-400' : 'bg-zinc-800 text-zinc-600'
                    }`}>
                      <Icon className="w-8 h-8" />
                    </div>
                    <h3 className="font-bold text-white text-sm">{s.name}</h3>
                    <p className="text-[11px] text-zinc-500 mt-1">{s.description}</p>
                    <p className="text-[10px] text-zinc-600 mt-2 font-mono">
                      {unlocked ? 'Desbloqueado' : `${watches}/${s.requiredWatches} reações`}
                    </p>
                  </div>
                );
              })}
            </div>
          )}

          {tab === 'rankings' && (
            <div>
              <div className="flex gap-2 overflow-x-auto mb-6 pb-1">
                {LEADERBOARD_TABS.map((lb) => (
                  <button
                    key={lb.id}
                    type="button"
                    onClick={() => setLbTab(lb.id)}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wide whitespace-nowrap cursor-pointer transition-all ${
                      lbTab === lb.id ? 'bg-amber-500/15 text-amber-400' : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    {lb.label}
                  </button>
                ))}
              </div>
              <div className="space-y-2">
                {(leaderboards[lbTab] || []).map((entry) => (
                  <div
                    key={entry.email}
                    className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${
                      entry.email === user.email
                        ? 'border-amber-500/40 bg-amber-500/5'
                        : 'border-zinc-800/60 bg-zinc-900/30'
                    }`}
                  >
                    <span className={`w-8 text-center font-black text-lg ${
                      entry.rank <= 3 ? 'text-amber-400' : 'text-zinc-600'
                    }`}>
                      {entry.rank}
                    </span>
                    <ProfileAvatar
                      photoUrl={entry.avatar}
                      alt={entry.username}
                      size="md"
                      profileDisplay={entry.profileDisplay}
                    />
                    <div className="flex-1 min-w-0">
                      <ProfileNameRow
                        name={entry.username}
                        profileDisplay={entry.profileDisplay}
                        nameSize="md"
                      />
                      <p className="text-[10px] text-zinc-500">{entry.tier}{entry.isInfluencer ? ' · Influente' : ''}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-amber-400">{entry.value.toLocaleString('pt-BR')}</p>
                      <p className="text-[9px] text-zinc-600 uppercase">pontos</p>
                    </div>
                  </div>
                ))}
                {(!leaderboards[lbTab] || leaderboards[lbTab]!.length === 0) && (
                  <p className="text-center text-zinc-500 text-sm py-12">Nenhum dado de ranking ainda. Seja o primeiro!</p>
                )}
              </div>
            </div>
          )}

        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}

function MissionCard({
  title, description, progress, done, xp, spotlight, current, target, weekly,
}: {
  title: string; description: string; progress: number; done: boolean;
  xp: number; spotlight: number; current: number; target: number; weekly?: boolean;
} & Record<string, unknown>) {
  return (
    <div className={`p-4 rounded-2xl border ${done ? 'border-emerald-500/30 bg-emerald-950/20' : 'border-zinc-800 bg-zinc-900/40'}`}>
      <div className="flex justify-between items-start gap-3 mb-3">
        <div>
          <div className="flex items-center gap-2">
            <h4 className="font-bold text-sm text-white">{title}</h4>
            {weekly && <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 font-mono">SEMANAL</span>}
          </div>
          <p className="text-[11px] text-zinc-500 mt-0.5">{description}</p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-[10px] text-amber-400 font-bold">+{xp} XP</p>
          <p className="text-[10px] text-purple-400 font-bold">+{spotlight}</p>
        </div>
      </div>
      <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden mb-1">
        <motion.div
          className={`h-full rounded-full ${done ? 'bg-emerald-500' : 'bg-gradient-to-r from-amber-600 to-amber-400'}`}
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.6 }}
        />
      </div>
      <p className="text-[10px] text-zinc-600 font-mono">{done ? 'Concluída' : `${current}/${target}`}</p>
    </div>
  );
}
