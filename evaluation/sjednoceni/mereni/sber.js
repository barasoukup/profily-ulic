// Measurement of the shared changes (evaluation/sjednoceni/mereni): every point in several arms (?off= switches set live)
// at the same place; the services' answers are kept in memory for the point, so the arms read the same data.
const read = () => JSON.parse(localStorage.getItem("streetdesign-pilot") || "{}");
const real = window.fetch.bind(window);
let mem = new Map(), hits = 0, miss = 0, lastGeo = 0;
let geoChain = Promise.resolve();
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const fails = {};
export const stats = () => ({ hits, miss, fails });
window.fetch = async (input, init = {}) => {
  const url = typeof input === "string" ? input : input.url || String(input), method = (init.method || input.method || "GET").toUpperCase();
  const local = url.startsWith("/") && !url.startsWith("//") || url.startsWith(location.origin) || url.startsWith("blob:") || url.startsWith("data:") || !/^https?:/.test(url);
  const isApi = local && /\/api\/(mtvu|parkovani|podlaznost|linie|koleje|body)/.test(url);
  if ((local && !isApi) || (method !== "GET" && typeof init.body !== "string" && !(init.body instanceof URLSearchParams))) return real(input, init);
  const key = method + " " + url + " " + (init.body || "") + " " + JSON.stringify(init.headers && !(init.headers instanceof Headers) ? init.headers : {});
  if (mem.has(key)) { hits++; const c = await mem.get(key); if (c) return new Response(c.status === 204 || c.status === 304 ? null : c.body, { status: c.status, headers: c.headers }); }
  miss++;
  if (/geodienste\.ch/.test(url)) { const w = geoChain.then(() => sleep(Math.max(0, 6500 - (Date.now() - lastGeo)))).then(() => { lastGeo = Date.now(); }); geoChain = w; await w; init = { ...init, signal: undefined }; }
  let res;
  try { res = await real(input, init); } catch (e) { const h = new URL(url, location.href).host; fails[h] = (fails[h] || 0) + 1; throw e; }
  if (res.status === 404) { mem.set(key, { status: 404, headers: [], body: null }); const h = new URL(url, location.href).host + ' 404'; fails[h] = (fails[h] || 0) + 1; return new Response(null, { status: 404 }); }
  if (!res.ok && res.status !== 206) { const h = new URL(url, location.href).host + " " + res.status; fails[h] = (fails[h] || 0) + 1; return res; }
  if (/arcgis|json/i.test(res.headers.get("content-type") || "") ) {
    const body = await res.arrayBuffer(), txt = body.byteLength < 2000 ? new TextDecoder().decode(body) : "";
    const c = { status: res.status, headers: [...res.headers].filter(([k]) => !/content-(encoding|length)/i.test(k)), body };
    if (!/"error"/.test(txt)) mem.set(key, c); else { const h = new URL(url, location.href).host + " err"; fails[h] = (fails[h] || 0) + 1; }
    return new Response(c.body.slice(0), { status: c.status, headers: c.headers });
  }
  const body = await res.arrayBuffer(), c = { status: res.status, headers: [...res.headers].filter(([k]) => !/content-(encoding|length)/i.test(k)), body };
  mem.set(key, c);
  return new Response(body.slice(0), { status: c.status, headers: c.headers });
};
export const OFF = ["mapfill", "lawlanes", "parkshare", "obsluzne", "protejsi", "ulicky", "osaroad", "pocetpruhu", "widereach"];
export const V = { N: { key: "N" }, O: { key: "O", off: OFF }, OSK: { key: "OSK", off: OFF, set: { SK: { parkGuess: false } } }, N2: { key: "N2" }, F: { key: "F" } };
for (const k of OFF) V[k] = { key: k, off: [k] };
const CITYPAUSE = {};
const one = (s) => ({ name: s.cut?.name, city: s.cut?.city, wayId: s.cut?.wayId, lat: s.cut?.lat, lon: s.cut?.lon, bearing: s.cut?.bearing, reach: s.cut?.reach, span: s.cut?.span, sources: s.cut?.sources, note: s.cut?.note,
  segments: (s.stav?.segments || []).map((x) => [x.type, +x.width.toFixed(2), x.source || ""]), edges: [s.stav?.edges?.left, s.stav?.edges?.right] });
// only: (row) => variant keys still to do; rows given continue.
export async function collect(pts, keys, name, rows0 = null, pause = 0) {
  const { COUNTRIES } = await import("/countries/index.js");
  const oo = await import("/ortho-osm.js"), C = await import("/city.js");
  const rows = ((window.__sj ||= {})[name] ||= rows0 || []);
  let n = 0;
  for (const p of pts) {
    let row = rows.find((r) => r.id === p.id);
    const todo = keys.filter((k) => !(row && row[k] && !row[k].error));
    if (!todo.length) continue;
    if (!row) rows.push((row = { id: p.id, country: p.country, place: p.place, highway: p.highway }));
    mem = new Map();
    let at = row.F && !row.F.error && p.bearing == null ? row.F : null;
    const free = p.bearing == null;
    for (const k of todo) {
      const v = V[k];
      const kept = [];
      for (const [iso, fields] of Object.entries(v.set || {})) for (const [f, val] of Object.entries(fields)) { kept.push([COUNTRIES[iso], f, COUNTRIES[iso][f]]); COUNTRIES[iso][f] = val; }
      C.setCity(C.city.id);
      oo.P.off = new Set(v.off || []);
      for (let tryN = 0; tryN < 2; tryN++) {
        localStorage.removeItem("streetdesign-pilot");
        const t0 = Date.now();
        try {
          const job = free && !at && k !== 'F' ? null : free && k === 'F' ? window.cutAt(p.lat, p.lon) : at ? window.cutAt(at.lat, at.lon, false, at.bearing) : window.cutAt(p.lat, p.lon, false, p.bearing);
          await Promise.race([job, sleep(150000).then(() => { throw new Error("timeout"); })]);
          const r = one(read());
          if (!r.lat) throw new Error("no cut");
          const d = Math.hypot((r.lat - p.lat) * 110574, (r.lon - p.lon) * 111320 * Math.cos((p.lat * Math.PI) / 180));
          if (d > 120) throw new Error("stale " + d);
          r.moved = +d.toFixed(2); r.country = C.city.country; r.ms = Date.now() - t0;
          row[k] = r; if (k === 'F') at = r;
        } catch (e) { row[k] = { error: String(e), ms: Date.now() - t0, status: document.querySelector("#status")?.textContent }; if (/timeout|stale/.test(e)) await sleep(15000); }
        if (!row[k].error) break;
      }
      for (const [m, f, val] of kept) m[f] = val;
    }
    C.setCity(C.city.id); oo.P.off = new Set();
    n++;
    window.__sjStatus = `${rows.length}/${pts.length} ${row.id}`;
    if (n % 5 === 0) await real(`/api/eval-save?name=${name}`, { method: "POST", body: JSON.stringify(rows) });
    if (pause) await sleep(pause);
  }
  await real(`/api/eval-save?name=${name}`, { method: "POST", body: JSON.stringify(rows) });
  window.__sjStatus = "done " + rows.length;
  return rows.length;
}
// The clicked way's tags (highway, service) of each row's cut, from the state's OSM pack.
export async function tags(rows) {
  const sources = await import("/sources.js"), out = {};
  for (const r of rows) {
    const c = r.N; if (!c?.lat) continue;
    try { const o = await sources.osm(c.lat, c.lon, 80); const w = (o.elements || []).find((e) => e.id === c.wayId && e.tags?.highway); if (w) out[r.id] = { wayId: c.wayId, highway: w.tags.highway, ...(w.tags.service ? { service: w.tags.service } : {}) }; } catch (e) { out[r.id] = { error: String(e) }; }
  }
  return out;
}
