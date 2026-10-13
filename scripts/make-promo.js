#!/usr/bin/env node
// Create promo "soul link" free-pass codes:
//   node scripts/make-promo.js --count 5 --max 1 --entitlements all-access --label "soul link"
// Saves each code to data/promos.json and prints the shareable URLs.
// Codes are unguessable 16-char alphanumeric strings.
// "all-access" is the master entitlement: it unlocks every gated watch page,
// current and future (see requireEntitlement in server.js). Entitlements that
// don't exist in config.products yet (e.g. future episodes) are also allowed
// with a warning — the cookie carries them and the watch pages unlock
// automatically once they go live.
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const config = require("../config");

function arg(name, def) {
  const i = process.argv.indexOf(`--${name}`);
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : def;
}

const entitlements = (arg("entitlements", "") || "").split(",").map(s => s.trim()).filter(Boolean);
const max = parseInt(arg("max", "1"), 10);
const count = parseInt(arg("count", "1"), 10);
const labelBase = arg("label", "");

if (!entitlements.length) {
  console.error("error: --entitlements is required (comma-separated entitlement strings, or \"all-access\")");
  process.exit(1);
}
if (!Number.isInteger(max) || max < 1) {
  console.error("error: --max must be a positive integer");
  process.exit(1);
}
if (!Number.isInteger(count) || count < 1) {
  console.error("error: --count must be a positive integer");
  process.exit(1);
}

const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
function makeCode() {
  const bytes = crypto.randomBytes(16);
  let code = "";
  for (const b of bytes) code += alphabet[b % alphabet.length];
  return code;
}

const known = new Set(Object.values(config.products).map(p => p.entitlement));
known.add("all-access");
const unknown = entitlements.filter(e => !known.has(e));
if (unknown.length) {
  console.warn(`warning: unknown entitlement(s) not in config.products (still granted): ${unknown.join(", ")}`);
}

const promosFile = path.join(__dirname, "..", "data", "promos.json");
let promos = {};
try {
  promos = JSON.parse(fs.readFileSync(promosFile, "utf8"));
} catch {
  // No file yet — start fresh.
}
fs.mkdirSync(path.dirname(promosFile), { recursive: true });
const base = (config.baseUrl || "http://localhost:3000").replace(/\/$/, "");

const made = [];
for (let i = 0; i < count; i++) {
  let code = makeCode();
  while (promos[code]) code = makeCode(); // avoid the astronomically unlikely collision
  const label = count > 1 && labelBase ? `${labelBase} ${i + 1}` : labelBase;
  promos[code] = {
    entitlements,
    maxClaims: max,
    claims: 0,
    label,
    created: new Date().toISOString()
  };
  made.push({ code, label });
}
// Single atomic write for the whole batch.
const tmp = promosFile + ".tmp";
fs.writeFileSync(tmp, JSON.stringify(promos, null, 2));
fs.renameSync(tmp, promosFile);

console.log("");
for (const m of made) {
  console.log(`Soul link${m.label ? ` (${m.label})` : ""}: ${base}/promo/${m.code}`);
}
console.log(`\n${made.length} code(s) saved | passes each: ${max} | entitlements: ${entitlements.join(", ")}\n`);
