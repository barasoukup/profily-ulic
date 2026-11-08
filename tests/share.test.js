import { test } from "node:test";
import assert from "node:assert/strict";
import { packProfile, unpackProfile, designParams } from "../pilot/public/share.js";

test("návrh projde odkazem beze změny (bez údajů o budovách)", async () => {
  const p = {
    segments: [{ type: "chodnik", width: 3.75, source: "dtm" }, { type: "cyklopruh", width: 1.5, dir: "forward", source: "user" }, { type: "pruh", width: 3, turn: "left|through" }],
    edges: { left: "budova", right: "zelen", leftStyle: "funkce", leftInfo: { levels: 5 } },
  };
  const text = await packProfile(p);
  assert.match(text, /^[A-Za-z0-9_-]+$/);
  const back = await unpackProfile(text);
  assert.deepEqual(back.segments, p.segments);
  assert.deepEqual(back.edges, { left: "budova", right: "zelen", leftStyle: "funkce" });
});

test("parametry návrhu z adresy", () => {
  assert.deepEqual(designParams("#rez=50.1,14.4,10,22.0,22.0&navrh=abc&stav=def"), { navrh: "abc", stav: "def" });
  assert.deepEqual(designParams("#rez=50.1,14.4,10,22.0,22.0"), { navrh: null, stav: null });
});
