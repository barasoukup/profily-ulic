// The city's own technical map against the national DTM of ČÚZK (IS DMVS, pilot/public/dmvs.js): every
// sampled cut of a city (evaluation/<city>/data/samples.json) is derived twice as a click does it (run_brno.mjs),
// once with the city's surfaces and once with the DMVS surfaces of the same envelope; OSM, the lines and the
// parking stay the same. Both profiles, the times of the surfaces requests and the measures go to
// evaluation/<city>/data/dmvs/<n>.json; summarize with --summary.
//   CITY=jihlava node evaluation/compare_dmvs.mjs [from] [to]
//   CITY=jihlava node evaluation/compare_dmvs.mjs --summary
// CITY=praha: the Prague sample (evaluation/data/samples.json) with IPR's answers taken ONLY from the local
// server's cache (pilot/cache, filled by earlier runs); a cut without a cached answer is skipped. IPR is
// never asked (every request to gs-pub.praha.eu fails here on purpose).
import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

const ROOT = path.dirname(new URL(import.meta.url).pathname);
const CITY = process.env.CITY || "brno";
const PRAHA = CITY === "praha";
const DATA = PRAHA ? path.join(ROOT, "data") : path.join(ROOT, CITY, "data");
const PILOT = path.join(ROOT, "..", "pilot");
const PILOT_DATA = path.join(PILOT, "data", CITY);
const OUT = path.join(PRAHA ? path.join(ROOT, "praha", "data") : DATA, "dmvs");
globalThis.PROFILY_CITY = CITY;

const sha1 = (s) => crypto.createHash("sha1").update(s).digest("hex");
const round = (v) => Math.round(v * 1e5) / 1e5; // server.mjs bboxParam
const cacheFile = (kind, bbox) => path.join(PILOT, "cache", kind, sha1(bbox.split(",").map(Number).map(round).join(",")) + ".json");

const webFetch = globalThis.fetch;
const reply = (text) => ({ ok: true, status: 200, json: async () => JSON.parse(text), text: async () => text });
const missing = { ok: false, status: 404, json: async () => null, text: async () => "" };
globalThis.fetch = async (url, opts) => {
  const u = String(url);
  if (/gs-pub\.praha\.eu/.test(u)) throw new Error("IPR is not asked by this script");
  if (PRAHA && u.startsWith("/api/")) {
    // The local server's cache of IPR answers; nothing else.
    const q = new URL(u, "http://x");
    const kind = { "/api/mtvu": "mtvu", "/api/linie": "linie", "/api/parkovani": "parkovani2" }[q.pathname];
    if (!kind) return missing;
    try { return reply(await fs.readFile(cacheFile(kind, q.searchParams.get("bbox")), "utf8")); } catch { return { ...missing, status: 599 }; }
  }
  // "../data/…" (a city page) and "data/…": the shared files in pilot/data, else the city's own folder.
  const rel = u.startsWith("../data/") ? u.slice(8) : u.startsWith("data/") ? u.slice(5) : null;
  if (rel === null) return webFetch(url, opts);
  for (const file of [path.join(PILOT, "data", rel), path.join(PILOT_DATA, rel)]) {
    try { return reply(await fs.readFile(file, "utf8")); } catch {}
  }
  return missing;
};

const D = await import("../pilot/public/derive.js");
const S = await import("../pilot/public/sources.js");
const G = await import("../pilot/public/gis.js");
const { surfaces: dmvsSurfaces } = await import("../pilot/public/dmvs.js");
const { MTVU_LABELS } = await import("../pilot/public/city.js");
const { localFrame, nearestStreet, awayFromJunctions, centerOnStreet, mtvuPolygons, trackLines, techLines, esriPolygons, deriveProfile, MAX_REACH } = D;
const HALF = 40;

// ---------- Measures ----------
const ROADWAY = new Set(["pruh", "pruh_piktokoridor", "bus", "bus_cyklo", "tramvaj_v_pruhu", "tramvaj", "krajnice", "parkovani", "cyklopruh", "ochranny_pruh", "obsluzna"]);
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
  };
}

const timed = async (fn) => {
  const t = performance.now();
  try { return { json: await fn(), ms: Math.round(performance.now() - t) }; } catch (err) { return { error: String(err.message || err), ms: Math.round(performance.now() - t) }; }
};

// ---------- One cut ----------
async function run(s) {
  const { lat, lon } = s;
  let frame = localFrame(lat, lon);
  const osm = PRAHA ? await G.osmTiles(lat, lon, 80) : await S.osm(lat, lon, 80);
  let near = nearestStreet(osm, frame, [0, 0]);
  if (!near) return { error: "no street" };
  near = awayFromJunctions(osm, frame, near);
  near = centerOnStreet(osm, frame, near);
  const [clon, clat] = frame.toLonLat(...near.point);
  frame = localFrame(clat, clon);
  const dir = near.dir, normal = [-dir[1], dir[0]];
  const full = [-1, 1].map((k) => frame.toLonLat(normal[0] * HALF * k, normal[1] * HALF * k));
  const lons = full.map((e) => e[0]), lats = full.map((e) => e[1]);
  const pad = 0.0004;
  const bbox = [Math.min(...lons) - pad, Math.min(...lats) - pad, Math.max(...lons) + pad, Math.max(...lats) + pad].join(",");
  const inZps = await S.zps(clat, clon);
  // The city's surfaces as the app asks for them (with the national fallback of sources.js where the city
  // has nothing: then `region` is set), and DMVS alone, one after the other so the times are fair.
  const city = await timed(() => S.mtvu(bbox));
  if (PRAHA && city.error) return { skipped: "no cached IPR answer", bbox };
  const dmvs = await timed(() => dmvsSurfaces(bbox, MTVU_LABELS));
  const [k, pk] = await Promise.all([S.linie(bbox).catch(() => ({ features: [] })), S.parkovani(bbox, inZps).catch(() => ({ features: [] }))]);
  const cut = { lat: clat, lon: clon, bearing: (Math.atan2(dir[0], dir[1]) * 180) / Math.PI, wayId: near.way.id, name: near.way.tags.name || null, highway: near.way.tags.highway, tags: near.way.tags };
  const derive = (m) => {
    if (!m?.json) return { error: m?.error || "no surfaces" };
    const polys = mtvuPolygons(m.json, frame);
    const r = deriveProfile({ center: [0, 0], dir, half: HALF, polys, osm, frame, way: near.way, tracks: trackLines(k, frame), parking: esriPolygons(pk, frame), lines: techLines(k, frame), reach: { left: MAX_REACH, right: MAX_REACH }, inZps });
    return {
      mtvuCount: polys.length, ms: m.ms, runs: r.runs?.map((x) => ({ code: x.code, s: +x.s.toFixed(2), e: +x.e.toFixed(2) })),
      axisT: r.axisT, extent: r.extent, junction: !!r.junction, segments: r.segments, edges: r.edges, notice: r.notice,
      measures: measures(r),
    };
  };
  const a = derive(city), b = derive(dmvs);
  a.fellBack = !!city.json?.region; // the city had nothing: sources.js asked DMVS already
  b.region = dmvs.json?.region || null;
  b.requests = dmvs.json?.requests;
  b.guess = (dmvs.json?.features || []).filter((f) => f.attributes?.ODHAD).length;
  return { cut, bbox, inZps, city: a, dmvs: b };
}

// ---------- Summary ----------
const median = (xs) => { const v = xs.filter((x) => Number.isFinite(x)).sort((p, q) => p - q); return v.length ? (v.length % 2 ? v[(v.length - 1) / 2] : (v[v.length / 2 - 1] + v[v.length / 2]) / 2) : NaN; };
export function differs(r) {
  const a = r.city?.measures, b = r.dmvs?.measures;
  if (!a || !b) return ["chybí"];
  const out = [];
  if (Math.abs(a.roadway - b.roadway) > 0.5) out.push(`vozovka ${a.roadway}/${b.roadway}`);
  if (Math.abs(a.sidewalk - b.sidewalk) > 0.5) out.push(`chodník ${a.sidewalk}/${b.sidewalk}`);
  if (a.edges[0] !== b.edges[0] || a.edges[1] !== b.edges[1]) out.push(`okraje ${a.edges.join("+")}/${b.edges.join("+")}`);
  if (a.osmEstimate !== b.osmEstimate) out.push(`odhad OSM ${a.osmEstimate ? "město" : "DMVS"}`);
  return out;
}
async function summary() {
  const files = (await fs.readdir(OUT)).filter((f) => /^\d+\.json$/.test(f)).sort((p, q) => parseInt(p) - parseInt(q));
  const rs = [];
  for (const f of files) rs.push(JSON.parse(await fs.readFile(path.join(OUT, f), "utf8")));
  const ok = rs.filter((r) => r.city?.measures && r.dmvs?.measures);
  const m = (side, key) => ok.map((r) => r[side].measures[key]);
  const d = (key) => median(ok.map((r) => Math.abs(r.city.measures[key] - r.dmvs.measures[key])));
  const agree = ok.filter((r) => !differs(r).length);
  const regions = {};
  for (const r of ok) regions[r.dmvs.region || "(bez kraje)"] = (regions[r.dmvs.region || "(bez kraje)"] || 0) + 1;
  console.log(`${CITY}: ${rs.length} řezů, ${ok.length} se dvěma profily, ${rs.filter((r) => r.skipped).length} přeskočeno, ${rs.filter((r) => r.error).length} chyb`);
  console.log(`shoda (vozovka, chodník do 0,5 m, okraje stejné): ${agree.length}/${ok.length}`);
  console.log(`medián |rozdílu|: vozovka ${d("roadway").toFixed(2)} m, chodník ${d("sidewalk").toFixed(2)} m, celkem ${d("total").toFixed(2)} m`);
  console.log(`vozovka do 0,5 m: ${ok.filter((r) => Math.abs(r.city.measures.roadway - r.dmvs.measures.roadway) <= 0.5).length}, chodník do 0,5 m: ${ok.filter((r) => Math.abs(r.city.measures.sidewalk - r.dmvs.measures.sidewalk) <= 0.5).length}, okraje stejné: ${ok.filter((r) => r.city.measures.edges.join() === r.dmvs.measures.edges.join()).length}`);
  console.log(`odhad z OSM: město ${m("city", "osmEstimate").filter(Boolean).length}, DMVS ${m("dmvs", "osmEstimate").filter(Boolean).length}; město spadlo na DMVS ${ok.filter((r) => r.city.fellBack).length}`);
  console.log(`Neurčeno (medián podílu): město ${median(m("city", "unknown")).toFixed(3)}, DMVS ${median(m("dmvs", "unknown")).toFixed(3)}; průměr město ${(m("city", "unknown").reduce((p, q) => p + q, 0) / ok.length).toFixed(3)}, DMVS ${(m("dmvs", "unknown").reduce((p, q) => p + q, 0) / ok.length).toFixed(3)}`);
  console.log(`čas ploch (medián, max ms): město ${median(ok.map((r) => r.city.ms))}, ${Math.max(...ok.map((r) => r.city.ms))}; DMVS ${median(ok.map((r) => r.dmvs.ms))}, ${Math.max(...ok.map((r) => r.dmvs.ms))}; dotazů DMVS medián ${median(ok.map((r) => r.dmvs.requests))}; plochy z RÚIAN-odhadu medián ${median(ok.map((r) => r.dmvs.guess))}`);
  console.log("kraje DMVS:", JSON.stringify(regions));
  // Only where both maps have the street's surfaces (neither profile an OSM estimate).
  const both = ok.filter((r) => !r.city.measures.osmEstimate && !r.dmvs.measures.osmEstimate);
  const dd = (key) => median(both.map((r) => Math.abs(r.city.measures[key] - r.dmvs.measures[key])));
  const within = (key) => both.filter((r) => Math.abs(r.city.measures[key] - r.dmvs.measures[key]) <= 0.5).length;
  console.log(`kde mají plochy obě mapy (${both.length}): shoda ${both.filter((r) => !differs(r).length).length}, vozovka do 0,5 m ${within("roadway")}, chodník do 0,5 m ${within("sidewalk")}, okraje stejné ${both.filter((r) => r.city.measures.edges.join() === r.dmvs.measures.edges.join()).length}; medián |rozdílu| vozovka ${dd("roadway").toFixed(2)}, chodník ${dd("sidewalk").toFixed(2)}, celkem ${dd("total").toFixed(2)}; DMVS širší vozovka v ${both.filter((r) => r.dmvs.measures.roadway - r.city.measures.roadway > 0.5).length}, užší v ${both.filter((r) => r.city.measures.roadway - r.dmvs.measures.roadway > 0.5).length}`);
  console.log("liší se:");
  for (const r of ok) { const x = differs(r); if (x.length) console.log(`  ${r.sample.n} ${r.cut.highway} ${r.cut.name || ""}: ${x.join("; ")}`); }
  for (const r of rs) if (!r.city?.measures || !r.dmvs?.measures) console.log(`  ${r.sample.n}: ${r.skipped || r.error || r.city?.error || r.dmvs?.error}`);
}

// ---------- Main ----------
if (process.argv.includes("--summary")) {
  await summary();
} else {
  const { samples } = JSON.parse(await fs.readFile(path.join(DATA, "samples.json"), "utf8"));
  const [from = 1, to = samples.length] = process.argv.slice(2).map(Number);
  await fs.mkdir(OUT, { recursive: true });
  // ONLY=1,3,7: just these cuts; MAX=30: stop after that many cuts with two profiles.
  const only = process.env.ONLY ? new Set(process.env.ONLY.split(",").map(Number)) : null;
  let done = 0;
  for (const s of samples.filter((x) => x.n >= from && x.n <= to && (!only || only.has(x.n)))) {
    if (process.env.MAX && done >= Number(process.env.MAX)) break;
    const out = path.join(OUT, `${s.n}.json`);
    let r;
    try { r = await run(s); } catch (e) { r = { error: String(e.stack || e) }; }
    if (r.skipped) { console.log(s.n, r.skipped); continue; }
    if (r.city?.measures && r.dmvs?.measures) done++;
    await fs.writeFile(out, JSON.stringify({ sample: s, ...r }, null, 1));
    const fmt = (p) => (p?.measures ? `${p.measures.roadway}/${p.measures.sidewalk} ${p.ms}ms` : p?.error || "-");
    console.log(s.n, s.highway, s.name || "", r.skipped || r.error?.slice(0, 80) || `město ${fmt(r.city)} · DMVS ${fmt(r.dmvs)} ${r.dmvs?.region || ""} ${differs(r).join("; ")}`);
  }
}
