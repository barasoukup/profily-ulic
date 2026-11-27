# Nepřátelská recenze větve netherlands (20. 11. 2026) a co se z ní udělalo

Recenzent prošel `65cdd79..HEAD`, `npm test` a asi 15 dotazů na PDOK, 3D BAG a Amsterdam. Česko ani jiné státy změny
nerozbíjejí (site.js, search.js, app.js beze změny chování mimo NL, CSP úplná).

| Nález | Co se stalo |
|---|---|
| Tramvajové těleso: chyběl `sneltram`, kolej se hledala jen ve vrcholech (úseky až 178 m), těleso `spoorbaan` bylo železnice | opraveno: tram i sneltram, kolej po metrech, spoorbaan s kolejí = těleso (test) |
| Ulice se středním pásem pod středem řezu BGT nedostaly | opraveno: pod zelení nebo pásem se ulice hledá do 10 m (Nassauplein s pásem 16 m dál odhad) |
| BGT na pěších plochách a v průchodech (všechny 4 horší řezy A/B) | opraveno: samotný chodník nestačí, vozovka, stezka, stání nebo těleso do 4 m; A/B znovu: hůř 0 |
| BAG rok 1005 (neznámý) a zbořené nebo jen povolené domy; BGT `status: plan` | opraveno: rok > 1005, jen stojící domy, jen `bestaand` |
| BAG a 3D BAG bez vypínače | opraveno: `?bag=0`; A/B pokrytí `ab/BUDOVY.md` (podlaží 6 → 31 ze 40 fasád, rok 0 → 39) |
| Hloubka kabelů osvětlení 60 cm „přesnost neznámá“ kreslená jako změřená | opraveno: neznámá přesnost = obvyklá hloubka čárkovaně; stoky jen „In bedrijf“ |
| Cyklopruh: citace 1,5 m jako ASVV | opraveno: „ASVV 2021 nejméně 2 m, starší CROW 1,5 m“; hodnoty u stání jen vedle podélného |
| Zelený ostrůvek jako zpevněný | opraveno (test) |
| Zpráva A/B: Rotterdam 4, ne 3 | opraveno |
| Úroveň (most, werf v Utrechtu) podle pořadí odpovědi | opraveno: úroveň z OSM `bridge`/`tunnel`/`layer`, z ploch BGT pod středem nejbližší (test) |
| Krabice sítí Amsterdamu bere Amstelveen a Diemen | otevřené (tam prostě nic není); hranice obce chybí v `towns.json` |
| Hledání: nizozemský text jde i do ZBGIS a Photonu, adresa PDOK neřeže na ulici | opraveno: co najde PDOK, se Photonu ani ZBGIS neposílá; adresa i ulice nesou jméno ulice a řez se k ní přichytí (ověřeno: Oudegracht 10 v Utrechtu) |
| Zákonný odhad stání bez měření, měření přesnosti `mereni-presnosti` chybí | změřeno 20. 11.: složení 52 %, šířka do 2 m 41 % (`evaluation/universal/ZPRAVA.md`); chybějící stání mezi šesti nejčastějšími rozdíly není, stání navíc 5× |
| Obousměrná cyklostezka hodnocená jednosměrnými 2/2,2 m | otevřené: směr stezky segment nemá, text uvádí obě hodnoty |
