import React, { useEffect, useState } from 'react';
import { Search, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Obra, ReactVideo } from '../types.ts';
import OptimizedImage from './OptimizedImage.tsx';

interface SearchBarProps {
  obras?: Obra[];
  reacts?: ReactVideo[];
  onSearch: (results: Obra[], query: string) => void;
  onSelectObra: (id: string) => void;
  variant?: 'sidebar' | 'compact';
  inputId?: string;
  onAfterSelect?: () => void;
}

function getMatchingHashtagsForObra(
  obra: Obra,
  q: string,
  reacts: ReactVideo[]
): string[] {
  if (!q || reacts.length === 0) return [];
  const queryTerm = q.toLowerCase().trim().replace('#', '');
  const obraReacts = reacts.filter((r) => r.obraId === obra.id);
  const matchedTags = new Set<string>();

  obraReacts.forEach((r) => {
    const hashtags = r.titulo.toLowerCase().match(/#\w+/g) || [];
    hashtags.forEach((tag) => {
      const cleanTag = tag.replace('#', '');
      if (cleanTag.includes(queryTerm) || queryTerm.includes(cleanTag)) {
        matchedTags.add(tag);
      }
    });

    const cleanChannelName = r.canalNome.toLowerCase().replace(/[^a-z0-9]+/g, '');
    if (cleanChannelName.includes(queryTerm) && queryTerm.length >= 3) {
      matchedTags.add(`#${cleanChannelName}`);
    }
  });

  return Array.from(matchedTags);
}

function filterObras(
  obras: Obra[],
  reacts: ReactVideo[],
  query: string
): Obra[] {
  const normalized = query.toLowerCase().trim();

  return obras.filter((obra) => {
    const titleMatch = obra.titulo.toLowerCase().includes(normalized);
    const tipoMatch = obra.tipo.toLowerCase().includes(normalized);
    const genreMatch = obra.generos
      ? obra.generos.some((g) => g.toLowerCase().includes(normalized))
      : false;
    const descMatch = obra.sinopse
      ? obra.sinopse.toLowerCase().includes(normalized)
      : false;
    const matchedTags = getMatchingHashtagsForObra(obra, query, reacts);
    const hashtagMatch = matchedTags.length > 0;

    let videoMatch = false;
    if (reacts.length > 0) {
      const obraReacts = reacts.filter((r) => r.obraId === obra.id);
      videoMatch = obraReacts.some(
        (r) =>
          r.titulo.toLowerCase().includes(normalized) ||
          r.canalNome.toLowerCase().includes(normalized)
      );
    }

    return (
      titleMatch ||
      tipoMatch ||
      genreMatch ||
      descMatch ||
      hashtagMatch ||
      videoMatch
    );
  });
}

export default function SearchBar({
  obras = [],
  reacts = [],
  onSearch,
  onSelectObra,
  variant = 'sidebar',
  inputId = 'search-input',
  onAfterSelect,
}: SearchBarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Obra[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    if (obras.length > 0) {
      setSearchResults(filterObras(obras, reacts, searchQuery).slice(0, 8));
      return;
    }

    setSearching(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`);
        if (res.ok) {
          const data = await res.json();
          setSearchResults((data.obras || []).slice(0, 8));
        }
      } catch (err) {
        console.error(err);
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, obras, reacts]);

  const handleSearchSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    if (obras.length > 0) {
      onSearch(filterObras(obras, reacts, searchQuery), searchQuery);
      onAfterSelect?.();
      return;
    }

    setSearching(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`);
      if (res.ok) {
        const data = await res.json();
        onSearch(data.obras || [], searchQuery);
        onAfterSelect?.();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSearching(false);
    }
  };

  const handleSelectObra = (obraId: string) => {
    onSelectObra(obraId);
    setSearchQuery('');
    setSearchResults([]);
    onAfterSelect?.();
  };

  const inputClassName =
    variant === 'sidebar'
      ? 'w-full bg-neutral-900/80 border border-neutral-800 focus:border-cine-accent/80 focus:ring-1 focus:ring-cine-accent/40 rounded-xl py-2 pl-9 pr-8 text-xs text-zinc-200 placeholder-zinc-500 outline-none transition-all duration-200'
      : 'w-full bg-neutral-900/50 hover:bg-neutral-900/80 focus:bg-neutral-900 border border-neutral-800/80 focus:border-cine-accent/80 focus:ring-1 focus:ring-cine-accent/40 rounded-xl py-1.5 pl-9 pr-8 text-xs text-zinc-200 placeholder-zinc-500 outline-none transition-all duration-200';

  return (
    <div className="relative">
      <form onSubmit={handleSearchSubmit}>
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
          <Search className="h-4 w-4 text-zinc-500" />
        </div>
        <input
          id={inputId}
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Pesquisar canais, filmes, animes..."
          className={inputClassName}
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setSearchResults([]);
            }}
            className="absolute inset-y-0 right-0 flex items-center pr-2.5 text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
            aria-label="Limpar pesquisa"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </form>

      <AnimatePresence>
        {searchQuery.trim() && searchResults.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className={`absolute left-0 right-0 top-[calc(100%+0.5rem)] bg-neutral-950/98 backdrop-blur-xl border border-neutral-900 rounded-xl shadow-2xl p-2.5 max-h-[320px] overflow-y-auto z-50 divide-y divide-neutral-900 ${
              variant === 'sidebar' ? '' : ''
            }`}
          >
            <div className="text-[10px] text-zinc-500 font-mono pb-2 px-2 uppercase tracking-wider flex justify-between items-center">
              <span>Sugestões</span>
              {searching && (
                <span className="w-2.5 h-2.5 border border-cine-accent-light border-t-transparent rounded-full animate-spin" />
              )}
            </div>
            <div className="py-1 space-y-1">
              {searchResults.map((obra) => {
                const matchedTags = getMatchingHashtagsForObra(obra, searchQuery, reacts);

                return (
                  <button
                    key={obra.id}
                    type="button"
                    onClick={() => handleSelectObra(obra.id)}
                    className="w-full flex items-center gap-3 p-2 hover:bg-neutral-900/50 rounded-lg transition-colors text-left group"
                  >
                    <OptimizedImage
                      src={obra.poster}
                      alt={obra.titulo}
                      containerClassName="w-8 h-11 flex-shrink-0"
                      className="w-8 h-11 object-cover rounded-md shadow bg-neutral-900"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-semibold text-zinc-200 group-hover:text-cine-accent-light transition-colors truncate leading-tight">
                        {obra.titulo}
                      </h4>
                      <div className="flex items-center justify-between gap-2 mt-0.5">
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] uppercase font-mono px-1 rounded bg-neutral-800 text-zinc-400 font-medium">
                            {obra.tipo}
                          </span>
                          <span className="text-[9px] text-zinc-500">{obra.ano}</span>
                        </div>
                        {matchedTags.length > 0 && (
                          <div className="flex gap-1 overflow-hidden max-w-[120px]">
                            {matchedTags.slice(0, 2).map((tag, idx) => (
                              <span
                                key={idx}
                                className="text-[9px] text-cine-accent-light font-semibold truncate bg-cine-accent/10 px-1 rounded border border-cine-accent/20"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              onClick={() => handleSearchSubmit()}
              className="w-full text-center py-2 text-xs text-cine-accent-light font-bold hover:text-cine-cream transition-colors mt-1.5 pt-2 border-t border-neutral-900/60"
            >
              Ver todos os resultados
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
