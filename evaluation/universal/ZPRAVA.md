# Univerzální metoda hodnocení profilů: kalibrace v Praze (17. 11. 2026)

**Cíl (Bára):** jedna metoda, která hodnotí přesnost profilu všude stejně (CZ, SK, AT, DE); nejdřív složení, pak šířka ulice.

**Metoda:** posuzovatel (AI, Sonnet) dostane u řezu ortofoto státu (`ortho.mjs`: řez vodorovně, ulice nahoru, A vlevo,
10 px = 1 m, měřítko) a fotky z Mapillary, kde jsou (`prepare.mjs`), a podle `POKYN.md` sám sestaví profil A→B.
Profil aplikace nevidí. Srovnání `compare.mjs`: složení uličního prostoru (od vnějšího okraje chodníku po vnější okraj
chodníku, zeleň mezi pruhy = dělicí pás, sousední stejné části sloučené, krajnice se nepočítá) editační vzdáleností,
počet pruhů, šířka uličního prostoru. Kalibrace proti profilu aplikace z IPR MTVU (`score-calib.mjs`).

## Výsledky

| kolo | řezů | srovnání | složení stejné | shoda složení | pruhy stejně | šířka do 1 / 2 m |
|---|---|---|---|---|---|---|
| 1: výpadovky a dálnice, posuzovatel fotky neotevřel (jen ortofoto) | 37 | AI ↔ MTVU | 30 % | 68 % | 38 % | 30 / 41 % |
| | | odhad ↔ MTVU | 32 % | 76 % | 70 % | 24 / 38 % |
| 2a: běžné ulice **s fotkou** | 18 | AI ↔ MTVU | 33 % | **71 %** | 56 % | 44 / 44 % |
| | | odhad ↔ MTVU | 11 % | 59 % | 67 % | 17 / 33 % |
| 2b: běžné ulice **bez fotky** (jen ortofoto) | 19 | AI ↔ MTVU | 11 % | **28 %** | 16 % | 42 / 53 % |
| | | odhad ↔ MTVU | 37 % | 68 % | 42 % | 21 / 42 % |

| 3: tytéž ulice jako 2b, **s panoramaty Mapy.com** (`prepare.mjs`, vlastní klíč, obrázky po posouzení smazané `clean.mjs`) | 17 | AI ↔ MTVU | 65 % | **82 %** | 65 % | 41 / 71 % |
| | | odhad ↔ MTVU | 35 % | 66 % | 41 % | 18 / 41 % |
| (pro srovnání tytéž řezy jen z ortofota) | 17 | AI ↔ MTVU | 12 % | 29 % | 18 % | 35 / 47 % |

**Závěry:**
- **Panorama Mapy.com udělá z nepoužitelného hodnocení nejlepší** (29 % → 82 % shoda složení). V Česku má panorama
  skoro každá ulice, takže tam metoda pokryje i vedlejší ulice; mimo Česko zůstává Mapillary (jen ulice s fotkou).
- **S fotkou z ulice** pozná AI složení lépe než náš odhad (71 % proti 59 %) a šířku uličního prostoru do 1 m dvakrát
  častěji (44 % proti 17 %). Tam je použitelná jako rozhodčí.
- **Jen z ortofota** je v běžných ulicích nepoužitelná (28 %): pod stromy a stíny nevidí chodníky ani stání
  (chybí chodník 14×, stání 7×). Na výpadovkách bez stromů je zhruba na úrovni odhadu.
- Fotky z Mapillary má jen asi polovina pražských řezů (hlavně hlavní ulice), takže univerzální metoda s fotkami
  hodnotí jen ulice s fotkami; vzorek tím bude vychýlený k hlavním ulicím, všude stejně.
- Vzorky jsou malé (18 a 19 řezů), čísla jsou orientační.
- Cena: kolo 1 asi 160 tisíc tokenů, kolo 2 asi 280 tisíc (Sonnet).


## Měření ve čtyřech státech (17. 11. 2026)

Vzorek `sample.mjs`: 10 měst na stát (velká i menší), 8 náhodných bodů do 1,5 km od centra; profil aplikace v bodě
(`collect.js` v prohlížeči, server s `EVAL_SAVE=1`), do hodnocení nejvýš 4 řezy na město, které mají fotku z ulice
(`select.mjs`: Mapillary všude, v Česku navíc panorama Mapy.com), jen řezy s vozovkou. Posuzovatel (Sonnet) podle
`POKYN.md`, skóre `score-states.mjs` (`vysledky/staty.md`): profil aplikace proti profilu posuzovatele.

| stát | řezů | složení stejné | shoda složení | pruhy stejně | šířka uličního prostoru do 1 / 2 m | nejčastější rozdíly (aplikace proti posuzovateli) |
|---|---|---|---|---|---|---|
| CZ | 32 | 25 % | 56 % | 28 % | 25 / 31 % | navíc chodník 9×, chybí zeleň 7×, chybí chodník 6×, navíc pruh 5× |
| SK | 15 | 27 % | 60 % | 60 % | 27 / 53 % | navíc chodník 7×, chybí pruh 4× |
| AT | 33 | 18 % | 57 % | 30 % | 15 / 27 % | **chybí stání 14×**, chybí zeleň 5×, chybí chodník 5× |
| DE | 34 | 12 % | 58 % | 50 % | 15 / 35 % | **chybí stání 15×**, navíc chodník 10×, navíc pruh 6× |

**Jak to číst:** posuzovatel sám sedí s MTVU v 71–82 % složení (kalibrace), takže shoda aplikace s ním (56–60 %) je
dolní odhad; skutečná přesnost složení bude o něco vyšší. Hlavní zjištění:
- **Všechny čtyři státy jsou na tom zhruba stejně** (shoda složení 56–60 %); žádný stát výrazně nezaostává.
- **V Rakousku a Německu chybí stání** (14× a 15× z 33–34 řezů): aplikace tam stání podle zákona neodhaduje
  (`noParkGuess`) a z OSM ho má jen tam, kde je zakreslené. Největší a nejjasnější prostor ke zlepšení.
- **V Česku a na Slovensku „navíc chodník“**: aplikace rozdělí chodník stromořadím nebo zelení na víc kusů, posuzovatel
  je bere jako jeden chodník; zčásti rozdíl zápisu, ne chyba.
- **Šířka uličního prostoru** sedí do 2 m jen u 27–53 % řezů: měřítko z ortofota posuzovatel odhaduje hrubě a okraje
  uličního prostoru (předzahrádky, zeleň) se určují různě; spíš orientační.
- **Chyba v aplikaci nalezená při měření:** basemap.at má úroveň z20 jen ve Vídni, Grazu a Linci, jinde v Rakousku
  odhad neměl ortofoto vůbec. Opraveno (z19), rakouské profily nasbírané znovu.
- Pokrytí fotkami: Slovensko jen 15 řezů (Mapillary řídký), ostatní 32–34.
- Cena měření: asi 1,5 mil. tokenů (7 posuzovatelů Sonnet), kalibrace asi 0,7 mil.

**Nový stát:** do `sample.mjs` přidat 10 měst, ortofoto státu do `ortho.mjs`, sběr, `select.mjs`, posuzovatelé,
`score-states.mjs`. Kde Mapillary nemá fotky, metoda nehodnotí (bez fotky je posuzovatel nepoužitelný).


## Stání v Rakousku a Německu (17. 11. 2026)

Měření ukázalo, že v AT a DE stání nejčastěji chybí (14× a 15×). Dvě příčiny a opravy:
1. **Stání zakreslené v OSM se ztrácelo**, když odhadnutá vozovka byla o pár centimetrů užší (Großer Brockhaus,
   Lipsko: `parking:left=street_side`, vozovka 4,4 m, chybělo 0,1 m). Teď se zakreslené stání zúží na to, co zbývá,
   nejvýš na 85 % své šířky (`derive.js OSM_PARK_MIN`). Regrese Prahy a Brna beze změny.
2. **Zákonný odhad stání** byl v AT a DE vypnutý; teď platí jako v Česku (místní ulice, `residential`, `unclassified`):
   Rakousko StVO § 24 odst. 3 (dva volné pruhy po asi 2,6 m, v jednosměrce jeden), Německo StVO § 12 a judikatura
   (3,05 m na projetí). `?odhadstani=0` ho vypne. Zkoušené i sběrné ulice (`tertiary`): beze změny, vráceno.

Tytéž posudky, nový profil aplikace (`data/app-zz-stani.json`):

| stát | shoda složení | pruhy stejně | chybí stání | navíc stání |
|---|---|---|---|---|
| AT před → po | 57 → 58 % | 30 → 30 % | 14 → 11 | 3 → 5 |
| DE před → po | 58 → 61 % | 50 → 56 % | 15 → 8 | – |

Zbylá chybějící stání v Rakousku: odhad vozovku podhodnotí (Franz-Fischer-Straße 3 m proti asi 12 m, Eferdinger
Straße 7 m proti 12 m), stání podle zákona se pak nevejde. Další krok je šířka vozovky v odhadu, ne pravidlo stání.
Data o parkování velkých měst: Vídeň (FMZK), Berlín, Hamburk a Cáchy stání mají v mapách povrchů už zapojených;
zóny placeného stání by nepomohly, chybí šířka vozovky, ne informace, že se tam parkuje.

## Nizozemsko (20. 11. 2026)

Vzorek 10 měst (Amsterdam, Rotterdam, Haag, Utrecht, Haarlem, Leiden, Delft, Amstelveen, Schiedam, Diemen; jen města
lokálního balíku OSM), 80 bodů, 38 řezů s fotkou Mapillary, 32 s vozovkou. Ortofoto PDOK (`ortho.mjs`, JPEG převedený
na PNG). Mapa povrchů BGT u 62 z 80 bodů. Výsledek s výchozím nastavením (`data/app-nlpo.json`):

| NL | 32 řezů | složení stejné 16 % | **shoda složení 52 %** | pruhy stejně 53 % | šířka do 1 / 2 m 31 % / 41 % |

- Shoda složení o něco nižší než ostatní státy (56–69 %), šířka uličního prostoru nejlepší (do 2 m 41 %, ostatní 28–53 %).
- Nejčastější rozdíly: aplikace má navíc chodník (21×, rozdělený stromořadím nebo cyklostezkou), zeleň (14×) a cyklostezku
  (13×). BGT kreslí jako „fietspad“ i červené cyklopruhy na vozovce. Zkusila jsem je u ulic s OSM `cycleway=lane` brát
  jako vozovku (`?fietsstrook=1`): složení 53 → 52 %, šířka 47 → 41 %, tedy ne lépe; zůstává vypnuté.
- Mezi dvěma sběry týchž řezů se čísla liší o pár procent (ortofoto pruhů, parkovací místa Amsterdamu, která jsou teď
  vypnutá); první sběr dal 53 % a 47 %.

## Belgie a Lucembursko (20. 11. 2026)

Vzorek po 10 městech (Belgie: Brusel, Antverpy, Gent, Lutych, Bruggy, Lovaň, Namur, Charleroi, Mons, Mechelen;
Lucembursko: Lucemburk, Esch, Differdange, Dudelange, Ettelbruck, Diekirch, Wiltz, Echternach, Remich, Grevenmacher),
160 bodů, s fotkou Mapillary 38 + 17 řezů, s vozovkou 34 + 12. Ortofoto Flander nebo Valonska, Lucembursko ACT.

| BE | 34 | složení stejné 9 % | **shoda 52 %** | pruhy 38 % | šířka do 1 / 2 m 15 % / 26 % |
| LU | 12 | složení stejné 17 % | **shoda 53 %** | pruhy 50 % | šířka do 1 / 2 m 25 % / 33 % |

- Belgie: nejčastěji chybí stání (12×). V úzkých ulicích Bruselu a Antverp kreslí odhad jeden široký pruh (Rue aux Choux
  10,4 m, Rue du Vautour 6,6 m, Koninginnestraat 5,4 m) a zákonné stání do něj nedá: totéž jako dřív v Rakousku a Německu
  (vozovka a strany v odhadu, ne pravidlo stání). Na příště: proč odhad u jednosměrek s jedním pruhem stání nepřidá.
- Lucembursko: malý vzorek (12), posuzovatel u Remiche neměl ortofoto (bílé), šest řezů jsou cesty a parky.

## Polsko (21. 11. 2026)

Vzorek 10 měst (Varšava, Krakov, Vratislav, Gdaňsk, Poznaň, Lodž, Katovice, Lublin, Štětín, Bydhošť), 80 bodů, 29 řezů
s fotkou Mapillary, 22 s vozovkou (2 z nich s mapou povrchů Krakova). Ortofoto GUGiK.

| PL | 22 | složení stejné 18 % | **shoda 67 %** | pruhy 45 % | šířka do 1 / 2 m 18 % / 32 % |

- Shoda složení nejvyšší ze všech států (ostatní 52–69 %, LI 69 % na 6 řezech), šířka podprůměrná. Nejčastěji chybí
  chodník (6×) a pruh (4×); stání chybí jen 3× a 3× je navíc (zákonný odhad jako v Lucembursku).
- Malý vzorek: 7 z 29 řezů jsou dvory, střechy, most a nábřeží.

## Itálie (23. 11. 2026)

Jen oblasti s otevřeným ortofotem, 6 řezů s fotkou a vozovkou (Turín 3, Bolzano 2, Bologna 1;
`vysledky/u-it-1.jsonl`, `node evaluation/universal/score-states.mjs`).

| IT | 6 | složení stejné 17 % | **shoda 56 %** | pruhy 50 % | šířka do 1 / 2 m 17 % / 33 % |

- **Malý vzorek** (6 řezů ze 3 měst): čísla jsou jen orientační, k rozšíření. Nejčastěji chybí stání (4×) a chodník (2×),
  dělicí pás navíc 2×.

## Slovinsko (23. 11. 2026)

Vzorek 6 měst (Lublaň, Maribor, Celje, Koper, Kranj, Novo mesto; `sample.mjs`, body přidané na konec `sample.json`, aby
ostatní státy své body nezměnily), 48 bodů, 39 profilů aplikace (`data/app-si.json`, prohlížeč na localhostu s balíkem
OSM), 10 řezů s fotkou Mapillary. Ortofoto GURS DOF025 (25 cm): u si-maribor-6 server opakovaně neodpověděl (504,
vypršení), řez se neposuzoval. Posuzovatel (Sonnet, profil aplikace neviděl) posoudil 9 řezů, všechny s vozovkou
(`vysledky/u-si-1.jsonl`). Slovinsko nemá mapu povrchů, všechny profily jsou odhad z OSM a ortofota.

| SI | 9 | složení stejné 11 % | **shoda 48 %** | pruhy 78 % | šířka do 1 / 2 m 11 % / 33 % |

- Pruhy sedí často (7 z 9), složení slabší než jinde (ostatní státy 51–69 %): nejčastěji chybí chodník (3×) a zeleň (2×),
  cyklostezka navíc 2× (Maribor, Ljubljanska ulica: úzké chodníky aplikace posuzovatel vidí jako běžné chodníky).
- Úplně chybí profil v Kopru u moře (si-koper-1: aplikace dala jen chodník 2 m, posuzovatel 8 částí přes 40 m) a
  si-kranj-3 (cyklostezky aplikace proti trávě a krajnicím posuzovatele, shoda 0).
- **Malý vzorek** (9 řezů, v Celji ani jedna fotka): čísla jsou jen orientační. Posuzovatel si nebyl jistý u Lublaně
  (širokého pásu chodník/cyklostezka), Kranje 3 a krajnice v Novém Mestě.


## Strany bez fasády a sjezdy: nové pravidlo, zatím jen Slovinsko (23.–24. 11. 2026)

**Proč:** kde posuzovatel na straně nenašel fasádu (`facadeA`/`facadeB` false), je „celá šířka“ libovolná: posuzovatel
přestane počítat trávu někde, aplikace u svého konce. Nově (`compare.mjs scope()`, přesně v `POKYN.md`): na takové
straně se **šířka** srovnává jen po okraj ulice samotné (vozovka s krajnicí, chodník nebo cyklostezka hned za ní, i
přes pás zeleně do 3 m) a **složení** taky; co je za okrajem, se nehodnotí, ani zeleň (Bára 24. 11. 2026: konec
u obruby je tam pro uživatele správně; první verze 23. 11. počítala zeleň za okrajem jako přítomnost, viz níže).
Strany s fasádou beze změny.

Příklad **si-kranj-2**: posuzovatel zeleň 5,5 | krajnice 1 | pruh | pruh | krajnice 1 | zeleň 5,8, aplikace pruh 3,7 |
pruh 5,7. Šířka se srovná 8,5 proti 9,4 m (do 1 m, dřív 6,5 proti 9,4), složení se shoduje.

**Sjezdy** (Bára 24. 11. 2026): bod, jehož řez padne na `highway=service` se `service=driveway`, `parking_aisle` nebo
`drive-through`, se vynechá (neposouvá se); obyčejná `service` zůstává. Ve Slovinsku 1 z 9 posouzených řezů
(si-ljubljana-7: posuzovatel viděl čtyřpruhovou silnici, řez aplikace ale padl na sjezd). Mezi všemi 39 profily jsou
sjezdy 4 a parkovací ulička 1, posouzený z nich jen tenhle. Doplnění Slovinska novými body neproběhlo.

| SI | řezů | složení stejné | shoda složení | pruhy stejně | šířka do 1 / 2 m |
|---|---|---|---|---|---|
| dřív (23. 11.) | 9 | 11 % | 48 % | 78 % | 11 % / 33 % |
| jen bez sjezdu | 8 | 13 % | 50 % | 88 % | 13 % / 38 % |
| jen nové pravidlo bez fasády | 9 | 0 % | 34 % | 78 % | 11 % / 44 % |
| zeleň za okrajem jako přítomnost, bez sjezdu (první verze) | 8 | 0 % | 36 % | 88 % | 13 % / 50 % |
| **nové: bez sjezdu, za okrajem nic (24. 11.)** | **8** | **13 %** | **58 %** | **88 %** | **13 % / 50 %** |

Ve Slovinsku má 8 z 9 řezů aspoň jednu stranu bez fasády a odhad tam končí u obruby. První verze to trestala jako
„chybí zeleň“ (9×); zelený pás za obrubou, který to měl v odhadu doplnit, Bára zamítla jako pro uživatele zbytečný
(`evaluation/ortofoto-osm/zelenpas/ZPRAVA.md`), a proto se zeleň za okrajem nově nehodnotí. Nejčastější rozdíly teď:
navíc cyklostezka 2×, chybí chodník 2×. Ostatní státy novým pravidlem přepočítané, ale **nepřijaté** (Bára:
nechce teď nová čísla): `vysledky/prepocet-2026-11-24.md`; jejich řádky výše platí dál.
