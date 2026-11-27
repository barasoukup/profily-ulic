import { cityAt, countryOfCity, cityById, CITY_IDS } from "../city.js";
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
import * as germany from "./germany.js";
import * as switzerland from "./switzerland.js";
import * as netherlands from "./netherlands.js";
import * as belgium from "./belgium.js";
import * as luxembourg from "./luxembourg.js";
import * as poland from "./poland.js";
import * as france from "./france.js";
import * as spain from "./spain.js";
import * as portugal from "./portugal.js";
import * as monaco from "./monaco.js";
import * as cyprus from "./cyprus.js";
import * as malta from "./malta.js";
import * as italy from "./italy.js";
import * as estonia from "./estonia.js";
import * as slovenia from "./slovenia.js";
import * as finland from "./finland.js";
import * as denmark from "./denmark.js";
import * as lithuania from "./lithuania.js";
import * as cizina from "./cizina.js";

export const TOWNS = { cesko, jihlava, most, opava, pardubice, plzen, usti, ostrava, "frydek-mistek": frydekMistek, karvina, trebic, prerov,
  // Towns with only their own vehicles: the national data.
  olomouc: cesko, liberec: cesko, hradec: cesko, budejovice: cesko, zlin: cesko,
  // Slovakia, Austria, Germany, Switzerland, Liechtenstein, the Netherlands, Belgium and Luxembourg: their national and towns' sources; elsewhere OSM only.
  slovensko, austria, germany, switzerland, liechtenstein: switzerland, netherlands, belgium, luxembourg, poland, france, spain, portugal, monaco, cyprus, malta, italy, estonia, slovenia, finland, denmark, lithuania, cizina };

// Where a point lies (docs/architecture-countries.md): its state (ISO code), its city (mesta.json, else the rest of the
// state), its illustrations (city.js art: its own set or its state's), and the
// sources with a territory of their own that have it (each module's AREAS).
// The other cities of a state take their state's sources (Bratislava, Vienna…: towns/slovensko.js, towns/austria.js).
// (Every module's AREAS; the switches of the sources, ?pasport=0, ?tm=1…, are not considered: where a source could answer.)
let AREAS = [];
const complete = () => {
  for (const id of CITY_IDS) if (!TOWNS[id] && TOWNS[cityById(id).like] && cityById(id).like !== "cesko") TOWNS[id] = TOWNS[cityById(id).like];
  AREAS = [...new Set(Object.values(TOWNS))].flatMap((m) => Object.entries(m.AREAS || {}).map(([id, area]) => ({ m, id, area })));
};
complete();
// The modules of another continent, loaded when a cut is there (late.js, america.js).
export const addTowns = (more) => { Object.assign(TOWNS, more); complete(); };
export function placeAt(lat, lon) {
  const id = cityAt(lat, lon);
  return { country: countryOfCity(id).code, city: id, art: cityById(id).art,
    sources: AREAS.filter((a) => TOWNS[id] === a.m && inArea(a.area, lon, lat)).map((a) => a.id) };
}
