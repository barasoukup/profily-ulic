# Ortofoto: čáry, výplň krajnice a auta u obruby (pokus 11. 11. 2026)

Otázka (Bára): dají se z ortofota zpřesnit šířky pruhů, poznat, co je ve výplňové krajnici, a rozhodnout,
na které straně se parkuje? Pokus na vzorcích 100 řezů Prahy a Brna (`evaluation/data/samples.json`,
`evaluation/brno/data/samples.json`), profily současné aplikace z `ab.mjs` (`VARIANTS=city,stejne`).

```bash
CITY=praha node evaluation/ortofoto/run.mjs    # stáhne ortofota (jednou, cache), přečte je, data/<město>/index.html
CITY=praha node evaluation/ortofoto/analyze.mjs  # souhrn data/<město>/souhrn.md
```

Výsledky a obrázky jsou v `evaluation/ortofoto/data/<město>/` (git je ignoruje). Na stránce `index.html` je
každý řez nad každým ortofotem: profil aplikace (modře), nalezené čáry (červeně), pásy u obrub s auty
(fialově) a verdikt výplně krajnice.

## Ortofota

| klíč | zdroj | rozlišení | kde | obrázek na řez (pokus, PNG ±20 m) |
|---|---|---|---|---|
| cuzk25 | ČÚZK WMS (dnes v aplikaci) | 25 cm | celá ČR | 50 kB |
| cuzk12 | ČÚZK WMS, jemnější úroveň | 12,5 cm | celá ČR | 150–160 kB |
| ipr10 | IPR letecké snímkování 8. 6. 2024 | 10 cm | Praha | 250 kB |
| ipr05 | IPR mimovegetační snímkování 3/2025 | 5 cm | Praha | 710 kB |
| brno25 | Brno ortofoto 2025 (dlaždice z20) | 10 cm | Brno | 300 kB |

V aplikaci by stačil úzký pás a JPEG, tedy zhruba desetina těchto velikostí. Výpočet trvá milisekundy.

## Co se ukázalo

1. **Profil neleží tam, kde ulice.** Aplikace drží celkovou šířku, ale dává tramvajovým tělesům a pruhům normové
   šířky, takže se pruhy proti skutečné obrubě posunou o 1–2 m (Bělohorská 1,7 m). Ortofoto se proto musí
   porovnávat s geometrií vozovky z MTVU (plochy 700/701/704 a úseky stání 97xx), ne s poskládaným profilem.
   Pokus každou vozovku profilu natáhne na tu vozovku MTVU, se kterou se nejvíc překrývá.
2. **Ortofoto se musí doladit k MTVU.** Po doladění podle obrub je posun typicky 0,4–0,5 m (ČÚZK i IPR);
   brněnské ortofoto 2025 je proti ČÚZK posunuté asi o 2,2 m (zdroj s jinou transformací souřadnic). Doladění
   není spolehlivé všude: mezi ortofoty se shoduje (do 0,5 m) jen u čtvrtiny až třetiny řezů. Pro aplikaci by se
   hodilo zarovnávat podle více hran (obruby i čáry) a u slabé shody ortofoto nepoužít.
3. **Čáry: nadějné.** Vodorovné značení se najde u 71–87 % vozovek se dvěma a více pruhy (Praha: ČÚZK 25 cm 71 %,
   12,5 cm 76 %, IPR 10 cm 82 %, IPR 5 cm 87 %; Brno 76–82 %). Na prohlédnutých řezech (Rozvadovská spojka,
   Karlovarská, Poděbradská, Švehlova, Otakara Ševčíka) jsou nalezené čáry skutečné: plné vodicí a přerušované
   dělicí čáry. Šipky na vozovce se odliší tím, že se neopakují podél ulice, kolejnice se vynechávají.
   Chybí čáry ve stínu a vybledlé čáry. Hranice pruhů profilu sedí s čarou do 0,5 m jen u 16–24 % hranic, šířka
   pruhů podle čar se od profilu liší o 0,36–0,54 m (medián). To je hlavní příležitost: profil dnes dělí vozovku
   rovným dílem, ortofoto ukazuje, kde pruhy opravdu jsou (Rozvadovská: krajnice za plnou čárou ověřená, pruhy
   3,7 a 4,0 m proti 3,75 m v profilu).
4. **Výplňová krajnice: částečně.** Ze 44 (Praha) a 36 (Brno) krajnic „odhad“ vyjde podle jemného ortofota
   asi 56–57 % prázdný asfalt, 18–28 % šrafy, zbytek auta nebo nejasné. Šrafy se poznají dobře (Brno, řez 2),
   auta hůř (viz dál).
5. **Auta u obruby: zatím nespolehlivé.** Kde je ulice na slunci a bez stromů, řada aut se najde (Olšanská,
   Otakara Ševčíka, Rovná, Zborovská na IPR 5 cm). Selhává ve stínu domů (hlavně jarní IPR 5 cm s nízkým
   sluncem, ale i letní snímky v úzkých ulicích), pod korunami stromů a u 25 cm ČÚZK, kde hrubá textura dělá
   „auta“ i z prázdné vozovky (Brno: auta u 45 % obrub bez stání). Snímek je jen jedna chvíle: v Brně jsou na
   ČÚZK a na městském ortofotu u stejné obruby jednou auta, jednou ne.
   Odhad stání jen na jedné straně má ve vzorcích jen 3–5 vozovek, to na posouzení nestačí.

## Doporučení

- Pokračovat s **čarami a šířkami pruhů** (ČÚZK 12,5 cm pro celou ČR, v Praze IPR 10 cm): zarovnat k MTVU,
  pruhy rozdělit podle nalezených čar, ve zdroji „ortofoto“, a jinak nechat pravidla. Další krok je ověření proti
  ručně změřeným šířkám (vzorek asi 30 vozovek) a záznam úprav od uživatelů.
- **Šrafy v krajnici** brát rovnou s čarami (stejný výřez).
- **Auta** jen jako doplněk na slunné ulice a s vlastním vzorkem řezů s jednostranným odhadem stání; IPR 10 cm
  (léto, krátké stíny) se jeví lépe než jarní 5 cm. Bez listí je jarní snímek lepší pod stromy, ale stíny
  jsou dlouhé.

## Jak detektory fungují (run.mjs)

- **Výřez:** jeden obrázek kolem řezu (profil + 3 m, ±20 m podél ulice), převzorkovaný do mřížky řezu.
- **Doladění:** posun ±3 m, při kterém leží nejvíc skoku jasu na obrubách vozovek MTVU; každý metr posunu stojí
  5 % skóre.
- **Čáry:** v každém sloupci podíl řádků, kde je bod jasnější než okolí ±0,75 m o 14 % (aspoň o 10), a to aspoň
  ve 3 z 8 úseků po 5 m. Úzké vrcholy (do 0,6 m v půlce výšky) jsou čáry.
- **Pás u obruby a výplň:** v každém metru podél ulice podíl bodů na hranách (změna jasu o 18 %) nebo rozptyl
  jasu. Zelené body jsou zakryté stromem a nepočítají se. Řada aut je, když auta vycházejí aspoň ve třetině metrů.
  Šrafy jsou světlá plocha bez řady aut a asfalt je pás bez hran.

## Druhé kolo: čáry proti ruční kontrole (`cary.mjs`, 11. 11. 2026)

Bez kontroly okem se nedalo poznat, který detektor má pravdu. Čáry jsem proto odečetla okem na 22 vozovkách
se dvěma a více pruhy (Praha 15 na IPR 10 cm, 46 čar; Brno 7 na městském ortofotu, 18 čar; křižovatky
a vozovky, kde profil neleží na skutečné vozovce, vynechané). Štítky jsou v `labels/<město>.json`, obrázky ke
kontrole vytvoří `cary.mjs --label`. Pozor: štítky vznikly na nejjemnějším ortofotu a z jeho kandidátů, takže
toto ortofoto je ve srovnání mírně zvýhodněné. Vzorek je malý, čísla berte jako orientační.

Zkoušené způsoby:
- **m1**: detektor z prvního kola (směr ulice podle OSM);
- **m2**: totéž, ale každá čára hledaná i pootočená (±3°) a v oblouku (poloměr od 50 m; Bára: řezy v zatáčce);
- **m4**: jeden společný směr a oblouk pro celou vozovku (čáry jedné vozovky jsou rovnoběžné);
- **m3**: čára platí, jen když ji vidí dvě ortofota (IPR 10 cm a ČÚZK 12,5 cm).

| Praha, 46 čar | nalezeno (recall) | správných z nalezených (precision) |
|---|---|---|
| ČÚZK 25 cm m1 / m4 | 54 % / 59 % | 66 % / 63 % |
| ČÚZK 12,5 cm m1 / m4 | 72 % / 78 % | 69 % / 69 % |
| IPR 10 cm m1 / m4 | 87 % / 89 % | 71 % / 73 % |
| IPR 5 cm (jaro, stíny) m1 / m4 | 67 % / 70 % | 61 % / 60 % |
| m2 (každá čára zvlášť natočená), IPR 10 cm | 96 % | 43 % |
| m3 (IPR 10 + ČÚZK 12,5 cm) | 85 % | 54 % |

Brno (18 čar): městské ortofoto m4 100 % / 62 %, ČÚZK 12,5 cm 67 % / 48 %, ČÚZK 25 cm 78 % / 56 %.

Co z toho plyne:
1. **Falešné čáry jsou skoro všechny u obruby** (obrubníky, vodicí čáry). Pro šířky pruhů rozhodují
   **dělicí čáry uvnitř vozovky** (aspoň 0,7 m od obruby): ty IPR 10 cm najde v 97 % (precision 84 %),
   ČÚZK 12,5 cm v 84 % (73 %), ČÚZK 25 cm v 63 % (67 %); v Brně městské ortofoto 100 % (68 %), ČÚZK 12,5 cm 62 %.
2. **Natáčení každé čáry zvlášť škodí** (hodně falešných). Jeden směr a oblouk pro celou vozovku (m4) pomůže
   málo, ale nic nezkazí; oblouky pomáhají hlavně v zatáčkách (Karlovarská).
3. **Spojení dvou ortofot nepomohlo**: shoda dvou snímků vyřadí i pravé čáry.
4. **Ortofota mezi sebou sedí**: ČÚZK proti IPR je u 11 z 15 vozovek posunuté jen o 0–0,2 m (Brno: městské
   ortofoto proti ČÚZK o 2,2 m). Velké a nestálé posuny z prvního kola jsou chyba napojení profilu na MTVU
   (doladění podle obrub), ne snímků.
5. **Aplikace proti ortofotu:** když profil posunu jako celek tak, aby co nejlépe seděl, rozdělí aplikace
   vozovku správně (do 0,3 m) u 24 z 32 dělicích čar v Praze a 11 z 13 v Brně; ortofoto IPR 10 cm u 31 z 32,
   ČÚZK 12,5 cm u 27 z 32, brněnské u 13 z 13. Počet pruhů podle čar sedí u 8–10 z 15 pražských vozovek, aplikace
   u 6 z 15. Zlepšení tedy je, ale hlavně tam, kde aplikace špatně odhadne počet pruhů nebo krajnici.

Další krok: napojení profilu na snímek (bez něj nejde ortofoto do profilu promítnout) a větší ověřovací vzorek
s měřením šířek, ne jen poloh čar.
