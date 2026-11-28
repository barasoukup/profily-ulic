# Francie (FR)

Stav nasazení: větev `france`, 22. 11. 2026, nenasazené. Přehled všech států: [docs/countries/README.md](README.md). Pravidla od Báry platí všude, jsou v `CLAUDE.md`.

## Stav a rozhodnutí (dříve CLAUDE.md)

### Francie (větev france z poland, Bára 22. 11. 2026, nenasazené)

- Stát `france` (FR): `countries/FR.js`, `towns/france.js`, `search-fr.js`, `signs-FR/`, `evaluation/france/` (ZDROJE, NORMY,
  ab/). Hranice GISCO (pevnina a Korsika). OSM po 22 regionech (`fr_*`, jen R2). viz seznam v `docs/deployment.md`
- Ortofoto IGN (Géoplateforme, CORS *, mimo Francii bílé: v mapě jen nad Francií), budovy BD TOPO (`?bdtopo=0`),  hledání Géoplateforme (BAN).
- Mapa povrchů Paříže (Plan de voirie, ODbL, `in_bbox` po 100 záznamech; třída „Piste“ jsou zálivy stání): A/B 40 řezů,
  použita ve 28: lépe 5, hůř 2 (sporné: tmavé asfaltové chodníky), stejně 17; zapnutá, `?paris=0`.
- Normy: závazná jen přístupnost (arrêté 2007), jinak CEREMA a příručky Paříže a Lyonu (z druhé ruky, označeno), pruhy jen
  oranžově, tramvaj bez varování. Stání odhadem jako LU a PL. Značky jako úřední díla (jako LU). Bez paneláků.
- Měření 22. 11. (25 řezů v 10 městech): složení 57 %, šířka do 2 m 48 %; nejčastěji chybí chodník (10×) a stání navíc (8×).
- Recenze `evaluation/france/REVIEW.md`: opravena dvojitá cyklostezka (mapa + cyklopruh OSM, obecně v `derive.js`,
  `?off=kolodvakrat`), Llívia, výšky BD TOPO, normy.
- Bára 23. 11. 2026: paneláky ne (sídliště vypadají jinak než česká), značky volně (úřední díla), doporučení měst smí
  varovat v celé Francii. Bulváry a krajnice (`evaluation/france/ab/boulevards/REPORT.md`): stání z pařížské evidence
  parkovacích míst (`?parisstani=0`), delší dosah hlavních ulic končících ve středovém pásu (dnes `app.js widerSides`), vozovka jen
  pro autobusy jako druhá polovina ulice (`?off=busduo`) a buspruh z krajnice (`?off=buskrajnice`; obojí obecně, Praha
  a Brno beze změny). Krajnice zůstávají u 10 z 26 bulvárů (široké vozovky bez čar na ortofotu); vypnout je bylo horší.

## Popis zdrojů a pravidel (dříve app/README.md)

### Francie (Bára 22. 11. 2026)

Stát `france` (FR), `countries/FR.js`, `towns/france.js`, `search-fr.js`; hranice GISCO (pevninská Francie a Korsika, za
Německem, Švýcarskem, Belgií a Lucemburskem). OSM po 22 regionech Geofabriku (`fr_*`, jen R2). Ortofoto IGN (Géoplateforme
WMS-Raster v Web Mercatoru, `lanes-ortho.js` zdroj `fr`; mimo Francii bílé, proto v mapě jen nad Francií).
- **Mapa povrchů Paříže** (Plan de voirie, opendata.paris.fr: vozovky, chodníky, cyklostezky, buspruhy, zálivy stání
  „Piste“, střední pásy) tam, kde má u středu řezu vozovku, cyklostezku nebo stání (`?paris=0`). Ostatní města (Lyon,
  Bordeaux, Nantes, Toulouse) zatím ne.
- **Stání v Paříži** z evidence parkovacích míst města (`stationnement-voie-publique-emplacements`, ODbL): úsek stání ve
  vozovce do 5 m od řezu u obruby = stání té hloubky a způsobu, obruba bez úseku stání nemá (`derive.js kerbParking`,
  `?parisstani=0`). Mapa povrchů počítá podélné stání do vozovky a ortofoto IGN na bulvárech čáry nenajde (stín, Paříž
  je často nemaluje), takže bez evidence zbylo stání jako krajnice.
- **Hlavní ulice** (primary, secondary): strana, která skončí dosahem ve středovém pásu, promenádě nebo chodníku, sahá
  35 m, když ulice za dosahem pokračuje (bulvár s promenádou; od 25. 11. 2026 všude stejné pravidlo podle dat řezu, ne
  státu: `app.js widerSides`, `evaluation/archive/unification/REPORT.md`; za dosahem není mapa povrchů, nebo je tam druhá vozovka
  téže ulice z OSM, nebo plochy ulice z mapy pokračují až k vozovce; totéž dálnice a silnice pro motorová vozidla). Vozovka jen pro autobusy se stejným jménem je druhá polovina ulice, když
  jiná není (`?off=busduo`, obecně); krajnice aspoň 2,75 m u obruby s buspruhem z OSM je buspruh (`?off=buskrajnice`,
  obecně). Zpráva `evaluation/france/ab/boulevards/REPORT.md`.
- **Budovy** z BD TOPO IGN (podlaží, výška, rok, byty, užití; `?bdtopo=0`).
- **Normy:** závazná je jen přístupnost (arrêté z 15. 1. 2007: chodník 1,4 m, 1,2 m bez překážek); cyklistika podle
  doporučení CEREMA a příručky Paříže 2023, stání podle Paříže, pruhy jen oranžově podle Grand Lyon 2010. **Stání:**
  zákon (Code de la route R417-10, R417-11) volnou šířku nemá, odhad jako v Lucembursku; auto na chodníku je „très
  gênant“. **Značky** `signs-FR/` (úřední díla). **Hledání** Géoplateforme (BAN). Bez paneláků, univerzální vozidla.
