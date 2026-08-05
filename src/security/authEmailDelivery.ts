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

function buildVerificationEmailHtml(actionLink: string, appUrl: string): string {
  const year = new Date().getFullYear();
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Confirme seu e-mail — CineReact</title>
</head>
<body style="margin:0;padding:0;background:#050508;font-family:Inter,Segoe UI,system-ui,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#050508;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:520px;background:#0a0a0c;border:1px solid rgba(201,169,98,0.22);border-radius:20px;">
          <tr>
            <td style="padding:32px 32px 20px;text-align:center;">
              <div style="font-size:11px;font-weight:800;letter-spacing:0.28em;text-transform:uppercase;color:#c9a962;margin-bottom:10px;">CineReact</div>
              <h1 style="margin:0;font-size:24px;line-height:1.25;font-weight:800;color:#ffffff;">Confirme seu e-mail</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:0 32px 8px;">
              <p style="margin:0;font-size:15px;line-height:1.6;color:#a1a1aa;">
                Falta só um passo para ativar sua conta. Clique no botão abaixo para confirmar seu e-mail e começar a explorar reacts no CineReact.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 32px 12px;text-align:center;">
              <a href="${actionLink}" style="display:inline-block;background:linear-gradient(90deg,#9a7b3c 0%,#e8d5b5 100%);color:#111111;font-size:15px;font-weight:800;text-decoration:none;padding:14px 32px;border-radius:999px;">
                Confirmar e-mail
              </a>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 32px 28px;">
              <p style="margin:0;font-size:12px;line-height:1.6;color:#71717a;">
                Se o botão não funcionar, copie e cole este link no navegador:
              </p>
              <p style="margin:8px 0 0;font-size:12px;line-height:1.5;">
                <a href="${actionLink}" style="color:#c9a962;word-break:break-all;">${actionLink}</a>
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 32px 28px;border-top:1px solid rgba(255,255,255,0.06);">
              <p style="margin:0;font-size:11px;line-height:1.5;color:#52525b;text-align:center;">
                Você recebeu este e-mail porque criou uma conta em
                <a href="${appUrl}" style="color:#c9a962;text-decoration:none;">CineReact</a>.
                <br />Se não foi você, ignore esta mensagem.
                <br />© ${year} CineReact
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

export async function sendVerificationEmailViaResend(
  to: string,
  actionLink: string,
  appUrl: string
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
        html: buildVerificationEmailHtml(actionLink, appUrl),
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

export async function sendBrandedVerificationEmail(
  admin: SupabaseClient,
  email: string,
  redirectTo: string,
  appUrl: string,
  password?: string
): Promise<ResendResult> {
  if (!isCustomAuthEmailConfigured()) {
    return {
      ok: false,
      error:
        'E-mail personalizado não configurado. Defina RESEND_API_KEY e AUTH_EMAIL_FROM no Railway.',
    };
  }

  const link = await generateSignupConfirmationLink(admin, email, redirectTo, password);
  if (link.ok === false) {
    return { ok: false, error: link.error };
  }

  return sendVerificationEmailViaResend(email, link.actionLink, appUrl);
}

/** @deprecated Use sendBrandedVerificationEmail */
export async function sendVerificationEmailWithGenerateLinkFallback(
  admin: SupabaseClient,
  email: string,
  redirectTo: string,
  password?: string
): Promise<ResendResult> {
  return sendBrandedVerificationEmail(admin, email, redirectTo, redirectTo.replace(/\/api\/auth\/confirm-email$/, ''), password);
}
