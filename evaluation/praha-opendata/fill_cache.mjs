// Fills the local server's cache (pilot/cache) for the Prague sample cuts that have no cached IPR answer
// yet, so evaluation/ab.mjs (CITY=praha, cache only) can derive all 100 cuts: MTVU, the line layer, parking
// and the point layer of the technical map (layer 9). The cuts and their bboxes come from an earlier ab.mjs
// run (evaluation/praha/data/ab-<a>-<b>/<n>.json). Requests go through polite.mjs: one at a time, 300 ms apart.
//   node evaluation/praha-opendata/fill_cache.mjs [ab-city-stejne]
// The same requests and cache files as pilot/server.mjs (cache key: the bbox as ab.mjs rounds it).
import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { politeFetch } from "../polite.mjs";
import { MTVU, MTVU_FIELDS, TM_LINES, LINE_WHERE, TM_POINTS, POINT_WHERE, PARKOVANI, PARKING_LAYERS, parkingFields } from "../../pilot/public/queries.js";

const ROOT = path.dirname(new URL(import.meta.url).pathname);
const PILOT = path.join(ROOT, "..", "..", "pilot");
const RUN = path.join(ROOT, "..", "praha", "data", process.argv[2] || "ab-city-stejne");
const sha1 = (s) => crypto.createHash("sha1").update(s).digest("hex");
const round = (v) => Math.round(v * 1e5) / 1e5;
const key = (bbox) => bbox.split(",").map(Number).map(round).join(",");
const file = (kind, bbox) => path.join(PILOT, "cache", kind, sha1(key(bbox)) + ".json");
const exists = (f) => fs.access(f).then(() => true, () => false);

async function ask(url, params) {
  const q = new URLSearchParams({ geometryType: "esriGeometryEnvelope", inSR: "4326", outSR: "4326", spatialRel: "esriSpatialRelIntersects", f: "json", ...params });
  const r = await politeFetch(`${url}?${q}`, { headers: { "User-Agent": "streetdesign-pilot/0.1 (evaluation)" } });
  if (!r.ok) throw new Error(`${url} ${r.status}`);
  const json = await r.json();
  if (json.error) throw new Error(`${url}: ${json.error.code} ${json.error.message}`);
  return json;
}
const layer = async (bbox, n, kind) => ((await ask(`${PARKOVANI}/${n}/query`, { geometry: bbox, outFields: parkingFields(n) })).features || [])
  .map((f) => ({ ...f, attributes: { ...f.attributes, KIND: kind } }));
// As server.mjs parkovani(): the special stalls only where the sections found something (or in a zone).
async function parking(bbox, inZone) {
  const sections = await layer(bbox, "3", PARKING_LAYERS[3]);
  const rest = [];
  if (sections.length || inZone) for (const [n, kind] of Object.entries(PARKING_LAYERS)) if (n !== "3") rest.push(...await layer(bbox, n, kind));
  return { features: [...sections, ...rest] };
}

const KINDS = {
  mtvu: (bbox) => ask(MTVU, { geometry: bbox, outFields: MTVU_FIELDS }),
  linie: (bbox) => ask(TM_LINES, { geometry: bbox, where: LINE_WHERE, outFields: "CTMTP_KOD" }),
  parkovani2: (bbox, inZone) => parking(bbox, inZone),
  body: (bbox) => ask(TM_POINTS, { geometry: bbox, where: POINT_WHERE, outFields: "CTMTP_KOD" }),
};
let done = 0, failed = 0;
for (const f of (await fs.readdir(RUN)).filter((x) => /^\d+\.json$/.test(x))) {
  const r = JSON.parse(await fs.readFile(path.join(RUN, f), "utf8"));
  if (!r.bbox) continue;
  for (const [kind, get] of Object.entries(KINDS)) {
    const out = file(kind, r.bbox);
    if (await exists(out)) continue;
    try {
      const json = await get(r.bbox, r.inZps);
      await fs.mkdir(path.dirname(out), { recursive: true });
      await fs.writeFile(out, JSON.stringify(json));
      done++;
    } catch (e) { failed++; console.log(r.sample.n, kind, e.message); }
  }
}
console.log(`uloženo ${done}, chyb ${failed}`);
