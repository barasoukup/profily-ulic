// The blind judging of the second A/B (the hostile review of 24. 11. 2026, bod 3): for each cut where A and B differ,
// the orthophoto of the cut without any line of the app (evaluation/universal/ortho.mjs: the street up, A on the left,
// 10 px = 1 m), the street photos (fotky.mjs) and the two profiles as X and Y in a random order (a fixed seed), without
// their sources (the register's "pasport" would tell B). The cuts in a random order too. Writes data/slepe/<n>-ortho.jpg,
// data/slepe/ZADANI.md and the key vysledky/klic.json (not to be read before the judging is done).
//   node evaluation/finland/ab2/baliky.mjs
import fs from "node:fs/promises";
import path from "node:path";
import { orthoImage } from "../../universal/ortho.mjs";
const ROOT = path.dirname(new URL(import.meta.url).pathname);
const rows = JSON.parse(await fs.readFile(path.join(ROOT, "vysledky", "rezy.json"), "utf8"));
const fotky = JSON.parse(await fs.readFile(path.join(ROOT, "vysledky", "fotky.json"), "utf8"));
let seed = 424242;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const parts = (p) => (p?.segments || []).map(([t, w]) => `${t} ${String(w).replace(".", ",")}`).join(" · ");
const differs = (r) => r.A?.segments && r.B?.segments && parts(r.A) !== parts(r.B);
// Only streets for cars (the review: the first A/B won mainly on paths); paths and service roads are counted, not judged.
export const CAR = new Set(["residential", "tertiary", "secondary", "primary", "unclassified", "living_street", "trunk", "primary_link", "secondary_link", "tertiary_link", "trunk_link", "motorway"]);
const todo = rows.filter((r) => r.group !== "control" && CAR.has(r.highway) && differs(r));
for (let i = todo.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [todo[i], todo[j]] = [todo[j], todo[i]]; }
const dir = path.join(ROOT, "data", "slepe");
await fs.mkdir(dir, { recursive: true });
const key = {}, lines = ["# Slepé posouzení (A/B YLRE 2)", "", "U každého řezu: ortofoto `<n>-ortho.jpg` (ulice nahoru, A vlevo, B vpravo, 10 px = 1 m, žlutá čárkovaná čára je řez),", "fotky `<n>-f.jpg` (dívá se nahoru v ortofotu, A vlevo) a `<n>-b.jpg` (opačně, A vpravo), pokud jsou.", "Dva profily X a Y od A do B (díly a šířky v m). Který lépe odpovídá skutečnosti (složení, pak šířky)?", "Odpověď: X / Y / stejně / nejde, s krátkým důvodem.", ""];
let n = 0;
for (const r of todo) {
  n++;
  const swap = rnd() < 0.5, X = swap ? r.B : r.A, Y = swap ? r.A : r.B;
  key[n] = { id: r.id, X: swap ? "B" : "A", Y: swap ? "A" : "B" };
  const half = Math.min(40, Math.max(15, Math.ceil(Math.max(r.A.span?.left || 0, r.A.span?.right || 0, r.B.span?.left || 0, r.B.span?.right || 0) + 4)));
  try { await orthoImage({ lat: r.B.lat, lon: r.B.lon, bearing: r.B.bearing, country: "FI", half }, path.join(dir, `${n}-ortho.jpg`)); } catch (e) { console.warn(r.id, e.message); }
  for (const f of fotky[r.id] || []) await fs.copyFile(path.join(ROOT, "data", "foto", `${r.id}-${f.k}.jpg`), path.join(dir, `${n}-${f.k}.jpg`));
  lines.push(`## ${n}`, `- ulice: ${r.B.name || "(bez jména)"}; šířka obrázku ${2 * half} m; fotky: ${(fotky[r.id] || []).map((f) => `${f.k} ${f.year}${f.pano ? " panorama" : ""}`).join(", ") || "žádné"}`,
    `- rozpětí X: A ${X.span?.left} m, B ${X.span?.right} m; Y: A ${Y.span?.left} m, B ${Y.span?.right} m (od středu řezu)`,
    `- X: ${parts(X)}`, `- Y: ${parts(Y)}`, "");
}
await fs.writeFile(path.join(dir, "ZADANI.md"), lines.join("\n"));
await fs.writeFile(path.join(ROOT, "vysledky", "klic.json"), JSON.stringify(key, null, 1));
console.log(n, "řezů k posouzení");
