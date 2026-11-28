// The states as modules (docs/architecture-countries.md): no condition on a state outside countries/, and a state other
// than Czechia says its own law of parking, orthophotos, panorama, signs and norms (else it would take the Czech ones of
// countries/default.js without anyone deciding so; the review of the rebuild, 16. 11. 2026).
import "../app/public/america.js"; // the states of North America (late.js)
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { PUBLIC, moduleFiles } from "./helpers/files.js";

const DIR = PUBLIC;
const FILES = moduleFiles({ dirs: ["towns"], noLangs: true });

test("mimo countries/ žádná podmínka na stát", () => {
  const bad = [];
  const RX = /country\s*[!=]==\s*"[A-Z]{2}"|\[\s*"[A-Z]{2}"\s*,\s*"[A-Z]{2}"[^\]]*\]\.includes|city\.country\s*\|\|\s*"CZ"|\.id\s*[!=]==\s*"(slovensko|austria|cizina)"|\["slovensko",\s*"austria"\]/;
  for (const f of FILES) fs.readFileSync(new URL(f, DIR), "utf8").split("\n").forEach((line, i) => { if (!/^\s*\/\//.test(line) && RX.test(line)) bad.push(`${f}:${i + 1}`); });
  assert.deepEqual(bad, []);
});

test("každý stát kromě Česka uvádí vlastní zákon o stání, ortofoto, panorama, značky a normy", async () => {
  const { COUNTRIES } = await import("../app/public/countries/index.js");
  const OWN = ["halfKerbNote", "parkGuess", "laneOrtho", "bedOrtho", "panorama", "signs", "limits", "contraflow", "tramBelt", "bounds"];
  for (const [code, mod] of Object.entries(COUNTRIES)) {
    if (code === "CZ") continue;
    const src = fs.readFileSync(new URL(`countries/${code}.js`, DIR), "utf8");
    const body = src.slice(src.indexOf("export default"));
    for (const k of OWN) assert.match(body, new RegExp(`\\b${k}\\b`), `${code}: ${k}`);
    assert.equal(mod.code, code);
  }
});
