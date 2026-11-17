// The states of the app for the tools and the deploy (docs/architecture-countries.md, step 5): one line a state. The
// app's own rules of a state are pilot/public/countries/<ISO>.js; here what the deploy needs: the key of its OSM
// pack (the file <key>-<date>.posm, data/osm/<key>.osm.pbf), Geofabrik's extract and whether the pack also goes on
// Pages (it must stay under Pages' 1 GB; Austria only on R2, Bára 16. 11. 2026).
//   node tools/countries.mjs --list osm         → cz sk at
//   node tools/countries.mjs --list geofabrik   → cz:czech-republic sk:slovakia at:austria
//   node tools/countries.mjs --list pages       → cz sk (the packs also on Pages)
//   node tools/countries.mjs --key             → cz-sk-at (for cache keys)
//   node tools/countries.mjs --matrix          → the packs to build ({ include: [{ code, extract }] }, osm-tiles.yml)
import { pathToFileURL } from "node:url";

export const COUNTRIES = {
  cz: { iso: "CZ", geofabrik: "czech-republic", pages: true },
  sk: { iso: "SK", geofabrik: "slovakia", pages: true },
  at: { iso: "AT", geofabrik: "austria", pages: false },
  // Germany by its 16 Länder (Bára 17. 11. 2026; the hostile review): each Land a file of its own under Cloudflare's
  // 512 MB cache limit and a job of its own in osm-tiles.yml, the pack key de_<Land> (the app reads all from index.json).
  de: { iso: "DE", geofabrik: "germany", pages: false, parts: Object.fromEntries([["bw", "baden-wuerttemberg"], ["by", "bayern"], ["be", "berlin"],
    ["bb", "brandenburg"], ["hb", "bremen"], ["hh", "hamburg"], ["he", "hessen"], ["mv", "mecklenburg-vorpommern"], ["ni", "niedersachsen"],
    ["nw", "nordrhein-westfalen"], ["rp", "rheinland-pfalz"], ["sl", "saarland"], ["sn", "sachsen"], ["st", "sachsen-anhalt"],
    ["sh", "schleswig-holstein"], ["th", "thueringen"]].map(([l, e]) => [`de_${l}`, `germany/${e}`])) },
  // Switzerland and Liechtenstein (Bára 17. 11. 2026): Geofabrik's extract of Switzerland (550 MB of PBF, about the
  // Czech size) has not Liechtenstein, which has its own (4 MB). Both under Pages' limit with the others? No: as Austria
  // and Germany only on R2.
  ch: { iso: "CH", geofabrik: "switzerland", pages: false },
  li: { iso: "LI", geofabrik: "liechtenstein", pages: false },
};
// The packs to build (osm-tiles.yml): a state's own, or its parts.
export const PACKS = Object.entries(COUNTRIES).flatMap(([k, c]) => (c.parts ? Object.entries(c.parts).map(([code, extract]) => ({ code, extract })) : [{ code: k, extract: c.geofabrik }]));

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [flag, what] = process.argv.slice(2);
  const keys = Object.keys(COUNTRIES);
  if (flag === "--key") console.log(keys.join("-"));
  else if (flag === "--list" && what === "osm") console.log(keys.join(" "));
  else if (flag === "--list" && what === "geofabrik") console.log(keys.map((k) => `${k}:${COUNTRIES[k].geofabrik}`).join(" "));
  else if (flag === "--list" && what === "pages") console.log(keys.filter((k) => COUNTRIES[k].pages).join(" "));
  else if (flag === "--matrix") console.log(JSON.stringify({ include: PACKS }));
  else { console.error("node tools/countries.mjs --list osm|geofabrik|pages | --key"); process.exit(1); }
}
