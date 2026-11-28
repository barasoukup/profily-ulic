# Profily ulic – kontext pro Claude Code

Tenhle soubor shrnuje, co vzniklo v projektu „Street design“ na claude.ai. Historie chatu se
nepřenáší, platí jen to, co je tady a v souborech repozitáře.

## Cíl
Nástroj na příčné profily ulic (podobný Streetmixu) propojený s mapou: kliknutí na ulici v Praze
sestaví profil od fasády k fasádě z dat IPR a OSM, profil jde upravit (Stav / Návrh / porovnání)
a exportovat (PNG, SVG, JSON). Lehká samostatná aplikace s ilustracemi Streetmixu.

## Kde to běží, příkazy a kontroly
- Živě: https://streetspace.eu/profily/ (Bára 16. 11. 2026; doména u Wedosu, DNS v Cloudflaru: A/AAAA na GitHub Pages,
  `www` CNAME, vše DNS only, `data` je R2). Pages nasazuje aplikaci do `profily/`, kořen domény, `/profile/` a staré
  odkazy `barasoukup.github.io/profily-ulic/…` přesměrují tam i s řezem (`tools/build_root_site.mjs`).
- Repo: github.com/barasoukup/profily-ulic (MIT, © Bára Soukupová).
- Lokálně: `node app/server.mjs` → http://localhost:5173 (Node 22+). Dlaždice OSM:
  `tools/build_osm_data.sh`, hranice ZPS: `node tools/build_zps.mjs`.
- Testy a kontroly: `node --test tests/*.test.js`, `npm run check` (syntaxe a importy), `npm run lint`, před nasazením `npm test`.
- Na Bářině počítači `npx wrangler` (i `npm test`) s Node 26 tiše končí kódem 194: wrangler spouštět přímo `node <cesta k wrangler>/bin/wrangler.js …`, testy `node --test tests/*.test.js`.
- Struktura repa: `app/` (aplikace, `app/public/`), `tools/` (stavba dat a kontroly), `evaluation/` (měření a pokusy), `tests/`, `logging/` (Worker), `docs/`; podrobně `docs/repo-structure.md`.

## Pravidla od Báry (dodržuj)

### Komunikace
- S Bárou piš česky.
- Aplikace se jmenuje **Profily ulic** (ne „návrhář“).
- Žádné texty „zkušebně“ v aplikaci (Bára).

### Nasazení a git
- **Nepushuj na GitHub, dokud Bára neřekne, že jsou změny odladěné.** Commituj lokálně a testuj na localhostu.
- Push na `main` = nasazení na GitHub Pages (`.github/workflows/pages.yml`), navíc každé pondělí obnova OSM.
- Nasazení zůstává na GitHub Pages; před nasazením běží `npm test`.
- Před nasazením nového státu se musí ručně spustit workflow OSM tiles pro jeho balíky (push je nepostaví): seznam je v `docs/deployment.md`.

### Data a služby
- Služby IPR smíme používat (Bára 10. 11. 2026 zrušila zákaz), **ale ohleduplně**: co jde, stáhnout jednou při nasazení (otevřená data Geoportálu), při kliknutí jen nezbytné dotazy, v testech cache a `evaluation/polite.mjs`.
- OSM jen z vlastních dlaždic celé ČR. Overpass jsme zkusili jako zálohu a je nepoužitelně pomalý (Bára 10. 11. 2026: „musíme se mu obecně vyhnout“).
- MTVU a technická mapa jsou povinně zveřejňovaná data, použití je v pořádku.
- Panorama z ulice: Mapy.com Panorama API, klíč jen v tajné proměnné repozitáře `MAPY_KEY` a v lokálním `app/public/config.local.js` (git ho ignoruje), nikdy v kódu.
- **Token Dataforsyningen** (Bára): lokálně `DK_TOKEN` v `app/public/config.local.js`, na webu proměnná repozitáře `DK_TOKEN` (pages.yml ji zapíše do `config.js`), nikdy ho nevypisovat ani necommitovat.
- Logovat chceme jen řezy, volitelně další akce. Řez přesně (souřadnice, azimut, dosah jako v `#rez=`, město, ulice, typ ulice, čas; Bára: na řezu není nic osobního). Cloudflare Worker + D1 (`logging/`, návod v `logging/README.md`), adresa v proměnné repozitáře `LOG_URL`; nasadit musí Bára (její účet).
- QGIS je nainstalovaný; všechny soubory patří do této složky.

### Měření a opravy
- Pravidla psaní kódu, testů a hlídací testy: `docs/coding-guidelines.md` (před úpravou kódu si je přečti).
- `docs/backlog.md` (Bára 21. 11. 2026): věci ke kontrole a vylepšení po oblastech. Co se objeví při práci (recenze, A/B, měření) a hned se neopraví, zapsat tam; hotové škrtnout s datem.
- Každá změna odhadu z ortofota a OSM (`ortho-osm.js`) musí projít regresí proti MTVU Prahy a Brna (`node evaluation/ortho-osm/regression.mjs`, výchozí stav ve `results/regression.txt`; Bára 16. 11. 2026: „u každé změny je samozřejmostí test, zda to dosavadní výsledky jinde nezhoršuje“). Co zhorší, zůstane vypnuté (Bára 27. 11. 2026: vypnuté pokusy se mažou, jen mapy povrchů `?krakow`, `?bologna`, `?vilnius` zůstanou).
- Sdílený kód, málo výjimek (Bára 24. 11. 2026: co nejvíc sdíleně, výjimka jen s měřením nebo rozdílem zákona, norem a dat): oprava platí ve všech státech.
- Univerzální měření přesnosti (skill `measure-accuracy`, `docs/measuring.md`): Použít u každého nového státu a u starých, když Bára řekne.

### Kód a názvy
- Názvy (Bára 27. 11. 2026): aplikace je ve složce `app/` (dřív `pilot/`), složky a soubory aplikace a nástrojů anglicky (`signs-CZ/`, `towns.json`, `states.json`, `towns/czechia.js`, `stop-post-*.svg`…). Česky zůstávají id v datech řezů, odkazech a logu (`cesko`, `chodnik`, `oznacnik`, `#rez=`, klíče značek), id měst a složky ilustrací podle nich (`praha/`, `cesko/`). Složky dat webu anglicky: `data/built-up-age`, `data/brno/parking`, `data/plzen/zones.json` (dřív `vyvoj`, `parkovani`, `zony.json`; `zps.json` zůstává).
- Pravidla státu patří do `app/public/countries/<ISO>.js`. Mimo `countries/` žádná podmínka na stát.
- USA a Kanada se načítají až na místě (`late.js`, `america.js`, `states-america.json`). Nové věci obou států přidávej tam, ne do statických importů (hlídá `tests/canada.test.js`).

### Jazyky
- Jazyk a stát nikdy nemíchat a psát kódy ISO: jazyky malými (cs, sk, en), státy velkými (CZ, SK, AT) (Bára 15. 11. 2026).
- **Nový text:** `node tools/i18n_add.mjs <klíč> "<česky>" "<anglicky>"` (ostatní jazyky dočasně anglicky, seznam `locales/_todo.json`), v kódu `t("<klíč>")`; změna textu s `--change`. Hlídá `tests/i18n.test.js` (klíč v kódu ve všech jazycích, žádný navíc, stejné `{jména}`).
- Francouzštinu ani italštinu rozhraní nepřidávat bez Bářina souhlasu.
- Bára 17. 11. 2026: česká jména měst se v překladech nesklánějí (polsky „miasta Plzeň“, ne Pilzna); obecně se zdroj ploch jmenuje „mapa povrchů“ (Bára 18. 11. 2026: univerzální název pro všechny státy; podkladová mapa, „Linie mapy povrchů“, legenda, hlášky, nápověda). „Technická mapa“ zůstává jen jako jméno konkrétního zdroje: kredity a licence, hlášky o konkrétní službě (ČÚZK, IPR, město) a texty měst; překládá se doslova (švédsky teknisk karta, ne primärkarta).
- **Překlady jsou strojové (agent na jazyk), měl by je projít rodilý mluvčí.**

### Licence a autorství
- Copyright kódu i pražských ilustrací: © Bára Soukupová (MIT).
- Kód MIT. Ilustrace Streetmix CC BY-SA 4.0 (s uvedením autora), pražské ilustrace (`app/public/praha/`) pod MIT jako kód (Bára rozhodla 8. 11. 2026), kód Streetmixu AGPL-3.0 (jen kopie ve `vendor/`, nepublikuje se). OSM ODbL. Podrobnosti v `LICENSES-AND-SOURCES.md`.
- Autorka v češtině a slovenštině „Bára Soukupová“, jinde „Bara Soukup“.

### Ilustrace
- Neutrální moderní tramvaj a autobus (`app/public/generic/`, `art.js` GENERIC_VEHICLES; Bára 17. 11. 2026: „všude, kde nemáme specifickou“): v každé sadě, která nemá vlastní tramvaj nebo autobus, místo Streetmixu. Trolejbus a auta zůstávají ze Streetmixu.
- Auta zůstávají ze Streetmixu (Bára rozhodla 8. 11. 2026).

## Normy a limity (schválené Bárou)
- Kolmé stání ≥ 4,5 m (5,0 standard, ČSN 73 6056).
- Cyklopruh 1,50 m; 1,75 vedle podélného stání; 2,00 vedle kolmého/šikmého stání. Cyklostezka 2,50.
- Jízdní pruh 3,00 m.
- Tramvajový pás dvoukolejný: 6,5 m minimum (osová vzdálenost 3 m), 7 m standard, 8 m se sloupy
  (IPR Manuál tvorby veřejných prostranství, kap. C.2; PDF v `data/zdroje`).
- Strop šířky pruhu 4 m (3,75 dálnice, 4,5 místní); zbytek vozovky jako krajnice/šrafy, označený
  „odhad“. Krajnice se kreslí až od 1 m.
- Varování v Návrhu: minima z Manuálu C.2 červeně, základní šířky oranžově.
- Srovnání norem: https://claude.ai/artifact/7rkssF8z7y6zhEDBfEhbG8

## Kde co najdeš
Pokyny k novému státu: skill `add-state`. Obecná rozhodnutí a smazané pokusy: `docs/decisions.md`, otevřené věci: `docs/backlog.md`.

### Státy a města
- **Praha, Brno, Jihlava, Most, Opava, Plzeň a další města**: nasazeno (Praha a Brno 9. 11. 2026, celá ČR 10. 11. 2026, `https://streetspace.eu/profily/`) → `docs/countries/CZ.md`
- **Slovensko**: větev `slovensko`, 15.–16. 11. 2026 → `docs/countries/SK.md`
- **Rakousko**: větev `austria`, 16. 11. 2026, nenasazené → `docs/countries/AT.md`
- **Německo**: 17. 11. 2026, nenasazené → `docs/countries/DE.md`
- **Švýcarsko, Lichtenštejnsko**: větev `switzerland`, 17. 11. 2026, nenasazené → `docs/countries/CH.md`
- **Nizozemsko**: větev `netherlands`, 20. 11. 2026, nenasazené → `docs/countries/NL.md`
- **Belgie, Lucembursko**: větev `belgium`, 20. 11. 2026, nenasazené → `docs/countries/BE.md`
- **Polsko**: větev `poland`, 21. 11. 2026, nenasazené → `docs/countries/PL.md`
- **Francie**: větev `france`, 22. 11. 2026, nenasazené → `docs/countries/FR.md`
- **Španělsko**: větev `spain`, 23. 11. 2026, nenasazené → `docs/countries/ES.md`
- **Portugalsko**: větev `portugal`, 23. 11. 2026, nenasazené → `docs/countries/PT.md`
- **Monako**: větev `monaco`, 23. 11. 2026, nenasazené → `docs/countries/MC.md`
- **Kypr**: větev `cyprus`, 23. 11. 2026, nenasazené → `docs/countries/CY.md`
- **Malta**: větev `malta`, 23. 11. 2026, nenasazené → `docs/countries/MT.md`
- **Itálie**: větev `italy`, 23. 11. 2026, nenasazené → `docs/countries/IT.md`
- **Estonsko**: větev `estonia`, 23. 11. 2026, nenasazené → `docs/countries/EE.md`
- **Slovinsko**: větev `estonia`, 23. 11. 2026, nenasazené → `docs/countries/SI.md`
- **Finsko**: větev `estonia`, 23. 11. 2026, nenasazené → `docs/countries/FI.md`
- **Dánsko**: větev `estonia`, 23. 11. 2026, nenasazené → `docs/countries/DK.md`
- **Litva**: větev `estonia`, 24. 11. 2026, nenasazené → `docs/countries/LT.md`
- **USA (Washington, New York, San Francisco, Boston)**: větve `usa`, `na-newyork`, `na-sanfrancisco`, `na-boston`, 24.–26. 11. 2026, nenasazené → `docs/countries/US.md`
- **Kanada (Toronto)**: větev `canada`, 25. 11. 2026, nenasazené → `docs/countries/CA.md`
Společné věci států: `docs/countries/README.md`.

### Témata
- Odvození profilu (pravidla, číslované body): `docs/profile-derivation.md`; úpravy a Návrh: `docs/editing.md`; voda: `docs/water.md`; sítě: `docs/networks.md`; železnice: `docs/rail.md`; mapa: `docs/map.md`.
- Ortofoto a odhad z OSM: `docs/orthophoto.md`; dlaždice OSM: `docs/osm.md`; parkování: `docs/parking.md`; budovy: `docs/buildings.md`; značky: `docs/signs.md`; ilustrace: `docs/illustrations.md`.
- Měření a A/B: `docs/measuring.md`; jazyky: `docs/languages.md`; export: `docs/export.md`; záznam řezů, kontakt a O aplikaci: `docs/logging.md`.
- Nasazení, balíky OSM před nasazením: `docs/deployment.md`; licence: `docs/licences.md`; struktura repa: `docs/repo-structure.md`; pravidla psaní kódu: `docs/coding-guidelines.md`.
- Popis aplikace, spuštění a obsah dokumentace: `app/README.md`; vyhodnocení 100 řezů: `evaluation/archive/prague-100/REPORT.md`; licence: `LICENSES-AND-SOURCES.md`.
