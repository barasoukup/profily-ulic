// The universal judging of profiles (Bára 17. 11. 2026: one method to judge the accuracy everywhere): the orthophoto
// of a cut for the judge, the same in every state. The state's own orthophoto (CZ ČÚZK, SK ZBGIS, AT basemap.at, CH and LI SWISSIMAGE, DE the
// Land's WMS) is resampled so that the cut runs across the image and the street runs up (the direction of the cut's
// bearing), 10 px = 1 m; A is on the left, B on the right (the app's profile A→B); a scale of metres along the top and
// the bottom (a tick a metre, a long one every 5 m), the cut as a thin dashed yellow line. No line of the app: the judge
// must not see the profile.
//   import { orthoImage } from "./ortho.mjs"; await orthoImage({ id, lat, lon, bearing, country, half }, outJpg)
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { decodePng } from "../../pilot/public/dmvs.js";
import { encodePng } from "../ortofoto/run.mjs";
import { DE_ORTHO, deWmsUrl, landsAt } from "../../pilot/public/lanes-ortho.js";

const run = promisify(execFile), R = 6378137, RES = 0.1, UA = { "User-Agent": "profily-ulic" };
const FONT = "/System/Library/Fonts/Supplemental/Arial Bold.ttf";
const merc = (lon, lat) => [(R * lon * Math.PI) / 180, R * Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360))];
export const ALONG = 15; // m up and down the street
const AT = "https://mapsneu.wien.gv.at/basemap/bmaporthofoto30cm/normal/google3857";

async function tiles(base, ext, z, [x0, y0, x1, y1], w, h, xy = false) {
  const size = (2 * Math.PI * R) / 2 ** z, dir = await fs.mkdtemp(path.join(os.tmpdir(), "uo-")), files = [];
  const tx0 = Math.floor((x0 + Math.PI * R) / size), tx1 = Math.floor((x1 + Math.PI * R) / size);
  const ty0 = Math.floor((Math.PI * R - y1) / size), ty1 = Math.floor((Math.PI * R - y0) / size);
  for (let ty = ty0; ty <= ty1; ty++) for (let tx = tx0; tx <= tx1; tx++) {
    const f = path.join(dir, `${ty}-${tx}${ext || ".png"}`);
    const r = await fetch(`${base}/${z}/${xy ? `${tx}/${ty}` : `${ty}/${tx}`}${ext}`, { headers: UA });
    if (!r.ok) throw new Error(`dlaždice ${z}/${ty}/${tx} ${r.status}`);
    await fs.writeFile(f, Buffer.from(await r.arrayBuffer()));
    files.push(f);
  }
  const cx = Math.round(((x0 + Math.PI * R) / size - tx0) * 256), cy = Math.round(((Math.PI * R - y1) / size - ty0) * 256);
  const cw = Math.round(((x1 - x0) / size) * 256), ch = Math.round(((y1 - y0) / size) * 256), png = path.join(dir, "out.png");
  await run("magick", ["montage", ...files, "-tile", `${tx1 - tx0 + 1}x`, "-geometry", "256x256+0+0", path.join(dir, "all.png")]);
  await run("magick", [path.join(dir, "all.png"), "-crop", `${cw}x${ch}+${cx}+${cy}`, "+repage", "-resize", `${w}x${h}!`, "PNG24:" + png]);
  return fs.readFile(png);
}
// The state's orthophoto of a Web Mercator box as a PNG.
async function fetchOrtho(country, b, w, h, lon, lat) {
  // basemap.at has level 20 not everywhere (Salzburg: 404): level 19 where it lacks.
  if (country === "AT") return tiles(AT, ".jpeg", 20, b, w, h).catch(() => tiles(AT, ".jpeg", 19, b, w, h));
  let url;
  if (country === "SK") url = `https://zbgis.skgeodesy.sk/zbgis/rest/services/Ortofoto_hres/MapServer/export?${new URLSearchParams({ bbox: b.join(","), bboxSR: 3857, imageSR: 3857, size: `${w},${h}`, format: "png24", f: "image" })}`;
  // Switzerland and Liechtenstein: SWISSIMAGE through swisstopo's WMS.
  else if (country === "CH" || country === "LI") url = `https://wms.geo.admin.ch/?${new URLSearchParams({ SERVICE: "WMS", VERSION: "1.3.0", REQUEST: "GetMap", LAYERS: "ch.swisstopo.swissimage", STYLES: "", CRS: "EPSG:3857", BBOX: b.join(","), WIDTH: w, HEIGHT: h, FORMAT: "image/png" })}`;
  // The Netherlands: PDOK's Luchtfoto (it answers a JPEG; read the same way).
  else if (country === "NL") url = `https://service.pdok.nl/hwh/luchtfotorgb/wms/v1_0?${new URLSearchParams({ SERVICE: "WMS", VERSION: "1.3.0", REQUEST: "GetMap", LAYERS: "Actueel_orthoHR", STYLES: "", CRS: "EPSG:3857", BBOX: b.join(","), WIDTH: w, HEIGHT: h, FORMAT: "image/png" })}`;
  // Belgium: Flanders' orthophoto, else Wallonia's (a small answer is a blank one); Luxembourg: the ACT's tiles.
  else if (country === "BE") {
    const { BE_ORTHO } = await import("../../pilot/public/lanes-ortho.js");
    for (const r of ["vl", "wal"]) {
      const res = await fetch(BE_ORTHO[r].url(b, w, h, "image/png"), { headers: UA });
      const buf = Buffer.from(await res.arrayBuffer());
      if (res.ok && (buf.length > 40000 || r === "wal")) return toPng(buf);
    }
  }
  else if (country === "PL") {
    const { PL_ORTHO } = await import("../../pilot/public/lanes-ortho.js");
    const res = await fetch(PL_ORTHO(b, w, h), { headers: UA });
    if (!res.ok) throw new Error(`ortofoto ${res.status}`);
    return toPng(Buffer.from(await res.arrayBuffer()));
  }
  else if (country === "FR") {
    const { FR_ORTHO } = await import("../../pilot/public/lanes-ortho.js");
    const res = await fetch(FR_ORTHO(b, w, h), { headers: UA });
    if (!res.ok) throw new Error(`ortofoto ${res.status}`);
    return toPng(Buffer.from(await res.arrayBuffer()));
  }
  else if (country === "LU") return tiles("https://wmts1.geoportail.lu/opendata/wmts/ortho_latest/GLOBAL_WEBMERCATOR_4_V3", ".jpeg", 20, b, w, h, true);
  else if (country === "DE") url = deWmsUrl(DE_ORTHO[(await landsAt(lon, lat))[0]], b, w, h, "image/png");
  else url = `https://ags.cuzk.gov.cz/arcgis1/services/ORTOFOTO/MapServer/WMSServer?${new URLSearchParams({ service: "WMS", request: "GetMap", version: "1.3.0", layers: "0", styles: "", crs: "EPSG:3857", bbox: b.join(","), width: w, height: h, format: "image/png" })}`;
  const r = await fetch(url, { headers: UA });
  if (!r.ok) throw new Error(`ortofoto ${r.status}`);
  const buf = Buffer.from(await r.arrayBuffer());
  return toPng(buf);
}
// Any image as an opaque PNG (PDOK answers a JPEG whatever is asked; Flanders a PNG with transparency).
async function toPng(buf) {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "ortho-")), src = path.join(dir, "o.img"), png = path.join(dir, "o.png");
  await fs.writeFile(src, buf);
  await run("magick", [src, "-background", "white", "-flatten", "PNG24:" + png]);
  const out = await fs.readFile(png);
  await fs.rm(dir, { recursive: true });
  return out;
}

export async function orthoImage({ lat, lon, bearing, country = "CZ", half = 30 }, out) {
  const b = (bearing * Math.PI) / 180, dir = [Math.sin(b), Math.cos(b)], normal = [-Math.cos(b), Math.sin(b)];
  const kx = 111320 * Math.cos((lat * Math.PI) / 180), ky = 110574;
  const ll = (t, u) => [lon + (normal[0] * t + dir[0] * u) / kx, lat + (normal[1] * t + dir[1] * u) / ky];
  const corners = [];
  for (const t of [-half, half]) for (const u of [-ALONG, ALONG]) corners.push(merc(...ll(t, u)));
  const x0 = Math.min(...corners.map((p) => p[0])), x1 = Math.max(...corners.map((p) => p[0]));
  const y0 = Math.min(...corners.map((p) => p[1])), y1 = Math.max(...corners.map((p) => p[1]));
  const k = Math.cos((lat * Math.PI) / 180), w = Math.round(((x1 - x0) * k) / RES), h = Math.round(((y1 - y0) * k) / RES);
  const img = await decodePng(await fetchOrtho(country, [x0, y0, x1, y1], w, h, lon, lat));
  // Resampled: column i = t from +half (A, left) to -half (B, right), row j = u from +ALONG (up the street) down.
  const W = Math.round((2 * half) / RES), H = Math.round((2 * ALONG) / RES), px = new Uint8Array(W * H * 4);
  for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
    const [mx, my] = merc(...ll(half - (i + 0.5) * RES, ALONG - (j + 0.5) * RES));
    const x = Math.floor(((mx - x0) / (x1 - x0)) * img.width), y = Math.floor(((y1 - my) / (y1 - y0)) * img.height), o = (j * W + i) * 4;
    px[o + 3] = 255;
    if (x < 0 || y < 0 || x >= img.width || y >= img.height) continue;
    const s = (y * img.width + x) * 4;
    px[o] = img.rgba[s]; px[o + 1] = img.rgba[s + 1]; px[o + 2] = img.rgba[s + 2];
  }
  const raw = path.join(os.tmpdir(), `uo-${process.pid}-${Date.now()}.png`);
  await fs.writeFile(raw, encodePng(px, W, H));
  // A white band of 30 px above and below with the metre scale, the letters A and B, the dashed cut.
  const draw = [];
  for (let m = 0; m <= 2 * half; m++) {
    const x = Math.round(m / RES), long = m % 5 === 0;
    draw.push("-draw", `line ${x},${30 - (long ? 18 : 8)} ${x},30`, "-draw", `line ${x},${H + 30} ${x},${H + 30 + (long ? 18 : 8)}`);
  }
  const mid = 30 + H / 2;
  for (let x = 0; x < W; x += 20) draw.push("-draw", `line ${x},${mid} ${x + 10},${mid}`);
  await run("magick", [raw, "-bordercolor", "white", "-border", "0x30", "-stroke", "black", "-strokewidth", "1",
    ...draw.slice(0, -2 * Math.ceil(W / 20)), "-stroke", "yellow", "-strokewidth", "2", ...draw.slice(-2 * Math.ceil(W / 20)),
    "-stroke", "none", "-fill", "red", "-font", FONT, "-pointsize", "24", "-annotate", `+4+${mid - 6}`, "A", "-annotate", `+${W - 22}+${mid - 6}`, "B",
    "-quality", "80", out]);
  await fs.unlink(raw);
  return { widthM: 2 * half, heightM: 2 * ALONG };
}
