# Sjednocení výjimek států a měst (24.–25. 11. 2026)

Bára 24. 11. 2026: „otestuj, zda to můžeme vše sjednotit“. Co nejvíc ve sdíleném kódu; výjimka zůstane jen s měřením
nebo tam, kde odráží skutečný rozdíl v zákoně, normách nebo datech. Vzor e0494e5 (mapFill v Česku). Audit všech
přepínačů: `AUDIT.md`.

## Postup

- Vzorky: `sample.mjs <sada>` (náhodné body v kruhu kolem centra, pevné semínko), v aplikaci `sber.js pick` přitáhne
  bod na nejbližší ulici pro auta do 25 m (žádný do 100 m od jiného). Kandidáti `<sada>-kandidati.json`.
- Sběr: vlastní server `PORT=5390 EVAL_SAVE=1 node pilot/server.mjs`, stránka `?osm=balik`, `sber.js collect`: každý
  bod jednou v každé variantě na stejném místě (O: výjimka jako dosud, N: sdílená hodnota, příznak státu přepnutý za
  běhu). Výsledky `vysledky/*.json`, změny `node evaluation/sjednoceni/diff.mjs vysledky/<soubor>.json O N`.
- Slepé posouzení změněných řezů: `fotky.mjs` (Mapillary, v Česku Mapy.com; fotky Mapy.com po posouzení smazané),
  `baliky.mjs` (ortofoto bez čar aplikace, X a Y v náhodném pořadí, bez zdrojů), posuzovatel na balíček (agent bez
  přístupu ke kódu a klíči). Klíče `vysledky/klic-*.json`.
- Kontroly u každé změny: `node evaluation/ortofoto-osm/regrese.mjs` proti `vysledky/regrese.txt`, `npm test`.

## 1. `besidePassport` v Česku: sjednoceno (725908a)

Doplnění za pasportem města až k domům (ortofoto, model, čáry mapy) bylo zapnuté ve 14 státech, v Česku vypnuté bez
uvedeného důvodu; Belgie a Lucembursko ho měly vypnuté, ale jejich mapy pasport nemají (příznak nic nedělal).

Vzorek: 47 nových náhodných řezů v devíti českých městech s pasportem (`towns/pasporty.js`): Chomutov 6, Šumperk 5,
Rožnov 5, Litoměřice 7, Chotěboř 7, Šlapanice 4, Kuřim 4, Prachatice 4, Roudnice 5; ve všech pasport odpověděl.
O: bez doplnění, N: s doplněním do 25 m (hodnota většiny států).

Změnily se **3 ze 47**, jeden o 1 cm (Seifertova ve Šlapanicích, šum). Technická mapa ČÚZK pokrývá v Česku i okolí
pasportu, takže doplnění má málokdy co dělat. Dva zbývající naslepo (balíček bp1, bez fotek z ulice, jen ortofoto):

| řez | O → N | posudek |
|---|---|---|
| Čechova, Rožnov | B končí za pruhem na 4,7 m → zeleň 2,5 + zpevněná plocha 1,8 m do 7,7 m | **N** (střední jistota: za živým plotem parkoviště) |
| bez jména, Rožnov | A „neurčeno 0,9“ → „plocha 0,8“, krajnice o 5 cm | stejně |

**N 1 : O 0, stejně 1.** Výchozí `besideMax` státu (15 m) dává na těch třech řezech totéž jako 25 m
(`vysledky/pasporty-15.json`). Rozhodnutí: **sjednoceno**, příznak `besidePassport` zrušený (`countries/default.js`
a 16 států), doplnění za pasportem platí všude, vypnout jde `?off=beside`. `besideMax` zůstává (viz níže).
Regrese beze změny, 422 testů.

## 2. `parkGuess` na Slovensku: výjimka zůstává, změřeno

Zákonný odhad podélného stání byl na Slovensku vypnutý od 16. 11. („nevyzkoušeno“, Bára po prohlídce slovenských
řezů, ještě bez modelu aut). Slovenský zákon (§ 23 ods. 1 zák. 8/2009 Z. z.) ho připouští stejně jako český, takže to
nebyl rozdíl zákona.

Vzorek: dvě sady náhodných bodů v 11 městech (Bratislava, Petržalka, Košice, Žilina, Prešov, Nitra, Trnava,
B. Bystrica, Trenčín, Martin, Poprad), jen `residential` a `unclassified` (zákonný odhad platí jen tam): 30 + 28 = **58
řezů**. Sběr dvakrát (`sk-park.json`, `sk-park2.json`, pak `sk-park3.json` s opravou z bodu 3); tři řezy se mění i bez
přepnutí mezi dvěma kliknutími (Radlinského 2×, Kysucká; šum ortofota a modelu), ty se neposuzují.

S konečným kódem se změnilo **8 z 55**. Naslepo (balíček sk1; fotky jen u dvou řezů, Mapillary je na Slovensku řídký):

| řez | posudek |
|---|---|
| Pečnianska, Petržalka | **N** (auto u B, zákonné stání sedí) |
| Andreja Kmeťa, Žilina | nejde (slabě N; stín domu) |
| Jána Bottu, Trnava | **O** (u B auta nestojí, zákonný pruh navíc) |
| K výstavisku, Trenčín | **O** (u B za vozovkou keře, stání navíc) |
| Masarykova, Košice | **O** (stání u obou stran mají obě varianty; N ztratil pruhy změřené na ortofotu, 4,8 + 4,8 proti 3,7 + 3,5 s krajnicemi) |
| bez jména, Petržalka (4 pruhy) | **O** (N ztratil čáry pruhů z ortofota, 4 × 4,35 m) |
| Jána Hajdóczyho, Trnava | stejně |
| Markovičova, Trnava | stejně |

**N 1 : O 4**, stejně 2, nejde 1. Rozhodnutí: **výjimka zůstává**, s naměřeným důvodem u `countries/SK.js`. Co by
ji odstranilo (sdílená oprava, zatím neudělaná): (a) model aut na slovenském ortofotu zákonný pruh tam, kde auta nestojí,
někdy nesmaže; (b) se zákonným pruhem ve vozovce `applyLanes` nenajde čáry pruhů na ortofotu a pruhy zůstanou z OSM.
Obojí by stálo za změření i v Česku, Rakousku a Německu, kde odhad zapnutý je.

## 3. Sdílená oprava stání z modelu (`parkFromAi`), nalezená při bodu 2 (211284f)

Při slovenském A/B se ukázaly dvě chyby sdíleného kódu, které platí všude, kde je zákonný odhad zapnutý:

1. Zákonný pruh vrácený do vozovky (model u obruby auta nevidí) dostal jen sousední pruh: 3,05 + 5,05 m (Svätého
   Urbana, Bratislavská v Žilině), jeden pruh 6 m (Royova). Teď se rozdělí rovným dílem mezi jízdní pruhy vozovky a pak
   platí strop pruhu (`capWideLanes`) jako ve vozovce mapy.
2. Kde model vidí auta šikmo, kolmo nebo na chodníku, zůstal zákonný podélný pruh 2 m (K výstavisku, Pečnianska: kolmé
   řady 5,4 m). Teď se zákonný pruh vrátí do vozovky a místo něj je stání z modelu. Podélná auta ve vozovce zákonný
   pruh nechají.

`?off=parkshare` vrátí původní chování. Posouzení naslepo:

- **Státy se zapnutým odhadem** (balíček ps1): kontrolní řezy mapFill z `../mapfill-cz` (8) a 14 nových místních ulic
  v Grazu, Linci, Lipsku, Kolíně nad Rýnem, Vratislavi a Poznani; změnily se 4 z 22 (pátý, Poznaň, se v obou kódech
  přitáhl na jinou cestu, šum). K Trojhalí v Ostravě **nový** (4,5 + 3,5 m místo krajnice 1,0 + 4,5 + 2,5 m; středová
  čára sedí), Kalchberggasse v Grazu **nový** (slabě), Rosická **stejně**, Šatrova v Praze **starý** (krajnice 1,1 m
  u zeleně za vodicí čárou zmizela). **Nový 2 : starý 1**, stejně 1.
- **Slovensko se zapnutým odhadem** (balíček ps2, N0 starý kód proti N novému): 7 změněných, **nový 4 : starý 1**
  (J. Mazúra v Martině: model vidí u B kolmé stání, jsou tam podélná auta), stejně 1, nejde 1.

Celkem **6 : 2**. Regrese beze změny (stání z modelu do ní nevstupuje), testy `tests/park-ai.test.js`.

## 4. `wideRoads` v Česku: změřeno, pak nahrazeno pravidlem dat (bod 6)

Dálnice a silnice pro motorová vozidla mají jinde dosah 35 m (Bára: R1 v Banské Bystrici), v Česku ne („Fable: not
tried on Czech motorways“). Vzorek `dalnice`: náhodné body do 2 km od úseků D0, D1, D5, D6, D8, D11, D35 a silnic I/50,
I/27 (Praha Chodov a Ruzyně, Brno Slatina, Plzeň, Zdiby, Ostrava Rudná, Hradec, Olomouc), přitažené na `motorway` nebo
`trunk` do 700 m, ne blíž než 300 m od sebe: **14 řezů** (`vysledky/dalnice2.json`). Změnilo se všech 14: technická mapa
má plochy všude, takže 35 m vede dál do polí, lesů, na parkoviště a jiné cesty.

Naslepo (balíčky wr1, wr2, posuzovatel měl říct, kde končí prostor silnice): **N 1 : O 13**. Jediná výhra N je silnice
27 v Plzni (O vynechal druhou vozovku). Rozhodnutí: **výjimka zůstává** (`countries/CZ.js wideRoads: false` s důvodem).
Sdílená oprava, která by ji mohla zrušit: prodloužit dosah dálnice jen tehdy, když strana na dosahu končí v části silnice
(druhá vozovka, dělicí pás), jako `wideStreets`; to by bylo třeba změřit i na Slovensku, v Rakousku a Německu.

## 5. `city.fix` (osa OSM k vozovce mapy, obslužné cesty jako křižovatky, zpevněná plocha pod osou): sjednoceno mimo Prahu

Tři úpravy z Brna (9. 11. 2026) platily ve všech českých městech kromě Prahy a v cizině nikde (nikdy nezkoušené).
Praha je měla vypnuté po měření 100 řezů (1 lépe, 2 hůř).

Vzorek: 39 nových náhodných řezů ve 12 městech s mapou povrchů (Vídeň, Berlín, Hamburk, Paříž, Helsinky, Amsterdam,
Curych, Tallinn, Bratislava, Krakov, Zaragoza, Bologna) a 15 v Praze; každý řez třikrát na stejném místě (O, O2 bez úprav,
N s nimi; `vysledky/fix2.json`). První sběr (`fix-mapy.json`, `fix-praha.json`) byl neplatný: aplikace nastaví město jen,
když se změní, takže přepnutí za běhu se neprojevilo; rozdíly v něm byly jen šum nového kliknutí (`fix-re.json`: O2 = N).

Výsledek: **0 z 54 změněno** (šum O ↔ O2 1 řez). Starší pražské prohry jsou ale pořád stejné (`fix-p100.json`, tytéž
body jako 9. 11.): Generála Šišky (dělicí pás 1,5 m se změní v pruhy), Poděbradská (řez posunutý obslužnou cestou,
strana B krajnice 9,7 m), Nad Vršovskou horou jinak (posun z křižovatky). Rozhodnutí: **sjednoceno pro všechna města kromě
Prahy** (`city.js AXIS_FIX`, výchozí v `setCity`; Praha `fix: {}` s naměřeným důvodem). Plzeň si nechává `bedPanels`
(data jejích tramvajových těles). Regrese beze změny, 425 testů.

## 6. Delší dosah dálnic a hlavních ulic podle dat řezu místo `wideRoads` a `wideStreets`

Bára 25. 11. 2026 k bodu 4: důvod (mapa povrchů kreslí plochy všude, 35 m vede do polí) je vlastnost dat, ne Česka;
platí všude, kde mapa pokrývá všechno (BGT, švýcarské vyměřování, GRB, DBT…), kdežto mapy uličního prostoru (Vídeň,
Helsinky, Tallinn) končí na hranici pozemku a za nimi je zase odhad. Proto jedno pravidlo z dat u řezu (`app.js
widerSides`), oba příznaky států zrušené:

- strana nového řezu, která končí na dosahu (dálnice a silnice pro motorová vozidla vždy, hlavní ulice jen v dílu
  středového pásu, promenády nebo chodníku), sahá 35 m, jen když ulice za dosahem pokračuje: za dosahem není mapa
  povrchů (odhad; dům se nepočítá), nebo řez tam kříží druhá vozovka téže ulice z OSM (stejné jméno nebo `ref`), nebo
  plochy ulice z mapy (vozovka, chodník, cyklostezka, zpevněná plocha, tramvaj) pokračují bez přerušení až k vozovce;
- bez mapy pod osou (odhad) má dálnice 35 m jako dřív;
- `?off=widereach` vypne.

První verze bez třetí podmínky na Boulevard Marguerite de Rochechouart (kvůli němuž `wideStreets` vznikl) skončila
uprostřed promenády: druhá polovina bulváru má v OSM jiné jméno. S ní je Paříž jako dřív.

Sběr `vysledky/siroke2.json` (O: příznaky států jako dosud, N: pravidlo dat; obojí na stejném místě a směru, tentýž
sběr): **112 řezů** = 40 nových ve městech s mapou (Amsterdam, Rotterdam, Utrecht, Curych, Bern, Basilej, Vídeň,
Helsinky, Berlín, Paříž; `siroke-kandidati.json`), 5 pařížských bulvárů (Marguerite de Rochechouart, Clichy,
Richard-Lenoir, Grenelle, Batignolles), 14 kontrol bez mapy (Košice, Žilina, Vratislav, Lodž, Lyon, Toulouse), 14 českých
dálnic z bodu 4 a 39 hlavních ulic v CZ, SK, AT, DE, PL, NL a CH (`hlavni2.json`). Změnilo se **7**, jeden o 0,25 m
(šum). Kontroly bez mapy 0 ze 14, české dálnice 0 ze 14, české hlavní ulice 0, pařížské bulváry 0 z 5.

Naslepo (balíček wd1, fotky Mapillary u všech): **N 4 : O 2**.

| řez | O → N | posudek |
|---|---|---|
| Europalaan, Utrecht | A 22 → 35 m: boční ulice se stáním, pruhem a cyklopruhem | **N** |
| Avenue Montaigne, Paříž | B 25,5 → 22 m (za ulicí park s fontánou) | **N** (slabě) |
| Utoquai, Curych | A 22 → 35 m: promenáda se stromořadím k fasádě | **N** |
| Lassallestraße, Vídeň | A 23 → 35 m: dlažba se stáním k fasádě a kolejím | **N** |
| A20, Rotterdam | 35/36 → 22/21 m: souběžná vozovka komplexu dálnice odříznutá | O (nízká až střední jistota) |
| Bajkalská, Bratislava | B 23,4 → 27,4 m: 4 m plochy, což je už budova | O |

Rozhodnutí: **sjednoceno**, `wideRoads` a `wideStreets` zrušené ve všech 22 státech, pravidlo je jedno pro všechny.
Zbývá: souběžná vozovka dálnice s jiným jménem (A20) a plocha mapy, která na ortofotu leží pod budovou (Bajkalská).

## 7. Zákonný odhad stání podle dat místo `parkGuess` na Slovensku: zkoušeno, prohrává, výjimka zůstává

Bára 25. 11. 2026 k bodu 2: důvody (zákonné pruhy tam, kde auta nestojí; ztracené čáry pruhů) jsou vlastnost dat
(dobré ortofoto s pruhy a auty přečtenými modelem), ne Slovenska. Zkoušené pravidlo: zákonný pruh stání jen tam, kde
model ortofoto u řezu pro auta nepřečetl (bez ortofota, model nenačtený); kde ho přečetl, rozhodují jeho auta
(`parkFromAi`). Kritérium je čtení aut modelem, ne pruhů z ortofota: čáry pruhů o autech nic neříkají. Na Slovensku
`parkGuess: true` s tímto pravidlem.

- **Slovensko** (58 ulic z bodu 2, `vysledky/law-sk.json`): změněno **0 z 58** (model přečetl všechny řezy), tedy totéž
  co dnešní výjimka.
- **Státy se zákonným odhadem**, posouzené řezy univerzálního měření (místní ulice, 170 z 176 s profilem,
  `vysledky/law-univ.json`): změněno **44**, proti posuzovatelům **lépe 7, hůř 15**, stejně 21; nejhůř PL (0 : 4), FR
  (2 : 3), AT a DE (1 : 2). Pravidlo bere stání tam, kde model řadu aut nepřečte, ale posuzovatel ji na fotce vidí.
- Naslepo (balíček lw1: 22 kontrol z bodu 3, změněno 7, posouzeno 6 bez Rosické): **N 2 : O 4** (Šatrova bez stání
  u zdi, Melicharstraße a Katharinenstraße bez řady aut; lépe Vltavínská a Kalchberggasse).

Rozhodnutí: sdílené pravidlo **prohrává**, kód vrácený, `countries/SK.js parkGuess: false` zůstává s doplněným
důvodem. Slovenská výhoda je nejspíš v tom, že model na ortofotu ZBGIS 10 cm auta čte spolehlivě a slovenské místní ulice
mají stání řidší; měřit by šlo práh jistoty modelu (zákonný pruh jen tam, kde model nevidí nic ani slabě), ne vypnutí
zákona.
