// The gap between the Plan de voirie's sidewalk and the house at the facade (Bára 26. 11. 2026, docs/backlog.md
// "Paříž"): for each side of the Paris cuts of the A/B samples, from the cut's centre outwards, the far edge of the
// sidewalk run before the first house, and that house's nearest edge on the cut, for OSM's houses (what the app
// takes), BD TOPO's (IGN, Géoplateforme WFS, Licence Ouverte 2.0) and the Plan de voirie's private blocks
// (plan-de-voirie-emprises-ilots-prives, ODbL); asked once a cut, kept in data/. Prints the
// gaps and their counts.   SITE=http://localhost:5237 node evaluation/france/facade/gap.mjs
import fs from "node:fs/promises";
import crypto from "node:crypto";
const SITE = process.env.SITE, CACHE = new URL("data/", import.meta.url);
globalThis.location = { search: "?osm=balik", href: SITE, origin: SITE };
await fs.mkdir(CACHE, { recursive: true });
const native = globalThis.fetch, sha = (s) => crypto.createHash("sha1").update(s).digest("hex");
let last = 0;
globalThis.fetch = async (url, o) => {
  url = String(url?.url || url);
  if (!/^https?:/.test(url)) return native(new URL(url, SITE + "/"), o);
  const f = new URL(sha(url) + ".json", CACHE);
  try { return new Response(await fs.readFile(f), { headers: { "content-type": "application/json" } }); } catch {}
  last = Math.max(last + 1000, Date.now());
  await new Promise((r) => setTimeout(r, last - Date.now()));
  const r = await native(url, { headers: { "User-Agent": "profily-ulic evaluation" } });
  const t = await r.text();
  if (r.ok) await fs.writeFile(f, t);
  return new Response(t, { status: r.status });
};
const FR = await import("../../../pilot/public/towns/france.js"), { localFrame } = await import("../../../pilot/public/derive.js");
const json = async (f) => JSON.parse(await fs.readFile(new URL(f, import.meta.url), "utf8"));
const cuts = [...(await json("../ab/vysledky/rezy.json")).map((r) => ({ id: r.id, c: r.B })), ...(await json("../../facade-strip/vysledky/rezy-1.json")).filter((r) => r.place === "paris").map((r) => ({ id: r.id, c: r.N }))]
  .filter((x) => x.c?.lat && x.c.sources?.frTown);
const inRing = (r, x, y) => { let c = false; for (let i = 0, j = r.length - 1; i < r.length; j = i++) { const [xi, yi] = r[i], [xj, yj] = r[j]; if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c; } return c; };
const ringsOf = (g) => (g?.type === "Polygon" ? g.coordinates : g?.type === "MultiPolygon" ? g.coordinates.flat() : null);
const rows = [];
for (const { id, c } of cuts) {
  const fr = localFrame(c.lat, c.lon), b = (c.bearing * Math.PI) / 180, dir = [Math.sin(b), Math.cos(b)], n = [-dir[1], dir[0]];
  const ends = [-1, 1].map((k) => fr.toLonLat(n[0] * 40 * k, n[1] * 40 * k)), pad = 0.0004;
  const box = [Math.min(ends[0][0], ends[1][0]) - pad, Math.min(ends[0][1], ends[1][1]) - pad, Math.max(ends[0][0], ends[1][0]) + pad, Math.max(ends[0][1], ends[1][1]) + pad];
  const m = await FR.sources.surfaces(box.join(","));
  if (!m.passport) continue;
  const bd = await fetch(`${FR.BDTOPO_WFS}?${new URLSearchParams({ SERVICE: "WFS", VERSION: "2.0.0", REQUEST: "GetFeature", TYPENAMES: "BDTOPO_V3:batiment", SRSNAME: "EPSG:4326", BBOX: `${box[1]},${box[0]},${box[3]},${box[2]},urn:ogc:def:crs:EPSG::4326`, OUTPUTFORMAT: "application/json", COUNT: "500" })}`).then((r) => r.json());
  const il = await fetch(`${FR.PARIS_API}/plan-de-voirie-emprises-ilots-prives/records?${new URLSearchParams({ where: `in_bbox(geo_shape,${box[1]},${box[0]},${box[3]},${box[2]})`, select: "geo_shape", limit: "100" })}`).then((r) => r.json());
  const xy = (rs) => rs.map((r) => r.map(([lo, la]) => fr.toXY(lo, la)));
  const osmH = m.features.filter((f) => f.attributes.CTVUK_KOD === 601 && !f.attributes.PASPORT).map((f) => xy(f.geometry.rings));
  const bdH = (bd.features || []).filter((f) => f.properties?.etat_de_l_objet === "En service" && !f.properties?.construction_legere).map((f) => ringsOf(f.geometry)).filter(Boolean).map((rs) => xy(rs.map((r) => r.map(([lo, la]) => [lo, la]))));
  const ilH = (il.results || []).map((r) => ringsOf(r.geo_shape?.geometry)).filter(Boolean).map(xy);
  const walk = m.features.filter((f) => f.attributes.PASPORT && f.attributes.CTVUK_KOD === 702).map((f) => xy(f.geometry.rings));
  const pas = m.features.filter((f) => f.attributes.PASPORT).map((f) => xy(f.geometry.rings));
  const hit = (set, t) => set.some((rs) => inRing(rs[0], n[0] * t, n[1] * t) && !rs.slice(1).some((h) => inRing(h, n[0] * t, n[1] * t)));
  for (const [side, sg] of [["A", -1], ["B", 1]]) {
    let walkEnd = null, any = null;
    for (let t = 0; t <= 40; t += 0.05) { const T = sg * t; if (hit(pas, T)) any = T; if (hit(walk, T)) walkEnd = T; else if (walkEnd !== null && hit(pas, T)) walkEnd = null; }
    // The far edge of the outermost passport sidewalk run that is the passport's last surface on this side.
    if (walkEnd === null || any === null || Math.abs(any - walkEnd) > 0.1) continue;
    const first = (set) => { for (let t = Math.abs(walkEnd) - 3; t <= 40; t += 0.05) if (t > 0 && hit(set, sg * t)) return t; return null; };
    const o = first(osmH), d = first(bdH), q = first(ilH), e = Math.abs(walkEnd);
    rows.push({ id, side, walkEnd: +e.toFixed(2), osm: o === null ? null : +(o - e).toFixed(2), bdtopo: d === null ? null : +(d - e).toFixed(2), ilots: q === null ? null : +(q - e).toFixed(2) });
  }
}
const bin = (v) => (v === null ? "žádný dům do 40 m" : v < -0.2 ? "dům přes chodník (< −0,2)" : v <= 0.2 ? "±0,2 m" : v <= 1.5 ? "0,2–1,5 m" : "> 1,5 m");
for (const k of ["osm", "bdtopo", "ilots"]) {
  const c = {};
  for (const r of rows) c[bin(r[k])] = (c[bin(r[k])] || 0) + 1;
  const near = rows.map((r) => r[k]).filter((v) => v !== null && Math.abs(v) <= 1.5).sort((a, b) => a - b);
  console.log(k, JSON.stringify(c), "medián |mezery| do 1,5 m:", near.length ? Math.abs(near.map(Math.abs).sort((a, b) => a - b)[near.length >> 1]).toFixed(2) : "–");
}
await fs.writeFile(new URL("vysledky/gaps.json", import.meta.url), JSON.stringify(rows, null, 1));
console.log(rows.length, "stran");
