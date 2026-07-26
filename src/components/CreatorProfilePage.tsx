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
    <div className="w-full min-h-screen">
      <div className="relative overflow-hidden border-b border-fuchsia-500/10 bg-gradient-to-br from-fuchsia-950/40 via-zinc-950 to-cyan-950/30">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(217,70,239,0.12),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(34,211,238,0.08),transparent_55%)]" />

        <div className="relative cine-container pt-24 pb-10">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 text-sm font-bold text-zinc-400 hover:text-white transition-colors mb-8 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </button>

          {isDemo && (
            <div className="max-w-3xl mb-6 flex items-start gap-3 rounded-2xl border border-fuchsia-500/20 bg-fuchsia-500/10 px-4 py-3 backdrop-blur-sm">
              <Sparkles className="w-5 h-5 text-fuchsia-300 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-fuchsia-100">Perfil demonstrativo</p>
                <p className="text-xs text-fuchsia-100/75 mt-1 leading-relaxed">
                  Veja como o perfil de um criador de vídeo verificado oficial aparece na plataforma — selo, cosméticos Ateliê Visionário, bio e redes sociais.
                </p>
              </div>
            </div>
          )}

          {!loading && profile && (
            <div className="max-w-3xl">
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-fuchsia-300/70 mb-3">
                Criador verificado
              </p>
              <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">{profile.nome}</h1>
            </div>
          )}
        </div>
      </div>

      <div className="cine-container py-8 md:py-10">
        {loading && (
          <div className="flex flex-col items-center justify-center py-24 text-zinc-500">
            <Loader2 className="w-8 h-8 animate-spin mb-3 text-amber-400" />
            <p className="text-sm">Carregando perfil...</p>
          </div>
        )}

        {!loading && error && (
          <div className="max-w-xl mx-auto rounded-2xl border border-red-500/20 bg-red-500/5 px-6 py-10 text-center">
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        )}

        {!loading && profile && (
          <div className="max-w-3xl mx-auto space-y-6">
            <PublicCreatorProfile profile={profile} size="md" align="start" showBio lite={false} />

            {profile.isVerifiedCreator && (
              <div className="flex items-center justify-center gap-2 text-xs text-zinc-500 pt-2">
                <BadgeCheck className="w-4 h-4 text-cyan-400" />
                Criador verificado oficial na plataforma CineReact
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
