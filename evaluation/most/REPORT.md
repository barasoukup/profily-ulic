# Profily ulic Most: kontrola 57 náhodných řezů

9. 11. 2026 · stránka `/most/` (zatím nenasazená)

Vzorek `CITY=most node evaluation/sample.mjs` (stejný seed a kvóty jako Praha, Brno a Jihlava; Most nemá v OSM
žádnou `secondary` a málo obytných a pěších zón, z 78 řezů jsou 2/3 každé skupiny, tedy 57), profily
`CITY=most node evaluation/run_brno.mjs` (kód aplikace nad živými službami města), obrázky
`CITY=most node evaluation/render_brno.mjs` nad ortofotem 2025 z mapového serveru města. Hranice obce z RÚIAN (ČÚZK).
Obrázky jsem prošel sám (asi 45 z 57 nad ortofotem, zbytek podle tabulky úseků), takže je hodnocení hrubší než
u Jihlavy.

| Město | sedí | částečně | špatně |
|---|---|---|---|
| **Most (objektová mapa města, technická mapa, RÚIAN)** | **30** | **25** | **2** |
| Jihlava (pasport komunikací, RÚIAN, parkování města) | 43 | 41 | 5 |
| Brno (MTVU a UMPS města) | 32 | 63 | 5 |

Objektová mapa povrchové situace pokrývá celé území města (budovy, vozovky, chodníky, parkoviště, zeleň, zahrady,
dvory, tramvajové těleso), takže „Neurčeno“ se v řezech skoro neobjevuje. Hranice ploch sedí na ortofotu i na OSM
(posun pod 0,5 m, služby města převádějí S-JTSK stejně jako IPR a ČÚZK).

Nejčastější vady:
- jízdní pruhy přes 4 m s krajnicemi „odhad“ (asi 12 řezů, hlavně tř. Budovatelů, Pražská, místní ulice v sídlištích):
  OSM nemá u jednosměrných vozovek `lanes`, rozdělení vozovky je odhad z derive.js.
- odhadované podélné stání (asi 10 řezů) i tam, kde se v sídlištích parkuje kolmo na samostatných parkovištích;
  vrstva parkovacích stání město nemá, rozhodují jen plochy parkovišť (704) a jejich hloubka.
- široké zpevněné plochy kolem paneláků jako „chodník“ nebo „zpevněná plocha“ přes 7 m (technicky správně).
- pěší cesta v lese (U Cáchovny) jako jízdní pruh; služební cesta Jezerní jako přístupová cesta (sedí).

Opraveno během kontroly:
- úzká „povrchová stavba“ (2/26, pod 1,5 m) mezi vozovkou a tramvajovým tělesem nebo mezi pásy je dělicí pás,
  ne zeď (tř. Budovatelů, Pražská).
- úzká „nezpevněná cesta“ (3/14, pod 1,5 m) u silnic mimo město je krajnice (zeleň, odhad), ne chodník.
- osy kolejí technické mapy (kód 9) se berou jako tramvajové jen do 3 m od tramvajové trati v OSM; stejný kód mají
  vlečky a koleje v areálech.
- `sample.mjs` přeskočí skupinu ulic, kterou město nemá (Most: `secondary`).

## Parkování (doplněno 9. 11. 2026)

Vrstvu parkovacích stání Most nemá. Prošel jsem všechny složky mapového serveru města (asi 70 služeb, 1 800 vrstev),
otevřená data města na data.gov.cz (40 datových sad, nic o parkování) i technickou mapu: žádná stání, úseky, zóny
placeného stání ani vodorovné značení. Vrstvy „ZPS“ v DTM kraje jsou základní prostorová situace, ne placené stání.
Vnitřní kresba dopravních ploch (DtmUMPS 48, kód 27) má pro celé město jen 987 převážně krátkých čar, stání z ní
vyčíst nejdou. Z placeného parkování jsem dohledal jen staré zprávy o automatech na parkovištích (Technické služby
města Mostu), mapu ani seznam úseků ne. Objektová mapa se podle katalogu NKOD aktualizuje naposledy 6/2024.

Parkování v profilu proto dávají: parkovací plochy objektové mapy (704), tedy zálivy a parkoviště vedle vozovky,
v sídlištích většinou kolmé (ve vzorku 8 řezů), plochy `parking=street_side|lane` z OSM (88 ploch v Mostě) a
odhad podélného stání v místních ulicích (asi 12 řezů). Tagy `parking:left/right/both` na osách OSM v Mostě skoro
nejsou (0,8 km ze 143 km obytných ulic). Stání vyznačené přímo ve vozovce bez vlastní plochy proto chybí.
