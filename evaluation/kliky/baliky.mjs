// The blind packages of the A/B of placement (POKYN-AB.md): node evaluation/kliky/baliky.mjs <out dir> <profiles.json …>
// Orthophotos of the click and of each variant's place, street photos at the click (Mapillary, the token of
// evaluation/streetview, never printed), X and Y in a random order, no sources; the key in vysledky/klic.json.
// ORTHO=<ortho.mjs> for a place whose state this branch's has not (Washington).
import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { orthoImage } from "../universal/ortho.mjs";
const ROOT = path.dirname(new URL(import.meta.url).pathname), [out, ...files] = process.argv.slice(2);
const orthoUS = process.env.ORTHO ? (await import(pathToFileURL(process.env.ORTHO))).orthoImage : orthoImage;
const TOKEN = (await fs.readFile(path.join(ROOT, "../streetview/token.local"), "utf8")).trim();
const pairs = Object.fromEntries(JSON.parse(await fs.readFile(path.join(ROOT, process.env.PARY || "data/pary.json"), "utf8")).map((p) => [p.pid, p]));
let seed = 99173; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const angle = (a, b) => Math.abs(((a - b + 540) % 360) - 180);
const differs = (a, b) => a.segments.map((s) => s[0]).join() !== b.segments.map((s) => s[0]).join() || a.segments.some((s, i) => Math.abs(s[1] - b.segments[i][1]) >= 0.4);
const rows = [];
for (const f of files) rows.push(...JSON.parse(await fs.readFile(f, "utf8")));
const bad = rows.filter((r) => !r.O?.segments?.length || !r.N?.segments?.length), todo = rows.filter((r) => !bad.includes(r) && differs(r.O, r.N));
for (let i = todo.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [todo[i], todo[j]] = [todo[j], todo[i]]; }
console.log(rows.length, "dvojic, bez profilu", bad.map((r) => r.pid).join(" "), "stejné", rows.length - bad.length - todo.length, "k posouzení", todo.length);
const PER = 11, key = {};
for (let k = 0; k * PER < todo.length; k++) {
  const dir = path.join(out, `b${k + 1}`), L = [];
  await fs.mkdir(dir, { recursive: true });
  for (const [i, r] of todo.slice(k * PER, (k + 1) * PER).entries()) {
    const n = i + 1, p = pairs[r.pid], swap = rnd() < 0.5, V = { X: swap ? r.N : r.O, Y: swap ? r.O : r.N };
    key[`b${k + 1}/${n}`] = { pid: r.pid, X: swap ? "N" : "O", Y: swap ? "O" : "N" };
    const ortho = p.country === "US" ? orthoUS : orthoImage, half = Math.min(40, Math.max(18, Math.ceil(Math.max(...["X", "Y"].flatMap((q) => [V[q].span?.left || 0, V[q].span?.right || 0])) + 4)));
    for (const [q, at] of [["X", V.X], ["Y", V.Y], ["K", { lat: p.lat, lon: p.lon, bearing: p.N.bearing }]]) try { await ortho({ lat: at.lat, lon: at.lon, bearing: at.bearing, country: p.country, half }, path.join(dir, `${n}-${q}.jpg`)); } catch (e) { console.log(p.id, q, String(e).slice(0, 100)); }
    const photos = [];
    try {
      const u = new URLSearchParams({ access_token: TOKEN, lat: p.lat, lng: p.lon, radius: 30, limit: 100, fields: "id,captured_at,compass_angle,computed_compass_angle,is_pano,thumb_1024_url" });
      const imgs = ((await (await fetch(`https://graph.mapillary.com/images?${u}`)).json()).data || []).map((d) => ({ at: d.captured_at, pano: !!d.is_pano, url: d.thumb_1024_url, c: d.computed_compass_angle ?? d.compass_angle }));
      for (const [kk, deg] of [["f", p.N.bearing], ["b", p.N.bearing + 180]]) {
        const im = imgs.filter((x) => !x.pano && angle(x.c, deg) <= 35).sort((a, b) => b.at - a.at)[0];
        if (!im) continue;
        await fs.writeFile(path.join(dir, `${n}-${kk}.jpg`), Buffer.from(await (await fetch(im.url)).arrayBuffer()));
        photos.push(`${kk} ${new Date(im.at).getFullYear()}`);
      }
    } catch { /* no photo */ }
    L.push(`## ${n}`, `- ulice: ${p.name || "(bez jména)"} (OSM ${p.highway}); šířka obrázku ${2 * half} m; fotky: ${photos.join(", ") || "žádné"}`, ...["X", "Y"].map((q) => `- ${q} (od středu A ${V[q].span?.left} m, B ${V[q].span?.right} m): ${V[q].segments.map(([t, w]) => `${t} ${String(w).replace(".", ",")}`).join(" · ")}`), "");
    await new Promise((x) => setTimeout(x, 200));
  }
  await fs.copyFile(path.join(ROOT, "POKYN-AB.md"), path.join(dir, "POKYN.md"));
  await fs.writeFile(path.join(dir, "ZADANI.md"), L.join("\n"));
}
await fs.mkdir(path.join(ROOT, "vysledky"), { recursive: true });
await fs.writeFile(path.join(ROOT, process.env.KLIC || "vysledky/klic.json"), JSON.stringify(key, null, 1));
