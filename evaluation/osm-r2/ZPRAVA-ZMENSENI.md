# Zmenšení balíků OSM a denní přestavba (Bára 26.–27. 11. 2026)

Bára: „Ráda bych to fakt držela pevně pod těmi 10 GB.“ R2 účtuje průměr denních maxim úložiště, zdarma 10 GB-měsíc.
Větev `osm-slim`, nenasazeno, workflow nespuštěný, na R2 nic nenahráno ani smazáno.

## Co v balících je

Rozklad podle druhu prvků (`evaluation/osm-r2/slim/composition.mjs`), podíl na velikosti balíku (gzip):

| | at | be | ca_on_toronto | cz | de_by | dk | fi | fr_idf | it_s | nl_zh | us_dc |
|---|---|---|---|---|---|---|---|---|---|---|---|
| budovy (všechny) | 37 % | 57 % | 46 % | 44 % | 43 % | 48 % | 27 % | 58 % | 39 % | 51 % | 50 % |
| z toho s výškou/podlažími | 2 % | 1 % | 4 % | 24 % | 4 % | 1 % | 3 % | 4 % | 1 % | 4 % | 17 % |
| zeleň, hřbitovy, zahrádky | 26 % | 16 % | 5 % | 27 % | 19 % | 12 % | 23 % | 6 % | 21 % | 15 % | 7 % |
| silnice a ulice | 14 % | 11 % | 15 % | 11 % | 14 % | 13 % | 24 % | 12 % | 23 % | 8 % | 13 % |
| chodníky, stezky, cyklostezky | 6 % | 5 % | 15 % | 6 % | 6 % | 7 % | 7 % | 9 % | 4 % | 8 % | 11 % |
| obslužné cesty (service) | 8 % | 3 % | 9 % | 4 % | 7 % | 9 % | 8 % | 4 % | 5 % | 3 % | 12 % |
| body (stromy, lampy, zastávky…) | 5 % | 3 % | 4 % | 2 % | 5 % | 2 % | 2 % | 6 % | 5 % | 4 % | 2 % |
| voda | 1 % | 2 % | 1 % | 2 % | 2 % | 3 % | 6 % | 1 % | 1 % | 7 % | 1 % |
| ploty, zdi | 2 % | 3 % | 1 % | 2 % | 2 % | 4 % | 1 % | 2 % | 2 % | 2 % | 1 % |
| parkoviště, nástupiště, area:highway | 1 % | 1 % | 4 % | 1 % | 2 % | 1 % | 1 % | 2 % | 1 % | 2 % | 3 % |
| MB | 283 | 296 | 46 | 280 | 309 | 205 | 355 | 128 | 194 | 77 | 86 |

Podle složek zápisu: geometrie 63–70 %, rámec (typ, id, pořadí) 21–25 %, značky 8–13 %.

Druhy prvků aplikace používá všechny (budovy pro domy a fasádu, zeleň a voda pro okraje řezu, cesty, body pro
mobiliář, ploty pro hranici ulice). Zbytečné jsou jen:

- **id ploch a bodů**: aplikace id čte jen v `mergePieces` (osmtile.js), aby tvar ze dvou dlaždic vzala jednou. Cesty
  id potřebují (ulice řezu, spojování kusů, uložené odkazy). Plocha nebo bod v jediné dlaždici dostane id 0 (pokud by tím
  nevznikla shoda klíče v `mergePieces`). Deset číslic, které gzip neumí zmenšit: asi 6 % balíku.
- **značky, které žádný kód nečte** (`evaluation/osm-r2/slim/keys-used.mjs`, projde všechen kód `app/public`):
  jména v jiných jazycích a jejich etymologie (`name:fi`, `name:etymology:wikidata` …), čísla dopravců (`ref:IFOPT`,
  `route_ref:De_Lijn` …), poznámky (`*:note`). Asi 1–2 %.

Zkoušené a nepoužité: hrubší souřadnice vzdálených prvků (`far`, cz jen −1,4 %, us_sf 0 %), rozdíly id v dlaždici
(po vynulování id nic nepřidá), raw deflate místo gzipu a slučování dlaždic (±2 %, vyžadovalo by nový formát).
Formát balíku zůstává (osmpack.js VERSION 1), plný i zmenšený balík se čte stejně.

## Velikost před a po

Zmenšení se dělá při balení (`tools/pack_osm_tiles.mjs`, pravidla `tools/osm_slim.mjs`, výchozí obě; `SLIM=none`
balí jako dřív). Na 28 místních balících (Evropa, USA, Kanada; `data/slimtest/slim-all.log`): 1 457 → 1 353 MB,
**92,8 %** (88–96 % podle balíku).

| | dnes | po zmenšení |
|---|---|---|
| Evropa (106 balíků na R2) | 9,08 GB | ~8,43 GB |
| + USA (dc, nyc, sf, bos) a Kanada (Toronto) | 9,34 GB | **~8,67 GB** |

## Využití území (landuse) – samostatná položka, nezapojené

`landuse=residential/industrial/commercial/retail/railway` a areály `amenity`, zjednodušené (tolerance 2 m), jen
v dlaždicích se silnicí (`evaluation/osm-r2/slim/landuse-cost.mjs`): at +3,1 %, ch +1,9 %, us_dc +2,3 %,
ca_on_toronto +2,6 %. Celá sada se zmenšením a s landuse **~8,9 GB** (bez landuse ~8,67 GB).

## Špička v den přestavby

Dřív: všechny balíky se stavěly naráz a staré soubory se mazaly až na konci, takže na R2 leželo až 2× tolik (18,7 GB).

Nově:
- **Každý den sedmina balíků** (`tools/countries.mjs` `DAYS`: od největšího, vždy do nejlehčího dne podle
  `tools/osm-sizes.json`; dny 1 333–1 336 MB, každý balík jednou týdně). `osm-tiles.yml` běží denně (cron `0 3 * * *`),
  balíky dne podle `date -u +%u`. Ručně: `states:` (jako dřív, `de` = všech 16 zemí), `day:` 1–7, nebo bez obojího
  všechny.
- **Hned po nahrání** každý job spustí `osm-index.yml`. Ten běží vždy jen jeden (`concurrency: osm-index`): vypíše
  kbelík, zapíše index.json a hned smaže starší soubory. Čekající žádost nahradí starší čekající, nic se neztratí, protože
  každý běh zpracuje všechno, co v kbelíku je. Na konci ještě jeden běh pro jistotu. Obnovu zálohy na Pages spustí
  `osm-index.yml` jen tehdy, když se změnil český nebo slovenský soubor.
- Index se zapisuje dřív, než se smaže starý soubor. Stránka čte index bez cache (cf-cache-status DYNAMIC) a po 404
  index přečte znovu (osmpack.js PackSet). Soubor o víc než 30 % menší index nevezme a starý soubor zůstane
  (`osm_index.mjs` MIN_SHARE, platí i pro první zmenšenou přestavbu: ta je jen o ~7 % menší).

Simulace kroků obou workflow nad výpisem kbelíku (`tools/osm_peak.mjs`, test `tests/osm-peak.test.js`):

| | dnešní sada | zmenšená | zmenšená + landuse |
|---|---|---|---|
| celá sada | 9,34 GB | 8,67 GB | 8,93 GB |
| průměr denních maxim | 9,64 GB | **8,95 GB** | 9,22 GB |
| nejvyšší den | 9,70 GB | **9,00 GB** | 9,27 GB |
| nejhorší případ (6 největších balíků dne čeká naráz) | 10,31 GB | 9,57 GB | 9,86 GB |

Index nikdy neukazuje na smazaný soubor. Rezerva pod 10 GB je asi 1 GB. Další stát velikosti Česka (~0,27 GB) ji
zmenší asi o třetinu.

## Ověření, že se profily nezmění

- `npm test`: 536 testů prošlo (nové testy `tests/osm-slim.test.js` a `tests/osm-peak.test.js`).
- `node evaluation/ortofoto-osm/regrese.mjs` (dlaždice): beze změny proti `vysledky/regrese.txt`. Táž regrese nad
  balíky (`OSM_PACK=…`, nově v `evaluation/ortofoto-osm/lib.mjs`): plné a zmenšené balíky dávají totožné řádky.
- Přehrání (`evaluation/replay`, `&osmlive=1` čte balíky z místního serveru): 56 českých řezů, plné proti zmenšeným,
  55 stejně. Vzorek 100 řezů různých států (`evaluation/replay/sample-slim.json`): profil (`stav`) stejný ve všech 100.
  Rozdíly jsou jen ve výšce `viewBox` exportu SVG u několika řezů a v časovém razítku dotazů PDOK. Výška `viewBox` se
  liší i mezi dvěma přehráními týchž balíků (rec × full 6, slim × slim 3), takže zmenšení s ní nesouvisí. Opakovaný běh
  zmenšených balíků dal u českého řezu 21 a u Valencie stejný výsledek jako záznam nebo plný běh.
- `compare.mjs` teď přečísluje i `cut…` (id ořezových cest SVG).

## Co musí Bára udělat při nasazení

1. Po pushi `tools/pack_osm_tiles.mjs` / `osm_slim.mjs` na main se workflow spustí sám a postaví **všechny** balíky
   (spouští se při změně skriptů dlaždic). S novým workflow už to nevadí: každý starý soubor se smaže hned po svém
   nahrazení (špička ~9,2 GB). Kdo chce víc jistoty, může před pushem cestu `push` dočasně vypnout a přestavbu nechat
   na denních dávkách (za týden je zmenšené všechno).
2. Zkontrolovat, že workflow `OSM index` existuje a smí spouštět jiné workflow (`actions: write`, pro GITHUB_TOKEN
   povolené), a po prvním dni zkontrolovat `https://data.streetspace.eu/osm/index.json` a velikost kbelíku v Cloudflare.
3. Pro nový stát nebo část: řádek v `tools/countries.mjs` a MB v `tools/osm-sizes.json` (jinak se počítá s 50 MB).
4. Stavba zmenšeného balíku drží v paměti všechny dlaždice (`--max-old-space-size=12000`; cz se lokálně balil s limitem
   14 GB). Běžný runner má 16 GB. U největších balíků (de_nw, fi, de_by) je dobré při prvním běhu sledovat, jestli
   nedojde paměť; když spadne, zůstane starý soubor.
