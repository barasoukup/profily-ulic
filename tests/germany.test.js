// Germany (Bára 17. 11. 2026): the cities' maps of street surfaces (towns/germany.js) and the Länder of the orthophoto
// (lanes-ortho.js). No network: only the mappings and the boxes.
import { test } from "node:test";
import assert from "node:assert/strict";
import { mtvuRect, deriveOn } from "./helpers/osm.js";

test("Německo: plochy Berlína, Hamburku a Cách na kódy MTVU, město podle polohy, vypínače", async () => {
  const G = await import("../app/public/towns/germany.js");
  assert.equal(G.BERLIN_LAYERS.cm_fahrbahn, 701);
  assert.equal(G.BERLIN_LAYERS.cl_gehweg, 702);
  assert.equal(G.BERLIN_LAYERS.bz_gleiskoerper_strab, 705);
  assert.equal(G.hamburgCode({ nutzung: "Radfahrstreifen", kategorie: "Verkehrsflächen", ebene: "regulär" }), 701, "cyklopruh je ve vozovce");
  assert.equal(G.hamburgCode({ nutzung: "Radweg" }), 703);
  assert.equal(G.hamburgCode({ nutzung: "Parkplätze Kfz" }), 704);
  assert.equal(G.hamburgCode({ nutzung: "neco nového", kategorie: "Grünflächen" }), 401, "neznámé podle kategorie");
  assert.equal(G.hamburgCode({ nutzung: "Fahrbahn", ebene: "Tunnel" }), null);
  assert.equal(G.aachenCode({ feat_type: "Fahrradweg auf Fahrbahn" }), 701);
  assert.equal(G.aachenCode({ feat_type: "Fahrradweg" }), 703);
  assert.equal(G.aachenCode({ feat_type: "Gehweg", level: "Unterfuehrung" }), null);
  assert.equal(G.aachenCode({ feat_type: "unbestimmt" }), null);
  assert.equal(G.deTownAt(13.3777, 52.5163), "berlin");
  assert.equal(G.deTownAt(9.9937, 53.5503), "hamburg");
  assert.equal(G.deTownAt(6.0839, 50.7753), "aachen");
  assert.equal(G.deTownAt(11.5755, 48.1374), null);
  globalThis.PROFILY_DE = { berlin: "0" };
  try { assert.equal(G.deTownAt(13.3777, 52.5163), null, "?berlin=0"); } finally { delete globalThis.PROFILY_DE; }
});

test("Německo: ortofoto spolkové země podle polohy, u hranice i sousední", async () => {
  const { landsAt, SOURCES, urlOf } = await import("../app/public/lanes-ortho.js");
  assert.deepEqual(await landsAt(11.5755, 48.1374), ["BY"]);
  assert.deepEqual(await landsAt(6.957, 50.94), ["NW"]);
  assert.equal((await landsAt(13.3777, 52.5163))[0], "BE");
  assert.deepEqual((await landsAt(9.98, 53.7)).slice(0, 2), ["SH", "HH"], "Norderstedt: Šlesvicko-Holštýnsko, pak Hamburk");
  assert.equal(Object.values(SOURCES).filter((s) => s.chain === "de").length, 16);
  assert.match(urlOf(SOURCES["de-HH"].service, [0, 0, 1, 1], 10, 10), /time=2024/, "Hamburk výslovně 2024 (2022 je satelit pod uzavřenou licencí)");
});

test("Německo: CSP stránky pustí ortofota všech zemí (connect-src pro odhad, img-src pro podklad) a mapy měst", async () => {
  const fs = await import("node:fs");
  const html = fs.readFileSync(new URL("../app/public/index.html", import.meta.url), "utf8");
  const connect = html.match(/connect-src [^;]*/)[0], img = html.match(/img-src [^;]*/)[0];
  const { SOURCES } = await import("../app/public/lanes-ortho.js");
  for (const { land, service } of Object.values(SOURCES).filter((s) => s.chain === "de")) {
    const host = new URL(service.base).origin;
    assert.ok(connect.includes(host), `connect-src ${land} ${host}`);
    assert.ok(img.includes(host), `img-src ${land} ${host}`);
  }
  for (const host of ["https://gdi.berlin.de", "https://api.hamburg.de", "https://geoserver.aachen.de"]) assert.ok(connect.includes(host), host);
});

test("velikost značek ze sad Commons (AT, DE) podle tvaru, ne podle čísel ve viewBoxu", async () => {
  const { signUnits } = await import("../app/public/profile.js");
  assert.equal(signUnits("signs-CZ", 132, 100), 1.32, "české zůstávají");
  assert.equal(signUnits("signs-DE", 600.995, 600.995), 1);
  assert.equal(signUnits("signs-AT", 960, 960), signUnits("signs-AT", 100, 100), "10a-30 a 10a-50 stejně velké");
  assert.equal(signUnits("signs-DE", 727, 269), 1.5, "široká šipka Z 220");
  assert.ok(Math.abs(signUnits("signs-AT", 400, 536.2) - 0.746) < 0.01);
});

test("Německo: stání podle zákona nenechá dva pruhy po 1,55 m (obousměrka 5,1 m bez stání, 7,1 m s jedním, 9,1 m se dvěma)", async () => {
  const C = await import("../app/public/city.js");
  const { localFrame } = await import("../app/public/derive.js");
  const frame = localFrame(52.5, 13.4);
  const rect = mtvuRect;
  const ll = (x, y) => { const [lon, lat] = frame.toLonLat(x, y); return { lon, lat }; };
  const road = (w) => {
    const polys = [rect(601, -w / 2 - 8, -w / 2 - 3), rect(702, -w / 2 - 3, -w / 2), rect(701, -w / 2, w / 2), rect(702, w / 2, w / 2 + 3), rect(601, w / 2 + 3, w / 2 + 8)];
    const way = { type: "way", id: 1, tags: { highway: "residential" }, geometry: [ll(0, -60), ll(0, 60)] };
    return deriveOn({ polys, elements: [way], frame, way, inZps: false });
  };
  C.setCity("germany");
  try {
    for (const [w, parks] of [[5.1, 0], [7.1, 1], [9.1, 2]]) {
      const p = road(w), segs = p.segments.map((x) => `${x.type} ${x.width.toFixed(2)}`).join(", ");
      assert.ok(p.segments.filter((x) => x.type === "pruh").every((x) => x.width >= 2.5 - 1e-6), `${w} m: ${segs}`);
      assert.equal(p.segments.filter((x) => x.type === "parkovani" && x.source === "odhad").length, parks, `${w} m: ${segs}`);
    }
  } finally { C.setCity("praha"); }
});

test("Německo: paneláky jen v zemích bývalé NDR (countries/DE.js atPlace podle laender.json)", async () => {
  const { countryOf } = await import("../app/public/countries/index.js");
  const DE = countryOf("DE");
  // Heiligenstadt and Dömitz east, Eschwege, Bad Steben and Neustadt bei Coburg west (the review of Germany).
  for (const [lon, lat, east] of [[12.375, 51.34, true], [13.4, 52.52, true], [11.63, 52.13, true], [10.135, 51.378, true], [11.25, 53.14, true],
    [11.575, 48.137, false], [9.99, 53.55, false], [10.05, 51.19, false], [11.67, 50.35, false], [11.12, 50.33, false]]) assert.equal((await DE.atPlace(lon, lat)).panels, east, `${lon},${lat}`);
});

test("stání zakreslené v OSM se do o něco užší odhadnuté vozovky vejde v plné šířce, pruh ustoupí (Großer Brockhaus, recenze přenosu)", async () => {
  const C = await import("../app/public/city.js");
  const { localFrame } = await import("../app/public/derive.js");
  const frame = localFrame(51.34, 12.386);
  const rect = mtvuRect;
  const ll = (x, y) => { const [lon, lat] = frame.toLonLat(x, y); return { lon, lat }; };
  const road = (guess) => {
    const polys = [rect(601, -10, -5), rect(702, -5, -2.2, guess), rect(701, -2.2, 2.2, guess), rect(702, 2.2, 5, guess), rect(601, 5, 10)];
    const way = { type: "way", id: 1, tags: { highway: "residential", oneway: "yes", "parking:left": "street_side", "parking:left:orientation": "parallel", "parking:right": "no" }, geometry: [ll(0, -60), ll(0, 60)] };
    return deriveOn({ polys, elements: [way], frame, way, inZps: false });
  };
  C.setCity("germany");
  try {
    const p = road(true), park = p.segments.filter((x) => x.type === "parkovani");
    assert.equal(park.length, 1, p.segments.map((x) => `${x.type} ${x.width.toFixed(2)}`).join(", "));
    assert.ok(Math.abs(park[0].width - 2) < 1e-6, "stání 2 m, ne zúžené");
    assert.equal(road(false).segments.filter((x) => x.type === "parkovani").length, 0, "změřená vozovka: staré pravidlo");
  } finally { C.setCity("praha"); }
});

test("koleje z OSM vedle tělesa z mapy města se posunou do něj (Neue Schönhauser Straße), jinde zůstanou", async () => {
  const { snapTracksToBeds } = await import("../app/public/derive.js");
  const r2 = (ts) => ts.map((t) => Math.round(t * 100) / 100);
  // Berlin's Gleiskörper in the roadway (−1.2…3.0 m), OSM's tracks 1 m south: 1.5 m each side of the bed's centre.
  let ts = [-1.70, 1.49];
  snapTracksToBeds(ts, [[-1.2, 3.0, true]]);
  assert.deepEqual(r2(ts), [-0.6, 2.4]);
  // A wide bed: the pair keeps its spacing, centred.
  ts = [0, 3];
  snapTracksToBeds(ts, [[0, 5, false]]);
  assert.deepEqual(r2(ts), [1, 4]);
  // A separate bed narrower than the pair keeps OSM's tracks (Oranienburger Tor: a bed of 4.6 m, tracks 3.5 m apart).
  ts = [0.14, 3.6];
  snapTracksToBeds(ts, [[-1.2, 3.4, false]]);
  assert.deepEqual(r2(ts), [0.14, 3.6]);
  // A rail up to 0.25 m beyond the edge is within the data's accuracy; a track far from any bed stays.
  ts = [-4.75, -1.3, 12];
  snapTracksToBeds(ts, [[-5.3, 0.2, true]]);
  assert.deepEqual(r2(ts), [-4.75, -1.3, 12]);
});

test("úzký proužek tělesa ani vzdálené těleso kolej nepřitáhnou (Vídeň, Rotundenbrücke)", async () => {
  const { snapTracksToBeds } = await import("../app/public/derive.js");
  // The filter of narrow strips is in mapTramBeds; here a track 2.2 m from the bed's centre stays.
  const ts = [-1.55, 1.47];
  snapTracksToBeds(ts, [[-7.5, -3.0, false]]);
  assert.deepEqual(ts, [-1.55, 1.47]);
});
