// Choosing the cuts of a measurement (code-health plan, step 19; docs/measuring.md "Malé vzorky"): a sample by the length
// of the network (every metre of a street of a stratum has the same chance), a sample from a list, the targets of a fix
// (a predicate over the cuts) and a spread over groups for the control set. Pure functions over plain data, no network.
import fs from "node:fs";
import path from "node:path";

// A seeded random generator: the same seed gives the same sample.
export function mulberry32(a) {
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---------- A sample by the length of the network (the sample of evaluation/sample.mjs) ----------
// A way: { id, name, c: [[lon, lat] …], lens: [m …], len, cum } where cum is the length of the ways before it in its stratum
// (add them with addWay). dist(a, b): metres between two [lon, lat]; bearing(a, b): degrees.
export function addWay(stratum, way) {
  stratum.ways.push({ ...way, cum: stratum.total });
  stratum.total += way.len;
}
export function pointAt(w, s, { kx, ky }) {
  for (let i = 0; i < w.lens.length; i++) {
    if (s <= w.lens[i] || i === w.lens.length - 1) {
      const t = Math.min(1, s / w.lens[i]);
      const [a, b] = [w.c[i], w.c[i + 1]];
      const bearing = (Math.atan2((b[0] - a[0]) * kx, (b[1] - a[1]) * ky) * 180) / Math.PI;
      return { lon: a[0] + t * (b[0] - a[0]), lat: a[1] + t * (b[1] - a[1]), bearing };
    }
    s -= w.lens[i];
  }
}
// strata: { key: { ways, total } }, quota: { key: n }. Returns { samples, report } (report: per stratum { got, n, ways, km }).
// Options: seed, minSpacing (m between two cuts), endGap (m from the ends of a way), kx / ky (m per degree), inside(lon, lat).
export function lengthWeighted(strata, quota, { seed, minSpacing = 300, endGap = 15, kx, ky, inside = () => true, extra = () => ({}) }) {
  const rnd = mulberry32(seed), dist = (a, b) => Math.hypot((a[0] - b[0]) * kx, (a[1] - b[1]) * ky);
  const samples = [], report = {};
  for (const [key, n] of Object.entries(quota)) {
    const st = strata[key];
    if (!st.ways.length) { report[key] = { got: 0, n, ways: 0, km: 0 }; continue; } // a town without such streets
    let got = 0, tries = 0;
    while (got < n && tries++ < 5000) {
      const x = rnd() * st.total;
      let lo = 0, hi = st.ways.length - 1;
      while (lo < hi) { const m = (lo + hi + 1) >> 1; if (st.ways[m].cum <= x) lo = m; else hi = m - 1; }
      const w = st.ways[lo];
      const s = x - w.cum;
      if (s < endGap || s > w.len - endGap) continue;
      const p = pointAt(w, s, { kx, ky });
      if (!inside(p.lon, p.lat)) continue;
      if (samples.some((q) => dist([q.lon, q.lat], [p.lon, p.lat]) < minSpacing)) continue;
      samples.push({ n: samples.length + 1, highway: key, wayId: w.id, name: w.name || null, lat: +p.lat.toFixed(6), lon: +p.lon.toFixed(6), bearing: Math.round(p.bearing), ...extra(w) });
      got++;
    }
    report[key] = { got, n, ways: st.ways.length, km: st.total / 1000 };
  }
  return { samples, report };
}

// ---------- A sample from a list, targets ----------
const SAMPLES = path.join(path.dirname(new URL(import.meta.url).pathname), "..", "replay");
// The samples of the replay (evaluation/replay/<name>.json: sample, sample-cz, sample-states), each cut with the name it
// has in the recording ("sample:5"; `rec` when another recording named it).
export function loadSample(name, dir = SAMPLES) {
  const file = name.endsWith(".json") || name.includes("/") ? name : path.join(dir, `${name}.json`);
  const base = path.basename(file, ".json");
  return JSON.parse(fs.readFileSync(file, "utf8")).map((p) => ({ ...p, sample: base, name: p.rec || `${base}:${p.id}` }));
}
// The cuts a fix can change: the predicate is written over what is on the disk (a point of the sample, its recorded
// output, tags of its way), see docs/measuring.md step 1.
export const targets = (cuts, predicate) => cuts.filter(predicate);
// n of the list without repeating, seeded; the order of the list does not matter for which are taken, only for the order of the result.
export function randomSubset(list, n, seed) {
  const rnd = mulberry32(seed), idx = list.map((_, i) => i);
  for (let i = idx.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [idx[i], idx[j]] = [idx[j], idx[i]]; }
  return idx.slice(0, Math.min(n, list.length)).sort((a, b) => a - b).map((i) => list[i]);
}
// A spread over groups: up to per[group] (or `per` for all) of each group, each from another value of spreadBy (a town, a
// class of street) where there is one. Seeded; deterministic. Returns the picked, in the order of the groups.
export function spread(list, { groupBy, spreadBy = () => "", per = 2, seed }) {
  const rnd = mulberry32(seed), groups = new Map();
  for (const p of list) { const g = groupBy(p); if (!groups.has(g)) groups.set(g, []); groups.get(g).push(p); }
  const out = [];
  for (const [g, items] of [...groups].sort((a, b) => String(a[0]).localeCompare(String(b[0])))) {
    const want = typeof per === "object" ? per[g] ?? 0 : per, pool = randomSubset(items, items.length, Math.floor(rnd() * 2 ** 31));
    const lists = new Map();
    for (const p of pool) { const k = spreadBy(p); if (!lists.has(k)) lists.set(k, []); lists.get(k).push(p); }
    const queues = [...lists.values()], pick = [];
    for (let i = 0; pick.length < want && queues.some((q) => q.length); i++) for (const q of queues) { if (pick.length >= want) break; if (q.length) pick.push(q.shift()); }
    out.push(...pick);
  }
  return out;
}
