# Proč zákonný odhad stání na Slovensku prohrával (25. 11. 2026)

**Krátce:** nešlo o Slovensko. Prohry byly z chyby sdíleného kódu: zákonný pruh ležel ve vozovce dřív, než se měřily
pruhy, a posuzoval se na celé vozovce, než auta z modelu zabrala svou část. Po opravě je zákonný odhad na Slovensku
remíza (6 : 7), stejně jako v Česku (5 : 5). Výjimka v `countries/SK.js` je zrušená, oprava platí všude (`?off=lawlanes` vrátí
předchozí chování). Odhad na Slovensku tedy nic prokazatelně nezlepšuje, jen nic nekazí; „v Česku funguje“ předtím nikdo
neměřil (ve 13 českých místních ulicích univerzálního měření se zákonný pruh ukázal jednou).

## 1. Osm změněných řezů bodu 2 (`../ZPRAVA.md`), čtyři prohry

| řez | co bylo špatně | příčina |
|---|---|---|
| Petržalka, bez jména (way 7960281) | čtyři pruhy podle OSM místo čar z ortofota | zákonný pruh v 17,4 m vozovce zakryl čáry (`applyLanes`: „jiné části, kus není pruh“; `measured()` chce jen pruhy a krajnice), model ho pak smazal, ale čáry už byly ztracené. Vozovka je rozplet křižovatky, v OSM `unclassified` |
| Masarykova, Košice | pruhy 4,8 + 4,8 místo 3,7 + 3,5 s krajnicemi | totéž; stání u obou stran je správně v obou podobách |
| K výstavisku, Trenčín | stání u B, kde je keř | vozovka 12,5 m zahrnovala kolmou řadu aut u A (5,4 m), zákon ji počítal jako volnou. Když řadu vzal model, zbylo 7,1 m a pruh u B nechal 5,1 m, méně než 2 × 3 m. Model je u B v pochybnosti (0,29: mezi 0,2 „nestojí“ a 0,4 „stojí“) |
| Jána Bottu, Trnava | stání u B, kde auta nestojí | vozovka 8,4 m ho podle zákona dovoluje, model je v pochybnosti (0,29). Řez je asi 6 m od osy přechodu. Zůstává (viz 4) |

Ostatní čtyři: Pečnianska (výhra, zůstává), Kmeťa, Hajdóczyho, Markovičova (tytéž ztracené čáry nebo drobnosti v šířkách).
Chodník, zálivy, jednosměrky, klíče OSM `parking:*` ani rozlišení ortofota ZBGIS příčinou nebyly. Pravidlo „přechod do 7 m od
řezu“ zkontrolováno na 18 řezech, kde se zákonný odhad projevil: trefí Bottu, ale i Suchou v Trnavě, kde auta stojí; nezavedeno.

## 2. Srovnání s Českem (nový vzorek, náhodné `residential` a `unclassified`)

Stejné místo třikrát a dvakrát opakovaně (F bez zákona, L zákon jako dřív, N zákon s opravou): SK 90 (+ 58 starých), CZ 63, AT 35,
DE 46. Liší se F od L: SK 18 z 86 (21 %), CZ 10 z 62 (16 %), AT 13 z 34, DE 7 z 43. Naslepo (fotky Mapillary, v Česku
i Mapy.com; balíčky pA, pC):

| | bez zákona : se zákonem (N) |
|---|---|
| SK (148 ulic) | 7 : 6 (bez tří, které se konečnou opravou srovnaly: 9 : 7) |
| CZ (63) | 5 : 5 |
| DE (46) | 2 : 4 |
| AT (35) | 1 : 6 |

Slovensko se od Česka neliší. Odhad přidává stání jen tam, kde si model není jistý, a tam je to v SK i CZ zhruba padesát na
padesát; v Rakousku (a trochu v Německu) auta u obruby opravdu častěji stojí. Není to rozdíl tvrdě prokázaný: malé počty, dva
posuzovatelé téhož SK balíčku (pk1) se shodli v 8 z 10 (6 : 4 a 4 : 6).

## 3. Zákon

| | Česko (361/2000 Sb.) | Slovensko (8/2009 Z. z., znění od 1. 10. 2026) |
|---|---|---|
| volný pruh | § 25 odst. 3: „Při stání musí zůstat volný alespoň jeden jízdní pruh široký nejméně 3 m pro každý směr jízdy“ | § 23 ods. 1: „Pri státí musí zostať voľný aspoň jeden jazdný pruh široký najmenej 3 m pre každý smer jazdy.“ |
| přechod | § 27 odst. 1 písm. c): do 5 m před ním | § 25 ods. 1 písm. c): do 5 m před ním |
| chodník | § 53 odst. 2: jiní než chodci ho užívat nesmějí, pokud zákon nestanoví jinak | § 52 ods. 2 a § 25 ods. 1 písm. p): auta jen kde to značka dovoluje (1,5 m volné šířky platí pro kola a motocykly) |

Zadání uvádělo slovenský § 25; volný pruh je v § 23 ods. 1. Pro odhad podélného stání ve vozovce je zákon stejný, výjimka
typu (a) to není. Zdroje: zakonyprolidi.cz/cs/2000-361, zakonypreludi.sk/zz/2009-8 (české § 53 se četlo jen po odst. 2).

## 4. Sdílené pravidlo (bez státu)

`ai-kerbs.js lawKerbs`, `layLaw`, `widenLaw`, `app.js lawAt`. Kde model přečetl řez a data o stání nerozhodují:
1. pruhy a krajnice se měří na profilu bez zákonných pruhů;
2. kde model vidí podélnou řadu aut, zákonný pruh se vrátí, před ostatními auty modelu (dvoupruhové vozovce zůstanou dva
   pruhy), a nakonec se rozšíří na šířku řady (2–2,5 m);
3. kde model vidí jiná auta (kolmo, na chodníku), kreslí je model (`parkFromAi`);
4. kde si model není jistý, zákonný pruh se vrátí jen tehdy, zůstane-li vedle toho, co už je nakreslené, zákonná šířka. Bere
   krajnici u obruby, pak odhadnutou krajnici, pak pruhy (nejméně 2,5 m);
5. kde je model jistý, že auta nestojí, nic.

## 5. Výsledky

- **Dnes proti opravě (L : N), naslepo balíček pB, CZ + AT + DE, 22 řezů:** N **13 : L 6**, stejně 2, nejde 1 (CZ 5 : 1, AT 6 : 4, DE 2 : 1).
  Po konečném rozšíření pruhu se z proher srovnala olomoucká (šum) a drážďanská je téměř totožná s L.
- **Slovensko, bez zákona proti zákonu s opravou:** viz bod 2. Bez opravy se F a L na novém vzorku lišily v 18 řezech, s opravou F a N v 10.
- Kód se během měření třikrát upravil (zadání: po obecné chybě vždy znovu na všech změněných řezech); poslední úprava (šířka řady)
  mění jen 5 řezů a po ní se naslepo neposuzovalo, jen ověřilo, že Košice, Prešov a Trnava-10 vycházejí stejně jako bez zákona.
  Posuzované řezy tedy nejsou čistě neviděný vzorek.
- `regrese.mjs` beze změny (pruh z ortofota do ní nevstupuje), `npm test` viz commit.
- **Neměřeno:** ostatní státy se zákonným odhadem (PL, FR, NL, BE, CH, ES, PT, IT, LU, DK, FI, EE, LT, SI, CY, MT) dostanou opravu také.

## 6. Rozhodnutí

`countries/SK.js parkGuess: true`. Prohra 6 : 7 v SK je v mezích šumu a stejná jako česká remíza; důvod výjimky (4 : 1) byl z
chyby kódu. Monako si výjimku nechává (čl. 31 Code de la route). Vrátit jde jedním řádkem.

Soubory: `kandidati.json`, `sample.mjs`, `vyber.mjs`, `vysledky/st-*` (první běh, kód před úpravami), `sv-*` (konečný kód, jen
změněné řezy), `klic-*.json`, `posudky.json` (pA, pB, pC), posudky pk1 a pk2 (předběžné, SK a AT) jen zde. Ortofota a fotky nejsou uložené.
