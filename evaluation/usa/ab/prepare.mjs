// The blind A/B of phase 2 (Bára 24. 11. 2026): from the collected profiles (evaluation/universal/data/<IN>.json, rows
// { id, variant, lat, lon, bearing, parts }), the pairs of two variants (A, B: e.g. def against dc0) whose parts differ,
// each with the judge's inputs: DC's orthophoto across the cut (evaluation/usa-dc/prepare.mjs orthoImage: the street up,
// A on the left, 10 px = 1 m) and the Mapillary photos along the street both ways (within 30 m), for Europe the
// orthophoto of the universal measurement (evaluation/universal/ortho.mjs). The two profiles go as X and Y in an order
// drawn with a fixed seed, the key kept apart (key-<name>.json) so the judges do not see which is which.
//   IN=us-ab A=def B=dc0 NAME=dc node evaluation/usa/ab/prepare.mjs
import fs from "node:fs/promises";
import path from "node:path";
import { orthoImage } from "../../usa-dc/prepare.mjs";

const HERE = path.dirname(new URL(import.meta.url).pathname), DATA = path.join(HERE, "data");
const { IN = "us-ab", A = "def", B = "dc0", NAME = "dc", ONLY = "" } = process.env;
const TOKEN = (await fs.readFile(path.join(HERE, "..", "..", "streetview", "token.local"), "utf8")).trim();
const angle = (a, b) => Math.abs(((a - b + 540) % 360) - 180);
let seed = 4242 + NAME.length;
const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32);

async function photos(r) {
  const q = new URLSearchParams({ access_token: TOKEN, lat: r.lat, lng: r.lon, radius: 30, limit: 100, fields: "id,captured_at,compass_angle,computed_compass_angle,is_pano,thumb_2048_url" });
  const imgs = ((await (await fetch(`https://graph.mapillary.com/images?${q}`)).json()).data || []).map((d) => ({ at: d.captured_at, pano: !!d.is_pano, url: d.thumb_2048_url, c: d.computed_compass_angle ?? d.compass_angle }));
  const got = [];
  for (const [k, deg] of [["f", r.bearing], ["b", r.bearing + 180]]) {
    const f = path.join(DATA, `${r.id}-${k}.jpg`);
    if (await fs.stat(f).catch(() => null)) { got.push(f); continue; }
    const im = imgs.filter((i) => i.pano || angle(i.c, deg) <= 35).sort((a, b) => a.pano - b.pano || b.at - a.at)[0];
    if (im) { await fs.writeFile(f, Buffer.from(await (await fetch(im.url)).arrayBuffer())); got.push(f); }
  }
  return got;
}

await fs.mkdir(DATA, { recursive: true });
const rows = JSON.parse(await fs.readFile(path.join(HERE, "..", "..", "universal", "data", `${IN}.json`), "utf8"));
const by = (id, v) => rows.find((r) => r.id === id && r.variant === v);
const ids = [...new Set(rows.map((r) => r.id))].filter((id) => !ONLY || new RegExp(ONLY).test(id));
const out = [], key = {};
for (const id of ids) {
  const a = by(id, A), b = by(id, B);
  if (!a?.parts?.length || !b?.parts?.length || JSON.stringify(a.parts) === JSON.stringify(b.parts)) continue;
  const at = a; // the cut of A (a moved cut: its own place)
  const half = Math.max(30, Math.ceil(Math.max(a.parts.reduce((s, p) => s + p[1], 0), b.parts.reduce((s, p) => s + p[1], 0)) / 2) + 6);
  const ortho = path.join(DATA, `${id}-ortho.jpg`);
  if (!(await fs.stat(ortho).catch(() => null))) {
    if (at.country === "US") await orthoImage({ lat: at.lat, lon: at.lon, bearing: at.bearing, half }, ortho);
    else { const u = await import("../../universal/ortho.mjs"); await u.orthoImage({ lat: at.lat, lon: at.lon, bearing: at.bearing, country: at.country, half }, ortho); }
  }
  const pics = await photos(at);
  const swap = rnd() < 0.5;
  key[id] = swap ? { X: B, Y: A } : { X: A, Y: B };
  const fmt = (r) => r.parts.map(([t, w]) => `${t} ${w}`).join(" | ");
  out.push({ id, name: at.name, ortho, halfM: half, photos: pics, X: fmt(swap ? b : a), Y: fmt(swap ? a : b) });
  console.log(id, pics.length, "fotek");
}
await fs.writeFile(path.join(HERE, `pairs-${NAME}.json`), JSON.stringify(out, null, 1));
await fs.writeFile(path.join(DATA, `key-${NAME}.json`), JSON.stringify(key, null, 1));
console.log(NAME, out.length, "dvojic");
