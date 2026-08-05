import type { SupabaseClient } from '@supabase/supabase-js';

type ResendResult = { ok: true } | { ok: false; error: string };

function getResendApiKey(): string | null {
  const key = process.env.RESEND_API_KEY?.trim();
  if (!key || key.toLowerCase().includes('your_') || key === 'MY_RESEND_API_KEY') {
    return null;
  }
  return key;
}

function getAuthEmailFrom(): string | null {
  const from = process.env.AUTH_EMAIL_FROM?.trim();
  if (!from) return null;
  return from;
}

export function isCustomAuthEmailConfigured(): boolean {
  return !!getResendApiKey() && !!getAuthEmailFrom();
}

function buildVerificationEmailHtml(actionLink: string): string {
  return `
    <div style="font-family: system-ui, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
      <h1 style="color: #111; font-size: 22px;">Confirme seu e-mail</h1>
      <p style="color: #444; line-height: 1.5;">
        Clique no botão abaixo para ativar sua conta no CineReact.
      </p>
      <p style="margin: 28px 0;">
        <a href="${actionLink}" style="background: #eab308; color: #111; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600;">
          Confirmar e-mail
        </a>
      </p>
      <p style="color: #666; font-size: 13px; line-height: 1.5;">
        Se o botão não funcionar, copie e cole este link no navegador:<br />
        <a href="${actionLink}">${actionLink}</a>
      </p>
    </div>
  `.trim();
}

export async function sendVerificationEmailViaResend(
  to: string,
  actionLink: string
): Promise<ResendResult> {
  const apiKey = getResendApiKey();
  const from = getAuthEmailFrom();
  if (!apiKey || !from) {
    return {
      ok: false,
      error:
        'Envio alternativo não configurado. Defina RESEND_API_KEY e AUTH_EMAIL_FROM no Railway, ou configure SMTP em Supabase → Authentication → Emails.',
    };
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: [to],
        subject: 'Confirme seu e-mail — CineReact',
        html: buildVerificationEmailHtml(actionLink),
      }),
    });

    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      const detail =
        typeof body?.message === 'string'
          ? body.message
          : typeof body?.error === 'string'
            ? body.error
            : `HTTP ${response.status}`;
      console.error('[Auth] Resend API falhou:', detail, body);
      return {
        ok: false,
        error: `Falha ao enviar e-mail via Resend: ${detail}. Verifique domínio verificado e API key com acesso completo.`,
      };
    }

    return { ok: true };
  } catch (error) {
    console.error('[Auth] Erro ao chamar Resend API:', error);
    return { ok: false, error: 'Erro de rede ao enviar e-mail de confirmação.' };
  }
}

export async function generateSignupConfirmationLink(
  admin: SupabaseClient,
  email: string,
  redirectTo: string,
  password?: string
): Promise<{ ok: true; actionLink: string } | { ok: false; error: string }> {
  const params = {
    type: 'signup' as const,
    email,
    password: password ?? '__resend_no_password_change__',
    options: { redirectTo },
  };

  const { data, error } = await admin.auth.admin.generateLink(params);

  if (error) {
    console.error('[Auth] generateLink falhou:', {
      message: error.message,
      code: error.code,
      status: error.status,
    });
    return {
      ok: false,
      error: error.message || 'Não foi possível gerar link de confirmação.',
    };
  }

  const actionLink = data?.properties?.action_link;
  if (!actionLink) {
    return { ok: false, error: 'Supabase não retornou link de confirmação.' };
  }

  return { ok: true, actionLink };
}

export async function sendVerificationEmailWithGenerateLinkFallback(
  admin: SupabaseClient,
  email: string,
  redirectTo: string,
  password?: string
): Promise<ResendResult> {
  if (!isCustomAuthEmailConfigured()) {
    return {
      ok: false,
      error:
        'SMTP do Supabase falhou e envio alternativo não está configurado (RESEND_API_KEY + AUTH_EMAIL_FROM).',
    };
  }

  const link = await generateSignupConfirmationLink(admin, email, redirectTo, password);
  if (link.ok === false) {
    return { ok: false, error: link.error };
  }

  return sendVerificationEmailViaResend(email, link.actionLink);
}
