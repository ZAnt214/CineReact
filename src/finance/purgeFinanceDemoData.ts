import { localDb } from '../db/local_db.ts';

/** E-mails usados apenas no seed fictício removido — limpeza idempotente no startup. */
const DEMO_FINANCE_SUBSCRIBERS = new Set([
  'fan1@cinereact.app',
  'fan2@cinereact.app',
  'fan3@cinereact.app',
  'fan4@cinereact.app',
  'fan5@cinereact.app',
  'fan6@cinereact.app',
  'fan7@cinereact.app',
  'fan8@cinereact.app',
  'fan-cancel@cinereact.app',
]);

function isDemoSubscriber(email?: string): boolean {
  if (!email) return false;
  return DEMO_FINANCE_SUBSCRIBERS.has(email.toLowerCase());
}

/** Remove dados fictícios de demonstração do financeiro, se ainda existirem. */
export function purgeFinanceDemoData(): void {
  localDb.purgeFinanceDemoSeedData(isDemoSubscriber);
}
