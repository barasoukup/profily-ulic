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

test("ortofota: kde je a co se ptá, na 70 místech jako před registrem", async () => {
  const now = await snapshotImages(PUB);
  assert.equal(Object.keys(now.here).length, POINTS.length);
  assert.deepEqual(now.here, fixture.images.here);
  for (const [place, row] of Object.entries(now.ask)) for (const [source, ways] of Object.entries(row)) for (const [how, got] of Object.entries(ways)) {
    assert.deepEqual(got, fixture.images.ask[place][source][how], `${place}, zdroj ${source}, ${how}`);
  }
});

test("mapa: vrstvy ortofot (pořadí, adresy, kredity, hranice, dlaždice) jako před registrem", async () => {
  const now = await snapshotMap(PUB);
  assert.equal(now.length, fixture.map.length);
  now.forEach((layer, i) => assert.deepEqual(layer, fixture.map[i], `vrstva ${i}: ${layer.attribution ?? layer.cityAttribution}`));
});
