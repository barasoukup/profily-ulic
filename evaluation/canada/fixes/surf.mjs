// The map's runs of cuts in Node under variants of the switches (the fixes of FIXES.md), from the services' answers cached in
// ../losses/data/cache (asked once, 500 ms apart): which cuts a fix changes, before they are cut in the app.
//   node evaluation/canada/fixes/surf.mjs <sample.json> <variant>… [--ids a,b]   variant: name=off1+off2 (name= : all on)
// Prints a JSON line a cut and variant: { id, v, runs: "code s e …", tags (wayTags), npg (noParkGuess) }.
import fs from "node:fs";
import crypto from "node:crypto";
const W = new URL("../../../", import.meta.url).pathname, SP = W + "evaluation/canada/losses/data/cache/";
fs.mkdirSync(SP, { recursive: true });
globalThis.PROFILY_US = {}; globalThis.PROFILY_CA = {};
const { osmAt } = await import(W + "evaluation/clicks/osm.mjs");
const usa = await import(W + "app/public/towns/usa.js");
const ca = await import(W + "app/public/towns/canada.js");
const P = await import(W + "app/public/towns/planimetrics.js");
const { cutOfBox } = await import(W + "app/public/towns/belgium.js");
const args = process.argv.slice(2), idsAt = args.indexOf("--ids"), ids = idsAt >= 0 ? new Set(args[idsAt + 1].split(",")) : null;
const [file, ...vs] = args.filter((_, i) => idsAt < 0 || (i !== idsAt && i !== idsAt + 1));
const raw = JSON.parse(fs.readFileSync(file, "utf8")), sample = (Array.isArray(raw) ? raw : raw.rows).filter((s) => !ids || ids.has(s.id));
const variants = vs.map((v) => { const [name, o] = v.split("="); return [name || "def", (o || "").split("+").filter(Boolean).join(",")]; });
let last = 0;
async function get(url) {
  const f = SP + crypto.createHash("sha1").update(url).digest("hex") + ".json";
  if (fs.existsSync(f)) return JSON.parse(fs.readFileSync(f, "utf8"));
  last = Math.max(last + 500, Date.now()); await new Promise((r) => setTimeout(r, last - Date.now()));
  for (let k = 0; ; k++) {
    try {
      const j = await (await fetch(url)).json();
      if (j.error) throw new Error(JSON.stringify(j.error));
      fs.writeFileSync(f, JSON.stringify(j));
      return j;
    } catch (e) { if (k >= 2) throw e; await new Promise((r) => setTimeout(r, 3000)); }
  }
}
const q = (base, id, bbox, fields) => get(`${base}/${id}/query?${new URLSearchParams({ geometry: bbox, geometryType: "esriGeometryEnvelope", inSR: "4326", outSR: "4326", spatialRel: "esriSpatialRelIntersects", f: "json", outFields: fields, returnGeometry: "true" })}`);
function runsOf(features, c, flip) {
  const r = features.map((f) => {
    const ts = f.geometry.rings[0].map(([lon, lat]) => ((lon - c.lon0) * c.kx) * c.dir[0] + ((lat - c.lat0) * c.ky) * c.dir[1]);
    return { code: f.attributes.code, s: Math.min(...ts), e: Math.max(...ts) };
  });
  return (flip ? r.map((x) => ({ ...x, s: -x.e, e: -x.s })) : r).sort((a, b) => a.s - b.s).filter((x) => x.e > -30 && x.s < 30).map((x) => `${x.code} ${x.s.toFixed(1)} ${x.e.toFixed(1)}`).join(" | ");
}
for (const s of sample) {
  const half = 35, b = (s.bearing * Math.PI) / 180, along = [Math.sin(b), Math.cos(b)], dir = [along[1], -along[0]];
  const kx = 111320 * Math.cos((s.lat * Math.PI) / 180), ky = 110574, pad = 0.0004;
  const ends = [-1, 1].map((k) => [s.lon + (k * dir[0] * half) / kx, s.lat + (k * dir[1] * half) / ky]);
  const bbox = [Math.min(ends[0][0], ends[1][0]) - pad, Math.min(ends[0][1], ends[1][1]) - pad, Math.max(ends[0][0], ends[1][0]) + pad, Math.max(ends[0][1], ends[1][1]) + pad].map((x) => x.toFixed(6)).join(",");
  try {
    const { elements } = await osmAt(s.lat, s.lon, 90, false);
    const way = elements.find((e) => e.type === "way" && e.id === s.wayId);
    if (!way) { console.log(JSON.stringify({ id: s.id, error: "no way" })); continue; }
    const c = cutOfBox(bbox, [way]), flip = c.dir[0] * dir[0] + c.dir[1] * dir[1] < 0;
    let ans;
    if (s.lat < 41) {
      const [roads, walks, bldg] = await Promise.all([q(usa.DC_PLAN, 10, bbox, "DESCRIPTION"), q(usa.DC_PLAN, 11, bbox, "DESCRIPTION"), q(usa.DC_PLAN, 1, bbox, "DESCRIPTION")]);
      const sub = await q(usa.DC_SUBBLOCK.replace(/\/162$/, ""), 162, bbox, "*");
      ans = () => usa.dcSurfaces({ roads, walks, bldg, sub }, elements, bbox, way.tags, { ddot: true, way });
    } else {
      const T = ca.TORONTO_MAP, answers = [];
      for (const l of T.layers) answers.push(await q(T.service, l.id, bbox, l.fields || T.fields));
      ans = () => P.planimetricCut(T, answers, elements, bbox, way.tags, { way });
    }
    for (const [name, o] of variants) {
      globalThis.PROFILY_US = o ? { off: o } : {}; globalThis.PROFILY_CA = o ? { off: o } : {};
      const r = ans();
      // (What only the app shows: medians the orthophoto tells, car axes under a carved track.)
      const tOf = (f) => f.geometry.rings[0].map(([lon, lat]) => ((lon - c.lon0) * c.kx) * c.dir[0] + ((lat - c.lat0) * c.ky) * c.dir[1]);
      const carved = (r?.features || []).filter((f) => f.attributes.CARVED_TRACK).map(tOf).map((ts) => [Math.min(...ts), Math.max(...ts)]);
      const axes = carved.length ? P.parallelsAt(elements, c, (el) => el.tags?.highway && !P.WALKED.has(el.tags.highway)) : [];
      console.log(JSON.stringify({ id: s.id, v: name, runs: r ? runsOf(r.features, c, flip) : null, tags: r?.wayTags || null, npg: !!r?.noParkGuess,
        medians: (r?.features || []).filter((f) => f.attributes.MEDIAN_GAP).length, axisUnder: axes.some((t) => carved.some(([a, b]) => t > a && t < b)) }));
    }
  } catch (e) { console.log(JSON.stringify({ id: s.id, error: String(e.message || e) })); }
}
