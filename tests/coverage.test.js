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
  assert.equal(of("cesko"), "povrch");
  assert.equal(of("netherlands"), "povrch");
  assert.equal(of("wien"), "povrch");
  assert.equal(of("bratislava-pasport"), "povrch");
  assert.equal(of("lombardia"), "povrch");
  assert.equal(of("CH011"), "ortofoto", "Vaud bez úředního vyměřování");
  assert.equal(of("germany"), "ortofoto");
  assert.equal(of("lithuania"), "osm");
  assert.equal(of("vilnius"), "povrch");
  assert.equal(of("zvolen-pasport"), undefined, "Zvolen jen s ?zvolen=1");
  assert.equal(of("kobenhavn"), undefined, "Kodaň má jen čáry obrub");
  assert.deepEqual([...new Set(coverage.features.map((f) => f.properties.c))].sort(), ["ortofoto", "osm", "povrch"]);
});
