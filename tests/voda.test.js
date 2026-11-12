// Rainwater management in a design (Bára after Magdalena, 12. 11. 2026; Prague's Standardy hospodaření se
// srážkovými vodami, ch. 5.1): the parts, what lies under a part, permeable paving, and how they travel and count.
import { test } from "node:test";
import assert from "node:assert/strict";
import { TYPES, HDV_UNDER, UNDER_TYPES, PERMEABLE_TYPES, ITEMS } from "../pilot/public/types.js";
import { cleanProfile, retype } from "../pilot/public/validate.js";
import { packProfile, unpackProfile } from "../pilot/public/share.js";
import { shares } from "../pilot/public/shares.js";
import { toStreetmix } from "../pilot/public/streetmix.js";

const design = () => ({ segments: [
  { type: "chodnik", width: 2.5, permeable: true, under: "nadrz", items: [{ kind: "pristresek_zeleny", f: 0.5 }] },
  { type: "pruleh", width: 2, under: "ryha" },
  { type: "pruh", width: 3, dir: "forward" },
  { type: "ryha", width: 1 },
  { type: "nadrz", width: 4 },
], edges: {} });

test("každý prvek odkazuje na kapitolu standardů", () => {
  for (const k of ["pruleh", "ryha", "nadrz"]) assert.match(TYPES[k].hdv, /^5\.1\.\d+$/, k);
  for (const [k, u] of Object.entries(HDV_UNDER)) assert.match(u.hdv, /^5\.1\.\d+$/, k);
  assert.ok(ITEMS.pristresek_zeleny);
});

test("co pod povrchem a propustný povrch projde souborem i odkazem, nesmysly se zahodí", async () => {
  const p = cleanProfile(design(), "x");
  assert.equal(p.segments[0].under, "nadrz");
  assert.equal(p.segments[0].permeable, true);
  assert.equal(p.segments[0].items[0].kind, "pristresek_zeleny");
  const back = await unpackProfile(await packProfile(p));
  assert.deepEqual(back.segments.map((s) => [s.type, s.under, s.permeable]), p.segments.map((s) => [s.type, s.under, s.permeable]));
  // Unknown object, an object under a lane, permeable asphalt of a lane: dropped.
  const bad = cleanProfile({ segments: [{ type: "zelen", width: 2, under: "bazen" }, { type: "pruh", width: 3, under: "ryha", permeable: true }] }, "x");
  assert.deepEqual(bad.segments.map((s) => [s.under, s.permeable]), [[undefined, undefined], [undefined, undefined]]);
  assert.ok(!UNDER_TYPES.includes("pruh") && !PERMEABLE_TYPES.includes("pruh"));
});

test("změna typu odebere, co k novému typu nepatří", () => {
  const s = retype({ type: "chodnik", width: 2, under: "sachta", permeable: true }, "pruh");
  assert.equal(s.under, undefined);
  assert.equal(s.permeable, undefined);
  assert.equal(retype({ type: "zelen", width: 2, under: "ryha" }, "pruleh").under, "ryha", "průleh s rýhou (5.1.8)");
});

test("ve sdílení prostoru se počítají k zeleni, do Streetmixu jako zeleň", () => {
  const g = Object.fromEntries(shares(design()).map((x) => [x.key, x.m]));
  assert.equal(g.zelen, 7);
  const kinds = toStreetmix(design(), "x").data.street.segments.map((s) => s.type);
  assert.deepEqual(kinds.slice(1), ["divider", "drive-lane", "divider", "divider"]);
});
