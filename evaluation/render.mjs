// Composite review image per cut: the leaf-off orthophoto turned so the profile runs left → right,
// segment boundaries drawn on the cut line, the profile as a bar, and the OSM tags the pilot read.
// Usage: node evaluation/render.mjs [from] [to]  → evaluation/data/html/<n>.html (open in a browser)
import fs from "node:fs/promises";
import path from "node:path";
import { TYPES } from "./snapshot/types.js";

const ROOT = path.dirname(new URL(import.meta.url).pathname);
const PX_M = 10; // orthophoto: 800 px for 80 m
const BOX = 640; // shown window (px), i.e. ±32 m
const [from = 1, to = 100] = process.argv.slice(2).map(Number);
// V=2 renders the re-run with the fixed pilot (data/results2, ortho2 → html2).
const V2 = process.env.V === "2";
const RES = V2 ? "results2" : "results", ORT = V2 ? "ortho2" : "ortho", HTML = V2 ? "html2" : "html";

const esc = (s) => String(s ?? "").replace(/[&<>"%#]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "%": "&#37;", "#": "&#35;" })[c]);
const SHORT = { krajnice: "krajnice", sdileny: "sdílený", chodnik: "chodník", parkovani: "park.", pruh: "pruh", tramvaj_v_pruhu: "tram+pruh", tramvaj: "tram pás", cyklostezka: "cyklostezka", cyklopruh: "cyklopruh", zelen: "zeleň", stromorad: "stromy", predzahradka: "předzahr.", delici: "dělicí", plocha: "plocha", nastupiste: "nástup.", obsluzna: "příst. cesta", zed: "zeď", nezname: "?" };
const ARROW = { forward: "↑", backward: "↓" };

function page(r, img) {
  const b = (r.cut.bearing * Math.PI) / 180;
  const dir = [Math.sin(b), Math.cos(b)];
  const normal = [-dir[1], dir[0]];
  const theta = (Math.atan2(-normal[1], -normal[0]) * 180) / Math.PI;
  const [tR, tL] = r.extent || [-(r.segments.reduce((a, s) => a + s.width, 0)) / 2, r.segments.reduce((a, s) => a + s.width, 0) / 2];
  const c = BOX / 2;
  const X = (u) => c + u * PX_M;
  let u = -tL;
  const bounds = [u];
  const bands = r.segments.map((s) => {
    const x0 = X(u); u += s.width; bounds.push(u);
    return `<rect x="${x0}" y="${c - 14}" width="${s.width * PX_M}" height="28" fill="${TYPES[s.type]?.color || "#f0f"}" opacity="0.55"/>`;
  }).join("");
  const ticks = bounds.map((v) => `<line x1="${X(v)}" x2="${X(v)}" y1="${c - 70}" y2="${c + 70}" stroke="#ff2" stroke-width="2"/>`).join("");
  const axis = `<line x1="${X(-r.axisT)}" x2="${X(-r.axisT)}" y1="${c - 30}" y2="${c + 30}" stroke="#0ff" stroke-width="2" stroke-dasharray="4 3"/>`;
  const grid = [-30, -20, -10, 0, 10, 20, 30].map((m) => `<text x="${X(m)}" y="${BOX - 6}" fill="#fff" font-size="11" text-anchor="middle" style="paint-order:stroke;stroke:#000;stroke-width:3">${m}</text>`).join("");
  const total = r.segments.reduce((a, s) => a + s.width, 0);
  const W = 900;
  let x = 0;
  const bar = r.segments.map((s, i) => {
    const w = (s.width / total) * W;
    const label = `${i + 1}`;
    const out = `<div class="seg" style="left:${x}px;width:${w}px;background:${TYPES[s.type]?.color}"><b>${label}</b></div>`;
    x += w; return out;
  }).join("");
  const rows = r.segments.map((s, i) => `<tr><td>${i + 1}</td><td>${esc(SHORT[s.type] || s.type)}</td><td>${s.width.toFixed(2)}</td><td>${s.dir ? ARROW[s.dir] : ""}${s.bikeDir ? " kola" + ARROW[s.bikeDir] : ""}</td><td>${esc(s.source)}</td><td>${esc([s.orient, s.use, s.turn, (s.items || []).map((i) => i.kind).join(",")].filter(Boolean).join(" "))}</td></tr>`).join("");
  const t = r.cut.tags || {};
  const keys = Object.keys(t).filter((k) => /^(name|highway|oneway|lanes|parking|cycleway|sidewalk|busway|bus|psv|width|maxspeed|turn|railway|bicycle|footway|surface|junction|living|motor|access|service)/.test(k));
  const tagText = keys.map((k) => `${esc(k)}=${esc(t[k])}`).join("<br>");
  const s = r.sample;
  return `<!doctype html><html><head><meta charset="utf-8"><style>
body{margin:0;font:12px/1.35 -apple-system,Helvetica,sans-serif;background:#fff;width:1280px}
.top{display:flex;gap:12px;padding:8px}
.ortho{position:relative;width:${BOX}px;height:${BOX}px;overflow:hidden;background:#222;flex:none}
.ortho img{position:absolute;left:${(BOX - 800) / 2}px;top:${(BOX - 800) / 2}px;width:800px;height:800px;transform:rotate(${theta}deg)}
.ortho svg{position:absolute;left:0;top:0}
.side{flex:1;min-width:0}
h1{font-size:16px;margin:0 0 4px}
table{border-collapse:collapse}td{padding:1px 6px;border-bottom:1px solid #eee}
.bar{position:relative;height:34px;margin:4px 8px 8px;width:${W}px}
.seg{position:absolute;top:0;height:34px;border-right:1px solid #fff;box-sizing:border-box;text-align:center;color:#fff;font-size:11px;text-shadow:0 0 2px #000;overflow:hidden}
.tags{color:#555;font-size:11px;margin-top:6px}
</style></head><body>
<div class="top"><div class="ortho"><img src="${img}"><svg width="${BOX}" height="${BOX}">${bands}${ticks}${axis}
<text x="8" y="18" fill="#fff" font-size="13" style="paint-order:stroke;stroke:#000;stroke-width:3">↑ forward (směr OSM osy) · žlutě hranice částí · tyrkysově osa ulice</text>${grid}</svg></div>
<div class="side"><h1>č. ${s.n} ${esc(r.cut.name || "(bez jména)")} · ${esc(r.cut.highway)}</h1>
<div>vzorek: ${esc(s.highway)} ${esc(s.name)} · ${r.cut.lat.toFixed(6)}, ${r.cut.lon.toFixed(6)} · celkem ${total.toFixed(2)} m</div>
<div>okraje: vlevo ${esc(r.edges.left)}${r.edges.leftInfo?.levels ? ` (${r.edges.leftInfo.levels} NP)` : ""} · vpravo ${esc(r.edges.right)}${r.edges.rightInfo?.levels ? ` (${r.edges.rightInfo.levels} NP)` : ""}${r.junction ? " · <b>křižovatka?</b>" : ""}${r.notice ? ` · <b>${esc(r.notice)}</b>` : ""} · MTVU ploch ${r.mtvuCount}</div>
<table>${rows}</table>
<div class="tags">${tagText}</div></div></div>
<div class="bar">${bar}</div>
</body></html>`;
}

await fs.mkdir(path.join(ROOT, "data", HTML), { recursive: true });
const done = [];
for (let i = from; i <= to; i++) {
  let r;
  try { r = JSON.parse(await fs.readFile(path.join(ROOT, "data", RES, `${i}.json`), "utf8")); } catch { continue; }
  if (r.error || !r.segments) { console.log(i, "skip", r.error?.slice(0, 80)); continue; }
  await fs.writeFile(path.join(ROOT, "data", HTML, `${i}.html`), page(r, `data:image/jpeg;base64,${(await fs.readFile(path.join(ROOT, "data", ORT, `${i}.jpg`))).toString("base64")}`));
  done.push(i);
}
console.log("written", done.length);
