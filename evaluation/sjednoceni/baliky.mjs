// The blind judging of an A/B of the unification (as ../mapfill-cz/baliky.mjs): for each cut where the two variants differ, the
// orthophoto of the cut without any line of the app (evaluation/universal/ortho.mjs: the street up, A on the left,
// 10 px = 1 m), the street photos (fotky.mjs) and the two profiles as X and Y in a random order (a fixed seed), without
// their sources ("pasport" would tell the map). The cuts in a random order too. Writes data/<name>/<n>-ortho.jpg,
// data/<name>/ZADANI.md and the key vysledky/klic-<name>.json (not to be read before the judging is done).
//   node evaluation/sjednoceni/baliky.mjs vysledky/<name>.json O N <package> [seed] [ids…]
//   (O: the exception as it was, N: the shared value; ids: only these cuts)
import fs from "node:fs/promises";
import path from "node:path";
import { orthoImage } from "../universal/ortho.mjs";
const ROOT = path.dirname(new URL(import.meta.url).pathname);
const [file, P, Q, name, s0, ...only] = process.argv.slice(2);
const rows = JSON.parse(await fs.readFile(path.join(ROOT, file), "utf8"));
const fotky = JSON.parse(await fs.readFile(path.join(ROOT, "vysledky", "fotky.json"), "utf8").catch(() => "{}"));
let seed = Number(s0) || 424243;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const parts = (p) => (p?.segments || []).map(([t, w]) => `${t} ${String(w).replace(".", ",")}`).join(" · ");
const differs = (r) => r[P]?.segments && r[Q]?.segments && parts(r[P]) !== parts(r[Q]);
const COUNTRY = {};
const todo = rows.filter((r) => differs(r) && (!only.length || only.includes(r.id)));
for (let i = todo.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [todo[i], todo[j]] = [todo[j], todo[i]]; }
const dir = path.join(ROOT, "data", name);
await fs.mkdir(dir, { recursive: true });
const key = {}, lines = [`# Slepé posouzení (${name})`, "", "U každého řezu: ortofoto `<n>-ortho.jpg` (ulice nahoru, A vlevo, B vpravo, 10 px = 1 m, žlutá čárkovaná čára je řez),", "fotky `<n>-f.jpg` (dívá se nahoru v ortofotu, A vlevo) a `<n>-b.jpg` (opačně, A vpravo), pokud jsou.", "Dva profily X a Y od A do B (díly a šířky v m). Který lépe odpovídá skutečnosti (složení, pak šířky)?", "Odpověď: X / Y / stejně / nejde, s krátkým důvodem.", ""];
let n = 0;
for (const r of todo) {
  n++;
  const swap = rnd() < 0.5, X = swap ? r[Q] : r[P], Y = swap ? r[P] : r[Q];
  key[n] = { id: r.id, X: swap ? Q : P, Y: swap ? P : Q };
  const half = Math.min(40, Math.max(15, Math.ceil(Math.max(X.span?.left || 0, X.span?.right || 0, Y.span?.left || 0, Y.span?.right || 0) + 4)));
  const c = r[Q];
  try { await orthoImage({ lat: c.lat, lon: c.lon, bearing: c.bearing, country: c.country || "CZ", half }, path.join(dir, `${n}-ortho.jpg`)); } catch (e) { console.warn(r.id, e.message); }
  for (const f of fotky[r.id] || []) await fs.copyFile(path.join(ROOT, "data", "foto", `${r.id}-${f.k}.jpg`), path.join(dir, `${n}-${f.k}.jpg`));
  lines.push(`## ${n}`, `- ulice: ${c.name || "(bez jména)"}; šířka obrázku ${2 * half} m; fotky: ${(fotky[r.id] || []).map((f) => `${f.k} ${f.year}${f.pano ? " panorama" : ""}`).join(", ") || "žádné"}`,
    `- rozpětí X: A ${X.span?.left} m, B ${X.span?.right} m; Y: A ${Y.span?.left} m, B ${Y.span?.right} m (od středu řezu)`,
    `- X: ${parts(X)}`, `- Y: ${parts(Y)}`, "");
}
await fs.writeFile(path.join(dir, "ZADANI.md"), lines.join("\n"));
await fs.writeFile(path.join(ROOT, "vysledky", `klic-${name}.json`), JSON.stringify(key, null, 1));
console.log(n, "řezů k posouzení");
