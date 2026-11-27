# Kontrola opravy `?axisroad=1` (Lippard Avenue): nic nezkazí

27. 11. 2026, větev `axisroad-check` (kód aplikace z větve `canada`, beze změny).

## Co se kontroluje

Oprava v `pilot/public/derive.js` (`ownRoad`, přepínač `ORTHO_P.axisroad`): když oprava osy přesune osu ulice z OSM na
nejbližší vozovku (osa padla do vykrojeného stání), bere se ta vozovka jako vozovka ulice, ne jako přístupová plocha.
Dřív ověřeno na 290 řezech pěti severoamerických měst (`evaluation/usa/sf/fixes/ZPRAVA.md`): mění se jen Lippard Avenue.

Bára: „jen mi prosím fakt potvrď, že ta oprava nic nezkazí“.

## Postup

Každý řez se jednou nahraje živě (`?replay=record`, odpovědi všech služeb), pak se dvakrát přehraje bez jediného dotazu
ven: bez opravy a s `&axisroad=1`. Porovnává se celý profil Stavu: typy a šířky dílů, okraje, řez sám (poloha, azimut,
cesta OSM) a poznámka (`compare.mjs`). Nahrávka proti přehrání bez opravy ukazuje, že přehrávka věrně opakuje nahrávku.

- `build-sample.mjs` → `ax-*.json`: body univerzálního měření všech států (`evaluation/universal/sample.json`), A/B vzorky
  map povrchů států (`evaluation/<stát>/ab*`), Tallinn, severoamerické vzorky mimo dřívějších 290 řezů.
- Starší nahrávky `evaluation/replay`: `sample` (369 řezů SK, AT, Praha, Brno, cizina; worktree architecture-countries),
  `sample-cz` (56 českých), `holdout` (612; worktree rules-push).
- `server.mjs` a `harness.js`: kopie `evaluation/replay` s jinou složkou nahrávky a výstupů a s `&pause=` (geodienste.ch).
  Oprava při této kontrole: nizozemská BGT má v dotazu `datetime=<teď>`, takže se přehrávka s nahrávkou nepotkala
  (80 nizozemských řezů se lišilo už bez opravy). Klíč dotazu je teď bez času; poté nahrávka = přehrávka.
- Kladná kontrola: Lippard Avenue (`ax-ctl.json`) nahraná a přehraná stejně. Bez opravy `chodník 4,65 | stání 2,40 |
  chodník 4,80 | chodník 3,35`, s opravou `… | pruh 4,80 | …`. Přepínač v přehrávce tedy opravdu působí.

## Výsledek

**3 566 řezů (3 468 různých míst) ve 24 státech: změněno 0.** K tomu dřívějších 290 v Severní Americe (1 změna, Lippard
Avenue, k lepšímu).

| Stát | Řezů | Změněno |
|---|---:|---:|
| CZ | 476 | 0 |
| SK | 401 | 0 |
| DE | 301 | 0 |
| AT | 286 | 0 |
| FI | 268 | 0 |
| US | 225 | 0 |
| BE | 179 | 0 |
| DK | 140 | 0 |
| CH | 122 | 0 |
| ES | 120 | 0 |
| FR | 120 | 0 |
| PL | 117 | 0 |
| NL | 117 | 0 |
| LT | 88 | 0 |
| PT | 80 | 0 |
| EE | 80 | 0 |
| LU | 80 | 0 |
| CA | 80 | 0 |
| SI | 76 | 0 |
| IT | 72 | 0 |
| MT | 48 | 0 |
| LI | 40 | 0 |
| CY | 40 | 0 |
| MC | 8 | 0 |
| bez státu | 2 | 0 |

Po sadách (bez → s opravou):

| Sada | Řezů | Změněno | Nahrávka = přehrávka |
|---|---:|---:|---|
| `sample` (SK, AT, CZ, cizina) | 369 | 0 | stará nahrávka, 316 řezů s výpadky (v obou variantách stejné) |
| `sample-cz` | 56 | 0 | ano |
| `holdout` (CZ, AT, DE, SK) | 612 | 0 | 12 řezů s výpadky, stejné v obou |
| `ax-cee` univerzální CZ, SK, AT, DE | 320 | 0 | ano |
| `ax-west` NL, BE, LU, FR | 320 | 0 | ano (po opravě klíče BGT) |
| `ax-south` PL, ES, PT, IT, MC, MT, CY, SI | 416 | 0 | ano |
| `ax-alps` CH, LI | 120 | 0 | ano |
| `ax-north` FI, DK, LT, EE (Tallinn A/B) | 296 | 0 | ano |
| `ax-na` Boston, Kanada, USA A/B, NYC | 305 | 0 | ano |
| `ax-ab1` A/B BE, NL, FR, DK, AT | 292 | 0 | ano |
| `ax-ab2` A/B FI, IT, LT, PL, SI, ES, DE | 418 | 0 | 3 slovinské řezy se liší (dvojí nahrání při navázání přerušeného běhu); s opravou proti bez beze změny |
| `ax-ab3` A/B Švýcarsko (vyměřování) | 42 | 0 | ano |

Řezy, kde aplikace profil nesestavila, jsou 3 (stejně v obou variantách).

## Verdikt

Oprava se projeví jen v situaci, kterou opravuje: oprava osy přesunula osu do vozovky, kterou nepřechází žádná jiná
silnice, jen chodník nebo obslužná cesta. Na 3 566 řezech ve 24 státech se taková situace neobjevila ani jednou a žádný
profil se nezměnil; jediná známá změna je Lippard Avenue, k lepšímu. **Oprava nic nezkazí; zapnout ji napořád je bezpečné.**

## Soubory

`build-sample.mjs`, `ax-*.json` (vzorky), `server.mjs`, `harness.js`, `compare.mjs`, `review.mjs` (ortofoto změněných
řezů, nebylo potřeba). Nahrávky a výstupy v `data/` (git je ignoruje): `data/out/<sada>-rec|off|on/`, souhrny
`data/changed-<sada>.json`.
