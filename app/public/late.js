// What only a cut (or the map) in North America needs, asked for when it is there (Bára 25. 11. 2026: almost nothing more for a
// visitor of Europe): the borders and the messages of the USA and Canada (states-america.json), their cities' boundaries
// (towns-us.json, towns-ca.json) and their modules (america.js: the states, their sources, the houses' looks and drawing).
// The box of both lies west of every place of Europe the app has (the Azores end at 31.3° W).
export const LATE_BOX = [-170, 14, -50, 84]; // [lon0, lat0, lon1, lat1]
// The states' rough boxes (countries/US.js, CA.js bounds; validate.js, before they are loaded): the USA's spans all its
// metros (San Francisco to New York and Boston; a further metro widens it).
export const LATE_BOUNDS = { US: [-123.2, 37.6, -70.6, 42.8], CA: [-79.95, 43.45, -78.95, 44.05] };
export const isLate = (lat, lon) => lon >= LATE_BOX[0] && lon <= LATE_BOX[2] && lat >= LATE_BOX[1] && lat <= LATE_BOX[3];
const FILES = ["states-america.json", "towns-us.json", "towns-ca.json"];
let job = null, done = false;
const after = [];
// Is the place's state known (at once for Europe)?
export const lateReady = (lat, lon) => !isLate(lat, lon) || done;
// f(towns) once America is loaded.
export const onAmerica = (f) => { after.push(f); };
// Everything of the place's continent loaded; rejects when a part did not come (asked again next time).
export function ensurePlace(lat, lon) {
  if (lateReady(lat, lon)) return Promise.resolve();
  return (job ??= Promise.all([import("./america.js"), ...FILES.map((f) => fetch(f).then((r) => { if (!r.ok) throw new Error(`${f} ${r.status}`); return r.json(); }))])
    .then(([m, states, ...towns]) => { m.takeAmerica(states, ...towns); done = true; for (const f of after) f(Object.assign({}, ...towns)); })
    .catch((err) => { job = null; throw err; }));
}
