// The table of the base maps by state (step 4 of docs/code-health-plan.md): do the tiles of each state's maps come, and does
// the credit match the state?
//   node evaluation/replay/layers.mjs points   → layers-points.json (a point of each state from the samples)
//   node evaluation/replay/layers.mjs          → layers.md from data/replay/out/layers/1.json (the run of layers.js)
// The run: node evaluation/replay/server.mjs 5190, then http://localhost:5190/?layers=1&lang=cs in a browser (about 8 minutes;
// ?only=DE,CH takes some points, &pause=<ms> the pause between layers). Live: each layer's server is asked for a few tiles.
import fs from "node:fs";
import { OUT } from "./paths.mjs";

const HERE = new URL(".", import.meta.url);
const read = (f) => JSON.parse(fs.readFileSync(new URL(f, HERE), "utf8"));
if (process.argv[2] === "points") {
  const states = read("sample-states.json"), pts = [];
  const take = (id, p) => pts.push({ id, town: p.town, lat: p.lat, lon: p.lon });
  take("CZ", read("sample-cz.json")[0]);
  const s = read("sample.json");
  take("CZ-Praha", s.find((p) => p.town === "praha")); take("CZ-Brno", s.find((p) => p.town === "brno"));
  take("SK", s.find((p) => p.town === "bratislava")); take("AT", s.find((p) => p.town === "wien"));
  for (const c of [...new Set(states.map((p) => p.country))]) take(c, states.find((p) => p.country === c));
  fs.writeFileSync(new URL("layers-points.json", HERE), JSON.stringify(pts).replace(/\},\{/g, "},\n{") + "\n");
  console.log(pts.length, "bodů");
  process.exit(0);
}

const run = JSON.parse(fs.readFileSync(`${OUT}/layers/1.json`, "utf8"));
const cell = (m) => {
  if (!m) return "–";
  const bad = m.err + (m.empty || 0);
  const x = m.n === m.blank ? (m.n ? "mimo oblast" : "žádné dlaždice") : `${m.ok}/${m.n - m.blank}${m.err ? `, ${m.err} chyb` : ""}${m.empty ? `, ${m.empty} prázdných` : ""}`;
  return bad ? `**${x}**` : x;
};
const names = [...new Set(run.rows.flatMap((r) => Object.keys(r.layers)))];
const L = [];
L.push("# Podkladové vrstvy podle států", "",
  `Vygenerováno \`node evaluation/replay/layers.mjs\` z běhu \`layers.js\` (jazyk ${run.lang}): pro bod každého státu se otevře každá podkladová vrstva z menu mapy`,
  "(mapa 300 × 300 px, přiblížení 18) a spočítají se dlaždice. Buňka: `načteno/požadováno` (bez prázdných `data:` dlaždic, které vrstva omezená na svou oblast vrací mimo ni);",
  "tučně = chyba nebo prázdná dlaždice; „mimo oblast“ = vrstva tu nic nekreslí (není pro tenhle stát). Poslední sloupce: kredit ortofota a mapy, jak ho mapa ukazuje, a porušení CSP.", "",
  `| Stát (bod) | ${names.map((n) => n.replace(/^\+/, "+ ")).join(" | ")} | Kredit Ortofoto | Kredit Mapa | CSP |`, `|---|${names.map(() => "---|").join("")}---|---|---|`);
for (const r of run.rows) {
  const o = Object.values(r.layers)[1], m = Object.values(r.layers)[0];
  L.push(`| ${r.id} (${r.town}) | ${names.map((n) => cell(r.layers[n])).join(" | ")} | ${o?.credit || "–"} | ${m?.credit || "–"} | ${r.violations.length ? "**" + r.violations.join(", ") + "**" : "ok"} |`);
}
L.push("", "Prázdná dlaždice = celá jednobarevná (bílá nebo průhledná); `null` v měření (cizí původ bez CORS) se nepočítá.");
fs.writeFileSync(new URL("layers.md", HERE), L.join("\n") + "\n");
console.log(`layers.md: ${run.rows.length} bodů, ${names.length} vrstev`);
