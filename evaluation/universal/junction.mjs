// Cuts the app itself flags as lying in a junction (app.js result.junction: "Řez nejspíš vede křižovatkou…") are left out
// of the measurements: the user is told to move them, so they say nothing of the profile (Bára 26. 11. 2026). The flag
// is read from the note the collectors keep, in whatever language the app ran (the key and all its translations).
import fs from "node:fs/promises";
const KEY = "Řez nejspíš vede křižovatkou. Posuňte ho tažením středu do úseku mezi křižovatkami.";
const DIR = new URL("../../app/public/", import.meta.url);
const texts = [KEY];
for (const f of (await fs.readdir(DIR)).filter((f) => /^[a-z]{2}\.js$/.test(f))) {
  const m = Object.values(await import(new URL(f, DIR))).find((v) => v && typeof v === "object" && KEY in v);
  if (m) texts.push(m[KEY]);
}
export const inJunction = (row) => !!row && (row.junction === true || (typeof row.note === "string" && texts.some((x) => row.note.includes(x))));
