// The states of the app for the tools and the deploy (docs/architecture-countries.md, step 5): one line a state. The
// app's own rules of a state are pilot/public/countries/<ISO>.js; here what the deploy needs: the key of its OSM
// pack (the file <key>-<date>.posm, data/osm/<key>.osm.pbf), Geofabrik's extract and whether the pack also goes on
// Pages (it must stay under Pages' 1 GB; Austria only on R2, Bára 16. 11. 2026).
//   node tools/countries.mjs --list osm         → cz sk at
//   node tools/countries.mjs --list geofabrik   → cz:czech-republic sk:slovakia at:austria
//   node tools/countries.mjs --list pages       → cz sk (the packs also on Pages)
//   node tools/countries.mjs --key             → cz-sk-at (for cache keys)
export const COUNTRIES = {
  cz: { iso: "CZ", geofabrik: "czech-republic", pages: true },
  sk: { iso: "SK", geofabrik: "slovakia", pages: true },
  at: { iso: "AT", geofabrik: "austria", pages: false },
};

if (import.meta.url === `file://${process.argv[1]}`) {
  const [flag, what] = process.argv.slice(2);
  const keys = Object.keys(COUNTRIES);
  if (flag === "--key") console.log(keys.join("-"));
  else if (flag === "--list" && what === "osm") console.log(keys.join(" "));
  else if (flag === "--list" && what === "geofabrik") console.log(keys.map((k) => `${k}:${COUNTRIES[k].geofabrik}`).join(" "));
  else if (flag === "--list" && what === "pages") console.log(keys.filter((k) => COUNTRIES[k].pages).join(" "));
  else { console.error("node tools/countries.mjs --list osm|geofabrik|pages | --key"); process.exit(1); }
}
