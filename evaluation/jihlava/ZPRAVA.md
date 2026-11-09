# Profily ulic Jihlava: kontrola 89 náhodných řezů

9. 11. 2026 · stránka `/jihlava/` (zatím nenasazená)

Vzorek `CITY=jihlava node evaluation/sample.mjs` (stejné kvóty a seed jako Praha a Brno; obytných a pěších zón
je v Jihlavě málo, proto 89 řezů), profily `CITY=jihlava node evaluation/run_brno.mjs` (kód aplikace nad živými
službami města), obrázky `CITY=jihlava node evaluation/render_brno.mjs` nad ortofotem města. Prošli je čtyři agenti
se stejnými kritérii jako v Praze a Brně; poznámky v `jihlava/data/review-*.md`, verdikty `verdikty-*.json`.

| Město | sedí | částečně | špatně |
|---|---|---|---|
| **Jihlava (pasport komunikací, RÚIAN, parkování města)** | **43** | **41** | **5** |
| Brno (MTVU a UMPS města) | 32 | 63 | 5 |
| Praha 6. 11. (před opravami) | 51 | 32 | 17 |

Nejčastější vady:
- „Neurčeno“ (26 řezů): plochy mimo pasport komunikací, budovy a trávníky města (předzahrádky, dvorky,
  nezpevněné krajnice, vjezdy).
- příliš široké pruhy (13) a chybějící stání (12): parkovací místa města pokrývají hlavně regulované zóny,
  jinde jen odhad podélného stání; kolmé stání mimo zóny chybí (např. Březinova).
- posun hranic (14), většinou vychýlení střech na ortofotu nebo krajnice venkovských silnic.
- oba pruhy obousměrné ulice stejným směrem (5): osa OSM mimo střed vozovky; opraveno po kontrole
  (polovina pruhů každým směrem).

Před kontrolou opraveno: služby města vracejí WGS 84 jinou transformací (asi 6 m vedle OSM), dotazy proto
žádají `datumTransformation=1623`.
