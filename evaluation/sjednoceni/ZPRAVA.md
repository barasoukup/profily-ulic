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
