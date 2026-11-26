// What the weekly check of the sources asks and how it judges the answers (tools/check_sources.mjs runs it; apart, so that
// tests/check-sources.test.js can fake an outage).
import { AsyncLocalStorage } from "node:async_hooks";

// A street with a surface of each map that does not cover its whole module (towns/*.js SURFACE_MAPS: its keys), and of
// the states whose map does not lie under their example (city.js example is a hint for the visitors, it stays as it is).
// of: the module's first place. Every SURFACE_MAPS entry must have one, or the check says so and fails.
export const POINTS = {
  switzerland: { of: "switzerland", at: "47.374786, 8.536135" }, // Löwenstrasse, Zürich
  netherlands: { of: "netherlands", at: "52.369860, 4.895240" }, // Oudezijds Achterburgwal, Amsterdam
  "bratislava-pasport": { of: "slovensko", at: "48.148683, 17.108843" }, // Hodžovo námestie
  "zilina-pasport": { of: "slovensko", at: "49.221362, 18.734724" }, // Jesenského
  "bystrica-pasport": { of: "slovensko", at: "48.739840, 19.149898" }, // Kollárova
  "kosice-pasport": { of: "slovensko", at: "48.713249, 21.224115" }, // Toryská
  wien: { of: "austria", at: "48.204797, 16.372960" }, // Johannesgasse
  berlin: { of: "germany", at: "52.515062, 13.398115" }, // Werderscher Markt
  hamburg: { of: "germany", at: "53.555403, 9.991654" }, // Neuer Jungfernstieg
  aachen: { of: "germany", at: "50.780096, 6.083289" }, // Hermannstraße
  vl: { of: "belgium", at: "51.054972, 3.726197" }, // Belfortstraat, Ghent
  krakow: { of: "poland", at: "50.065116, 19.934860" }, // Juliana Dunajewskiego
  paris: { of: "france", at: "48.856817, 2.354499" }, // Rue de Rivoli
  lombardia: { of: "italy", at: "45.474379, 9.189057" }, // Via Goito, Milan
  tallinn: { of: "estonia", at: "59.435198, 24.753544" }, // Estonia pst
  helsinki: { of: "finland", at: "60.168852, 24.943633" }, // Aleksanterinkatu
  zaragoza: { of: "spain", at: "41.650391, -0.877306" }, // Calle de Hermanos Ibarra
  toronto: { of: "canada", at: "43.658890, -79.416460" }, // Jersey Avenue, Toronto
  dc: { of: "usa", at: "38.932773, -77.036860" }, // Monroe Street NW, Washington
  sf: { of: "usa", at: "37.760000, -122.414800" }, // Folsom Street, San Francisco
  boston: { of: "usa", at: "42.352044, -71.081746" }, // Marlborough Street, Boston (the site's tiles, data/us-plan)
  cambridge: { of: "usa", at: "42.373870, -71.102450" }, // Cambridge Street, Cambridge
};
const latLon = (s) => s.split(",").map(Number);

// Where to ask and where a surface is required: each module once (towns that only borrow the national sources, olomouc… =
// cesko, with it), all its sources at the example point, and every surface map of its own at its point. The maps are the
// module's SURFACE_MAPS (a module without them, the code before the coverage map: Czech towns the whole town, abroad
// the POINTS of its place that are its AREAS or itself).
export function plan({ CITY_IDS, cityById, TOWNS }, points = POINTS) {
  const out = [], seen = new Set();
  for (const id of CITY_IDS) {
    const mod = TOWNS[id];
    if (mod && seen.has(mod)) continue;
    if (mod) seen.add(mod);
    const c = cityById(id);
    const maps = !mod ? ["all"] : mod.SURFACE_MAPS || (c.abroad ? Object.keys(points).filter((k) => points[k]?.of === id && (k === id || mod.AREAS?.[k])).map((k) => (k === id ? "all" : k)) : ["all"]);
    const all = maps.includes("all");
    out.push({ id, at: latLon((all && points[id]?.at) || c.example), full: true, surface: all });
    for (const key of maps) if (key !== "all" && !key.startsWith("-")) out.push({ id, key, at: points[key] ? latLon(points[key].at) : null, full: false, surface: true });
  }
  return out;
}

// ---------- the requests ----------
// A server that sends no intermediate certificate: browsers fetch it themselves, Node does not.
const CHAIN = new Set(["UNABLE_TO_VERIFY_LEAF_SIGNATURE", "UNABLE_TO_GET_ISSUER_CERT_LOCALLY"]);
const SLOW = new Set(["UND_ERR_CONNECT_TIMEOUT", "UND_ERR_HEADERS_TIMEOUT", "UND_ERR_BODY_TIMEOUT", "ETIMEDOUT"]);
const asked = new AsyncLocalStorage();
export const answered = new Set(); // the hosts that answered some request of this run
const host = (url) => new URL(String(url)).hostname;
// Every request is watched: the sources often leave a failed layer out (a town's lines, the points of Prague's technical
// map) and the profile is then built without it, so a quiet failure counts as one.
export const watched = (native, site) => async (url, opts) => {
  url = /^(https?|data|file):/.test(String(url?.url || url)) ? url : new URL(String(url), site);
  const at = String(url?.url || url), say = (text, kind) => asked.getStore()?.push({ text, kind, host: host(at) });
  try {
    const r = await native(url, opts);
    if (!r.ok) say(`${host(at)} HTTP ${r.status}`, r.status === 504 ? "slow" : "failed");
    else {
      let error = null;
      if ((r.headers.get("content-type") || "").includes("json")) error = (await r.clone().text()).slice(0, 400).match(/"error"\s*:\s*\{[^}]*"code"\s*:\s*(\d+)/)?.[1];
      if (error) say(`${host(at)} chyba ArcGIS ${error}`, "failed");
      else answered.add(host(at));
    }
    return r;
  } catch (err) {
    const code = err.cause?.code || err.cause?.message || err.message;
    if (CHAIN.has(code)) say(`${host(at)} neposílá celý řetězec certifikátů (prohlížeče si poradí)`, "chain");
    else say(`${host(at)} ${code}`, err.name === "TimeoutError" || SLOW.has(code) ? "slow" : "failed");
    throw err;
  }
};

// ---------- one source ----------
const count = (json) => json?.features?.length ?? json?.elements?.length ?? 0;
// state: "ok" with the number of features, "prázdné", "náhrada ČÚZK", "tichá chyba" (a request failed but the source went
// on without it), "varování" (only a server's incomplete certificate chain) or "CHYBA".
// need: empty is a failure (a street with a surface map, OSM).
export async function attempt(run, need) {
  const trouble = [];
  let state, note = "", thrown = false;
  try {
    const json = await asked.run(trouble, run);
    const n = count(json), unanswered = Object.keys(json || {}).filter((k) => /^([a-z]{2}|map|ddot)Failed$/.test(k) && json[k]);
    if (json?.dmvs) { state = need ? "náhrada ČÚZK" : "ok"; note = `${n} prvků z technické mapy ČÚZK, vlastní služba nic nevrátila`; }
    else if (unanswered.length) { state = "CHYBA"; note = "mapa povrchů neodpověděla"; }
    else if (n || (json && !json.features && !json.elements)) { state = "ok"; note = n ? `${n} prvků` : ""; }
    else if (need) { state = "CHYBA"; note = "prázdná odpověď"; }
    else state = "prázdné";
  } catch (err) {
    state = "CHYBA"; thrown = true; note = String(err?.message || err).replace(/\s+/g, " ").slice(0, 120);
  }
  if (trouble.length) {
    const chainOnly = trouble.every((x) => x.kind === "chain");
    if (chainOnly) state = "varování";
    else if (state !== "CHYBA") state = "tichá chyba";
    note = [note, [...new Set(trouble.map((x) => x.text))].join("; ")].filter(Boolean).join(" – ");
  }
  // Only slow: nothing but timeouts (an exception without a request of its own is a fault of the data or the code).
  const real = trouble.filter((x) => x.kind !== "chain");
  return { state, note, thrown, slow: real.length > 0 && real.every((x) => x.kind === "slow"), hosts: [...new Set(real.map((x) => x.host))] };
}
export const GOOD = new Set(["ok", "prázdné", "varování"]);
export const isBad = (r) => !GOOD.has(r.state);

// A failed check is asked once more after a pause; run gets the number of the attempt (the sources keep the last answers,
// so the second one asks a box moved by some centimetres).
export async function check(run, { need = false, pause = 15000 } = {}) {
  const t = Date.now();
  let r = await attempt(() => run(0), need);
  if (isBad(r)) {
    const first = r.note;
    await new Promise((res) => setTimeout(res, pause));
    r = await attempt(() => run(1), need);
    if (!isBad(r)) r.note = [r.note, `až napodruhé (${first})`].filter(Boolean).join(", ");
  }
  return { ...r, need, time: `${((Date.now() - t) / 1000).toFixed(1)} s` };
}

// A service that was only slow, twice: a warning where a first-class check (need) of the same state passed; a slow
// first-class check itself only when the host that kept it waiting answered elsewhere in the run (then it runs).
export function settle(rows, hosts = answered) {
  return rows.map((r) => {
    if (!isBad(r) || !r.slow) return r;
    const fine = r.need ? r.hosts.every((h) => hosts.has(h)) && rows.some((o) => o !== r && o.need && o.state === "ok" && o.country === r.country)
      : rows.some((o) => o.need && o.state === "ok" && o.country === r.country);
    return fine ? { ...r, state: "varování", note: `pomalá služba (dvakrát): ${r.note}` } : r;
  });
}

// All of it. deps: the app's modules; only: ids or keys.
export async function runChecks(deps, { only = [], pause } = {}) {
  const { cityById, setCity, cityAt, TOWNS, sources } = deps, rows = [];
  for (const p of plan(deps)) {
    if (only.length && !only.includes(p.id) && !only.includes(p.key)) continue;
    const label = p.key ? `${p.id}: ${p.key}` : p.id, country = cityById(p.id).country ?? "CZ";
    const add = async (name, run, need = false) => rows.push({ city: label, name, country, ...(await check(run, { need, pause })) });
    if (!p.at) { rows.push({ city: label, name: "plochy (mapa povrchů)", country, need: true, state: "CHYBA", note: "chybí bod v POINTS (tools/check_sources_lib.mjs)", slow: false, hosts: [], time: "" }); continue; }
    const [lat, lon] = p.at;
    // The city of the map's point where it has the same module (Bratislava, Vienna), else the module's place.
    const there = p.key && cityAt ? cityAt(lat, lon) : p.id;
    setCity(TOWNS[there] && TOWNS[there] === TOWNS[p.id] ? there : p.id);
    const d = 0.0006; // about 60 m around the point, as a short cut
    const bbox = (i) => [lon - d, lat - d, lon + d, lat + d].map((x) => (x + i * 2e-6).toFixed(6)).join(",");
    if (p.full) await add("OSM (dlaždice webu)", () => sources.osm(lat, lon, 80), true);
    await add("plochy (mapa povrchů)", (i) => sources.mtvu(bbox(i)), p.surface);
    if (!p.full) continue;
    await add("linie a body (koleje, ploty…)", (i) => sources.linie(bbox(i)));
    if (p.id === "praha") await add("zóny placeného stání (soubor webu)", () => sources.zpsZones().then((b) => (b ? { features: b } : null)), true);
    const inZone = await sources.zps(lat, lon).catch(() => undefined);
    await add("parkování", (i) => sources.parkovani(bbox(i), inZone));
    await add("budovy (podlaží)", (i) => sources.podlaznost(lat + i * 2e-6, lon));
  }
  return rows;
}
