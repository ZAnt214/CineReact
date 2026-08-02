import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  BadgeCheck,
  BarChart3,
  Calendar,
  ChevronRight,
  Crown,
  DollarSign,
  Download,
  FileSpreadsheet,
  Globe,
  Loader2,
  Play,
  RefreshCw,
  Search,
  TrendingDown,
  TrendingUp,
  Users,
  Wallet,
  X,
} from 'lucide-react';
import { useAdminApi } from '../hooks/useAdminApi.ts';
import { AdminPanelCard, AdminStatCard, AdminBadge } from '../components/AdminUi.tsx';
import type {
  CreatorFinanceSummary,
  FinanceDashboard,
  GlobalDistributionSummary,
  MonthCloseSimulation,
} from '../../types/finance.ts';
import {
  EXCLUSIVE_CREATOR_SHARE,
  EXCLUSIVE_PLATFORM_SHARE,
  EXCLUSIVE_SUBSCRIPTION_PRICE,
  GLOBAL_CREATOR_POOL_SHARE,
  GLOBAL_PLATFORM_SHARE,
  GLOBAL_SUBSCRIPTION_PRICE,
} from '../../finance/constants.ts';

type FinanceTab =
  | 'dashboard'
  | 'subscriptions'
  | 'global'
  | 'payments'
  | 'close';

function formatBRL(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function GrowthBadge({ value }: { value: number }) {
  const up = value >= 0;
  return (
    <span
      className={`inline-flex items-center gap-0.5 text-xs font-bold ${
        up ? 'text-emerald-400' : 'text-rose-400'
      }`}
    >
      {up ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
      {up ? '+' : ''}
      {value.toFixed(1)}%
    </span>
  );
}

function BarChart({ data, labelKey, valueKey }: { data: any[]; labelKey: string; valueKey: string }) {
  const max = Math.max(...data.map((d) => d[valueKey]), 1);
  return (
    <div className="flex items-end gap-1 h-36">
      {data.map((d) => (
        <div key={d[labelKey]} className="flex-1 flex flex-col items-center gap-1 min-w-0">
          <div
            className="w-full rounded-t bg-gradient-to-t from-cyan-600/80 to-amber-400/70 transition-all"
            style={{ height: `${Math.max(6, (d[valueKey] / max) * 100)}%` }}
            title={formatBRL(d[valueKey])}
          />
          <span className="text-[8px] text-zinc-600 truncate w-full text-center">
            {String(d[labelKey]).slice(5)}
          </span>
        </div>
      ))}
    </div>
  );
}

function PageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-6">
      <h1 className="text-2xl font-black text-white tracking-tight">{title}</h1>
      {subtitle && <p className="text-sm text-zinc-500 mt-1">{subtitle}</p>}
    </div>
  );
}

const TABS: { id: FinanceTab; label: string; icon: React.ElementType }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
  { id: 'subscriptions', label: 'Assinaturas', icon: Crown },
  { id: 'global', label: 'Distribuição Global', icon: Globe },
  { id: 'payments', label: 'Pagamentos', icon: Wallet },
  { id: 'close', label: 'Fechamento', icon: Calendar },
];

export default function FinanceAdminPage({ email }: { email: string }) {
  const { request } = useAdminApi(email);
  const [tab, setTab] = useState<FinanceTab>('dashboard');
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState<FinanceDashboard | null>(null);
  const [globalDist, setGlobalDist] = useState<GlobalDistributionSummary | null>(null);
  const [creators, setCreators] = useState<CreatorFinanceSummary[]>([]);
  const [simulation, setSimulation] = useState<MonthCloseSimulation | null>(null);
  const [selectedCreator, setSelectedCreator] = useState<string | null>(null);
  const [creatorDetail, setCreatorDetail] = useState<any>(null);
  const [search, setSearch] = useState('');
  const [periodMonth, setPeriodMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [closing, setClosing] = useState(false);
  const [simulating, setSimulating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const [dash, global, payments] = await Promise.all([
      request<FinanceDashboard>('/api/admin/finance/dashboard'),
      request<GlobalDistributionSummary>(`/api/admin/finance/global-distribution?month=${periodMonth}`),
      request<{ creators: CreatorFinanceSummary[] }>(
        `/api/admin/finance/creator-payments${search ? `?q=${encodeURIComponent(search)}` : ''}`
      ),
    ]);
    if (dash) setDashboard(dash);
    if (global) setGlobalDist(global);
    if (payments) setCreators(payments.creators || []);
    setLoading(false);
  }, [request, periodMonth, search]);

  useEffect(() => {
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, [load]);

  const loadCreatorDetail = async (creatorEmail: string) => {
    setSelectedCreator(creatorEmail);
    const data = await request(`/api/admin/finance/creators/${encodeURIComponent(creatorEmail)}`);
    if (data) setCreatorDetail(data);
  };

  const runSimulation = async () => {
    setSimulating(true);
    const data = await request<MonthCloseSimulation>('/api/admin/finance/simulate-close', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ month: periodMonth }),
    });
    if (data) setSimulation(data);
    setSimulating(false);
    setTab('close');
  };

  const confirmClose = async () => {
    if (!window.confirm(`Confirmar fechamento do mês ${periodMonth}? Esta ação é permanente.`)) return;
    setClosing(true);
    await request('/api/admin/finance/confirm-close', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ month: periodMonth }),
    }, `Mês ${periodMonth} fechado com sucesso.`);
    setClosing(false);
    setSimulation(null);
    load();
  };

  const exportCsv = (scope: string) => {
    window.open(
      `/api/admin/finance/export?scope=${scope}&month=${periodMonth}&adminEmail=${encodeURIComponent(email)}`,
      '_blank'
    );
  };

  const statusTone = (s: string): 'default' | 'success' | 'warning' | 'danger' => {
    if (s === 'paid') return 'success';
    if (s === 'processing') return 'warning';
    if (s === 'pending') return 'default';
    return 'default';
  };

  const subs = dashboard?.subscriptions;

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
        <PageHeader
          title="Financeiro CineReact"
          subtitle="Receitas, assinaturas, ranking e pagamentos — cálculo 100% automático"
        />
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="month"
            value={periodMonth}
            onChange={(e) => setPeriodMonth(e.target.value)}
            className="bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-sm text-white"
          />
          <button
            type="button"
            onClick={load}
            className="p-2.5 rounded-xl border border-neutral-800 bg-neutral-900 text-zinc-400 hover:text-white"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            type="button"
            onClick={() => exportCsv('dashboard')}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-neutral-800 bg-neutral-900 text-xs font-bold text-zinc-300 hover:text-white"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            Excel
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
              tab === id
                ? 'bg-cine-accent text-black'
                : 'bg-neutral-900 border border-neutral-800 text-zinc-400 hover:text-white'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      {loading && !dashboard ? (
        <div className="flex justify-center py-20 text-zinc-500">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      ) : (
        <>
          {tab === 'dashboard' && dashboard && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
                <AdminStatCard label="Receita bruta total" value={formatBRL(dashboard.grossTotal)} icon={DollarSign} accent="text-amber-400" />
                <AdminStatCard label="Hoje" value={formatBRL(dashboard.grossToday)} sub={<GrowthBadge value={dashboard.growthDay} />} icon={TrendingUp} />
                <AdminStatCard label="Semana" value={formatBRL(dashboard.grossWeek)} sub={<GrowthBadge value={dashboard.growthWeek} />} icon={BarChart3} />
                <AdminStatCard label="Mês" value={formatBRL(dashboard.grossMonth)} sub={<GrowthBadge value={dashboard.growthMonth} />} icon={Calendar} />
                <AdminStatCard label="Ano" value={formatBRL(dashboard.grossYear)} sub={<GrowthBadge value={dashboard.growthYear} />} icon={DollarSign} />
                <AdminStatCard label="Assinaturas ativas" value={subs?.activeTotal ?? 0} icon={Users} accent="text-cyan-400" />
              </div>

              <div className="grid lg:grid-cols-2 gap-4">
                <AdminPanelCard title="Receita — últimos 30 dias" actions={
                  <button type="button" onClick={() => exportCsv('dashboard')} className="text-xs text-cine-accent-light font-bold">Exportar</button>
                }>
                  <BarChart data={dashboard.revenueByDay} labelKey="date" valueKey="amount" />
                </AdminPanelCard>
                <AdminPanelCard title="Receita — últimos 12 meses">
                  <BarChart
                    data={dashboard.revenueByMonth.map((m) => ({ month: m.month, amount: m.amount }))}
                    labelKey="month"
                    valueKey="amount"
                  />
                </AdminPanelCard>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="rounded-2xl border border-amber-500/20 bg-amber-950/10 p-4">
                  <p className="text-[10px] font-bold uppercase text-amber-300/70">Exclusiva — criador</p>
                  <p className="text-lg font-black text-white mt-1">{formatBRL(EXCLUSIVE_CREATOR_SHARE)}/sub</p>
                  <p className="text-xs text-zinc-500 mt-1">de {formatBRL(EXCLUSIVE_SUBSCRIPTION_PRICE)}</p>
                </div>
                <div className="rounded-2xl border border-cyan-500/20 bg-cyan-950/10 p-4">
                  <p className="text-[10px] font-bold uppercase text-cyan-300/70">Exclusiva — CineReact</p>
                  <p className="text-lg font-black text-white mt-1">{formatBRL(EXCLUSIVE_PLATFORM_SHARE)}/sub</p>
                </div>
                <div className="rounded-2xl border border-violet-500/20 bg-violet-950/10 p-4">
                  <p className="text-[10px] font-bold uppercase text-violet-300/70">Global — pool criadores</p>
                  <p className="text-lg font-black text-white mt-1">{formatBRL(GLOBAL_CREATOR_POOL_SHARE)}/sub</p>
                  <p className="text-xs text-zinc-500 mt-1">de {formatBRL(GLOBAL_SUBSCRIPTION_PRICE)}</p>
                </div>
                <div className="rounded-2xl border border-neutral-700 bg-neutral-900/40 p-4">
                  <p className="text-[10px] font-bold uppercase text-zinc-500">Global — CineReact</p>
                  <p className="text-lg font-black text-white mt-1">{formatBRL(GLOBAL_PLATFORM_SHARE)}/sub</p>
                </div>
              </div>
            </div>
          )}

          {tab === 'subscriptions' && subs && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                <AdminStatCard label="Ativas" value={subs.activeTotal} icon={Users} />
                <AdminStatCard label="Exclusivas" value={subs.activeExclusive} icon={BadgeCheck} accent="text-amber-400" />
                <AdminStatCard label="Globais" value={subs.activeGlobal} icon={Globe} accent="text-cyan-400" />
                <AdminStatCard label="Novas no mês" value={subs.newThisMonth} icon={TrendingUp} accent="text-emerald-400" />
                <AdminStatCard label="Cancelamentos" value={subs.cancellationsThisMonth} icon={TrendingDown} accent="text-rose-400" />
                <AdminStatCard label="Receita exclusiva" value={formatBRL(subs.exclusiveRevenue)} icon={DollarSign} />
              </div>
              <AdminPanelCard title="Receita por tipo de assinatura">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="rounded-xl border border-amber-500/20 bg-neutral-950/60 p-5">
                    <p className="text-sm font-bold text-amber-200">Assinatura Exclusiva</p>
                    <p className="text-3xl font-black text-white mt-2">{formatBRL(subs.exclusiveRevenue)}</p>
                    <p className="text-xs text-zinc-500 mt-2">{subs.activeExclusive} ativas × {formatBRL(EXCLUSIVE_SUBSCRIPTION_PRICE)}</p>
                  </div>
                  <div className="rounded-xl border border-cyan-500/20 bg-neutral-950/60 p-5">
                    <p className="text-sm font-bold text-cyan-200">Assinatura Global</p>
                    <p className="text-3xl font-black text-white mt-2">{formatBRL(subs.globalRevenue)}</p>
                    <p className="text-xs text-zinc-500 mt-2">{subs.activeGlobal} ativas × {formatBRL(GLOBAL_SUBSCRIPTION_PRICE)}</p>
                  </div>
                </div>
              </AdminPanelCard>
            </div>
          )}

          {tab === 'global' && globalDist && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <AdminStatCard label="Bruto global" value={formatBRL(globalDist.grossGlobalRevenue)} icon={DollarSign} />
                <AdminStatCard label="CineReact" value={formatBRL(globalDist.platformShare)} icon={Crown} accent="text-amber-400" />
                <AdminStatCard label="Pool criadores" value={formatBRL(globalDist.creatorsPool)} icon={Users} accent="text-cyan-400" />
                <AdminStatCard label="Pontos do mês" value={globalDist.totalPoints} icon={BarChart3} />
              </div>
              <AdminPanelCard
                title={`Ranking CineReact — ${globalDist.periodMonth}`}
                description="Curtida = 1 pt · Comentário = 3 pts · Apenas assinantes globais ativos (anti-fraude)"
                actions={
                  <button type="button" onClick={() => exportCsv('ranking')} className="inline-flex items-center gap-1 text-xs font-bold text-cine-accent-light">
                    <Download className="w-3.5 h-3.5" /> Excel
                  </button>
                }
              >
                {globalDist.ranking.length === 0 ? (
                  <p className="text-sm text-zinc-500 text-center py-8">Sem pontuação neste período.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-[10px] uppercase tracking-wider text-zinc-500 border-b border-neutral-800">
                          <th className="pb-3 pr-4">#</th>
                          <th className="pb-3 pr-4">Criador</th>
                          <th className="pb-3 pr-4">Curtidas</th>
                          <th className="pb-3 pr-4">Comentários</th>
                          <th className="pb-3 pr-4">Pontos</th>
                          <th className="pb-3 pr-4">%</th>
                          <th className="pb-3">Receberá</th>
                        </tr>
                      </thead>
                      <tbody>
                        {globalDist.ranking.map((r, i) => (
                          <tr key={r.creatorEmail} className="border-b border-neutral-800/60 hover:bg-neutral-900/40">
                            <td className="py-3 pr-4 font-black text-zinc-500">{i + 1}</td>
                            <td className="py-3 pr-4">
                              <button type="button" onClick={() => loadCreatorDetail(r.creatorEmail)} className="font-bold text-white hover:text-cine-accent-light text-left">
                                {r.creatorName}
                              </button>
                            </td>
                            <td className="py-3 pr-4 text-zinc-400">{r.likes}</td>
                            <td className="py-3 pr-4 text-zinc-400">{r.comments}</td>
                            <td className="py-3 pr-4 font-bold text-cyan-300">{r.points}</td>
                            <td className="py-3 pr-4 text-zinc-400">{r.sharePercent.toFixed(1)}%</td>
                            <td className="py-3 font-black text-amber-200">{formatBRL(r.globalPayout)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </AdminPanelCard>
            </div>
          )}

          {tab === 'payments' && (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && load()}
                    placeholder="Buscar criador..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-sm text-white"
                  />
                </div>
                <button type="button" onClick={() => exportCsv('creators')} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-neutral-800 bg-neutral-900 text-xs font-bold text-zinc-300">
                  <FileSpreadsheet className="w-3.5 h-3.5" /> Exportar
                </button>
              </div>
              <div className="space-y-2">
                {creators.map((c) => (
                  <button
                    key={c.creatorEmail}
                    type="button"
                    onClick={() => loadCreatorDetail(c.creatorEmail)}
                    className="w-full rounded-xl border border-neutral-800 bg-neutral-950/60 p-4 flex flex-col sm:flex-row sm:items-center gap-3 text-left hover:border-cine-accent/30 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-white truncate">{c.creatorName}</p>
                        <AdminBadge tone={statusTone(c.payoutStatus)}>{c.payoutStatus}</AdminBadge>
                      </div>
                      <p className="text-xs text-zinc-500 truncate">{c.creatorEmail}</p>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-center sm:text-right">
                      <div>
                        <p className="text-[10px] text-zinc-600 uppercase">Exclusiva</p>
                        <p className="text-sm font-bold text-amber-200">{formatBRL(c.exclusiveRevenue)}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-zinc-600 uppercase">Global</p>
                        <p className="text-sm font-bold text-cyan-200">{formatBRL(c.globalRevenue)}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-zinc-600 uppercase">Total</p>
                        <p className="text-sm font-black text-white">{formatBRL(c.exclusiveRevenue + c.globalRevenue)}</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-zinc-600 shrink-0 hidden sm:block" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {tab === 'close' && (
            <div className="space-y-6">
              <AdminPanelCard
                title="Simular fechamento do mês"
                description="Calcula automaticamente receitas, repasses e ranking antes de confirmar"
                actions={
                  <button
                    type="button"
                    onClick={runSimulation}
                    disabled={simulating}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-cine-accent text-black text-xs font-black disabled:opacity-50"
                  >
                    {simulating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                    Simular fechamento
                  </button>
                }
              >
                {!simulation ? (
                  <p className="text-sm text-zinc-500">Execute a simulação para ver o resumo financeiro de {periodMonth}.</p>
                ) : (
                  <div className="space-y-6">
                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      <AdminStatCard label="Receita bruta total" value={formatBRL(simulation.grossTotal)} icon={DollarSign} />
                      <AdminStatCard label="Receita do mês" value={formatBRL(simulation.monthGrossRevenue)} icon={Calendar} />
                      <AdminStatCard label="CineReact" value={formatBRL(simulation.platformRevenue)} icon={Crown} accent="text-amber-400" />
                      <AdminStatCard label="Criadores" value={formatBRL(simulation.creatorsPoolRevenue)} icon={Users} accent="text-cyan-400" />
                    </div>
                    <div className="rounded-xl border border-neutral-800 overflow-hidden">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-left text-[10px] uppercase text-zinc-500 bg-neutral-950">
                            <th className="p-3">Criador</th>
                            <th className="p-3">Exclusiva</th>
                            <th className="p-3">Global</th>
                            <th className="p-3">Total</th>
                            <th className="p-3">Pontos</th>
                          </tr>
                        </thead>
                        <tbody>
                          {simulation.creatorPayouts.map((p) => (
                            <tr key={p.creatorEmail} className="border-t border-neutral-800/60">
                              <td className="p-3 font-bold text-white">{p.creatorName}</td>
                              <td className="p-3 text-amber-200">{formatBRL(p.exclusiveRevenue)}</td>
                              <td className="p-3 text-cyan-200">{formatBRL(p.globalRevenue)}</td>
                              <td className="p-3 font-black">{formatBRL(p.totalAmount)}</td>
                              <td className="p-3 text-zinc-400">{p.rankingPoints}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <button
                      type="button"
                      onClick={confirmClose}
                      disabled={closing}
                      className="w-full sm:w-auto px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-sm disabled:opacity-50"
                    >
                      {closing ? 'Fechando...' : `Confirmar fechamento de ${periodMonth}`}
                    </button>
                  </div>
                )}
              </AdminPanelCard>
            </div>
          )}
        </>
      )}

      {selectedCreator && (
        <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => { setSelectedCreator(null); setCreatorDetail(null); }} />
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl border border-neutral-800 bg-neutral-950 shadow-2xl">
            <div className="sticky top-0 flex items-center justify-between px-5 py-4 border-b border-neutral-800 bg-neutral-950/95 backdrop-blur">
              <div>
                <p className="text-xs text-zinc-500">Detalhes do criador</p>
                <h3 className="text-lg font-black text-white">{creatorDetail?.summary?.creatorName || selectedCreator}</h3>
              </div>
              <button type="button" onClick={() => { setSelectedCreator(null); setCreatorDetail(null); }} className="p-2 rounded-lg hover:bg-neutral-900">
                <X className="w-5 h-5" />
              </button>
            </div>
            {creatorDetail?.summary ? (
              <div className="p-5 space-y-5">
                <div className="grid grid-cols-2 gap-3">
                  <AdminStatCard label="Assinantes exclusivos" value={creatorDetail.summary.activeExclusiveSubscribers} icon={Users} />
                  <AdminStatCard label="Ranking" value={`#${creatorDetail.summary.rankingPosition || '—'}`} icon={BarChart3} />
                  <AdminStatCard label="Curtidas" value={creatorDetail.summary.likes} icon={TrendingUp} />
                  <AdminStatCard label="Comentários" value={creatorDetail.summary.comments} icon={BadgeCheck} />
                  <AdminStatCard label="Receita mensal" value={formatBRL(creatorDetail.summary.monthlyRevenue)} icon={DollarSign} />
                  <AdminStatCard label="Acumulada" value={formatBRL(creatorDetail.summary.accumulatedRevenue)} icon={Wallet} />
                </div>
                {creatorDetail.revenueGrowth?.length > 0 && (
                  <AdminPanelCard title="Crescimento">
                    <BarChart
                      data={creatorDetail.revenueGrowth.map((g: any) => ({
                        month: g.month,
                        amount: g.exclusive + g.global,
                      }))}
                      labelKey="month"
                      valueKey="amount"
                    />
                  </AdminPanelCard>
                )}
                {creatorDetail.payouts?.length > 0 && (
                  <AdminPanelCard title="Histórico de pagamentos">
                    <div className="space-y-2">
                      {creatorDetail.payouts.map((p: any) => (
                        <div key={p.id} className="flex justify-between items-center p-3 rounded-lg bg-neutral-900/60 text-sm">
                          <span className="text-zinc-400">{p.periodMonth}</span>
                          <span className="font-bold text-white">{formatBRL(p.totalAmount)}</span>
                          <AdminBadge tone={statusTone(p.status)}>{p.status}</AdminBadge>
                        </div>
                      ))}
                    </div>
                  </AdminPanelCard>
                )}
              </div>
            ) : (
              <div className="p-10 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-zinc-500" /></div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
