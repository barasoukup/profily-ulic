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
