// The states of the app for the tools and the deploy (docs/architecture-countries.md, step 5): one line a state. The
// app's own rules of a state are pilot/public/countries/<ISO>.js; here what the deploy needs: the key of its OSM
// pack (the file <key>-<date>.posm, data/osm/<key>.osm.pbf), Geofabrik's extract and whether the pack also goes on
// Pages (it must stay under Pages' 1 GB; Austria only on R2, Bára 16. 11. 2026).
//   node tools/countries.mjs --list osm         → cz sk at
//   node tools/countries.mjs --list geofabrik   → cz:czech-republic sk:slovakia at:austria
//   node tools/countries.mjs --list pages       → cz sk (the packs also on Pages)
//   node tools/countries.mjs --key             → cz-sk-at (for cache keys)
//   node tools/countries.mjs --matrix          → the packs to build ({ include: [{ code, extract }] }, osm-tiles.yml)
//   node tools/countries.mjs --matrix --day 3  → only the packs of the 3rd day of the week (1 Monday … 7 Sunday; DAYS)
//   node tools/countries.mjs --matrix --states at,de_by → only these packs (a state's code: all its parts)
//   node tools/countries.mjs --days            → the packs of each day with their MB (tools/osm-sizes.json)
import fs from "node:fs";
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
  // Spain (Bára 23. 11. 2026): Geofabrik's 17 autonomous communities with Ceuta and Melilla (folders as France's), the
  // Canary Islands under africa/ (osm-tiles.yml: an extract with a continent is taken as it is); only on R2.
  es: { iso: "ES", geofabrik: "spain", pages: false, parts: Object.fromEntries([...[["and", "andalucia"], ["ara", "aragon"], ["ast", "asturias"], ["can", "cantabria"], ["clm", "castilla-la-mancha"], ["cyl", "castilla-y-leon"], ["cat", "cataluna"], ["ceu", "ceuta"], ["ext", "extremadura"], ["gal", "galicia"], ["bal", "islas-baleares"], ["rio", "la-rioja"], ["mad", "madrid"], ["mel", "melilla"], ["mur", "murcia"], ["nav", "navarra"], ["pv", "pais-vasco"], ["val", "valencia"]].map(([p, e]) => [`es_${p}`, `spain/${e}/${e}`]), ["es_ic", "africa/canary-islands/canary-islands"]]) },
  // Portugal (Bára 23. 11. 2026): Geofabrik's one extract with Madeira and the Azores (in a folder, as Belgium's), only on R2.
  pt: { iso: "PT", geofabrik: "portugal/portugal", pages: false },
  // Monaco (Bára 23. 11. 2026): Geofabrik's extract (in a folder, as Belgium's), only on R2.
  mc: { iso: "MC", geofabrik: "monaco/monaco", pages: false },
  // Cyprus (Bára 23. 11. 2026): Geofabrik's extract (in a folder), only on R2.
  cy: { iso: "CY", geofabrik: "cyprus/cyprus", pages: false },
  // Malta (Bára 23. 11. 2026): Geofabrik's extract (in a folder), only on R2.
  mt: { iso: "MT", geofabrik: "malta/malta", pages: false },
  // Italy (Bára 23. 11. 2026): Geofabrik's 5 parts (each under 650 MB of PBF, packs well under R2's 512 MB), only on R2.
  it: { iso: "IT", geofabrik: "italy", pages: false, parts: Object.fromEntries([["c", "centro"], ["i", "isole"], ["ne", "nord-est"], ["no", "nord-ovest"], ["s", "sud"]].map(([p, e]) => [`it_${p}`, `italy/${e}`])) },
  // Estonia (Bára 23. 11. 2026): Geofabrik's one extract (125 MB of PBF), only on R2.
  ee: { iso: "EE", geofabrik: "estonia", pages: false },
  // Slovenia (Bára 23. 11. 2026): Geofabrik's one extract (315 MB of PBF), only on R2.
  si: { iso: "SI", geofabrik: "slovenia", pages: false },
  // Finland (Bára 23. 11. 2026): Geofabrik's one extract with Åland (778 MB of PBF; the local sample packed 5 towns),
  // only on R2.
  fi: { iso: "FI", geofabrik: "finland", pages: false },
  // Denmark (Bára 23. 11. 2026): Geofabrik's one extract with Bornholm (498 MB of PBF, dense with imported buildings and
  // addresses; the local sample of Copenhagen, Aarhus, Odense and Aalborg packed to 17 MB), only on R2.
  dk: { iso: "DK", geofabrik: "denmark", pages: false },
  // Lithuania (Bára 24. 11. 2026): Geofabrik's one extract (224 MB of PBF), only on R2.
  lt: { iso: "LT", geofabrik: "lithuania", pages: false },
  // The USA (Bára 24. 11. 2026, phase 2 of the North America pilot): only its metros, a pack each (the app reads all from
  // index.json). us_dc: Geofabrik's District of Columbia with the parts of Maryland and Virginia in the metro's box
  // (osm-tiles.yml: extracts joined by "+" are each cut to the box after "@" with osmium and merged; locally 86 MB).
  // us_nyc (26. 11. 2026): New York City, Geofabrik's New York (500 MB of PBF, in a folder of its own since Geofabrik moved
  // the states) cut to the box of the five boroughs (locally 44 MB). us_sf (26. 11. 2026): San Francisco, Geofabrik's
  // Northern California (660 MB of PBF) cut to the city's box and 1 km round it (locally 7.6 MB). us_bos (26. 11. 2026):
  // Boston, Geofabrik's Massachusetts (312 MB of PBF) cut to the box of the metro's three counties (tools/build_staty.mjs
  // METROS). Only on R2. A further metro is a further part.
  us: { iso: "US", geofabrik: "north-america/us/district-of-columbia", pages: false, parts: {
    us_dc: "north-america/us/district-of-columbia+north-america/us/maryland+north-america/us/virginia@-77.56,38.52,-76.64,39.37",
    us_nyc: "north-america/us/new-york/new-york@-74.30,40.45,-73.65,40.95",
    us_sf: "north-america/us/california/norcal@-122.54,37.68,-122.34,37.84",
    us_bos: "north-america/us/massachusetts@-71.92,41.97,-70.62,42.76" } },
  // Canada (Bára 25. 11. 2026): only Toronto and the municipalities around it, one pack ca_on_toronto of Geofabrik's Ontario
  // (1 GB of PBF) cut to their box (locally 46 MB), only on R2.
  ca: { iso: "CA", geofabrik: "north-america/canada/ontario", pages: false, parts: { ca_on_toronto: "north-america/canada/ontario@-79.92,43.46,-78.98,44.03" } },
};
// The packs to build (osm-tiles.yml): a state's own, or its parts.
export const PACKS = Object.entries(COUNTRIES).flatMap(([k, c]) => (c.parts ? Object.entries(c.parts).map(([code, extract]) => ({ code, extract })) : [{ code: k, extract: c.geofabrik }]));

// The day of the week each pack is rebuilt on (Bára 26. 11. 2026: each day a seventh of the packs, about as many MB, so
// that R2 holds the whole set and only the few new files of one day at once; osm-tiles.yml runs daily). The largest pack
// first, each to the day with the fewest MB so far (tools/osm-sizes.json; a pack not measured yet weighs DEFAULT_MB), ties
// to the earlier day: the same days on every run until a pack comes or a weight changes. DAYS[0] is Monday.
export const DAY_COUNT = 7, DEFAULT_MB = 50;
export const SIZES = JSON.parse(fs.readFileSync(new URL("./osm-sizes.json", import.meta.url), "utf8")).mb;
export function packDays(packs = PACKS, sizes = SIZES) {
  const days = Array.from({ length: DAY_COUNT }, () => ({ mb: 0, codes: [] }));
  const w = (c) => sizes[c] ?? DEFAULT_MB;
  for (const p of [...packs].sort((a, b) => w(b.code) - w(a.code) || (a.code < b.code ? -1 : 1))) {
    const d = days.reduce((best, x) => (x.mb < best.mb ? x : best), days[0]);
    d.mb += w(p.code);
    d.codes.push(p.code);
  }
  return days;
}
export const DAYS = packDays();
// The packs of a run: those named (a state's code builds all its parts), those of a day (1–7), or all.
export function packsFor({ day, states } = {}) {
  if (states) {
    const want = states.split(",").map((s) => s.trim()).filter(Boolean);
    return PACKS.filter((p) => want.includes(p.code) || want.includes(p.code.split("_")[0]));
  }
  if (day) return PACKS.filter((p) => DAYS[day - 1].codes.includes(p.code));
  return PACKS;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [flag, what] = process.argv.slice(2);
  const keys = Object.keys(COUNTRIES);
  if (flag === "--key") console.log(keys.join("-"));
  else if (flag === "--list" && what === "osm") console.log(keys.join(" "));
  else if (flag === "--list" && what === "geofabrik") console.log(keys.map((k) => `${k}:${COUNTRIES[k].geofabrik}`).join(" "));
  else if (flag === "--list" && what === "pages") console.log(keys.filter((k) => COUNTRIES[k].pages).join(" "));
  else if (flag === "--matrix") {
    const arg = (k) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : undefined; };
    console.log(JSON.stringify({ include: packsFor({ day: Number(arg("--day")) || undefined, states: arg("--states") || undefined }) }));
  } else if (flag === "--days") DAYS.forEach((d, i) => console.log(`${i + 1}: ${d.mb} MB, ${d.codes.length} balíků: ${d.codes.join(" ")}`));
  else { console.error("node tools/countries.mjs --list osm|geofabrik|pages | --key"); process.exit(1); }
}
