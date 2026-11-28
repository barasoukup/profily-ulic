# Kypr (CY)

Stav nasazení: větev `cyprus`, 23. 11. 2026, nenasazené. Přehled všech států: [docs/countries/README.md](README.md). Pravidla od Báry platí všude, jsou v `CLAUDE.md`.

## Stav a rozhodnutí (dříve CLAUDE.md)

### Kypr (větev cyprus z monaco, Bára 23. 11. 2026, nenasazené)

- Stát `cyprus` (CY): `countries/CY.js`, `towns/cyprus.js`, `signs-CY/`, `evaluation/cyprus/` (ZDROJE, NORMY). Hranice z OSM
  (`tools/cyprus-border.json`): sever je samostatný stát, který zatím nemáme; Pyla a nárazníková zóna mimo (Bára 23. 11.).
  OSM balík `cy` (jen R2; viz seznam v `docs/deployment.md`).
- **Jízda vlevo** jako vlastnost státu (`leftHand`): nic se nepřesouvá, jen se otáčí směry (Bára 23. 11. 2026).
- Ortofoto DLS 2019 (Bára: novější, licence neuvedená), budovy DLS s podlažími, Photon. Normy jen doporučení příručky.
- Měření 23. 11. (11 řezů v 5 městech): složení 56 %, pruhy 91 %, šířka do 2 m 27 % (promenády a pěší ulice); chybí
  chodník 9×, stání 5×.

## Popis zdrojů a pravidel (dříve app/README.md)

### Kypr (Bára 23. 11. 2026)

Stát `cyprus` (CY), `countries/CY.js`, `towns/cyprus.js`; hranice z OSM (území republiky a britské základny,
`tools/cyprus-border.json`): **sever je samostatný stát, který zatím nemáme** (`states.json` `closed_cy`: profil se nedělá a aplikace to řekne); nárazníkovou zónu OSN hranice OSM zčásti zahrnuje (Pyla, Mammari, letiště Nikósie: odhad z OSM, ortofoto tam není).
**Jízda vlevo** (`leftHand`): díly zůstávají tam, kam je dala data (Bára: „Přesouvat nesmíš nic, jen otáčet směr“);
pravidla, která směr odvozují (polovina vozovky u obousměrné osy, `lanes:forward`, rozdělení pruhu z ortofota, krajnice
dělené silnice, strana odhadu stání na jednosměrce), počítají rovnou s jízdou vlevo; jednosměrné osy jedou podle své
geometrie a seznamy po pruzích (`turn:lanes`, `bus:lanes`) se čtou od řidičovy levice, tedy od obruby (recenze 23. 11.). Ortofoto DLS 2019
(dlaždice, asi 12 cm; licence neuvedená, Bára: novější), budovy DLS (podlaží, výška, typ; CC BY 4.0), hledání Photon.
Normy jen z příručky odboru veřejných prací (doporučení; chodník bez červené, 2 / 2,5 m oranžově podle třídy ulice,
pruh 3 / 3,5 m, cyklopruh v protisměru 2 m), stání bez varování; stání na chodníku zakázané. Značky `signs-CY/`
(kyperský Kodex nečísluje, britské kresby pod OGL v1.0 s uvedením zdroje v patičce i v exportu; jednosměrka s cyklisty v protisměru
bez značky, C 10a podle strany chodců). Měření přesnosti `evaluation/cyprus/REPORT.md`.
