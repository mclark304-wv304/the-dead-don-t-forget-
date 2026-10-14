// ─────────────────────────────────────────────────────────────
// THE DEAD DON'T FORGET — site configuration
// Change prices, products, and keys here. Nothing else needs editing.
// ─────────────────────────────────────────────────────────────

module.exports = {
  siteName: "THE DEAD DON'T FORGET",
  tagline: "Every name has a debt.",
  creator: "Maya Clark",

  // Base URL of the deployed site (used for PayPal return URLs).
  // Locally: http://localhost:3000 — in production set the BASE_URL env var.
  baseUrl: process.env.BASE_URL || "http://localhost:3000",
  port: process.env.PORT || 3000,

  // ── PayPal keys ────────────────────────────────────────────
  // Sandbox first: https://developer.paypal.com → Apps & Credentials → create app
  // Go live: create a Live app, swap the credentials, set PAYPAL_MODE=live
  // Set these as environment variables on your host (Render → Environment).
  paypalClientId: process.env.PAYPAL_CLIENT_ID || "PASTE_YOUR_PAYPAL_CLIENT_ID",
  paypalClientSecret: process.env.PAYPAL_CLIENT_SECRET || "PASTE_YOUR_PAYPAL_CLIENT_SECRET",
  paypalMode: process.env.PAYPAL_MODE || "sandbox", // "sandbox" or "live"

  // ── Stripe keys (card payments) ──────────────────────────
  // https://dashboard.stripe.com → Developers → API keys
  // Use "test mode" keys while testing, swap to live keys when going live.
  // Set these as environment variables on your host (Render → Environment).
  stripePublishableKey: process.env.STRIPE_PUBLISHABLE_KEY || "PASTE_YOUR_STRIPE_PUBLISHABLE_KEY",
  stripeSecretKey: process.env.STRIPE_SECRET_KEY || "PASTE_YOUR_STRIPE_SECRET_KEY",

  // Secret used to sign access cookies. Change to a long random string.
  // You can also set the JWT_SECRET env var.
  jwtSecret: process.env.JWT_SECRET || "change-this-to-a-long-random-string-before-going-live",

  // Episode 4 premiere: paste the YouTube video ID here when Ep4 is ready
  // and it will appear on the early-access watch page automatically.
  // Example: "dQw4w9WgXcQ"  (leave empty "" until then)
  ep4VideoId: "VQcFVY8a4tw",

  // Episode 5 premiere: paste the YouTube video ID here when Ep5 is ready
  // and it will appear on the early-access watch page automatically.
  // Example: "dQw4w9WgXcQ"  (leave empty "" until then)
  ep5VideoId: "x5F5mygGxVs",

  // Episode 6 premiere: paste the YouTube video ID here when Ep6 is ready
  // and it will appear on the early-access watch page automatically.
  // Example: "dQw4w9WgXcQ"  (leave empty "" until then)
  ep6VideoId: "D2vwDzioBu4",

  // Episode 7 premiere: paste the YouTube video ID here when Ep7 is ready
  // and it will appear on the early-access watch page automatically.
  // Example: "dQw4w9WgXcQ"  (leave empty "" until then)
  ep7VideoId: "OAVjulr7FKg",

  // Episode 8 premiere: paste the YouTube video ID here when Ep8 is ready
  // and it will appear on the early-access watch page automatically.
  // Example: "dQw4w9WgXcQ"  (leave empty "" until then)
  ep8VideoId: "BVBd2OK-ITw",

  // Episode 9 premiere: paste the YouTube video ID here when Ep9 is ready
  // and it will appear on the early-access watch page automatically.
  // Example: "dQw4w9WgXcQ"  (leave empty "" until then)
  ep9VideoId: "53hiQIxjbdA",

  // Episode 10 premiere: paste the YouTube video ID here when Ep10 is ready
  // and it will appear on the early-access watch page automatically.
  // Example: "dQw4w9WgXcQ"  (leave empty "" until then)
  ep10VideoId: "",

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

  // ── Locked episodes (website-exclusive Early Access) ────
  lockedEpisodes: [
    {
      n: 4,
      title: "The Man That Wasn't There",
      runtime: "12:34",
      synopsis: "A man who was never there. Daniel can't stop remembering him."
    },
    {
      n: 5,
      title: "The First Memory",
      runtime: "22:55",
      synopsis: "Three knocks. A child's voice. The first memory changes everything."
    },
    {
      n: 6,
      title: "What We Keep",
      runtime: "18:59",
      synopsis: "Handprints on the clinic window. The dead keep what the living try to bury."
    },
    {
      n: 7,
      title: "The Choice",
      runtime: "22:01",
      synopsis: "Evelyn's dead sister is back. The warehouse is surrounded. Choose."
    },
    {
      n: 8,
      title: "What Elena Knows",
      runtime: "19:20",
      synopsis: "A cassette tape. A photograph of Elena, alive. A woman at the gate who knows how she died."
    },
    {
      n: 9,
      title: "The Road Beneath the City",
      runtime: "18:16",
      synopsis: "The dead lead them under Columbus. An old hospital. A doctor who chose who would live."
    },
    {
      n: 10,
      title: "The Things We Buried",
      runtime: "18:08",
      synopsis: "Daniel confronts the signature that doomed Elena. Seven underground levels. A photograph taken three days ago — and she may be alive."
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
    "ep5-early": {
      name: "Episode 5 — Early Access",
      tagline: "Watch Episode 5 'The First Memory' here before it hits YouTube.",
      priceCents: 299,
      entitlement: "ep5-early",
      deliveryPath: "/watch/ep5"
    },
    "ep6-early": {
      name: "Episode 6 — Early Access",
      tagline: "Watch Episode 6 'What We Keep' here before it hits YouTube.",
      priceCents: 299,
      entitlement: "ep6-early",
      deliveryPath: "/watch/ep6"
    },
    "ep7-early": {
      name: "Episode 7 — Early Access",
      tagline: "Watch Episode 7 'The Choice' here before it hits YouTube.",
      priceCents: 299,
      entitlement: "ep7-early",
      deliveryPath: "/watch/ep7"
    },
    "ep8-early": {
      name: "Episode 8 — Early Access",
      tagline: "Watch Episode 8 'What Elena Knows' here before it hits YouTube.",
      priceCents: 299,
      entitlement: "ep8-early",
      deliveryPath: "/watch/ep8"
    },
    "ep9-early": {
      name: "Episode 9 — Early Access",
      tagline: "Watch Episode 9 'The Road Beneath the City' here before it hits YouTube.",
      priceCents: 299,
      entitlement: "ep9-early",
      deliveryPath: "/watch/ep9"
    },
    "ep10-early": {
      name: "Episode 10 — Early Access",
      tagline: "Watch Episode 10 'The Things We Buried' here before it hits YouTube.",
      priceCents: 299,
      entitlement: "ep10-early",
      deliveryPath: "/watch/ep10"
    },
    "poster-pack": {
      name: "Official Poster Pack",
      tagline: "All three episode posters in full resolution. Yours to keep.",
      priceCents: 199,
      entitlement: "poster-pack",
      deliveryPath: "/download/posters"
    },
    "complete-scripts": {
      name: "The Complete Scripts",
      tagline: "Every word of Episodes 1–3 in one collectible PDF. Exactly as written.",
      priceCents: 299,
      entitlement: "complete-scripts",
      deliveryPath: "/download/scripts"
    },
    "character-art-pack": {
      name: "Character Art Pack",
      tagline: "10 original dark-horror portraits and wallpapers — Daniel, Elias, Mara and more. Yours to keep.",
      priceCents: 199,
      entitlement: "character-art-pack",
      deliveryPath: "/download/character-art"
    }
  },

  // ── Easter egg: the hidden ELIAS trigger ──────────────────
  // Typing E-L-I-A-S in sequence anywhere on the site opens a whisper
  // modal offering free Episode 4 Early Access. Only this many souls
  // ever get it. The server enforces this cap (SQLite); browsers also
  // remember a claim in localStorage as a courtesy.
  easterEggMaxClaims: 13,

  // ── Free downloads (no payment, no login — public) ────────
  freebies: [
    {
      name: "Episode 1 Script — Free Sample",
      tagline: "The full 'Man at the Gate' script, exactly as written. A free taste of The Complete Scripts.",
      downloadPath: "/free/ep1-script"
    },
    {
      name: "Free Wallpaper — The Gate at Night",
      tagline: "The gate after dark, in full resolution. For your phone or desktop.",
      downloadPath: "/free/wallpaper"
    },
    {
      name: "Free Series Poster",
      tagline: "The official series key art. Print it, frame it, hang it.",
      downloadPath: "/free/poster"
    }
  ]
};
