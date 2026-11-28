// The coasts and land borders of Estonia, Slovenia, Finland and Denmark (the reviews of 24. 11. 2026): harbours, quays,
// bridges and towns on a border river that GISCO's 1 : 1 M ring cuts off are the state's, a point beyond a land border
// is not (city.js stateEntry, tools/build_states.mjs: COAST, land_*, the extra rings "<id>+<what>").
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const read = (f) => JSON.parse(fs.readFileSync(new URL(`../app/public/${f}`, import.meta.url), "utf8"));
const staty = read("states.json");
async function city(states = staty) {
  const C = await import("../app/public/city.js");
  C.loadBounds(read("towns.json"));
  C.loadStates(states);
  return C;
}
const IN = {
  estonia: [
    // Haapsalu: Kaluri / Uus-Sadama, Sadama, Holmi kallas, Westmeri (ETAK road axes).
    [58.95457, 23.52775], [58.9542, 23.53036], [58.9565, 23.52327], [58.95828, 23.52536],
    // Virtsu: road 10 and Majaka tänav; Kuivastu: road 10 at the ferry.
    [58.57363, 23.51041], [58.56843, 23.50507], [58.57307, 23.39001], [58.57123, 23.39091],
    // Heltermaa (Kiviranniku tee) and Rohuküla (Lõppe tee).
    [58.86349, 23.04609], [58.86182, 23.04727], [58.91003, 23.42657], [58.91074, 23.42524],
    // Paldiski, Jaama tänav; Tallinn, Pirita tee by Maarjamäe.
    [59.34163, 24.06477], [59.3465, 24.05577], [59.45673, 24.81071],
    // Narva on the river: Jõe tänav and Sadama tee (the cadastre's town); Valga by Valka: Piiri, Kalda, Tolli tänav.
    [59.38169, 28.20614], [59.3717, 28.20768], [57.77159, 26.02215], [57.7728, 26.02464], [57.78831, 26.02948],
  ],
  slovenia: [
    // Koper: Kidričeva ulica in the old town, Istrska cesta in Žusterna; Piran: Prešernovo nabrežje, Punta, Tartinijev trg.
    [45.54833, 13.72627], [45.54708, 13.70527], [45.5272, 13.565], [45.53, 13.5626], [45.5284, 13.5679],
  ],
  finland: [
    // Helsinki: Itäväylä on the bridge by Kulosaari, Laivakoirankatu, Ramsinniementie, Mustikkamaanpolku,
    // Hernesaarenlaituri, Leipurinniementie; Espoo: Hanasaarenranta.
    [60.1858, 24.9891], [60.16, 25.0159], [60.1901, 25.092], [60.1808, 24.985], [60.1485, 24.9202], [60.1463, 25.08], [60.165, 24.8401],
  ],
  // Ydre Nordhavn: Nordsøvej and Oceankaj.
  denmark: [[55.7155, 12.626], [55.7175, 12.6375], [55.7225, 12.6425]],
};
// Beyond the land borders (and the neighbours across the sea).
const OUT = {
  // Latvia: Valka (by Valga), Ainaži, Rūjiena; Russia: Ivangorod across the Narva, its fortress, Pechory.
  estonia: [[57.7748, 26.0175], [57.7778, 26.0121], [57.8625, 24.3606], [57.8977, 25.3277], [59.3722, 28.2155], [59.3772, 28.2165], [57.8094, 27.6126]],
  // Italy: Muggia, Lazzaretto, Trieste, Gorizia; Croatia: Umag, Savudrija; Austria: Spielfeld, Bad Radkersburg.
  slovenia: [[45.6046, 13.7676], [45.596, 13.712], [45.6495, 13.7768], [45.941, 13.622], [45.434, 13.52], [45.493, 13.5], [46.7097, 15.6366], [46.688, 15.988]],
  // Sweden: Haparanda; Russia: Svetogorsk; Estonia across the gulf.
  finland: [[65.8355, 24.137], [61.111, 28.859], [59.437, 24.745]],
  // Sweden: Malmö, its Västra hamnen and Limhamn, Helsingborg.
  denmark: [[55.605, 13.0038], [55.614, 12.977], [55.58, 12.93], [56.0465, 12.6945]],
};

test("pobřeží a hranice: přístavy, mosty a města na hraniční řece patří státu, sousedé ne", async () => {
  const C = await city();
  for (const [st, pts] of Object.entries(IN)) for (const [lat, lon] of pts) assert.equal(C.cityAt(lat, lon), st, `${st} ${lat},${lon}`);
  for (const [st, pts] of Object.entries(OUT)) for (const [lat, lon] of pts) assert.notEqual(C.cityAt(lat, lon), st, `${st}: ${lat},${lon} je v cizině`);
});

test("pobřeží: bez pozemních hranic a dalších kruhů by body byly jinde", async () => {
  // GISCO's ring alone leaves the coastal points out (the tolerance does it).
  const ring = await city(Object.fromEntries(Object.entries(staty).filter(([id]) => !id.includes("+"))));
  for (const [lat, lon] of IN.slovenia.slice(0, 4)) {
    ring.loadStates({ ring: staty.slovenia });
    assert.equal(ring.cityAt(lat, lon), "cizina", `${lat},${lon} leží mimo kruh`);
  }
  // Without the extra rings Narva's bank, Helsinki's bridge and Nordhavn were abroad.
  ring.loadStates(Object.fromEntries(Object.entries(staty).filter(([id]) => !id.includes("+"))));
  for (const [lat, lon] of [[59.38169, 28.20614], [57.77159, 26.02215]]) assert.equal(ring.cityAt(lat, lon), "cizina", `${lat},${lon}`);
  assert.equal(ring.cityAt(60.1858, 24.9891), "cizina");
  assert.equal(ring.cityAt(55.7175, 12.6375), "cizina");
  // Without Estonia's land border the coast's 400 m took a street of Valka.
  ring.loadStates(Object.fromEntries(Object.entries(staty).filter(([id]) => id !== "land_estonia")));
  assert.equal(ring.cityAt(57.7748, 26.0175), "estonia");
  // The extra rings are read as their state, and the state's own ring stays GISCO's (the maps' layers, app.js).
  const C = await city();
  assert.ok(Object.keys(staty).filter((id) => id.includes("+")).every((id) => staty[id.split("+")[0]]));
  assert.equal(C.cityAt(59.437, 24.745), "estonia");
});

// The coast's 400 m only by the sea (Bára 24. 11. 2026): a harbour and the sea off the beach stay the state's, a cut
// 300 m beyond a land border does not (city.js stateEntry, states.json land_*).
test("Pobřeží: tolerance 400 m jen u moře, ne u hranice na souši (LT, FI, DK)", async () => {
  const C = await city();
  // Outside the state's ring (GISCO's ring alone does not take them), within 400 m of the sea coast.
  const sea = [["lithuania", 55.64922, 21.16001], ["lithuania", 55.84707, 21.0545], ["finland", 60.1316, 24.99252], ["denmark", 55.68931, 12.60393]];
  for (const [st, lat, lon] of sea) {
    C.loadStates({ ring: staty[st] });
    assert.equal(C.cityAt(lat, lon), "cizina", `${lat},${lon} leží mimo kruh`);
    C.loadStates(staty);
    assert.equal(C.cityAt(lat, lon), st, `${lat},${lon} moře u pobřeží`);
  }
  // 300 m beyond the land border: Latvia, Belarus, Kaliningrad; Sweden, Norway, Russia by Finland.
  const land = [[56.4133, 22.22338], [56.33535, 23.76874], [54.27878, 25.407], [55.07024, 26.26848], [54.92863, 22.7513], [55.24284, 21.26685],
    [66.34859, 23.65094], [67.51083, 23.4253], [69.59307, 25.94434], [61.90679, 30.24017]];
  C.loadStates(staty);
  for (const [lat, lon] of land) assert.equal(C.cityAt(lat, lon), "cizina", `${lat},${lon}`);
  // Without the land borders (the old rule) they were taken in.
  C.loadStates(Object.fromEntries(Object.entries(staty).filter(([id]) => !id.startsWith("land_"))));
  for (const [lat, lon] of land) assert.notEqual(C.cityAt(lat, lon), "cizina", `${lat},${lon} dřív`);
  // The land borders are lines, not states.
  C.loadStates(staty);
  assert.equal(C.cityAt(54.6872, 25.2797), "lithuania");
});
