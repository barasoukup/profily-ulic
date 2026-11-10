// Přerov: the city's technical map (DTM polohopis 2024) read from its vector tiles in S-JTSK instead of the
// national DTM of ČÚZK (pilot/public/towns/prerov.js).
//   CITY=prerov VARIANTS=city,prerov-dtm CACHE=disk node evaluation/ab.mjs
import { sources } from "../../pilot/public/towns/prerov.js";
export const about = "technická mapa Přerova (vektorové dlaždice, 2024)";
export const { surfaces, lines } = sources;
