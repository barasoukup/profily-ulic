// Review image of a cut computed twice by compare_dmvs.mjs: the orthophoto turned so the profile runs
// left → right, the city's profile as a band above the cut line (A) and the DMVS profile below it (B),
// segment boundaries as ticks, and both profiles as bars with tables. The orthophoto is the one run_brno.mjs
// (Prague: run.mjs, ortho_fix) saved around that run's cut; the shift to the new cut is taken into account.
//   CITY=most node evaluation/render_dmvs.mjs [n …]   (no n: every cut where the two differ)
//   then: for f in evaluation/most/data/dmvs-png/*.svg; do qlmanage -t -s 1100 -o evaluation/most/data/dmvs-png "$f"; done
import fs from "node:fs/promises";
import path from "node:path";
const CITY = process.env.CITY || "brno";
const PRAHA = CITY === "praha";
globalThis.PROFILY_CITY = CITY;
const { TYPES } = await import("../pilot/public/types.js");

const ROOT = path.dirname(new URL(import.meta.url).pathname);
const DATA = PRAHA ? path.join(ROOT, "praha", "data") : path.join(ROOT, CITY, "data");
const OLD = PRAHA ? path.join(ROOT, "data", "results_fix") : path.join(DATA, "results");
const ORTHO = PRAHA ? path.join(ROOT, "data", "ortho_fix") : path.join(DATA, "ortho");
const PX_M = 10, BOX = 640, SIZE = 1100;
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const ARROW = { forward: "↑", backward: "↓" };

async function tilesOf(n, cut) {
  let tiles, dir;
  if (PRAHA) { tiles = [{ file: `${n}.jpg`, e: -40, n: 40, size: 80 }]; dir = ORTHO; }
  else { dir = path.join(ORTHO, String(n)); tiles = JSON.parse(await fs.readFile(path.join(dir, "tiles.json"), "utf8")); }
  // The orthophoto's centre is the cut of the earlier run: shift it to this cut.
  let de = 0, dn = 0;
  try {
    const old = JSON.parse(await fs.readFile(path.join(OLD, `${n}.json`), "utf8")).cut;
    de = (old.lon - cut.lon) * 111320 * Math.cos((cut.lat * Math.PI) / 180);
    dn = (old.lat - cut.lat) * 110574;
  } catch {}
  return (await Promise.all(tiles.map(async (t) => {
    const b64 = (await fs.readFile(path.join(dir, t.file))).toString("base64");
    return `<image x="${(t.e + de) * PX_M}" y="${-(t.n + dn) * PX_M}" width="${t.size * PX_M + 0.5}" height="${t.size * PX_M + 0.5}" href="data:image/jpeg;base64,${b64}"/>`;
  }))).join("");
}

function profile(p, c, y, label, X) {
  const total = p.segments.reduce((a, s) => a + s.width, 0);
  const [, tL] = p.extent || [-total / 2, total / 2];
  let u = -tL;
  const bounds = [u];
  const bands = p.segments.map((s) => {
    const x0 = X(u); u += s.width; bounds.push(u);
    return `<rect x="${x0}" y="${y - 10}" width="${s.width * PX_M}" height="20" fill="${TYPES[s.type]?.color || "#f0f"}" opacity="0.6"/>`;
  }).join("");
  const dy = y < c ? -1 : 1;
  const ticks = bounds.map((v) => `<line x1="${X(v)}" x2="${X(v)}" y1="${c}" y2="${y + dy * 22}" stroke="${y < c ? "#ff2" : "#f6f"}" stroke-width="2"/>`).join("");
  const axis = `<line x1="${X(-p.axisT)}" x2="${X(-p.axisT)}" y1="${y - 14}" y2="${y + 14}" stroke="#0ff" stroke-width="2" stroke-dasharray="4 3"/>`;
  const tag = `<text x="6" y="${y + 5}" fill="#fff" font-size="14" font-weight="bold" stroke="#000" stroke-width="3" paint-order="stroke">${label}</text>`;
  return bands + ticks + axis + tag;
}

function bar(p, y, W) {
  const total = p.segments.reduce((a, s) => a + s.width, 0);
  let x = 10;
  return p.segments.map((s, i) => {
    const w = (s.width / total) * W;
    const out = `<rect x="${x}" y="${y}" width="${w}" height="26" fill="${TYPES[s.type]?.color}" stroke="#fff"/><text x="${x + w / 2}" y="${y + 18}" font-size="11" text-anchor="middle" fill="#fff" stroke="#000" stroke-width="2" paint-order="stroke">${i + 1}</text>`;
    x += w; return out;
  }).join("");
}

const rows = (p, x, y) => p.segments.map((s, i) => `<text x="${x}" y="${y + i * 15}" font-size="11">${i + 1}. ${esc(TYPES[s.type]?.label || s.type)} ${s.width.toFixed(2)} ${s.dir ? ARROW[s.dir] : ""} · ${esc(s.source)}</text>`).join("");

async function svg(r) {
  const b = (r.cut.bearing * Math.PI) / 180;
  const dir = [Math.sin(b), Math.cos(b)], normal = [-dir[1], dir[0]];
  const theta = (Math.atan2(-normal[1], -normal[0]) * 180) / Math.PI;
  const c = BOX / 2, X = (u) => c + u * PX_M;
  const imgs = await tilesOf(r.sample.n, r.cut);
  const grid = [-30, -20, -10, 0, 10, 20, 30].map((m) => `<text x="${X(m)}" y="${BOX - 6}" fill="#fff" font-size="11" text-anchor="middle" stroke="#000" stroke-width="3" paint-order="stroke">${m}</text>`).join("");
  const A = r.city, B = r.dmvs;
  const m = (p) => p.measures;
  const head = (p, name) => `${name}: vozovka ${m(p).roadway} · chodník ${m(p).sidewalk} · celkem ${m(p).total} · okraje ${esc(m(p).edges.join(" / "))}${m(p).osmEstimate ? " · ODHAD Z OSM" : ""} · ${p.ms} ms`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}" font-family="Helvetica, Arial, sans-serif">
<rect width="${SIZE}" height="${SIZE}" fill="#fff"/>
<defs><clipPath id="o"><rect width="${BOX}" height="${BOX}"/></clipPath></defs>
<g clip-path="url(#o)"><rect width="${BOX}" height="${BOX}" fill="#222"/><g transform="translate(${c} ${c}) rotate(${theta})">${imgs}</g>
<line x1="0" x2="${BOX}" y1="${c}" y2="${c}" stroke="#fff" stroke-width="1" opacity="0.6"/>
${profile(A, c, c - 60, "A město", X)}${profile(B, c, c + 60, "B DMVS", X)}${grid}
<text x="8" y="18" fill="#fff" font-size="13" stroke="#000" stroke-width="3" paint-order="stroke">nahoře A = mapa města (žluté hranice) · dole B = DMVS (fialové) · vlevo začátek profilu</text></g>
<text x="${BOX + 16}" y="26" font-size="16" font-weight="bold">č. ${r.sample.n} ${esc(r.cut.name || "(bez jména)")} · ${esc(r.cut.highway)}</text>
<text x="${BOX + 16}" y="44" font-size="11">${esc(B.region || "")}${B.notice ? " · B: " + esc(B.notice.slice(0, 60)) : ""}</text>
<text x="${BOX + 16}" y="58" font-size="11">${A.notice ? "A: " + esc(A.notice.slice(0, 70)) : ""}</text>
<text x="${BOX + 16}" y="80" font-size="12" font-weight="bold">A město</text>${rows(A, BOX + 16, 96)}
<text x="${BOX + 16}" y="${110 + A.segments.length * 15}" font-size="12" font-weight="bold">B DMVS</text>${rows(B, BOX + 16, 126 + A.segments.length * 15)}
<text x="10" y="${BOX + 22}" font-size="12">${head(A, "A")}</text>${bar(A, BOX + 30, SIZE - 20)}
<text x="10" y="${BOX + 80}" font-size="12">${head(B, "B")}</text>${bar(B, BOX + 88, SIZE - 20)}
</svg>`;
}

const { differs } = { differs: (r) => {
  const a = r.city?.measures, b = r.dmvs?.measures;
  if (!a || !b) return ["chybí"];
  return [Math.abs(a.roadway - b.roadway) > 0.5, Math.abs(a.sidewalk - b.sidewalk) > 0.5, a.edges.join() !== b.edges.join(), a.osmEstimate !== b.osmEstimate].some(Boolean) ? ["x"] : [];
} };
const want = process.argv.slice(2).map(Number);
const files = (await fs.readdir(path.join(DATA, "dmvs"))).filter((f) => /^\d+\.json$/.test(f));
await fs.mkdir(path.join(DATA, "dmvs-png"), { recursive: true });
let done = 0;
for (const f of files) {
  const r = JSON.parse(await fs.readFile(path.join(DATA, "dmvs", f), "utf8"));
  if (!r.city?.segments || !r.dmvs?.segments) continue;
  if (want.length ? !want.includes(r.sample.n) : !differs(r).length) continue;
  try { await fs.writeFile(path.join(DATA, "dmvs-png", `${r.sample.n}.svg`), await svg(r)); done++; } catch (e) { console.log(r.sample.n, "skip", e.message); }
}
console.log("written", done);
