# Nepřátelská recenze Litvy (24. 11. 2026, commit aabfcb5)

Recenzent (Opus) četl kód, testy, zprávy a 3 dotazy na gis.vplanas.lt. Verdikt: zatím nenasazovat; bod 1 skutečná chyba.

| # | Nález | Závažnost | Co se stalo |
|---|---|---|---|
| 1 | `"none"` znal jen `laneImage`; `orthoPatch` (model obrub, `?ai` výchozí zapnuto) ho bral jako ČÚZK: každý litevský odhad stahoval model a ptal se ČÚZK na Litvu | vážné | opraveno: `orthoPatch` vrací null, `app.js` model obrub pro `"none"` nespouští, test |
| 2 | obrázky A/B s titulkem a kreditem Slovenska; výřezy ortofota Vilniusu s neověřenou licencí ve veřejném repu | střední | titulek a kredit opraveny, `images/` jen lokálně (`.gitignore`) |
| 3 | zprávy nafukují A/B (výhry hlavně na pěšinách a obslužných cestách), měření mapu vidí hůř; nové pravidlo jen v `score.mjs` | střední | rozpad výher v `ab/REPORT.md`, nesrovnatelnost a otevřená otázka v `REPORT.md`; pravidlo pro ostatní státy nezavedeno (Bára: nepřepočítávat) |
| 4 | šířka ulice za fasádou (chybí obrysy domů) | střední | otevřené: obrysy GRPK jako budovy před mapou zkusit s A/B (otázka pro Báru) |
| 5 | nejisté převody kódů: `aikšt` jako chodník, 2401/2409/2414, `sporto`, bažina, moře | střední | opraveno: účel podle začátku slova bez ohledu na velikost, `aikšt` → zpevněná plocha, 2401/2409/2410/2414 → OSM, bažina zeleň, moře vodní plocha; testy |
| 6 | stránkování bez řazení | drobné | opraveno: `orderByFields=OBJECTID`, `resultOffset` a `resultRecordCount` u všech stránek |
| 7 | normy se rozcházejí s NORMS.md D; šikmé stání s rozměrem kolmého | drobné | šikmé bez varování; NORMS.md doplněno o zapojené hodnoty a odchylky |
| 8 | pobřežní tolerance 400 m i na pozemních hranicích (BY, LV, Kaliningrad) | drobné | ponecháno: bez ní by padl kus přístavu Klaipėdy (bod 55,715; 21,115 byl „cizina“); stejné omezení mají Finsko a Dánsko |
| 9 | licence značek bez odkazu na text a seznamu úprav | drobné | doplněno v `signs-LT/README.md` a `LICENCE-A-ZDROJE.md`; čísla 503, 531, 555 z druhé ruky označena |
| 10 | de.js: „Schutzstreifen“ (= ochranný cyklopruh), „Tafeln“ | drobné | opraveno (Sicherheitstrennstreifen, Sicherheitsstreifen, Zusatzzeichen); lt.js „lygiagretus“ / „išilginis“ k ověření rodilým mluvčím |
