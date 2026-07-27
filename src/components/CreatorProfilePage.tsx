import React, { useEffect, useState } from 'react';
import { ArrowLeft, BadgeCheck, Loader2, Sparkles } from 'lucide-react';
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
        <div className="max-w-2xl mb-8 flex items-start gap-3 rounded-xl border border-cine-accent/25 bg-cine-accent/5 px-4 py-3">
          <Sparkles className="w-4 h-4 text-cine-accent shrink-0 mt-0.5" />
          <p className="text-sm text-zinc-300 leading-relaxed">
            <span className="font-bold text-fuchsia-200">Perfil demonstrativo.</span>{' '}
            Exemplo de como criadores de vídeo verificados aparecem na plataforma.
          </p>
        </div>
      )}

      {loading && (
        <div className="flex flex-col items-center justify-center py-24 text-zinc-500">
          <Loader2 className="w-7 h-7 animate-spin mb-3 text-cine-accent-light" />
          <p className="text-sm">Carregando perfil...</p>
        </div>
      )}

      {!loading && error && (
        <div className="max-w-xl rounded-xl border border-red-500/20 bg-red-500/5 px-6 py-8 text-center">
          <p className="text-red-300 text-sm">{error}</p>
        </div>
      )}

      {!loading && profile && (
        <div className="max-w-2xl space-y-4">
          <PublicCreatorProfile profile={profile} size="md" align="start" showBio lite={false} />
          {profile.isVerifiedCreator && (
            <p className="flex items-center gap-2 text-xs text-zinc-500 pt-1">
              <BadgeCheck className="w-3.5 h-3.5 text-cine-accent" />
              Criador verificado oficial na CineReact
            </p>
          )}
        </div>
      )}
    </div>
  );
}
