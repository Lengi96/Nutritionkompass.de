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
  return process.env.EMAIL_FROM || "mein-nutrikompass.de <onboarding@resend.dev>";
}

function getAppUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}

// ── Shared Email Wrapper ──────────────────────────────────────────
function emailWrapper(content: string): string {
  return `<!DOCTYPE html>
<html lang="de">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#F8F9FA;font-family:Inter,system-ui,-apple-system,sans-serif;">
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
  return `<a href="${url}" style="display:inline-block;background-color:#2D6A4F;color:#FFFFFF;font-weight:600;font-size:15px;padding:12px 32px;border-radius:8px;text-decoration:none;">${text}</a>`;
}

// ── Verification Email (= Welcome Email) ──────────────────────────
function buildVerificationEmailHtml(name: string, verifyUrl: string): string {
  return emailWrapper(`
    <h2 style="margin:0 0 16px;font-size:20px;color:#1A1A2E;">
      Willkommen bei mein-nutrikompass.de, ${name}!
    </h2>
    <p style="margin:0 0 12px;font-size:15px;color:#374151;line-height:1.6;">
      Vielen Dank f&uuml;r Ihre Registrierung. Sie haben eine <strong>14-t&auml;gige kostenlose Testphase</strong> mit vollem Zugang zu allen Funktionen.
    </p>
    <p style="margin:0 0 24px;font-size:15px;color:#374151;line-height:1.6;">
      Bitte best&auml;tigen Sie Ihre E-Mail-Adresse, um Ihr Konto zu aktivieren:
    </p>
    <div style="text-align:center;margin:0 0 24px;">
      ${ctaButton(verifyUrl, "E-Mail best&auml;tigen")}
    </div>
    <p style="margin:0 0 8px;font-size:13px;color:#6B7280;">
      Oder kopieren Sie diesen Link in Ihren Browser:
    </p>
    <p style="margin:0 0 24px;font-size:13px;color:#2D6A4F;word-break:break-all;">
      ${verifyUrl}
    </p>
    <p style="margin:0;font-size:13px;color:#9CA3AF;">
      Falls Sie sich nicht bei mein-nutrikompass.de registriert haben, k&ouml;nnen Sie diese E-Mail ignorieren.
    </p>
  `);
}

// ── Password Reset Email ──────────────────────────────────────────
function buildPasswordResetEmailHtml(
  name: string,
  resetUrl: string
): string {
  return emailWrapper(`
    <h2 style="margin:0 0 16px;font-size:20px;color:#1A1A2E;">
      Passwort zur&uuml;cksetzen
    </h2>
    <p style="margin:0 0 12px;font-size:15px;color:#374151;line-height:1.6;">
      Hallo ${name}, wir haben eine Anfrage zum Zur&uuml;cksetzen Ihres Passworts erhalten.
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
      ${resetUrl}
    </p>
    <p style="margin:0 0 8px;font-size:13px;color:#EF4444;font-weight:600;">
      Dieser Link ist 1 Stunde g&uuml;ltig.
    </p>
    <p style="margin:0;font-size:13px;color:#9CA3AF;">
      Falls Sie diese Anfrage nicht gestellt haben, k&ouml;nnen Sie diese E-Mail ignorieren. Ihr Passwort bleibt unver&auml;ndert.
    </p>
  `);
}

// ── Public Email Functions ────────────────────────────────────────

export async function sendVerificationEmail(
  email: string,
  name: string,
  token: string
): Promise<void> {
  const verifyUrl = `${getAppUrl()}/verify-email/confirm?token=${token}`;

  if (process.env.NODE_ENV === "development" && !process.env.RESEND_API_KEY) {
    console.log("\n========================================");
    console.log("[DEV] Verifizierungs-Link für", email);
    console.log(verifyUrl);
    console.log("========================================\n");
    return;
  }

  const resend = getResendClient();
  await resend.emails.send({
    from: getFromAddress(),
    to: email,
    subject:
      "Willkommen bei mein-nutrikompass.de – Bitte bestätigen Sie Ihre E-Mail",
    html: buildVerificationEmailHtml(name, verifyUrl),
  });
}

export async function sendPasswordResetEmail(
  email: string,
  name: string,
  token: string
): Promise<void> {
  const resetUrl = `${getAppUrl()}/reset-password?token=${token}`;

  if (process.env.NODE_ENV === "development" && !process.env.RESEND_API_KEY) {
    console.log("\n========================================");
    console.log("[DEV] Passwort-Reset-Link für", email);
    console.log(resetUrl);
    console.log("========================================\n");
    return;
  }

  const resend = getResendClient();
  await resend.emails.send({
    from: getFromAddress(),
    to: email,
    subject: "mein-nutrikompass.de – Passwort zurücksetzen",
    html: buildPasswordResetEmailHtml(name, resetUrl),
  });
}

// ── Staff Invitation Email ────────────────────────────────────────

export async function sendStaffInvitationEmail(
  email: string,
  inviteeName: string,
  organizationName: string,
  inviterName: string,
  token: string
): Promise<void> {
  const inviteUrl = `${getAppUrl()}/invite?token=${token}`;

  if (process.env.NODE_ENV === "development" && !process.env.RESEND_API_KEY) {
    console.log("\n========================================");
    console.log("[DEV] Einladungs-Link für", email);
    console.log(inviteUrl);
    console.log("========================================\n");
    return;
  }

  const resend = getResendClient();
  await resend.emails.send({
    from: getFromAddress(),
    to: email,
    subject: `mein-nutrikompass.de – Einladung zu ${organizationName}`,
    html: buildStaffInvitationEmailHtml(
      inviteeName,
      organizationName,
      inviterName,
      inviteUrl
    ),
  });
}

function buildStaffInvitationEmailHtml(
  name: string,
  orgName: string,
  inviterName: string,
  inviteUrl: string
): string {
  return emailWrapper(`
    <h2 style="margin:0 0 16px;font-size:20px;color:#1A1A2E;">
      Einladung zu ${orgName}
    </h2>
    <p style="margin:0 0 12px;font-size:15px;color:#374151;line-height:1.6;">
      Hallo ${name}, <strong>${inviterName}</strong> hat Sie als Mitarbeiter zu <strong>${orgName}</strong> bei mein-nutrikompass.de eingeladen.
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
      ${inviteUrl}
    </p>
    <p style="margin:0 0 8px;font-size:13px;color:#EF4444;font-weight:600;">
      Diese Einladung ist 7 Tage g&uuml;ltig.
    </p>
    <p style="margin:0;font-size:13px;color:#9CA3AF;">
      Falls Sie diese Einladung nicht erwartet haben, k&ouml;nnen Sie diese E-Mail ignorieren.
    </p>
  `);
}
