// Three trims of 26. 11. 2026 (Bára): the strip of paving at the facade beside a surface map's sidewalk
// (ortho-osm.js facadeStrip), the roadways the DTM only guesses around a Czech town's passport roadway
// (towns/overlay.js trimGuessedRoads) and Paris's private blocks as the end of the public way (towns/france.js
// parisBlocks). No network.
import { test } from "node:test";
import assert from "node:assert/strict";

test("Proužek plochy do 1,5 m u fasády za chodníkem je chodník (facadeStrip)", async () => {
  const { facadeStrip } = await import("../pilot/public/ortho-osm.js");
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
