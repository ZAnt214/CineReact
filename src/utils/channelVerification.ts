import type { Obra } from '../types.ts';

/** Client-safe: indica canal com criador oficial vinculado (sem acessar localDb). */
export function isChannelVerifiedOnClient(obra?: Pick<Obra, 'officialCreatorEmail'> | null): boolean {
  return Boolean(obra?.officialCreatorEmail?.trim());
}
