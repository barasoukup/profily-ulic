// Fetch for the evaluation scripts that keeps ČÚZK's servers happy (Bára: they must not cut us off): its
// requests go one at a time, at least GAP ms apart, and a "too many" (429) or "unavailable" (503) answer
// pauses them for PAUSE before one more try. Other hosts go straight through. The number of ČÚZK requests
// is printed when the script ends.
const GAP = 300, PAUSE = 10 * 60 * 1000;
const native = globalThis.fetch;
let queue = Promise.resolve(), last = 0, count = 0;
const isCuzk = (url) => /(^|\.)cuzk\.gov\.cz$/.test(new URL(String(url)).hostname);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
export function politeFetch(url, opts) {
  if (!isCuzk(url)) return native(url, opts);
  const run = queue.then(async () => {
    await wait(Math.max(0, last + GAP - Date.now()));
    count++;
    let r = await native(url, opts).finally(() => { last = Date.now(); });
    if (r.status === 429 || r.status === 503) {
      console.warn(`ČÚZK odpověděl ${r.status}, čekám ${PAUSE / 60000} min`);
      await wait(PAUSE);
      count++;
      r = await native(url, opts).finally(() => { last = Date.now(); });
    }
    return r;
  });
  queue = run.catch(() => {});
  return run;
}
process.on("exit", () => { if (count) console.log(`dotazů na ČÚZK: ${count}`); });
