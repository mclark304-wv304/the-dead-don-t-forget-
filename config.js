// ─────────────────────────────────────────────────────────────
// THE DEAD DON'T FORGET — site configuration
// Change prices, products, and keys here. Nothing else needs editing.
// ─────────────────────────────────────────────────────────────

module.exports = {
  siteName: "THE DEAD DON'T FORGET",
  tagline: "Every name has a debt.",
  creator: "Maya Clark",

  // Base URL of the deployed site (used for Stripe redirect URLs).
  // Locally: http://localhost:3000 — in production set the BASE_URL env var.
  baseUrl: process.env.BASE_URL || "http://localhost:3000",
  port: process.env.PORT || 3000,

  // ── Stripe keys ────────────────────────────────────────────
  // Test mode first: https://dashboard.stripe.com/test/apikeys
  // Go live: flip to live keys from https://dashboard.stripe.com/apikeys
  // You can also set these as environment variables instead of editing here.
  stripeSecretKey: process.env.STRIPE_SECRET_KEY || "PASTE_YOUR_TEST_KEY_HERE",
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET || "PASTE_YOUR_WEBHOOK_SECRET_HERE",

  // Secret used to sign access cookies. Change to a long random string.
  // You can also set the JWT_SECRET env var.
  jwtSecret: process.env.JWT_SECRET || "change-this-to-a-long-random-string-before-going-live",

  // Episode 4 premiere: paste the YouTube video ID here when Ep4 is ready
  // and it will appear on the early-access watch page automatically.
  // Example: "dQw4w9WgXcQ"  (leave empty "" until then)
  ep4VideoId: "",

  pocketFmUrl: "https://pocketfm.com/show/850e2acdfbf37afa82efe1af45a3d32ea6e188f2",

  // ── Free episodes (YouTube stays free) ─────────────────────
  episodes: [
    {
      n: 1,
      title: "The Man at the Gate",
      youtubeId: "11cDEVCyzwg",
      runtime: "15:25",
      poster: "/img/ep1-poster-man-at-the-gate.webp",
      synopsis: "A stranger at the gate. A name on a list. Daniel Vale's past comes calling."
    },
    {
      n: 2,
      title: "The Names On The Wall",
      youtubeId: "71JMELZaoB8",
      runtime: "22:57",
      poster: "/img/series-key-art.webp",
      synopsis: "The dead leave their names where the living can't ignore them."
    },
    {
      n: 3,
      title: "The Ledger",
      youtubeId: "4N6PtA67lBU",
      runtime: "26:11",
      poster: "/img/ep3-poster-the-ledger.webp",
      synopsis: "Daniel's old files surface a name the dead won't let him forget."
    }
  ],

  // ── Teasers / Shorts ───────────────────────────────────────
  shorts: [
    { label: "Episode 1 — Teaser 1", url: "https://www.tiktok.com/@mayaclark04/video/7695838328632954125" },
    { label: "Episode 1 — Teaser 2", url: "https://www.tiktok.com/@mayaclark04/video/7695838759979453710" },
    { label: "Episode 2 — Teaser 1", url: "https://youtube.com/shorts/ALpbnnjjteU" },
    { label: "Episode 2 — Teaser 2", url: "https://youtube.com/shorts/TUbfTmZhVc8" },
    { label: "Episode 3 — Teaser 1", url: "https://youtube.com/shorts/tBW4ZYKOEek" },
    { label: "Episode 3 — Teaser 2", url: "https://youtube.com/shorts/RvmkDPWD0zk" }
  ],

  // ── Paid products (prices in cents — change freely) ────────
  // priceCents: 299 = $2.99
  products: {
    "ep4-early": {
      name: "Episode 4 — Early Access",
      tagline: "Watch Episode 4 here before it hits YouTube.",
      priceCents: 299,
      entitlement: "ep4-early",
      deliveryPath: "/watch/ep4"
    },
    "poster-pack": {
      name: "Official Poster Pack",
      tagline: "All three episode posters in full resolution. Yours to keep.",
      priceCents: 199,
      entitlement: "poster-pack",
      deliveryPath: "/download/posters"
    }
  }
};
