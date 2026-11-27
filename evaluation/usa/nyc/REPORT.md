# New York: zapojení a čerstvé měření mapy povrchů (26. 11. 2026)

Kód zmrazený před vzorkem: 18945f8 (větev `na-newyork` z `canada` 10882aa). Po sběru se kód neměnil. Vše
`evaluation/usa/nyc/measure.sh score` → `results/score.md`.

## Co je zapojené

- Stát `usa` má od teď dvě metra (`tools/build_states.mjs METROS`): Washington a **New York City, pět obvodů** (TIGERweb).
  Okolní okresy (New Jersey, Westchester, Nassau) nejsou: nemají mapu povrchů a okolí Washingtonu a Toronta bez mapy
  dalo jen 51 %; zůstávají v `closed_us` s hláškou. Město `newyork` v `towns-us.json`.
- **Mapa povrchů:** NYC Planimetric Database 2022 (NYC OTI) z organizace NYCmaps na ArcGIS Online (vozovky, chodníky, náměstí,
  ostrůvky, parkoviště, budovy; CORS *) přes společný adaptér `towns/planimetrics.js` (`towns/newyork.js`, `?nyc=0`).
- **Domy:** z obrysů budov téže služby (výška střechy → podlaží, rok, garáž; `?nychouse=0`). PLUTO nebylo třeba.
- **Ortofoto** státu New York 2024 (NYS ITS, 0,5 ft) nad městem.
- Normy Street Design Manual jen oranžově (`NORMS.md`), ilustrace `newyork/` (autobus MTA, lampa, označník).
- OSM balík `us_nyc` (44 MB, jen R2).

## Vzorek

- `sample.mjs` (semínko 20261127): **50 náhodných bodů podle délky sítě** pěti obvodů (místní 59 % délky, tepny 16, obslužné
  10, sběrné 8, dálnice 7 %), nejméně 150 m od sebe a od míst zkoušených při psaní kódu. Fotka Mapillary se **nevyžaduje**:
  s ní vypadlo v prvním tahu 56 místních ulic a vzorek byl z pětiny dálnice (New York má Mapillary hlavně na tepnách). Tak
  měl vzorek místní 31, tepny 9, sběrné 4, obslužné 3, dálnice 3; fotku z nich má 19.
- `sample-u.json` (`PHOTO=1`, semínko 20261128): **25 dalších bodů s fotkou** jen kvůli univerzálnímu měření, které hodnotí
  podle fotek; ten tah poměr sítě nedrží (víc tepen a dálnic).
- Sběr v aplikaci (`../collect.js`, varianty `def` a `nyc0`, jen OSM zvlášť): mapa použita v 72 ze 75 řezů (n-21 park, u-3,
  u-15 parkoviště letiště: posuzovatel je také označil jako ne-ulici). Ortofoto přečteno ve všech 75 řezech odhadu.

## Slepé A/B mapa : odhad (`?nyc=0`)

Dva samostatní posuzovatelé Sonnet na každou dvojici (8 balíků, X/Y náhodně, zdroje skryté, ortofoto a fotky, pokyn
`../fresh/BRIEF-AB.md` beze změny, zadání agentům jen „přečti ZADANI.md a postupuj podle něj“). 72 dvojic se lišilo (3 stejné).

| výběr | mapa : odhad | nerozhodně | p |
|---|---|---|---|
| **všechny (75 řezů)** | **31 : 23** | 17 (+1 nejde) | 0,34 |
| jen vzorek podle sítě (n-) | 21 : 15 | 13 | |
| jen tah s fotkou (u-) | 10 : 8 | 5 | |
| místní | 13 : 10 | 14 | 0,68 |
| tepny | 10 : 4 | 2 | 0,18 |
| sběrné | 2 : 6 | 0 | 0,29 |
| dálnice | 3 : 3 | 1 | 1,0 |

Hlasy 58 : 45, stejně 38. Shoda posuzovatelů 51/72; kde oba vybrali stranu, 39/44. Posuzovatelé si stěžovali na tmavé
ortofoto (stíny vysokých domů, nálet na jaře) a malé rozdíly šířek: velká část hlasů má nízkou jistotu.

## Univerzální měření (skill `measure-accuracy`, `../../universal/BRIEF.md`)

31 řezů s fotkou (z obou tahů, podle typů), 2 posuzovatelé Sonnet, bez profilů; 28 použitelných (3 nejsou ulice).

| profil | shoda složení (95 %) | pruhy stejně | šířka do 1 / 2 m | nejčastější rozdíly |
|---|---|---|---|---|
| **s mapou New Yorku** | **73 %** (64–80) | 43 % | 25 / 43 % | chybí stání 12×, navíc dělicí pás 4× |
| bez mapy (`?nyc=0`) | 70 % (61–78) | 50 % | 25 / 39 % | chybí stání 13×, chybí pruh 6×, chybí chodník 6× |
| jen OSM | 63 % (55–71) | 54 % | 18 / 43 % | chybí stání 24× |

Mapa proti `?nyc=0` +2 body (−4 až +10), lépe 9, hůř 8, stejně 11: **neprůkazné**. Proti samotnému OSM +10 (+2 až +17, p 0,03).
Po typech: místní 90 / 84 / 59 %, tepny 64 / 60 / 57, sběrné 57 / 55 / 52, dálnice 84 / 88 / 88 (6 řezů).

## Domy z obrysů budov

Bez obrysů aplikace v New Yorku podlaží nezná (OSM v balíku je nemá: 0 ze 101 domů vzorku), s nimi je má u 98 ze 101. Proti
fotkám (jeden posuzovatel, 23 domů, kde dům na fotce byl): přesně 11, do ±1 podlaží 13, průměrně o 0,9 podlaží méně
(`results/houses-score.txt`). Velké rozdíly (n-7B 2 proti 8, u-9B 2 proti 12) jsou nejspíš jiný dům na fotce (posuzovatel sám
psal, že stranu nepřiřadil jistě). Srovnání „bez obrysů“ nejde (bez nich žádné číslo), proto jen tahle kontrola.

## Rozhodnutí

**Mapa New Yorku zůstává zapnutá**: neprohrála (A/B 31 : 23, univerzálně +2), jen nevyhrála průkazně; proti OSM vyhrává.
Podle pravidla „co prohraje, zůstane vypnuté“ zapnutá, **rozhodne Bára** (jako inventář DDOT). Domy z obrysů zapnuté.
Oficiální řádek US se nemění (Washington 76 %); New York zvlášť 73 % (28 řezů, posuzovatelé Sonnet).

## Kde mapa prohrává a proč

- **Stání** (chybí 12× i s mapou): mapa má vozovku od obruby k obrubě a stání v ní nerozliší; odhad bere stání z aut na
  ortofotu, které je mezi vysokými domy ve stínu. New York stojí podél skoro každé ulice. Washington to řešil inventářem DDOT,
  New York takový otevřený inventář nemá (blízko by byla data parkovacích značek NYC DOT, nezkoušeno).
- **Počet pruhů** (sběrné ulice 2 : 6: n-6 Francis Lewis Boulevard jeden pruh s krajnicemi, u-8 Arthur Kill Road čtyři pruhy
  místo tří): široká vozovka mapy se dělí podle pravidel, ne podle značení.
- **Nadzemní metro** (Queens Boulevard v Sunnyside, při zkoušení): mapa pod sloupy ulici pod středem řezu nenašla.

## Kontroly

- `npm test` 504/504, regrese `../../ortho-osm/regression.mjs` beze změny proti `results/regression.txt`.
- **Washington beze změny:** 10 řezů z `../fresh` (každý šestý) přehráno v novém kódu, profily shodné s nahrávkou z 25. 11.
  (10 z 10). Evropa: sdílený kód se změnil jen v `rules.js` (předává město řezu) a v hranicích Severní Ameriky.
- V prohlížeči (port 5234): Amsterdam Avenue (Manhattan), Queens Boulevard (Queens) s mapou, domy z obrysů.

Data sběru (git je ignoruje): `evaluation/universal/data/us-nyc.json`, `us-nyc-osm.json` (složka je odkaz do worktree
`france`), balíky posuzovatelů `data/`.
