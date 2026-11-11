// The visitors' reports of badly built cuts (kind "hlaseni", the button "Nahlásit chybu"): newest first, each with
// what it is about, the visitor's text, a link to the cut and the profile the app built there.
// Run from logging/ (wrangler signed in to Bára's account):  node hlaseni.mjs [počet]
import { execFileSync } from "node:child_process";

const limit = Math.max(1, Math.min(500, +process.argv[2] || 50));
const sql = `SELECT ts, city, street, lat, lon, bearing, reach_left, reach_right, profile FROM events WHERE kind='hlaseni' ORDER BY id DESC LIMIT ${limit}`;
const out = execFileSync("npx", ["wrangler", "d1", "execute", "profily-ulic-log", "--remote", "--json", "--command", sql], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
const rows = JSON.parse(out)[0].results;
const short = (p) => (p ? `${p.l || "?"} | ${p.s.map((x) => `${x.t} ${String(x.w).replace(".", ",")}`).join(" | ")} | ${p.r || "?"}` : "–");
for (const r of rows) {
  let p;
  try { p = JSON.parse(r.profile || "{}"); } catch { p = { text: String(r.profile) }; }
  const reach = r.reach_left != null ? `,${(+r.reach_left).toFixed(1)},${(+r.reach_right).toFixed(1)}` : "";
  console.log(`\n${r.ts.slice(0, 16).replace("T", " ")}  ${r.street || "?"} (${r.city})  [${(p.co || []).join(", ") || "bez kategorie"}]`);
  if (r.lat != null) console.log(`  https://barasoukup.github.io/profily-ulic/#rez=${(+r.lat).toFixed(6)},${(+r.lon).toFixed(6)},${Math.round(r.bearing)}${reach}`);
  if (p.text) console.log(`  „${p.text}“`);
  // vypocet: as the app built it on that visit (missing for a restored or loaded profile); stav: as shown then.
  if (p.vypocet) console.log(`  aplikace: ${short(p.vypocet)}`);
  console.log(`  ${p.opraveno ? "po opravě" : "na stránce"}: ${short(p.stav)}`);
}
if (!rows.length) console.log("Zatím žádná hlášení.");
