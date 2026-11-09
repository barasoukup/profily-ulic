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

Parkování (dohledáno 9. 11. 2026): Plzeň stání ani úseky stání živou službou nezveřejňuje. Na ags.plzen.eu jsou
jen parkovací plochy mimo ulici (`GIS_DOPRAVA_Parkovaci_plochy_SHP`, 72 ploch) a parkoviště technické mapy (301,
v profilu jako 704); technická mapa vodorovné značení nemá. Otevřená data města (opendata.plzen.eu, CC0) mají
„Parkovací zóny“: 341 linií po osách ulic s názvem zóny nebo „Vyhrazené stání“ (42 km, GeoJSON 153 kB, 6. 10. 2026),
bez počtu a druhu stání. Profil proto bere stání z parkovišť technické mapy, z OSM (1 273 ploch `parking=street_side`,
značky `parking:left/right/both` jen na 1 % ulic) a mimo ně z odhadu.

Zóny placeného stání (připojeno 9. 11. 2026): `tools/build_zony_plzen.mjs` stáhne zip zón (při nasazení) do
`data/zony.json`; linie leží na ose ulice (medián 1 m od OSM, datum v pořádku). Podél obrubníků vozovky technické mapy,
ve které linie leží, vznikne pás podélného stání 2,0 m: u obou obrubníků, když zbude 3,0 m (jednosměrka) nebo 5,0 m
(obousměrka, 2 × 2,5 m) pro provoz, u jednoho (vpravo ve směru jízdy), když se vejde jen jeden pás, jinak žádný.
Kde už je parkoviště technické mapy nebo OSM, nebo OSM říká `parking:*=no`, pás nevznikne; „Vyhrazené stání“ jde
k bližšímu obrubníku jako zvláštní stání. Kontrola 12 řezů v zónách A, B, C, F, G, Petrohrad a Roudná: 10 sedí,
2 částečně (Pražská: auta stojí vlevo, pás je vpravo; Kamenická u parkoviště: kolmé stání jako podélné). Ve vzorku
50 řezů se změnil jen č. 34 (Hankova, stání z zóny místo odhadu); u č. 18 (Koperníkova) OSM stání zakazuje.
