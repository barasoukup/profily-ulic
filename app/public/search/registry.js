// The registry of searches (plan step 16, Bára 28. 11. 2026): every service is one module { id, looksLike(query, ctx),
// find(query, ctx) } (run.js says what else it may carry). The order here is the order of asking. Which of them ask is
// decided by the state of the map (countries/<ISO>.js `search` lists the ids of its own services: "zbgis", "pdok",
// "photon-de" …), by the place (Vienna, Czechia) and, for the guesses, by the letters of the query; a new state adds its id
// to its module and a module here, nothing in search.js.
import { ruianService } from "./ruian.js";
import { zbgisService } from "./zbgis.js";
import { wienService } from "./wien.js";
import { pdokService } from "./pdok.js";
import { photonService } from "./photon.js";
import { uugService, uugPhotonService } from "./uug.js";
import { geopfService } from "./geopf.js";
import { cartociudadService } from "./cartociudad.js";
import { inadsService } from "./inads.js";
import { gursService, gursPhotonService } from "./gurs.js";
import { ryhtiService, ryhtiPhotonService } from "./ryhti.js";
import { gsearchService, gsearchPhotonService } from "./gsearch.js";

export const SERVICES = [
  ruianService, zbgisService, // together: Czechia and Slovakia are asked at once
  wienService, pdokService, photonService, uugService, uugPhotonService, geopfService, cartociudadService, inadsService,
  gursService, gursPhotonService, ryhtiService, ryhtiPhotonService, gsearchService, gsearchPhotonService,
];

// The service that knows where an item is; an item nobody claims is RÚIAN's.
export const serviceOf = (item) => SERVICES.find((s) => s.owns?.(item)) || ruianService;
