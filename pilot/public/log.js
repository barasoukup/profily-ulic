// What visitors do, sent to the Worker of logging/ (Cloudflare, Bára): each cut exactly (there is nothing
// personal in it) and a few actions. navigator.sendBeacon as text: no preflight, the page never waits, and a
// failure changes nothing. Without LOG_URL (config.js, filled by the deploy from the repository variable)
// nothing is sent, so a local run logs nothing.
import { LOG_URL } from "./config.js";

const SESSION = globalThis.crypto?.randomUUID?.() || String(Math.random()).slice(2); // one page load, never stored

export function log(kind, data = {}) {
  if (!LOG_URL) return;
  try {
    const body = JSON.stringify({ kind, session: SESSION, ...data });
    if (!navigator.sendBeacon?.(LOG_URL, new Blob([body], { type: "text/plain" }))) {
      fetch(LOG_URL, { method: "POST", body, keepalive: true, mode: "no-cors" }).catch(() => {});
    }
  } catch {}
}
