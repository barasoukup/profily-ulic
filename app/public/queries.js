// What the app asks IPR, in one place for both the browser (sources.js, static hosting) and the
// local server (server.mjs): layer addresses, fields and how the answers are read.
export const IPR = "https://gs-pub.praha.eu/arcgis/rest/services";
export const MTVU = `${IPR}/dtmp/dtmp/MapServer/15/query`;
export const MTVU_FIELDS = "CTVUK_KOD,CTVUK_POPIS";
export const TM_LINES = `${IPR}/dtmp/dtmp/MapServer/10/query`;
// Line features of the technical map: tram track axes (55010) plus barriers and slopes
// (guard rails, railings, fences and walls, retaining walls, hedges, top/bottom edges of slopes).
export const LINE_CODES = [55010, 71522, 71540, 61530, 61209, 61210, 71210, 81210, 91210, 61422, 71422, 81422, 81214, 42105, 42107];
export const LINE_WHERE = `CTMTP_KOD IN (${LINE_CODES.join(",")})`;
// Point features of the technical map (layer 9, "bodové značky"), one query per cut with the codes in
// one WHERE: tram overhead-line poles (26015), stop poles (75240, 75241), bollards (74110), trees outside
// parks (83130), poles without wires (76010).
export const TM_POINTS = `${IPR}/dtmp/dtmp/MapServer/9/query`;
export const POINT_CODES = [26015, 75240, 75241, 74110, 83130, 76010];
export const POINT_WHERE = `CTMTP_KOD IN (${POINT_CODES.join(",")})`;
export const PARKOVANI =`${IPR}/dop/zony_placeneho_stani/MapServer`;
// Parking sections (layer 3) and special stalls: ZTP (5, 6), deliveries (7), special (8).
export const PARKING_LAYERS = { 3: "useky", 5: "ztp", 6: "ztp", 7: "zasobovani", 8: "specialni" };
export const parkingFields = (layer) => (String(layer) === "3" ? "ZPS_ID,TYPZONY,PS_ZPS" : "ZPS_ID");
export const PODLAZNOST = "https://mp.iprpraha.cz/arcgis/rest/services/Hosted/URK_CUR_URK_SS_PODLAZNOST_P/FeatureServer/0/query";
export const PODLAZNOST_FIELDS = "pocet_podlazi,ustup_stres,podlaz_celk,strecha,typ,nova_budova,SHAPE__Area";

// Building floors from the first "Podlažnosti" feature: floors up to the cornice, roof / set-back
// floors, total, roof shape, kind of building, whether it is new against IPR's base map
// (nova_budova 1 = "nová budova": taken for a new build, Bára) and footprint. SHAPE__Area is in Web
// Mercator square metres: scaled back to the ground by cos² of the latitude.
export function podlaznostInfo(json, lat) {
  const a = json?.features?.[0]?.attributes;
  if (!a) return {};
  const area = a.SHAPE__Area ? Math.round(a.SHAPE__Area * Math.cos((lat * Math.PI) / 180) ** 2) : undefined;
  return { cornice: a.pocet_podlazi, roof: a.ustup_stres || 0, total: a.podlaz_celk, roofType: a.strecha, kind: a.typ, newBuild: a.nova_budova === 1, area };
}
