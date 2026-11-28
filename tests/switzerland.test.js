// Switzerland and Liechtenstein (Bára 17. 11. 2026): the official cadastral survey's land cover (towns/switzerland.js),
// SWISSIMAGE (lanes-ortho.js "ch"), the states by their borders, signs, norms and the parking law. No network.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { mtvuRect, deriveOn } from "./helpers/osm.js";

test("Švýcarsko: druhy úředního vyměřování na kódy MTVU, vypínač ?av=0", async () => {
  const S = await import("../app/public/towns/switzerland.js");
  assert.equal(S.avCode({ Art: "Strasse_Weg" }), 701);
  assert.equal(S.avCode({ Art: "Trottoir" }), 702);
  assert.equal(S.avCode({ Art: "Verkehrsinsel" }), 1003);
  assert.equal(S.avCode({ Art: "Bahn" }), 1100, "železnice, ne tramvajové těleso (recenze: kolejiště nádraží vedle ulice)");
  assert.equal(S.avCode({ Art: "Gebaeude" }), 601);
  assert.equal(S.avCode({ Art: "Gartenanlage" }), 401);
  assert.equal(S.avCode({ Art: "Gewaesser_fliessendes" }), 501);
  assert.equal(S.avCode({ Art: "neco" }), null);
  globalThis.PROFILY_CH = { av: "0" };
  try {
    const out = await S.sources.surfaces("8.538,47.371,8.540,47.373");
    assert.deepEqual(out, { features: [], abroad: true }, "bez dotazu na službu");
  } finally { delete globalThis.PROFILY_CH; }
});

test("Švýcarsko: SWISSIMAGE po dlaždicích {z}/{x}/{y}, CSP pustí swisstopo a geodienste.ch", async () => {
  const { CH_ORTHO } = await import("../app/public/lanes-ortho.js");
  assert.match(CH_ORTHO, /wmts\.geo\.admin\.ch/);
  const html = fs.readFileSync(new URL("../app/public/index.html", import.meta.url), "utf8");
  const connect = html.match(/connect-src [^;]*/)[0], img = html.match(/img-src [^;]*/)[0];
  assert.ok(connect.includes("https://wmts.geo.admin.ch") && img.includes("https://wmts.geo.admin.ch"));
  assert.ok(connect.includes("https://geodienste.ch"));
  // A tile asked x before y (ArcGIS caches are y before x).
  const { laneImage } = await import("../app/public/lanes-ortho.js");
  const asked = [];
  const frame = { toLonLat: (x, y) => [8.539 + x / 75000, 47.3725 + y / 111000] };
  globalThis.OffscreenCanvas ??= class { constructor(w, h) { this.width = w; this.height = h; } getContext() { return { drawImage() {}, getImageData: (x, y, w, h) => ({ width: w, height: h, data: new Uint8ClampedArray(w * h * 4) }) }; } };
  await laneImage({ source: "ch", frame, dir: [0, 1], t0: -2, t1: 2, fetchImpl: async (u) => { asked.push(u); return { ok: false, status: 404 }; } }).catch(() => null);
  const [z, x, y] = asked[0].replace(CH_ORTHO + "/", "").replace(".jpeg", "").split("/").map(Number);
  assert.equal(z, 20);
  assert.ok(Math.abs(x - 549159) < 3 && Math.abs(y - 367216) < 3, `${x}/${y}`);
});

test("Švýcarsko: značky SSV (2.49 zákaz zastavení, 2.50 zákaz stání, 4.08 a 2.02 jednosměrka), bez tabulek, které nemáme", async () => {
  const C = await import("../app/public/city.js");
  const { signFile, plateFile, signLabel } = await import("../app/public/signs.js");
  C.setCity("switzerland");
  assert.equal(signFile({ k: "b28" }, null, "CH"), "2.49");
  assert.equal(signFile({ k: "b29" }, null, "CH"), "2.50");
  assert.equal(signFile({ k: "oneway", dir: "forward" }, null, "CH"), "4.08");
  assert.equal(signFile({ k: "oneway", dir: "backward" }, null, "CH"), "2.02");
  assert.equal(signFile({ k: "oneway", dir: "forward", plate: "protismer" }, null, "CH"), "4.08.1");
  assert.equal(signFile({ k: "b1", plate: "obsluha" }, null, "CH"), null, "Zubringerdienst je jen text");
  assert.equal(signFile({ k: "b20a", v: 30 }, null, "CH"), "2.30");
  assert.equal(signFile({ k: "ztp" }, null, "CH"), "4.17");
  assert.equal(plateFile({ k: "ztp" }, null, "CH"), "5.34.4");
  assert.equal(signFile({ k: "sdilena" }, null, "CH"), null);
  // The zones exactly (the review: Wohn- and Fussgängerzone were swapped).
  assert.equal(signFile({ k: "ip26a" }, null, "CH"), "2.59.5", "obytná zóna = Begegnungszone");
  assert.equal(signFile({ k: "ip27a" }, null, "CH"), "2.59.3", "pěší zóna = Fussgängerzone");
  assert.equal(signFile({ k: "zona30" }, null, "CH"), "2.59.1");
  assert.equal(signFile({ k: "c9a" }, null, "CH"), "2.63.1");
  assert.equal(signFile({ k: "c10a" }, null, "CH"), "2.63");
  assert.equal(signFile({ k: "ip20a" }, null, "CH"), "2.64");
  assert.match(signLabel({ k: "b28" }, "CH"), /^SSV 2\.49 /);
  assert.equal(signFile({ k: "b28" }, null, "LI"), "2.49", "Lichtenštejnsko má stejná čísla");
  C.setCity("praha");
});

test("Švýcarsko: normy podle kantonálních příruček, bez varování, kde zdroj chybí; Lichtenštejnsko jako Švýcarsko se svým zákonem", async () => {
  const { COUNTRIES } = await import("../app/public/countries/index.js");
  const CH = COUNTRIES.CH, LI = COUNTRIES.LI;
  assert.equal(CH.limits({ type: "chodnik" }, [{ type: "chodnik" }], 0).min, 1.8);
  assert.equal(CH.limits({ type: "cyklopruh" }, [{ type: "cyklopruh" }], 0).min, 1.5);
  assert.equal(CH.limits({ type: "cyklopruh" }, [{ type: "cyklopruh" }, { type: "parkovani" }], 0).min, 2);
  assert.equal(CH.limits({ type: "pruh", roadClass: "residential" }, [{ type: "pruh" }], 0), null, "místní ulice: zdroj nenalezen");
  assert.deepEqual(CH.tramBelt({}, 6), []);
  assert.equal(CH.lawNeed(true, 1, 2.5), 3);
  assert.equal(CH.lawNeed(false, 2, 2.5), 5);
  assert.equal(LI.limits, CH.limits);
  assert.match(LI.halfKerbNote("3 m", "5 m"), /čl\. 21/);
  assert.match(CH.halfKerbNote("3 m", "5 m"), /čl\. 19/);
  assert.equal(CH.socialistLooks, false, "žádný panelák");
  assert.deepEqual(CH.search, ["photon-ch"]);
});

test("Švýcarsko: Photon s místními názvy (Genève, ne Genf), jen CH a LI", async () => {
  const { findPhoton } = await import("../app/public/search-photon.js");
  let url = "";
  const getJSON = async (u) => { url = u; return { features: [
    { properties: { countrycode: "CH", osm_key: "highway", name: "Rue du Rhône", city: "Genève", postcode: "1204" }, geometry: { coordinates: [6.14, 46.2] } },
    { properties: { countrycode: "FR", osm_key: "highway", name: "Rue du Rhône", city: "Annemasse" }, geometry: { coordinates: [6.2, 46.19] } },
  ] }; };
  const out = await findPhoton("rue du rhone", getJSON, null, ["CH", "LI"]);
  assert.match(url, /lang=default/);
  assert.deepEqual(out.map((x) => x.text), ["Rue du Rhône, 1204 Genève"]);
});

test("Švýcarsko: vyměřování jen s vozovkou, chodníkem nebo dráhou pod středem řezu, ne s ostatní zpevněnou plochou (most, nábřeží, molo)", async () => {
  const S = await import("../app/public/towns/switzerland.js");
  const sq = (x0, y0, x1, y1) => ({ type: "Polygon", coordinates: [[[x0, y0], [x1, y0], [x1, y1], [x0, y1], [x0, y0]]] });
  const cx = 8.539, cy = 47.372;
  const answer = { type: "FeatureCollection", features: [
    { type: "Feature", properties: { Art: "uebrige_befestigte", Kanton: "ZH" }, geometry: sq(cx - 0.0001, cy - 0.0001, cx + 0.0001, cy + 0.0001) },
    { type: "Feature", properties: { Art: "Strasse_Weg", Kanton: "ZH" }, geometry: sq(cx + 0.0001, cy - 0.0003, cx + 0.0003, cy + 0.0003) },
  ] };
  const fetch0 = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify(answer), { status: 200, headers: { "content-type": "application/json" } });
  try {
    const out = await S.sources.surfaces(`${cx - 0.0003},${cy - 0.0003},${cx + 0.0003},${cy + 0.0003}`);
    assert.equal(out.chAv, undefined);
    assert.equal(out.abroad, true);
  } finally { globalThis.fetch = fetch0; }
});

test("Švýcarsko: zákonný odhad stání nedá auta vedle cyklopruhu (VRV čl. 19 odst. 2), v Česku beze změny", async () => {
  const C = await import("../app/public/city.js");
  const { COUNTRIES } = await import("../app/public/countries/index.js");
  const D = await import("../app/public/countries/default.js");
  assert.equal(COUNTRIES.CH.parkByCycleLane, false);
  assert.equal(COUNTRIES.LI.parkByCycleLane, false);
  assert.equal(D.default.parkByCycleLane, true);
  assert.equal(COUNTRIES.CZ.parkByCycleLane ?? D.default.parkByCycleLane, true);
  C.setCity("praha");
});

test("Švýcarsko: obousměrka 10 m s cyklopruhy nemá odhadnuté stání (VRV čl. 19 odst. 2), bez cyklopruhů ano", async () => {
  const C = await import("../app/public/city.js");
  const { localFrame } = await import("../app/public/derive.js");
  const frame = localFrame(47.37, 8.54);
  const rect = mtvuRect;
  const ll = (x, y) => { const [lon, lat] = frame.toLonLat(x, y); return { lon, lat }; };
  const road = (w, tags) => {
    const polys = [rect(601, -w / 2 - 8, -w / 2 - 3), rect(702, -w / 2 - 3, -w / 2), rect(701, -w / 2, w / 2), rect(702, w / 2, w / 2 + 3), rect(601, w / 2 + 3, w / 2 + 8)];
    const way = { type: "way", id: 1, tags: { highway: "residential", ...tags }, geometry: [ll(0, -60), ll(0, 60)] };
    return deriveOn({ polys, elements: [way], frame, way, inZps: false });
  };
  C.setCity("switzerland");
  try {
    const lanes = road(10, { "cycleway:both": "lane" }), plain = road(10, {});
    const s = (p) => p.segments.map((x) => `${x.type} ${x.width.toFixed(2)}`).join(", ");
    assert.ok(lanes.segments.some((x) => x.type === "cyklopruh"), s(lanes));
    assert.equal(lanes.segments.filter((x) => x.type === "parkovani" && x.source === "odhad").length, 0, s(lanes));
    assert.ok(plain.segments.some((x) => x.type === "parkovani" && x.source === "odhad"), s(plain));
  } finally { C.setCity("praha"); }
});
