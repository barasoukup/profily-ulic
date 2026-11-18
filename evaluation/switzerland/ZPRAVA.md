# Švýcarsko a Lichtenštejnsko: souhrn (17. 11. 2026)

Větev `switzerland` z `origin/main` (782c222), nenasazené. Podrobnosti: `ZDROJE.md` (data a licence), `NORMY.md` (normy,
zákon o stání, značky), `ab/ZPRAVA.md` (A/B úředního vyměřování), `RECENZE.md` (nepřátelská recenze Fable a co se z ní
udělalo), `screenshots/` (Curych, Basilej, Ženeva, Lugano, Vaduz).

## Z čeho je profil

- **Švýcarsko (CH):** plochy z úředního vyměřování (Amtliche Vermessung, pokryv půdy) přes geodienste.ch, kde je pod
  středem řezu vozovka, chodník nebo dráha (všechny kantony, které ho sdílejí; Vaud a Luzern ne); jinak odhad z ortofota
  SWISSIMAGE 10 cm a OSM. Pruhy čte SWISSIMAGE, domy OSM a vyměřování, hledání Photon.
- **Lichtenštejnsko (LI):** samostatný stát se svými hranicemi a zákony, které švýcarské opisují (stejná čísla značek, články
  VRV o jedno vyšší). Vlastní služby geoportálu neodpovídají; jeho úřední vyměřování je na geodienste.ch (kanton `FL`),
  SWISSIMAGE pokrývá i Lichtenštejnsko.

## Univerzální měření přesnosti (skill `mereni-presnosti`)

Vzorek: 10 švýcarských měst (Curych, Ženeva, Basilej, Lausanne, Bern, Winterthur, Luzern, St. Gallen, Lugano, Biel) a 5
lichtenštejnských obcí (Vaduz, Schaan, Triesen, Balzers, Eschen), 8 bodů do 1,5 km. Fotku z ulice (Mapillary) mělo 28 řezů
(Lugano, St. Gallen, Biel a Vaduz žádnou), dva posuzovatelé Sonnet, s vozovkou 24 řezů.

| stát | řezů | složení stejné | shoda složení | pruhy stejně | šířka do 1 / 2 m | nejčastější rozdíly |
|---|---|---|---|---|---|---|
| CH | 18 | 22 % | 59 % | 44 % | 28 % / 28 % | navíc chodník 5×, chybí stání 2×, navíc/chybí pruh 2× |
| LI | 6 | 33 % | 69 % | 50 % | 17 % / 33 % | chybí zeleň 2×, navíc dělicí pás 2× |

Pro srovnání (17. 11. 2026): CZ 56 %, SK 60 %, AT 57–58 %, DE 58–61 %.

- **Řezy s úředním vyměřováním 69 % (18), bez něj 41 % (6: Lausanne, Luzern, mezery)**: vyměřování pomáhá jako mapy
  povrchů v Rakousku a Německu. Malý vzorek, brát orientačně.
- **Stání:** aplikace ho má ve 3 řezech, posuzovatel v 5 (obojí 2, jen aplikace 1). Odhad podle zákona tedy nenadhodnocuje,
  zůstává zapnutý (bez stání vedle cyklopruhu, VRV čl. 19).
- Šířka uličního prostoru do 2 m jen 28 %: posuzovatel bere fasády, aplikace často končí u zeleně nebo „plochy“.

## Co zbývá

- **Nasazení:** před pushem spustit workflow OSM tiles ručně se `states: ch,li` (balíky jen na R2).
- Podmínky užití vyměřování po kantonech neprověřené (geodienste.ch odkazuje na kantony).
- Lausanne (Vaud) a Luzern bez vyměřování; vyznačená parkovací pole a modré zóny nemáme.
- Široké vozovky v Ženevě (pruh 9,5 m, pět pruhů po 4 m u kruhového objezdu), most nad ulicí.
- Švýcarské označníky zastávek a mobiliář (teď české), francouzské a italské rozhraní (jen se souhlasem Báry).
