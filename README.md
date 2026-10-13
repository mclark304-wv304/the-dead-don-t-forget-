# THE DEAD DON'T FORGET — Official Website

The series hub for Maya Clark's animated horror series. Episodes stream free
(via YouTube embeds); the **Bonus Store** sells early access and bonus content
through a real, server-verified Stripe paywall (pay per item).

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

## Go live with Stripe (take real payments)

1. **Create a Stripe account** at https://stripe.com (free; she'll connect her bank
   there to receive payouts).
2. In the Stripe dashboard, stay in **Test mode** first and go to Developers →
   API keys. Copy the **Secret key** (starts with `sk_test_`).
3. Open `config.js` and replace `"PASTE_YOUR_TEST_KEY_HERE"` with that key.
   (Or set the `STRIPE_SECRET_KEY` environment variable instead — better for hosting.)
4. Test a purchase: on the `/bonus` page click Unlock → pay with the test card
   `4242 4242 4242 4242`, any future expiry, any CVC. You should land on the
   unlocked content.
5. **Webhooks (recommended backup):** in the Stripe dashboard go to Developers →
   Webhooks → Add endpoint: `https://YOUR-DOMAIN/api/webhook`, listen for
   `checkout.session.completed`. Copy the **Signing secret** (starts with `whsec_`)
   into `config.js` as `stripeWebhookSecret`. This records purchases even if the
   buyer closes the tab before returning to the site.
6. **Go live:** in the Stripe dashboard toggle **off** Test mode, copy the
   **live** Secret key (starts with `sk_live_`) into `config.js` (or env var),
   and update the webhook endpoint to use the live signing secret.
7. Also change `jwtSecret` in `config.js` to a long random string (or set the
   `JWT_SECRET` env var), and set `BASE_URL` to the real domain
   (e.g. `https://thedeaddontforget.com`) so Stripe redirects work.

Until real keys are pasted in, the Unlock buttons show a clear message:
"Payments are not connected yet." Nothing charges by accident.

## Deploy on Render (free tier)

1. Push this folder to a GitHub repo (don't commit real keys — use env vars).
2. Go to https://dashboard.render.com → New → **Web Service** → connect the repo.
3. Build command: `npm install` — Start command: `npm start`
4. Under Environment, add:
   - `STRIPE_SECRET_KEY` = your live secret key
   - `STRIPE_WEBHOOK_SECRET` = your webhook signing secret
   - `JWT_SECRET` = a long random string
   - `BASE_URL` = your Render URL, e.g. `https://deaddontforget.onrender.com`
   - `NODE_ENV` = `production`
5. Deploy. Then add `https://YOUR-URL/api/webhook` as the webhook endpoint in Stripe.

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

- Clicking Unlock creates a **Stripe Checkout Session** on the server and sends
  the buyer to Stripe to pay. Card details never touch this site.
- After payment, Stripe redirects back; the server **re-verifies the session
  with the Stripe API** (the redirect alone is never trusted), records the
  purchase in `data/entitlements.db`, and sets a **signed, httpOnly cookie**.
- Gated pages (`/watch/ep4`, `/download/posters`) check that signed cookie
  **on the server** on every request. No video IDs or download links exist in
  any public page or JavaScript.
- A Stripe **webhook** records purchases as backup; buyers who lose their
  cookie can restore access with the email they paid with on `/bonus`.
- One honest limit: determined buyers *can* share the unlisted YouTube link or
  the zip. For this stage that's the standard indie-creator tradeoff — full
  DRM would need a paid video host (e.g. Vimeo OTT). The paywall stops casual
  access, which is what matters.
