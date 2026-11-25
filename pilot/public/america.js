// North America's part of the app, loaded by late.js: the states US and CA, their sources, the houses' looks and drawing
// put into the registries the rest of the app reads (countries/index.js, towns/index.js, profile.js). Importing it is
// enough for a script in Node; the borders come by takeAmerica (or city.js addStates, loadTowns).
import US from "./countries/US.js";
import CA from "./countries/CA.js";
import * as usa from "./towns/usa.js";
import * as canada from "./towns/canada.js";
import { drawAmerican } from "./houses-america.js";
import { addCountries } from "./countries/index.js";
import { addTowns } from "./towns/index.js";
import { addArt, setAmericanDrawing } from "./profile.js";
import { addStates, loadTowns } from "./city.js";

addCountries({ US, CA });
addTowns({ usa, canada });
addArt(US.art, CA.art);
setAmericanDrawing(drawAmerican);
export function takeAmerica(states, ...towns) {
  addStates(states);
  for (const t of towns) loadTowns(t);
}
