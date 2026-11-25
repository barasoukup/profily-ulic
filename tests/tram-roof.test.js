// A tram's picture not 420 high says where its roof is (data-roof), else the pantograph hangs above it (25. 11. 2026:
// Vienna, Bratislava, Linz, Graz and Innsbruck, 1.4 m above the roof).
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const ROOT = new URL("../pilot/public/", import.meta.url).pathname;
test("tramvaj s obrázkem jiné výšky než 420 má data-roof", () => {
  let n = 0;
  for (const dir of fs.readdirSync(ROOT, { withFileTypes: true })) {
    if (!dir.isDirectory()) continue;
    for (const f of ["tram-inbound.svg", "tram-outbound.svg"]) {
      const file = path.join(ROOT, dir.name, f);
      if (!fs.existsSync(file)) continue;
      const text = fs.readFileSync(file, "utf8"), h = Number(text.match(/viewBox="\S+ \S+ \S+ ([\d.]+)"/)[1]);
      if (h === 420) continue;
      const roof = Number(text.match(/data-roof="([\d.]+)"/)?.[1]);
      n++;
      assert.ok(h - roof > 300 && h - roof < 420, `${dir.name}/${f}: střecha ${h - roof} cm nad kolejnicí`);
    }
  }
  assert.ok(n >= 10);
});
