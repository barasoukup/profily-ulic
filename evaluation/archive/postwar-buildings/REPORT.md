# Poválečný bytový dům (Bára 23. 11. 2026)

Socialistické vzhledy domu (sorela 1948–57, zděný bytový dům 50.–60. let, panelák) jen tam, kde se stavěly: Česko,
Slovensko, Polsko, Estonsko a bývalá NDR (`countries/<ISO>.js` `socialistLooks`, v Německu podle `city.panels`).
Jinde, i v „cizině“, platí jedno pravidlo `profile.js` `westernLook` místo jedenácti stejných `houseLook`:

| odvozený vzhled | rok domu | vzhled mimo socialistické státy |
|---|---|---|
| sorela, zděný dům 50.–60. let | – | poválečný bytový dům |
| panelák (deska) | 1946–90 nebo neznámý | poválečný bytový dům |
| panelák (deska) | před 1946 / po 1990 | funkcionalistický / moderní |
| funkcionalistický činžák | 1946–90 | poválečný bytový dům |
| kancelář | – | kancelář |

Nový vzhled `povalecny` („poválečný bytový dům“, 18. vzhled, ručně volitelný všude): hladká světlá omítka bez ozdob,
pravidelné řady širokých oken s roletami (skříň rolety nad oknem, některé napůl stažené), balkonové dveře u ulice,
balkony v patrech s plechovým zábradlím v barvě doby (modrošedá, cihlová, hořčicová, zelená, šedá), prosklené vstupní
dveře po dvou schodech pod tenkou stříškou, plochá střecha s tenkou atikou a plechovou lištou. Bez spár panelů a bez
strojovny výtahu (panelák), bez obkladu, výkladce a pásových parapetů (funkcionalismus).

Snímky (kresba aplikace, stejná ulice):
- `zapad-pred.png`: poválečné domy v Rakousku, Francii, Španělsku… dřív (funkcionalistický činžák),
- `zapad-po.png`: teď (poválečný bytový dům),
- `srovnani-povalecny-panelak.png`: poválečný dům vlevo proti českému paneláku vpravo,
- `madrid-moratalaz-aplikace-po.png`: skutečný řez v aplikaci (Madrid, Calle del Corregidor Juan de Bobadilla,
  9 podlaží, rok z katastru), velikost jako v aplikaci.
- `povalecny.png` (23. 11. 2026, po kritice, `node evaluation/archive/regional-buildings/render.mjs povalecny`): Vídeň 5 a 8 podlaží,
  Madrid s ustoupeným podlažím (okno v ose oken pod ním, terasa se zábradlím). Kritik (3 kola, viz
  `../regional-buildings/REPORT.md`) bez vážných výhrad; drobné: balkonové dveře užší, vídeňské domy mívají spíš lodžie.

Česko beze změny: `node evaluation/ortho-osm/regression.mjs` před a po stejný výstup, testy budov Prahy a měst beze
změny; nový test `tests/house-looks.test.js` (CZ, SK, PL, EE, východ DE proti AT, FR, ES, IT, západu DE a cizině).
Aplikace nemá tmavý režim (profil se kreslí vždy na světlém podkladu), proto snímky jen ve světlém.

Otevřené: v cizině bez roku z dat dostane dům z let 1946–57 s neznámou střechou dál šikmou střechu (`abroadStyle`),
plochý dům bez roku a bez tvaru desky zůstává funkcionalistický (např. Vídeň, Am Schöpfwerk: OSM rok nemá).
