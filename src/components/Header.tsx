import React, { lazy, Suspense, useState, useEffect } from 'react';
import { Heart, User, X, Youtube } from 'lucide-react';
import HeaderNotificationButton from './header/HeaderNotificationButton.tsx';
import HeaderClipsButton from './header/HeaderClipsButton.tsx';
import NotificationPanel from './header/NotificationPanel.tsx';
import { useNotifications } from '../hooks/useNotifications.ts';
import { UserState } from '../types.ts';
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
  onOpenCineClips?: () => void;
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
  onOpenCineClips,
}: HeaderProps) {
  const [scrolled, setScrolled] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const {
    notifications,
    unreadCount,
    loading: notificationsLoading,
    markAsRead,
    markAllAsRead,
    clearNotifications,
  } = useNotifications({
    email: user.email,
    isOpen: showNotifications,
  });

  // Solicitar adição de canal states
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [canalNome, setCanalNome] = useState('');
  const [canalUrl, setCanalUrl] = useState('');
  const [emailContato, setEmailContato] = useState(user.email || '');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const isCineClipsActive =
    currentTab === 'cineclips' || currentTab.startsWith('cineclips-hashtag-');

  const openCineClips = () => {
    if (onOpenCineClips) {
      onOpenCineClips();
      return;
    }
    setCurrentTab('cineclips');
  };

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

  const handleLogout = () => {
    setUser({
      isLoggedIn: false,
      nome: "",
      email: ""
    });
    setCurrentTab('inicio');
    setShowProfileMenu(false);
  };

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
                <CineReactLogo
                  size="sm"
                  className="transition-transform duration-300 group-hover:-translate-y-0.5"
                />
              </button>

              {/* DESKTOP NAV */}
              <nav className="hidden md:flex items-center gap-1.5 text-xs lg:text-[13px] font-semibold text-zinc-400 min-w-0">
                <HeaderClipsButton active={isCineClipsActive} onClick={openCineClips} />
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
                  id="nav-minutagem"
                  onClick={() => setCurrentTab('minutagem')} 
                  className={`px-3 py-1.5 rounded-full transition-all duration-200 cursor-pointer ${
                    currentTab === 'minutagem' 
                      ? 'text-white bg-neutral-900 shadow-sm border border-neutral-800/60' 
                      : 'hover:text-zinc-200 hover:bg-neutral-900/30'
                  }`}
                >
                  Minutagem
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
            <div className="flex items-center gap-2 sm:gap-2.5 flex-shrink-0">
              <HeaderClipsButton
                id="nav-cineclips-mobile"
                variant="icon"
                active={isCineClipsActive}
                onClick={openCineClips}
                className="md:hidden"
              />

              <div className="relative">
                <HeaderNotificationButton
                  active={showNotifications}
                  unreadCount={unreadCount}
                  onClick={() => {
                    setShowNotifications(!showNotifications);
                    setShowProfileMenu(false);
                  }}
                />

                <NotificationPanel
                  open={showNotifications}
                  notifications={notifications}
                  unreadCount={unreadCount}
                  loading={notificationsLoading}
                  onClose={() => setShowNotifications(false)}
                  onMarkAsRead={markAsRead}
                  onMarkAllAsRead={markAllAsRead}
                  onClearAll={clearNotifications}
                />
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
            className="fixed inset-0 z-[100] overflow-y-auto overscroll-y-contain flex flex-col bg-neutral-950 touch-pan-y"
          >
            <Suspense fallback={<div className="min-h-dvh bg-neutral-950" aria-hidden />}>
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
