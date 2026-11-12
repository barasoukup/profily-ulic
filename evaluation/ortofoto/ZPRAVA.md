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

6. **Pruhy vybrané dohromady (m5)**, podle rešerše (`LITERATURA.md`, Máttyus a kol. 2016): z nalezených čar
   se vybere taková sada, aby mezery vypadaly jako pruhy (2,5–4,75 m, u okraje do 7,5 m na krajnici nebo
   stání; mezera přes dva pruhy, kde čára chybí, s malou srážkou), dynamickým programováním. Dělicí čáry:

   | uvnitř vozovky | m4 recall / precision | m5 recall / precision |
   |---|---|---|
   | Praha IPR 10 cm | 97 % / 84 % | 94 % / 91 % |
   | Praha ČÚZK 12,5 cm | 84 % / 73 % | 81 % / 79 % |
   | Praha ČÚZK 25 cm | 63 % / 67 % | 59 % / 73 % |
   | Praha IPR 5 cm | 75 % / 71 % | 66 % / 72 % |
   | Brno městské | 100 % / 68 % | 92 % / 80 % |
   | Brno ČÚZK 12,5 cm | 62 % / 47 % | 54 % / 64 % |

   Falešných čar ubude víc než pravých, pro šířky pruhů je to lepší volba.

Další krok: napojení profilu na snímek (bez něj nejde ortofoto do profilu promítnout) a větší ověřovací vzorek
s měřením šířek, ne jen poloh čar.

## Auta u obruby: hotový model (`dl/`, 11. 11. 2026)

Předtrénovaný detektor vozidel z leteckých snímků (Ultralytics YOLO11-OBB, trénovaný na DOTA) na našich
výřezech, proti kontrole okem: 22 řezů, 223 pásů u obruby, z toho 95 s auty (`dl/truth.json`). Skripty
`dl/strip.py`, `dl/detect.py`, `dl/review.py`, `dl/eval.py`; Python ve vlastním venv mimo repozitář,
výsledky v `data/<město>/dl/` (git je ignoruje).

| metoda | správně z nalezených | nalezeno z aut |
|---|---|---|
| ruční detektor (`run.mjs`) | 56 % | 64 % |
| YOLO11n-OBB, auto zasahuje do pásu | 79 % | 84 % |
| YOLO11n-OBB, aspoň 2 auta | 92 % | 69 % |
| YOLO11x-OBB, aspoň 2 auta | 94 % | 76 % |

Na ČÚZK 12,5 cm vychází model skoro stejně jako na IPR 10 cm. Nejmenší model má po převodu na ONNX INT8 asi
3 MB.

**Rozhodnutí (Bára 11. 11. 2026): do aplikace ne.** 3 MB nechceme posílat uživatelům a licence nesedí (váhy
AGPL-3.0, data DOTA jen pro akademické použití). Strana stání zůstává podle zákona jako odhad. Kdyby se
k autům někdy vracelo: spočítat je jednou při nasazení a ukládat jen výsledek, s vyjasněnou licencí dat.

## Třetí kolo: nezávislá kontrola v pěti městech (11. 11. 2026)

Bára: větší vzorek, víc nezávislých testů, víc míst; napojení profilu na snímek musí jít.

**Data.** Praha, Brno, Plzeň, Hradec Králové a Ostrava (vzorky 50–100 řezů každého města, profily z `ab.mjs`).
Ortofota ČÚZK 25 a 12,5 cm všude, k tomu IPR 10 a 5 cm (Praha), městské ortofoto Brna 2025 a Plzně 2024
(5 cm, bez listí; staženo po 10 cm).

**Nezávislá kontrola.** Obrázky jednotlivých vozovek bez čehokoli od programu, jen s měřítkem (`oznac.mjs`,
návod `OZNACOVANI.md`). Označili je tři pomocníci (A: Praha, Brno; B: Hradec, Ostrava; C: Plzeň a 14 obrázků
z Prahy a Brna podruhé), každý bez přístupu k výsledkům a k ostatním značkám: okraje vozovky a podélné čáry
v pixelech, se zvětšovátkem. Celkem 104 vozovek, z toho 56 posouditelných (ostatní stín, stromy, křižovatka).
**Shoda dvou značkovatelů** na společných obrázcích: čáry se shodují všechny, rozdíl 0–1 px (do 5 cm); okraje
vozovky 2–8 px (0,1–0,4 m), protože u obruby bývá světlý pruh (odvodňovací proužek, obrubník, vodicí čára) a
není jasné, kde vozovka končí. Čáry jsou tedy spolehlivá kontrola, okraje jen na ±0,3 m.

**Pasport Hradce** (`vdz.mjs`, `vdz-eval.mjs`; vrstva `pk-dzv-l`, přes 20 000 čar, s datem obnovy): pokrývá jen
komunikace města, malé ohraničení dotazu vrací prázdno (dotazovat ±80 m). Proti značkám B: z čar viditelných na
ortofotu je v pasportu 71 %, z čar pasportu je na ortofotu vidět 60 %, kde sedí, tak do 0,1 m. Jako kontrola
proto slouží jen orientačně (Bára: nevěřit mu zcela): ortofoto najde 20–30 % jeho čar a 35–50 % nalezených v
něm je; na obrázcích jsou vidět ulice s čarami, které pasport nemá (Brněnská), i posunuté čáry.

### 1. Napojení profilu na snímek

Skutečný posun mapy (MTVU, mapy měst, DTM ČÚZK) proti ortofotu podle označených okrajů vozovky:

| město, ortofoto | medián \|posun\| | do 0,3 m |
|---|---|---|
| Praha, IPR 10 cm | 0,20 m | 15 z 22 |
| Hradec, ČÚZK 12,5 cm | 0,10 m | 12 z 16 |
| Ostrava, ČÚZK 12,5 cm | 0,25 m | 13 z 18 |
| Plzeň, městské 2024 | 0,50 m | 5 z 16 |
| Brno, městské 2025 | 2,0–2,6 m | 0 z 14 |

To je na úrovni přesnosti značek samotných (okraje ±0,3 m) a odpovídá střední chybě Ortofota ČR 0,18 m
(LITERATURA.md). **Mapa a ortofoto ČÚZK (i IPR) k sobě sedí bez doladění.** Doladění podle hran (r0, r1, r2;
`napojeni.mjs`) to nezlepší: v Praze, Hradci a Ostravě bylo „bez posunu“ stejně dobré nebo lepší (63–75 % do
0,3 m proti 44–73 %). Doladění se vyplatí jen pro ortofota s jinou transformací souřadnic (Brno 2025 asi 2–2,6 m,
Plzeň asi 0,5 m), kde r2 při jistém výsledku sedí v 80–86 %; jednodušší je tam vzít ČÚZK nebo posun změřit
jednou pro celé ortofoto. Vnitřní testy to potvrzují: kde r1 vyjde jistě, shodnou se dvě nezávislá ortofota
(IPR × ČÚZK) do 0,4 m ve 20 z 20 a 21 z 22 řezů a medián posunu mapy proti ČÚZK je ve všech pěti městech 0–0,1 m.

Velké posuny z prvního kola tedy nebyly chybou dat: (1) profil drží celkovou šířku, ale tramvajová tělesa a
pruhy dostanou normové šířky, takže se části posunou proti skutečné obrubě o 1–2 m (řeší položení profilu na
vozovky mapy, `layout`), (2) doladění podle obrub bylo nespolehlivé, (3) brněnské městské ortofoto je posunuté.

### 2. Čáry a pruhy proti nezávislé kontrole

Hranice pruhů (podélné čáry uvnitř vozovky, aspoň 0,7 m od okraje) do 0,3 m od označené čáry:

| město | aplikace dnes | ortofoto (nejjemnější) | ortofoto ČÚZK 12,5 cm |
|---|---|---|---|
| Praha | 23 % | 90 % (IPR 10 cm) | 53 % |
| Brno | 13 % | 67 % (městské, posunuté) | 53 % |
| Plzeň | 30 % | 70 % (městské) | 80 % |
| Hradec | 24 % | – | 71 % |
| Ostrava | 25 % | – | 70 % |

„Aplikace dnes“ je profil položený na mapu s odhadnutým posunem; i s posunem odečteným ze značek je to jen
0–50 %. Aplikace navíc kreslí hranice, které na vozovce namalované nejsou (stání, krajnice), v tabulce je
nepočítám jako chybu. **Ortofoto určí polohu pruhů zhruba třikrát lépe.** Počet pruhů je ale vyrovnanější:
správně ho má aplikace u 36–73 % vozovek, ortofoto u 45–89 %; v Ostravě je aplikace lepší (73 % proti 45 %),
protože ortofoto vynechá vybledlou nebo zakrytou čáru. Kombinace: „aplikace + ortofoto“ (čáry z ortofota, kde
našlo řadu pruhů, jinak aplikace) drží polohy ortofota; „aplikace přichycená“ (počet z aplikace, hranice
posunuté k čáře do 1,2 m) zachová počet aplikace a polohy zlepší jen částečně (40–70 %).

Nalezené čáry (recall / precision, m5): Praha IPR 10 cm 76 % / 89 %; Ostrava ČÚZK 12,5 cm 72 % / 92 %, 25 cm 78 %
/ 96 %; Hradec ČÚZK 12,5 cm 65 % / 83 %; Plzeň ČÚZK 12,5 cm 82 % / 82 %; Brno městské 60 % / 55 %. Stín je
hlavní příčina vynechaných čar (jarní IPR 5 cm v Praze jen 45 %).

### Co z toho plyne pro aplikaci

1. **Napojení je vyřešené:** ortofoto ČÚZK (a IPR) brát tak, jak je, bez doladění; čáry promítat na vozovky mapy
   (profil položený na skutečné okraje). Městská ortofota s jinou transformací nepoužívat, nebo jim jednou změřit
   posun.
2. **Pruhy:** polohy hranic z ortofota (m5), počet pruhů z ortofota jen tam, kde najde celou řadu čar a souhlasí
   se šířkou vozovky; jinak počet z aplikace a hranice přichytit. Zdroj „ortofoto“, při nejistotě pravidla.
3. **Stín** zůstává hlavní slabinou (46 % obrázků se nedalo posoudit ani okem); ortofoto ČÚZK je letní, s kratšími
   stíny, a pro celou ČR dává 53–80 %.
4. Vzorek je pořád malý (56 posouditelných vozovek se 127 čarami, 14 z nich označených dvakrát); čísla po městech berte orientačně.

## Čtvrté kolo: krajnice a šrafy (11. 11. 2026)

Bára: „A co ty krajnice a šrafy?“ Ve třetím kole bylo na 56 posouditelných vozovkách šrafování jen jednou, proto
vlastní vzorky: (1) vozovky, kde aplikace odhaduje krajnici, a kde run.mjs hlásí šrafy, v pěti městech
(pomocníci D a E, 75 obrázků); (2) Hradec, řezy na šrafovaných plochách z pasportu (vrstva `pk-dzv-p`, druh 500,
272 ploch; `ab.mjs` s `KEEP=1`, aby řez zůstal u křižovatky; pomocník F, 46 obrázků). Značili stejně jako ve
třetím kole, se zvláštním důrazem na šrafy, stání a vodicí čáry. Vyhodnocení `krajnice.mjs`.

**Krajnice odhadem (106 v šesti vzorcích):** skutečně je v 97 prázdný asfalt (92 %), v 5 šrafy, ve 4 stojí auta.
Detektor povrchu pásu z prvního kola (řada aut, světlé body, hrany) určí asfalt správně jen v 52 z 97 (54 %),
jinak hlásí „šrafy“ (21×) nebo „auta“ (19×): je horší, než krajnici prostě nechat. **Vodicí čára** na hranici
pruhu a krajnice: skutečně u 19 krajnic, ortofoto ji najde u 15 (79 %) a falešně jen jednou. Krajnice se tedy
dá potvrdit (a změřit) čarou, ne povrchem.

**Šrafy.** Dva detektory: plošina světlých sloupců (`hatchRuns`) a malá okna 0,8 × 3 m se šikmými střídavými
pruhy (`hatchRuns2`; stripes, které se od sloupce ke sloupci posouvají, ne čára, obrubník ani auto):

| | vozovek se šrafami | nalezeno | vozovek bez šraf | falešně |
|---|---|---|---|---|
| plošina | 26 | 13 (50 %) | 119 | 18 (15 %) |
| okna | 26 | 18 (69 %) | 119 | 32 (27 %) |

Šrafy jsou vzácné (na náhodných řezech asi jedna vozovka z dvaceti), takže by i 15 % falešných nálezů znamenalo,
že většina hlášených šraf by byla falešná (správných z hlášených 36–42 %). **Šrafy z ortofota proto do profilu
automaticky nedávat.** Hlavní potíže: obrubníky a odvodňovací proužky se stínem, přechody, šipky, bílá auta;
šrafy u křižovatek jsou krátké (trojúhelník pár metrů).

**Pasport Hradce proti značkám (F):** šrafy vidí obojí u 23 obrázků, jen pasport u 16 (vybledlé, mimo výřez
±15 m, nebo v pasportu přebývají), jen značkovatel u žádného. Kde pasport je, je pro šrafy lepší než ortofoto.

**Pro aplikaci:** krajnici dál odhadovat pravidly, ortofotem jen potvrdit vodicí čárou a zpřesnit její šířku
(stejný krok jako pruhy). Povrch krajnice z ortofota neurčovat. Šrafy jen z dat města (pasport), kde jsou.

## Prototyp v aplikaci proti značkám (12. 11. 2026)

`proto-eval.mjs`: 117 vozovek označených okem (kvalita „ok“, obě obruby), profil podle pravidel proti profilu po
`applyLanes()` na ortofotu, které bere aplikace (Praha IPR 10 cm, Brno 2025 s posunem, Plzeň 2024, jinde ČÚZK 12,5 cm).
Hranice uvnitř vozovky (≥ 0,7 m od obrub) proti označeným čarám, obojí posunuté o skutečný posun mapy proti snímku.

| | čáry do 0,3 m: pravidla | ortofoto | počet pruhů správně: pravidla | ortofoto |
|---|---|---|---|---|
| Praha (30) | 32 % | 51 % | 50 % | 53 % |
| Brno (24) | 21 % | 27 % | 42 % | 58 % |
| Plzeň (14) | 43 % | 57 % | 71 % | 57 % |
| Hradec (24) | 19 % | 23 % | 50 % | 38 % |
| Ostrava (25) | 20 % | 44 % | 56 % | 52 % |
| celkem (117) | 25 % | 40 % | 52 % | 51 % |

Ortofoto lépe u 33 vozovek, hůře u 11, stejně u 73 (většinou je nezmění). Hranic navíc 190 → 157. Počet pruhů se
nezlepšil: hůř hlavně tam, kde ortofoto najde čáru u obruby (úzká krajnice) nebo pruh navíc (Hradec, Plzeň).

Oprava: `layout()` v `run.mjs` kladl části profilu v pořadí obrazovky od `extent[0]`, tedy zrcadlově (části jsou
od `extent[1]` dolů). Starší čísla „aplikace“ v kolech 2–4 se tak počítala se zrcadlovým profilem; tady už správně.

Změny mimo ortofoto, porovnání 100 řezů na město (`VARIANTS=city,stejne2`) se staršími profily: Praha 2 jinak
(Hlávkův most a Wilsonova končí za krajním chodníkem, šipky `slight_right` jako vpravo), Brno 1 (šipka), Ostrava 1
(most bez 0,35 m za chodníkem), Hradec 6 (posuny o 5 cm, ne z těchto změn), Plzeň 9 (vrstva 348 „stavba pro
zpevnění povrchu“ už není zeď: úzké pásy na kraji profilu jsou zpevněná plocha, u č. 48 profil o 5,7 m delší).
První verze pravidla pro mosty uřízla v Brně (č. 4) druhou polovinu mostu za dlážděným středem; opraveno (za chodníkem
končí jen tam, kde nenásleduje vozovka).

Po úpravě (na ČÚZK krajnice z čáry jen u obou obrub zároveň): celkem čáry 40 %, počet pruhů 53 % (pravidla 52 %),
Hradec počet pruhů 38 → 46 %; ortofoto lépe u 33 vozovek, hůře u 10.

Na příště: značení proti nevyježděným pásům uprostřed pruhů (řez 324, Hradec): na ČÚZK mají pásy (+22 až +27) a
přerušovaná středová čára (+35) skoro stejný jas i šířku (0,6–0,7 m); rozliší je spíš geometrie (pás uprostřed mezi
stopami kol) a vlastnosti naučené z doznačených příkladů.
