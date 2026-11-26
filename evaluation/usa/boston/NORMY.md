# Boston: normy šířek (26. 11. 2026)

Aplikace v metru Bostonu (`city.id` `boston` a `bostonmetro`, `countries/US.js limitsBoston`) varuje **jen oranžově** podle
Boston Complete Streets Guidelines (Boston Transportation Department, 2013). Jsou to zásady pro návrh ulic města Bostonu,
aplikace čte i stávající ulice a sousední města (Cambridge, Somerville, Brookline …), proto žádné červené minimum. Čísla
jsou přečtená přímo z listů příručky (staženo z boston.gov / d8-dev2.boston.gov, 26. 11. 2026):

**„Preferred and Minimum Widths for Sidewalk Zones“, s. 23** (`Preferred and Minimum Widths for Sidewalk Zones.pdf`):

| typ ulice | průchozí pás (Pedestrian Zone) pref. / min. | celkem pref. / min. |
|---|---|---|
| Downtown Commercial | 12′ / 8′ | 20′6″ / 10′ |
| Downtown Mixed-Use | 10′ / 8′ | 18′6″ / 10′ |
| Neighborhood Main | 8′ / 5′ | 16′6″ / 7′ |
| Neighborhood Connector | 8′ / 5′ (4′) | 15′6″ / 7′ |
| Neighborhood Residential, Industrial | 5′ / 5′ (4′) | 11′6″ / 7′ |
| Parkway | 6′ / 5′ | 16′6″ / 10′6″ |
| Boulevard | 6′ / 5′ | 18′6″ / 11′6″ |

„5′ is the preferred minimum width of the Pedestrian Zone in the City of Boston“ (ADA 4′ jen výjimečně).
Aplikace: chodník oranžově pod 7 ft (2,13 m) celkem; v textu i 10 ft v centru a 5 ft průchozího pásu (typ ulice
podle Bostonu aplikace nezná).

**„Minimum Widths for Roadway Lanes“, s. 103** (arterial a collector; local bez vodorovného značení):
autobusový pruh 11′ (jen arterial), řadicí pruh 10′, jízdní pruh 10′ (11–12′ při více než 8 % těžkých vozidel),
cyklopruh 5′ (6′ při silném provozu kol, 4′ jen mimo tepny bez stání), stání 7′; společný pruh bus a kola 12′, lépe
13–15′. Aplikace: pruh 3,05 m, řadicí 3,05 m, bus 3,35 m, bus a kola 3,66 m, cyklopruh 1,52 m, podélné stání 2,13 m.

**Nenalezeno (bez varování):** šířka cyklostezky (separated bike lane) a společné stezky (kapitola 3 příručky ve
čteném rozsahu ani listy je neuvádějí; MassDOT Separated Bike Lane Planning & Design Guide 2015 jsme nepřečetli), kolmé
a šikmé stání.

**Stání podle zákona (`freeLane`):** pravidlo Massachusetts nebo Bostonu o volném pruhu vedle stojícího auta jsme
nenašli doložené (Boston Traffic Rules, 720 CMR, 527 CMR / NFPA 1 se nepodařilo přečíst). Zůstává společné nastavení
státu USA z Washingtonu: 3 m na směr (IFC 503.2.1, 18 DCMR § 2405), tedy ne zákon Massachusetts. **(Bára)**
