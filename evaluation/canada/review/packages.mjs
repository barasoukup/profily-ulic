// The packages of the second review's A/Bs: of each group the first cuts whose profile the rule changes (at most CAP), X and Y in a
// random order (a fixed seed), without sources, at most 10 in a package, each with the city's orthophoto and the Mapillary photos
// within 30 m where there are any (data/review-<group>-<k>/; git ignores data/; the key results/key.json, not read before
// the judging is done).   TOKEN=<file> node evaluation/canada/review/packages.mjs
import fs from "node:fs/promises";
import path from "node:path";
import { orthoImage, DC_ORTHO } from "../../usa-dc/prepare.mjs";
const HERE = path.dirname(new URL(import.meta.url).pathname), DATA = path.join(HERE, "..", "data"), FOTO = path.join(DATA, "foto-review");
const ORTHO = { dc: DC_ORTHO, toronto: "https://gis.toronto.ca/arcgis/rest/services/basemap/cot_ortho/MapServer/export" };
const TOKEN = (await fs.readFile(process.env.TOKEN, "utf8")).trim();
let seed = 251209;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const shuffle = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const angle = (a, b) => Math.abs(((a - b + 540) % 360) - 180);
const sample = JSON.parse(await fs.readFile(path.join(HERE, "sample.json"), "utf8")), rows = JSON.parse(await fs.readFile(path.join(HERE, "../../universal/data/na-review.json"), "utf8"));
const row = (id, v) => rows.find((r) => r.id === id && r.variant === v);
await fs.mkdir(FOTO, { recursive: true }); await fs.mkdir(path.join(HERE, "results"), { recursive: true });
async function photos(r) {
  const got = []; let imgs = null;
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
const differs = (a, b) => a.parts.length !== b.parts.length || a.parts.some(([t, w], i) => t !== b.parts[i][0] || Math.abs(w - b.parts[i][1]) >= 0.2);
const fmt = (r) => r.parts.map(([t, w]) => `${t} ${w}`).join(" | ");
const GROUPS = { ddot: ["ddot0", 60, ["ddot"]], gaps: ["gaps0", 40, ["tram", "dual"]], tracks: ["rt0", 24, ["track"]], bays: ["bays0", 20, ["bay"]] };
const key = {}, report = {};
for (const [g, [OFF, cap, from]] of Object.entries(GROUPS)) {
  const full = sample.filter((s) => from.includes(s.group) && row(s.id, "def")?.parts?.length && row(s.id, OFF)?.parts?.length), changed = full.filter((s) => differs(row(s.id, "def"), row(s.id, OFF)));
  const pairs = shuffle(changed).slice(0, cap);
  report[g] = { sample: sample.filter((s) => from.includes(s.group)).length, profiles: full.length, map: full.filter((s) => row(s.id, "def").sources?.cityMap).length, changed: changed.length, judged: pairs.length, photo: {} };
  for (let k = 0; k * 10 < pairs.length; k++) {
    const dir = path.join(DATA, `review-${g}-${k + 1}`), L = [await fs.readFile(path.join(HERE, "../../usa/fresh/POKYN-AB.md"), "utf8"), ""];
    await fs.mkdir(dir, { recursive: true });
    let n = 0;
    for (const s of pairs.slice(k * 10, (k + 1) * 10)) {
      n++;
      const a = row(s.id, "def"), b = row(s.id, OFF), swap = rnd() < 0.5;
      key[`${g}-${k + 1}/${n}`] = { id: s.id, kind: s.kind, X: swap ? OFF : "def", Y: swap ? "def" : OFF };
      const half = Math.max(30, Math.ceil(Math.max(...[a, b].map((r) => r.parts.reduce((q, x) => q + x[1], 0))) / 2) + 12), ph = await photos(a);
      const o = path.join(FOTO, `${a.id}-${half}-ortho.jpg`);
      if (!(await fs.stat(o).catch(() => null))) { await orthoImage({ lat: a.lat, lon: a.lon, bearing: a.bearing, half }, o, { service: a.lat < 41 ? ORTHO.dc : ORTHO.toronto }); await new Promise((q) => setTimeout(q, 500)); }
      await fs.copyFile(o, path.join(dir, `${n}-ortho.jpg`));
      for (const [q, f] of ph) await fs.copyFile(f, path.join(dir, `${n}-${q}.jpg`));
      key[`${g}-${k + 1}/${n}`].photo = ph.length > 0;
      const q = (report[g].photo[s.kind] ??= [0, 0]); q[1]++; if (ph.length) q[0]++;
      L.push(`## ${n}`, `- šířka obrázku ${2 * half} m; fotky: ${ph.map((p) => p[0]).join(", ") || "žádné"}`, `- X: ${fmt(swap ? b : a)}`, `- Y: ${fmt(swap ? a : b)}`, "");
    }
    await fs.writeFile(path.join(dir, "ZADANI.md"), L.join("\n"));
  }
}
await fs.writeFile(path.join(HERE, "results", "key.json"), JSON.stringify(key, null, 1));
await fs.writeFile(path.join(HERE, "results", "packages.json"), JSON.stringify(report, null, 1));
console.log(JSON.stringify(report));
