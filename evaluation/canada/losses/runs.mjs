// node evaluation/canada/losses/runs.mjs <id>…   (services cached in data/cache, 500 ms apart)
// The map's runs of a cut in Node, with and without a rule (DC: DDOT; Toronto: mapgaps, kerbbays, roadtracks), from the
// services' answers (cached here, 500 ms apart), the cut as sample.json has it, half 35 m. Prints the runs in t (m along
// the cut, A negative) and, for DC, where the SubBlock lines cross.
import fs from "node:fs";
const W = new URL("../../../", import.meta.url).pathname;
const SP = new URL("data/cache/", import.meta.url).pathname;
fs.mkdirSync(SP, { recursive: true });
globalThis.PROFILY_US = {}; globalThis.PROFILY_CA = {};
const { osmAt } = await import(W + "evaluation/clicks/osm.mjs");
const usa = await import(W + "app/public/towns/usa.js");
const ca = await import(W + "app/public/towns/canada.js");
const P = await import(W + "app/public/towns/planimetrics.js");
const { cutOfBox } = await import(W + "app/public/towns/belgium.js");
const crypto = await import("node:crypto");
const sample = JSON.parse(fs.readFileSync(W + "evaluation/canada/review/sample.json", "utf8"));
async function get(url) {
  const f = SP + crypto.createHash("sha1").update(url).digest("hex") + ".json";
  if (fs.existsSync(f)) return JSON.parse(fs.readFileSync(f, "utf8"));
  await new Promise((r) => setTimeout(r, 500));
  const j = await (await fetch(url)).json();
  fs.writeFileSync(f, JSON.stringify(j));
  return j;
}
const q = (base, id, bbox, fields) => get(`${base}/${id}/query?${new URLSearchParams({ geometry: bbox, geometryType: "esriGeometryEnvelope", inSR: "4326", outSR: "4326", spatialRel: "esriSpatialRelIntersects", f: "json", outFields: fields, returnGeometry: "true" })}`);
const NAME = { 701: "road", 702: "walk", 703: "TRACK", 704: "PARK", 705: "BED", 9950: "MEDIAN", 401: "green", 601: "bldg", 1003: "lot" };
function runsOf(features, c) {
  return features.map((f) => {
    const ts = f.geometry.rings[0].map(([lon, lat]) => ((lon - c.lon0) * c.kx) * c.dir[0] + ((lat - c.lat0) * c.ky) * c.dir[1]);
    return { code: f.attributes.code, s: Math.min(...ts), e: Math.max(...ts) };
  }).sort((a, b) => a.s - b.s);
}
const show = (runs) => runs.filter((r) => r.e > -30 && r.s < 30).map((r) => `${NAME[r.code] || r.code}[${r.s.toFixed(1)},${r.e.toFixed(1)}]`).join(" ");
for (const id of process.argv.slice(2)) {
  const s = sample.find((x) => x.id === id), half = 35;
  const b = (s.bearing * Math.PI) / 180, along = [Math.sin(b), Math.cos(b)], dir = [along[1], -along[0]];
  const kx = 111320 * Math.cos((s.lat * Math.PI) / 180), ky = 110574, pad = 0.0004;
  const ends = [-1, 1].map((k) => [s.lon + (k * dir[0] * half) / kx, s.lat + (k * dir[1] * half) / ky]);
  const bbox = [Math.min(ends[0][0], ends[1][0]) - pad, Math.min(ends[0][1], ends[1][1]) - pad, Math.max(ends[0][0], ends[1][0]) + pad, Math.max(ends[0][1], ends[1][1]) + pad].map((x) => x.toFixed(6)).join(",");
  const { elements } = await osmAt(s.lat, s.lon, 90, false);
  const way = elements.find((e) => e.type === "way" && e.id === s.wayId);
  const c = cutOfBox(bbox, [way]);
  const flip = c.dir[0] * dir[0] + c.dir[1] * dir[1] < 0; // cutOfBox's dir may point B→A
  console.log(`### ${id} ${s.name} (${s.highway})  dir ${flip ? "B→A (t flipped below)" : "A→B"}`);
  const fix = (runs) => (flip ? runs.map((r) => ({ ...r, s: -r.e, e: -r.s })).sort((a, b) => a.s - b.s) : runs);
  if (s.lat < 41) {
    const [roads, walks, bldg] = await Promise.all([q(usa.DC_PLAN, 10, bbox, "DESCRIPTION"), q(usa.DC_PLAN, 11, bbox, "DESCRIPTION"), q(usa.DC_PLAN, 1, bbox, "DESCRIPTION")]);
    const sub = await q(usa.DC_SUBBLOCK.replace(/\/162$/, ""), 162, bbox, "*");
    for (const ddot of [true, false]) {
      const r = usa.dcSurfaces({ roads, walks, bldg, sub }, elements, bbox, way.tags, { ddot, way });
      console.log(`  ${ddot ? "def  " : "ddot0"}: ${r ? show(fix(runsOf(r.features, c))) : "null"} ${r?.wayTags ? JSON.stringify(r.wayTags) : ""}`);
    }
    for (const f of sub.features || []) {
      const ts = P.parallelsAt([{ type: "way", tags: { highway: "x" }, geometry: f.geometry.paths[0].map(([lon, lat]) => ({ lon, lat })) }], c, () => true).map((t) => (flip ? -t : t));
      const a = f.attributes;
      if (ts.length) console.log(`    line ${a.ROUTENAME} type${a.ROADTYPE} t=${ts.map((t) => t.toFixed(1))} lanes ${a.TOTALTRAVELLANES} (ib ${a.TOTALTRAVELLANESINBOUND} ob ${a.TOTALTRAVELLANESOUTBOUND}) park ${a.TOTALPARKINGLANES}/${a.TOTALPARKINGLANEWIDTH}ft bike ${[a.BIKELANE_CONVENTIONAL, a.BIKELANE_BUFFERED, a.BIKELANE_PROTECTED, a.BIKELANE_DUAL_PROTECTED].map((x) => x || "-")} peak ${a.PEAKPARKINGRESTRICTION ?? ""} xsec ${a.TOTALCROSSSECTIONWIDTH}ft`);
    }
  } else {
    const T = ca.TORONTO_MAP, answers = await Promise.all(T.layers.map((l) => q(T.service, l.id, bbox, l.fields || T.fields)));
    for (const v of ["", "mapgaps", "kerbbays", "roadtracks"]) {
      globalThis.PROFILY_CA = v ? { off: v } : {};
      const r = P.planimetricCut(T, answers, elements, bbox, way.tags, { way });
      console.log(`  ${(v ? "-" + v : "def").padEnd(11)}: ${r ? show(fix(runsOf(r.features, c))) : "null"}`);
    }
    globalThis.PROFILY_CA = { off: "roadtracks" };
    const r0 = P.planimetricCut(T, answers, elements, bbox, way.tags, { way });
    globalThis.PROFILY_CA = {};
    if (r0) {
      const runs = runsOf(r0.features, c), at = P.carriageway(runs);
      if (at) {
        const lo = runs[at[0]].s, hi = runs[at[1]].e;
        const ts = elements.filter((el) => el.tags && el.id !== way.id && P.isTrack(el)).flatMap((el) => P.parallelsAt([el], c, () => true).map((t) => ({ t, w: el.tags.width, id: el.id })));
        const fl = (t) => (flip ? -t : t);
        console.log(`  carriageway [${fl(flip ? hi : lo).toFixed(1)},${fl(flip ? lo : hi).toFixed(1)}] tracks(separate): ${ts.map((x) => `${fl(x.t).toFixed(1)}${x.w ? "w" + x.w : ""}`).join(" ")} tagged: ${["cycleway", "cycleway:both", "cycleway:left", "cycleway:right"].filter((k) => way.tags[k]).map((k) => k + "=" + way.tags[k]).join(" ")}`);
      }
    }
  }
}
