// Keys of services that need one in the browser (Bára 23. 11. 2026: Denmark's Dataforsyningen token, the app's own,
// limited to the orthophoto and GSearch). On the site config.js has it (the deploy fills it from the repository variable
// DK_TOKEN); locally config.local.js (git-ignored, export const DK_TOKEN = "…"); in Node (the evaluation) the
// environment variable DK_TOKEN, else config.local.js. Never logged; empty: the service is not asked (lanes-ortho.js,
// search-dk.js: the estimate from OSM and Photon, said so).
import { DK_TOKEN } from "./config.js";

const local = typeof location !== "undefined" && ["localhost", "127.0.0.1"].includes(location.hostname);
const node = typeof location === "undefined";
const fromLocal = () => import("./config.local.js").then((m) => m.DK_TOKEN || "", () => "");
let dk = DK_TOKEN || (local ? await fromLocal() : node ? globalThis.process?.env?.DK_TOKEN || (await fromLocal()) : "");
export const dkToken = () => dk;
// Tests set it (and empty it) themselves.
export const setDkToken = (v) => { dk = v || ""; };
