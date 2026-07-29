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
    <div className="min-h-screen bg-cine-bg text-white flex flex-col items-center justify-center px-6 text-center">
      <div className="max-w-lg w-full space-y-8">
        <div className="flex justify-center">
          {settings.logoUrl ? (
            <img src={settings.logoUrl} alt={siteName} className="h-14 w-auto object-contain" />
          ) : (
            <CineReactLogo className="h-14 w-auto" />
          )}
        </div>

        <div className="rounded-3xl border border-neutral-800 bg-neutral-900/50 p-8 shadow-2xl">
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
