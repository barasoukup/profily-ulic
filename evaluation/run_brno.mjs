// The Brno version of run.mjs: every sampled cut (brno/data/samples.json) through the live pilot code as a
// click on the Brno site does it (city "brno", data from pilot/data/brno, read by pilot/public/sources.js),
// plus Brno's 2025 orthophoto tiles around each cut (gis.brno.cz, 90 × 90 m, about 20 cm/px).
// Usage: node evaluation/run_brno.mjs [from] [to] → evaluation/brno/data/results/<n>.json, ortho/<n>.jpg
import fs from "node:fs/promises";
import path from "node:path";

const ROOT = path.dirname(new URL(import.meta.url).pathname);
// CITY=jihlava (or another town, tools/cities.mjs) runs that town's sample the same way
// (evaluation/<town>/data, the town's orthophoto from its module's `ortho`).
const CITY = process.env.CITY || "brno";
const DATA = path.join(ROOT, CITY, "data");
const PILOT_DATA = path.join(ROOT, "..", "pilot", "data", CITY);
globalThis.PROFILY_CITY = CITY;
// sources.js reads "data/…" next to the page: here the files in pilot/data/brno.
const webFetch = globalThis.fetch;
globalThis.fetch = async (url, opts) => {
  const u = String(url);
  if (!u.startsWith("data/")) return webFetch(url, opts);
  try {
    const text = await fs.readFile(path.join(PILOT_DATA, u.slice(5)), "utf8");
    return { ok: true, status: 200, json: async () => JSON.parse(text), text: async () => text };
  } catch {
    return { ok: false, status: 404, json: async () => null, text: async () => "" };
  }
};
const D = await import("../pilot/public/derive.js");
const S = await import("../pilot/public/sources.js");
const { localFrame, nearestStreet, awayFromJunctions, centerOnStreet, mtvuPolygons, trackLines, techLines, esriPolygons, deriveProfile, MAX_REACH } = D;

const HALF = 40;
// Brno's orthophoto is a tile cache only (its export answers 500): the tiles around the cut are saved
// with their offsets from the cut centre in metres, and render_brno.mjs lays them out.
const TILES = "https://gis.brno.cz/ags1/rest/services/OMI/OMI_basemaps_ortofoto_2025_wgs/MapServer/tile";
const Z = 19, VIEW = 45; // zoom (about 0.2 m/px on the ground), half-size of the window (m)
const R = 6378137, WORLD = 2 * Math.PI * R;
const merc = (lon, lat) => [R * (lon * Math.PI) / 180, R * Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360))];
// A town's orthophoto (towns/<id>.js ortho): its ArcGIS export answers, one image of the window in Web
// Mercator, saved as one "tile" for render_brno.mjs. Without one, the ČÚZK orthophoto (WMS).
const CUZK_ORTHO = "https://ags.cuzk.gov.cz/arcgis1/services/ORTOFOTO/MapServer/WMSServer";
async function orthoTown(lat, lon, dir) {
  const { TOWNS } = await import("../pilot/public/towns/index.js");
  const o = TOWNS[CITY]?.ortho;
  const [x, y] = merc(lon, lat);
  const scale = Math.cos((lat * Math.PI) / 180), h = VIEW / scale, bbox = [x - h, y - h, x + h, y + h].join(",");
  const url = o
    ? `${o.service}?${new URLSearchParams({ bbox, bboxSR: 3857, imageSR: 3857, size: "900,900", format: "jpg", f: "image", ...(o.datum ? { datumTransformations: `[${o.datum}]` } : {}) })}`
    : `${CUZK_ORTHO}?${new URLSearchParams({ service: "WMS", request: "GetMap", version: "1.3.0", layers: "0", styles: "", crs: "EPSG:3857", bbox, width: 900, height: 900, format: "image/jpeg" })}`;
  const r = await webFetch(url);
  if (!r.ok) return;
  await fs.writeFile(path.join(dir, "0.jpg"), Buffer.from(await r.arrayBuffer()));
  await fs.writeFile(path.join(dir, "tiles.json"), JSON.stringify([{ file: "0.jpg", e: -VIEW, n: VIEW, size: 2 * VIEW }]));
}
async function ortho(lat, lon, dir) {
  try { await fs.access(path.join(dir, "tiles.json")); return; } catch {}
  await fs.mkdir(dir, { recursive: true });
  if (CITY !== "brno") return orthoTown(lat, lon, dir);
  const [x, y] = merc(lon, lat);
  const scale = Math.cos((lat * Math.PI) / 180); // ground metres per Mercator metre
  const h = VIEW / scale, size = WORLD / 2 ** Z;
  const tx = (mx) => Math.floor((mx + WORLD / 2) / size), ty = (my) => Math.floor((WORLD / 2 - my) / size);
  const tiles = [];
  for (let ix = tx(x - h); ix <= tx(x + h); ix++) for (let iy = ty(y + h); iy <= ty(y - h); iy++) {
    const file = `${ix}_${iy}.jpg`;
    const r = await webFetch(`${TILES}/${Z}/${iy}/${ix}`);
    if (!r.ok) continue;
    await fs.writeFile(path.join(dir, file), Buffer.from(await r.arrayBuffer()));
    // left/top edge of the tile from the cut centre, in ground metres (east, north)
    tiles.push({ file, e: (ix * size - WORLD / 2 - x) * scale, n: (WORLD / 2 - iy * size - y) * scale, size: size * scale });
    await new Promise((res) => setTimeout(res, 120));
  }
  await fs.writeFile(path.join(dir, "tiles.json"), JSON.stringify(tiles));
}

const { samples } = JSON.parse(await fs.readFile(path.join(DATA, "samples.json"), "utf8"));
const [from = 1, to = samples.length] = process.argv.slice(2).map(Number);
await fs.mkdir(path.join(DATA, "results"), { recursive: true });
await fs.mkdir(path.join(DATA, "ortho"), { recursive: true });

async function run(s) {
  const { lat, lon } = s;
  let frame = localFrame(lat, lon);
  const osm = await S.osm(lat, lon, 80);
  let near = nearestStreet(osm, frame, [0, 0]);
  if (!near) return { error: "no street" };
  near = awayFromJunctions(osm, frame, near);
  near = centerOnStreet(osm, frame, near);
  const [clon, clat] = frame.toLonLat(...near.point);
  frame = localFrame(clat, clon);
  const dir = near.dir, normal = [-dir[1], dir[0]];
  const reach = { left: MAX_REACH, right: MAX_REACH };
  const full = [-1, 1].map((k) => frame.toLonLat(normal[0] * HALF * k, normal[1] * HALF * k));
  const lons = full.map((e) => e[0]), lats = full.map((e) => e[1]);
  const pad = 0.0004;
  const bbox = [Math.min(...lons) - pad, Math.min(...lats) - pad, Math.max(...lons) + pad, Math.max(...lats) + pad].join(",");
  const inZps = await S.zps(clat, clon);
  const [m, k, pk] = await Promise.all([S.mtvu(bbox), S.linie(bbox), S.parkovani(bbox, inZps)]);
  const polys = mtvuPolygons(m, frame);
  const result = deriveProfile({ center: [0, 0], dir, half: HALF, polys, osm, frame, way: near.way, tracks: trackLines(k, frame), parking: esriPolygons(pk, frame), lines: techLines(k, frame), reach, inZps });
  for (const side of ["left", "right"]) {
    const info = result.edges[`${side}Info`];
    if (!info?.point) continue;
    const p = await S.podlaznost(info.point[1], info.point[0]);
    if (p.cornice) Object.assign(info, { cornice: p.cornice, roof: p.roof, levels: p.cornice + p.roof, roofType: p.roofType, iprKind: p.kind, area: p.area, src: CITY !== "brno" ? "ruian" : "kam" });
    if (p.built) info.built = p.built;
    if (p.panel) info.panel = 1;
    if (p.house) info.house = 1;
  }
  await ortho(clat, clon, path.join(DATA, "ortho", String(s.n)));
  return {
    cut: { lat: clat, lon: clon, bearing: (Math.atan2(dir[0], dir[1]) * 180) / Math.PI, wayId: near.way.id, name: near.way.tags.name || null, highway: near.way.tags.highway, tags: near.way.tags },
    mtvuCount: polys.length, inZps,
    runs: result.runs?.map((r) => ({ code: r.code, s: +r.s.toFixed(2), e: +r.e.toFixed(2) })),
    axisT: result.axisT, extent: result.extent, junction: !!result.junction,
    segments: result.segments, edges: result.edges, notice: result.notice,
  };
}

for (const s of samples.filter((x) => x.n >= from && x.n <= to)) {
  const out = path.join(DATA, "results", `${s.n}.json`);
  try {
    const r = await run(s);
    await fs.writeFile(out, JSON.stringify({ sample: s, ...r }, null, 1));
    console.log(s.n, s.highway, s.name, "→", r.cut?.name, r.segments?.map((x) => `${x.type}:${x.width}`).join(" | "));
  } catch (e) {
    await fs.writeFile(out, JSON.stringify({ sample: s, error: String(e.stack || e) }, null, 1));
    console.log(s.n, "ERROR", e.message);
  }
}
