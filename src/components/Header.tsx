import React, { lazy, Suspense, useState, useEffect } from 'react';
import { Bell, Play, User, Check, X, Youtube, Heart } from 'lucide-react';
import { UserState, Notificacao } from '../types.ts';
import { motion, AnimatePresence } from 'motion/react';
import CineReactLogo from './CineReactLogo.tsx';
import SideNavToggleButton from './SideNavToggleButton.tsx';
import GamificationBar from './GamificationBar.tsx';
import ProfileAvatar from './profile/ProfileAvatar.tsx';
import type { GamificationMeResponse } from '../types/gamification.ts';

const ProfilePanel = lazy(() => import('./profile/ProfilePanel.tsx'));

interface HeaderProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  user: UserState;
  setUser: (user: UserState) => void;
  onOpenAuth?: (mode: 'login' | 'register') => void;
  hasSideNav?: boolean;
  gamificationData?: GamificationMeResponse | null;
  onOpenGamification?: () => void;
}

export default function Header({
  currentTab,
  setCurrentTab,
  user,
  setUser,
  onOpenAuth,
  hasSideNav = false,
  gamificationData = null,
  onOpenGamification,
}: HeaderProps) {
  const [scrolled, setScrolled] = useState(false);
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
            ? 'bg-cine-bg/92 max-md:backdrop-blur-none md:bg-cine-bg/88 md:backdrop-blur-md border-b border-cine-border/70 shadow-lg shadow-black/30' 
            : 'bg-cine-bg/72 max-md:backdrop-blur-none md:bg-cine-bg/50 md:backdrop-blur-sm border-b border-cine-border/45'
        }`}
      >
        <div className="cine-container w-full">
          <div className="flex min-h-16 items-center justify-between gap-4 py-1.5">
            <div className="flex items-center gap-3 lg:gap-6 flex-1 min-w-0">
              <button 
                id="logo-button"
                onClick={() => setCurrentTab('inicio')}
                className="group focus:outline-none cursor-pointer py-1 shrink-0"
              >
                <CineReactLogo size="sm" className="transition-transform duration-300 group-hover:-translate-y-0.5" />
              </button>

              {/* DESKTOP NAV */}
              <nav className="hidden md:flex items-center gap-1.5 text-xs lg:text-[13px] font-semibold text-zinc-400 min-w-0">
                <button 
                  id="nav-inicio"
                  onClick={() => setCurrentTab('inicio')} 
                  className={`px-3 py-1.5 rounded-full transition-all duration-200 cursor-pointer ${
                    currentTab === 'inicio' 
                      ? 'text-white bg-neutral-900 shadow-sm border border-neutral-800/60' 
                      : 'hover:text-zinc-200 hover:bg-neutral-900/30'
                  }`}
                >
                  Início
                </button>
                <button 
                  id="nav-canais"
                  onClick={() => setCurrentTab('canais')} 
                  className={`px-3 py-1.5 rounded-full transition-all duration-200 cursor-pointer ${
                    currentTab === 'canais' 
                      ? 'text-white bg-neutral-900 shadow-sm border border-neutral-800/60' 
                      : 'hover:text-zinc-200 hover:bg-neutral-900/30'
                  }`}
                >
                  Canais Seguidos
                </button>
                <button 
                  id="nav-minha-lista"
                  onClick={() => setCurrentTab('minha-lista')} 
                  className={`px-3 py-1.5 rounded-full transition-all duration-200 cursor-pointer ${
                    currentTab === 'minha-lista' 
                      ? 'text-white bg-neutral-900 shadow-sm border border-neutral-800/60' 
                      : 'hover:text-zinc-200 hover:bg-neutral-900/30'
                  }`}
                >
                  Minha Lista
                </button>
                
                <button 
                  id="nav-download-logo"
                  onClick={() => setCurrentTab('download-logo')} 
                  className={`px-3 py-1.5 rounded-full transition-all duration-200 cursor-pointer ${
                    currentTab === 'download-logo' 
                      ? 'text-white bg-neutral-900 shadow-sm border border-neutral-800/60' 
                      : 'hover:text-zinc-200 hover:bg-neutral-900/30'
                  }`}
                >
                  Baixar Logo
                </button>

                {/* APOIADOR HIGHLIGHT */}
                <button 
                  id="nav-doacoes"
                  onClick={() => setCurrentTab('doacoes')} 
                  className={`ml-1 px-3 py-1.5 rounded-full transition-all duration-200 flex items-center gap-1.5 text-xs font-bold border cursor-pointer ${
                    currentTab === 'doacoes' 
                      ? 'bg-cine-accent/15 text-cine-accent-light border-cine-accent/30 shadow-lg shadow-cine-surface/10' 
                      : 'border-neutral-800 bg-neutral-900/40 text-cine-accent-light hover:bg-cine-accent hover:text-white hover:border-cine-accent-light'
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
                    className={`ml-1 px-3 py-1.5 rounded-full transition-all duration-200 text-xs font-bold border border-cine-accent/30 text-cine-accent-light bg-cine-accent/10 hover:bg-cine-accent hover:text-white hover:border-cine-accent-light cursor-pointer`}
                  >
                    Painel Admin
                  </button>
                )}
              </nav>
            </div>

            {/* RIGHT SECTION: Controls */}
            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">

              {/* BELL */}
              <div className="relative">
                <button 
                  id="notification-toggle" 
                  onClick={() => {
                    setShowNotifications(!showNotifications);
                    setShowProfileMenu(false);
                  }} 
                  className={`p-2 text-zinc-400 hover:text-white rounded-lg transition-all duration-200 ${
                    showNotifications ? 'bg-neutral-900 text-white border border-neutral-800/80' : 'hover:bg-neutral-900/40 border border-transparent'
                  }`}
                >
                  <Bell className="w-4.5 h-4.5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-cine-accent-light rounded-full ring-2 ring-cine-bg animate-pulse" />
                  )}
                </button>

                <AnimatePresence>
                  {showNotifications && (
                    <motion.div 
                      initial={{ opacity: 0, y: 12, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 12, scale: 0.97 }}
                      transition={{ duration: 0.15, ease: 'easeOut' }}
                      className="fixed md:absolute top-[4.5rem] md:top-12 left-4 md:left-auto right-4 md:right-0 w-auto max-w-[calc(100vw-32px)] md:w-96 bg-cine-surface/98 backdrop-blur-2xl border border-cine-border/90 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.6)] overflow-hidden z-50 divide-y divide-cine-border/50"
                    >
                      <div className="px-4 py-3.5 flex justify-between items-center bg-neutral-900/20">
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

                      <div className="max-h-80 overflow-y-auto divide-y divide-neutral-900/40 scrollbar-thin scrollbar-track-neutral-950 scrollbar-thumb-neutral-800">
                        {notifications.length === 0 ? (
                          <div className="py-12 px-4 flex flex-col items-center justify-center text-center">
                            <div className="w-10 h-10 rounded-full bg-neutral-900/50 flex items-center justify-center border border-neutral-800/40 mb-3 animate-pulse">
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
                                    : 'bg-transparent hover:bg-neutral-900/30'
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
                                    <div className="w-7 h-7 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center">
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
                                    className="text-zinc-500 hover:text-cine-accent-light self-center p-1.5 rounded-lg hover:bg-neutral-900 transition-all border border-transparent hover:border-neutral-800 flex-shrink-0"
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

              <SideNavToggleButton visible={hasSideNav} />

              {/* USER PROFILE */}
              <div className="relative">
                <button 
                  id="profile-toggle"
                  onClick={() => {
                    setShowProfileMenu(!showProfileMenu);
                    setShowNotifications(false);
                  }} 
                  className={`flex items-center gap-2 p-1 rounded-full transition-all focus:outline-none ${
                    showProfileMenu ? 'bg-neutral-900 ring-1 ring-neutral-800/80 shadow-inner' : 'hover:bg-neutral-900/40'
                  }`}
                >
                  {user.isLoggedIn ? (
                    <ProfileAvatar
                      photoUrl={user.avatar}
                      alt={user.nome}
                      size="sm"
                      loadout={gamificationData?.profile.loadout}
                      isDonor={!!user.isDonor}
                    />
                  ) : (
                    <div className="w-7.5 h-7.5 rounded-full bg-neutral-900 border border-neutral-800/80 flex items-center justify-center text-zinc-400 hover:text-zinc-200 hover:bg-neutral-800/50 transition-all shadow-inner">
                      <User className="w-3.5 h-3.5" />
                    </div>
                  )}
                </button>
              </div>

            </div>
          </div>
        </div>


      </header>

      {/* FULL-SCREEN PROFILE PANEL */}
      <AnimatePresence>
        {showProfileMenu && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[100] overflow-hidden flex flex-col bg-neutral-950"
          >
            <Suspense fallback={<div className="flex-1 min-h-0 bg-neutral-950" aria-hidden />}>
              <div className="flex flex-col flex-1 min-h-0 h-full w-full">
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
                  onUpdateUser={setUser}
                />
              </div>
            </Suspense>
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
              className="relative w-full max-w-md bg-neutral-950 border border-neutral-900 rounded-2xl p-6.5 shadow-2xl overflow-hidden text-zinc-300 z-10 space-y-5"
            >
              <div className="flex justify-between items-center border-b border-neutral-900 pb-3">
                <h3 className="font-extrabold text-sm text-white uppercase tracking-wider flex items-center gap-2"><Youtube className="w-5 h-5 text-cine-accent-light" /> Solicitar Canal</h3>
                <button onClick={() => setShowRequestModal(false)} className="text-zinc-500 hover:text-white"><X className="w-4 h-4" /></button>
              </div>

              <form onSubmit={handleRequestSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block text-zinc-400 font-bold mb-1">Nome do Canal*</label>
                  <input type="text" required value={canalNome} onChange={(e) => setCanalNome(e.target.value)} placeholder="ex: @casimiro" className="w-full bg-neutral-900 border border-neutral-800 rounded-xl p-3 text-white outline-none focus:border-cine-accent" />
                </div>
                <div>
                  <label className="block text-zinc-400 font-bold mb-1">URL do Canal (YouTube)*</label>
                  <input type="url" required value={canalUrl} onChange={(e) => setCanalUrl(e.target.value)} placeholder="https://www.youtube.com/@..." className="w-full bg-neutral-900 border border-neutral-800 rounded-xl p-3 text-white outline-none focus:border-cine-accent" />
                </div>
                <div>
                  <label className="block text-zinc-400 font-bold mb-1">Seu E-mail de Contato*</label>
                  <input type="email" required value={emailContato} onChange={(e) => setEmailContato(e.target.value)} placeholder="contato@criador.com" className="w-full bg-neutral-900 border border-neutral-800 rounded-xl p-3 text-white outline-none focus:border-cine-accent" />
                </div>

                {errorMsg && <p className="text-red-400 font-bold text-[11px]">{errorMsg}</p>}
                {successMsg && <p className="text-emerald-400 font-bold text-[11px]">{successMsg}</p>}

                <button type="submit" disabled={loading} className="w-full bg-cine-accent hover:bg-cine-accent-dark text-white font-black py-3 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-cine-accent/20 cursor-pointer">
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
