import { test } from "node:test";
import assert from "node:assert/strict";
import { checkRules } from "../app/public/rules.js";

const levels = (segments) => checkRules({ segments }).map((f) => `${f.i}:${f.level}`);

test("cyklopruh vedle podélného stání potřebuje 1,75 m", () => {
  assert.deepEqual(levels([{ type: "parkovani", width: 2 }, { type: "cyklopruh", width: 1.5 }]), ["1:min"]);
  assert.deepEqual(levels([{ type: "parkovani", width: 2 }, { type: "cyklopruh", width: 1.75 }]), []);
});

test("cyklopruh vedle kolmého nebo šikmého stání potřebuje 2 m", () => {
  for (const orient of ["kolme", "sikme"]) {
    assert.deepEqual(levels([{ type: "parkovani", orient, width: 5 }, { type: "cyklopruh", width: 1.9 }]), ["1:min"], orient);
    assert.deepEqual(levels([{ type: "parkovani", orient, width: 5 }, { type: "cyklopruh", width: 2 }]), [], orient);
  }
});

test("chodník: pod 1,5 m červeně, pod 2 m oranžově", () => {
  assert.deepEqual(levels([{ type: "chodnik", width: 1.4 }]), ["0:min"]);
  assert.deepEqual(levels([{ type: "chodnik", width: 1.6 }]), ["0:zaklad"]);
});

test("pruh pro autobusy: pod 3 m červeně, pod 3,25 m oranžově", () => {
  assert.deepEqual(levels([{ type: "bus", width: 2.9 }]), ["0:min"]);
  assert.deepEqual(levels([{ type: "bus", width: 3.1 }]), ["0:zaklad"]);
  assert.deepEqual(levels([{ type: "bus", width: 3.25 }]), []);
});

test("kolmé stání pod 4,5 m je pod minimem, do 5 m pod základem", () => {
  assert.deepEqual(levels([{ type: "parkovani", orient: "kolme", width: 4.4 }]), ["0:min"]);
  assert.deepEqual(levels([{ type: "parkovani", orient: "kolme", width: 4.75 }]), ["0:zaklad"]);
});

test("dvoukolejný tramvajový pás potřebuje 6,5 m, standard 7 m (těleso i vyhrazený pruh)", () => {
  for (const type of ["tramvaj", "tramvaj_pruh"]) {
    assert.deepEqual(levels([{ type, width: 3 }, { type, width: 3 }]), ["0:min"]);
    assert.deepEqual(levels([{ type, width: 3.25 }, { type, width: 3.25 }]), ["0:zaklad"]);
    assert.deepEqual(levels([{ type, width: 3.5 }, { type, width: 3.5 }]), []);
  }
  // A tram in a lane with cars is no belt of its own.
  assert.deepEqual(levels([{ type: "tramvaj_v_pruhu", width: 3 }, { type: "tramvaj_v_pruhu", width: 3 }]), []);
});

test("jízdní pruh 3 m a chodník 2 m jsou v pořádku", () => {
  assert.deepEqual(levels([{ type: "chodnik", width: 2 }, { type: "pruh", width: 3 }]), []);
});

test("tramvajový pás se sloupy trakčního vedení má mít 8 m", () => {
  const pole = [{ kind: "sloup_trakce", f: 1 }];
  assert.deepEqual(levels([{ type: "tramvaj", width: 3.5 }, { type: "tramvaj", width: 3.5, items: pole }]), ["0:zaklad"]);
  assert.deepEqual(levels([{ type: "tramvaj", width: 3.95 }, { type: "tramvaj", width: 3.95, items: pole }]), ["0:zaklad"], "7,9 m");
  assert.deepEqual(levels([{ type: "tramvaj", width: 4 }, { type: "tramvaj", width: 4, items: pole }]), []);
  assert.deepEqual(levels([{ type: "tramvaj", width: 3 }, { type: "tramvaj", width: 3, items: pole }]), ["0:min"]);
});

test("ochranný cyklopruh: základ 1,5 m, pod 1,25 m červeně, vedle stání jako cyklopruh", () => {
  assert.deepEqual(levels([{ type: "pruh", width: 3 }, { type: "ochranny_pruh", width: 1.5 }]), []);
  assert.deepEqual(levels([{ type: "pruh", width: 3 }, { type: "ochranny_pruh", width: 1.3 }]), ["1:zaklad"]);
  assert.deepEqual(levels([{ type: "pruh", width: 3 }, { type: "ochranny_pruh", width: 1.2 }]), ["1:min"]);
  assert.deepEqual(levels([{ type: "parkovani", width: 2 }, { type: "ochranny_pruh", width: 1.5 }]), ["1:min"]);
});

test("Slovensko: pravidla podle TP 117 (cyklopruh 1,75 m, bus s cyklisty mimo 3,5–4,75 m, chodník 1,3 m)", async () => {
  const { setCity } = await import("../app/public/city.js");
  setCity("slovensko");
  const at = (segments) => checkRules({ segments }).map((w) => w.level);
  assert.deepEqual(at([{ type: "cyklopruh", width: 1.5 }]), ["min"]);
  assert.deepEqual(at([{ type: "cyklopruh", width: 1.8 }]), ["zaklad"]);
  assert.deepEqual(at([{ type: "bus_cyklo", width: 4.25 }]), ["min"]);
  assert.deepEqual(at([{ type: "bus_cyklo", width: 3.4 }]), []);
  assert.deepEqual(at([{ type: "chodnik", width: 1.4 }]), ["zaklad"]);
  assert.deepEqual(at([{ type: "chodnik", width: 1.2 }]), ["min"]);
  assert.deepEqual(at([{ type: "chodnik", width: 1.5 }]), []);
  assert.deepEqual(at([{ type: "cyklopruh", width: 1.6 }]), ["min"]);
  // No Slovak width of a tram belt: no warning.
  assert.deepEqual(at([{ type: "tramvaj", width: 3 }, { type: "tramvaj", width: 3 }]), []);
  setCity("praha");
  assert.deepEqual(at([{ type: "cyklopruh", width: 1.5 }]), []);
});

test("Rakousko (AT): dálnice bez červené, místní ulice 2,5 m, cyklopruh 1,5 / 2 m vedle stání, tramvaj 6,6 m", async () => {
  const C = await import("../app/public/city.js");
  const { osmGroup } = await import("../app/public/derive.js");
  C.setCity("austria");
  try {
    assert.equal(osmGroup("motorway_link"), "dalnice");
    assert.equal(osmGroup("residential"), "mk4");
    assert.deepEqual(levels([{ type: "pruh", width: 2.8, roadClass: osmGroup("motorway") }]), ["0:zaklad"]);
    assert.deepEqual(levels([{ type: "pruh", width: 2.5, roadClass: osmGroup("residential") }]), []);
    assert.deepEqual(levels([{ type: "pruh", width: 2.4, roadClass: osmGroup("residential") }]), ["0:min"]);
    assert.deepEqual(levels([{ type: "cyklopruh", width: 1.5 }]), []);
    assert.deepEqual(levels([{ type: "parkovani", width: 2 }, { type: "cyklopruh", width: 1.8 }]), ["1:min"]);
    assert.deepEqual(levels([{ type: "tramvaj", width: 3.2 }, { type: "tramvaj", width: 3.2 }]).filter((x) => x.endsWith("min")).length, 1);
  } finally { C.setCity("praha"); }
});

test("Vídeň: třídy FMZK na plochy, podloubí podle plochy pod ním", async () => {
  const { fmzkCode } = await import("../app/public/towns/austria.js");
  assert.equal(fmzkCode({ F_KLASSE: 21 }), 701);
  assert.equal(fmzkCode({ F_KLASSE: 23 }), 702);
  assert.equal(fmzkCode({ F_KLASSE: 25 }), 702);
  assert.equal(fmzkCode({ F_KLASSE: 33 }), 704);
  assert.equal(fmzkCode({ F_KLASSE: 28 }), 705);
  assert.equal(fmzkCode({ F_KLASSE: 12, KLASSE_SUB: 23 }), 702);
  assert.equal(fmzkCode({ F_KLASSE: 13, KLASSE_SUB: 59 }), 1003);
  assert.equal(fmzkCode({ F_KLASSE: 999 }), null);
});

test("Německo (DE): pruh místní ulice bez varování (zdroj nenalezen), Radfahrstreifen 1,5 / 1,85, chodník 1,8 / 2,5, tramvajový pás bez varování", async () => {
  const C = await import("../app/public/city.js");
  const { osmGroup } = await import("../app/public/derive.js");
  C.setCity("germany");
  try {
    assert.deepEqual(levels([{ type: "pruh", width: 2.4, roadClass: osmGroup("residential") }]), [], "bez zdroje bez varování");
    assert.deepEqual(levels([{ type: "cyklopruh", width: 1.4 }]), ["0:min"]);
    assert.deepEqual(levels([{ type: "cyklopruh", width: 1.7 }]), ["0:zaklad"]);
    assert.deepEqual(levels([{ type: "cyklopruh", width: 1.85 }]), []);
    assert.deepEqual(levels([{ type: "chodnik", width: 1.6 }]), ["0:min"]);
    assert.deepEqual(levels([{ type: "chodnik", width: 2.5 }]), []);
    assert.deepEqual(levels([{ type: "tramvaj", width: 3 }, { type: "tramvaj", width: 3 }]), []);
  } finally { C.setCity("praha"); }
});
