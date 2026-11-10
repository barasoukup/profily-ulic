# Pravidla 11/2026: stání podle zákona, tři druhy tramvaje, pruhy podle třídy TSK (10. 11. 2026)

Každá změna prošla testem A/B nad ortofotem (`evaluation/ab.mjs`). Protože jde o pravidla, ne o zdroje,
porovnává se kód před změnou a po ní: před každou změnou vznikla kopie `pilot/public` v `data/kod-0`,
`data/kod-1` a `data/kod-2` (git ji ignoruje). Varianty `variants/pred-zakon.mjs`, `po-zakon.mjs`,
`pred-tram.mjs`, `po-tram.mjs`, `pred-tsk.mjs` z ní berou `deriveProfile`, zdroje jsou stejné. Praha jen
z cache (`pilot/cache`), Jihlava a Ostrava s `CACHE=disk` přes `polite.mjs` (Ostrava 226 dotazů při prvním běhu,
pak 0). Verdikty jsou v `review.md` párů `evaluation/<město>/data/ab-*`.

## 1. Odhad stání podle zákona: připojeno

Podle § 25 odst. 3 zák. 361/2000 Sb. zůstane pro každý směr volný pruh 3 m. Obousměrka dostane stání od 8 m
na jedné straně a od 10 m na obou, jednosměrka od 5 m a od 7 m. Pruhy vedle stání mají aspoň 3 m, sdílený
pruh 2,5 m zmizel. U tramvaje zůstane 3,5 m od kolejnice (odst. 2). Chodník u obruby nerozhoduje.
Neodhaduje se jen u obruby ke střednímu pásu, k tramvajovému tělesu, k další vozovce nebo k zeleni do 15 m
před další vozovkou (doplněno po Ostravě č. 78). Kde se odhaduje, zůstává jako dřív.

| vzorek | liší se | lepší po (B) | lepší před (A) | žádná |
|---|---|---|---|---|
| Praha, 100 řezů | 7 | 4 | 2 | 1 |
| Jihlava, 89 | 11 | 7 | 3 | 1 |
| Ostrava, 99 | 14 | 9 | 4 | 1 |
| **celkem** | **32** | **20** | **9** | **3** |

- Většinou nový odhad zmizel z ulic 4,7–7 m, kde u řezu nikdo nestojí.
- **Problém:** v obousměrkách 5,4–7,5 m auta často opravdu stojí u jedné obruby, i když to zákon nedovoluje
  (Budčická, Jihlava č. 70 a 75, Ostrava Horymírova, Mařákova, Olbrachtova, Dářská). Takové profily teď
  stání nemají.
- **Problém:** bez podmínky chodníku se stání odhaduje i u široké průmyslové vozovky nebo silnice bez chodníku
  (Praha č. 52 U Technoplynu 16 m, Jihlava č. 60, Ostrava č. 51 13 m). Tam nikdo nestojí.
- Příklady z Česká Třebová: Smetanova (4,85 m) má jeden pruh bez stání, Jiráskova (7 m) dva pruhy po 3,5 m bez stání.

## 2. Tři druhy tramvaje: připojeno, výchozí povrch tělesa je otázka

Druhy jsou tramvaj v pruhu s auty (`tramvaj_v_pruhu`), tramvajový pruh ve vozovce (`tramvaj_pruh`, nový) a
tramvajové těleso (`tramvaj`, samostatné). Pruh ve vozovce vzniká, když se pruhy z OSM vejdou vedle kolejí,
nebo když koleje bez aut vedle leží v ulici s `embedded_rails`. Těleso vzniká z MTVU 705, z kolejí v zeleni
(tráva) a z kolejí ve vozovce bez aut vedle v ulici bez `embedded_rails`. Povrch se bere z `surface` trati v OSM,
jinak jsou to panely s příznakem odhadu. `psv`/`bus` na trati dává vlastnost „+ BUS“.

| vzorek | liší se | lepší po (B) | lepší před (A) |
|---|---|---|---|
| Praha, 100 řezů | 16 | 9 | 7 |
| Ostrava, 99 | 8 | 3 | 5 |

- **Druh:** změnil se v 10 řezech a v 9 sedí (Hlávkův most, nábř. E. Beneše, V Olšinách, Libeňský most,
  nábř. Kap. Jaroše, Bělohorská č. 49, Havlíčkova, Patočkova + BUS). Chyba je Švehlova (č. 32). Tam je
  štěrkové těleso, ale OSM má `embedded_rails` a MTVU vozovku, takže vyjde pruh ve vozovce.
- **Povrch:** všechny prohry jsou kvůli výchozím panelům. Z 16 posouzených těles bylo 5 z panelů, 9 ze štěrku
  (Poděbradská, Plzeňská, Olšanská, Generála Šišky, Ostrava Plzeňská, 28. října, Martinovská…) a 2 travnatá
  (Kolbenova, Ostrava Výškovická). OSM ani MTVU povrch tělesa nemá: na tramvajových tratích chybí `surface=grass`
  a výřez OSM nemá `landuse`. **Návrh pro Báru:** výchozí štěrk pro široké těleso mezi dvěma vozovkami a panely
  jen tam, kde jezdí autobusy nebo je těleso v ulici s jednou vozovkou.
- Kontrola v prohlížeči: Národní a Spálená mají tramvajový pruh, Vinohradská (u Želivského) tramvaj v pruhu,
  Plzeňská (č. 33) a Patočkova (+ BUS na jedné koleji) těleso.

## 3. Pruhy podle třídy TSK (Praha): připojeno

Třída úseku TSK dostane skupinu ČSN 73 6110. Podle zák. 13/1997 Sb. je MK I rychlostní nebo sběrná, TSK to
nerozlišuje, proto MK I a II spadají do skupiny B a jen dálnice do A. Varování v Návrhu pro jízdní pruh:
dálnice červeně pod 3 m, oranžově pod 3,5 m. MK I, MK II a silnice I. a II. třídy červeně pod 3 m. MK III
červeně pod 2,75 m, oranžově pod 3 m. MK IV červeně pod 2,5 m, oranžově pod 2,75 m. Bez třídy zůstává
2,5 / 3 m. Strop pruhu je teď v MK I a na dálnicích 3,75 m.

- Strop 3,75 m v MK I (Praha, 100 řezů): liší se 10, lepší B 6 (značené pruhy kolem 3,5 m: Kukulova,
  Strakonická, Čuprova, Ústecká, Generála Šišky), A 1 (Strakonická č. 11: dva pruhy po 4,3 m), obě 3.
- Strop 4 m v MK II a 4,5 m v MK IV (zkoušeno, nepřipojeno): z 6 řezů (č. 83 a cílený vzorek `samples-useky`)
  lepší A 1, obě 2, žádná 3.
- Varování o pruzích na 100 řezech (Stav, jak se otevře v Návrhu): dřív 1 červené a 33 oranžových, teď
  22 červených a 12 oranžových. Červená přibyla v MK I a II, kde se pruhy kolem tramvaje dělí na 2,7–2,95 m
  (Patočkova, Švehlova, Hlávkův most, Olšanská).

## Otevřené

1. Výchozí povrch tělesa: panely, nebo štěrk (viz bod 2)?
2. Stání v úzkých obousměrkách, kde auta stojí proti zákonu: má profil ukázat skutečnost, nebo zákon?
3. Odhad stání u okraje bez chodníku a u velmi široké vozovky (16 m průmyslová): přidat podmínku?
4. Obytná zóna: zákon v ní dovoluje stání jen na vyznačených místech (§ 39), odhad ale v `living_street` platí dál.
5. Cyklisté v protisměru jednosměrky: § 25 počítá pruh pro každý směr jízdy, odhad bere jednosměrku jako jeden směr.
6. Červená u pruhů 2,7–2,95 m v MK I a II je přísná. Odvozené pruhy vedle tramvaje jsou dělení vozovky, ne
   změřená čára.
