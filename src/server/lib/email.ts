import nodemailer, { type Transporter } from "nodemailer";
import { SITE_BRAND } from "@/lib/site-brand";
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
  const fromName = env.SMTP_FROM_NAME ?? SITE_BRAND.name;
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
    <span style="display: inline-block; vertical-align: middle; width: 24px; height: 24px; line-height: 24px; background: ${COLOR_PRIMARY}; color: ${COLOR_PRIMARY_FG}; border-radius: 6px; font-size: 14px; font-weight: 700; text-align: center;">m</span>
    <span style="display: inline-block; vertical-align: middle; font-weight: 600; font-size: 16px; margin-left: 8px; letter-spacing: -0.01em;">${SITE_BRAND.name}</span>
  </div>`;
}

function footer(): string {
  return `<p style="color: ${COLOR_TEXT_DIM}; font-size: 12px; text-align: center; margin-top: 24px;">
    ${SITE_BRAND.name} — The best free prompts for every AI tool.
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
  const subject = `Confirm your ${SITE_BRAND.name} email`;

  const text = `${greeting}

Thanks for signing up for ${SITE_BRAND.name}. To finish creating your account, please verify your email by clicking this link:

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

function appUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ??
    `https://${SITE_BRAND.domain}`
  );
}

/** Greeting helper — uses a name when we have one, generic salutation otherwise. */
function greeting(name?: string | null): string {
  const trimmed = (name ?? "").trim();
  if (!trimmed) return "Hi there,";
  // Keep first name only so the email feels human, not formal.
  const firstName = trimmed.split(/\s+/)[0];
  return `Hi ${firstName},`;
}

/**
 * Sent when an admin approves a submission and the prompt goes live.
 *
 * Tone: celebratory + actionable. Single CTA → view the published prompt.
 */
export async function sendSubmissionApprovedEmail(opts: {
  to: string;
  name?: string | null;
  promptTitle: string;
  promptSlug: string;
}): Promise<void> {
  const url = `${appUrl()}/prompt/${opts.promptSlug}`;
  const subject = `Your prompt is live on ${SITE_BRAND.name}`;

  const text = `${greeting(opts.name)}

Great news — your submission "${opts.promptTitle}" was approved and is now live in the public catalog.

View it: ${url}

Thanks for contributing — every prompt makes the library more useful for the next person.

— The ${SITE_BRAND.name} team`;

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>${subject}</title></head>
<body style="${baseStyle}">
  <div style="${cardStyle}">
    ${brandHeader()}

    <h1 style="font-size: 20px; font-weight: 600; margin: 0 0 12px 0; text-align: center;">
      Your prompt is live
    </h1>

    <p style="color: ${COLOR_TEXT_MUTED}; font-size: 14px; line-height: 1.6; margin: 0 0 8px 0;">
      ${greeting(opts.name)}
    </p>
    <p style="color: ${COLOR_TEXT_MUTED}; font-size: 14px; line-height: 1.6; margin: 0 0 24px 0;">
      Great news — your submission "<strong style="color: ${COLOR_TEXT};">${opts.promptTitle}</strong>" was approved and is now live in the public catalog.
    </p>

    <div style="text-align: center; margin: 32px 0;">
      <a href="${url}" style="${buttonStyle}">View your prompt</a>
    </div>

    <p style="color: ${COLOR_TEXT_DIM}; font-size: 12px; line-height: 1.6; margin: 0;">
      Or open this link:<br>
      <a href="${url}" style="color: ${COLOR_PRIMARY}; word-break: break-all;">${url}</a>
    </p>

    <p style="color: ${COLOR_TEXT_DIM}; font-size: 12px; text-align: center; margin: 24px 0 0 0;">
      Thanks for contributing — every prompt makes the library more useful for the next person.
    </p>
  </div>
  ${footer()}
</body>
</html>`;

  await sendEmail({ to: opts.to, subject, text, html });
}

/**
 * Sent when an admin rejects a submission. Includes the rejection reason
 * verbatim (admin already saw + edited it) and a CTA to revise.
 */
export async function sendSubmissionRejectedEmail(opts: {
  to: string;
  name?: string | null;
  promptTitle: string;
  reason: string | null;
}): Promise<void> {
  const submitUrl = `${appUrl()}/submit`;
  const subject = `Update on your submission to ${SITE_BRAND.name}`;
  const reasonLine = (opts.reason ?? "").trim() ||
    "It didn't quite fit the catalog this time.";

  const text = `${greeting(opts.name)}

Thanks for submitting "${opts.promptTitle}" to ${SITE_BRAND.name}.

Unfortunately we couldn't add this one to the public catalog.

Reason: ${reasonLine}

You can revise and submit again any time:
${submitUrl}

— The ${SITE_BRAND.name} team`;

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>${subject}</title></head>
<body style="${baseStyle}">
  <div style="${cardStyle}">
    ${brandHeader()}

    <h1 style="font-size: 20px; font-weight: 600; margin: 0 0 12px 0; text-align: center;">
      Update on your submission
    </h1>

    <p style="color: ${COLOR_TEXT_MUTED}; font-size: 14px; line-height: 1.6; margin: 0 0 8px 0;">
      ${greeting(opts.name)}
    </p>
    <p style="color: ${COLOR_TEXT_MUTED}; font-size: 14px; line-height: 1.6; margin: 0 0 16px 0;">
      Thanks for submitting "<strong style="color: ${COLOR_TEXT};">${opts.promptTitle}</strong>" to ${SITE_BRAND.name}. Unfortunately we couldn't add this one to the public catalog.
    </p>

    <div style="background: rgba(255,255,255,0.04); border-left: 3px solid ${COLOR_PRIMARY}; padding: 12px 14px; border-radius: 6px; margin: 0 0 24px 0;">
      <p style="color: ${COLOR_TEXT_DIM}; font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; margin: 0 0 6px 0;">Reason</p>
      <p style="color: ${COLOR_TEXT}; font-size: 13px; line-height: 1.55; margin: 0;">${reasonLine}</p>
    </div>

    <div style="text-align: center; margin: 32px 0;">
      <a href="${submitUrl}" style="${buttonStyle}">Revise and resubmit</a>
    </div>

    <p style="color: ${COLOR_TEXT_DIM}; font-size: 12px; text-align: center; margin: 24px 0 0 0;">
      No hard feelings — quality bar protects everyone who copies from the catalog.
    </p>
  </div>
  ${footer()}
</body>
</html>`;

  await sendEmail({ to: opts.to, subject, text, html });
}

/**
 * Sent the first time a user is recognised on the site after signup.
 *
 * Includes the 3 most-copied prompts so the user has a one-click way to
 * experience the library's value within the first email.
 */
export async function sendWelcomeEmail(opts: {
  to: string;
  name?: string | null;
  starterPrompts: Array<{ title: string; slug: string; modelName: string }>;
}): Promise<void> {
  const url = appUrl();
  const subject = `Welcome to ${SITE_BRAND.name}`;

  const promptsText = opts.starterPrompts
    .map(
      (p, i) =>
        `${i + 1}. ${p.title} (${p.modelName}) — ${url}/prompt/${p.slug}`,
    )
    .join("\n");

  const text = `${greeting(opts.name)}

Welcome to ${SITE_BRAND.name} — the fastest way to find, copy, and paste AI prompts that actually work.

You don't need to "learn AI". You just need the right words. Here are 3 community favourites to try right now:

${promptsText}

Browse the full catalog: ${url}

Free forever. No paywall. Real prompts, by real creators.

— The ${SITE_BRAND.name} team`;

  const promptCards = opts.starterPrompts
    .map((p) => {
      const promptUrl = `${url}/prompt/${p.slug}`;
      return `<a href="${promptUrl}" style="display: block; background: rgba(255,255,255,0.03); border: 1px solid ${COLOR_BORDER}; border-radius: 8px; padding: 12px 14px; margin: 0 0 8px 0; text-decoration: none;">
        <div style="font-size: 11px; color: ${COLOR_TEXT_DIM}; text-transform: uppercase; letter-spacing: 0.06em; margin: 0 0 4px 0;">${p.modelName}</div>
        <div style="color: ${COLOR_TEXT}; font-size: 14px; font-weight: 600;">${p.title}</div>
        <div style="color: ${COLOR_PRIMARY}; font-size: 12px; margin-top: 6px;">Copy this prompt &rarr;</div>
      </a>`;
    })
    .join("");

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>${subject}</title></head>
<body style="${baseStyle}">
  <div style="${cardStyle}">
    ${brandHeader()}

    <h1 style="font-size: 22px; font-weight: 700; margin: 0 0 12px 0; text-align: center; letter-spacing: -0.02em;">
      Welcome aboard
    </h1>

    <p style="color: ${COLOR_TEXT_MUTED}; font-size: 14px; line-height: 1.6; margin: 0 0 8px 0;">
      ${greeting(opts.name)}
    </p>
    <p style="color: ${COLOR_TEXT_MUTED}; font-size: 14px; line-height: 1.6; margin: 0 0 24px 0;">
      You don't need to learn AI. You just need the right words. Here are three community favourites to try right now:
    </p>

    ${promptCards}

    <div style="text-align: center; margin: 32px 0 16px 0;">
      <a href="${url}" style="${buttonStyle}">Browse the catalog</a>
    </div>

    <p style="color: ${COLOR_TEXT_DIM}; font-size: 12px; text-align: center; margin: 24px 0 0 0;">
      Free forever. No paywall. Real prompts by real creators.
    </p>
  </div>
  ${footer()}
</body>
</html>`;

  await sendEmail({ to: opts.to, subject, text, html });
}

/**
 * Daily digest of new prompts matching the user's saved searches.
 *
 * `groups` is one block per saved search (label + up to 5 matches each).
 * The cron skips the send entirely when every group is empty.
 */
export async function sendSavedSearchDigestEmail(opts: {
  to: string;
  name?: string | null;
  groups: Array<{
    label: string;
    searchHref: string;
    matches: Array<{
      title: string;
      slug: string;
      modelName: string;
      modelType: "image" | "text";
      primaryImageUrl: string | null;
    }>;
  }>;
}): Promise<void> {
  const url = appUrl();
  const totalMatches = opts.groups.reduce(
    (n, g) => n + g.matches.length,
    0,
  );
  const subject =
    totalMatches === 1
      ? `1 new prompt matches your alert`
      : `${totalMatches} new prompts match your alerts`;

  const textGroups = opts.groups
    .map((g) => {
      const lines = g.matches
        .map((m) => `  • ${m.title} (${m.modelName}) — ${url}/prompt/${m.slug}`)
        .join("\n");
      return `${g.label}\n${lines}`;
    })
    .join("\n\n");

  const text = `${greeting(opts.name)}

Here's what's new in the catalog since your last digest:

${textGroups}

Manage your alerts: ${url}/account/searches

— The ${SITE_BRAND.name} team`;

  const htmlGroups = opts.groups
    .map((g) => {
      const cards = g.matches
        .map((m) => {
          const href = `${url}/prompt/${m.slug}`;
          return `<a href="${href}" style="display: block; background: rgba(255,255,255,0.03); border: 1px solid ${COLOR_BORDER}; border-radius: 8px; padding: 12px 14px; margin: 0 0 8px 0; text-decoration: none;">
        <div style="font-size: 11px; color: ${COLOR_TEXT_DIM}; text-transform: uppercase; letter-spacing: 0.06em; margin: 0 0 4px 0;">${m.modelName}</div>
        <div style="color: ${COLOR_TEXT}; font-size: 14px; font-weight: 600;">${m.title}</div>
        <div style="color: ${COLOR_PRIMARY}; font-size: 12px; margin-top: 6px;">Open prompt &rarr;</div>
      </a>`;
        })
        .join("");
      return `<div style="margin: 0 0 24px 0;">
      <a href="${g.searchHref.startsWith("http") ? g.searchHref : url + g.searchHref}" style="display: inline-block; color: ${COLOR_PRIMARY}; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; text-decoration: none; margin: 0 0 8px 0;">${g.label} &rarr;</a>
      ${cards}
    </div>`;
    })
    .join("");

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>${subject}</title></head>
<body style="${baseStyle}">
  <div style="${cardStyle}">
    ${brandHeader()}

    <h1 style="font-size: 20px; font-weight: 600; margin: 0 0 12px 0; text-align: center;">
      New prompts for you
    </h1>

    <p style="color: ${COLOR_TEXT_MUTED}; font-size: 14px; line-height: 1.6; margin: 0 0 8px 0;">
      ${greeting(opts.name)}
    </p>
    <p style="color: ${COLOR_TEXT_MUTED}; font-size: 14px; line-height: 1.6; margin: 0 0 24px 0;">
      Here&apos;s what&apos;s new in the catalog since your last digest.
    </p>

    ${htmlGroups}

    <div style="text-align: center; margin: 32px 0 16px 0;">
      <a href="${url}/account/searches" style="${buttonStyle}">Manage alerts</a>
    </div>

    <p style="color: ${COLOR_TEXT_DIM}; font-size: 12px; text-align: center; margin: 24px 0 0 0;">
      You&apos;re receiving this because you saved a search on ${SITE_BRAND.name}.
    </p>
  </div>
  ${footer()}
</body>
</html>`;

  await sendEmail({ to: opts.to, subject, text, html });
}

/**
 * Email sent when a user requests a password reset.
 */
export async function sendPasswordResetEmail(
  email: string,
  resetUrl: string,
): Promise<void> {
  const subject = `Reset your ${SITE_BRAND.name} password`;

  const text = `Someone requested a password reset for your ${SITE_BRAND.name} account.

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
      Someone requested a password reset for your ${SITE_BRAND.name} account. Click the button below to set a new password.
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
