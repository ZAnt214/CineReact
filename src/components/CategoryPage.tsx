import React, { useState, useMemo } from 'react';
import { Film, Gamepad2, Tv, Clapperboard, ArrowLeft, Search, Hash, Play, Eye, Clock, Sparkles, Filter, X } from 'lucide-react';
import { Obra, ReactVideo } from '../types.ts';
import { motion } from 'motion/react';
import OptimizedImage from './OptimizedImage.tsx';

interface CategoryPageProps {
  categoryKey: 'filme' | 'jogo' | 'anime' | 'serie';
  obras: Obra[];
  reacts: ReactVideo[];
  progressMap?: Record<string, number>;
  onPlayVideo: (reactId: string, obraId?: string) => void;
  onBackToHome: () => void;
  onChannelClick?: (channelNameOrId: string) => void;
  onSelectObra?: (obraId: string) => void;
}

const CATEGORY_CONFIGS = {
  filme: {
    title: 'Reacts de Filmes',
    icon: Film,
    description: 'Explore análises, reações e teorias dos lançamentos e clássicos do cinema.',
    defaultHashtags: ['#filmes', '#terror', '#marvel', '#dc', '#cinema', '#trailer', '#netflix', '#suspense', '#acao', '#comedia'],
    keywords: ['filme', 'filmes', 'movie', 'cinema', 'trailer', 'marvel', 'dc', 'disney', 'netflix', 'critica']
  },
  jogo: {
    title: 'Reacts de Jogos',
    icon: Gamepad2,
    description: 'Acompanhe gameplays, trailers, gameplays comentadas e reações a lançamentos de games.',
    defaultHashtags: ['#jogos', '#gameplay', '#gta', '#minecraft', '#rpg', '#horror', '#indie', '#playstation', '#xbox', '#pc'],
    keywords: ['jogo', 'jogos', 'game', 'gameplay', 'gamer', 'gaming', 'playstation', 'xbox', 'nintendo', 'pc', 'walkthrough']
  },
  anime: {
    title: 'Reacts de Animes',
    icon: Tv,
    description: 'Reações episódio por episódio dos animes mais populares, episódios marcantes e temporadas.',
    defaultHashtags: ['#animes', '#onepiece', '#naruto', '#dragonball', '#jujutsukaisen', '#demonslayer', '#otaku', '#shonen', '#manga'],
    keywords: ['anime', 'animes', 'otaku', 'manga', 'onepiece', 'naruto', 'dbz', 'dragonball', 'jujutsu', 'demon slayer', 'shonen']
  },
  serie: {
    title: 'Reacts de Séries',
    icon: Clapperboard,
    description: 'Maratonas, análises de episódios e teorias das séries mais aclamadas da TV e streaming.',
    defaultHashtags: ['#series', '#netflix', '#hbo', '#strangerthings', '#temporada', '#ep', '#drama', '#suspense', '#comedia'],
    keywords: ['serie', 'series', 'temporada', 'ep', 'episodio', 'hbo', 'stranger things', 'seriesyoutube']
  }
};

export default function CategoryPage({
  categoryKey,
  obras,
  reacts,
  progressMap = {},
  onPlayVideo,
  onBackToHome,
  onChannelClick,
  onSelectObra
}: CategoryPageProps) {
  const config = CATEGORY_CONFIGS[categoryKey] || CATEGORY_CONFIGS.filme;
  const CategoryIcon = config.icon;

  const [selectedHashtag, setSelectedHashtag] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // 1. Get all reacts belonging to this category
  const categoryReacts = useMemo(() => {
    return reacts.filter((react) => {
      // Check associated obra type
      const obra = obras.find((o) => o.id === react.obraId);
      if (obra && obra.tipo === categoryKey) {
        return true;
      }

      // Check title keywords or hashtags
      const titleLower = react.titulo.toLowerCase();
      const isKeywordMatch = config.keywords.some((kw) => titleLower.includes(kw));
      return isKeywordMatch;
    });
  }, [reacts, obras, categoryKey, config.keywords]);

  // 2. Extract dynamic hashtags found in category reacts
  const extractedHashtags = useMemo(() => {
    const tagCounts: Record<string, number> = {};

    categoryReacts.forEach((r) => {
      const matches = r.titulo.match(/#\w+/g) || [];
      matches.forEach((tag) => {
        const cleanTag = tag.toLowerCase();
        tagCounts[cleanTag] = (tagCounts[cleanTag] || 0) + 1;
      });
    });

    // Combine default hashtags with extracted ones
    const allTagsSet = new Set<string>();
    config.defaultHashtags.forEach((tag) => allTagsSet.add(tag.toLowerCase()));
    
    Object.keys(tagCounts).forEach((tag) => {
      if (tagCounts[tag] >= 1) {
        allTagsSet.add(tag);
      }
    });

    return Array.from(allTagsSet);
  }, [categoryReacts, config.defaultHashtags]);

  // 3. Filter category reacts by selected hashtag & search query, then interleave & randomize channels
  const filteredReacts = useMemo(() => {
    const rawFiltered = categoryReacts.filter((react) => {
      const titleLower = react.titulo.toLowerCase();
      const canalLower = react.canalNome.toLowerCase();
      const obra = obras.find((o) => o.id === react.obraId);
      const obraTitleLower = obra ? obra.titulo.toLowerCase() : '';

      // Check selected hashtag
      if (selectedHashtag) {
        const cleanHashtag = selectedHashtag.toLowerCase().replace('#', '');
        const tagMatch = 
          titleLower.includes(`#${cleanHashtag}`) || 
          titleLower.includes(cleanHashtag) ||
          obraTitleLower.includes(cleanHashtag) ||
          (obra?.generos && obra.generos.some(g => g.toLowerCase().includes(cleanHashtag)));
        
        if (!tagMatch) return false;
      }

      // Check text search
      if (searchQuery.trim()) {
        const queryLower = searchQuery.toLowerCase().trim().replace('#', '');
        const matchesQuery =
          titleLower.includes(queryLower) ||
          canalLower.includes(queryLower) ||
          obraTitleLower.includes(queryLower);
        
        if (!matchesQuery) return false;
      }

      return true;
    });

    // Interleave and randomize by channel to prevent repetitive channel blocks
    if (rawFiltered.length <= 1) return rawFiltered;

    // Group by channel
    const channelMap: Record<string, ReactVideo[]> = {};
    rawFiltered.forEach((item) => {
      const key = item.canalNome || item.canalId || 'outros';
      if (!channelMap[key]) channelMap[key] = [];
      channelMap[key].push(item);
    });

    // Sort or shuffle channels & items within channels
    const channelKeys = Object.keys(channelMap).sort(() => Math.random() - 0.5);
    channelKeys.forEach((key) => {
      channelMap[key] = [...channelMap[key]].sort(() => Math.random() - 0.5);
    });

    const randomizedList: ReactVideo[] = [];
    let maxItems = 0;
    channelKeys.forEach((k) => {
      if (channelMap[k].length > maxItems) maxItems = channelMap[k].length;
    });

    // Round-robin pick from each channel
    for (let i = 0; i < maxItems; i++) {
      for (const k of channelKeys) {
        if (channelMap[k][i]) {
          randomizedList.push(channelMap[k][i]);
        }
      }
    }

    return randomizedList;
  }, [categoryReacts, selectedHashtag, searchQuery, obras]);

  return (
    <div className="cine-container pt-24 pb-28 w-full min-h-screen w-full flex-1">
      {/* Back Button & Top Navigation */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <button
          onClick={onBackToHome}
          className="px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white font-extrabold text-xs transition-all flex items-center gap-2 border border-zinc-800 cursor-pointer active:scale-95"
        >
          <ArrowLeft className="w-4 h-4 text-amber-400" />
          <span>Voltar ao Início</span>
        </button>

        <span className="text-xs text-zinc-500 font-mono font-bold">
          {filteredReacts.length} {filteredReacts.length === 1 ? 'react encontrado' : 'reacts encontrados'}
        </span>
      </div>

      {/* Hero Banner Header */}
      <div className="relative bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 border border-amber-500/30 rounded-3xl p-6 sm:p-8 mb-8 overflow-hidden shadow-2xl">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-amber-500/80" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          
          {/* Header Info */}
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-extrabold uppercase tracking-wider">
              <CategoryIcon className="w-4 h-4 text-amber-400" />
              <span>Categoria</span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight font-sans">
              {config.title}
            </h1>

            <p className="text-zinc-300 text-xs sm:text-sm leading-relaxed font-medium">
              {config.description}
            </p>
          </div>

          {/* Quick Search Bar inside Category */}
          <div className="w-full md:w-80 shrink-0">
            <div className="relative">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`Buscar em ${config.title}...`}
                className="w-full pl-10 pr-9 py-2.5 rounded-xl bg-zinc-900/90 border border-zinc-800 text-white placeholder-zinc-500 text-xs font-medium focus:outline-none focus:border-amber-500/60 transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Hashtag Filters Section */}
      <div className="space-y-3 mb-8">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-extrabold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
            <Hash className="w-3.5 h-3.5 text-amber-400" />
            Filtrar por Hashtag
          </span>

          {selectedHashtag && (
            <button
              onClick={() => setSelectedHashtag(null)}
              className="text-xs text-amber-400 hover:text-amber-300 font-bold underline cursor-pointer"
            >
              Limpar filtro de hashtag
            </button>
          )}
        </div>

        {/* Scrollable Hashtag Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
          <button
            onClick={() => setSelectedHashtag(null)}
            className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all shrink-0 cursor-pointer ${
              selectedHashtag === null
                ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20'
                : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800'
            }`}
          >
            Todos os vídeos
          </button>

          {extractedHashtags.map((tag) => {
            const isActive = selectedHashtag?.toLowerCase() === tag.toLowerCase();

            return (
              <button
                key={tag}
                onClick={() => setSelectedHashtag(isActive ? null : tag)}
                className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all shrink-0 cursor-pointer flex items-center gap-1 ${
                  isActive
                    ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20'
                    : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800'
                }`}
              >
                <span>{tag.startsWith('#') ? tag : `#${tag}`}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Video Content Grid */}
      {filteredReacts.length === 0 ? (
        <div className="text-center py-20 bg-zinc-950/50 rounded-3xl border border-zinc-850 p-8 space-y-4 max-w-md mx-auto">
          <Filter className="w-10 h-10 text-amber-400/50 mx-auto" />
          <h3 className="text-lg font-bold text-white">Nenhum react encontrado</h3>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Não encontramos nenhum react correspondente aos filtros selecionados nesta categoria.
          </p>
          <button
            onClick={() => {
              setSelectedHashtag(null);
              setSearchQuery('');
            }}
            className="px-4 py-2 rounded-xl bg-amber-500 text-black font-extrabold text-xs hover:bg-amber-400 transition-colors cursor-pointer"
          >
            Limpar Filtros
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 sm:gap-5 xl:gap-6">
          {filteredReacts.map((react) => {
            const associatedObra = obras.find((o) => o.id === react.obraId);
            const progress = progressMap[react.id] || 0;

            return (
              <motion.div
                key={react.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => onPlayVideo(react.id, react.obraId)}
                className="group bg-zinc-900/60 border border-zinc-800/80 hover:border-amber-500/50 rounded-2xl overflow-hidden cursor-pointer flex flex-col transition-all duration-300 hover:shadow-xl hover:shadow-amber-500/10 hover:-translate-y-1"
              >
                {/* Thumbnail Container */}
                <div className="relative aspect-video bg-zinc-950 overflow-hidden shrink-0">
                  <OptimizedImage
                    src={react.thumbnailUrl}
                    alt={react.titulo}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />

                  {/* Play Overlay Button */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-amber-500 text-black flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform">
                      <Play className="w-6 h-6 fill-black ml-0.5" />
                    </div>
                  </div>

                  {/* Duration Pill */}
                  {react.duracao && (
                    <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/80 backdrop-blur-md text-[10px] font-mono font-bold text-white flex items-center gap-1 border border-white/10">
                      <Clock className="w-3 h-3 text-amber-400" />
                      <span>{react.duracao}</span>
                    </div>
                  )}

                  {/* Progress Bar */}
                  {progress > 0 && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-zinc-800">
                      <div
                        className="h-full bg-amber-500"
                        style={{ width: `${Math.min(100, progress)}%` }}
                      />
                    </div>
                  )}
                </div>

                {/* Content Info */}
                <div className="p-3.5 flex flex-col flex-1 justify-between space-y-3">
                  <div className="space-y-1.5">
                    {/* Associated Obra Title Pill */}
                    {associatedObra && (
                      <span 
                        onClick={(e) => {
                          if (onSelectObra) {
                            e.stopPropagation();
                            onSelectObra(associatedObra.id);
                          }
                        }}
                        className="text-[10px] font-extrabold uppercase tracking-wider text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-md inline-block hover:bg-amber-500/20 transition-colors"
                      >
                        {associatedObra.titulo}
                      </span>
                    )}

                    <h3 className="text-xs sm:text-sm font-bold text-white line-clamp-2 leading-snug group-hover:text-amber-300 transition-colors">
                      {react.titulo}
                    </h3>
                  </div>

                  {/* Channel & Stats */}
                  <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between text-[11px] text-zinc-400 font-medium">
                    <span
                      onClick={(e) => {
                        if (onChannelClick) {
                          e.stopPropagation();
                          onChannelClick(react.canalNome);
                        }
                      }}
                      className={`font-bold text-amber-400 truncate max-w-[140px] ${
                        onChannelClick ? 'hover:underline hover:text-amber-300 cursor-pointer' : ''
                      }`}
                    >
                      {react.canalNome}
                    </span>

                    <span className="flex items-center gap-1 text-zinc-500 shrink-0">
                      <Eye className="w-3 h-3" />
                      <span>{react.visualizacoes > 0 ? react.visualizacoes.toLocaleString('pt-BR') : 'React'}</span>
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
