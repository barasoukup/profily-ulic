// Three trims of 26. 11. 2026 (Bára): the strip of paving at the facade beside a surface map's sidewalk
// (ortho-osm.js facadeStrip), the roadways the DTM only guesses around a Czech town's passport roadway
// (towns/overlay.js trimGuessedRoads) and Paris's private blocks as the end of the public way (towns/france.js
// parisBlocks). No network.
import { test } from "node:test";
import assert from "node:assert/strict";

test("Proužek plochy do 1,5 m u fasády za chodníkem je chodník (facadeStrip)", async () => {
  const { facadeStrip } = await import("../app/public/ortho-osm.js");
  const piece = (code, s, e) => ({ code, label: "x", span: [s, e], rings: [[[s, 0]]] });
  // Side B (sg 1): the map's sidewalk up to 5 m (at), a strip of paving 5–5.65 m, the house at 5.65.
  const at = (t) => (t > 2 && t < 5 ? 702 : null);
  let out = [piece(1003, 5, 5.65)];
  facadeStrip(out, 0, 5.65, 1, at);
  assert.equal(out[0].code, 702);
  // Wider than 1.5 m, not at the house, or no sidewalk inside of it: unchanged.
  for (const [p, to, a] of [[piece(1003, 5, 6.8), 6.8, at], [piece(1003, 5, 5.65), 9, at], [piece(1003, 5, 5.65), 5.65, () => 701], [piece(401, 5, 5.65), 5.65, at]]) {
    out = [p];
    facadeStrip(out, 0, to, 1, a);
    assert.equal(out[0].code, p.code);
  }
  // Side A (sg −1), the sidewalk a piece of the same side before it.
  out = [piece(702, -4, -2), piece(1003, -4.8, -4)];
  facadeStrip(out, 0, -4.8, -1, () => null);
  assert.equal(out[1].code, 702);
});

test("Pasport: odhadnuté vozovky DTM kolem vozovky pasportu pod středem řezu (trimGuessedRoads), ?orez=0", async () => {
  const { trimGuessedRoads } = await import("../app/public/towns/overlay.js");
  const sq = (x0, x1) => ({ rings: [[[x0, -1], [x1, -1], [x1, 1], [x0, 1], [x0, -1]]] });
  const own = { features: [{ attributes: { CTVUK_KOD: 701, PASPORT: 1 }, geometry: sq(-0.5, 0.5) }] };
  const dtm = { region: "r", features: [
    { attributes: { CTVUK_KOD: 701, ODHAD: 1 }, geometry: sq(-3, 3) },
    { attributes: { CTVUK_KOD: 701, ODHAD: 1, ROAD_PARCEL: 1 }, geometry: sq(-5, 5) },
    { attributes: { CTVUK_KOD: 701, ODHAD: 0 }, geometry: sq(5, 9) },
    { attributes: { CTVUK_KOD: 401, ODHAD: 1 }, geometry: sq(-9, -5) },
  ] };
  const got = trimGuessedRoads(own, dtm, "-1,-1,1,1");
  assert.equal(got.region, "r");
  assert.deepEqual(got.features.map((f) => f.attributes.CTVUK_KOD), [401, 701, 401], "barva bez typu pryč, parcela silnice zeleň, změřená vozovka zůstává");
  assert.equal(trimGuessedRoads(own, dtm, "4,-1,6,1"), dtm, "pasport nemá vozovku pod středem: beze změny");
  globalThis.PROFILY_OPTS = { orez: "0" };
  try { assert.equal(trimGuessedRoads(own, dtm, "-1,-1,1,1"), dtm); } finally { delete globalThis.PROFILY_OPTS; }
});

test("Paříž: soukromé bloky Plan de voirie jako domy (parisBlocks)", async () => {
  const F = await import("../app/public/towns/france.js");
  const sq = { geometry: { type: "Polygon", coordinates: [[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]] } };
  const got = F.parisBlocks([{ geo_shape: sq }, { geo_shape: null }]);
  assert.equal(got.length, 1);
  assert.equal(got[0].attributes.CTVUK_KOD, 601);
  assert.equal(F.PARIS_BLOCKS, "plan-de-voirie-emprises-ilots-prives");
});
