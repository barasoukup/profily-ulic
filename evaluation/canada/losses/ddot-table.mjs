// node evaluation/canada/losses/ddot-table.mjs   (all 45 judged DDOT pairs; services cached in data/cache)
// For each judged DDOT pair: the votes, how far along the street the nearest intersection or crosswalk polygon of DC's
// Planimetrics lies (from the cut's centre, 0.5 m steps up to 40 m), the roadway width at the cut, the block's parking
// and lanes, the lane width left after the parking, whether the block's line lies in the roadway run with the cut's way.
import fs from "node:fs";
const W = new URL("../../../", import.meta.url).pathname;
const SP = new URL("data/cache/", import.meta.url).pathname;
fs.mkdirSync(SP, { recursive: true });
globalThis.PROFILY_US = {};
const { osmAt } = await import(W + "evaluation/clicks/osm.mjs");
const usa = await import(W + "app/public/towns/usa.js");
const P = await import(W + "app/public/towns/planimetrics.js");
const { cutOfBox } = await import(W + "app/public/towns/belgium.js");
const crypto = await import("node:crypto");
const R = W + "evaluation/canada/review/";
const sample = JSON.parse(fs.readFileSync(R + "sample.json", "utf8")), key = JSON.parse(fs.readFileSync(R + "results/key.json", "utf8"));
const lines = (f) => fs.readFileSync(R + f, "utf8").split("\n").filter((l) => l.trim()).map((l) => JSON.parse(l));
async function get(url) {
  const f = SP + crypto.createHash("sha1").update(url).digest("hex") + ".json";
  if (fs.existsSync(f)) return JSON.parse(fs.readFileSync(f, "utf8"));
  await new Promise((r) => setTimeout(r, 500));
  const j = await (await fetch(url)).json();
  fs.writeFileSync(f, JSON.stringify(j));
  return j;
}
const q = (base, id, bbox, fields) => get(`${base}/${id}/query?${new URLSearchParams({ geometry: bbox, geometryType: "esriGeometryEnvelope", inSR: "4326", outSR: "4326", spatialRel: "esriSpatialRelIntersects", f: "json", outFields: fields, returnGeometry: "true" })}`);
const out = [];
for (const k of Object.keys(key).filter((k) => k.startsWith("ddot-"))) {
  const [pack, n] = k.split("/");
  const v = ["a", "b"].map((j) => { const r = lines(`results/${pack}-${j}.jsonl`).find((x) => String(x.n) === n); return r.verdict === "X" || r.verdict === "Y" ? (key[k][r.verdict] === "def" ? "def" : "off") : r.verdict; });
  const s = sample.find((x) => x.id === key[k].id), half = 35;
  const b = (s.bearing * Math.PI) / 180, along = [Math.sin(b), Math.cos(b)], dir = [along[1], -along[0]];
  const kx = 111320 * Math.cos((s.lat * Math.PI) / 180), ky = 110574, pad = 0.0004;
  const ends = [-1, 1].map((m) => [s.lon + (m * dir[0] * half) / kx, s.lat + (m * dir[1] * half) / ky]);
  const bbox = [Math.min(ends[0][0], ends[1][0]) - pad, Math.min(ends[0][1], ends[1][1]) - pad, Math.max(ends[0][0], ends[1][0]) + pad, Math.max(ends[0][1], ends[1][1]) + pad].map((x) => x.toFixed(6)).join(",");
  const [roads, walks] = await Promise.all([q(usa.DC_PLAN, 10, bbox, "DESCRIPTION"), q(usa.DC_PLAN, 11, bbox, "DESCRIPTION")]);
  const polys = [...(roads.features || []).filter((f) => /intersection/i.test(f.attributes.DESCRIPTION)), ...(walks.features || []).filter((f) => /crosswalk/i.test(f.attributes.DESCRIPTION))]
    .map((f) => f.geometry.rings.map((r) => r.map(([lon, lat]) => [(lon - s.lon) * kx, (lat - s.lat) * ky])));
  let dj = null;
  for (let d = 0; d <= 40 && dj === null; d += 0.5) for (const sg of [1, -1]) if (dj === null && polys.some((rings) => P.inRings(rings, along[0] * d * sg, along[1] * d * sg))) dj = d;
  // also off-axis: along lines ±3 m across
  const { elements } = await osmAt(s.lat, s.lon, 90, false);
  const way = elements.find((e) => e.type === "way" && e.id === s.wayId);
  const c = cutOfBox(bbox, [way]);
  const sub = await q(usa.DC_SUBBLOCK.replace(/\/162$/, ""), 162, bbox, "*");
  const block = usa.blockOf(sub, c, way.tags);
  const bldg = await q(usa.DC_PLAN, 1, bbox, "DESCRIPTION");
  const r = usa.dcSurfaces({ roads, walks, bldg, sub }, elements, bbox, way.tags, { ddot: true, way });
  const r0 = usa.dcSurfaces({ roads, walks, bldg, sub }, elements, bbox, way.tags, { ddot: false, way });
  const span = (rr, code) => (rr?.features || []).filter((f) => f.attributes.code === code).map((f) => { const ts = f.geometry.rings[0].map(([lon, lat]) => ((lon - c.lon0) * c.kx) * c.dir[0] + ((lat - c.lat0) * c.ky) * c.dir[1]); return Math.max(...ts) - Math.min(...ts); });
  const parks = span(r, 704), road0 = span(r0, 701).filter((w) => w < 40), road1 = span(r, 701).filter((w) => w < 40);
  const nl = +(r?.wayTags?.lanes || way.tags.lanes || 2);
  const fit = parks.length, lw = road1.length ? (road1.reduce((a, b) => a + b, 0) / nl) : null;
  out.push({ fit, lw: lw && +lw.toFixed(2), road0: road0.map((x) => +x.toFixed(1)).join("+"), k, id: s.id, kind: s.kind, v: v.join(","), score: v.filter((x) => x === "def").length - v.filter((x) => x === "off").length, dj, park: block?.a.TOTALPARKINGLANES, lanes: block?.a.TOTALTRAVELLANES, osmPark: Object.entries(way.tags).filter(([t]) => /^parking/.test(t)).map(([t, x]) => `${t}=${x}`).join(" "), osmLanes: way.tags.lanes, oneway: way.tags.oneway });
}
for (const o of out.sort((a, b) => a.score - b.score)) console.log(JSON.stringify(o));
