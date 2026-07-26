import React, { useState, useEffect, useCallback, useTransition } from 'react';
import Header from './components/Header.tsx';
import RowMovies from './components/RowMovies.tsx';
import ObraPage from './components/ObraPage.tsx';
import PlaybackPage from './components/PlaybackPage.tsx';
import MyList from './components/MyList.tsx';
import ChannelPage from './components/ChannelPage.tsx';
import AdminPanel from './components/AdminPanel.tsx';
import AuthModal from './components/AuthModal.tsx';
import RowMoviesSkeleton from './components/RowMoviesSkeleton.tsx';
import PlaybackSkeleton from './components/PlaybackSkeleton.tsx';
import UserSettings from './components/UserSettings.tsx';
import DonationsPage from './components/DonationsPage.tsx';
import CreatorPartnerBanner from './components/CreatorPartnerBanner.tsx';
import CreatorPartnerModal from './components/CreatorPartnerModal.tsx';
import SideNavHub, { resetSideNavOnLeave, parseCreatorProfileTab } from './components/SideNavHub.tsx';
import CategoryPage from './components/CategoryPage.tsx';
import LunchTimePage from './components/LunchTimePage.tsx';
import LandingPage from './components/LandingPage.tsx';
import CineReactLogo from './components/CineReactLogo.tsx';
import GamificationPage from './components/GamificationPage.tsx';
import CreatorProfilePage from './components/CreatorProfilePage.tsx';
import GamificationRewardToast from './components/GamificationRewardToast.tsx';
import { useGamification } from './hooks/useGamification.ts';
import { isVerifiedCreatorLoadout } from './gamification/verifiedCreator.ts';
import OptimizedImage from './components/OptimizedImage.tsx';
import { Obra, ReactVideo, UserState } from './types.ts';
import { hasSocialLinks } from './utils/socialLinks.ts';
import { OBRAS_INICIAIS, VIDEOS_INICIAIS } from './data.ts';
import { motion, AnimatePresence } from 'motion/react';
import { Play, X, ExternalLink, Calendar, Compass, Clock } from 'lucide-react';

export default function App() {
  const [currentTab, setCurrentTab] = useState(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname.toLowerCase();
      const search = window.location.search.toLowerCase();
      const urlParams = new URLSearchParams(window.location.search);
      
      // If URL explicitly requests catalog/inicio or another tab
      if (search.includes('tab=inicio') || search.includes('catalog=true') || path === '/catalog' || path === '/app') {
        return 'inicio';
      }
      if (urlParams.get('tab')) {
        return urlParams.get('tab') || 'landing';
      }

      // Check if user already clicked explore in this session
      const hasExplored = sessionStorage.getItem('cinereact_explored');
      if (hasExplored === 'true') {
        return 'inicio';
      }
    }
    // Default to institutional landing page for all new visitors
    return 'landing';
  });
  const [selectedObraId, setSelectedObraId] = useState<string | null>(null);
  const [selectedReactId, setSelectedReactId] = useState<string | null>(null);
  
  // Search overlay state
  const [searchResults, setSearchResults] = useState<Obra[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Global Lists
  const [obras, setObras] = useState<Obra[]>(() => OBRAS_INICIAIS);
  const [reacts, setReacts] = useState<ReactVideo[]>(() => VIDEOS_INICIAIS);
  const [canaisSeguidos, setCanaisSeguidos] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [isExploring, setIsExploring] = useState(false);
  const [feedsWarm, setFeedsWarm] = useState(false);
  const [channelReactsMap, setChannelReactsMap] = useState<Record<string, ReactVideo[]>>({});
  const [, startTransition] = useTransition();

  // Auth modal trigger
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authInitialMode, setAuthInitialMode] = useState<'login' | 'register'>('login');
  const openAuthModal = useCallback((mode: 'login' | 'register' = 'login') => {
    setAuthInitialMode(mode);
    setShowAuthModal(true);
  }, []);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [showCreatorPartnerModal, setShowCreatorPartnerModal] = useState(false);
  const [isCreatorBannerVisible, setIsCreatorBannerVisible] = useState(true);

  // Continue Watching state
  const [continueWatching, setContinueWatching] = useState<{
    reactId: string;
    obraId: string;
    progress: number;
    updatedAt: number;
  }[]>([]);

  // Authenticated User State (Checks localStorage so session is preserved)
  const [user, setUserState] = useState<UserState>(() => {
    const saved = localStorage.getItem('cine_react_user');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object' && 'isLoggedIn' in parsed) {
          return parsed;
        }
      } catch (e) {
        // Fallback
      }
    }
    return {
      isLoggedIn: false,
      nome: "",
      email: "",
      isAdmin: false
    };
  });

  const setUser = (newUser: UserState) => {
    setUserState(newUser);
    if (newUser.isLoggedIn) {
      localStorage.setItem('cine_react_user', JSON.stringify(newUser));
    } else {
      localStorage.removeItem('cine_react_user');
      localStorage.removeItem('cine_react_continue_watching');
      setContinueWatching([]);
    }
  };

  const gamification = useGamification({
    email: user.email,
    enabled: user.isLoggedIn,
  });

  useEffect(() => {
    if (!user.isLoggedIn || !user.email) return;
    const dayKey = `cinereact_daily_${new Date().toISOString().slice(0, 10)}`;
    if (sessionStorage.getItem(dayKey)) return;
    sessionStorage.setItem(dayKey, '1');
    gamification.trackEvent('daily_login');
  }, [user.isLoggedIn, user.email]);

  const safeFetchJson = async (url: string | null) => {
    if (!url) return null;
    try {
      const res = await fetch(url);
      if (!res || !res.ok) return null;
      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await res.json();
      }
      return null;
    } catch {
      return null;
    }
  };

  const fetchData = async (showLoading = false) => {
    try {
      if (showLoading) {
        setLoading(true);
      }
      const emailQuery = user.email;
      
      const [obrasData, reactsData, seguidosData, userData] = await Promise.all([
        safeFetchJson('/api/obras'),
        safeFetchJson('/api/reacts'),
        emailQuery ? safeFetchJson(`/api/canais/seguidos?email=${encodeURIComponent(emailQuery)}`) : Promise.resolve(null),
        emailQuery ? safeFetchJson(`/api/usuario/me?email=${encodeURIComponent(emailQuery)}`) : Promise.resolve(null)
      ]);

      let channelMap: Record<string, ReactVideo[]> = {};
      let channelReactsMerged: ReactVideo[] = [];

      if (Array.isArray(obrasData) && obrasData.length > 0) {
        setObras(obrasData);

        const canais = obrasData.filter((o: Obra) => o.tipo === 'canal');
        if (canais.length > 0) {
          const channelPayloads = await Promise.all(
            canais.map((canal: Obra) =>
              safeFetchJson(`/api/obras/${encodeURIComponent(canal.id)}`).then((data) => ({
                id: canal.id,
                reacts: Array.isArray(data?.reacts) ? data.reacts as ReactVideo[] : [],
              }))
            )
          );

          const seenIds = new Set<string>();
          for (const payload of channelPayloads) {
            channelMap[payload.id] = payload.reacts;
            for (const react of payload.reacts) {
              if (!seenIds.has(react.id)) {
                seenIds.add(react.id);
                channelReactsMerged.push(react);
              }
            }
          }

          setChannelReactsMap(channelMap);
        }
      }

      const isShortOrInvalid = (r: ReactVideo): boolean => {
        if (!r) return true;

        if (!r.thumbnailUrl || r.thumbnailUrl.trim() === '' || r.thumbnailUrl.includes('no_thumbnail')) {
          return true;
        }

        const lowerTitle = (r.titulo || '').toLowerCase();
        const shortsKeywords = [
          '#shorts', '#short', '#reels', '#tiktok', '#shortsyoutube', '#shortsvideo',
          '#viralshorts', '#ytshorts', '#shortsfeed', '#shortsclip', ' #shorts', ' #reels', ' #short'
        ];
        if (shortsKeywords.some(kw => lowerTitle.includes(kw))) {
          return true;
        }

        const duracaoStr = r.duracao;
        if (!duracaoStr) return false;
        const parts = duracaoStr.split(':');
        if (parts.length === 3) {
          return false;
        }
        if (parts.length === 2) {
          const mins = parseInt(parts[0], 10);
          const secs = parseInt(parts[1], 10);
          if (isNaN(mins) || isNaN(secs)) return false;
          return (mins * 60 + secs) <= 120;
        }
        if (parts.length === 1) {
          const secs = parseInt(parts[0], 10);
          if (isNaN(secs)) return false;
          return secs <= 120;
        }
        return false;
      };

      if (Array.isArray(reactsData) && reactsData.length > 0) {
        const filteredReacts = reactsData.filter((r: ReactVideo) => !isShortOrInvalid(r));
        const existingIds = new Set(filteredReacts.map((r) => r.id));
        const mergedReacts = [...filteredReacts];
        for (const react of channelReactsMerged) {
          if (!existingIds.has(react.id) && !isShortOrInvalid(react)) {
            mergedReacts.push(react);
          }
        }
        setReacts(mergedReacts);
      } else if (channelReactsMerged.length > 0) {
        setReacts(channelReactsMerged.filter((r) => !isShortOrInvalid(r)));
      }

      if (Array.isArray(seguidosData)) {
        setCanaisSeguidos(seguidosData);
      } else {
        setCanaisSeguidos([]);
      }

      if (userData && userData.success && userData.user) {
        const serverUser = userData.user as UserState;
        const mergedUser: UserState = {
          ...serverUser,
          socialLinks: hasSocialLinks(serverUser.socialLinks)
            ? serverUser.socialLinks
            : user.socialLinks,
          descricao: serverUser.descricao?.trim() ? serverUser.descricao : user.descricao,
        };
        setUser(mergedUser);
        
        // Sync continue watching with server
        if (Array.isArray(userData.user.continueWatching)) {
          setContinueWatching(userData.user.continueWatching);
          localStorage.setItem('cine_react_continue_watching', JSON.stringify(userData.user.continueWatching));
        }
      }
    } catch {
      // Silently handle error
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  };

  const handleToggleSeguir = async (canalNome: string) => {
    if (!user.isLoggedIn) return;
    try {
      const res = await fetch('/api/canais/seguir', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email, canalNome })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.seguindo) {
          setCanaisSeguidos(prev => [...prev, canalNome]);
        } else {
          setCanaisSeguidos(prev => prev.filter(name => name !== canalNome));
        }
      }
    } catch (e) {
      console.error("Erro ao seguir/deixar de seguir canal:", e);
    }
  };

  const handlePlayVideo = (reactId: string, obraId: string) => {
    if (!user.isLoggedIn) {
      openAuthModal('login');
      return;
    }
    window.scrollTo(0, 0);
    setSelectedObraId(obraId);
    setSelectedReactId(reactId);
    setCurrentTab('reproducao');
  };

  useEffect(() => {
    // Initial fetch on mount or when user login state changes
    const shouldShowSkeleton = obras.length === 0 || reacts.length === 0;
    fetchData(shouldShowSkeleton);
  }, [user.email]);

  // Precompute home feeds in idle time while user reads the landing page
  useEffect(() => {
    if (currentTab !== 'landing' || reacts.length === 0 || feedsWarm) return;
    if (typeof window === 'undefined') return;

    let cancelled = false;
    const warm = () => {
      if (!cancelled) setFeedsWarm(true);
    };

    if (typeof requestIdleCallback === 'function') {
      const id = requestIdleCallback(warm, { timeout: 1200 });
      return () => {
        cancelled = true;
        cancelIdleCallback(id);
      };
    }

    const timeoutId = setTimeout(warm, 300);
    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [currentTab, reacts.length, feedsWarm]);

  // Load continue watching state from localStorage
  useEffect(() => {
    if (user.isLoggedIn) {
      const stored = localStorage.getItem('cine_react_continue_watching');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            setContinueWatching(parsed);
          }
        } catch (e) {
          console.error("Error parsing continue watching:", e);
        }
      }
    } else {
      setContinueWatching([]);
      localStorage.removeItem('cine_react_continue_watching');
    }
  }, [user.isLoggedIn]);

  const handleUpdateWatchProgress = useCallback((reactId: string, obraId: string, progress: number) => {
    if (!user.isLoggedIn) return;

    setContinueWatching(prev => {
      const filtered = prev.filter(item => item.reactId !== reactId);
      const updatedItem = {
        reactId,
        obraId,
        progress,
        updatedAt: Date.now()
      };
      const newValue = [updatedItem, ...filtered].slice(0, 20); // Limit to 20 items
      localStorage.setItem('cine_react_continue_watching', JSON.stringify(newValue));
      return newValue;
    });

    if (user.email) {
      fetch('/api/usuario/continue-watching', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: user.email,
          reactId,
          obraId,
          progress
        })
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.gamificationReward) gamification.refresh();
        })
        .catch(e => console.error("Error updating watch progress on server:", e));
    }
  }, [user.isLoggedIn, user.email, gamification]);

  const progressMap = React.useMemo(() => {
    const map: Record<string, number> = {};
    continueWatching.forEach(item => {
      map[item.reactId] = item.progress;
    });
    return map;
  }, [continueWatching]);

  const continueWatchingReacts = React.useMemo(() => {
    return continueWatching
      .map(item => reacts.find(r => r.id === item.reactId))
      .filter((r): r is ReactVideo => !!r);
  }, [continueWatching, reacts]);

  const catalogActive = currentTab !== 'landing';

  useEffect(() => {
    if (!catalogActive) resetSideNavOnLeave();
  }, [catalogActive]);

  const recomendadosReacts = React.useMemo(() => {
    if (!catalogActive) return [];
    const explicit = reacts.filter(r => r.isRecomendado);
    if (explicit.length >= 8) return explicit;

    // Pick curated editor highlights from distinct channels so CineReact Recomenda stays unique
    const existingIds = new Set(explicit.map(r => r.id));
    const channelMap = new Map<string, ReactVideo[]>();

    reacts.forEach(r => {
      if (!existingIds.has(r.id)) {
        const key = r.canalNome || r.obraId;
        if (!channelMap.has(key)) channelMap.set(key, []);
        channelMap.get(key)!.push(r);
      }
    });

    const curatedPicks: ReactVideo[] = [];
    channelMap.forEach(channelReacts => {
      // Pick top liked / top rated from each channel
      const topPick = [...channelReacts].sort((a, b) => {
        const scoreA = (a.likes || 0) * 50 + (a.visualizacoes || 0) * 0.1;
        const scoreB = (b.likes || 0) * 50 + (b.visualizacoes || 0) * 0.1;
        return scoreB - scoreA;
      })[0];
      if (topPick) curatedPicks.push(topPick);
    });

    curatedPicks.sort((a, b) => {
      const scoreA = (a.likes || 0) * 50 + (a.visualizacoes || 0) * 0.1;
      const scoreB = (b.likes || 0) * 50 + (b.visualizacoes || 0) * 0.1;
      return scoreB - scoreA;
    });

    return [...explicit, ...curatedPicks].slice(0, 15);
  }, [catalogActive, reacts]);

  const matchingReacts = React.useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase().trim();
    return reacts.filter(react => {
      const titleMatch = react.titulo.toLowerCase().includes(query);
      const channelMatch = react.canalNome.toLowerCase().includes(query);
      
      const obra = obras.find(o => o.id === react.obraId);
      const obraMatch = obra ? (
        obra.titulo.toLowerCase().includes(query) ||
        obra.tipo.toLowerCase().includes(query) ||
        (obra.generos && obra.generos.some(g => g.toLowerCase().includes(query))) ||
        (obra.sinopse && obra.sinopse.toLowerCase().includes(query))
      ) : false;
      
      return titleMatch || channelMatch || obraMatch;
    });
  }, [searchQuery, reacts, obras]);


  // Helper shuffle function (Fisher-Yates)
  const shuffleArray = useCallback(<T,>(arr: T[]): T[] => {
    const list = [...arr];
    for (let i = list.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [list[i], list[j]] = [list[j], list[i]];
    }
    return list;
  }, []);

  const selectChannelDiverse = React.useCallback((items: ReactVideo[], limit: number = 20): ReactVideo[] => {
    const result: ReactVideo[] = [];
    const channelCount: Record<string, number> = {};
    
    for (const item of items) {
      if (result.length >= limit) break;
      const channel = item.canalNome || 'desconhecido';
      const count = channelCount[channel] || 0;
      
      if (count < 3) {
        result.push(item);
        channelCount[channel] = count + 1;
      }
    }

    if (result.length < limit) {
      const resultIds = new Set(result.map(r => r.id));
      for (const item of items) {
        if (result.length >= limit) break;
        if (!resultIds.has(item.id)) {
          result.push(item);
          resultIds.add(item.id);
        }
      }
    }
    return result;
  }, []);

  const homeFeeds = React.useMemo(() => {
    if (reacts.length === 0) return null;
    if (currentTab === 'landing' && !feedsWarm) return null;

    // Reacts em Alta (Velocity & Trending score)
    const sortedEmAlta = [...reacts].sort((a, b) => {
      const pubA = new Date(a.publicadoEm || Date.now()).getTime();
      const pubB = new Date(b.publicadoEm || Date.now()).getTime();
      const now = Date.now();
      const daysOldA = Math.max(0.1, (now - pubA) / (1000 * 60 * 60 * 24));
      const daysOldB = Math.max(0.1, (now - pubB) / (1000 * 60 * 60 * 24));

      const scoreA = ((a.visualizacoes || 0) + (a.likes || 0) * 50 + 1000) / Math.pow(daysOldA + 1, 1.5);
      const scoreB = ((b.visualizacoes || 0) + (b.likes || 0) * 50 + 1000) / Math.pow(daysOldB + 1, 1.5);
      
      return scoreB - scoreA || b.id.localeCompare(a.id);
    });
    const emAlta = selectChannelDiverse(sortedEmAlta, 20);

    // Novidades: top 20 newest by publication date
    const sortedNovidades = [...reacts].sort((a, b) => {
      const dateA = new Date(a.publicadoEm || 0).getTime();
      const dateB = new Date(b.publicadoEm || 0).getTime();
      return dateB - dateA || b.id.localeCompare(a.id);
    });
    const novidades = selectChannelDiverse(sortedNovidades, 20);

    // Mais Assistidos: top 30 highest total view count strictly
    const sortedMaisAssistidos = [...reacts].sort((a, b) => {
      const viewsA = a.visualizacoes || 0;
      const viewsB = b.visualizacoes || 0;
      if (viewsB !== viewsA) return viewsB - viewsA;
      return (b.likes || 0) - (a.likes || 0) || a.id.localeCompare(b.id);
    });
    const maisAssistidos = selectChannelDiverse(sortedMaisAssistidos, 30);

    // Dynamic type-based carousels (filme, serie, jogo, anime)
    const tipoFeeds = ['filme', 'serie', 'jogo', 'anime'].reduce((acc, tipo) => {
      const filtered = reacts.filter(r => {
        const obra = obras.find(o => o.id === r.obraId);
        return obra && obra.tipo === tipo;
      });
      acc[tipo] = [...filtered].sort((a, b) => b.visualizacoes - a.visualizacoes);
      return acc;
    }, {} as Record<string, ReactVideo[]>);

    // Genre-based carousels (Terror, Ação, Comédia)
    const generoFeeds = ['Terror', 'Ação', 'Comédia'].reduce((acc, genero) => {
      const filtered = reacts.filter(r => {
        const obra = obras.find(o => o.id === r.obraId);
        return obra && obra.generos.some(g => g.toLowerCase() === genero.toLowerCase());
      });
      acc[genero] = [...filtered].sort((a, b) => b.visualizacoes - a.visualizacoes);
      return acc;
    }, {} as Record<string, ReactVideo[]>);

    // Franquia-based carousels (Marvel, DC, Harry Potter, One Piece, GTA, Resident Evil, The Last of Us)
    const franquiaFeeds = ['Marvel', 'DC', 'Harry Potter', 'One Piece', 'GTA', 'Resident Evil', 'The Last of Us'].reduce((acc, franquia) => {
      const filtered = reacts.filter(r => {
        const obra = obras.find(o => o.id === r.obraId);
        return obra && (obra.titulo.toLowerCase().includes(franquia.toLowerCase()) || obra.id.toLowerCase().includes(franquia.toLowerCase().replace(/ /g, '-')));
      });
      acc[franquia] = [...filtered].sort((a, b) => b.visualizacoes - a.visualizacoes);
      return acc;
    }, {} as Record<string, ReactVideo[]>);

    // Creator channels carousels
    const canalFeeds = obras.filter(o => o.tipo === 'canal').reduce((acc, canal) => {
      const fromChannelMap = channelReactsMap[canal.id];
      if (fromChannelMap && fromChannelMap.length > 0) {
        acc[canal.id] = [...fromChannelMap].sort((a, b) => b.visualizacoes - a.visualizacoes);
        return acc;
      }

      const filtered = reacts.filter(r => {
        if (r.obraId === canal.id) return true;
        if (canal.channelId && r.canalId === canal.channelId) return true;
        const cleanCanalTitle = canal.titulo.replace(/^Canal\s+/i, '').trim().toLowerCase();
        const cleanReactCanal = r.canalNome.trim().toLowerCase();
        return cleanReactCanal.includes(cleanCanalTitle) || cleanCanalTitle.includes(cleanReactCanal);
      });
      acc[canal.id] = [...filtered].sort((a, b) => b.visualizacoes - a.visualizacoes);
      return acc;
    }, {} as Record<string, ReactVideo[]>);

    return {
      emAlta,
      novidades,
      maisAssistidos,
      tipoFeeds,
      generoFeeds,
      franquiaFeeds,
      canalFeeds
    };
  }, [currentTab, feedsWarm, reacts, obras, selectChannelDiverse, channelReactsMap]);

  const handleSearchTriggered = (results: Obra[], query: string) => {
    setSearchResults(results);
    setSearchQuery(query);
    setSelectedObraId(null);
    setCurrentTab('busca');
  };

  const handlePlayReact = (videoId: string, obraId: string) => {
    setSelectedObraId(obraId);
    setSelectedReactId(videoId);
    setCurrentTab('obra');
  };

  const handleChannelClickByName = (channelNameOrId: string) => {
    const byId = obras.find(o => o.id === channelNameOrId && o.tipo === 'canal');
    if (byId) {
      setSelectedObraId(byId.id);
      setSelectedReactId(null);
      setCurrentTab('canal');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const cleanName = channelNameOrId.trim().toLowerCase().replace('canal ', '');
    const foundCanal = obras.find(o => 
      o.tipo === 'canal' && (
        o.titulo.toLowerCase().includes(cleanName) || 
        cleanName.includes(o.titulo.toLowerCase().replace('canal ', ''))
      )
    );
    if (foundCanal) {
      setSelectedObraId(foundCanal.id);
      setSelectedReactId(null);
      setCurrentTab('canal');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const canais = obras.filter(o => o.tipo === 'canal');

  const handleExplore = useCallback(() => {
    setIsExploring(true);
    setFeedsWarm(true);

    if (typeof window !== 'undefined') {
      sessionStorage.setItem('cinereact_explored', 'true');
    }

    startTransition(() => {
      setCurrentTab('inicio');
      setIsExploring(false);
    });

    window.scrollTo(0, 0);

    if (typeof window !== 'undefined' && window.history?.pushState) {
      window.history.pushState({}, '', '/');
    }
  }, [startTransition]);

  useEffect(() => {
    if (currentTab !== 'landing' || typeof document === 'undefined') return;

    const { body, documentElement } = document;
    const previousBodyOverflow = body.style.overflow;
    const previousHtmlOverflow = documentElement.style.overflow;

    body.style.overflow = 'hidden';
    documentElement.style.overflow = 'hidden';

    return () => {
      body.style.overflow = previousBodyOverflow;
      documentElement.style.overflow = previousHtmlOverflow;
    };
  }, [currentTab]);

  return (
    <>
    <div
      className={`min-h-screen bg-[#0a0e14] text-white flex flex-col font-sans selection:bg-cine-accent/40 selection:text-cine-cream w-full max-w-none overflow-x-hidden relative ${
        currentTab === 'landing' ? 'fixed inset-0 overflow-hidden pointer-events-none invisible' : ''
      }`}
      aria-hidden={currentTab === 'landing'}
    >
      {catalogActive && (
        <SideNavHub
          currentTab={currentTab}
          selectedCanalId={selectedObraId}
          obras={obras}
          reacts={reacts}
          setCurrentTab={(tab) => {
            setCurrentTab(tab);
            setSelectedObraId(null);
            setSelectedReactId(null);
            setSearchQuery('');
          }}
          onSelectCanal={(canalId) => {
            setSelectedObraId(canalId);
            setSelectedReactId(null);
            setSearchQuery('');
            setCurrentTab('canal');
          }}
          onSearch={handleSearchTriggered}
          onSelectObra={(id) => {
            setSelectedObraId(id);
            setSelectedReactId(null);
            const obra = obras.find((o) => o.id === id);
            setCurrentTab(obra?.tipo === 'canal' ? 'canal' : 'obra');
          }}
        />
      )}

      <div className="flex flex-col flex-1 min-h-screen w-full">
      
      {/* HEADER & TOP NAVIGATION */}
      <Header 
        currentTab={currentTab}
        hasSideNav={catalogActive}
        setCurrentTab={(tab) => {
          setCurrentTab(tab);
          setSelectedObraId(null);
          setSelectedReactId(null);
          setSearchQuery('');
        }}
        user={user}
        setUser={setUser}
        onOpenAuth={openAuthModal}
        gamificationData={gamification.data}
        onOpenGamification={() => {
          setCurrentTab('club');
          setSelectedObraId(null);
          setSelectedReactId(null);
        }}
      />

      {/* CORE VIEWPORT */}
      <main className="flex-1 flex flex-col min-h-[calc(100vh-4rem)] w-full max-w-none">
        {loading ? (
          currentTab === 'reproducao' ? (
            <PlaybackSkeleton />
          ) : (
            <RowMoviesSkeleton />
          )
        ) : (
          <AnimatePresence mode="wait">
            
            {/* SEARCH RESULTS VIEW */}
            {currentTab === 'busca' && (
              <motion.div
                key="search-view"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="cine-container pt-24 pb-20 w-full space-y-8 w-full flex-1"
              >
                <div>
                  <h1 className="text-2xl font-black uppercase text-white tracking-tight flex items-center gap-2">
                    <Compass className="text-cine-accent-light w-7 h-7" />
                    Resultados para: <span className="text-cine-cream font-bold">"{searchQuery}"</span>
                  </h1>
                  <p className="text-xs text-zinc-500 mt-1">Busca inteligente de reacts de filmes, séries, animes, jogos e canais</p>
                </div>

                {matchingReacts.length === 0 && searchResults.length === 0 ? (
                  <div className="text-center py-24 bg-neutral-900/10 rounded-xl border border-neutral-800">
                    <p className="text-zinc-400 text-sm">Nenhum resultado encontrado para esta pesquisa.</p>
                    <p className="text-zinc-600 text-xs mt-1">Tente pesquisar por termos como Marvel, animes, ou nomes de criadores.</p>
                  </div>
                ) : (
                  <div className="space-y-12">
                    {/* VIDEO RESULTS (THUMBNAILS) */}
                    {matchingReacts.length > 0 && (
                      <div className="space-y-4">
                        <h2 className="text-lg font-bold text-white uppercase tracking-wider border-b border-neutral-800 pb-2 flex items-center gap-2 font-sans">
                          <span className="w-2.5 h-2.5 bg-cine-accent-light rounded-full inline-block animate-pulse" />
                          Vídeos Encontrados ({matchingReacts.length})
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6">
                          {matchingReacts.map((react) => {
                            const associatedObra = obras.find(o => o.id === react.obraId);
                            return (
                              <motion.div
                                key={react.id}
                                whileHover={{ scale: 1.02 }}
                                transition={{ duration: 0.15, ease: 'easeOut' }}
                                onClick={() => handlePlayVideo(react.id, react.obraId)}
                                style={{ touchAction: 'pan-y pinch-zoom' }}
                                className="bg-neutral-900/30 backdrop-blur-sm rounded-xl overflow-hidden shadow-lg border border-neutral-800 hover:border-cine-accent/40 hover:shadow-cine-accent/10 shadow-black/50 cursor-pointer group/card flex flex-col h-full select-none"
                              >
                                <div className="relative h-36 md:h-44 w-full overflow-hidden bg-neutral-950">
                                  <OptimizedImage
                                    src={react.thumbnailUrl}
                                    alt={react.titulo}
                                    className="w-full h-full object-cover group-hover/card:scale-102 transition-transform duration-300"
                                  />
                                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/card:opacity-100 transition-opacity flex items-center justify-center">
                                    <div className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg bg-cine-accent/90 shadow-cine-accent/30 text-black font-bold">
                                      <Play className="w-6 h-6 fill-current ml-0.5" />
                                    </div>
                                  </div>
                                  <span className="absolute bottom-2 right-2 bg-black/80 backdrop-blur-xs text-[10px] font-mono px-1.5 py-0.5 rounded text-white font-semibold flex items-center gap-1 border border-zinc-700/50">
                                    <Clock className="w-3 h-3 text-cine-accent-light" /> {react.duracao}
                                  </span>
                                  {associatedObra && (
                                    <span className="absolute top-2 left-2 bg-cine-accent text-black font-black text-[9px] uppercase px-2 py-0.5 rounded shadow tracking-wide">
                                      {associatedObra.titulo}
                                    </span>
                                  )}
                                </div>
                                <div className="p-3.5 space-y-2 flex-1 flex flex-col justify-between">
                                  <h3 className="text-xs md:text-sm font-bold text-white line-clamp-2 leading-snug group-hover/card:text-cine-accent-light transition-colors">
                                    {react.titulo}
                                  </h3>
                <div className="flex items-center text-[11px] text-zinc-400 pt-2">
                  <span className="font-semibold text-zinc-300 truncate max-w-full flex items-center gap-1">
                    {react.canalNome}
                    <span className="w-1.5 h-1.5 bg-cine-accent-light rounded-full inline-block animate-pulse" />
                  </span>
                </div>
                                </div>
                              </motion.div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* OBRAS & CANAIS RESULTS */}
                    {searchResults.length > 0 && (
                      <div className="space-y-4 pt-4">
                        <h2 className="text-lg font-bold text-white uppercase tracking-wider border-b border-neutral-800 pb-2">
                          Obras & Canais ({searchResults.length})
                        </h2>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                          {searchResults.map(obra => (
                            <div 
                              key={obra.id}
                              onClick={() => {
                                setSelectedObraId(obra.id);
                                setSelectedReactId(null);
                                setCurrentTab('obra');
                              }}
                              className="bg-neutral-900/20 backdrop-blur-md rounded-xl overflow-hidden border border-neutral-800 hover:border-cine-accent/40 hover:shadow-lg hover:shadow-cine-accent/5 transition-all cursor-pointer group"
                            >
                              <div className="aspect-3/4 relative overflow-hidden bg-neutral-950">
                                <OptimizedImage src={obra.poster} alt={obra.titulo} className="w-full h-full object-cover group-hover:scale-102 transition-all duration-350" />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                  <div className="w-12 h-12 bg-cine-accent text-black rounded-full flex items-center justify-center shadow-lg font-bold">
                                    <Play className="w-6 h-6 fill-black text-black ml-0.5" />
                                  </div>
                                </div>
                              </div>
                              <div className="p-3 text-center space-y-1">
                                <span className="text-[9px] uppercase font-mono bg-neutral-800/50 backdrop-blur-xs px-1.5 py-0.5 rounded text-zinc-400">{obra.tipo}</span>
                                <h4 className="text-xs font-bold text-white line-clamp-1 leading-tight group-hover:text-cine-accent-light transition-colors pt-1">{obra.titulo}</h4>
                                <span className="text-[10px] text-zinc-500">{obra.ano}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            )}

            {/* OBRA SCREEN */}
            {currentTab === 'obra' && selectedObraId && (
              <motion.div
                key="obra-view"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-full flex-1"
              >
                {(() => {
                  const uni = obras.find(o => o.id === selectedObraId);
                  if (!uni) {
                    return (
                      <div className="pt-24 flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
                        <div className="text-white font-bold text-lg">Conteúdo não encontrado</div>
                        <button onClick={() => setCurrentTab('inicio')} className="mt-4 px-4 py-2 bg-[#22d3ee] text-white font-black rounded hover:brightness-105 transition-all text-xs">
                          Voltar ao Início
                        </button>
                      </div>
                    );
                  }
                  return (
                    <ObraPage
                      obra={uni}
                      reacts={reacts.filter(r => r.obraId === selectedObraId)}
                      onPlayVideo={handlePlayVideo}
                      onBack={() => setCurrentTab('inicio')}
                    />
                  );
                })()}
              </motion.div>
            )}

            {/* REPRODUCAO SCREEN */}
            {currentTab === 'reproducao' && selectedObraId && (
              <motion.div
                key="reproducao-view"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-full flex-1"
              >
                <PlaybackPage
                  obraId={selectedObraId}
                  initialReactId={selectedReactId}
                  reacts={reacts}
                  obras={obras}
                  user={user}
                  userLoadout={gamification.data?.profile.loadout}
                  canaisSeguidos={canaisSeguidos}
                  onToggleSeguir={handleToggleSeguir}
                  onUpdateProgress={handleUpdateWatchProgress}
                  onGoToObra={(id) => {
                    setSelectedObraId(id);
                    setCurrentTab('obra');
                  }}
                  onGoToCanal={(id) => {
                    setSelectedObraId(id);
                    setCurrentTab('canal');
                  }}
                  onOpenAuth={openAuthModal}
                  onUpdateUser={setUser}
                />
              </motion.div>
            )}

            {/* HOMEPAGE VIEW */}
            {currentTab === 'inicio' && (
              <motion.div
                key="home-view"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-12 pb-24 pt-24 w-full flex-1"
              >
                {/* HORIZONTAL ROWS */}
                <motion.div className="space-y-10 md:mt-8 relative z-20">
                  {user.isLoggedIn && continueWatchingReacts.length > 0 && (
                    <RowMovies 
                      title="Continue Assistindo" 
                      reacts={continueWatchingReacts} 
                      obras={obras}
                      progressMap={progressMap}
                      onPlayVideo={handlePlayVideo}
                      onChannelClick={handleChannelClickByName}
                    />
                  )}

                  {recomendadosReacts.length > 0 && (
                    <RowMovies 
                      title="CineReact Recomenda" 
                      reacts={recomendadosReacts} 
                      obras={obras}
                      progressMap={progressMap}
                      onPlayVideo={handlePlayVideo}
                      isEditorial={true}
                      onChannelClick={handleChannelClickByName}
                    />
                  )}

                  {homeFeeds ? (
                    <>
                      <RowMovies 
                        title="Reacts em Alta" 
                        reacts={homeFeeds.emAlta} 
                        obras={obras}
                        progressMap={progressMap}
                        onPlayVideo={handlePlayVideo}
                        onChannelClick={handleChannelClickByName}
                      />
                      <RowMovies 
                        title="Novidades" 
                        reacts={homeFeeds.novidades} 
                        obras={obras}
                        progressMap={progressMap}
                        onPlayVideo={handlePlayVideo}
                        onChannelClick={handleChannelClickByName}
                      />
                      <RowMovies 
                        title="Mais Assistidos" 
                        reacts={homeFeeds.maisAssistidos} 
                        obras={obras}
                        progressMap={progressMap}
                        onPlayVideo={handlePlayVideo}
                        onChannelClick={handleChannelClickByName}
                      />
                      
                      {/* CATEGORIES */}
                      {['filme', 'serie', 'jogo', 'anime'].map(tipo => {
                        const tipoReacts = homeFeeds.tipoFeeds[tipo] || [];
                        if (tipoReacts.length === 0) return null;
                        return (
                          <RowMovies 
                            key={tipo}
                            title={tipo === 'filme' ? 'Filmes' : tipo === 'serie' ? 'Séries' : tipo === 'jogo' ? 'Jogos' : 'Animes'} 
                            reacts={tipoReacts} 
                            obras={obras}
                            progressMap={progressMap}
                            onPlayVideo={handlePlayVideo}
                            onChannelClick={handleChannelClickByName}
                          />
                        );
                      })}

                      {['Terror', 'Ação', 'Comédia'].map(genero => {
                        const generoReacts = homeFeeds.generoFeeds[genero] || [];
                        if (generoReacts.length === 0) return null;
                        return (
                          <RowMovies 
                            key={genero}
                            title={genero} 
                            reacts={generoReacts} 
                            obras={obras}
                            progressMap={progressMap}
                            onPlayVideo={handlePlayVideo}
                            onChannelClick={handleChannelClickByName}
                          />
                        );
                      })}
                      
                      {['Marvel', 'DC', 'Harry Potter', 'One Piece', 'GTA', 'Resident Evil', 'The Last of Us'].map(franquia => {
                        const uniReacts = homeFeeds.franquiaFeeds[franquia] || [];
                        if (uniReacts.length === 0) return null;
                        return (
                          <RowMovies 
                            key={franquia}
                            title={franquia} 
                            reacts={uniReacts} 
                            obras={obras}
                            progressMap={progressMap}
                            onPlayVideo={handlePlayVideo}
                            onChannelClick={handleChannelClickByName}
                          />
                        );
                      })}

                      {obras.filter(o => o.tipo === 'canal').sort((a, b) => {
                        if (a.destacado && !b.destacado) return -1;
                        if (!a.destacado && b.destacado) return 1;
                        return a.titulo.localeCompare(b.titulo);
                      }).map(canal => {
                        const canalReacts = homeFeeds.canalFeeds[canal.id] || [];
                        if (canalReacts.length === 0) return null;
                        return (
                          <RowMovies 
                            key={canal.id}
                            title={canal.titulo} 
                            reacts={canalReacts} 
                            obras={obras}
                            progressMap={progressMap}
                            onPlayVideo={handlePlayVideo}
                            onTitleClick={() => {
                              setSelectedObraId(canal.id);
                              setSelectedReactId(null);
                              setCurrentTab('canal');
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            onChannelClick={handleChannelClickByName}
                          />
                        );
                      })}
                    </>
                  ) : (
                    <>
                      <RowMovies 
                        title="Reacts em Alta" 
                        reacts={[...reacts].sort((a, b) => {
                          const pubA = new Date(a.publicadoEm || Date.now()).getTime();
                          const pubB = new Date(b.publicadoEm || Date.now()).getTime();
                          const daysA = Math.max(0.1, (Date.now() - pubA) / (1000 * 60 * 60 * 24));
                          const daysB = Math.max(0.1, (Date.now() - pubB) / (1000 * 60 * 60 * 24));
                          return ((b.visualizacoes || 0) + (b.likes || 0) * 25 + 500) / Math.pow(daysB + 2, 1.25) - ((a.visualizacoes || 0) + (a.likes || 0) * 25 + 500) / Math.pow(daysA + 2, 1.25);
                        }).slice(0, 20)} 
                        obras={obras}
                        progressMap={progressMap}
                        onPlayVideo={handlePlayVideo}
                      />
                      <RowMovies 
                        title="Novidades" 
                        reacts={[...reacts].sort((a, b) => new Date(b.publicadoEm).getTime() - new Date(a.publicadoEm).getTime()).slice(0, 20)} 
                        obras={obras}
                        progressMap={progressMap}
                        onPlayVideo={handlePlayVideo}
                      />
                      <RowMovies 
                        title="Mais Assistidos" 
                        reacts={[...reacts].sort((a, b) => b.visualizacoes - a.visualizacoes).slice(0, 50)} 
                        obras={obras}
                        progressMap={progressMap}
                        onPlayVideo={handlePlayVideo}
                      />

                      {/* CATEGORIES */}
                      {['filme', 'serie', 'jogo', 'anime'].map(tipo => {
                        const tipoReacts = reacts.filter(r => {
                          const obra = obras.find(o => o.id === r.obraId);
                          return obra && obra.tipo === tipo;
                        });
                        
                        if (tipoReacts.length === 0) return null;
                        return (
                          <RowMovies 
                            key={tipo}
                            title={tipo === 'filme' ? 'Filmes' : tipo === 'serie' ? 'Séries' : tipo === 'jogo' ? 'Jogos' : 'Animes'} 
                            reacts={tipoReacts} 
                            obras={obras}
                            progressMap={progressMap}
                            onPlayVideo={handlePlayVideo}
                          />
                        );
                      })}
                    </>
                  )}
                </motion.div>
              </motion.div>
            )}

            {/* CANAL PAGE */}
            {currentTab === 'canal' && selectedObraId && (
              <motion.div
                key="canal-view"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-full flex-1"
              >
                {(() => {
                  const canal = obras.find(o => o.id === selectedObraId);
                  if (!canal) {
                    return (
                      <div className="pt-24 flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
                        <div className="text-white font-bold text-lg">Canal não encontrado</div>
                        <button onClick={() => setCurrentTab('inicio')} className="mt-4 px-4 py-2 bg-[#22d3ee] text-white font-black rounded hover:brightness-105 transition-all text-xs">
                          Voltar ao Início
                        </button>
                      </div>
                    );
                  }
                  return (
                    <ChannelPage
                      canal={canal}
                      reacts={channelReactsMap[selectedObraId] || reacts.filter(r => r.obraId === selectedObraId || (canal.channelId && r.canalId === canal.channelId))}
                      obras={obras}
                      canaisSeguidos={canaisSeguidos}
                      onToggleSeguir={handleToggleSeguir}
                      onPlayVideo={handlePlayVideo}
                      onBack={() => setCurrentTab('inicio')}
                    />
                  );
                })()}
              </motion.div>
            )}
            
            {/* CANAIS SEGUIDOS */}
            {currentTab === 'canais' && (
              <motion.div
                key="canais-view"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="cine-container pt-24 pb-20 w-full min-h-screen w-full flex-1"
              >
                <h2 className="text-2xl font-bold text-white mb-8 flex items-center gap-2">
                  <span className="w-2.5 h-6 bg-gradient-to-b from-cine-cream to-cine-accent rounded" />
                  Canais Seguidos
                </h2>
                {canaisSeguidos.length === 0 ? (
                  <div className="text-center py-24 bg-neutral-900/10 rounded-2xl border border-neutral-800 max-w-xl mx-auto">
                    <p className="text-zinc-500">Você não segue nenhum canal ainda.</p>
                    <p className="text-zinc-600 text-xs mt-1">Siga canais de criadores nas páginas de reprodução para vê-los listados aqui.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {canaisSeguidos.map(nome => {
                      const canal = obras.find(o => o.tipo === 'canal' && o.titulo.includes(nome));
                      if (!canal) return null;
                      return (
                         <div key={nome} onClick={() => { setSelectedObraId(canal.id); setCurrentTab('canal'); }} className="bg-neutral-900/40 backdrop-blur-md rounded-2xl p-5 flex items-center gap-4 cursor-pointer hover:bg-neutral-900 transition-all border border-neutral-800 hover:border-cine-accent/30 shadow-md">
                           <img src={canal.poster} className="w-16 h-16 rounded-full object-cover ring-2 ring-cine-accent/30" />
                           <div>
                             <h3 className="text-base font-bold text-white hover:text-cine-accent-light transition-colors">{nome}</h3>
                             <p className="text-zinc-500 text-xs mt-0.5 font-mono">Visualizar canal do criador</p>
                           </div>
                         </div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            )}

            {/* MINHA LISTA / SAVED */}
            {currentTab === 'minha-lista' && (
              <motion.div
                key="minha-lista-view"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-full flex-1"
              >
                <MyList 
                  user={user} 
                  onSelectObra={(id) => {
                    setSelectedObraId(id);
                    setSelectedReactId(null);
                    setCurrentTab('obra');
                  }}
                />
              </motion.div>
            )}

            {/* ADMIN DASHBOARD PANEL */}
            {currentTab === 'admin' && (
              <motion.div
                key="admin-view"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-full flex-1"
              >
                <AdminPanel 
                  user={user} 
                  onSelectObra={(id) => {
                    setSelectedObraId(id);
                    setSelectedReactId(null);
                    setCurrentTab('obra');
                  }}
                />
              </motion.div>
            )}

            {/* CINEREACT CLUB — Gamificação */}
            {currentTab === 'club' && (
              <motion.div
                key="club-view"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-full flex-1"
              >
                <GamificationPage
                  user={user}
                  data={gamification.data}
                  loading={gamification.loading}
                  onRefresh={gamification.refresh}
                  onPurchase={gamification.purchaseItem}
                  onEquip={gamification.equipItem}
                  onUnequip={gamification.unequipItem}
                  onSaveLoadout={gamification.saveLoadout}
                  onRedeemCode={gamification.redeemCode}
                  onLoadLeaderboard={gamification.loadLeaderboard}
                  leaderboards={gamification.leaderboards}
                />
              </motion.div>
            )}

            {parseCreatorProfileTab(currentTab) && (
              <motion.div
                key={`creator-profile-${parseCreatorProfileTab(currentTab)}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-full flex-1"
              >
                <CreatorProfilePage
                  creatorEmail={parseCreatorProfileTab(currentTab)!}
                  onBack={() => setCurrentTab('inicio')}
                />
              </motion.div>
            )}

            {/* USER SETTINGS TAB */}
            {currentTab === 'configuracoes' && (
              <motion.div
                key="configuracoes-view"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-full flex-1"
              >
                <UserSettings 
                  user={user} 
                  onUpdateUser={setUser} 
                  onNavigateToDonations={() => setCurrentTab('doacoes')}
                  isVerifiedCreator={isVerifiedCreatorLoadout(gamification.data?.profile.loadout)}
                />
              </motion.div>
            )}

            {/* DONATIONS PAGE TAB */}
            {currentTab === 'doacoes' && (
              <motion.div
                key="doacoes-view"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-full flex-1"
              >
                <DonationsPage 
                  user={user} 
                  onUpdateUser={setUser} 
                  onOpenAuth={openAuthModal} 
                />
              </motion.div>
            )}

            {/* HORA DO ALMOÇO — sorteia react aleatório */}
            {currentTab === 'categoria-almoco' && (
              <motion.div
                key="almoco-view"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-full flex-1"
              >
                <LunchTimePage
                  reacts={reacts}
                  onPlayVideo={handlePlayVideo}
                  onBackToHome={() => {
                    setCurrentTab('inicio');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  onLunchPick={() => user.isLoggedIn && gamification.trackEvent('lunch_pick')}
                  autoPlayOnMount
                />
              </motion.div>
            )}

            {/* CHANNEL CATEGORY PAGES (e.g. categoria-canal-fanit-lin) */}
            {currentTab.startsWith('categoria-canal-') && (
              <motion.div
                key={currentTab}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-full flex-1"
              >
                {(() => {
                  const channelObraId = currentTab.replace('categoria-canal-', '');
                  const canal = obras.find(o => o.id === channelObraId && o.tipo === 'canal');
                  if (!canal) {
                    return (
                      <motion.div className="pt-24 flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
                        <div className="text-white font-bold text-lg">Categoria do canal não encontrada</div>
                        <button onClick={() => setCurrentTab('inicio')} className="mt-4 px-4 py-2 bg-[#22d3ee] text-white font-black rounded hover:brightness-105 transition-all text-xs">
                          Voltar ao Início
                        </button>
                      </motion.div>
                    );
                  }
                  return (
                    <ChannelPage
                      canal={canal}
                      reacts={channelReactsMap[canal.id] || reacts.filter(r => r.obraId === canal.id || (canal.channelId && r.canalId === canal.channelId))}
                      obras={obras}
                      canaisSeguidos={canaisSeguidos}
                      onToggleSeguir={handleToggleSeguir}
                      onPlayVideo={handlePlayVideo}
                      onBack={() => {
                        setCurrentTab('inicio');
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                    />
                  );
                })()}
              </motion.div>
            )}

            {/* CATEGORY PAGES (FILME, JOGO, ANIME, SERIE) */}
            {currentTab.startsWith('categoria-') && !currentTab.startsWith('categoria-canal-') && currentTab !== 'categoria-almoco' && (
              <motion.div
                key={`category-${currentTab}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-full flex-1"
              >
                <CategoryPage
                  categoryKey={(currentTab.replace('categoria-', '') as 'filme' | 'jogo' | 'anime' | 'serie')}
                  obras={obras}
                  reacts={reacts}
                  progressMap={progressMap}
                  onPlayVideo={handlePlayVideo}
                  onBackToHome={() => {
                    setCurrentTab('inicio');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  onChannelClick={handleChannelClickByName}
                  onSelectObra={(id) => {
                    setSelectedObraId(id);
                    setSelectedReactId(null);
                    const obra = obras.find(o => o.id === id);
                    setCurrentTab(obra?.tipo === 'canal' ? 'canal' : 'obra');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                />
              </motion.div>
            )}

          </AnimatePresence>
        )}
      </main>

      {/* FOOTER */}
      <footer className="bg-neutral-950 border-t border-neutral-900 py-10 text-center text-xs text-zinc-500 font-mono space-y-4 pb-12 w-full">
        <div className="cine-container space-y-3">
          <p>© {new Date().getFullYear()} CineReact - O maior acervo de reacts de filmes, séries e jogos do Brasil.</p>
          <div className="flex items-center justify-center gap-4 flex-wrap text-zinc-400 font-sans text-xs">
            <button 
              onClick={() => {
                setCurrentTab('configuracoes');
                window.scrollTo(0, 0);
              }}
              className="text-cine-accent-light hover:text-cine-cream font-bold transition-colors underline cursor-pointer"
            >
              Preferências
            </button>
            <span>•</span>
            <button 
              onClick={() => {
                setCurrentTab('landing');
                window.scrollTo(0, 0);
              }}
              className="text-cine-accent-light hover:text-cine-cream font-bold transition-colors underline cursor-pointer"
            >
              Página Institucional
            </button>
            <span>•</span>
            <span>Dúvidas e suporte: 
              <a href="mailto:atendimentocinereact@gmail.com" className="text-cine-accent-light hover:text-cine-cream font-bold transition-colors underline ml-1">
                atendimentocinereact@gmail.com
              </a>
            </span>
            <span>•</span>
            <button 
              onClick={() => setShowCreatorPartnerModal(true)}
              className="text-cine-accent-light hover:text-cine-cream font-bold transition-colors underline cursor-pointer"
            >
              Seja um Criador Parceiro
            </button>
          </div>
          <p className="max-w-md mx-auto text-[10px] text-zinc-600 leading-relaxed font-sans">
            Aviso legal: O CineReact não hospeda ou reproduz vídeos protegidos por direitos autorais. Todo o conteúdo incorporado é disponibilizado de forma pública através da API oficial do YouTube.
          </p>
        </div>
      </footer>

      </div>

      {/* Floating Bottom Banner for Creators */}
      <AnimatePresence>
        {isCreatorBannerVisible && (
          <CreatorPartnerBanner 
            onClick={() => setShowCreatorPartnerModal(true)} 
            onClose={() => setIsCreatorBannerVisible(false)}
          />
        )}
      </AnimatePresence>

      <CreatorPartnerModal 
        isOpen={showCreatorPartnerModal}
        onClose={() => setShowCreatorPartnerModal(false)}
      />

      <GamificationRewardToast
        reward={gamification.pendingReward}
        onClose={gamification.clearPendingReward}
      />

      <AuthModal 
        isOpen={showAuthModal}
        initialMode={authInitialMode}
        onClose={() => setShowAuthModal(false)}
        onSuccess={(loggedUser, isNewUser) => {
          setUser(loggedUser);
          setShowAuthModal(false);
          if (isNewUser) {
            setShowWelcomeModal(true);
          }
        }}
      />

      {/* WELCOME / EXPLANATION MODAL */}
      <AnimatePresence>
        {showWelcomeModal && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowWelcomeModal(false)}
              className="absolute inset-0 bg-black/90 backdrop-blur-xl"
            />

            {/* Modal Content */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 30 }}
              className="relative w-full max-w-lg bg-neutral-950 border border-neutral-800/80 rounded-2xl p-8 shadow-2xl overflow-hidden text-zinc-300 z-10"
            >
              {/* Visual element decorator */}
              <div className="absolute top-0 left-0 w-full h-[3px] bg-white-dark" />
              
              {/* Top Icon */}
              <div className="flex justify-center mb-6">
                <CineReactLogo size="lg" align="center" animated />
              </div>

              {/* Title */}
              <h2 className="text-xl md:text-2xl font-black text-white text-center tracking-tight font-sans mb-5">
                Como funciona o CineReact?
              </h2>

              {/* Text Body */}
              <div className="space-y-4 text-xs md:text-sm leading-relaxed text-zinc-300 font-sans">
                <p>
                  O CineReact é uma plataforma independente de descoberta de vídeos de reação. Não hospedamos, copiamos, baixamos ou redistribuímos vídeos do YouTube.
                </p>
                <p>
                  Nossa plataforma funciona como um organizador inteligente de reacts, reunindo em um só lugar os vídeos publicados pelos criadores para que os fãs encontrem facilmente reações de filmes, séries, animes, jogos e muito mais.
                </p>
                <p>
                  Todos os vídeos são reproduzidos através do player oficial do YouTube, garantindo que 100% das visualizações, tempo de exibição e engajamento sejam contabilizados diretamente no canal do criador. O objetivo do CineReact é facilitar a descoberta de conteúdo, valorizar os criadores e conectar a comunidade de fãs, sempre respeitando os direitos autorais e as políticas do YouTube.
                </p>
              </div>

              {/* Footer Button */}
              <div className="mt-8 flex justify-center">
                <button
                  onClick={() => setShowWelcomeModal(false)}
                  className="w-full sm:w-auto min-w-[160px] bg-white hover:bg-[#0891b2] text-black font-black py-3 px-6 rounded-xl text-xs transition-all flex items-center justify-center gap-2 shadow-lg shadow-cine-accent/20 hover:shadow-cine-accent/30 cursor-pointer active:scale-[0.98]"
                >
                  Entendi
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>

    <AnimatePresence>
      {currentTab === 'landing' && (
        <motion.div
          key="landing-overlay"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[200] overflow-y-auto overscroll-y-contain"
        >
          <LandingPage onExplore={handleExplore} isNavigating={isExploring} />
        </motion.div>
      )}
    </AnimatePresence>
    </>
  );
}
