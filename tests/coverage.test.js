// The overview map of the About dialog (tools/build_coverage.mjs, pilot/public/coverage.json; Bára 24. 11. 2026): every
// source module says where its surface map answers, every state's orthophoto is classified, every state of the app is on
// the map, and the file is what the build makes of the modules now (else: node tools/build_coverage.mjs).
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { buildCoverage, OUT, ORTHO_FULL, ORTHO_ONLY, ORTHO_BUT } from "../tools/build_coverage.mjs";
import { TOWNS } from "../pilot/public/towns/index.js";
import { COUNTRIES } from "../pilot/public/countries/index.js";

test("pokrytí: každý modul zdrojů a každé ortofoto je zařazené", () => {
  for (const [id, m] of Object.entries(TOWNS)) assert.ok(Array.isArray(m.SURFACE_MAPS), `towns: ${id} bez SURFACE_MAPS`);
  for (const [code, c] of Object.entries(COUNTRIES)) {
    assert.ok(c.laneOrtho === "none" || ORTHO_FULL.has(c.laneOrtho) || ORTHO_ONLY[c.laneOrtho] || ORTHO_BUT[c.laneOrtho], `${code}: ortofoto ${c.laneOrtho}`);
  }
});

test("pokrytí: coverage.json odpovídá modulům a je malý", async () => {
  const { coverage, problems } = await buildCoverage();
  assert.deepEqual(problems, []);
  const text = fs.readFileSync(OUT, "utf8");
  assert.ok(text === JSON.stringify(coverage), "coverage.json je zastaralý: node tools/build_coverage.mjs");
  assert.ok(text.length < 400_000, `${text.length} B`);
  const of = (id) => coverage.features.find((f) => f.properties.id === id)?.properties.c;
  // A few places by what the modules say.
  assert.equal(of("cesko"), "surface");
  assert.equal(of("netherlands"), "surface");
  assert.equal(of("wien"), "surface");
  assert.equal(of("bratislava-pasport"), "surface");
  assert.equal(of("lombardia"), "surface");
  assert.equal(of("CH011"), "ortho", "Vaud bez úředního vyměřování");
  assert.equal(of("germany"), "ortho");
  assert.equal(of("lithuania"), "osm");
  assert.equal(of("vilnius"), undefined, "Vilnius jen s ?vilnius=1");
  assert.equal(of("zvolen-pasport"), undefined, "Zvolen jen s ?zvolen=1");
  assert.equal(of("kobenhavn"), undefined, "Kodaň má jen čáry obrub");
  assert.deepEqual([...new Set(coverage.features.map((f) => f.properties.c))].sort(), ["ortho", "osm", "surface"]);
});

// What the map says, checked against the modules rather than the file (the review of 24. 11. 2026: a snapshot does not
// tell whether it is true). The class at a point is the last feature drawn over it, rings read even-odd.
const inRings = (rings, x, y) => {
  let c = false;
  for (const r of rings) for (let i = 0, j = r.length - 1; i < r.length; j = i++) {
    const [xi, yi] = r[i], [xj, yj] = r[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
};
const km2 = (r) => { let a = 0; const k = Math.cos((r[0][1] * Math.PI) / 180) * 111.32 * 110.57; for (let i = 0, j = r.length - 1; i < r.length; j = i++) a += (r[j][0] - r[i][0]) * (r[j][1] + r[i][1]); return Math.abs(a / 2) * k; };

test("pokrytí: každá třída má plochu, každý modul je zařazený, města mají skutečné hranice", async () => {
  const { coverage } = await buildCoverage();
  const classAt = (lon, lat) => coverage.features.filter((f) => inRings(f.geometry.coordinates, lon, lat)).at(-1)?.properties.c;
  // Every class has an area worth seeing.
  for (const c of ["surface", "ortho", "osm"]) {
    const a = coverage.features.filter((f) => f.properties.c === c).reduce((s, f) => s + f.geometry.coordinates.reduce((t, r) => t + km2(r), 0), 0);
    assert.ok(a > 5000, `${c}: ${a} km²`);
  }
  // Every module of towns/index.js is on the map: its state or city under some class, and each of its surface maps as
  // a surface map unless its state is one already.
  const { cityById } = await import("../pilot/public/city.js");
  const ids = new Set(coverage.features.map((f) => f.properties.id));
  const stateIds = new Set(coverage.features.filter((f) => /^[a-z]+$/.test(f.properties.id)).map((f) => f.properties.id));
  for (const [id, m] of Object.entries(TOWNS)) {
    const state = stateIds.has(id) ? id : cityById(id).like || "cesko";
    assert.ok(stateIds.has(state), `${id}: stát ${state} bez třídy`);
    const full = coverage.features.find((f) => f.properties.id === state)?.properties.c === "surface";
    for (const e of m.SURFACE_MAPS) if (!e.startsWith("-") && e !== "all" && !full) assert.ok(ids.has(e), `${id}: ${e} chybí v mapě`);
  }
  // Places by what the app does there.
  const at = [
    [14.42, 50.08, "surface", "Praha"], [9.19, 45.46, "surface", "Milán (DBT)"], [25.28, 54.69, "osm", "Vilnius bez mapy"],
    [11.58, 48.14, "ortho", "Mnichov"], [23.76, 61.50, "osm", "Tampere"], [23.90, 54.90, "osm", "Kaunas"], [11.35, 46.50, "ortho", "Bolzano"], [24.94, 60.17, "surface", "Helsinky"],
    [24.66, 60.21, "ortho", "Espoo"], [17.11, 48.15, "surface", "Bratislava"], [13.40, 52.52, "surface", "Berlín"],
    // Inside the towns' boxes but outside the towns: their maps have nothing there (the boxes were drawn before).
    [13.24, 52.40, "ortho", "Kleinmachnow (u Berlína)"], [2.24, 48.835, "ortho", "Boulogne-Billancourt (u Paříže)"],
    [19.85, 50.10, "ortho", "Zabierzów (u Krakova)"], [10.51, 46.26, "surface", "Ponte di Legno (Lombardie)"],
  ];
  for (const [lon, lat, c, name] of at) assert.equal(classAt(lon, lat), c, name);
});

