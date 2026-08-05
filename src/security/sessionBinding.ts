import type { Request, Response } from 'express';
import { normalizeEmail } from './sanitize.ts';
import type { SecurityContext } from './types.ts';

/**
 * Exige sessão válida. Se `hintedEmail` é enviado pelo cliente, deve coincidir com a sessão.
 */
export function requireSessionEmail(
  req: Request,
  res: Response,
  security: SecurityContext,
  hintedEmail?: string | null
): string | null {
  const sessionEmail = security.getAuthEmail(req);
  if (!sessionEmail) {
    res.status(401).json({ error: 'Autenticação necessária.' });
    return null;
  }
  const hint = hintedEmail ? normalizeEmail(String(hintedEmail)) : null;
  if (hint && hint !== sessionEmail) {
    res.status(403).json({ error: 'Operação não autorizada para esta conta.' });
    return null;
  }
  return sessionEmail;
}

/** E-mail da sessão ou undefined quando o visitante não está autenticado (sem query spoofing). */
export function sessionEmailOrUndefined(req: Request, security: SecurityContext): string | undefined {
  return security.getAuthEmail(req) || undefined;
}
