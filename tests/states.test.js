// The states one table (code-health plan step 9): what every state's own test file asked the same way, here once for all of
// countries/ and states.json: which state a point belongs to (borders, islands, enclaves, the closed regions), its ISO
// code, driving on the left, and that every sign the state draws is a file with a viewBox. What is special to a state
// (its norms, its mapping of signs, its data) stays in the state's own file. No network.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { loadCities } from "./helpers/cities.js";
import { exists, publicUrl } from "./helpers/files.js";
import { COUNTRIES } from "../app/public/countries/index.js";
import { SIGNS } from "../app/public/signs.js";

// [lat, lon, the city cityAt gives ("!x": anything but x), what closedAt gives (undefined: not asked, null: nothing, regexp: the message)].
const POINTS = {
  // Praha, Brno, Most, Ústí (the towns of towns.json), Česká Třebová, Český Těšín (the border is the Olza), Cheb.
  czechia: [[50.0875, 14.4208, "praha"], [49.1951, 16.6085, "brno"], [50.503, 13.6363, "most"], [50.6607, 14.0322, "usti"],
    [49.907481, 16.442219, "cesko"], [49.7477, 18.6262, "cesko"], [50.0796, 12.3739, "cesko"]],
  // Ostrava, Frýdek-Místek, Karviná, Třebíč, Přerov (the Moravian towns of 10. 11. 2026), Havířov is "cesko".
  moravia: [[49.8355, 18.2924, "ostrava"], [49.6837, 18.3504, "frydek-mistek"], [49.8542, 18.542, "karvina"], [49.215, 15.8799, "trebic"],
    [49.4555, 17.451, "prerov"], [49.7787, 18.4372, "cesko"]],
  // Bratislava (Suché mýto), Košice (Hlavná).
  slovakia: [[48.146736, 17.106998, "slovensko"], [48.7206, 21.258, "slovensko"]],
  // Wien (Stephansplatz), Graz.
  austria: [[48.2085, 16.3731, "austria"], [47.0707, 15.4395, "austria"]],
  // München, Berlin (Brandenburger Tor), Freilassing by Salzburg, Kehl; Strasbourg is France (since 22. 11. 2026).
  germany: [[48.137, 11.575, "germany"], [52.5163, 13.3777, "germany"], [47.835, 12.98, "germany"], [48.5734, 7.8105, "germany"], [48.5818, 7.7509, "france"]],
  // Brussels, Ghent, Liège; Luxembourg, Esch-sur-Alzette; the neighbours Maastricht, Aachen.
  belgium: [[50.8467, 4.3525, "belgium"], [51.0543, 3.7174, "belgium"], [50.6326, 5.5797, "belgium"], [49.6116, 6.1319, "luxembourg"],
    [49.4958, 5.9806, "luxembourg"], [50.8514, 5.691, "netherlands"], [50.7753, 6.0839, "germany"]],
  // Nicosia, Limassol, Akrotiri (a British base), Xylotymbou (inside Dhekelia), Pyla, Mammari (the buffer zone inside OSM's
  // border); the north (Nicosia, Kyrenia) has no profile.
  cyprus: [[35.17, 33.36, "cyprus", null], [34.68, 33.045, "cyprus"], [34.585, 32.985, "cyprus"], [35.013, 33.738, "cyprus"],
    [35.185, 33.364, "cizina", /Kypr/], [35.34, 33.319, "cizina"], [35.0142, 33.6925, "cyprus", null], [35.1756, 33.2051, "cyprus"]],
  // Rådhuspladsen, Nyhavn, Islands Brygge, Aarhus, Odense, Aalborg, Rønne (Bornholm), Skagen, Padborg, Kruså, Esbjerg, Helsingør;
  // Flensburg; Malmö, Helsingborg, Tórshavn (Faroes), Nuuk (Greenland).
  denmark: [[55.6761, 12.5685, "denmark"], [55.6798, 12.591, "denmark"], [55.664, 12.577, "denmark"], [56.1567, 10.2108, "denmark"],
    [55.3959, 10.3883, "denmark"], [57.0488, 9.9217, "denmark"], [55.1009, 14.7066, "denmark"], [57.7209, 10.5839, "denmark"],
    [54.8256, 9.3612, "denmark"], [54.8506, 9.4053, "denmark"], [55.4765, 8.4594, "denmark"], [56.0361, 12.6136, "denmark"],
    [54.7836, 9.4321, "germany"], [55.605, 13.0038, "cizina"], [56.0465, 12.6945, "cizina"], [62.0107, -6.7741, "cizina"], [64.1814, -51.6941, "cizina"]],
  // Tallinn, Tartu, Haapsalu, Narva, Saaremaa; Riga, Helsinki, across the Narva.
  estonia: [[59.437, 24.7536, "estonia"], [58.378, 26.729, "estonia"], [58.385, 24.4966, "estonia"], [59.3772, 28.1903, "estonia"], [58.2528, 22.4853, "estonia"],
    [56.9496, 24.1052, "!estonia"], [60.1699, 24.9384, "!estonia"], [59.37, 28.32, "!estonia"]],
  // Helsinki, Suomenlinna, the Market Square quay, Mariehamn (Åland), Tornio, Oulu, Utsjoki, Vaalimaa, Imatra, Karigasniemi;
  // Haparanda, Vyborg, Svetogorsk, Karasjok, Kirkenes, Stockholm.
  finland: [[60.1695, 24.938, "finland"], [60.1455, 24.988, "finland"], [60.1673, 24.9545, "finland"], [60.0973, 19.9348, "finland"],
    [65.8481, 24.1466, "finland"], [65.0121, 25.4651, "finland"], [69.9078, 27.0281, "finland"], [60.585, 27.84, "finland"],
    [61.1717, 28.7614, "finland"], [69.3986, 25.8442, "finland"],
    [65.8355, 24.1368, "cizina"], [60.7096, 28.7491, "cizina"], [61.111, 28.857, "cizina"], [69.4719, 25.5112, "cizina"], [69.727, 30.045, "cizina"], [59.33, 18.06, "cizina"]],
  // Paris, Strasbourg, Ajaccio; Kehl, Genève, Bruxelles; Llívia (a Spanish enclave: a hole of France's ring, a ring of Spain's); Monaco.
  france: [[48.8566, 2.3522, "france"], [48.5734, 7.7521, "france"], [41.9192, 8.7386, "france"], [48.57, 7.815, "germany"],
    [46.2044, 6.1432, "switzerland"], [50.8503, 4.3517, "belgium"], [42.465, 1.98, "spain"], [43.7384, 7.4246, "monaco"]],
  // Bologna, Modena, Turin, Bolzano (twice), Milan (Lombardy by its DBT), Bergamo, Campione d'Italia (Italy inside Switzerland);
  // Rome, Genoa (Liguria), Novara (Piedmont by the Ticino), Verona (Veneto), Bari, the Vatican, San Marino: no profile.
  italy: [[44.4949, 11.3426, "italy", null], [44.6471, 10.9252, "italy"], [45.0703, 7.6869, "italy"], [46.4983, 11.3548, "italy"], [46.6713, 11.159, "italy"],
    [45.4642, 9.19, "italy"], [45.695, 9.67, "italy"], [45.969, 8.971, "italy"],
    [41.9028, 12.4964, "cizina", /Itálie/], [44.407, 8.934, "cizina", /Itálie/], [45.4469, 8.6218, "cizina", /Itálie/], [45.4384, 10.9916, "cizina", /Itálie/],
    [41.1171, 16.8719, "cizina", /Itálie/], [41.9029, 12.4534, "cizina", /Itálie/], [43.9356, 12.4473, "cizina", /Itálie/], [44.494, 11.343, "italy", null]],
  // Vilnius, Kaunas, Klaipėda (the port), Šiauliai, Panevėžys, Alytus, Nida; Riga, Minsk, Kaliningrad, Suwałki, Daugavpils.
  lithuania: [[54.6872, 25.2797, "lithuania"], [54.897, 23.9262, "lithuania"], [55.7075, 21.1335, "lithuania"], [55.9349, 23.3137, "lithuania"],
    [55.7348, 24.3575, "lithuania"], [54.3964, 24.0459, "lithuania"], [55.3036, 21.0065, "lithuania"],
    [56.9496, 24.1052, "!lithuania"], [53.9006, 27.559, "!lithuania"], [54.7104, 20.4522, "!lithuania"], [54.1118, 22.9309, "!lithuania"], [55.8714, 26.5161, "!lithuania"]],
  // Valletta, Victoria (Gozo), Comino.
  malta: [[35.8989, 14.5146, "malta"], [36.0443, 14.2397, "malta"], [36.0128, 14.3368, "malta"]],
  // Monte-Carlo, Monaco-Ville; the review of 23. 11. 2026: Mareterra and the Boulevard du Général Leclerc are Monaco, Beausoleil and
  // Cap-d'Ail France (the last two twice), Gibraltar and Andorra abroad; the quays of Barcelona, Lisbon, Funchal and La Restinga
  // within the coast's tolerance.
  monaco: [[43.7447, 7.431, "monaco"], [43.731, 7.419, "monaco"], [43.7445, 7.43, "monaco"], [43.7365, 7.427, "monaco"], [43.742, 7.423, "france"],
    [43.724, 7.406, "france"], [36.1408, -5.3536, "cizina"], [36.147, -5.36, "cizina"], [42.5063, 1.5218, "cizina"], [41.3755, 2.183, "spain"],
    [27.643, -17.981, "spain"], [38.71, -9.125, "portugal"], [32.6455, -16.905, "portugal"], [43.7556, 7.4296, "france"], [43.7225, 7.405, "france"]],
  // Amsterdam, Rotterdam, Maastricht, Nijmegen; Kleve.
  netherlands: [[52.3727, 4.8933, "netherlands"], [51.9225, 4.4792, "netherlands"], [50.8514, 5.691, "netherlands"], [51.8126, 5.8372, "netherlands"], [51.788, 6.139, "germany"]],
  // Warszawa, Kraków; Český Těšín, Frankfurt (Oder); PRG's exact border: Zgorzelec by the Altstadtbrücke, Görlitz, Słubice, Gubin.
  poland: [[52.2297, 21.0122, "poland"], [50.0614, 19.9383, "poland"], [49.7477, 18.6262, "cesko"], [52.343, 14.551, "germany"],
    [49.7497, 18.6328, "poland"], [51.1555, 14.999, "poland"], [51.1555, 14.99, "germany"], [52.35, 14.557, "poland"], [51.95, 14.728, "poland"]],
  // Lisboa, Porto, Funchal, Ponta Delgada; Vigo across the Minho.
  portugal: [[38.7223, -9.1393, "portugal"], [41.1579, -8.6291, "portugal"], [32.6496, -16.9086, "portugal"], [37.7412, -25.6756, "portugal"], [42.2406, -8.7207, "spain"]],
  // Ljubljana, Maribor, Koper, Nova Gorica, Šentilj, Obrežje, Piran; Gorizia, Trieste, Bregana, Zagreb, Umag; Spielfeld is Austria.
  slovenia: [[46.0514, 14.5058, "slovenia"], [46.558, 15.646, "slovenia"], [45.548, 13.73, "slovenia"], [45.956, 13.648, "slovenia"], [46.681, 15.65, "slovenia"],
    [45.849, 15.682, "slovenia"], [45.528, 13.568, "slovenia"], [45.94, 13.62, "!slovenia"], [45.649, 13.777, "!slovenia"], [46.708, 15.636, "austria"],
    [45.839, 15.7, "!slovenia"], [45.813, 15.977, "!slovenia"], [45.434, 13.521, "!slovenia"]],
  // Madrid, Barcelona, Palma, Las Palmas, Ceuta, Llívia; Andorra la Vella, Gibraltar; Biarritz.
  spain: [[40.4168, -3.7038, "spain"], [41.3874, 2.1686, "spain"], [39.5696, 2.6502, "spain"], [28.1235, -15.4363, "spain"], [35.8894, -5.3213, "spain"],
    [42.465, 1.98, "spain"], [42.5063, 1.5218, "cizina"], [36.1408, -5.3536, "cizina"], [43.48, -1.56, "france"]],
  // Zürich, Genève, Lugano, Vaduz, Schaan, St. Margrethen; Büsingen (a hole in Switzerland), Konstanz, Feldkirch, Annemasse.
  switzerland: [[47.3725, 8.539, "switzerland"], [46.2044, 6.1432, "switzerland"], [46.0037, 8.9511, "switzerland"], [47.141, 9.5215, "liechtenstein"],
    [47.2115, 9.5375, "liechtenstein"], [47.4875, 9.5617, "switzerland"], [47.6965, 8.6824, "germany"], [47.6633, 9.1753, "germany"],
    [47.2338, 9.5992, "austria"], [46.1934, 6.2363, "!switzerland"]],
  // The White House, the DC line (Southern Avenue: simplified county rings left a gap), New York's five boroughs; Baltimore,
  // Richmond, Jersey City, Yonkers, Hempstead, Silver Spring, Hyattsville, Arlington, Alexandria, Fairfax city, Tysons: the USA
  // beyond the metros (a message, no profile).
  usa: [[38.8977, -77.0365, "usa", null], [38.8436094, -76.9725878, "usa", null]],
  "usa-metros": [[38.8977, -77.0365, "washington"],
    [40.7128, -74.006, "newyork", null], [40.7282, -73.7949, "newyork", null], [40.8448, -73.8648, "newyork", null], [40.5795, -74.1502, "newyork", null], [40.6782, -73.9442, "newyork", null],
    [39.2904, -76.6122, "cizina", /Washington/], [37.5407, -77.436, "cizina", /Washington/], [40.7178, -74.0431, "cizina", /Washington/], [40.9312, -73.8988, "cizina", /Washington/],
    [40.7062, -73.6187, "cizina", /Washington/], [38.9907, -77.0261, "cizina", /Washington/], [38.9559, -76.9455, "cizina", /Washington/], [38.8816, -77.091, "cizina", /Washington/],
    [38.8048, -77.0469, "cizina", /Washington/], [38.8462, -77.3064, "cizina", /Washington/], [38.9187, -77.2311, "cizina", /Washington/]],
  // Boston (City Hall, Dorchester, East Boston), its metro (Cambridge, Somerville, Brookline, Newton, Quincy, Lowell); Worcester,
  // Providence, Salem: closed with a message naming the metros.
  boston: [[42.3603, -71.0578, "boston"], [42.3016, -71.0676, "boston"], [42.375, -71.039, "boston"],
    [42.3736, -71.1097, "bostonmetro"], [42.3876, -71.0995, "bostonmetro"], [42.3318, -71.1212, "bostonmetro"], [42.337, -71.209, "bostonmetro"],
    [42.2529, -71.0023, "bostonmetro"], [42.6334, -71.3162, "bostonmetro"],
    [42.2626, -71.8023, "cizina", /Boston/], [41.824, -71.4128, "cizina", /Boston/], [42.5195, -70.8967, "cizina", /Boston/]],
  // Market Street, the Ferry Building, the Mission, Treasure Island; Daly City, Oakland, Sausalito, Berkeley: closed.
  sanfrancisco: [[37.7848, -122.4071, "sanfrancisco"], [37.7955, -122.3937, "sanfrancisco"], [37.7599, -122.4148, "sanfrancisco"], [37.8235, -122.3706, "sanfrancisco"],
    [37.6879, -122.4702, "cizina", /San Francisco/], [37.8044, -122.2712, "cizina", /San Francisco/], [37.8591, -122.4853, "cizina", /San Francisco/], [37.8715, -122.273, "cizina", /San Francisco/]],
  // Toronto (downtown, the islands) and the municipalities around it (Mississauga, Markham, Pickering, north of Steeles): closed;
  // Windsor, Queenston, Niagara Falls ON, Fort Erie, Sarnia, Hamilton, Montreal, Vancouver, Halifax, Prince Rupert, Tofino: closed
  // with Toronto's message; Juneau, Ketchikan, Sitka, Atlantic City, Charleston, Detroit, Lewiston, Niagara Falls NY, Buffalo,
  // Port Huron with Washington's; Nuevo Laredo, Tijuana, Matamoros, Juárez, Mexicali: nothing to close.
  canada: [[43.6535, -79.3839, "toronto"], [43.623, -79.38, "toronto"],
    ...[[43.589, -79.644], [43.8668, -79.2663], [43.84, -79.09], [43.83, -79.45], [42.3185, -83.0395], [43.165, -79.053], [43.0896, -79.075], [42.905, -78.925],
      [42.975, -82.405], [43.2557, -79.8711], [45.5019, -73.5674], [49.2827, -123.1207], [44.6488, -63.5752], [54.315, -130.3209], [49.153, -125.9066]]
      .map(([la, lo], i) => [la, lo, i < 4 ? "cizina" : undefined, /Toronto/]),
    ...[[58.3019, -134.4197], [55.3422, -131.6461], [57.0531, -135.33], [39.355, -74.432], [32.7765, -79.9311], [42.33, -83.044], [43.1726, -79.0354], [43.087, -79.06],
      [42.8864, -78.8784], [42.975, -82.425]].map(([la, lo]) => [la, lo, undefined, /Washington/]),
    ...[[27.4861, -99.507], [32.5149, -117.0382], [25.869, -97.5027], [31.73, -106.485], [32.6245, -115.4523]].map(([la, lo]) => [la, lo, undefined, null])],
};
const CODES = { cesko: "CZ", slovensko: "SK", austria: "AT", germany: "DE", washington: "US", belgium: "BE", luxembourg: "LU", cyprus: "CY", denmark: "DK", estonia: "EE", finland: "FI", france: "FR", italy: "IT", lithuania: "LT", malta: "MT",
  monaco: "MC", netherlands: "NL", poland: "PL", portugal: "PT", slovenia: "SI", spain: "ES", switzerland: "CH", liechtenstein: "LI", usa: "US", newyork: "US",
  boston: "US", sanfrancisco: "US", toronto: "CA" };
const AMERICA = new Set(["usa", "usa-metros", "boston", "sanfrancisco", "canada"]);

for (const [state, points] of Object.entries(POINTS)) {
  test(`stát podle hranic: ${state}`, async () => {
    const C = await loadCities(AMERICA.has(state) ? { america: true, towns: state === "usa" ? [] : ["towns-us.json", "towns-ca.json"] } : {});
    for (const [lat, lon, city, closed] of points) {
      if (city?.startsWith("!")) assert.notEqual(C.cityAt(lat, lon), city.slice(1), `${lat},${lon}`);
      else if (city) assert.equal(C.cityAt(lat, lon), city, `${lat},${lon}`);
      if (closed === null) assert.equal(C.closedAt(lat, lon), null, `${lat},${lon} není zavřené`);
      else if (closed) assert.match(C.closedAt(lat, lon) || "", closed, `${lat},${lon} zavřené s hláškou`);
    }
  });
}

test("kód státu podle města: ISO ve státě a v městech státu", async () => {
  const C = await loadCities({ america: true, towns: ["towns-us.json", "towns-ca.json"] });
  for (const [city, code] of Object.entries(CODES)) assert.equal(C.countryOfCity(city).code, code, city);
});

test("jízda vlevo jen na Kypru a na Maltě", () => {
  assert.deepEqual(Object.entries(COUNTRIES).filter(([, c]) => c.leftHand).map(([k]) => k).sort(), ["CY", "MT"]);
});

// Every sign a state draws is a file: the keys of the signs (SIGNS), with the plates and directions they come with, through
// each state's own `signs.file`, the speeds apart; and every file of a state's folder has a viewBox, from which profile.js
// loadSign reads the sign's size (without it the sign is not drawn).
const KEYS = [...Object.keys(SIGNS), "ip11b", "ip11c"];
const PLATES = [undefined, "protismer", "obsluha", "kolo", "kola", "podelne", "kolme", "sikme"];
const SPEEDS = [5, 10, 15, 20, 25, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120, 130];
// The signs of DK without a viewBox (Commons files with width and height only): not drawn (docs/backlog.md).
const WITHOUT_VIEWBOX = { "signs-DK": ["C19", "C21", "C22.1", "C25.1", "C26.2", "C61", "C62", "D21", "D22", "D26", "D26.2", "D27", "E33.1", "E42", "E43", "E49"] };
// Files a state's tests named by hand (its pictures of plates and speeds, the shapes of its mapping) and that must be there.
const speeds = (prefix, list) => list.map((v) => `${prefix}${v}`);
const NAMED = {
  "signs-BE": ["C1", "C3", "C11", "C19", "C43_50", "E1", "E3", "E9", "F4a", "F19", "F12a", "F103", "D07", "D09", "D10", "D11"],
  "signs-LU": ["C_2", "C_1a", "C_3c", "C_14_50", "E_13a", "C_18", "C_19", "E_23", "H_1_1", "E_25a", "D_4", "D_5b"],
  "signs-PL": ["B-1", "B-2", "B-2_T-22", "B-33-50", "B-43-30", "D-3", "D-3_T-22", "D-18", "T-29", "D-40", "C-13", "C-13-16", "C-16"],
  "signs-NL": ["C1", "C2", "C3", "C12", "C14", "C16", "E1", "E2", "E4", "E6", "E9", "F13", "G1", "G3", "G5", "G7", "G7_Zone", "G11", "A1_30_Zone", "A1-50"],
  "signs-LT": ["301", "503", "329", "413a", "413b", "846", "853"],
  "signs-PT": ["H3", "C1", "C1-plus-10e", ...speeds("C13-", [10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120])],
  "signs-EE": ["521-plus-836", "331-plus-891a-kolo", "525b", "331", ...speeds("351-", [5, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110])],
  "signs-FI": ["E14.1", "C17", "D7.2", ...speeds("C32-", [20, 30, 40, 50, 60, 70, 80, 100, 120])],
  "signs-DK": ["C55"],
  "signs-IT": speeds("II-50-", [10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120, 130]),
  "signs-ES": speeds("R-301-", [10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120]),
  "signs-SI": speeds("2232-", [10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120, 130]),
  "signs-CY": speeds("speed-", [10, 20, 30, 40, 50, 60, 70, 80, 90, 100]),
};
const DIRS = [...new Set(Object.values(COUNTRIES).map((c) => c.signs?.dir).filter(Boolean))];

for (const [code, country] of Object.entries(COUNTRIES)) {
  if (!country.signs?.file) continue;
  test(`značky: soubor každé značky ${code} existuje`, () => {
    const files = new Set();
    for (const k of KEYS) for (const plate of PLATES) for (const extra of [{}, { dir: "forward" }, { dir: "backward" }, { walk: "left" }]) {
      const sign = { k, plate, ...extra };
      if (country.signs.drawable && !country.signs.drawable(sign, extra)) continue;
      for (const f of [country.signs.file(sign), country.signs.file({ k, plate }, extra)]) if (f) files.add(f);
    }
    for (const v of SPEEDS) { const f = country.signs.file({ k: "b20a", v }); if (f) files.add(f); }
    for (const f of files) assert.ok(exists(`${country.signs.dir}/${f}.svg`), `${code}: ${f}`);
  });
}

for (const dir of DIRS) {
  test(`značky: každý soubor ${dir} má viewBox a to, co testy jmenují, existuje`, () => {
    const noViewBox = fs.readdirSync(publicUrl(`${dir}/`)).filter((f) => f.endsWith(".svg"))
      .filter((f) => !/viewBox="[-\d.]+[ ,]+[-\d.]+[ ,]+[\d.]+[ ,]+[\d.]+"/.test(fs.readFileSync(publicUrl(`${dir}/${f}`), "utf8"))).map((f) => f.slice(0, -4));
    assert.deepEqual(noViewBox.sort(), (WITHOUT_VIEWBOX[dir] || []).sort(), `${dir}: značky bez viewBox`);
    for (const f of NAMED[dir] || []) assert.ok(exists(`${dir}/${f}.svg`), `${dir}/${f}`);
  });
}

// The keys a state has a picture for (each of them is a file, above); a key a state does not draw is null in its own test.
const BASE = ["b1", "b11", "b8", "b30", "b28", "b29", "c8a", "c9a", "c10a", "c7a", "ip11a", "ip14a", "ip15a", "ip20a", "zona30", "ip26a", "ip27a"];
const DRAWN = {
  CH: BASE, LI: BASE,
  EE: ["b1", "b11", "b8", "b30", "b28", "b29", "ip11a", "ztp", "ip12", "ip14a", "ip20a", "zona30", "ip26a", "ip27a", "c8a", "c9a", "c10a", "c7a"],
  FI: [...BASE, "cyklozona"],
  IT: ["b1", "b11", "b8", "b30", "b28", "b29", "ip11a", "ztp", "ip14a", "ip15a", "zona30", "ip26a", "ip27a", "c8a", "c9a", "c10a", "c7a"],
  LT: ["b1", "b11", "b8", "b30", "b28", "b29", "ip11a", "ip12", "ip14a", "ip15a", "ip20a", "zona30", "ip26a", "cyklozona", "c8a", "c7a", "c9a"],
  PT: [...BASE, "sdilena"],
  SI: ["b1", "b11", "b8", "b30", "b28", "b29", "ip11a", "ip14a", "ip20a", "zona30", "ip26a", "ip27a", "sdilena", "c8a", "c9a", "c10a", "c7a"],
  ES: ["b1", "b11", "b8", "b30", "b28", "b29", "ip11a", "ip15a", "ip20a", "zona30", "ip26a", "sdilena", "ip27a", "c8a", "c9a", "c10a", "c7a"],
  DK: ["b1", "b11", "b8", "b30", "b28", "b29", "ip11a", "ip14a", "ip15a", "ip26a", "ip27a", "cyklozona", "c8a", "c9a", "c7a"],
};
test("značky: tyto klíče stát kreslí (soubor není null)", () => {
  for (const [code, keys] of Object.entries(DRAWN)) for (const k of keys) assert.ok(COUNTRIES[code].signs.file({ k }, null), `${code}: ${k}`);
});
