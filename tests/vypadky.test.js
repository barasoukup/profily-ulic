// When a source does not answer (Bára 12. 11. 2026): the technical map of ČÚZK stands in for a city's map that
// failed, and the visitor is told what the cut lacks (sources.js national, outage; app.js cutAt).
import { test } from "node:test";
import assert from "node:assert/strict";
import { setCity } from "../pilot/public/city.js";
import { national, outage } from "../pilot/public/sources.js";

const ok = (value) => ({ status: "fulfilled", value });
const no = (reason = new Error("503")) => ({ status: "rejected", reason });
const dmvs = (features) => async () => ({ features, region: "Hlavní město Praha" });
const failing = async () => { throw new Error("DMVS 503"); };
const area = { attributes: { CTMTP_KOD: 701 } };

test("výpadek technické mapy města: plochy z technické mapy ČÚZK", async () => {
  setCity("praha");
  const r = await national({ features: [] }, "14.42,50.08,14.43,50.09", new Error("503"), dmvs([area]));
  assert.equal(r.features.length, 1);
  assert.ok(r.dmvs && r.fallback, "export uvede ČÚZK, aplikace řekne proč");
  assert.equal(r.region, "Hlavní město Praha");
  // ČÚZK has nothing there either, or does not answer: the city's failure stands.
  await assert.rejects(national({ features: [] }, "x", new Error("503"), dmvs([])), /503/);
  await assert.rejects(national({ features: [] }, "x", new Error("503"), failing), /^Error: 503$/);
});

test("prázdná odpověď města: ČÚZK, a když neodpoví, je to poznat", async () => {
  setCity("praha");
  assert.deepEqual(await national({ features: [area] }, "x", undefined, failing), { features: [area] }, "město má data, ČÚZK se neptá");
  const r = await national({ features: [] }, "x", undefined, dmvs([area]));
  assert.ok(r.dmvs && !r.fallback);
  assert.deepEqual(await national({ features: [] }, "x", undefined, dmvs([])), { features: [] });
  assert.ok((await national({ features: [] }, "x", undefined, failing)).dmvsFailed);
  // Pardubice read the DMVS themselves: no second try at it.
  setCity("pardubice");
  await assert.rejects(national({ features: [] }, "x", new Error("DMVS 503"), dmvs([area])), /DMVS 503/);
});

test("co řezu chybí, aplikace řekne", () => {
  setCity("praha");
  const full = ok({ features: [area] });
  assert.deepEqual(outage({ surfaces: full, lines: ok({ features: [] }), parking: ok({ features: [] }) }), { note: "", text: "", error: false });

  const down = outage({ surfaces: no(), lines: ok({ features: [] }), parking: ok({ features: [] }) });
  assert.equal(down.note, " · technická mapa neodpověděla, jen odhad");
  assert.match(down.text, /^Technická mapa IPR teď neodpovídá \(server je přetížený\), profil je jen odhad z OSM/);
  assert.ok(down.error);

  const stand = outage({ surfaces: ok({ features: [area], dmvs: true, fallback: true }), lines: ok({}), parking: ok({}) });
  assert.equal(stand.note, " · plochy z technické mapy ČÚZK");
  assert.match(stand.text, /plochy jsou z technické mapy ČÚZK/);

  // Lines and parking: the street would look as if it had no tram or no cars.
  const lacks = outage({ surfaces: full, lines: no(), parking: no() });
  assert.equal(lacks.note, " · neúplná data");
  assert.match(lacks.text, /Chybí data kolejí, plotů a svahů, parkovacích stání \(server neodpověděl\)/);
  assert.ok(lacks.error);
  assert.match(outage({ surfaces: full, lines: ok({ features: [], missing: ["opendata"] }), parking: ok({}) }).text, /stromů a tříd ulic TSK/);

  // Nothing on the map is no failure; ČÚZK not answering is.
  const empty = outage({ surfaces: ok({ features: [] }), lines: ok({}), parking: ok({}) });
  assert.equal(empty.note, " · mimo technickou mapu, jen odhad");
  assert.equal(empty.text, "Technická mapa tu nic nevrátila, profil je odhad z OSM.");
  assert.ok(!empty.error);
  const cuzk = outage({ surfaces: ok({ features: [], dmvsFailed: true }), lines: ok({}), parking: ok({}) });
  assert.equal(cuzk.note, " · technická mapa neodpověděla, jen odhad");
  assert.match(cuzk.text, /^Technická mapa ČÚZK teď neodpovídá/);
});

test("technická mapa jen s čarami (Středočeský kraj): hláška podle toho, co z nich vzešlo", () => {
  setCity("cesko");
  const ok = (value) => ({ status: "fulfilled", value });
  const lines = outage({ surfaces: ok({ features: [], linesOnly: true }), lines: ok({}), parking: ok({}) });
  assert.equal(lines.note, " · technická mapa tu má jen čáry, jen odhad");
  assert.match(lines.text, /^Technická mapa tu má jen čáry bez ploch \(kraj plochy do ní nedodává\)/);
  assert.ok(!lines.error, "kraj za to nemůže, žádná chyba");
  const read = outage({ surfaces: ok({ features: [area], fromLines: true }), lines: ok({}), parking: ok({}) });
  assert.equal(read.note, " · plochy odvozené z čar technické mapy");
  assert.match(read.text, /šířky jsou změřené mezi nimi/);
});

test("plochy z čar: vozovka pod středem, chodníky mezi hranicemi dopravní plochy, za plotem nic", async () => {
  const { fromLines, view } = await import("../pilot/public/dmvs.js");
  // Fügnerova in Kolín across (Bára 12. 11. 2026): the lines crossed from the left, in metres from the axis.
  const v = view("15.1934,50.0255,15.1944,50.0261");
  const { w, h, res } = v, cx = Math.floor(w / 2);
  const LINES = [[-7.45, "Plot"], [-5, "Hranice dopravní stavby nebo plochy"], [-3.6, "Hranice dopravní stavby nebo plochy"],
    [3.3, "Hranice dopravní stavby nebo plochy"], [4.6, "Hranice dopravní stavby nebo plochy"], [7.5, "Plot"], [11.45, "Hranice budovy"]];
  const rgba = new Uint8Array(w * h * 4);
  const col = (m) => cx + Math.round(m / res);
  for (const [m] of LINES) for (let y = 0; y < h; y++) for (const x of [col(m), col(m) + 1]) rgba[(y * w + x) * 4 + 3] = 255;
  const info = async ([x]) => ({ features: [{ properties: { objektovytypnazev: LINES.find(([m]) => Math.abs(col(m) - x) <= 3)?.[1] } }] });
  const r = await fromLines(v, { width: w, height: h, rgba }, info);
  assert.ok(r.fromLines);
  const widths = r.features.map((f) => {
    const xs = f.geometry.rings.flat().map((p) => p[0]);
    return [f.attributes.code, +(((Math.max(...xs) - Math.min(...xs)) / (v.toLonLat([w, 0])[0] - v.toLonLat([0, 0])[0])) * w * res).toFixed(1)];
  }).sort((a, b) => a[1] - b[1]);
  assert.deepEqual(widths.map(([c]) => c).sort(), [701, 702, 702]);
  assert.ok(Math.abs(widths.find(([c]) => c === 701)[1] - 6.9) < 0.4, `vozovka ${widths}`);
  assert.ok(r.features.every((f) => f.attributes.guess), "druhy ploch jsou odhad");
  // Without lines near the centre there is no roadway to read.
  assert.equal(await fromLines(v, { width: w, height: h, rgba: new Uint8Array(w * h * 4) }, info), null);
});

test("dlaždice pražských otevřených dat: chyba se ohlásí a příště se zkusí znovu, chybějící dlaždice je prázdno", async () => {
  const { prahaOpendata } = await import("../pilot/public/sources.js");
  const real = globalThis.fetch;
  let status = 500;
  globalThis.fetch = async () => ({ ok: status === 200, status, json: async () => ({ t: [500, 500] }) });
  try {
    const bbox = "14.4201,50.0801,14.4209,50.0809";
    await assert.rejects(prahaOpendata(bbox), /500/, "outage pak řekne, že chybí stromy a třídy ulic");
    status = 200;
    assert.equal((await prahaOpendata(bbox)).trees.length, 1, "chyba se nezapamatovala");
    status = 404;
    assert.deepEqual((await prahaOpendata("14.5101,50.0101,14.5109,50.0109")).trees, []);
  } finally {
    globalThis.fetch = real;
  }
});
