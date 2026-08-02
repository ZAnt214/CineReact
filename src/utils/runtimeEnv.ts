import fs from 'fs';
import path from 'path';

/** Detecta produção sem depender só de NODE_ENV (Railway injeta RAILWAY_ENVIRONMENT). */
export function isProductionRuntime(): boolean {
  if (process.env.NODE_ENV === 'production') return true;
  if (process.env.RAILWAY_ENVIRONMENT) return true;
  return fs.existsSync(path.join(process.cwd(), 'dist', 'index.html'));
}
