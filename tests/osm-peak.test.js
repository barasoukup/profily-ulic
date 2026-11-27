// The daily rebuild of the OSM packs on R2 (Bára 26. 11. 2026: under the free 10 GB, counted by each day's largest amount):
// the days of tools/countries.mjs, the steps of osm-tiles.yml and osm-index.yml simulated over the bucket (tools/osm_peak.mjs).
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { PACKS, DAYS, SIZES, DAY_COUNT, packDays, packsFor } from "../tools/countries.mjs";
import { simulateDay, simulateWeek, bucketOf } from "../tools/osm_peak.mjs";

test("dny přestavby: každý balík právě jeden den, dny zhruba stejně velké", () => {
  assert.equal(DAYS.length, DAY_COUNT);
  const all = DAYS.flatMap((d) => d.codes);
  assert.deepEqual([...all].sort(), PACKS.map((p) => p.code).sort());
  assert.equal(new Set(all).size, all.length);
  const mb = DAYS.map((d) => d.mb), largest = Math.max(...Object.values(SIZES));
  assert.ok(Math.max(...mb) - Math.min(...mb) <= largest, `dny ${mb.join(", ")} MB`);
  // The same days on every run.
  assert.deepEqual(packDays().map((d) => d.codes), DAYS.map((d) => d.codes));
  // A pack not measured yet still gets a day.
  const more = packDays([...PACKS, { code: "xx_new", extract: "x" }]);
  assert.equal(more.filter((d) => d.codes.includes("xx_new")).length, 1);
});

test("výběr balíků: den, jmenované (stát se všemi částmi) i všechny", () => {
  assert.deepEqual(packsFor({ day: 3 }).map((p) => p.code).sort(), [...DAYS[2].codes].sort());
  assert.deepEqual(packsFor({ states: "at,de_by" }).map((p) => p.code), ["at", "de_by"]);
  assert.equal(packsFor({ states: "de" }).length, 16);
  assert.equal(packsFor().length, PACKS.length);
  assert.equal(packsFor({ states: "zz" }).length, 0);
});

test("týden přestavby: index nikdy nejmenuje smazaný soubor, R2 drží jen celou sadu a pár nových souborů", () => {
  const total = Object.values(SIZES).reduce((s, x) => s + x, 0) * 1e6;
  const week = simulateWeek(SIZES, DAYS);
  for (const d of week) {
    assert.equal(d.broken, 0);
    assert.ok(Math.abs(d.end - total) < 1e6, `den ${d.day} končí s ${d.end}`);
    // Never more than the whole set and the six largest packs of the day (all landing while a run works).
    const six = DAYS[d.day - 1].codes.map((c) => SIZES[c]).sort((a, b) => b - a).slice(0, 6).reduce((s, x) => s + x, 0) * 1e6;
    assert.ok(d.peak <= total + six, `den ${d.day}: ${d.peak}`);
  }
});

test("přestavba: soubory přistanou, zatímco index běží, a čekající žádost nic neztratí", () => {
  const sizes = { cz: 280, sk: 105, at: 280 };
  // All three land within the minute of one run.
  const r = simulateDay(bucketOf(sizes), [{ code: "cz", mb: 280 }, { code: "sk", mb: 105 }, { code: "at", mb: 280 }], { build: () => 30, run: 5 });
  assert.equal(r.broken, 0);
  assert.equal(r.bucket.size, 3);
  assert.ok(Object.values(r.index.files).every((f) => /2026-12-01/.test(f)));
});

test("přestavba: vadný nový soubor (o víc než 30 % menší) index nebere a starý soubor zůstane", () => {
  const sizes = { cz: 280, sk: 105 };
  const r = simulateDay(bucketOf(sizes), [{ code: "cz", mb: 280 }, { code: "sk", mb: 105 }], { bad: new Set(["cz"]) });
  assert.equal(r.broken, 0);
  assert.match(r.index.files.cz, /2026-11-24/);
  assert.match(r.index.files.sk, /2026-12-01/);
  assert.ok(r.bucket.has(`osm/${r.index.files.cz}`));
});

test("workflow: denně balíky dne, index po každém balíku, index jen jeden běh najednou", () => {
  const tiles = fs.readFileSync(new URL("../.github/workflows/osm-tiles.yml", import.meta.url), "utf8");
  const index = fs.readFileSync(new URL("../.github/workflows/osm-index.yml", import.meta.url), "utf8");
  assert.match(tiles, /cron: "0 3 \* \* \*"/);
  assert.match(tiles, /--day "\$\(date -u \+%u\)"/);
  assert.match(tiles, /args=\(--states "\$STATES"\)/);
  assert.match(tiles, /gh workflow run osm-index\.yml/);
  assert.doesNotMatch(tiles, /aws s3 rm/); // only osm-index.yml deletes
  assert.match(index, /concurrency:\s*\n\s*group: osm-index\s*\n\s*cancel-in-progress: false/);
  // In the run: the index written before anything is deleted.
  assert.ok(index.indexOf('"$R2/index.json" --content-type') < index.indexOf("aws s3 rm"));
});
