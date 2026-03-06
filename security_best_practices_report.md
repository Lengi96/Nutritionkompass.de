# Security Review Report

Executive summary:
No critical remote-code-execution or obvious SQL injection issue was found in the reviewed application code. The main weaknesses are in web application hardening: unescaped HTML interpolation in outbound emails, non-expiring email verification tokens, and a production CSP that is weaker than intended. Known production dependencies currently report `0` vulnerabilities via `npm audit --omit=dev`.

## Medium Severity

### 1. Unescaped HTML in outbound email templates
- Rule ID: REACT-XSS-001 / NEXT-INPUT-001
- Severity: Medium
- Location: `src/trpc/routers/auth.ts:16-33`, `src/lib/email.ts:64-90`, `src/lib/email.ts:128-153`
- Evidence:
  - Registration accepts raw `organizationName` and `name` with only length checks, no HTML escaping or tag rejection.
  - Email templates interpolate `${name}`, `${orgName}`, and `${inviterName}` directly into HTML strings.
- Impact:
  - An attacker can store HTML markup in organization or user names and have that markup rendered in verification or invitation emails. In the invitation flow this reaches third-party recipients, which creates phishing/spoofing risk and unsafe HTML rendering in mail clients.
- Fix:
  - HTML-escape all user-controlled fields before inserting them into email HTML.
  - Add input validation to registration for `organizationName` and `name`, similar to the existing `[^<>]` restrictions already used elsewhere.
- Mitigation:
  - Keep plaintext email bodies aligned with the HTML version, but treat the HTML template as the primary sink that must be escaped.

### 2. Email verification links do not expire, and legacy plaintext token fallback is still accepted
- Rule ID: NEXT-AUTH-001
- Severity: Medium
- Location: `prisma/schema.prisma:87-93`, `src/trpc/routers/auth.ts:55-59`, `src/trpc/routers/auth.ts:112-145`
- Evidence:
  - `User` stores `emailVerificationToken` but has no matching expiry field, while reset tokens do have `resetTokenExpiresAt`.
  - `verifyEmail` accepts both hashed tokens and legacy plaintext tokens.
- Impact:
  - A stolen or long-forgotten verification link remains redeemable indefinitely until used. If any legacy plaintext tokens still exist in the database, a database disclosure gives attackers directly usable account-activation links.
- Fix:
  - Add `emailVerificationTokenExpiresAt` and reject expired verification links.
  - Remove the plaintext fallback after a one-time migration window or explicitly migrate old rows to hashed/expired state.
- Mitigation:
  - Rotate any outstanding verification tokens during rollout and reissue fresh links on demand.

### 3. Production CSP is materially weaker than intended
- Rule ID: NEXT-CSP-001
- Severity: Medium
- Location: `next.config.mjs:10-45`, `next.config.mjs:70-72`
- Evidence:
  - Production `script-src` includes `'unsafe-inline'`.
  - `connect-src` includes `https://o*.ingest.sentry.io`, which is not valid CSP source syntax and is ignored by the browser.
- Impact:
  - The current CSP provides limited protection against inline-script XSS. The invalid Sentry source also means the effective CSP is not the policy you appear to believe is deployed.
- Fix:
  - Remove `'unsafe-inline'` from `script-src` and move any required inline scripts to nonce/hash-based handling.
  - Replace the invalid Sentry source with valid host entries that match your actual ingest endpoints.
- Mitigation:
  - Start with report-only CSP changes in staging if needed, but keep the goal of an enforceable non-inline script policy.

## Low Severity

### 4. Cookie-authenticated mutation endpoints have no visible explicit CSRF validation in app code
- Rule ID: NEXT-CSRF-001
- Severity: Low
- Location: `src/app/api/trpc/[trpc]/route.ts:5-13`, `src/trpc/init.ts:7-13`, `src/app/api/chat/route.ts:56-89`, `src/app/api/agent/plan/route.ts:174-197`
- Evidence:
  - Protected endpoints authenticate by session only and no app-level Origin/Referer/CSRF token validation is visible in the reviewed code.
  - tRPC client calls the same-origin cookie-authenticated endpoint `/api/trpc`.
- Impact:
  - The application appears to rely on framework/browser defaults such as SameSite cookies rather than an explicit CSRF control. That is better than nothing, but fragile if cookie settings or deployment topology change.
- Fix:
  - Add explicit Origin checks or CSRF tokens for state-changing cookie-authenticated endpoints.
  - At minimum, document and test the intended SameSite cookie posture for NextAuth in production.
- False positive notes:
  - This may be partially mitigated by NextAuth default cookie settings and browser SameSite behavior, but that protection is not explicit in the reviewed app code.

## Positive observations

- Multi-tenant object access checks are present across the reviewed patient, meal plan, shopping list, autonomy, FHIR, staff, and organization routers.
- Passwords are hashed with bcrypt, reset and invitation tokens are stored hashed, and reset/invitation flows are time-bounded.
- Stripe webhook signature verification uses the raw request body correctly.
- `npm audit --omit=dev` reported `found 0 vulnerabilities`.

## Recommended next steps

1. Fix the HTML email interpolation issue first.
2. Add expiry to email verification tokens and remove plaintext fallback.
3. Tighten CSP in production.
4. Decide whether you want explicit CSRF protection now or to document/test the current SameSite-based posture.
