import React, { useEffect, useState } from 'react';
import { ArrowLeft, Loader2 } from 'lucide-react';
import PublicCreatorProfile from './profile/PublicCreatorProfile.tsx';
import VerifiedCreatorProfile from './profile/VerifiedCreatorProfile.tsx';
import { DEMO_CREATOR_EMAIL } from '../constants/demoCreator.ts';
import type { PublicUserProfile } from '../types.ts';

interface CreatorProfilePageProps {
  creatorEmail: string;
  onBack: () => void;
  showVerifyCta?: boolean;
  onVerifyProfile?: () => void;
}

export default function CreatorProfilePage({
  creatorEmail,
  onBack,
  showVerifyCta = false,
  onVerifyProfile,
}: CreatorProfilePageProps) {
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
  const isVerified = !!profile?.isVerifiedCreator;
  const premiumActive = isDemo || isVerified;

  return (
    <div className={`cine-container pt-24 pb-20 min-h-screen w-full ${premiumActive ? 'creator-profile-premium' : ''}`}>
      <button
        type="button"
        onClick={onBack}
        className={`group inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-black uppercase tracking-wider transition-colors mb-8 cursor-pointer ${
          premiumActive
            ? 'creator-premium-back'
            : 'bg-neutral-900/80 hover:bg-cine-accent/20 text-zinc-300 hover:text-cine-accent-light border border-neutral-800 hover:border-cine-accent/40'
        }`}
      >
        <ArrowLeft
          className={`w-4 h-4 group-hover:-translate-x-0.5 transition-transform ${
            premiumActive ? 'text-[var(--premium-gold-light)]' : 'text-cine-accent-light'
          }`}
        />
        Voltar
      </button>

      <header className="relative pb-2 md:pb-4 mb-6">
        <p
          className={`text-[11px] uppercase tracking-[0.32em] font-semibold ${
            premiumActive ? 'creator-premium-label' : 'text-zinc-500'
          }`}
        >
          {isVerified || isDemo ? 'Criadores' : 'Perfil'}
        </p>
        <h1
          className={`font-display text-[1.5rem] sm:text-[1.75rem] md:text-[2rem] font-bold leading-snug tracking-tight mt-1 ${
            premiumActive ? 'creator-premium-page-title' : 'text-white'
          }`}
        >
          {loading ? 'Carregando…' : profile?.nome ?? 'Criador'}
        </h1>
        {(isVerified || isDemo) && (
          <p className="text-sm text-[var(--premium-muted)] mt-1.5 leading-relaxed">
            Canal verificado na{' '}
            <span className="creator-premium-brand">CineReact</span>
          </p>
        )}
        <div
          className={`mt-4 h-px ${
            premiumActive ? 'creator-premium-header-rule' : 'bg-gradient-to-r from-cine-accent/25 via-neutral-800/80 to-transparent'
          }`}
          aria-hidden
        />
      </header>

      {loading && (
        <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
          <Loader2
            className={`w-6 h-6 animate-spin mb-3 ${premiumActive ? 'creator-premium-spinner' : 'text-cine-accent/70'}`}
          />
          <p className="text-sm">Carregando perfil…</p>
        </div>
      )}

      {!loading && error && (
        <div className="max-w-xl rounded-xl border border-red-500/20 bg-red-500/5 px-6 py-8 text-center">
          <p className="text-red-300 text-sm">{error}</p>
        </div>
      )}

      {!loading && profile && (
        <div className="max-w-3xl">
          {isVerified ? (
            <VerifiedCreatorProfile
              profile={profile}
              showDemoExtras={isDemo}
              showVerifyCta={isDemo && showVerifyCta}
              onVerifyProfile={onVerifyProfile}
            />
          ) : (
            <PublicCreatorProfile profile={profile} size="md" align="start" showBio lite={false} />
          )}
        </div>
      )}
    </div>
  );
}
