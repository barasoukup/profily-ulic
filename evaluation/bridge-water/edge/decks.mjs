// The bridge decks across a cut as the app reads them (ortho-osm.js deckSpans) from the local pack, for checking:
//   node evaluation/bridge-water/edge/decks.mjs <pack> <lat> <lon> <bearing> <wayId>
import fs from "node:fs";
import path from "node:path";
const HERE = path.dirname(new URL(import.meta.url).pathname), W = path.join(HERE, "../../..");
const { Pack } = await import(W + "/app/public/osmpack.js");
const { mergePieces, TILE } = await import(W + "/app/public/osmtile.js");
const { deckSpans } = await import(W + "/app/public/ortho-osm.js");
const { localFrame } = await import(W + "/app/public/derive.js");
const [code, lat, lon, bearing, wayId] = process.argv.slice(2);
const dir = W + "/app/data/osm-pack/", idx = JSON.parse(fs.readFileSync(dir + "index.json"));
const fd = fs.openSync(dir + idx.files[code], "r");
const pack = new Pack(async (s, e) => { const b = Buffer.alloc(e - s + 1); fs.readSync(fd, b, 0, b.length, s); return { bytes: new Uint8Array(b.buffer, b.byteOffset, b.length) }; });
const ix = Math.floor(+lon / TILE), iy = Math.floor(+lat / TILE), names = [];
for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) names.push(`${ix + i}_${iy + j}`);
const els = mergePieces(await pack.tiles(names));
const frame = localFrame(+lat, +lon);
const b = (+bearing * Math.PI) / 180, d = [Math.sin(b), Math.cos(b)];
const way = els.find((e) => e.type === "way" && e.id === +wayId);
console.log("way", way?.tags);
console.log("decks near", els.filter((e) => e.type === "area" && e.tags.man_made === "bridge").map((e) => e.tags.name || e.id).slice(0, 10));
console.log(JSON.stringify(deckSpans(els, frame, d, way)));
if (process.env.RING) for (const e of els.filter((e) => e.type === "area" && e.tags.man_made === "bridge")) {
  const n = [-d[1], d[0]];
  console.log(e.geometry.map((p) => { const [x, y] = frame.toXY(p.lon, p.lat); return `${(x * n[0] + y * n[1]).toFixed(1)},${(x * d[0] + y * d[1]).toFixed(1)}`; }).join(" "));
}
if (process.env.GREEN) {
  const { WATER, GREEN } = await import(W + "/app/public/ortho-osm.js");
  const n = [-d[1], d[0]];
  for (const e of els.filter((e) => e.type === "area" && (WATER(e.tags) || GREEN(e.tags)))) {
    const g = e.geometry.map((p) => { const [x, y] = frame.toXY(p.lon, p.lat); return [x * n[0] + y * n[1], x * d[0] + y * d[1]]; });
    const ts = [];
    for (let i = 0; i < g.length; i++) { const [a, b] = [g[i], g[(i + 1) % g.length]]; if ((a[1] > 0) !== (b[1] > 0)) ts.push(a[0] + ((0 - a[1]) / (b[1] - a[1])) * (b[0] - a[0])); }
    if (ts.some((t) => Math.abs(t) < 45)) console.log(JSON.stringify(e.tags), ts.sort((a, b) => a - b).map((t) => t.toFixed(1)).join(" "));
  }
}
if (process.env.WAYS) {
  const n = [-d[1], d[0]];
  for (const e of els.filter((e) => e.type === "way" && (e.tags.highway || e.tags.railway))) {
    const g = e.geometry.map((p) => { const [x, y] = frame.toXY(p.lon, p.lat); return [x * n[0] + y * n[1], x * d[0] + y * d[1]]; });
    for (let i = 0; i + 1 < g.length; i++) {
      const [a, b] = [g[i], g[i + 1]];
      if ((a[1] > 0) === (b[1] > 0)) continue;
      const t = a[0] + ((0 - a[1]) / (b[1] - a[1])) * (b[0] - a[0]);
      if (Math.abs(t) < 45) console.log(t.toFixed(1), e.id, e.tags.highway || e.tags.railway, e.tags.name || "", e.tags.ref || "", "layer", e.tags.layer, "bridge", e.tags.bridge, "oneway", e.tags.oneway);
    }
  }
}
