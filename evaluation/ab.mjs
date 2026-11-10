// A/B test of a data source: every sampled cut of a city (evaluation/<city>/data/samples.json) derived once
// per variant, as a click does it (run_brno.mjs, compare_dmvs.mjs). A variant is evaluation/variants/<name>.mjs
// and exports overrides of the five sources of sources.js (osm, surfaces, lines, parking, podlaznost; the
// same arguments and answers); what it leaves out comes from the city's normal sources. "city" is the
// current state (no file needed). The cut is placed once, by the first variant's OSM, so all profiles lie
// on the same line.
//   CITY=jihlava VARIANTS=city,bez-pasportu node evaluation/ab.mjs [from] [to]   (more than two: the first
//       against each of the others)
//   CITY=jihlava VARIANTS=city,bez-pasportu node evaluation/ab.mjs --render [n …]  (again the images)
//   CITY=jihlava VARIANTS=city,bez-pasportu node evaluation/ab.mjs --summary
// Out: evaluation/<city>/data/ab-<a>-<b>/<n>.json (both profiles, times, measures), png/<n>.svg(.png) of the
// cuts that differ over the orthophoto, review.md for the verdicts (a / b / obě / žádná).
// ONLY=1,3,7: just these cuts. CACHE=mem (default): an answer of the web asked for again within the run
// is reused (the later variants' times are then lower); CACHE=disk: also kept in data/ab-cache for reruns;
// CACHE=0: nothing reused. PODLAZNOST=1: also the floors of the edge buildings (more requests).
// Prague (CITY=praha): IPR's answers only from the local server's cache, as compare_dmvs.mjs; IPR is never asked.
import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { execFile } from "node:child_process";
import { politeFetch } from "./polite.mjs";

const ROOT = path.dirname(new URL(import.meta.url).pathname);
const CITY = process.env.CITY || "jihlava";
const PRAHA = CITY === "praha";
const DATA = PRAHA ? path.join(ROOT, "praha", "data") : path.join(ROOT, CITY, "data");
// SAMPLES=file: another sample of cuts (e.g. evaluation/praha-opendata/data/samples-zakaz.json); its pairs go
// to ab-<a>-<b>-<file name>, its orthophotos (fetched like the towns') to ortho-<file name>.
const OWN = process.env.SAMPLES ? path.basename(process.env.SAMPLES, ".json") : "";
const SAMPLES = OWN ? path.resolve(process.env.SAMPLES) : PRAHA ? path.join(ROOT, "data", "samples.json") : path.join(DATA, "samples.json");
const PRAHA_ORTHO = PRAHA && !OWN; // the Prague sample's own orthophotos (evaluation/data/ortho_fix)
const PILOT = path.join(ROOT, "..", "pilot");
const PILOT_DATA = path.join(PILOT, "data", CITY);
const VARIANTS = (process.env.VARIANTS || "city").split(",").map((s) => s.trim()).filter(Boolean);
const CACHE = process.env.CACHE ?? "mem";
const HALF = 40;
globalThis.PROFILY_CITY = CITY;

// ---------- fetch: local data files, Prague's cache, and the web (counted, optionally reused) ----------
const sha1 = (s) => crypto.createHash("sha1").update(s).digest("hex");
const round = (v) => Math.round(v * 1e5) / 1e5; // server.mjs bboxParam
const iprCache = (kind, bbox) => path.join(PILOT, "cache", kind, sha1(bbox.split(",").map(Number).map(round).join(",")) + ".json");
const reply = (buf, status = 200) => ({
  ok: status < 400, status, json: async () => JSON.parse(buf.toString("utf8")), text: async () => buf.toString("utf8"),
  arrayBuffer: async () => buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength),
});
const missing = (status = 404) => reply(Buffer.from(""), status);
// ČÚZK one request at a time with pauses (polite.mjs).
const webFetch = politeFetch;
const memo = new Map();
const DISK = path.join(DATA, "ab-cache");
export const net = { requests: 0, reused: 0 };
globalThis.fetch = async (url, opts) => {
  const u = String(url);
  if (/gs-pub\.praha\.eu|overpass/i.test(u)) throw new Error("IPR and Overpass are not asked by this script");
  if (PRAHA && u.startsWith("/api/")) {
    const q = new URL(u, "http://x");
    const kind = { "/api/mtvu": "mtvu", "/api/linie": "linie", "/api/parkovani": "parkovani2", "/api/body": "body" }[q.pathname];
    if (!kind) return missing();
    try { return reply(await fs.readFile(iprCache(kind, q.searchParams.get("bbox")))); } catch { return missing(599); }
  }
  // "../data/…" and "data/…": the shared files in pilot/data, else the city's own folder.
  const rel = u.startsWith("../data/") ? u.slice(8) : u.startsWith("data/") ? u.slice(5) : null;
  if (rel !== null) {
    for (const file of [path.join(PILOT, "data", rel), path.join(PILOT_DATA, rel)]) {
      try { return reply(await fs.readFile(file)); } catch {}
    }
    return missing();
  }
  if (CACHE === "0" || (opts?.method && opts.method !== "GET")) { net.requests++; return webFetch(url, opts); }
  const key = sha1(u);
  if (!memo.has(key)) {
    memo.set(key, (async () => {
      if (CACHE === "disk") {
        try { return { buf: await fs.readFile(path.join(DISK, key)), status: 200, disk: true }; } catch {}
      }
      net.requests++;
      const r = await webFetch(url, opts);
      const buf = Buffer.from(await r.arrayBuffer());
      if (r.ok && CACHE === "disk") { await fs.mkdir(DISK, { recursive: true }); await fs.writeFile(path.join(DISK, key), buf); }
      return { buf, status: r.status };
    })().catch((err) => { memo.delete(key); throw err; }));
  } else net.reused++;
  const { buf, status, disk } = await memo.get(key);
  if (disk) net.reused++;
  if (status >= 400) memo.delete(key);
  return reply(buf, status);
};

const D = await import("../pilot/public/derive.js");
const S = await import("../pilot/public/sources.js");
const G = await import("../pilot/public/gis.js");
const { localFrame, nearestStreet, awayFromJunctions, centerOnStreet, mtvuPolygons, trackLines, techLines, esriPolygons, deriveProfile, MAX_REACH } = D;

// The city's normal sources (Prague: OSM from the local tiles, as compare_dmvs.mjs).
const NORMAL = {
  osm: PRAHA ? (lat, lon, r) => G.osmTiles(lat, lon, r) : S.osm,
  surfaces: S.mtvu, lines: S.linie, parking: S.parkovani, podlaznost: S.podlaznost,
};
async function loadVariant(name) {
  if (name === "city") return { name, about: "současný stav", src: NORMAL };
  const mod = await import(path.join(ROOT, "variants", `${name}.mjs`));
  const src = { ...NORMAL };
  for (const k of Object.keys(NORMAL)) if (typeof mod[k] === "function") src[k] = mod[k];
  // reach: the reach of points per kind (derive.js REACH), e.g. { lampa: 15 }. deriveProfile: another copy of
  // the app's derivation (a rule change tested against the code before it, variants/kod-pred.mjs).
  // ortho: the orthophoto of the tram beds (ortho.js bedOrtho), asked in parallel with the sources as app.js does.
  return { name, about: mod.about || "", src, reach: mod.reach, deriveProfile: mod.deriveProfile, ortho: mod.ortho };
}

// ---------- Measures ----------
const ROADWAY = new Set(["pruh", "pruh_piktokoridor", "bus", "bus_cyklo", "tramvaj_v_pruhu", "tramvaj_pruh", "tramvaj", "krajnice", "parkovani", "cyklopruh", "ochranny_pruh", "obsluzna"]);
const SIDEWALK = new Set(["chodnik", "chodnik_kola", "stezka_sdilena"]);
const sum = (segs, set) => +segs.filter((s) => set.has(s.type)).reduce((a, s) => a + s.width, 0).toFixed(2);
export function measures(p) {
  if (!p?.segments) return null;
  const total = p.segments.reduce((a, s) => a + s.width, 0);
  const unknown = p.segments.filter((s) => s.type === "nezname").reduce((a, s) => a + s.width, 0);
  return {
    total: +total.toFixed(2), roadway: sum(p.segments, ROADWAY), sidewalk: sum(p.segments, SIDEWALK),
    edges: [p.edges?.left, p.edges?.right], unknown: +(total ? unknown / total : 0).toFixed(3),
    osmEstimate: /odhad z OSM/.test(p.notice || ""), parts: p.segments.length,
    // Street furniture by kind, tree strips, parking strips and how many of them are estimates.
    items: p.segments.flatMap((s) => (s.items || []).map((it) => it.kind)).sort().join(","),
    trees: p.segments.filter((s) => s.type === "stromorad").length,
    parking: p.segments.filter((s) => s.type === "parkovani").map((s) => s.source).sort().join(","),
    // The parts in order with their kind of tram bed and lane widths rounded to 0.25 m (PARTS=1).
    kinds: p.segments.map((s) => s.type + (s.bed ? `:${s.bed}` : "") + (s.withBus ? "+bus" : "")).join(","),
    lanes: p.segments.filter((s) => s.type === "pruh" || s.type === "krajnice").map((s) => `${s.type[0]}${Math.round(s.width * 4) / 4}`).join(","),
  };
}
export function differs(a, b) {
  if (!a || !b) return ["chybí"];
  const out = [];
  if (Math.abs(a.roadway - b.roadway) > 0.5) out.push(`vozovka ${a.roadway}/${b.roadway}`);
  if (Math.abs(a.sidewalk - b.sidewalk) > 0.5) out.push(`chodník ${a.sidewalk}/${b.sidewalk}`);
  if (a.edges[0] !== b.edges[0] || a.edges[1] !== b.edges[1]) out.push(`okraje ${a.edges.join("+")}/${b.edges.join("+")}`);
  if (a.osmEstimate !== b.osmEstimate) out.push(`odhad OSM ${a.osmEstimate ? "A" : "B"}`);
  // ITEMS=1: also the street furniture, the tree strips and the parking (sources of new points and stalls).
  if (process.env.ITEMS === "1") {
    if ((a.items ?? "") !== (b.items ?? "")) out.push(`předměty ${a.items || "-"}/${b.items || "-"}`);
    if ((a.trees ?? 0) !== (b.trees ?? 0)) out.push(`stromy ${a.trees}/${b.trees}`);
    if ((a.parking ?? "") !== (b.parking ?? "")) out.push(`stání ${a.parking || "-"}/${b.parking || "-"}`);
  }
  // PARTS=1: also the kinds of parts (tram kinds) and the driving lanes and shoulders (lane caps).
  if (process.env.PARTS === "1") {
    if ((a.kinds ?? "") !== (b.kinds ?? "")) out.push(`části ${a.kinds}/${b.kinds}`);
    if ((a.lanes ?? "") !== (b.lanes ?? "")) out.push(`pruhy ${a.lanes || "-"}/${b.lanes || "-"}`);
  }
  return out;
}

// ---------- One cut, every variant ----------
async function place(s, src) {
  let frame = localFrame(s.lat, s.lon);
  const osm = await src.osm(s.lat, s.lon, 80);
  let near = nearestStreet(osm, frame, [0, 0]);
  if (!near) return null;
  near = awayFromJunctions(osm, frame, near);
  near = centerOnStreet(osm, frame, near);
  const [clon, clat] = frame.toLonLat(...near.point);
  frame = localFrame(clat, clon);
  const dir = near.dir, normal = [-dir[1], dir[0]];
  const full = [-1, 1].map((k) => frame.toLonLat(normal[0] * HALF * k, normal[1] * HALF * k));
  const lons = full.map((e) => e[0]), lats = full.map((e) => e[1]);
  const pad = 0.0004;
  const bbox = [Math.min(...lons) - pad, Math.min(...lats) - pad, Math.max(...lons) + pad, Math.max(...lats) + pad].join(",");
  const cut = { lat: clat, lon: clon, bearing: (Math.atan2(dir[0], dir[1]) * 180) / Math.PI, wayId: near.way.id, name: near.way.tags.name || null, highway: near.way.tags.highway, tags: near.way.tags };
  return { frame, dir, bbox, cut, wayId: near.way.id };
}

async function derive(v, at, inZps) {
  const { frame, dir, bbox, cut } = at;
  const t0 = performance.now(), n0 = net.requests;
  if (!at.osmBy.has(v.src.osm)) at.osmBy.set(v.src.osm, await v.src.osm(cut.lat, cut.lon, 80));
  const osm = at.osmBy.get(v.src.osm);
  const way = osm.elements.find((e) => e.type === "way" && e.id === at.wayId) || at.way;
  let surfMs, orthoMs;
  const [m, k, pk, ortho] = await Promise.all([
    (async () => { const t = performance.now(); try { return await v.src.surfaces(bbox); } finally { surfMs = Math.round(performance.now() - t); } })(),
    v.src.lines(bbox).catch(() => ({ features: [] })),
    v.src.parking(bbox, inZps).catch(() => ({ features: [] })),
    v.ortho ? (async () => { const t = performance.now(); try { return await v.ortho({ osm, frame, dir, half: HALF }); } finally { orthoMs = Math.round(performance.now() - t); } })() : null,
  ]);
  const polys = mtvuPolygons(m, frame);
  const r = (v.deriveProfile || deriveProfile)({ center: [0, 0], dir, half: HALF, polys, osm, frame, way, tracks: trackLines(k, frame), parking: esriPolygons(pk, frame), lines: techLines(k, frame), reach: { left: MAX_REACH, right: MAX_REACH }, inZps, itemReach: v.reach, ortho });
  if (process.env.PODLAZNOST === "1") {
    for (const side of ["left", "right"]) {
      const info = r.edges?.[`${side}Info`];
      if (!info?.point) continue;
      const p = await v.src.podlaznost(info.point[1], info.point[0]).catch(() => ({}));
      if (p.cornice) Object.assign(info, { cornice: p.cornice, roof: p.roof, levels: p.cornice + p.roof });
    }
  }
  return {
    variant: v.name, ms: Math.round(performance.now() - t0), surfacesMs: surfMs, requests: net.requests - n0,
    ...(v.ortho ? { orthoMs, orthoSeen: ortho?.seen || null } : {}),
    mtvuCount: polys.length, region: m?.region || null,
    runs: r.runs?.map((x) => ({ code: x.code, s: +x.s.toFixed(2), e: +x.e.toFixed(2) })),
    axisT: r.axisT, extent: r.extent, junction: !!r.junction, segments: r.segments, edges: r.edges, notice: r.notice,
    measures: measures(r),
  };
}

async function run(s, vs) {
  const first = vs[0].src;
  const at = await place(s, first);
  if (!at) return { error: "no street" };
  at.osm = await first.osm(at.cut.lat, at.cut.lon, 80);
  at.way = at.osm.elements.find((e) => e.type === "way" && e.id === at.wayId);
  at.osmBy = new Map([[first.osm, at.osm]]);
  const inZps = await S.zps(at.cut.lat, at.cut.lon);
  const out = {};
  for (const v of vs) {
    try { out[v.name] = await derive(v, at, inZps); } catch (e) { out[v.name] = { variant: v.name, error: String(e.message || e) }; }
  }
  return { cut: at.cut, bbox: at.bbox, inZps, profiles: out };
}

// ---------- Orthophoto (the one run_brno.mjs saved, else fetched like it) ----------
const ORTHO = PRAHA_ORTHO ? path.join(ROOT, "data", "ortho_fix") : path.join(DATA, OWN ? `ortho-${OWN}` : "ortho");
const OLD = PRAHA ? path.join(ROOT, "data", "results_fix") : path.join(DATA, "results");
const VIEW = 45, R = 6378137;
const merc = (lon, lat) => [R * (lon * Math.PI) / 180, R * Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360))];
const CUZK_ORTHO = "https://ags.cuzk.gov.cz/arcgis1/services/ORTOFOTO/MapServer/WMSServer";
async function ensureOrtho(n, cut) {
  if (PRAHA_ORTHO) return;
  const dir = path.join(ORTHO, String(n));
  try { await fs.access(path.join(dir, "tiles.json")); return; } catch {}
  await fs.mkdir(dir, { recursive: true });
  const { TOWNS } = await import("../pilot/public/towns/index.js");
  const o = TOWNS[CITY]?.ortho;
  const [x, y] = merc(cut.lon, cut.lat);
  const h = VIEW / Math.cos((cut.lat * Math.PI) / 180), bbox = [x - h, y - h, x + h, y + h].join(",");
  const url = o
    ? `${o.service}?${new URLSearchParams({ bbox, bboxSR: 3857, imageSR: 3857, size: "900,900", format: "jpg", f: "image", ...(o.datum ? { datumTransformations: `[${o.datum}]` } : {}) })}`
    : `${CUZK_ORTHO}?${new URLSearchParams({ service: "WMS", request: "GetMap", version: "1.3.0", layers: "0", styles: "", crs: "EPSG:3857", bbox, width: 900, height: 900, format: "image/jpeg" })}`;
  const r = await webFetch(url);
  if (!r.ok) return;
  await fs.writeFile(path.join(dir, "0.jpg"), Buffer.from(await r.arrayBuffer()));
  await fs.writeFile(path.join(dir, "tiles.json"), JSON.stringify([{ file: "0.jpg", e: -VIEW, n: VIEW, size: 2 * VIEW }]));
  await fs.writeFile(path.join(dir, "center.json"), JSON.stringify({ lat: cut.lat, lon: cut.lon }));
}

// ---------- Review image: the orthophoto turned so the profile runs left → right, A above, B below ----------
const { TYPES } = await import("../pilot/public/types.js");
const PX_M = 10, BOX = 640, SIZE = 1100;
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const ARROW = { forward: "↑", backward: "↓" };
const ITEM_MARK = { lampa: "L", sloup_trakce: "T", oznacnik: "Z", pristresek: "P", sloupek: "s", lavicka: "b", stojan_kola: "k" };
async function tilesOf(n, cut) {
  let tiles, dir;
  if (PRAHA_ORTHO) { tiles = [{ file: `${n}.jpg`, e: -40, n: 40, size: 80 }]; dir = ORTHO; }
  else { dir = path.join(ORTHO, String(n)); tiles = JSON.parse(await fs.readFile(path.join(dir, "tiles.json"), "utf8")); }
  // The orthophoto's centre is the cut it was saved for: shift it to this cut.
  let de = 0, dn = 0, old;
  try { old = JSON.parse(await fs.readFile(path.join(dir, "center.json"), "utf8")); } catch {
    try { old = JSON.parse(await fs.readFile(path.join(OLD, `${n}.json`), "utf8")).cut; } catch {}
  }
  if (old) {
    de = (old.lon - cut.lon) * 111320 * Math.cos((cut.lat * Math.PI) / 180);
    dn = (old.lat - cut.lat) * 110574;
  }
  return (await Promise.all(tiles.map(async (t) => {
    const b64 = (await fs.readFile(path.join(dir, t.file))).toString("base64");
    return `<image x="${(t.e + de) * PX_M}" y="${-(t.n + dn) * PX_M}" width="${t.size * PX_M + 0.5}" height="${t.size * PX_M + 0.5}" href="data:image/jpeg;base64,${b64}"/>`;
  }))).join("");
}
function band(p, c, y, label, X) {
  const total = p.segments.reduce((a, s) => a + s.width, 0);
  const [, tL] = p.extent || [-total / 2, total / 2];
  let u = -tL;
  const bounds = [u];
  const bands = p.segments.map((s) => {
    const x0 = X(u); u += s.width; bounds.push(u);
    return `<rect x="${x0}" y="${y - 10}" width="${s.width * PX_M}" height="20" fill="${TYPES[s.type]?.color || "#f0f"}" opacity="0.6"/>`;
  }).join("");
  const dy = y < c ? -1 : 1;
  const ticks = bounds.map((v) => `<line x1="${X(v)}" x2="${X(v)}" y1="${c}" y2="${y + dy * 22}" stroke="${y < c ? "#ff2" : "#f6f"}" stroke-width="2"/>`).join("");
  // Street furniture: a dot with the item's initial where it stands (letters: ITEM_MARK).
  let v = -tL;
  const marks = p.segments.map((s) => {
    const x0 = v; v += s.width;
    return (s.items || []).map((it) => {
      const x = X(x0 + it.f * s.width), m = ITEM_MARK[it.kind] || it.kind[0];
      return `<circle cx="${x}" cy="${y}" r="7" fill="#fff" stroke="#000"/><text x="${x}" y="${y + 4}" font-size="10" text-anchor="middle">${m}</text>`;
    }).join("");
  }).join("");
  const axis = `<line x1="${X(-p.axisT)}" x2="${X(-p.axisT)}" y1="${y - 14}" y2="${y + 14}" stroke="#0ff" stroke-width="2" stroke-dasharray="4 3"/>`;
  const tag = `<text x="6" y="${y + 5}" fill="#fff" font-size="14" font-weight="bold" stroke="#000" stroke-width="3" paint-order="stroke">${esc(label)}</text>`;
  return bands + ticks + marks + axis + tag;
}
function bar(p, y, W) {
  const total = p.segments.reduce((a, s) => a + s.width, 0);
  let x = 10;
  return p.segments.map((s, i) => {
    const w = (s.width / total) * W;
    const out = `<rect x="${x}" y="${y}" width="${w}" height="26" fill="${TYPES[s.type]?.color}" stroke="#fff"/><text x="${x + w / 2}" y="${y + 18}" font-size="11" text-anchor="middle" fill="#fff" stroke="#000" stroke-width="2" paint-order="stroke">${i + 1}</text>`;
    x += w; return out;
  }).join("");
}
const rows = (p, x, y) => p.segments.map((s, i) => `<text x="${x}" y="${y + i * 15}" font-size="11">${i + 1}. ${esc(TYPES[s.type]?.label || s.type)}${s.bed ? ` (${esc(s.bed)})` : ""}${s.withBus ? " + BUS" : ""} ${s.width.toFixed(2)} ${s.dir ? ARROW[s.dir] : ""} · ${esc(s.source)}${s.items?.length ? " · " + esc(s.items.map((it) => it.kind).join(", ")) : ""}</text>`).join("");
async function svg(r, A, B) {
  const b = (r.cut.bearing * Math.PI) / 180;
  const dir = [Math.sin(b), Math.cos(b)], normal = [-dir[1], dir[0]];
  const theta = (Math.atan2(-normal[1], -normal[0]) * 180) / Math.PI;
  const c = BOX / 2, X = (u) => c + u * PX_M;
  const imgs = await tilesOf(r.sample.n, r.cut);
  const grid = [-30, -20, -10, 0, 10, 20, 30].map((m) => `<text x="${X(m)}" y="${BOX - 6}" fill="#fff" font-size="11" text-anchor="middle" stroke="#000" stroke-width="3" paint-order="stroke">${m}</text>`).join("");
  const m = (p) => p.measures;
  const head = (p, tag) => `${tag} ${esc(p.variant)}: vozovka ${m(p).roadway} · chodník ${m(p).sidewalk} · celkem ${m(p).total} · okraje ${esc(m(p).edges.join(" / "))}${m(p).osmEstimate ? " · ODHAD Z OSM" : ""} · ${p.ms} ms`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}" font-family="Helvetica, Arial, sans-serif">
<rect width="${SIZE}" height="${SIZE}" fill="#fff"/>
<defs><clipPath id="o"><rect width="${BOX}" height="${BOX}"/></clipPath></defs>
<g clip-path="url(#o)"><rect width="${BOX}" height="${BOX}" fill="#222"/><g transform="translate(${c} ${c}) rotate(${theta})">${imgs}</g>
<line x1="0" x2="${BOX}" y1="${c}" y2="${c}" stroke="#fff" stroke-width="1" opacity="0.6"/>
${band(A, c, c - 60, `A ${A.variant}`, X)}${band(B, c, c + 60, `B ${B.variant}`, X)}${grid}
<text x="8" y="18" fill="#fff" font-size="13" stroke="#000" stroke-width="3" paint-order="stroke">nahoře A (žluté hranice) · dole B (fialové) · vlevo začátek profilu</text></g>
<text x="${BOX + 16}" y="26" font-size="16" font-weight="bold">č. ${r.sample.n} ${esc(r.cut.name || "(bez jména)")} · ${esc(r.cut.highway)}</text>
<text x="${BOX + 16}" y="44" font-size="11">${B.notice ? "B: " + esc(B.notice.slice(0, 70)) : ""}</text>
<text x="${BOX + 16}" y="58" font-size="11">${A.notice ? "A: " + esc(A.notice.slice(0, 70)) : ""}</text>
<text x="${BOX + 16}" y="80" font-size="12" font-weight="bold">A ${esc(A.variant)}</text>${rows(A, BOX + 16, 96)}
<text x="${BOX + 16}" y="${110 + A.segments.length * 15}" font-size="12" font-weight="bold">B ${esc(B.variant)}</text>${rows(B, BOX + 16, 126 + A.segments.length * 15)}
<text x="10" y="${BOX + 22}" font-size="12">${head(A, "A")}</text>${bar(A, BOX + 30, SIZE - 20)}
<text x="10" y="${BOX + 80}" font-size="12">${head(B, "B")}</text>${bar(B, BOX + 88, SIZE - 20)}
</svg>`;
}
const toPng = (dir, file) => new Promise((res) => {
  if (process.platform !== "darwin") return res(false);
  execFile("qlmanage", ["-t", "-s", String(SIZE), "-o", dir, file], (err) => res(!err));
});

// ---------- Pairs: files, images, review ----------
const pairDir = (a, b) => path.join(DATA, `ab-${a}-${b}${OWN ? `-${OWN}` : ""}`);
async function readPair(a, b) {
  const dir = pairDir(a, b);
  const files = (await fs.readdir(dir).catch(() => [])).filter((f) => /^\d+\.json$/.test(f)).sort((p, q) => parseInt(p) - parseInt(q));
  return Promise.all(files.map(async (f) => JSON.parse(await fs.readFile(path.join(dir, f), "utf8"))));
}
async function renderPair(a, b, want = []) {
  const dir = pairDir(a, b), png = path.join(dir, "png");
  await fs.mkdir(png, { recursive: true });
  let done = 0;
  for (const r of await readPair(a, b)) {
    if (!r.a?.segments || !r.b?.segments) continue;
    if (want.length ? !want.includes(r.sample.n) : !differs(r.a.measures, r.b.measures).length) continue;
    try {
      await ensureOrtho(r.sample.n, r.cut);
      const file = path.join(png, `${r.sample.n}.svg`);
      await fs.writeFile(file, await svg(r, r.a, r.b));
      await toPng(png, file);
      done++;
    } catch (e) { console.log(r.sample.n, "obrázek nevznikl:", e.message); }
  }
  return done;
}
// Review template: one line per differing cut; a verdict already filled in is kept.
const VERDICT = /verdikt:\s*(a|b|obě|obe|both|žádná|zadna|neither)(?=[\s·,.;]|$)/iu;
const norm = (v) => ({ a: "a", b: "b", "obě": "obě", obe: "obě", both: "obě", "žádná": "žádná", zadna: "žádná", neither: "žádná" })[v.toLowerCase()];
async function readReview(a, b) {
  const out = new Map();
  try {
    for (const line of (await fs.readFile(path.join(pairDir(a, b), "review.md"), "utf8")).split("\n")) {
      const n = line.match(/^- č\. (\d+)/)?.[1], v = line.match(VERDICT)?.[1];
      if (n) out.set(Number(n), { verdict: v ? norm(v) : null, line });
    }
  } catch {}
  return out;
}
async function writeReview(a, b) {
  const old = await readReview(a, b);
  const lines = [`# ${CITY}: A = ${a}, B = ${b}`, "",
    "Posuďte každý řez nad ortofotem (png/<n>.svg.png) a místo `?` napište `a`, `b`, `obě` nebo `žádná`;",
    "za verdikt krátkou poznámku. `--summary` verdikty sečte. Nový běh vyplněné verdikty zachová.", ""];
  for (const r of await readPair(a, b)) {
    const d = differs(r.a?.measures, r.b?.measures);
    if (!d.length) continue;
    const keep = old.get(r.sample.n);
    if (keep?.verdict) { lines.push(keep.line); continue; }
    lines.push(`- č. ${r.sample.n} ${r.cut?.highway || ""} ${r.cut?.name || ""}: ${d.join("; ")} · verdikt: ? · `);
  }
  await fs.writeFile(path.join(pairDir(a, b), "review.md"), lines.join("\n") + "\n");
}

// ---------- Summary ----------
const median = (xs) => { const v = xs.filter((x) => Number.isFinite(x)).sort((p, q) => p - q); return v.length ? (v.length % 2 ? v[(v.length - 1) / 2] : (v[v.length / 2 - 1] + v[v.length / 2]) / 2) : NaN; };
async function summary(a, b) {
  const rs = await readPair(a, b);
  const ok = rs.filter((r) => r.a?.measures && r.b?.measures);
  const A = (k) => ok.map((r) => r.a.measures[k]), B = (k) => ok.map((r) => r.b.measures[k]);
  const d = (k) => median(ok.map((r) => Math.abs(r.a.measures[k] - r.b.measures[k])));
  const within = (k) => ok.filter((r) => Math.abs(r.a.measures[k] - r.b.measures[k]) <= 0.5).length;
  const diff = ok.filter((r) => differs(r.a.measures, r.b.measures).length);
  const mean = (xs) => xs.reduce((p, q) => p + q, 0) / (xs.length || 1);
  console.log(`\n== ${CITY}: A ${a} × B ${b} ==`);
  console.log(`${rs.length} řezů, ${ok.length} se dvěma profily, ${rs.length - ok.length} chyb`);
  console.log(`shoda (vozovka i chodník do 0,5 m, stejné okraje, stejně odhad z OSM): ${ok.length - diff.length}/${ok.length}, liší se ${diff.length}`);
  console.log(`vozovka do 0,5 m ${within("roadway")}, chodník do 0,5 m ${within("sidewalk")}, okraje stejné ${ok.filter((r) => r.a.measures.edges.join() === r.b.measures.edges.join()).length}`);
  console.log(`medián |rozdílu|: vozovka ${d("roadway").toFixed(2)} m, chodník ${d("sidewalk").toFixed(2)} m, celkem ${d("total").toFixed(2)} m`);
  console.log(`B širší vozovka (> 0,5 m) ${ok.filter((r) => r.b.measures.roadway - r.a.measures.roadway > 0.5).length}, užší ${ok.filter((r) => r.a.measures.roadway - r.b.measures.roadway > 0.5).length}`);
  console.log(`odhad z OSM: A ${A("osmEstimate").filter(Boolean).length}, B ${B("osmEstimate").filter(Boolean).length}; Neurčeno průměr A ${mean(A("unknown")).toFixed(3)}, B ${mean(B("unknown")).toFixed(3)}`);
  console.log(`čas ploch (medián ms): A ${median(ok.map((r) => r.a.surfacesMs))}, B ${median(ok.map((r) => r.b.surfacesMs))}; dotazů na řez (medián): A ${median(ok.map((r) => r.a.requests))}, B ${median(ok.map((r) => r.b.requests))}`);
  const review = await readReview(a, b);
  const counts = { a: 0, b: 0, "obě": 0, "žádná": 0 };
  let open = 0;
  for (const r of diff) { const v = review.get(r.sample.n)?.verdict; if (v) counts[v]++; else open++; }
  console.log(`verdikty (${diff.length - open}/${diff.length} posouzeno): lepší A ${counts.a}, lepší B ${counts.b}, obě ${counts["obě"]}, žádná ${counts["žádná"]}`);
  if (process.env.LIST !== "0") for (const r of diff) console.log(`  ${r.sample.n} ${r.cut.highway} ${r.cut.name || ""}: ${differs(r.a.measures, r.b.measures).join("; ")}${review.get(r.sample.n)?.verdict ? ` → ${review.get(r.sample.n).verdict}` : ""}`);
  for (const r of rs) if (!r.a?.measures || !r.b?.measures) console.log(`  ${r.sample.n}: ${r.error || r.a?.error || r.b?.error}`);
}

// ---------- Main ----------
const [base, ...others] = VARIANTS;
if (!others.length) { console.error("VARIANTS=a,b (nejméně dvě varianty, první je základ)"); process.exit(1); }
const args = process.argv.slice(2).filter((x) => !x.startsWith("--"));
if (process.argv.includes("--summary")) {
  for (const b of others) await summary(base, b);
} else if (process.argv.includes("--render")) {
  for (const b of others) console.log(`${base}-${b}: obrázků ${await renderPair(base, b, args.map(Number))}`);
} else {
  const vs = await Promise.all(VARIANTS.map(loadVariant));
  const { samples } = JSON.parse(await fs.readFile(SAMPLES, "utf8"));
  const [from = 1, to = Infinity] = args.map(Number);
  const only = process.env.ONLY ? new Set(process.env.ONLY.split(",").map(Number)) : null;
  for (const b of others) await fs.mkdir(pairDir(base, b), { recursive: true });
  for (const s of samples.filter((x) => x.n >= from && x.n <= to && (!only || only.has(x.n)))) {
    memo.clear(); // reuse answers between the variants of one cut only
    let r;
    try { r = await run(s, vs); } catch (e) { r = { error: String(e.stack || e) }; }
    const line = [s.n, s.highway, s.name || ""];
    for (const b of others) {
      const A = r.profiles?.[base], B = r.profiles?.[b];
      await fs.writeFile(path.join(pairDir(base, b), `${s.n}.json`), JSON.stringify({ sample: s, cut: r.cut, bbox: r.bbox, inZps: r.inZps, error: r.error, a: A, b: B }, null, 1));
      line.push(`| ${b}: ${A?.measures ? `${A.measures.roadway}/${A.measures.sidewalk}` : A?.error || r.error || "-"} → ${B?.measures ? `${B.measures.roadway}/${B.measures.sidewalk}` : B?.error || "-"} ${differs(A?.measures, B?.measures).join("; ")}`);
    }
    console.log(line.join(" "));
  }
  for (const b of others) {
    await writeReview(base, b);
    console.log(`${base}-${b}: obrázků ${await renderPair(base, b)}, ${path.relative(process.cwd(), path.join(pairDir(base, b), "review.md"))}`);
  }
  console.log(`dotazů na web ${net.requests}, znovu použitých odpovědí ${net.reused}`);
}
