// The boxes (about 8 × 9 km round each town of the universal sample) cut from a state's OSM extract for the railway
// measurement: writes the config of `osmium extract -c` for the state. node extract-config.mjs <ISO> <out dir>
import fs from "node:fs";
import { TOWNS } from "../../universal/sample.mjs";
const [iso, dir] = process.argv.slice(2);
const extracts = Object.entries(TOWNS[iso]).map(([town, [lat, lon]]) => ({
  output: `${iso.toLowerCase()}-${town}.osm.pbf`,
  bbox: [lon - 0.06, lat - 0.04, lon + 0.06, lat + 0.04],
}));
fs.writeFileSync(`${dir}/${iso}.json`, JSON.stringify({ directory: dir, extracts }));
