// Plzeň's paid zones become parking strips along the curbs (towns/plzen.js): how many curbs a roadway gets.
import { test } from "node:test";
import assert from "node:assert/strict";

globalThis.PROFILY_CITY = "plzen";
const { zoneCurbs } = await import("../pilot/public/towns/plzen.js");

test("zóny Plzně: stání u obou obrubníků, jen u jednoho, nebo žádné", () => {
  // two-way: 5.0 m for traffic (2 × 2.5 m) plus 2.0 m per strip
  assert.equal(zoneCurbs(9.0, false), 2);
  assert.equal(zoneCurbs(8.9, false), 1);
  assert.equal(zoneCurbs(7.0, false), 1);
  assert.equal(zoneCurbs(6.9, false), 0);
  // one-way: 3.0 m for one lane
  assert.equal(zoneCurbs(7.0, true), 2);
  assert.equal(zoneCurbs(5.0, true), 1);
  assert.equal(zoneCurbs(4.9, true), 0);
});
