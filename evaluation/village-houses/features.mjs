// The panel features of labelled houses (the rows of a sample), from OSM: node features.mjs out.json rows.json… ; each row gets feat.
import fs from "node:fs";
import { D, C, elements, infoOf, setPlace } from "./lib.mjs";
const [out, ...files] = process.argv.slice(2), res = [];
for (const f of files) for (const r of JSON.parse(fs.readFileSync(f)).rows || []) {
  const [lon, lat] = r.after?.info?.point || r.before?.info?.point || r.point;
  const iso = await setPlace(lat, lon); const els = await elements(iso, lat, lon, 260), fr = D.localFrame(lat, lon);
  const o = infoOf(els, fr, [0, 0], [lon, lat]);
  res.push({ id: r.id, iso, city: C.city.id, panels: C.city.panels, found: o.found, info: o.info, look: r.before?.look + ">" + r.after?.look });
}
fs.writeFileSync(out, JSON.stringify(res, null, 1));
console.log(res.length);
