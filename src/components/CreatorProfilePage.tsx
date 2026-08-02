import React, { useEffect, useState } from 'react';
import { ArrowLeft, Loader2 } from 'lucide-react';
import PublicCreatorProfile from './profile/PublicCreatorProfile.tsx';
import CreatorProfileShowcase from './profile/CreatorProfileShowcase.tsx';
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
        <header className="creator-showcase-intro max-w-2xl mb-6">
          <p className="creator-showcase-intro-label">Perfil de referência</p>
          <h2 className="creator-showcase-intro-title">
            É assim que um criador verificado aparece na CineReact
          </h2>
          <p className="creator-showcase-intro-copy">
            Selo, moldura, tema e links oficiais — tudo na paleta do site, leve e pronto para inspirar.
          </p>
        </header>
      )}

      {loading && (
        <div className="flex flex-col items-center justify-center py-24 text-zinc-500">
          <Loader2 className="w-7 h-7 animate-spin mb-3 text-cine-accent/70" />
          <p className="text-sm">Carregando perfil...</p>
        </div>
      )}

      {!loading && error && (
        <div className="max-w-xl rounded-xl border border-red-500/20 bg-red-500/5 px-6 py-8 text-center">
          <p className="text-red-300 text-sm">{error}</p>
        </div>
      )}

      {!loading && profile && (
        <div className="max-w-2xl">
          {isDemo ? (
            <CreatorProfileShowcase profile={profile} />
          ) : (
            <PublicCreatorProfile profile={profile} size="md" align="start" showBio lite={false} />
          )}
        </div>
      )}
    </div>
  );
}
