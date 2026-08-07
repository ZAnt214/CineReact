import React, { memo, useEffect, useMemo, useRef, useState } from 'react';
import { Bell, CheckCheck, Sparkles, Trash2, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import NotificationItem from './NotificationItem.tsx';
import type { Notificacao } from '../../types.ts';

type NotificationFilter = 'all' | 'unread';

interface NotificationPanelProps {
  open: boolean;
  notifications: Notificacao[];
  unreadCount: number;
  loading?: boolean;
  onClose: () => void;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onClearAll: () => void;
}

function NotificationPanel({
  open,
  notifications,
  unreadCount,
  loading = false,
  onClose,
  onMarkAsRead,
  onMarkAllAsRead,
  onClearAll,
}: NotificationPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [filter, setFilter] = useState<NotificationFilter>('all');

  useEffect(() => {
    if (!open) {
      setFilter('all');
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (panelRef.current?.contains(target)) return;
      if ((target as HTMLElement).closest('#notification-toggle')) return;
      onClose();
    };

    window.addEventListener('mousedown', onPointerDown);
    return () => window.removeEventListener('mousedown', onPointerDown);
  }, [open, onClose]);

  const filteredNotifications = useMemo(() => {
    const items =
      filter === 'unread' ? notifications.filter((item) => !item.lida) : notifications;

    return [...items].sort((a, b) => {
      if (a.lida !== b.lida) return a.lida ? 1 : -1;
      return new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime();
    });
  }, [filter, notifications]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.button
            type="button"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="notification-panel-backdrop md:hidden"
            onClick={onClose}
            aria-label="Fechar notificações"
          />

          <motion.section
            ref={panelRef}
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="notification-panel"
            aria-label="Painel de notificações"
            role="dialog"
            aria-modal="true"
          >
            <header className="notification-panel-header">
              <div className="notification-panel-heading">
                <span className="notification-panel-heading-icon" aria-hidden="true">
                  <Bell className="w-4 h-4" strokeWidth={2} />
                </span>
                <div>
                  <h3 className="notification-panel-title">Notificações</h3>
                  <p className="notification-panel-subtitle">
                    {unreadCount > 0
                      ? `${unreadCount} nova${unreadCount === 1 ? '' : 's'} para você`
                      : 'Tudo em dia por aqui'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="notification-panel-close"
                aria-label="Fechar painel"
              >
                <X className="w-4 h-4" />
              </button>
            </header>

            <div className="notification-panel-toolbar">
              <div className="notification-panel-filters" role="tablist" aria-label="Filtrar notificações">
                <button
                  type="button"
                  role="tab"
                  aria-selected={filter === 'all'}
                  className={`notification-panel-filter ${filter === 'all' ? 'is-active' : ''}`}
                  onClick={() => setFilter('all')}
                >
                  Todas
                  <span className="notification-panel-filter-count">{notifications.length}</span>
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={filter === 'unread'}
                  className={`notification-panel-filter ${filter === 'unread' ? 'is-active' : ''}`}
                  onClick={() => setFilter('unread')}
                >
                  Não lidas
                  <span className="notification-panel-filter-count">{unreadCount}</span>
                </button>
              </div>

              <div className="notification-panel-actions">
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={onMarkAllAsRead}
                    className="notification-panel-action"
                    title="Marcar todas como lidas"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    <span className="sr-only">Marcar todas como lidas</span>
                  </button>
                )}
                {notifications.length > 0 && (
                  <button
                    type="button"
                    onClick={onClearAll}
                    className="notification-panel-action notification-panel-action--danger"
                    title="Limpar tudo"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span className="sr-only">Limpar tudo</span>
                  </button>
                )}
              </div>
            </div>

            <div className="notification-panel-list">
              {loading && notifications.length === 0 ? (
                <div className="notification-panel-empty">
                  <div className="notification-panel-empty-icon notification-panel-empty-icon--loading">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <p className="notification-panel-empty-title">Carregando avisos...</p>
                </div>
              ) : filteredNotifications.length === 0 ? (
                <div className="notification-panel-empty">
                  <div className="notification-panel-empty-icon">
                    <Bell className="w-5 h-5" strokeWidth={1.75} />
                  </div>
                  <p className="notification-panel-empty-title">
                    {filter === 'unread' ? 'Nenhuma notificação nova' : 'Tudo limpo por aqui'}
                  </p>
                  <p className="notification-panel-empty-copy">
                    {filter === 'unread'
                      ? 'Você já leu todas as novidades recentes.'
                      : 'Avisaremos quando novos reacts dos canais que você segue forem lançados.'}
                  </p>
                </div>
              ) : (
                filteredNotifications.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onMarkAsRead={onMarkAsRead}
                  />
                ))
              )}
            </div>

            {notifications.length > 0 && (
              <footer className="notification-panel-footer">
                Atualizado automaticamente enquanto você navega
              </footer>
            )}
          </motion.section>
        </>
      )}
    </AnimatePresence>
  );
}

export default memo(NotificationPanel);
