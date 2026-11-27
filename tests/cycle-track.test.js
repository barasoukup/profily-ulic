// A two-way cycle track by its whole width, and a track without a direction not held to the two-way rule (the reviews
// of 24. 11. 2026; countries/cycletrack.js, used by FI, DK, EE, LT and SI as Italy does it).
import { test } from "node:test";
import assert from "node:assert/strict";

const pair = (a, b) => [{ type: "cyklostezka", width: a, dir: "forward" }, { type: "cyklostezka", width: b, dir: "backward" }];
const warn = (L, segs, i) => { const l = L(segs[i], segs, i); return !l ? null : segs[i].width < l.min - 0.005 ? "min" : segs[i].width < l.zaklad - 0.005 ? "zaklad" : null; };

test("obousměrná stezka: celá šířka, ne polovina proti jednosměrné", async () => {
  const { COUNTRIES } = await import("../app/public/countries/index.js");
  const { FI, DK, EE, LT, SI } = COUNTRIES;
  // Finland: 2 × 1.28 m (hk10) is 2.56 m, enough for a two-way track on a local route (2.5 m, tab. 16); 2 × 1.2 m is not.
  assert.equal(warn(FI.limits, pair(1.28, 1.28), 0), null);
  assert.equal(warn(FI.limits, pair(1.28, 1.28), 1), null);
  assert.equal(warn(FI.limits, pair(1.2, 1.2), 0), "zaklad");
  assert.match(FI.limits(pair(1.2, 1.2)[0], pair(1.2, 1.2), 0).why, /2,40 m.*tab\. 16/);
  // The whole width, not each half: 1.0 + 1.6 m is 2.6 m.
  assert.equal(warn(FI.limits, pair(1, 1.6), 0), null);
  // Denmark: 2 × 1.2 m orange, never red (the circular is second hand).
  assert.equal(warn(DK.limits, pair(1.2, 1.2), 0), "zaklad");
  assert.equal(warn(DK.limits, pair(0.8, 0.8), 0), "zaklad");
  assert.equal(warn(DK.limits, pair(1.3, 1.3), 0), null);
  // Slovenia's rule is the regulation's (čl. 13): 3 m, at least 2 m, red below.
  assert.equal(warn(SI.limits, pair(1.6, 1.6), 0), null);
  assert.equal(warn(SI.limits, pair(1.2, 1.2), 0), "zaklad");
  assert.equal(warn(SI.limits, pair(0.9, 0.9), 0), "min");
  // Estonia and Lithuania: their one figure for the whole track.
  assert.equal(warn(EE.limits, pair(1.3, 1.3), 0), null);
  assert.equal(warn(EE.limits, pair(1.1, 1.1), 0), "zaklad");
  assert.equal(warn(LT.limits, pair(1.3, 1.3), 0), null);
  assert.equal(warn(LT.limits, pair(1.1, 1.1), 0), "zaklad");
});

test("stezka bez směru (jednosměrná z OSM, derive.js) nedostane obousměrné varování", async () => {
  const { COUNTRIES } = await import("../app/public/countries/index.js");
  const { FI, DK, SI } = COUNTRIES;
  // derive.js carveCycleways puts OSM's one-way track in with 2 m and no direction.
  const one = [{ type: "cyklopruh", width: 1.5 }, { type: "cyklostezka", width: 2 }];
  for (const [code, L] of [["FI", FI.limits], ["DK", DK.limits], ["SI", SI.limits]]) assert.equal(warn(L, one, 1), null, code);
  // The same as a one-way track with its direction.
  assert.deepEqual(DK.limits({ type: "cyklostezka", width: 2 }, [], 0), DK.limits({ type: "cyklostezka", width: 2, dir: "forward" }, [], 0));
  // Two one-way tracks of one direction side by side are no two-way track.
  const same = [{ type: "cyklostezka", width: 1.2, dir: "forward" }, { type: "cyklostezka", width: 1.2, dir: "forward" }];
  assert.equal(FI.limits(same[0], same, 0).zaklad, 1.5);
});
