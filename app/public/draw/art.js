// The illustrations: Streetmix's and each city's own sets, loaded as data URIs, and the switch that turns them off.
import { city, CITY_IDS, cityById, creditLines } from "../city.js";
import { COUNTRIES } from "../countries/index.js";
import { GENERIC_VEHICLES } from "../art.js";
import { el } from "./svg.js";

const SPRITE_FILES = [
  "car-inbound", "car-outbound", "streetcar-inbound", "streetcar-outbound", "bus-inbound", "bus-outbound",
  "biker-01-inbound", "biker-01-outbound", "people-01", "people-05", "people-12", "people-20", "people-27",
  "tree", "bush",
  "car-sideways-left", "car-sideways-right", "car-angled-front-left", "car-angled-front-right",
  "bench-center", "cafe-seating-occupied", "bike-rack-perpendicular-left", "bikeshare-left",
  "transit-shelter-01-left", "transit-shelter-01-right", "bollard", "planter-box", "guardrail",
  "lamp-modern-left", "lamp-modern-right",
];

// Prague illustrations (praha/) standing in for Streetmix ones; the rest stays Streetmix.
const PRAHA = {
  "streetcar-inbound": "t3-inbound", "streetcar-outbound": "t3-outbound", "bus-inbound": "bus-inbound", "bus-outbound": "bus-outbound",
  "lamp-modern-left": "lamp-left", "lamp-modern-right": "lamp-right", "bench-center": "bench-center",
  "bike-rack-perpendicular-left": "bike-rack", "bollard": "bollard",
  "transit-shelter-01-left": "transit-shelter-left", "transit-shelter-01-right": "transit-shelter-right",
  "transit-shelter-tram-left": "transit-shelter-tram-left", "transit-shelter-tram-right": "transit-shelter-tram-right",
  "tram-pole-left": "tram-pole-left", "tram-pole-right": "tram-pole-right",
  "tram-pole-lamp-left": "tram-pole-lamp-left", "tram-pole-lamp-right": "tram-pole-lamp-right",
  "stop-post-left": "stop-post-left", "stop-post-right": "stop-post-right",
  "stop-post-tram-left": "stop-post-tram-left", "stop-post-tram-right": "stop-post-tram-right",
  // Rainwater management (Bára 12. 11. 2026): a shelter with a green roof, the planting of a swale, reeds of a pond.
  "transit-shelter-green-left": "transit-shelter-green-left", "transit-shelter-green-right": "transit-shelter-green-right",
  "swale-plants": "swale-plants", "reeds-left": "reeds-left", "reeds-right": "reeds-right",
};
// Brno illustrations (brno/): the tram Tatra T3 in DPMB colours (Bára: the nicest; 45T and 13T drawn too) and bus, and furniture after the
// rules of Brno's city architect (KAM, Principy tvorby veřejných prostranství, kap. 9): anthracite steel,
// wooden slats, a slim glass stop shelter, a stainless bike rack. Houses are drawn as in Prague.
const BRNO = {
  "streetcar-inbound": "t3-inbound", "streetcar-outbound": "t3-outbound", "bus-inbound": "bus-inbound", "bus-outbound": "bus-outbound",
  "lamp-modern-left": "lamp-left", "lamp-modern-right": "lamp-right", "bench-center": "bench-center",
  "bike-rack-perpendicular-left": "bike-rack", "bollard": "bollard",
  "transit-shelter-01-left": "transit-shelter-left", "transit-shelter-01-right": "transit-shelter-right",
  "transit-shelter-tram-left": "transit-shelter-tram-left", "transit-shelter-tram-right": "transit-shelter-tram-right",
  "tram-pole-left": "tram-pole-left", "tram-pole-right": "tram-pole-right",
  "tram-pole-lamp-left": "tram-pole-lamp-left", "tram-pole-lamp-right": "tram-pole-lamp-right",
  "stop-post-left": "stop-post-left", "stop-post-right": "stop-post-right",
  "stop-post-tram-left": "stop-post-tram-left", "stop-post-tram-right": "stop-post-tram-right",
  // Rainwater management (Bára 12. 11. 2026): a shelter with a green roof, the planting of a swale, reeds of a pond.
  "transit-shelter-green-left": "transit-shelter-green-left", "transit-shelter-green-right": "transit-shelter-green-right",
  "swale-plants": "swale-plants", "reeds-left": "reeds-left", "reeds-right": "reeds-right",
};
// Every other city brings its own map of illustrations (city.js artMap, files in app/public/<art>/).
export const CITY_ART = { praha: PRAHA, brno: BRNO };
for (const id of CITY_IDS) { const c = cityById(id); if (c.artMap) CITY_ART[c.art] = c.artMap; }
// The states' sets of their cities (countries/<ISO>.js art: the Slovak and Austrian cities' vehicles, city.js art).
for (const c of Object.values(COUNTRIES)) Object.assign(CITY_ART, c.art);
// A set without a tram or a bus of its own draws the neutral ones (art.js GENERIC_VEHICLES).
for (const [k, v] of Object.entries(CITY_ART)) CITY_ART[k] = { ...GENERIC_VEHICLES, ...v };
// The sets and the houses of another continent, loaded when a cut is there (late.js, america.js).
export const addArt = (...sets) => { for (const s of sets) for (const [k, v] of Object.entries(s)) CITY_ART[k] = { ...GENERIC_VEHICLES, ...v }; };

// The illustrations of the current cut's city, or Streetmix's (the switch "Ilustrace" off).
let artOn = true;
export const artKey = () => (artOn ? city.art : "streetmix");
export const cityArt = () => artOn && !!CITY_ART[city.art]; // the city's own set
// The set of illustrations of an art folder (tests).
export const artSet = (art) => CITY_ART[art];
// The credit lines of an export or a saved file for the current city and art (src: the cut's sources, app.js).
export const exportCredits = (src) => creditLines(city, src || {}, cityArt());

export const sprites = {};
export const setArt = (on) => { artOn = on; };

export const getArt = () => artOn;

// A missing or broken illustration is left out of the drawing instead of stopping the app.
async function loadSprite(key, path) {
  try {
    const r = await fetch(path);
    if (!r.ok) throw new Error(`${r.status}`);
    const text = await r.text();
    const vb = text.match(/viewBox="([^"]+)"/)?.[1].split(/\s+/).map(Number);
    if (!vb) throw new Error("bez viewBox");
    const uri = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(text);
    // data-roof: where a tram's roof lies in its picture (tramSprite), for a picture not 420 high.
    const roof = Number(text.match(/data-roof="([\d.]+)"/)?.[1]) || null;
    // data-light: the height (cm) of the light of a post-top lamp's picture (postTopLamp).
    const light = Number(text.match(/data-light="([\d.]+)"/)?.[1]) || null;
    sprites[key] = { uri, w: vb[2], h: vb[3], roof, light };
  } catch (err) {
    console.warn("ilustrace chybí", path, err.message);
  }
}

// Streetmix's sprites once, a city's own set when a cut first lands in it.
const loadedArt = new Set();
export async function loadSprites() {
  const sets = [];
  if (!loadedArt.has("streetmix")) { loadedArt.add("streetmix"); sets.push(...SPRITE_FILES.map((name) => loadSprite(name, `streetmix/${name}.svg`))); }
  const a = city.art;
  if (CITY_ART[a] && !loadedArt.has(a)) { loadedArt.add(a); sets.push(...[...new Set(Object.values(CITY_ART[a]))].map((file) => loadSprite(`${a}/${file}`, `${a}/${file}.svg`))); }
  await Promise.all(sets);
}

// The current city's own sprite of a name, or undefined (poles and stop posts have no Streetmix stand-in).
export const ownSprite = (name) => cityArt() && sprites[`${artKey()}/${CITY_ART[artKey()]?.[name]}`];
export function sprite(g, name, cx, bottom, flip = false, anchor = null) {
  const s = (cityArt() && sprites[`${artKey()}/${CITY_ART[artKey()]?.[name]}`]) || sprites[name];
  if (!s) return;
  const img = el("image", { href: s.uri, width: s.w, height: s.h, x: cx - (anchor ?? s.w / 2), y: bottom - s.h }, g);
  if (flip) img.setAttribute("transform", `translate(${2 * cx} 0) scale(-1 1)`);
}
