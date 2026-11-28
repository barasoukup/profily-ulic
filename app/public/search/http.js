// One way to ask a service for JSON: a timeout, an error for a bad status or for an error the service puts in its body.
const TIMEOUT = 10000;
export const qs = (o) => new URLSearchParams({ ...o, f: "json" }).toString();
export async function getJSON(url, signal) {
  const timeout = AbortSignal.timeout(TIMEOUT);
  const r = await fetch(url, { signal: signal ? AbortSignal.any([signal, timeout]) : timeout });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  const json = await r.json();
  if (json?.error) throw new Error(`${json.error.code} ${json.error.message}`);
  return json;
}
