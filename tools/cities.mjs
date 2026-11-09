// The city sites made from the Prague files (/brno/, /jihlava/, …): their page texts, the map servers
// their page may ask (CSP), credits, and for a town the box of its OSM extract (cut from Geofabrik's
// Czech Republic with osmium, as the deploy does). Read by tools/city_site.mjs, the local server, the
// deploy workflow (node tools/cities.mjs towns) and tools/drop_city_links.mjs.
// The app's own texts for a city are in pilot/public/city.js, a town's data sources in pilot/public/towns/.

const OSM_CREDIT = `© přispěvatelé <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> (ODbL)`;
const RUIAN_CREDIT = "budovy RÚIAN © ČÚZK (CC BY 4.0)";

// Order of the city switch.
export const NAMES = { praha: "Praha", brno: "Brno", jihlava: "Jihlava", most: "Most", opava: "Opava", plzen: "Plzeň" };

export const SITES = {
  brno: {
    gen: "Brna", // genitive: "Mapa Brna"
    adj: "brněnské", // "brněnské ilustrace"
    adjPl: "brněnských", // "profily brněnských ulic"
    adjInstr: "brněnskými",
    description: "Příčné profily brněnských ulic od fasády k fasádě z technické mapy Jihomoravského kraje, otevřených dat Brna a OpenStreetMap. Profil upravíte, porovnáte se stavem a uložíte jako obrázek.",
    ogDescription: "Příčné profily brněnských ulic z technické mapy a otevřených dat Brna: od fasády k fasádě, upravitelné, s brněnskými ilustracemi.",
    ogAlt: "Příčný profil brněnské ulice s tramvajemi, chodníky a domy, vedle název Profily ulic",
    stav: "z technické mapy, dat Brna a OSM",
    parking: "úseky placeného stání",
    // Map images from Brno's GIS and the DMVS (ČÚZK); on a click the city's GIS and open data (ArcGIS Online).
    img: ["https://gis.brno.cz", "https://dmvs.cuzk.gov.cz"],
    connect: ["https://gis.brno.cz", "https://services6.arcgis.com"],
    credits: `Data: © <a href="https://gis.brno.cz">Statutární město Brno</a> (technická mapa a MTVU; průzkum budov, cykloopatření a ortofoto, CC BY 4.0) ·
    úseky placeného stání © <a href="https://www.parkovanivbrne.cz">parkovanivbrne.cz</a> (Brněnské komunikace) ·
    podkladová technická mapa © DTM Jihomoravského kraje, IS DMVS ČÚZK ·
    ${OSM_CREDIT} ·
    ortofoto © ČÚZK (CC BY 4.0)`,
  },
  jihlava: {
    gen: "Jihlavy", adj: "jihlavské", adjPl: "jihlavských", adjInstr: "jihlavskými",
    description: "Příčné profily jihlavských ulic od fasády k fasádě z pasportu komunikací a dat města Jihlavy a OpenStreetMap. Profil upravíte, porovnáte se stavem a uložíte jako obrázek.",
    ogDescription: "Příčné profily jihlavských ulic z pasportu komunikací a dat města: od fasády k fasádě, upravitelné.",
    ogAlt: "Příčný profil jihlavské ulice s trolejbusem v pruhu pro BUS, chodníky a domy, vedle název Profily ulic",
    stav: "z dat města Jihlavy a OSM",
    parking: "parkovací místa města",
    img: ["https://gis.jihlava-city.cz"],
    connect: ["https://gis.jihlava-city.cz"],
    credits: `Data: © <a href="https://gis.jihlava-city.cz">Statutární město Jihlava</a> (pasport komunikací, parkování, technická mapa, stromy, lampy, zastávky, stojany na kola; ortofoto) ·
    budovy RÚIAN a katastr © ČÚZK (CC BY 4.0) ·
    ${OSM_CREDIT} ·
    ortofoto © ČÚZK (CC BY 4.0)`,
    bbox: "15.48,49.32,15.70,49.47",
  },
  most: {
    gen: "Mostu", adj: "mostecké", adjPl: "mosteckých", adjInstr: "mosteckými",
    description: "Příčné profily mosteckých ulic od fasády k fasádě z technické mapy města Mostu a OpenStreetMap. Profil upravíte, porovnáte se stavem a uložíte jako obrázek.",
    ogDescription: "Příčné profily mosteckých ulic z technické mapy a dat města: od fasády k fasádě, upravitelné.",
    ogAlt: "Příčný profil mostecké ulice s tramvají, chodníky a domy, vedle název Profily ulic",
    stav: "z technické mapy Mostu a OSM",
    parking: "parkoviště z technické mapy",
    img: ["https://mapy.mesto-most.cz"],
    connect: ["https://mapy.mesto-most.cz"],
    credits: `Data: © <a href="https://mapy.mesto-most.cz">Statutární město Most</a> (technická mapa, otevřená data) ·
    ${RUIAN_CREDIT} ·
    ${OSM_CREDIT} ·
    ortofoto © ČÚZK (CC BY 4.0)`,
    bbox: "13.55,50.45,13.75,50.56",
  },
  opava: {
    gen: "Opavy", adj: "opavské", adjPl: "opavských", adjInstr: "opavskými",
    description: "Příčné profily opavských ulic od fasády k fasádě z účelové mapy a dat města Opavy a OpenStreetMap. Profil upravíte, porovnáte se stavem a uložíte jako obrázek.",
    ogDescription: "Příčné profily opavských ulic z účelové mapy a dat města: od fasády k fasádě, upravitelné.",
    ogAlt: "Příčný profil opavské ulice s trolejbusem, chodníky a domy, vedle název Profily ulic",
    stav: "z účelové mapy Opavy a OSM",
    parking: "parkovací stání města",
    img: ["https://mapy.opava-city.cz"],
    connect: ["https://mapy.opava-city.cz"],
    credits: `Data: © <a href="https://mapy.opava-city.cz">Statutární město Opava</a> (účelová mapa povrchové situace, parkování, stromy, mobiliář, MHD) ·
    ${RUIAN_CREDIT} ·
    ${OSM_CREDIT} ·
    ortofoto © ČÚZK (CC BY 4.0)`,
    bbox: "17.80,49.86,18.00,49.99",
  },
  plzen: {
    gen: "Plzně", adj: "plzeňské", adjPl: "plzeňských", adjInstr: "plzeňskými",
    description: "Příčné profily plzeňských ulic od fasády k fasádě z technické mapy a dat města Plzně a OpenStreetMap. Profil upravíte, porovnáte se stavem a uložíte jako obrázek.",
    ogDescription: "Příčné profily plzeňských ulic z technické mapy a dat města: od fasády k fasádě, upravitelné.",
    ogAlt: "Příčný profil plzeňské ulice s tramvají, chodníky a domy, vedle název Profily ulic",
    stav: "z technické mapy Plzně a OSM",
    parking: "parkovací plochy města",
    img: ["https://ags.plzen.eu"],
    connect: ["https://ags.plzen.eu"],
    credits: `Data: © <a href="https://ags.plzen.eu/arcgis/rest/services">Statutární město Plzeň</a> (technická mapa, pasport zeleně a mobiliáře, doprava) ·
    ${RUIAN_CREDIT} ·
    ${OSM_CREDIT} ·
    ortofoto © ČÚZK (CC BY 4.0)`,
    bbox: "13.25,49.67,13.50,49.80",
  },
};

// The towns whose OSM tiles the deploy cuts from Geofabrik's Czech Republic.
export const TOWN_IDS = Object.keys(SITES).filter((id) => SITES[id].bbox);

// node tools/cities.mjs towns → "jihlava 15.48,49.32,15.70,49.47" per line, for the deploy workflow.
if (import.meta.url === `file://${process.argv[1]}` && process.argv[2] === "towns") {
  for (const id of TOWN_IDS) console.log(`${id} ${SITES[id].bbox}`);
}
