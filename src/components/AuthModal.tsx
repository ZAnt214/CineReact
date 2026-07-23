import { useEffect, useState, type FormEvent } from 'react';
import {
  AlertCircle,
  ArrowRight,
  Bookmark,
  Check,
  Eye,
  EyeOff,
  History,
  Info,
  Lock,
  LogIn,
  Mail,
  ShieldCheck,
  User,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { UserState } from '../types.ts';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: UserState, isNewUser?: boolean) => void;
  initialMode?: 'login' | 'register';
}

type AuthMode = 'login' | 'register' | 'verify_otp';

const inputClassName =
  'h-12 w-full rounded-xl border border-zinc-800 bg-zinc-900/70 pl-11 pr-4 text-sm text-white outline-none transition-colors placeholder:text-zinc-600 hover:border-zinc-700 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/10';

const accountBenefits = [
  {
    icon: Bookmark,
    title: 'Salve seus favoritos',
    description: 'Mantenha obras e reacts importantes sempre por perto.',
  },
  {
    icon: History,
    title: 'Continue de onde parou',
    description: 'Acompanhe seu progresso entre diferentes sessões.',
  },
  {
    icon: Users,
    title: 'Acompanhe criadores',
    description: 'Siga canais e encontre novos conteúdos com facilidade.',
  },
];

export default function AuthModal({
  isOpen,
  onClose,
  onSuccess,
  initialMode = 'login',
}: AuthModalProps) {
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [infoMsg, setInfoMsg] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [verificationEmail, setVerificationEmail] = useState('');
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setErrorMsg('');
      setInfoMsg('');
    }
  }, [isOpen, initialMode]);

  const clearMessages = () => {
    setErrorMsg('');
    setInfoMsg('');
  };

  const changeMode = (nextMode: 'login' | 'register') => {
    setMode(nextMode);
    setShowPassword(false);
    clearMessages();
  };

  const resetFields = () => {
    setUsername('');
    setEmail('');
    setPassword('');
    setShowPassword(false);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    clearMessages();

    try {
      const endpoint = mode === 'register' ? '/api/cadastro' : '/api/login';
      const bodyPayload = mode === 'register'
        ? { username, email, password }
        : { email, password };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyPayload),
      });
      const data = await response.json();

      if (response.ok) {
        if (data.requiresVerification) {
          setVerificationEmail(data.email || email);
          setMode('verify_otp');
          setInfoMsg('Enviamos um código de confirmação para o seu e-mail.');
        } else if (data.success && data.user) {
          onSuccess(data.user, mode === 'register');
          onClose();
          resetFields();
        } else {
          setErrorMsg('Ocorreu um erro ao processar. Tente novamente.');
        }
      } else if (data.requiresVerification) {
        setVerificationEmail(data.email || email);
        setMode('verify_otp');
        setInfoMsg(data.error || 'Insira o código de confirmação enviado para seu e-mail.');
      } else {
        setErrorMsg(data.error || 'Falha na autenticação.');
      }
    } catch {
      setErrorMsg('Erro de conexão com o servidor. Verifique sua internet.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    clearMessages();

    try {
      const response = await fetch('/api/verificar-codigo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: verificationEmail, token: verificationCode }),
      });
      const data = await response.json();

      if (response.ok && data.success && data.user) {
        onSuccess(data.user, true);
        onClose();
        resetFields();
        setVerificationCode('');
        setVerificationEmail('');
        setMode('login');
      } else {
        setErrorMsg(data.error || 'Código inválido ou expirado. Confira e tente novamente.');
      }
    } catch {
      setErrorMsg('Erro de conexão com o servidor. Verifique sua internet.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setResending(true);
    clearMessages();

    try {
      const response = await fetch('/api/reenviar-codigo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: verificationEmail }),
      });
      const data = await response.json();

      if (response.ok && data.success) {
        setInfoMsg(data.message || 'Um novo código de confirmação foi enviado.');
      } else {
        setErrorMsg(data.error || 'Erro ao reenviar o código.');
      }
    } catch {
      setErrorMsg('Erro de conexão com o servidor.');
    } finally {
      setResending(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center p-3 sm:p-6">
          <motion.button
            type="button"
            aria-label="Fechar autenticação"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 h-full w-full bg-black/85"
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="auth-title"
            initial={{ opacity: 0, scale: 0.97, y: 18 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 18 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="relative z-10 flex max-h-[94dvh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl border border-white/[0.09] bg-[#0b0b0d] shadow-[0_30px_100px_rgba(0,0,0,0.75)] md:grid md:grid-cols-[0.9fr_1.1fr]"
          >
            <div className="absolute inset-x-0 top-0 z-10 h-px bg-gradient-to-r from-transparent via-amber-400 to-transparent" aria-hidden="true" />

            <button
              type="button"
              onClick={onClose}
              className="absolute top-4 right-4 z-30 flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900/90 text-zinc-500 transition-colors hover:border-zinc-700 hover:text-white sm:top-5 sm:right-5"
              aria-label="Fechar"
              title="Fechar"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>

            <aside className="relative hidden overflow-hidden border-r border-white/[0.07] bg-zinc-950 p-8 md:flex md:flex-col md:justify-between">
              <div className="pointer-events-none absolute -top-20 -left-20 h-72 w-72 rounded-full bg-amber-400/[0.08] blur-3xl" aria-hidden="true" />

              <div className="relative">
                <div className="flex items-center font-['Fredoka',sans-serif] text-2xl font-black">
                  <span className="text-white">Cine</span>
                  <span className="bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 bg-clip-text text-transparent">
                    React
                  </span>
                  <span className="ml-0.5 text-amber-400">!</span>
                </div>

                <p className="mt-8 text-[10px] font-black uppercase tracking-[0.18em] text-amber-400">
                  Sua experiência, do seu jeito
                </p>
                <h2 className="mt-3 text-3xl font-black leading-tight text-white">
                  Entre para organizar tudo o que você ama assistir.
                </h2>
                <p className="mt-4 text-sm leading-6 text-zinc-500">
                  Uma conta gratuita conecta suas preferências em toda a experiência CineReact.
                </p>

                <div className="mt-8 space-y-5">
                  {accountBenefits.map(({ icon: Icon, title, description }) => (
                    <div key={title} className="flex gap-3.5">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-amber-400/15 bg-amber-400/[0.07]">
                        <Icon className="h-4 w-4 text-amber-400" aria-hidden="true" />
                      </span>
                      <div>
                        <p className="text-sm font-bold text-zinc-200">{title}</p>
                        <p className="mt-0.5 text-xs leading-5 text-zinc-600">{description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="relative mt-10 flex items-center gap-2 text-[11px] text-zinc-600">
                <ShieldCheck className="h-4 w-4 text-amber-400" aria-hidden="true" />
                Seus dados são usados para oferecer os recursos da conta.
              </div>
            </aside>

            <section className="min-h-0 flex-1 overflow-y-auto px-5 py-6 sm:px-8 sm:py-8 md:px-10 md:py-10">
              <div className="mb-6 flex items-center font-['Fredoka',sans-serif] text-xl font-black md:hidden">
                <span className="text-white">Cine</span>
                <span className="bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 bg-clip-text text-transparent">
                  React
                </span>
                <span className="ml-0.5 text-amber-400">!</span>
              </div>

              {mode !== 'verify_otp' && (
                <div className="mb-7 grid grid-cols-2 rounded-xl border border-zinc-800 bg-zinc-950 p-1">
                  <button
                    type="button"
                    onClick={() => changeMode('login')}
                    className={`h-10 rounded-lg text-xs font-black transition-colors ${
                      mode === 'login'
                        ? 'bg-zinc-800 text-white shadow-sm'
                        : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    Entrar
                  </button>
                  <button
                    type="button"
                    onClick={() => changeMode('register')}
                    className={`h-10 rounded-lg text-xs font-black transition-colors ${
                      mode === 'register'
                        ? 'bg-amber-400 text-black shadow-sm'
                        : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    Criar conta
                  </button>
                </div>
              )}

              <div className="pr-10">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-amber-400">
                  {mode === 'verify_otp' ? 'Verificação de segurança' : 'Conta CineReact'}
                </p>
                <h2 id="auth-title" className="mt-2 text-2xl font-black tracking-tight text-white sm:text-3xl">
                  {mode === 'login'
                    ? 'Bem-vindo de volta.'
                    : mode === 'register'
                      ? 'Crie sua conta gratuita.'
                      : 'Confirme seu e-mail.'}
                </h2>
                <p className="mt-3 text-sm leading-6 text-zinc-500">
                  {mode === 'login'
                    ? 'Entre para acessar seus favoritos, canais e histórico.'
                    : mode === 'register'
                      ? 'Leva apenas alguns instantes para começar.'
                      : `Digite o código enviado para ${verificationEmail}.`}
                </p>
              </div>

              <AnimatePresence mode="popLayout">
                {errorMsg && (
                  <motion.div
                    key="auth-error"
                    role="alert"
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="mt-5 flex items-start gap-2.5 rounded-xl border border-red-500/25 bg-red-500/[0.07] p-3 text-xs leading-5 text-red-300"
                  >
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                    {errorMsg}
                  </motion.div>
                )}

                {infoMsg && (
                  <motion.div
                    key="auth-info"
                    role="status"
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="mt-5 flex items-start gap-2.5 rounded-xl border border-amber-400/20 bg-amber-400/[0.07] p-3 text-xs leading-5 text-amber-300"
                  >
                    <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                    {infoMsg}
                  </motion.div>
                )}
              </AnimatePresence>

              {mode === 'verify_otp' ? (
                <form onSubmit={handleVerifyOtp} className="mt-7">
                  <label htmlFor="verification-code" className="text-xs font-bold text-zinc-300">
                    Código de verificação
                  </label>
                  <div className="relative mt-2">
                    <Lock className="absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-zinc-500" aria-hidden="true" />
                    <input
                      id="verification-code"
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      required
                      maxLength={8}
                      placeholder="000000"
                      value={verificationCode}
                      onChange={(event) => setVerificationCode(event.target.value.replace(/\D/g, ''))}
                      className={`${inputClassName} pr-11 text-center font-mono text-lg tracking-[0.35em]`}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-amber-400 text-sm font-black text-black transition-colors hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {loading ? (
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-black/25 border-t-black" />
                    ) : (
                      <>
                        <Check className="h-4 w-4" aria-hidden="true" />
                        Confirmar e entrar
                      </>
                    )}
                  </button>

                  <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.06] pt-5 text-xs">
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={resending}
                      className="font-bold text-amber-400 transition-colors hover:text-amber-300 disabled:opacity-50"
                    >
                      {resending ? 'Reenviando...' : 'Reenviar código'}
                    </button>
                    <button
                      type="button"
                      onClick={() => changeMode('login')}
                      className="text-zinc-500 transition-colors hover:text-zinc-300"
                    >
                      Voltar ao login
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleSubmit} className="mt-7 space-y-4">
                  {mode === 'register' && (
                    <div>
                      <label htmlFor="auth-username" className="text-xs font-bold text-zinc-300">
                        Nome de usuário
                      </label>
                      <div className="relative mt-2">
                        <User className="absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-zinc-500" aria-hidden="true" />
                        <input
                          id="auth-username"
                          type="text"
                          autoComplete="username"
                          required
                          placeholder="Como você quer ser chamado?"
                          value={username}
                          onChange={(event) => setUsername(event.target.value)}
                          className={inputClassName}
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <label htmlFor="auth-email" className="text-xs font-bold text-zinc-300">
                      E-mail
                    </label>
                    <div className="relative mt-2">
                      <Mail className="absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-zinc-500" aria-hidden="true" />
                      <input
                        id="auth-email"
                        type="email"
                        autoComplete="email"
                        required
                        placeholder="voce@exemplo.com"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        className={inputClassName}
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="auth-password" className="text-xs font-bold text-zinc-300">
                      Senha
                    </label>
                    <div className="relative mt-2">
                      <Lock className="absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-zinc-500" aria-hidden="true" />
                      <input
                        id="auth-password"
                        type={showPassword ? 'text' : 'password'}
                        autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                        required
                        placeholder={mode === 'login' ? 'Digite sua senha' : 'Crie uma senha'}
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        className={`${inputClassName} pr-12`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(current => !current)}
                        className="absolute top-1/2 right-3 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-300"
                        aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {mode === 'register' && (
                    <div className="flex items-start gap-2.5 rounded-xl border border-white/[0.05] bg-zinc-950/60 p-3 text-[11px] leading-5 text-zinc-600">
                      <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" aria-hidden="true" />
                      Ao criar sua conta, você concorda com os Termos de Uso e a Política de Privacidade do CineReact.
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="group flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-amber-400 text-sm font-black text-black transition-colors hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {loading ? (
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-black/25 border-t-black" />
                    ) : mode === 'login' ? (
                      <>
                        <LogIn className="h-4 w-4" aria-hidden="true" />
                        Entrar no CineReact
                      </>
                    ) : (
                      <>
                        <UserPlus className="h-4 w-4" aria-hidden="true" />
                        Criar minha conta
                      </>
                    )}
                    {!loading && <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />}
                  </button>
                </form>
              )}

              {mode !== 'verify_otp' && (
                <p className="mt-6 border-t border-white/[0.06] pt-5 text-center text-xs text-zinc-500">
                  {mode === 'login' ? 'Ainda não tem uma conta?' : 'Já possui uma conta?'}
                  <button
                    type="button"
                    onClick={() => changeMode(mode === 'login' ? 'register' : 'login')}
                    className="ml-1.5 font-bold text-amber-400 transition-colors hover:text-amber-300"
                  >
                    {mode === 'login' ? 'Cadastre-se grátis' : 'Entre agora'}
                  </button>
                </p>
              )}
            </section>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
