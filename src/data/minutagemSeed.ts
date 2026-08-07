import type { MinutagemMarker } from '../types/minutagem.ts';

/** Marcadores iniciais — expanda pelo painel admin ou aprovações de fãs. */
export const MINUTAGEM_SEED_MARKERS: Omit<MinutagemMarker, 'id' | 'createdAt'>[] = [
  {
    obraId: 'harry-potter',
    obraTitulo: 'Harry Potter',
    tipoConteudo: 'violencia',
    label: 'Batalha no corredor (exemplo)',
    minutos: 42,
    segundos: 15,
    source: 'admin',
    approvedByEmail: 'mateusvini.t10@gmail.com',
  },
  {
    obraId: 'the-last-of-us',
    obraTitulo: 'The Last of Us',
    tipoConteudo: 'violencia',
    label: 'Confronto inicial (exemplo)',
    minutos: 18,
    segundos: 0,
    source: 'admin',
    approvedByEmail: 'mateusvini.t10@gmail.com',
  },
  {
    obraId: 'one-piece',
    obraTitulo: 'One Piece',
    tipoConteudo: 'outro',
    label: 'Momento sensível — episódio piloto (exemplo)',
    minutos: 12,
    segundos: 30,
    episodioNum: 1,
    source: 'admin',
    approvedByEmail: 'mateusvini.t10@gmail.com',
  },
];
