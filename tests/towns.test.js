// The towns as modules (towns/index.js TOWNS; the shape is types.js Town and Source), as tests/countries.test.js holds the
// states: every module exports what towns/index.js, sources.js, app.js and tools/build_coverage.mjs expect of it, in the
// shape they expect, so a new town's module that forgets a part fails here and not in the browser on a click.
import "../app/public/america.js"; // the towns of North America (late.js)
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { TOWNS } from "../app/public/towns/index.js";
import { CITY_IDS } from "../app/public/city.js";

const DIR = new URL("../app/public/towns/", import.meta.url);
const SOURCES = ["osm", "surfaces", "lines", "parking", "podlaznost"];
// The module of each id once (a module may serve several towns: czechia.js, switzerland.js).
const MODULES = [...new Map(Object.entries(TOWNS).map(([id, m]) => [m, id])).entries()].map(([m, id]) => [id, m]);

// Prague and Brno ask their services in sources.js itself (isBrno, IPR), they have no module.
test("moduly měst: každé město z city.js má modul (kromě Prahy a Brna)", () => {
  assert.deepEqual(CITY_IDS.filter((id) => !TOWNS[id] && !["praha", "brno"].includes(id)), []);
});

test("moduly měst: sources má pět funkcí, které sources.js a app.js volají", () => {
  assert.ok(MODULES.length > 30);
  for (const [id, m] of MODULES) {
    assert.ok(m.sources && typeof m.sources === "object", `${id}: sources`);
    for (const k of SOURCES) assert.equal(typeof m.sources[k], "function", `${id}: sources.${k}`);
  }
});

test("moduly měst: SURFACE_MAPS (mapa pokrytí), ortho, national, AREAS a maps mají svůj tvar", () => {
  for (const [id, m] of MODULES) {
    assert.ok(Array.isArray(m.SURFACE_MAPS) && m.SURFACE_MAPS.every((x) => typeof x === "string"), `${id}: SURFACE_MAPS`);
    assert.ok("ortho" in m, `${id}: ortho (null, když město vlastní ortofoto nemá)`);
    if (m.ortho !== null) {
      assert.equal(typeof m.ortho.service, "string", `${id}: ortho.service`);
      if ("datum" in m.ortho) assert.equal(typeof m.ortho.datum, "number", `${id}: ortho.datum`);
    }
    if ("national" in m) assert.equal(typeof m.national, "boolean", `${id}: national`);
    if ("maps" in m) assert.equal(typeof m.maps, "function", `${id}: maps`);
    for (const [area, a] of Object.entries(m.AREAS || {})) {
      const [w, s, e, n] = a.box;
      assert.ok([w, s, e, n].every(Number.isFinite) && w < e && s < n && w >= -180 && e <= 180 && s >= -90 && n <= 90, `${id}: AREAS.${area}.box`);
    }
  }
});

test("moduly měst: každý soubor města se zdroji je v TOWNS (nezapomenutá registrace)", () => {
  const registered = new Set(MODULES.map(([, m]) => m));
  const files = fs.readdirSync(DIR).filter((f) => f.endsWith(".js") && /^export const sources\b/m.test(fs.readFileSync(new URL(f, DIR), "utf8")));
  assert.ok(files.length >= MODULES.length - 1);
  return Promise.all(files.map(async (f) => assert.ok(registered.has(await import(new URL(f, DIR))), `towns/${f} není v TOWNS`)));
});
