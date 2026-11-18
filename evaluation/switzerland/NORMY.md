# Švýcarsko a Lichtenštejnsko: normy, zákon o stání, značky (17. 11. 2026)

Rešerše agentem (Sonnet), hodnoty jen z veřejných zdrojů. **Normy VSS (SN 640 xxx) jsou placené a veřejné nejsou:**
jejich hodnoty uvádíme podle kantonálních a městských příruček, které je citují, a v textu varování to říkáme
(„VSS 40 291 podle kantonu Bern 2026“). Kde veřejná hodnota chybí, aplikace nevaruje (jako v Německu).

## Zdroje

- S1 Kanton Bern TBA, Arbeitshilfe „Anlagen für den Veloverkehr“, 1. 9. 2021 (cituje VSS 40 201, 40 252, 40 262, SN 640 060, 40 291a)
- S2 Kanton Bern TBA, Arbeitshilfe „Parkierung“, 1. 1. 2026 (cituje VRV a VSS 40 291)
- S4 Kanton Basel-Stadt, „Standards Fuss- und Veloverkehrsinfrastruktur“ v1.0, 27. 9. 2024 (CC BY 4.0; cituje SN 640 070, VSS 40 201, 40 291)
- S5 Stadt Zürich, „Standards Fussverkehr“ Teil 1: Trottoirbreiten, 12/2020
- S6 Kanton Zürich, „Standards Veloverkehr“, 2/2023
- S7 Kanton Schwyz, Normalie D 2.01 „Massgebende Begegnungsfälle und Normquerschnitte“, v1.2, 1. 2. 2025 (VSS 40 200a/201/202)
- S8 Kanton Luzern, Richtlinie 653.115 Parkierung, 3/2015
- SSV (SR 741.21) ve znění k 1. 10. 2026, úřední PDF; VRV (SR 741.11) podle citací S2
- Lichtenštejnsko: SVG LGBl. 1978 Nr. 18 (LR 741.01), VRV LGBl. 1978 Nr. 19 (LR 741.11, konsolidované znění 12/2015),
  SSV LGBl. 1980 Nr. 65 (LR 741.21, znění 7/2023), gesetze.li

## Co aplikace používá (`countries/CH.js limitsCH`)

| prvek | min. (červeně) | základ (oranžově) | zdroj |
|---|---|---|---|
| chodník | 1,8 | 2,0 (hlavní trasy 2,4) | SN 640 070 podle S4 tab. 1 |
| společná stezka pro chodce a cyklisty | – | 3,0 (obousměrně cyklisté 3,5) | S7 |
| jízdní pruh hlavní ulice v obci | – | 3,25 (vozovka 6,5 pro potkávání nákladních aut) | VSS 40 201 podle S7 |
| jízdní pruh ostatních ulic, řadicí pruh | – | – | zdroj nenalezen, bez varování |
| pruh BUS s cyklisty | 3,0 | 4,5 | S1, S4 |
| pruh BUS bez cyklistů | – | – | zdroj nenalezen |
| cyklopruh | 1,5 | 1,8 | VSS 40 201, 40 252 podle S1; S4 |
| cyklopruh vedle podélného stání | 2,0 | 2,25 (1,5 + odstup 0,5–0,75) | VSS 40 291a podle S1; S6 |
| stezka pro cyklisty jednosměrná | 1,8 | 2,5 | SN 640 060 podle S1; S4 |
| podélné stání | 1,9 | 2,0 (u obruby nad 12 cm 2,2–2,5) | VSS 40 291 podle S2 |
| kolmé stání | 5,0 | 5,0 | VSS 40 291 podle S2 |
| šikmé stání | – | – | zdroj nenalezen |
| jednosměrka s cyklisty v protisměru | 4,5 | 4,8 | S1 (pruh 3,0 + cyklopruh 1,5), S6 kap. 4.9 (4,8 pro kolo a nákladní auto) |
| tramvajový pás | – | – | veřejná osová vzdálenost švýcarských tramvají nenalezena |

## Zákon o stání (odhad stání podle zákona)

- **Švýcarsko:** zákon žádnou šířku neuvádí. VRV čl. 19 odst. 2 zakazuje stát na hlavní silnici v obci, „wenn für das
  Kreuzen von zwei Motorwagen nicht genügend Raum bliebe“, odst. 3 v úzké ulici jen na jedné straně. Pravidlo 3 m (VRV
  čl. 18 odst. 2 písm. c) platí jen pro zastavení u čar. Kantony Bern (S2) a Luzern (S8) v pomůckách berou **3 m na
  projetí na vedlejší ulici a 6 m na hlavní** (vozidlo až 2,6 m). Aplikace proto jako v Německu: aspoň 3 m a pruhy vedle
  stání průjezdné (`lawNeed`). Stání na chodníku jen se značkou nebo značením, 1,5 m pro chodce (VRV čl. 41 odst. 1bis).
  Kde jsou vyznačená stání, jen v nich (SSV čl. 79 odst. 6), v Begegnungszone jen na vyznačených místech (SSV čl. 22b).
  Odhad stání proto nadhodnocuje v ulicích s vyznačenými poli; vyznačená pole nemáme.
- **Lichtenštejnsko:** vlastní VRV se stejným obsahem, čísla o jedno vyšší (čl. 20 zastavení, čl. 21 stání, čl. 40
  chodník). Smluvní základ převzetí jsme nehledali.

## Značky

Viz `pilot/public/signs-CH/README.md`. Čísla ověřená v SSV (2.49 je zákaz zastavení, 2.50 zákaz stání; Busfahrbahn je
2.64). Lichtenštejnská SSV má stejná čísla, o verzi starší (chybí např. tabulka 5.34.4 Gehbehinderte; kreslíme ji i tam).
