// The blind judging of the arterials (25. 11. 2026): from ../../universal/data/us-tepny.json (../collect.js) the pairs of two
// variants whose parts differ (a type, or a width by 0.2 m), X and Y in a random order (a fixed seed), without sources, at
// most PER cuts a package, each with DC's orthophoto of the cut and the Mapillary photos both ways within 30 m. Writes
// data/<name>-<k>/ (git ignores data/) and results/klic-<name>.json (not to be read before the judging is done).
//   node evaluation/usa/arterials/packages.mjs <name> <A> <B> <seed> [id regex]
import fs from "node:fs/promises";
import path from "node:path";
import { orthoImage } from "../../usa-dc/prepare.mjs";
const HERE = path.dirname(new URL(import.meta.url).pathname), FOTO = path.join(HERE, "data", "foto");
const [name, A, B, s0, re = "."] = process.argv.slice(2);
let seed = Number(s0);
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const TOKEN = (await fs.readFile(path.join(HERE, "..", "..", "streetview", "token.local"), "utf8")).trim();
const angle = (a, b) => Math.abs(((a - b + 540) % 360) - 180);
const rows = JSON.parse(await fs.readFile(path.join(HERE, "..", "..", "universal", "data", "us-tepny.json"), "utf8"));
const differs = (a, b) => a.parts.length !== b.parts.length || a.parts.some(([t, w], i) => t !== b.parts[i][0] || Math.abs(w - b.parts[i][1]) >= 0.2);
await fs.mkdir(FOTO, { recursive: true }); await fs.mkdir(path.join(HERE, "results"), { recursive: true });
async function photos(r) {
  const q = new URLSearchParams({ access_token: TOKEN, lat: r.lat, lng: r.lon, radius: 30, limit: 100, fields: "id,captured_at,compass_angle,computed_compass_angle,is_pano,thumb_1024_url" });
  let imgs = null; const got = [];
  for (const [k, deg] of [["f", r.bearing], ["b", r.bearing + 180]]) {
    const f = path.join(FOTO, `${r.id}-${k}.jpg`);
    if (await fs.stat(f).catch(() => null)) { got.push([k, f]); continue; }
    imgs ??= ((await (await fetch(`https://graph.mapillary.com/images?${q}`)).json()).data || []).map((d) => ({ at: d.captured_at, pano: !!d.is_pano, url: d.thumb_1024_url, c: d.computed_compass_angle ?? d.compass_angle }));
    const im = imgs.filter((i) => i.pano || angle(i.c, deg) <= 35).sort((a, b) => a.pano - b.pano || b.at - a.at)[0];
    if (im) { await fs.writeFile(f, Buffer.from(await (await fetch(im.url)).arrayBuffer())); got.push([k, f]); }
  }
  return got;
}
const todo = [];
for (const id of new Set(rows.map((r) => r.id))) {
  if (!new RegExp(re).test(id)) continue;
  const a = rows.find((r) => r.id === id && r.variant === A), b = rows.find((r) => r.id === id && r.variant === B);
  if (!a?.parts?.length || !b?.parts?.length) { console.log("chybí profil", id); continue; }
  if (differs(a, b)) todo.push([a, b]);
}
for (let i = todo.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [todo[i], todo[j]] = [todo[j], todo[i]]; }
const PER = Number(process.env.PER) || 13, key = {}, fmt = (r) => r.parts.map(([t, w]) => `${t} ${w}`).join(" | ");
for (let k = 0; k * PER < todo.length; k++) {
  const dir = path.join(HERE, "data", `${name}-${k + 1}`), L = [await fs.readFile(path.join(HERE, "BRIEF.md"), "utf8"), ""];
  await fs.mkdir(dir, { recursive: true });
  let n = 0;
  for (const [a, b] of todo.slice(k * PER, (k + 1) * PER)) {
    n++;
    const swap = rnd() < 0.5, half = Math.max(30, Math.ceil(Math.max(...[a, b].map((r) => r.parts.reduce((s, p) => s + p[1], 0))) / 2) + 12);
    key[`${name}-${k + 1}/${n}`] = { id: a.id, X: swap ? B : A, Y: swap ? A : B };
    await orthoImage({ lat: a.lat, lon: a.lon, bearing: a.bearing, half }, path.join(dir, `${n}-ortho.jpg`));
    const ph = await photos(a);
    for (const [q, f] of ph) await fs.copyFile(f, path.join(dir, `${n}-${q}.jpg`));
    L.push(`## ${n}`, `- ulice: ${a.name}; šířka obrázku ${2 * half} m; fotky: ${ph.map((p) => p[0]).join(", ") || "žádné"}`, `- X: ${fmt(swap ? b : a)}`, `- Y: ${fmt(swap ? a : b)}`, "");
  }
  await fs.writeFile(path.join(dir, "ZADANI.md"), L.join("\n"));
}
await fs.writeFile(path.join(HERE, "results", `klic-${name}.json`), JSON.stringify(key, null, 1));
console.log(name, todo.length, "dvojic");
