// The tests of the app in a language other than Czech (i18n-en.test.js, i18n-de.test.js): the same five checks with the
// words of the language. The modules read the language once, when they load, so the test file sets
// globalThis.PROFILY_LANG before it calls this (and runs alone in its process).
import { test } from "node:test";
import assert from "node:assert/strict";

const CZECH = /[ěščřžůňťďáíéýú]/i;

// L: { labels: { chodnik, cyklopruh, odhad, walking }, rule, brno: { dataName, outage }, cesko: { data, art }, signs: [[sign, text]] }
export function languageSuite(L) {
  test("popisky částí, zdrojů a podílů", async () => {
    const { TYPES, SOURCES } = await import("../../app/public/types.js");
    const { shares } = await import("../../app/public/shares.js");
    assert.equal(TYPES.chodnik.label, L.labels.chodnik);
    assert.equal(TYPES.cyklopruh.label, L.labels.cyklopruh);
    assert.equal(SOURCES.odhad.label, L.labels.odhad);
    for (const [k, v] of Object.entries(TYPES)) assert.doesNotMatch(v.label, CZECH, k);
    assert.deepEqual(shares({ segments: [{ type: "chodnik", width: 3 }] }).map((g) => g.label)[0], L.labels.walking);
  });

  test("normy: česká pravidla v jazyce, s jeho desetinným znaménkem", async () => {
    const { checkRules } = await import("../../app/public/rules.js");
    const { setCity } = await import("../../app/public/city.js");
    setCity("praha");
    const out = checkRules({ segments: [{ type: "chodnik", width: 1.4 }, { type: "pruh", width: 3 }] });
    assert.equal(out[0].text, L.rule);
  });

  test("výpadky zdrojů a texty měst", async () => {
    const { setCity, city } = await import("../../app/public/city.js");
    const { outage } = await import("../../app/public/sources.js");
    setCity("brno");
    assert.equal(city.dataName, L.brno.dataName);
    const no = { status: "rejected", reason: new Error("503") }, ok = { status: "fulfilled", value: { features: [] } };
    assert.equal(outage({ surfaces: no, lines: ok, parking: ok }).text, L.brno.outage);
    if (L.praha) { setCity("praha"); assert.match(outage({ surfaces: no, lines: ok, parking: ok }).text, L.praha.outage); }
    // A town with only its own vehicles takes the national texts.
    setCity("olomouc");
    assert.equal(city.server, "ČÚZK");
  });

  test("kredity exportu", async () => {
    const { setCity, creditLines } = await import("../../app/public/city.js");
    const [data, art] = creditLines(setCity("cesko"), { region: "Pardubický kraj", ortho: true });
    assert.equal(data, L.cesko.data);
    assert.match(art, L.cesko.art);
    for (const [city, rx] of Object.entries(L.credits || {})) assert.match(creditLines(setCity(city))[0], rx, city);
  });

  test("značky: popis v jazyce, česká čísla", async () => {
    const { setCity, city } = await import("../../app/public/city.js");
    const { signLabel } = await import("../../app/public/signs.js");
    setCity("praha");
    for (const [sign, text] of L.signs) assert.equal(signLabel(sign, city.country), text);
  });
}
