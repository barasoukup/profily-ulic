# Monako (MC)

Stav nasazení: větev `monaco`, 23. 11. 2026, nenasazené. Přehled všech států: [docs/countries/README.md](README.md). Pravidla od Báry platí všude, jsou v `CLAUDE.md`.

## Stav a rozhodnutí (dříve CLAUDE.md)

### Monako (větev monaco z portugal, Bára 23. 11. 2026, nenasazené)

- Stát `monaco` (MC): `countries/MC.js` (Francie + monacký Code de la route), `towns/monaco.js`, hranice z OSM
  (`tools/monaco-border.json`, v `states.json` před Francií), OSM balík `mc` (jen R2; viz seznam v `docs/deployment.md`).
- Ortofoto IGN, odhad z OSM; stání jen z OSM (čl. 31: jen na vyznačených místech), bez norem šířek (Monako je nemá),
  značky francouzské kresby bez čísel, jen ty, které monacký kodex zná (bez zóny 30, zone de rencontre, voie verte, dálnice;
  Bára 23. 11. 2026). Měření nemá smysl (8 bodů: schody, pěší cesty, moře; fotky jen u 2).

## Popis zdrojů a pravidel (dříve app/README.md)

### Monako (Bára 23. 11. 2026)

Stát `monaco` (MC), `countries/MC.js` (francouzská nastavení s monackým zákonem), `towns/monaco.js`; hranice podle OSM
(pevnina, admin_level 8, `tools/monaco-border.json`; GISCO má jen 11 bodů), v `states.json` před Francií. OSM balík `mc`
(jen R2). Ortofoto IGN (Francie, pokrývá i Monako). Stání podle zákona jen na vyznačených místech (čl. 31 Code de la
route), proto se neodhaduje; stání na chodníku zakázané (čl. 32). Monako nemá předpisy šířek ulic: bez varování. Značky
kresbou francouzské (Monako se řídí Ženevským protokolem 1949; podoba je pozorování), bez francouzských čísel, jen ty, které
kodex zná: bez zóny 30, zone de rencontre, voie verte a dálnice (Bára 23. 11. 2026); rychlosti 30, 50, 70. Hledání Photon. Pravidla `evaluation/monaco/RULES.md`.
