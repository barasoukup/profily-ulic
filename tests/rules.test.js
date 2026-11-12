import { test } from "node:test";
import assert from "node:assert/strict";
import { checkRules } from "../pilot/public/rules.js";

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
