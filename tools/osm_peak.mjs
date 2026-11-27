// How much R2 holds while the OSM packs are rebuilt (osm-tiles.yml, osm-index.yml; Bára 26. 11. 2026: R2 is free up to
// 10 GB-month, counted as the average of each day's largest amount). A simulation of the workflow's steps over the
// bucket's listing, with the index logic itself (tools/osm_index.mjs): the packs of a day are built a few at a time; each,
// once uploaded, asks for an index run; one run at a time lists the bucket, writes index.json and deletes the older files
// (a request while a run works waits, and replaces any waiting one). After every step: the bytes on R2, and whether every
// file the index names is there (a page reading the index must find its files).
//   node tools/osm_peak.mjs [factor]   the days of tools/countries.mjs with tools/osm-sizes.json (× factor: a slimmer set)
import { pathToFileURL } from "node:url";
import { osmIndex } from "./osm_index.mjs";

// bucket: Map key → { size, at } (at: minutes); day: [{ code, mb }] (the new size), parallel: jobs at once, run: minutes of
// an index run (list, write, delete), build(mb): minutes from the start of a job to its file on R2.
export function simulateDay(bucket, day, { parallel = 6, run = 1, build = (mb) => 20 + mb / 10, start = 0, date = "2026-12-01", bad = new Set() } = {}) {
  const b = new Map(bucket), log = [];
  let peak = 0, broken = 0, index = null;
  const bytes = () => [...b.values()].reduce((s, o) => s + o.size, 0);
  const check = (t, what) => {
    const n = bytes();
    if (n > peak) peak = n;
    const missing = index ? Object.values(index.files).filter((f) => !b.has(`osm/${f}`)) : [];
    if (missing.length) broken++;
    log.push({ t, what, bytes: n, missing });
  };
  // The jobs: in order, each starts when a slot is free (max-parallel), its file lands after build(mb) minutes.
  const slots = Array(Math.min(parallel, day.length) || 1).fill(start), uploads = [];
  for (const p of day) {
    slots.sort((x, y) => x - y);
    const t0 = slots[0], t1 = t0 + build(p.mb);
    slots[0] = t1;
    uploads.push({ t: t1, code: p.code, size: Math.round(p.mb * 1e6 * (bad.has(p.code) ? 0.3 : 1)) });
  }
  uploads.sort((x, y) => x.t - y.t);
  const listing = () => ({ Contents: [...b].map(([Key, o]) => ({ Key, Size: o.size, LastModified: new Date(Date.parse(`${date}T00:00:00Z`) + o.at * 60000).toISOString() })) });
  // The index runs: one at a time; a request while one works waits (one waiting request at most).
  let busyUntil = -Infinity, waiting = false, i = 0;
  const runAt = (t) => {
    const { index: next, remove } = osmIndex(listing()); // the listing at the start of the run
    index = next;
    check(t + run / 2, "index");
    for (const k of remove) b.delete(k);
    check(t + run, "delete");
    busyUntil = t + run;
  };
  const requests = [...uploads.map((u) => u.t), uploads.length ? uploads.at(-1).t : start]; // each job, then the last job
  for (const u of uploads) {
    // Runs that start before this upload lands.
    while (true) {
      const next = waiting ? Math.max(busyUntil, 0) : null;
      if (next === null || next > u.t) break;
      waiting = false;
      runAt(next);
    }
    b.set(`osm/${u.code}-${date}-${(i++).toString(16).padStart(4, "0")}.posm`, { size: u.size, at: u.t });
    check(u.t, `upload ${u.code}`);
    if (busyUntil <= u.t) runAt(u.t); else waiting = true;
  }
  if (waiting) runAt(busyUntil);
  runAt(Math.max(busyUntil, requests.at(-1))); // osm-tiles.yml's last job
  return { bucket: b, peak, broken, index, log, end: busyUntil };
}

// The whole set on R2 as today, each pack one file (sizes: code → MB).
export const bucketOf = (sizes, date = "2026-11-24") => new Map(Object.entries(sizes).map(([code, mb]) => [`osm/${code}-${date}-0000.posm`, { size: Math.round(mb * 1e6), at: -1e5 }]));

// The week: each day its packs (tools/countries.mjs DAYS), the bucket carried from day to day. Returns each day's peak.
export function simulateWeek(sizes, days, opts = {}) {
  let bucket = bucketOf(sizes);
  return days.map((d, n) => {
    const r = simulateDay(bucket, d.codes.map((code) => ({ code, mb: sizes[code] ?? 50 })), { ...opts, date: `2026-12-0${n + 1}` });
    bucket = r.bucket;
    return { day: n + 1, peak: r.peak, broken: r.broken, end: [...r.bucket.values()].reduce((s, o) => s + o.size, 0), packs: d.codes.length };
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { DAYS, SIZES } = await import("./countries.mjs");
  const factor = Number(process.argv[2] || 1);
  const sizes = Object.fromEntries(Object.entries(SIZES).map(([k, v]) => [k, v * factor]));
  const gb = (x) => (x / 1e9).toFixed(2);
  const total = Object.values(sizes).reduce((s, x) => s + x, 0) * 1e6;
  console.log(`sada ${gb(total)} GB (× ${factor})`);
  const week = simulateWeek(sizes, DAYS);
  for (const d of week) console.log(`den ${d.day}: ${d.packs} balíků, špička ${gb(d.peak)} GB, na konci ${gb(d.end)} GB, index bez souboru ${d.broken}×`);
  console.log(`průměr denních maxim ${gb(week.reduce((s, d) => s + d.peak, 0) / week.length)} GB, nejvyšší ${gb(Math.max(...week.map((d) => d.peak)))} GB`);
  // The worst case: the six largest packs of a day land at once while a run works.
  const worst = Math.max(...DAYS.map((d) => d.codes.map((c) => sizes[c] ?? 50).sort((a, b) => b - a).slice(0, 6).reduce((s, x) => s + x, 0))) * 1e6;
  console.log(`nejhorší případ (6 největších balíků dne naráz): ${gb(total + worst)} GB`);
  // A full rebuild (a push to main, a run by hand without states): all packs in one run.
  const all = simulateDay(bucketOf(sizes), Object.entries(sizes).map(([code, mb]) => ({ code, mb })));
  console.log(`celá přestavba najednou: špička ${gb(all.peak)} GB, index bez souboru ${all.broken}×`);
}
