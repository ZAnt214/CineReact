import React, { useState } from 'react';
import {
  LayoutDashboard,
  Link2,
  LayoutGrid,
  Inbox,
  Shield,
  Users,
  Trophy,
  BarChart3,
  CreditCard,
  Settings,
  Database,
  Menu,
  X,
  ChevronRight,
  LogOut,
  Pin,
  Zap,
  Clock,
  Wallet,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import type { UserState } from '../types.ts';

export type AdminSection =
  | 'dashboard'
  | 'gestao'
  | 'catalogo'
  | 'conteudo'
  | 'criadores'
  | 'moderacao'
  | 'usuarios'
  | 'gamificacao'
  | 'analytics'
  | 'monetizacao'
  | 'financeiro'
  | 'configuracoes'
  | 'sistema'
  | 'cineclips'
  | 'minutagem';

const NAV: { id: AdminSection; label: string; icon: React.ElementType; group: string }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, group: 'Geral' },
  { id: 'gestao', label: 'Categorias & Home', icon: Pin, group: 'Conteúdo' },
  { id: 'catalogo', label: 'Catálogo', icon: Link2, group: 'Conteúdo' },
  { id: 'conteudo', label: 'Obras & Vídeos', icon: LayoutGrid, group: 'Conteúdo' },
  { id: 'cineclips', label: 'CineClips', icon: Zap, group: 'Conteúdo' },
  { id: 'minutagem', label: 'Minutagem', icon: Clock, group: 'Conteúdo' },
  { id: 'criadores', label: 'Criadores', icon: Inbox, group: 'Conteúdo' },
  { id: 'moderacao', label: 'Moderação', icon: Shield, group: 'Comunidade' },
  { id: 'usuarios', label: 'Usuários', icon: Users, group: 'Comunidade' },
  { id: 'gamificacao', label: 'Gamificação', icon: Trophy, group: 'Engajamento' },
  { id: 'analytics', label: 'Analytics', icon: BarChart3, group: 'Engajamento' },
  { id: 'monetizacao', label: 'Monetização', icon: CreditCard, group: 'Negócio' },
  { id: 'financeiro', label: 'Financeiro', icon: Wallet, group: 'Negócio' },
  { id: 'configuracoes', label: 'Configurações', icon: Settings, group: 'Sistema' },
  { id: 'sistema', label: 'Sistema & Backup', icon: Database, group: 'Sistema' },
];

interface AdminLayoutProps {
  user: UserState;
  active: AdminSection;
  onNavigate: (section: AdminSection) => void;
  onExit?: () => void;
  children: React.ReactNode;
}

export default function AdminLayout({ user, active, onNavigate, onExit, children }: AdminLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const groups = [...new Set(NAV.map(n => n.group))];
  const current = NAV.find(n => n.id === active);

  const sidebar = (
    <div className="flex flex-col h-full">
      <div className="px-4 py-5 border-b border-neutral-800/80">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-cine-accent/80">CineReact</p>
        <h1 className="text-lg font-black text-white mt-1">Admin Center</h1>
        <p className="text-[11px] text-zinc-500 mt-1 truncate">{user.email}</p>
      </div>
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-5">
        {groups.map(group => (
          <div key={group}>
            <p className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-zinc-600">{group}</p>
            <div className="space-y-1">
              {NAV.filter(n => n.group === group).map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => { onNavigate(id); setMobileOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-sm font-semibold transition-colors ${
                    active === id
                      ? 'bg-cine-accent/15 text-cine-accent-light border border-cine-accent/25'
                      : 'text-zinc-400 hover:text-white hover:bg-neutral-900/60 border border-transparent'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="truncate">{label}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </nav>
      {onExit && (
        <div className="p-3 border-t border-neutral-800/80">
          <button
            type="button"
            onClick={onExit}
            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold text-zinc-400 hover:text-white hover:bg-neutral-900/60"
          >
            <LogOut className="w-4 h-4" />
            Voltar ao site
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-cine-bg text-white">
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-3 bg-neutral-950/95 border-b border-neutral-800 backdrop-blur-md">
        <button type="button" onClick={() => setMobileOpen(true)} className="p-2 rounded-lg bg-neutral-900 border border-neutral-800">
          <Menu className="w-5 h-5" />
        </button>
        <span className="text-sm font-bold">{current?.label || 'Admin'}</span>
        <div className="w-9" />
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="lg:hidden fixed inset-0 z-[60] bg-black/70" onClick={() => setMobileOpen(false)} />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.2 }}
              className="lg:hidden fixed left-0 top-0 bottom-0 z-[61] w-72 bg-neutral-950 border-r border-neutral-800"
            >
              <button type="button" onClick={() => setMobileOpen(false)} className="absolute top-4 right-4 p-2 text-zinc-400">
                <X className="w-5 h-5" />
              </button>
              {sidebar}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <div className="flex min-h-screen pt-14 lg:pt-0">
        <aside className="hidden lg:flex lg:w-72 lg:shrink-0 lg:border-r lg:border-neutral-800 lg:bg-neutral-950/50 lg:sticky lg:top-0 lg:h-screen">
          {sidebar}
        </aside>

        <main className="flex-1 min-w-0">
          <div className="hidden lg:flex items-center gap-2 px-8 py-5 border-b border-neutral-800/80 bg-neutral-950/30">
            <span className="text-xs text-zinc-500">Admin</span>
            <ChevronRight className="w-3.5 h-3.5 text-zinc-600" />
            <span className="text-sm font-bold text-white">{current?.label}</span>
          </div>
          <div className="p-4 md:p-6 lg:p-8 max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
