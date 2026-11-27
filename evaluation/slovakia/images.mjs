// Pictures of the Slovak sample (results/rezy.json): for each cut the ZBGIS orthophoto along the cut (A on the left,
// B on the right, ±10 m along the street, 10 px = 1 m) with the parts of both profiles drawn in: the upper half the
// profile from OSM alone (?orto=0, blue), the lower half with the orthophoto (red). The edges of the carriageway
// (where its parts begin and end) are thick, the other boundaries thin. One image per cut, asked once and cached in
// data/ (git ignores it); then images/<id>.jpg and images/index.html for the visual check.
//   node evaluation/slovakia/images.mjs
import fs from "node:fs/promises";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { decodePng } from "../../app/public/dmvs.js";
import { encodePng } from "../orthophoto/run.mjs";

const ROOT = path.dirname(new URL(import.meta.url).pathname);
const EXPORT = "https://zbgis.skgeodesy.sk/zbgis/rest/services/Ortofoto_hres/MapServer/export";
const RES = 0.1, ALONG = 10, R = 6378137;
const ROAD = new Set(["pruh", "pruh_piktokoridor", "bus", "krajnice", "parkovani", "tramvaj_v_pruhu", "obsluzna", "cyklopruh"]);
const merc = (lon, lat) => [(R * lon * Math.PI) / 180, R * Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360))];
const run = promisify(execFile);
const { fields, rows } = JSON.parse(await fs.readFile(path.join(ROOT, "results/rezy.json"), "utf8"));
const cuts = rows.map((r) => Object.fromEntries(fields.map((f, i) => [f, r[i]])));

// The boundaries of a profile across the cut (t, A at +left), as the app lays the parts on the map: stretched to the
// span. Returns [{ t, kerb }] (kerb: the carriageway begins or ends there).
function bounds(parts, span) {
  const segs = parts.split(" ").map((p) => { const [type, w] = p.split(":"); return { type, w: +w }; });
  const total = segs.reduce((a, s) => a + s.w, 0) || 1, left = span ? span[0] : total / 2, len = span ? span[0] + span[1] : total;
  const out = [];
  let a = 0;
  for (let i = 0; i <= segs.length; i++) {
    const road = (j) => j >= 0 && j < segs.length && ROAD.has(segs[j].type);
    out.push({ t: left - (a / total) * len, kerb: road(i - 1) !== road(i) });
    if (i < segs.length) a += segs[i].w;
  }
  return out;
}

async function image(c, tMax) {
  const file = path.join(ROOT, "data", `${c.id}.png`);
  const b = (c.bearing * Math.PI) / 180, dir = [Math.sin(b), Math.cos(b)], normal = [-Math.cos(b), Math.sin(b)];
  const kx = 111320 * Math.cos((c.lat * Math.PI) / 180), ky = 110574;
  const ll = (t, u) => [c.lon + (normal[0] * t + dir[0] * u) / kx, c.lat + (normal[1] * t + dir[1] * u) / ky];
  const corners = [];
  for (const t of [-tMax, tMax]) for (const u of [-ALONG, ALONG]) corners.push(merc(...ll(t, u)));
  const x0 = Math.min(...corners.map((p) => p[0])), x1 = Math.max(...corners.map((p) => p[0]));
  const y0 = Math.min(...corners.map((p) => p[1])), y1 = Math.max(...corners.map((p) => p[1]));
  const k = Math.cos((c.lat * Math.PI) / 180), w = Math.round(((x1 - x0) * k) / RES), h = Math.round(((y1 - y0) * k) / RES);
  let buf;
  try { buf = await fs.readFile(file); } catch {
    const q = new URLSearchParams({ bbox: [x0, y0, x1, y1].join(","), bboxSR: 3857, imageSR: 3857, size: `${w},${h}`, format: "png24", f: "image" });
    buf = Buffer.from(await (await fetch(`${EXPORT}?${q}`)).arrayBuffer());
    await fs.mkdir(path.dirname(file), { recursive: true });
    await fs.writeFile(file, buf);
  }
  const img = await decodePng(buf);
  // The strip: columns from A (t = +tMax) to B, rows from +ALONG to -ALONG.
  const W = Math.round((2 * tMax) / RES), H = Math.round((2 * ALONG) / RES), out = new Uint8Array(W * H * 4);
  for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
    const [mx, my] = merc(...ll(tMax - (i + 0.5) * RES, ALONG - (j + 0.5) * RES));
    const px = Math.floor(((mx - x0) / (x1 - x0)) * img.width), py = Math.floor(((y1 - my) / (y1 - y0)) * img.height), o = (j * W + i) * 4;
    if (px < 0 || py < 0 || px >= img.width || py >= img.height) { out[o + 3] = 255; continue; }
    const s = (py * img.width + px) * 4;
    out[o] = img.rgba[s]; out[o + 1] = img.rgba[s + 1]; out[o + 2] = img.rgba[s + 2]; out[o + 3] = 255;
  }
  return { out, W, H, tx: (t) => Math.round((tMax - t) / RES) };
}

const line = (im, x, y0, y1, rgb, width) => {
  for (let dx = -Math.floor(width / 2); dx < Math.ceil(width / 2); dx++) {
    const xx = x + dx;
    if (xx < 0 || xx >= im.W) continue;
    for (let y = y0; y < y1; y++) { const o = (y * im.W + xx) * 4; [im.out[o], im.out[o + 1], im.out[o + 2]] = rgb; }
  }
};

const items = [];
for (const c of cuts) {
  const ext = [c.spanA, c.spanB].filter(Boolean).flat().map(Math.abs);
  const tMax = Math.min(30, Math.max(8, ...ext) + 3);
  const im = await image(c, tMax);
  const half = im.H >> 1;
  for (const [parts, span, rgb, y0, y1] of [[c.partsB, c.spanB, [40, 120, 255], 0, half], [c.partsA, c.spanA, [255, 40, 40], half, im.H]]) {
    for (const b of bounds(parts, span)) line(im, im.tx(b.t), y0, y1, rgb, b.kerb ? 5 : 2);
  }
  line(im, im.tx(0), half - 6, half + 6, [255, 255, 0], 3); // the centre of the cut
  for (let x = 0; x < im.W; x++) for (const y of [half - 1, half]) { const o = (y * im.W + x) * 4; im.out[o] = im.out[o + 1] = im.out[o + 2] = 255; }
  const png = path.join(ROOT, "data", `${c.id}-kresba.png`), jpg = path.join(ROOT, "images", `${c.id}.jpg`);
  await fs.mkdir(path.dirname(jpg), { recursive: true });
  await fs.writeFile(png, encodePng(im.out, im.W, im.H));
  await run("sips", ["-s", "format", "jpeg", "-s", "formatOptions", "70", png, "--out", jpg]);
  items.push(`<figure><img src="${c.id}.jpg" alt=""><figcaption>${c.id} · ${c.name || "(bez názvu)"} (${c.town})<br><b style="color:#2878ff">jen OSM:</b> ${c.partsB}<br><b style="color:#e22">s ortofotem:</b> ${c.partsA}</figcaption></figure>`);
  console.log(c.id, c.name);
}
await fs.writeFile(path.join(ROOT, "images", "index.html"), `<!doctype html><meta charset="utf-8"><title>Slovensko: řezy na ortofotu ZBGIS</title>
<style>body{font:14px system-ui;margin:16px;background:#fff;color:#222}figure{margin:0 0 24px}img{max-width:100%;display:block}figcaption{margin-top:4px}</style>
<h1>Slovensko: profil jen z OSM (nahoře, modře) a s ortofotem ZBGIS (dole, červeně)</h1>
<p>Řez zleva (A) doprava (B), ±10 m podél ulice, 10 px = 1 m. Silné čáry = okraje vozovky (obruby), tenké = ostatní hranice částí, žlutá = střed řezu. Ortofoto © GKÚ Bratislava, NLC (ZBGIS, CC BY 4.0).</p>
${items.join("\n")}`);
console.log("hotovo:", items.length);
