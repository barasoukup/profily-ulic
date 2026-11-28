// The control set of the measurements (evaluation/lib/control.mjs, code-health plan step 19) on two recorded cuts: played in
// Node over their recorded answers (tests/fixtures/cut-core) it gives no change, and a switch that changes one of them shows
// as exactly that cut with the fields that changed.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { checkControl, formatCheck } from "../evaluation/lib/control.mjs";

const DIR = new URL("./fixtures/cut-core/", import.meta.url).pathname;
const control = JSON.parse(fs.readFileSync(`${DIR}control.json`, "utf8"));

test("control set: two recorded cuts give 0 changes", async () => {
  const res = await checkControl({ control, data: DIR });
  assert.equal(res.total, 2);
  assert.deepEqual(res.changed, []);
  assert.match(formatCheck(res), /0 změn, OK/);
});

test("control set: an expected value that no longer holds is a changed cut", async () => {
  const worse = structuredClone(control);
  worse.cuts[1].hash.stav = "0000000000"; // as if the profile of the second cut were another
  worse.cuts[1].parts = "pruh 3";
  const res = await checkControl({ control: worse, data: DIR });
  assert.equal(res.changed.length, 1);
  assert.equal(res.changed[0].name, worse.cuts[1].name);
  assert.deepEqual(res.changed[0].fields, ["stav"]);
  assert.equal(res.changed[0].before.parts, "pruh 3");
  assert.match(formatCheck(res), new RegExp(`${worse.cuts[1].name}.*stav`));
});
