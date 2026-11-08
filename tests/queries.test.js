import { test } from "node:test";
import assert from "node:assert/strict";
import { podlaznostInfo, parkingFields, LINE_WHERE } from "../pilot/public/queries.js";

test("podlažnost: plocha z Web Mercatoru se přepočte na zem", () => {
  const lat = 50;
  const json = { features: [{ attributes: { pocet_podlazi: 5, ustup_stres: 1, podlaz_celk: 6, strecha: 1, typ: 7, SHAPE__Area: 1000 } }] };
  const info = podlaznostInfo(json, lat);
  assert.equal(info.cornice, 5);
  assert.equal(info.roof, 1);
  assert.equal(info.area, Math.round(1000 * Math.cos((lat * Math.PI) / 180) ** 2));
});

test("podlažnost: bez budovy prázdný objekt", () => {
  assert.deepEqual(podlaznostInfo({ features: [] }, 50), {});
});

test("dotazy: pole parkování a kódy linií", () => {
  assert.equal(parkingFields(3), "ZPS_ID,TYPZONY,PS_ZPS");
  assert.equal(parkingFields("7"), "ZPS_ID");
  assert.match(LINE_WHERE, /^CTMTP_KOD IN \(55010,/);
});

test("podlažnost: nová budova podle IPR", () => {
  const info = (v) => podlaznostInfo({ features: [{ attributes: { pocet_podlazi: 5, nova_budova: v } }] }, 50).newBuild;
  assert.equal(info(1), true);
  assert.equal(info(2), false);
  assert.equal(info(null), false);
});
