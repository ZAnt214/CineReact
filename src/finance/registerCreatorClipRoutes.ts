import type { Express, Request, Response } from 'express';
import { localDb } from '../db/local_db.ts';
import { isVerifiedCreatorEmail } from './subscriptionService.ts';
import type { ClipAccessLevel } from '../types/finance.ts';

export function registerCreatorClipRoutes(app: Express) {
  app.get('/api/creator/clips', (req, res) => {
    try {
      const email = String(req.query.email || '').toLowerCase().trim();
      if (!email) return res.status(400).json({ error: 'E-mail é obrigatório.' });
      if (!isVerifiedCreatorEmail(email)) {
        return res.status(403).json({ error: 'Apenas criadores verificados podem gerenciar conteúdo.' });
      }

      const clips = localDb
        .getCineClips()
        .filter((c) => c.criadorEmail?.toLowerCase() === email)
        .sort((a, b) => new Date(b.publicadoEm).getTime() - new Date(a.publicadoEm).getTime());

      res.json({ clips });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.patch('/api/creator/clips/:id/access', (req, res) => {
    try {
      const email = String(req.body?.email || '').toLowerCase().trim();
      if (!email) return res.status(400).json({ error: 'E-mail é obrigatório.' });
      if (!isVerifiedCreatorEmail(email)) {
        return res.status(403).json({ error: 'Apenas criadores verificados.' });
      }

      const clip = localDb.getCineClipById(req.params.id);
      if (!clip) return res.status(404).json({ error: 'Vídeo não encontrado.' });
      if (clip.criadorEmail?.toLowerCase() !== email) {
        return res.status(403).json({ error: 'Este vídeo não pertence à sua conta.' });
      }

      const accessLevel = req.body?.accessLevel as ClipAccessLevel | undefined;
      const valid: ClipAccessLevel[] = ['public', 'exclusive', 'timed_exclusive'];
      if (accessLevel && !valid.includes(accessLevel)) {
        return res.status(400).json({ error: 'Nível de acesso inválido.' });
      }

      let exclusiveUntil = clip.exclusiveUntil;
      if (accessLevel === 'timed_exclusive') {
        const days = Number(req.body?.exclusiveDays) || 7;
        const until = new Date();
        until.setDate(until.getDate() + days);
        exclusiveUntil = until.toISOString();
      } else if (accessLevel === 'public') {
        exclusiveUntil = undefined;
      }

      const updated = {
        ...clip,
        accessLevel: accessLevel || clip.accessLevel || 'public',
        exclusiveUntil,
        participatesInGlobal:
          req.body?.participatesInGlobal !== undefined
            ? !!req.body.participatesInGlobal
            : clip.participatesInGlobal ?? false,
        atualizadoEm: new Date().toISOString(),
      };

      localDb.saveCineClip(updated);
      res.json({ clip: updated });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });
}
