# Dlaždice OSM na Cloudflare R2: zkouška (15. 11. 2026)

Větev `osm-r2`. Produkce (Pages, `main`) beze změny, nic není pushnuté.

## Co vzniklo
- **Formát** (`pilot/public/osmpack.js`): jeden soubor na stát. Tagy ve slovníku (dvojice klíč=hodnota, které
  jsou aspoň ve 30 prvcích; jména zůstávají v dlaždici), prvky jako krátká pole, první bod od rohu dlaždice,
  každá dlaždice zvlášť gzip. Index dvouúrovňový: hlava (24–47 kB, bloky 32 × 32 dlaždic a slovník) se čte
  jednou, list bloku (asi 1 kB) při prvním řezu v bloku (asi 11 × 18 km), pak jen dlaždice. Sousední dlaždice
  jednoho řezu jedním dotazem. PMTiles jsem nepoužila: je stavěné na mřížku webových map (z/x/y), naše mřížka
  je 0,005° a vlastní formát je jednodušší a bez knihovny.
- **Balení** (`tools/pack_osm_tiles.mjs`): bere hotovou složku dlaždic z `build_osm_tiles.mjs` a přepíše ji
  bezeztrátově. Stavba dlaždic se nemění.
- **Přepínač** `?osm=r2` (z R2), `?osm=balik` (balík z lokálního serveru, `pilot/data/osm-pack/`). Bez něj
  vše jako dřív. Čte oba státy a spojí je (dlaždice na hranici může být v obou).
- **Testy** `tests/osmpack.test.js` (kódování, čtení po kouscích, změna souboru během čtení); `npm test` prochází.
- **Kontrola** `evaluation/osm_pack_check.mjs`: každá dlaždice a řezy vzorků proti dlaždicím.

## Velikost

| | Dlaždice dnes | Souborů | Jeden soubor |
|---|---|---|---|
| ČR, dnešní obsah | 783 MB | 244 590 | **154 MB** (20 %) |
| ČR, nový obsah (všechny domy, zeleň, voda, plochy vozovek; commit 1bae294) | 1 343 MB | 246 495 | **281 MB** (21 %) |
| SK, dnešní obsah | 203 MB | 103 680 | 43 MB |
| SK, nový obsah | 534 MB | 105 314 | **107 MB** |

Nový obsah ČR se na Pages (limit 1 GB) nevejde, na R2 bez problému. Na R2 jsou nahrané soubory s novým obsahem
(ČR z výřezu Geofabriku 9. 11., SK z 15. 11.).

## Shoda
- Všechny dlaždice ČR i SK (oba obsahy) se z balíku přečtou přesně stejně jako ze souborů.
- 3 048 řezů vzorků všech měst: OSM prvky stejné (z disku); 100 pražských řezů stejných i přímo z R2.
- V aplikaci (`?osm=balik` proti dnešku, 20 řezů v Praze, Brně, Pardubicích, Plzni a Hradci): stejný profil
  u 19. Jiný byl první řez po načtení stránky (Rozvadovská spojka); OSM prvky má stejné, rozdíl je asi v jiné
  službě (IPR, ortofoto), neověřeno.

## Rychlost (30 pražských řezů, z tohoto Macu, jen OSM)

| | Medián | 90 % |
|---|---|---|
| Pages, dnešní soubory | 340–370 ms | 440–480 ms |
| R2 (r2.dev), nové místo (list bloku + dlaždice) | 310 ms | 560–580 ms |
| R2 (r2.dev), řez vedle (jen dlaždice) | 300–310 ms | 360–500 ms |
| R2 hlava, jednou po otevření stránky | asi 1,1 s | |

Zpracování v prohlížeči je zanedbatelné (0,7 ms na řez i s rozbalením). R2 přes r2.dev je stejně rychlé jako
Pages, jen první řez po otevření stránky čeká o hlavu déle. r2.dev odpovídá asi za 150–300 ms, i když ping
je 15 ms: data jdou pokaždé z úložiště, bez cache. S vlastní doménou poběží přes cache Cloudflaru a mělo by to
být výrazně rychlejší. Celý řez trvá 1–9 s kvůli ostatním službám (IPR, ČÚZK, ortofoto), OSM je z toho malá část.

## Slovensko (zjištěno, nic jsem neměnila)
- **Bez přepínače:** klik na Slovensku hlásí „Tady jsem žádnou ulici nenašla… (data pokrývají Česko)“,
  zapíše se `bez_ulice` s `bez_dat` a zůstane předchozí profil.
- **S `?osm=r2`:** ulice se najde (Bratislava Suché mýto, Košice Hlavné námestie), město je „cesko“. Aplikace se
  ptá technické mapy ČÚZK, která mimo Česko vrací odpověď bez CORS, a hlásí matoucí „Technická mapa ČÚZK teď
  neodpovídá, profil je jen odhad z OSM“. Profil je holý odhad z OSM (pruhy, bez chodníků a domů). Záložní profil
  z ortofota a OSM (větev orto-osm-fallback) tu zatím není; ortofoto ČÚZK mimo Česko také nic nemá.

## Co stojí provoz
Zdarma měsíčně: 10 GB úložiště, 1 milion zápisů (Class A), 10 milionů čtení (Class B), stahování bez poplatku.
- Úložiště: 0,39 GB (ČR + SK). Zdarma.
- Zápisy: soubor = 1 zápis, při obnově 2 týdně, asi 9 měsíčně. (Dnešních 245 000 souborů by byl 1 milion
  zápisů za 4 týdny.) Soubor nad 300 MiB jde nahrát jen po částech a každá část je zápis, stále jednotky.
- Čtení: hlava 1× na stát po otevření stránky, list bloku 1× na oblast, řez 1–2 dotazy. 10 milionů je
  zhruba 3 miliony řezů měsíčně. Nad limit: 0,36 $ za milion čtení, 0,015 $/GB úložiště.
- S vlastní doménou a cache Cloudflaru se čtení z cache do R2 nepočítají.

## Co chybí pro ostrý provoz
1. **Vlastní doména připojená ke kbelíku** (r2.dev je jen na zkoušení, má omezenou rychlost a bez cache). Doména
   od Wedosu: DNS (nameservery) převést do Cloudflaru, pak v R2 „Connect domain“, např. `data.<doména>`.
   Cloudflare zdarma cachuje soubory do 512 MB: ČR má 281 MB, tedy ještě rezerva, větší stát by se dělil.
2. **CORS** kbelíku doplnit o `https://barasoukup.github.io` (a doménu stránky, pokud se změní).
3. **CSP** v `pilot/public/index.html`: místo zkušebního `https://*.r2.dev` adresa domény.
4. **Týdenní obnova** v `.github/workflows/`: po stavbě dlaždic `node tools/pack_osm_tiles.mjs`, stejně pro SK
   (stažení `europe/slovakia-latest.osm.pbf`, stavba asi +4 min), nahrání na R2 (API token s právem
   „R2 edit“ jen pro tento kbelík jako tajná proměnná repozitáře; wrangler zvládne soubor do 300 MiB, větší
   po částech přes S3 API, např. rclone nebo aws-cli). Dlaždice pak nemusí na Pages vůbec.
5. **Výchozí čtení z R2** v aplikaci místo přepínače; starou cestu nechat jako zálohu, dokud R2 neběží týdny bez potíží.
6. **Výměna souboru:** aplikace pozná nový soubor podle ETag a načte hlavu znovu. Bezpečnější je nahrát pod
   novým jménem s datem a přepsat malý `index.json`, aby čtenář nikdy nedostal půl starého a půl nového souboru.

## Kde co je
- Balíky: `pilot/data/osm-pack/` (`cz.posm`, `sk.posm` = dnešní obsah; `cz-novy.posm`, `sk-novy.posm` = nový obsah, na R2).
- Dlaždice SK a nové ČR: `pilot/data/osm-tiles-sk`, `osm-tiles-sk2`, `osm-tiles-cz2` (mimo git).
- Kbelík `profily-ulic-osm` (východní Evropa), `https://pub-a2b7312aca0a4dfe8a49583ae59ddbc6.r2.dev/osm/{cz,sk}.posm`.
