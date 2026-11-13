// Rainwater management in a design (Bára after Magdalena, 12. 11. 2026; Prague's Standardy hospodaření se
// srážkovými vodami, ch. 5.1): the parts, what lies under a part, permeable paving, and how they travel and count.
import { test } from "node:test";
import assert from "node:assert/strict";
import { TYPES, HDV_UNDER, UNDER_TYPES, PERMEABLE_TYPES, ITEMS, underSize } from "../pilot/public/types.js";
import { checkUnder, checkTrees } from "../pilot/public/rules.js";
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

test("jeden objekt má jedno varování: červeně, když narazí na kteroukoli síť, stejné sítě jednou", () => {
  const kinds = { vodovod: { label: "vodovod", dn: 150 }, slaboproud: { label: "slaboproud", dn: 110 } };
  const p = { segments: [{ type: "chodnik", width: 4, under: "ryha" }] };
  const items = [{ t: 8, depth: 0.8, kind: "vodovod" }, { t: 6.8, depth: 0.5, kind: "slaboproud" }, { t: 6.8, depth: 0.5, kind: "slaboproud" }];
  const found = checkUnder(p, { items, span: { left: 10 }, kinds });
  assert.equal(found.length, 1);
  assert.equal(found[0].level, "min");
  assert.match(found[0].short, /narazí na: vodovod v hloubce 0,80 m; blíž než 0,50 m od: slaboproud v hloubce 0,50 m$/);
});

test("nový strom u sítě podle pražských stavebních předpisů (příloha 1, bod I), stávající strom ne", () => {
  const kinds = { vodovod: { label: "vodovod", dn: 150 }, plynovod: { label: "plynovod", dn: 110 }, kanalizace: { label: "kanalizace", dn: 300 }, silnoproud: { label: "silnoproud", dn: 110 } };
  const stav = { segments: [{ type: "chodnik", width: 4, items: [{ kind: "strom", f: 0.25 }] }, { type: "pruh", width: 6 }] };
  // A new tree at 3 m from A, the old one at 1 m.
  const navrh = { segments: [{ type: "chodnik", width: 4, items: [{ kind: "strom", f: 0.25 }, { kind: "strom", f: 0.75 }] }, { type: "pruh", width: 6 }] };
  // A network whose rim is gap m from the new tree, on the street side (DN 200: radius 0.1 m).
  const at = (gap, kind, more = {}) => ({ items: [{ t: 10 - (3 + gap + 0.1), depth: 1.2, kind, profil: 200, popis: "", ...more }], span: { left: 10 }, kinds });
  const level = (gap, kind, more) => checkTrees(navrh, stav, at(gap, kind, more)).map((f) => f.level).join();
  assert.equal(level(2.6, "vodovod"), ""); // 2.5 m without measures
  assert.equal(level(2, "vodovod"), "zaklad"); // 1.0–2.5 m with a root barrier
  assert.equal(level(0.8, "vodovod"), "min");
  assert.equal(level(1.2, "plynovod", { popis: "plynovod - NTL - podz. - ověř." }), "");
  assert.equal(level(0.5, "plynovod", { popis: "plynovod - STL - podz." }), "min"); // 1 m, no measures
  assert.equal(level(3, "plynovod", { popis: "plynovod - VTL - podz." }), "min"); // 4 m
  assert.equal(level(1, "kanalizace"), "zaklad"); // a sewer to DN 500: 1.5 m, closer with a barrier
  assert.equal(level(1, "kanalizace", { depth: 7, measured: true }), ""); // deeper than 6 m
  assert.equal(level(2, "kanalizace", { profil: null }), "zaklad"); // of an unknown size: 2.5 m
  assert.equal(level(0.6, "silnoproud", { popis: "silnoproud - osa chráničky - podz." }), ""); // in a duct: 0.5 m
  assert.equal(level(0.7, "plynovod", { popis: "plynovod - E_PK_PKKAB - kabel PKO" }), "zaklad"); // a cable
  assert.equal(level(0.7, "silnoproud", { popis: "silnoproud - VN - podz." }), "zaklad"); // to 22 kV: 1.0 m, 0.5 m with measures
  assert.equal(level(0.7, "silnoproud", { popis: "silnoproud - VVN - podz." }), "min"); // 110 kV: 1.5 m, 1.0 m with measures
  assert.match(checkTrees(navrh, stav, at(2, "vodovod"))[0].short, /vodovod 2,00 m od kmene \(bez opatření od 2,50 m, s opatřením od 1,00 m\)/);
  // The old tree alone: no warning.
  assert.equal(checkTrees(stav, stav, at(0.2, "vodovod")).length, 0);
  assert.equal(checkTrees(navrh, stav, null).length, 0);
});

test("strom nad kolektorem (mezi jeho stěnami) a kolektor neznámé hloubky", () => {
  const kinds = { jine: { label: "jiné", dn: 110 } };
  const navrh = { segments: [{ type: "chodnik", width: 6, items: [{ kind: "strom", f: 0.5 }] }] };
  const stav = { segments: [{ type: "chodnik", width: 6 }] };
  const wall = (m, measured) => ({ t: 10 - m, depth: 1, measured, kind: "jine", popis: "kolektor - těleso kolektoru - podz." });
  const over = checkTrees(navrh, stav, { items: [wall(1.5, true), wall(4.5, true)], span: { left: 10 }, kinds });
  assert.match(over[0].short, /kolektor přímo pod stromem/);
  assert.equal(over[0].level, "min");
  // One wall 1 m from the tree, its depth unknown: orange at most.
  assert.equal(checkTrees(navrh, stav, { items: [wall(4.1, false)], span: { left: 10 }, kinds })[0].level, "zaklad");
});
