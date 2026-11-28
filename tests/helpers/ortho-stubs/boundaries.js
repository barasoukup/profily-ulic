// A stand-in for app/boundaries.js: the same files, read from the folder the snapshot was asked for.
import fs from "node:fs";

const read = (f) => JSON.parse(fs.readFileSync(`${globalThis.__orthoPub}/${f}`, "utf8"));
export const TOWN_BOUNDS = read("towns.json");
export const STATES = read("states.json");
