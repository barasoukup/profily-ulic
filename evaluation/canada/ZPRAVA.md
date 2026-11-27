# Kanada: Toronto v aplikaci (25. 11. 2026)

Bára schválila 25. 11. 2026. Větev `canada` z `usa` (c20d8bc). Otázka pilotu: **je druhé severoamerické město hlavně popis vrstev a A/B,
nebo nový kód?**

## Odpověď: kód proti popisu

Řádky i s komentáři (`git diff --numstat c20d8bc`):

| co | řádků | druh |
|---|---|---|
| `towns/planimetrics.js` (adaptér) | 282 | z toho asi 150 vyjmutých z `usa.js` beze změny pravidel, asi 60 nových obecných (popis města, paměť, plocha pod bodem) a asi 70 nových pravidel pro mapu bez středních pásů a starší než cyklostezky |
| `towns/usa.js` | +38 −207 | Washington je teď popis (13 řádků), inventář DDOT a CAMA |
| `towns/canada.js` | 55 | popis vrstev asi 15, domy z výšky asi 12, zbytek komentář a zapojení |
| `countries/CA.js` | 68 | normy, sady, texty (data) |
| zapojení v aplikaci (`app`, `city`, `lanes-ortho`, `credits`, `sources`, `search*`, `art`) | asi +60 −37 | seznamy a klíče |
| nástroje (hranice, pokrytí, kontrola zdrojů, balík) | +44 | z toho `closed_ca` a StatCan asi 35 |
| 24 jazyků | +529 −138 | 15 vět norem a kreditů, patička, 5 vět s výčtem míst |
| `states.json` | +133 kB (2,51 → 2,64 MB) | z toho `canada` 5 kB, zbytek hláška `closed_ca` |

**Bez dalších pravidel by Toronto bylo popis**: samotné vrstvy jsou 15 řádků. Nový kód si vyžádaly tři vlastnosti jeho mapy: nemá střední
pásy a tramvajová tělesa (`gapsBetweenRoads`), má zálivy stání mezi parkovišti (`kerbBays`) a je z roku 2021, starší než cyklostezky
(`osmTracks`, vyřezávání sdílené s inventářem DDOT). Všechna tři jsou ve společném adaptéru. Největší objem je ale **kolem**: normy, 24
jazyků, hranice, hlášky, kredity. Výsledek: jádro je popis + asi 70 řádků nových pravidel, zbytek příprava, kterou si nová země
vynutí vždy; další město téhož státu ji nepotřebuje.

Washington se nezměnil: 100 řezů (40 A/B + 60 čerstvých) přes `sources` má plochy, čáry i prvky OSM **bajt po bajtu stejné** (`dc-same.mjs`).

## Co je v aplikaci

- **Stát CA** (`countries/CA.js`): Toronto, Mississauga, Brampton, Vaughan, Richmond Hill, Markham a Pickering (`states.json` `canada`,
  hranice Statistics Canada 2021); zbytek Kanady `closed_ca` (u Windsoru, Niagary, Fort Erie, Sarnie testováno proti `closed_us`).
- **Mapa povrchů Toronta** (`towns/canada.js`): `cot_geospatial3` 3 vozovka a křižovatky, 6 chodníky, 13 parkoviště, 2 budovy (vše
  **polygony**); `?toronto=0`. Ortofoto `cot_ortho` (2025, 8 cm) pro pruhy, model a podklad; stání nemá mapa ani inventář.
- Domy z výšky obrysu (`DERIVED_HEIGHT`, bez dotazu navíc; `?torontohouse=0`), torontský autobus, Flexity, zastávky.
- OSM balík `ca_on_toronto` (46 MB, jen R2). Hledání Photon v obdélníku metra. Normy jen oranžově (`NORMY.md`).

## Vývoj

40 řezů `dev.json` prohlédnutých nad ortofotem (autor; mapa sedí na ortofotu na decimetry). `osmTracks`: 40 ulic s cyklostezkou v OSM
(`tracks.json`), 9 se změnilo, podle autora (ne naslepo) lépe 6, stejně 2, hůř 1.

## Čerstvé měření (kód zmrazený 57f1e31, po sběru beze změny)

60 náhodných řezů podle délky sítě (semínko 20261201, 150 m od všech míst vývoje, s fotkou Mapillary do 30 m; bez ní vypadlo 83 bodů,
hlavně místní a obslužné ulice). Mapa se použila v 57; t-7, t-31 (obslužné) a t-48 (The Queensway) ne a v obou ramenech jsou stejné.
V jiném pořadí než váhy sítě: místní 20, tepny 16, dálnice 11, sběrné 8, obslužné 5 (obslužných 25 % sítě bez fotky).

**Slepé A/B** (57 dvojic, dva posuzovatelé Sonnet na dvojici, X/Y náhodně, pokyn bez nápovědy `../usa/fresh/POKYN-AB.md`):

| typ | řezů | mapa : odhad | nerozhodně | podíl mapy (95 %) | p |
|---|---|---|---|---|---|
| **všechny** | 57 | **44 : 6** | 7 | 76–94 % | < 0,001 |
| místní | 20 | 18 : 1 | 1 | 75–99 % | < 0,001 |
| tepny | 15 | 10 : 4 | 1 | 45–88 % | 0,18 |
| sběrné | 8 | 7 : 0 | 1 | 65–100 % | 0,016 |
| dálnice, rampy | 11 | 8 : 0 | 3 | 68–100 % | 0,008 |
| obslužné | 3 | 1 : 1 | 1 | 9–91 % | 1 |

Nejde posoudit 0. Shoda posuzovatelů 48/57, kde oba vybrali stranu 46/51.

**Univerzální měření** (30 řezů, 29 použitelných, jeden posudek na řez, profil neviděný):

| profil | složení stejné | shoda složení (95 %) | pruhy | šířka do 1 / 2 m |
|---|---|---|---|---|
| s mapou | 34 % | **74 %** (67–83) | 66 % | 41 / 59 % |
| bez mapy (`?toronto=0`) | 24 % | 68 % (59–76) | 66 % | 7 / 17 % |
| jen OSM | 34 % | 70 % (60–79) | 62 % | 14 / 24 % |

Mapa proti bez mapy +7 bodů (**−3 až +18, tedy neprůkazně**), proti jen OSM +5 (−7 až +16). Co mapa prokazatelně zlepší, je šířka
ulice; v A/B vede jasně. Ortofotový odhad tu nad samotným OSM ve složení nic nepřidává. **Mapa zůstává zapnutá** (A/B), složení neprůkazně.
Měření jen s fotkou a na místech Mapillary; tepny a obslužné jsou málo řezů. `./measure.sh score`, `results/score.md`.

## Druhá nepřátelská recenze (25. 11. 2026): opravy a chybějící A/B (`review/`)

Vzorky `review/sample.json` (semínko 20261206) po zmrazení 00c6995, 150 m od všech dřívějších bodů, **bez podmínky fotky**; pokyn a posuzování
jako čerstvé měření (dva posuzovatelé Sonnet na dvojici, X/Y náhodně, zdroje skryté), `review/results/score.md`. Po sběru se do kódu přidala jediná
věc: oprava pádu pravidla „jiná ulice“ (3 řezy z 224 bez profilu, sebrané znovu) a to pravidlo se pak vypnulo.

| co | změněno / vzorek | s pravidlem : bez | nerozhodně / nejde | podíl (95 %) | p | rozhodnutí |
|---|---|---|---|---|---|---|
| inventář DDOT (`?ddot=0`) | 45 / 90 | 21 : 11 | 11 / 2 | 48–80 % | 0,11 | remíza, zapnutý |
| mezery mezi vozovkami (`?off=mapgaps`) | 26 / 70 | 15 : 7 | 4 / 0 | 47–84 % | 0,13 | remíza, zapnuté |
| cyklostezky z OSM (`?off=roadtracks`) | 56 / 90, posouzeno 24 | 13 : 6 | 5 / 0 | 46–85 % | 0,17 | remíza, zapnuté |
| zálivy stání (`?off=kerbbays`) | 9 / 34 | 5 : 1 | 3 / 0 | 44–97 % | 0,22 | remíza, zapnuté |
| jiná ulice ukončí profil (sdílené, 20 měst) | 31 / 113 | 13 : 10 | 8 / 0 | 37–74 % | 0,68 | vypnuté (`?otherstreet=1`), jen hláška |
| podlaží z výšky (`?torontohouse=0`) | 32 / 70 domů, 23 porovnáno | 10 : 7 | 6 | 36–78 % | 0,63 | remíza, zapnuté |

- DDOT: místní ulice 15 : 5, sběrné 3 : 2, tepny 3 : 4. Počet pruhů proti dvěma posuzovatelům, kteří profil neviděli a shodli se: 20 proti 19 z 33;
  strany stání 49 proti 45 ze 73 (lépe 22, hůř 18). Počet pruhů inventář tedy nezlepšuje.
- Mezery se mění skoro jen na ulicích o dvou vozovkách (23), u tramvají jen 3 ze 40: samostatných těles je v Torontu málo.
- Podlaží po novém přepočtu ((h − 2,2) / 3,3 m, od 25 m 3,05 m): průměrná chyba 1,35 → 0,65 podlaží, do jednoho 17 → 21 z 23.
  Přepočet se ladil na 22 domech prvního vzorku, tenhle je čerstvý (8 domů nejde poznat, u 1 se posuzovatelé rozešli).
- Koleje v tunelu: pravidlo podle faktu, ne A/B; 41 ulic nad tramvajovým tunelem (12 evropských měst a Toronto, `tunnel-sample.json`) se změnilo 18, ve Vídni, Bruselu, Krakově zmizely tramvaje z povrchu.
- Fotky: z 83 vyřazených bodů prvního vzorku byla většina místní a obslužné; tady mají změněné dvojice fotku skoro všechny (ve městech hlavní ulice), v okolí
  má fotku nebo panorama 10 z 30 řezů, z 14 místních 1. Ostatní se posoudily jen z ortofota.

**Okolí bez mapy** (univerzální měření, 30 náhodných řezů podle délky sítě, ortofoto USGS, Marylandu a Ontaria jen k prohlédnutí, jeden posudek): použitelných
19 (7 ve Washingtonu nečitelných na hrubém snímku nebo pod stromy, 4 obslužné v Torontu nejsou ulice), složení **51 %** (42–64), pruhy 84 %, šířka do 1 / 2 m
11 / 16 %. Okolí Washingtonu 47 % (8 řezů), Toronta 55 % (11), místní 46 % (10), jen z ortofota 54 % (10) proti 48 % s fotkou (9). Chybí zeleň, chodníky, stání: odhad jen z OSM bez ortofota. Je to hluboko pod městy (76 a 74 %).

**Kliknutí** (`review/clicks.mjs`, sběrač z `estonia`): Washington 46, Toronto 46. Přes 25 m se posune 3 a 2 (jeden 66 m, jeden 52 m: kolem ústí
obslužné cesty), z 13 kliknutí na uličky žádné přes 15 m (bez opravy uličky až 101 m), v odstupu křižovatky nezůstal žádný řez.

**Velikost** (`size.mjs`, gzip, start v Evropě proti `estonia`): dřív +161 kB, teď +11 kB (js +8,9, jazyk +2,3, stránka +0,4; hranice 0).

**Evropa:** 60 řezů (`eu-sample.json`, kliknutí) `canada` proti `estonia`: stejných **60, změněných 0** (díly, poznámka, poloha). Regrese Prahy a Brna shodná.

## Kontrola Evropy

60 řezů (10 států po 6, `eu-sample.json`): starý kód (c20d8bc) proti novému se změnil **0** (jeden český se lišil, protože ČÚZK právě neodpovídal;
znovu beze změny). Regrese Prahy a Brna shodná s `results/regrese.txt`.

## Domy (30 náhodných domů s fotkou, `houses.mjs`, jeden posuzovatel, neladěno)

Vzhled správně 14, částečně 10, špatně 3, nejde 3. Podlaží proti fotce (27): přesně 12, do půl 17, do jednoho 23. Bungalovy a patrové domky
sedí, potíže: podium s věží, řadové domy a obchody, komerční budovy kreslené jako `baygable` (poloha vyhrává nad druhem). Výška změnila vzhled
u 1 domu z 30, mění hlavně počet podlaží; samostatné A/B výšek proti OSM **není** (OSM má podlaží u 2 z 30 domů).

## Nejisté

- Nové kredity: věta Statistics Canada Open Licence (Adapted from …) je v patičce ve všech jazycích, nepřekládá se.

- Licence: Topographic Mapping a Web Map Services (kde je `cot_ortho`) jsou v katalogu OGL – Toronto; služba `cot_geospatial3` sama licenci nenese, jen
  odpovídá týmž datům. Bára 25. 11. 2026: používat s kreditem (CORS ozvěna, bez klíče), záloha je hostovat data z katalogu.
- Stav ploch: vozovky a chodníky naposledy upravené hlavně 2021, jednotlivé do 2024. Stání, cyklopruhy a stopy po přestavbách jsou z OSM a ortofota.
- StatCan Open Licence (hranice), překlady strojové.

## Před nasazením (Bára)

1. Spustit workflow OSM tiles se `states: ca` (job `ca_on_toronto` stáhne Ontario, 1 GB, ořízne osmiem) a ověřit `index.json` na R2.
2. CSP má `gis.toronto.ca` v `connect-src` i `img-src`.
3. Rozhodnout licenci služby a texty; nic se nesmí nasadit před sloučením `usa`.

## New York a Boston

Boston (ArcGIS `gisportal.boston.gov`, polygony chodníků 2014 a vozovky) je po tomhle levnější: popis vrstev ve společném adaptéru,
jeho mapa je ale starší a `Street_Edges` nevyzkoušené. New York planimetrii vydává přes Socratu (GeoJSON), ne ArcGIS: adaptér potřebuje jiný
způsob dotazu (odhadem 20 řádků) a více vrstev (střední pásy má vlastní). Oba ale leží ve státě US, který je dnes jen metro Washingtonu:
nejdřív `usa` na více oblastí s vlastními balíky OSM. Ta práce je jednorázová. Stání a pruhy z inventáře DDOT nemá ani jeden (jen ve Washingtonu).
