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
