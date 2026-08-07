import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { apiFetch } from '../utils/apiClient.ts';
import {
  X,
  Film,
  Bookmark,
  Heart,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  FileText,
  Lock,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import CineReactLogo from './CineReactLogo.tsx';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (user: unknown, isNewUser?: boolean) => void;
  initialMode?: 'login' | 'register';
  initialInfoMessage?: string | null;
}

const DISCORD_SECURITY_MESSAGE =
  'Utilizamos exclusivamente o login com Discord para oferecer um acesso mais seguro e simplificado. Dessa forma, reduzimos riscos relacionados à autenticação e garantimos uma experiência mais prática e confiável para todos os usuários.';

const OAUTH_TERMS_COOKIE = 'cinereact_oauth_terms';

const benefits = [
  { icon: Film, text: 'Assista a todos os reacts do catálogo' },
  { icon: Bookmark, text: 'Salve favoritos e crie listas personalizadas' },
  { icon: Heart, text: 'Envie Energia da Plateia aos criadores' },
  { icon: ShieldCheck, text: 'Sincronize seu progresso em qualquer dispositivo' },
];

function setOAuthTermsCookie(): void {
  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${OAUTH_TERMS_COOKIE}=1; path=/; max-age=900; SameSite=Lax${secure}`;
}

export default function AuthModal({
  isOpen,
  onClose,
  initialInfoMessage = null,
}: AuthModalProps) {
  const [errorMsg, setErrorMsg] = useState('');
  const [infoMsg, setInfoMsg] = useState('');
  const [discordOAuthEnabled, setDiscordOAuthEnabled] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [legalModal, setLegalModal] = useState<'terms' | 'privacy' | null>(null);

  const modalContentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    setErrorMsg('');
    setInfoMsg(initialInfoMessage || '');
    setAcceptedTerms(false);
    setLegalModal(null);

    apiFetch('/api/auth/oauth/setup')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setDiscordOAuthEnabled(!!data?.discordOAuthEnabled))
      .catch(() => setDiscordOAuthEnabled(false));
  }, [isOpen, initialInfoMessage]);

  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (legalModal) setLegalModal(null);
        else onClose();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose, legalModal]);

  useEffect(() => {
    if (!isOpen || typeof document === 'undefined') return;

    const scrollY = window.scrollY;
    const { body, documentElement } = document;
    const previousBodyOverflow = body.style.overflow;
    const previousHtmlOverflow = documentElement.style.overflow;
    const previousBodyPosition = body.style.position;
    const previousBodyTop = body.style.top;
    const previousBodyLeft = body.style.left;
    const previousBodyRight = body.style.right;
    const previousBodyWidth = body.style.width;

    body.style.overflow = 'hidden';
    documentElement.style.overflow = 'hidden';
    body.style.position = 'fixed';
    body.style.top = `-${scrollY}px`;
    body.style.left = '0';
    body.style.right = '0';
    body.style.width = '100%';

    const preventBackgroundTouchMove = (event: TouchEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (modalContentRef.current?.contains(target)) return;
      event.preventDefault();
    };

    document.addEventListener('touchmove', preventBackgroundTouchMove, { passive: false });

    return () => {
      document.removeEventListener('touchmove', preventBackgroundTouchMove);
      body.style.overflow = previousBodyOverflow;
      documentElement.style.overflow = previousHtmlOverflow;
      body.style.position = previousBodyPosition;
      body.style.top = previousBodyTop;
      body.style.left = previousBodyLeft;
      body.style.right = previousBodyRight;
      body.style.width = previousBodyWidth;
      window.scrollTo(0, scrollY);
    };
  }, [isOpen]);

  const handleDiscordLogin = () => {
    if (!acceptedTerms) {
      setErrorMsg('Para continuar, aceite os Termos de Uso e a Política de Privacidade.');
      return;
    }
    setErrorMsg('');
    setOAuthTermsCookie();
    window.location.href = '/api/auth/oauth/discord';
  };

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[230] overscroll-none"
          role="dialog"
          aria-modal="true"
          aria-labelledby="auth-modal-title"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black"
          />

          <motion.div
            ref={modalContentRef}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className="relative h-[100dvh] w-full overflow-y-auto overscroll-y-contain touch-pan-y bg-neutral-950 text-zinc-300"
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-10 text-zinc-500 hover:text-white p-2 rounded-full hover:bg-neutral-900 transition-colors cursor-pointer"
              aria-label="Fechar"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="grid grid-cols-1 md:grid-cols-5 min-h-full">
              <div className="hidden md:flex md:col-span-2 flex-col justify-between p-8 bg-gradient-to-br from-neutral-900 via-neutral-950 to-black border-r border-neutral-800/80 relative overflow-hidden">
                <div className="absolute -top-20 -right-20 w-48 h-48 bg-cine-accent/10 rounded-full blur-3xl pointer-events-none" />
                <div className="relative z-10 space-y-8">
                  <CineReactLogo size="xl" animated heading />
                  <div>
                    <h3 className="text-lg font-black text-white leading-snug">
                      Sua conta no maior portal de reacts do Brasil
                    </h3>
                    <p className="text-xs text-zinc-500 mt-2 leading-relaxed">
                      Grátis para sempre. Entre com Discord.
                    </p>
                  </div>
                  <ul className="space-y-3">
                    {benefits.map(({ icon: Icon, text }) => (
                      <li key={text} className="flex items-start gap-2.5 text-xs text-zinc-400">
                        <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-cine-accent/10 border border-cine-accent/20">
                          <Icon className="w-3.5 h-3.5 text-cine-accent-light" />
                        </span>
                        {text}
                      </li>
                    ))}
                  </ul>
                </div>
                <p className="relative z-10 text-[10px] text-zinc-600 leading-relaxed">
                  Login seguro via Discord. Coletamos e-mail e perfil público do Discord para criar sua conta.
                </p>
              </div>

              <div className="md:col-span-3 p-6 sm:p-8 pb-[max(1.5rem,env(safe-area-inset-bottom))] min-h-[100dvh] md:min-h-full flex flex-col justify-center max-w-lg md:max-w-none mx-auto w-full">
                <div className="flex justify-center w-full mb-6 md:mb-8">
                  <CineReactLogo size="lg" align="center" animated showTagline />
                </div>

                <div className="text-center mb-6">
                  <div className="inline-flex items-center px-3 py-1 rounded-full bg-cine-accent/10 border border-cine-accent/20 text-cine-accent-light text-[10px] font-bold tracking-wider uppercase mb-3">
                    Acesso gratuito
                  </div>
                  <h2 id="auth-modal-title" className="text-xl sm:text-2xl font-black text-white tracking-tight">
                    Entrar no CineReact
                  </h2>
                  <p className="text-xs sm:text-sm text-zinc-500 mt-1.5 leading-relaxed">
                    Use sua conta Discord para assistir reacts, salvar favoritos e apoiar criadores.
                  </p>
                </div>

                <div className="mb-5 p-4 rounded-xl bg-neutral-900/70 border border-neutral-800 text-xs sm:text-sm text-zinc-400 leading-relaxed">
                  {DISCORD_SECURITY_MESSAGE}
                </div>

                <AnimatePresence mode="wait">
                  {errorMsg && (
                    <motion.div
                      key="error"
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      className="bg-neutral-900/95 border border-cine-accent/30 text-zinc-100 p-3.5 rounded-xl text-sm mb-4 flex items-start gap-2.5"
                    >
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-cine-accent-light" />
                      <span>{errorMsg}</span>
                    </motion.div>
                  )}
                  {infoMsg && !errorMsg && (
                    <motion.div
                      key="info"
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      className="bg-cine-surface/40 border border-cine-accent/30 text-cine-cream p-3 rounded-xl text-xs font-medium mb-4 flex items-start gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{infoMsg}</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                <label className="flex items-start gap-3 mb-5 cursor-pointer select-none group">
                  <input
                    type="checkbox"
                    checked={acceptedTerms}
                    onChange={(e) => {
                      setAcceptedTerms(e.target.checked);
                      if (e.target.checked) setErrorMsg('');
                    }}
                    className="mt-0.5 w-4 h-4 rounded border-zinc-600 bg-neutral-900 text-cine-accent focus:ring-cine-accent/40 cursor-pointer"
                  />
                  <span className="text-xs text-zinc-400 leading-relaxed">
                    Li e aceito os{' '}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        setLegalModal('terms');
                      }}
                      className="text-cine-accent-light hover:text-cine-cream font-bold underline underline-offset-2 cursor-pointer"
                    >
                      Termos de Uso
                    </button>
                    {' '}e a{' '}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        setLegalModal('privacy');
                      }}
                      className="text-cine-accent-light hover:text-cine-cream font-bold underline underline-offset-2 cursor-pointer"
                    >
                      Política de Privacidade
                    </button>
                    . Autorizo o uso do e-mail e dados públicos do Discord para criar e manter minha conta.
                  </span>
                </label>

                {discordOAuthEnabled ? (
                  <button
                    type="button"
                    onClick={handleDiscordLogin}
                    disabled={!acceptedTerms}
                    className="w-full flex items-center justify-center gap-3 py-4 px-4 rounded-xl text-base font-bold bg-[#5865F2] hover:bg-[#4752c4] disabled:opacity-45 disabled:cursor-not-allowed text-white transition-colors shadow-lg shadow-[#5865F2]/25 cursor-pointer"
                  >
                    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.419 0 1.334-.956 2.419-2.157 2.419zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.419 0 1.334-.946 2.419-2.157 2.419z" />
                    </svg>
                    Continuar com Discord
                  </button>
                ) : (
                  <div className="p-4 rounded-xl bg-neutral-900/80 border border-neutral-800 text-sm text-zinc-400 text-center">
                    Login com Discord temporariamente indisponível. Tente novamente em instantes.
                  </div>
                )}

                <p className="text-[11px] text-zinc-600 text-center mt-4 leading-relaxed">
                  Primeira vez? Ao autorizar no Discord, coletamos e-mail, nome e avatar públicos para sua conta CineReact.
                </p>

                <button
                  type="button"
                  onClick={onClose}
                  className="w-full mt-6 py-2.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
                >
                  Continuar navegando sem conta
                </button>
              </div>
            </div>

            <AnimatePresence>
              {legalModal && (
                <motion.div
                  className="fixed inset-0 z-[240] flex items-center justify-center p-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <div
                    className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                    onClick={() => setLegalModal(null)}
                  />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.96, y: 12 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96, y: 12 }}
                    className="relative w-full max-w-lg bg-cine-surface border border-cine-border rounded-2xl p-6 max-h-[80vh] overflow-y-auto shadow-2xl"
                  >
                    <button
                      type="button"
                      onClick={() => setLegalModal(null)}
                      className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-neutral-800/60 cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                    {legalModal === 'privacy' ? (
                      <div className="space-y-3 pr-6">
                        <div className="flex items-center gap-2 mb-2">
                          <Lock className="w-5 h-5 text-cine-accent-light" />
                          <h3 className="text-lg font-bold text-white">Política de Privacidade</h3>
                        </div>
                        <p className="text-xs text-zinc-400 leading-relaxed">
                          No login com Discord, recebemos e-mail, nome de usuário e avatar públicos conforme autorizado por você no Discord.
                          Usamos esses dados para criar sua conta, personalizar seu perfil e manter sua sessão segura.
                        </p>
                        <p className="text-xs text-zinc-400 leading-relaxed">
                          Não vendemos seus dados. Você pode solicitar alterações ou suporte pelo e-mail de atendimento do CineReact.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3 pr-6">
                        <div className="flex items-center gap-2 mb-2">
                          <FileText className="w-5 h-5 text-cine-accent-light" />
                          <h3 className="text-lg font-bold text-white">Termos de Uso</h3>
                        </div>
                        <p className="text-xs text-zinc-400 leading-relaxed">
                          O CineReact é uma plataforma agregadora de conteúdo público. Ao usar o serviço, você concorda em não utilizar a conta para atividades ilegais ou abusivas.
                        </p>
                        <p className="text-xs text-zinc-400 leading-relaxed">
                          O acesso é gratuito e vinculado à sua conta Discord. Você é responsável pela segurança da sua conta no Discord.
                        </p>
                      </div>
                    )}
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
