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
| `staty.json` | +133 kB (2,51 → 2,64 MB) | z toho `canada` 5 kB, zbytek hláška `closed_ca` |

**Bez dalších pravidel by Toronto bylo popis**: samotné vrstvy jsou 15 řádků. Nový kód si vyžádaly tři vlastnosti jeho mapy: nemá střední
pásy a tramvajová tělesa (`gapsBetweenRoads`), má zálivy stání mezi parkovišti (`kerbBays`) a je z roku 2021, starší než cyklostezky
(`osmTracks`, vyřezávání sdílené s inventářem DDOT). Všechna tři jsou ve společném adaptéru. Největší objem je ale **kolem**: normy, 24
jazyků, hranice, hlášky, kredity. Výsledek: jádro je popis + asi 70 řádků nových pravidel, zbytek příprava, kterou si nová země
vynutí vždy; další město téhož státu ji nepotřebuje.

Washington se nezměnil: 100 řezů (40 A/B + 60 čerstvých) přes `sources` má plochy, čáry i prvky OSM **bajt po bajtu stejné** (`dc-same.mjs`).

## Co je v aplikaci

- **Stát CA** (`countries/CA.js`): Toronto, Mississauga, Brampton, Vaughan, Richmond Hill, Markham a Pickering (`staty.json` `canada`,
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
Měření jen s fotkou a na místech Mapillary; tepny a obslužné jsou málo řezů. `./measure.sh score`, `vysledky/skore.md`.

## Kontrola Evropy

60 řezů (10 států po 6, `eu-sample.json`): starý kód (c20d8bc) proti novému se změnil **0** (jeden český se lišil, protože ČÚZK právě neodpovídal;
znovu beze změny). Regrese Prahy a Brna shodná s `vysledky/regrese.txt`.

## Domy (30 náhodných domů s fotkou, `houses.mjs`, jeden posuzovatel, neladěno)

Vzhled správně 14, částečně 10, špatně 3, nejde 3. Podlaží proti fotce (27): přesně 12, do půl 17, do jednoho 23. Bungalovy a patrové domky
sedí, potíže: podium s věží, řadové domy a obchody, komerční budovy kreslené jako `baygable` (poloha vyhrává nad druhem). Výška změnila vzhled
u 1 domu z 30, mění hlavně počet podlaží; samostatné A/B výšek proti OSM **není** (OSM má podlaží u 2 z 30 domů).

## Nejisté

- Licence: Topographic Mapping a Web Map Services (kde je `cot_ortho`) jsou v katalogu OGL – Toronto; služba `cot_geospatial3` sama licenci nenese, jen
  odpovídá týmž datům. Bára: napsat městu, jestli smíme volat přímo `gis.toronto.ca` (CORS ozvěna, bez klíče).
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
