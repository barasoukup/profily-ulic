// The entry point of the page: it puts the parts of app/ together. Until 28. 11. 2026 this file was one of 2 767 lines
// (code-health plan, step 13a: split by its sections, code only moved). The order below is the order the parts start in;
// each also pulls in what it needs, so the import graph (tools/check_imports.mjs) decides the real order.
import "./app/language.js";
import "./app/options.js";
import "./app/map.js";
import "./app/basemaps.js";
import "./app/cutview.js";
import "./app/panorama.js";
import "./app/cutcontrols.js";
import "./app/view.js";
import "./app/splitter.js";
import "./app/history.js";
import "./app/toolbar.js";
import "./app/dialogs.js";
import "./app/logging.js";
import "./app/underground.js";
import { state, render } from "./app/state.js";
import { exportSvgs, restore } from "./app/files.js";
import "./app/links.js";

// The replay of recorded data (evaluation/replay/harness.js) reads what a visitor would see.
if (globalThis.PROFILY_REPLAY) Object.assign(globalThis.PROFILY_REPLAY, { state, exportSvgs, restore, render });
