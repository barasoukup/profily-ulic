# Dánsko (DK)

Stav nasazení: větev `estonia`, 23. 11. 2026, nenasazené. Přehled všech států: [docs/countries/README.md](README.md). Pravidla od Báry platí všude, jsou v `CLAUDE.md`.

## Stav a rozhodnutí (dříve CLAUDE.md)

### Dánsko (větev estonia, Bára 23. 11. 2026, nenasazené)

- `countries/DK.js`, `towns/denmark.js`, `search-dk.js` (GSearch s tokenem, jinak Photon), `keys.js`, `signs-DK/`,
  `evaluation/denmark/` (ZDROJE, NORMY, buildings-ab/). Hranice GISCO s Bornholmem (bez Faerských ostrovů a Grónska),
  pobřeží 400 m. OSM balík `dk` (jen R2; viz seznam v `docs/deployment.md`), lokálně Kodaň, Aarhus, Odense, Aalborg.
-  Ortofoto jaro GeoDanmark (WMTS
  z20) pro pruhy a jako mapa; bez tokenu (nebo odmítnutý) odhad jen z OSM s poctivou poznámkou, výpadek služby (platforma
  se stěhuje, okno 26.–30. 11. 2026) jako výpadek.
- Kodaň: okraje vozovek `vejkant`, parkovací plochy a budovy **zapnuté** (Bára 24. 11. 2026: „Kodaňská data bych použila“,
  i když licence vrstev v katalogu uvedená není; `?kbhkant=0`, `?kbhpark=0`, `?kbhbyg=0` vypnou). A/B 72 řezů
  `evaluation/denmark/ab/REPORT.md` (čáry lépe 5, hůř 2; stání lépe 7, hůř 2), budovy `evaluation/denmark/buildings-ab/REPORT.md`.
  Aarhus budovy BBR CC BY 4.0 zapnuté (`?aarbyg=0`).
- Normy (vejregler) jen doporučení, oranžově; červeně jen obousměrná cyklostezka 2,5 m (oběžník 95/1984). Stání 3 m na
  směr (zákon jen u plné čáry), na chodníku v obci zakázané. Otevřené otázky v `docs/backlog.md`.
- Měření přesnosti 24. 11. (poprvé, posuzoval Opus): shoda složení 58 % (24 řezů), Kodaň 60 % (šířka do 2 m 60 %), zbytek 57 %
  (33 %); nejčastěji chybí chodník a stání (`evaluation/universal/REPORT.md`).

## Popis zdrojů a pravidel (dříve app/README.md)

### Dánsko (Bára 23. 11. 2026)

Stát `denmark` (DK), `countries/DK.js`, `towns/denmark.js`; hranice GISCO s Bornholmem, Faerské ostrovy a Grónsko mimo
(GISCO je má zvlášť), na pobřeží 400 m tolerance (`city.js` COAST); OSM balík `dk` (jen R2). Ortofoto jarní mozaika
GeoDanmark přes Dataforsyningen (WMTS `orto_foraar_webm_DAF`, z20, asi 8 cm v Kodani; `lanes-ortho.js` `DK_ORTHO`, `dk`)
pro pruhy i jako podklad mapy, jen s tokenem aplikace (`keys.js`: na webu `config.js` z proměnné repozitáře `DK_TOKEN`,
lokálně `config.local.js`). Bez tokenu nebo když ho služba odmítne (401/403 na všech dlaždicích) chyba `noKey`: profil jen
z OSM a poznámka „Ortofoto tu není k dispozici…“; chyba serveru je výpadek („Zkuste kliknout znovu“). Kodaň (WFS
`wfs-kbhkort.kk.dk/k101`): okraje vozovek a cyklostezek GeoDanmark `vejkant` jako čáry pro obruby (`?kbhkant=0` vypne),
parkovací plochy `parkering_areal` s úhlem stání (`?kbhpark=0`), budovy BBR (`?kbhbyg=0`; jen potřebná pole, nikdy
vlastník); zapnuté od 24. 11. 2026 (Bára, licence vrstev neuvedená; A/B `evaluation/denmark/ab/REPORT.md`). Aarhus: budovy BBR (rok, užití, zdi, podlaží odhadem z ploch;
CC BY 4.0, `?aarbyg=0`). Hledání GSearch (husnummer, navngivenvej; `search-dk.js`), bez tokenu Photon. Normy z vejregler
(Tværprofiler i byer 2019, Anlæg for parkering 2023) jen oranžově, červeně obousměrná cyklostezka 2,5 m. Stání 3 m na
směr, na chodníku v obci zakázané (§ 28). Značky `signs-DK/` (BEK 425/2023, Commons public domain; C 55 jako šablona
aplikace). Bez paneláků, severské vzhledy domů (`nordicLook("DK")`), neutrální vozidla, český mobiliář, rakouské označníky.
