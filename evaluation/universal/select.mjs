// The universal judging (Bára 17. 11. 2026), choosing the cuts to judge: the app's cuts (data/app.json from collect.js),
// town by town in the sample's order, the first 4 that have a street-level photo (Mapillary everywhere, in Czechia also
// the Mapy.com panorama), with their photos and orthophoto (prepare.mjs). Writes judge.json (the chosen cuts, without
// their profiles: those stay in data/app.json).
//   node evaluation/universal/select.mjs [country …]
import fs from "node:fs/promises";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const run = promisify(execFile), ROOT = path.dirname(new URL(import.meta.url).pathname), DATA = path.join(ROOT, "data");
const only = process.argv.slice(2);
const app = [];
for (const f of (await fs.readdir(DATA)).filter((f) => /^app(-[a-z-]+)?\.json$/.test(f))) app.push(...JSON.parse(await fs.readFile(path.join(DATA, f), "utf8")).filter((r) => r.parts?.length && r.lat && (!only.length || only.includes(r.country))));
// Cuts on a driveway, parking aisle or drive-through (vysledky/sluzebni-<iso>.json) are not judged (score-states.mjs
// leaves them out; 24. 11. 2026), so the town's 4 go to streets.
const noStreet = new Set();
for (const f of (await fs.readdir(path.join(ROOT, "vysledky"))).filter((f) => /^sluzebni-[a-z]+\.json$/.test(f))) for (const r of JSON.parse(await fs.readFile(path.join(ROOT, "vysledky", f), "utf8"))) if (["driveway", "parking_aisle", "drive-through"].includes(r.service)) noStreet.add(r.id);
const old = JSON.parse(await fs.readFile(path.join(ROOT, "judge.json"), "utf8").catch(() => "[]")).filter((r) => only.length && !only.includes(r.country));
const chosen = [...old], PER_TOWN = 4;
const has = async (id) => (await fs.stat(path.join(DATA, `${id}-f.jpg`)).catch(() => null)) || (await fs.stat(path.join(DATA, `${id}-b.jpg`)).catch(() => null));
for (const r of app) {
  if (noStreet.has(r.id) || chosen.some((c) => c.id === r.id)) continue;
  if (chosen.filter((c) => c.town === r.town && c.country === r.country).length >= PER_TOWN) continue;
  // The orthophoto wide enough for the app's profile and 4 m beyond it on each side.
  const half = Math.min(40, Math.max(r.span?.left || 15, r.span?.right || 15) + 4);
  const one = { id: r.id, country: r.country, town: r.town, lat: r.lat, lon: r.lon, bearing: r.bearing, half: +half.toFixed(1), photos: true, needPhoto: true };
  await fs.writeFile(path.join(DATA, "one.json"), JSON.stringify([one]));
  await run("node", [path.join(ROOT, "prepare.mjs"), path.join(DATA, "one.json")]).catch((e) => console.log(r.id, e.message));
  if (await has(r.id)) { chosen.push(one); console.log(r.id, "ano"); } else console.log(r.id, "bez fotky");
}
await fs.writeFile(path.join(ROOT, "judge.json"), JSON.stringify(chosen, null, 1));
console.log("vybráno", chosen.length);
