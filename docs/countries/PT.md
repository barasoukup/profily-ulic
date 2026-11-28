# Portugalsko (PT)

Stav nasazení: větev `portugal`, 23. 11. 2026, nenasazené. Přehled všech států: [docs/countries/README.md](README.md). Pravidla od Báry platí všude, jsou v `CLAUDE.md`.

## Stav a rozhodnutí (dříve CLAUDE.md)

### Portugalsko (větev portugal ze spain, Bára 23. 11. 2026, nenasazené)

- Stát `portugal` (PT): `countries/PT.js`, `towns/portugal.js`, `signs-PT/`, `evaluation/portugal/` (ZDROJE, NORMY). Hranice
  GISCO s Madeirou a Azorami, OSM jeden balík `pt` (jen R2). viz seznam v `docs/deployment.md`
- Ortofoto DGT: nejnovější let, který místo má (2025 pevnina, 2021 sever, 2018, satelit 2023); Madeira a Azory bez ortofota.
  Mapu povrchů žádné město online nemá: jen odhad. Hledání Photon. Stání Lisabonu (EMEL) a buspruhy Porta jen jako soubory.
- Měření 23. 11. (29 řezů v 10 městech): složení 63 %, šířka do 2 m 55 %; nejčastěji chybí stání (16×) a chodník (13×).
- Bára 23. 11. 2026: chodník červeně pod 1,5 m všude, cyklostezky podle IMT a LNEC 2024 (1,75 / 2 m, obousměrná 3 m),
  stání 3 m na směr, pěší zóna značkou G5a (zóna zákazu vjezdu).

## Popis zdrojů a pravidel (dříve app/README.md)

### Portugalsko (Bára 23. 11. 2026)

Stát `portugal` (PT), `countries/PT.js`, `towns/portugal.js`; hranice GISCO s Madeirou a Azorami. OSM jeden balík `pt`
(Geofabrik i s ostrovy, jen R2). Ortofoto DGT (WMS, CORS *, CC BY): nejnovější let, který místo má (2025 celá pevnina
25 cm, 2021 sever, 2018, satelit 2023; bílý snímek = žádný; jen na pevnině), v mapě jen let 2025. Madeira a Azory ortofoto DGT
nemají (jejich služby: nejasná licence, bez CORS). Žádné město nemá mapu povrchů online (`evaluation/portugal/SOURCES.md`),
profil je odhad z ortofota a OSM. Hledání Photon.
- **Normy:** chodník 1,5 m závazně u hlavních a sběrných ulic (DL 163/2006; 1,2 m u každé pěší trasy), jinak doporučení
  IMT a příručky Lisabonu. **Stání:** čl. 49–50 Código da Estrada (bez čísla; 3 m u plné čáry), bráno jako 3 m na směr.
  **Značky** `signs-PT/` (RST, úřední díla); pěší zónu Portugalsko nemá (G5a zóna zákazu vjezdu), obytná i sdílená zóna H46.
