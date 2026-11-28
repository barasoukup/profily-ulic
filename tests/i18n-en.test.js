// The app in English (Bára 12. 11. 2026), as a visitor with ?lang=en gets it: the modules read the language once,
// when they load, so this file runs alone in its process with it set before any of them loads.
import { languageSuite } from "./helpers/language-suite.js";

globalThis.PROFILY_LANG = "en";

languageSuite({
  labels: { chodnik: "Pavement", cyklopruh: "Cycle lane", odhad: "estimate", walking: "Walking" },
  rule: "Pavement 1.40 m is below the minimum (pavement: narrowed min. 1.5 m, standard 2–2.5 m).",
  brno: {
    dataName: "Technical map (Brno)",
    outage: "Technical map (Brno) is not responding right now, the profile is only an estimate from OSM. Try clicking again in a moment.",
  },
  praha: { outage: /^Technical map \(IPR\) is not responding right now \(the server is overloaded\)/ },
  cesko: {
    data: "Data: technical map © Pardubický kraj, IS DMVS ČÚZK, RÚIAN © ČÚZK, 2026 (CC BY 4.0, modified) · orthophoto © ČÚZK, 2025 (CC BY 4.0) · © OpenStreetMap contributors (ODbL)",
    art: /^Illustrations © Streetmix/,
  },
  credits: { brno: /^Data: © Statutární město Brno \(technical map and MTVU/ },
  signs: [
    [{ k: "b20a", v: 30 }, "B 20a Speed limit 30 km/h"],
    [{ k: "b1", plate: "obsluha" }, "B 1 + E 13 No vehicles except for access"],
    [{ k: "ip27a", plate: "kola" }, "IZ 6a Pedestrian zone with cyclists"],
  ],
});
