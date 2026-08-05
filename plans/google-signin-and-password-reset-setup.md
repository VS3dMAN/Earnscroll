# Google Sign-In & Password Reset — setup guide

Everything in the app code is already done. What is left is account/dashboard
configuration that can only be done by you, because it needs a Google Cloud
account, a Supabase dashboard login, and an email provider signup.

**Project ref:** `zurahjqghjratswjjpsg`
**Supabase URL:** `https://zurahjqghjratswjjpsg.supabase.co`
**App scheme:** `earnscroll` (was `myapp` — changed, see step G4)

Work through Part A, then Part B. Each ends with a command you can paste to
prove it worked.

---

# PART A — Google Sign-In

## Why it doesn't work today

```
GET https://zurahjqghjratswjjpsg.supabase.co/auth/v1/settings
  -> "google": false
```

Tapping the Google button returns:

```json
{"code":400,"error_code":"validation_failed",
 "msg":"Unsupported provider: provider is not enabled"}
```

Nothing is broken in the app. The provider has simply never been turned on.

## How the flow actually works

Worth understanding before you start, because it explains why you only need
**one** Google client and not one per platform:

```
App  ──1─▶ opens browser to Supabase /authorize?provider=google
Supabase ──2─▶ redirects to Google's consent screen
Google   ──3─▶ redirects to  https://<project>.supabase.co/auth/v1/callback
Supabase ──4─▶ redirects to  earnscroll://auth/callback?code=...
App      ──5─▶ exchanges that code for a session (PKCE)
```

Google only ever talks to **Supabase**, never to your app directly. So Google
needs Supabase's callback URL (step 3), and Supabase needs your app's scheme
(step 4). Those are two different settings in two different places — mixing
them up is the usual reason this fails.

---

## Step G1 — Create the Google OAuth client

1. Go to <https://console.cloud.google.com/>
2. Create a project (or pick an existing one). Name it e.g. `EarnScroll`.
3. **APIs & Services → OAuth consent screen**
   - User type: **External**
   - App name: `EarnScroll`
   - User support email: your email
   - Developer contact email: your email
   - Scopes: the defaults (`email`, `profile`, `openid`) are all you need —
     do not add anything else or you trigger Google's verification review.
   - Save.
   - While in **Testing** mode only accounts you add under "Test users" can
     sign in. Add your own account now; click **Publish app** before release.
4. **APIs & Services → Credentials → Create Credentials → OAuth client ID**
   - Application type: **Web application** ← this is the important bit.
     Not "Android", not "iOS". Supabase performs the exchange server-side and
     needs a client *secret*, which the Android/iOS client types do not issue.
   - Name: `EarnScroll Supabase`
   - **Authorized redirect URIs** → Add URI:

     ```
     https://zurahjqghjratswjjpsg.supabase.co/auth/v1/callback
     ```

     Exactly that. No trailing slash. This is Supabase's callback, *not* your
     app scheme.
   - Create, then copy the **Client ID** and **Client Secret**.

> If you later add "Sign in with Google" to the marketing website, add that
> site's origin to **Authorized JavaScript origins** on this same client.

## Step G2 — Enable the provider in Supabase

1. <https://supabase.com/dashboard/project/zurahjqghjratswjjpsg/auth/providers>
2. Find **Google** → toggle **Enable Sign in with Google**
3. Paste the **Client ID** and **Client Secret** from step G1
4. Leave "Skip nonce check" off
5. Save

## Step G3 — Allowlist the app's redirect URL

This is the step people skip, and it fails with a confusing
`redirect_to is not allowed` *after* the user has already picked their Google
account — so it looks like Google's fault when it isn't.

1. <https://supabase.com/dashboard/project/zurahjqghjratswjjpsg/auth/url-configuration>
2. Under **Redirect URLs**, add:

   ```
   earnscroll://auth/callback
   ```

3. If you want to keep testing in a dev client over LAN, also add:

   ```
   exp+earnscroll-screen-time-gym://auth/callback
   ```

4. Save.

## Step G4 — Rebuild the native app

The URL scheme changed from `myapp` to `earnscroll`. That lives in the Android
manifest and iOS Info.plist, so **it is not an over-the-air change** — an
existing installed build will not pick it up.

```bash
npx expo prebuild --clean
npx expo run:android          # or: eas build --profile development --platform android
```

Why it changed: `myapp` is the scheme in Expo's default template, so any other
developer-built Expo app on the same device also claims it. Android then shows
an app-picker — or silently routes your OAuth redirect into someone else's app.

## Step G5 — Verify

Provider is on when this prints `"google": true`:

```bash
curl -s https://zurahjqghjratswjjpsg.supabase.co/auth/v1/settings \
  -H "apikey: <your anon key>" | grep -o '"google":[a-z]*'
```

Then in the app: tap **Google** on the login screen. Expected behaviour —
browser opens, account chooser appears (the app requests
`prompt=select_account`, so it always asks rather than silently reusing the
last account), you pick an account, the browser closes itself, and you land in
the app signed in.

Confirm the identity was recorded:

```sql
select u.email, i.provider
from auth.users u join auth.identities i on i.user_id = u.id;
```

## Google troubleshooting

| Symptom | Cause |
|---|---|
| `Unsupported provider: provider is not enabled` | Step G2 not saved |
| `redirect_to is not allowed` | Step G3 — URL missing from the allowlist |
| Google shows `redirect_uri_mismatch` | Step G1 — the Supabase `/auth/v1/callback` URI is wrong or missing |
| Browser opens, completes, but app never returns | Step G4 — old build, still registered for `myapp` |
| `Error 403: access_denied` | Consent screen still in Testing and your account isn't a listed test user |
| Returns to app but no session | Redirect URL allowlisted with a typo, so the `code` never arrives |

---

# PART B — Password Reset

## What was broken, and what I already fixed

Two separate problems. **The code half is done; the email half is not.**

Already fixed in code:

- There was **no screen to actually set a new password**. The reset link
  produced a valid session and the auth guard walked the user straight into the
  app without ever asking for a new password. Added
  `app/(auth)/reset-password.tsx`, plus `updatePassword()` and an
  `isPasswordRecovery` flag that pins the user to that screen until they finish.
- **Nothing handled links opened from outside the app.** Tapping the link in a
  mail app did nothing at all. Added a `Linking` listener covering both cold
  start and warm start.
- The redirect now uses PKCE and is parsed from both the query string and the
  URL fragment.

Still needs you: **the email itself.**

## The remaining problem: default SMTP

Supabase's built-in mailer is a shared development service. It:

- **only delivers to members of your Supabase organisation**
- is rate-limited to a handful of messages per hour
- is not intended for production and can be throttled without notice

So `resetPasswordForEmail()` returns `200 OK` and your real users receive
nothing. The API call genuinely succeeded — the message was just never
delivered. That is why this looks so confusing from the app side.

You must connect your own SMTP provider.

## Step P1 — Pick a provider

| Provider | Free tier | Notes |
|---|---|---|
| **Resend** | 3,000/mo | Simplest setup, good docs — recommended |
| Brevo | 300/day | No card required |
| Mailgun | trial only | |
| AWS SES | 62k/mo from EC2 | Cheapest at scale, fiddliest setup |

Below assumes Resend; the shape is identical for the others.

## Step P2 — Verify a sending domain

You need a domain you control. Sending as `@gmail.com` will not work —
Gmail's DMARC policy makes receivers reject it.

1. <https://resend.com> → sign up → **Domains → Add Domain**
2. Enter your domain, e.g. `earnscroll.app`
3. Resend gives you DNS records — add all of them at your registrar:
   - `SPF` (TXT)
   - `DKIM` (CNAME or TXT)
   - `DMARC` (TXT) — start with `v=DMARC1; p=none;`
4. Wait for verification (minutes to a few hours)
5. **API Keys → Create API Key**, copy it

Skipping DKIM/SPF means your reset emails land in spam, which is
indistinguishable from "password reset is broken" for your users.

## Step P3 — Point Supabase at it

1. <https://supabase.com/dashboard/project/zurahjqghjratswjjpsg/settings/auth>
2. **SMTP Settings → Enable Custom SMTP**

   | Field | Value |
   |---|---|
   | Sender email | `noreply@earnscroll.app` |
   | Sender name | `EarnScroll` |
   | Host | `smtp.resend.com` |
   | Port | `465` |
   | Username | `resend` |
   | Password | your Resend API key |

3. Save.
4. Raise **Rate Limits → Emails per hour** above the default `2`. Something
   like 100/hour is sane to start.

## Step P4 — Fix the email template

The default template links to a web URL, which will not open your app. It must
carry the app's redirect.

1. <https://supabase.com/dashboard/project/zurahjqghjratswjjpsg/auth/templates>
2. Select **Reset Password**
3. Make sure the link uses `{{ .ConfirmationURL }}`:

```html
<h2>Reset your EarnScroll password</h2>
<p>Tap the button below to choose a new password. This link expires in 1 hour.</p>
<p><a href="{{ .ConfirmationURL }}">Reset password</a></p>
<p>If you didn't request this, you can safely ignore this email.</p>
```

`{{ .ConfirmationURL }}` expands to a Supabase verify URL that, once used,
redirects to whatever the app passed as `redirectTo` — which is
`earnscroll://auth/callback`. That is why step G3 matters here too.

## Step P5 — Allowlist the redirect

Same list as step G3. If you already did G3, this is done —
`earnscroll://auth/callback` covers OAuth, email confirmation and password
recovery alike.

## Step P6 — Verify

```bash
curl -s -X POST https://zurahjqghjratswjjpsg.supabase.co/auth/v1/recover \
  -H "apikey: <your anon key>" -H "Content-Type: application/json" \
  -d '{"email":"you@yourdomain.com"}' -w "\nHTTP %{http_code}\n"
```

`200` plus `{}` means accepted. Now check the inbox — that is the part that was
silently failing before.

Then end to end, on a device:

1. Login screen → **Forgot Password?** → enter your email → **Send Reset Link**
2. Open the email **on the device** and tap the link
3. The app opens directly on **Set a new password**
4. Enter a new password twice → **Update Password**
5. You land in the app, signed in
6. Sign out and sign back in with the new password

### One PKCE caveat worth knowing

The reset link must be opened **on the same device that requested it**. PKCE
stores a code verifier locally when you tap "Send Reset Link", and the link is
worthless without it. Requesting the reset on your phone and opening the mail
on your laptop will fail with an invalid-code error. This is a deliberate
security property, not a bug — but it is worth wording the UI around if you
ever get support tickets about it.

## Password reset troubleshooting

| Symptom | Cause |
|---|---|
| `200` but no email arrives | Step P3 — still on default SMTP, which only mails org members |
| Email lands in spam | Step P2 — SPF/DKIM/DMARC not verified |
| `over_request_rate_limit` | Step P3 — hourly email limit still at the default 2 |
| Link opens a browser, not the app | Step P4 template not using `{{ .ConfirmationURL }}`, or old build (step G4) |
| `redirect_to is not allowed` | Step G3/P5 |
| Invalid/expired code on a valid link | Link opened on a different device (see caveat), or link already used once |
| `email_address_invalid` | Supabase rejects domains with no MX record — real addresses are fine |

---

# Verified already working

Tested directly against the live project on 2026-08-05, with all test users
removed afterwards:

signup · login · wrong-password rejection · duplicate-signup rejection ·
profile trigger · RLS scoping · session refresh · password-reset endpoint ·
account deletion · post-deletion token invalidation

# Final checklist

- [ ] G1 Google Cloud OAuth **Web** client, redirect `.../auth/v1/callback`
- [ ] G2 Provider enabled in Supabase with Client ID + Secret
- [ ] G3 `earnscroll://auth/callback` in Redirect URLs
- [ ] G4 `npx expo prebuild --clean` + fresh native build
- [ ] G5 `/settings` reports `"google": true`
- [ ] P1–P2 SMTP provider with a verified domain (SPF/DKIM/DMARC)
- [ ] P3 Custom SMTP saved, hourly email limit raised
- [ ] P4 Reset template uses `{{ .ConfirmationURL }}`
- [ ] P6 Full reset round-trip on a real device
- [ ] Publish the Google consent screen before release (else test users only)
- [ ] Enable leaked-password protection (Auth → Policies)
