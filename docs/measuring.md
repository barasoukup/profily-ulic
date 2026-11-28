# Měření přesnosti a test nového zdroje

Univerzální měření přesnosti, A/B test zdroje a výsledky po státech.

## Měření přesnosti (Bára 17. 11. 2026, přeměřeno 24. 11. 2026)

- Jedna univerzální metoda pro všechny státy: skill `measure-accuracy`, kód a zpráva `evaluation/universal/`.  Hodnotí složení uličního prostoru, pak šířku; jen řezy s fotkou
  z ulice (Mapillary, v Česku i Mapy.com).
- Pravidla od 24. 11. 2026 ve **všech** státech (všechny řádky počítá jedna metoda): strana bez fasády se srovnává šířkou
  i složením jen po okraj ulice, za ním se nehodnotí nic, ani zeleň (konec u obruby je pro uživatele správně, zelený pás
  za obrubou Bára zamítla, `evaluation/ortho-osm/green-strip/REPORT.md`); řezy na `service=driveway`, `parking_aisle` a
  `drive-through` se vynechají (značka cesty z balíku OSM státu, `results/sluzebni-<iso>.json`; `BRIEF.md`).
- Přesbíráno 25. 11. 2026 (stejná posouzení, 467 řezů přesně na posouzeném místě, kód b4b8964, `results/staty.md`):
  shoda složení CZ 58 %, SK 84 %, AT 58 %, DE 57 %, CH 62 %, LI 69 %, NL 59 %, BE 47 %, LU 51 %, PL 65 %, FR 58 %, ES 56 %,
  PT 64 %, CY 55 %, MT 58 %, IT 56 %, EE 44 %, SI 62 %, LT 75 %, FI 52 %, DK 59 % (FI a DK posuzoval Opus, ne Sonnet). Sdílené změny
  24.–25. 11. (mapFill, lawlanes, parkshare, křižovatky a osy, widereach) zapnuté proti vypnutým v témže sběru: 59 ze 402 řezů
  jinak, lépe 9, hůř 10, celkem 58 → 58 %; 226 nových ulic naslepo: mapFill 8 : 7 (Zaragoza 0 : 4, jinde 8 : 3), lawlanes 7 : 8.
  Nalezené chyby (piktokoridor, `markIslands`, jednosměrka na dva pruhy) opravené 25. 11. (7af8747, AT 60 %, ES 55 %, PT 65 %). Na 571 nových
  ulicích `lawlanes` proti vypnutému 34 : 21 (složení 11 : 11, šířky 23 : 10), oficiálně 1 : 3 beze změny shody: zůstává zapnuté, rozhodne Bára
  (`evaluation/archive/unification/measure2/REPORT.md`). SK odhad stání zapnutý 12 : 7, bez `lawlanes` 16 : 11.
- Přeměření 24. 11. 2026 (předchozí řádky v `evaluation/universal/REPORT.md`):
  CZ a PL přesbírané týž večer: CZ po opravě čtení DTM krajů po JVF DTM 1.5 (63b9726; řezy s DTM krajů 34 → 51 %, Praha,
  Brno, Plzeň, Jihlava 68 %), PL po návratu ortofota Geoportalu (ortofoto ve 23 z 29 řezů). Před → po a výklad v
  `evaluation/universal/REPORT.md` (oddíl 24. 11.). CZ znovu 25. 11. s doplněním kolem mapy i v Česku: 58 % beze změny
  (2 ze 40 řezů jinak, olomouc-4 lépe).
- Přesnější pokyn posuzovatelům (25. 11. 2026, `BRIEF.md`: každá část od 0,5 m i pásy trávy u obruby, stání podle pruhu, ne podle
  aut): 40 evropských řezů 54 → 55 %, kontrola starým pokynem 50 % (šum posuzovatelů); doporučení: staré státy neposuzovat
  znovu, pokyn používat dál (Bára rozhodne; `evaluation/universal/REPORT.md`).
- Doplnění kolem mapy povrchů (mapFill: stání z aut modelu ve vozovce mapy, zákonný pruh bez aut zpět, OSM stání smí
  ubrat pruhům 0,3 m) platí od 25. 11. 2026 ve všech státech i v Česku, příznak státu zrušen, vypíná jen `?off=mapfill`
  (Bára: výjimka jen s měřením). A/B 90 nových českých řezů: změna 7, lépe 6 : 2 (kraje 4 : 1, Praha 1 : 0, Brno 1 : 1),
  `evaluation/archive/mapfill-cz/REPORT.md`.
- Sjednocení výjimek (Bára 24. 11. 2026: co nejvíc sdíleně, výjimka jen s měřením nebo rozdílem zákona, norem a dat;
  `evaluation/archive/unification/AUDIT.md`, `REPORT.md`): `besidePassport` všude (i CZ), osy OSM, obslužné cesty a ústí uliček jako křižovatky
  všude i v Praze (`city.fix` zrušené, `evaluation/archive/unification/praha/REPORT.md`; plocha uličky jen pro ulici, do které ústí, kliky `evaluation/clicks/REPORT.md`: oprava naslepo 17 : 2, obslužné cesty zůstávají, limit posunu nezapnutý; po změně pravidel umístění `node evaluation/clicks/collect.mjs`), delší dosah dálnic a hlavních ulic jedním pravidlem dat řezu (`app.js widerSides`,
  příznaky `wideRoads`/`wideStreets` zrušené), oprava stání z modelu u zákonného pruhu (`?off=parkshare`). Zákonný odhad
  stání platí i na Slovensku (25. 11.: jeho prohry byly z chyby sdíleného kódu, zákonný pruh ležel ve vozovce dřív, než se měřily
  pruhy; teď pruhy napřed, `ai-kerbs.js lawKerbs`, `?off=lawlanes`, A/B oprava 13 : 6, SK se zákonem 6 : 7 a CZ 5 : 5,
  `evaluation/archive/unification/slovakia-parking/REPORT.md`); výjimku stání má jen Monako (zákon). Uložený řez (`#rez=`, vložená
  poloha s azimutem) se otevře přesně tam, kde byl uložen (`derive.js placeCut`), pravidla křižovatek a středu dvou vozovek
  posouvají jen kliknutí. Odkaz nese i cestu OSM (`#rez=lat,lon,azimut,vlevo,vpravo,way`, azimut na 0,1° od 25. 11. 2026; `share.js`, `derive.js savedStreet`);
  starý odkaz nebo zaniklá cesta: nejbližší ulice jako dřív.

## Malé vzorky (Bára 27. 11. 2026, krok 18 plánu úklidu)
Nikdy neměřit celý vzorek v prohlížeči jen proto, aby se našlo, co se změnilo. **Od 28. 11. 2026 (krok 13b) se A/B
a kontroly dělají v Node**: `node evaluation/replay/node.mjs <vzorek> <běh> [--switches='off=mapfill']` přehraje řezy
jádrem řezu (`app/public/app/cut-core.js`) nad nahrávkou bez prohlížeče, `compare.mjs <A> <B>` porovná dva běhy
(profil, řez, kredity, město, stavový řádek). Prohlížeč jen na kresbu (SVG, ilustrace, karty Návrhu) a na závěrečnou
kontrolu; co Node neporovnává, je v `evaluation/replay/README.md` (Přehrávka v Node).

**Knihovna `evaluation/lib/`** (krok 19, 28. 11. 2026) drží, co měření opakují; nástroj z ní si vezme, co potřebuje:
`sample.js` (vzorek podle délky sítě `lengthWeighted`, vzorek ze seznamu `randomSubset`, rozložení po skupinách `spread`,
nahrané vzorky přehrávky `loadSample`), `collect.js` (profily řezů v Node nad nahrávkou: `collect({ cuts, switches })`, celý
vzorek v procesech `collectRun`), `ab.js` (míry profilu, `differs`, soubor verdiktů `review.md`, shrnutí, slepé páry
`blindPairs` s náhodným a zaznamenaným pořadím, `unblind`, `tally` se znaménkovým testem), `score.js` (skóre složení a šířky
jako v `universal/`, řádek tabulky `tableRow`), `report.js` (kostra `REPORT.md`), `control.mjs` (kontrolní sada).

**Postup: oprava → cíle offline → kontrolní sada → A/B na cílech → regrese**
1. **Oprava** se napíše za vypínač (`?off=…`, `flags.js`), aby šla srovnat se stavem bez ní.
2. **Dotčené řezy najít offline**: predikát v Node nad nahranými vstupy přehrávky (`data/replay/`, `evaluation/replay/`)
   nebo nad uloženými vstupy sběračů (OSM tagy, plochy, uložené díly), např. „řez má `highway=service` a úsek bez
   volného místa“. `loadSample("sample-cz")` dá řezy, `targets(cuts, predikát)` vybere dotčené, `randomSubset(cíle, 40, semínko)`
   zmenší na 20–40 pro slepé A/B (každý změněný řez se prohlédne). Výstup: seznam řezů, které oprava může změnit.
3. **Kontrolní sada**: `node evaluation/lib/control.mjs` přehraje v Node 47 řezů ve 24 státech (`control.json`, v gitu;
   Praha, Brno, kraje, SK, AT, 20 dalších států po dvou) a porovná hash každého pole výstupu s uloženým (stav, řez, kredity,
   město, stavový řádek…). **0 změn = OK**, jinak vypíše změněné řezy (pole, profil před a po). Trvá asi 6 s. Pořadí řezů v souboru
   se nemění (řez si pamatuje ten před sebou, `AGAIN_M`). `--switches='off=mapfill'` ukáže, které řezy vypínač mění. Změna,
   která se má projevit: zkontrolovat změněné řezy, pak `node evaluation/lib/control.mjs --make` (nový `control.json` do
   téhož commitu, výběr řezů drží semínko; nový stát přidat do `replay/sample.mjs`, ne sem).
4. **A/B na cílech**: `node evaluation/replay/node.mjs <vzorek> <běh> --jobs=8` s vypínačem a bez něj a
   `node evaluation/replay/compare.mjs`, nebo vlastní skript s `collect()`; páry pro posuzovatele `blindPairs(páry, semínko)`
   (klíč `key` do souboru, který posuzovatel nedostane), po posouzení `unblind(verdikty, key)` a `tally(…)` (počty a p).
   Dva posuzovatelé, pokyn neutrální, levnější model. Míry šířek a `review.md` z `ab.js` (`evaluation/ab.mjs` je používá).
5. Oprava, která jen přepisuje díly profilu, se ověří offline nad uloženými díly a tagy; prohlížeč jen pro pár cílů.
6. **Regrese** Prahy a Brna (`evaluation/ortho-osm/regression.mjs`) jednou po sérii oprav, ne po každé; horší výsledek se
   hledá vypínáním oprav po jedné (`flags.js`).
7. **Zpráva**: `reportSkeleton({…})` z `report.js` dá kostru `REPORT.md` (co se měnilo, vzorek a sběr, výsledky, rozhodnutí,
   co zůstává). Do zadání agenta vždy napsat: filtr cílů, velikost vzorku, kontrolní sadu, levnější model pro posuzovatele.
   Nové obrázky z měření do gitu nepřidávat.

Co je zatím mimo knihovnu: nástroje, které se nepoužívají, se přepíšou, až se budou používat (`clicks/`, `holdout/`,
`ortho-osm/regression.mjs`, `variants/`, `streetview/`, `universal/` kromě `score-states.mjs`; ten, `ab.mjs` a `sample.mjs` knihovnu používají).

## Test nového zdroje (A/B)

**Pravidlo: nový zdroj (nebo jiné použití starého) jde do aplikace, jen když nad ortofotem vyhraje.**

- Varianta je soubor `evaluation/variants/<název>.mjs`. Exportuje náhrady některých z pěti zdrojů
  `sources.js` (`osm`, `surfaces`, `lines`, `parking`, `podlaznost`, se stejnými argumenty a odpověďmi) a krátký
  popis `about`. Co nenahradí, bere se z běžných zdrojů města. Varianta `city` je současný stav (bez souboru).
- `CITY=jihlava VARIANTS=city,moje-varianta node evaluation/ab.mjs [od] [do]` spočítá každý řez vzorku
  (`evaluation/<město>/data/samples.json`) jednou za každou variantu, na stejné čáře řezu. Víc variant
  (`city,x,y`) srovná první s každou další. `ONLY=9,10` jen vybrané řezy; `CACHE=disk` si odpovědi služeb uloží
  (`data/ab-cache`) a opakovaný běh se už služeb neptá. Dotazy na ČÚZK jdou ohleduplně přes `evaluation/polite.mjs`
  (jeden po druhém, 300 ms od sebe, pauza při 429 nebo 503).
- Výstup `evaluation/<město>/data/ab-<a>-<b>/`: `<n>.json` (oba profily, čas, počet dotazů, míry: šířka celkem,
  vozovka, chodník, okraje, podíl „Neurčeno“, odhad z OSM), `png/<n>.svg.png` (lišící se řezy nad ortofotem,
  A nahoře, B dole) a `review.md` (řádek na každý lišící se řez: vozovka nebo chodník o víc než 0,5 m, jiný okraj).
- Do `review.md` se místo `?` doplní verdikt `a`, `b`, `obě` nebo `žádná`. Pak
  `… node evaluation/ab.mjs --summary` vypíše shodu, mediány rozdílů a součty verdiktů; `--render [n …]` znovu
  nakreslí obrázky.
- Příklad: pasport komunikací v Jihlavě, `evaluation/jihlava/PASSPORT.md`.
- **Změna pravidla** (ne zdroje): varianta exportuje `deriveProfile` z kopie kódu před změnou
  (`cp -R app/public/*.js app/public/towns evaluation/<složka>/data/kod-0`, vzor `variants/pred-zakon.mjs`).
  `ITEMS=1` počítá i stání a předměty, `PARTS=1` i druhy částí (např. druh tramvaje) a šířky pruhů a krajnic.
  Příklad: `evaluation/archive/rules-2026-11/REPORT.md`.
