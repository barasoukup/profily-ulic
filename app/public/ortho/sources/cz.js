// Czechia: each city's best orthophoto (evaluation/orthophoto/REPORT.md; the key: city.js laneOrtho of the city, else the state's,
// countries/<ISO>.js): Prague IPR 10 cm (summer 2024), Brno's 2025 (tiles of about 10 cm, shifted against ČÚZK by 1.06 m east and
// 3.09 m north: evaluation/orthophoto/shift.mjs), Plzeň's 2024 (5 cm, asked at 10 cm, no shift), elsewhere ČÚZK 12.5 cm.
// shift: where the image shows a point, east and north (m). Prague's and Plzeň's maps are their towns' own (towns/<id>.js maps).
export const sources = [
  { id: "cuzk", res: 0.125, fine: false, service: { type: "wms", base: "https://ags.cuzk.gov.cz/arcgis1/services/ORTOFOTO/MapServer/WMSServer", layers: "0" },
    map: { kind: "wms", state: "cesko", limit: "kept", always: true, format: "image/jpeg", attribution: "ortofoto © ČÚZK" } },
  { id: "brno", res: 0.1, shift: [1.06, 3.09], credit: "credits.orthophotoStatutarniMestoBrno",
    service: { type: "xyz", base: "https://gis.brno.cz/ags1/rest/services/OMI/OMI_basemaps_ortofoto_2025_wgs/MapServer/tile", z: 20 },
    map: { kind: "tiles", town: "brno", limit: "none", always: true, maxNativeZoom: 21, attribution: "ortofoto 2025 © Statutární město Brno" } },
  { id: "plzen", res: 0.1, credit: "credits.orthophotoStatutarniMestoPlzen",
    service: { type: "ags", base: "https://ags.plzen.eu/arcgis/rest/services/Orto_2024_5cm_RGB_mimoveg/MapServer", jpgOnly: true, datum: "[1623]" } },
  { id: "ipr", res: 0.1, credit: "credits.orthophotoIprPraha2024",
    service: { type: "ags", base: "https://gs-pub.praha.eu/imgs/rest/services/ort/letecke_snimkovani/ImageServer", op: "exportImage", jpgOnly: true } },
];
