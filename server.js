// THE DEAD DON'T FORGET — official site server
// Paywall is server-verified: PayPal orders are captured via the PayPal API,
// entitlements are stored server-side, and gated pages require a signed JWT.

const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const express = require("express");
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");
const Database = require("better-sqlite3");
const archiver = require("archiver");

const config = require("./config");

const app = express();
const DATA_DIR = path.join(__dirname, "data");
fs.mkdirSync(DATA_DIR, { recursive: true });

// ── Database: who bought what ────────────────────────────────
const db = new Database(path.join(DATA_DIR, "entitlements.db"));
db.exec(`
  CREATE TABLE IF NOT EXISTS entitlements (
    email TEXT NOT NULL,
    product TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    PRIMARY KEY (email, product)
  )
`);
const grantEntitlement = (email, product) => {
  db.prepare("INSERT OR IGNORE INTO entitlements (email, product) VALUES (?, ?)").run(email.toLowerCase(), product);
};
// New-episode alert signups: one email per soul, no spam ever.
db.exec(`
  CREATE TABLE IF NOT EXISTS alert_subscribers (
    email TEXT PRIMARY KEY,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )
`);
const productsForEmail = (email) => {
  return db.prepare("SELECT product FROM entitlements WHERE email = ?").all(email.toLowerCase()).map(r => r.product);
};

// ── Traffic analytics (privacy-friendly pageviews) ──────────
db.exec(`
  CREATE TABLE IF NOT EXISTS pageviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    path TEXT NOT NULL,
    day TEXT NOT NULL,
    visitor_hash TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE INDEX IF NOT EXISTS idx_pageviews_day ON pageviews(day);
  CREATE INDEX IF NOT EXISTS idx_pageviews_path_day ON pageviews(path, day);
`);
const TRAFFIC_SALT = crypto.randomBytes(16).toString("hex");

// ── Candle shrine (global count of candles lit for the dead) ───
db.exec(`
  CREATE TABLE IF NOT EXISTS candle_lights (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ip TEXT NOT NULL,
    lit_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);
/* In-memory per-IP throttle: one candle per 10s. Survives redeploys losing
   nothing important — the count itself is in SQLite. */
const candleThrottle = new Map();
app.get("/api/candles", (req, res) => {
  const n = db.prepare("SELECT COUNT(*) AS n FROM candle_lights").get().n;
  res.json({ count: n });
});
app.post("/api/candles/light", express.json(), (req, res) => {
  const ip = String(req.ip || "unknown");
  const now = Date.now();
  const last = candleThrottle.get(ip) || 0;
  if (now - last < 10000) {
    return res.status(429).json({ error: "One candle at a time — wait a few seconds." });
  }
  candleThrottle.set(ip, now);
  db.prepare("INSERT INTO candle_lights (ip) VALUES (?)").run(ip);
  const n = db.prepare("SELECT COUNT(*) AS n FROM candle_lights").get().n;
  res.json({ count: n });
});
/* "Light them all" — one bulk insert instead of 13 throttled singles. */
app.post("/api/candles/light-many", express.json(), (req, res) => {
  const ip = String(req.ip || "unknown");
  const now = Date.now();
  const key = ip + ":many";
  const last = candleThrottle.get(key) || 0;
  if (now - last < 60000) {
    return res.status(429).json({ error: "The dead need a moment." });
  }
  let n = parseInt(req.body && req.body.n, 10);
  if (!n || n < 1) n = 1;
  n = Math.min(n, 13);
  candleThrottle.set(key, now);
  const stmt = db.prepare("INSERT INTO candle_lights (ip) VALUES (?)");
  db.transaction((count) => { for (let i = 0; i < count; i++) stmt.run(ip); })(n);
  const total = db.prepare("SELECT COUNT(*) AS n FROM candle_lights").get().n;
  res.json({ count: total });
});

// ── Poster pack zip (built once at startup, served only to buyers) ──
const POSTER_ZIP = path.join(DATA_DIR, "poster-pack.zip");
function buildPosterZip() {
  return new Promise((resolve, reject) => {
    const out = fs.createWriteStream(POSTER_ZIP);
    const archive = archiver("zip", { zlib: { level: 9 } });
    out.on("close", resolve);
    archive.on("error", reject);
    archive.pipe(out);
    archive.file(path.join(__dirname, "public/img/ep1-poster-man-at-the-gate.webp"), { name: "ep1-the-man-at-the-gate.webp" });
    archive.file(path.join(__dirname, "public/img/series-key-art.webp"), { name: "ep2-series-key-art.webp" });
    archive.file(path.join(__dirname, "public/img/ep3-poster-the-ledger.webp"), { name: "ep3-the-ledger.webp" });
    archive.finalize();
  });
}

// ── Character art pack zip (built once at startup, served only to buyers) ──
const CHARACTER_ART_ZIP = path.join(DATA_DIR, "character-art-pack.zip");
const CHARACTER_ART_DIR = path.join(__dirname, "assets", "character-art");
const CHARACTER_ART_FILES = [
  ["daniel.jpg", "01-daniel.jpg"],
  ["elias.jpg", "02-elias.jpg"],
  ["mara.jpg", "03-mara.jpg"],
  ["guard.jpg", "04-the-guard.jpg"],
  ["lena-mercer.jpg", "05-lena-mercer.jpg"],
  ["emily.jpg", "06-emily.jpg"],
  ["jonah-bell.jpg", "07-jonah-bell.jpg"],
  ["ruth-mercer.jpg", "08-ruth-mercer.jpg"],
  ["wallpaper-gate.jpg", "09-wallpaper-the-gate.jpg"],
  ["wallpaper-wall-of-names.jpg", "10-wallpaper-wall-of-names.jpg"]
];
function buildCharacterArtZip() {
  return new Promise((resolve, reject) => {
    const out = fs.createWriteStream(CHARACTER_ART_ZIP);
    const archive = archiver("zip", { zlib: { level: 9 } });
    out.on("close", resolve);
    archive.on("error", reject);
    archive.pipe(out);
    for (const [src, name] of CHARACTER_ART_FILES) {
      archive.file(path.join(CHARACTER_ART_DIR, src), { name });
    }
    archive.finalize();
  });
}

// ── Complete Scripts PDF (built offline, committed to the repo) ──
const SCRIPTS_PDF = path.join(DATA_DIR, "complete-scripts.pdf");

// ── PayPal (direct REST API, no SDK) ─────────────────────────
const paypalBase = () => config.paypalMode === "live"
  ? "https://api-m.paypal.com"
  : "https://api-m.sandbox.paypal.com";
const paypalConfigured = () =>
  config.paypalClientId && !config.paypalClientId.includes("PASTE_YOUR") &&
  config.paypalClientSecret && !config.paypalClientSecret.includes("PASTE_YOUR");

let paypalTokenCache = { token: null, expiresAt: 0 };
async function paypalAccessToken() {
  if (paypalTokenCache.token && Date.now() < paypalTokenCache.expiresAt - 60000) {
    return paypalTokenCache.token;
  }
  const creds = Buffer.from(`${config.paypalClientId}:${config.paypalClientSecret}`).toString("base64");
  const r = await fetch(`${paypalBase()}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      "Authorization": `Basic ${creds}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: "grant_type=client_credentials"
  });
  if (!r.ok) throw new Error(`PayPal auth failed (HTTP ${r.status})`);
  const data = await r.json();
  paypalTokenCache = { token: data.access_token, expiresAt: Date.now() + (data.expires_in * 1000) };
  return data.access_token;
}
async function paypalApi(method, path, body) {
  const token = await paypalAccessToken();
  const r = await fetch(`${paypalBase()}${path}`, {
    method,
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: body ? JSON.stringify(body) : undefined
  });
  const data = await r.json().catch(() => ({}));
  return { ok: r.ok, status: r.status, data };
}

// ── Stripe (Checkout Sessions, hosted card payments) ───────────
const stripeConfigured = () =>
  config.stripeSecretKey && !config.stripeSecretKey.includes("PASTE_YOUR");
let stripeClient = null;
function stripe() {
  if (!stripeClient) {
    const opts = {};
    // Test-only override (never set in production): point the Stripe client
    // at a local mock API server, e.g. STRIPE_API_HOST=localhost:4567.
    if (process.env.STRIPE_API_HOST) {
      const [h, p] = String(process.env.STRIPE_API_HOST).split(":");
      opts.host = h; opts.port = p || "443"; opts.protocol = "http";
    }
    stripeClient = require("stripe")(config.stripeSecretKey, opts);
  }
  return stripeClient;
}

// ── Access tokens (signed, httpOnly cookie) ──────────────────
const COOKIE_NAME = "ddf_access";
function grantProductEntitlements(email, product) {
  // Bundles carry `entitlements` (array); single products carry `entitlement`.
  const list = Array.isArray(product.entitlements) ? product.entitlements
    : product.entitlement ? [product.entitlement] : [];
  list.forEach(e => grantEntitlement(email, e));
}
function issueAccessCookie(res, email) {
  const products = productsForEmail(email);
  const token = jwt.sign({ email, products }, config.jwtSecret, { expiresIn: "365d" });
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 365 * 24 * 60 * 60 * 1000
  });
}
function readAccess(req) {
  const token = req.cookies[COOKIE_NAME];
  if (!token) return null;
  try {
    return jwt.verify(token, config.jwtSecret);
  } catch {
    return null;
  }
}
function requireEntitlement(entitlement) {
  return (req, res, next) => {
    const access = readAccess(req);
    // "all-access" is a master key (promo free passes): it unlocks every
    // gated page, including future episodes, alongside the specific
    // per-episode entitlement. Purely additive — existing buyer cookies
    // carrying only their own entitlements keep working exactly as before.
    if (access && Array.isArray(access.products) &&
        (access.products.includes(entitlement) || access.products.includes("all-access"))) {
      req.access = access;
      return next();
    }
    return res.status(403).render("error", {
      title: "Locked",
      message: "This is bonus content for supporters. Unlock it below to get in.",
      cta: "/bonus"
    });
  };
}

// ── App setup ────────────────────────────────────────────────
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));
app.use(cookieParser());
// Every template knows whether the visitor holds any entitlement —
// the nav uses it to show the Profile link only to supporters.
// Every template (including the error page) gets `config` — the header and
// footer partials depend on it, so this must run before any res.render.
// stripeOn gates the Stripe ("pay with card") buttons in the donate partial
// and on /bonus; it is false until STRIPE_SECRET_KEY is set.
app.use((req, res, next) => { res.locals.config = config; res.locals.stripeOn = stripeConfigured(); res.locals.access = readAccess(req); next(); });

// PayPal webhook (backup only — the capture-on-return flow below is the
// primary, server-verified path, so this endpoint only logs for now).
// TODO: verify webhook signatures per
// https://developer.paypal.com/docs/api/webhooks/#verify-webhook-signature
// before trusting these events for anything beyond logging.
app.post("/api/paypal-webhook", express.json(), (req, res) => {
  const evt = req.body || {};
  console.log("PayPal webhook event:", evt.event_type, evt.id);
  res.json({ received: true });
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Track pageviews (skip static assets, admin, and file downloads) ──
app.use((req, res, next) => {
  if (req.method === "GET"
      && !req.path.startsWith("/admin")
      && !req.path.startsWith("/api/")
      && !/\.(css|js|png|jpg|jpeg|webp|gif|svg|ico|mp4|pdf|zip|woff2?)$/i.test(req.path)) {
    try {
      const day = new Date().toISOString().slice(0, 10);
      const ip = req.ip || req.socket.remoteAddress || "unknown";
      const visitor_hash = crypto.createHash("sha256").update(TRAFFIC_SALT + day + ip).digest("hex").slice(0, 16);
      db.prepare("INSERT INTO pageviews (path, day, visitor_hash) VALUES (?, ?, ?)").run(req.path, day, visitor_hash);
    } catch (e) { /* analytics must never break the site */ }
  }
  next();
});

// ── Public pages ─────────────────────────────────────────────
app.get("/", (req, res) => res.render("index", { config, canonicalPath: "/" }));
app.get("/episodes", (req, res) => res.render("episodes", { config, canonicalPath: "/episodes" }));
app.get("/bonus", (req, res) => res.render("bonus", { config, notice: req.query, canonicalPath: "/bonus" }));

// ── Checkout (PayPal order → buyer approves on paypal.com) ─────
app.post("/api/checkout/:productId", async (req, res) => {
  const product = config.products[req.params.productId];
  if (!product) return res.status(404).json({ error: "Unknown product." });
  if (!paypalConfigured()) {
    return res.status(500).json({
      error: "Payments are not connected yet. The site owner needs to add her PayPal keys — see README."
    });
  }
  try {
    const dollars = (product.priceCents / 100).toFixed(2);
    const { ok, status, data } = await paypalApi("POST", "/v2/checkout/orders", {
      intent: "CAPTURE",
      purchase_units: [{
        amount: { currency_code: "USD", value: dollars },
        description: `${config.siteName} — ${product.name}`
      }],
      application_context: {
        brand_name: "THE DEAD DON'T FORGET",
        return_url: `${config.baseUrl}/paypal/return?product=${encodeURIComponent(req.params.productId)}`,
        cancel_url: `${config.baseUrl}/bonus?cancelled=1`,
        user_action: "PAY_NOW"
      }
    });
    if (!ok) throw new Error(`PayPal order failed (HTTP ${status}): ${(data && data.message) || "unknown error"}`);
    const approve = (data.links || []).find(l => l.rel === "approve");
    if (!approve || !approve.href) throw new Error("PayPal did not return an approval link.");
    res.json({ url: approve.href });
  } catch (err) {
    res.status(500).json({ error: "Could not start checkout: " + err.message });
  }
});

// ── PayPal return: capture the order server-side (never trust the redirect alone) ──
app.get("/paypal/return", async (req, res) => {
  const product = config.products[req.query.product];
  const orderId = req.query.token; // PayPal returns the order id as ?token=
  if (!paypalConfigured()) {
    return res.status(500).render("error", { title: "Not configured", message: "Payments are not connected yet.", cta: "/bonus" });
  }
  if (!product || !orderId) {
    return res.status(400).render("error", { title: "Hmm", message: "Missing order details. Try checking out again.", cta: "/bonus" });
  }
  try {
    const { ok, status, data } = await paypalApi("POST", `/v2/checkout/orders/${encodeURIComponent(orderId)}/capture`);
    if (!ok || data.status !== "COMPLETED") {
      return res.status(402).render("error", {
        title: "Payment not completed",
        message: "Your PayPal payment didn't go through. No charge was made — try again.",
        cta: "/bonus"
      });
    }
    // Email from the payer feeds the restore-by-email flow; fall back to a
    // stable per-order id so the record is still useful if PayPal omits it.
    const payer = data.payer || {};
    const email = (payer.email_address || `paypal-buyer-${String(orderId).toLowerCase()}@example.invalid`).toLowerCase();
    grantProductEntitlements(email, product);
    issueAccessCookie(res, email);
    res.redirect(product.deliveryPath);
  } catch (err) {
    res.status(500).render("error", { title: "Something went wrong", message: err.message, cta: "/bonus" });
  }
});

// ── Donations: same PayPal account as the store, donor-chosen amount ──
// No product, no entitlement, no access cookie — pure support. The order is
// created through the exact same PayPal REST credentials as checkout, so the
// money lands in the same PayPal account that receives store payments.
db.exec(`
  CREATE TABLE IF NOT EXISTS donations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    paypal_order_id TEXT NOT NULL UNIQUE,
    amount_cents INTEGER NOT NULL,
    donor_email TEXT,
    donated_at TEXT NOT NULL DEFAULT (datetime('now'))
  )
`);
app.post("/api/donate/order", express.json(), async (req, res) => {
  if (!paypalConfigured()) {
    return res.status(500).json({
      error: "Donations aren't connected yet. The site owner needs to add her PayPal keys — see README."
    });
  }
  // Donor-chosen amount, validated server-side: $1.00 – $500.00.
  const cents = Math.round(Number(req.body && req.body.amount) * 100);
  if (!Number.isFinite(cents) || cents < 100 || cents > 50000) {
    return res.status(400).json({ error: "Pick an amount between $1 and $500." });
  }
  try {
    const dollars = (cents / 100).toFixed(2);
    const { ok, status, data } = await paypalApi("POST", "/v2/checkout/orders", {
      intent: "CAPTURE",
      purchase_units: [{
        amount: { currency_code: "USD", value: dollars },
        description: `${config.siteName} — Fan donation`
      }],
      application_context: {
        brand_name: "THE DEAD DON'T FORGET",
        return_url: `${config.baseUrl}/paypal/donate-return`,
        cancel_url: `${config.baseUrl}/bonus?cancelled=1`,
        user_action: "PAY_NOW"
      }
    });
    if (!ok) throw new Error(`PayPal order failed (HTTP ${status}): ${(data && data.message) || "unknown error"}`);
    const approve = (data.links || []).find(l => l.rel === "approve");
    if (!approve || !approve.href) throw new Error("PayPal did not return an approval link.");
    res.json({ url: approve.href });
  } catch (err) {
    res.status(500).json({ error: "Could not start the donation: " + err.message });
  }
});

// Donor returns from paypal.com — capture and thank them. No entitlement.
app.get("/paypal/donate-return", async (req, res) => {
  const orderId = req.query.token; // PayPal returns the order id as ?token=
  if (!paypalConfigured()) {
    return res.status(500).render("error", { title: "Not configured", message: "Donations are not connected yet.", cta: "/bonus" });
  }
  if (!orderId) {
    return res.status(400).render("error", { title: "Hmm", message: "Missing donation details. Try again.", cta: "/" });
  }
  try {
    const { ok, status, data } = await paypalApi("POST", `/v2/checkout/orders/${encodeURIComponent(orderId)}/capture`);
    if (!ok || data.status !== "COMPLETED") {
      return res.status(402).render("error", {
        title: "Donation not completed",
        message: "Your PayPal donation didn't go through. No charge was made — try again.",
        cta: "/"
      });
    }
    const unit = (data.purchase_units && data.purchase_units[0]) || {};
    const captured = (unit.payments && unit.payments.captures && unit.payments.captures[0]) || {};
    const amount = (captured.amount && captured.amount.value) || "?";
    const donorEmail = (data.payer && data.payer.email_address) || null;
    try {
      db.prepare("INSERT OR IGNORE INTO donations (paypal_order_id, amount_cents, donor_email) VALUES (?, ?, ?)")
        .run(String(orderId), Math.round(Number(amount) * 100) || 0, donorEmail);
    } catch { /* record-keeping only — never block the thank-you */ }
    res.render("donate-thanks", { amount });
  } catch (err) {
    res.status(500).render("error", { title: "Something went wrong", message: err.message, cta: "/" });
  }
});

// ── Stripe checkout (hosted card payments) ───────────────────
// Mirrors the PayPal flow exactly: server creates a Checkout Session, the
// buyer pays on stripe.com, then returns here where the server verifies the
// session via the Stripe API before granting the entitlement. Card data
// never touches this server. If Stripe keys aren't set, the endpoints fail
// gracefully and PayPal keeps working alone.
app.post("/api/stripe/checkout/:productId", express.json(), async (req, res) => {
  const product = config.products[req.params.productId];
  if (!product) return res.status(404).json({ error: "Unknown product." });
  if (!stripeConfigured()) {
    return res.status(500).json({
      error: "Card payments aren't connected yet. PayPal still works — use the PayPal button instead."
    });
  }
  try {
    const session = await stripe().checkout.sessions.create({
      mode: "payment",
      line_items: [{
        price_data: {
          currency: "usd",
          unit_amount: product.priceCents,
          product_data: { name: `${config.siteName} — ${product.name}` }
        },
        quantity: 1
      }],
      metadata: { productId: req.params.productId },
      success_url: `${config.baseUrl}/stripe/return?product=${encodeURIComponent(req.params.productId)}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${config.baseUrl}/bonus?cancelled=1`
    });
    if (!session.url) throw new Error("Stripe did not return a checkout URL.");
    res.json({ url: session.url });
  } catch (err) {
    res.status(500).json({ error: "Could not start card checkout: " + err.message });
  }
});

// Stripe return: verify the session server-side (never trust the redirect alone) ──
app.get("/stripe/return", async (req, res) => {
  const productId = req.query.product;
  const product = config.products[productId];
  const sessionId = req.query.session_id;
  if (!stripeConfigured()) {
    return res.status(500).render("error", { title: "Not configured", message: "Card payments are not connected yet.", cta: "/bonus" });
  }
  if (!product || !sessionId) {
    return res.status(400).render("error", { title: "Hmm", message: "Missing payment details. Try checking out again.", cta: "/bonus" });
  }
  try {
    const session = await stripe().checkout.sessions.retrieve(sessionId);
    // Must be THIS product's session, and the payment must be complete.
    if (!session || session.metadata.productId !== productId || session.payment_status !== "paid") {
      return res.status(402).render("error", {
        title: "Payment not completed",
        message: "Your card payment didn't go through. No charge was made — try again.",
        cta: "/bonus"
      });
    }
    // Email from the buyer feeds the restore-by-email flow; fall back to a
    // stable per-session id so the record is still useful if Stripe omits it.
    const email = ((session.customer_details && session.customer_details.email) ||
      `stripe-buyer-${String(sessionId).toLowerCase()}@example.invalid`).toLowerCase();
    grantProductEntitlements(email, product);
    issueAccessCookie(res, email);
    res.redirect(product.deliveryPath);
  } catch (err) {
    res.status(500).render("error", { title: "Something went wrong", message: err.message, cta: "/bonus" });
  }
});

// ── Stripe donations (separate table; PayPal donations table untouched) ──
db.exec(`
  CREATE TABLE IF NOT EXISTS stripe_donations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    stripe_session_id TEXT NOT NULL UNIQUE,
    amount_cents INTEGER NOT NULL,
    donor_email TEXT,
    donated_at TEXT NOT NULL DEFAULT (datetime('now'))
  )
`);
app.post("/api/stripe/donate/order", express.json(), async (req, res) => {
  if (!stripeConfigured()) {
    return res.status(500).json({
      error: "Card donations aren't connected yet. PayPal still works — use the PayPal button instead."
    });
  }
  // Donor-chosen amount, validated server-side: $1.00 – $500.00.
  const cents = Math.round(Number(req.body && req.body.amount) * 100);
  if (!Number.isFinite(cents) || cents < 100 || cents > 50000) {
    return res.status(400).json({ error: "Pick an amount between $1 and $500." });
  }
  try {
    const session = await stripe().checkout.sessions.create({
      mode: "payment",
      line_items: [{
        price_data: {
          currency: "usd",
          unit_amount: cents,
          product_data: { name: `${config.siteName} — Fan donation` }
        },
        quantity: 1
      }],
      metadata: { type: "donation", amount_cents: String(cents) },
      success_url: `${config.baseUrl}/stripe/donate-return?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${config.baseUrl}/bonus?cancelled=1`
    });
    if (!session.url) throw new Error("Stripe did not return a checkout URL.");
    res.json({ url: session.url });
  } catch (err) {
    res.status(500).json({ error: "Could not start the donation: " + err.message });
  }
});

// Donor returns from stripe.com — verify and thank them. No entitlement.
app.get("/stripe/donate-return", async (req, res) => {
  const sessionId = req.query.session_id;
  if (!stripeConfigured()) {
    return res.status(500).render("error", { title: "Not configured", message: "Card donations are not connected yet.", cta: "/bonus" });
  }
  if (!sessionId) {
    return res.status(400).render("error", { title: "Hmm", message: "Missing donation details. Try again.", cta: "/" });
  }
  try {
    const session = await stripe().checkout.sessions.retrieve(sessionId);
    if (!session || session.metadata.type !== "donation" || session.payment_status !== "paid") {
      return res.status(402).render("error", {
        title: "Donation not completed",
        message: "Your card donation didn't go through. No charge was made — try again.",
        cta: "/"
      });
    }
    const amount = (session.amount_total || 0) / 100;
    const donorEmail = (session.customer_details && session.customer_details.email) || null;
    try {
      db.prepare("INSERT OR IGNORE INTO stripe_donations (stripe_session_id, amount_cents, donor_email) VALUES (?, ?, ?)")
        .run(String(sessionId), Math.round((session.amount_total || 0)) || 0, donorEmail);
    } catch { /* record-keeping only — never block the thank-you */ }
    res.render("donate-thanks", { amount });
  } catch (err) {
    res.status(500).render("error", { title: "Something went wrong", message: err.message, cta: "/" });
  }
});

// Lost your access cookie? Re-issue it from the purchase record.
app.post("/api/restore", (req, res) => {
  const email = (req.body.email || "").trim().toLowerCase();
  if (!email || !email.includes("@")) return res.redirect("/bonus?error=bad-email");
  if (productsForEmail(email).length === 0) return res.redirect("/bonus?error=no-purchases");
  issueAccessCookie(res, email);
  res.redirect("/bonus?restored=1");
});

// ── Profiles: supporters pick a display name, see their library ──
db.exec(`
  CREATE TABLE IF NOT EXISTS profiles (
    email TEXT PRIMARY KEY,
    display_name TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )
`);
const profileName = (email) => {
  const row = db.prepare("SELECT display_name FROM profiles WHERE email = ?").get(email.toLowerCase());
  return row ? row.display_name : null;
};
app.get("/profile", (req, res) => {
  const access = readAccess(req);
  if (!access || !Array.isArray(access.products) || access.products.length === 0) {
    return res.status(403).render("error", {
      title: "No profile yet",
      message: "Profiles belong to supporters. Unlock something in the Bonus Store first.",
      cta: "/bonus"
    });
  }
  const email = access.email;
  // Build their library: match each entitlement to its product.
  const byEntitlement = {};
  Object.entries(config.products).forEach(([id, p]) => {
    (p.entitlements || [p.entitlement]).filter(Boolean).forEach(e => { byEntitlement[e] = { id, ...p }; });
  });
  const library = [];
  const seen = new Set();
  access.products.forEach(e => {
    if (e === "all-access") {
      Object.entries(config.products).forEach(([id, p]) => {
        if (!seen.has(id)) { seen.add(id); library.push({ id, ...p }); }
      });
      return;
    }
    const p = byEntitlement[e];
    if (p && !seen.has(p.id)) { seen.add(p.id); library.push(p); }
  });
  res.render("profile", { config, email, displayName: profileName(email), library });
});
app.post("/api/profile", express.json(), (req, res) => {
  const access = readAccess(req);
  if (!access || !access.email) return res.status(403).json({ ok: false, error: "no-access" });
  let name = ((req.body && req.body.display_name) || "").trim().replace(/\s+/g, " ");
  if (!name || name.length > 40) return res.status(400).json({ ok: false, error: "bad-name" });
  db.prepare("INSERT INTO profiles (email, display_name) VALUES (?, ?) ON CONFLICT(email) DO UPDATE SET display_name = excluded.display_name")
    .run(access.email.toLowerCase(), name);
  res.json({ ok: true, display_name: name });
});
// One email per soul. No spam, ever — only "a new episode dropped" notes.
app.post("/api/alerts/signup", express.json(), (req, res) => {
  const email = ((req.body && req.body.email) || "").trim().toLowerCase();
  if (!email || !email.includes("@") || email.length > 254) {
    return res.status(400).json({ ok: false, error: "bad-email" });
  }
  db.prepare("INSERT OR IGNORE INTO alert_subscribers (email) VALUES (?)").run(email);
  res.json({ ok: true });
});

// Owner-only: GET /admin/alerts?token=<SOUL_STATS_TOKEN> — subscriber list.
app.get("/admin/alerts", (req, res) => {
  if (!soulStatsAuthorized(req)) {
    return res.status(404).render("error", {
      title: "Not found",
      message: "That page doesn't exist.",
      cta: "/"
    });
  }
  const subs = db.prepare(
    "SELECT email, created_at FROM alert_subscribers ORDER BY created_at DESC"
  ).all();
  res.render("admin-alerts", { config, subs, token: req.query.token });
});

// Owner-only: GET /admin/alerts.csv?token=<SOUL_STATS_TOKEN> — CSV export.
app.get("/admin/alerts.csv", (req, res) => {
  if (!soulStatsAuthorized(req)) return res.status(404).send("Not found");
  const subs = db.prepare(
    "SELECT email, created_at FROM alert_subscribers ORDER BY created_at"
  ).all();
  res.type("text/csv");
  res.set("Content-Disposition", "attachment; filename=alert-subscribers.csv");
  res.send("email,created_at\n" + subs.map(s => `${s.email},${s.created_at}`).join("\n"));
});

// ── Easter egg: hidden ELIAS trigger ─────────────────────────
// Typing E-L-I-A-S anywhere fires public/js/easter-egg.js, which POSTs here.
// The first config.easterEggMaxClaims claims get Episode 4 Early Access
// free — via the EXACT same signed entitlement cookie the PayPal success
// flow issues (entitlement "ep4-early"). The SQLite count is the real
// backstop; browsers also keep a localStorage flag as a courtesy.
db.exec(`
  CREATE TABLE IF NOT EXISTS easter_egg_claims (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    claimed_at TEXT NOT NULL DEFAULT (datetime('now'))
  )
`);
app.post("/api/easter-egg/claim", (req, res) => {
  try {
    const claimed = db.prepare("SELECT COUNT(*) AS n FROM easter_egg_claims").get().n;
    if (claimed >= config.easterEggMaxClaims) {
      return res.json({ ok: false, reason: "closed" });
    }
    const soulNumber = claimed + 1;
    // Unique per-claim identity so the entitlement cookie is per-soul.
    const email = `easter-egg-soul-${soulNumber}-${crypto.randomBytes(4).toString("hex")}@example.invalid`;
    db.prepare("INSERT INTO easter_egg_claims (email) VALUES (?)").run(email);
    grantEntitlement(email, "ep4-early");
    issueAccessCookie(res, email);
    res.json({ ok: true, soulNumber });
  } catch (err) {
    res.status(500).json({ ok: false, reason: "error", message: err.message });
  }
});

// ── Candle Easter egg: light all 13 candles ───────────────────
// Independent from the ELIAS egg — rewards stack, so a visitor may claim
// both. The first 13 claims get Episode 5 Early Access free, via the same
// signed entitlement cookie shape as the PayPal flow ("ep5-early").
db.exec(`
  CREATE TABLE IF NOT EXISTS candle_egg_claims (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    claimed_at TEXT NOT NULL DEFAULT (datetime('now'))
  )
`);
app.post("/api/candle-egg/claim", (req, res) => {
  try {
    const claimed = db.prepare("SELECT COUNT(*) AS n FROM candle_egg_claims").get().n;
    if (claimed >= 13) {
      return res.json({ ok: false, reason: "closed" });
    }
    const wickNumber = claimed + 1;
    const email = `candle-egg-wick-${wickNumber}-${crypto.randomBytes(4).toString("hex")}@example.invalid`;
    db.prepare("INSERT INTO candle_egg_claims (email) VALUES (?)").run(email);
    grantEntitlement(email, "ep5-early");
    issueAccessCookie(res, email);
    res.json({ ok: true, wickNumber });
  } catch (err) {
    res.status(500).json({ ok: false, reason: "error", message: err.message });
  }
});

// ── Game Easter egg: beat all 13 doors of THE THIRTEEN DOORS ───
// The first config.gameEggMaxClaims finishers get Episode 7 Early Access
// free — via the EXACT same signed entitlement cookie the PayPal success
// flow issues (entitlement "ep7-early"). The SQLite count is the real
// backstop; browsers also keep a localStorage flag as a courtesy so a
// replay doesn't re-fire the claim. Independent from the ELIAS egg.
db.exec(`
  CREATE TABLE IF NOT EXISTS game_egg_claims (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    claimed_at TEXT NOT NULL DEFAULT (datetime('now'))
  )
`);
app.post("/api/game-egg/claim", (req, res) => {
  try {
    const claimed = db.prepare("SELECT COUNT(*) AS n FROM game_egg_claims").get().n;
    if (claimed >= config.gameEggMaxClaims) {
      return res.json({ ok: false, exhausted: true });
    }
    const soulNumber = claimed + 1;
    // Unique per-claim identity so the entitlement cookie is per-soul.
    const email = `game-egg-soul-${soulNumber}-${crypto.randomBytes(4).toString("hex")}@example.invalid`;
    db.prepare("INSERT INTO game_egg_claims (email) VALUES (?)").run(email);
    grantProductEntitlements(email, config.products['ep7-early']);
    issueAccessCookie(res, email);
    res.json({ ok: true, soulNumber });
  } catch (err) {
    res.status(500).json({ ok: false, reason: "error", message: err.message });
  }
});

// ── Profile Easter egg: tap your display name 8 times ────────────────────
// The first config.profileEggMaxClaims tappers get Episodes 8 + 9 free.
// Same trust model as the other eggs: server-side cap is the real guard;
// browsers keep a localStorage flag as a courtesy so a revisit doesn't
// re-fire the claim. Independent from the ELIAS and game eggs.
db.exec(`
  CREATE TABLE IF NOT EXISTS profile_egg_claims (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    claimed_at TEXT NOT NULL DEFAULT (datetime('now'))
  )
`);
app.post("/api/profile-egg/claim", (req, res) => {
  try {
    const claimed = db.prepare("SELECT COUNT(*) AS n FROM profile_egg_claims").get().n;
    if (claimed >= config.profileEggMaxClaims) {
      return res.json({ ok: false, exhausted: true });
    }
    const soulNumber = claimed + 1;
    const email = `profile-egg-soul-${soulNumber}-${crypto.randomBytes(4).toString("hex")}@example.invalid`;
    db.prepare("INSERT INTO profile_egg_claims (email) VALUES (?)").run(email);
    grantProductEntitlements(email, config.products['ep8-early']);
    grantProductEntitlements(email, config.products['ep9-early']);
    issueAccessCookie(res, email);
    res.json({ ok: true, soulNumber });
  } catch (err) {
    res.status(500).json({ ok: false, reason: "error", message: err.message });
  }
});

// ── Promo codes: private free-pass links ─────────────────────
// Owner-generated codes (scripts/make-promo.js) that bypass the paywall for
// a capped number of redeemers. Each redeemer gets a unique per-claim
// identity, the entitlements are granted server-side (SQLite), and the
// signed httpOnly cookie is the EXACT same shape the PayPal success flow
// issues — unlimited views, no expiry games. Claim counts persist in
// data/promos.json (atomic write on every claim), the same durability the
// Easter egg gets from its SQLite count.
const PROMOS_FILE = path.join(DATA_DIR, "promos.json");
function loadPromos() {
  try {
    const data = JSON.parse(fs.readFileSync(PROMOS_FILE, "utf8"));
    return data && typeof data === "object" ? data : {};
  } catch {
    return {};
  }
}
function savePromos(promos) {
  // Atomic write: temp file + rename, so a crash can't corrupt the file.
  const tmp = PROMOS_FILE + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(promos, null, 2));
  fs.renameSync(tmp, PROMOS_FILE);
}
const promos = loadPromos();
function watchPathFor(entitlement) {
  const product = config.products[entitlement];
  if (product && product.deliveryPath) return product.deliveryPath;
  const m = /^ep(\d+)-early$/.exec(entitlement);
  if (m) return `/watch/ep${m[1]}`; // future episodes unlock when their pages go live
  return "/bonus";
}
function promoDisplayName(entitlement) {
  if (entitlement === "all-access") return "All Episodes — Full Access";
  const product = config.products[entitlement];
  if (product) return product.name;
  const m = /^ep(\d+)-early$/.exec(entitlement);
  if (m) return `Episode ${m[1]} — Early Access`;
  return entitlement;
}
function promoLinks(entitlements) {
  // "all-access" unlocks every episode, current and future: link every
  // episode watch page that exists right now.
  if (entitlements.includes("all-access")) {
    const seen = new Set();
    const links = [];
    for (const p of Object.values(config.products)) {
      if (p.deliveryPath && p.deliveryPath.startsWith("/watch/") && !seen.has(p.deliveryPath)) {
        seen.add(p.deliveryPath);
        links.push({ name: p.name, path: p.deliveryPath });
      }
    }
    return links;
  }
  return entitlements.map(e => ({ name: promoDisplayName(e), path: watchPathFor(e) }));
}

app.get("/promo/:code", (req, res) => {
  const promo = promos[req.params.code];
  if (!promo || !Array.isArray(promo.entitlements)) {
    return res.status(404).render("error", {
      title: "Not found",
      message: "That pass doesn't exist. Check the link and try again.",
      cta: "/bonus"
    });
  }
  if (promo.claims >= promo.maxClaims) {
    return res.render("error", {
      title: "Already claimed",
      message: "This soul link has already been claimed.",
      cta: "/bonus"
    });
  }
  // Claim it: persist the incremented count FIRST (same crash-safety order
  // as the Easter egg), then mint the entitlement cookie.
  const claimNumber = promo.claims + 1;
  const email = `promo-pass-${claimNumber}-${crypto.randomBytes(4).toString("hex")}@example.invalid`;
  for (const entitlement of promo.entitlements) grantEntitlement(email, entitlement);
  promo.claims = claimNumber;
  savePromos(promos);
  issueAccessCookie(res, email);
  // Personal unlock link: a long-lived bearer token the redeemer can save
  // and open in any browser/device. Same trust model as the soul link itself.
  const soulToken = jwt.sign(
    { soul: true, products: promo.entitlements },
    config.jwtSecret,
    { expiresIn: "3650d" } // ~10 years — effectively forever
  );
  res.render("promo-success", {
    config,
    label: promo.label,
    allAccess: promo.entitlements.includes("all-access"),
    links: promoLinks(promo.entitlements),
    personalUrl: "https://the-dead-don-t-forget-1.onrender.com/s/" + soulToken
  });
});

// ── Personal unlock links ──────────────────────────────────────
// Bearer links minted at soul-link claim time (/promo/:code). Opening one in
// ANY browser/device issues the same signed access cookie the promo route
// issues, so the unlock follows the person, not the cookie jar.
// Bad/expired token -> plain 404, indistinguishable from an unknown page.
app.get("/s/:token", (req, res) => {
  let payload = null;
  try {
    payload = jwt.verify(req.params.token, config.jwtSecret);
  } catch {
    payload = null;
  }
  if (!payload || payload.soul !== true || !Array.isArray(payload.products) ||
      !payload.products.every(p => typeof p === "string" && p.length > 0 && p.length < 64)) {
    return res.status(404).render("error", {
      title: "Not found",
      message: "That link doesn't exist. Check the link and try again.",
      cta: "/bonus"
    });
  }
  // Deterministic per-token identity so repeat opens are idempotent
  // (no entitlement-row buildup no matter how often the link is opened).
  const email = "soul-" + crypto.createHash("sha256").update(req.params.token).digest("hex").slice(0, 16) + "@example.invalid";
  for (const p of payload.products) grantEntitlement(email, p);
  issueAccessCookie(res, email);
  res.redirect("/bonus");
});

// ── Private soul-link usage dashboard ────────────────────────
// Owner-only: GET /admin/soul-links?token=<SOUL_STATS_TOKEN>.
// The token is compared timing-safely against the SOUL_STATS_TOKEN env var.
// Env var unset OR token mismatch -> plain 404 (endpoint stays invisible).
// Reads data/promos.json fresh on every request so counts are live.
// Never log the token.
function soulStatsAuthorized(req) {
  const expected = process.env.SOUL_STATS_TOKEN;
  const provided = req.query.token;
  if (!expected || typeof provided !== "string" || !provided) return false;
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(provided, "utf8");
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}
app.get("/admin/soul-links", (req, res) => {
  if (!soulStatsAuthorized(req)) {
    return res.status(404).render("error", {
      title: "Not found",
      message: "That page doesn't exist.",
      cta: "/"
    });
  }
  const live = loadPromos(); // fresh read — claim counts are current
  const base = String(config.baseUrl || "").replace(/\/$/, "");
  const rows = Object.keys(live).sort().map(code => {
    const p = live[code] || {};
    const claims = Number(p.claims) || 0;
    const max = Number(p.maxClaims) || 0;
    return {
      label: p.label || "soul link",
      url: `${base}/promo/${code}`,
      claims,
      max,
      claimed: claims >= max
    };
  });
  res.render("admin-soul-links", { config, rows });
});

// ── Owner-only: GET /admin/traffic?token=<SOUL_STATS_TOKEN> ──
app.get("/admin/traffic", (req, res) => {
  if (!soulStatsAuthorized(req)) {
    return res.status(404).render("error", {
      title: "Not found",
      message: "That page doesn't exist.",
      cta: "/"
    });
  }
  const days = db.prepare(`
    SELECT day,
           COUNT(*) AS views,
           COUNT(DISTINCT visitor_hash) AS visitors
    FROM pageviews
    GROUP BY day
    ORDER BY day DESC
    LIMIT 30
  `).all();
  const pages = db.prepare(`
    SELECT path,
           COUNT(*) AS views,
           COUNT(DISTINCT visitor_hash) AS visitors
    FROM pageviews
    WHERE day >= date('now', '-30 days')
    GROUP BY path
    ORDER BY views DESC
    LIMIT 20
  `).all();
  const totals = db.prepare(`
    SELECT COUNT(*) AS views,
           COUNT(DISTINCT day || visitor_hash) AS visitors
    FROM pageviews
    WHERE day >= date('now', '-30 days')
  `).get();
  res.render("admin-traffic", { config, days, pages, totals });
});

// ── Gated delivery pages ─────────────────────────────────────
app.get("/watch/ep4", requireEntitlement("ep4-early"), (req, res) => {
  res.render("watch-ep4", { config });
});

app.get("/watch/ep5", requireEntitlement("ep5-early"), (req, res) => {
  res.render("watch-ep5", { config });
});

app.get("/watch/ep6", requireEntitlement("ep6-early"), (req, res) => {
  res.render("watch-ep6", { config });
});

app.get("/watch/ep7", requireEntitlement("ep7-early"), (req, res) => {
  res.render("watch-ep7", { config });
});

app.get("/watch/ep8", requireEntitlement("ep8-early"), (req, res) => {
  res.render("watch-ep8", { config });
});

app.get("/watch/ep9", requireEntitlement("ep9-early"), (req, res) => {
  res.render("watch-ep9", { config });
});

app.get("/watch/ep10", requireEntitlement("ep10-early"), (req, res) => {
  res.render("watch-ep10", { config });
});
app.get("/watch/ep11", requireEntitlement("ep11-early"), (req, res) => {
  res.render("watch-ep11", { config });
});
app.get("/watch/ep12", requireEntitlement("ep12-early"), (req, res) => {
  res.render("watch-ep12", { config });
});
app.get("/watch/ep13", requireEntitlement("ep13-early"), (req, res) => {
  res.render("watch-ep13", { config });
});
app.get("/watch/ep14", requireEntitlement("ep14-early"), (req, res) => {
  res.render("watch-ep14", { config });
});
app.get("/watch/ep15", requireEntitlement("ep15-early"), (req, res) => {
  res.render("watch-ep15", { config });
});
app.get("/watch/ep16", requireEntitlement("ep16-early"), (req, res) => {
  res.render("watch-ep16", { config });
});
app.get("/watch/ep17", requireEntitlement("ep17-early"), (req, res) => {
  res.render("watch-ep17", { config });
});
app.get("/watch/ep18", requireEntitlement("ep18-early"), (req, res) => {
  res.render("watch-ep18", { config });
});
app.get("/watch/ep19", requireEntitlement("ep19-early"), (req, res) => {
  res.render("watch-ep19", { config });
});
app.get("/watch/ep20", requireEntitlement("ep20-early"), (req, res) => {
  res.render("watch-ep20", { config });
});
app.get("/watch/ep21", requireEntitlement("ep21-early"), (req, res) => {
  res.render("watch-ep21", { config });
});
app.get("/watch/ep24", requireEntitlement("ep24-early"), (req, res) => {
  res.render("watch-ep24", { config });
});
app.get("/watch/ep25", requireEntitlement("ep25-early"), (req, res) => {
  res.render("watch-ep25", { config });
});

app.get("/download/posters", requireEntitlement("poster-pack"), (req, res) => {
  res.download(POSTER_ZIP, "the-dead-dont-forget-poster-pack.zip");
});

app.get("/download/scripts", requireEntitlement("complete-scripts"), (req, res) => {
  res.download(SCRIPTS_PDF, "the-dead-dont-forget-complete-scripts.pdf");
});

app.get("/download/character-art", requireEntitlement("character-art-pack"), (req, res) => {
  res.download(CHARACTER_ART_ZIP, "the-dead-dont-forget-character-art-pack.zip");
});

// ── Free downloads (public — no payment, no entitlement) ────
const FREEBIES = {
  "ep1-script": {
    file: path.join(DATA_DIR, "ep1-script-free.pdf"),
    name: "the-dead-dont-forget-ep1-script-free-sample.pdf"
  },
  "wallpaper": {
    file: path.join(__dirname, "assets", "character-art", "wallpaper-gate.jpg"),
    name: "the-dead-dont-forget-wallpaper-the-gate.jpg"
  },
  "poster": {
    file: path.join(__dirname, "public", "img", "series-key-art.webp"),
    name: "the-dead-dont-forget-series-poster.webp"
  }
};
app.get("/free/:item", (req, res) => {
  const item = FREEBIES[req.params.item];
  if (!item || !fs.existsSync(item.file)) {
    return res.status(404).render("error", {
      title: "Not found",
      message: "That download doesn't exist.",
      cta: "/bonus"
    });
  }
  res.download(item.file, item.name);
});

// ── Start ────────────────────────────────────────────────────
Promise.all([buildPosterZip(), buildCharacterArtZip()])
  .then(() => {
    app.listen(config.port, () => {
      console.log(`THE DEAD DON'T FORGET — site live at http://localhost:${config.port}`);
      console.log(paypalConfigured()
        ? `PayPal: CONNECTED (${config.paypalMode})`
        : "PayPal: NOT CONFIGURED (see README to go live)");
      console.log(stripeConfigured()
        ? "Stripe: CONNECTED (card payments on)"
        : "Stripe: NOT CONFIGURED (card buttons hidden, PayPal unaffected)");
    });
  })
  .catch(err => {
    console.error("Failed to build poster pack:", err);
    process.exit(1);
  });
