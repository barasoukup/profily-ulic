# San Francisco: kdo má pravdu v šířce, mapa, nebo posuzovatelé? (26. 11. 2026)

Slabina z `../ZPRAVA.md`: s mapou šířka ulice do 1 m od posuzovatelů jen u 7 % řezů (bez mapy 21 %), mapa o 2,5 m širší
v mediánu. Posuzovatelé měřili nad snímkem Esri World Imagery, kde střechy přečnívají přes chodník. Teď proti nezávislé
městské datové sadě: **DataSF Sidewalk Widths** (`4g86-grxu`, PDDL; studie AECOM 2014 připojená k osám ulic, `sidewalk_f`
skutečná šířka chodníku ve stopách, strana „Both“ nebo N/S/E/W; záporné = proměnlivá, 0 = neznámá, ty vynechány). Kód
zmrazený: větev `canada` a1e594d (`measure-1126`), aplikace beze změny.

## Postup

- **Řezy:** 60 řezů měření SF (`../fresh.json`), 45 z měření oprav (`../fixes/sample.json`) a **40 nových** (`sample.mjs`,
  semínko 20261127, jen ulice s chodníky: místní, sběrné, tepny; od dřívějších řezů nejméně 167 m, medián 554 m).
- **Profily** dnešní aplikace ve stránce (`../../../bridge-water/blind/collect.js`, `?osm=balik`): s mapou a `?sf=0`, tentýž
  řez; řádky `rows.json`. Mapa se použila u 122 ze 145 řezů.
- **AECOM** (`fetch.mjs`; celá sada 16 174 úseků jedním dotazem, sha256 a5a1be68…6684): úsek osy do 20 m od řezu, rovnoběžný
  (do 20°), přednostně stejné ulice. Šířku má 88 řezů (zbytek bez úseku nebo s šířkou 0 / proměnlivou).
- **Strana chodníku** = díly od kraje profilu po první díl vozovky (chodník, stromořadí, zeleň), stejně u aplikace i u
  posuzovatelů univerzálního měření (`../results/q*.jsonl`, 28 řezů).
- **Posun obrysů budov** (DataSF Building Footprints 2010 proti Right of Way Polygons 2014, tytéž vrstvy jako mapa): na řezu
  a na čarách 6 a 12 m vedle okraj uličního prostoru a první obrys domu za ním (do 4 m); mezera = g0 − posun·n (n vnější
  normála strany), posun nejmenšími čtverci, interval bootstrapem po řezech.
- Vše: `node compare.mjs > results.md` (tabulky po řezech tamtéž).

## 1. Chodníky proti AECOM

| kdo | stran | medián chyby (− AECOM) | medián abs. chyby | do 0,5 m | do 1 m |
|---|---|---|---|---|---|
| **aplikace s mapou** | 167 | **+0,1 m** | 0,6 m | 45 % | **66 %** |
| – jen řezy měření SF | 54 | +0,1 | 0,4 | 57 % | 74 % |
| – jen nové řezy | 64 | +0,3 | 0,8 | 33 % | 55 % |
| aplikace bez mapy (`?sf=0`) | 108 | +1,3 m | 1,9 m | 13 % | 26 % |
| **posuzovatelé nad Esri** | 16 | **−1,1 m** | 1,1 m | 13 % | 44 % |

Na 16 stranách, kde je mapa i posuzovatel, je blíž AECOM mapa 8×, posuzovatel 5×, stejně 3×. Mapa se mýlí hlavně
nahoru a hrubě: asi pětina stran je o víc než 3 m širší, protože za chodníkem pokračuje zeleň nebo park v uličním prostoru
(s-29, sa-10, n-5, n-38: 20–30 m), což AECOM jako chodník nepočítá.

## 2. Celá ulice

Celkovou šířku AECOM nemá. Složeno: vozovka mezi obrubami SFMTA (z profilu s mapou) + chodníky AECOM.

| porovnání | řezů | medián rozdílu | do 1 m |
|---|---|---|---|
| aplikace s mapou − (obruby + AECOM) | 79 | +0,3 m | 49 % |
| bez mapy − (obruby + AECOM) | 79 | +0,8 m | 24 % |
| posuzovatelé − (obruby + AECOM) | 10 | −1,1 m | 30 % |
| vozovka: posuzovatelé − aplikace s mapou | 10 | −0,4 m | 50 % |

Posuzovatelé měří vozovku skoro stejně jako obruby SFMTA (−0,4 m), rozdíl je v chodnících: nad Esri je vidí o metr
užší, než jsou (střechy a stíny přes chodník, jak se tušilo).

## 3. Posun obrysů budov

705 mezer u 111 řezů. **Posun 1,3 m směrem 122° (východ 1,1 m, 95 % 0,8–1,4; jih 0,7 m, 0,5–0,9)**, zbytková mezera g0 0,4 m.

| směr ulice | stran | mezera na straně k V/S | na straně k Z/J | posun napříč ulicí |
|---|---|---|---|---|
| sever–jih | 275 | −1,0 m (dům v uličním prostoru) | +1,5 m | 1,3 m na východ |
| východ–západ | 269 | +0,9 m | −1,0 m | 0,9 m na jih |
| SoMa a šikmé (Folsom, Mission…) | 161 | +0,1 m | +0,3 m | 0,1 m |

Dosavadní „1,4 m východně“ (ze tří ulic) zachytil jen východní složku (1,1 m); chybí jižní 0,7 m: obrysy jsou posunuté na jihovýchod, takže na
ulicích východ–západ vzniká mezera asi 0,9 m na severní straně a překryv na jižní. V SoMa, kde ulice běží zhruba ve směru
posunu, se posun neprojeví. `FACADE_GAP = 2` pokryje mezery obou směrů (mediány 1,5 a 0,9 m) a překryv řeší přednost
uličního prostoru, takže pravidlo platí i na ulicích jiného směru; v komentáři `towns/sanfrancisco.js` by měl být popsán
posun 1,3 m k jihovýchodu, ne 1,4 m na východ.

## Odpověď

**Pravdu má mapa, ne posuzovatelé.** Chodníky z mapy sedí s nezávislou městskou sadou v mediánu na 0,1 m (do 1 m 66 %),
posuzovatelé nad snímkem Esri je mají o 1,1 m užší, vozovku přitom měří skoro shodně s obrubami. Nízkou shodu „šířky do 1 m“
v `../ZPRAVA.md` tedy způsobují hlavně posuzovatelé. Pro měření SF (a jiných měst nad Esri) je lepší šířku hodnotit proti
městským datům, ne proti posuzovatelům. Skutečná slabina mapy je jiná: zeleň a parky v uličním prostoru za chodníkem (pětina
stran o víc než 3 m širší než chodník AECOM); jestli je to chyba, záleží na tom, kde má profil končit (u hranice uličního
prostoru je to správně, ale posuzovatel ji nevidí).

## Výhrady

- **AECOM není úplně nezávislá:** studie z roku 2014 mohla vycházet ze stejných podkladů města jako vrstva uličního prostoru
  (2014); shoda tedy potvrzuje spíš soulad městských dat než skutečnost na ulici. Na místě ani ve Street View jsem neměřila.
- Posuzovatelů je málo: jen 16 stran a 10 celých ulic (univerzální měření mělo 28 řezů a AECOM pro mnohé nemá šířku).
- Data jsou stará: AECOM a uliční prostor 2014, obrysy 2010; přestavby chodníků od té doby AECOM nezná.
- Párování úseku podle vzdálenosti a směru: u křižovatek a krátkých bloků může vzít sousední úsek (sloupec „jméno sedí“ v
  `results.md`).
