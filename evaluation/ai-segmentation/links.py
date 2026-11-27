"""Links to click through the trial of the AI kerbs (Bára 18. 11. 2026): every target point the app cut, with and
without ?ai=1, the carriageway's width in both and, where the town's map gives the truth, the error of the kerbs.
    python evaluation/ai-segmentation/links.py data/ai-seg/target/estimate.json data/ai-seg/target/estimate-ai.json
Writes evaluation/ai-segmentation/LINKS.md (localhost:5293, the OSM packs on disk: R2 answers only localhost:5173).
"""
import json, sys
from pathlib import Path

import numpy as np
sys.path.insert(0, str(Path(__file__).parent))
from compare import CUTS, ROAD, collect

BASE = "http://localhost:5293/?lang=cs&osm=balik&pasport=0&hrany=0&aachen=0"
MAP = "http://localhost:5293/?lang=cs&osm=balik"  # the town's surface map on (pasport, Aachen's map, the lines of the towns' maps)
TOWN = {"bratislava": "Bratislava", "presov": "Prešov", "zilina": "Žilina", "aachen": "Cáchy", "kosice": "Košice", "bystrica": "Banská Bystrica"}


def carriage(segs):
    """the carriageway's width: the parts of the roadway in a row around the widest run (m)"""
    runs, cur = [], 0.0
    for t, w in segs:
        if t in ROAD:
            cur += w
        else:
            if cur: runs.append(cur)
            cur = 0.0
    if cur: runs.append(cur)
    return max(runs) if runs else 0.0


def main():
    old, new = (json.loads(Path(f).read_text()) for f in sys.argv[1:3])
    truth = {}
    for jf in (CUTS / "target").glob("*.json"):
        if jf.stem.isdigit():
            p = json.loads(jf.read_text()); truth[p["point"]] = str(p["n"])
    errs = {m: collect("target", m) for m in ("estimate-balik", "estimate-ai")}
    rows = []
    for pid, a in old.items():
        b = new.get(pid)
        if not a.get("segs") or not b or not b.get("segs"):
            continue
        c = b["cut"]
        rez = f"#rez={c['lat']:.6f},{c['lon']:.6f},{round(c['bearing'])},22.0,22.0"
        wa, wb = carriage(a["segs"]), carriage(b["segs"])
        if not wa and not wb:  # the cut fell on a path: no carriageway, no AI
            continue
        n = truth.get(pid)
        ea = errs["estimate-balik"].get(n, (None,))[0] if n else None
        eb = errs["estimate-ai"].get(n, (None,))[0] if n else None
        fmt = lambda e: "–" if not e else ("selhání" if e[0] >= 99 else f"{e[0]:.1f} / {e[1]:.1f}")
        verdict = "" if not (ea and eb) else ("lépe" if np.mean(eb) < np.mean(ea) - 0.1 else "hůř" if np.mean(eb) > np.mean(ea) + 0.1 else "stejně")
        rows.append((TOWN.get(a.get("town"), a.get("town")), c.get("name") or "?", wa, wb, fmt(ea), fmt(eb), verdict, rez, abs(wb - wa), bool(n)))
    rows.sort(key=lambda r: (r[0], -r[8]))
    changed = sum(1 for r in rows if r[8] >= 0.1)
    out = ["# Obruby vozovky z AI: odkazy na proklikání (18. 11. 2026)", "",
           "Lokálně: `PORT=5293 node app/server.mjs` v této větvi (balíky OSM z disku, R2 odpovídá jen na localhost:5173).",
           "Každý řez dvakrát až třikrát: **ortofoto** (dnešní odhad z ortofota a OSM), **AI** (`?ai=1`: obruby vozovky určil model, zbytek profilu stejný) a **mapa** tam, kde má město mapu povrchů (pasport, Cáchy): tak, jak aplikace řez kreslí naostro.",
           "Šířka vozovky v metrech; chyba obrub (levá / pravá, m) proti mapě města tam, kde ji máme (pasport, Cáchy).", "",
           f"{len(rows)} řezů, vozovka se změnila o 10 cm a víc na {changed}.", "",
           "| Město | Ulice | Vozovka ortofoto | Vozovka AI | Chyba ortofoto | Chyba AI | | Odkazy |", "|---|---|---|---|---|---|---|---|"]
    for town, name, wa, wb, ea, eb, v, rez, _, has_map in rows:
        links = f"[ortofoto]({BASE}{rez}) · [AI]({BASE}&ai=1{rez})" + (f" · [mapa]({MAP}{rez})" if has_map else "")
        out.append(f"| {town} | {name} | {wa:.1f} | {wb:.1f} | {ea} | {eb} | {v} | {links} |")
    Path(__file__).with_name("LINKS.md").write_text("\n".join(out) + "\n")
    print(len(rows), "rows,", changed, "changed")


if __name__ == "__main__":
    main()
