// Portugal (Bára 23. 11. 2026): DGT's orthophotos one after another, the signs (countries/PT.js), the state by its
// border. No network.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

test("Portugalsko: ortofota DGT (2025, 2021, 2018, satelit 2023) v EPSG:3857", async () => {
  const L = await import("../app/public/lanes-ortho.js");
  assert.deepEqual(Object.keys(L.PT_ORTHO), ["pt-25", "pt-21", "pt-18", "pt-sat"]);
  const u = new URL(L.PT_ORTHO["pt-25"]([1, 2, 3, 4], 100, 100));
  assert.equal(u.searchParams.get("LAYERS"), "Ortos2025-RGB");
  assert.equal(u.searchParams.get("CRS"), "EPSG:3857");
  // Madeira and the Azores: DGT has no photo there, nothing is asked (the review of 23. 11. 2026).
  const { localFrame } = await import("../app/public/derive.js");
  for (const [lat, lon] of [[32.65, -16.91], [37.74, -25.68]])
    assert.equal(await L.laneImage({ source: "pt", frame: localFrame(lat, lon), dir: [1, 0], t0: -10, t1: 10 }), null, `${lat},${lon}`);
  const real = globalThis.fetch;
  globalThis.fetch = () => { throw new Error("no request off the mainland"); };
  try { assert.equal(await L.orthoPatch({ source: "pt", lon: -16.91, lat: 32.65, half: 10, px: 64 }), null); } finally { globalThis.fetch = real; }
});

test("Portugalsko: značky (H3 / C1 podle směru, C13, zóny)", async () => {
  const { COUNTRIES } = await import("../app/public/countries/index.js");
  const PT = COUNTRIES.PT, f = PT.signs.file;
  assert.equal(f({ k: "oneway", dir: "forward" }), "H3");
  assert.equal(f({ k: "oneway", dir: "backward" }), "C1");
  assert.equal(f({ k: "oneway", dir: "backward", plate: "protismer" }), "C1-plus-10e");
  assert.equal(f({ k: "b20a", v: 30 }), "C13-30");
  assert.equal(f({ k: "ztp" }), null);
  for (const k of ["b1", "b11", "b8", "b30", "b28", "b29", "ip11a", "ip14a", "ip15a", "ip20a", "zona30", "ip26a", "sdilena", "ip27a", "c8a", "c9a", "c10a", "c7a"]) {
    const file = f({ k });
    assert.ok(file && fs.existsSync(new URL(`../app/public/signs-PT/${file}.svg`, import.meta.url)), `${k}: ${file}`);
  }
  for (const file of ["H3", "C1", "C1-plus-10e", ...[10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120].map((v) => `C13-${v}`)])
    assert.ok(fs.existsSync(new URL(`../app/public/signs-PT/${file}.svg`, import.meta.url)), file);
  assert.equal(PT.limits({ type: "chodnik", width: 1 }, []).min, 1.5);
  // A cycle lane beside parallel parking: IMT's 2.2 m at least (the review of 23. 11. 2026), elsewhere 1.2 m.
  const lane = { type: "cyklopruh", width: 1.5 };
  assert.equal(PT.limits(lane, [{ type: "pruh" }, lane], 1).min, 1.2);
  assert.deepEqual([PT.limits(lane, [{ type: "parkovani" }, lane], 1).min, PT.limits(lane, [lane, { type: "parkovani", orient: "podelne" }], 0).zaklad], [2.2, 2.5]);
  assert.equal(PT.limits(lane, [{ type: "parkovani", orient: "kolme" }, lane], 1).min, 1.2);
  for (const f of ["M12a", "M12b", "G4-40"]) assert.ok(!fs.existsSync(new URL(`../app/public/signs-PT/${f}.svg`, import.meta.url)), `${f}: nekreslí se`);
});

test("Portugalsko: stát podle hranic (Madeira, Azory)", async () => {
  const C = await import("../app/public/city.js");
  C.loadBounds(JSON.parse(fs.readFileSync(new URL("../app/public/towns.json", import.meta.url), "utf8")));
  C.loadStates(JSON.parse(fs.readFileSync(new URL("../app/public/states.json", import.meta.url), "utf8")));
  assert.equal(C.cityAt(38.7223, -9.1393), "portugal"); // Lisboa
  assert.equal(C.cityAt(41.1579, -8.6291), "portugal"); // Porto
  assert.equal(C.cityAt(32.6496, -16.9086), "portugal"); // Funchal
  assert.equal(C.cityAt(37.7412, -25.6756), "portugal"); // Ponta Delgada
  assert.equal(C.cityAt(42.2406, -8.7207), "spain"); // Vigo, across the Minho
  assert.equal(C.countryOfCity("portugal").code, "PT");
});
