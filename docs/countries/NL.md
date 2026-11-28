# Nizozemsko (NL)

Stav nasazení: větev `netherlands`, 20. 11. 2026, nenasazené. Přehled všech států: [docs/countries/README.md](README.md). Pravidla od Báry platí všude, jsou v `CLAUDE.md`.

## Stav a rozhodnutí (dříve CLAUDE.md)

### Nizozemsko (větev netherlands, Bára 20. 11. 2026, nenasazené)

- Stát `netherlands` (NL): `countries/NL.js`, `towns/netherlands.js`, `signs-NL/`, `search-nl.js`, `evaluation/netherlands/`
  (ZDROJE, NORMY, ab/). Hranice GISCO za Německem. Bára: „stačí s univerzálními ilustracemi“ (neutrální vozidla, český
  mobiliář, rakouské označníky), bez paneláků.
- Mapa povrchů BGT (PDOK, CC0) kde má u středu řezu vozovku, cyklostezku, stání nebo tramvajové těleso, samotný chodník
  nestačí (`?bgt=0`); API vrací i staré verze, proto `datetime`. A/B 37 řezů po recenzi: BGT u 24, lépe 13, stejně 10,
  sporně 1, hůř 0 (`evaluation/netherlands/ab/REPORT.md`, recenze `REVIEW.md`). Budovy `?bag=0`.
- Budovy BAG (rok, využití) a 3D BAG (podlaží, střecha); ortofoto PDOK 8 cm; hledání PDOK Locatieserver; sítě Amsterdamu
  (stoky Waternetu, kabely osvětlení); parkovací plochy z BGT (parkeervlak). RDW neodpovídá, KLIC 403.
- Úroveň ulice (most, nábřeží pod ulicí) z OSM `bridge`/`tunnel`/`layer`. Měření přesnosti 20. 11.: shoda složení 52 %,
  šířka do 2 m 41 % (32 řezů); červené cyklopruhy jsou v BGT „fietspad“.
- Normy CROW jen přes příručky Amsterdamu a CROW-Fietsberaad; RVV 1990 šířku vedle stání neuvádí: 3,5 m (hasiči)
  a 4,5 m obousměrně jako praxe. Stání na chodníku jen u E8b.
- OSM po 12 provinciích (`nl_*`, jen R2). viz seznam v `docs/deployment.md`
- Nápad do budoucna (Bára 20. 11. 2026): srovnávat a přepínat normy různých států, aby byly vidět rozdíly přístupů.

## Popis zdrojů a pravidel (dříve app/README.md)

### Nizozemsko (Bára 20. 11. 2026)

Stát `netherlands` (`country` NL), `countries/NL.js` a `towns/netherlands.js`; hranice z GISCO v `states.json` (za Německem).
OSM po 12 provinciích (balíky `nl_dr` … `nl_zh` jen na R2, Geofabrik má provincie ve složkách `europe/netherlands/<p>/`).
Ortofoto PDOK Luchtfoto `Actueel_orthoHR` (8 cm, WMTS z21 `{z}/{x}/{y}`, `lanes-ortho.js` zdroj `nl`, CORS).
- **Mapa povrchů BGT** (PDOK OGC API Features, CC0) jako plochy řezu, kde má plochu ulice pod středem řezu: vozovka,
  chodník, cyklostezka, parkovací plocha, OV-baan (s tramvajovou kolejí BGT tramvajové těleso), krajnice a ostrůvky,
  zeleň, voda, dvory, budovy. Jen platné verze (`datetime`), jen úroveň ulice (most a tunel ne). Neodpoví-li, odhad
  s poznámkou. `?bgt=0` vypne. A/B v `evaluation/netherlands/ab/` (lépe 12, stejně 12, hůř nebo sporně 4 z 30).
- **Budovy** z BAG (rok, využití) a 3D BAG (podlaží, střecha) podle bodu fasády; bez paneláků.
- **Sítě pod zemí** v Amsterdamu (`site.js`): stoky Waternetu s průměrem (obvyklá hloubka) a kabely veřejného
  osvětlení s hloubkou.
- **Normy** `countries/NL.js` podle CROW přes příručky Amsterdamu a CROW-Fietsberaad (rešerše
  `evaluation/netherlands/NORMS.md`); stání podle praxe (RVV 1990 šířku neuvádí): 3,5 m na jednosměrce, 4,5 m vozovky
  obousměrně; nestojí se vedle cyklopruhu (RVV čl. 23).
- **Hledání** PDOK Locatieserver (`search-nl.js`). **Značky** `signs-NL/` (RVV 1990, Commons, bez dodatkových tabulek).
- **Ilustrace** univerzální: neutrální vozidla, český mobiliář, rakouské označníky.
