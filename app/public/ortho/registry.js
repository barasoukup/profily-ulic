// The registry of orthophotos (docs/code-health-plan.md step 15): every source is one record of one shape, kept in
// ortho/sources/<state>.js, and the code that asks an orthophoto (image.js), says whether there is one (orthoHereAt), credits it
// (credit.js) and draws it on the map (app/ortho-layers.js) goes through the records, never through a condition on a source or a state.
//
// A record:
//   id        the key a cut keeps (state.cut.sources.orthoCity) and a state's or a city's `laneOrtho` names (countries/<ISO>.js,
//             city.js); `chain` the id of the chain it belongs to (the key `laneOrtho` names when several sources serve a state)
//   service   how it is asked (ortho/service.js): wms, ags (ArcGIS export) or xyz (tiles); res the metres of a pixel it is read at
//   area      where it has a photo: { box: [lon0, lat0, lon1, lat1], town (its boundary in towns-us.json), near (m beyond it),
//             outside (a function: the part of the box it does not cover), except (boxes inside the box without one) }; without
//             it the whole territory of its state (a blank image is found out when it comes)
//   credit    the key of its credit in credit-text.js (CR); `creditWho` the holder's own words after "orthophoto"; `mapCredit` the
//             credit of its layer on the map where the text differs
//   lanes     false: not asked for the lanes (only a layer of the map); map  the layer of the map (null: none), see app/ortho-layers.js
//   named oddities: shift (where the image shows a point, m east and north: Brno), balance (a tinted mosaic: ZBGIS), fine (false:
//             ČÚZK's coarser photo), blank (an image white or black beyond its coverage is no image), fallback (the source tried
//             when a tile of this one is missing: basemap.at level 19), key (a function: the key it needs, Denmark's token),
//             hangs (its server hangs now and then: si-retry.js), land / regions (the Land or the regions of Belgium a source
//             serves), rank (the order a chain tries the sources of a box: Helsinki before Espoo)
// A chain (`export const chain` of the state's file) says how a cut finds its sources: pick "area" (the boxes holding the cut), "lands"
// (the Land of the cut and its neighbours, laender.json), "regions" (Belgium's regions, then `fallback`); `share`: the sources
// share one timeout; `map` a layer of the map for all its sources.
import { inArea } from "../places.js";
import * as cz from "./sources/cz.js";
import * as sk from "./sources/sk.js";
import * as at from "./sources/at.js";
import * as ch from "./sources/ch.js";
import * as nl from "./sources/nl.js";
import * as lu from "./sources/lu.js";
import * as be from "./sources/be.js";
import * as pl from "./sources/pl.js";
import * as fr from "./sources/fr.js";
import * as cy from "./sources/cy.js";
import * as it from "./sources/it.js";
import * as ee from "./sources/ee.js";
import * as si from "./sources/si.js";
import * as fi from "./sources/fi.js";
import * as dk from "./sources/dk.js";
import * as mt from "./sources/mt.js";
import * as mc from "./sources/mc.js";
import * as es from "./sources/es.js";
import * as pt from "./sources/pt.js";
import * as de from "./sources/de.js";
import * as us from "./sources/us.js";
import * as ca from "./sources/ca.js";
import { landsAt, beRegionsAt } from "./regions.js";

// The files in the order of the map's layers (the one drawn first is the lowest).
const FILES = [cz, sk, at, ch, nl, lu, be, pl, fr, cy, it, ee, si, fi, dk, mt, mc, es, pt, de, us, ca];
const ORTHO = FILES.flatMap((f) => f.sources);
// The sources a cut may ask the lanes of, by id.
export const SOURCES = Object.fromEntries(ORTHO.filter((s) => s.lanes !== false).map((s) => [s.id, s]));
export const CHAINS = Object.fromEntries(FILES.filter((f) => f.chain).map((f) => [f.chain.id, { ...f.chain, members: [...f.sources].sort((a, b) => (a.rank ?? 0) - (b.rank ?? 0)) }]));
// The layers of the map, each with what it is made of: { id, map, credit, service } of its source or of its chain.
export const MAP_LAYERS = FILES.flatMap((f) => [...f.sources.filter((s) => s.map), ...(f.chain?.map ? [{ ...f.chain, members: f.sources }] : [])]);

const inBox = ([x0, y0, x1, y1], lon, lat) => lon >= x0 && lon <= x1 && lat >= y0 && lat <= y1;
// Does the source have a photo at the point by its area.
const inAreaOf = (s, lon, lat) => {
  const a = s.area;
  return !a || ((!a.box || inArea(a, lon, lat)) && !a.outside?.(lon, lat) && !a.except?.some((b) => inBox(b, lon, lat)));
};

// A source asked on its own (not through its chain) has a photo where its area is; one of a chain is the chain's to place.
export const usableAt = (s, lon, lat) => !!s.chain || inAreaOf(s, lon, lat);
const PICKS = {
  area: async (chain, lon, lat) => chain.members.filter((m) => inAreaOf(m, lon, lat)),
  // The Land the point is in first, then those within about 2 km.
  lands: async (chain, lon, lat) => (await landsAt(lon, lat).catch(() => [])).map((land) => chain.members.find((m) => m.land === land)).filter(Boolean),
  // The region of the point first, then the regions' sources in the chain's order (a blank image at a language border is no photo).
  regions: async (chain, lon, lat) => {
    const regions = await beRegionsAt(lon, lat).catch(() => []);
    return [...regions.flatMap((r) => chain.members.filter((m) => m.regions.includes(r))), ...chain.fallback.map((id) => SOURCES[id])];
  },
};
// The sources to ask at a point, in the order to ask them (a service shared by two of them once): a chain's by its pick, a source's
// own where it has a photo, none for an id the registry does not know.
export async function sourcesAt(id, lon, lat) {
  const chain = CHAINS[id], found = chain ? await PICKS[chain.pick](chain, lon, lat) : SOURCES[id] && usableAt(SOURCES[id], lon, lat) ? [SOURCES[id]] : [];
  const seen = new Set();
  return found.filter((s) => !seen.has(s.service.base) && seen.add(s.service.base));
}
// The ids of a chain's sources whose area holds the point (the chains by area: Italy, Finland, the USA, Canada), at once.
export const idsAt = (chainId, lon, lat) => CHAINS[chainId].members.filter((m) => inAreaOf(m, lon, lat)).map((m) => m.id);
// Is there an orthophoto of the source (countries/<ISO>.js laneOrtho) at the point? "none" never; a chain where one of its sources
// has a photo (the Länder and regions have none to ask first: a blank photo is found out when it comes); the others everywhere they
// have an area. The question is the place's, not the state's (the review of 24. 11. 2026: in Lombardy the kerb model was loaded and
// the note said "orthophoto" where there is none).
export function orthoHereAt(id, lon, lat) {
  if (!id || id === "none") return false;
  const chain = CHAINS[id], s = SOURCES[id];
  return chain ? chain.members.some((m) => inAreaOf(m, lon, lat)) : !!s && usableAt(s, lon, lat);
}
