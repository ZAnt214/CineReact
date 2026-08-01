import React, { useEffect, useState, useCallback } from 'react';
import {
  Users, Film, MessageSquare, Eye, UserPlus, Activity, Plus, Trash2, X,
  Shield, Award, Zap, Pin, Calendar, DollarSign, Save, Download, Loader2, Search, Ban, Percent,
  Heart, CheckCircle2, Clock, XCircle,
} from 'lucide-react';
import type { DonationRequest } from '../../types/donations.ts';
import type { AdminAnalytics, AdminCategory, AdminConfig, PlatformSettings } from '../../types/admin.ts';
import { useAdminApi } from '../hooks/useAdminApi.ts';
import { AdminStatCard, AdminPanelCard } from '../components/AdminUi.tsx';
import AdminConfirmModal from '../components/AdminConfirmModal.tsx';

function formatNum(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function LoadingState() {
  return (
    <div className="flex items-center justify-center py-24 text-zinc-500 gap-3">
      <Loader2 className="w-5 h-5 animate-spin text-cine-accent-light" />
      <span className="text-sm">Carregando...</span>
    </div>
  );
}

function PageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div>
      <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">{title}</h1>
      {subtitle && <p className="text-sm text-zinc-500 mt-1">{subtitle}</p>}
    </div>
  );
}

function RankList({ items }: { items: { label: string; sub?: string; value: string }[] }) {
  if (!items.length) return <p className="text-sm text-zinc-500">Sem dados ainda.</p>;
  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={i} className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-neutral-950/60 border border-neutral-800/60">
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate">{item.label}</p>
            {item.sub && <p className="text-xs text-zinc-500 truncate">{item.sub}</p>}
          </div>
          <span className="text-xs font-bold text-cine-accent-light shrink-0">{item.value}</span>
        </div>
      ))}
    </div>
  );
}

function ActionBtn({ label, onClick, danger }: { label: string; onClick: () => void; danger?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wide ${
        danger ? 'bg-red-950/50 text-red-300 border border-red-500/30' : 'bg-neutral-800 text-zinc-300 border border-neutral-700'
      }`}
    >
      {label}
    </button>
  );
}

export function DashboardPage({ email }: { email: string }) {
  const { request, loading } = useAdminApi(email);
  const [data, setData] = useState<{ analytics: AdminAnalytics; pendingReports: number; pendingComments: number; maintenanceMode: boolean } | null>(null);
  const load = useCallback(async () => {
    const res = await request<typeof data>('/api/admin/overview');
    if (res) setData(res);
  }, [request]);
  useEffect(() => { load(); }, [load]);
  if (loading && !data) return <LoadingState />;
  const a = data?.analytics;
  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" subtitle="Métricas reais da plataforma CineReact" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <AdminStatCard label="Usuários" value={a?.totals.users ?? 0} sub={`+${a?.totals.newUsersToday ?? 0} hoje`} icon={Users} />
        <AdminStatCard label="Reacts" value={a?.totals.reacts ?? 0} icon={Film} />
        <AdminStatCard label="Comentários" value={a?.totals.comments ?? 0} icon={MessageSquare} />
        <AdminStatCard label="Engajamento" value={formatNum(a?.totals.views ?? 0)} icon={Eye} />
        <AdminStatCard label="Ativos (7d)" value={a?.totals.activeUsers7d ?? 0} icon={Activity} accent="text-green-400" />
        <AdminStatCard label="Novos (semana)" value={a?.totals.newUsersWeek ?? 0} icon={UserPlus} accent="text-purple-400" />
        <AdminStatCard label="Denúncias" value={data?.pendingReports ?? 0} icon={Shield} accent="text-red-400" />
        <AdminStatCard label="Pendentes" value={data?.pendingComments ?? 0} icon={MessageSquare} accent="text-amber-400" />
      </div>
      <div className="grid lg:grid-cols-2 gap-4">
        <AdminPanelCard title="Reacts em destaque no CineReact">
          <RankList items={(a?.topVideos || []).map(v => ({ label: v.titulo, sub: v.canalNome, value: `${formatNum(v.visualizacoes)} pts` }))} />
        </AdminPanelCard>
        <AdminPanelCard title="Criadores em alta no CineReact">
          <RankList items={(a?.topChannels || []).map(c => ({ label: c.titulo, value: `${c.reactCount} reacts` }))} />
        </AdminPanelCard>
      </div>
    </div>
  );
}

export function ContentManagePage({ email }: { email: string }) {
  const { request, loading } = useAdminApi(email);
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [pins, setPins] = useState<any[]>([]);
  const [scheduled, setScheduled] = useState<any[]>([]);
  const [reacts, setReacts] = useState<any[]>([]);
  const [newCat, setNewCat] = useState({ name: '', slug: '' });
  const [pinId, setPinId] = useState('');
  const [sched, setSched] = useState({ targetId: '', title: '', publishAt: '', isLaunch: false });

  const load = useCallback(async () => {
    const [cats, p, s, r] = await Promise.all([
      request<AdminCategory[]>('/api/admin/categories'),
      request<any[]>('/api/admin/home-pins'),
      request<any[]>('/api/admin/scheduled'),
      request<any[]>('/api/reacts'),
    ]);
    if (cats) setCategories(cats);
    if (p) setPins(p);
    if (s) setScheduled(s);
    if (r) setReacts(r);
  }, [request]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-6">
      <PageHeader title="Gestão de Conteúdo" subtitle="Categorias, destaques, agendamentos e moderação" />
      <AdminPanelCard title="Categorias">
        <div className="flex flex-col sm:flex-row gap-2 mb-4">
          <input value={newCat.name} onChange={e => setNewCat({ ...newCat, name: e.target.value })} placeholder="Nome" className="flex-1 bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-sm" />
          <button type="button" onClick={async () => { await request('/api/admin/categories', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newCat) }); setNewCat({ name: '', slug: '' }); load(); }} className="px-4 py-2 rounded-xl bg-cine-accent text-xs font-bold">Adicionar</button>
        </div>
        <div className="space-y-2">{categories.map(c => (
          <div key={c.id} className="flex justify-between p-3 rounded-xl bg-neutral-950 border border-neutral-800 text-sm">
            <span className="font-semibold">{c.name}</span>
            <button type="button" onClick={() => request(`/api/admin/categories/${c.id}`, { method: 'DELETE' }).then(load)} className="text-red-400"><Trash2 className="w-4 h-4" /></button>
          </div>
        ))}</div>
      </AdminPanelCard>
      <div className="grid lg:grid-cols-2 gap-4">
        <AdminPanelCard title="Fixar na Home">
          <div className="flex gap-2 mb-3">
            <input value={pinId} onChange={e => setPinId(e.target.value)} placeholder="ID do react" className="flex-1 bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-sm" />
            <button type="button" onClick={() => request('/api/admin/home-pins', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'react', targetId: pinId }) }).then(() => { setPinId(''); load(); })} className="px-3 py-2 rounded-xl bg-cine-accent"><Pin className="w-4 h-4" /></button>
          </div>
          {pins.map(p => <div key={p.id} className="flex justify-between py-2 text-sm border-b border-neutral-800/50"><span>{p.targetId}</span><button type="button" onClick={() => request(`/api/admin/home-pins/${p.id}`, { method: 'DELETE' }).then(load)} className="text-red-400"><X className="w-4 h-4" /></button></div>)}
        </AdminPanelCard>
        <AdminPanelCard title="Agendar">
          <div className="space-y-2 mb-3">
            <input value={sched.title} onChange={e => setSched({ ...sched, title: e.target.value })} placeholder="Título" className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-sm" />
            <input value={sched.targetId} onChange={e => setSched({ ...sched, targetId: e.target.value })} placeholder="ID" className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-sm" />
            <input type="datetime-local" value={sched.publishAt} onChange={e => setSched({ ...sched, publishAt: e.target.value })} className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-sm" />
          </div>
          <button type="button" onClick={() => request('/api/admin/scheduled', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...sched, type: 'react', isFeatured: true }) }).then(load)} className="px-4 py-2 rounded-xl bg-cine-accent text-xs font-bold flex items-center gap-2"><Calendar className="w-4 h-4" /> Agendar</button>
          {scheduled.map(s => <div key={s.id} className="mt-2 text-sm flex justify-between p-2 bg-neutral-950 rounded-lg"><span>{s.title}</span><button type="button" onClick={() => request(`/api/admin/scheduled/${s.id}`, { method: 'DELETE' }).then(load)} className="text-red-400"><Trash2 className="w-3.5 h-3.5" /></button></div>)}
        </AdminPanelCard>
      </div>
      <AdminPanelCard title="Moderação de Vídeos">
        <div className="max-h-80 overflow-y-auto space-y-2">
          {reacts.slice(0, 40).map((r: any) => (
            <div key={r.id} className="flex flex-col sm:flex-row sm:items-center gap-2 p-3 rounded-xl bg-neutral-950 border border-neutral-800">
              <p className="flex-1 text-sm font-semibold truncate">{r.titulo}</p>
              <div className="flex gap-1">
                <ActionBtn label="Aprovar" onClick={() => request(`/api/admin/reacts/${r.id}/moderate`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ moderationStatus: 'approved' }) }, 'Vídeo aprovado.').then(load)} />
                <ActionBtn label="Ocultar" danger onClick={() => request(`/api/admin/reacts/${r.id}/moderate`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ moderationStatus: 'hidden' }) }, 'Vídeo ocultado do CineReact.').then(load)} />
              </div>
            </div>
          ))}
        </div>
      </AdminPanelCard>
      {loading && <Loader2 className="w-5 h-5 animate-spin mx-auto text-cine-accent" />}
    </div>
  );
}

export function ModerationPage({ email }: { email: string }) {
  const { request } = useAdminApi(email);
  const [comments, setComments] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [blockedWords, setBlockedWords] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [confirm, setConfirm] = useState<{ open: boolean; action: () => void }>({ open: false, action: () => {} });

  const load = useCallback(async () => {
    const [c, r, w] = await Promise.all([
      request<any[]>('/api/admin/comments'),
      request<any[]>('/api/admin/reports'),
      request<string[]>('/api/admin/blocked-words'),
    ]);
    if (c) setComments(c);
    if (r) setReports(r);
    if (w) setBlockedWords(w.join(', '));
  }, [request]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-6">
      <PageHeader title="Moderação" subtitle="Comentários, denúncias e palavras bloqueadas" />
      <AdminPanelCard title="Palavras bloqueadas">
        <textarea value={blockedWords} onChange={e => setBlockedWords(e.target.value)} rows={3} className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-sm mb-3" placeholder="palavra1, palavra2, ..." />
        <button type="button" onClick={() => request('/api/admin/blocked-words', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ words: blockedWords.split(',').map(w => w.trim()).filter(Boolean) }) }, 'Lista de palavras bloqueadas atualizada.')} className="px-4 py-2 rounded-xl bg-cine-accent text-xs font-bold">Salvar lista</button>
      </AdminPanelCard>
      <AdminPanelCard title="Comentários" actions={
        selected.length > 0 ? (
          <button type="button" onClick={() => setConfirm({ open: true, action: () => request('/api/admin/comments/bulk-delete', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids: selected }) }).then(() => { setSelected([]); load(); }) })} className="text-xs font-bold text-red-400">Excluir {selected.length}</button>
        ) : null
      }>
        <div className="max-h-96 overflow-y-auto space-y-2">
          {comments.map(c => (
            <div key={c.id} className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 text-sm">
              <div className="flex items-start gap-2">
                <input type="checkbox" checked={selected.includes(c.id)} onChange={e => setSelected(prev => e.target.checked ? [...prev, c.id] : prev.filter(id => id !== c.id))} />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold">{c.usuarioNome} <span className="text-zinc-500 font-normal">em {c.obraTitulo || c.obraId}</span></p>
                  <p className="text-zinc-300 mt-1">{c.texto}</p>
                </div>
              </div>
              <div className="flex gap-2 mt-2 ml-6">
                <ActionBtn label="Aprovar" onClick={() => request(`/api/admin/comments/${c.id}/moderate`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ moderationStatus: 'approved' }) }, 'Comentário aprovado.').then(load)} />
                <ActionBtn label="Ocultar" danger onClick={() => request(`/api/admin/comments/${c.id}/moderate`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ moderationStatus: 'hidden' }) }, 'Comentário ocultado.').then(load)} />
                <ActionBtn label="Excluir" danger onClick={() => request(`/api/admin/comments/bulk-delete`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids: [c.id] }) }, 'Comentário excluído.').then(load)} />
              </div>
            </div>
          ))}
        </div>
      </AdminPanelCard>
      <AdminPanelCard title="Denúncias">
        {reports.length === 0 ? <p className="text-sm text-zinc-500">Nenhuma denúncia aberta.</p> : reports.map(r => (
          <div key={r.id} className="p-3 mb-2 rounded-xl bg-neutral-950 border border-neutral-800 text-sm flex justify-between gap-3">
            <div><p className="font-semibold">{r.targetLabel}</p><p className="text-zinc-500">{r.reason}</p></div>
            <div className="flex gap-1 shrink-0">
              <ActionBtn label="Resolver" onClick={() => request(`/api/admin/reports/${r.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'resolved' }) }).then(load)} />
              <ActionBtn label="Dispensar" onClick={() => request(`/api/admin/reports/${r.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'dismissed' }) }).then(load)} />
            </div>
          </div>
        ))}
      </AdminPanelCard>
      <AdminConfirmModal open={confirm.open} title="Confirmar exclusão" message="Esta ação não pode ser desfeita." danger confirmLabel="Excluir" onConfirm={() => { confirm.action(); setConfirm({ open: false, action: () => {} }); }} onCancel={() => setConfirm({ open: false, action: () => {} })} />
    </div>
  );
}

export function UsersAdminPage({ email }: { email: string }) {
  const { request } = useAdminApi(email);
  const [users, setUsers] = useState<any[]>([]);
  const [q, setQ] = useState('');
  const [activityEmail, setActivityEmail] = useState<string | null>(null);
  const [activity, setActivity] = useState<any[]>([]);

  const load = useCallback(async () => {
    const res = await request<any[]>(`/api/admin/users?q=${encodeURIComponent(q)}`);
    if (res) setUsers(res);
  }, [request, q]);

  useEffect(() => { load(); }, [load]);

  const loadActivity = async (targetEmail: string) => {
    setActivityEmail(targetEmail);
    const res = await request<{ comments?: any[]; auditLogs?: any[] }>(`/api/admin/users/${encodeURIComponent(targetEmail)}/activity`);
    const items = [
      ...(res?.comments || []).map((c) => ({
        createdAt: c.criadoEm,
        action: 'Comentário',
        details: c.texto,
      })),
      ...(res?.auditLogs || []).map((l) => ({
        createdAt: l.createdAt,
        action: l.action,
        details: l.details,
      })),
    ].sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    setActivity(items);
  };

  const updateUser = (targetEmail: string, body: Record<string, unknown>, successMessage: string) =>
    request(`/api/admin/users/${encodeURIComponent(targetEmail)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }, successMessage).then(load);

  return (
    <div className="space-y-6">
      <PageHeader title="Usuários" subtitle="Pesquisa, cargos, suspensão e banimento" />
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Buscar por nome ou e-mail..." className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-10 pr-4 py-3 text-sm" />
      </div>
      <div className="space-y-3">
        {users.map(u => (
          <div key={u.email} className="p-4 rounded-2xl border border-neutral-800 bg-neutral-900/40">
            <div className="flex flex-col lg:flex-row lg:items-center gap-3 justify-between">
              <div>
                <p className="font-bold">{u.username}</p>
                <p className="text-xs text-zinc-500">{u.email}</p>
                <p className="text-xs text-zinc-600 mt-1">XP: {u.xp} · Nível {u.level}</p>
                <div className="flex gap-2 mt-2">
                  {u.isBanned && <span className="text-[10px] font-bold uppercase text-red-400">Banido</span>}
                  {u.isSuspended && <span className="text-[10px] font-bold uppercase text-amber-400">Suspenso</span>}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <select defaultValue={u.role || 'user'} onChange={e => updateUser(u.email, { role: e.target.value, isAdmin: e.target.value === 'admin' }, 'Cargo atualizado com sucesso.')} className="bg-neutral-950 border border-neutral-800 rounded-lg px-2 py-1.5 text-xs">
                  <option value="user">Usuário</option>
                  <option value="moderator">Moderador</option>
                  <option value="curator">Curador</option>
                  <option value="admin">Administrador</option>
                </select>
                <button type="button" onClick={() => updateUser(u.email, { isSuspended: !u.isSuspended, suspendedUntil: u.isSuspended ? null : new Date(Date.now() + 7 * 86400000).toISOString() }, u.isSuspended ? 'Conta reativada no CineReact.' : 'Conta suspensa por 7 dias.')} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-950/50 text-amber-300 border border-amber-500/30">
                  {u.isSuspended ? 'Reativar' : 'Suspender'}
                </button>
                <button type="button" onClick={() => loadActivity(u.email)} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-neutral-800 text-zinc-300 border border-neutral-700">
                  Atividade
                </button>
                <button type="button" onClick={() => updateUser(u.email, { isBanned: !u.isBanned, isSuspended: u.isBanned ? u.isSuspended : false }, u.isBanned ? 'Usuário desbanido.' : 'Usuário banido do CineReact.')} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-red-950/50 text-red-300 border border-red-500/30 flex items-center gap-1">
                  <Ban className="w-3 h-3" /> {u.isBanned ? 'Desbanir' : 'Banir'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      {activityEmail && (
        <AdminPanelCard title={`Histórico de atividades — ${activityEmail}`} actions={
          <button type="button" onClick={() => setActivityEmail(null)} className="text-xs text-zinc-500 hover:text-white">Fechar</button>
        }>
          <div className="max-h-80 overflow-y-auto space-y-2">
            {activity.length === 0 ? (
              <p className="text-sm text-zinc-500">Nenhuma atividade registrada.</p>
            ) : activity.map((a, i) => (
              <div key={i} className="flex flex-col sm:flex-row sm:items-center gap-1 py-2 border-b border-neutral-800/40 text-xs">
                <span className="text-zinc-500 shrink-0">{a.createdAt ? new Date(a.createdAt).toLocaleString('pt-BR') : '—'}</span>
                <span className="text-zinc-300">{a.type || a.action || 'evento'}</span>
                {a.details && <span className="text-zinc-600 truncate">{a.details}</span>}
              </div>
            ))}
          </div>
        </AdminPanelCard>
      )}
    </div>
  );
}

export function GamificationAdminPage({ email }: { email: string }) {
  const { request } = useAdminApi(email);
  const [catalog, setCatalog] = useState<any>(null);
  const [grantEmail, setGrantEmail] = useState('');
  const [grantXp, setGrantXp] = useState('100');
  const [eventForm, setEventForm] = useState({ name: '', description: '', multiplier: 2, bonusXp: 50, startsAt: '', endsAt: '' });

  const load = useCallback(async () => {
    const res = await request('/api/admin/gamification/catalog');
    if (res) setCatalog(res);
  }, [request]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-6">
      <PageHeader title="Gamificação" subtitle="Conquistas, XP, eventos e recompensas" />
      <AdminPanelCard title="Conceder XP manualmente">
        <div className="flex flex-col sm:flex-row gap-2">
          <input value={grantEmail} onChange={e => setGrantEmail(e.target.value)} placeholder="E-mail do usuário" className="flex-1 bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-sm" />
          <input value={grantXp} onChange={e => setGrantXp(e.target.value)} placeholder="XP" className="w-24 bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-sm" />
          <button type="button" onClick={() => request('/api/admin/gamification/grant-xp', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: grantEmail, xp: Number(grantXp), reason: 'Concessão manual' }) })} className="px-4 py-2 rounded-xl bg-cine-accent text-xs font-bold flex items-center gap-1"><Zap className="w-4 h-4" /> Conceder</button>
        </div>
      </AdminPanelCard>
      <AdminPanelCard title="Criar evento com bônus de XP">
        <div className="grid sm:grid-cols-2 gap-2 mb-3">
          <input value={eventForm.name} onChange={e => setEventForm({ ...eventForm, name: e.target.value })} placeholder="Nome do evento" className="bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-sm" />
          <input value={eventForm.multiplier} onChange={e => setEventForm({ ...eventForm, multiplier: Number(e.target.value) })} type="number" placeholder="Multiplicador" className="bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-sm" />
          <input type="datetime-local" value={eventForm.startsAt} onChange={e => setEventForm({ ...eventForm, startsAt: e.target.value })} className="bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-sm" />
          <input type="datetime-local" value={eventForm.endsAt} onChange={e => setEventForm({ ...eventForm, endsAt: e.target.value })} className="bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-sm" />
        </div>
        <button type="button" onClick={() => request('/api/admin/gamification/xp-events', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(eventForm) }).then(load)} className="px-4 py-2 rounded-xl bg-cine-accent text-xs font-bold">Criar evento</button>
        <div className="mt-4 space-y-2">{catalog?.xpEvents?.map((ev: any) => (
          <div key={ev.id} className="flex justify-between p-2 rounded-lg bg-neutral-950 text-sm"><span>{ev.name} (x{ev.multiplier})</span><button type="button" onClick={() => request(`/api/admin/gamification/xp-events/${ev.id}`, { method: 'DELETE' }).then(load)} className="text-red-400"><Trash2 className="w-3.5 h-3.5" /></button></div>
        ))}</div>
      </AdminPanelCard>
      <AdminPanelCard title={`Conquistas (${catalog?.achievements?.length || 0})`}>
        <p className="text-xs text-zinc-500 mb-3">Conquistas do sistema + personalizadas pelo admin.</p>
        <div className="grid sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto">
          {catalog?.achievements?.slice(0, 20).map((a: any) => (
            <div key={a.id} className="p-2 rounded-lg bg-neutral-950 border border-neutral-800 text-xs flex items-center gap-2"><Award className="w-3.5 h-3.5 text-cine-accent shrink-0" /><span className="truncate">{a.name}</span></div>
          ))}
        </div>
      </AdminPanelCard>
      <AdminPanelCard title={`Recompensas no catálogo (${catalog?.rewards?.length || 0})`}>
        <p className="text-xs text-zinc-500">Molduras, tags, títulos e cosméticos disponíveis na loja do Club.</p>
      </AdminPanelCard>
    </div>
  );
}

export function AnalyticsAdminPage({ email }: { email: string }) {
  const { request, loading } = useAdminApi(email);
  const [data, setData] = useState<AdminAnalytics | null>(null);
  useEffect(() => { request<AdminAnalytics>('/api/admin/analytics').then(r => { if (r) setData(r); }); }, [request]);
  if (loading && !data) return <LoadingState />;
  return (
    <div className="space-y-6">
      <PageHeader title="Analytics" subtitle="Dados de uso e engajamento do CineReact" />
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <AdminStatCard label="Cadastros (mês)" value={data?.totals.newUsersMonth ?? 0} icon={UserPlus} />
        <AdminStatCard label="Tempo médio" value={`${data?.avgSessionMinutes ?? 0} min`} icon={Activity} />
        <AdminStatCard label="Obras" value={data?.totals.obras ?? 0} icon={Film} />
      </div>
      <AdminPanelCard title="Crescimento de usuários (14 dias)">
        <div className="flex items-end gap-1 h-32">
          {data?.dailySignups.map(d => (
            <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full bg-cine-accent/80 rounded-t" style={{ height: `${Math.max(8, d.count * 12)}px` }} />
              <span className="text-[9px] text-zinc-600">{d.date.slice(5)}</span>
            </div>
          ))}
        </div>
      </AdminPanelCard>
      <div className="grid lg:grid-cols-2 gap-4">
        <AdminPanelCard title="Origem de atividade no CineReact">
          {data?.trafficSources.map(t => (
            <div key={t.source} className="flex justify-between py-2 border-b border-neutral-800/50 text-sm">
              <span>{t.source}</span><span className="font-bold text-cine-accent-light">{t.visits}</span>
            </div>
          ))}
        </AdminPanelCard>
        <AdminPanelCard title="Obras mais comentadas">
          <RankList items={(data?.topCommented || []).map(o => ({ label: o.titulo, value: `${o.count} comentários` }))} />
        </AdminPanelCard>
      </div>
    </div>
  );
}

export function MonetizationAdminPage({ email }: { email: string }) {
  const { request } = useAdminApi(email);
  const [data, setData] = useState<any>(null);
  const [coupon, setCoupon] = useState({ code: '', discountPercent: 10, description: '', maxUses: 100 });
  const [donations, setDonations] = useState<DonationRequest[]>([]);
  const [pendingDonationCount, setPendingDonationCount] = useState(0);
  const [donationFilter, setDonationFilter] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');
  const [processingDonation, setProcessingDonation] = useState<string | null>(null);
  const [rejectTarget, setRejectTarget] = useState<DonationRequest | null>(null);
  const [rejectNote, setRejectNote] = useState('');

  const load = useCallback(async () => {
    const [monetization, donationRes, pendingRes] = await Promise.all([
      request('/api/admin/monetization'),
      request<{ requests: DonationRequest[] }>(
        donationFilter === 'all'
          ? '/api/admin/donations'
          : `/api/admin/donations?status=${donationFilter}`,
      ),
      request<{ requests: DonationRequest[] }>('/api/admin/donations?status=pending'),
    ]);
    if (monetization) setData(monetization);
    if (donationRes) setDonations(donationRes.requests || []);
    if (pendingRes) setPendingDonationCount(pendingRes.requests?.length ?? 0);
  }, [request, donationFilter]);

  useEffect(() => { load(); }, [load]);

  const approveDonation = async (id: string) => {
    setProcessingDonation(id);
    await request(
      `/api/admin/donations/${id}/approve`,
      { method: 'POST' },
      'Doação aprovada. VIP e cosméticos concedidos ao usuário.',
    );
    setProcessingDonation(null);
    load();
  };

  const rejectDonation = async () => {
    if (!rejectTarget) return;
    setProcessingDonation(rejectTarget.id);
    await request(
      `/api/admin/donations/${rejectTarget.id}/reject`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: rejectNote.trim() || undefined }),
      },
      'Doação rejeitada. O usuário foi notificado.',
    );
    setProcessingDonation(null);
    setRejectTarget(null);
    setRejectNote('');
    load();
  };

  const statusBadge = (status: DonationRequest['status']) => {
    if (status === 'pending') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 text-[10px] font-bold uppercase">
          <Clock className="w-3 h-3" /> Pendente
        </span>
      );
    }
    if (status === 'approved') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 text-[10px] font-bold uppercase">
          <CheckCircle2 className="w-3 h-3" /> Aprovado
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-300 text-[10px] font-bold uppercase">
        <XCircle className="w-3 h-3" /> Rejeitado
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Monetização" subtitle="Premium, cupons, doações VIP e receita" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <AdminStatCard label="Receita total" value={`R$ ${(data?.revenue || 0).toFixed(2)}`} icon={DollarSign} accent="text-green-400" />
        <AdminStatCard label="Premium ativos" value={data?.activePremium ?? 0} icon={Users} />
        <AdminStatCard label="Cupons" value={data?.coupons?.length ?? 0} icon={Percent} />
        <AdminStatCard
          label="Doações pendentes"
          value={pendingDonationCount}
          icon={Heart}
          accent="text-amber-400"
        />
      </div>

      <AdminPanelCard title="Fila de doações VIP (R$ 4,99)">
        <p className="text-xs text-zinc-500 mb-4">
          Confirme o pagamento no Mercado Pago antes de aprovar. Ao aprovar, o usuário recebe selo VIP, cosméticos e notificação.
        </p>
        <div className="flex flex-wrap gap-2 mb-4">
          {([
            ['pending', 'Pendentes'],
            ['approved', 'Aprovadas'],
            ['rejected', 'Rejeitadas'],
            ['all', 'Todas'],
          ] as const).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setDonationFilter(key)}
              className={`px-3 py-1.5 rounded-full text-[11px] font-bold transition-colors ${
                donationFilter === key
                  ? 'bg-cine-accent text-black'
                  : 'bg-neutral-900 text-zinc-400 border border-neutral-800 hover:text-white'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        {donations.length === 0 ? (
          <p className="text-sm text-zinc-500 py-6 text-center">Nenhuma doação nesta fila.</p>
        ) : (
          <div className="space-y-3">
            {donations.map((d) => (
              <div
                key={d.id}
                className="rounded-xl border border-neutral-800 bg-neutral-950/70 p-4 flex flex-col sm:flex-row sm:items-center gap-3"
              >
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-bold text-white truncate">{d.usuarioNome}</p>
                    {statusBadge(d.status)}
                  </div>
                  <p className="text-xs text-zinc-500 truncate">{d.usuarioEmail}</p>
                  <p className="text-[11px] text-zinc-600">
                    Pedido em {new Date(d.requestedAt).toLocaleString('pt-BR')}
                    {d.reviewedAt && ` · Revisado em ${new Date(d.reviewedAt).toLocaleString('pt-BR')}`}
                  </p>
                  {d.adminNote && (
                    <p className="text-[11px] text-rose-300/90 mt-1">Nota: {d.adminNote}</p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-sm font-black text-cine-accent-light">
                    R$ {d.amount.toFixed(2).replace('.', ',')}
                  </span>
                  {d.status === 'pending' && (
                    <>
                      <ActionBtn
                        label={processingDonation === d.id ? '...' : 'Aprovar'}
                        onClick={() => approveDonation(d.id)}
                      />
                      <ActionBtn
                        label="Rejeitar"
                        danger
                        onClick={() => {
                          setRejectTarget(d);
                          setRejectNote('');
                        }}
                      />
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </AdminPanelCard>

      <AdminPanelCard title="Criar cupom de desconto">
        <div className="grid sm:grid-cols-2 gap-2 mb-3">
          <input value={coupon.code} onChange={e => setCoupon({ ...coupon, code: e.target.value })} placeholder="CÓDIGO" className="bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-sm uppercase" />
          <input type="number" value={coupon.discountPercent} onChange={e => setCoupon({ ...coupon, discountPercent: Number(e.target.value) })} placeholder="% desconto" className="bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-sm" />
        </div>
        <button type="button" onClick={() => request('/api/admin/coupons', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(coupon) }).then(load)} className="px-4 py-2 rounded-xl bg-cine-accent text-xs font-bold">Criar cupom</button>
        <div className="mt-4 space-y-2">{data?.coupons?.map((c: any) => (
          <div key={c.id} className="flex justify-between p-2 rounded-lg bg-neutral-950 text-sm font-mono"><span>{c.code} (-{c.discountPercent}%)</span><button type="button" onClick={() => request(`/api/admin/coupons/${c.id}`, { method: 'DELETE' }).then(load)} className="text-red-400"><Trash2 className="w-3.5 h-3.5" /></button></div>
        ))}</div>
      </AdminPanelCard>

      <AdminConfirmModal
        open={!!rejectTarget}
        title="Rejeitar doação"
        message={`Rejeitar o pedido de ${rejectTarget?.usuarioNome}? O usuário será notificado.`}
        confirmLabel="Rejeitar"
        danger
        onConfirm={rejectDonation}
        onCancel={() => {
          setRejectTarget(null);
          setRejectNote('');
        }}
      >
        <label className="block mt-3">
          <span className="text-xs font-bold text-zinc-500 uppercase tracking-wide">Motivo (opcional)</span>
          <textarea
            value={rejectNote}
            onChange={(e) => setRejectNote(e.target.value)}
            rows={3}
            placeholder="Ex.: Pagamento não encontrado no Mercado Pago"
            className="mt-1 w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-sm resize-none"
          />
        </label>
      </AdminConfirmModal>
    </div>
  );
}

export function SettingsAdminPage({ email }: { email: string }) {
  const { request } = useAdminApi(email);
  const [settings, setSettings] = useState<PlatformSettings | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmMaintenance, setConfirmMaintenance] = useState(false);

  useEffect(() => {
    request<AdminConfig>('/api/admin/config').then(r => {
      if (r?.settings) setSettings(r.settings);
    });
  }, [request]);

  const saveSettings = async () => {
    if (!settings) return;
    setSaving(true);
    const result = await request<PlatformSettings>(
      '/api/admin/config/settings',
      { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(settings) },
      settings.maintenanceMode
        ? 'Modo manutenção ativado no CineReact. Visitantes verão a mensagem configurada.'
        : 'Configurações do CineReact salvas com sucesso.',
    );
    if (result) setSettings(result);
    setSaving(false);
  };

  if (!settings) return <LoadingState />;

  const field = (key: keyof PlatformSettings, label: string, type = 'text') => (
    <label className="block">
      <span className="text-xs font-bold text-zinc-500 uppercase tracking-wide">{label}</span>
      {type === 'checkbox' ? (
        <input type="checkbox" checked={!!settings[key]} onChange={e => setSettings({ ...settings, [key]: e.target.checked })} className="mt-1" />
      ) : (
        <input type={type} value={String(settings[key] || '')} onChange={e => setSettings({ ...settings, [key]: e.target.value })} className="mt-1 w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-sm" />
      )}
    </label>
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Configurações" subtitle="Personalize a plataforma CineReact" />
      <AdminPanelCard title="Identidade CineReact">
        <div className="grid sm:grid-cols-2 gap-4">
          {field('siteName', 'Nome da plataforma')}
          {field('logoUrl', 'Logotipo do CineReact')}
          {field('primaryColor', 'Cor primária')}
          {field('accentColor', 'Cor de destaque')}
        </div>
      </AdminPanelCard>
      <AdminPanelCard title="Banner global">
        <div className="space-y-3">
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={settings.globalBannerEnabled} onChange={e => setSettings({ ...settings, globalBannerEnabled: e.target.checked })} /> Exibir banner</label>
          {field('globalBannerText', 'Texto do banner')}
          {field('globalBannerLink', 'Link do banner')}
        </div>
      </AdminPanelCard>
      <AdminPanelCard title="SEO">
        <div className="space-y-3">{field('seoTitle', 'Título SEO')}{field('seoDescription', 'Descrição SEO')}{field('seoKeywords', 'Palavras-chave')}</div>
      </AdminPanelCard>
      <AdminPanelCard title="Redes sociais">
        <div className="grid sm:grid-cols-2 gap-3">{field('socialYoutube', 'YouTube')}{field('socialInstagram', 'Instagram')}{field('socialTwitter', 'Twitter/X')}{field('socialDiscord', 'Discord')}</div>
      </AdminPanelCard>
      <AdminPanelCard title="APIs & Integrações CineReact">
        <p className="text-xs text-zinc-500 mb-3">Credenciais usadas pela plataforma CineReact para sincronização e serviços externos.</p>
        <div className="space-y-3">{field('apiYoutubeKey', 'Chave de integração externa')}{field('apiSupabaseUrl', 'Supabase URL')}{field('apiSupabaseAnonKey', 'Supabase Anon Key')}</div>
      </AdminPanelCard>
      <AdminPanelCard title="Manutenção do CineReact">
        <p className="text-xs text-zinc-500 mb-3">Quando ativo, visitantes veem a tela de manutenção com a identidade e mensagem do CineReact.</p>
        <label className="flex items-center gap-2 text-sm mb-3">
          <input
            type="checkbox"
            checked={settings.maintenanceMode}
            onChange={e => {
              if (e.target.checked) {
                setConfirmMaintenance(true);
              } else {
                setSettings({ ...settings, maintenanceMode: false });
              }
            }}
          />
          Ativar modo manutenção
        </label>
        {field('maintenanceMessage', 'Mensagem exibida aos visitantes')}
      </AdminPanelCard>
      <button type="button" disabled={saving} onClick={saveSettings} className="px-6 py-3 rounded-xl bg-cine-accent text-sm font-black flex items-center gap-2 disabled:opacity-50">
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Salvar configurações
      </button>
      <AdminConfirmModal
        open={confirmMaintenance}
        title="Ativar modo manutenção"
        message="O CineReact ficará inacessível para visitantes e exibirá a mensagem de manutenção configurada. Administradores continuarão com acesso normal."
        confirmLabel="Ativar manutenção"
        danger
        onConfirm={() => {
          setSettings({ ...settings, maintenanceMode: true });
          setConfirmMaintenance(false);
        }}
        onCancel={() => setConfirmMaintenance(false)}
      />
    </div>
  );
}

export function SecurityAdminPage({ email }: { email: string }) {
  const { request } = useAdminApi(email);
  const [logs, setLogs] = useState<any[]>([]);
  const [backups, setBackups] = useState<any[]>([]);
  const [confirm, setConfirm] = useState(false);

  const load = useCallback(async () => {
    const [l, b] = await Promise.all([request<any[]>('/api/admin/audit-logs'), request<any[]>('/api/admin/backups')]);
    if (l) setLogs(l);
    if (b) setBackups(b);
  }, [request]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-6">
      <PageHeader title="Segurança & Sistema" subtitle="Logs de auditoria, backups e restauração" />
      <AdminPanelCard title="Backup manual" actions={
        <button type="button" onClick={() => setConfirm(true)} className="px-3 py-1.5 rounded-lg bg-cine-accent text-xs font-bold flex items-center gap-1"><Download className="w-3.5 h-3.5" /> Criar backup</button>
      }>
        <div className="space-y-2">{backups.map(b => (
          <div key={b.id} className="flex justify-between items-center p-3 rounded-xl bg-neutral-950 border border-neutral-800 text-sm">
            <div><p className="font-semibold">{b.label}</p><p className="text-xs text-zinc-500">{new Date(b.createdAt).toLocaleString('pt-BR')} · {(b.sizeBytes / 1024).toFixed(0)} KB</p></div>
            <a href={`/api/admin/backup/${b.id}/download?adminEmail=${encodeURIComponent(email)}`} className="text-cine-accent-light text-xs font-bold">Download</a>
          </div>
        ))}</div>
      </AdminPanelCard>
      <AdminPanelCard title="Registro de ações (últimas 200)">
        <div className="max-h-96 overflow-y-auto space-y-1">
          {logs.map(l => (
            <div key={l.id} className="flex flex-col sm:flex-row sm:items-center gap-1 py-2 border-b border-neutral-800/40 text-xs">
              <span className="text-zinc-500 shrink-0">{new Date(l.createdAt).toLocaleString('pt-BR')}</span>
              <span className="font-mono text-cine-accent-light">{l.actorEmail}</span>
              <span className="text-zinc-300">{l.action}</span>
              {l.details && <span className="text-zinc-600 truncate">{l.details}</span>}
            </div>
          ))}
        </div>
      </AdminPanelCard>
      <AdminConfirmModal open={confirm} title="Criar backup" message="Será gerado um snapshot completo do banco de dados do CineReact." confirmLabel="Criar backup" onConfirm={() => { request('/api/admin/backup', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) }, 'Backup do CineReact criado com sucesso.').then(load); setConfirm(false); }} onCancel={() => setConfirm(false)} />
    </div>
  );
}
