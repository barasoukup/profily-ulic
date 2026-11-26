// Profiles of the A/B's pairs, in the app's page (frozen code): each variant's place opened as a saved cut (its azimuth and
// way), so the profile is the app's own there.  (await import("/zz-profily.js")).run("kliky-profily")
export async function run(name) {
  const pairs = await (await fetch("/zz-pary.json")).json(), out = (window.__pr ||= []);
  const C = await import("/city.js");
  const read = () => JSON.parse(localStorage.getItem("streetdesign-pilot") || "{}");
  for (const p of pairs) {
    if (out.some((r) => r.pid === p.pid)) continue;
    const row = { pid: p.pid };
    for (const k of ["O", "N"]) {
      localStorage.removeItem("streetdesign-pilot");
      try {
        await Promise.race([window.cutAt(p[k].lat, p[k].lon, false, p[k].bearing, null, null, p.way), new Promise((_, no) => setTimeout(() => no(new Error("timeout")), 120000))]);
        const s = read();
        row[k] = { wayId: s.cut?.wayId, lat: s.cut?.lat, lon: s.cut?.lon, bearing: s.cut?.bearing, span: s.cut?.span, reach: s.cut?.reach, sources: s.cut?.sources, city: s.cut?.city, country: C.city.country, segments: (s.stav?.segments || []).map((x) => [x.type, +x.width.toFixed(2)]) };
      } catch (e) { row[k] = { error: String(e) }; }
    }
    out.push(row);
    window.__prS = `${out.length}/${pairs.length}`;
    await fetch(`/api/eval-save?name=${name}`, { method: "POST", body: JSON.stringify(out) });
  }
  window.__prS = `done ${out.length}`;
}
