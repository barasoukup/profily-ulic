// The registry of orthophotos (docs/code-health-plan.md step 15) did not change what the app asks: at about 70 places in every state with
// an orthophoto and on the edges (borders, Bolzano and Lombardy, Bornholm, DC and its neighbour, Toronto, Madeira without one, Melilla,
// Helsinki / Espoo) the code before it (main d3629230) and the registry give the same answer to "is there an orthophoto", the same URLs
// in the same order for laneImage and orthoPatch (404 everywhere, the first one answering, a PNG for Node's evaluation, a timeout given)
// and the same layers of the base map (order, URL, credit, bounds, the URL each layer asks for the tile of every place). The fixture
// is the old code's answers (tests/helpers/ortho-snapshot.js; every source at every place, ways of asking only where it has a photo here).
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import zlib from "node:zlib";
import { fileURLToPath } from "node:url";
import { snapshotImages, snapshotMap, POINTS } from "./helpers/ortho-snapshot.js";

const PUB = fileURLToPath(new URL("../app/public", import.meta.url));
const fixture = JSON.parse(zlib.gunzipSync(fs.readFileSync(new URL("./fixtures/ortho-points.json.gz", import.meta.url))));
// Numbers to 12 significant digits, in values and inside URLs: Linux's and macOS's Math differ in the last bit (CI 28. 11. 2026:
// a bbox 6465484.948097781 against …834), the fixture was made on a Mac; a real change of what is asked moves far more.
const round = (n) => Number(Number(n).toPrecision(12));
const steady = (v) => typeof v === "number" ? round(v)
  : typeof v === "string" ? v.replace(/-?\d+\.\d{7,}(e-?\d+)?/g, (m) => String(round(m)))
  : Array.isArray(v) ? v.map(steady)
  : v && typeof v === "object" ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, steady(x)])) : v;

test("ortofota: kde je a co se ptá, na 70 místech jako před registrem", async () => {
  const now = await snapshotImages(PUB);
  assert.equal(Object.keys(now.here).length, POINTS.length);
  assert.deepEqual(steady(now.here), steady(fixture.images.here));
  for (const [place, row] of Object.entries(now.ask)) for (const [source, ways] of Object.entries(row)) for (const [how, got] of Object.entries(ways)) {
    assert.deepEqual(steady(got), steady(fixture.images.ask[place][source][how]), `${place}, zdroj ${source}, ${how}`);
  }
});

test("mapa: vrstvy ortofot (pořadí, adresy, kredity, hranice, dlaždice) jako před registrem", async () => {
  const now = await snapshotMap(PUB);
  assert.equal(now.length, fixture.map.length);
  now.forEach((layer, i) => assert.deepEqual(steady(layer), steady(fixture.map[i]), `vrstva ${i}: ${layer.attribution ?? layer.cityAttribution}`));
});
