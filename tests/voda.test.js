// Rainwater management in a design (Bára after Magdalena, 12. 11. 2026; Prague's Standardy hospodaření se
// srážkovými vodami, ch. 5.1): the parts, what lies under a part, permeable paving, and how they travel and count.
import { test } from "node:test";
import assert from "node:assert/strict";
import { TYPES, HDV_UNDER, UNDER_TYPES, PERMEABLE_TYPES, ITEMS, underSize } from "../pilot/public/types.js";
import { checkUnder } from "../pilot/public/rules.js";
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
  // Unpaved is a surface of its own; another word is dropped.
  const u = cleanProfile({ segments: [{ type: "cyklostezka", width: 2.5, dir: "forward", permeable: "nezpevneny" }, { type: "chodnik", width: 2, permeable: "asfalt" }] }, "x");
  assert.deepEqual(u.segments.map((s) => s.permeable), ["nezpevneny", undefined]);
  assert.equal((await unpackProfile(await packProfile(u))).segments[0].permeable, "nezpevneny");
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

test("rozměr objektu pod povrchem: výchozí, vlastní, nejvýš šířka části; projde odkazem, nesmysl se zahodí", async () => {
  assert.deepEqual(underSize({ under: "ryha", width: 3 }), { w: 1.5, top: 0.4, h: 1 });
  assert.equal(underSize({ under: "nadrz", width: 4 }).w, 3.4); // the part less 0.3 m a side
  assert.equal(underSize({ under: "ryha", width: 1 }).w, 0.8); // never wider than the part
  assert.deepEqual(underSize({ under: "sachta", width: 3, underSize: { top: 1.2 } }), { w: 1, top: 1.2, h: 2.5 });
  const p = { segments: [{ type: "chodnik", width: 3, under: "ryha", underSize: { w: 2, h: 1.2 } }, { type: "zelen", width: 2, underSize: { w: 1 } }, { type: "chodnik", width: 2, under: "nadrz", underSize: { h: "x" } }], edges: {} };
  const back = cleanProfile(await unpackProfile(await packProfile(p)));
  assert.deepEqual(back.segments[0].underSize, { w: 2, h: 1.2 });
  assert.equal(back.segments[1].underSize, undefined); // nothing under it
  assert.equal(back.segments[2].underSize, undefined);
});

test("střet objektu pod povrchem se sítí: jen když se překrývají", () => {
  const kinds = { vodovod: { label: "vodovod", dn: 150 }, kanalizace: { label: "kanalizace", dn: 300 } };
  // A sidewalk 0–4 m from A with a trench 1.5 m wide in its middle (1.25–2.75 m), 0.4–1.4 m deep.
  const p = { segments: [{ type: "chodnik", width: 4, under: "ryha" }, { type: "pruh", width: 3 }] };
  const at = (m, depth, kind = "vodovod") => ({ items: [{ t: 10 - m, depth, kind, profil: null }], span: { left: 10 }, kinds });
  const level = (m, d, kind) => checkUnder(p, at(m, d, kind)).map((f) => f.level).join();
  assert.equal(level(2, 0.8), "min"); // in it
  assert.equal(level(2.8, 0.8), "min"); // touching its side (the pipe's radius)
  assert.equal(level(3.1, 0.8), "zaklad"); // 0.27 m beside it (rim 0.28 m from the trench): within 0.5 m
  assert.equal(level(3.5, 0.8), ""); // 0.67 m beside it
  assert.equal(level(2, 1.7, "kanalizace"), "zaklad"); // 0.3 m below it
  assert.equal(level(2, 2.5, "kanalizace"), ""); // well below it
  assert.equal(checkUnder(p, at(5, 0.8)).length, 0); // under the lane
  assert.equal(checkUnder(p, null).length, 0);
});
