// Part 2: which cuts differ between today's code (N) and each switch off, per group. node zmeny.mjs [file]
import fs from "node:fs";
const rows = JSON.parse(fs.readFileSync(new URL(process.argv[2] || "vysledky/nove.json", import.meta.url)));
const ks = process.argv[3]?.split(",") || ["mapfill", "lawlanes", "parkshare", "osaroad", "pocetpruhu", "widereach", "O"];
export const key = (c) => (c?.segments || []).map(([t, w]) => `${t} ${w}`).join(" · ");
const G = {};
for (const r of rows) (G[r.group || r.id.split("-").slice(1, 3).join("-").toUpperCase()] ||= []).push(r);
for (const [g, R] of Object.entries(G)) {
  const ok = R.filter((r) => r.N?.segments?.length);
  console.log(`${g}: ${ok.length} řezů, chyb ${R.length - ok.length}; ` + ks.map((k) => `${k} ${ok.filter((r) => r[k]?.segments && key(r[k]) !== key(r.N)).length}`).join(", "));
}
for (const r of rows) for (const k of ks) if (r.N?.segments && r[k]?.segments && key(r[k]) !== key(r.N) && k !== "O") console.log(`${r.id} ${r.N.name} [${k}] ${JSON.stringify(r.N.sources)}\n   bez: ${key(r[k])}\n   N:   ${key(r.N)}`);
