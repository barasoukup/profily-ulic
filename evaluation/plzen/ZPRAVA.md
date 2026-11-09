# Profily ulic Plzeň: kontrola 50 náhodných řezů

9. 11. 2026 · stránka `/plzen/` (zatím nenasazená)

Vzorek `CITY=plzen node evaluation/sample.mjs` (stejné kvóty a seed jako Praha, Brno a Jihlava, hranice obce
z RÚIAN ČÚZK) a z něj každý druhý řez, tedy 50. Profily `CITY=plzen node evaluation/run_brno.mjs` (kód aplikace
nad živými službami města), obrázky `CITY=plzen node evaluation/render_brno.mjs` nad ortofotem města 2024.
Řezy prošel jeden agent se stejnými kritérii jako v Jihlavě.

| Město | sedí | částečně | špatně |
|---|---|---|---|
| **Plzeň (technická mapa DTM, budovy 3D a RÚIAN, pasporty města)** | **31** | **17** | **2** |
| Jihlava (pasport komunikací, RÚIAN, parkování města) | 43 z 89 | 41 | 5 |
| Brno (MTVU a UMPS města) | 32 z 100 | 63 | 5 |

Technická mapa Plzně pokrývá celý povrch (vozovka, chodník, cyklostezka, parkoviště, tramvajový pás, zeleň,
dvory, zahrady, budovy), takže žádný řez nemá „Neurčeno“.

Nejčastější vady:
- počet pruhů a jejich šířka z OSM neodpovídá (4): odbočovací pruhy, široká vozovka se dvěma pruhy po 4 m
  a odhadem krajnice (Jateční, Folmavská, Zborovská).
- odhad podélného stání tam, kde auta nestojí, nebo chybějící stání tam, kde stojí (4): Plzeň stání
  nezveřejňuje, technická mapa má jen větší parkovací plochy.
- plochy technické mapy, které neodpovídají ortofotu (3): manipulační plocha přes louku (Úněšovská),
  provozní plocha komunikace přes štěrkovou plochu (Chebská), nástupní ostrůvek tramvaje jako dělicí pás.
- řez v křižovatce nebo přes parkoviště (3), jeden z nich špatně (Šlovická).

Před kontrolou opraveno: služby města vracejí WGS 84 jinou transformací (asi 12 m vedle OSM), dotazy proto
žádají `datumTransformation=1623`, dotaz na víc vrstev naráz a 3D budovy posouvají souřadnice o rozdíl.
Po kontrole opraveno: přidružená plocha pozemní komunikace (polní cesty a krajnice vedle silnice) už není
vozovka, ale zpevněná plocha nebo zeleň (odhad) podle povrchu; zlepšila řezy 15, 21 a 24.
