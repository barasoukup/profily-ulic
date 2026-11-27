// As ../measure/packages.mjs. The blind judging: the cuts where two arms differ, from several pairs at once, in a random
// order, X and Y at random, without the parts' sources and without the country's arm names; the parts as the judge's
// classes (BRIEF.md). Writes data/<package>/ and results/klic-<package>.json (not to be read before the judging).
//   node packages.mjs <package> <seed> <file> <ids file: [{ id, P, Q }]>
import fs from "node:fs/promises";
import path from "node:path";
import { orthoImage } from "../../../universal/ortho.mjs";
const ROOT = path.dirname(new URL(import.meta.url).pathname);
const [name, s0, file, list] = process.argv.slice(2);
const rows = new Map(JSON.parse(await fs.readFile(path.join(ROOT, file), "utf8")).map((r) => [r.id, r]));
const todo = JSON.parse(await fs.readFile(path.join(ROOT, list), "utf8"));
const fotky = JSON.parse(await fs.readFile(path.join(ROOT, "results", "fotky.json"), "utf8").catch(() => "{}"));
let seed = Number(s0);
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const parts = (p) => p.segments.map(([t, w]) => `${t} ${String(w).replace(".", ",")}`).join(" · ");
for (let i = todo.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [todo[i], todo[j]] = [todo[j], todo[i]]; }
const dir = path.join(ROOT, "data", name);
await fs.mkdir(dir, { recursive: true });
const key = {}, lines = [`# Slepé posouzení (${name})`, "", "U každého řezu: ortofoto `<n>-ortho.jpg` (ulice nahoru, A vlevo, B vpravo, 10 px = 1 m, značka po 1 m, dlouhá po 5 m; žlutá čárkovaná čára uprostřed je řez),",
  "fotky z ulice `<n>-f.jpg` (dívá se nahoru v ortofotu, A vlevo) a `<n>-b.jpg` (opačně, A vpravo), pokud jsou. Dva profily X a Y od A do B (díly a šířky v m).", "Který lépe odpovídá skutečnosti (nejdřív složení, pak šířky)? Co do profilu patří: `BRIEF.md` (oddíl „Co do profilu patří“).", "Odpověď: X / Y / stejně / nejde, jistota (vysoká, střední, nízká), krátký důvod.", ""];
let n = 0;
for (const { id, P, Q } of todo) {
  n++;
  const r = rows.get(id), swap = rnd() < 0.5, X = swap ? r[Q] : r[P], Y = swap ? r[P] : r[Q], c = r.N;
  key[n] = { id, X: swap ? Q : P, Y: swap ? P : Q };
  const half = Math.min(40, Math.max(15, Math.ceil(Math.max(X.span?.left || 0, X.span?.right || 0, Y.span?.left || 0, Y.span?.right || 0) + 4)));
  try { await orthoImage({ lat: c.lat, lon: c.lon, bearing: c.bearing, country: c.country, half }, path.join(dir, `${n}-ortho.jpg`)); } catch (e) { console.warn(id, e.message); }
  for (const f of fotky[id] || []) await fs.copyFile(path.join(ROOT, "data", "foto", `${id}-${f.k}.jpg`), path.join(dir, `${n}-${f.k}.jpg`));
  lines.push(`## ${n}`, `- ulice: ${c.name || "(bez jména)"}; šířka obrázku ${2 * half} m; fotky: ${(fotky[id] || []).map((f) => `${f.k} ${f.year}${f.pano ? " panorama" : ""}`).join(", ") || "žádné"}`,
    `- rozpětí X: A ${X.span?.left} m, B ${X.span?.right} m; Y: A ${Y.span?.left} m, B ${Y.span?.right} m (od středu řezu)`, `- X: ${parts(X)}`, `- Y: ${parts(Y)}`, "");
}
await fs.writeFile(path.join(dir, "ZADANI.md"), lines.join("\n"));
await fs.copyFile(path.join(ROOT, "..", "..", "..", "universal", "BRIEF.md"), path.join(dir, "BRIEF.md"));
await fs.writeFile(path.join(ROOT, "results", `klic-${name}.json`), JSON.stringify(key, null, 1));
console.log(n, "řezů k posouzení");
