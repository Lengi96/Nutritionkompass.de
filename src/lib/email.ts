import { Resend } from "resend";

let resendClient: Resend | null = null;

function getResendClient(): Resend {
  if (resendClient) return resendClient;

  const key = process.env.RESEND_API_KEY;
  if (!key) {
    throw new Error(
      "RESEND_API_KEY ist nicht konfiguriert. Bitte in .env eintragen."
    );
  }

  resendClient = new Resend(key);
  return resendClient;
}

function getFromAddress(): string {
  return process.env.EMAIL_FROM || "mein-nutrikompass.de <noreply@mein-nutrikompass.de>";
}

function getReplyToAddress(): string | undefined {
  return process.env.EMAIL_REPLY_TO || undefined;
}

function getAppUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function emailWrapper(preheader: string, content: string): string {
  return `<!DOCTYPE html>
<html lang="de">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#F8F9FA;font-family:Inter,system-ui,-apple-system,sans-serif;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">
    ${escapeHtml(preheader)}
  </div>
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#F8F9FA;padding:40px 20px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background-color:#FFFFFF;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
        <tr><td style="background-color:#2D6A4F;padding:24px;text-align:center;">
          <span style="color:#FFFFFF;font-size:22px;font-weight:700;">mein-nutrikompass.de</span>
        </td></tr>
        <tr><td style="padding:32px 28px;">
          ${content}
        </td></tr>
        <tr><td style="padding:20px 28px;border-top:1px solid #E5E7EB;text-align:center;">
          <p style="margin:0;font-size:12px;color:#6B7280;">
            &copy; ${new Date().getFullYear()} mein-nutrikompass.de. Alle Rechte vorbehalten.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function ctaButton(url: string, text: string): string {
  return `<a href="${escapeHtml(url)}" style="display:inline-block;background-color:#2D6A4F;color:#FFFFFF;font-weight:600;font-size:15px;padding:12px 32px;border-radius:8px;text-decoration:none;">${escapeHtml(text)}</a>`;
}

function buildVerificationEmailHtml(name: string, verifyUrl: string): string {
  const safeName = escapeHtml(name);
  const safeVerifyUrl = escapeHtml(verifyUrl);

  return emailWrapper("Bitte bestaetigen Sie Ihre E-Mail-Adresse fuer Ihr Konto bei mein-nutrikompass.de.", `
    <h2 style="margin:0 0 16px;font-size:20px;color:#1A1A2E;">
      E-Mail-Adresse bestaetigen
    </h2>
    <p style="margin:0 0 12px;font-size:15px;color:#374151;line-height:1.6;">
      Hallo ${safeName},
    </p>
    <p style="margin:0 0 12px;font-size:15px;color:#374151;line-height:1.6;">
      fuer Ihr Konto bei <strong>mein-nutrikompass.de</strong> wurde diese E-Mail-Adresse hinterlegt. Bitte bestaetigen Sie die Adresse, um die Registrierung abzuschliessen.
    </p>
    <p style="margin:0 0 24px;font-size:15px;color:#374151;line-height:1.6;">
      Nutzen Sie dazu bitte den folgenden Link:
    </p>
    <div style="text-align:center;margin:0 0 24px;">
      ${ctaButton(verifyUrl, "E-Mail-Adresse bestaetigen")}
    </div>
    <p style="margin:0 0 8px;font-size:13px;color:#6B7280;">
      Falls der Button nicht funktioniert, koennen Sie diesen Link in Ihren Browser kopieren:
    </p>
    <p style="margin:0 0 24px;font-size:13px;color:#2D6A4F;word-break:break-all;">
      ${safeVerifyUrl}
    </p>
    <p style="margin:0;font-size:13px;color:#9CA3AF;">
      Wenn Sie die Registrierung nicht selbst gestartet haben, koennen Sie diese E-Mail ignorieren.
    </p>
  `);
}

function buildPasswordResetEmailHtml(name: string, resetUrl: string): string {
  const safeName = escapeHtml(name);
  const safeResetUrl = escapeHtml(resetUrl);

  return emailWrapper("Setzen Sie jetzt Ihr Passwort fuer mein-nutrikompass.de zurueck.", `
    <h2 style="margin:0 0 16px;font-size:20px;color:#1A1A2E;">
      Passwort zuruecksetzen
    </h2>
    <p style="margin:0 0 12px;font-size:15px;color:#374151;line-height:1.6;">
      Hallo ${safeName}, wir haben eine Anfrage zum Zuruecksetzen Ihres Passworts erhalten.
    </p>
    <p style="margin:0 0 24px;font-size:15px;color:#374151;line-height:1.6;">
      Klicken Sie auf den folgenden Button, um ein neues Passwort zu setzen:
    </p>
    <div style="text-align:center;margin:0 0 24px;">
      ${ctaButton(resetUrl, "Neues Passwort setzen")}
    </div>
    <p style="margin:0 0 8px;font-size:13px;color:#6B7280;">
      Oder kopieren Sie diesen Link in Ihren Browser:
    </p>
    <p style="margin:0 0 24px;font-size:13px;color:#2D6A4F;word-break:break-all;">
      ${safeResetUrl}
    </p>
    <p style="margin:0 0 8px;font-size:13px;color:#EF4444;font-weight:600;">
      Dieser Link ist 1 Stunde gueltig.
    </p>
    <p style="margin:0;font-size:13px;color:#9CA3AF;">
      Falls Sie diese Anfrage nicht gestellt haben, koennen Sie diese E-Mail ignorieren. Ihr Passwort bleibt unveraendert.
    </p>
  `);
}

function buildStaffInvitationEmailHtml(
  name: string,
  orgName: string,
  inviterName: string,
  inviteUrl: string
): string {
  const safeName = escapeHtml(name);
  const safeOrgName = escapeHtml(orgName);
  const safeInviterName = escapeHtml(inviterName);
  const safeInviteUrl = escapeHtml(inviteUrl);

  return emailWrapper(`Einladung zu ${orgName} auf mein-nutrikompass.de.`, `
    <h2 style="margin:0 0 16px;font-size:20px;color:#1A1A2E;">
      Einladung zu ${safeOrgName}
    </h2>
    <p style="margin:0 0 12px;font-size:15px;color:#374151;line-height:1.6;">
      Hallo ${safeName}, <strong>${safeInviterName}</strong> hat Sie als Mitarbeiter zu <strong>${safeOrgName}</strong> bei mein-nutrikompass.de eingeladen.
    </p>
    <p style="margin:0 0 24px;font-size:15px;color:#374151;line-height:1.6;">
      Klicken Sie auf den folgenden Button, um die Einladung anzunehmen und Ihr Passwort zu setzen:
    </p>
    <div style="text-align:center;margin:0 0 24px;">
      ${ctaButton(inviteUrl, "Einladung annehmen")}
    </div>
    <p style="margin:0 0 8px;font-size:13px;color:#6B7280;">
      Oder kopieren Sie diesen Link in Ihren Browser:
    </p>
    <p style="margin:0 0 24px;font-size:13px;color:#2D6A4F;word-break:break-all;">
      ${safeInviteUrl}
    </p>
    <p style="margin:0 0 8px;font-size:13px;color:#EF4444;font-weight:600;">
      Diese Einladung ist 7 Tage gueltig.
    </p>
    <p style="margin:0;font-size:13px;color:#9CA3AF;">
      Falls Sie diese Einladung nicht erwartet haben, koennen Sie diese E-Mail ignorieren.
    </p>
  `);
}

function buildVerificationEmailText(name: string, verifyUrl: string): string {
  return [
    `Hallo ${name},`,
    "",
    "fuer Ihr Konto bei mein-nutrikompass.de wurde diese E-Mail-Adresse hinterlegt.",
    "Bitte bestaetigen Sie die Adresse ueber den folgenden Link, um die Registrierung abzuschliessen:",
    verifyUrl,
    "",
    "Wenn Sie die Registrierung nicht selbst gestartet haben, koennen Sie diese E-Mail ignorieren.",
  ].join("\n");
}

function buildPasswordResetEmailText(name: string, resetUrl: string): string {
  return [
    `Hallo ${name},`,
    "",
    "wir haben eine Anfrage zum Zuruecksetzen Ihres Passworts erhalten.",
    "Nutzen Sie dafuer diesen Link:",
    resetUrl,
    "",
    "Der Link ist 1 Stunde gueltig.",
    "Falls die Anfrage nicht von Ihnen stammt, ignorieren Sie diese Nachricht.",
  ].join("\n");
}

function buildStaffInvitationEmailText(
  name: string,
  orgName: string,
  inviterName: string,
  inviteUrl: string
): string {
  return [
    `Hallo ${name},`,
    "",
    `${inviterName} hat Sie zu ${orgName} auf mein-nutrikompass.de eingeladen.`,
    "Einladung annehmen:",
    inviteUrl,
    "",
    "Die Einladung ist 7 Tage gueltig.",
    "Falls Sie diese Einladung nicht erwartet haben, ignorieren Sie diese Nachricht.",
  ].join("\n");
}

export async function sendVerificationEmail(
  email: string,
  name: string,
  token: string
): Promise<void> {
  const verifyUrl = `${getAppUrl()}/verify-email/confirm?token=${token}`;

  if (process.env.NODE_ENV === "development" && !process.env.RESEND_API_KEY) {
    const maskedEmail = email.replace(/(.{2}).+(@.+)/, "$1***$2");
    const tokenPrefix = token.substring(0, 8);
    console.log("\n========================================");
    console.log("[DEV] Verifizierungs-Link fuer", maskedEmail);
    console.log(`[DEV] Token-Prefix: ${tokenPrefix}... (vollstaendig nur in DB)`);
    console.log("========================================\n");
    return;
  }

  const resend = getResendClient();
  await resend.emails.send({
    from: getFromAddress(),
    to: email,
    replyTo: getReplyToAddress(),
    subject: "Bitte bestaetigen Sie Ihre E-Mail-Adresse",
    html: buildVerificationEmailHtml(name, verifyUrl),
    text: buildVerificationEmailText(name, verifyUrl),
  });
}

export async function sendPasswordResetEmail(
  email: string,
  name: string,
  token: string
): Promise<void> {
  const resetUrl = `${getAppUrl()}/reset-password?token=${token}`;

  if (process.env.NODE_ENV === "development" && !process.env.RESEND_API_KEY) {
    const maskedEmail = email.replace(/(.{2}).+(@.+)/, "$1***$2");
    const tokenPrefix = token.substring(0, 8);
    console.log("\n========================================");
    console.log("[DEV] Passwort-Reset-Link fuer", maskedEmail);
    console.log(`[DEV] Token-Prefix: ${tokenPrefix}... (vollstaendig nur in DB)`);
    console.log("========================================\n");
    return;
  }

  const resend = getResendClient();
  await resend.emails.send({
    from: getFromAddress(),
    to: email,
    replyTo: getReplyToAddress(),
    subject: "mein-nutrikompass.de - Passwort zuruecksetzen",
    html: buildPasswordResetEmailHtml(name, resetUrl),
    text: buildPasswordResetEmailText(name, resetUrl),
  });
}

export async function sendStaffInvitationEmail(
  email: string,
  inviteeName: string,
  organizationName: string,
  inviterName: string,
  token: string
): Promise<void> {
  const inviteUrl = `${getAppUrl()}/invite?token=${token}`;

  if (process.env.NODE_ENV === "development" && !process.env.RESEND_API_KEY) {
    const maskedEmail = email.replace(/(.{2}).+(@.+)/, "$1***$2");
    const tokenPrefix = token.substring(0, 8);
    console.log("\n========================================");
    console.log("[DEV] Einladungs-Link fuer", maskedEmail);
    console.log(`[DEV] Token-Prefix: ${tokenPrefix}... (vollstaendig nur in DB)`);
    console.log("========================================\n");
    return;
  }

  const resend = getResendClient();
  await resend.emails.send({
    from: getFromAddress(),
    to: email,
    replyTo: getReplyToAddress(),
    subject: `mein-nutrikompass.de - Einladung zu ${organizationName}`,
    html: buildStaffInvitationEmailHtml(
      inviteeName,
      organizationName,
      inviterName,
      inviteUrl
    ),
    text: buildStaffInvitationEmailText(
      inviteeName,
      organizationName,
      inviterName,
      inviteUrl
    ),
  });
}
