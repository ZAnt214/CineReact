import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  X,
  Mail,
  Lock,
  User,
  LogIn,
  UserPlus,
  Eye,
  EyeOff,
  Film,
  Bookmark,
  Heart,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  AlertCircle
} from 'lucide-react';
import { UserState } from '../types.ts';
import { motion, AnimatePresence } from 'motion/react';
import CineReactLogo from './CineReactLogo.tsx';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: UserState, isNewUser?: boolean) => void;
  initialMode?: 'login' | 'register';
}

const REMEMBERED_EMAIL_KEY = 'cine_react_remembered_email';

function formatAuthError(raw?: string): string {
  if (!raw?.trim()) {
    return 'Não foi possível entrar. Verifique seus dados e tente novamente.';
  }

  const lower = raw.toLowerCase();

  if (
    lower.includes('credenciais inválidas') ||
    lower.includes('invalid login credentials') ||
    lower.includes('invalid credentials') ||
    lower.includes('wrong password') ||
    lower.includes('incorrect password')
  ) {
    return 'E-mail ou senha incorretos. Verifique e tente novamente.';
  }

  if (lower.includes('user not found') || lower.includes('usuário não encontrado')) {
    return 'Não encontramos uma conta com este e-mail.';
  }

  if (lower.includes('too many requests') || lower.includes('rate limit')) {
    return 'Muitas tentativas seguidas. Aguarde um momento e tente novamente.';
  }

  if (raw.startsWith('Credenciais inválidas:')) {
    return 'E-mail ou senha incorretos. Verifique e tente novamente.';
  }

  return raw;
}

const benefits = [
  { icon: Film, text: 'Assista a todos os reacts do catálogo' },
  { icon: Bookmark, text: 'Salve favoritos e crie listas personalizadas' },
  { icon: Heart, text: 'Envie Energia da Plateia aos criadores' },
  { icon: ShieldCheck, text: 'Sincronize seu progresso em qualquer dispositivo' },
];

export default function AuthModal({
  isOpen,
  onClose,
  onSuccess,
  initialMode = 'login'
}: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [rememberEmail, setRememberEmail] = useState(true);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [infoMsg, setInfoMsg] = useState('');

  const firstInputRef = useRef<HTMLInputElement>(null);
  const modalContentRef = useRef<HTMLDivElement>(null);

  const resetForm = useCallback(() => {
    setUsername('');
    setPassword('');
    setConfirmPassword('');
    setErrorMsg('');
    setInfoMsg('');
    setShowPassword(false);
    setShowConfirmPassword(false);
    setShowForgotPassword(false);
    setMode(initialMode);
  }, [initialMode]);

  useEffect(() => {
    if (!isOpen) return;

    setMode(initialMode);
    setErrorMsg('');
    setInfoMsg('');
    setShowForgotPassword(false);

    const savedEmail = localStorage.getItem(REMEMBERED_EMAIL_KEY);
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberEmail(true);
    }

    const timer = window.setTimeout(() => firstInputRef.current?.focus(), 120);
    return () => window.clearTimeout(timer);
  }, [isOpen, initialMode]);

  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

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

  const persistEmail = (value: string) => {
    if (rememberEmail && value.trim()) {
      localStorage.setItem(REMEMBERED_EMAIL_KEY, value.trim());
    } else {
      localStorage.removeItem(REMEMBERED_EMAIL_KEY);
    }
  };

  const validateLogin = () => {
    if (!email.trim()) {
      setErrorMsg('Informe seu e-mail.');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setErrorMsg('Informe um e-mail válido.');
      return false;
    }
    if (!password) {
      setErrorMsg('Informe sua senha.');
      return false;
    }
    return true;
  };

  const validateRegister = () => {
    if (username.trim().length < 3) {
      setErrorMsg('O nome de usuário deve ter pelo menos 3 caracteres.');
      return false;
    }
    if (password.length < 6) {
      setErrorMsg('A senha deve ter pelo menos 6 caracteres.');
      return false;
    }
    if (password !== confirmPassword) {
      setErrorMsg('As senhas não coincidem.');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setInfoMsg('');

    if (mode === 'login' && !validateLogin()) {
      setLoading(false);
      return;
    }

    if (mode === 'register' && !validateRegister()) {
      setLoading(false);
      return;
    }

    try {
      const endpoint = mode === 'register' ? '/api/cadastro' : '/api/login';
      const bodyPayload = mode === 'register'
        ? { username: username.trim(), email: email.trim(), password }
        : { email: email.trim(), password };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyPayload)
      });

      const data = await res.json();

      if (res.ok) {
        if (data.requiresVerification) {
          setInfoMsg(data.message || 'Enviamos um e-mail de confirmação. Verifique sua caixa de entrada para ativar sua conta.');
          setMode('login');
        } else if (data.success && data.user) {
          persistEmail(email);
          onSuccess(data.user, mode === 'register');
          resetForm();
          onClose();
        } else {
          setErrorMsg('Ocorreu um erro ao processar. Tente novamente.');
        }
      } else {
        if (data.requiresVerification) {
          setInfoMsg(data.error || data.message || 'Verifique seu e-mail para confirmar o cadastro antes de entrar.');
          setMode('login');
        } else {
          setErrorMsg(formatAuthError(data.error));
        }
      }
    } catch {
      setErrorMsg('Erro de conexão com o servidor. Verifique sua internet.');
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (next: 'login' | 'register') => {
    setMode(next);
    setErrorMsg('');
    setInfoMsg('');
    setShowForgotPassword(false);
    setConfirmPassword('');
  };

  const passwordStrength = (() => {
    if (!password) return { label: '', width: '0%', color: 'bg-zinc-700' };
    if (password.length < 6) return { label: 'Fraca', width: '33%', color: 'bg-red-500' };
    if (password.length < 10) return { label: 'Média', width: '66%', color: 'bg-cine-accent' };
    return { label: 'Forte', width: '100%', color: 'bg-green-500' };
  })();

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[210] overscroll-none"
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
            <div className="absolute top-0 left-0 w-full h-1 bg-white-dark" />

            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-10 text-zinc-500 hover:text-white p-2 rounded-full hover:bg-neutral-900 transition-colors cursor-pointer"
              aria-label="Fechar"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="grid grid-cols-1 md:grid-cols-5 min-h-full">
              {/* Brand panel */}
              <div className="hidden md:flex md:col-span-2 flex-col justify-between p-8 bg-gradient-to-br from-neutral-900 via-neutral-950 to-black border-r border-neutral-800/80 relative overflow-hidden">
                <div className="absolute -top-20 -right-20 w-48 h-48 bg-cine-accent/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-neutral-950 to-transparent pointer-events-none" />

                <div className="relative z-10 space-y-8">
                  <CineReactLogo size="xl" animated heading />

                  <div>
                    <h3 className="text-lg font-black text-white leading-snug">
                      Sua conta no maior portal de reacts do Brasil
                    </h3>
                    <p className="text-xs text-zinc-500 mt-2 leading-relaxed">
                      Grátis para sempre. Sem cartão de crédito.
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
                  Ao continuar, você concorda com os Termos de Uso e Política de Privacidade do CineReact.
                </p>
              </div>

              {/* Form panel */}
              <div className="md:col-span-3 p-6 sm:p-8 pb-[max(1.5rem,env(safe-area-inset-bottom))] min-h-[100dvh] md:min-h-full flex flex-col justify-center">
                <div className="md:hidden mb-8">
                  <CineReactLogo size="lg" align="center" animated />
                </div>
                <div className="text-center md:text-left mb-6">
                  <div className="inline-flex items-center px-3 py-1 rounded-full bg-cine-accent/10 border border-cine-accent/20 text-cine-accent-light text-[10px] font-bold tracking-wider uppercase mb-3">
                    Acesso gratuito
                  </div>
                  <h2 id="auth-modal-title" className="text-xl sm:text-2xl font-black text-white tracking-tight">
                    {mode === 'login' ? 'Bem-vindo de volta!' : 'Crie sua conta'}
                  </h2>
                  <p className="text-xs sm:text-sm text-zinc-500 mt-1.5 leading-relaxed">
                    {mode === 'login'
                      ? 'Entre para assistir reacts, salvar favoritos e apoiar criadores.'
                      : 'Cadastro rápido — leva menos de 1 minuto.'}
                  </p>
                </div>

                <motion.div className="flex p-1 mb-6 bg-neutral-900/80 border border-neutral-800 rounded-xl">
                  <button
                      type="button"
                      onClick={() => switchMode('login')}
                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        mode === 'login'
                          ? 'bg-cine-accent text-black shadow-md shadow-cine-accent/20'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      <LogIn className="w-3.5 h-3.5" />
                      Entrar
                    </button>
                    <button
                      type="button"
                      onClick={() => switchMode('register')}
                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        mode === 'register'
                          ? 'bg-cine-accent text-black shadow-md shadow-cine-accent/20'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      Cadastrar
                    </button>
                </motion.div>

                <AnimatePresence mode="wait">
                  {errorMsg && (
                    <motion.div
                      key="error"
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      className="bg-neutral-900/95 border border-cine-accent/30 text-zinc-100 p-3.5 rounded-xl text-sm mb-4 flex items-start gap-2.5 shadow-lg shadow-black/30"
                    >
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-cine-accent-light" />
                      <span>{errorMsg}</span>
                    </motion.div>
                  )}
                  {infoMsg && (
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

                <form onSubmit={handleSubmit} noValidate className="space-y-4">
                    {mode === 'register' && (
                      <div>
                        <label htmlFor="auth-username" className="block text-[10px] font-mono text-zinc-500 uppercase tracking-wider mb-1.5">
                          Nome de usuário
                        </label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                          <input
                            ref={firstInputRef}
                            id="auth-username"
                            type="text"
                            autoComplete="username"
                            placeholder="Como quer ser chamado?"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full bg-neutral-900/80 border border-neutral-800 focus:border-cine-accent focus:ring-1 focus:ring-cine-accent/30 rounded-xl pl-10 pr-3 py-3 text-sm text-white outline-none transition-all"
                          />
                        </div>
                      </div>
                    )}

                    <div>
                      <label htmlFor="auth-email" className="block text-[10px] font-mono text-zinc-500 uppercase tracking-wider mb-1.5">
                        E-mail
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                        <input
                          ref={mode === 'login' ? firstInputRef : undefined}
                          id="auth-email"
                          type="email"
                          autoComplete="email"
                          placeholder="seu@email.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full bg-neutral-900/80 border border-neutral-800 focus:border-cine-accent focus:ring-1 focus:ring-cine-accent/30 rounded-xl pl-10 pr-3 py-3 text-sm text-white outline-none transition-all"
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label htmlFor="auth-password" className="block text-[10px] font-mono text-zinc-500 uppercase tracking-wider">
                          Senha
                        </label>
                        {mode === 'login' && (
                          <button
                            type="button"
                            onClick={() => setShowForgotPassword((v) => !v)}
                            className="text-[10px] text-cine-accent-light hover:text-cine-cream font-bold transition-colors cursor-pointer"
                          >
                            Esqueci a senha
                          </button>
                        )}
                      </div>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                        <input
                          id="auth-password"
                          type={showPassword ? 'text' : 'password'}
                          autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                          placeholder={mode === 'register' ? 'Mínimo 6 caracteres' : 'Sua senha'}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full bg-neutral-900/80 border border-neutral-800 focus:border-cine-accent focus:ring-1 focus:ring-cine-accent/30 rounded-xl pl-10 pr-11 py-3 text-sm text-white outline-none transition-all"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors cursor-pointer p-1"
                          aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>

                      {mode === 'register' && password.length > 0 && (
                        <div className="mt-2 space-y-1">
                          <div className="h-1 bg-neutral-800 rounded-full overflow-hidden">
                            <motion.div
                              className={`h-full ${passwordStrength.color} transition-all duration-300`}
                              style={{ width: passwordStrength.width }}
                            />
                          </div>
                          <p className="text-[10px] text-zinc-500">Força: {passwordStrength.label}</p>
                        </div>
                      )}
                    </div>

                    {mode === 'register' && (
                      <div>
                        <label htmlFor="auth-confirm-password" className="block text-[10px] font-mono text-zinc-500 uppercase tracking-wider mb-1.5">
                          Confirmar senha
                        </label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                          <input
                            id="auth-confirm-password"
                            type={showConfirmPassword ? 'text' : 'password'}
                            autoComplete="new-password"
                            placeholder="Repita a senha"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full bg-neutral-900/80 border border-neutral-800 focus:border-cine-accent focus:ring-1 focus:ring-cine-accent/30 rounded-xl pl-10 pr-11 py-3 text-sm text-white outline-none transition-all"
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors cursor-pointer p-1"
                          >
                            {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                    )}

                    {mode === 'login' && (
                      <label className="flex items-center gap-2.5 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={rememberEmail}
                          onChange={(e) => setRememberEmail(e.target.checked)}
                          className="w-4 h-4 rounded border-zinc-700 bg-neutral-900 text-cine-accent focus:ring-cine-accent/30"
                        />
                        <span className="text-xs text-zinc-500">Lembrar meu e-mail neste dispositivo</span>
                      </label>
                    )}

                    <AnimatePresence>
                      {showForgotPassword && mode === 'login' && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="p-4 rounded-xl bg-neutral-900/60 border border-neutral-800 text-xs text-zinc-400 leading-relaxed">
                            Para recuperar sua senha, envie um e-mail para{' '}
                            <a
                              href="mailto:atendimentocinereact@gmail.com?subject=Recuperação%20de%20senha%20CineReact"
                              className="text-cine-accent-light hover:text-cine-cream font-bold underline"
                            >
                              atendimentocinereact@gmail.com
                            </a>{' '}
                            informando o e-mail da sua conta.
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-white hover:bg-[#cc0000] disabled:opacity-50 text-black font-extrabold py-3.5 px-4 rounded-xl text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-cine-accent/20 cursor-pointer active:scale-[0.99]"
                    >
                      {loading ? (
                        <span className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                      ) : mode === 'login' ? (
                        <>
                          Entrar no CineReact
                          <ArrowRight className="w-4 h-4" />
                        </>
                      ) : (
                        <>
                          Criar conta grátis
                          <UserPlus className="w-4 h-4" />
                        </>
                      )}
                    </button>
                </form>

                <button
                  type="button"
                  onClick={onClose}
                  className="w-full mt-4 py-2.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
                >
                  Continuar navegando sem conta
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
