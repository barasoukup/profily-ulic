// Czech services only for Czechia (Bára 26. 11. 2026: "ČÚZK jen Česko"): the map layers of ČÚZK, IPR, Brno and the
// other states' national services are kept to their area, nothing is asked of ČÚZK for a place in no state the app
// knows, and that place has no Czech signs, law, orthophoto or panorama. No network.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const src = (f) => fs.readFileSync(new URL(`../app/public/${f}`, import.meta.url), "utf8");
const noFetch = () => { throw new Error("no request"); };

test("cizina: žádné české značky, zákon, ortofoto ani panorama; Česko je má", async () => {
  const { default: D } = await import("../app/public/countries/default.js");
  const { default: CZ } = await import("../app/public/countries/CZ.js");
  const { countryOf } = await import("../app/public/countries/index.js");
  assert.equal(countryOf(null), D);
  assert.equal(D.panorama, false, "panorama Mapy.com jen v Česku");
  assert.equal(D.laneOrtho, "none", "ortofoto ČÚZK jen v Česku");
  assert.equal(D.bedOrtho, null);
  assert.equal(D.signs.drawable({ k: "b28" }), false, "české značky mimo Česko ne");
  assert.doesNotMatch(D.halfKerbNote("2 m", "6 m"), /361\/2000/, "český zákon mimo Česko ne");
  assert.equal(CZ.panorama, true);
  assert.equal(CZ.laneOrtho, "cuzk");
  assert.equal(CZ.bedOrtho, "cuzk");
  assert.equal(CZ.signs.drawable, null);
  assert.equal(CZ.signs.file({ k: "b28" }), "B28");
  assert.match(CZ.halfKerbNote("2 m", "6 m"), /361\/2000/);
  // Every state but Czechia has its own orthophoto source (or none), never ČÚZK's.
  const { COUNTRIES } = await import("../app/public/countries/index.js");
  for (const [code, c] of Object.entries(COUNTRIES)) if (code !== "CZ") {
    assert.notEqual(c.laneOrtho, "cuzk", code);
    assert.notEqual(c.bedOrtho, "cuzk", code);
    assert.equal(c.panorama, false, code);
  }
});

test("ortofoto: neznámý nebo žádný zdroj se ČÚZK neptá", async () => {
  const L = await import("../app/public/lanes-ortho.js");
  const { localFrame } = await import("../app/public/derive.js");
  const frame = localFrame(51.5074, -0.1278);
  for (const source of [undefined, null, "none", "xx"]) {
    assert.equal(await L.laneImage({ source, frame, dir: [1, 0], t0: -10, t1: 10, fetchImpl: noFetch }), null, String(source));
    assert.equal(await L.orthoPatch({ source, lon: -0.1278, lat: 51.5074, half: 10, px: 16, fetchImpl: noFetch }), null, String(source));
    assert.equal(L.orthoHereAt(source, -0.1278, 51.5074), false, String(source));
  }
  assert.equal(L.orthoHereAt("cuzk", 14.42, 50.08), true);
  const { bedOrtho } = await import("../app/public/ortho.js");
  const osm = { elements: [{ type: "way", tags: { railway: "tram" }, geometry: [{ lat: 51.507, lon: -0.128 }, { lat: 51.508, lon: -0.128 }] }] };
  for (const source of [null, "at", "de", "none"]) assert.equal(await bedOrtho({ osm, frame, dir: [0, 1], fetchImpl: noFetch, source }), null, String(source));
});

test("mapa: vrstvy českých, slovenských a rakouských služeb jen na svém území", () => {
  const app = src("app.js");
  // ČÚZK's orthophoto and the DMVS: a layer class kept to Czechia's rings, with Czechia's bounds (credit by the rings).
  assert.match(app, /const CzWms = CZ_RINGS\.length \? keptInside\(L\.TileLayer\.WMS, CZ_RINGS\)/);
  assert.match(app, /const cuzkOrtho = \(\) => new CzWms\("https:\/\/ags\.cuzk\.gov\.cz[^]*?\.\.\.czBounds\(\)/);
  assert.match(app, /const dmvsWms = \(layer, opts = \{\}\) => new CzWms\([^]*?\.\.\.czBounds\(\)/);
  // A city's box carries its rings (credit only where the view reaches the city).
  assert.match(app, /const within = \(id\) => \(TOWN_BOUNDS\?\.\[id\]\?\.length \? \{ bounds: boundsOf\(TOWN_BOUNDS\[id\]\) \} : \{\}\)/);
  // Every tile layer asking a Czech service (or Slovakia's, Austria's) names its area: Czechia, a city or a state's rings.
  const hosts = /cuzk\.gov\.cz|praha\.eu|tiles\.arcgis\.com\/tiles\/SBTXIEUGWbqzUecw|gis\.brno\.cz|\$\{GS\}|SK_ORTHO|AT_ORTHO/;
  const layers = app.split("\n").map((line, i) => [line, i]).filter(([line]) => /tileLayer|new [A-Z]\w*\(|ArcgisExport\(/.test(line) && hosts.test(line));
  assert.ok(layers.length >= 6, `${layers.length}`);
  for (const [line, i] of layers) {
    const block = app.split("\n").slice(i, i + 4).join("\n");
    assert.match(block, /czBounds\(\)|within\("|boundsOf\(STATES\./, `řádek ${i + 1}: ${line.trim().slice(0, 90)}`);
  }
  assert.match(app, /const Sk = keptInside\(L\.TileLayer, STATES\.slovensko\)/);
  assert.match(app, /const At = keptInside\(L\.TileLayer, STATES\.austria\)/);
});

test("hledání: RÚIAN napřed jen v Česku, jinde až když nic nenašlo nic jiného", () => {
  const s = src("search.js"), app = src("app.js");
  assert.match(s, /const \[cz, skNow\] = await Promise\.all\(\[czHere \? ruian\(\) : \[\]/);
  assert.match(s, /if \(!czHere && !found\.length\) found = rankResults\(await ruian\(\), text\)/);
  assert.match(app, /inCzechia: \(\) => \{ const c = map\.getCenter\(\); return countryOfCity\(cityAt\(c\.lat, c\.lng\)\)\.code === "CZ"; \}/);
});
