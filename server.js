// THE DEAD DON'T FORGET — official site server
// Paywall is server-verified: Stripe sessions are checked via the Stripe API,
// entitlements are stored server-side, and gated pages require a signed JWT.

const path = require("path");
const fs = require("fs");
const express = require("express");
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");
const Stripe = require("stripe");
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

// ── Stripe ───────────────────────────────────────────────────
const keysConfigured = () =>
  config.stripeSecretKey && !config.stripeSecretKey.includes("PASTE_YOUR");
const stripe = keysConfigured() ? new Stripe(config.stripeSecretKey) : null;

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

// Webhook needs the RAW body — register before express.json()
app.post("/api/webhook", express.raw({ type: "application/json" }), (req, res) => {
  if (!keysConfigured() || !config.stripeWebhookSecret.includes("whsec_")) {
    return res.status(400).json({ error: "Webhooks not configured." });
  }
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, req.headers["stripe-signature"], config.stripeWebhookSecret);
  } catch (err) {
    return res.status(400).json({ error: "Invalid signature." });
  }
  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const email = session.customer_details && session.customer_details.email;
    const productId = session.metadata && session.metadata.productId;
    if (email && productId && config.products[productId]) {
      grantEntitlement(email, config.products[productId].entitlement);
    }
  }
  res.json({ received: true });
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Public pages ─────────────────────────────────────────────
app.get("/", (req, res) => res.render("index", { config }));
app.get("/episodes", (req, res) => res.render("episodes", { config }));
app.get("/bonus", (req, res) => res.render("bonus", { config, notice: req.query }));

// ── Checkout ─────────────────────────────────────────────────
app.post("/api/checkout/:productId", async (req, res) => {
  const product = config.products[req.params.productId];
  if (!product) return res.status(404).json({ error: "Unknown product." });
  if (!keysConfigured()) {
    return res.status(500).json({
      error: "Payments are not connected yet. The site owner needs to add her Stripe keys in config.js — see README."
    });
  }
  try {
    const session = await stripe.checkout.sessions.create({
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
      success_url: `${config.baseUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${config.baseUrl}/bonus?cancelled=1`
    });
    res.json({ url: session.url });
  } catch (err) {
    res.status(500).json({ error: "Could not start checkout: " + err.message });
  }
});

// ── Post-payment: verify with Stripe (never trust the redirect alone) ──
app.get("/success", async (req, res) => {
  if (!keysConfigured()) {
    return res.status(500).render("error", { title: "Not configured", message: "Payments are not connected yet.", cta: "/bonus" });
  }
  try {
    const session = await stripe.checkout.sessions.retrieve(req.query.session_id);
    if (session.payment_status !== "paid") {
      return res.status(402).render("error", { title: "Payment not completed", message: "Your payment didn't go through. Try again.", cta: "/bonus" });
    }
    const email = session.customer_details && session.customer_details.email;
    const productId = session.metadata && session.metadata.productId;
    const product = config.products[productId];
    if (!email || !product) {
      return res.status(500).render("error", { title: "Hmm", message: "Payment went through but we couldn't identify the product. Contact support.", cta: "/bonus" });
    }
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

// ── Gated delivery pages ─────────────────────────────────────
app.get("/watch/ep4", requireEntitlement("ep4-early"), (req, res) => {
  res.render("watch-ep4", { config });
});

app.get("/download/posters", requireEntitlement("poster-pack"), (req, res) => {
  res.download(POSTER_ZIP, "the-dead-dont-forget-poster-pack.zip");
});

// ── Start ────────────────────────────────────────────────────
buildPosterZip()
  .then(() => {
    app.listen(config.port, () => {
      console.log(`THE DEAD DON'T FORGET — site live at http://localhost:${config.port}`);
      console.log(keysConfigured() ? "Stripe: CONNECTED" : "Stripe: NOT CONFIGURED (see README to go live)");
    });
  })
  .catch(err => {
    console.error("Failed to build poster pack:", err);
    process.exit(1);
  });
