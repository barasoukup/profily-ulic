// Review image per Brno cut (as render.mjs for Prague): Brno's 2025 orthophoto turned so the profile runs
// left → right, segment boundaries on the cut line, the profile as a bar and the parts in a table.
// One square SVG per cut (Quick Look renders squares), then PNG:
//   node evaluation/render_brno.mjs && for f in evaluation/brno/data/png/*.svg; do qlmanage -t -s 1100 -o evaluation/brno/data/png "$f"; done
import fs from "node:fs/promises";
import path from "node:path";
globalThis.PROFILY_CITY = "brno";
const { TYPES } = await import("../pilot/public/types.js");

const ROOT = path.dirname(new URL(import.meta.url).pathname);
const DATA = path.join(ROOT, "brno", "data");
const PX_M = 10, BOX = 640, SIZE = 1100;
const [from = 1, to = 100] = process.argv.slice(2).map(Number);
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const ARROW = { forward: "↑", backward: "↓" };

async function svg(r, n) {
  const b = (r.cut.bearing * Math.PI) / 180;
  const dir = [Math.sin(b), Math.cos(b)], normal = [-dir[1], dir[0]];
  const theta = (Math.atan2(-normal[1], -normal[0]) * 180) / Math.PI;
  const total = r.segments.reduce((a, s) => a + s.width, 0);
  const [, tL] = r.extent || [-total / 2, total / 2];
  const c = BOX / 2, X = (u) => c + u * PX_M;
  const tiles = JSON.parse(await fs.readFile(path.join(DATA, "ortho", String(n), "tiles.json"), "utf8"));
  const imgs = (await Promise.all(tiles.map(async (t) => {
    const b64 = (await fs.readFile(path.join(DATA, "ortho", String(n), t.file))).toString("base64");
    return `<image x="${t.e * PX_M}" y="${-t.n * PX_M}" width="${t.size * PX_M + 0.5}" height="${t.size * PX_M + 0.5}" href="data:image/jpeg;base64,${b64}"/>`;
  }))).join("");
  let u = -tL;
  const bounds = [u];
  const bands = r.segments.map((s) => {
    const x0 = X(u); u += s.width; bounds.push(u);
    return `<rect x="${x0}" y="${c - 14}" width="${s.width * PX_M}" height="28" fill="${TYPES[s.type]?.color || "#f0f"}" opacity="0.55"/>`;
  }).join("");
  const ticks = bounds.map((v) => `<line x1="${X(v)}" x2="${X(v)}" y1="${c - 70}" y2="${c + 70}" stroke="#ff2" stroke-width="2"/>`).join("");
  const axis = `<line x1="${X(-r.axisT)}" x2="${X(-r.axisT)}" y1="${c - 30}" y2="${c + 30}" stroke="#0ff" stroke-width="2" stroke-dasharray="4 3"/>`;
  const grid = [-30, -20, -10, 0, 10, 20, 30].map((m) => `<text x="${X(m)}" y="${BOX - 6}" fill="#fff" font-size="11" text-anchor="middle" stroke="#000" stroke-width="3" paint-order="stroke">${m}</text>`).join("");
  const W = SIZE - 20;
  let x = 10;
  const bar = r.segments.map((s, i) => {
    const w = (s.width / total) * W;
    const out = `<rect x="${x}" y="${BOX + 20}" width="${w}" height="34" fill="${TYPES[s.type]?.color}" stroke="#fff"/><text x="${x + w / 2}" y="${BOX + 42}" font-size="12" text-anchor="middle" fill="#fff" stroke="#000" stroke-width="2" paint-order="stroke">${i + 1}</text>`;
    x += w; return out;
  }).join("");
  const rows = r.segments.map((s, i) => `<text x="${BOX + 20}" y="${110 + i * 17}" font-size="12">${i + 1}. ${esc(TYPES[s.type]?.label || s.type)} ${s.width.toFixed(2)} ${s.dir ? ARROW[s.dir] : ""} · ${esc(s.source)} ${esc([s.orient, s.use, (s.items || []).map((i) => i.kind).join(",")].filter(Boolean).join(" "))}</text>`).join("");
  const t = r.cut.tags || {};
  const tagText = Object.keys(t).filter((k) => /^(highway|oneway|lanes|parking|cycleway|sidewalk|busway|width|railway|living|maxspeed)/.test(k)).slice(0, 14)
    .map((k, i) => `<text x="${BOX + 20}" y="${BOX - 230 + i * 15}" font-size="11" fill="#555">${esc(k)}=${esc(t[k])}</text>`).join("");
  const s = r.sample;
  const edge = (side) => `${r.edges[side]}${r.edges[`${side}Info`]?.levels ? ` (${r.edges[`${side}Info`].levels} NP)` : ""}`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}" font-family="Helvetica, Arial, sans-serif">
<rect width="${SIZE}" height="${SIZE}" fill="#fff"/>
<defs><clipPath id="o"><rect width="${BOX}" height="${BOX}"/></clipPath></defs>
<g clip-path="url(#o)"><rect width="${BOX}" height="${BOX}" fill="#222"/><g transform="translate(${c} ${c}) rotate(${theta})">${imgs}</g>${bands}${ticks}${axis}${grid}
<text x="8" y="18" fill="#fff" font-size="13" stroke="#000" stroke-width="3" paint-order="stroke">žlutě hranice částí · tyrkysově osa ulice · vlevo A</text></g>
<text x="${BOX + 20}" y="30" font-size="17" font-weight="bold">č. ${s.n} ${esc(r.cut.name || "(bez jména)")} · ${esc(r.cut.highway)}</text>
<text x="${BOX + 20}" y="52" font-size="12">vzorek: ${esc(s.highway)} ${esc(s.name)} · celkem ${total.toFixed(2)} m</text>
<text x="${BOX + 20}" y="70" font-size="12">okraje: vlevo ${esc(edge("left"))} · vpravo ${esc(edge("right"))}${r.junction ? " · křižovatka?" : ""} · ploch ${r.mtvuCount}${r.inZps ? " · OPS" : ""}</text>
<text x="${BOX + 20}" y="88" font-size="11" fill="#a00">${esc((r.notice || "").slice(0, 70))}</text>
${rows}${tagText}${bar}
</svg>`;
}

await fs.mkdir(path.join(DATA, "png"), { recursive: true });
let done = 0;
for (let i = from; i <= to; i++) {
  let r;
  try { r = JSON.parse(await fs.readFile(path.join(DATA, "results", `${i}.json`), "utf8")); } catch { continue; }
  if (r.error || !r.segments) { console.log(i, "skip", r.error?.slice(0, 80)); continue; }
  await fs.writeFile(path.join(DATA, "png", `${i}.svg`), await svg(r, i));
  done++;
}
console.log("written", done);
