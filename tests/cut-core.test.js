// The core of a cut runs in Node (code-health plan, step 13b, 28. 11. 2026): two recorded cuts of the Czech sample (an
// estimate from the orthophoto and the kerb model in Hradec Králové, the city's own map in Jihlava) played by the replay
// in Node over their recorded answers (tests/fixtures/cut-core, made by evaluation/replay/fixture.mjs) give the profile,
// the cut, the credits and the status line they gave when the fixture was made, the same as the page's replay.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { startPlayer, FIELDS } from "../evaluation/replay/node-player.mjs";

const DIR = new URL("./fixtures/cut-core/", import.meta.url).pathname;
const expected = JSON.parse(fs.readFileSync(`${DIR}expected.json`, "utf8"));
const { play } = await startPlayer({ data: DIR, search: "lang=cs&osm=balik", canvases: false });
const fields = (o) => Object.fromEntries(FIELDS.filter((k) => k in o).map((k) => [k, o[k]]));

for (const { point, name, out } of expected) {
  test(`recorded cut ${name} (${point.town}) gives its profile again`, async () => {
    const got = await play(point, name);
    assert.deepEqual(fields(JSON.parse(JSON.stringify(got))), fields(out));
  });
}
