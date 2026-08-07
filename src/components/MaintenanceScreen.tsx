import { Wrench } from 'lucide-react';
import CineReactLogo from './CineReactLogo.tsx';
import type { PublicPlatformSettings } from '../hooks/usePlatformSettings.ts';

interface MaintenanceScreenProps {
  settings: PublicPlatformSettings;
}

export default function MaintenanceScreen({ settings }: MaintenanceScreenProps) {
  const siteName = settings.siteName || 'CineReact';
  const message = settings.maintenanceMessage || 'Estamos em manutenção. Voltamos em breve!';
  const accent = settings.accentColor || '#00d4ff';

  return (
    <div className="min-h-screen bg-cine-bg text-white flex items-center justify-center px-6 py-10">
      <div className="w-full max-w-lg">
        <div className="flex justify-center mb-8">
          {settings.logoUrl ? (
            <img
              src={settings.logoUrl}
              alt={siteName}
              className="h-12 md:h-14 w-auto max-w-[220px] object-contain mx-auto block"
            />
          ) : (
            <CineReactLogo size="lg" align="center" showTagline={false} animated />
          )}
        </div>

        <div className="rounded-3xl border border-neutral-800 bg-neutral-900/50 p-8 shadow-2xl text-center">
          <div
            className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border"
            style={{
              borderColor: `${accent}40`,
              backgroundColor: `${accent}15`,
              color: accent,
            }}
          >
            <Wrench className="h-8 w-8" />
          </div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight">{siteName}</h1>
          <p className="mt-2 text-sm font-bold uppercase tracking-[0.2em] text-cine-accent-light">
            Modo manutenção
          </p>
          <p className="mt-5 text-base text-zinc-300 leading-relaxed">{message}</p>
          <p className="mt-6 text-xs text-zinc-500">
            Estamos atualizando a plataforma para melhorar sua experiência. Obrigado pela compreensão.
          </p>
        </div>
      </div>
    </div>
  );
}
