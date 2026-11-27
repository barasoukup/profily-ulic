// The blind judging of this A/B (as ../packages.mjs, but the two variants may be cut at different places of the same street,
// so each profile has the orthophoto of its own place): X and Y in a random order (a fixed seed), without sources. Writes
// ../data/<package>-<k>/ (at most 12 cuts a package, one judge each) and results/klic-<package>.json.
//   node evaluation/archive/unification/praha/packages.mjs <package> <seed> <results.json> … (BASE=Z: against no rules)
// A cut is judged where the profiles differ in their parts, or in a width by 0.4 m or more.
import fs from "node:fs/promises";
import path from "node:path";
import { orthoImage } from "../../../universal/ortho.mjs";
const ROOT = path.dirname(new URL(import.meta.url).pathname), UP = path.join(ROOT, "..");
const [name, s0, ...files] = process.argv.slice(2);
const BASE = process.env.BASE || "O"; // O: as it was; Z: with none of the rules (Prague's old behaviour)
let seed = Number(s0);
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const fotky = JSON.parse(await fs.readFile(path.join(UP, "results", "fotky-osy.json"), "utf8").catch(() => "{}"));
export const differs = (a, b) => {
  if (!a?.segments || !b?.segments) return false;
  const A = a.segments.map(([t]) => t).join(), W = (x) => x.segments.map((s) => s[1]);
  if (A !== b.segments.map(([t]) => t).join()) return true;
  return W(a).some((w, i) => Math.abs(w - W(b)[i]) >= 0.4);
};
const same = (a, b) => !differs(a, b);
const todo = [];
for (const f of files) for (const r of JSON.parse(await fs.readFile(path.join(ROOT, "results", f + ".json"), "utf8"))) if (differs(r[BASE], r.N)) todo.push({ ...r, O: r[BASE], noise: r.O2 && !same(r.O, r.O2) });
for (let i = todo.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [todo[i], todo[j]] = [todo[j], todo[i]]; }
const parts = (p) => p.segments.map(([t, w]) => `${t} ${String(w).replace(".", ",")}`).join(" · ");
const key = {};
const PER = 12;
for (let k = 0; k * PER < todo.length; k++) {
  const dir = path.join(UP, "data", `${name}-${k + 1}`);
  await fs.mkdir(dir, { recursive: true });
  const L = [`# Slepé posouzení (${name}-${k + 1})`, "", "Uživatel klikl na ulici a dostal profil. Dvě varianty aplikace (X, Y) mohly ulici říznout o pár metrů vedle.",
    "U každého řezu: ortofoto `<n>-X.jpg` a `<n>-Y.jpg` (místo řezu dané varianty; ulice nahoru, A vlevo, B vpravo, 10 px = 1 m, žlutá čárkovaná čára je řez),",
    "fotky z ulice `<n>-f.jpg` (dívá se nahoru v ortofotu, A vlevo) a `<n>-b.jpg` (opačně, A vpravo), pokud jsou. Profil jde od A do B (díly, šířky v m).",
    "Který profil lépe popisuje tuhle ulici (skladba, pak šířky)? Řez ústím vjezdu, boční ulice nebo křižovatky ulici nepopisuje; profil má ale také sedět na svém ortofotu.",
    "Odpověď u každého: X / Y / stejně / nejde, jistota (vysoká, střední, nízká), krátký důvod.", ""];
  let n = 0;
  for (const r of todo.slice(k * PER, (k + 1) * PER)) {
    n++;
    const swap = rnd() < 0.5, V = { X: swap ? r.N : r.O, Y: swap ? r.O : r.N };
    key[`${name}-${k + 1}/${n}`] = { id: r.id, X: swap ? "N" : "O", Y: swap ? "O" : "N", noise: r.noise };
    const half = Math.min(40, Math.max(15, Math.ceil(Math.max(...["X", "Y"].flatMap((q) => [V[q].span?.left || 0, V[q].span?.right || 0])) + 4)));
    for (const q of ["X", "Y"]) try { await orthoImage({ lat: V[q].lat, lon: V[q].lon, bearing: V[q].bearing, country: V[q].country || "CZ", half }, path.join(dir, `${n}-${q}.jpg`)); } catch (e) { console.warn(r.id, e.message); }
    for (const f of fotky[r.id] || []) await fs.copyFile(path.join(UP, "data", "foto-osy", `${r.id}-${f.k}.jpg`), path.join(dir, `${n}-${f.k}.jpg`)).catch(() => {});
    L.push(`## ${n}`, `- ulice: ${r.N.name || "(bez jména)"}; šířka obrázku ${2 * half} m; fotky: ${(fotky[r.id] || []).map((f) => `${f.k} ${f.year}${f.pano ? " panorama" : ""}`).join(", ") || "žádné"}`,
      ...["X", "Y"].map((q) => `- ${q} (od středu A ${V[q].span?.left} m, B ${V[q].span?.right} m): ${parts(V[q])}`), "");
  }
  await fs.writeFile(path.join(dir, "ZADANI.md"), L.join("\n"));
}
await fs.writeFile(path.join(ROOT, "results", `klic-${name}.json`), JSON.stringify(key, null, 1));
console.log(todo.length, "k posouzení", Object.values(key).filter((x) => x.noise).length, "šum O/O2");
