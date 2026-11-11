// Convert a pilot profile to Streetmix street data (schema 35, metric) for POST /api/v1/streets.
// Streetmix segments are listed left to right like ours; "outbound" points away from the viewer
// (our "forward"), "inbound" towards them.
import { TYPES } from "./types.js";

const SCHEMA_VERSION = 35;
const CURB = 0.15; // sidewalk elevation (m)

const rid = () => Math.random().toString(36).slice(2, 12) + Math.random().toString(36).slice(2, 7);
const way = (dir) => (dir === "backward" ? "inbound" : "outbound");

// Streetmix turn-lane variants for OSM turn values.
const TURN = {
  left: "left", "left;through": "left-straight", through: "straight", "through;right": "right-straight",
  right: "right", "left;right": "both", "left;through;right": "left-right-straight",
};

// Direction of the nearest driving lane, for parked cars.
function laneDir(segs, i) {
  for (let d = 1; d < segs.length; d++) {
    for (const j of [i - d, i + d]) {
      if (["pruh", "pruh_piktokoridor", "bus", "bus_cyklo", "tramvaj_v_pruhu"].includes(segs[j]?.type)) return segs[j].dir;
    }
  }
  return "forward";
}

function segment(s, i, segs, total) {
  const dir = way(s.dir);
  const side = segs.slice(0, i).reduce((a, x) => a + x.width, 0) + s.width / 2 < total / 2 ? "left" : "right";
  switch (s.type) {
    case "chodnik": return ["sidewalk", "normal"];
    case "chodnik_kola": return ["sidewalk", "normal"];
    // Streetmix has no shared foot-and-cycle path: a cycle lane on sidewalk level.
    case "stezka_sdilena": return ["bike-lane", `${dir}|regular|sidewalk`];
    case "nastupiste": return ["sidewalk", "dense"];
    case "plocha": case "nezname": case "zed": return ["sidewalk", "empty"];
    case "zahradka": return ["outdoor-dining", "occupied|sidewalk"];
    case "stromorad": return ["sidewalk-tree", "big"];
    case "zelen": return ["divider", "planting-strip"];
    case "predzahradka": return ["divider", "bush"];
    case "delici": return ["divider", "median"];
    case "cyklostezka": return ["bike-lane", `${dir}|regular|sidewalk`];
    case "cyklopruh": return ["bike-lane", `${dir}|${s.color ? "red" : "regular"}|road`];
    case "ochranny_pruh": return ["bike-lane", `${dir}|regular|road`];
    case "parkovani": {
      const pd = way(laneDir(segs, i));
      const o = s.orient === "kolme" ? "sideways" : s.orient === "sikme" ? `angled-front-${side}` : pd;
      return ["parking-lane", `${o}|${side}`];
    }
    case "pruh":
      if (s.turn && TURN[s.turn]) return ["turn-lane", `${dir}|${TURN[s.turn]}`];
      return ["drive-lane", s.bikeDir ? `${dir}|car-with-bike` : `${dir}|car`];
    case "pruh_piktokoridor": return ["drive-lane", `${dir}|sharrow`];
    case "obsluzna": return ["drive-lane", "inbound|car"];
    case "krajnice": return ["divider", "striped-buffer"];
    case "bus": return ["bus-lane", `${dir}|regular|typical`];
    case "bus_cyklo": return ["bus-lane", `${dir}|shared|typical`];
    case "tramvaj_v_pruhu": return ["streetcar", `${dir}|regular`];
    // The reserved lane and the separate bed both go as Streetmix's streetcar on a coloured lane; a grass bed on grass.
    case "tramvaj_pruh": case "tramvaj": return ["streetcar", `${dir}|${s.bed === "trava" ? "grass" : "colored"}`];
    case "voda": return null;
    default: return ["sidewalk", "empty"];
  }
}

function boundary(kind, info) {
  const floors = Math.max(1, Math.min(20, info?.levels || 4));
  switch (kind) {
    case "budova": return { variant: floors > 4 ? "narrow" : "residential", floors, elevation: CURB };
    case "stavba": case "plot": return { variant: "fence", floors: 1, elevation: CURB };
    case "voda": return { variant: "waterfront", floors: 1, elevation: CURB };
    case "zahrada": case "zelen": return { variant: "grass", floors: 1, elevation: CURB };
    default: return { variant: "parking-lot", floors: 1, elevation: CURB };
  }
}

// Not offered in the app for now: streetmix.net does not accept requests from other websites
// (no CORS, github.com/streetmix/streetmix/issues/3828), so the button would fail on GitHub Pages.
// The conversion stays (and is tested) for when it does, or for a small proxy.
export function toStreetmix(profile, name) {
  const segs = profile.segments;
  const total = segs.reduce((a, s) => a + s.width, 0);
  const segments = [];
  segs.forEach((s, i) => {
    const m = segment(s, i, segs, total);
    if (!m) return;
    segments.push({
      id: rid(),
      type: m[0],
      variantString: m[1],
      width: +s.width.toFixed(2),
      // Streetmix has no parking on the sidewalk: a parking lane, raised when the cars stand fully on it.
      elevation: TYPES[s.type]?.raised || (s.type === "parkovani" && s.position === "on_kerb") ? CURB : 0,
      slope: { on: false, values: [] },
    });
  });
  const width = +segments.reduce((a, s) => a + s.width, 0).toFixed(2);
  const street = {
    schemaVersion: SCHEMA_VERSION,
    showAnalytics: false,
    width,
    units: 0,
    location: null,
    userUpdated: true,
    skybox: "day",
    weather: null,
    boundary: {
      left: { id: rid(), ...boundary(profile.edges?.left, profile.edges?.leftInfo) },
      right: { id: rid(), ...boundary(profile.edges?.right, profile.edges?.rightInfo) },
    },
    segments,
    editCount: 0,
  };
  // The street is public and derived from IPR and OSM data: their credit goes with it in the name
  // (Streetmix has no description field).
  return { name: `${name} (data © IPR Praha, © přispěvatelé OpenStreetMap)`, data: { street, plugins: {} }, clientUpdatedAt: new Date().toISOString() };
}
