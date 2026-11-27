# San Francisco: normy a zákon o stání (26. 11. 2026)

Aplikace varuje v San Franciscu jen oranžově a jen tam, kde zdroj čísla opravdu uvádí (`countries/US.js` `limitsSF`).
Washingtonská čísla DDOT (Design and Engineering Manual) v San Franciscu neplatí, proto se tam nepoužívají.

## A. Šířky

| díl | v aplikaci | zdroj |
|---|---|---|
| chodník | základ 10 ft (3,05 m) | SFMTA / DataSF, „Sidewalk Widths (2014)“ (`4g86-grxu`, PDDL): ke každému úseku ulice typ podle Better Streets Plan a nejmenší a doporučená šířka. Rozdělení v datech: Neighborhood Residential 10 / 12 ft (8 617 úseků), Residential Throughway, Commercial Throughway, Neighborhood Commercial, Mixed-use, Downtown Residential 12 / 15 ft, Downtown Commercial 10 / 12 ft, Industrial 8 / 10 ft, Alley 6 / 9 ft. Aplikace typ úseku z dat nezná, proto bere nejčastější nejmenší šířku (10 ft) a v textu uvádí rozpětí; od 26. 11. 2026 (nepřátelská recenze) má ulička z OSM (`service=alley`) svých 6 ft (1,83 m), jiná obslužná cesta žádné varování a průmyslovou ulici aplikace nepozná (dlaždice OSM nemají `landuse`). Citace: minima Better Streets Plan v datech Sidewalk Widths 2014 (studie AECOM pro SFMTA). Samotný dokument Better Streets Plan (2010) jsem neotevřela (web sfbetterstreets.org má prošlý certifikát), čísla jsou jen z dat SFMTA. |
| cyklopruh vedle stání | 5 ft (1,52 m) | NACTO Urban Bikeway Design Guide (stejný text jako ve Washingtonu) |
| pruh pro autobusy | 10–12 ft (3,05–3,66 m) | NACTO Transit Street Design Guide (stejný text jako ve Washingtonu) |
| jízdní pruh, cyklostezka, stání, řadicí pruh | bez varování | vlastní předpis města jsem nenašla/neověřila (SFMTA, Public Works); NACTO bez čísla pro tyto díly |

## B. Zákon o stání

Stejné 3 m na směr jako ve Washingtonu (`freeLane: 3`). Doložení: California Fire Code § 503.2.1 (kalifornské převzetí
International Fire Code) chce u přístupové cesty pro hasiče volnou šířku 20 ft (6,10 m); San Francisco Fire Code ho přejímá
s místními výjimkami, které jsem nečetla. California Vehicle Code (§ 22500 a násl.) volnou šířku vedle stojícího auta
nestanoví (§ 22502: podélně do 18 in od obruby). Kde je digitální obruba SFMTA (stání po stranách), odhad podle zákona se
vypíná (`noParkGuess`), stejně jako u inventáře DDOT.

**Otevřené (Bára):** ověřit San Francisco Fire Code § 503 (místní úpravy šířek) a případně vlastní šířky pruhů SFMTA.
