import React, { useState } from 'react';
import {
  BadgeCheck,
  Clock,
  CheckCircle2,
  Copy,
  ExternalLink,
  Loader2,
  LogIn,
  Youtube,
  ShieldCheck,
} from 'lucide-react';
import type { UserState } from '../types.ts';
import { CREATOR_VERIFICATION_WINDOW_HOURS } from '../types/creatorVerification.ts';
import { useCreatorVerificationStatus } from '../hooks/useCreatorVerification.ts';

interface CreatorVerificationPageProps {
  user: UserState;
  onOpenAuth: () => void;
  onVerified?: () => void;
}

export default function CreatorVerificationPage({
  user,
  onOpenAuth,
  onVerified,
}: CreatorVerificationPageProps) {
  const [channelUrl, setChannelUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const {
    data,
    loading,
    submitting,
    checking,
    error,
    startVerification,
    checkDescription,
    refresh,
  } = useCreatorVerificationStatus(user.email, user.isLoggedIn);

  const isVerified = data?.isVerifiedCreator;
  const request = data?.request;
  const isPending = request?.status === 'pending' && !isVerified;
  const wasRejected = request?.status === 'rejected' && !isVerified;
  const wasExpired = request?.status === 'expired' && !isVerified;

  React.useEffect(() => {
    if (data?.isVerifiedCreator) {
      onVerified?.();
    }
  }, [data?.isVerifiedCreator, onVerified]);

  const handleStart = async () => {
    if (!user.isLoggedIn) {
      onOpenAuth();
      return;
    }
    if (!channelUrl.trim()) return;
    await startVerification(channelUrl.trim());
  };

  const handleCopyCode = async () => {
    if (!request?.verificationCode) return;
    try {
      await navigator.clipboard.writeText(request.verificationCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#07090f]">
      <div className="cine-container pt-20 pb-28">
        <div className="max-w-3xl mx-auto space-y-8">
          <section className="text-center space-y-5">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/10 bg-neutral-900/80 text-cyan-100 text-[11px] font-bold uppercase tracking-wider">
              <BadgeCheck className="w-3.5 h-3.5 text-amber-300" />
              Criador Verificado
            </span>

            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-tight">
              Verifique seu canal e{' '}
              <span className="bg-gradient-to-r from-amber-200 via-amber-100 to-cyan-300 bg-clip-text text-transparent">
                brilhe na CineReact
              </span>
            </h1>

            <p className="text-sm sm:text-base text-zinc-400 max-w-lg mx-auto leading-relaxed">
              Adicione um código temporário na descrição do seu canal no YouTube. Nossa equipe confirma
              em até{' '}
              <span className="text-white font-semibold">{CREATOR_VERIFICATION_WINDOW_HOURS} horas</span>.
            </p>
          </section>

          {!user.isLoggedIn && (
            <div className="rounded-2xl border border-white/10 bg-neutral-900/50 p-5 flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 flex items-center justify-center text-cyan-300 shrink-0">
                <LogIn className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-white">Entre para verificar</p>
                <p className="text-xs text-zinc-500 mt-1">Vinculamos a verificação ao seu perfil CineReact.</p>
              </div>
              <button
                type="button"
                onClick={onOpenAuth}
                className="px-5 py-2.5 rounded-full bg-cyan-400 text-black text-sm font-extrabold"
              >
                Fazer login
              </button>
            </div>
          )}

          {isVerified && (
            <div className="rounded-2xl border border-emerald-400/30 bg-emerald-950/25 p-5 flex items-start gap-4">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 shrink-0" />
              <div>
                <p className="text-base font-bold text-white">Seu perfil já está verificado</p>
                <p className="text-sm text-zinc-400 mt-1">
                  O selo de criador verificado e o perfil público premium já estão ativos na sua conta.
                </p>
              </div>
            </div>
          )}

          {isPending && request && (
            <div className="rounded-2xl border border-amber-400/25 bg-neutral-900/60 p-5 sm:p-6 space-y-5">
              <div className="flex items-start gap-4">
                <Clock className="w-5 h-5 text-amber-300 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-base font-bold text-white">Verificação em andamento</p>
                  <p className="text-sm text-zinc-400 mt-1">
                    {request.channelTitle ? (
                      <>
                        Canal: <span className="text-white font-medium">{request.channelTitle}</span>
                      </>
                    ) : (
                      'Aguardando confirmação da equipe.'
                    )}
                  </p>
                  <p className="text-xs text-zinc-500 mt-2">
                    Prazo: até{' '}
                    {new Date(request.expiresAt).toLocaleString('pt-BR', {
                      day: '2-digit',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-white/10 bg-neutral-950/80 p-4 space-y-3">
                <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                  Código para colar na descrição do canal
                </p>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <code className="flex-1 px-4 py-3 rounded-xl bg-black/50 border border-amber-400/25 text-amber-200 font-mono text-sm sm:text-base tracking-wide text-center sm:text-left">
                    {request.verificationCode}
                  </code>
                  <button
                    type="button"
                    onClick={handleCopyCode}
                    className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-xs font-bold text-white hover:bg-white/10"
                  >
                    <Copy className="w-4 h-4" />
                    {copied ? 'Copiado!' : 'Copiar'}
                  </button>
                </div>
                <p className="text-xs text-zinc-500 leading-relaxed">
                  No YouTube Studio, vá em Personalização → Informações básicas → Descrição. Cole o código,
                  salve e aguarde alguns minutos para propagar.
                </p>
                <a
                  href={request.youtubeChannelUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-cyan-300 hover:text-cyan-200"
                >
                  Abrir canal no YouTube <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              {request.codeFoundInDescription ? (
                <div className="flex items-center gap-2 text-sm text-emerald-300">
                  <ShieldCheck className="w-4 h-4 shrink-0" />
                  Código detectado na descrição. Aguarde a aprovação da equipe.
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => checkDescription(request.id)}
                  disabled={checking}
                  className="w-full py-3 rounded-xl bg-cyan-400/90 hover:bg-cyan-400 text-black text-sm font-extrabold disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {checking ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Verificando descrição...
                    </>
                  ) : (
                    'Já coloquei o código na descrição'
                  )}
                </button>
              )}
            </div>
          )}

          {(wasRejected || wasExpired) && (
            <div className="rounded-2xl border border-rose-500/25 bg-rose-950/15 p-5 text-sm">
              <p className="font-bold text-white mb-1">
                {wasExpired ? 'Solicitação expirada' : 'Verificação não aprovada'}
              </p>
              <p className="text-zinc-400">
                {request?.adminNote ||
                  (wasExpired
                    ? 'O prazo de 24 horas acabou. Inicie uma nova solicitação abaixo.'
                    : 'Confira se o código está visível na descrição do canal e tente novamente.')}
              </p>
            </div>
          )}

          {error && <p className="text-center text-sm text-rose-400 font-medium">{error}</p>}

          {!isVerified && !isPending && (
            <section className="rounded-3xl border border-amber-400/15 bg-neutral-900/40 p-8 space-y-5">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-red-500/10 flex items-center justify-center">
                  <Youtube className="w-6 h-6 text-red-400" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">Seu canal no YouTube</p>
                  <p className="text-xs text-zinc-500">Link completo ou @ do canal</p>
                </div>
              </div>

              <input
                type="text"
                value={channelUrl}
                onChange={(e) => setChannelUrl(e.target.value)}
                placeholder="ex: @seucanal ou youtube.com/@seucanal"
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-cyan-400/40"
              />

              <ol className="text-xs text-zinc-500 space-y-2 list-decimal list-inside">
                <li>Informe o canal que você quer verificar</li>
                <li>Receba um código único (ex: CINEREACT-ABC123)</li>
                <li>Cole na descrição do canal no YouTube</li>
                <li>Aguarde até {CREATOR_VERIFICATION_WINDOW_HOURS}h para aprovação</li>
              </ol>

              <button
                type="button"
                onClick={handleStart}
                disabled={submitting || loading || !channelUrl.trim()}
                className="w-full py-3.5 rounded-full bg-gradient-to-r from-amber-500 via-amber-400 to-cyan-400 text-black text-sm font-extrabold disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submitting || loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processando...
                  </>
                ) : (
                  <>
                    <BadgeCheck className="w-4 h-4" />
                    Solicitar verificação
                  </>
                )}
              </button>
            </section>
          )}

          {isPending && (
            <button
              type="button"
              onClick={() => refresh()}
              className="block mx-auto text-xs text-zinc-500 hover:text-zinc-300 underline"
            >
              Atualizar status
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
