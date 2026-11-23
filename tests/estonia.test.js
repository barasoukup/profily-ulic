// Estonia (Bára 23. 11. 2026): the state, the orthophoto's TMS tiles, ETAK's buildings, the In-ADS search, the signs
// (countries/EE.js). No network.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

test("Estonsko: stát řezu, ostrovy, sousedé mimo", async () => {
  const C = await import("../pilot/public/city.js");
  C.loadBounds(JSON.parse(fs.readFileSync(new URL("../pilot/public/mesta.json", import.meta.url), "utf8")));
  C.loadStates(JSON.parse(fs.readFileSync(new URL("../pilot/public/staty.json", import.meta.url), "utf8")));
  for (const [lat, lon] of [[59.437, 24.7536], [58.378, 26.729], [58.385, 24.4966], [59.3772, 28.1903], [58.2528, 22.4853]]) assert.equal(C.cityAt(lat, lon), "estonia", `${lat},${lon}`);
  for (const [lat, lon] of [[56.9496, 24.1052], [60.1699, 24.9384], [59.37, 28.32]]) assert.notEqual(C.cityAt(lat, lon), "estonia", `${lat},${lon}`);
});

test("Estonsko: dlaždice ortofota v TMS (osa y odspodu)", async () => {
  const L = await import("../pilot/public/lanes-ortho.js");
  assert.match(L.EE_ORTHO, /^https:\/\/tiles\.maaamet\.ee\/tm\/tms\/1\.0\.0\/foto@GMC$/);
});

test("Estonsko: budovy ETAK a hledání In-ADS", async () => {
  const E = await import("../pilot/public/towns/estonia.js");
  assert.deepEqual(E.etakBuilding({ korgus_m: 15, tyyp_tekst: "elu- või ühiskondlik hoone" }), { type: undefined, cornice: 5, total: 5, roof: 0, height: 15 });
  assert.equal(E.etakBuilding({ korgus_m: 8, tyyp_tekst: "tootmis- või abihoone" }).type, "industrial");
  assert.deepEqual(E.etakBuilding({}), { type: undefined });
  const S = await import("../pilot/public/search-ee.js");
  const items = S.parseEe({ addresses: [
    { ipikkaadress: "Narva mnt 10, Kesklinna linnaosa, Tallinn, Harju maakond", liikVal: "EHITISHOONE", viitepunkt_l: "24.7613", viitepunkt_b: "59.4375" },
    { ipikkaadress: "Narva mnt 10, Kesklinna linnaosa, Tallinn, Harju maakond", liikVal: "EHITISHOONE", viitepunkt_l: "24.7613", viitepunkt_b: "59.4375" },
    { ipikkaadress: "Riia tn, Tartu linn, Tartu maakond", liikVal: "TANAV", liikluspind: "Riia tn", viitepunkt_l: "26.72", viitepunkt_b: "58.37" },
    { ipikkaadress: "bez souřadnic", liikVal: "EHITISHOONE" }] });
  assert.deepEqual(items.map((x) => [x.text, x.type]), [["Narva mnt 10, Kesklinna linnaosa, Tallinn", "AdresniMisto"], ["Riia tn, Tartu linn", "Ulice"]]);
  assert.equal(items[1].at.street, "Riia tn");
  assert.ok(S.looksEstonian("Pärnu mnt 5") && S.looksEstonian("Rüütli tänav") && !S.looksEstonian("Karlova 5"));
});

test("Estonsko: značky a normy", async () => {
  const { COUNTRIES } = await import("../pilot/public/countries/index.js");
  const EE = COUNTRIES.EE, f = EE.signs.file;
  assert.equal(f({ k: "oneway", dir: "forward" }), "521");
  assert.equal(f({ k: "oneway", dir: "forward", plate: "protismer" }), "521-plus-836");
  assert.equal(f({ k: "oneway", dir: "backward", plate: "protismer" }), "331-plus-891a-kolo");
  assert.equal(f({ k: "ip20a", plate: "kolo" }), "525b");
  assert.equal(f({ k: "b1", plate: "obsluha" }), null, "tabulka mimo dopravní obsluhy chybí");
  assert.equal(EE.signs.label({ k: "b29" }, null, "B 29 Zákaz stání"), "362 Zákaz stání");
  assert.equal(EE.signs.label({ k: "oneway", dir: "backward", plate: "protismer" }, null, "Zákaz vjezdu"), "331 + 891a Zákaz vjezdu");
  for (const k of ["b1", "b11", "b8", "b30", "b28", "b29", "ip11a", "ztp", "ip12", "ip14a", "ip20a", "zona30", "ip26a", "ip27a", "c8a", "c9a", "c10a", "c7a"]) {
    const file = f({ k });
    assert.ok(file && fs.existsSync(new URL(`../pilot/public/signs-EE/${file}.svg`, import.meta.url)), `${k}: ${file}`);
  }
  for (const file of ["521-plus-836", "331-plus-891a-kolo", "525b", "331"]) assert.ok(fs.existsSync(new URL(`../pilot/public/signs-EE/${file}.svg`, import.meta.url)), file);
  for (const v of [5, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110]) assert.ok(fs.existsSync(new URL(`../pilot/public/signs-EE/351-${v}.svg`, import.meta.url)), `${v}`);
  assert.equal(f({ k: "ip15a" }), null, "silnici pro motorová vozidla Estonsko nemá");
  assert.equal(EE.limits({ type: "chodnik" }).min, 1.5);
  assert.equal(EE.limits({ type: "parkovani", orient: "kolme" }), null);
  assert.equal(EE.laneOrtho, "ee");
});
