// The towns whose page asks the town's own GIS on a click (all but Prague and Brno): each module gives
// the data sources and base maps (see towns/jihlava.js). The town's texts are in city.js, its site in
// tools/cities.mjs.
import * as jihlava from "./jihlava.js";
import * as most from "./most.js";
import * as opava from "./opava.js";
import * as pardubice from "./pardubice.js";
import * as plzen from "./plzen.js";

export const TOWNS = { jihlava, most, opava, pardubice, plzen };
