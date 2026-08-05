import React, { useState, useEffect, useCallback, useTransition, useRef } from 'react';
import Header from './components/Header.tsx';
import RowMovies from './components/RowMovies.tsx';
import CatalogPageHeader from './components/catalog/CatalogPageHeader.tsx';
import ObraPage from './components/ObraPage.tsx';
import PlaybackPage from './components/PlaybackPage.tsx';
import MyList from './components/MyList.tsx';
import ChannelPage from './components/ChannelPage.tsx';
import { AdminShell } from './admin/AdminShell.tsx';
import MaintenanceScreen from './components/MaintenanceScreen.tsx';
import { usePlatformSettings } from './hooks/usePlatformSettings.ts';
import AuthModal from './components/AuthModal.tsx';
import RowMoviesSkeleton from './components/RowMoviesSkeleton.tsx';
import PlaybackSkeleton from './components/PlaybackSkeleton.tsx';
import UserSettings from './components/UserSettings.tsx';
import DonationsPage from './components/DonationsPage.tsx';
import CreatorVerificationPage from './components/CreatorVerificationPage.tsx';
import SubscriptionsPage from './components/SubscriptionsPage.tsx';
import CreatorPartnerBanner from './components/CreatorPartnerBanner.tsx';
import CreatorPartnersPage from './components/CreatorPartnersPage.tsx';
import LogoDownloadPage from './components/LogoDownloadPage.tsx';
import SideNavHub, { resetSideNavOnLeave, parseCreatorProfileTab } from './components/SideNavHub.tsx';
import CategoryPage from './components/CategoryPage.tsx';
import LunchTimePage from './components/LunchTimePage.tsx';
import LandingPage from './components/LandingPage.tsx';
import CineReactLogo from './components/CineReactLogo.tsx';
import GamificationPage from './components/GamificationPage.tsx';
import CreatorProfilePage from './components/CreatorProfilePage.tsx';
import GamificationRewardToast from './components/GamificationRewardToast.tsx';
import CineClipsPage from './components/cineclips/CineClipsPage.tsx';
import CineClipsHashtagPage from './components/cineclips/CineClipsHashtagPage.tsx';
import { useGamification } from './hooks/useGamification.ts';
import { isVerifiedCreatorLoadout } from './gamification/verifiedCreator.ts';
import OptimizedImage from './components/OptimizedImage.tsx';
import { Obra, ReactVideo, UserState } from './types.ts';
import { filterCatalogReacts } from './utils/reactVideoFilters.ts';
import { CATALOG_ROW_LIMIT } from './constants/catalog.ts';
import { hasSocialLinks } from './utils/socialLinks.ts';
import { OBRAS_INICIAIS, VIDEOS_INICIAIS } from './data.ts';
import { motion, AnimatePresence } from 'motion/react';
import { apiFetch } from './utils/apiClient.ts';
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
  const [cineClipsInitialClipId, setCineClipsInitialClipId] = useState<string | undefined>(() => {
    if (typeof window === 'undefined') return undefined;
    const params = new URLSearchParams(window.location.search);
    return params.get('clip') || undefined;
  });
  
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
  const pendingPlayRef = useRef<{ reactId: string; obraId: string } | null>(null);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [isCreatorBannerVisible, setIsCreatorBannerVisible] = useState(true);
  const [accountBlockNotice, setAccountBlockNotice] = useState<string | null>(null);

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
        if (
          parsed &&
          typeof parsed === 'object' &&
          parsed.isLoggedIn === true &&
          typeof parsed.email === 'string' &&
          parsed.email.trim() !== ''
        ) {
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

  const [subscriptionCreatorEmail, setSubscriptionCreatorEmail] = useState<string | undefined>();
  const [authNotice, setAuthNotice] = useState<string | null>(null);

  const isUserAuthenticated = Boolean(user.isLoggedIn && user.email?.trim());
  const { settings: platformSettings, loading: platformSettingsLoading } = usePlatformSettings();

  useEffect(() => {
    if (!platformSettings) return;
    if (platformSettings.seoTitle) document.title = platformSettings.seoTitle;
    const meta = document.querySelector('meta[name="description"]');
    if (meta && platformSettings.seoDescription) {
      meta.setAttribute('content', platformSettings.seoDescription);
    }
  }, [platformSettings]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const authState = params.get('auth');
    if (!authState) return;

    const notices: Record<string, string> = {
      'oauth-success': 'Login com Discord realizado com sucesso!',
      'oauth-error': 'Não foi possível entrar com Discord. Tente novamente.',
      'oauth-missing': 'Login com Discord cancelado ou link inválido.',
      'oauth-terms': 'Aceite os Termos de Uso e a Política de Privacidade antes de continuar com Discord.',
      'oauth-blocked': 'Sua conta está restrita. Entre em contato com o suporte.',
    };

    const isNewOAuthUser = params.get('new') === '1';

    if (authState === 'oauth-success') {
      apiFetch('/api/auth/me')
        .then(async (res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.success && data.user) {
            setUser(data.user);
            setShowAuthModal(false);
            if (isNewOAuthUser) {
              setShowWelcomeModal(true);
            }
          } else {
            setAuthNotice(notices['oauth-success']);
            setShowAuthModal(true);
          }
        })
        .catch(() => {
          setAuthNotice(notices['oauth-success']);
          setShowAuthModal(true);
        });
    } else if (notices[authState]) {
      setAuthNotice(notices[authState]);
      setShowAuthModal(true);
    }

    params.delete('auth');
    params.delete('new');
    const nextSearch = params.toString();
    const nextUrl = `${window.location.pathname}${nextSearch ? `?${nextSearch}` : ''}${window.location.hash}`;
    window.history.replaceState({}, '', nextUrl);
  }, []);

  const setUser = (newUser: UserState) => {
    setUserState(newUser);
    if (newUser.isLoggedIn) {
      localStorage.setItem('cine_react_user', JSON.stringify(newUser));
    } else {
      localStorage.removeItem('cine_react_user');
      localStorage.removeItem('cine_react_continue_watching');
      setContinueWatching([]);
      apiFetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
    }
  };

  useEffect(() => {
    let cancelled = false;
    apiFetch('/api/auth/me')
      .then(async (res) => {
        if (!res.ok) return null;
        return res.json();
      })
      .then((data) => {
        if (cancelled || !data?.success || !data.user) return;
        setUser(data.user);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!user.isLoggedIn || !user.email || user.isAdmin) {
      setAccountBlockNotice(null);
      return;
    }

    let cancelled = false;
    const verifyAccount = async () => {
      try {
        const res = await apiFetch(`/api/user/account-status?email=${encodeURIComponent(user.email)}`);
        const data = await res.json();
        if (cancelled) return;
        if (!data.ok) {
          setAccountBlockNotice(data.message || 'Sua conta foi restrita no CineReact.');
          setUser({ isLoggedIn: false, nome: '', email: '', isAdmin: false });
        } else {
          setAccountBlockNotice(null);
        }
      } catch {
        // mantém sessão em falha temporária de rede
      }
    };

    verifyAccount();
    const timer = window.setInterval(verifyAccount, 30000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [user.isLoggedIn, user.email, user.isAdmin]);

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

  const mergeChannelReacts = useCallback(async (
    canais: Obra[],
    baseReacts: ReactVideo[],
  ) => {
    const channelPayloads = await Promise.all(
      canais.map((canal) =>
        safeFetchJson(`/api/obras/${encodeURIComponent(canal.id)}`).then((data) => ({
          id: canal.id,
          reacts: Array.isArray(data?.reacts) ? (data.reacts as ReactVideo[]) : [],
        }))
      )
    );

    const channelMap: Record<string, ReactVideo[]> = {};
    const channelReactsMerged: ReactVideo[] = [];
    const seenIds = new Set<string>();

    for (const payload of channelPayloads) {
      const filtered = filterCatalogReacts(payload.reacts);
      channelMap[payload.id] = filtered;
      for (const react of filtered) {
        if (!seenIds.has(react.id)) {
          seenIds.add(react.id);
          channelReactsMerged.push(react);
        }
      }
    }

    setChannelReactsMap(channelMap);

    if (channelReactsMerged.length === 0) return;

    setReacts((prev) => {
      const existingIds = new Set(prev.map((r) => r.id));
      const merged = [...prev];
      for (const react of channelReactsMerged) {
        if (!existingIds.has(react.id)) {
          merged.push(react);
          existingIds.add(react.id);
        }
      }
      return merged;
    });
  }, []);

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
        emailQuery ? safeFetchJson(`/api/usuario/me?email=${encodeURIComponent(emailQuery)}`) : Promise.resolve(null),
      ]);

      let baseReacts: ReactVideo[] = [];
      let canais: Obra[] = [];

      if (Array.isArray(obrasData) && obrasData.length > 0) {
        setObras(obrasData);
        canais = obrasData.filter((o: Obra) => o.tipo === 'canal');
      }

      if (Array.isArray(reactsData) && reactsData.length > 0) {
        baseReacts = filterCatalogReacts(reactsData as ReactVideo[]);
        setReacts(baseReacts);
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

        if (Array.isArray(userData.user.continueWatching)) {
          setContinueWatching(userData.user.continueWatching);
          localStorage.setItem('cine_react_continue_watching', JSON.stringify(userData.user.continueWatching));
        }
      }

      if (showLoading) {
        setLoading(false);
      }

      if (canais.length > 0) {
        void mergeChannelReacts(canais, baseReacts);
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
      const res = await apiFetch('/api/canais/seguir', {
        method: 'POST',
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
    if (!isUserAuthenticated) {
      pendingPlayRef.current = { reactId, obraId };
      openAuthModal('login');
      return;
    }
    pendingPlayRef.current = null;
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

  useEffect(() => {
    if (currentTab === 'inicio' && reacts.length > 0 && !feedsWarm) {
      setFeedsWarm(true);
    }
  }, [currentTab, reacts.length, feedsWarm]);

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
      apiFetch('/api/usuario/continue-watching', {
        method: 'POST',
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

  const catalogActive = currentTab !== 'landing' && currentTab !== 'cineclips' && !currentTab.startsWith('cineclips-hashtag-');
  const isCineClipsView = currentTab === 'cineclips' || currentTab.startsWith('cineclips-hashtag-');

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


  const selectChannelDiverse = React.useCallback((items: ReactVideo[], limit: number = CATALOG_ROW_LIMIT): ReactVideo[] => {
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
      const resultIds = new Set(result.map((r) => r.id));
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

  const obraById = React.useMemo(
    () => new Map(obras.map((obra) => [obra.id, obra])),
    [obras]
  );

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
    const emAlta = selectChannelDiverse(sortedEmAlta, CATALOG_ROW_LIMIT);

    const sortedNovidades = [...reacts].sort((a, b) => {
      const dateA = new Date(a.publicadoEm || 0).getTime();
      const dateB = new Date(b.publicadoEm || 0).getTime();
      return dateB - dateA || b.id.localeCompare(a.id);
    });
    const novidades = selectChannelDiverse(sortedNovidades, CATALOG_ROW_LIMIT);

    const sortedMaisAssistidos = [...reacts].sort((a, b) => {
      const viewsA = a.visualizacoes || 0;
      const viewsB = b.visualizacoes || 0;
      if (viewsB !== viewsA) return viewsB - viewsA;
      return (b.likes || 0) - (a.likes || 0) || a.id.localeCompare(b.id);
    });
    const maisAssistidos = selectChannelDiverse(sortedMaisAssistidos, CATALOG_ROW_LIMIT);

    const capSorted = (items: ReactVideo[]) =>
      selectChannelDiverse(
        [...items].sort((a, b) => (b.visualizacoes || 0) - (a.visualizacoes || 0)),
        CATALOG_ROW_LIMIT
      );

    const tipoFeeds = ['filme', 'serie', 'jogo', 'anime'].reduce((acc, tipo) => {
      acc[tipo] = capSorted(reacts.filter((r) => obraById.get(r.obraId)?.tipo === tipo));
      return acc;
    }, {} as Record<string, ReactVideo[]>);

    const generoFeeds = ['Terror', 'Ação', 'Comédia'].reduce((acc, genero) => {
      acc[genero] = capSorted(reacts.filter((r) => {
        const obra = obraById.get(r.obraId);
        return obra?.generos?.some((g) => g.toLowerCase() === genero.toLowerCase());
      }));
      return acc;
    }, {} as Record<string, ReactVideo[]>);

    const franquiaFeeds = ['Marvel', 'DC', 'Harry Potter', 'One Piece', 'GTA', 'Resident Evil', 'The Last of Us'].reduce((acc, franquia) => {
      const needle = franquia.toLowerCase();
      acc[franquia] = capSorted(reacts.filter((r) => {
        const obra = obraById.get(r.obraId);
        return obra && (obra.titulo.toLowerCase().includes(needle) || obra.id.toLowerCase().includes(needle.replace(/ /g, '-')));
      }));
      return acc;
    }, {} as Record<string, ReactVideo[]>);

    const canalFeeds = obras.filter((o) => o.tipo === 'canal').reduce((acc, canal) => {
      const fromChannelMap = channelReactsMap[canal.id];
      if (fromChannelMap && fromChannelMap.length > 0) {
        acc[canal.id] = capSorted(fromChannelMap);
        return acc;
      }

      const cleanCanalTitle = canal.titulo.replace(/^Canal\s+/i, '').trim().toLowerCase();
      acc[canal.id] = capSorted(reacts.filter((r) => {
        if (r.obraId === canal.id) return true;
        if (canal.channelId && r.canalId === canal.channelId) return true;
        const cleanReactCanal = r.canalNome.trim().toLowerCase();
        return cleanReactCanal.includes(cleanCanalTitle) || cleanCanalTitle.includes(cleanReactCanal);
      }));
      return acc;
    }, {} as Record<string, ReactVideo[]>);

    return {
      pinnedHome: (platformSettings?.homePinIds || [])
        .map((id) => reacts.find((r) => r.id === id))
        .filter((r): r is ReactVideo => Boolean(r))
        .slice(0, CATALOG_ROW_LIMIT),
      emAlta,
      novidades,
      maisAssistidos,
      tipoFeeds,
      generoFeeds,
      franquiaFeeds,
      canalFeeds
    };
  }, [currentTab, feedsWarm, reacts, obras, obraById, selectChannelDiverse, channelReactsMap, platformSettings?.homePinIds]);

  const handleSearchTriggered = (results: Obra[], query: string) => {
    setSearchResults(results);
    setSearchQuery(query);
    setSelectedObraId(null);
    setCurrentTab('busca');
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

  const openCreatorPartners = useCallback(() => {
    setCurrentTab('criadores-parceiros');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

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

  // Garante que body/html não fiquem presos após landing, modais ou menus
  useEffect(() => {
    if (currentTab === 'landing' || typeof document === 'undefined') return;

    const { body, documentElement } = document;
    body.style.overflow = '';
    body.style.position = '';
    body.style.top = '';
    body.style.left = '';
    body.style.right = '';
    body.style.width = '';
    documentElement.style.overflow = '';
  }, [currentTab]);

  const isMaintenanceForVisitor = Boolean(platformSettings?.maintenanceMode && !user.isAdmin);
  const showCreatorBanner =
    isCreatorBannerVisible &&
    !['landing', 'admin', 'doacoes', 'verificar-perfil', 'assinaturas', 'criadores-parceiros', 'download-logo', 'cineclips'].includes(currentTab) &&
    !currentTab.startsWith('cineclips-hashtag-');

  if (!platformSettingsLoading && isMaintenanceForVisitor && platformSettings) {
    return <MaintenanceScreen settings={platformSettings} />;
  }

  return (
    <>
    <div
      className={`cine-site-bg min-h-screen text-white flex flex-col font-sans selection:bg-cine-accent/40 selection:text-cine-cream w-full max-w-none overflow-x-hidden ${
        currentTab === 'landing' ? 'fixed inset-0 overflow-hidden pointer-events-none invisible' : ''
      }`}
      aria-hidden={currentTab === 'landing'}
    >
      {platformSettings?.maintenanceMode && user.isAdmin && (
        <div className="sticky top-0 z-[250] bg-amber-500/15 border-b border-amber-500/30 px-4 py-2 text-center text-xs font-bold text-amber-200">
          Modo manutenção ativo no CineReact — visitantes estão vendo a tela de manutenção configurada.
        </div>
      )}
      {platformSettings?.globalBannerEnabled && platformSettings.globalBannerText && currentTab !== 'landing' && (
        <div className="sticky top-0 z-[240] bg-cine-accent/10 border-b border-cine-accent/20 px-4 py-2 text-center text-xs md:text-sm text-cine-cream">
          {platformSettings.globalBannerLink ? (
            <a href={platformSettings.globalBannerLink} target="_blank" rel="noreferrer" className="font-semibold hover:underline">
              {platformSettings.globalBannerText}
            </a>
          ) : (
            <span className="font-semibold">{platformSettings.globalBannerText}</span>
          )}
        </div>
      )}
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
      {!isCineClipsView && (
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
        onOpenCineClips={() => {
          setCineClipsInitialClipId(undefined);
          setCurrentTab('cineclips');
          window.scrollTo(0, 0);
        }}
      />
      )}

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
                                className="bg-neutral-900/30 backdrop-blur-sm rounded-xl overflow-hidden shadow-lg border border-neutral-800 hover:border-cine-accent/40 hover:shadow-cine-accent/10 shadow-black/50 cursor-pointer group/card flex flex-col h-full md:select-none"
                              >
                                <div className="relative h-36 md:h-44 w-full overflow-hidden bg-neutral-950">
                                  <OptimizedImage
                                    src={react.thumbnailUrl}
                                    alt={react.titulo}
                                    className="w-full h-full object-cover group-hover/card:scale-102 transition-transform duration-300"
                                  />
                                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/card:opacity-100 transition-opacity flex items-center justify-center">
                                    <div className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg bg-cine-accent/90 shadow-cine-accent/30 text-white font-bold">
                                      <Play className="w-6 h-6 fill-current ml-0.5" />
                                    </div>
                                  </div>
                                  <span className="absolute bottom-2 right-2 bg-black/80 backdrop-blur-xs text-[10px] font-mono px-1.5 py-0.5 rounded text-white font-semibold flex items-center gap-1 border border-zinc-700/50">
                                    <Clock className="w-3 h-3 text-cine-accent-light" /> {react.duracao}
                                  </span>
                                  {associatedObra && (
                                    <span className="absolute top-2 left-2 bg-cine-accent text-white font-black text-[9px] uppercase px-2 py-0.5 rounded shadow tracking-wide">
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
                                  <div className="w-12 h-12 bg-cine-accent text-white rounded-full flex items-center justify-center shadow-lg font-bold">
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
                        <button onClick={() => setCurrentTab('inicio')} className="mt-4 px-4 py-2 bg-cine-accent text-white font-black rounded hover:brightness-105 transition-all text-xs">
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
                  key={`${selectedObraId}-${selectedReactId ?? 'none'}`}
                  obraId={selectedObraId}
                  initialReactId={selectedReactId}
                  reacts={reacts}
                  obras={obras}
                  user={user}
                  userLoadout={gamification.data?.profile.loadout}
                  canaisSeguidos={canaisSeguidos}
                  onToggleSeguir={handleToggleSeguir}
                  onUpdateProgress={handleUpdateWatchProgress}
                  onSelectVideo={handlePlayVideo}
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
                className="space-y-8 pb-24 pt-24 w-full flex-1"
              >
                <CatalogPageHeader />

                <div className="space-y-10 relative z-20">
                  {user.isLoggedIn && continueWatchingReacts.length > 0 && (
                    <RowMovies
                      title="Continue Assistindo"
                      reacts={continueWatchingReacts}
                      obras={obras}
                      progressMap={progressMap}
                      onPlayVideo={handlePlayVideo}
                      onChannelClick={handleChannelClickByName}
                      limit={12}
                    />
                  )}

                  {recomendadosReacts.length > 0 && (
                    <RowMovies
                      title="CineReact Recomendado"
                      reacts={recomendadosReacts}
                      obras={obras}
                      progressMap={progressMap}
                      onPlayVideo={handlePlayVideo}
                      isEditorial
                      onChannelClick={handleChannelClickByName}
                    />
                  )}

                  {homeFeeds ? (
                    <>
                      {homeFeeds.pinnedHome.length > 0 && (
                        <RowMovies
                          title="Destaques CineReact"
                          reacts={homeFeeds.pinnedHome}
                          obras={obras}
                          progressMap={progressMap}
                          onPlayVideo={handlePlayVideo}
                          isEditorial={true}
                          onChannelClick={handleChannelClickByName}
                        />
                      )}
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
                    <p className="cine-container text-sm text-zinc-500 py-8">
                      Carregando catálogo...
                    </p>
                  )}
                </div>
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
                        <button onClick={() => setCurrentTab('inicio')} className="mt-4 px-4 py-2 bg-cine-accent text-white font-black rounded hover:brightness-105 transition-all text-xs">
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
                  <span className="w-2.5 h-6 bg-cine-accent rounded" />
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
                <AdminShell
                  user={user}
                  onClose={() => setCurrentTab('home')}
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
                  showVerifyCta={!isVerifiedCreatorLoadout(gamification.data?.profile.loadout)}
                  onVerifyProfile={() => {
                    if (!user.isLoggedIn) {
                      openAuthModal('login');
                      return;
                    }
                    setCurrentTab('verificar-perfil');
                  }}
                  onSubscribe={(creatorEmail) => {
                    setSubscriptionCreatorEmail(creatorEmail);
                    setCurrentTab('assinaturas');
                  }}
                  viewerEmail={user.email}
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
                  userLoadout={gamification.data?.profile.loadout}
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

            {currentTab === 'verificar-perfil' && (
              <motion.div
                key="verificar-perfil-view"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-full flex-1"
              >
                <CreatorVerificationPage
                  user={user}
                  onOpenAuth={() => openAuthModal('login')}
                  onVerified={() => gamification.refresh()}
                />
              </motion.div>
            )}

            {currentTab === 'assinaturas' && (
              <motion.div
                key="assinaturas-view"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-full flex-1"
              >
                <SubscriptionsPage
                  user={user}
                  creatorEmail={subscriptionCreatorEmail}
                  onOpenAuth={() => openAuthModal('login')}
                />
              </motion.div>
            )}

            {currentTab === 'criadores-parceiros' && (
              <motion.div
                key="criadores-parceiros-view"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-full flex-1"
              >
                <CreatorPartnersPage onBack={() => setCurrentTab('inicio')} />
              </motion.div>
            )}

            {currentTab === 'download-logo' && (
              <motion.div
                key="download-logo-view"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-full flex-1"
              >
                <LogoDownloadPage onBack={() => setCurrentTab('inicio')} />
              </motion.div>
            )}

            {currentTab === 'cineclips' && (
              <CineClipsPage
                key="cineclips-view"
                user={user}
                initialClipId={cineClipsInitialClipId}
                onBack={() => {
                  setCineClipsInitialClipId(undefined);
                  setCurrentTab('inicio');
                }}
                onOpenHashtag={(tag) => setCurrentTab(`cineclips-hashtag-${tag.replace(/^#/, '')}`)}
                onFollowCreator={handleToggleSeguir}
                onSubscribe={(creatorEmail) => {
                  setSubscriptionCreatorEmail(creatorEmail);
                  setCurrentTab('assinaturas');
                }}
              />
            )}

            {currentTab.startsWith('cineclips-hashtag-') && (
              <motion.div
                key={currentTab}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-full flex-1"
              >
                <CineClipsHashtagPage
                  hashtag={currentTab.replace('cineclips-hashtag-', '')}
                  onBack={() => setCurrentTab('cineclips')}
                  onSelectClip={(clipId) => {
                    setCineClipsInitialClipId(clipId);
                    setCurrentTab('cineclips');
                  }}
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
                        <button onClick={() => setCurrentTab('inicio')} className="mt-4 px-4 py-2 bg-cine-accent text-white font-black rounded hover:brightness-105 transition-all text-xs">
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
      <footer className={`bg-cine-bg border-t border-cine-border py-10 text-center text-xs text-cine-muted font-mono space-y-4 w-full ${showCreatorBanner ? 'pb-32' : 'pb-12'}`}>
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
              onClick={openCreatorPartners}
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
        {showCreatorBanner && (
          <>
            <motion.div
              key="creator-banner-scrim"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-x-0 bottom-0 h-28 bg-gradient-to-t from-cine-bg via-cine-bg/95 to-transparent z-[119] pointer-events-none"
              aria-hidden="true"
            />
            <CreatorPartnerBanner
              key="creator-partner-banner"
              onClick={openCreatorPartners}
              onClose={() => setIsCreatorBannerVisible(false)}
            />
          </>
        )}
      </AnimatePresence>

      <GamificationRewardToast
        reward={gamification.pendingReward}
        onClose={gamification.clearPendingReward}
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
                  className="w-full sm:w-auto min-w-[160px] bg-white hover:bg-cine-accent-dark text-white font-black py-3 px-6 rounded-xl text-xs transition-all flex items-center justify-center gap-2 shadow-lg shadow-cine-accent/20 hover:shadow-cine-accent/30 cursor-pointer active:scale-[0.98]"
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

    <AuthModal
      isOpen={showAuthModal}
      initialMode={authInitialMode}
      initialInfoMessage={authNotice}
      onClose={() => {
        setShowAuthModal(false);
        setAuthNotice(null);
        pendingPlayRef.current = null;
      }}
      onSuccess={(loggedUser, isNewUser) => {
        setUser(loggedUser);
        setShowAuthModal(false);

        const pending = pendingPlayRef.current;
        if (pending && loggedUser.isLoggedIn && loggedUser.email?.trim()) {
          pendingPlayRef.current = null;
          window.scrollTo(0, 0);
          setSelectedObraId(pending.obraId);
          setSelectedReactId(pending.reactId);
          setCurrentTab('reproducao');
        }

        if (isNewUser) {
          setShowWelcomeModal(true);
        }
      }}
    />
    {accountBlockNotice && (
      <div className="fixed inset-0 z-[500] flex items-center justify-center bg-black/80 p-6">
        <div className="max-w-md w-full rounded-2xl border border-red-500/30 bg-neutral-950 p-6 text-center shadow-2xl">
          <h2 className="text-xl font-bold text-white mb-3">Acesso restrito</h2>
          <p className="text-sm text-zinc-300 leading-relaxed">{accountBlockNotice}</p>
          <button
            type="button"
            onClick={() => setAccountBlockNotice(null)}
            className="mt-6 px-5 py-2.5 rounded-xl bg-cine-accent text-sm font-bold"
          >
            Entendi
          </button>
        </div>
      </div>
    )}
    </>
  );
}
