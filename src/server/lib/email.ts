import nodemailer, { type Transporter } from "nodemailer";
import { env } from "@/server/config/env";

/**
 * Nodemailer SMTP transport.
 *
 * Lazily created and cached on globalThis to survive HMR in dev mode.
 * If SMTP env vars are missing, the transporter is null and emails will
 * be logged to console instead (useful for early development).
 */
const globalForEmail = globalThis as unknown as {
  emailTransporter?: Transporter | null;
};

function getTransporter(): Transporter | null {
  if (globalForEmail.emailTransporter !== undefined) {
    return globalForEmail.emailTransporter;
  }

  if (!env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASSWORD) {
    console.warn(
      "[email] SMTP env vars not set - emails will be logged to console only.",
    );
    globalForEmail.emailTransporter = null;
    return null;
  }

  const port = Number.parseInt(env.SMTP_PORT ?? "465", 10);
  const transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port,
    secure: port === 465,
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASSWORD,
    },
  });

  globalForEmail.emailTransporter = transporter;
  return transporter;
}

interface SendEmailOptions {
  to: string;
  subject: string;
  text: string;
  html: string;
}

async function sendEmail(opts: SendEmailOptions): Promise<void> {
  const transporter = getTransporter();
  const fromName = env.SMTP_FROM_NAME ?? "CopyPrompt";
  const fromEmail = env.SMTP_FROM ?? env.SMTP_USER ?? "noreply@example.com";
  const from = `"${fromName}" <${fromEmail}>`;

  if (!transporter) {
    // Dev fallback: log instead of sending
    console.log("─── [email] DEV MODE - email not sent ───");
    console.log(`From: ${from}`);
    console.log(`To: ${opts.to}`);
    console.log(`Subject: ${opts.subject}`);
    console.log(opts.text);
    console.log("──────────────────────────────────────────");
    return;
  }

  await transporter.sendMail({
    from,
    to: opts.to,
    subject: opts.subject,
    text: opts.text,
    html: opts.html,
  });
}

/* ─────────────────────────────────────────────────────────── */
/* Templates                                                    */
/* ─────────────────────────────────────────────────────────── */

/**
 * Email theme tokens — must match the in-app indigo palette.
 * Note: oklch / CSS vars are NOT supported in email clients, so these
 * are baked-in HEX equivalents.
 *
 *   --primary  → oklch(0.66 0.21 270) ≈ #6366f1 (indigo)
 *   --background → oklch(0.115 0.008 264) ≈ #0a0a0f
 *   --card     → oklch(0.155 0.008 264) ≈ #17171f
 *   --border   → rgba(255,255,255,0.08)
 */
const COLOR_PRIMARY = "#6366f1";
const COLOR_PRIMARY_FG = "#ffffff";
const COLOR_BG = "#0a0a0f";
const COLOR_CARD = "#17171f";
const COLOR_BORDER = "rgba(255, 255, 255, 0.10)";
const COLOR_TEXT = "#fafafa";
const COLOR_TEXT_MUTED = "#a1a1aa";
const COLOR_TEXT_DIM = "#71717a";

const baseStyle = `font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: ${COLOR_BG}; color: ${COLOR_TEXT}; padding: 32px 16px; margin: 0;`;
const cardStyle = `max-width: 480px; margin: 0 auto; background: ${COLOR_CARD}; border: 1px solid ${COLOR_BORDER}; border-radius: 12px; padding: 32px;`;
const buttonStyle = `display: inline-block; background: ${COLOR_PRIMARY}; color: ${COLOR_PRIMARY_FG}; font-weight: 600; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-size: 14px;`;

function brandHeader(): string {
  return `<div style="text-align: center; margin-bottom: 24px;">
    <span style="display: inline-block; vertical-align: middle; width: 24px; height: 24px; line-height: 24px; background: ${COLOR_PRIMARY}; color: ${COLOR_PRIMARY_FG}; border-radius: 6px; font-size: 14px; font-weight: 700; text-align: center;">C</span>
    <span style="display: inline-block; vertical-align: middle; font-weight: 600; font-size: 16px; margin-left: 8px; letter-spacing: -0.01em;">CopyPrompt</span>
  </div>`;
}

function footer(): string {
  return `<p style="color: ${COLOR_TEXT_DIM}; font-size: 12px; text-align: center; margin-top: 24px;">
    CopyPrompt — The best free prompts for every AI tool.
  </p>`;
}

/**
 * Email sent when a user signs up. Contains a click-here link to verify.
 */
export async function sendVerificationEmail(
  email: string,
  verificationUrl: string,
  name?: string,
): Promise<void> {
  const greeting = name ? `Hi ${name},` : "Welcome!";
  const subject = "Confirm your CopyPrompt email";

  const text = `${greeting}

Thanks for signing up for CopyPrompt. To finish creating your account, please verify your email by clicking this link:

${verificationUrl}

This link expires in 24 hours.

If you didn't sign up, you can safely ignore this email.`;

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Verify your email</title></head>
<body style="${baseStyle}">
  <div style="${cardStyle}">
    ${brandHeader()}

    <h1 style="font-size: 20px; font-weight: 600; margin: 0 0 12px 0; text-align: center;">
      Confirm your email
    </h1>

    <p style="color: ${COLOR_TEXT_MUTED}; font-size: 14px; line-height: 1.6; margin: 0 0 24px 0;">
      ${greeting} Thanks for signing up. Click the button below to verify your email and finish creating your account.
    </p>

    <div style="text-align: center; margin: 32px 0;">
      <a href="${verificationUrl}" style="${buttonStyle}">Verify email</a>
    </div>

    <p style="color: ${COLOR_TEXT_DIM}; font-size: 12px; line-height: 1.6; margin: 0;">
      Or paste this link into your browser:<br>
      <a href="${verificationUrl}" style="color: ${COLOR_PRIMARY}; word-break: break-all;">${verificationUrl}</a>
    </p>

    <p style="color: ${COLOR_TEXT_DIM}; font-size: 12px; text-align: center; margin: 24px 0 0 0;">
      This link expires in 24 hours.<br>
      If you didn't sign up, you can safely ignore this email.
    </p>
  </div>
  ${footer()}
</body>
</html>`;

  await sendEmail({ to: email, subject, text, html });
}

/**
 * Email sent when a user requests a password reset.
 */
export async function sendPasswordResetEmail(
  email: string,
  resetUrl: string,
): Promise<void> {
  const subject = "Reset your CopyPrompt password";

  const text = `Someone requested a password reset for your CopyPrompt account.

Click this link to set a new password:
${resetUrl}

This link expires in 1 hour.

If you didn't request this, you can safely ignore this email - your password will stay the same.`;

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Reset your password</title></head>
<body style="${baseStyle}">
  <div style="${cardStyle}">
    ${brandHeader()}

    <h1 style="font-size: 20px; font-weight: 600; margin: 0 0 12px 0; text-align: center;">
      Reset your password
    </h1>

    <p style="color: ${COLOR_TEXT_MUTED}; font-size: 14px; line-height: 1.6; margin: 0 0 24px 0;">
      Someone requested a password reset for your CopyPrompt account. Click the button below to set a new password.
    </p>

    <div style="text-align: center; margin: 32px 0;">
      <a href="${resetUrl}" style="${buttonStyle}">Reset password</a>
    </div>

    <p style="color: ${COLOR_TEXT_DIM}; font-size: 12px; line-height: 1.6; margin: 0;">
      Or paste this link into your browser:<br>
      <a href="${resetUrl}" style="color: ${COLOR_PRIMARY}; word-break: break-all;">${resetUrl}</a>
    </p>

    <p style="color: ${COLOR_TEXT_DIM}; font-size: 12px; text-align: center; margin: 24px 0 0 0;">
      This link expires in 1 hour.<br>
      If you didn't request this, you can safely ignore this email - your password won't change.
    </p>
  </div>
  ${footer()}
</body>
</html>`;

  await sendEmail({ to: email, subject, text, html });
}
