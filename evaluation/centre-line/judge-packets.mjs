// The packets of the blind A/B judging (REPORT.md): for each cut whose profile changed between two runs of the replay
// (off = ?off=stredcara, on), one PNG: the orthophoto of the cut turned north-up across the street, 20 px a metre, with the
// two profiles as bars below (A above B, order random by a fixed seed, which is which in key.json), and the text of both.
//   REC=<recording folder> OUT=<outputs of the runs> PACK=<where the packets go> node evaluation/centre-line/judge-packets.mjs <run off> <run on> [sample file]
// The orthophoto: GURS's image the app asked for the cut (the largest in the recording), turned to JPEG → PNG by sips.
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { decodePng } from "../../app/public/dmvs.js";
import { encodePng } from "../orthophoto/run.mjs";

const [OFF, ON, SAMPLE] = process.argv.slice(2);
const REC = process.env.REC, OUT = process.env.OUT, PACK = process.env.PACK;
fs.mkdirSync(PACK, { recursive: true });
const HERE = path.dirname(new URL(import.meta.url).pathname);
const sample = Object.fromEntries(JSON.parse(fs.readFileSync(path.join(HERE, `${SAMPLE}.json`), "utf8")).map((p) => [p.id, p]));
const R = 6378137, PX = 20, ALONG = 10;
const merc = (lon, lat) => [(R * lon * Math.PI) / 180, R * Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360))];
const read = (run, id) => JSON.parse(fs.readFileSync(path.join(OUT, run, `${id}.json`), "utf8"));
const view = (o) => JSON.stringify((o.stav?.segments || []).map((s) => [s.type, +(+s.width).toFixed(2)]));
// The orthophoto asked in each cut: the largest GetMap of GURS, status 200.
const images = {};
for (const line of fs.readFileSync(path.join(REC, "index.jsonl"), "utf8").split("\n")) {
  if (!line) continue;
  const e = JSON.parse(line);
  if (!/eprostor/.test(e.key) || !/GetMap/.test(e.key) || e.status !== 200 || !e.sha) continue;
  const u = new URL(e.key.replace(/^GET /, "")), bbox = u.searchParams.get("BBOX").split(",").map(Number);
  const area = (bbox[2] - bbox[0]) * (bbox[3] - bbox[1]);
  if (!images[e.cut] || area > images[e.cut].area) images[e.cut] = { area, bbox, sha: e.sha };
}
const COLOUR = { pruh: [110, 110, 110], krajnice: [175, 175, 175], parkovani: [60, 110, 220], chodnik: [225, 205, 160], zelen: [90, 170, 90], cyklopruh: [230, 80, 80], ochranny_pruh: [230, 80, 80], cyklostezka: [230, 140, 140], delici: [50, 50, 50], plocha: [200, 170, 120], bus: [200, 60, 60], tramvaj: [150, 60, 150] };
let seed = 20261128;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const key = {};
let rngFlip = 0;
const ids = fs.readdirSync(path.join(OUT, OFF)).filter((f) => /^\d+\.json$/.test(f)).map((f) => +f.slice(0, -5)).sort((a, b) => a - b);
for (const id of ids) {
  if (!fs.existsSync(path.join(OUT, ON, `${id}.json`))) continue;
  const a = read(OFF, id), b = read(ON, id);
  if (!a.stav?.segments?.length || view(a) === view(b)) continue;
  const im = images[`${SAMPLE}:${id}`];
  if (!im) { console.log(id, "no image recorded"); continue; }
  const tmp = path.join(PACK, `tmp-${id}`);
  fs.mkdirSync(tmp, { recursive: true });
  fs.copyFileSync(path.join(REC, "bodies", im.sha.slice(0, 2), im.sha), path.join(tmp, "in.jpg"));
  execFileSync("sips", ["-s", "format", "png", path.join(tmp, "in.jpg"), "--out", path.join(tmp, "in.png")], { stdio: "ignore" });
  const img = await decodePng(fs.readFileSync(path.join(tmp, "in.png")));
  const cut = a.cut, br = (cut.bearing * Math.PI) / 180, dir = [Math.sin(br), Math.cos(br)], nor = [-dir[1], dir[0]];
  const kx = 111320 * Math.cos((cut.lat * Math.PI) / 180), ky = 110574;
  const lonlat = (t, u) => [cut.lon + (nor[0] * t + dir[0] * u) / kx, cut.lat + (nor[1] * t + dir[1] * u) / ky];
  // Both profiles laid from the high end (the left), as the app does.
  const left = a.cut.span?.left ?? 20, laid = (o) => { let t = o.cut.span?.left ?? left; return o.stav.segments.map((s) => { const r = { ...s, s: t - s.width, e: t }; t -= s.width; return r; }); };
  const pa = laid(a), pb = laid(b);
  const roadT = [...pa, ...pb].filter((s) => ["pruh", "krajnice", "parkovani", "bus", "cyklopruh", "ochranny_pruh"].includes(s.type));
  const t0 = Math.floor(Math.min(...roadT.map((s) => s.s)) - 4), t1 = Math.ceil(Math.max(...roadT.map((s) => s.e)) + 4);
  const W = Math.round((t1 - t0) * PX), HI = 2 * ALONG * PX, BAR = 36, GAP = 6, H = HI + 2 * (BAR + GAP) + 10;
  const rgba = new Uint8Array(W * H * 4).fill(255);
  const [x0, y0, x1, y1] = im.bbox;
  for (let y = 0; y < HI; y++) for (let x = 0; x < W; x++) {
    const [lon, lat] = lonlat(t0 + (x + 0.5) / PX, ALONG - (y + 0.5) / PX), [mx, my] = merc(lon, lat);
    const px = Math.floor(((mx - x0) / (x1 - x0)) * img.width), py = Math.floor(((y1 - my) / (y1 - y0)) * img.height), o = (y * W + x) * 4;
    if (px < 0 || py < 0 || px >= img.width || py >= img.height) { rgba[o] = rgba[o + 1] = rgba[o + 2] = 30; continue; }
    const q = (py * img.width + px) * 4;
    rgba[o] = img.rgba[q]; rgba[o + 1] = img.rgba[q + 1]; rgba[o + 2] = img.rgba[q + 2];
  }
  const px = (x, y, c) => { if (x >= 0 && x < W && y >= 0 && y < H) { const o = (y * W + x) * 4; rgba[o] = c[0]; rgba[o + 1] = c[1]; rgba[o + 2] = c[2]; } };
  // The scale: a tick a metre at the top of the photo (a longer one every 5 m, red at t = 0, the cut's axis).
  for (let m = Math.ceil(t0); m <= t1; m++) for (let y = 0; y < (m % 5 ? 6 : 14); y++) px(Math.round((m - t0) * PX), y, m === 0 ? [255, 0, 0] : [255, 255, 0]);
  const flip = rnd() < 0.5;
  const order = flip ? [["on", pb], ["off", pa]] : [["off", pa], ["on", pb]];
  order.forEach(([which, segs], k) => {
    const yy = HI + 10 + k * (BAR + GAP);
    for (const s of segs) for (let x = Math.round((s.s - t0) * PX); x < Math.round((s.e - t0) * PX); x++) for (let y = 0; y < BAR; y++) px(x, yy + y, (x - Math.round((s.s - t0) * PX)) < 2 ? [0, 0, 0] : s.source === "odhad" && s.type === "parkovani" ? [120, 160, 255] : COLOUR[s.type] || [255, 0, 255]);
    for (let m = Math.ceil(t0); m <= t1; m++) for (let y = 0; y < (m % 5 ? 4 : 10); y++) px(Math.round((m - t0) * PX), yy + BAR - 1 - y, [255, 255, 255]);
  });
  const name = `${process.env.PREFIX || "s"}${String(id).padStart(3, "0")}`;
  fs.writeFileSync(path.join(PACK, `${name}.png`), encodePng(rgba, W, H));
  fs.rmSync(tmp, { recursive: true });
  const text = (o) => (o.stav.segments).map((s) => `${s.type} ${(+s.width).toFixed(2)}${s.source === "odhad" && s.type === "parkovani" ? " (law estimate)" : ""}`).join(" | ");
  key[name] = { id, A: order[0][0], B: order[1][0], textA: text(order[0][0] === "on" ? b : a), textB: text(order[1][0] === "on" ? b : a), street: a.title, highway: sample[id]?.highway, lanes: sample[id]?.lanes, town: sample[id]?.town, t0, t1 };
}
fs.writeFileSync(path.join(PACK, `key-${process.env.PREFIX || "s"}.json`), JSON.stringify(key, null, 1));
console.log(Object.keys(key).length, "packets in", PACK);
