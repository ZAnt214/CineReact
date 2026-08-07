import type { MinutagemContentType } from '../types/minutagem.ts';
import { MINUTAGEM_CONTENT_LABELS } from '../types/minutagem.ts';

export function parseMinutagemInput(raw: string): { minutos: number; segundos: number } | null {
  const trimmed = raw.trim().toLowerCase();
  if (!trimmed) return null;

  if (trimmed.includes(':')) {
    const parts = trimmed.split(':').map((p) => p.trim());
    if (parts.length === 2) {
      const minutos = Number(parts[0]);
      const segundos = Number(parts[1]);
      if (Number.isFinite(minutos) && Number.isFinite(segundos) && minutos >= 0 && segundos >= 0 && segundos < 60) {
        return { minutos, segundos };
      }
    }
    if (parts.length === 3) {
      const horas = Number(parts[0]);
      const minutos = Number(parts[1]);
      const segundos = Number(parts[2]);
      if (
        Number.isFinite(horas) &&
        Number.isFinite(minutos) &&
        Number.isFinite(segundos) &&
        horas >= 0 &&
        minutos >= 0 &&
        minutos < 60 &&
        segundos >= 0 &&
        segundos < 60
      ) {
        return { minutos: horas * 60 + minutos, segundos };
      }
    }
    return null;
  }

  const onlyDigits = trimmed.replace(/[^\d]/g, '');
  if (!onlyDigits) return null;
  const minutos = Number(onlyDigits);
  if (!Number.isFinite(minutos) || minutos < 0) return null;
  return { minutos, segundos: 0 };
}

export function formatMinutagemClock(minutos: number, segundos = 0): string {
  const total = minutos * 60 + segundos;
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function formatMinutagem(minutos: number, segundos = 0): string {
  const total = minutos * 60 + segundos;
  const h = Math.floor(total / 3600);
  if (h > 0) return formatMinutagemClock(minutos, segundos);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (s > 0) return `${m}:${String(s).padStart(2, '0')}`;
  return `${m} min`;
}

export function formatMinutagemRange(
  minutos: number,
  segundos = 0,
  fimMinutos?: number,
  fimSegundos?: number
): string {
  const inicio = formatMinutagemClock(minutos, segundos);
  if (fimMinutos !== undefined) {
    return `${inicio} → ${formatMinutagemClock(fimMinutos, fimSegundos || 0)}`;
  }
  return inicio;
}

export function formatDuracaoSegundos(segundos?: number): string | null {
  if (!segundos || segundos <= 0) return null;
  if (segundos < 60) return `${segundos}s`;
  const m = Math.floor(segundos / 60);
  const s = segundos % 60;
  return s > 0 ? `${m}m${String(s).padStart(2, '0')}s` : `${m}min`;
}

export function contentTypeLabel(tipo: MinutagemContentType): string {
  return MINUTAGEM_CONTENT_LABELS[tipo] || tipo;
}

export function contentTypeBadgeClass(tipo: MinutagemContentType): string {
  switch (tipo) {
    case 'nude':
      return 'bg-rose-500/15 text-rose-300 border-rose-500/30';
    case 'sexo':
      return 'bg-fuchsia-500/15 text-fuchsia-300 border-fuchsia-500/30';
    case 'violencia':
      return 'bg-orange-500/15 text-orange-300 border-orange-500/30';
    default:
      return 'bg-zinc-500/15 text-zinc-300 border-zinc-500/30';
  }
}
