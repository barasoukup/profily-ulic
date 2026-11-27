// The packages of the rule of another street inside the profile (?off=otherstreet): the changed cuts of fork-sample.json, as packages.mjs
// (the state's orthophoto of ../../universal/ortho.mjs).   TOKEN=<file> node fork-packages.mjs      adds to results/key.json
import fs from "node:fs/promises";
import path from "node:path";
import { orthoImage } from "../../universal/ortho.mjs";
import { orthoImage as ours, DC_ORTHO } from "../../usa-dc/prepare.mjs";
const HERE = path.dirname(new URL(import.meta.url).pathname), DATA = path.join(HERE, "..", "data"), FOTO = path.join(DATA, "foto-review"), TOKEN = (await fs.readFile(process.env.TOKEN, "utf8")).trim();
const ISO = { praha: "CZ", brno: "CZ", plzen: "CZ", bratislava: "SK", wien: "AT", graz: "AT", berlin: "DE", koeln: "DE", zuerich: "CH", warszawa: "PL", krakow: "PL", paris: "FR", lyon: "FR", amsterdam: "NL", antwerpen: "BE", helsinki: "FI", kobenhavn: "DK", madrid: "ES", torino: "IT", ljubljana: "SI" };
let seed = 251213; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const shuffle = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const angle = (a, b) => Math.abs(((a - b + 540) % 360) - 180);
const sample = JSON.parse(await fs.readFile(path.join(HERE, "fork-sample.json"), "utf8")), rows = JSON.parse(await fs.readFile(path.join(HERE, "../../universal/data/na-fork.json"), "utf8")), row = (id, v) => rows.find((r) => r.id === id && r.variant === v);
const differs = (a, b) => a.parts.length !== b.parts.length || a.parts.some(([t, w], i) => t !== b.parts[i][0] || Math.abs(w - b.parts[i][1]) >= 0.2), fmt = (r) => r.parts.map(([t, w]) => `${t} ${w}`).join(" | ");
const full = sample.filter((s) => row(s.id, "def")?.parts?.length && row(s.id, "os0")?.parts?.length), changed = full.filter((s) => differs(row(s.id, "def"), row(s.id, "os0"))), message = full.filter((s) => !changed.includes(s) && row(s.id, "def").status !== row(s.id, "os0").status);
const pairs = shuffle(changed), key = JSON.parse(await fs.readFile(path.join(HERE, "results/key.json"), "utf8")), report = { sample: sample.length, profiles: full.length, changed: changed.length, message: message.length, noOrtho: [] };
let n = 0, k = 1, L = null, dir;
const flush = async () => { if (L) await fs.writeFile(path.join(dir, "ZADANI.md"), L.join("\n")); };
for (const s of pairs) {
  const a = row(s.id, "def"), b = row(s.id, "os0"), swap = rnd() < 0.5, half = Math.max(30, Math.ceil(Math.max(...[a, b].map((r) => r.parts.reduce((q, x) => q + x[1], 0))) / 2) + 12), o = path.join(FOTO, `${s.id}-${half}-ortho.jpg`);
  if (!(await fs.stat(o).catch(() => null))) {
    try { await (s.city === "washington" ? ours(Object.assign({ lat: a.lat, lon: a.lon, bearing: a.bearing, half }), o, { service: DC_ORTHO }) : orthoImage({ id: s.id, lat: a.lat, lon: a.lon, bearing: a.bearing, country: ISO[s.city], half }, o)); }
    catch (e) { report.noOrtho.push(`${s.id} ${e.message}`); continue; }
    await new Promise((q) => setTimeout(q, 500));
  }
  if (!L || n === 10) { await flush(); if (L) k++; n = 0; dir = path.join(DATA, `review-fork-${k}`); await fs.mkdir(dir, { recursive: true }); L = [await fs.readFile(path.join(HERE, "../../usa/fresh/BRIEF-AB.md"), "utf8"), ""]; }
  n++;
  await fs.copyFile(o, path.join(dir, `${n}-ortho.jpg`));
  const imgs = ((await (await fetch(`https://graph.mapillary.com/images?${new URLSearchParams({ access_token: TOKEN, lat: a.lat, lng: a.lon, radius: 30, limit: 100, fields: "id,captured_at,compass_angle,computed_compass_angle,is_pano,thumb_1024_url" })}`)).json()).data || []).map((d) => ({ at: d.captured_at, pano: !!d.is_pano, url: d.thumb_1024_url, c: d.computed_compass_angle ?? d.compass_angle })), ph = [];
  for (const [q, deg] of [["f", a.bearing], ["b", a.bearing + 180]]) { const im = imgs.filter((i) => i.pano || angle(i.c, deg) <= 35).sort((x, y) => x.pano - y.pano || y.at - x.at)[0]; if (im) { await fs.writeFile(path.join(dir, `${n}-${q}.jpg`), Buffer.from(await (await fetch(im.url)).arrayBuffer())); ph.push(q); } }
  key[`fork-${k}/${n}`] = { id: s.id, X: swap ? "os0" : "def", Y: swap ? "def" : "os0", photo: ph.length > 0 };
  L.push(`## ${n}`, `- šířka obrázku ${2 * half} m; fotky: ${ph.join(", ") || "žádné"}`, `- X: ${fmt(swap ? b : a)}`, `- Y: ${fmt(swap ? a : b)}`, "");
}
await flush();
await fs.writeFile(path.join(HERE, "results/key.json"), JSON.stringify(key, null, 1));
await fs.writeFile(path.join(HERE, "results/fork.json"), JSON.stringify(report, null, 1));
console.log(JSON.stringify(report));
