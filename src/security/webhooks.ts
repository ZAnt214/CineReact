import crypto from 'crypto';
import type { Request } from 'express';
import { localDb } from '../db/local_db.ts';
import { raiseSecurityAlert } from './monitoring.ts';
import { getClientIp } from './audit.ts';

export function validateMercadoPagoWebhook(req: Request, paymentId: string): boolean {
  const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      raiseSecurityAlert({
        type: 'webhook_invalid',
        severity: 'critical',
        message: 'Webhook Mercado Pago sem MERCADOPAGO_WEBHOOK_SECRET em produção',
        ip: getClientIp(req),
        metadata: JSON.stringify({ paymentId }),
      });
      return false;
    }
    return !!process.env.MERCADOPAGO_ACCESS_TOKEN;
  }

  const xSignature = req.headers['x-signature'];
  const xRequestId = req.headers['x-request-id'];
  if (typeof xSignature !== 'string' || typeof xRequestId !== 'string') {
    raiseSecurityAlert({
      type: 'webhook_invalid',
      severity: 'high',
      message: 'Webhook Mercado Pago sem assinatura',
      ip: getClientIp(req),
      metadata: JSON.stringify({ paymentId }),
    });
    return false;
  }

  const parts = Object.fromEntries(
    xSignature.split(',').map((p) => {
      const [k, v] = p.split('=');
      return [k.trim(), v?.trim()];
    })
  );
  const ts = parts.ts;
  const receivedHash = parts.v1;
  if (!ts || !receivedHash) return false;

  const manifest = `id:${paymentId};request-id:${xRequestId};ts:${ts};`;
  const expected = crypto.createHmac('sha256', secret).update(manifest).digest('hex');
  if (expected.length !== receivedHash.length) return false;
  const valid = crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(receivedHash));
  if (!valid) {
    raiseSecurityAlert({
      type: 'webhook_invalid',
      severity: 'high',
      message: 'Assinatura inválida no webhook Mercado Pago',
      ip: getClientIp(req),
      metadata: JSON.stringify({ paymentId, xRequestId }),
    });
  }
  return valid;
}

export function claimIdempotencyKey(scope: string, key: string, resultRef?: string): boolean {
  return localDb.claimIdempotencyKey(scope, key, resultRef);
}

export function hasIdempotencyKey(scope: string, key: string): boolean {
  return localDb.hasIdempotencyKey(scope, key);
}
