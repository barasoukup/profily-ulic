// Runs the pilot's profile derivation (snapshot in evaluation/snapshot) on every sampled cut,
// the same way app.js cutAt() does after a click, and downloads a leaf-off IPR orthophoto
// around each cut. Needs the pilot server running (node pilot/server.mjs) for its data APIs.
// Usage: node evaluation/run.mjs [from] [to]
import fs from "node:fs/promises";
import path from "node:path";
// DERIVE=pilot uses the live pilot code (results in data/results2, ortho in data/ortho2).
const LIVE = process.env.DERIVE === "pilot";
const D = await import(LIVE ? "../pilot/public/derive.js" : "./snapshot/derive.js");
const { localFrame, nearestStreet, awayFromEnds, mtvuPolygons, trackLines, techLines, esriPolygons, deriveProfile, MAX_REACH } = D;
const OUT = LIVE ? "results2" : "results", ORTHO_DIR = LIVE ? "ortho2" : "ortho";

const ROOT = path.dirname(new URL(import.meta.url).pathname);
const API = process.env.PILOT || "http://localhost:5173";
const HALF = 40;
const ORTHO = "https://gs-pub.praha.eu/imgs/rest/services/ort/mimovegetacni_letecke_snimkovani/ImageServer/exportImage";
const VIEW = 40; // half-size of the orthophoto window (m)
const PX = 800;

const { samples } = JSON.parse(await fs.readFile(path.join(ROOT, "data", "samples.json"), "utf8"));
const [from = 1, to = samples.length] = process.argv.slice(2).map(Number);

async function getJSON(url) {
  for (let i = 0; i < 3; i++) {
    const r = await fetch(url);
    if (r.ok) return r.json();
    if (i === 2) throw new Error(`${r.status} ${await r.text()}`);
    await new Promise((res) => setTimeout(res, 2000 * (i + 1)));
  }
}

const merc = (lon, lat) => [6378137 * (lon * Math.PI) / 180, 6378137 * Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360))];

async function ortho(lat, lon, file) {
  try { await fs.access(file); return; } catch {}
  const [x, y] = merc(lon, lat);
  const h = VIEW / Math.cos((lat * Math.PI) / 180);
  const q = new URLSearchParams({ bbox: [x - h, y - h, x + h, y + h].join(","), bboxSR: 3857, imageSR: 3857, size: `${PX},${PX}`, format: "jpg", f: "image" });
  const r = await fetch(`${ORTHO}?${q}`);
  if (!r.ok) throw new Error("ortho " + r.status);
  await fs.writeFile(file, Buffer.from(await r.arrayBuffer()));
}

async function run(s) {
  const { lat, lon } = s;
  let frame = localFrame(lat, lon);
  const osm = await getJSON(`${API}/api/osm?lat=${lat}&lon=${lon}&r=80`);
  let near = nearestStreet(osm, frame, [0, 0]);
  if (!near) return { error: "no street" };
  near = D.awayFromJunctions ? D.awayFromJunctions(osm, frame, near) : { ...near, ...awayFromEnds(near.pts, near) };
  if (D.centerOnStreet) near = D.centerOnStreet(osm, frame, near);
  const [clon, clat] = frame.toLonLat(...near.point);
  frame = localFrame(clat, clon);
  const dir = near.dir;
  const normal = [-dir[1], dir[0]];
  const reach = { left: MAX_REACH, right: MAX_REACH };
  const full = [-1, 1].map((k) => frame.toLonLat(normal[0] * HALF * k, normal[1] * HALF * k));
  const lons = full.map((e) => e[0]), lats = full.map((e) => e[1]);
  const pad = 0.0004;
  const bbox = [Math.min(...lons) - pad, Math.min(...lats) - pad, Math.max(...lons) + pad, Math.max(...lats) + pad].join(",");
  const [m, k, pk, z] = await Promise.allSettled([
    getJSON(`${API}/api/mtvu?bbox=${bbox}`), getJSON(`${API}/api/linie?bbox=${bbox}`), getJSON(`${API}/api/parkovani?bbox=${bbox}`),
    LIVE ? getJSON(`${API}/api/zps?lat=${clat}&lon=${clon}`) : Promise.reject(new Error("no zps")),
  ]);
  const warn = [];
  const polys = m.status === "fulfilled" ? mtvuPolygons(m.value, frame) : (warn.push("MTVU " + m.reason), []);
  const tracks = k.status === "fulfilled" ? trackLines(k.value, frame) : [];
  const lines = k.status === "fulfilled" ? techLines(k.value, frame) : (warn.push("linie " + k.reason), []);
  const parking = pk.status === "fulfilled" ? esriPolygons(pk.value, frame) : (warn.push("parkovani " + pk.reason), []);
  const inZps = z.status === "fulfilled" ? z.value.count > 0 : undefined;
  const result = deriveProfile({ center: [0, 0], dir, half: HALF, polys, osm, frame, way: near.way, tracks, parking, lines, reach, inZps });
  for (const side of ["left", "right"]) {
    const info = result.edges[`${side}Info`];
    if (!info?.point) continue;
    try {
      const p = await getJSON(`${API}/api/podlaznost?lat=${info.point[1]}&lon=${info.point[0]}`);
      if (p.cornice) Object.assign(info, { cornice: p.cornice, roof: p.roof, levels: p.total || p.cornice + p.roof, src: "ipr" });
    } catch {}
  }
  // Nearby OSM tags of the snapped way, for checking what the pilot read.
  await ortho(clat, clon, path.join(ROOT, "data", ORTHO_DIR, `${s.n}.jpg`));
  return {
    cut: { lat: clat, lon: clon, bearing: (Math.atan2(dir[0], dir[1]) * 180) / Math.PI, wayId: near.way.id, name: near.way.tags.name || null, highway: near.way.tags.highway, tags: near.way.tags },
    mtvuCount: polys.length,
    mtvuCodes: [...new Set(result.runs?.map((r) => r.code))],
    runs: result.runs?.map((r) => ({ code: r.code, s: +r.s.toFixed(2), e: +r.e.toFixed(2) })),
    axisT: result.axisT, extent: result.extent, junction: !!result.junction,
    segments: result.segments, edges: result.edges, notice: result.notice, warn,
  };
}

for (const s of samples.filter((x) => x.n >= from && x.n <= to)) {
  const out = path.join(ROOT, "data", OUT, `${s.n}.json`);
  try {
    const r = await run(s);
    await fs.writeFile(out, JSON.stringify({ sample: s, ...r }, null, 1));
    console.log(s.n, s.highway, s.name, "→", r.cut?.name, r.segments?.map((x) => `${x.type}:${x.width}`).join(" | "));
  } catch (e) {
    await fs.writeFile(out, JSON.stringify({ sample: s, error: String(e.stack || e) }, null, 1));
    console.log(s.n, "ERROR", e.message);
  }
}
