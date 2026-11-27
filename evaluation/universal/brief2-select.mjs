// The judges' instruction made precise (BRIEF.md, 25. 11. 2026, Bára): every part of about 0.5 m and more, the grass and
// tree strips between the sidewalk and the kerb, parking wherever the kerb is a parking lane, not only where a car stands.
// Its test on European cuts already judged by the old instruction: about 40 judged cuts with a street-level photo, mixed
// states (CZ, DE, NL, PL, FI, DK, AT), about half of them where the app has a green strip at the kerb; their orthophoto
// and photos (the same the old judges had, from the worktrees of the states) copied into blind packages for new judges,
// with BRIEF.md and nothing of the app or the old judgement. Writes results/brief2/sample.json.
//   node evaluation/universal/brief2-select.mjs
import fs from "node:fs/promises";
import path from "node:path";
import { asClasses } from "./compare.mjs";

const ROOT = path.dirname(new URL(import.meta.url).pathname), DATA = path.join(ROOT, "data"), WT = path.join(ROOT, "..", "..", "..");
// The folders where the images of the judged cuts are kept (git ignores them; each state was judged in its worktree).
const IMG = [DATA, ...["netherlands", "poland", "slovensko", "switzerland"].map((w) => path.join(WT, w, "evaluation", "universal", "data"))];
const app = new Map();
for (const f of (await fs.readdir(DATA)).filter((f) => /^app(-[a-z-]+)?\.json$/.test(f)).sort((a, b) => (a === "app.json" ? -1 : b === "app.json" ? 1 : a.localeCompare(b)))) for (const r of JSON.parse(await fs.readFile(path.join(DATA, f), "utf8"))) app.set(r.id, r);
for (const f of (await fs.readdir(path.join(ROOT, "results"))).filter((f) => /^sluzebni-[a-z]+\.json$/.test(f))) for (const r of JSON.parse(await fs.readFile(path.join(ROOT, "results", f), "utf8"))) if (app.has(r.id) && r.service) app.get(r.id).service ??= r.service;
const LANE = ["pruh", "pruh_piktokoridor", "obsluzna", "bus", "bus_cyklo", "tramvaj_v_pruhu"];
const judged = (await Promise.all((await fs.readdir(path.join(ROOT, "results"))).filter((f) => /^u-.*\.jsonl$/.test(f)).map((f) => fs.readFile(path.join(ROOT, "results", f), "utf8"))))
  .join("\n").split("\n").filter(Boolean).map((l) => JSON.parse(l)).filter((j) => j.usable && app.get(j.id)?.parts?.length && !["driveway", "parking_aisle", "drive-through"].includes(app.get(j.id).service))
  .filter((j) => [...app.get(j.id).parts.map((p) => p[0]), ...j.parts.map((p) => String(p[0]).replace("?", ""))].some((t) => LANE.includes(t)));
const find = async (name) => { for (const d of IMG) { const p = path.join(d, name); if (await fs.stat(p).catch(() => null)) return p; } return null; };
// A green strip at the kerb in the app's profile: green or trees between a sidewalk and parking or a lane.
const strip = (r) => { const c = asClasses(r.parts).map(([x]) => x); return c.some((x, i) => (x === "zelen" || x === "stromy") && i > 0 && i < c.length - 1 && ((c[i - 1] === "chodnik" && ["stani", "pruh"].includes(c[i + 1])) || (c[i + 1] === "chodnik" && ["stani", "pruh"].includes(c[i - 1])))); };
let seed = 20261125;
const rnd = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);
const WANT = { CZ: 6, DE: 7, NL: 7, PL: 6, FI: 6, DK: 6, AT: 4 };
const out = [];
for (const [cc, n] of Object.entries(WANT)) {
  const pool = [];
  for (const j of judged.filter((j) => app.get(j.id).country === cc)) {
    const ortho = await find(`${j.id}-ortho.jpg`), f = await find(`${j.id}-f.jpg`), b = await find(`${j.id}-b.jpg`), txt = await find(`${j.id}.txt`);
    if (ortho && txt && (f || b)) pool.push({ id: j.id, country: cc, strip: strip(app.get(j.id)), files: { ortho, txt, f, b }, k: rnd() });
  }
  pool.sort((a, b) => a.k - b.k);
  const withStrip = pool.filter((p) => p.strip).slice(0, Math.ceil(n / 2)), rest = pool.filter((p) => !withStrip.includes(p)).slice(0, n - withStrip.length);
  console.error(`${cc}: s fotkou ${pool.length}, s pásem ${pool.filter((p) => p.strip).length}, vybráno ${withStrip.length} + ${rest.length}`);
  out.push(...withStrip, ...rest);
}
// Packages of about 10 cuts, the states mixed, each for its own judge.
out.sort((a, b) => a.k - b.k);
const PKG = 4, pkgDir = (k) => path.join(DATA, "brief2", `eu-${k + 1}`);
for (let k = 0; k < PKG; k++) await fs.mkdir(path.join(pkgDir(k), "data"), { recursive: true });
for (const [i, s] of out.entries()) {
  s.pkg = `eu-${(i % PKG) + 1}`;
  for (const [kind, src] of Object.entries(s.files)) if (src) await fs.copyFile(src, path.join(pkgDir(i % PKG), "data", kind === "txt" ? `${s.id}.txt` : `${s.id}-${kind}.jpg`));
}
for (let k = 0; k < PKG; k++) await fs.copyFile(path.join(ROOT, "BRIEF.md"), path.join(pkgDir(k), "BRIEF.md"));
await fs.writeFile(path.join(ROOT, "results", "brief2", "sample.json"), JSON.stringify(out.map(({ id, country, strip, pkg }) => ({ id, country, strip, pkg })), null, 1));
console.error("vybráno", out.length);
