export type CreatorVerificationStatus = 'pending' | 'approved' | 'rejected' | 'expired';

export interface CreatorVerificationRequest {
  id: string;
  usuarioEmail: string;
  usuarioNome: string;
  youtubeChannelUrl: string;
  youtubeChannelId?: string;
  channelTitle?: string;
  verificationCode: string;
  status: CreatorVerificationStatus;
  requestedAt: string;
  expiresAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  adminNote?: string;
  codeFoundInDescription?: boolean;
  descriptionCheckedAt?: string;
}

export const CREATOR_VERIFICATION_WINDOW_HOURS = 24;
