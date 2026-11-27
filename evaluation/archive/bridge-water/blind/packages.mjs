// The blind packages of an A/B of 26. 11. 2026 (archive/bridge-water/blind, passports-blind): the pairs whose profiles differ,
// X and Y in a random order (seed 20261126), sources hidden, in packages of at most 10, each with the state's open
// orthophoto (../../../universal/ortho.mjs: the street up, A left, 10 px = 1 m) and the Mapillary photos both ways within
// 30 m; the key in results/key.json (not read before the judging is done), the hash of every image in
// results/images.sha256. Images in evaluation/<study>/data/<dir> (git ignores them: some orthophotos are for viewing).
//   node evaluation/archive/bridge-water/blind/packages.mjs <rows.json> <sample.json> <variant 1> <variant 2> <out data dir> <results dir> [measure]
// "measure": also packages of the orthophoto alone (data dir m-<k>) for the widths of the outer sidewalks (BRIEF-SIDEWALK.md).
import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { orthoImage } from "../../../universal/ortho.mjs";
const [ROWS, SAMPLE, V1, V2, OUT, RES, MEASURE] = process.argv.slice(2);
const HERE = path.dirname(new URL(import.meta.url).pathname);
let seed = 20261126;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const shuffle = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const TOKEN = (await fs.readFile(new URL("../../../streetview/token.local", import.meta.url).pathname, "utf8")).trim();
const angle = (a, b) => Math.abs(((a - b + 540) % 360) - 180);
const rows = new Map(JSON.parse(await fs.readFile(ROWS, "utf8")).map((r) => [r.id, r])), sample = JSON.parse(await fs.readFile(SAMPLE, "utf8"));
const FOTO = path.join(OUT, "foto");
await fs.mkdir(FOTO, { recursive: true }); await fs.mkdir(RES, { recursive: true });
async function photos(r) {
  const got = [];
  let imgs = null;
  for (const [k, deg] of [["f", r.bearing], ["b", r.bearing + 180]]) {
    const f = path.join(FOTO, `${r.id}-${k}.jpg`);
    if (await fs.stat(f).catch(() => null)) { got.push([k, f]); continue; }
    await new Promise((q) => setTimeout(q, 300));
    imgs ??= ((await (await fetch(`https://graph.mapillary.com/images?${new URLSearchParams({ access_token: TOKEN, lat: r.lat, lng: r.lon, radius: 30, limit: 100, fields: "id,captured_at,compass_angle,computed_compass_angle,is_pano,thumb_1024_url" })}`)).json()).data || [])
      .map((d) => ({ at: d.captured_at, pano: !!d.is_pano, url: d.thumb_1024_url, c: d.computed_compass_angle ?? d.compass_angle }));
    const im = imgs.filter((i) => i.pano || angle(i.c, deg) <= 35).sort((a, b) => a.pano - b.pano || b.at - a.at)[0];
    if (im) { await fs.writeFile(f, Buffer.from(await (await fetch(im.url)).arrayBuffer())); got.push([k, f]); }
  }
  return got;
}
async function ortho(r, half) {
  const f = path.join(FOTO, `${r.id}-${half}-ortho.jpg`);
  if (!(await fs.stat(f).catch(() => null))) { await orthoImage({ lat: r.lat, lon: r.lon, bearing: r.bearing, country: r.country, half }, f); await new Promise((q) => setTimeout(q, 500)); }
  return f;
}
const fmt = (p) => p.parts.map(([t, w]) => `${t} ${w}`).join(" | ");
const differs = (a, b) => a.parts.length !== b.parts.length || a.parts.some(([t, w], i) => t !== b.parts[i][0] || Math.abs(w - b.parts[i][1]) >= 0.2);
const halfOf = (...p) => Math.max(30, Math.ceil(Math.max(...p.map((r) => r.parts.reduce((s, x) => s + x[1], 0))) / 2) + 12);
const status = {};
const pairs = [];
for (const s of sample) {
  const r = rows.get(s.id), a = r?.[V1], b = r?.[V2];
  if (!a?.parts?.length || !b?.parts?.length) { status[s.id] = "bez profilu"; continue; }
  if (!differs(a, b)) { status[s.id] = "stejné"; continue; }
  // Noise: the first variant run twice differs (collect.js noise).
  const again = r[`${V1}2`];
  if (again?.parts && differs(a, again)) { status[s.id] = "šum"; continue; }
  pairs.push({ s, a: { ...a, id: s.id, country: s.country }, b });
}
shuffle(pairs);
const key = {}, hashes = [], ok = [];
for (const p of pairs) {
  const half = halfOf(p.a, p.b);
  try { p.ortho = await ortho(p.a, half); p.half = half; ok.push(p); status[p.s.id] = "pár"; }
  catch (e) { status[p.s.id] = `bez ortofota (${e.message.slice(0, 60)})`; }
}
const POKYN = await fs.readFile(path.join(HERE, "BRIEF-AB.md"), "utf8");
for (let k = 0; k * 10 < ok.length; k++) {
  const dir = path.join(OUT, `ab-${k + 1}`), L = [POKYN, ""];
  await fs.mkdir(dir, { recursive: true });
  let n = 0;
  for (const p of ok.slice(k * 10, (k + 1) * 10)) {
    n++;
    const swap = rnd() < 0.5;
    key[`${k + 1}/${n}`] = { id: p.s.id, X: swap ? V2 : V1, Y: swap ? V1 : V2 };
    await fs.copyFile(p.ortho, path.join(dir, `${n}-ortho.jpg`));
    const ph = await photos(p.a);
    for (const [q, f] of ph) await fs.copyFile(f, path.join(dir, `${n}-${q}.jpg`));
    L.push(`## ${n}`, `- šířka obrázku ${2 * p.half} m; fotky: ${ph.map((x) => x[0]).join(", ") || "žádné"}`, `- X: ${fmt(swap ? p.b : p.a)}`, `- Y: ${fmt(swap ? p.a : p.b)}`, "");
  }
  await fs.writeFile(path.join(dir, "ZADANI.md"), L.join("\n"));
}
if (MEASURE) {
  // The widths of the outer sidewalks, blind (no profile), every pair's orthophoto in another order.
  const M = shuffle(ok.slice()), POK = await fs.readFile(path.join(HERE, "BRIEF-SIDEWALK.md"), "utf8"), mkey = {};
  for (let k = 0; k * 12 < M.length; k++) {
    const dir = path.join(OUT, `m-${k + 1}`), L = [POK, ""];
    await fs.mkdir(dir, { recursive: true });
    let n = 0;
    for (const p of M.slice(k * 12, (k + 1) * 12)) {
      n++;
      mkey[`${k + 1}/${n}`] = p.s.id;
      await fs.copyFile(p.ortho, path.join(dir, `${n}-ortho.jpg`));
      const ph = await photos(p.a);
      for (const [q, f] of ph) await fs.copyFile(f, path.join(dir, `${n}-${q}.jpg`));
      L.push(`- ${n}: šířka obrázku ${2 * p.half} m; fotky: ${ph.map((x) => x[0]).join(", ") || "žádné"}`);
    }
    await fs.writeFile(path.join(dir, "SEZNAM.md"), L.join("\n"));
  }
  await fs.writeFile(path.join(RES, "measure-key.json"), JSON.stringify(mkey, null, 1));
}
for (const d of (await fs.readdir(OUT)).filter((d) => /^(ab|m)-\d+$/.test(d)).sort())
  for (const f of (await fs.readdir(path.join(OUT, d))).sort()) hashes.push(`${crypto.createHash("sha256").update(await fs.readFile(path.join(OUT, d, f))).digest("hex")}  ${d}/${f}`);
await fs.writeFile(path.join(RES, "key.json"), JSON.stringify(key, null, 1));
await fs.writeFile(path.join(RES, "images.sha256"), hashes.join("\n") + "\n");
await fs.writeFile(path.join(RES, "status.json"), JSON.stringify(status, null, 1));
const cnt = {};
for (const v of Object.values(status)) { const k = v.replace(/ \(.*/, ""); cnt[k] = (cnt[k] || 0) + 1; }
console.log("dvojic", ok.length, JSON.stringify(cnt));
