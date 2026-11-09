# Profily ulic Pardubice: kontrola 49 náhodných řezů

9. 11. 2026 · stránka `/pardubice/` (zatím nenasazená)

Pardubice nemají vlastní GIS, ze kterého by šlo číst. Plochy proto pocházejí z celostátní digitální technické
mapy ČÚZK (IS DMVS), kterou plní Pardubický kraj. Čtou se živě při kliknutí modulem `pilot/public/dmvs.js`,
který jde použít pro každé město v ČR.

ČÚZK DTM zveřejňuje jen jako WMS: dává obrázky a typ plochy v pixelu, ale ne geometrii. Modul proto při
kliknutí udělá tohle:
1. Stáhne dva PNG obrázky obálky řezu po 0,1 m/px: plochy (`dtm_zps_plochy_bar`) a jejich hraniční linie
   (`dtm_zps_linie_body`).
2. Obrázky dekóduje vlastním dekodérem PNG, takže stejný kód běží v prohlížeči i v Node.
3. Každý pixel přiřadí k nejbližší barvě legendy. Sousední plochy stejné barvy (vozovka a parkoviště jsou obě
   bílé) od sebe oddělí podle linií.
4. Najde souvislé plochy a obtáhne jejich obrysy.
5. U ploch na řezu, jejichž barva neurčuje typ (bílá, světle šedá), se na typ zeptá jedním dotazem
   GetFeatureInfo; dotazy běží souběžně.

Kde je DTM prázdná, doplní se budovy a parcely z RÚIAN ČÚZK (zahrady, dvory, zeleň). Vozovku silniční parcely
modul doplní jako odhad jen v mezeře, kterou DTM nakreslila z obou stran nejvýš 25 m od osy (příklad: Palackého
třída).

Postup ověření:
- vzorek: `CITY=pardubice node evaluation/sample.mjs`; ze 97 řezů je vybrán každý druhý, tedy 49 řezů;
- profily: `CITY=pardubice node evaluation/run_brno.mjs`;
- obrázky: `render_brno.mjs` nad ortofotem ČÚZK;
- prošli je dva agenti se stejnými kritérii jako v Jihlavě. Poznámky jsou v `data/review-*.md`, verdikty
  v `data/verdikty-*.json`.

| Město | sedí | částečně | špatně |
|---|---|---|---|
| **Pardubice (DTM ČÚZK z obrázků WMS, RÚIAN)** | **26** | **22** | **1** |
| Jihlava (pasport komunikací, RÚIAN, parkování města) | 43 | 41 | 5 (z 89) |
| Brno (MTVU a UMPS města) | 32 | 63 | 5 (ze 100) |

Jediný řez se špatným verdiktem (č. 1) je staveniště na ortofotu, profil tam ověřit nejde.

## Nejčastější vady
- **Odhad z OSM (6 řezů):** silnice I. třídy a obchvaty mimo zástavbu (č. 2, 3, 4, 9, 10) DTM kraje nemá.
  Profil je pak odhad z OSM (2 × 3,0 m), který je pro tyto silnice úzký.
- **Rozdělení vozovky na pruhy (6 řezů, pruhy-moc-siroke):** pruhy podle OSM nesedí s čarami na vozovce.
  Šířka vozovky z DTM přitom sedí. Příklady: č. 17 má v OSM lanes=5, na fotce jsou 4 pruhy; č. 42 a 35 mají
  pruhy po 4,5 m.
- **Typ plochy podle kraje (6 řezů):**
  - zastávkový záliv je v DTM jako „manipulační plocha“ (č. 11, 25);
  - červené cyklopruhy ve vozovce jsou v DTM jako cyklostezka (č. 13);
  - orná půda podle RÚIAN leží přes dvůr s domem (č. 36).
- **Odhadované podélné stání (4 řezy):** stání se přidá i tam, kde žádná auta nestojí, a někdy na špatnou
  stranu (č. 26, 28, 31, 33, 41). Jde o pravidlo profilu, ne o čtení ploch.
- **Posun hranic:** systematický posun DTM proti ortofotu ČÚZK agenti nenašli; hranice sedí do 0,3–0,5 m.
  Větší odchylky u vyšších domů dělá náklon střech na ortofotu.

## Čas jednoho kliknutí
Měřeno v Node na 17 řezech:
- plochy (2 obrázky, souběžně RÚIAN a 1–15 dotazů na typ) trvají **medián 0,95 s, nejvýš 1,5 s**;
- průměrně jde o 6 dotazů na DMVS, nejvíc 17;
- dekódování a obrysy zaberou kolem 0,1 s.

S dotazem na podlažnost domů z RÚIAN vychází kliknutí zhruba na 1,3–2 s. V prohlížeči to změřené není,
protože panel prohlížeče byl obsazený.

## Jak úplná je DTM kraje v Pardubicích (11/2026)
- **Ulice ve městě kraj nakreslil dobře:** vozovky, chodníky, nájezdy, parkoviště, ostrůvky, dělicí pásy,
  zeleň, cyklostezky a přidružené plochy. Hranice ploch (obruby) jsou kreslené i mezi vozovkou a stáním.
- **Bloky zástavby jsou často prázdné.** V centru mají celé bloky jen linie domů, ale ne plochy budov a dvorů.
  Doplňují je budovy a parcely RÚIAN.
- **Chybí státní silnice mimo zástavbu:** obchvaty a silnice I. třídy (č. 2, 3, 4, 9, 10).
- **Místy chybí vozovka uprostřed nakreslené ulice:** Palackého třída u nádraží (č. 17) má chodníky a zeleň,
  ale vozovku ne.
- **Polní cesty nejsou** (č. 48).
- Typ plochy kraj občas zapsal jinak než MTVU (záliv jako manipulační plocha, cyklopruh jako cyklostezka).
