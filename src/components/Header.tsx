import React, { useState, useEffect } from 'react';
import { Search, Bell, Play, User, Check, Menu, X, Youtube, Send, Heart, Sparkles, CreditCard, Download } from 'lucide-react';
import { UserState, Notificacao, Obra, ReactVideo } from '../types.ts';
import { motion, AnimatePresence } from 'motion/react';
import OptimizedImage from './OptimizedImage.tsx';
import CineReactLogo from './CineReactLogo.tsx';
import SideNavToggleButton from './SideNavToggleButton.tsx';
import GamificationBar from './GamificationBar.tsx';
import ProfilePanel from './profile/ProfilePanel.tsx';
import ProfileAvatar from './profile/ProfileAvatar.tsx';
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

  useEffect(() => {
    if (!showProfileMenu || typeof document === 'undefined') return;

    const { body, documentElement } = document;
    const scrollY = window.scrollY;
    const previousBodyOverflow = body.style.overflow;
    const previousHtmlOverflow = documentElement.style.overflow;
    const previousBodyPosition = body.style.position;
    const previousBodyTop = body.style.top;
    const previousBodyWidth = body.style.width;

    body.style.overflow = 'hidden';
    documentElement.style.overflow = 'hidden';
    body.style.position = 'fixed';
    body.style.top = `-${scrollY}px`;
    body.style.width = '100%';

    return () => {
      body.style.overflow = previousBodyOverflow;
      documentElement.style.overflow = previousHtmlOverflow;
      body.style.position = previousBodyPosition;
      body.style.top = previousBodyTop;
      body.style.width = previousBodyWidth;
      window.scrollTo(0, scrollY);
    };
  }, [showProfileMenu]);

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
                      ? 'bg-cine-accent/15 text-cine-accent-light border-cine-accent/30 shadow-lg shadow-cine-surface/10' 
                      : 'border-zinc-800 bg-zinc-900/40 text-cine-accent-light hover:bg-cine-accent hover:text-black hover:border-cine-accent-light'
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
                    className={`ml-1 px-3 py-1.5 rounded-full transition-all duration-200 text-xs font-bold border border-cine-accent/30 text-cine-accent-light bg-cine-accent/10 hover:bg-cine-accent hover:text-black hover:border-cine-accent-light cursor-pointer`}
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
                  className="w-full bg-zinc-900/50 hover:bg-zinc-900/80 focus:bg-zinc-900 border border-zinc-800/80 focus:border-cine-accent/80 focus:ring-1 focus:ring-cine-accent/40 rounded-xl py-1.5 pl-9 pr-8 text-xs text-zinc-200 placeholder-zinc-500 outline-none transition-all duration-200"
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
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cine-accent/10 hover:bg-cine-accent text-cine-accent-light hover:text-black border border-cine-accent/30 hover:border-cine-accent-light text-xs font-extrabold transition-all duration-200 cursor-pointer shadow-sm active:scale-95 shrink-0"
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
                      {searching && <span className="w-2.5 h-2.5 border border-cine-accent-light border-t-transparent rounded-full animate-spin" />}
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
                            <h4 className="text-xs font-semibold text-zinc-200 group-hover:text-cine-accent-light transition-colors truncate leading-tight">{obra.titulo}</h4>
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
                                        <span key={idx} className="text-[9px] text-cine-accent-light font-semibold truncate bg-cine-accent/10 px-1 rounded border border-cine-accent/20">
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
                      className="w-full text-center py-2 text-xs text-cine-accent-light font-bold hover:text-cine-cream transition-colors mt-1.5 pt-2 border-t border-zinc-900/60"
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
                className="p-2 text-cine-accent-light hover:text-cine-cream bg-cine-accent/10 hover:bg-cine-accent/20 border border-cine-accent/30 rounded-lg sm:hidden transition-colors cursor-pointer flex items-center justify-center shrink-0"
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
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-cine-accent-light rounded-full ring-2 ring-zinc-950 animate-pulse" />
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
                            <span className="px-2 py-0.5 text-[9px] bg-cine-accent/10 border border-cine-accent/20 text-cine-accent-light font-bold rounded-full font-mono">
                              {unreadCount} novas
                            </span>
                          )}
                        </div>
                        {notifications.length > 0 && (
                          <button 
                            onClick={clearNotifications} 
                            className="text-[10px] text-zinc-500 hover:text-cine-accent-light transition-all font-semibold hover:underline"
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
                                    ? 'bg-cine-surface/10 hover:bg-cine-surface/20' 
                                    : 'bg-transparent hover:bg-zinc-900/30'
                                }`}
                              >
                                {isUnread && (
                                  <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-cine-accent" />
                                )}

                                <div className="flex-shrink-0 mt-0.5">
                                  {isApoio ? (
                                    <div className="w-7 h-7 rounded-full bg-cine-accent/10 border border-cine-accent/20 flex items-center justify-center">
                                      <Heart className="w-3.5 h-3.5 text-cine-accent-light fill-current" />
                                    </div>
                                  ) : isNewReact ? (
                                    <div className="w-7 h-7 rounded-full bg-cine-accent/10 border border-cine-accent/20 flex items-center justify-center">
                                      <Play className="w-3.5 h-3.5 text-cine-accent-light fill-current ml-0.5" />
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
                                    className="text-zinc-500 hover:text-cine-accent-light self-center p-1.5 rounded-lg hover:bg-zinc-900 transition-all border border-transparent hover:border-zinc-800 flex-shrink-0"
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
                  className="w-full bg-zinc-900/80 border border-zinc-800 rounded-xl py-2 pl-9 pr-8 text-xs text-zinc-200 outline-none focus:border-cine-accent"
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
            className="fixed inset-0 z-[100] overflow-y-auto overscroll-y-contain flex flex-col bg-zinc-950 touch-pan-y"
          >
            <ProfilePanel
              user={user}
              currentTab={currentTab}
              gamificationData={gamificationData}
              onClose={() => setShowProfileMenu(false)}
              onNavigate={setCurrentTab}
              onOpenGamification={onOpenGamification}
              onLogout={handleLogout}
              onOpenAuth={onOpenAuth}
              onRequestCreator={() => setShowRequestModal(true)}
            />
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
                <h3 className="font-extrabold text-sm text-white uppercase tracking-wider flex items-center gap-2"><Youtube className="w-5 h-5 text-cine-accent-light" /> Solicitar Canal</h3>
                <button onClick={() => setShowRequestModal(false)} className="text-zinc-500 hover:text-white"><X className="w-4 h-4" /></button>
              </div>

              <form onSubmit={handleRequestSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block text-zinc-400 font-bold mb-1">Nome do Canal*</label>
                  <input type="text" required value={canalNome} onChange={(e) => setCanalNome(e.target.value)} placeholder="ex: @casimiro" className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-white outline-none focus:border-cine-accent" />
                </div>
                <div>
                  <label className="block text-zinc-400 font-bold mb-1">URL do Canal (YouTube)*</label>
                  <input type="url" required value={canalUrl} onChange={(e) => setCanalUrl(e.target.value)} placeholder="https://www.youtube.com/@..." className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-white outline-none focus:border-cine-accent" />
                </div>
                <div>
                  <label className="block text-zinc-400 font-bold mb-1">Seu E-mail de Contato*</label>
                  <input type="email" required value={emailContato} onChange={(e) => setEmailContato(e.target.value)} placeholder="contato@criador.com" className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-white outline-none focus:border-cine-accent" />
                </div>

                {errorMsg && <p className="text-red-400 font-bold text-[11px]">{errorMsg}</p>}
                {successMsg && <p className="text-emerald-400 font-bold text-[11px]">{successMsg}</p>}

                <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-cine-accent-light to-cine-accent hover:from-cine-cream hover:to-cine-accent-light text-black font-black py-3 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-cine-accent/20 cursor-pointer">
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
