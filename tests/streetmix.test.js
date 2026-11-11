import { test } from "node:test";
import assert from "node:assert/strict";
import { toStreetmix } from "../pilot/public/streetmix.js";

const profile = {
  segments: [
    { type: "chodnik", width: 2.5 }, { type: "parkovani", width: 2 }, { type: "pruh", width: 3, dir: "forward" },
    { type: "pruh", width: 3, dir: "backward" }, { type: "chodnik", width: 2.5 },
  ],
  edges: { left: "budova", right: "budova" },
};

test("export do Streetmixu zachová šířku ulice", () => {
  const { data } = toStreetmix(profile, "Testovací");
  assert.equal(data.street.width, 13);
  assert.equal(data.street.segments.length, 5);
  assert.ok(data.street.segments.every((s) => typeof s.type === "string" && s.width > 0));
});

test("veřejná ulice ve Streetmixu nese uvedení zdrojů", () => {
  const { name } = toStreetmix(profile, "Testovací");
  assert.match(name, /^Testovací /);
  assert.match(name, /IPR Praha/);
  assert.match(name, /OpenStreetMap/);
});

test("tramvajové těleso v trávě jde do Streetmixu jako tramvaj na trávě, ostatní na barevném pásu", () => {
  const segs = (bed) => toStreetmix({ segments: [{ type: "tramvaj", width: 3.5, dir: "forward", bed }, { type: "tramvaj", width: 3.5, dir: "backward", bed }] }, "T").data.street.segments;
  assert.deepEqual(segs("trava").map((s) => s.variantString), ["outbound|grass", "inbound|grass"]);
  assert.deepEqual(segs("panely").map((s) => s.variantString), ["outbound|colored", "inbound|colored"]);
});
