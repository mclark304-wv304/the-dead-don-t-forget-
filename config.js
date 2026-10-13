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
