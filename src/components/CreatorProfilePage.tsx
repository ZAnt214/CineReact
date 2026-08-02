import React, { useEffect, useState } from 'react';
import { ArrowLeft, BadgeCheck, Loader2 } from 'lucide-react';
import PublicCreatorProfile from './profile/PublicCreatorProfile.tsx';
import { DEMO_CREATOR_EMAIL } from '../constants/demoCreator.ts';
import type { PublicUserProfile } from '../types.ts';

interface CreatorProfilePageProps {
  creatorEmail: string;
  onBack: () => void;
}

export default function CreatorProfilePage({ creatorEmail, onBack }: CreatorProfilePageProps) {
  const [profile, setProfile] = useState<PublicUserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await fetch(`/api/usuario/public/${encodeURIComponent(creatorEmail)}`);
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok || !data?.success || !data.profile) {
          setError(data?.error || 'Perfil não encontrado.');
          setProfile(null);
          return;
        }
        setProfile(data.profile);
      } catch {
        if (!cancelled) {
          setError('Não foi possível carregar o perfil.');
          setProfile(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [creatorEmail]);

  const isDemo = creatorEmail.toLowerCase() === DEMO_CREATOR_EMAIL.toLowerCase();

  return (
    <div className="cine-container pt-24 pb-16 min-h-screen">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-2 text-sm font-bold text-zinc-400 hover:text-white transition-colors mb-8 cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        Voltar
      </button>

      {isDemo && (
        <div className="max-w-3xl mb-8 rounded-2xl border border-neutral-800/70 bg-neutral-900/30 px-4 py-3.5">
          <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-semibold mb-1">
            Perfil de referência
          </p>
          <p className="text-sm text-zinc-400 leading-relaxed">
            Exemplo de como fica um canal verificado — com tema, moldura, selo e links sociais ativos.
          </p>
        </div>
      )}

      {loading && (
        <div className="flex flex-col items-center justify-center py-24 text-zinc-500">
          <Loader2 className="w-7 h-7 animate-spin mb-3 text-zinc-400" />
          <p className="text-sm">Carregando perfil...</p>
        </div>
      )}

      {!loading && error && (
        <div className="max-w-xl rounded-xl border border-red-500/20 bg-red-500/5 px-6 py-8 text-center">
          <p className="text-red-300 text-sm">{error}</p>
        </div>
      )}

      {!loading && profile && (
        <div className="max-w-3xl space-y-5">
          <PublicCreatorProfile profile={profile} size="md" align="start" showBio lite={false} />
          {profile.isVerifiedCreator && (
            <p className="flex items-center gap-2 text-xs text-zinc-500 pl-1">
              <BadgeCheck className="w-3.5 h-3.5 text-amber-400/80" />
              Identidade confirmada pela equipe CineReact
            </p>
          )}
        </div>
      )}
    </div>
  );
}
