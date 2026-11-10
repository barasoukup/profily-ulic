import { test } from "node:test";
import assert from "node:assert/strict";
import { checkRules } from "../pilot/public/rules.js";

const levels = (segments) => checkRules({ segments }).map((f) => `${f.i}:${f.level}`);

test("cyklopruh vedle podélného stání potřebuje 1,75 m", () => {
  assert.deepEqual(levels([{ type: "parkovani", width: 2 }, { type: "cyklopruh", width: 1.5 }]), ["1:min"]);
  assert.deepEqual(levels([{ type: "parkovani", width: 2 }, { type: "cyklopruh", width: 1.75 }]), []);
});

test("kolmé stání pod 4,5 m je pod minimem, do 5 m pod základem", () => {
  assert.deepEqual(levels([{ type: "parkovani", orient: "kolme", width: 4.4 }]), ["0:min"]);
  assert.deepEqual(levels([{ type: "parkovani", orient: "kolme", width: 4.75 }]), ["0:zaklad"]);
});

test("dvoukolejný tramvajový pás potřebuje 6,5 m", () => {
  assert.deepEqual(levels([{ type: "tramvaj", width: 3 }, { type: "tramvaj", width: 3 }]), ["0:min"]);
  assert.deepEqual(levels([{ type: "tramvaj", width: 3.25 }, { type: "tramvaj", width: 3.25 }]), []);
});

test("jízdní pruh 3 m a chodník 2 m jsou v pořádku", () => {
  assert.deepEqual(levels([{ type: "chodnik", width: 2 }, { type: "pruh", width: 3 }]), []);
});

test("tramvajový pás se sloupy trakčního vedení má mít 8 m", () => {
  const pole = [{ kind: "sloup_trakce", f: 1 }];
  assert.deepEqual(levels([{ type: "tramvaj", width: 3.5 }, { type: "tramvaj", width: 3.5, items: pole }]), ["0:zaklad"]);
  assert.deepEqual(levels([{ type: "tramvaj", width: 4 }, { type: "tramvaj", width: 4, items: pole }]), []);
  assert.deepEqual(levels([{ type: "tramvaj", width: 3 }, { type: "tramvaj", width: 3, items: pole }]), ["0:min"]);
});
