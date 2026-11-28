
// Slovenia (Bára 23. 11. 2026): GURS's colour orthophoto DOF025 (25 cm) in its own Web Mercator pyramid (WMS of the
// Geodetska uprava RS, CORS *, CC BY 4.0; evaluation/slovenia/SOURCES.md). The server answers within a second or hangs
// for 30 s and gives 504 (also inside Slovenia, at random; always beyond it, so the map's layer is kept inside, app.js
// insideOnly). Measured 23. 11. 2026: two thirds of the requests hung at times, an answer came within 3.3 s, and a hang
// is random (the same box answers on another try). So laneImage tries again, each try cut short at SI_RETRY.timeout
// (not GURS's 30 s), with growing pauses between, all within SI_RETRY.budget (the review of 24. 11. 2026: four tries
// held a cut 26 s), and keeps the images it got for the session (siFetch: a cut clicked again asks nothing). All tries
// failing is told as before (app.js orthoDown). The kerb model's square (orthoPatch) is asked the same way, within
// patchBudget, and kept too, so the same click gives the same profile; while GURS has just failed (downFor after
// laneImage's last try) it is not asked at all, the cut is not held a second time.
export const SI_RETRY = { timeout: 4000, pauses: [300, 1500], budget: 12000, patchBudget: 9000, downFor: 60000 };
// When each source last failed on every try (a source just down is not asked again within SI_RETRY.downFor).
const downAt = new Map();
export const siDown = () => downAt.has("si") && Date.now() - downAt.get("si") < SI_RETRY.downFor;
const siRetryable = (err) => err?.outage || ["TimeoutError", "AbortError", "TypeError"].includes(err?.name);
// run(timeout) once a try, within budget ms in all; a server down on every try throws the last error.
export async function siTries(run, timeout, budget, key = "si") {
  const start = Date.now();
  let lastError = null;
  for (let i = 0; i <= SI_RETRY.pauses.length; i++) {
    if (i) {
      if (budget - (Date.now() - start) - SI_RETRY.pauses[i - 1] < 1000) break;
      await new Promise((r) => setTimeout(r, SI_RETRY.pauses[i - 1]));
    }
    try {
      const out = await run(Math.min(timeout, budget - (Date.now() - start)));
      downAt.delete(key);
      return out;
    } catch (err) {
      if (!siRetryable(err)) throw err;
      lastError = err;
    }
  }
  downAt.set(key, Date.now());
  throw lastError;
}
const siImages = new Map(), SI_KEEP = 40;
export const siFetch = async (url, init) => {
  const kept = siImages.get(url);
  if (kept) return new Response(kept.slice(0), { status: 200 });
  const r = await fetch(url, init);
  if (!r.ok) return r;
  const buf = await r.arrayBuffer();
  if (siImages.size >= SI_KEEP) siImages.delete(siImages.keys().next().value);
  siImages.set(url, buf);
  return new Response(buf.slice(0), { status: 200 });
};
