export type MinutagemContentType = 'nude' | 'sexo' | 'violencia' | 'outro';

export type MinutagemReviewStatus = 'pending' | 'approved' | 'rejected';

export type MinutagemAnalysisStatus = 'pending' | 'in_progress' | 'completed' | 'rejected';

export interface MinutagemMarker {
  id: string;
  obraId: string;
  obraTitulo: string;
  tipoConteudo: MinutagemContentType;
  /** Nome ou descrição curta do momento */
  label: string;
  /** Minuto do filme/série (desde o início) */
  minutos: number;
  segundos?: number;
  /** Fim do momento (opcional) */
  fimMinutos?: number;
  fimSegundos?: number;
  /** Duração em segundos (opcional) */
  duracaoSegundos?: number;
  episodioNum?: number;
  /** Ex: S01E02 */
  episodioLabel?: string;
  submittedByEmail?: string;
  approvedByEmail?: string;
  source: 'admin' | 'fan' | 'analysis';
  createdAt: string;
}

export interface MinutagemMarkerSubmission {
  id: string;
  obraId: string;
  obraTitulo: string;
  usuarioEmail: string;
  usuarioNome: string;
  tipoConteudo: MinutagemContentType;
  label: string;
  minutos: number;
  segundos?: number;
  episodioNum?: number;
  status: MinutagemReviewStatus;
  requestedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  adminNote?: string;
}

export interface MinutagemAnalysisRequest {
  id: string;
  obraTitulo: string;
  obraId?: string;
  tipoObra?: 'filme' | 'serie' | 'anime';
  usuarioEmail: string;
  usuarioNome: string;
  mensagem?: string;
  status: MinutagemAnalysisStatus;
  requestedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  adminNote?: string;
}

export const MINUTAGEM_CONTENT_LABELS: Record<MinutagemContentType, string> = {
  nude: 'Nudez',
  sexo: 'Cena de sexo',
  violencia: 'Violência explícita',
  outro: 'Conteúdo sensível',
};
