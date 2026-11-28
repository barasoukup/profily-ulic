# Belgie a Lucembursko (BE, LU)

Stav nasazení: větev `belgium`, 20. 11. 2026, nenasazené. Přehled všech států: [docs/countries/README.md](README.md). Pravidla od Báry platí všude, jsou v `CLAUDE.md`.

## Stav a rozhodnutí (dříve CLAUDE.md)

### Belgie a Lucembursko (větev belgium z netherlands, Bára 20. 11. 2026, nenasazené)

- Státy `belgium` (BE) a `luxembourg` (LU): `countries/BE.js`, `LU.js`, `towns/belgium.js`, `towns/luxembourg.js`,
  `signs-BE/`, `signs-LU/`, `evaluation/belgium/` (ZDROJE, NORMY, ab/), `evaluation/luxembourg/`. Hranice GISCO.
- Žádná mapa povrchů s chodníky jako služba (Brusel UrbIS jen ke stažení, Lucembursko BD-L-TC jen ZIP): odhad z ortofota
  a OSM. Ve Flandrech čáry GRB, ve Valonsku PICC jako kandidáti obrub (`?hrany=0`; A/B: lépe 4, hůř 2 z 10 změněných).
- Ortofoto Flander (i Brusel), Valonska a ACT Lucemburska; hledání Photon. Univerzální ilustrace, bez paneláků.
- Stání: Belgie čl. 25.1, 7° AR 1975 3 m volného průjezdu celkem (AR 1975 platí do 31. 5. 2027, pak nové kódy);
  Lucembursko obecnou šířku nemá (3 m jen u plné čáry): zákonný odhad stání zapnutý (Bára 21. 11. 2026: bez obecné šířky se smí stát skoro všude, aplikace nechává průjezdné pruhy aspoň 3 m).
  Lucemburské značky jsou úřední díla (Bára 21. 11. 2026; Commons u části uvádí CC BY-SA od toho, kdo je nahrál).
- Regiony Belgie podle NUTS 1 (`regions-be.json`, `tools/build_regions_be.mjs`): ortofoto i čáry jen regionu řezu,
  Brusel bez dotazu na čáry. Měření 20. 11.: BE složení 52 %, šířka do 2 m 26 % (nejčastěji chybí stání v úzkých
  ulicích, jeden široký pruh), LU 53 % a 33 % (12 řezů). Recenze `evaluation/belgium/REVIEW.md`.
- viz seznam v `docs/deployment.md`

## Popis zdrojů a pravidel (dříve app/README.md)

### Belgie a Lucembursko (Bára 20. 11. 2026)

Státy `belgium` (BE) a `luxembourg` (LU), `countries/BE.js`, `LU.js`, `towns/belgium.js`, `towns/luxembourg.js`; hranice
GISCO. OSM balíky `be` a `lu` jen na R2. Mapu povrchů s chodníky jako webovou službu nemá ani jeden: profil je odhad
z ortofota a OSM.
- **Ortofoto:** Flandry (WMS Digitaal Vlaanderen, pokrývá i Brusel), jinak Valonsko (ArcGIS export SPW), `lanes-ortho.js`
  zdroj `be` zkouší regiony po sobě (prázdný snímek = mimo region); Lucembursko WMTS ACT (`lu`, z21).
- **Čáry obrub** (`towns/belgium.js`): ve Flandrech GRB WGO (okraj vozovky, pásu chodců a cyklistů, nezpevněné plochy),
  ve Valonsku PICC „Voirie - Ligne“ (okraje vozovky, chodníku, stání, cyklostezky, obruby); Brusel nic. Kandidáti obrub
  v odhadu jako čáry slovenských měst. `?hrany=0` vypne. A/B `evaluation/belgium/ab/` (lépe 4, hůř 2 z 10 změněných).
- **Normy** podle vademek Flander, Valonska a Bruselu a lucemburských směrnic (`evaluation/belgium/NORMS.md`); stání:
  Belgie AR 1975 čl. 25.1, 7° (3 m volného průjezdu celkem), Lucembursko bez obecné šířky. **Značky** `signs-BE/`,
  `signs-LU/`. **Hledání** Photon. Univerzální ilustrace, bez paneláků.
