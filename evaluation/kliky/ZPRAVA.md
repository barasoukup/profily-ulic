# Kam padne kliknutí (25. 11. 2026)

**Oprava uličky (nález W1 recenze Severní Ameriky): commit `HASH`** (`derive.js alleyMouths`, `tests/placement.test.js`;
samostatný, pro sloučení do `canada`).

Plocha uličky (`area:highway=service`, uličky planimetrie Washingtonu) je ústím jen pro ulici, do které se otevírá. Úsek, na
kterém plocha leží do 12 m od osy, delší než 20 m, nebo cesta z většiny uvnitř plochy = její vlastní plocha. Naměřeno
kolem pěti míst Washingtonu: ústí do ulic 0–16 m dlouhá, vlastní plochy cest 24 m a víc. Plocha s více rameny má ústí
zvlášť (dřív jedno uprostřed mezi nimi). `?off=ulickysve` = jako předtím.

| místo | klik (cesta) | dřív | teď | `?off=ulicky` |
|---|---|---|---|---|
| Washington 38.913357, −77.032674 | 150699010 | 75 m | 0 | 0 |
| Washington f-13 | 293279529 | 83 m | 0 | 0 |
| Washington f-18 | 342133616 | 97 m | 0 | 0 |
| Washington f-1 | 273277385 | 137 m | 0 | 0 |
| Varšava, 10 cest v ploše | | 15–81 m u 4 cest (2 přes 25 m) | nejvýš 6 m | nejvýš 6 m |
| Gdaňsk, 5 cest | | 11–71 m u všech (4 přes 25 m) | nejvýš 11 m | stejně |
| Vratislav | 114538354 | 21 m | 0 | 0 |
