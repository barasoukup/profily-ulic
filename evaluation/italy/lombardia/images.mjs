// (A copy of evaluation/slovakia/ab/images.mjs for Lombardy.) Pictures of the A/B test of the Slovak passports (results/rezy.json from collect.js): for each cut the ZBGIS
// orthophoto along the cut (A on the left, B on the right, ±10 m along the street, 10 px = 1 m) with the parts of both
// profiles drawn in: the upper half without the passports (A, today: the estimate, blue), the lower half with them
// (B, red). Thick lines are the edges of the carriageway, thin the other boundaries; yellow the centre of the cut.
// Only cuts whose profiles differ; the orthophoto is asked once and kept in data/ (git ignores it).
//   node evaluation/slovakia/ab/images.mjs
import fs from "node:fs/promises";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { decodePng } from "../../../app/public/dmvs.js";
import { encodePng } from "../../orthophoto/run.mjs";

const ROOT = path.dirname(new URL(import.meta.url).pathname);
// Lombardy (evaluation/italy/lombardia): no orthophoto with an open licence; Esri World Imagery only to look at, the
// pictures stay local (images/ and data/ are not committed).
const EXPORT = "https://services.arcgisonline.com/arcgis/rest/services/World_Imagery/MapServer/export";
const RES = 0.1, ALONG = 10, R = 6378137;
const ROAD = new Set(["pruh", "pruh_piktokoridor", "bus", "krajnice", "parkovani", "tramvaj_v_pruhu", "tramvaj_pruh", "obsluzna", "cyklopruh"]);
const merc = (lon, lat) => [(R * lon * Math.PI) / 180, R * Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360))];
const run = promisify(execFile);
// IN, OUT: another results file and pictures folder (the technical map of Bratislava: results/rezy-tm.json, images-tm).
const IN = process.env.IN || "results/rezy.json", OUT = process.env.OUT || "images";
const rows = JSON.parse(await fs.readFile(path.join(ROOT, IN), "utf8"));
export const parts = (p) => (p?.segments || []).map(([t, w]) => `${t}:${w}`).join(" ");
export const differs = (r) => parts(r.A) !== parts(r.B);

// The boundaries of a profile across the cut (t, A at +left), stretched to the span as the app lays them on the map.
function bounds(segments, span) {
  const segs = segments.map(([type, w]) => ({ type, w }));
  const total = segs.reduce((a, s) => a + s.w, 0) || 1, left = span ? span.left : total / 2, len = span ? span.left + span.right : total;
  const out = [];
  let a = 0;
  for (let i = 0; i <= segs.length; i++) {
    const road = (j) => j >= 0 && j < segs.length && ROAD.has(segs[j].type);
    out.push({ t: left - (a / total) * len, kerb: road(i - 1) !== road(i) });
    if (i < segs.length) a += segs[i].w;
  }
  return out;
}

const AT_TILES = "https://mapsneu.wien.gv.at/basemap/bmaporthofoto30cm/normal/google3857";
// tms: Estonia's tiles (level 18, y from the bottom, .jpg); url: another service's tiles of level 20 (url(z, x, y)).
async function atImage([x0, y0, x1, y1], w, h, tms = false, url = null) {
  const z = tms ? 18 : url ? 19 : 20, size = (2 * Math.PI * R) / 2 ** z;
  const tx0 = Math.floor((x0 + Math.PI * R) / size), tx1 = Math.floor((x1 + Math.PI * R) / size);
  const ty0 = Math.floor((Math.PI * R - y1) / size), ty1 = Math.floor((Math.PI * R - y0) / size);
  const dir = await fs.mkdtemp(path.join((await import("node:os")).tmpdir(), "at-"));
  const files = [];
  for (let ty = ty0; ty <= ty1; ty++) for (let tx = tx0; tx <= tx1; tx++) {
    const f = path.join(dir, `${ty}-${tx}.jpg`);
    const r = await fetch(url ? url(z, tx, ty) : tms ? `https://tiles.maaamet.ee/tm/tms/1.0.0/foto@GMC/${z}/${tx}/${2 ** z - 1 - ty}.jpg` : `${AT_TILES}/${z}/${ty}/${tx}.jpeg`, { headers: { "User-Agent": "profily-ulic" } });
    await fs.writeFile(f, Buffer.from(await r.arrayBuffer()));
    files.push(f);
  }
  const cols = tx1 - tx0 + 1, png = path.join(dir, "out.png");
  // The glued tiles, cut to the box (pixels of 256 a tile), resized to the box's size.
  const cx = Math.round(((x0 + Math.PI * R) / size - tx0) * 256), cy = Math.round(((Math.PI * R - y1) / size - ty0) * 256);
  const cw = Math.round(((x1 - x0) / size) * 256), ch = Math.round(((y1 - y0) / size) * 256);
  await run("magick", ["montage", ...files, "-tile", `${cols}x`, "-geometry", "256x256+0+0", path.join(dir, "all.png")]);
  await run("magick", [path.join(dir, "all.png"), "-crop", `${cw}x${ch}+${cx}+${cy}`, "+repage", "-resize", `${w}x${h}!`, "PNG24:" + png]);
  return fs.readFile(png);
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
    if (process.env.ORTHO === "de") {
      // Germany (evaluation/germany/ab): the orthophoto of the town's Land (lanes-ortho.js DE_ORTHO) as a PNG.
      const { DE_ORTHO, deWmsUrl } = await import("../../../app/public/lanes-ortho.js");
      const land = { berlin: "BE", hamburg: "HH", aachen: "NW" }[c.town];
      buf = Buffer.from(await (await fetch(deWmsUrl(DE_ORTHO[land], [x0, y0, x1, y1], w, h, "image/png"), { headers: { "User-Agent": "profily-ulic" } })).arrayBuffer());
      await fs.mkdir(path.dirname(file), { recursive: true });
      await fs.writeFile(file, buf);
      await new Promise((r) => setTimeout(r, 300));
    } else if (process.env.ORTHO === "ch") {
      // Switzerland and Liechtenstein (evaluation/switzerland/ab): SWISSIMAGE through swisstopo's WMS as a PNG.
      const q = new URLSearchParams({ SERVICE: "WMS", VERSION: "1.3.0", REQUEST: "GetMap", LAYERS: "ch.swisstopo.swissimage", STYLES: "", CRS: "EPSG:3857",
        BBOX: [x0, y0, x1, y1].join(","), WIDTH: w, HEIGHT: h, FORMAT: "image/png" });
      buf = Buffer.from(await (await fetch(`https://wms.geo.admin.ch/?${q}`, { headers: { "User-Agent": "profily-ulic" } })).arrayBuffer());
      await fs.mkdir(path.dirname(file), { recursive: true });
      await fs.writeFile(file, buf);
      await new Promise((r) => setTimeout(r, 300));
    } else if (process.env.ORTHO === "pl") {
      // Poland (evaluation/poland/ab): GUGiK's orthophoto WMS (a JPEG, made a PNG).
      const { PL_ORTHO } = await import("../../../app/public/lanes-ortho.js");
      await fs.mkdir(path.dirname(file), { recursive: true });
      await fs.writeFile(file + ".img", Buffer.from(await (await fetch(PL_ORTHO([x0, y0, x1, y1], w, h), { headers: { "User-Agent": "profily-ulic" } })).arrayBuffer()));
      await run("magick", [file + ".img", "PNG24:" + file]);
      await fs.rm(file + ".img");
      buf = await fs.readFile(file);
      await new Promise((r) => setTimeout(r, 300));
    } else if (process.env.ORTHO === "fr") {
      // France (evaluation/france/ab): IGN's orthophoto WMS (a JPEG, made a PNG).
      const { FR_ORTHO } = await import("../../../app/public/lanes-ortho.js");
      await fs.mkdir(path.dirname(file), { recursive: true });
      await fs.writeFile(file + ".img", Buffer.from(await (await fetch(FR_ORTHO([x0, y0, x1, y1], w, h), { headers: { "User-Agent": "profily-ulic" } })).arrayBuffer()));
      await run("magick", [file + ".img", "PNG24:" + file]);
      await fs.rm(file + ".img");
      buf = await fs.readFile(file);
      await new Promise((r) => setTimeout(r, 300));
    } else if (process.env.ORTHO === "si") {
      // Slovenia (evaluation/slovenia): GURS's DOF025 WMS (a JPEG, made a PNG); the server hangs now and then: up to three tries.
      const { SI_ORTHO } = await import("../../../app/public/lanes-ortho.js");
      await fs.mkdir(path.dirname(file), { recursive: true });
      let r;
      for (let i = 0; i < 3 && !r?.ok; i++) r = await fetch(SI_ORTHO([x0, y0, x1, y1], w, h), { headers: { "User-Agent": "profily-ulic" }, signal: AbortSignal.timeout(35000) }).catch(() => null);
      if (!r?.ok) throw new Error("ortofoto GURS neodpovědělo");
      await fs.writeFile(file + ".img", Buffer.from(await r.arrayBuffer()));
      await run("magick", [file + ".img", "PNG24:" + file]);
      await fs.rm(file + ".img");
      buf = await fs.readFile(file);
      await new Promise((r) => setTimeout(r, 300));
    } else if (process.env.ORTHO === "fi") {
      // Finland (evaluation/finland/ab): the town's orthophoto (lanes-ortho.js FI_ORTHO; Helsinki 2026, 5 cm) as a JPEG, made a PNG.
      const { FI_ORTHO, fiOrthoAt } = await import("../../../app/public/lanes-ortho.js");
      await fs.mkdir(path.dirname(file), { recursive: true });
      await fs.writeFile(file + ".img", Buffer.from(await (await fetch(FI_ORTHO[fiOrthoAt(c.lon, c.lat)[0]].url([x0, y0, x1, y1], w, h), { headers: { "User-Agent": "profily-ulic" } })).arrayBuffer()));
      await run("magick", [file + ".img", "PNG24:" + file]);
      await fs.rm(file + ".img");
      buf = await fs.readFile(file);
      await new Promise((r) => setTimeout(r, 300));
    } else if (process.env.ORTHO === "es") {
      // Spain (evaluation/spain/ab): IGN's PNOA WMS (a JPEG, made a PNG).
      const { ES_ORTHO } = await import("../../../app/public/lanes-ortho.js");
      await fs.mkdir(path.dirname(file), { recursive: true });
      await fs.writeFile(file + ".img", Buffer.from(await (await fetch(ES_ORTHO([x0, y0, x1, y1], w, h), { headers: { "User-Agent": "profily-ulic" } })).arrayBuffer()));
      await run("magick", [file + ".img", "PNG24:" + file]);
      await fs.rm(file + ".img");
      buf = await fs.readFile(file);
      await new Promise((r) => setTimeout(r, 300));
    } else if (process.env.ORTHO === "pt") {
      // Portugal (evaluation/portugal/ab): the newest DGT flight with a photo here (a white JPEG is tiny).
      const { PT_ORTHO } = await import("../../../app/public/lanes-ortho.js");
      await fs.mkdir(path.dirname(file), { recursive: true });
      let img;
      for (const key of ["pt-25", "pt-21", "pt-18", "pt-sat"]) {
        img = Buffer.from(await (await fetch(PT_ORTHO[key]([x0, y0, x1, y1], w, h), { headers: { "User-Agent": "profily-ulic" } })).arrayBuffer());
        if (img.length >= w * h * 0.02) break;
        await new Promise((r) => setTimeout(r, 300));
      }
      await fs.writeFile(file + ".img", img);
      await run("magick", [file + ".img", "PNG24:" + file]);
      await fs.rm(file + ".img");
      buf = await fs.readFile(file);
      await new Promise((r) => setTimeout(r, 300));
    } else if (process.env.ORTHO === "be") {
      // Belgium (evaluation/belgium/ab): Flanders' orthophoto, else Wallonia's (a blank Flemish image is small).
      const { BE_ORTHO } = await import("../../../app/public/lanes-ortho.js");
      await fs.mkdir(path.dirname(file), { recursive: true });
      for (const r of ["vl", "wal"]) {
        const b = Buffer.from(await (await fetch(BE_ORTHO[r].url([x0, y0, x1, y1], w, h, "image/png"), { headers: { "User-Agent": "profily-ulic" } })).arrayBuffer());
        await fs.writeFile(file + ".img", b);
        await run("magick", [file + ".img", "-background", "white", "-flatten", "PNG24:" + file]);
        await fs.rm(file + ".img");
        if (b.length > 20000 || r === "wal") break;
      }
      buf = await fs.readFile(file);
      await new Promise((r) => setTimeout(r, 300));
    } else if (process.env.ORTHO === "nl") {
      // The Netherlands (evaluation/netherlands/ab): PDOK's Luchtfoto (Actueel_orthoHR) through its WMS as a PNG.
      const q = new URLSearchParams({ SERVICE: "WMS", VERSION: "1.3.0", REQUEST: "GetMap", LAYERS: "Actueel_orthoHR", STYLES: "", CRS: "EPSG:3857",
        BBOX: [x0, y0, x1, y1].join(","), WIDTH: w, HEIGHT: h, FORMAT: "image/png" });
      // PDOK answers a JPEG whatever the format asked: made a PNG with ImageMagick.
      await fs.mkdir(path.dirname(file), { recursive: true });
      await fs.writeFile(file + ".jpg", Buffer.from(await (await fetch(`https://service.pdok.nl/hwh/luchtfotorgb/wms/v1_0?${q}`, { headers: { "User-Agent": "profily-ulic" } })).arrayBuffer()));
      await run("magick", [file + ".jpg", "PNG24:" + file]);
      await fs.rm(file + ".jpg");
      buf = await fs.readFile(file);
      await new Promise((r) => setTimeout(r, 300));
    } else if (process.env.ORTHO === "ee") {
      // Estonia (evaluation/estonia/ab): the Land and Spatial Development Board's TMS tiles of level 18.
      buf = await atImage([x0, y0, x1, y1], w, h, true);
      await fs.mkdir(path.dirname(file), { recursive: true });
      await fs.writeFile(file, buf);
    } else if (process.env.ORTHO === "dk") {
      // Denmark (evaluation/denmark/ab): GeoDanmark's spring orthophoto (lanes-ortho.js DK_ORTHO, with the app's token
      // from DK_TOKEN or config.local.js, never printed), tiles of level 20 glued and cut to the box.
      const { DK_ORTHO } = await import("../../../app/public/lanes-ortho.js");
      buf = await atImage([x0, y0, x1, y1], w, h, false, (z, x, y) => DK_ORTHO(z, x, y));
      await fs.mkdir(path.dirname(file), { recursive: true });
      await fs.writeFile(file, buf);
      await new Promise((r) => setTimeout(r, 300));
    } else if (process.env.ORTHO === "at") {
      // Austria (evaluation/austria/ab): basemap.at's tiles of level 20 glued and cut to the box with ImageMagick.
      buf = await atImage([x0, y0, x1, y1], w, h);
      await fs.mkdir(path.dirname(file), { recursive: true });
      await fs.writeFile(file, buf);
    } else {
    // World Imagery has no export: its tiles of level 20 glued as Austria's.
    buf = await atImage([x0, y0, x1, y1], w, h, false, (z, x, y) => `${EXPORT.replace(/export$/, "tile")}/${z}/${y}/${x}`);
    await fs.mkdir(path.dirname(file), { recursive: true });
    await fs.writeFile(file, buf);
    await new Promise((r) => setTimeout(r, 300)); // politely, one image at a time
    }
  }
  const img = await decodePng(buf);
  const W = Math.round((2 * tMax) / RES), H = Math.round((2 * ALONG) / RES), out = new Uint8Array(W * H * 4);
  for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
    const [mx, my] = merc(...ll(tMax - (i + 0.5) * RES, ALONG - (j + 0.5) * RES));
    const px = Math.floor(((mx - x0) / (x1 - x0)) * img.width), py = Math.floor(((y1 - my) / (y1 - y0)) * img.height), o = (j * W + i) * 4;
    out[o + 3] = 255;
    if (px < 0 || py < 0 || px >= img.width || py >= img.height) continue;
    const s = (py * img.width + px) * 4;
    out[o] = img.rgba[s]; out[o + 1] = img.rgba[s + 1]; out[o + 2] = img.rgba[s + 2];
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

if (process.argv[1] === new URL(import.meta.url).pathname) {
  const items = [];
  for (const r of rows.filter(differs)) {
    const c = { id: r.id, town: r.town, ...r.B };
    if (!c.lat) continue;
    const ext = [r.A?.span, r.B?.span].filter(Boolean).flatMap((s) => [s.left, s.right]);
    const tMax = Math.min(30, Math.max(8, ...ext) + 3);
    const im = await image(c, tMax);
    const half = im.H >> 1;
    for (const [p, rgb, y0, y1] of [[r.A, [40, 120, 255], 0, half], [r.B, [255, 40, 40], half, im.H]]) {
      for (const b of bounds(p.segments, p.span)) line(im, im.tx(b.t), y0, y1, rgb, b.kerb ? 5 : 2);
    }
    line(im, im.tx(0), half - 6, half + 6, [255, 255, 0], 3);
    for (let x = 0; x < im.W; x++) for (const y of [half - 1, half]) { const o = (y * im.W + x) * 4; im.out[o] = im.out[o + 1] = im.out[o + 2] = 255; }
    const png = path.join(ROOT, "data", `${path.basename(OUT)}-${r.id}-kresba.png`), jpg = path.join(ROOT, OUT, `${r.id}.jpg`);
    await fs.mkdir(path.dirname(jpg), { recursive: true });
    await fs.writeFile(png, encodePng(im.out, im.W, im.H));
    await run("sips", ["-s", "format", "jpeg", "-s", "formatOptions", "70", png, "--out", jpg]);
    const fmt = (p) => p.segments.map(([t, w, s]) => `${t} ${w}${s === "odhad" ? "*" : ""}`).join(" · ");
    items.push(`<figure><img src="${r.id}.jpg" alt=""><figcaption>${r.id} · ${c.name || "(bez názvu)"} (${r.town})<br><b style="color:#2878ff">${process.env.LA || "bez pasportu"}:</b> ${fmt(r.A)}<br><b style="color:#e22">${process.env.LB || "s pasportem"}:</b> ${fmt(r.B)}</figcaption></figure>`);
    console.log(r.id, c.name);
  }
  await fs.writeFile(path.join(ROOT, OUT, "index.html"), `<!doctype html><meta charset="utf-8"><title>Lombardie: DBT, A/B</title>
<style>body{font:14px system-ui;margin:16px;background:#fff;color:#222}figure{margin:0 0 24px}img{max-width:100%;display:block}figcaption{margin-top:4px}</style>
<h1>Lombardie: odhad z OSM (nahoře, modře) a s DBT (dole, červeně)</h1>
<p>Řez zleva (A) doprava (B), ±10 m podél ulice, 10 px = 1 m. Silné čáry = okraje vozovky, tenké = ostatní hranice, žlutá = střed řezu, * = odhad. Snímek Esri World Imagery (jen k prohlížení, nezveřejňovat).</p>
${items.join("\n")}`);
  console.log("hotovo:", items.length);
}
