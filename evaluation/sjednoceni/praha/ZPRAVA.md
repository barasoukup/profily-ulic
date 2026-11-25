# Praha bez výjimky: osy OSM a obslužné cesty (25. 11. 2026)

Zadání (Bára 25. 11. 2026): zrušit poslední výjimku města, pražské `fix: {}`; zároveň přenést z větve `usa` ústí uličky
a spočítané pruhy. Výsledek: **výjimka zrušená, `city.fix` zmizelo úplně** (Plzeň si nechává jen vlastnost dat
`city.bedPanels`). Pravidla platí všude stejně.

## Příčiny starých pražských proher

| řez | co se dělo | příčina | teď |
|---|---|---|---|
| č. 42 Generála Šišky | střední pás 1,5 m se změnil v pruh | **`roadUnderAxis`**, ne `axisToRoadway`: jediná osa OSM leží na zpevněném dělicím pásu (MTVU 1003) mezi dvěma vozovkami a pravidlo z něj udělalo vozovku. `axisToRoadway` samo posunulo osu o půl vozovky, takže dosah na jedné straně přibral 3,35 m zeleně | beze změny proti stavu bez pravidel |
| č. 20 Poděbradská | strana B krajnice 9,7 m, chodník zmizel | řez ve 7,5 m od ústí obslužné cesty se odsunul na 15 m a tím do 5 m od vjezdu parkoviště na **protější vozovce**; křižovatky protější vozovky se nekontrolovaly | zůstane na místě |
| č. 69 Nad Vršovskou horou | posun z křižovatky | tehdy označeno jako lépe | posune se, naslepo lépe |
| „Spálená č. 42“ ze zadání | – | č. 42 je v datech i ve vzorku Generála Šišky; Spálená mezi řezy z 9. 11. není, commit 7757f5a ji nejmenuje | – |

Domněnka, že rozhodují data OSM (v Brně je `service` boční ulice, v Praze vjezd), se **nepotvrdila**: obslužné cesty
u Kohoutovy v Brně jsou bezejmenné slepé příjezdy 130–150 m, přesně jako ty v Praze. Podmínka „má jméno nebo
pokračuje“ by tedy vyřadila i Kohoutovu. Pražské ztráty byly jiné chyby (výše).

## Změna pravidel (`derive.js`, vše `?off=`)

- `service` (ne vjezd, parkovací ulička, drive-through) je křižovatka všude, 15 m jako dosud (`obsluzne`).
- Sama obslužná cesta neodsune řez dvouvozovkové ulice tam, kde by křížil křižovatku protější vozovky; zůstane na místě
  (`protejsi`). Boční ulice ho odsune jako dřív.
- Ústí uličky (`service=alley` i její plocha) v témže pravidle, z větve usa (`ulicky`).
- Zpevněná plocha pod osou není vozovka, je-li užší než 3 m nebo mezi dvěma vozovkami (obě do 4,5 m od osy); osa se
  z takového pásu neposouvá a u dvouvozovkové ulice se neposouvá na stranu druhé vozovky (`osaroad`; celé `osafix`).
- Spočítané pruhy: obousměrka s jedním pruhem od 4,0 m se dělí, když OSM (inventář) počítá ≥ 2 pruhy **a u vozovky je stání**
  (`pocetpruhu`). Podmínka stání přibyla tady: bez ní Odlehlá (4,25 m, bez stání) dostala pruhy 2,25 m a posuzovatel dvakrát
  dal přednost jednomu. Všech 6 řezů Washingtonu, na nichž pravidlo vyhrálo, stání má.

## Měření

Vzorky (`vyber.js`): Praha 52 nových řezů (22 u obslužné cesty, 20 dvouvozovkových, 10 s `lanes` ≥ 2) a 100 řezů z 9. 11.;
Brno 18 nových a 100 starých; cizina 50 (Vídeň, Berlín, Helsinky, Bratislava, Krakov, Paříž, Amsterdam, Žilina, Lodž, Lyon,
po 5). Sběr `../sber.js` na zmrazené kopii kódu (jiný agent měnil soubory), varianty O (město jako dosud), O2 (totéž znovu,
šum), N, každá z původního kliknutí. Šum O ↔ O2: 0 z prvních 120, v dalším sběru 2 z 50 (Krakov, Lodž; při opakování se
neukázaly). Poslední sběr (`vysledky/osy-*-k.json`) jsou jen řezy, které se v některé variantě lišily.

- **Praha, naslepo** (2 posuzovatelé, ortofoto každé varianty na jejím místě, Mapillary; pk-1, pk-2): 20 změněných z 152,
  **N 9 : O 5, stejně 6**; jedna prohra (Odlehlá) byl spočítaný pruh, který od té doby neplatí, takže pravidla os a křižovatek
  **9 : 4** (prohry: nábřeží Ludvíka Svobody, Za Císařským mlýnem, U Hadovky, Hartigova; většina nízká jistota).
- **Praha proti MTVU** (`mista.js`): 131 míst ze tří vzorků, která se pravidlem posunou; podíl čáry řezu, na níž je
  obvyklá plocha ulice podle MTVU v okolí 55 m: **O 0,774 → N 0,820, lépe 54, hůř 30** (bez pravidla `protejsi` 57 : 32).
  Pravidlo `protejsi` je samo o sobě neutrální (4 řezy lépe, 3 hůř, a o větší rozdíl); je tu kvůli Poděbradské.
- **Brno**: 118 řezů, změna **1** (Holzova: zeleň 1,95 m mezi dvěma vozovkami; naslepo N, nízká jistota). Pravidla samotná tam
  proti „žádným“ pomáhají i podle MTVU města (54 míst, 0,784 → 0,830, 23 : 9); Kohoutova se posune jako dřív.
- **Cizina**: 50 řezů, změna **0** (pravidla tam platila v podobě 15 m; nová omezení se na nich neprojevila).
  Proti mapám měst samotné pravidlo obslužných cest (žádné → N): Vídeň 16 : 9, Berlín 10 : 12, Amsterdam 11 : 4,
  Helsinky 13 : 7 (celkem s Brnem 73 : 41). Berlín je jediné město, kde nepomáhá.
- **Uličky a spočítané pruhy**: v Praze, Brně a cizině kromě Odlehlé nezměnily nic (OSM tu `service=alley` skoro nemá).
- Regrese `regrese.mjs` shodná s `vysledky/regrese.txt` (nic se nepohnulo), testy procházejí (`tests/axis-junctions.test.js`).

## Vyzkoušeno a nezapnuto

- Menší odstup od ústí obslužné cesty (9 m místo 15 m; místa 4,8 m od kliknutí místo 10,9 m). Proti mapám povrchů stejně
  dobré (0,869 proti 0,871, 185 míst) a v Praze s lepším poměrem (46 : 15), ale naslepo v Brně a cizině prohrálo s 15 m
  (Brno 3 : 3 bez Holzovy, cizina 3 : 7). Nechalo se 15 m, které mimo Prahu nic nemění.
- Křižovatky protější vozovky jako plné křižovatky (řez se pak odsune i 20 m a víc): bez zisku.

## Meze

- Volba 15 m a podoba pravidla `protejsi` vznikly na vzorcích A a B, C je nezávislý jen zčásti (9 proti 15 m). Posudky jsou
  nízké jistoty; v Praze chyběly fotky u 9 řezů a u tří polských ortofoto (posouzeno „nejde“).
- Část pražských 152 a cizích 50 řezů se po poslední změně pravidla neřezala znovu: jen ty, které se v některé variantě
  lišily; `service` pravidlo se nezměnilo (15 m jako varianta U prvního sběru), takže ostatní jsou totožné.
