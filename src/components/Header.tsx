import React, { useState, useEffect } from 'react';
import { Search, Bell, Film, Play, User, LogOut, Check, Menu, X, Youtube, Send, Heart, Sparkles, Settings, Bookmark, ShieldAlert, CreditCard, ChevronRight, Download, UtensilsCrossed, Trophy } from 'lucide-react';
import { UserState, Notificacao, Obra, ReactVideo } from '../types.ts';
import { motion, AnimatePresence } from 'motion/react';
import OptimizedImage from './OptimizedImage.tsx';
import CineReactLogo from './CineReactLogo.tsx';
import SideNavToggleButton from './SideNavToggleButton.tsx';
import GamificationBar from './GamificationBar.tsx';
import ProfileAvatar from './profile/ProfileAvatar.tsx';
import ProfileSurface from './profile/ProfileSurface.tsx';
import ProfileThemeScope from './profile/ProfileThemeScope.tsx';
import ProfileNameRow from './profile/ProfileNameRow.tsx';
import type { GamificationMeResponse } from '../types/gamification.ts';

interface HeaderProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  user: UserState;
  setUser: (user: UserState) => void;
  onSearch: (results: Obra[], query: string) => void;
  onSelectObra: (id: string) => void;
  onOpenAuth?: (mode: 'login' | 'register') => void;
  obras?: Obra[];
  reacts?: ReactVideo[];
  hasSideNav?: boolean;
  gamificationData?: GamificationMeResponse | null;
  onOpenGamification?: () => void;
}

export default function Header({
  currentTab,
  setCurrentTab,
  user,
  setUser,
  onSearch,
  onSelectObra,
  onOpenAuth,
  obras = [],
  reacts = [],
  hasSideNav = false,
  gamificationData = null,
  onOpenGamification,
}: HeaderProps) {
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Obra[]>([]);
  const [searching, setSearching] = useState(false);

  // PWA App Installation States
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstallApp = async () => {
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice && choice.outcome === 'accepted') {
          setDeferredPrompt(null);
        }
      } catch (err) {
        console.log('Erro ao disparar prompt de instalação:', err);
      }
    } else {
      // Direct native browser alert fallback for iOS / browsers without beforeinstallprompt event
      alert('Para instalar o aplicativo no seu dispositivo, acesse as opções do navegador e selecione "Adicionar à Tela Inicial" ou "Instalar Aplicativo".');
    }
  };

  // Helper to extract hashtags or tags matching the search query from video titles
  const getMatchingHashtagsForObra = (obra: Obra, q: string): string[] => {
    if (!q || !reacts || reacts.length === 0) return [];
    const queryTerm = q.toLowerCase().trim().replace('#', '');
    const obraReacts = reacts.filter(r => r.obraId === obra.id);
    const matchedTags = new Set<string>();
    
    obraReacts.forEach(r => {
      // Find all hashtag patterns in video titles
      const hashtags = r.titulo.toLowerCase().match(/#\w+/g) || [];
      hashtags.forEach(tag => {
        const cleanTag = tag.replace('#', '');
        if (cleanTag.includes(queryTerm) || queryTerm.includes(cleanTag)) {
          matchedTags.add(tag);
        }
      });
      
      // Check if query matches channel name as a hashtag
      const cleanChannelName = r.canalNome.toLowerCase().replace(/[^a-z0-9]+/g, '');
      if (cleanChannelName.includes(queryTerm) && queryTerm.length >= 3) {
        matchedTags.add(`#${cleanChannelName}`);
      }
    });
    
    return Array.from(matchedTags);
  };
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Notificacao[]>([]);

  // Solicitar adição de canal states
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [canalNome, setCanalNome] = useState('');
  const [canalUrl, setCanalUrl] = useState('');
  const [emailContato, setEmailContato] = useState(user.email || '');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (user.email) {
      setEmailContato(user.email);
    }
  }, [user.email]);

  const handleRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await fetch('/api/solicitacoes-canal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ canalNome, canalUrl, emailContato })
      });
      
      const data = await res.json();
      if (res.ok) {
        // Envia por e-mail automaticamente via mailto preenchido
        const subject = encodeURIComponent('[CineReact] Solicitação de Cadastro de Canal - Seja um Criador');
        const body = encodeURIComponent(
          `Olá equipe do CineReact,\n\n` +
          `Gostaria de solicitar a inclusão do meu canal na plataforma! Seguem os dados:\n\n` +
          `- Nome do Canal: ${canalNome}\n` +
          `- Link do Canal (YouTube): ${canalUrl}\n` +
          `- E-mail de Contato: ${emailContato}\n\n` +
          `Obrigado!`
        );
        window.location.href = `mailto:atendimentocinereact@gmail.com?subject=${subject}&body=${body}`;

        setSuccessMsg(data.message || 'Solicitação enviada com sucesso!');
        setCanalNome('');
        setCanalUrl('');
      } else {
        setErrorMsg(data.error || 'Erro ao enviar solicitação.');
      }
    } catch (err) {
      setErrorMsg('Erro de rede ao enviar solicitação.');
    } finally {
      setLoading(false);
    }
  };

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      const url = user.email ? `/api/notificacoes?email=${encodeURIComponent(user.email)}` : '/api/notificacoes';
      const res = await fetch(url).catch(() => null);
      if (res && res.ok) {
        const data = await res.json().catch(() => []);
        setNotifications(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000); // refresh notifications
    return () => clearInterval(interval);
  }, [user.email]);

  // Instant search / autocomplete using the loaded `obras` or server fallback
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const query = searchQuery.toLowerCase().trim();
    if (obras && obras.length > 0) {
      const filtered = obras.filter(obra => {
        const titleMatch = obra.titulo.toLowerCase().includes(query);
        const tipoMatch = obra.tipo.toLowerCase().includes(query);
        const genreMatch = obra.generos ? obra.generos.some(g => g.toLowerCase().includes(query)) : false;
        const descMatch = obra.sinopse ? obra.sinopse.toLowerCase().includes(query) : false;
        
        const matchedTags = getMatchingHashtagsForObra(obra, query);
        const hashtagMatch = matchedTags.length > 0;
        
        let videoMatch = false;
        if (reacts && reacts.length > 0) {
          const obraReacts = reacts.filter(r => r.obraId === obra.id);
          videoMatch = obraReacts.some(r => 
            r.titulo.toLowerCase().includes(query) || 
            r.canalNome.toLowerCase().includes(query)
          );
        }

        return titleMatch || tipoMatch || genreMatch || descMatch || hashtagMatch || videoMatch;
      });
      setSearchResults(filtered.slice(0, 8)); // limit to top 8 suggestions in dropdown
    } else {
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
    }
  }, [searchQuery, obras, reacts]);

  const handleSearchSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    let finalResults: Obra[] = [];
    const query = searchQuery.toLowerCase().trim();
    if (obras && obras.length > 0) {
      finalResults = obras.filter(obra => {
        const titleMatch = obra.titulo.toLowerCase().includes(query);
        const tipoMatch = obra.tipo.toLowerCase().includes(query);
        const genreMatch = obra.generos ? obra.generos.some(g => g.toLowerCase().includes(query)) : false;
        const descMatch = obra.sinopse ? obra.sinopse.toLowerCase().includes(query) : false;
        
        const matchedTags = getMatchingHashtagsForObra(obra, query);
        const hashtagMatch = matchedTags.length > 0;
        
        let videoMatch = false;
        if (reacts && reacts.length > 0) {
          const obraReacts = reacts.filter(r => r.obraId === obra.id);
          videoMatch = obraReacts.some(r => 
            r.titulo.toLowerCase().includes(query) || 
            r.canalNome.toLowerCase().includes(query)
          );
        }

        return titleMatch || tipoMatch || genreMatch || descMatch || hashtagMatch || videoMatch;
      });
      onSearch(finalResults, searchQuery);
      setSearchOpen(false);
    } else {
      setSearching(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`);
        if (res.ok) {
          const data = await res.json();
          onSearch(data.obras || [], searchQuery);
          setSearchOpen(false);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setSearching(false);
      }
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await fetch(`/api/notificacoes/${id}/ler`, { method: 'POST' });
      fetchNotifications();
    } catch (e) {
      console.error(e);
    }
  };

  const clearNotifications = async () => {
    try {
      const url = user.email ? `/api/notificacoes?email=${encodeURIComponent(user.email)}` : '/api/notificacoes';
      await fetch(url, { method: 'DELETE' });
      setNotifications([]);
    } catch (e) {
      console.error(e);
    }
  };

  const handleLogout = () => {
    setUser({
      isLoggedIn: false,
      nome: "",
      email: ""
    });
    setCurrentTab('inicio');
    setShowProfileMenu(false);
  };

  const unreadCount = notifications.filter(n => !n.lida).length;

  return (
    <>
      <header 
        className={`fixed top-0 left-0 right-0 z-50 max-md:transition-none md:transition-all md:duration-300 ${
          scrolled 
            ? 'bg-zinc-950 max-md:backdrop-blur-none md:bg-zinc-950/90 md:backdrop-blur-md border-b border-zinc-900/80 shadow-lg shadow-black/30' 
            : 'bg-zinc-950/95 max-md:backdrop-blur-none md:bg-zinc-950/40 md:backdrop-blur-sm border-b border-transparent'
        }`}
      >
        <div className="cine-container w-full">
          <div className="flex h-16 items-center justify-between gap-4">
            
            {/* LEFT SECTION: Logo & Desktop Navigation */}
            <div className="flex items-center gap-3 lg:gap-6 flex-shrink-0">
              <SideNavToggleButton visible={hasSideNav} />

              <button 
                id="logo-button"
                onClick={() => { setCurrentTab('inicio'); setSearchQuery(''); }}
                className="group focus:outline-none cursor-pointer py-1"
              >
                <CineReactLogo size="sm" className="transition-transform duration-300 group-hover:-translate-y-0.5" />
              </button>

              {/* DESKTOP NAV */}
              <nav className="hidden md:flex items-center gap-1.5 text-xs lg:text-[13px] font-semibold text-zinc-400">
                <button 
                  id="nav-inicio"
                  onClick={() => { setCurrentTab('inicio'); setSearchQuery(''); }} 
                  className={`px-3 py-1.5 rounded-full transition-all duration-200 cursor-pointer ${
                    currentTab === 'inicio' 
                      ? 'text-white bg-zinc-900 shadow-sm border border-zinc-800/60' 
                      : 'hover:text-zinc-200 hover:bg-zinc-900/30'
                  }`}
                >
                  Início
                </button>
                <button 
                  id="nav-canais"
                  onClick={() => setCurrentTab('canais')} 
                  className={`px-3 py-1.5 rounded-full transition-all duration-200 cursor-pointer ${
                    currentTab === 'canais' 
                      ? 'text-white bg-zinc-900 shadow-sm border border-zinc-800/60' 
                      : 'hover:text-zinc-200 hover:bg-zinc-900/30'
                  }`}
                >
                  Canais Seguidos
                </button>
                <button 
                  id="nav-minha-lista"
                  onClick={() => setCurrentTab('minha-lista')} 
                  className={`px-3 py-1.5 rounded-full transition-all duration-200 cursor-pointer ${
                    currentTab === 'minha-lista' 
                      ? 'text-white bg-zinc-900 shadow-sm border border-zinc-800/60' 
                      : 'hover:text-zinc-200 hover:bg-zinc-900/30'
                  }`}
                >
                  Minha Lista
                </button>
                
                {/* APOIADOR HIGHLIGHT */}
                <button 
                  id="nav-doacoes"
                  onClick={() => setCurrentTab('doacoes')} 
                  className={`ml-1 px-3 py-1.5 rounded-full transition-all duration-200 flex items-center gap-1.5 text-xs font-bold border cursor-pointer ${
                    currentTab === 'doacoes' 
                      ? 'bg-amber-500/15 text-amber-400 border-amber-500/30 shadow-lg shadow-amber-950/10' 
                      : 'border-zinc-800 bg-zinc-900/40 text-amber-400 hover:bg-amber-500 hover:text-black hover:border-amber-400'
                  }`}
                >
                  <Heart className="w-3 h-3 fill-current" />
                  Seja Apoiador
                </button>

                {/* ADMIN TAB */}
                {user.isAdmin && (
                  <button 
                    id="nav-admin"
                    onClick={() => setCurrentTab('admin')} 
                    className={`ml-1 px-3 py-1.5 rounded-full transition-all duration-200 text-xs font-bold border border-amber-500/30 text-amber-400 bg-amber-500/10 hover:bg-amber-500 hover:text-black hover:border-amber-400 cursor-pointer`}
                  >
                    Painel Admin
                  </button>
                )}
              </nav>
            </div>

            {/* MIDDLE SECTION: Search Bar & Download App button */}
            <div className="flex-1 max-w-sm lg:max-w-lg mx-auto hidden sm:flex items-center gap-2 relative">
              <div className="relative flex-1">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Search className="h-4 w-4 text-zinc-500" />
                </div>
                <input
                  id="search-input"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearchSubmit(e)}
                  placeholder="Pesquisar canais, filmes, animes..."
                  className="w-full bg-zinc-900/50 hover:bg-zinc-900/80 focus:bg-zinc-900 border border-zinc-800/80 focus:border-amber-500/80 focus:ring-1 focus:ring-amber-500/40 rounded-xl py-1.5 pl-9 pr-8 text-xs text-zinc-200 placeholder-zinc-500 outline-none transition-all duration-200"
                />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery('')} 
                    className="absolute inset-y-0 right-0 flex items-center pr-2.5 text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* DOWNLOAD / INSTALL APP BUTTON NEXT TO SEARCH */}
              <button
                id="install-app-btn-desktop"
                onClick={handleInstallApp}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500 text-amber-400 hover:text-black border border-amber-500/30 hover:border-amber-400 text-xs font-extrabold transition-all duration-200 cursor-pointer shadow-sm active:scale-95 shrink-0"
                title="Instalar CineReact no seu celular ou computador"
              >
                <Download className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden lg:inline">Baixar App</span>
              </button>

              {/* FLOATING INSTANT SEARCH RESULTS */}
              <AnimatePresence>
                {searchQuery.trim() && searchResults.length > 0 && (
                  <motion.div 
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    className="absolute left-0 right-0 top-11 bg-zinc-950/95 backdrop-blur-xl border border-zinc-900 rounded-xl shadow-2xl p-2.5 max-h-[380px] overflow-y-auto z-50 divide-y divide-zinc-900"
                  >
                    <div className="text-[10px] text-zinc-500 font-mono pb-2 px-2 uppercase tracking-wider flex justify-between items-center">
                      <span>Sugestões</span>
                      {searching && <span className="w-2.5 h-2.5 border border-amber-400 border-t-transparent rounded-full animate-spin" />}
                    </div>
                    <div className="py-1 space-y-1">
                      {searchResults.map((obra) => (
                        <button
                          key={obra.id}
                          onClick={() => {
                            onSelectObra(obra.id);
                            setSearchQuery('');
                            setSearchResults([]);
                          }}
                          className="w-full flex items-center gap-3 p-2 hover:bg-zinc-900/50 rounded-lg transition-colors text-left group"
                        >
                          <OptimizedImage src={obra.poster} alt={obra.titulo} containerClassName="w-8 h-11 flex-shrink-0" className="w-8 h-11 object-cover rounded-md shadow bg-zinc-900" />
                          <div className="flex-1 min-w-0">
                            <h4 className="text-xs font-semibold text-zinc-200 group-hover:text-amber-400 transition-colors truncate leading-tight">{obra.titulo}</h4>
                            <div className="flex items-center justify-between gap-2 mt-0.5">
                              <div className="flex items-center gap-2">
                                <span className="text-[9px] uppercase font-mono px-1 rounded bg-zinc-800 text-zinc-400 font-medium">{obra.tipo}</span>
                                <span className="text-[9px] text-zinc-500">{obra.ano}</span>
                              </div>
                              {(() => {
                                const matchedTags = getMatchingHashtagsForObra(obra, searchQuery);
                                if (matchedTags.length > 0) {
                                  return (
                                    <div className="flex gap-1 overflow-hidden max-w-[120px]">
                                      {matchedTags.slice(0, 2).map((tag, idx) => (
                                        <span key={idx} className="text-[9px] text-amber-400 font-semibold truncate bg-amber-500/10 px-1 rounded border border-amber-500/20">
                                          {tag}
                                        </span>
                                      ))}
                                    </div>
                                  );
                                }
                                return null;
                              })()}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                    <button 
                      onClick={() => handleSearchSubmit()}
                      className="w-full text-center py-2 text-xs text-amber-400 font-bold hover:text-amber-300 transition-colors mt-1.5 pt-2 border-t border-zinc-900/60"
                    >
                      Ver todos os resultados
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* RIGHT SECTION: Controls */}
            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
              
              {/* MOBILE INSTALL APP BUTTON */}
              <button
                id="install-app-btn-mobile"
                onClick={handleInstallApp}
                className="p-2 text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-lg sm:hidden transition-colors cursor-pointer flex items-center justify-center shrink-0"
                title="Baixar Aplicativo"
              >
                <Download className="w-4.5 h-4.5" />
              </button>

              {/* MOBILE SEARCH TRIGGER */}
              <button 
                id="search-toggle"
                onClick={() => setSearchOpen(!searchOpen)} 
                className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-900/50 sm:hidden transition-colors"
              >
                <Search className="w-5 h-5" />
              </button>

              {/* BELL */}
              <div className="relative">
                <button 
                  id="notification-toggle" 
                  onClick={() => {
                    setShowNotifications(!showNotifications);
                    setShowProfileMenu(false);
                  }} 
                  className={`p-2 text-zinc-400 hover:text-white rounded-lg transition-all duration-200 ${
                    showNotifications ? 'bg-zinc-900 text-white border border-zinc-800/80' : 'hover:bg-zinc-900/40 border border-transparent'
                  }`}
                >
                  <Bell className="w-4.5 h-4.5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-amber-400 rounded-full ring-2 ring-zinc-950 animate-pulse" />
                  )}
                </button>

                <AnimatePresence>
                  {showNotifications && (
                    <motion.div 
                      initial={{ opacity: 0, y: 12, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 12, scale: 0.97 }}
                      transition={{ duration: 0.15, ease: 'easeOut' }}
                      className="fixed md:absolute top-16 md:top-12 left-4 md:left-auto right-4 md:right-0 w-auto max-w-[calc(100vw-32px)] md:w-96 bg-zinc-950/98 backdrop-blur-2xl border border-zinc-900/90 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.6)] overflow-hidden z-50 divide-y divide-zinc-900/60"
                    >
                      <div className="px-4 py-3.5 flex justify-between items-center bg-zinc-900/20">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-[13px] text-zinc-100 uppercase tracking-wider font-sans">Notificações</h3>
                          {unreadCount > 0 && (
                            <span className="px-2 py-0.5 text-[9px] bg-amber-500/10 border border-amber-500/20 text-amber-400 font-bold rounded-full font-mono">
                              {unreadCount} novas
                            </span>
                          )}
                        </div>
                        {notifications.length > 0 && (
                          <button 
                            onClick={clearNotifications} 
                            className="text-[10px] text-zinc-500 hover:text-amber-400 transition-all font-semibold hover:underline"
                          >
                            Limpar Tudo
                          </button>
                        )}
                      </div>

                      <div className="max-h-80 overflow-y-auto divide-y divide-zinc-900/40 scrollbar-thin scrollbar-track-zinc-950 scrollbar-thumb-zinc-800">
                        {notifications.length === 0 ? (
                          <div className="py-12 px-4 flex flex-col items-center justify-center text-center">
                            <div className="w-10 h-10 rounded-full bg-zinc-900/50 flex items-center justify-center border border-zinc-800/40 mb-3 animate-pulse">
                              <Bell className="w-5 h-5 text-zinc-600 stroke-[1.5]" />
                            </div>
                            <p className="text-zinc-400 font-semibold text-xs leading-none">Tudo limpo por aqui!</p>
                            <p className="text-[10px] text-zinc-500 mt-1 max-w-[200px] leading-relaxed">
                              Avisaremos você quando novos reacts de canais seguidos forem lançados.
                            </p>
                          </div>
                        ) : (
                          notifications.map((n) => {
                            const isUnread = !n.lida;
                            const isNewReact = n.titulo.toLowerCase().includes('react') || n.mensagem.toLowerCase().includes('vídeo');
                            const isApoio = n.titulo.toLowerCase().includes('apoiador') || n.mensagem.toLowerCase().includes('vip') || n.titulo.toLowerCase().includes('doação');

                            return (
                              <div 
                                key={n.id} 
                                className={`p-3.5 text-xs flex gap-3 transition-all relative ${
                                  isUnread 
                                    ? 'bg-amber-950/10 hover:bg-amber-950/20' 
                                    : 'bg-transparent hover:bg-zinc-900/30'
                                }`}
                              >
                                {isUnread && (
                                  <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-amber-500" />
                                )}

                                <div className="flex-shrink-0 mt-0.5">
                                  {isApoio ? (
                                    <div className="w-7 h-7 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                                      <Heart className="w-3.5 h-3.5 text-amber-400 fill-current" />
                                    </div>
                                  ) : isNewReact ? (
                                    <div className="w-7 h-7 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                                      <Play className="w-3.5 h-3.5 text-amber-400 fill-current ml-0.5" />
                                    </div>
                                  ) : (
                                    <div className="w-7 h-7 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                                      <Bell className="w-3.5 h-3.5 text-zinc-400" />
                                    </div>
                                  )}
                                </div>

                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between gap-1">
                                    <p className={`font-semibold leading-tight text-zinc-100 ${isUnread ? 'text-white' : 'text-zinc-300'}`}>
                                      {n.titulo}
                                    </p>
                                    <span className="text-[9px] text-zinc-500 font-mono flex-shrink-0 whitespace-nowrap mt-0.5">
                                      {new Date(n.criadoEm).toLocaleDateString('pt-BR')}
                                    </span>
                                  </div>
                                  <p className="text-zinc-400 mt-1 leading-relaxed text-[11px] font-medium pr-2">
                                    {n.mensagem}
                                  </p>
                                </div>

                                {isUnread && (
                                  <button 
                                    onClick={() => markAsRead(n.id)} 
                                    title="Marcar como lida"
                                    className="text-zinc-500 hover:text-amber-400 self-center p-1.5 rounded-lg hover:bg-zinc-900 transition-all border border-transparent hover:border-zinc-800 flex-shrink-0"
                                  >
                                    <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                                  </button>
                                )}
                              </div>
                            );
                          })
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {user.isLoggedIn && (
                <GamificationBar
                  data={gamificationData}
                  compact
                  onClick={() => {
                    onOpenGamification?.();
                    setShowProfileMenu(false);
                  }}
                />
              )}

              {/* USER PROFILE */}
              <div className="relative">
                <button 
                  id="profile-toggle"
                  onClick={() => {
                    setShowProfileMenu(!showProfileMenu);
                    setShowNotifications(false);
                  }} 
                  className={`flex items-center gap-2 p-1 rounded-full transition-all focus:outline-none ${
                    showProfileMenu ? 'bg-zinc-900 ring-1 ring-zinc-800/80 shadow-inner' : 'hover:bg-zinc-900/40'
                  }`}
                >
                  {user.isLoggedIn ? (
                    <ProfileAvatar
                      photoUrl={user.avatar}
                      alt={user.nome}
                      size="sm"
                      loadout={gamificationData?.profile.loadout}
                      donorBadge={!!user.isDonor}
                    />
                  ) : (
                    <div className="w-7.5 h-7.5 rounded-full bg-zinc-900 border border-zinc-800/80 flex items-center justify-center text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50 transition-all shadow-inner">
                      <User className="w-3.5 h-3.5" />
                    </div>
                  )}
                </button>
              </div>

            </div>
          </div>
        </div>

        {/* RESPONSIVE MOBILE SEARCH BAR */}
        <AnimatePresence>
          {searchOpen && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="sm:hidden bg-zinc-950 border-b border-zinc-900 px-4 py-3"
            >
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Search className="h-4 w-4 text-zinc-500" />
                </div>
                <input
                  id="search-input-mobile"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearchSubmit(e)}
                  placeholder="Pesquisar canais, filmes, animes..."
                  className="w-full bg-zinc-900/80 border border-zinc-800 rounded-xl py-2 pl-9 pr-8 text-xs text-zinc-200 outline-none focus:border-amber-500"
                  autoFocus
                />
                <button 
                  onClick={() => {
                    setSearchQuery('');
                    setSearchOpen(false);
                  }} 
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-zinc-500"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {searchQuery.trim() && searchResults.length > 0 && (
                <div className="bg-zinc-950/95 rounded-xl border border-zinc-900 mt-2 p-2 max-h-60 overflow-y-auto divide-y divide-zinc-900 shadow-xl">
                  {searchResults.map((obra) => (
                    <button
                      key={obra.id}
                      onClick={() => {
                        onSelectObra(obra.id);
                        setSearchQuery('');
                        setSearchResults([]);
                        setSearchOpen(false);
                      }}
                      className="w-full flex items-center gap-3 p-2 hover:bg-zinc-900 rounded-lg text-left"
                    >
                      <OptimizedImage src={obra.poster} alt={obra.titulo} containerClassName="w-8 h-11 flex-shrink-0" className="w-8 h-11 object-cover rounded-md" />
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-semibold text-white truncate">{obra.titulo}</h4>
                        <span className="text-[10px] text-zinc-500">{obra.ano}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

      </header>

      {/* FULL-SCREEN PROFILE PANEL */}
      <AnimatePresence>
        {showProfileMenu && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[100] overflow-y-auto flex flex-col justify-start"
          >
            <ProfileThemeScope loadout={gamificationData?.profile.loadout} className="flex-1 flex flex-col min-h-full bg-zinc-950/98 backdrop-blur-3xl">
            <div className="w-full border-b border-white/10 bg-zinc-950/40 backdrop-blur-md sticky top-0 z-10">
              <div className="cine-container w-full h-20 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                    <Film className="w-5 h-5 text-amber-400" />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-extrabold text-sm tracking-wider profile-text uppercase">CineReact Club</span>
                    <span className="text-[10px] profile-text-muted font-mono tracking-wider">Painel do Membro</span>
                  </div>
                </div>
                <button 
                  onClick={() => setShowProfileMenu(false)}
                  className="flex items-center gap-2.5 px-4.5 py-2.5 rounded-full border border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:text-white hover:bg-zinc-800/80 hover:border-zinc-700 hover:shadow-lg transition-all cursor-pointer group"
                >
                  <span className="text-[10px] font-bold uppercase tracking-wider font-mono">Fechar Painel</span>
                  <X className="w-4 h-4 group-hover:rotate-90 transition-transform duration-200" />
                </button>
              </div>
            </div>

            {user.isLoggedIn ? (
              <div className="cine-container w-full py-12 md:py-16 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12 items-start">
                
                {/* Column 1: Left Profile */}
                <ProfileSurface
                  loadout={gamificationData?.profile.loadout}
                  variant="panel"
                  themed={false}
                  className="lg:col-span-4 flex flex-col justify-between items-center text-center shadow-2xl min-h-[460px] w-full"
                >
                  <div className="flex flex-col items-center w-full relative z-10">
                    <div className="relative mb-6">
                      <ProfileAvatar
                        photoUrl={user.avatar}
                        alt={user.nome}
                        size="xl"
                        loadout={gamificationData?.profile.loadout}
                        donorBadge={!!user.isDonor}
                      />
                    </div>

                    <ProfileNameRow
                      name={user.nome}
                      isDonor={!!user.isDonor}
                      loadout={gamificationData?.profile.loadout}
                      nameSize="lg"
                      className="flex flex-col items-center"
                    />
                    <p className="profile-text-muted text-xs mt-1 mb-4 font-mono">{user.email}</p>
                    {/* Descrição / Biografia do Usuário */}
                    <p className="profile-text-subtle text-xs text-center max-w-xs px-2 line-clamp-3 mb-5 italic leading-relaxed">
                      {user.descricao ? `"${user.descricao}"` : "Escreva uma biografia nas configurações de conta!"}
                    </p>
                    
                    <div className="flex flex-wrap justify-center gap-2 w-full">
                      {user.isAdmin && (
                        <span className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-extrabold tracking-widest uppercase">
                          Administrador
                        </span>
                      )}
                      {user.isDonor ? (
                        <span className="px-3 py-1 rounded-full bg-gradient-to-r from-amber-500/20 to-yellow-500/10 text-amber-400 border border-amber-500/35 text-[10px] font-extrabold tracking-widest uppercase shadow-[0_0_15px_rgba(245,158,11,0.1)]">
                          Apoiador VIP
                        </span>
                      ) : (
                        <span className="px-3 py-1 rounded-full bg-zinc-900/80 text-zinc-500 border border-zinc-800 text-[10px] font-extrabold tracking-widest uppercase">
                          Conta Gratuita
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="w-full mt-8 space-y-2 relative z-10">
                    {user.isAdmin && (
                      <button 
                        onClick={() => { setCurrentTab('admin'); setShowProfileMenu(false); }}
                        className="w-full flex items-center justify-center gap-2.5 px-5 py-3.5 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 hover:border-amber-500/50 text-amber-300 font-bold text-xs rounded-2xl transition-all cursor-pointer shadow-lg shadow-amber-950/20"
                      >
                        <ShieldAlert className="w-4 h-4 text-amber-400" />
                        <span>Painel do Administrador</span>
                      </button>
                    )}

                    <button 
                      onClick={() => { setCurrentTab('doacoes'); setShowProfileMenu(false); }}
                      className="w-full flex items-center justify-center gap-2.5 px-5 py-3.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 hover:border-amber-500/35 text-amber-400 hover:text-amber-300 rounded-2xl transition-all cursor-pointer font-bold text-xs"
                    >
                      <Heart className="w-4 h-4 fill-amber-500/15 text-amber-400" />
                      <span>{user.isDonor ? "Apoiar CineReact Novamente" : "Seja um Apoiador VIP"}</span>
                    </button>

                    <button 
                      onClick={handleLogout}
                      className="w-full flex items-center justify-center gap-3 px-5 py-3 bg-red-500/5 hover:bg-red-500/10 border border-red-500/10 hover:border-red-500/20 text-red-400 hover:text-red-300 rounded-2xl transition-all cursor-pointer font-bold text-xs"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sair da Conta</span>
                    </button>
                  </div>
                </ProfileSurface>

                {/* Column 2 & 3: Bento Grid */}
                <div className="lg:col-span-8 flex flex-col gap-8 w-full">
                  <div>
                    <h3 className="text-[11px] uppercase font-mono tracking-widest profile-text-muted mb-4 px-2 font-bold">Menu de Navegação</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <button 
                        onClick={() => { setCurrentTab('inicio'); setShowProfileMenu(false); }}
                        className={`text-left p-5 rounded-2xl border transition-all cursor-pointer group flex flex-col justify-between h-36 ${
                          currentTab === 'inicio' 
                            ? 'bg-amber-500/10 border-amber-500/30 shadow-[0_0_20px_rgba(245,158,11,0.05)]' 
                            : 'bg-zinc-900/30 border-zinc-900 hover:bg-zinc-900/60 hover:border-zinc-800/80'
                        }`}
                      >
                        <div className="flex justify-between items-start w-full">
                          <div className={`p-2.5 rounded-xl ${currentTab === 'inicio' ? 'bg-amber-500/20 text-amber-400' : 'bg-zinc-900 text-zinc-400 group-hover:text-zinc-200'}`}>
                            <Film className="w-5 h-5" />
                          </div>
                          <ChevronRight className={`w-4 h-4 transition-transform group-hover:translate-x-1 ${currentTab === 'inicio' ? 'text-amber-400' : 'text-zinc-600 group-hover:text-zinc-400'}`} />
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-zinc-100 group-hover:text-amber-400 transition-colors">Início / Catálogo</h4>
                          <p className="text-zinc-500 text-[11px] leading-snug mt-1">Explorar catálogo de obras, lançamentos e animes em destaque.</p>
                        </div>
                      </button>

                      <button 
                        onClick={() => { setCurrentTab('club'); setShowProfileMenu(false); onOpenGamification?.(); }}
                        className={`text-left p-5 rounded-2xl border transition-all cursor-pointer group flex flex-col justify-between h-36 ${
                          currentTab === 'club' 
                            ? 'bg-amber-500/10 border-amber-500/30 shadow-[0_0_20px_rgba(245,158,11,0.05)]' 
                            : 'bg-zinc-900/30 border-zinc-900 hover:bg-zinc-900/60 hover:border-zinc-800/80'
                        }`}
                      >
                        <div className="flex justify-between items-start w-full">
                          <div className={`p-2.5 rounded-xl ${currentTab === 'club' ? 'bg-amber-500/20 text-amber-400' : 'bg-zinc-900 text-zinc-400 group-hover:text-zinc-200'}`}>
                            <Trophy className="w-5 h-5" />
                          </div>
                          <ChevronRight className={`w-4 h-4 transition-transform group-hover:translate-x-1 ${currentTab === 'club' ? 'text-amber-400' : 'text-zinc-600 group-hover:text-zinc-400'}`} />
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-zinc-100 group-hover:text-amber-400 transition-colors">CineReact Club</h4>
                          <p className="text-zinc-500 text-[11px] leading-snug mt-1">XP, conquistas, missões, selos, rankings e Loja Spotlight.</p>
                        </div>
                      </button>

                      <button 
                        onClick={() => { setCurrentTab('canais'); setShowProfileMenu(false); }}
                        className={`text-left p-5 rounded-2xl border transition-all cursor-pointer group flex flex-col justify-between h-36 ${
                          currentTab === 'canais' 
                            ? 'bg-amber-500/10 border-amber-500/30 shadow-[0_0_20px_rgba(245,158,11,0.05)]' 
                            : 'bg-zinc-900/30 border-zinc-900 hover:bg-zinc-900/60 hover:border-zinc-800/80'
                        }`}
                      >
                        <div className="flex justify-between items-start w-full">
                          <div className={`p-2.5 rounded-xl ${currentTab === 'canais' ? 'bg-amber-500/20 text-amber-400' : 'bg-zinc-900 text-zinc-400 group-hover:text-zinc-200'}`}>
                            <Play className="w-5 h-5" />
                          </div>
                          <ChevronRight className={`w-4 h-4 transition-transform group-hover:translate-x-1 ${currentTab === 'canais' ? 'text-amber-400' : 'text-zinc-600 group-hover:text-zinc-400'}`} />
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-zinc-100 group-hover:text-amber-400 transition-colors">Canais Seguidos</h4>
                          <p className="text-zinc-500 text-[11px] leading-snug mt-1">Veja atualizações e reacts de canais do YouTube que você segue.</p>
                        </div>
                      </button>

                      <button 
                        onClick={() => { setCurrentTab('categoria-almoco'); setShowProfileMenu(false); }}
                        className={`text-left p-5 rounded-2xl border transition-all cursor-pointer group flex flex-col justify-between h-36 ${
                          currentTab === 'categoria-almoco' 
                            ? 'bg-amber-500/10 border-amber-500/30 shadow-[0_0_20px_rgba(245,158,11,0.05)]' 
                            : 'bg-zinc-900/30 border-zinc-900 hover:bg-zinc-900/60 hover:border-zinc-800/80'
                        }`}
                      >
                        <div className="flex justify-between items-start w-full">
                          <div className={`p-2.5 rounded-xl ${currentTab === 'categoria-almoco' ? 'bg-amber-500/20 text-amber-400' : 'bg-zinc-900 text-zinc-400 group-hover:text-zinc-200'}`}>
                            <UtensilsCrossed className="w-5 h-5" />
                          </div>
                          <ChevronRight className={`w-4 h-4 transition-transform group-hover:translate-x-1 ${currentTab === 'categoria-almoco' ? 'text-amber-400' : 'text-zinc-600 group-hover:text-zinc-400'}`} />
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-zinc-100 group-hover:text-amber-400 transition-colors">Hora do Almoço</h4>
                          <p className="text-zinc-500 text-[11px] leading-snug mt-1">Sorteie um react aleatório para acompanhar no seu almoço.</p>
                        </div>
                      </button>

                      <button 
                        onClick={() => { setCurrentTab('minha-lista'); setShowProfileMenu(false); }}
                        className={`text-left p-5 rounded-2xl border transition-all cursor-pointer group flex flex-col justify-between h-36 ${
                          currentTab === 'minha-lista' 
                            ? 'bg-amber-500/10 border-amber-500/30 shadow-[0_0_20px_rgba(245,158,11,0.05)]' 
                            : 'bg-zinc-900/30 border-zinc-900 hover:bg-zinc-900/60 hover:border-zinc-800/80'
                        }`}
                      >
                        <div className="flex justify-between items-start w-full">
                          <div className={`p-2.5 rounded-xl ${currentTab === 'minha-lista' ? 'bg-amber-500/20 text-amber-400' : 'bg-zinc-900 text-zinc-400 group-hover:text-zinc-200'}`}>
                            <Bookmark className="w-5 h-5" />
                          </div>
                          <ChevronRight className={`w-4 h-4 transition-transform group-hover:translate-x-1 ${currentTab === 'minha-lista' ? 'text-amber-400' : 'text-zinc-600 group-hover:text-zinc-400'}`} />
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-zinc-100 group-hover:text-amber-400 transition-colors">Meus Favoritos</h4>
                          <p className="text-zinc-500 text-[11px] leading-snug mt-1">Sua coleção de reacts salvos, obras favoritas e histórico.</p>
                        </div>
                      </button>

                      <button 
                        onClick={() => { setCurrentTab('configuracoes'); setShowProfileMenu(false); }}
                        className={`text-left p-5 rounded-2xl border transition-all cursor-pointer group flex flex-col justify-between h-36 ${
                          currentTab === 'configuracoes' 
                            ? 'bg-amber-500/10 border-amber-500/30 shadow-[0_0_20px_rgba(245,158,11,0.05)]' 
                            : 'bg-zinc-900/30 border-zinc-900 hover:bg-zinc-900/60 hover:border-zinc-800/80'
                        }`}
                      >
                        <div className="flex justify-between items-start w-full">
                          <div className={`p-2.5 rounded-xl ${currentTab === 'configuracoes' ? 'bg-amber-500/20 text-amber-400' : 'bg-zinc-900 text-zinc-400 group-hover:text-zinc-200'}`}>
                            <Settings className="w-5 h-5" />
                          </div>
                          <ChevronRight className={`w-4 h-4 transition-transform group-hover:translate-x-1 ${currentTab === 'configuracoes' ? 'text-amber-400' : 'text-zinc-600 group-hover:text-zinc-400'}`} />
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-zinc-100 group-hover:text-amber-400 transition-colors">Configurações</h4>
                          <p className="text-zinc-500 text-[11px] leading-snug mt-1">Gerencie seu perfil, apelido de membro e altere sua senha com segurança.</p>
                        </div>
                      </button>

                      <button 
                        onClick={() => { setCurrentTab('doacoes'); setShowProfileMenu(false); }}
                        className={`text-left p-5 rounded-2xl border transition-all cursor-pointer group flex flex-col justify-between h-36 ${
                          currentTab === 'doacoes' 
                            ? 'bg-amber-500/10 border-amber-500/30 shadow-[0_0_20px_rgba(245,158,11,0.05)]' 
                            : 'bg-zinc-900/30 border-zinc-900 hover:bg-zinc-900/60 hover:border-zinc-800/80'
                        }`}
                      >
                        <div className="flex justify-between items-start w-full">
                          <div className={`p-2.5 rounded-xl ${currentTab === 'doacoes' ? 'bg-amber-500/20 text-amber-400' : 'bg-zinc-900 text-zinc-400 group-hover:text-amber-400'}`}>
                            <Heart className="w-5 h-5" />
                          </div>
                          <ChevronRight className={`w-4 h-4 transition-transform group-hover:translate-x-1 ${currentTab === 'doacoes' ? 'text-amber-400' : 'text-zinc-600 group-hover:text-amber-400'}`} />
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-zinc-100 group-hover:text-amber-400 transition-colors">Apoiar o Canal (Doações)</h4>
                          <p className="text-zinc-500 text-[11px] leading-snug mt-1">Faça uma doação PIX para apoiar o CineReact e ganhe benefícios exclusivos de VIP.</p>
                        </div>
                      </button>

                      {user.isAdmin && (
                        <button 
                          onClick={() => { setCurrentTab('admin'); setShowProfileMenu(false); }}
                          className={`text-left p-5 rounded-2xl border transition-all cursor-pointer group flex flex-col justify-between h-36 ${
                            currentTab === 'admin' 
                              ? 'bg-amber-500/20 border-amber-500/40 shadow-[0_0_20px_rgba(245,158,11,0.1)]' 
                              : 'bg-amber-950/20 border-amber-500/30 hover:bg-amber-900/40 hover:border-amber-500/50'
                          }`}
                        >
                          <div className="flex justify-between items-start w-full">
                            <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400">
                              <ShieldAlert className="w-5 h-5" />
                            </div>
                            <ChevronRight className="w-4 h-4 text-amber-400 transition-transform group-hover:translate-x-1" />
                          </div>
                          <div>
                            <h4 className="font-bold text-sm text-amber-300 group-hover:text-amber-200 transition-colors">Painel Admin</h4>
                            <p className="text-zinc-400 text-[11px] leading-snug mt-1">Gerenciar catálogo de obras, cadastrar canais e sincronizar sistema.</p>
                          </div>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Creator Request Box */}
                  <div className="bg-zinc-900/20 border border-zinc-850 p-6 rounded-3xl mt-2 relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl">
                    <div className="space-y-1.5 flex-1 max-w-xl">
                      <div className="flex items-center gap-1.5 text-xs text-amber-400 font-extrabold tracking-wide uppercase"><Youtube className="w-4.5 h-4.5 text-amber-400" /> Seja um Criador de Reacts</div>
                      <h4 className="text-base font-black text-white">Seu canal não está listado no catálogo?</h4>
                      <p className="text-xs text-zinc-400 leading-relaxed">Envie uma solicitação de inclusão para nossa equipe! Cadastramos e sincronizamos todos os seus reacts com o player oficial do YouTube para gerar mais visualizações.</p>
                    </div>
                    <button 
                      onClick={() => setShowRequestModal(true)}
                      className="px-5 py-3.5 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black font-black text-xs rounded-2xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-amber-500/20 active:scale-[0.98]"
                    >
                      <Send className="w-3.5 h-3.5" />
                      Solicitar Cadastro
                    </button>
                  </div>
                </div>

              </div>
            ) : (
              <div className="max-w-md w-full mx-auto px-6 py-24 text-center space-y-6">
                <div className="w-16 h-16 rounded-3xl bg-zinc-900 border border-zinc-850 flex items-center justify-center mx-auto text-zinc-500">
                  <User className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-white">Acesse sua conta para ver o Painel</h3>
                <p className="text-xs text-zinc-500 leading-relaxed">Faça login para gerenciar seu perfil, conferir notificações, e ter acesso total às suas listas e canais favoritos.</p>
                <button 
                  onClick={() => { setShowProfileMenu(false); onOpenAuth?.('login'); }}
                  className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black font-black text-xs rounded-xl cursor-pointer"
                >
                  Entrar na Conta
                </button>
              </div>
            )}
            </ProfileThemeScope>
          </motion.div>
        )}
      </AnimatePresence>

      {/* REQUEST CANAL INCLUSION MODAL */}
      <AnimatePresence>
        {showRequestModal && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowRequestModal(false)}
              className="absolute inset-0 bg-black/90 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-md bg-zinc-950 border border-zinc-900 rounded-2xl p-6.5 shadow-2xl overflow-hidden text-zinc-300 z-10 space-y-5"
            >
              <div className="flex justify-between items-center border-b border-zinc-900 pb-3">
                <h3 className="font-extrabold text-sm text-white uppercase tracking-wider flex items-center gap-2"><Youtube className="w-5 h-5 text-amber-400" /> Solicitar Canal</h3>
                <button onClick={() => setShowRequestModal(false)} className="text-zinc-500 hover:text-white"><X className="w-4 h-4" /></button>
              </div>

              <form onSubmit={handleRequestSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block text-zinc-400 font-bold mb-1">Nome do Canal*</label>
                  <input type="text" required value={canalNome} onChange={(e) => setCanalNome(e.target.value)} placeholder="ex: @casimiro" className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-white outline-none focus:border-amber-500" />
                </div>
                <div>
                  <label className="block text-zinc-400 font-bold mb-1">URL do Canal (YouTube)*</label>
                  <input type="url" required value={canalUrl} onChange={(e) => setCanalUrl(e.target.value)} placeholder="https://www.youtube.com/@..." className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-white outline-none focus:border-amber-500" />
                </div>
                <div>
                  <label className="block text-zinc-400 font-bold mb-1">Seu E-mail de Contato*</label>
                  <input type="email" required value={emailContato} onChange={(e) => setEmailContato(e.target.value)} placeholder="contato@criador.com" className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-white outline-none focus:border-amber-500" />
                </div>

                {errorMsg && <p className="text-red-400 font-bold text-[11px]">{errorMsg}</p>}
                {successMsg && <p className="text-emerald-400 font-bold text-[11px]">{successMsg}</p>}

                <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black font-black py-3 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 cursor-pointer">
                  {loading ? 'Sincronizando...' : 'Enviar Solicitação Oficial'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
