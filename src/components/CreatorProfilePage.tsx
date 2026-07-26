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
    <div className="max-w-3xl mx-auto px-4 py-8 md:py-12">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-2 text-sm font-bold text-zinc-400 hover:text-white transition-colors mb-6 cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        Voltar
      </button>

      {loading && (
        <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
          <Loader2 className="w-8 h-8 animate-spin mb-3" />
          <p className="text-sm">Carregando perfil...</p>
        </div>
      )}

      {!loading && error && (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/5 px-6 py-8 text-center">
          <p className="text-red-300 text-sm">{error}</p>
        </div>
      )}

      {!loading && profile && (
        <div className="space-y-6">
          {isDemo && (
            <div className="rounded-2xl border border-fuchsia-500/25 bg-fuchsia-500/10 px-4 py-3 flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-fuchsia-300 shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="text-sm font-bold text-fuchsia-200">Perfil demonstrativo</p>
                <p className="text-xs text-fuchsia-100/80 mt-1 leading-relaxed">
                  Este é um exemplo de como o perfil de um criador verificado oficial aparece na plataforma — com selo, cosméticos Ateliê Visionário, bio e redes sociais.
                </p>
              </div>
            </div>
          )}

          <PublicCreatorProfile profile={profile} size="md" align="start" showBio lite={false} />

          {profile.isVerifiedCreator && (
            <div className="flex items-center gap-2 text-xs text-zinc-500">
              <BadgeCheck className="w-4 h-4 text-cyan-400" />
              Criador verificado oficial na plataforma CineReact
            </div>
          )}
        </div>
      )}
    </div>
  );
}
