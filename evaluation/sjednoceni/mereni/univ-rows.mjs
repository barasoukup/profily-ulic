// The official rows (evaluation/universal/data/app-zzzzzzz-mereni.json, git ignores it) from the N arm, for score-states.mjs.
import fs from "node:fs";
const R = JSON.parse(fs.readFileSync(new URL("vysledky/oficialni.json", import.meta.url))), T = JSON.parse(fs.readFileSync(new URL("vysledky/znacky.json", import.meta.url)));
const out = R.filter((r) => r.N?.segments?.length).map((r) => ({ id: r.id, country: r.country, town: r.place, lat: r.N.lat, lon: r.N.lon, bearing: r.N.bearing, wayId: r.N.wayId, name: r.N.name || "", span: r.N.span, sources: r.N.sources, note: r.N.note,
  parts: r.N.segments.map(([t, w]) => [t, w]), highway: T[r.id]?.highway, ...(T[r.id]?.service ? { service: T[r.id].service } : {}) }));
fs.writeFileSync(new URL("../../universal/data/app-zzzzzzz-mereni.json", import.meta.url), JSON.stringify(out));
console.log(out.length);
