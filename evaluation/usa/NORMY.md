# USA (Washington DC): normy šířek a stání (24. 11. 2026)

Rešerše agenta Sonnet z 24. 11. 2026 (texty čtené ve zdroji; nacto.org vrací skriptům 403, stránky NACTO čtené z kopií
Internet Archive z roku 2023). Zapojeno v `pilot/public/countries/US.js` (`limitsUS`, `freeLane`, `halfKerbNote`).

## A. Zdroje

- **DDOT Design and Engineering Manual (DEM), prosinec 2023** (689 s., příloha stránky „Standards and Manuals“
  v DDOT Compendium, ddotwiki.atlassian.net). Sám se označuje za závazný (§ 1.3: „must“ povinnost, „should“
  doporučení; § 1.7 výjimky), tabulky 30-13 a 30-14 jsou minima pro **nové** ulice a DDOT smí ponechat stávající stav.
- **DDOT Bicycle Facility Design Guide, verze 2 (2020)**: „shall conform“ ke kapitolám 29 a 30 DEM, kombinuje „shall“
  a „preferred“.
- **NACTO** Urban Street Design Guide, Urban Bikeway Design Guide, Transit Street Design Guide: doporučení, ne předpis.
- **International Fire Code 503.2.1** (v DC převzatý dodatkem 12 DCMR H; vydání 2013 kapitolu 5 kromě § 507 a 508 neměnilo),
  **18 DCMR § 2405** (pravidla stání v DC, čtená přes MPD Instructional Aid 12.1 z roku 2023, ne z úředního DCMR).

Aplikace čte stávající ulice (a metro mimo DC, kde DEM neplatí), proto **všechno jen oranžově** (Bára 24. 11. 2026:
žádné vymyšlené hodnoty). Hodnoty jsou ve stopách, metry na dvě desetinná místa.

## B. Zapojené hodnoty (základ, pod ním oranžově)

| díl | základ | zdroj |
|---|---|---|
| chodník | 1,83 m (6 ft průchozí šířky v řídké obytné zástavbě; 8 ft v husté, 10 ft v centru) | DEM 2023 § 31.2.1.1, tab. 31-1 |
| společná stezka pro chodce a cyklisty | 3,05 m (10 ft) | DEM 2023 § 29.4.1 |
| cyklopruh | 1,52 m (5 ft, lépe 6 ft) | DEM 2023 § 29.3.3; BFDG tab. 2 |
| cyklopruh vedle stání | 1,52 m (5 ft; od obruby 12 ft včetně stání) | NACTO UBDG „Conventional Bike Lanes“ |
| jednosměrná chráněná cyklostezka | 1,52 m (5 ft, 7 ft při silném provozu) | DEM 2023 § 29.3.3; NACTO |
| obousměrná cyklostezka | 2,44 m (8 ft ve stísněných poměrech, jinak 10 ft) | BFDG § 2.1, tab. 2 |
| pruh pro autobusy | 3,05 m (10–12 ft) | NACTO TSDG „Curbside Transit Lane“ |
| jízdní pruh | 3,05 m (10 ft; 11 ft na trase autobusů) | DEM 2023 tab. 30-13, 30-14; NACTO |
| řadicí pruh | 2,74 m (9 ft, lépe 10 ft) | DEM 2023 tab. 30-13, pozn. 6 |
| podélné stání | 2,13 m (8 ft standard, 7 ft v místní ulici) | DEM 2023 tab. 45-1, 30-14 |
| kolmé stání | 5,49 m (hloubka 18 ft) | DEM 2023 tab. 45-1 |
| šikmé stání | 5,38 m (45°, hloubka 17 ft 8 in) | DEM 2023 tab. 45-1 |
| tramvajový pás | bez varování (DC Streetcar Design Criteria 2019 šířku pruhu neuvádí) | |
| jednosměrka s cyklisty v protisměru | bez varování (šířku neuvádí NACTO ani DDOT) | |

## C. Stání (odhad podle pravidel)

- **3 m na směr** (`freeLane: 3`): IFC 503.2.1 požaduje u příjezdové komunikace pro hasiče 20 ft (6,10 m) volné šířky,
  tedy asi 3 m na směr; 18 DCMR § 2405.2(g) zakazuje stát tam, kde zůstane méně než 10 ft (3,05 m) otevřené vozovky.
  Pravidlo aplikace je tedy blízko IFC; § 2405.2(g) mluví o 10 ft **celkem**, ne na směr. Platí přitom jen v Marylandu a Virginii
  (v DC rozhoduje inventář), kde DCMR ani dodatek DC k IFC neplatí a vlastní zdroj pro ně nemáme: 3 m je tam obvyklá šířka
  aplikace, ne jejich předpis.
- **DC ve skutečnosti parkuje oboustranně už od asi 8,75–9,75 m** (inventář DDOT: místní ulice se dvěma pruhy po 8 ft
  a dvěma pruhy stání po 8 ft). V DC proto o stání rozhoduje inventář DDOT, kde blok najde (`towns/usa.js`), a odhad podle
  pravidel je tam vypnutý; jinde v metru (Maryland, Virginie) platí odhad 3 m na směr.
- Stání na chodníku: 18 DCMR § 2405 ho zakazuje (z druhé ruky). `halfKerbNote` o zákazu od 25. 11. 2026 nic netvrdí, platí
  i v Marylandu a Virginii (recenze).
- Neověřeno (recenze 25. 11. 2026): čísla tabulek DEM 2023 (30-13, 30-14, 31-1, 45-1), § 29.3.3 a 29.4.1, tabulka 2 BFDG;
  čísla stran chybí.
- Neověřeno: 18 DCMR § 2406.1 (prahy 20 ft a 30 ft vozovky pro zákaz stání, jen ze shrnutí vyhledávače) a současný dodatek
  DC k IFC 503.2.1 (vydání 2017 a novější se nepodařilo otevřít).

## D. Nenalezeno

Šířka buspruhu a tramvajového pruhu v DC, vlastní šířka protisměrného cyklopruhu, šířka pásu stromů u NACTO, pravidlo
šířky jednosměrky s cyklisty v protisměru. Úplná tabulka rešerše (i hodnoty, které aplikace nepoužívá: maximum pruhu 12 ft,
NACTO „ne nad 11 ft“, jamka stromu 4 × 9 ft, středový pás se stromy 10 ft) zůstala ve scratchpadu agenta; hlavní body
jsou zde.
