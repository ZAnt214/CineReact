import { useState } from 'react';
import AdminLayout, { type AdminSection } from './AdminLayout.tsx';
import AdminPanel from '../components/AdminPanel.tsx';
import { AdminToastProvider } from './components/AdminToast.tsx';
import type { UserState } from '../types.ts';
import {
  DashboardPage,
  ContentManagePage,
  ModerationPage,
  UsersAdminPage,
  GamificationAdminPage,
  AnalyticsAdminPage,
  MonetizationAdminPage,
  SettingsAdminPage,
  SecurityAdminPage,
} from './pages/AdminPages.tsx';
import CineClipsAdminPage from './pages/CineClipsAdminPage.tsx';
import FinanceAdminPage from './pages/FinanceAdminPage.tsx';

interface AdminShellProps {
  user: UserState;
  onClose: () => void;
  onSelectObra: (id: string) => void;
}

export function AdminShell({ user, onClose, onSelectObra }: AdminShellProps) {
  const [section, setSection] = useState<AdminSection>('dashboard');
  const email = user.email || '';

  const renderSection = () => {
    switch (section) {
      case 'dashboard':
        return <DashboardPage email={email} />;
      case 'gestao':
        return <ContentManagePage email={email} />;
      case 'catalogo':
        return <AdminPanel user={user} onSelectObra={onSelectObra} forcedTab="catalogo" embedded />;
      case 'conteudo':
        return <AdminPanel user={user} onSelectObra={onSelectObra} forcedTab="conteudo" embedded />;
      case 'cineclips':
        return <CineClipsAdminPage email={email} />;
      case 'criadores':
        return <AdminPanel user={user} onSelectObra={onSelectObra} forcedTab="criadores" embedded />;
      case 'moderacao':
        return <ModerationPage email={email} />;
      case 'usuarios':
        return <UsersAdminPage email={email} />;
      case 'gamificacao':
        return <GamificationAdminPage email={email} />;
      case 'analytics':
        return <AnalyticsAdminPage email={email} />;
      case 'monetizacao':
        return <MonetizationAdminPage email={email} />;
      case 'financeiro':
        return <FinanceAdminPage email={email} />;
      case 'configuracoes':
        return <SettingsAdminPage email={email} />;
      case 'sistema':
        return (
          <div className="space-y-8">
            <SecurityAdminPage email={email} />
            <AdminPanel user={user} onSelectObra={onSelectObra} forcedTab="sistema" embedded />
          </div>
        );
      default:
        return <DashboardPage email={email} />;
    }
  };

  return (
    <AdminToastProvider>
      <AdminLayout user={user} active={section} onNavigate={setSection} onExit={onClose}>
        {renderSection()}
      </AdminLayout>
    </AdminToastProvider>
  );
}
