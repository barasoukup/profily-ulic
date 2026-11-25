// The DC pilot, the judge's inputs (as evaluation/universal/prepare.mjs and ortho.mjs, whose code this follows; the
// shared ortho.mjs is not changed): the orthophoto of DC 2025 (DC OCTO, Ortho2025_WebMercator, 8 cm, CC BY 4.0) resampled
// with the cut across the image, the street up, A on the left, 10 px = 1 m, a metre scale; the Mapillary photos along
// the street both ways (within 30 m). Writes data/<id>-ortho.jpg, -f.jpg, -b.jpg, <id>.txt.
//   node evaluation/usa-dc/prepare.mjs
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { decodePng } from "../../pilot/public/dmvs.js";
import { encodePng } from "../ortofoto/run.mjs";
import { ROOT, DATA } from "./lib.mjs";

const run = promisify(execFile), R = 6378137, RES = 0.1, ALONG = 15;
const FONT = "/System/Library/Fonts/Supplemental/Arial Bold.ttf";
const merc = (lon, lat) => [(R * lon * Math.PI) / 180, R * Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360))];
export const DC_ORTHO = "https://maps2.dcgis.dc.gov/dcgis/rest/services/DCGIS_DATA/Ortho2025_WebMercator/MapServer/export";
const TOKEN = (await fs.readFile(process.env.TOKEN || path.join(ROOT, "..", "streetview", "token.local"), "utf8")).trim();
const angle = (a, b) => Math.abs(((a - b + 540) % 360) - 180);

export async function orthoImage({ lat, lon, bearing, half = 30 }, out, { cut = true, service = DC_ORTHO } = {}) {
  const b = (bearing * Math.PI) / 180, dir = [Math.sin(b), Math.cos(b)], normal = [-Math.cos(b), Math.sin(b)];
  const kx = 111320 * Math.cos((lat * Math.PI) / 180), ky = 110574;
  const ll = (t, u) => [lon + (normal[0] * t + dir[0] * u) / kx, lat + (normal[1] * t + dir[1] * u) / ky];
  const corners = [];
  for (const t of [-half, half]) for (const u of [-ALONG, ALONG]) corners.push(merc(...ll(t, u)));
  const x0 = Math.min(...corners.map((p) => p[0])), x1 = Math.max(...corners.map((p) => p[0]));
  const y0 = Math.min(...corners.map((p) => p[1])), y1 = Math.max(...corners.map((p) => p[1]));
  const k = Math.cos((lat * Math.PI) / 180), w = Math.round(((x1 - x0) * k) / RES), h = Math.round(((y1 - y0) * k) / RES);
  const res = await fetch(`${service}${service.includes("?") ? "" : "?"}${new URLSearchParams({ bbox: [x0, y0, x1, y1].join(","), bboxSR: 3857, imageSR: 3857, size: `${w},${h}`, format: "png24", f: "image" })}`, { headers: { "User-Agent": "profily-ulic evaluation" } });
  if (!res.ok) throw new Error(`ortofoto ${res.status}`);
  const img = await decodePng(Buffer.from(await res.arrayBuffer()));
  const W = Math.round((2 * half) / RES), H = Math.round((2 * ALONG) / RES), px = new Uint8Array(W * H * 4);
  for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
    const [mx, my] = merc(...ll(half - (i + 0.5) * RES, ALONG - (j + 0.5) * RES));
    const x = Math.floor(((mx - x0) / (x1 - x0)) * img.width), y = Math.floor(((y1 - my) / (y1 - y0)) * img.height), o = (j * W + i) * 4;
    px[o + 3] = 255;
    if (x < 0 || y < 0 || x >= img.width || y >= img.height) continue;
    const s = (y * img.width + x) * 4;
    px[o] = img.rgba[s]; px[o + 1] = img.rgba[s + 1]; px[o + 2] = img.rgba[s + 2];
  }
  const raw = path.join(os.tmpdir(), `dc-${process.pid}-${Date.now()}.png`);
  await fs.writeFile(raw, encodePng(px, W, H));
  const draw = [];
  for (let m = 0; m <= 2 * half; m++) {
    const x = Math.round(m / RES), long = m % 5 === 0;
    draw.push("-draw", `line ${x},${30 - (long ? 18 : 8)} ${x},30`, "-draw", `line ${x},${H + 30} ${x},${H + 30 + (long ? 18 : 8)}`);
  }
  const mid = 30 + H / 2, dash = [];
  if (cut) for (let x = 0; x < W; x += 20) dash.push("-draw", `line ${x},${mid} ${x + 10},${mid}`);
  await run("magick", [raw, "-bordercolor", "white", "-border", "0x30", "-stroke", "black", "-strokewidth", "1", ...draw,
    "-stroke", "yellow", "-strokewidth", "2", ...dash,
    "-stroke", "none", "-fill", "red", "-font", FONT, "-pointsize", "24", "-annotate", `+4+${mid - 6}`, "A", "-annotate", `+${W - 22}+${mid - 6}`, "B",
    "-quality", "80", out]);
  await fs.unlink(raw);
  return { widthM: 2 * half, heightM: 2 * ALONG };
}

async function photos(r) {
  const q = new URLSearchParams({ access_token: TOKEN, lat: r.lat, lng: r.lon, radius: 30, limit: 100, fields: "id,captured_at,compass_angle,computed_compass_angle,is_pano,thumb_2048_url" });
  const imgs = ((await (await fetch(`https://graph.mapillary.com/images?${q}`)).json()).data || []).map((d) => ({ at: d.captured_at, pano: !!d.is_pano, url: d.thumb_2048_url, c: d.computed_compass_angle ?? d.compass_angle }));
  const got = [];
  for (const [k, deg] of [["f", r.bearing], ["b", r.bearing + 180]]) {
    const im = imgs.filter((i) => i.pano || angle(i.c, deg) <= 35).sort((a, b) => a.pano - b.pano || b.at - a.at)[0];
    if (im) { await fs.writeFile(path.join(DATA, `${r.id}-${k}.jpg`), Buffer.from(await (await fetch(im.url)).arrayBuffer())); got.push(`${k} ${new Date(im.at).toISOString().slice(0, 7)}${im.pano ? " pano" : ""}`); }
  }
  return got;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  await fs.mkdir(DATA, { recursive: true });
  const rows = JSON.parse(await fs.readFile(path.join(ROOT, "sample.json"), "utf8"));
  for (const r of rows) {
    r.half = r.kind === "arterial" ? 40 : 30;
    const o = path.join(DATA, `${r.id}-ortho.jpg`);
    if (!(await fs.stat(o).catch(() => null))) {
      const m = await orthoImage(r, o);
      await fs.writeFile(path.join(DATA, `${r.id}.txt`), `šířka ${m.widthM} m, výška ${m.heightM} m\n`);
    }
    const have = (await fs.stat(path.join(DATA, `${r.id}-f.jpg`)).catch(() => null)) || (await fs.stat(path.join(DATA, `${r.id}-b.jpg`)).catch(() => null));
    console.log(r.id, have ? "fotky už jsou" : (await photos(r)).join(", ") || "BEZ FOTKY");
  }
  await fs.writeFile(path.join(ROOT, "sample.json"), JSON.stringify(rows, null, 1));
}
