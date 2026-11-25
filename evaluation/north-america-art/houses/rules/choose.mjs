// The look each sample house gets: PUB=<pilot/public> node choose.mjs <scratch dir with dc.json> <out.json>
// (buildingAt, buildingStyle of that checkout: before = 59ec341, after = this branch).
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
const HERE = path.dirname(fileURLToPath(import.meta.url)), PUB = path.resolve(process.env.PUB);
const imp = (f) => import(pathToFileURL(path.join(PUB, f)));
globalThis.document ??= { createElementNS: () => ({}) };
const { setCity } = await imp("city.js"), D = await imp("derive.js"), P = await imp("profile.js");
setCity("usa");
const { buildings } = JSON.parse(fs.readFileSync(path.join(process.argv[2], "dc.json")));
const out = [];
for (const s of JSON.parse(fs.readFileSync(path.join(HERE, process.env.SAMPLE || "sample.json")))) {
  const [lon, lat] = s.probe, kx = 111320 * Math.cos((lat * Math.PI) / 180), ky = 110574;
  const near = buildings.filter((b) => Math.abs(b.geometry[0].lon - lon) < 0.0025 && Math.abs(b.geometry[0].lat - lat) < 0.002);
  const frame = { toXY: (a, b) => [(a - lon) * kx, (b - lat) * ky], toLonLat: (x, y) => [lon + x / kx, lat + y / ky] };
  const b = D.buildingAt({ elements: near }, frame, [0, 0]);
  const info = { levels: b?.levels, height: b?.height, point: s.probe, km: 99, block: b?.block, tint: Number(s.id) % 4 };
  if (b?.type && b.type !== "yes") info.type = b.type;
  if (b?.roofShape) info.roofShape = b.roofShape;
  if (b?.start) info.start = b.start;
  if (b?.material) info.material = b.material;
  out.push({ id: s.id, found: !!b, info, look: P.buildingStyle(info) });
}
fs.writeFileSync(process.argv[3], JSON.stringify(out, null, 1));
console.log(out.map((o) => `${o.id} ${o.look} ${o.info.type || "-"} ${o.info.levels ?? "-"} parts ${o.info.block?.parts ?? "-"}`).join("\n"));
