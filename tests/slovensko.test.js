// The Slovak module (pilot/public/towns/slovensko.js, the review of Slovakia 16. 11. 2026): the towns' passports and
// map lines by place, ZBGIS's widths and areas, the towns' illustrations; no network (PROFILY_SK, no fetch).
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

globalThis.PROFILY_SK = { pasport: "0", zbgis: "0", hrany: "0" };
const C = await import("../pilot/public/city.js");
const SK = await import("../pilot/public/towns/slovensko.js");
const read = (f) => fs.readFileSync(new URL(`../pilot/public/${f}`, import.meta.url), "utf8");

test("pasporty měst: Bratislava, Prešov, Žilina, Banská Bystrica, Košice, Zvolen jen na přání", () => {
  assert.deepEqual(Object.keys(SK.SK_TOWNS).sort(), ["bratislava", "bystrica", "kosice", "presov", "zilina", "zvolen"]);
  for (const t of Object.values(SK.SK_TOWNS)) assert.equal(typeof t.own, "function");
  assert.equal(SK.SK_TOWNS.zvolen.optIn, "zvolen");
});

test("čáry map měst podle místa a hranic měst (mimo hranici Nitry nic)", () => {
  C.loadSkTowns(JSON.parse(read("mesta-sk.json")));
  assert.equal(SK.edgeSourceAt(18.084, 48.309)?.id, "nitra");
  assert.equal(SK.edgeSourceAt(17.832, 48.594)?.id, "piestany");
  assert.equal(SK.edgeSourceAt(18.17, 48.36), null, "v boxu Nitry, ale za její hranicí");
  assert.equal(SK.edgeSourceAt(17.107, 48.1467), null, "Bratislava má vlastní technickou mapu, ne kresbu");
});

test("ZBGIS: šířka silnice z osy, parkoviště a tráva jako plochy, ostatní vrstvy pryč", () => {
  const out = SK.zbgisParse({ results: [
    { layerId: 22, attributes: { "Celková využiteľná šírka cesty v m": "7,5" }, geometry: { paths: [[[17.1, 48.1], [17.2, 48.1]]] } },
    { layerId: 61, attributes: {}, geometry: { rings: [[[17.1, 48.1], [17.2, 48.1], [17.2, 48.2], [17.1, 48.1]]] } },
    { layerId: 70, attributes: {}, geometry: { rings: [[[17.1, 48.1], [17.2, 48.1], [17.2, 48.2], [17.1, 48.1]]] } },
    { layerId: 99, attributes: {}, geometry: { rings: [[[0, 0], [1, 0], [1, 1], [0, 0]]] } },
  ] });
  assert.equal(out.widths.length, 1);
  assert.equal(out.widths[0].w, 7.5);
  assert.deepEqual(out.features.map((f) => f.attributes.CTVUK_KOD), [704, 401]);
});

test("ilustrace slovenských měst: každý soubor existuje", async () => {
  const SK = (await import("../pilot/public/countries/SK.js")).default;
  for (const [town, map] of Object.entries(SK.art)) {
    for (const v of Object.values(map)) {
      const f = new URL(`../pilot/public/${town}/${v}.svg`, import.meta.url);
      assert.ok(fs.existsSync(f), `${town}: ${v}`);
    }
  }
});

test("Slovensko: pravidla podle slovenských předpisů (chodník 1,3 m, cyklopruh 1,75 m)", async () => {
  const { checkRules } = await import("../pilot/public/rules.js");
  C.setCity("slovensko");
  try {
    const lv = (segments) => checkRules({ segments }).map((f) => `${f.i}:${f.level}`);
    assert.deepEqual(lv([{ type: "chodnik", width: 1.2 }]), ["0:min"]);
    assert.deepEqual(lv([{ type: "chodnik", width: 1.5 }]), []);
    assert.deepEqual(lv([{ type: "cyklopruh", width: 1.6 }]), ["0:min"]);
  } finally { C.setCity("praha"); }
});
