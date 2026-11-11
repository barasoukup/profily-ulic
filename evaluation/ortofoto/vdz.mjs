// Hradec Králové: the town's road markings as lines (pasport komunikací of T-MAPY, WFS layer pk-dzv-l "vodorovné
// liniové"), an independent check of what the orthophoto finds (Bára 11. 11. 2026: use it, but do not trust it
// fully). Per sampled cut (evaluation/hradec/data/ab-city-stejne/<n>.json) the lines within ±25 m are fetched
// once (data/hradec/vdz/<n>.json) and turned into positions across the cut: every piece running along the street
// (within 20° of it) and within ±20 m along it gives its t (as run.mjs: across the cut, A → B), clustered by 0.2 m.
//   node evaluation/ortofoto/vdz.mjs        → data/hradec/vdz.json { n: [{ t, type, kind, date, pieces }] }
import fs from "node:fs/promises";
import path from "node:path";

const ROOT = path.dirname(new URL(import.meta.url).pathname);
const CITY = process.env.CITY || "hradec"; // hradec2: the sample of cuts at the passport's lines
const AB = path.join(ROOT, "..", CITY, "data", "ab-city-stejne");
const OUT = path.join(ROOT, "data", CITY);
const WFS = "https://geoportal.mmhk.cz/services/mapserver/common/pakom/gservice";
const R = 6378137, REACH = 80, ALONG = 20; // a smaller box comes back empty from the server
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchLines(n, cut) {
  const file = path.join(OUT, "vdz", `${n}.json`);
  try { return JSON.parse(await fs.readFile(file, "utf8")); } catch {}
  const dLat = (REACH / R) * (180 / Math.PI), dLon = dLat / Math.cos((cut.lat * Math.PI) / 180);
  const q = new URLSearchParams({ service: "WFS", version: "2.0.0", request: "GetFeature", typeNames: "ms:pk-dzv-l", srsName: "EPSG:4326",
    bbox: `${cut.lat - dLat},${cut.lon - dLon},${cut.lat + dLat},${cut.lon + dLon},urn:ogc:def:crs:EPSG::4326`, outputFormat: "application/json; charset=utf-8" });
  await wait(400); // the town's server, one request at a time
  const r = await fetch(`${WFS}?${q}`, { signal: AbortSignal.timeout(60000) });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  const json = await r.json();
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, JSON.stringify(json));
  return json;
}

// The lines across the cut: (t, u) of each vertex in the cut's frame, pieces along the street kept.
export function across(json, cut) {
  const b = (cut.bearing * Math.PI) / 180, dir = [Math.sin(b), Math.cos(b)], normal = [-dir[1], dir[0]];
  const kx = (R * Math.cos((cut.lat * Math.PI) / 180) * Math.PI) / 180, ky = (R * Math.PI) / 180;
  const tu = ([lon, lat]) => { const x = (lon - cut.lon) * kx, y = (lat - cut.lat) * ky; return [x * normal[0] + y * normal[1], x * dir[0] + y * dir[1]]; };
  const hits = [];
  for (const f of json.features || []) {
    const lines = f.geometry?.type === "LineString" ? [f.geometry.coordinates] : f.geometry?.type === "MultiLineString" ? f.geometry.coordinates : [];
    for (const line of lines) for (let i = 0; i + 1 < line.length; i++) {
      const [t1, u1] = tu(line[i]), [t2, u2] = tu(line[i + 1]);
      const du = u2 - u1, dt = t2 - t1, len = Math.hypot(du, dt);
      if (len < 0.3 || Math.abs(dt) / len > Math.sin((20 * Math.PI) / 180)) continue; // across the street: a stop line or a crossing
      // Its part within ±ALONG: the t where it is nearest to u = 0 (clamped to the part).
      const a = Math.max(-ALONG, Math.min(u1, u2)), c = Math.min(ALONG, Math.max(u1, u2));
      if (a >= c) continue;
      const um = Math.max(a, Math.min(c, 0)), t = t1 + (dt * (um - u1)) / (du || 1e-9);
      hits.push({ t, len: c - a, type: f.properties?.typ_vodorovne_cary_tid, kind: f.properties?.druh_vodorovne_znacky_tid, date: f.properties?.datum_vymeny || f.properties?.datum_osazeni });
    }
  }
  hits.sort((x, y) => x.t - y.t);
  const out = [];
  for (const h of hits) {
    const last = out.at(-1);
    if (last && h.t - last.t < 0.2) { last.pieces++; last.len += h.len; continue; }
    out.push({ t: +h.t.toFixed(2), type: h.type, kind: h.kind, date: h.date, pieces: 1, len: h.len });
  }
  return out.map((o) => ({ ...o, len: +o.len.toFixed(1) }));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const all = {};
  for (const f of (await fs.readdir(AB)).filter((f) => /^\d+\.json$/.test(f))) {
    const r = JSON.parse(await fs.readFile(path.join(AB, f), "utf8"));
    const n = +f.slice(0, -5);
    try { all[n] = across(await fetchLines(n, r.cut), r.cut); } catch (e) { console.log(n, "chyba", e.message); }
  }
  await fs.writeFile(path.join(OUT, "vdz.json"), JSON.stringify(all, null, 1));
  const withLines = Object.values(all).filter((v) => v.length).length;
  console.log(`řezů ${Object.keys(all).length}, s čarami ${withLines}, čar celkem ${Object.values(all).reduce((a, v) => a + v.length, 0)}`);
}
