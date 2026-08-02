import type { Notificacao } from '../types.ts';

export type NotificationKind = 'react' | 'support' | 'general';

export function getNotificationKind(notification: Notificacao): NotificationKind {
  const title = notification.titulo.toLowerCase();
  const message = notification.mensagem.toLowerCase();
  const combined = `${title} ${message}`;

  if (
    combined.includes('apoiador') ||
    combined.includes('vip') ||
    combined.includes('doação') ||
    combined.includes('doacao')
  ) {
    return 'support';
  }

  if (combined.includes('react') || combined.includes('vídeo') || combined.includes('video')) {
    return 'react';
  }

  return 'general';
}
