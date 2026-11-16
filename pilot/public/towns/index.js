import { cityAt, countryOfCity } from "../city.js";
import { inArea } from "../places.js";

// The towns whose page asks the town's own GIS on a click (all but Prague and Brno): each module gives
// the data sources and base maps (see towns/jihlava.js). The town's texts are in city.js, its site in
// tools/cities.mjs.
import * as cesko from "./cesko.js";
import * as jihlava from "./jihlava.js";
import * as most from "./most.js";
import * as opava from "./opava.js";
import * as pardubice from "./pardubice.js";
import * as plzen from "./plzen.js";
import * as usti from "./usti.js";
import * as ostrava from "./ostrava.js";
import * as frydekMistek from "./frydek-mistek.js";
import * as karvina from "./karvina.js";
import * as trebic from "./trebic.js";
import * as prerov from "./prerov.js";
import * as slovensko from "./slovensko.js";
import * as austria from "./austria.js";
import * as cizina from "./cizina.js";

export const TOWNS = { cesko, jihlava, most, opava, pardubice, plzen, usti, ostrava, "frydek-mistek": frydekMistek, karvina, trebic, prerov,
  // Towns with only their own vehicles: the national data.
  olomouc: cesko, liberec: cesko, hradec: cesko, budejovice: cesko, zlin: cesko,
  // Slovakia and Austria: their national and towns' sources; elsewhere OSM only.
  slovensko, austria, cizina };

// Where a point lies (docs/architecture-countries.md): its state (ISO code), its city (mesta.json, else the rest of the
// state), the illustrations of its town where the state draws its towns' own (countries/<ISO>.js artAt), and the
// sources with a territory of their own that have it (each module's AREAS).
const AREAS = Object.entries({ slovensko, austria }).flatMap(([town, m]) => Object.entries(m.AREAS || {}).map(([id, area]) => ({ town, id, area })));
export function placeAt(lat, lon) {
  const id = cityAt(lat, lon), country = countryOfCity(id);
  return { country: country.code, city: id, art: country.artAt?.(lat, lon) ?? null,
    sources: AREAS.filter((a) => a.town === id && inArea(a.area, lon, lat)).map((a) => a.id) };
}
