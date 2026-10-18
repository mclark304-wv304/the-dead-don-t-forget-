// ─────────────────────────────────────────────────────────────
// THE DEAD DON'T FORGET — site configuration
// Change prices, products, and keys here. Nothing else needs editing.
// ─────────────────────────────────────────────────────────────

module.exports = {
  siteName: "THE DEAD DON'T FORGET",
  tagline: "Every name has a debt.",
  creator: "Maya Clark",

  // Bump this when CSS/JS/audio change so phones fetch fresh files.
  assetV: "20261018h",

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
  ep10VideoId: "0bRYqq_yflY",

  // Episode 11 premiere: paste the YouTube video ID here when Ep11 is ready
  // and it will appear on the early-access watch page automatically.
  // Example: "dQw4w9WgXcQ"  (leave empty "" until then)
  ep11VideoId: "",

  // Episode 12 premiere: paste the YouTube video ID here when Ep12 is ready
  // and it will appear on the early-access watch page automatically.
  // Example: "dQw4w9WgXcQ"  (leave empty "" until then)
  ep12VideoId: "",

  // Episode 13 premiere: paste the YouTube video ID here when Ep13 is ready
  // and it will appear on the early-access watch page automatically.
  // Example: "dQw4w9WgXcQ"  (leave empty "" until then)
  ep13VideoId: "",

  // Episode 14 premiere: paste the YouTube video ID here when Ep14 is ready
  // and it will appear on the early-access watch page automatically.
  // Example: "dQw4w9WgXcQ"  (leave empty "" until then)
  ep14VideoId: "",

  // Episode 15 premiere: paste the YouTube video ID here when Ep15 is ready
  // and it will appear on the early-access watch page automatically.
  // Example: "dQw4w9WgXcQ"  (leave empty "" until then)
  ep15VideoId: "",

  // Episode 16 premiere: paste the YouTube video ID here when Ep16 is ready
  // and it will appear on the early-access watch page automatically.
  // Example: "dQw4w9WgXcQ"  (leave empty "" until then)
  ep16VideoId: "I6V1EJ8xRzs",

  // Episode 17 premiere: paste the YouTube video ID here when Ep17 is ready
  // and it will appear on the early-access watch page automatically.
  // Example: "dQw4w9WgXcQ"  (leave empty "" until then)
  ep17VideoId: "vMbATeoeDlM",

  // Episode 18 premiere: paste the YouTube video ID here when Ep18 is ready
  // and it will appear on the early-access watch page automatically.
  // Example: "dQw4w9WgXcQ"  (leave empty "" until then)
  ep18VideoId: "xVzdHnLNfes",

  // Episode 22 premiere: paste the YouTube video ID here when Ep22 is ready
  // and it will appear on the early-access watch page automatically.
  // Example: "dQw4w9WgXcQ"  (leave empty "" until then)
  ep22VideoId: "",

  // Episode 19 premiere: paste the YouTube video ID here when Ep19 is ready
  // and it will appear on the early-access watch page automatically.
  // Example: "dQw4w9WgXcQ"  (leave empty "" until then)
  ep19VideoId: "",

  // Episode 20 premiere: paste the YouTube video ID here when Ep20 is ready
  // and it will appear on the early-access watch page automatically.
  // Example: "dQw4w9WgXcQ"  (leave empty "" until then)
  ep20VideoId: "",

  // Episode 21 premiere: paste the YouTube video ID here when Ep21 is ready
  // and it will appear on the early-access watch page automatically.
  // Example: "dQw4w9WgXcQ"  (leave empty "" until then)
  ep21VideoId: "",

  // Episode 24 premiere: paste the YouTube video ID here when Ep24 is ready
  // and it will appear on the early-access watch page automatically.
  // Example: "dQw4w9WgXcQ"  (leave empty "" until then)
  ep24VideoId: "",

  // Episode 25 premiere: paste the YouTube video ID here when Ep25 is ready
  // and it will appear on the early-access watch page automatically.
  // Example: "dQw4w9WgXcQ"  (leave empty "" until then)
  ep25VideoId: "",

  // Series trailer for the homepage hero. Paste the UNLISTED YouTube video
  // ID here once the trailer is uploaded; the hero shows the trailer
  // facade only when this is set. (Upload: series-trailer-hero-16x9.mp4
  // in ~/workspace/dead_dont_forget/ — unlisted, "Maya Clark" channel.)
  seriesTrailerYoutubeId: "FO8kDYSgoME",

  // Locked-card art, keyed by episode number. Applies to current AND future
  // locked entries without editing templates. Falls back to series key art.
  lockedArt: {
    4: '/img/apparitions/elias.jpg',
    5: '/img/apparitions/lena-mercer.jpg',
    6: '/img/apparitions/ruth-mercer.jpg',
    7: '/img/wall/evelyn-shaw.jpg',
    8: '/img/wall/claire.jpg',
    9: '/img/apparitions/jonah-bell.jpg',
    10: '/img/ep1-poster-man-at-the-gate.webp',
    11: '/img/apparitions/mara.jpg',
    12: '/img/wall/marcus.jpg',
    13: '/img/series-key-art.webp',
    14: '/img/ep3-poster-the-ledger.webp',
    15: '/img/wall/daniel-vale.jpg',
    16: '/img/apparitions/elias.jpg',
    17: '/img/series-key-art.webp',
    18: '/img/ep18-the-original.webp',
    19: '/img/ep19-the-woman-in-the-memories.webp',
    20: '/img/ep20-the-witness.webp',
    21: '/img/ep21-the-man-behind-the-glass.webp',
    22: '/img/ep22-the-city-was-breathing.webp',
    24: '/img/ep24-the-name-beneath-the-names.webp',
    25: '/img/ep25-the-last-name.webp'
  },

  // One public teaser Short per episode — tap a locked card to watch it
  // right there. Selling the episode instead of just sitting locked.
  trailers: {
    4: 'PcH5xkFvR2E', 5: 'F4g6VJnG5yI', 6: 'b8B6Xij8Qlc',
    7: 'e8xLf-CPpmE', 8: '_Z-KhrYjUWQ', 9: 'Av44uLMNtuo',
    10: 'C6j-pFsSxHE', 11: 'MmHMqvEO9yM', 12: 'QeEWmtPUGj8',
    13: 'dpBUqfzSsYE', 14: 'oV0-tBmbSUM', 15: 's05AumpJ59w',
    16: 'BxAeDNFyZXY', 17: 'gjIA1rxXuYs', 18: 'w_wvxEsionQ'
  },

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
    },
    {
      n: 11,
      title: "The Woman in the Photograph",
      runtime: "17:12",
      synopsis: "A voice in the stairwell. Three recordings of Daniel. Elena is alive — and she was Subject Zero."
    },
    {
      n: 12,
      title: "Eleven Minutes",
      runtime: "20:26",
      synopsis: "Eleven minutes dead. Twenty minutes until the first wave. The dead are coming for everyone who remembers."
    },
    {
      n: 13,
      title: "The First Wave",
      runtime: "46:24",
      synopsis: "The lights go out. The dead rise together — and the first wave comes for everyone."
    },
    {
      n: 14,
      title: "The Rules of the Vault",
      runtime: "37:12",
      synopsis: "The Vault tests every memory. Forty-three Daniels. A woman's voice through the speaker. The first memory was never lost — it was hidden."
    },
    {
      n: 15,
      title: "The Man Before the Forty-Three",
      runtime: "30:09",
      synopsis: "The original archive. Daniel Vale. Noah remembers four children — but the fourth child's identity was removed."
    },
    {
      n: 16,
      title: "What Belongs to Me",
      runtime: "42:15",
      synopsis: "Miriam Hale is alive — and dead. Forty-five versions of Daniel. A father's recording. The dead march east, toward the first copied memory."
    },
    {
      n: 17,
      title: "The Fourth Door",
      runtime: "27:58",
      synopsis: "The fourth door opens for a verified memory. A container marked ORIGIN. The dead flood the corridor — and the fourth source is closer than Daniel thinks."
    },
    {
      n: 18,
      title: "The Original",
      runtime: "34:48",
      synopsis: "The fourth door opens onto the original. Noah. The first Daniel. Forty-four subjects — and a woman's voice that remembers everything."
    },
    {
      n: 19,
      title: "The Woman in the Memories",
      runtime: "31:06",
      synopsis: "Beneath the Vault: a too-clean corridor, forty-three reconstruction attempts, and a woman's voice warning Daniel not to open the forty-third record."
    },
    {
      n: 20,
      title: "The Witness",
      runtime: "24:19",
      synopsis: "Ruth Mercer has waited nineteen years to testify. The forty-three were never people — and behind the sealed door, someone is breathing."
    },
    {
      n: 21,
      title: "The Man Behind The Glass",
      runtime: "TBD",
      synopsis: "Nathan Cross has been waiting years for Daniel. Attempt Forty-Four was never a person — and Mara is alive."
    },
    {
      n: 22,
      title: "The City Was Breathing",
      runtime: "34:43",
      synopsis: "An abandoned city that breathes. A figure wearing Daniel's face. The original Daniel is in the tower — and Mara's voice on the radio says don't go."
    },
    {
      n: 24,
      title: "The Name Beneath The Names",
      runtime: "37:11",
      synopsis: "The names beneath the names are who remembered them. At the Vale house, Source 45 is counting — and something upstairs knows Daniel's name."
    },
    {
      n: 25,
      title: "The Last Name",
      runtime: "44:56",
      synopsis: "Daniel digs up the box at his childhood home. Mara's recording names Forty-Five — and the last name was buried under his own all along."
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
  // priceCents: 200 = $2.00
  products: {
    "bundle-10": {
      name: "The First Eleven — Bundle",
      tagline: "Episodes 4–14 early access, all in one bundle.",
      priceCents: 2000,
      entitlements: ["ep4-early", "ep5-early", "ep6-early", "ep7-early", "ep8-early", "ep9-early", "ep10-early", "ep11-early", "ep12-early", "ep13-early", "ep14-early"],
      deliveryPath: "/episodes"
    },
    "ep4-early": {
      name: "Episode 4 — Early Access",
      tagline: "Watch Episode 4 here — a website exclusive.",
      priceCents: 200,
      entitlement: "ep4-early",
      deliveryPath: "/watch/ep4"
    },
    "ep5-early": {
      name: "Episode 5 — Early Access",
      tagline: "Watch Episode 5 'The First Memory' here — a website exclusive.",
      priceCents: 200,
      entitlement: "ep5-early",
      deliveryPath: "/watch/ep5"
    },
    "ep6-early": {
      name: "Episode 6 — Early Access",
      tagline: "Watch Episode 6 'What We Keep' here — a website exclusive.",
      priceCents: 200,
      entitlement: "ep6-early",
      deliveryPath: "/watch/ep6"
    },
    "ep7-early": {
      name: "Episode 7 — Early Access",
      tagline: "Watch Episode 7 'The Choice' here — a website exclusive.",
      priceCents: 200,
      entitlement: "ep7-early",
      deliveryPath: "/watch/ep7"
    },
    "ep8-early": {
      name: "Episode 8 — Early Access",
      tagline: "Watch Episode 8 'What Elena Knows' here — a website exclusive.",
      priceCents: 200,
      entitlement: "ep8-early",
      deliveryPath: "/watch/ep8"
    },
    "ep9-early": {
      name: "Episode 9 — Early Access",
      tagline: "Watch Episode 9 'The Road Beneath the City' here — a website exclusive.",
      priceCents: 200,
      entitlement: "ep9-early",
      deliveryPath: "/watch/ep9"
    },
    "ep10-early": {
      name: "Episode 10 — Early Access",
      tagline: "Watch Episode 10 'The Things We Buried' here — a website exclusive.",
      priceCents: 200,
      entitlement: "ep10-early",
      deliveryPath: "/watch/ep10"
    },
    "ep11-early": {
      name: "Episode 11 — Early Access",
      tagline: "Watch Episode 11 'The Woman in the Photograph' here — a website exclusive.",
      priceCents: 200,
      entitlement: "ep11-early",
      deliveryPath: "/watch/ep11"
    },
    "ep12-early": {
      name: "Episode 12 — Early Access",
      tagline: "Watch Episode 12 'Eleven Minutes' here — a website exclusive.",
      priceCents: 200,
      entitlement: "ep12-early",
      deliveryPath: "/watch/ep12"
    },
    "ep13-early": {
      name: "Episode 13 — Early Access",
      tagline: "Watch Episode 13 'The First Wave' here — a website exclusive.",
      priceCents: 200,
      entitlement: "ep13-early",
      deliveryPath: "/watch/ep13"
    },
    "ep14-early": {
      name: "Episode 14 — Early Access",
      tagline: "Watch Episode 14 'The Rules of the Vault' here — a website exclusive.",
      priceCents: 200,
      entitlement: "ep14-early",
      deliveryPath: "/watch/ep14"
    },
    "ep15-early": {
      name: "Episode 15 — Early Access",
      tagline: "Watch Episode 15 'The Man Before the Forty-Three' here — a website exclusive.",
      priceCents: 200,
      entitlement: "ep15-early",
      deliveryPath: "/watch/ep15"
    },
    "ep16-early": {
      name: "Episode 16 — Early Access",
      tagline: "Watch Episode 16 'What Belongs to Me' here — a website exclusive.",
      priceCents: 200,
      entitlement: "ep16-early",
      deliveryPath: "/watch/ep16"
    },
    "ep17-early": {
      name: "Episode 17 — Early Access",
      tagline: "Watch Episode 17 'The Fourth Door' here — a website exclusive.",
      priceCents: 200,
      entitlement: "ep17-early",
      deliveryPath: "/watch/ep17"
    },
    "ep18-early": {
      name: "Episode 18 — Early Access",
      tagline: "Watch Episode 18 'The Original' here — a website exclusive.",
      priceCents: 200,
      entitlement: "ep18-early",
      deliveryPath: "/watch/ep18"
    },
    "ep19-early": {
      name: "Episode 19 — Early Access",
      tagline: "Watch Episode 19 'The Woman in the Memories' here — a website exclusive.",
      priceCents: 200,
      entitlement: "ep19-early",
      deliveryPath: "/watch/ep19"
    },
    "ep20-early": {
      name: "Episode 20 — Early Access",
      tagline: "Watch Episode 20 'The Witness' here — a website exclusive.",
      priceCents: 200,
      entitlement: "ep20-early",
      deliveryPath: "/watch/ep20"
    },
    "ep21-early": {
      name: "Episode 21 — Early Access",
      tagline: "Watch Episode 21 'The Man Behind The Glass' here — a website exclusive.",
      priceCents: 200,
      entitlement: "ep21-early",
      deliveryPath: "/watch/ep21"
    },
    "ep22-early": {
      name: "Episode 22 — Early Access",
      tagline: "Watch Episode 22 'The City Was Breathing' here — a website exclusive.",
      priceCents: 200,
      entitlement: "ep22-early",
      deliveryPath: "/watch/ep22"
    },
    "ep24-early": {
      name: "Episode 24 — Early Access",
      tagline: "Watch Episode 24 'The Name Beneath The Names' here — a website exclusive.",
      priceCents: 200,
      entitlement: "ep24-early",
      deliveryPath: "/watch/ep24"
    },
    "ep25-early": {
      name: "Episode 25 — Early Access",
      tagline: "Watch Episode 25 'The Last Name' here — a website exclusive.",
      priceCents: 200,
      entitlement: "ep25-early",
      deliveryPath: "/watch/ep25"
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

  // Beating all 13 doors of THE THIRTEEN DOORS grants free Episode 7
  // Early Access to the first this many finishers. Enforced server-side
  // (SQLite); browsers also keep a localStorage flag as a courtesy.
  gameEggMaxClaims: 100,
  profileEggMaxClaims: 20,

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
