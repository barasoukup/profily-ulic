// Prague open data of Geoportál Praha (CC BY 4.0) for the profiles, downloaded once per deploy from the
// Hub download API of opendata.geoportalpraha.cz (never on a click), cut into small static tiles:
//   - "Sdílená data o zeleni – vegetační prvky – body": single trees (kod_vp 71 "Strom") of TSK, MHMP and
//     the districts;
//   - "Stromořadí": tree rows (lines);
//   - "Zákaz stání": no-parking sections of the paid parking zones (TSK, polygons along the kerb);
//   - "Uliční úseky TSK včetně zatřídění komunikací": the class of each street section (lines).
// The GeoJSON links come from the DCAT feed; when the feed does not answer, from the known item ids.
//   node tools/build_praha_opendata.mjs [outDir]   (default pilot/data/praha; served as data/praha/…)
//   ONLY=stromy,zakaz node tools/build_praha_opendata.mjs   (only these datasets; the others are left out)
//   FROM=dir: read <dir>/<name>.geojson instead of downloading (a local copy).
// Output: <outDir>/opendata/<ix>_<iy>.json, tiles of TILE degrees (one file holds all four datasets, so a
// cut reads one or a few files), and <outDir>/opendata/about.json. Coordinates are integers: millionths of a
// degree from the tile's south-west corner. Read by pilot/public/sources.js (prahaTile).
import fs from "node:fs";
import path from "node:path";

export const TILE = 0.01; // degrees (sources.js PRAHA_TILE)
const ROOT = path.join(path.dirname(new URL(import.meta.url).pathname), "..");
const OUT = path.join(process.argv[2] || path.join(ROOT, "pilot", "data", "praha"), "opendata");
const FEED = "https://opendata.geoportalpraha.cz/api/feed/dcat-ap/2.1.1.json";
const DOWNLOAD = (id) => `https://opendata.geoportalpraha.cz/api/download/v1/items/${id}/geojson?layers=0`;
const DATASETS = {
  stromy: { title: "Sdílená data o zeleni - vegetační prvky - body", id: "802a43db41474d4db5789ef5a47f2985", min: 50000 },
  stromorad: { title: "Stromořadí", id: "3615fd648f1f4182b5f42dcdfba03b54", min: 1000 },
  zakaz: { title: "Zákaz stání", id: "b2be4777cec1443fa1e9b4b0d385fed1", min: 1000 },
  useky: { title: "Uliční úseky TSK včetně zatřídění komunikací", id: "1bbe08c6c9f44c70810957c5e10f22db", min: 10000 },
};
const ONLY = process.env.ONLY ? new Set(process.env.ONLY.split(",")) : null;
// Footways, stairs, park and field paths, underpasses and tunnels: no street of the profile.
const NOT_STREET = new Set([8, 9, 10, 18, 23, 24, 25, 28, 33, 36, 37, 45, 46]);

async function get(url, ms = 15 * 60000) {
  for (let attempt = 0; ; attempt++) {
    try {
      const r = await fetch(url, { headers: { "User-Agent": "profily-ulic build" }, signal: AbortSignal.timeout(ms) });
      if (!r.ok) throw new Error(`${r.status} ${url}`);
      return await r.json();
    } catch (err) {
      if (attempt >= 2) throw err;
      await new Promise((res) => setTimeout(res, 20000 * (attempt + 1)));
    }
  }
}
// The GeoJSON link of each dataset from the DCAT feed (by title), else the known item id.
async function links() {
  const out = Object.fromEntries(Object.entries(DATASETS).map(([k, d]) => [k, DOWNLOAD(d.id)]));
  try {
    const feed = await get(FEED, 120000);
    for (const d of feed["dcat:dataset"] || []) {
      const title = String(d["dct:title"] ?? "").trim();
      const k = Object.keys(DATASETS).find((x) => DATASETS[x].title === title);
      if (!k) continue;
      const g = [].concat(d["dcat:distribution"] || []).find((x) => /GEOJSON/i.test(JSON.stringify(x["dct:format"])));
      const url = g?.["dcat:accessURL"]?.["@id"] || g?.["dcat:downloadURL"]?.["@id"];
      if (url) out[k] = url;
    }
  } catch (err) { console.warn(`DCAT feed: ${err.message}; known item ids used`); }
  return out;
}

// Douglas–Peucker in metres (a tolerance of 0.3 m keeps the kerb lines and rows where they are).
function simplify(pts, tol = 0.3) {
  if (pts.length < 3) return pts;
  const kx = 111320 * Math.cos((pts[0][1] * Math.PI) / 180), ky = 110574;
  const keep = new Uint8Array(pts.length); keep[0] = keep[pts.length - 1] = 1;
  const stack = [[0, pts.length - 1]];
  while (stack.length) {
    const [a, b] = stack.pop();
    const [ax, ay] = [pts[a][0] * kx, pts[a][1] * ky], [bx, by] = [pts[b][0] * kx, pts[b][1] * ky];
    const dx = bx - ax, dy = by - ay, l = Math.hypot(dx, dy) || 1;
    let best = -1, dmax = tol;
    for (let i = a + 1; i < b; i++) {
      const d = Math.abs((pts[i][0] * kx - ax) * dy - (pts[i][1] * ky - ay) * dx) / l;
      if (d > dmax) { dmax = d; best = i; }
    }
    if (best >= 0) { keep[best] = 1; stack.push([a, best], [best, b]); }
  }
  return pts.filter((_, i) => keep[i]);
}

const tiles = new Map();
const tileOf = (ix, iy) => {
  const k = `${ix}_${iy}`;
  if (!tiles.has(k)) tiles.set(k, { ix, iy, t: [], r: [], z: [], u: [] });
  return tiles.get(k);
};
const enc = (tile, pts) => pts.flatMap(([lon, lat]) => [Math.round((lon - tile.ix * TILE) * 1e6), Math.round((lat - tile.iy * TILE) * 1e6)]);
// A line or ring goes into every tile its bounding box touches (the reader drops repeats by id).
function addShape(key, pts, extra = []) {
  const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
  for (let ix = Math.floor(Math.min(...xs) / TILE); ix <= Math.floor(Math.max(...xs) / TILE); ix++)
    for (let iy = Math.floor(Math.min(...ys) / TILE); iy <= Math.floor(Math.max(...ys) / TILE); iy++) {
      const tile = tileOf(ix, iy);
      tile[key].push([...extra, ...enc(tile, pts)]);
    }
}

const READ = {
  stromy(json) {
    let n = 0;
    for (const f of json.features) {
      if (f.properties?.kod_vp !== 71) continue; // 71 Strom (51 keř, 21 zeleň v nádobách, 101 popínavá dřevina)
      const g = f.geometry;
      for (const [lon, lat] of g?.type === "MultiPoint" ? g.coordinates : g?.type === "Point" ? [g.coordinates] : []) {
        const tile = tileOf(Math.floor(lon / TILE), Math.floor(lat / TILE));
        tile.t.push(...enc(tile, [[lon, lat]]));
        n++;
      }
    }
    return n;
  },
  stromorad(json) {
    let n = 0;
    json.features.forEach((f, id) => {
      const g = f.geometry;
      for (const line of g?.type === "MultiLineString" ? g.coordinates : g?.type === "LineString" ? [g.coordinates] : []) {
        if (line.length > 1) { addShape("r", simplify(line), [id]); n++; }
      }
    });
    return n;
  },
  zakaz(json) {
    let n = 0;
    json.features.forEach((f, id) => {
      const g = f.geometry;
      for (const poly of g?.type === "MultiPolygon" ? g.coordinates : g?.type === "Polygon" ? [g.coordinates] : []) {
        // Small rings of a few points: kept as they are, without the closing point (Douglas–Peucker would
        // fold a closed ring onto its first point).
        if (poly[0]?.length > 3) { addShape("z", poly[0].slice(0, -1), [id]); n++; }
      }
    });
    return n;
  },
  useky(json) {
    let n = 0;
    json.features.forEach((f, id) => {
      const p = f.properties || {};
      if (NOT_STREET.has(p.typkomunik)) return;
      const g = f.geometry;
      // [id, třída místní komunikace 1–4 (0 none), třída silnice 1–3 (0 none), dálnice 0/1, typ komunikace]
      for (const line of g?.type === "MultiLineString" ? g.coordinates : g?.type === "LineString" ? [g.coordinates] : []) {
        if (line.length > 1) { addShape("u", simplify(line, 1), [id, p.tridamk || 0, p.tridasil || 0, p.dalnice || 0, p.typkomunik || 0]); n++; }
      }
    });
    return n;
  },
};

const urls = await links();
const about = { source: "Geoportál Praha, opendata.geoportalpraha.cz (IPR Praha, TSK, MHMP, městské části), CC BY 4.0", built: new Date().toISOString().slice(0, 10), tile: TILE, datasets: {} };
for (const [k, d] of Object.entries(DATASETS)) {
  if (ONLY && !ONLY.has(k)) continue;
  const json = process.env.FROM ? JSON.parse(fs.readFileSync(path.join(process.env.FROM, `${k}.geojson`), "utf8")) : await get(urls[k]);
  const n = READ[k](json);
  if (n < d.min) throw new Error(`${k}: only ${n} features, not writing ${OUT}`);
  about.datasets[k] = { title: d.title, url: urls[k], features: n };
  console.log(`${k}: ${n}`);
}
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });
let bytes = 0;
for (const [k, tile] of tiles) {
  const body = {};
  for (const key of ["t", "r", "z", "u"]) if (tile[key].length) body[key] = tile[key];
  const text = JSON.stringify(body);
  fs.writeFileSync(path.join(OUT, `${k}.json`), text);
  bytes += text.length;
}
fs.writeFileSync(path.join(OUT, "about.json"), JSON.stringify(about, null, 1));
console.log(`${tiles.size} tiles, ${(bytes / 1048576).toFixed(1)} MiB → ${OUT}`);
