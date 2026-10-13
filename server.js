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
const productsForEmail = (email) => {
  return db.prepare("SELECT product FROM entitlements WHERE email = ?").all(email.toLowerCase()).map(r => r.product);
};

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

// ── Access tokens (signed, httpOnly cookie) ──────────────────
const COOKIE_NAME = "ddf_access";
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
    if (access && Array.isArray(access.products) && access.products.includes(entitlement)) {
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
// Every template (including the error page) gets `config` — the header and
// footer partials depend on it, so this must run before any res.render.
app.use((req, res, next) => { res.locals.config = config; next(); });

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

// ── Public pages ─────────────────────────────────────────────
app.get("/", (req, res) => res.render("index", { config }));
app.get("/episodes", (req, res) => res.render("episodes", { config }));
app.get("/bonus", (req, res) => res.render("bonus", { config, notice: req.query }));

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
    grantEntitlement(email, product.entitlement);
    issueAccessCookie(res, email);
    res.redirect(product.deliveryPath);
  } catch (err) {
    res.status(500).render("error", { title: "Something went wrong", message: err.message, cta: "/bonus" });
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

// ── Gated delivery pages ─────────────────────────────────────
app.get("/watch/ep4", requireEntitlement("ep4-early"), (req, res) => {
  res.render("watch-ep4", { config });
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
    });
  })
  .catch(err => {
    console.error("Failed to build poster pack:", err);
    process.exit(1);
  });
