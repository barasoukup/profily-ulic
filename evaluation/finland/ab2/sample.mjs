// The second A/B of Helsinki's register YLRE (the hostile review of 24. 11. 2026, bod 3): streets for cars, also the
// ordinary streets of flats beyond the inner city, and controls. Random points with a fixed seed within 500 m of the
// centres of 6 inner districts (3 each) and 15 suburbs (4 each); controls in Espoo and Vantaa inside the old box
// (5 places, 2 each: the register must not be asked there), and the four cuts the review named (hk6, hk31, hk33, hk36).
// The app snaps each point to its nearest way; the kind of way is read after the collection (collect.js).
//   node evaluation/finland/ab2/sample.mjs > evaluation/finland/ab2/sample.json
let seed = 20261124;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const INNER = { kallio: [60.184, 24.95], toolo: [60.178, 24.925], punavuori: [60.161, 24.94], kamppi: [60.168, 24.93], kruununhaka: [60.172, 24.955], ullanlinna: [60.158, 24.948] };
const SUBURBS = { vuosaari: [60.209, 25.143], malmi: [60.251, 25.011], kontula: [60.236, 25.083], herttoniemi: [60.195, 25.035], munkkiniemi: [60.198, 24.878],
  kannelmaki: [60.24, 24.88], pasila: [60.199, 24.932], oulunkyla: [60.229, 24.966], itakeskus: [60.211, 25.081], pihlajamaki: [60.24, 25.01],
  lauttasaari: [60.158, 24.875], kapyla: [60.215, 24.95], haaga: [60.222, 24.9], pukinmaki: [60.245, 24.99], mellunmaki: [60.238, 25.11] };
const CONTROLS = { tapiola: [60.176, 24.805], otaniemi: [60.185, 24.83], leppavaara: [60.219, 24.813], tikkurila: [60.293, 25.04], myyrmaki: [60.261, 24.854] };
const out = [];
const add = (group, place, [lat0, lon0], n, r0 = 500) => {
  for (let i = 1; i <= n; i++) {
    const r = r0 * Math.sqrt(rnd()), a = 2 * Math.PI * rnd();
    out.push({ id: `${place.slice(0, 4)}${i}`, group, place, lat: +(lat0 + (r * Math.cos(a)) / 110574).toFixed(6), lon: +(lon0 + (r * Math.sin(a)) / (111320 * Math.cos((lat0 * Math.PI) / 180))).toFixed(6) });
  }
};
for (const [k, c] of Object.entries(INNER)) add("inner", k, c, 3);
for (const [k, c] of Object.entries(SUBURBS)) add("suburb", k, c, 4);
for (const [k, c] of Object.entries(CONTROLS)) add("control", k, c, 2);
const old = JSON.parse((await import("node:fs")).readFileSync(new URL("../ab/sample.json", import.meta.url), "utf8"));
for (const id of ["hk6", "hk31", "hk33", "hk36"]) out.push({ ...old.find((p) => p.id === id), group: "review", place: "review" });
console.log(JSON.stringify(out, null, 1));
