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

export const TOWNS = { cesko, jihlava, most, opava, pardubice, plzen, usti, ostrava, "frydek-mistek": frydekMistek, karvina, trebic, prerov,
  // Towns with only their own vehicles: the national data.
  olomouc: cesko, liberec: cesko, hradec: cesko, budejovice: cesko, zlin: cesko };
