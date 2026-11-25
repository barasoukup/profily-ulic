// The packages of the fresh measurement (25. 11. 2026): from ../../universal/data/us-fresh.json (../collect.js, variants
// def and dc0) 1. the pairs of the blind A/B, X and Y in a random order (a fixed seed), without sources, in packages of at
// most 10, each with DC's orthophoto and the Mapillary photos both ways within 30 m (data/ab-<k>/, git ignores data/;
// the key vysledky/key.json, not read before the judging is done); 2. the universal measurement of 30 of the cuts (drawn
// with the same seed, in the proportion of the types): the images of ../../universal/POKYN.md without any profile
// (data/u-<k>/).   node evaluation/usa/fresh/packages.mjs
import fs from "node:fs/promises";
import path from "node:path";
import { orthoImage } from "../../usa-dc/prepare.mjs";
// (Another city's measurement by the same code: EVAL_DIR, EVAL_DATA, EVAL_OFF, EVAL_ORTHO, evaluation/canada/measure.sh.)
const HERE = process.env.EVAL_DIR || path.dirname(new URL(import.meta.url).pathname), NAME = process.env.EVAL_DATA || "us-fresh", OFF = process.env.EVAL_OFF || "dc0", UNI = new URL("../../universal/data/", import.meta.url).pathname;
const FOTO = path.join(HERE, "data", "foto");
let seed = 251127;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const shuffle = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const TOKEN = (await fs.readFile(new URL("../../streetview/token.local", import.meta.url).pathname, "utf8")).trim();
const angle = (a, b) => Math.abs(((a - b + 540) % 360) - 180);
const sample = JSON.parse(await fs.readFile(path.join(HERE, process.env.EVAL_SAMPLE || "sample.json"), "utf8")), rows = JSON.parse(await fs.readFile(path.join(UNI, `${NAME}.json`), "utf8"));
const row = (id, v) => rows.find((r) => r.id === id && r.variant === v);
await fs.mkdir(FOTO, { recursive: true }); await fs.mkdir(path.join(HERE, "vysledky"), { recursive: true });
async function photos(r) {
  const got = [];
  let imgs = null;
  for (const [k, deg] of [["f", r.bearing], ["b", r.bearing + 180]]) {
    const f = path.join(FOTO, `${r.id}-${k}.jpg`);
    if (await fs.stat(f).catch(() => null)) { got.push([k, f]); continue; }
    imgs ??= ((await (await fetch(`https://graph.mapillary.com/images?${new URLSearchParams({ access_token: TOKEN, lat: r.lat, lng: r.lon, radius: 30, limit: 100, fields: "id,captured_at,compass_angle,computed_compass_angle,is_pano,thumb_1024_url" })}`)).json()).data || [])
      .map((d) => ({ at: d.captured_at, pano: !!d.is_pano, url: d.thumb_1024_url, c: d.computed_compass_angle ?? d.compass_angle }));
    const im = imgs.filter((i) => i.pano || angle(i.c, deg) <= 35).sort((a, b) => a.pano - b.pano || b.at - a.at)[0];
    if (im) { await fs.writeFile(f, Buffer.from(await (await fetch(im.url)).arrayBuffer())); got.push([k, f]); }
  }
  return got;
}
const ortho = async (r, half, out) => {
  const f = path.join(FOTO, `${r.id}-${half}-ortho.jpg`);
  if (!(await fs.stat(f).catch(() => null))) { await orthoImage({ lat: r.lat, lon: r.lon, bearing: r.bearing, half }, f, process.env.EVAL_ORTHO ? { service: process.env.EVAL_ORTHO } : {}); await new Promise((q) => setTimeout(q, 500)); }
  await fs.copyFile(f, out);
};
const fmt = (r) => r.parts.map(([t, w]) => `${t} ${w}`).join(" | "), differs = (a, b) => a.parts.length !== b.parts.length || a.parts.some(([t, w], i) => t !== b.parts[i][0] || Math.abs(w - b.parts[i][1]) >= 0.2);
const halfOf = (...p) => Math.max(30, Math.ceil(Math.max(...p.map((r) => r.parts.reduce((s, x) => s + x[1], 0))) / 2) + 12);
const full = sample.filter((s) => row(s.id, "def")?.parts?.length && row(s.id, OFF)?.parts?.length);
console.log("bez profilu:", sample.filter((s) => !full.includes(s)).map((s) => s.id).join(", ") || "žádný");
const pairs = shuffle(full.filter((s) => differs(row(s.id, "def"), row(s.id, OFF))));
console.log("dvojic", pairs.length, "beze změny:", full.filter((s) => !pairs.includes(s)).map((s) => s.id).join(", ") || "žádný");
const key = {}, noPhoto = [];
for (let k = 0; k * 10 < pairs.length; k++) {
  const dir = path.join(HERE, "data", `ab-${k + 1}`), L = [await fs.readFile(new URL("POKYN-AB.md", import.meta.url), "utf8"), ""];
  await fs.mkdir(dir, { recursive: true });
  let n = 0;
  for (const s of pairs.slice(k * 10, (k + 1) * 10)) {
    n++;
    const a = row(s.id, "def"), b = row(s.id, OFF), swap = rnd() < 0.5;
    key[`${k + 1}/${n}`] = { id: s.id, X: swap ? OFF : "def", Y: swap ? "def" : OFF };
    const half = halfOf(a, b), ph = await photos(a);
    await ortho(a, half, path.join(dir, `${n}-ortho.jpg`));
    if (!ph.length) noPhoto.push(s.id);
    for (const [q, f] of ph) await fs.copyFile(f, path.join(dir, `${n}-${q}.jpg`));
    L.push(`## ${n}`, `- šířka obrázku ${2 * half} m; fotky: ${ph.map((p) => p[0]).join(", ") || "žádné"}`, `- X: ${fmt(swap ? b : a)}`, `- Y: ${fmt(swap ? a : b)}`, "");
  }
  await fs.writeFile(path.join(dir, "ZADANI.md"), L.join("\n"));
}
await fs.writeFile(path.join(HERE, "vysledky", "key.json"), JSON.stringify(key, null, 1));
// The universal measurement: 30 of the cuts with a photo, by types in the sample's proportion.
const left = full.filter((s) => !noPhoto.includes(s.id)), kinds = [...new Set(left.map((s) => s.kind))], pick = [];
for (const kind of kinds) { const l = shuffle(left.filter((s) => s.kind === kind)); pick.push(...l.slice(0, Math.round((30 * l.length) / left.length))); }
const u = shuffle(pick);
for (let k = 0; k * 10 < u.length; k++) {
  const dir = path.join(HERE, "data", `u-${k + 1}`);
  await fs.mkdir(dir, { recursive: true });
  const L = [];
  for (const s of u.slice(k * 10, (k + 1) * 10)) {
    const r = row(s.id, "def");
    await ortho(r, 30, path.join(dir, `${s.id}-ortho.jpg`));
    const ph = await photos(r);
    for (const [q, f] of ph) await fs.copyFile(f, path.join(dir, `${s.id}-${q}.jpg`));
    await fs.writeFile(path.join(dir, `${s.id}.txt`), "60");
    L.push(`- ${s.id}: šířka obrázku 60 m; fotky: ${ph.map((p) => p[0]).join(", ")}`);
  }
  await fs.writeFile(path.join(dir, "SEZNAM.md"), L.join("\n"));
}
await fs.writeFile(path.join(HERE, "vysledky", "u-cuts.json"), JSON.stringify(u.map((s) => s.id)));
console.log("bez fotky podél ulice:", noPhoto.join(", ") || "žádný", "| univerzální měření", u.length, JSON.stringify(Object.fromEntries(kinds.map((k) => [k, u.filter((s) => s.kind === k).length]))));
