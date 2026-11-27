// Denmark (Bára 23. 11. 2026): the state and its borders (Bornholm in, the Faroes, Greenland, Flensburg and Malmö out),
// the orthophoto only with the token (and an honest failure without it), Copenhagen's kerb lines, parking areas and
// buildings (off until their licence is known), Aarhus's buildings, GSearch, the signs and the norms (countries/DK.js).
// No network: the fixtures are trimmed real answers, the token is set by the tests themselves.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const fixture = (f) => JSON.parse(fs.readFileSync(new URL(`./fixtures/${f}`, import.meta.url), "utf8"));

test("Dánsko: stát řezu, Bornholm, přístavy a sousedé u hranice", async () => {
  const C = await import("../app/public/city.js");
  C.loadBounds(JSON.parse(fs.readFileSync(new URL("../app/public/mesta.json", import.meta.url), "utf8")));
  C.loadStates(JSON.parse(fs.readFileSync(new URL("../app/public/staty.json", import.meta.url), "utf8")));
  // Rådhuspladsen, Nyhavn, Islands Brygge, Aarhus, Odense, Aalborg, Rønne (Bornholm), Skagen, Padborg, Kruså, Esbjerg, Helsingør
  for (const [lat, lon] of [[55.6761, 12.5685], [55.6798, 12.591], [55.664, 12.577], [56.1567, 10.2108], [55.3959, 10.3883], [57.0488, 9.9217],
    [55.1009, 14.7066], [57.7209, 10.5839], [54.8256, 9.3612], [54.8506, 9.4053], [55.4765, 8.4594], [56.0361, 12.6136]]) assert.equal(C.cityAt(lat, lon), "denmark", `${lat},${lon}`);
  assert.equal(C.cityAt(54.7836, 9.4321), "germany", "Flensburg");
  // Malmö, Helsingborg, Tórshavn (Faroes), Nuuk (Greenland)
  for (const [lat, lon] of [[55.605, 13.0038], [56.0465, 12.6945], [62.0107, -6.7741], [64.1814, -51.6941]]) assert.equal(C.cityAt(lat, lon), "cizina", `${lat},${lon}`);
});

test("Dánsko: ortofoto jen s tokenem, bez něj poctivá chyba", async () => {
  const K = await import("../app/public/keys.js");
  const L = await import("../app/public/lanes-ortho.js");
  const frame = { toLonLat: (x, y) => [12.5685 + x / 63000, 55.6761 + y / 111000] };
  const opts = { source: "dk", frame, dir: [1, 0], t0: -10, t1: 10 };
  K.setDkToken("");
  await assert.rejects(L.laneImage({ ...opts, fetchImpl: () => { throw new Error("no request"); } }), (e) => e.noKey === true, "bez tokenu se nic neptá");
  K.setDkToken("test-token");
  const u = new URL(L.DK_ORTHO(20, 561234, 327654));
  assert.equal(u.origin + u.pathname, "https://api.dataforsyningen.dk/orto_foraar_webm_DAF");
  for (const [k, v] of Object.entries({ service: "WMTS", request: "GetTile", layer: "orto_foraar_webm", tilematrixset: "DFD_GoogleMapsCompatible", tilematrix: "20", tilerow: "327654", tilecol: "561234", token: "test-token" })) assert.equal(u.searchParams.get(k), v, k);
  // The basemap's template (the review of 24. 11. 2026): Leaflet's placeholders stay as they are, not URL-encoded.
  const tpl = L.DK_ORTHO("{z}", "{x}", "{y}");
  for (const k of ["tilematrix={z}", "tilerow={y}", "tilecol={x}"]) assert.ok(tpl.includes(k), k);
  assert.ok(!/%7B|%7D/i.test(tpl), "no encoded braces");
  assert.deepEqual([...tpl.matchAll(/\{ *([\w_ -]+) *\}/g)].map((m) => m[1]).sort(), ["x", "y", "z"]);
  // The token turned away on every tile (403): no key, not an empty image; a server error on every tile: an outage.
  const asked = [];
  globalThis.OffscreenCanvas ??= class { constructor(w, h) { this.width = w; this.height = h; } getContext() { return { drawImage() {}, getImageData: (x, y, w, h) => ({ width: w, height: h, data: new Uint8ClampedArray(w * h * 4) }) }; } };
  await assert.rejects(L.laneImage({ ...opts, fetchImpl: async (url) => { asked.push(url); return new Response("", { status: 403 }); } }), (e) => e.noKey === true);
  assert.ok(asked.length > 0 && asked.every((x) => x.includes("token=test-token")));
  await assert.rejects(L.laneImage({ ...opts, fetchImpl: async () => new Response("", { status: 503 }) }), (e) => e.outage === true);
  K.setDkToken("");
});

test("Dánsko: okraje vozovek a parkovací plochy Kodaně", async () => {
  const D = await import("../app/public/towns/denmark.js");
  // Kapelvej by Assistens Kirkegård: of the paths, drives and roadways only the roadway's edges.
  const paths = D.kantPaths(fixture("dk-kbh-vejkant.json"));
  const roadways = fixture("dk-kbh-vejkant.json").features.filter((f) => f.properties.vejtype === "Kørevej").length;
  assert.ok(paths.length >= roadways && roadways > 0);
  assert.ok(paths.every((p) => Array.isArray(p[0]) && Math.abs(p[0][0] - 12.55) < 0.01 && Math.abs(p[0][1] - 55.69) < 0.01), "lon, lat");
  const u = new URL(D.kantUrl("12.5525,55.6895,12.5535,55.69"));
  assert.equal(u.searchParams.get("typeNames"), "k101:vejkant");
  assert.equal(u.searchParams.get("bbox"), "55.6895,12.5525,55.69,12.5535,urn:ogc:def:crs:EPSG::4326");
  // Parking: the angle tells perpendicular (90°) from angled, car sharing is reserved.
  assert.equal(D.parkingOrient("Afmærket skråparkering, 90°"), "kolme");
  assert.equal(D.parkingOrient("Uafmærket skråparkering, 45°"), "sikme");
  assert.equal(D.parkingOrient("Afmærket parkering"), undefined);
  const p = D.kbhParking(fixture("dk-kbh-parkering.json")).features;
  assert.equal(p.length, 9);
  assert.ok(p.some((f) => f.attributes.ORIENT === "sikme" && f.attributes.KIND === "specialni"), "sdílená auta");
  assert.ok(p.every((f) => f.attributes.PS_ZPS >= 1 && Array.isArray(f.geometry.rings[0][0])));
  // On by default (Bára 24. 11. 2026, though the licence of the layers is not stated); switched off nothing is asked.
  globalThis.PROFILY_DK = {};
  assert.equal(D.on("kbhkant"), true);
  assert.equal(D.on("kbhpark"), true);
  assert.equal(D.on("kbhbyg"), true);
  globalThis.PROFILY_DK = { kbhkant: "0", kbhpark: "0" };
  assert.deepEqual(await D.sources.parking("12.55,55.689,12.554,55.691"), { features: [] });
  assert.deepEqual((await D.sources.lines("12.55,55.689,12.554,55.691")).edges, []);
  // Switched on, outside Copenhagen still nothing (Aarhus).
  globalThis.PROFILY_DK = { kbhkant: "1", kbhpark: "1" };
  assert.deepEqual(await D.sources.parking("10.20,56.15,10.21,56.16"), { features: [] });
  // The city's WFS failing once (the review of 24. 11. 2026): said (dkFailed), not kept, the next cut asks again.
  const realFetch = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async () => (++calls === 1 ? new Response("", { status: 404 }) : new Response(JSON.stringify(fixture("dk-kbh-vejkant.json")), { status: 200 }));
  try {
    const bb = "12.5525,55.6895,12.5535,55.6901";
    const first = await D.sources.lines(bb);
    assert.equal(first.dkFailed, "kant");
    assert.deepEqual(first.edges, []);
    const second = await D.sources.lines(bb);
    assert.ok(second.edges.length > 0 && !second.dkFailed);
    assert.equal(calls, 2);
    globalThis.fetch = async () => new Response("", { status: 503 });
    const pk = await D.sources.parking(bb);
    assert.equal(pk.dkFailed, "park");
    assert.ok(!pk.dkParking, "no parking areas: the estimate as without them");
  } finally { globalThis.fetch = realFetch; }
  globalThis.PROFILY_DK = {};
});

test("Dánsko: budovy Kodaně a Aarhusu", async () => {
  const D = await import("../app/public/towns/denmark.js");
  // Kapelvej 4: the chapel of 1862, brick, one floor, culture (an office-like building).
  assert.deepEqual(D.pick(fixture("dk-kbh-bygning.json"), 55.68954585, 12.55228407, D.kbhBuilding, (q) => q.antaletager),
    { built: 1862, material: "brick", solid: true, office: true, cornice: 1, roof: 0, total: 1 });
  assert.deepEqual(D.kbhBuilding({ antaletager: 5, samlettagetageareal: 120, opfoerelselsaar: 1895, ydervaeggensmaterialekode: 1, bygningensanvendelsekode: 140 }),
    { built: 1895, material: "brick", solid: true, type: "apartments", cornice: 5, roof: 1, total: 6 });
  // No floors in BBR: from the eaves height, an estimate.
  assert.deepEqual(D.kbhBuilding({ tagrendehoejde_estimat: 12.4, bygningensanvendelsekode: 120, ydervaeggensmaterialekode: 5 }),
    { built: undefined, material: "wood", solid: true, house: true, type: "house", cornice: 4, roof: 0, total: 4, fromHeight: true });
  assert.equal(D.use(131).type, "terrace");
  assert.equal(D.use(110).farm, true);
  assert.equal(D.use(320).office, true);
  assert.equal(D.use(910).garage, true);
  // Not every code of 300–499 is an office (the review of 24. 11. 2026): a church, a school, a parking house.
  assert.equal(D.use(414).type, "church");
  assert.equal(D.use(421).type, "school");
  assert.equal(D.use(313).garage, true);
  assert.equal(D.use(321).office, true);
  assert.deepEqual(D.walls(4), { solid: true }, "hrázděné zdivo není dřevěný dům");
  // Aarhus, Park Allé: 1925, brick, flats; floors from the areas (an estimate: OSM's levels win).
  const a = D.pick(fixture("dk-aar-bygning.json"), 56.1529, 10.2043, D.aarBuilding, (q) => q.Byg_Arl_Saml);
  assert.equal(a.built, 1925);
  assert.equal(a.material, "brick");
  assert.equal(a.type, "apartments");
  assert.equal(a.fromHeight, true);
  assert.ok(a.cornice >= 3 && a.cornice <= 7, `${a.cornice}`);
  // Only the fields used: never the owner, the address or the cadastral number.
  for (const url of [D.kbhBuildingUrl(55.69, 12.55), D.aarBuildingUrl(56.15, 10.2)]) {
    const fields = new URL(url).searchParams.get("propertyName");
    assert.ok(fields && !/ejer|adresse|matrikel|ejendom|Hus_Nr|VejKode/i.test(fields), fields);
  }
  assert.equal(new URL(D.kbhBuildingUrl(55.69, 12.55)).searchParams.get("typeNames"), "k101:bygning");
  // Copenhagen's buildings switched off (?kbhbyg=0): in Copenhagen no request.
  globalThis.PROFILY_DK = { kbhbyg: "0" };
  assert.deepEqual(await D.sources.podlaznost(55.6761, 12.5685), {});
  globalThis.PROFILY_DK = {};
});

test("Dánsko: hledání GSearch jen s tokenem", async () => {
  const K = await import("../app/public/keys.js");
  const S = await import("../app/public/search-dk.js");
  K.setDkToken("");
  assert.equal(S.gsearchReady(), false);
  assert.deepEqual(await S.findDk("Nørrebrogade 10", () => { throw new Error("no request"); }), []);
  K.setDkToken("test-token");
  const u = new URL(S.gsearchUrl("Nørrebrogade 10"));
  assert.equal(u.pathname, "/rest/gsearch/v2.0/husnummer");
  assert.equal(u.searchParams.get("srid"), "4326");
  assert.equal(new URL(S.gsearchUrl("Nørrebrogade")).pathname, "/rest/gsearch/v2.0/navngivenvej");
  const adr = S.parseDk(fixture("dk-gsearch-husnummer.json"));
  assert.equal(adr[0].text, "Nørrebrogade 10, 2200 København N");
  assert.equal(adr[0].type, "AdresniMisto");
  assert.ok(Math.abs(adr[0].at.lon - 12.562) < 0.01 && Math.abs(adr[0].at.lat - 55.6875) < 0.01);
  const vej = S.parseDk(fixture("dk-gsearch-vej.json"));
  assert.equal(vej[0].type, "Ulice");
  assert.equal(vej[0].at.street, "Nørrebrogade");
  K.setDkToken("");
});

test("Dánsko: značky a normy", async () => {
  const { COUNTRIES } = await import("../app/public/countries/index.js");
  const DK = COUNTRIES.DK;
  const f = DK.signs.file;
  assert.equal(f({ k: "b29" }), "C62");
  assert.equal(f({ k: "b20a", v: 40 }), "C55");
  assert.equal(f({ k: "oneway", dir: "backward" }), "C19");
  assert.equal(f({ k: "oneway", dir: "forward" }), null, "E 19 je šipka podél ulice");
  assert.equal(f({ k: "oneway", dir: "backward", plate: "protismer" }), null);
  assert.equal(f({ k: "c10a", walk: "left" }), "D26");
  assert.equal(f({ k: "c10a" }), "D26.2");
  assert.equal(f({ k: "sdilena" }), null);
  assert.equal(f({ k: "zona30" }), null);
  for (const k of ["b1", "b11", "b8", "b30", "b28", "b29", "ip11a", "ip14a", "ip15a", "ip26a", "ip27a", "cyklozona", "c8a", "c9a", "c7a"]) {
    assert.ok(fs.existsSync(new URL(`../app/public/signs-DK/${f({ k })}.svg`, import.meta.url)), k);
  }
  assert.ok(fs.existsSync(new URL("../app/public/signs-DK/C55.svg", import.meta.url)));
  const { SPEED_TEMPLATES } = await import("../app/public/signs.js");
  assert.ok(SPEED_TEMPLATES.has("C55"));
  assert.match(DK.signs.label({ k: "b29" }, null, "B 29 Zákaz stání"), /^C 62 Zákaz stání$/);
  // Recommendations are orange; the two-way cycle track (circular 95/1984, second hand) too (tests/cycle-track.test.js).
  const L = (s, segs = [s], i = 0) => DK.limits(s, segs, i);
  assert.equal(L({ type: "chodnik" }).min, 0);
  assert.equal(L({ type: "chodnik" }).zaklad, 1.5);
  assert.equal(L({ type: "cyklostezka" }).zaklad, 1.8, "bez směru jako jednosměrná");
  assert.equal(L({ type: "cyklostezka", dir: "forward" }).min, 0);
  const segs = [{ type: "parkovani", orient: "podelne" }, { type: "cyklopruh" }];
  assert.equal(L(segs[1], segs, 1).zaklad, 1.8);
  assert.equal(L({ type: "pruh" }).min, 0);
  assert.equal(DK.freeLane, 3);
  assert.equal(DK.socialistLooks, false);
  assert.deepEqual(DK.tramBelt([], 5), []);
});

test("Dánsko: cyklostezka podél silnice z OSM (cycleway:<strana>=track)", async () => {
  const D = await import("../app/public/derive.js");
  const seg = () => [{ type: "chodnik", width: 4, source: "odhad" }, { type: "pruh", width: 3.5 }, { type: "pruh", width: 3.5 }, { type: "chodnik", width: 4, source: "odhad" }];
  // Both sides: a track of the OSM width beside the roadway, the sidewalk keeps the rest; directions by the side.
  let s = seg();
  assert.equal(D.trackAlongRoad(s, { highway: "secondary", "cycleway:both": "track", "cycleway:both:width": "2.2" }), 2);
  assert.deepEqual(s.map((x) => [x.type, x.width, x.dir]), [["chodnik", 1.8, undefined], ["cyklostezka", 2.2, "backward"], ["pruh", 3.5, undefined], ["pruh", 3.5, undefined], ["cyklostezka", 2.2, "forward"], ["chodnik", 1.8, undefined]]);
  // The way's right is the profile's left when the profile looks against the way.
  s = seg();
  D.trackAlongRoad(s, { highway: "secondary", "cycleway:right": "track" }, false);
  assert.equal(s[1].type, "cyklostezka");
  assert.equal(s.at(-2).type, "pruh");
  // A narrow estimated sidewalk keeps 1 m; a map's own surfaces give nothing; the switch off.
  s = [{ type: "chodnik", width: 2.5, source: "odhad" }, { type: "pruh", width: 3.5 }];
  D.trackAlongRoad(s, { "cycleway:left": "track" });
  assert.deepEqual(s.map((x) => [x.type, x.width]), [["chodnik", 1], ["cyklostezka", 1.5], ["pruh", 3.5]]);
  s = [{ type: "chodnik", width: 4, source: "dtm" }, { type: "pruh", width: 3.5 }];
  assert.equal(D.trackAlongRoad(s, { "cycleway:left": "track" }), 0);
  const O = await import("../app/public/ortho-osm.js");
  O.P.off = new Set(["stezkapodel"]);
  try { assert.equal(D.trackAlongRoad(seg(), { "cycleway:both": "track" }), 0); } finally { O.P.off = undefined; }
});
