import type { Express, Request, Response } from 'express';
import { localDb } from '../db/local_db.ts';
import type {
  MinutagemAnalysisRequest,
  MinutagemContentType,
  MinutagemMarkerSubmission,
} from '../types/minutagem.ts';
import { parseMinutagemInput } from './utils.ts';
import { requireSessionEmail } from '../security/sessionBinding.ts';
import type { SecurityContext } from '../security/types.ts';

type RequireAdminFn = (req: Request, res: Response) => Promise<string | null>;

const CONTENT_TYPES: MinutagemContentType[] = ['nude', 'sexo', 'violencia', 'outro'];

function isValidContentType(value: string): value is MinutagemContentType {
  return CONTENT_TYPES.includes(value as MinutagemContentType);
}

function resolveObra(obraId: string) {
  return localDb.getObras().find((o) => o.id === obraId);
}

export function registerMinutagemRoutes(
  app: Express,
  requireAdmin: RequireAdminFn,
  security: SecurityContext
) {
  app.get('/api/minutagem/catalog', (_req, res) => {
    try {
      const catalog = localDb.getMinutagemCatalogSummary();
      res.json({ catalog });
    } catch (error) {
      console.error('[Minutagem] Erro ao listar catálogo:', error);
      res.status(500).json({ error: 'Erro ao carregar catálogo de minutagem.' });
    }
  });

  app.get('/api/minutagem/markers', (req, res) => {
    try {
      const obraId = String(req.query.obraId || '').trim();
      if (!obraId) {
        return res.status(400).json({ error: 'obraId é obrigatório.' });
      }
      const markers = localDb
        .getMinutagemMarkers(obraId)
        .sort((a, b) => a.minutos * 60 + (a.segundos || 0) - (b.minutos * 60 + (b.segundos || 0)));
      res.json({ markers });
    } catch (error) {
      console.error('[Minutagem] Erro ao buscar marcadores:', error);
      res.status(500).json({ error: 'Erro ao buscar minutagem.' });
    }
  });

  app.get('/api/minutagem/search', (req, res) => {
    try {
      const q = String(req.query.q || '').trim().toLowerCase();
      if (!q || q.length < 2) {
        return res.json({ results: [] });
      }
      const catalog = localDb.getMinutagemCatalogSummary().filter(
        (c) => c.obraTitulo.toLowerCase().includes(q) || c.obraId.toLowerCase().includes(q)
      );
      res.json({ results: catalog.slice(0, 20) });
    } catch (error) {
      res.status(500).json({ error: 'Erro na busca.' });
    }
  });

  app.get('/api/minutagem/me', (req, res) => {
    try {
      const sessionEmail = requireSessionEmail(req, res, security);
      if (!sessionEmail) return;

      const user = localDb.findUsuarioByEmailSync(sessionEmail);
      if (!user) {
        return res.status(404).json({ error: 'Usuário não encontrado.' });
      }

      const submissions = (localDb.getMinutagemMarkerSubmissions() || []).filter(
        (s) => s.usuarioEmail.toLowerCase() === sessionEmail
      );
      const analysisRequests = (localDb.getMinutagemAnalysisRequests() || []).filter(
        (r) => r.usuarioEmail.toLowerCase() === sessionEmail
      );

      res.json({
        pendingSubmission: localDb.getPendingMinutagemSubmissionForUser(sessionEmail),
        pendingAnalysis: localDb.getPendingMinutagemAnalysisForUser(sessionEmail),
        submissions,
        analysisRequests,
      });
    } catch (error) {
      console.error('[Minutagem] Erro ao buscar status do usuário:', error);
      res.status(500).json({ error: 'Erro ao buscar suas solicitações.' });
    }
  });

  app.post('/api/minutagem/markers/submit', (req, res) => {
    try {
      const sessionEmail = requireSessionEmail(req, res, security, req.body?.email);
      if (!sessionEmail) return;

      const user = localDb.findUsuarioByEmailSync(sessionEmail);
      if (!user) {
        return res.status(404).json({ error: 'Usuário não encontrado. Faça login.' });
      }

      const {
        obraId,
        tipoConteudo,
        label,
        minutagem,
        minutos,
        segundos,
        episodioNum,
      } = req.body || {};

      if (!obraId || !label?.trim()) {
        return res.status(400).json({ error: 'Selecione o filme/série e descreva o momento.' });
      }
      if (!isValidContentType(String(tipoConteudo || ''))) {
        return res.status(400).json({ error: 'Tipo de conteúdo inválido.' });
      }

      const obra = resolveObra(String(obraId));
      if (!obra) {
        return res.status(404).json({ error: 'Filme ou série não encontrado no catálogo.' });
      }
      if (!['filme', 'serie', 'anime'].includes(obra.tipo)) {
        return res.status(400).json({ error: 'Minutagem disponível apenas para filmes, séries e animes.' });
      }

      let parsedMinutes = typeof minutos === 'number' ? { minutos, segundos: segundos || 0 } : null;
      if (!parsedMinutes && minutagem) {
        parsedMinutes = parseMinutagemInput(String(minutagem));
      }
      if (!parsedMinutes) {
        return res.status(400).json({ error: 'Informe a minutagem (ex: 45 ou 1:23).' });
      }

      const pending = localDb.getPendingMinutagemSubmissionForUser(sessionEmail);
      if (pending) {
        return res.json({ submission: pending, alreadyPending: true });
      }

      const submission = localDb.createMinutagemMarkerSubmission({
        obraId: obra.id,
        obraTitulo: obra.titulo,
        usuarioEmail: user.email,
        usuarioNome: user.username,
        tipoConteudo: tipoConteudo as MinutagemContentType,
        label: String(label).trim().slice(0, 200),
        minutos: parsedMinutes.minutos,
        segundos: parsedMinutes.segundos,
        episodioNum: episodioNum ? Number(episodioNum) : undefined,
      });

      localDb.addNotificacao({
        usuarioEmail: user.email,
        titulo: 'Minutagem enviada para análise',
        mensagem: `Sua contribuição para "${obra.titulo}" foi recebida. Assim que aprovada, aparecerá no catálogo para streamers.`,
      });

      localDb.addNotificacao({
        titulo: 'Nova minutagem de fã pendente',
        mensagem: `${user.username} enviou minutagem para "${obra.titulo}" — ${submission.label}.`,
      });

      res.status(201).json({ submission });
    } catch (error) {
      console.error('[Minutagem] Erro ao enviar contribuição:', error);
      res.status(500).json({ error: 'Erro ao enviar minutagem.' });
    }
  });

  app.post('/api/minutagem/analysis/request', (req, res) => {
    try {
      const sessionEmail = requireSessionEmail(req, res, security, req.body?.email);
      if (!sessionEmail) return;

      const user = localDb.findUsuarioByEmailSync(sessionEmail);
      if (!user) {
        return res.status(404).json({ error: 'Usuário não encontrado. Faça login.' });
      }

      const { obraTitulo, obraId, tipoObra, mensagem } = req.body || {};
      const titulo = String(obraTitulo || '').trim();
      if (titulo.length < 2) {
        return res.status(400).json({ error: 'Informe o nome do filme ou série.' });
      }

      let linkedObraId: string | undefined;
      let linkedTitulo = titulo;
      if (obraId) {
        const obra = resolveObra(String(obraId));
        if (obra) {
          linkedObraId = obra.id;
          linkedTitulo = obra.titulo;
        }
      }

      const pending = localDb.getPendingMinutagemAnalysisForUser(sessionEmail);
      if (pending) {
        return res.json({ request: pending, alreadyPending: true });
      }

      const tipo =
        tipoObra === 'filme' || tipoObra === 'serie' || tipoObra === 'anime' ? tipoObra : undefined;

      const request = localDb.createMinutagemAnalysisRequest({
        obraTitulo: linkedTitulo,
        obraId: linkedObraId,
        tipoObra: tipo,
        usuarioEmail: user.email,
        usuarioNome: user.username,
        mensagem: mensagem ? String(mensagem).trim().slice(0, 500) : undefined,
      });

      localDb.addNotificacao({
        usuarioEmail: user.email,
        titulo: 'Pedido de análise de minutagem',
        mensagem: `Recebemos seu pedido para catalogar "${linkedTitulo}". Você será notificado quando a minutagem estiver disponível.`,
      });

      localDb.addNotificacao({
        titulo: 'Novo pedido de análise de minutagem',
        mensagem: `${user.username} pediu catalogação de "${linkedTitulo}".`,
      });

      res.status(201).json({ request });
    } catch (error) {
      console.error('[Minutagem] Erro ao pedir análise:', error);
      res.status(500).json({ error: 'Erro ao registrar pedido de análise.' });
    }
  });

  app.get('/api/admin/minutagem/submissions', async (req, res) => {
    if (!(await requireAdmin(req, res))) return;
    const status = req.query.status as MinutagemMarkerSubmission['status'] | undefined;
    const submissions = localDb.getMinutagemMarkerSubmissions(status);
    res.json({ submissions });
  });

  app.get('/api/admin/minutagem/analysis', async (req, res) => {
    if (!(await requireAdmin(req, res))) return;
    const status = req.query.status as MinutagemAnalysisRequest['status'] | undefined;
    const requests = localDb.getMinutagemAnalysisRequests(status);
    res.json({ requests });
  });

  app.get('/api/admin/minutagem/markers', async (req, res) => {
    if (!(await requireAdmin(req, res))) return;
    const obraId = String(req.query.obraId || '').trim();
    const markers = obraId ? localDb.getMinutagemMarkers(obraId) : localDb.getMinutagemMarkers();
    res.json({ markers });
  });

  app.post('/api/admin/minutagem/markers', async (req, res) => {
    const adminEmail = await requireAdmin(req, res);
    if (!adminEmail) return;

    try {
      const {
        obraId,
        tipoConteudo,
        label,
        minutagem,
        minutos,
        segundos,
        episodioNum,
      } = req.body || {};

      if (!obraId || !label?.trim()) {
        return res.status(400).json({ error: 'Obra e descrição são obrigatórios.' });
      }
      if (!isValidContentType(String(tipoConteudo || ''))) {
        return res.status(400).json({ error: 'Tipo de conteúdo inválido.' });
      }

      const obra = resolveObra(String(obraId));
      if (!obra) {
        return res.status(404).json({ error: 'Obra não encontrada.' });
      }

      let parsedMinutes =
        typeof minutos === 'number' ? { minutos, segundos: segundos || 0 } : null;
      if (!parsedMinutes && minutagem) {
        parsedMinutes = parseMinutagemInput(String(minutagem));
      }
      if (!parsedMinutes) {
        return res.status(400).json({ error: 'Minutagem inválida.' });
      }

      const marker = localDb.createMinutagemMarker({
        obraId: obra.id,
        obraTitulo: obra.titulo,
        tipoConteudo: tipoConteudo as MinutagemContentType,
        label: String(label).trim().slice(0, 200),
        minutos: parsedMinutes.minutos,
        segundos: parsedMinutes.segundos,
        episodioNum: episodioNum ? Number(episodioNum) : undefined,
        approvedByEmail: adminEmail,
        source: 'admin',
      });

      localDb.appendAuditLog({
        actorEmail: adminEmail,
        action: 'create_minutagem_marker',
        targetType: 'minutagem',
        targetId: marker.id,
        details: `${obra.titulo} · ${marker.label}`,
      });

      res.status(201).json({ marker });
    } catch (error) {
      console.error('[Minutagem] Erro ao criar marcador admin:', error);
      res.status(500).json({ error: 'Erro ao salvar minutagem.' });
    }
  });

  app.post('/api/admin/minutagem/submissions/:id/approve', async (req, res) => {
    const adminEmail = await requireAdmin(req, res);
    if (!adminEmail) return;

    try {
      const { id } = req.params;
      const existing = localDb.getMinutagemMarkerSubmissions().find((s) => s.id === id);
      if (!existing) {
        return res.status(404).json({ error: 'Contribuição não encontrada.' });
      }
      if (existing.status !== 'pending') {
        return res.status(400).json({ error: 'Esta contribuição já foi processada.' });
      }

      const marker = localDb.createMinutagemMarker({
        obraId: existing.obraId,
        obraTitulo: existing.obraTitulo,
        tipoConteudo: existing.tipoConteudo,
        label: existing.label,
        minutos: existing.minutos,
        segundos: existing.segundos,
        episodioNum: existing.episodioNum,
        submittedByEmail: existing.usuarioEmail,
        approvedByEmail: adminEmail,
        source: 'fan',
      });

      const updated = localDb.updateMinutagemMarkerSubmission(id, {
        status: 'approved',
        reviewedAt: new Date().toISOString(),
        reviewedBy: adminEmail,
      });

      localDb.addNotificacao({
        usuarioEmail: existing.usuarioEmail,
        titulo: 'Minutagem aprovada!',
        mensagem: `Sua contribuição para "${existing.obraTitulo}" foi aprovada e já está visível para streamers.`,
      });

      localDb.appendAuditLog({
        actorEmail: adminEmail,
        action: 'approve_minutagem_submission',
        targetType: 'minutagem_submission',
        targetId: id,
        details: existing.obraTitulo,
      });

      res.json({ submission: updated, marker });
    } catch (error) {
      console.error('[Minutagem] Erro ao aprovar contribuição:', error);
      res.status(500).json({ error: 'Erro ao aprovar minutagem.' });
    }
  });

  app.post('/api/admin/minutagem/submissions/:id/reject', async (req, res) => {
    const adminEmail = await requireAdmin(req, res);
    if (!adminEmail) return;

    try {
      const { id } = req.params;
      const { note } = req.body || {};
      const existing = localDb.getMinutagemMarkerSubmissions().find((s) => s.id === id);
      if (!existing) {
        return res.status(404).json({ error: 'Contribuição não encontrada.' });
      }
      if (existing.status !== 'pending') {
        return res.status(400).json({ error: 'Esta contribuição já foi processada.' });
      }

      const updated = localDb.updateMinutagemMarkerSubmission(id, {
        status: 'rejected',
        reviewedAt: new Date().toISOString(),
        reviewedBy: adminEmail,
        adminNote: note || undefined,
      });

      localDb.addNotificacao({
        usuarioEmail: existing.usuarioEmail,
        titulo: 'Minutagem não aprovada',
        mensagem:
          note ||
          `Sua contribuição para "${existing.obraTitulo}" não foi aprovada. Você pode enviar outra com mais detalhes.`,
      });

      localDb.appendAuditLog({
        actorEmail: adminEmail,
        action: 'reject_minutagem_submission',
        targetType: 'minutagem_submission',
        targetId: id,
        details: existing.obraTitulo,
      });

      res.json({ submission: updated });
    } catch (error) {
      console.error('[Minutagem] Erro ao rejeitar contribuição:', error);
      res.status(500).json({ error: 'Erro ao rejeitar minutagem.' });
    }
  });

  app.post('/api/admin/minutagem/analysis/:id/complete', async (req, res) => {
    const adminEmail = await requireAdmin(req, res);
    if (!adminEmail) return;

    try {
      const { id } = req.params;
      const { note, markers } = req.body || {};
      const existing = localDb.getMinutagemAnalysisRequests().find((r) => r.id === id);
      if (!existing) {
        return res.status(404).json({ error: 'Pedido não encontrado.' });
      }
      if (existing.status === 'completed' || existing.status === 'rejected') {
        return res.status(400).json({ error: 'Este pedido já foi finalizado.' });
      }

      const createdMarkers: import('../types/minutagem.ts').MinutagemMarker[] = [];
      if (Array.isArray(markers)) {
        for (const raw of markers) {
          if (!raw?.label || !isValidContentType(String(raw.tipoConteudo || ''))) continue;
          let obraId = raw.obraId || existing.obraId;
          let obraTitulo = existing.obraTitulo;
          if (obraId) {
            const obra = resolveObra(String(obraId));
            if (obra) {
              obraId = obra.id;
              obraTitulo = obra.titulo;
            }
          }
          if (!obraId) continue;

          const parsed =
            typeof raw.minutos === 'number'
              ? { minutos: raw.minutos, segundos: raw.segundos || 0 }
              : parseMinutagemInput(String(raw.minutagem || ''));
          if (!parsed) continue;

          createdMarkers.push(
            localDb.createMinutagemMarker({
              obraId: String(obraId),
              obraTitulo,
              tipoConteudo: raw.tipoConteudo as MinutagemContentType,
              label: String(raw.label).trim().slice(0, 200),
              minutos: parsed.minutos,
              segundos: parsed.segundos,
              episodioNum: raw.episodioNum ? Number(raw.episodioNum) : undefined,
              submittedByEmail: existing.usuarioEmail,
              approvedByEmail: adminEmail,
              source: 'analysis',
            })
          );
        }
      }

      const updated = localDb.updateMinutagemAnalysisRequest(id, {
        status: 'completed',
        reviewedAt: new Date().toISOString(),
        reviewedBy: adminEmail,
        adminNote: note || undefined,
        obraId: existing.obraId || createdMarkers[0]?.obraId,
      });

      localDb.addNotificacao({
        usuarioEmail: existing.usuarioEmail,
        titulo: 'Minutagem catalogada!',
        mensagem:
          note ||
          `A minutagem de "${existing.obraTitulo}" foi catalogada e já está disponível na ferramenta para streamers.`,
      });

      localDb.appendAuditLog({
        actorEmail: adminEmail,
        action: 'complete_minutagem_analysis',
        targetType: 'minutagem_analysis',
        targetId: id,
        details: `${existing.obraTitulo} · ${createdMarkers.length} marcadores`,
      });

      res.json({ request: updated, markers: createdMarkers });
    } catch (error) {
      console.error('[Minutagem] Erro ao completar análise:', error);
      res.status(500).json({ error: 'Erro ao finalizar análise.' });
    }
  });

  app.post('/api/admin/minutagem/analysis/:id/reject', async (req, res) => {
    const adminEmail = await requireAdmin(req, res);
    if (!adminEmail) return;

    try {
      const { id } = req.params;
      const { note } = req.body || {};
      const existing = localDb.getMinutagemAnalysisRequests().find((r) => r.id === id);
      if (!existing) {
        return res.status(404).json({ error: 'Pedido não encontrado.' });
      }
      if (existing.status === 'completed' || existing.status === 'rejected') {
        return res.status(400).json({ error: 'Este pedido já foi finalizado.' });
      }

      const updated = localDb.updateMinutagemAnalysisRequest(id, {
        status: 'rejected',
        reviewedAt: new Date().toISOString(),
        reviewedBy: adminEmail,
        adminNote: note || undefined,
      });

      localDb.addNotificacao({
        usuarioEmail: existing.usuarioEmail,
        titulo: 'Pedido de minutagem não atendido',
        mensagem:
          note ||
          `Não foi possível catalogar "${existing.obraTitulo}" no momento. Tente outro título ou envie mais detalhes.`,
      });

      localDb.appendAuditLog({
        actorEmail: adminEmail,
        action: 'reject_minutagem_analysis',
        targetType: 'minutagem_analysis',
        targetId: id,
        details: existing.obraTitulo,
      });

      res.json({ request: updated });
    } catch (error) {
      console.error('[Minutagem] Erro ao rejeitar análise:', error);
      res.status(500).json({ error: 'Erro ao rejeitar pedido.' });
    }
  });

  app.delete('/api/admin/minutagem/markers/:id', async (req, res) => {
    const adminEmail = await requireAdmin(req, res);
    if (!adminEmail) return;

    const deleted = localDb.deleteMinutagemMarker(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Marcador não encontrado.' });
    }

    localDb.appendAuditLog({
      actorEmail: adminEmail,
      action: 'delete_minutagem_marker',
      targetType: 'minutagem',
      targetId: req.params.id,
    });

    res.json({ success: true });
  });
}
