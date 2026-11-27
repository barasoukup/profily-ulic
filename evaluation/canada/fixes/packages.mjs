// The packages of the fixes' blind A/Bs (../losses/FIXES.md): of each group the fresh cuts (sample.json) whose profile the group's fixes
// change, X and Y in a random order (a fixed seed), without sources, at most 10 in a package, each with the city's orthophoto
// and the Mapillary photos within 30 m (the year each was taken is said, and that the orthophoto wins over an older photo).
// data/pack-<group>-<k>/ (git ignores data/); the key results/key.json, not read before the judging is done.
//   TOKEN=<file> node evaluation/canada/fixes/packages.mjs
import fs from "node:fs/promises";
import path from "node:path";
import { orthoImage, DC_ORTHO } from "../../usa-dc/prepare.mjs";
const HERE = path.dirname(new URL(import.meta.url).pathname), DATA = path.join(HERE, "data"), FOTO = path.join(DATA, "foto");
import { NYS_ORTHO, MA_ORTHO } from "../../../app/public/lanes-ortho.js";
const ORTHO = { dc: DC_ORTHO, toronto: "https://gis.toronto.ca/arcgis/rest/services/basemap/cot_ortho/MapServer/export", newyork: `${NYS_ORTHO}/export` };
// (Each city's orthophoto as the app reads it: Boston MassGIS's tiles, New York the state's, Toronto the city's.)
const orthoOf = (a) => (a.id.startsWith("ntrack") ? { service: ORTHO.newyork } : /^b(dual|track)/.test(a.id) ? { tiles: MA_ORTHO } : { service: a.lat < 41 ? ORTHO.dc : ORTHO.toronto });
const TOKEN = (await fs.readFile(process.env.TOKEN, "utf8")).trim();
let seed = 261127;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const shuffle = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const angle = (a, b) => Math.abs(((a - b + 540) % 360) - 180);
const sample = JSON.parse(await fs.readFile(path.join(HERE, "sample.json"), "utf8"));
const rows = (await Promise.all(["na-fixes-plan"].map((f) => fs.readFile(path.join(HERE, `../../universal/data/${f}.json`), "utf8").then(JSON.parse, () => [])))).flat();
const row = (id, v) => rows.find((r) => r.id === id && r.variant === v);
await fs.mkdir(FOTO, { recursive: true }); await fs.mkdir(path.join(HERE, "results"), { recursive: true });
async function photos(r) {
  const got = []; let imgs = null;
  for (const [k, deg] of [["f", r.bearing], ["b", r.bearing + 180]]) {
    const f = path.join(FOTO, `${r.id}-${k}.jpg`), meta = f + ".json";
    if (await fs.stat(f).catch(() => null)) { got.push([k, f, JSON.parse(await fs.readFile(meta, "utf8")).at]); continue; }
    imgs ??= ((await (await fetch(`https://graph.mapillary.com/images?${new URLSearchParams({ access_token: TOKEN, lat: r.lat, lng: r.lon, radius: 30, limit: 100, fields: "id,captured_at,compass_angle,computed_compass_angle,is_pano,thumb_1024_url" })}`)).json()).data || [])
      .map((d) => ({ at: d.captured_at, pano: !!d.is_pano, url: d.thumb_1024_url, c: d.computed_compass_angle ?? d.compass_angle }));
    const im = imgs.filter((i) => i.pano || angle(i.c, deg) <= 35).sort((a, b) => a.pano - b.pano || b.at - a.at)[0];
    if (im) { await fs.writeFile(f, Buffer.from(await (await fetch(im.url)).arrayBuffer())); await fs.writeFile(meta, JSON.stringify({ at: im.at })); got.push([k, f, im.at]); }
  }
  return got;
}
const differs = (a, b) => a.parts.length !== b.parts.length || a.parts.some(([t, w], i) => t !== b.parts[i][0] || Math.abs(w - b.parts[i][1]) >= 0.2);
const fmt = (r) => r.parts.map(([t, w]) => `${t} ${w}`).join(" | ");
// group: [variant without the group's fixes, the cap, the sample's groups]
// (Only the shared fixes, Bára 26. 11. 2026: the DDOT and Toronto's houses left out as one city's.)
// (Bára 27. 11. 2026: all three fixes together against none, plan0 = ?off=gapsortho,gapswide,trackaxis; every changed profile.)
const GROUPS = { all: ["plan0", 200, ["dual", "tram", "track", "tf", "bdual", "btrack", "ntrack"]] };
const NOTE = "\nPozor: ortofoto je novější než většina fotek (u každé fotky je rok pořízení). Kde se fotka a ortofoto liší (nová cyklostezka, přestavba), platí ortofoto; starší fotka bez cyklostezky neznamená, že tam dnes není.\n";
const key = {}, report = {};
for (const [g, [OFF, cap, from]] of Object.entries(GROUPS)) {
  const full = sample.filter((s) => from.includes(s.group) && row(s.id, "def")?.parts?.length && row(s.id, OFF)?.parts?.length), changed = full.filter((s) => differs(row(s.id, "def"), row(s.id, OFF)));
  const pairs = shuffle(changed).slice(0, cap);
  report[g] = { profiles: full.length, changed: changed.length, judged: pairs.length, photo: 0 };
  for (let k = 0; k * 10 < pairs.length; k++) {
    const dir = path.join(DATA, `pack-${g}-${k + 1}`), L = [await fs.readFile(path.join(HERE, "../../usa/fresh/POKYN-AB.md"), "utf8"), NOTE];
    await fs.mkdir(dir, { recursive: true });
    let n = 0;
    for (const s of pairs.slice(k * 10, (k + 1) * 10)) {
      n++;
      const a = row(s.id, "def"), b = row(s.id, OFF), swap = rnd() < 0.5;
      key[`${g}-${k + 1}/${n}`] = { id: s.id, group: s.group, kind: s.kind, X: swap ? OFF : "def", Y: swap ? "def" : OFF };
      const half = Math.max(30, Math.ceil(Math.max(...[a, b].map((r) => r.parts.reduce((q, x) => q + x[1], 0))) / 2) + 12), ph = await photos(a);
      const o = path.join(FOTO, `${a.id}-${half}-ortho.jpg`);
      if (!(await fs.stat(o).catch(() => null))) { await orthoImage({ lat: a.lat, lon: a.lon, bearing: a.bearing, half }, o, orthoOf(a)); await new Promise((q) => setTimeout(q, 500)); }
      await fs.copyFile(o, path.join(dir, `${n}-ortho.jpg`));
      for (const [q, f] of ph) await fs.copyFile(f, path.join(dir, `${n}-${q}.jpg`));
      key[`${g}-${k + 1}/${n}`].photo = ph.length > 0;
      if (ph.length) report[g].photo++;
      L.push(`## ${n}`, `- šířka obrázku ${2 * half} m; fotky: ${ph.map((p) => `${p[0]} (${new Date(p[2]).getFullYear()})`).join(", ") || "žádné"}`, `- X: ${fmt(swap ? b : a)}`, `- Y: ${fmt(swap ? a : b)}`, "");
    }
    await fs.writeFile(path.join(dir, "ZADANI.md"), L.join("\n"));
  }
}
await fs.writeFile(path.join(HERE, "results", "key.json"), JSON.stringify(key, null, 1));
await fs.writeFile(path.join(HERE, "results", "packages.json"), JSON.stringify(report, null, 1));
console.log(JSON.stringify(report));
