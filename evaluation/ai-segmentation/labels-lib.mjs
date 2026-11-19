// The app's own sources in Node (as tools/check_sources.mjs): config.js with STATIC = true, relative requests to the site.
import { register } from "node:module";
register("data:text/javascript," + encodeURIComponent(`export async function load(url, ctx, next) {
  if (url.endsWith("/pilot/public/config.js")) return { format: "module", shortCircuit: true,
    source: "export const STATIC = true; export const MAPY_KEY = ''; export const LOG_URL = '';" };
  return next(url, ctx);
}`));
const SITE = process.env.SITE || "https://streetspace.eu/profily/";
const native = globalThis.fetch;
globalThis.fetch = (url, opts = {}) => native(/^https?:/.test(String(url)) ? url : new URL(String(url), SITE),
  { ...opts, headers: { "User-Agent": "profily-ulic ai-segmentation pilot (github.com/barasoukup/profily-ulic)", ...(opts.headers || {}) } });
globalThis.PROFILY_LANG = "cs";
console.warn = () => {};
export const { setCity } = await import("../../pilot/public/city.js");
export const sources = await import("../../pilot/public/sources.js");
