export type DonationRequestStatus = 'pending' | 'approved' | 'rejected';

export interface DonationRequest {
  id: string;
  usuarioEmail: string;
  usuarioNome: string;
  amount: number;
  currency: 'BRL';
  paymentMethod: 'mercado_pago_link';
  paymentLink: string;
  status: DonationRequestStatus;
  requestedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  adminNote?: string;
}

export const DONATION_AMOUNT_BRL = 4.99;
export const DONATION_MP_LINK = 'https://mpago.la/1aUV7Gc';
