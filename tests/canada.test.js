// Canada (Bára 25. 11. 2026): Toronto and its surroundings, the city's topographic mapping through the shared adapter
// (countries/CA.js, towns/canada.js, towns/planimetrics.js). No network.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
const read = (f) => JSON.parse(fs.readFileSync(new URL(`../pilot/public/${f}`, import.meta.url), "utf8"));

test("Kanada: Toronto a okolí, zbytek Kanady s hláškou, hranice s USA u Windsoru a Niagary", async () => {
  const C = await import("../pilot/public/city.js");
  const staty = read("staty.json");
  C.loadBounds(read("mesta.json")); C.loadStates(staty); C.loadTowns(read("mesta-us.json")); C.loadTowns(read("mesta-ca.json"));
  assert.ok(JSON.stringify(staty.canada).length < 10_000);
  assert.ok(JSON.stringify(staty.closed_ca).length < 150_000);
  // Downtown, the islands; Mississauga, Markham, Pickering, north of Steeles Avenue.
  for (const p of [[43.6535, -79.3839], [43.623, -79.38]]) assert.equal(C.cityAt(...p), "toronto");
  for (const p of [[43.589, -79.644], [43.8668, -79.2663], [43.84, -79.09], [43.7935, -79.45]]) assert.equal(C.cityAt(...p), "canada");
  assert.equal(C.countryOfCity("toronto").code, "CA");
  // Windsor, Niagara-on-the-Lake's Queenston, Niagara Falls ON, Fort Erie, Sarnia, Hamilton, Montreal, Vancouver.
  for (const p of [[42.3185, -83.0395], [43.165, -79.053], [43.0896, -79.075], [42.905, -78.925], [42.975, -82.405], [43.2557, -79.8711], [45.5019, -73.5674], [49.2827, -123.1207]]) assert.match(C.closedAt(...p) || "", /Torontu/, `${p}`);
  // Detroit, Lewiston, Niagara Falls NY, Buffalo, Port Huron.
  for (const p of [[42.33, -83.044], [43.1726, -79.0354], [43.087, -79.06], [42.8864, -78.8784], [42.975, -82.425]]) assert.match(C.closedAt(...p) || "", /Washingtonu/, `${p}`);
});

const LAT = 43.66, LON = -79.4, KX = 111320 * Math.cos((LAT * Math.PI) / 180), KY = 110574;
const ll = (x, y) => [LON + x / KX, LAT + y / KY];
const esri = (list) => ({ features: list.map(([d, x0, x1]) => ({ attributes: { SUBTYPE_DESC: d }, geometry: { rings: [[[x0, -50], [x1, -50], [x1, 50], [x0, 50], [x0, -50]].map(([x, y]) => ll(x, y))] } })) });
const way = { type: "way", id: 1, tags: { highway: "residential" }, geometry: [ll(0, -60), ll(0, 60)].map(([lon, lat]) => ({ lon, lat })) };
const tram = (x) => ({ type: "way", id: 10 + x, tags: { railway: "tram" }, geometry: [ll(x, -60), ll(x, 60)].map(([lon, lat]) => ({ lon, lat })) });
const BBOX = [...ll(-30, -1), ...ll(30, 1)].map((v, i) => v + (i < 2 ? -4e-4 : 4e-4)).join(",");
const codes = (r) => r.features.map((f) => f.attributes.code);

test("Toronto: plochy podél řezu, mezera mezi vozovkami je dělicí pás nebo těleso tramvaje, zálivy u obruby", async () => {
  const { TORONTO_MAP } = await import("../pilot/public/towns/canada.js");
  const { planimetricCut } = await import("../pilot/public/towns/planimetrics.js");
  const cut = (b, s, r, p, osm = [way], tags = way.tags) => planimetricCut(TORONTO_MAP, [esri(b), esri(s), esri(r), esri(p)], osm, BBOX, tags, { way });
  const side = cut([["Building Outline", -20, -12], ["Miscellaneous Structure", 12, 14]], [["Sidewalk", -8, -6], ["Sidewalk", 6, 8]], [["Road Edge", -4.2, 4.2]], []);
  assert.deepEqual(codes(side), [401, 601, 401, 702, 401, 701, 401, 702, 401]);
  assert.equal(side.junction, false);
  assert.equal(cut([], [], [["Intersection", -5, 5]], []).junction, true);
  const two = [["Road Edge", -12, -5], ["Road Edge", 5, 12]];
  assert.deepEqual(codes(cut([], [], two, [])), [401, 701, 9950, 701, 401]);
  assert.deepEqual(codes(cut([], [], two, [], [way, tram(-1.6), tram(1.6)])), [401, 701, 401, 705, 401, 701, 401]);
  assert.deepEqual(codes(cut([], [["Sidewalk", 7, 10]], [["Road Edge", -5, 5]], [["Parking Lot", 5, 7]])), [401, 701, 704, 702, 401]);
  assert.deepEqual(codes(cut([], [], [["Road Edge", -5, 5]], [["Parking Lot", 5, 20]])), [401, 701, 1003, 401]);
  // A cycle track OSM has as a way of its own in the map's carriageway (not one on the sidewalk, nor a crossing).
  const track = (x, tags = {}) => ({ type: "way", id: 90, tags: { highway: "cycleway", oneway: "yes", ...tags }, geometry: [ll(x, -60), ll(x, 60)].map(([lon, lat]) => ({ lon, lat })) });
  assert.deepEqual(codes(cut([], [], [["Road Edge", -6, 6]], [], [way, track(5)])), [401, 701, 703, 401]);
  assert.deepEqual(codes(cut([], [["Sidewalk", 6, 9]], [["Road Edge", -6, 6]], [], [way, track(7)])), [401, 701, 702, 401]);
  assert.deepEqual(codes(cut([], [], [["Road Edge", -6, 6]], [], [way, track(5, { cycleway: "crossing" })])), [401, 701, 401]);
  // A laneway is the roadway only of a cut across one; a yard alone is no street.
  assert.ok(codes(cut([], [], [["Lane Edge", -2, 2]], [], [way], { highway: "service" })).includes(701));
  assert.equal(cut([], [], [["Road Edge", 10, 18]], []), null);
});

test("Toronto: domy podle výšky obrysu", async () => {
  const { torontoHouse, floorsOf } = await import("../pilot/public/towns/canada.js");
  assert.deepEqual([5, 6.5, 8, 11, 40].map(floorsOf), [1, 2, 2, 3, 13]);
  assert.deepEqual(torontoHouse({ SUBTYPE_DESC: "Garage", DERIVED_HEIGHT: 3 }), { type: "garage", garage: true, caHouse: true });
  assert.equal(torontoHouse({ SUBTYPE_DESC: "Building Outline", DERIVED_HEIGHT: 8 }).fromHeight, true);
  assert.deepEqual(torontoHouse(null), {});
});
