import rateLimit from 'express-rate-limit';
import type { Request, Response } from 'express';
import { getClientIp } from './audit.ts';
import { raiseSecurityAlert } from './monitoring.ts';

function limitHandler(req: Request, res: Response) {
  raiseSecurityAlert({
    type: 'rate_limit',
    severity: 'low',
    message: `Rate limit excedido em ${req.path}`,
    ip: getClientIp(req),
  });
  res.status(429).json({ error: 'Muitas requisições. Aguarde alguns instantes e tente novamente.' });
}

export const globalApiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.path === '/health' || req.path.endsWith('/health'),
  keyGenerator: (req) => getClientIp(req),
  handler: limitHandler,
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => getClientIp(req),
  handler: limitHandler,
});

export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 8,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => getClientIp(req),
  handler: limitHandler,
});

export const adminLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => getClientIp(req) + ':' + String(req.headers.cookie || '').slice(0, 40),
  handler: limitHandler,
});

export const webhookLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => getClientIp(req),
  handler: limitHandler,
});

/** Solicitações públicas de inclusão de canal — evita spam na fila do admin. */
export const channelRequestLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => getClientIp(req),
  handler: limitHandler,
});
