# Pokyn pro posuzovatele řezu ulicí (univerzální metoda, 17. 11. 2026)

U každého řezu máš:
- `data/<id>-ortho.jpg`: ortofoto shora. Řez vede **vodorovně** (žlutá čárkovaná čára uprostřed), ulice běží **nahoru a dolů**.
  Strana **A je vlevo**, **B vpravo**. 10 px = 1 m; měřítko nahoře a dole má čárku po 1 m a dlouhou čárku po 5 m.
  Šířka obrázku v metrech je v souboru `data/<id>.txt`.
- někdy `data/<id>-f.jpg` a `data/<id>-b.jpg`: fotky z ulice (Mapillary). `-f` se dívá **nahoru** v ortofotu (A je na fotce
  vlevo), `-b` opačně (A je na fotce vpravo). Fotka může být starší než ortofoto.

Profil aplikace nevidíš. Sestav sám **příčný profil ulice podél žluté čáry od A do B**: od fasády domu (nebo okraje
plotu, zahrady, parku) na straně A po fasádu na straně B. Nevíš-li, kde ulice končí, skonči na okraji obrázku.

Části (jen tyto kódy), každá s přibližnou šířkou v metrech podle měřítka:
`chodnik`, `stani` (stání aut podél vozovky; uveď `podelne` / `kolme` / `sikme`), `pruh` (jeden jízdní pruh; každý pruh
zvlášť), `bus` (vyhrazený pruh BUS), `cyklopruh` (na vozovce), `cyklostezka` (mimo vozovku), `tramvaj` (koleje: v pruhu
s auty, nebo samostatné těleso), `zelen` (tráva, keře), `stromy` (pás se stromy), `delici` (dělicí pás, ostrůvek, svodidla
uprostřed), `nastupiste`, `krajnice` (nepojížděný asfalt u kraje, šrafy), `jine` (předzahrádka, dvůr, parkoviště, plocha
mimo ulici).

Ortofoto ukáže pruhy (podle značení), dělicí pás, obruby a šířky; fotky ukážou stání, chodníky, stromy, cyklopruhy.
**Fotky jsou povinné:** u každého řezu otevři každou fotku, která existuje, a do `note` napiš, co na ní je
(„foto f: …, foto b: …“). Nespěchej, každý řez posuď zvlášť.
Kde si nejsi jistý, napiš `?` za kód (např. `stani?`).

Výstup jeden JSON řádek na řez do `vysledky/<soubor>.jsonl`:
{"id":"p1","usable":true,"facadeA":true,"facadeB":false,"parts":[["chodnik",3.5],["stani",2,"podelne"],["pruh",3.2],["pruh",3.2],["chodnik",4]],"note":"krátce česky"}
`facadeA` / `facadeB`: zda profil na té straně končí fasádou domu. `usable: false`, když řez na ortofotu není ulice
(střecha, tunel, mrak).
