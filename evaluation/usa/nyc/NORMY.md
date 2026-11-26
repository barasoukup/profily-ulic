# New York: normy šířek (26. 11. 2026)

Aplikace v New Yorku varuje **jen oranžově** (užší než základ), stejně jako ve Washingtonu: Street Design Manual je příručka
pro návrh, ne závazný předpis pro stávající ulice. Čísla jsou jen ta, která manuál výslovně uvádí; kde číslo není, aplikace
nevaruje. Zdroj: NYC DOT, *Street Design Manual*, online vydání https://www.nycstreetdesign.info (kapitola Geometry), přečteno
26. 11. 2026 (stránky stažené a čísla ověřená přímo z jejich textu; PDF 3. vydání z roku 2020 se nepodařilo otevřít, 404/403).

| díl | základ (oranžově pod ním) | co manuál říká | stránka |
|---|---|---|---|
| jízdní pruh | 3,05 m (10 ft) | „The typical lane width for moving vehicles is 10 feet; buses and trucks require lanes 11 to 12 feet wide.“ | geometry/lanes |
| podélné stání | 1,83 m (6 ft) | typicky 8 ft, „may be as low as 6 feet depending on the location“ | geometry/lanes |
| pruh pro autobusy | 3,35 m (11 ft) | Curb Bus Lane: „Minimum of 11 feet in width“ (Offset Bus Lane typicky 11–12 ft) | geometry/curb-bus-lane |
| cyklopruh | 1,52 m (5 ft) | Bike Lane Table: Conventional Bike Lane „5–6’ standard“ | geometry/bike-lane-table |
| jednosměrná chráněná cyklostezka | 1,22 m (4 ft) | „4’ min. lane + 3’ min. buffer (4’ min. buffer if no maintenance plan)“ | geometry/bike-lane-table |
| obousměrná chráněná cyklostezka | 2,44 m (8 ft) | „8’ min. (4’ per lane) + 3’ buffer (2’ if Jersey barrier used)“ | geometry/bike-lane-table |

Bez varování (číslo v manuálu není): chodník (průchozí šířka jen odkazem na ADA; u chodníku širšího než 25 ft „an 8-foot clear
path“, to je jiný případ), řadicí pruh, kolmé a šikmé stání, ostrůvek (vyvýšený dělicí pás „minimum of 7 feet“ platí pro
ochranu chodců na přechodu, ne pro každý dělicí pás, proto nezapojený).

## Stání podle zákona

Doložené pravidlo o volné šířce vedle stojícího auta v New Yorku jsme nenašli (NYC Traffic Rules 34 RCNY § 4-08 ani požární
předpis FC 503 se nepodařilo přečíst v úředním znění; čísla z druhotných zdrojů nepoužíváme). Platí jako ve Washingtonu obvyklé
3 m na směr aplikace (`countries/US.js freeLane`), ne newyorský zákon. **(Bára)** Rozhodnout, zda to stačí.
