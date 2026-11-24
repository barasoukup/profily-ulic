# A/B: čáry okrajů vozovek a parkovací plochy Kodaně (24. 11. 2026)

Bára 24. 11. 2026: „Kodaňská data bych použila“ (vrstvy `k101:vejkant`, `k101:parkering_areal`, `k101:bygning` z WFS
`wfs-kbhkort.kk.dk/k101`, licence v katalogu opendata.dk neuvedená). Pravidlo projektu: zdroj se zapne, jen když A/B
nevyjde hůř. Budovy mají A/B zvlášť (`../buildings-ab/ZPRAVA.md`).

Vzorek `sample.json` (`sample.mjs`, semínko 20261124): 72 náhodných bodů do 3 km od Rådhuspladsen (Frederiksberg uvnitř
nemá data města: kontrola) a 4 body v Aarhusu (kontrola: přepínače tam nesmí nic změnit). Sběr v aplikaci (localhost,
`?osm=balik`, `sber.js`), každý bod třikrát po sobě: A = bez obou vrstev (`?kbhkant=0&kbhpark=0`, odhad z jarního ortofota
GeoDanmark a OSM), K = jen čáry okrajů, P = jen parkovací plochy. Výsledky `vysledky/rezy.json`, souhrn a dvojice pro
obrázky `souhrn.mjs` (`rezy-kant.json`, `rezy-park.json`), obrázky `images-kant/`, `images-park/` (nahoře A modře, dole
B červeně, nad ortofotem GeoDanmark; `ORTHO=dk` v `evaluation/slovensko/ab/obrazky.mjs`). Posudky
`vysledky/posudky-kant.json`, `posudky-park.json` (nad obrázky 10 px = 1 m, bez fotek z ulice).

Odhad bez vrstev (A) vyšel ve dvou kolech sběru u všech 40 společných bodů stejně: rozdíly jsou od vrstev, ne nahodilé.
Sbíráno nad pracovní kopií, kde se zároveň upravoval `ortho-osm.js` (jiný agent); A i B mají tutéž verzi.

| vrstva | řezů | vrstva použita | profil se liší | lépe s ní | lépe bez | stejně | nejasné | chyba |
|---|---|---|---|---|---|---|---|---|
| čáry okrajů `vejkant` (`?kbhkant`) | 72 | 14 | 12 | 5 | 2 | 3 | 2 | 0 |
| parkovací plochy (`?kbhpark`) | 72 | 36 | 19 | 7 | 2 | 3 | 7 | 0 |
| Aarhus (kontrola, obě) | 4 | 0 | 0 | | | | | 0 |

## Čáry okrajů

- **Lépe (5):** ko21 Orlogsværftvej (chodníky po obou stranách parkovací plochy místo 18 m „plochy“), ko32 Tagensvej
  (dva pruhy a chodník místo ploch na vozovce), ko63 Klerkegade (chodník 3,6 m před parkovištěm), ko53 Staldgade (chodník
  místo plochy), ko18 (obslužná vozovka 5,2 m místo 3,9 m).
- **Hůř (2):** ko3 Børsgade (zeleň 16 m přes dlážděné prostranství, chodník 6 → 2,25 m), ko42 (vozovka 7 → 5,1 m).
- Stejně ko41, ko54, ko68 (posuny do 0,4 m), nejasné ko12, ko49.
- **Zapnuté** (`?kbhkant=0` vypne).

## Parkovací plochy

- **Lépe (7):** ko28 Webersgade, ko31 Guldbergsgade, ko37 Gærdebred (stání tam, kde stojí auta), ko61 Meinungsgade (šikmé
  stání vpravo), ko49 Blegdamsvej (parkoviště jako stání), ko69 Ny Carlsberg Vej (na přechodu bez stání), ko71 Hans Egedes
  Gade (vlevo auta nestojí, odhad tam stání dal).
- **Hůř (2):** ko4 Refshalevej (auta po obou stranách, plocha města jen na jedné), ko19 Dannevirkegade (řez prošel přesně
  mezerou mezi dvěma plochami šikmého stání).
- Stejně ko9, ko56, ko63; nejasné (stín) ko11, ko13, ko17, ko20, ko29, ko54, ko58.
- **Zapnuté** (`?kbhpark=0` vypne).
- Obě horší místa mají stejnou příčinu: když je v okolí řezu jakákoli plocha města, stání se jinde neodhaduje (ani
  podle zákona, ani z aut na ortofotu; `derive.js` `inZps`, `app.js` `parkSkip`), takže strana bez plochy nebo mezera mezi
  plochami zůstane bez stání. Na příště: odhad vypnout jen na straně, kde plocha je (backlog).
- Plochy bez záznamu (`p_type`, počet a ulice prázdné) zůstávají stáním: zkusmo vynechané
  zhoršily ko9 Nordbanegade (auto stojí na takové ploše), ko61 přišel o šikmé stání.
