import { AppError } from "./errors.js";
import { config } from "../config.js";

function ensureEmailConfig() {
  if (!config.resendApiKey || !config.emailFrom) {
    throw new AppError(503, "O envio do código por e-mail ainda não foi configurado neste ambiente.");
  }
}

export async function sendContactChangeOtpEmail({
  to,
  name,
  code,
  destinationMasked,
  expiresInMinutes,
}: {
  to: string;
  name: string;
  code: string;
  destinationMasked: string;
  expiresInMinutes: number;
}) {
  ensureEmailConfig();

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: config.emailFrom,
      to: [to],
      subject: `${config.appName}: confirme a alteração do seu e-mail`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#241a34">
          <h1 style="font-size:22px;margin-bottom:16px;">Confirme a alteração do seu e-mail</h1>
          <p style="font-size:14px;line-height:1.6;margin-bottom:16px;">
            Olá, ${escapeHtml(name)}.
          </p>
          <p style="font-size:14px;line-height:1.6;margin-bottom:16px;">
            Recebemos um pedido para alterar o e-mail da sua conta no ${escapeHtml(config.appName)} para
            <strong>${escapeHtml(destinationMasked)}</strong>.
          </p>
          <div style="margin:24px 0;padding:18px 20px;background:#f4efff;border-radius:16px;text-align:center;">
            <div style="font-size:12px;letter-spacing:0.18em;text-transform:uppercase;color:#6d4ac9;margin-bottom:8px;">Código de confirmação</div>
            <div style="font-size:32px;font-weight:700;letter-spacing:0.28em;color:#2d1d4f;">${escapeHtml(code)}</div>
          </div>
          <p style="font-size:14px;line-height:1.6;margin-bottom:12px;">
            Esse código expira em ${expiresInMinutes} minutos.
          </p>
          <p style="font-size:13px;line-height:1.6;color:#6b637b;">
            Se você não solicitou essa alteração, ignore esta mensagem e mantenha sua conta protegida.
          </p>
        </div>
      `,
    }),
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new AppError(502, payload?.message ?? "Não foi possível enviar o código por e-mail.");
  }
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
