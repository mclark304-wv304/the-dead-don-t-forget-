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
- `/watch/ep5` — gated: Episode 5 early access (buyers only)
- `/watch/ep6` — gated: Episode 6 early access (buyers only)
- `/watch/ep7` — gated: Episode 7 early access (buyers only)
- `/watch/ep8` — gated: Episode 8 early access (buyers only)
- `/watch/ep9` — gated: Episode 9 early access (buyers only)
- `/download/posters` — gated: poster pack zip download (buyers only)
- `/download/scripts` — gated: Complete Scripts PDF download (buyers only)
- `/download/character-art` — gated: character art pack zip download (buyers only)
- `/free/ep1-script`, `/free/wallpaper`, `/free/poster` — free downloads (no payment, no login)

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

## Go live with Stripe (take card payments)

1. **Log into Stripe** at https://dashboard.stripe.com (or create a free
   account; connect your bank there to receive payouts).
2. Go to **Developers → API keys**. Stay in **test mode** first and copy the
   **Publishable key** (`pk_test_...`) and the **Secret key** (`sk_test_...`).
3. Set them as environment variables on your host (Render dashboard → your
   service → Environment):
   - `STRIPE_PUBLISHABLE_KEY` = your publishable key
   - `STRIPE_SECRET_KEY` = your secret key
   (Or put them in `config.js` — env vars are better for hosting.)
4. The "Card" buttons on `/bonus` and the "Donate with card" buttons appear
   automatically once the secret key is set. Test a purchase with a Stripe
   test card (e.g. `4242 4242 4242 4242`, any future expiry, any CVC).
   You should land on the unlocked content.
5. **Go live:** in the Stripe dashboard toggle off test mode, copy the live
   keys (`pk_live_...`, `sk_live_...`), and swap the env vars.

Until the Stripe secret key is set, the card buttons stay hidden and PayPal
keeps working alone — nothing breaks. No webhooks needed: every Stripe
payment is verified server-side on the return URL before access is granted
(session `payment_status` must be `paid`, and the session's metadata must
match the purchased product). Card data never touches this server.

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
   - `STRIPE_SECRET_KEY` = your Stripe secret key (adds "Card" buttons alongside PayPal)
   - `STRIPE_PUBLISHABLE_KEY` = your Stripe publishable key
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

## Add Episode 5's video when it's ready

In `config.js`, set:

```js
ep5VideoId: "PASTE_THE_YOUTUBE_VIDEO_ID_HERE",
```

That's it — every early-access buyer instantly sees the premiere on `/watch/ep5`.
(Upload Ep5 to YouTube as **Unlisted** so only your site's buyers can watch it.)

## Change prices

In `config.js`, under `products`, edit `priceCents` (in cents — `299` = $2.99):

```js
"ep4-early":        { ..., priceCents: 299 },  // Episode 4 Early Access
"ep5-early":        { ..., priceCents: 299 },  // Episode 5 Early Access
"poster-pack":      { ..., priceCents: 199 },  // Official Poster Pack
"complete-scripts": { ..., priceCents: 299 },  // The Complete Scripts (PDF)
"character-art-pack": { ..., priceCents: 199 },  // Character Art Pack
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
- Gated pages (`/watch/ep4`, `/watch/ep5`, `/download/posters`, `/download/scripts`,
  `/download/character-art`) check that signed cookie
  **on the server** on every request. No video IDs or download links exist in
  any public page or JavaScript.
- Buyers who lose their cookie can restore access with the PayPal email they
  paid with on `/bonus`.
- One honest limit: determined buyers *can* share the unlisted YouTube link or
  the zip. For this stage that's the standard indie-creator tradeoff — full
  DRM would need a paid video host (e.g. Vimeo OTT). The paywall stops casual
  access, which is what matters.

## Hidden Easter egg (ELIAS)

- **Trigger:** a visitor types the letters **E-L-I-A-S** in sequence (case-insensitive)
  anywhere on any page. Implemented in `public/js/easter-egg.js`, loaded site-wide
  via the footer partial. The listener ignores keystrokes inside form fields and the
  sequence resets after 2 seconds of no matching input.
- **What happens:** a horror-styled whisper modal appears ("You heard him."). The
  visitor can claim **Episode 4 Early Access free**. There is deliberately no hint
  about this anywhere on the site — no nav, footer, or sitemap mention.
- **Cap:** only `easterEggMaxClaims` souls ever get it — change it in `config.js`
  (currently **13**). The server counts claims in the `easter_egg_claims` table in
  `data/entitlements.db` and refuses claim #14 with `{ ok: false, reason: "closed" }`.
- **Claim endpoint:** `POST /api/easter-egg/claim` → `{ ok: true, soulNumber: N }` on
  success. It grants the `ep4-early` entitlement and sets the **exact same signed,
  httpOnly cookie** the PayPal success flow issues, so `/watch/ep4` opens immediately.
- **One claim per browser:** on success the JS sets `ddf_easter_egg_claimed` in
  localStorage; if present, the modal instead says "You already claimed your soul."
  (The server-side cap of 13 is the real backstop.)

## Promo "soul links" (private paywall-bypass links)

- **What:** the owner can mint unguessable links (`/promo/<code>`) that grant
  free access for a capped number of redeemers — e.g. five individual
  single-use "soul links". The recommended entitlement is **`all-access`**, a
  master key honored by every gated watch page: it unlocks all episodes,
  current and future, with no fixed episode list to maintain. Redeemers get the
  **exact same signed, httpOnly entitlement cookie** the PayPal success flow
  issues, so their views are unlimited.
- **Create them:** `node scripts/make-promo.js --count 5 --max 1 --entitlements all-access --label "soul link"`.
  Prints all five shareable URLs. `--count N` makes N individual codes;
  `--max M` sets claims allowed per code (1 = single-use); `--label` is a
  private note (numbered per link when count > 1). Codes are 16-char
  alphanumeric (unguessable). Per-episode entitlements (e.g. `ep4-early`) also
  work, including ones not in `config.products` yet — the cookie carries them
  and the watch pages unlock automatically once they go live.
- **Storage:** `data/promos.json` maps `code -> { entitlements, maxClaims, claims, label, created }`.
  Every claim increments and rewrites the file atomically (temp + rename), so
  counts survive restarts exactly like the Easter egg's SQLite count. Note: on
  Render's free tier `data/` is ephemeral across redeploys — same caveat as the
  Easter egg claims; redeploying resets both.
- **Redeem:** `GET /promo/<code>`. Unknown code → friendly 404 page (never a
  stack trace). Valid code with claims left → mints the entitlement cookie and
  shows a "This soul link has been claimed" success page linking each entitled
  watch page. Exhausted code → friendly "already been claimed" page. No
  endpoint lists or enumerates codes — keep links private; anyone with a link
  can claim it until its cap is hit.
- **Personal unlock link:** at claim time the success page also mints a
  personal bearer link, `GET /s/<token>` — a JWT (`{ soul: true, products }`,
  ~10-year expiry) shown in a "Save this link" box with a copy button.
  Opening it in ANY browser/device issues the same signed access cookie, so
  the unlock follows the person instead of being trapped in the cookie jar of
  the browser that claimed the soul link. Bad/expired token → plain 404.
  Same trust model as the soul link itself: don't share it, it's theirs.
- **Deploying new codes:** codes are loaded from `data/promos.json` at server
  startup — commit the file and redeploy (Render auto-deploys on push) for new
  links to take effect.

### Soul-link usage dashboard (private)

- **What:** `GET /admin/soul-links?token=<SOUL_STATS_TOKEN>` renders a dark
  table of every soul link: label, full URL, claims used / max, and status
  (AVAILABLE / CLAIMED). Claim counts are read fresh from
  `data/promos.json` on every request, so they are always current.
- **Security:** the `token` query param is compared timing-safely against the
  `SOUL_STATS_TOKEN` environment variable. If the env var is **unset** or the
  token does not match, the endpoint returns a plain **404** — indistinguishable
  from an unknown page, so nothing reveals the endpoint exists. Set the env var
  on Render (Dashboard → Environment), never commit the token to the repo, and
  never open the dashboard URL where someone could see it. The token itself is
  never logged.
- **Generate a token:** `node -e "console.log(require('crypto').randomBytes(24).toString('base64url'))"`
  (32 URL-safe chars). Hand the full URL to the owner privately.

## Donations ("Feed the dead 🖤")

- **What:** a cute-and-gory blood-drip Donate button (homepage hero, top of
  `/bonus`, and the footer on every page). Donors pick any amount ($1–$500),
  approve on paypal.com, and land on a "The dead thank you" page.
- **Money goes to:** the same PayPal account as the store — donations are
  created through the exact same PayPal REST credentials (`PAYPAL_CLIENT_ID` /
  `PAYPAL_CLIENT_SECRET`), so no separate email or handle is needed. Pure
  support: no product, no entitlement, no access cookie.
- **Flow:** `POST /api/donate/order` (validates amount server-side) returns the
  PayPal approval URL → donor approves → `GET /paypal/donate-return` captures
  server-side and records the donation in the `donations` SQLite table
  (order id, amount, donor email, timestamp) for the owner's records.
- **Files:** `views/partials/donate.ejs` (reusable component),
  `public/js/donate.js`, `views/donate-thanks.ejs`, blood-drip styles in
  `public/css/style.css` (`.btn-blood`).
