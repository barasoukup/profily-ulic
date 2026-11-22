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
  // The Netherlands (20. 11. 2026): Geofabrik's whole extract is 1.4 GB of PBF, so by its 12 provinces as Germany by its
  // Länder (each pack under 512 MB), only on R2. Geofabrik keeps them in a folder each: europe/netherlands/<province>/<province>-latest (its redirect without the folder leads to a 404).
  nl: { iso: "NL", geofabrik: "netherlands", pages: false, parts: Object.fromEntries([["dr", "drenthe"], ["fl", "flevoland"], ["fr", "friesland"],
    ["ge", "gelderland"], ["gr", "groningen"], ["li", "limburg"], ["nb", "noord-brabant"], ["nh", "noord-holland"], ["ov", "overijssel"],
    ["ut", "utrecht"], ["ze", "zeeland"], ["zh", "zuid-holland"]].map(([p, e]) => [`nl_${p}`, `netherlands/${e}/${e}`])) },
  // Belgium and Luxembourg (Bára 20. 11. 2026): Geofabrik keeps them in a folder each as well; Belgium's extract is
  // 0.7 GB (one pack, as Austria), only on R2.
  be: { iso: "BE", geofabrik: "belgium/belgium", pages: false },
  lu: { iso: "LU", geofabrik: "luxembourg/luxembourg", pages: false },
  // Poland (Bára 21. 11. 2026): 2.1 GB, by its 16 voivodeships as Germany by its Länder (each pack under 512 MB), in
  // Geofabrik's folders europe/poland/<voivodeship>/ as the Netherlands' provinces; only on R2.
  pl: { iso: "PL", geofabrik: "poland", pages: false, parts: Object.fromEntries([["ds", "dolnoslaskie"], ["kp", "kujawsko-pomorskie"], ["ld", "lodzkie"],
    ["lu", "lubelskie"], ["lb", "lubuskie"], ["ma", "malopolskie"], ["mz", "mazowieckie"], ["op", "opolskie"], ["pk", "podkarpackie"], ["pd", "podlaskie"],
    ["pm", "pomorskie"], ["sl", "slaskie"], ["sk", "swietokrzyskie"], ["wn", "warminsko-mazurskie"], ["wp", "wielkopolskie"], ["zp", "zachodniopomorskie"]]
    .map(([p, e]) => [`pl_${p}`, `poland/${e}/${e}`])) },
  // France (Bára 22. 11. 2026): metropolitan, by Geofabrik's 22 old regions (each in a folder, as Poland's), only on R2.
  fr: { iso: "FR", geofabrik: "france", pages: false, parts: Object.fromEntries([["als", "alsace"], ["aqu", "aquitaine"], ["auv", "auvergne"], ["bno", "basse-normandie"], ["bou", "bourgogne"], ["bre", "bretagne"], ["cen", "centre"], ["cha", "champagne-ardenne"], ["cor", "corse"], ["frc", "franche-comte"], ["hno", "haute-normandie"], ["idf", "ile-de-france"], ["lar", "languedoc-roussillon"], ["lim", "limousin"], ["lor", "lorraine"], ["mip", "midi-pyrenees"], ["npc", "nord-pas-de-calais"], ["pdl", "pays-de-la-loire"], ["pic", "picardie"], ["poc", "poitou-charentes"], ["paca", "provence-alpes-cote-d-azur"], ["rha", "rhone-alpes"]].map(([p, e]) => [`fr_${p}`, `france/${e}/${e}`])) },
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
