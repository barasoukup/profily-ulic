import test from "node:test";
import assert from "node:assert/strict";
import { floorsFromHeight as f, floorsOld, refloor, heightHouse } from "../pilot/public/floors.js";

test("Podlaží z výšky: patrový dům od 6 m, střecha známého tvaru, haly bez podlaží", () => {
  assert.deepEqual([5, 5.9, 6, 6.8, 8, 11, 25, 40].map((h) => f(h)), [1, 1, 2, 2, 2, 3, 7, 12]);
  assert.equal(f(1), undefined);
  assert.equal(f(20.9, { type: "train_station" }), undefined);
  assert.equal(f(4.5, { type: "warehouse" }), 1);
  assert.equal(f(6.6, { roofShape: "gabled" }), 1);
  assert.equal(f(10.9, { roofShape: "gabled" }), 2);
  assert.equal(f(6.6, { roofShape: "flat" }), 2);
  assert.equal(f(10.9, { pitched: true }), 2);
});
test("Podlaží z výšky: ?off=floorsh vrací dřívější pravidlo", () => {
  globalThis.PROFILY_CA = { off: "floorsh" };
  try {
    assert.equal(f(6.5), floorsOld(6.5));
    assert.equal(f(6.5), 1);
    assert.equal(f(20.9, { type: "train_station" }), 6);
    const p = heightHouse(20.9);
    assert.equal(refloor(p, { type: "train_station" }), p);
  } finally { delete globalThis.PROFILY_CA; }
});
test("Podlaží z výšky: odpověď města se přepočítá podle budovy", () => {
  const p = heightHouse(20.9, { caHouse: true });
  assert.deepEqual([p.cornice, p.hm, p.fromHeight], [6, 20.9, true]);
  assert.deepEqual(refloor(p, { type: "train_station" }), { ...p, cornice: undefined, total: undefined, fromHeight: false });
  assert.equal(refloor(p, { type: "house" }).cornice, 6);
  assert.equal(refloor(heightHouse(10.9), { roofShape: "gabled" }).cornice, 2);
  assert.equal(refloor(null, {}), null);
  assert.deepEqual(heightHouse(1), {});
});
