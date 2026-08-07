import type { Express, Request, Response } from 'express';
import { localDb } from '../db/local_db.ts';
import {
  computeCreatorSummaries,
  computeFinanceDashboard,
  computeGlobalDistribution,
  confirmMonthClose,
  getCreatorDetail,
  periodMonthKey,
  simulateMonthClose,
  updatePayoutStatus,
} from './financeEngine.ts';
import { purgeFinanceDemoData } from './purgeFinanceDemoData.ts';
import type { PayoutStatus } from '../types/finance.ts';

type RequireAdminFn = (req: Request, res: Response) => Promise<string | null>;

function toCsv(rows: Record<string, string | number>[]): string {
  if (rows.length === 0) return '';
  const headers = Object.keys(rows[0]);
  const lines = [headers.join(',')];
  for (const row of rows) {
    lines.push(headers.map((h) => `"${String(row[h]).replace(/"/g, '""')}"`).join(','));
  }
  return lines.join('\n');
}

export function registerFinanceRoutes(app: Express, requireAdmin: RequireAdminFn) {
  purgeFinanceDemoData();

  app.get('/api/admin/finance/dashboard', async (req, res) => {
    if (!(await requireAdmin(req, res))) return;
    res.json(computeFinanceDashboard());
  });

  app.get('/api/admin/finance/subscriptions', async (req, res) => {
    if (!(await requireAdmin(req, res))) return;
    const month = String(req.query.month || periodMonthKey());
    const dashboard = computeFinanceDashboard();
    const subs = localDb.getPlatformSubscriptions();
    res.json({
      stats: dashboard.subscriptions,
      subscriptions: subs,
      month,
    });
  });

  app.get('/api/admin/finance/global-distribution', async (req, res) => {
    if (!(await requireAdmin(req, res))) return;
    const month = String(req.query.month || periodMonthKey());
    res.json(computeGlobalDistribution(month));
  });

  app.get('/api/admin/finance/creator-payments', async (req, res) => {
    if (!(await requireAdmin(req, res))) return;
    const q = String(req.query.q || '').toLowerCase();
    let summaries = computeCreatorSummaries();
    if (q) {
      summaries = summaries.filter(
        (s) => s.creatorName.toLowerCase().includes(q) || s.creatorEmail.toLowerCase().includes(q)
      );
    }
    res.json({ creators: summaries, payouts: localDb.getCreatorPayouts() });
  });

  app.get('/api/admin/finance/creators/:email', async (req, res) => {
    if (!(await requireAdmin(req, res))) return;
    res.json(getCreatorDetail(req.params.email));
  });

  app.post('/api/admin/finance/simulate-close', async (req, res) => {
    if (!(await requireAdmin(req, res))) return;
    const month = String(req.body?.month || periodMonthKey());
    res.json(simulateMonthClose(month));
  });

  app.post('/api/admin/finance/confirm-close', async (req, res) => {
    const adminEmail = await requireAdmin(req, res);
    if (!adminEmail) return;
    try {
      const month = String(req.body?.month || periodMonthKey());
      const record = confirmMonthClose(month, adminEmail);
      localDb.appendAuditLog({
        actorEmail: adminEmail,
        action: 'confirm_month_close',
        targetType: 'monthly_close',
        targetId: record.id,
        details: month,
      });
      res.json({ record });
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Erro ao fechar mês.' });
    }
  });

  app.patch('/api/admin/finance/payouts/:id/status', async (req, res) => {
    const adminEmail = await requireAdmin(req, res);
    if (!adminEmail) return;
    const status = req.body?.status as PayoutStatus;
    if (!['pending', 'processing', 'paid'].includes(status)) {
      return res.status(400).json({ error: 'Status inválido.' });
    }
    const updated = updatePayoutStatus(req.params.id, status, adminEmail);
    if (!updated) return res.status(404).json({ error: 'Pagamento não encontrado.' });
    res.json({ payout: updated });
  });

  app.get('/api/admin/finance/export', async (req, res) => {
    if (!(await requireAdmin(req, res))) return;
    const type = String(req.query.type || 'csv');
    const scope = String(req.query.scope || 'dashboard');
    const month = String(req.query.month || periodMonthKey());

    if (scope === 'creators') {
      const rows = computeCreatorSummaries().map((c) => ({
        criador: c.creatorName,
        email: c.creatorEmail,
        exclusiva: c.exclusiveRevenue.toFixed(2),
        global: c.globalRevenue.toFixed(2),
        total: (c.exclusiveRevenue + c.globalRevenue).toFixed(2),
        status: c.payoutStatus,
      }));
      const csv = toCsv(rows);
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="pagamentos-criadores-${month}.csv"`);
      return res.send('\uFEFF' + csv);
    }

    if (scope === 'ranking') {
      const dist = computeGlobalDistribution(month);
      const rows = dist.ranking.map((r, i) => ({
        posicao: i + 1,
        criador: r.creatorName,
        curtidas: r.likes,
        comentarios: r.comments,
        pontos: r.points,
        participacao: `${r.sharePercent.toFixed(2)}%`,
        valor: r.globalPayout.toFixed(2),
      }));
      const csv = toCsv(rows);
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="ranking-global-${month}.csv"`);
      return res.send('\uFEFF' + csv);
    }

    const dash = computeFinanceDashboard();
    const rows = dash.revenueByDay.map((d) => ({
      data: d.date,
      receita: d.amount.toFixed(2),
    }));
    if (type === 'json') {
      return res.json({ dashboard: dash, month });
    }
    const csv = toCsv(rows);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="financeiro-${month}.csv"`);
    res.send('\uFEFF' + csv);
  });

  app.get('/api/admin/finance/month-closes', async (req, res) => {
    if (!(await requireAdmin(req, res))) return;
    res.json({ closes: localDb.getMonthlyCloses() });
  });
}
