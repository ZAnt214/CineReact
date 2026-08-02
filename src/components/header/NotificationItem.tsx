import React, { memo, useCallback } from 'react';
import { Bell, Check, Heart, Play } from 'lucide-react';
import type { Notificacao } from '../../types.ts';
import { formatNotificationTime } from '../../utils/notificationTime.ts';
import { getNotificationKind } from '../../utils/notificationKind.ts';

interface NotificationItemProps {
  notification: Notificacao;
  onMarkAsRead: (id: string) => void;
}

function NotificationIcon({ kind }: { kind: ReturnType<typeof getNotificationKind> }) {
  if (kind === 'support') {
    return (
      <span className="notification-item-icon notification-item-icon--support">
        <Heart className="w-3.5 h-3.5 fill-current" />
      </span>
    );
  }

  if (kind === 'react') {
    return (
      <span className="notification-item-icon notification-item-icon--react">
        <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
      </span>
    );
  }

  return (
    <span className="notification-item-icon notification-item-icon--general">
      <Bell className="w-3.5 h-3.5" strokeWidth={2} />
    </span>
  );
}

function NotificationItem({ notification, onMarkAsRead }: NotificationItemProps) {
  const isUnread = !notification.lida;
  const kind = getNotificationKind(notification);
  const timeLabel = formatNotificationTime(notification.criadoEm);

  const handleMarkAsRead = useCallback(() => {
    onMarkAsRead(notification.id);
  }, [notification.id, onMarkAsRead]);

  return (
    <article
      className={`notification-item ${isUnread ? 'notification-item--unread' : ''}`}
      style={{ contentVisibility: 'auto', containIntrinsicSize: '0 88px' }}
    >
      <NotificationIcon kind={kind} />

      <div className="notification-item-body">
        <div className="notification-item-head">
          <h4 className="notification-item-title">{notification.titulo}</h4>
          <time className="notification-item-time" dateTime={notification.criadoEm}>
            {timeLabel}
          </time>
        </div>
        <p className="notification-item-message">{notification.mensagem}</p>
        {notification.canalNome && (
          <p className="notification-item-meta">{notification.canalNome}</p>
        )}
      </div>

      {isUnread && (
        <button
          type="button"
          onClick={handleMarkAsRead}
          className="notification-item-read-btn"
          title="Marcar como lida"
          aria-label={`Marcar "${notification.titulo}" como lida`}
        >
          <Check className="w-3.5 h-3.5" strokeWidth={2.5} />
        </button>
      )}
    </article>
  );
}

export default memo(NotificationItem);
