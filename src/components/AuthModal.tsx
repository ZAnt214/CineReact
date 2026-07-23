import React, { useState } from 'react';
import { X, Mail, Lock, User, Sparkles, LogIn, UserPlus, Eye, EyeOff } from 'lucide-react';
import { UserState } from '../types.ts';
import { motion, AnimatePresence } from 'motion/react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: UserState, isNewUser?: boolean) => void;
  initialMode?: 'login' | 'register';
}

export default function AuthModal({
  isOpen,
  onClose,
  onSuccess,
  initialMode = 'login'
}: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'register' | 'verify_otp'>(initialMode);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setInfoMsg('');

    try {
      const endpoint = mode === 'register' ? '/api/cadastro' : '/api/login';
      const bodyPayload = mode === 'register' 
        ? { username, email, password } 
        : { email, password };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyPayload)
      });

      const data = await res.json();

      if (res.ok) {
        if (data.requiresVerification) {
          setVerificationEmail(data.email || email);
          setMode('verify_otp');
          setInfoMsg('Por favor, verifique sua caixa de entrada e insira o código de confirmação.');
        } else if (data.success && data.user) {
          onSuccess(data.user, mode === 'register');
          onClose();
          // Reset fields
          setUsername('');
          setEmail('');
          setPassword('');
        } else {
          setErrorMsg('Ocorreu um erro ao processar. Tente novamente.');
        }
      } else {
        if (data.requiresVerification) {
          setVerificationEmail(data.email || email);
          setMode('verify_otp');
          setInfoMsg(data.error || 'Por favor, insira o código de confirmação enviado para seu e-mail.');
        } else {
          setErrorMsg(data.error || 'Falha na autenticação.');
        }
      }
    } catch (err) {
      setErrorMsg('Erro de conexão com o servidor. Verifique sua internet.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setInfoMsg('');

    try {
      const res = await fetch('/api/verificar-codigo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: verificationEmail, token: verificationCode })
      });

      const data = await res.json();

      if (res.ok && data.success && data.user) {
        onSuccess(data.user, true);
        onClose();
        // Reset fields
        setUsername('');
        setEmail('');
        setPassword('');
        setVerificationCode('');
        setVerificationEmail('');
        setMode('login');
      } else {
        setErrorMsg(data.error || 'Falha ao verificar código. Verifique se digitou corretamente.');
      }
    } catch (err) {
      setErrorMsg('Erro de conexão com o servidor. Verifique sua internet.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setResending(true);
    setErrorMsg('');
    setInfoMsg('');

    try {
      const res = await fetch('/api/reenviar-codigo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: verificationEmail })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setInfoMsg(data.message || 'Um novo código de confirmação foi enviado!');
      } else {
        setErrorMsg(data.error || 'Erro ao reenviar o código.');
      }
    } catch (err) {
      setErrorMsg('Erro de conexão com o servidor.');
    } finally {
      setResending(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/85 backdrop-blur-md"
          />

          {/* Modal Container */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 30 }}
            className="relative w-full max-w-md bg-zinc-950 border border-zinc-800/80 rounded-2xl p-7 shadow-2xl overflow-hidden text-zinc-300"
          >
            {/* Visual element decorator */}
            <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600" />
            
            {/* Close Button */}
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 text-zinc-500 hover:text-white p-1 rounded-full hover:bg-zinc-900 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Title / Description */}
            <div className="text-center mt-3 mb-6">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-bold tracking-wider uppercase mb-3 font-fredoka">
                <Sparkles className="w-3 h-3 animate-pulse text-amber-400" />
                CineReact
              </div>
              <h2 className="text-xl font-black text-white uppercase tracking-wider font-sans">
                {mode === 'login' ? 'Acesse sua Conta' : mode === 'register' ? 'Crie sua Conta' : 'Confirme seu E-mail'}
              </h2>
              <p className="text-xs text-zinc-400 mt-1.5 max-w-xs mx-auto">
                {mode === 'login' 
                  ? 'Faça login para assistir a todos os reacts, doar Energia da Plateia e muito mais.' 
                  : mode === 'register'
                  ? 'Cadastre-se grátis em instantes para enviar Energia e apoiar seus criadores.'
                  : `Digite o código de verificação enviado para o e-mail: ${verificationEmail}`}
              </p>
            </div>

            {errorMsg && (
              <motion.div 
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-950/30 border border-red-500/35 text-red-400 p-3 rounded-xl text-xs font-semibold text-center mb-4"
              >
                {errorMsg}
              </motion.div>
            )}

            {infoMsg && (
              <motion.div 
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-amber-950/30 border border-amber-500/35 text-amber-400 p-3 rounded-xl text-xs font-semibold text-center mb-4"
              >
                {infoMsg}
              </motion.div>
            )}

            {/* Form */}
            {mode === 'verify_otp' ? (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-mono text-zinc-500 uppercase tracking-wider mb-1.5">Código de Verificação (OTP)</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <input 
                      type="text" 
                      required
                      placeholder="Ex: 123456"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value)}
                      className="w-full bg-zinc-900/60 border border-zinc-800 focus:border-amber-500 rounded-lg pl-9 pr-3 py-2.5 text-xs text-white outline-none tracking-widest font-mono text-center text-lg transition-colors"
                    />
                  </div>
                </div>

                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 disabled:opacity-50 text-black font-extrabold py-3 px-4 rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 mt-2 shadow-lg shadow-amber-500/20 cursor-pointer"
                >
                  {loading ? (
                    <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  ) : (
                    <>
                      <LogIn className="w-4 h-4" /> Verificar e Entrar
                    </>
                  )}
                </button>

                <div className="flex justify-between items-center text-xs mt-4 pt-2 border-t border-zinc-900">
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={resending}
                    className="text-amber-400 hover:text-amber-300 font-bold transition-colors disabled:opacity-50 cursor-pointer text-[11px]"
                  >
                    {resending ? 'Enviando...' : 'Reenviar Código'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('login');
                      setErrorMsg('');
                      setInfoMsg('');
                    }}
                    className="text-zinc-500 hover:text-zinc-300 transition-colors text-[11px]"
                  >
                    Voltar para o Login
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {mode === 'register' && (
                  <div>
                    <label className="block text-[10px] font-mono text-zinc-500 uppercase tracking-wider mb-1.5">Nome de Usuário</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                      <input 
                        type="text" 
                        required
                        placeholder="Ex: mateus_criador"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full bg-zinc-900/60 border border-zinc-800 focus:border-amber-500 rounded-lg pl-9 pr-3 py-2.5 text-xs text-white outline-none transition-colors"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-[10px] font-mono text-zinc-500 uppercase tracking-wider mb-1.5">Endereço de E-mail</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <input 
                      type="email" 
                      required
                      placeholder="Ex: seu-email@dominio.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-zinc-900/60 border border-zinc-800 focus:border-amber-500 rounded-lg pl-9 pr-3 py-2.5 text-xs text-white outline-none transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-zinc-500 uppercase tracking-wider mb-1.5">Senha de Acesso</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <input 
                      type={showPassword ? 'text' : 'password'} 
                      required
                      placeholder="Sua senha secreta"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-zinc-900/60 border border-zinc-800 focus:border-amber-500 rounded-lg pl-9 pr-10 py-2.5 text-xs text-white outline-none transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors"
                      title={showPassword ? "Ocultar senha" : "Mostrar senha"}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 disabled:opacity-50 text-black font-extrabold py-3 px-4 rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 mt-2 shadow-lg shadow-amber-500/20 cursor-pointer"
                >
                  {loading ? (
                    <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  ) : mode === 'login' ? (
                    <>
                      <LogIn className="w-4 h-4" /> Entrar no CineReact
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" /> Criar Minha Conta Grátis
                    </>
                  )}
                </button>
              </form>
            )}

            {/* Toggle Mode */}
            {mode !== 'verify_otp' && (
              <div className="text-center mt-6 pt-5 border-t border-zinc-900">
                <p className="text-xs text-zinc-500">
                  {mode === 'login' ? 'Novo por aqui?' : 'Já possui uma conta?'}
                  <button 
                    onClick={() => {
                      setMode(mode === 'login' ? 'register' : 'login');
                      setErrorMsg('');
                      setInfoMsg('');
                    }}
                    className="text-amber-400 hover:text-amber-300 font-bold ml-1.5 transition-colors cursor-pointer"
                  >
                    {mode === 'login' ? 'Criar Conta' : 'Acessar Conta'}
                  </button>
                </p>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
