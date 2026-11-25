import { test } from "node:test";
import assert from "node:assert/strict";
import { packProfile, unpackProfile, designParams, cutHash, parseCutHash, sameCut } from "../pilot/public/share.js";

test("návrh projde odkazem beze změny (bez údajů o budovách)", async () => {
  const p = {
    segments: [{ type: "chodnik", width: 3.75, source: "dtm" }, { type: "cyklopruh", width: 1.5, dir: "forward", source: "user" }, { type: "pruh", width: 3, turn: "left|through" }],
    edges: { left: "budova", right: "zelen", leftStyle: "funkce", leftInfo: { levels: 5 } },
  };
  const text = await packProfile(p);
  assert.match(text, /^[A-Za-z0-9_-]+$/);
  const back = await unpackProfile(text);
  assert.deepEqual(back.segments, p.segments);
  assert.deepEqual(back.edges, { left: "budova", right: "zelen", leftStyle: "funkce" });
});

test("parametry návrhu z adresy", () => {
  assert.deepEqual(designParams("#rez=50.1,14.4,10,22.0,22.0&navrh=abc&stav=def"), { navrh: "abc", stav: "def" });
  assert.deepEqual(designParams("#rez=50.1,14.4,10,22.0,22.0"), { navrh: null, stav: null });
});

test("barva cyklopruhu z OSM projde odkazem a kontrolou, jiná než hex se zahodí", async () => {
  const { cleanProfile } = await import("../pilot/public/validate.js");
  const p = { segments: [{ type: "cyklopruh", width: 1.5, dir: "forward", color: "#c0503f", source: "osm" }], edges: {} };
  const back = await unpackProfile(await packProfile(p));
  assert.equal(back.segments[0].color, "#c0503f");
  assert.equal(cleanProfile(back).segments[0].color, "#c0503f");
  assert.equal(cleanProfile({ segments: [{ type: "cyklopruh", width: 1.5, color: "url(#x)" }] }).segments[0].color, undefined);
});

test("okraj upravený ručně: podlaží jdou do odkazu, nahradí data a vadná se zahodí", async () => {
  const { packProfile, unpackProfile } = await import("../pilot/public/share.js");
  const { edgeInfo } = await import("../pilot/public/profile.js");
  const { cleanProfile } = await import("../pilot/public/validate.js");
  // Bára 12. 11. 2026: a "panel house" that is a two-storey town house.
  const p = { segments: [{ type: "chodnik", width: 3 }], edges: { left: "budova", leftStyle: "nizky", leftLevels: 2, leftInfo: { levels: 8, height: 25, cornice: 7, roof: 1 } } };
  const back = await unpackProfile(await packProfile(p));
  assert.equal(back.edges.leftLevels, 2);
  assert.deepEqual(edgeInfo(p.edges, "left"), { levels: 2, cornice: undefined, roof: undefined, height: undefined });
  assert.equal(edgeInfo(p.edges, "right"), undefined);
  for (const bad of [0, 2.5, 99, "3"]) assert.equal(cleanProfile({ ...p, edges: { left: "budova", leftLevels: bad } }, "x").edges.leftLevels, undefined, String(bad));
});

test("odkaz na řez nese cestu OSM, starý odkaz se čte jako dřív", () => {
  const cut = { lat: 50.1, lon: -8.4, bearing: -98.6, wayId: 4441474 }, hash = cutHash(cut, { left: 22, right: 21.53 });
  assert.equal(hash, "#rez=50.100000,-8.400000,-98.6,22.0,21.5,4441474");
  assert.deepEqual(parseCutHash(hash), { lat: 50.1, lon: -8.4, bearing: -98.6, reach: { left: 22, right: 21.5 }, way: 4441474 });
  // With a design after it, and inside the copied position.
  assert.equal(parseCutHash(`50.1, -8.4 · azimut 171° (Ulice) https://x.example/${hash}&navrh=abc`).way, 4441474);
  assert.deepEqual(designParams(`${hash}&navrh=abc&stav=def`), { navrh: "abc", stav: "def" });
  // Without a usable way the link is the old one.
  for (const wayId of [undefined, null, -5, "x"]) assert.equal(cutHash({ ...cut, wayId }, { left: 22, right: 22 }), "#rez=50.100000,-8.400000,-98.6,22.0,22.0");
  assert.deepEqual(parseCutHash("#rez=50.1,14.4,10,22.0,22.0&navrh=abc"), { lat: 50.1, lon: 14.4, bearing: 10, reach: { left: 22, right: 22 }, way: null });
  assert.deepEqual(parseCutHash("#rez=50.1,14.4,10"), { lat: 50.1, lon: 14.4, bearing: 10, reach: null, way: null });
  assert.equal(parseCutHash("50.1, 14.4"), null);
  // The reader before 25. 11. 2026 takes the new link too (an open page not yet reloaded).
  assert.deepEqual([...hash.match(/#rez=(-?[\d.]+),(-?[\d.]+),(-?[\d.]+)(?:,([\d.]+),([\d.]+))?/)].slice(1), ["50.100000", "-8.400000", "-98.6", "22.0", "21.5"]);
  assert.ok(sameCut(parseCutHash("#rez=50.1,-8.4,-99,22.0,22.0"), cut), "starý odkaz: uložená práce zůstane");
  assert.ok(sameCut(parseCutHash(hash), cut));
  assert.ok(!sameCut(parseCutHash(hash), { ...cut, wayId: 5 }), "jiná vozovka je jiný řez");
  // One decimal of the bearing: whole degrees stay whole, no "-0", every other tenth is another cut.
  const at = (bearing) => cutHash({ ...cut, bearing }, { left: 22, right: 22 }).split(",")[2];
  assert.deepEqual([-99, 12.04, 12.06, -0.02, 359.96, 0].map(at), ["-99", "12", "12.1", "0", "360", "0"]);
  assert.ok(!sameCut(parseCutHash("#rez=50.1,-8.4,-98.2,22.0,22.0"), cut));
  assert.ok(sameCut(parseCutHash("#rez=50.1,-8.4,0,22.0,22.0"), { ...cut, bearing: -0.4 }));
  for (const b of [-179.96, -98.55, 0.05, 33.333, 179.95]) assert.ok(sameCut(parseCutHash(cutHash({ ...cut, bearing: b }, { left: 22, right: 22 })), { ...cut, bearing: b }), String(b));
});
