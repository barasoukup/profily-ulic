// The live samples of the check of ?axisroad=1 (REPORT.md): the points of the universal measurement of every state
// (evaluation/universal/sample.json), Tallinn's A/B (evaluation/estonia/ab) and North America's samples not in the earlier
// check of 290 cuts (evaluation/usa/sf/fixes), in groups recorded side by side: ax-<group>.json, numeric ids for the harness.
//   node evaluation/axisroad-check/build-sample.mjs
import fs from "node:fs";
import path from "node:path";

const HERE = path.dirname(new URL(import.meta.url).pathname), EV = path.join(HERE, "..");
const read = (f) => JSON.parse(fs.readFileSync(path.join(EV, f), "utf8"));
const uni = read("universal/sample.json");
const pts = (rows, country, src) => rows.map((p) => ({ country: p.country || country, town: p.town || p.place || "", lat: p.lat, lon: p.lon, src: `${src}:${p.id}` }));
const groups = {
  cee: uni.filter((p) => ["CZ", "SK", "AT", "DE"].includes(p.country)),
  west: uni.filter((p) => ["NL", "BE", "LU", "FR"].includes(p.country)),
  south: uni.filter((p) => ["PL", "ES", "PT", "IT", "MC", "MT", "CY", "SI"].includes(p.country)),
  alps: uni.filter((p) => ["CH", "LI"].includes(p.country)),
  north: [...uni.filter((p) => ["FI", "DK", "LT"].includes(p.country)), ...pts(read("estonia/ab/sample.json"), "EE", "estonia/ab"), ...pts(read("estonia/ab/sample2.json"), "EE", "estonia/ab2")],
  na: [...pts(read("usa/boston/outer/sample.json"), "US", "usa/boston/outer"), ...pts(read("canada/dev.json"), "CA", "canada/dev"), ...pts(read("canada/tracks.json"), "CA", "canada/tracks"),
    ...pts(read("usa/ab/sample.json"), "US", "usa/ab"), ...pts(read("usa/nyc/sample-u.json"), "US", "usa/nyc/u")],
  // The A/B samples of the states' surface maps (evaluation/<state>/ab*): the rule changed is one of the maps' roadways.
  ab1: [["belgium/ab-wbn", "BE"], ["belgium/ab", "BE"], ["netherlands/ab", "NL"], ["france/ab", "FR"], ["denmark/ab", "DK"], ["austria/ab", "AT"]].flatMap(([d, c]) => pts(read(`${d}/sample.json`), c, d)),
  ab2: [["finland/ab", "FI"], ["finland/ab2", "FI"], ["finland/ab3", "FI"], ["italy/ab", "IT"], ["lithuania/ab", "LT"], ["poland/ab", "PL"], ["slovenia/ab", "SI"], ["spain/ab", "ES"], ["germany/ab", "DE"]].flatMap(([d, c]) => pts(read(`${d}/sample.json`), c, d)),
  ab3: pts(read("switzerland/ab/sample.json"), "CH", "switzerland/ab"), // with &pause=7000 (geodienste.ch)
};
for (const [g, rows] of Object.entries(groups)) {
  const out = rows.map((p, i) => ({ id: i + 1, country: p.country, town: p.town, lat: p.lat, lon: p.lon, src: p.src || `universal:${p.id}` }));
  fs.writeFileSync(path.join(HERE, `ax-${g}.json`), "[" + out.map((p) => JSON.stringify(p)).join(",\n") + "]\n");
  console.log(g, out.length);
}
