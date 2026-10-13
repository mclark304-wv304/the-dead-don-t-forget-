# THE DEAD DON'T FORGET — Official Website

The series hub for Maya Clark's animated horror series. Episodes stream free
(via YouTube embeds); the **Bonus Store** sells early access and bonus content
through a real, server-verified PayPal paywall (pay per item).

## Run locally

```bash
cd dead-dont-forget-site
npm install
npm start
```

Then open http://localhost:3000

- `/` — home with hero, latest episode, episode cards, store preview, Pocket FM link
- `/episodes` — all 3 episodes embedded + teaser Shorts
- `/bonus` — the store (Unlock buttons, restore-access form)
- `/watch/ep4` — gated: Episode 4 early access (buyers only)
- `/download/posters` — gated: poster pack zip download (buyers only)

## Go live with PayPal (take real payments)

1. **Log into PayPal** at https://www.paypal.com (or create a free account;
   connect your bank there to receive payouts).
2. Go to https://developer.paypal.com → **Apps & Credentials**. Stay in
   **Sandbox** mode first and **Create App** (name it e.g. "Dead Dont Forget").
   Copy the **Client ID** and the **Secret**.
3. Set them as environment variables on your host (Render dashboard → your
   service → Environment):
   - `PAYPAL_CLIENT_ID` = your sandbox Client ID
   - `PAYPAL_CLIENT_SECRET` = your sandbox Secret
   - `PAYPAL_MODE` = `sandbox`
   (Or put them in `config.js` — env vars are better for hosting.)
4. Test a purchase: on the `/bonus` page click Unlock → pay with a PayPal
   **sandbox buyer account** (create one at developer.paypal.com → Testing
   Tools → Sandbox Accounts). You should land on the unlocked content.
5. **Go live:** in Apps & Credentials toggle to **Live**, create a Live app,
   and swap the env vars to the live Client ID and Secret, with
   `PAYPAL_MODE` = `live`.
6. Also change `jwtSecret` in `config.js` to a long random string (or set the
   `JWT_SECRET` env var), and set `BASE_URL` to the real domain
   (e.g. `https://thedeaddontforget.com`) so PayPal return URLs work.

Until real keys are pasted in, the Unlock buttons show a clear message:
"Payments are not connected yet." Nothing charges by accident.

**Webhooks (optional backup):** the app exposes `/api/paypal-webhook`, which
currently just logs events. The capture-on-return flow below already verifies
every payment server-side, so webhooks are not required. If you add one later
in the PayPal dashboard, note that signature verification is a documented
TODO in `server.js`.

## Deploy on Render (free tier)

1. Push this folder to a GitHub repo (don't commit real keys — use env vars).
2. Go to https://dashboard.render.com → New → **Web Service** → connect the repo.
3. Build command: `npm install` — Start command: `npm start`
4. Under Environment, add:
   - `PAYPAL_CLIENT_ID` = your PayPal Client ID (sandbox first, live later)
   - `PAYPAL_CLIENT_SECRET` = your PayPal Secret
   - `PAYPAL_MODE` = `sandbox` (change to `live` when going live)
   - `JWT_SECRET` = a long random string
   - `BASE_URL` = your Render URL, e.g. `https://deaddontforget.onrender.com`
   - `NODE_ENV` = `production`
5. Deploy.

Same idea works on Railway (railway.app): New Project → deploy from repo,
add the same env vars, done.

## Add Episode 4's video when it's ready

In `config.js`, set:

```js
ep4VideoId: "PASTE_THE_YOUTUBE_VIDEO_ID_HERE",
```

That's it — every early-access buyer instantly sees the premiere on `/watch/ep4`.
(Upload Ep4 to YouTube as **Unlisted** so only your site's buyers can watch it.)

## Change prices

In `config.js`, under `products`, edit `priceCents` (in cents — `299` = $2.99):

```js
"ep4-early":   { ..., priceCents: 299 },  // Episode 4 Early Access
"poster-pack": { ..., priceCents: 199 },  // Official Poster Pack
```

Restart the server after editing.

## Add a new product later

1. Add an entry to `products` in `config.js` with a unique id, name, tagline,
   `priceCents`, `entitlement` string, and `deliveryPath`.
2. Add a gated route in `server.js` using `requireEntitlement("your-entitlement")`.
3. It appears in the store automatically.

## How the paywall works (the honest version)

- Clicking Unlock asks the server to create a **PayPal order** (Orders API v2,
  intent CAPTURE) and sends the buyer to PayPal to approve it. Card and PayPal
  details never touch this site.
- PayPal returns the buyer to `/paypal/return`; the server **captures the
  order via the PayPal API** and only grants access when the capture status is
  COMPLETED (the redirect alone is never trusted). It then records the
  purchase in `data/entitlements.db` and sets a **signed, httpOnly cookie**.
- Gated pages (`/watch/ep4`, `/download/posters`) check that signed cookie
  **on the server** on every request. No video IDs or download links exist in
  any public page or JavaScript.
- Buyers who lose their cookie can restore access with the PayPal email they
  paid with on `/bonus`.
- One honest limit: determined buyers *can* share the unlisted YouTube link or
  the zip. For this stage that's the standard indie-creator tradeoff — full
  DRM would need a paid video host (e.g. Vimeo OTT). The paywall stops casual
  access, which is what matters.
