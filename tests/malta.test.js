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
  assert.equal(f({ k: "oneway", dir: "forward" }), "UK-652");
  assert.equal(f({ k: "oneway", dir: "backward", plate: "protismer" }), "II.A4-plus-cycles");
  assert.equal(f({ k: "ip14a" }), null, "Malta dálnici nemá");
  for (const k of ["b1", "b11", "b8", "b30", "b28", "b29", "ip11a", "ip20a", "zona30", "ip27a", "c8a", "c9a", "c10a"]) {
    const file = f({ k });
    assert.ok(file && fs.existsSync(new URL(`../pilot/public/signs-MT/${file}.svg`, import.meta.url)), `${k}: ${file}`);
  }
  for (const v of [10, 20, 30, 40, 50, 60, 70, 80]) assert.ok(fs.existsSync(new URL(`../pilot/public/signs-MT/II.D1-${v}.svg`, import.meta.url)), `${v}`);
  assert.equal(MT.lawNeed(false, 2), 4.1, "DC15: dvě auta se minou na 4,1 m");
  assert.equal(MT.lawNeed(true, 1), 3);
  assert.equal(MT.limits({ type: "chodnik" }).min, 1.2);
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
