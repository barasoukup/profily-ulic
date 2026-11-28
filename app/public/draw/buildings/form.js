// The shape of a house: floors, storey heights, roof, gable; the height of an edge. Side outline in cm.
import { AMERICA } from "../../houses-america-spec.js";
import { houseHash, LOOKS } from "../../house-looks.js";
import { BASE_STYLE, buildingStyle, houseDetails, IPR_ROOF, MED_LOOKS, pitchedLow } from "./style.js";
import { buildingHeight, buildingLevels, edgeInfo, heightFloors } from "./info.js";
import { cityArt } from "../art.js";
import { EDGE } from "../svg.js";

const STOREY = { sikma: 360, sorela: 330, typovy: 300, povalecny: 290, mestan: 330, skola: 380, kostel: 1000, garaz: 260, funkce: 310, moderni: 300, plocha: 280, kancelar: 330, nizky: 300, vila: 300, kostka: 280, novyrd: 280, statek: 280, hala: 700,
  haussmann: 330, stredomori: 340, azulejo: 320, galeria: 330, malta: 360, kypr: 380, cihlovy: 310, stit: 310, dansky: 300, stenstad: 330, drevak: 270, puukaupunki: 290, tallinnamaja: 290, hanza: 320 }; // typical storey (cm); a hall is one tall storey
const DEFAULT_FLOORS = { sikma: 5, sorela: 5, typovy: 4, povalecny: 5, mestan: 3, skola: 3, kostel: 1, garaz: 1, funkce: 6, moderni: 6, plocha: 8, kancelar: 5, nizky: 1, vila: 2, kostka: 2, novyrd: 2, statek: 1, hala: 1,
  haussmann: 7, stredomori: 5, azulejo: 4, galeria: 5, malta: 3, kypr: 2, cihlovy: 4, stit: 4, dansky: 5, stenstad: 5, drevak: 2, puukaupunki: 1, tallinnamaja: 3, hanza: 3 };
const PITCH = Math.tan((40 * Math.PI) / 180);
export const RIDGE = 260; // ridge of a family house, from its street facade (cm)

// Side outline of a Prague building: floors, storey height, roof floors and the height of each part (cm).
export const ARCADE_D = 260; // how far the drawn arcade reaches from the facade into the house (cm)
// Roof pitch of the family houses: the low hipped roof of the "cube", the steep one of a new house.
const deg = (a) => Math.tan((a * Math.PI) / 180);
const ROOF_PITCH = { kostka: deg(18), novyrd: deg(38), mestan: deg(52), kostel: deg(55),
  stredomori: deg(20), azulejo: deg(22), galeria: deg(28), kypr: deg(18), dansky: deg(45), stenstad: deg(30), drevak: deg(35), puukaupunki: deg(27), tallinnamaja: deg(27) };
// The ground floor of the regional looks: Haussmann's shop floor with its entresol, the Hanseatic house's hall.
const GROUND_K = { haussmann: 1.5, stenstad: 1.2, stredomori: 1.2, azulejo: 1.2, galeria: 1.2, malta: 1.1, kypr: 1, cihlovy: 1.2, stit: 1.2, dansky: 1.1, hanza: 1.4, drevak: 1, puukaupunki: 1, tallinnamaja: 1 };
// A family house's ridge lies within the 4 m strip (the small wooden houses too); a tenement's deeper.
export const SMALL_RIDGE = new Set(["drevak", "puukaupunki"]);
// A canal house's raised ground floor over its stoep (every other house, by its place).
export const stoepZ = (kind, info) => ((kind === "cihlovy" || kind === "stit") && houseHash(info) % 2 === 1 ? 75 : 0);
// The roof of a gabled house seen from the side: the band of its slope up to the ridge running away from the street.
export const GABLE_RISE = { stit: 400, hanza: 480 };
// With the gable's outline (LOOKS.gables, ?stit=0 off): the gable stands on the wall's top across its whole width (0 to
// EDGE, its axis GABLE_C in the middle), two to three storeys tall, the roof running back hidden behind it. The house is
// mirror-symmetric to that axis (Bára 23. 11. 2026): the window columns of all its floors (the door and the ground-floor
// window too) stand in GABLE_AXES (the centres of the front and back column), the gable's windows keep them; its
// narrower top holds one window in the axis. Its form by the house's place: the North Sea's step, neck or bell
// gable; Tallinn's plain gable, every fourth stepped. Heights in storeys (GABLE_TOP: the top of the outline).
export const GABLE_C = EDGE / 2;
const GABLE_AXES = { stit: [GABLE_C - 95, GABLE_C + 95], hanza: [GABLE_C - 70, GABLE_C + 70] };
// The default (Bára 23. 11. 2026; ?stit=cely: the whole symmetric gable, LOOKS.gableCut false): the house 6 m wide with three window columns, the frame
// showing its street-side two thirds (the axis and the front column inside, the back column out of it, cut at EDGE).
const GABLE_CUT_C = 300, GABLE_CUT_AXES = [140, 300, 460];
export const gableC = () => (LOOKS.gableCut ? GABLE_CUT_C : GABLE_C);
export const gableAxes = (kind) => (LOOKS.gableCut ? GABLE_CUT_AXES : GABLE_AXES[kind]);
export const gableForm = (kind, info) => (kind === "hanza" ? (houseHash(info) % 4 === 0 ? "trap" : "plain") : ["trap", "hals", "klok"][houseHash(info) % 3]);
export const GABLE_TOP = { trap: 2.3, hals: 2.38, klok: 2.4, plain: 2.0, htrap: 2.38 };
const gableTop = (kind, info) => GABLE_TOP[kind === "hanza" && gableForm(kind, info) === "trap" ? "htrap" : gableForm(kind, info)];
export const GABLE_LOW = 0.72; // a one-storey house under a gable: the gable is lower, in proportion
export const gableOn = (kind) => !!GABLE_RISE[kind] && LOOKS.gables;
export const BARN_RISE = 380; // a village house: its roof rises this high (cm) from the eaves to the ridge (6–8 m deep house)
// A tenement's side gable (Bára 23. 11. 2026: the round window belongs under the ridge, and the ridge must show): like the
// gabled houses' default, the frame shows the street-side part of the gable, its ridge at TENEMENT_RIDGE (cm from the
// street facade) and the back slope running down to the cut. Only a tenement without a mansard (its gable is plain).
export const TENEMENT_RIDGE = 300;
export const tenementGable = (kind, roofRows, flat) => (kind === "sikma" || kind === "haussmann") && !roofRows && !flat;
// The wall between the top floor's window heads and the main cornice (Bára 23. 11. 2026: the cornice must not sit on the
// windows): the attic's knee wall over the top floor's ceiling, added to the wall's height (cm at the look's own storey,
// scaled with it). About 1.5 m on a Prague tenement from the window head to the cornice's underside (an architrave line,
// the frieze, the cornice on its consoles).
const FRIEZE = { sikma: 145, mestan: 130, sorela: 180, typovy: 25, haussmann: 75, stenstad: 115, stredomori: 45, azulejo: 45, malta: 20,
  kypr: 20, cihlovy: 65, dansky: 80 };
// A house of North America (houses-america.js): its first floor over its base, the known height setting the storey.
function americaForm(info, kind) {
  const A = AMERICA[kind], h = buildingHeight(info), lv = buildingLevels(info);
  const k = A.groundK || 1;
  const n = Math.max(1, lv?.n || (h ? Math.max(1, Math.round((h * 100 - A.base - A.attic) / A.storey)) : A.floors));
  const s0 = info?.height ? (info.height * 100 - A.base - A.attic) / (n - 1 + k) : A.storey;
  const storey = Math.min(A.storey * 1.5, Math.max(A.storey * 0.7, s0));
  const ground = A.base + storey * k;
  return { n, roofRows: 0, storey, base: A.base, ground, body: ground + (n - 1) * storey + A.attic, roofH: A.roof, flat: true, pitch: PITCH, chimney: 0 };
}
export function buildingForm(info, kind) {
  if (AMERICA[kind]) return americaForm(info, kind);
  const style = BASE_STYLE[kind] || kind;
  const lv = buildingLevels(info);
  const h = buildingHeight(info);
  const n = style === "hala" || kind === "kostel" || kind === "garaz" ? 1 : Math.max(1, lv?.n || heightFloors(h) || DEFAULT_FLOORS[kind]);
  let roofRows = style !== "hala" && kind !== "kostel" && kind !== "garaz" && lv?.roof && lv.cornice ? Math.min(lv.roof, n - 1) : 0;
  // A Haussmann house always has its zinc mansard: one floor of its seven, two from seven floors.
  if (kind === "haussmann" && !roofRows && n >= 3) roofRows = n >= 7 ? 2 : 1;
  // The brick, wooden and Mediterranean houses draw their roof floors in the roof (dormers, a gable), not as a mansard.
  if (style === "cihla" || style === "drevo" || MED_LOOKS.has(kind)) roofRows = 0;
  // A gable turned towards us (?stit=1) holds the top floor: the floors below it are one fewer.
  if (gableOn(kind) && n >= 3) roofRows = 1; // (a one- or two-storey house has its whole wall below the gable)
  const S = STOREY[kind];
  // A known height sets the storey (within reason); pitched roofs sit above it.
  const storey = h ? Math.min(S * 1.5, Math.max(S * 0.7, (h * 100) / n)) : S;
  // Tenements have a taller ground floor.
  // A panel house stands on a 100 cm plinth (raised ground floor).
  // A "cube" family house has a raised ground floor over its half-sunk garage and cellar.
  const ground = GROUND_K[kind] ? storey * GROUND_K[kind] : kind === "sikma" ? storey * 1.2 : style === "sikma" ? storey * 1.1 : style === "funkce" ? storey * 1.15
    : kind === "plocha" ? storey + 90 : kind === "kostka" ? storey + 110 : storey;
  const frieze = FRIEZE[kind] && !gableOn(kind) ? (FRIEZE[kind] * storey) / S : 0;
  const body = ground + (n - roofRows - 1) * storey + frieze;
  const flat = style === "plocha" || style === "funkce" || style === "povalecny" || style === "moderni" || style === "hala" || kind === "garaz"
    || (kind === "skola" && (info?.built ?? info?.period) > 1955) || (kind === "nizky" && !pitchedLow(info))
    // Malta's houses and the south's terraces (azotea, terrazza): a flat roof behind a balustrade.
    || kind === "malta" || (MED_LOOKS.has(kind) && (houseDetails(kind, info).terrace ?? (kind === "kypr" ? !(info?.roofShape && info.roofShape !== "flat") : info?.roofShape === "flat")));
  const pitch = ROOF_PITCH[kind] || PITCH;
  const sawtooth = style === "hala" && ["industrial", "manufacture"].includes(info?.type) && IPR_ROOF[info?.roofType] !== "plocha";
  // A family house shows its ridge inside the 4 m strip; a tenement's ridge lies deeper, past the cut.
  const pitched = kind === "statek" ? BARN_RISE + 40 : tenementGable(kind, roofRows, false) ? (TENEMENT_RIDGE + 5) * pitch + 45 : gableOn(kind) ? gableTop(kind, info) * storey * (n < 2 ? GABLE_LOW : 1) + 90 : GABLE_RISE[kind] ? GABLE_RISE[kind] + 100 : kind === "cihlovy" ? 250
    : style === "nizky" || SMALL_RIDGE.has(kind) ? (RIDGE + 55) * pitch + 45 : (EDGE + 35) * pitch + 45;
  const roofH = flat ? roofRows * storey + (sawtooth ? 430 : style === "hala" ? 110 : MED_LOOKS.has(kind) ? 230 : 50) : roofRows && kind !== "statek" && !gableOn(kind) ? roofRows * storey + 170 : pitched;
  return { n, roofRows: kind === "statek" ? 0 : roofRows, storey, ground, body, roofH, flat, pitch, chimney: flat ? 0 : 70 };
}

// How high the facades at the edges are (cm), for a span wire fixed to one.
export const facades = (edges) => Object.fromEntries(["left", "right"].map((side) => {
  if (edges?.[side] !== "budova") return [side, 0];
  const info = edgeInfo(edges, side);
  return [side, cityArt() ? buildingForm(info, buildingStyle(info, edges[`${side}Style`])).body : (buildingHeight(info) || 0) * 100];
}));
export function edgeHeight(kind, info, style) {
  if (kind !== "budova") return 0;
  if (!cityArt()) return (buildingHeight(info) || 0) * 100;
  const f = buildingForm(info, buildingStyle(info, style));
  return f.body + f.roofH + f.chimney;
}
