// Turso cloud database — persistent storage that survives Render's ephemeral disk.
// Used for traffic logs (pageviews). Falls back gracefully when not configured.
const { createClient } = require("@libsql/client");

const TURSO_URL = process.env.TURSO_URL;
const TURSO_TOKEN = process.env.TURSO_AUTH_TOKEN;

let client = null;
if (TURSO_URL && TURSO_TOKEN) {
  try {
    client = createClient({ url: TURSO_URL, authToken: TURSO_TOKEN });
  } catch (e) {
    console.error("Turso client init failed:", e.message);
    client = null;
  }
}

const enabled = () => !!client;

async function init() {
  if (!client) return;
  await client.execute(`
    CREATE TABLE IF NOT EXISTS pageviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      path TEXT NOT NULL,
      day TEXT NOT NULL,
      visitor_hash TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);
  await client.execute(`CREATE INDEX IF NOT EXISTS idx_pageviews_day ON pageviews(day)`);
  await client.execute(`CREATE INDEX IF NOT EXISTS idx_pageviews_path_day ON pageviews(path, day)`);
}

// Fire-and-forget: never block a request on analytics.
function trackPageview(path, day, visitorHash) {
  if (!client) return;
  client.execute({
    sql: "INSERT INTO pageviews (path, day, visitor_hash) VALUES (?, ?, ?)",
    args: [path, day, visitorHash]
  }).catch(() => {});
}

async function getTraffic() {
  if (!client) return null;
  const days = await client.execute(`
    SELECT day, COUNT(*) AS views, COUNT(DISTINCT visitor_hash) AS visitors
    FROM pageviews GROUP BY day ORDER BY day DESC LIMIT 30
  `);
  const pages = await client.execute(`
    SELECT path, COUNT(*) AS views, COUNT(DISTINCT visitor_hash) AS visitors
    FROM pageviews WHERE day >= date('now', '-30 days')
    GROUP BY path ORDER BY views DESC LIMIT 20
  `);
  const totals = await client.execute(`
    SELECT COUNT(*) AS views, COUNT(DISTINCT day || visitor_hash) AS visitors
    FROM pageviews WHERE day >= date('now', '-30 days')
  `);
  return {
    days: days.rows,
    pages: pages.rows,
    totals: totals.rows[0] || { views: 0, visitors: 0 }
  };
}

module.exports = { enabled, init, trackPageview, getTraffic };
