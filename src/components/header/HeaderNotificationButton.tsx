import React, { memo } from 'react';
import { Bell } from 'lucide-react';

interface HeaderNotificationButtonProps {
  active?: boolean;
  unreadCount?: number;
  onClick: () => void;
}

function HeaderNotificationButton({
  active = false,
  unreadCount = 0,
  onClick,
}: HeaderNotificationButtonProps) {
  const badgeLabel = unreadCount > 9 ? '9+' : String(unreadCount);

  return (
    <button
      type="button"
      id="notification-toggle"
      onClick={onClick}
      className={`header-notify-btn group ${active ? 'header-notify-btn--active' : ''}`}
      aria-label={unreadCount > 0 ? `Notificações, ${unreadCount} novas` : 'Notificações'}
    >
      <span className="header-notify-btn-glow" aria-hidden="true" />
      <span className="header-notify-btn-surface">
        <Bell className="header-notify-btn-icon" strokeWidth={2} />
      </span>
      {unreadCount > 0 && (
        <span className="header-notify-btn-badge" aria-hidden="true">
          {badgeLabel}
        </span>
      )}
    </button>
  );
}

export default memo(HeaderNotificationButton);
