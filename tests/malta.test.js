// Malta (Bára 23. 11. 2026): the orthophoto asked in degrees, traffic keeping left, the signs (countries/MT.js), the
// border. No network.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

test("Malta: ortofoto 2018 ve stupních (služba nemá Web Mercator)", async () => {
  const L = await import("../pilot/public/lanes-ortho.js");
  const R = 6378137, lat = 35.8989, lon = 14.5146;
  const x = (R * lon * Math.PI) / 180, y = R * Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360));
  const u = new URL(L.MT_ORTHO([x - 30, y - 30, x + 30, y + 30], 400, 400));
  assert.equal(u.searchParams.get("CRS"), "CRS:84");
  const [x0, y0, x1, y1] = u.searchParams.get("BBOX").split(",").map(Number);
  assert.ok(Math.abs((x0 + x1) / 2 - lon) < 1e-6 && Math.abs((y0 + y1) / 2 - lat) < 1e-5, "střed výřezu");
});

test("Malta: jízda vlevo, značky, normy, zákon o stání", async () => {
  const { COUNTRIES } = await import("../pilot/public/countries/index.js");
  const MT = COUNTRIES.MT, f = MT.signs.file;
  assert.equal(MT.leftHand, true);
  // Only the signs of S.L. 65.05's Schedule (review of 23. 11. 2026): no one-way sign, no cycle routes, no "except cycles".
  assert.equal(f({ k: "oneway", dir: "forward" }), null, "jednosměrku předpis nemá");
  assert.equal(f({ k: "oneway", dir: "backward" }), "II.A4");
  assert.equal(f({ k: "oneway" }, { dir: "backward" }), "II.A4", "směr podle pruhu");
  assert.equal(f({ k: "oneway", dir: "backward", plate: "protismer" }), null, "tabulku „Except cycles“ předpis nemá");
  assert.equal(f({ k: "ip14a" }), null, "Malta dálnici nemá");
  for (const k of ["c8a", "c9a", "c10a"]) assert.equal(f({ k }), null, `${k}: předpis nemá`);
  const expected = { b1: "II.A5", b11: "II.A6", b8: "II.B1", b30: "II.B5", b28: "II.D7", b29: "II.D6", ip11a: "III.B1", ip20a: "II.E11", zona30: "II.D12-30", ip27a: "II.B6" };
  for (const [k, file] of Object.entries(expected)) assert.equal(f({ k }), file, k);
  const licence = JSON.parse(fs.readFileSync(new URL("../evaluation/malta/signs-licence.json", import.meta.url), "utf8"));
  for (const file of [...Object.values(expected), "II.A4", ...[10, 20, 30, 40, 50, 60, 70, 80].map((v) => `II.D1-${v}`)]) {
    assert.ok(fs.existsSync(new URL(`../pilot/public/signs-MT/${file}.svg`, import.meta.url)), file);
    assert.ok(licence[file], `licence ${file}`);
  }
  for (const file of fs.readdirSync(new URL("../pilot/public/signs-MT/", import.meta.url))) if (file.endsWith(".svg")) assert.ok(!file.startsWith("UK-"), `${file}: britská značka mimo předpis`);
  // The files under the Open Government Licence (their credit in the export) are those of signs-licence.json.
  const ogl = Object.entries(JSON.parse(fs.readFileSync(new URL("../evaluation/malta/signs-licence.json", import.meta.url), "utf8"))).filter(([, v]) => /OGL/.test(v.lic)).map(([k]) => k).sort();
  assert.deepEqual([...MT.signs.ogl].sort(), ogl);
  // The label: the official number for the regulation's own drawings, the name only for the approximate ones.
  const label = (x, l) => MT.signs.label(x, null, l);
  assert.equal(label({ k: "oneway" }, "IP 4b Jednosměrný provoz"), "II.A4 Jednosměrný provoz", "číslo i bez x.dir");
  assert.equal(label({ k: "b29" }, "B 29 Zákaz stání"), "II.D6 Zákaz stání");
  assert.equal(label({ k: "ip20a" }, "IP 20a Vyhrazený jízdní pruh BUS"), "Vyhrazený jízdní pruh BUS", "II.E11 je přibližná kresba");
  assert.equal(label({ k: "zona30" }, "IZ 8a Zóna 30"), "Zóna 30");
  // The law of parking: DC15's 4.1 m to pass, at least MIN_LANE (2.5 m) a lane OSM counts.
  assert.equal(MT.lawNeed(false, 2, 2.5), 5);
  assert.equal(MT.lawNeed(false, 4, 2.5), 10, "čtyři pruhy po 2,5 m");
  assert.equal(MT.lawNeed(true, 1, 2.5), 3);
  assert.equal(MT.lawNeed(false, 1, 1.5), 4.1, "DC15: dvě auta se minou na 4,1 m");
  // Norms: Access for All's 1.2 m only orange (guidance for an accessible route).
  assert.deepEqual([MT.limits({ type: "chodnik" }).min, MT.limits({ type: "chodnik" }).zaklad], [0, 1.2]);
  assert.equal(MT.limits({ type: "pruh" }), null);
});

test("Malta: stát podle hranic (Malta, Gozo, Comino)", async () => {
  const C = await import("../pilot/public/city.js");
  C.loadBounds(JSON.parse(fs.readFileSync(new URL("../pilot/public/mesta.json", import.meta.url), "utf8")));
  C.loadStates(JSON.parse(fs.readFileSync(new URL("../pilot/public/staty.json", import.meta.url), "utf8")));
  assert.equal(C.cityAt(35.8989, 14.5146), "malta"); // Valletta
  assert.equal(C.cityAt(36.0443, 14.2397), "malta"); // Victoria, Gozo
  assert.equal(C.cityAt(36.0128, 14.3368), "malta"); // Comino
  assert.equal(C.countryOfCity("malta").code, "MT");
});

// The whole profile with the state malta (review of 23. 11. 2026, finding 4): a measured roadway, the parking estimate.
test("Malta: odhad stání podle zákona nechává pruhy aspoň 2,5 m a stání vlevo", async () => {
  const C = await import("../pilot/public/city.js");
  const { localFrame, deriveProfile, mtvuPolygons } = await import("../pilot/public/derive.js");
  const was = C.city.id;
  C.setCity("malta");
  const cut = (tags, road) => {
    const frame = localFrame(35.9, 14.5);
    const rect = (x0, x1, code) => ({ attributes: { CTVUK_KOD: code }, geometry: { rings: [[[x0, -60], [x1, -60], [x1, 60], [x0, 60], [x0, -60]].map(([x, y]) => frame.toLonLat(x, y))] } });
    const polys = mtvuPolygons({ features: [rect(-road / 2 - 3, -road / 2, 702), rect(-road / 2, road / 2, 701), rect(road / 2, road / 2 + 3, 702)] }, frame);
    const geometry = [frame.toLonLat(0, -100), frame.toLonLat(0, 100)].map(([lon, lat]) => ({ lat, lon }));
    const way = { type: "way", id: 1, tags, geometry };
    return deriveProfile({ center: [0, 0], dir: [0, 1], half: 40, polys, osm: { elements: [way] }, frame, way }).segments;
  };
  const kinds = (segs) => segs.map((x) => x.type + (x.dir ? (x.dir === "forward" ? "↑" : "↓") : "")).join(" | ");
  try {
    assert.equal(C.country.code, "MT");
    const four = cut({ highway: "residential", lanes: "4" }, 12);
    assert.ok(four.filter((x) => x.type === "pruh").every((x) => x.width >= 2.5 - 1e-6), "žádné pruhy po 2 m");
    assert.equal(kinds(cut({ highway: "residential" }, 6.1)), "chodnik | pruh↑ | pruh↓ | chodnik", "6,1 m: na stání nezbývá");
    assert.equal(kinds(cut({ highway: "residential", oneway: "yes" }, 5.5)), "chodnik | parkovani | pruh↑ | chodnik", "jednosměrka: stání u levé obruby");
  } finally { C.setCity(was); }
});
