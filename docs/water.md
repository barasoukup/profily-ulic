# Hospodaření s vodou a rozhraní

Průlehy, rýhy, retenční nádrže, propustné povrchy a jednodušší rozhraní.

## Hospodaření s vodou a jednodušší rozhraní (Bára 12. 11. 2026)

- Podnět Magdaleny podle pražských Standardů HDV (kap. 5.1): v Návrhu průleh, rýha, retenční nádrž; pod povrchem
  podzemní rýha, nádrž, šachta (ve skutečné velikosti a hloubce, rozměr v „Další volby“, výchozí odhad schválený Bárou);
  propustná dlažba a nezpevněný povrch (i ve Stavu z OSM `surface`). Retenční nádrže z dat zůstávají vodou.
- Se sítěmi varování: překryv červeně, blíž než 0,5 m oranžově (Bářina hranice upozornění, Standardy odstupy nedávají).
- Nové stromy v Návrhu u sítí podle Pražských stavebních předpisů, příloha č. 1, bod I (vzdálenost od paty kmene po
  druzích sítí; oranžově jen s kořenovou bariérou/chráničkou, červeně blíž). Bára 13. 11. 2026: „to někde musí být
  pečlivě rozepsáno“.
- Trakční sloup dál než 4 m od kolejí drží vodorovné příčné lano (ke sloupu naproti, jinak k domu, jinak končí u
  kolejí), ne výložník nad auty; koleje se sloupy mezi sebou (Olšanská) lano nemají (Bára 13. 11. 2026).
- Rozhraní po kritice Fable: karta části s „Další volby“, paleta za „+ Přidat díl“, bez panelu okrajů, Sdílet + menu
  Soubor, patička na jeden řádek.  Pěší, přechody a průchozí šířka chodníku
  na pozdější brainstorming.

## Hospodaření s vodou

Do Návrhu lze přidat prvky modrozelené infrastruktury podle pražských Standardů hospodaření se srážkovými vodami
(MHMP, ČVUT FSv, kap. 5.1; podnět Magdaleny, Bára 12. 11. 2026). Data je neznají, takže jsou jen v návrhu:
- části v paletě „Hospodaření s vodou“: vsakovací průleh (5.1.5), vsakovací rýha (5.1.6), retenční nádrž (5.1.10);
- „Pod povrchem“ u zeleně, chodníků, parkování a dalších částí: podzemní rýha (5.1.7), podzemní retenční nádrž (5.1.11),
  vsakovací šachta (5.1.9); průleh s rýhou pod sebou je 5.1.8;
- „Propustný povrch“ u chodníků, ploch a parkování (5.1.2) a přístřešek zastávky se zelenou střechou (5.1.1).
Ze všeho jen povrch umí i Stav: zatravňovací dlažba z OSM (`surface=grass_paver`, v Česku asi 300 parkovišť a 900 cest)
je propustná dlažba, nezpevněný povrch (`unpaved, compacted, fine_gravel, gravel, ground, dirt, earth, woodchips…`;
Bára: mlatové cyklostezky a pěšiny také vsakují) zvlášť „nezpevněný“ (`segment.permeable` `true` / `"nezpevneny"`);
`derive.js` podle plochy pod středem části nebo cesty, která ji kříží. V editoru výběr „Povrch“. Průlehy, rýhy ani šachty v datech
nejsou (OSM 0, otevřená data měst nic; Brno má jen body dotovaných zelených střech a dešťovek, Bára: nevyužívat),
retenční nádrže zůstávají vodou.
Kreslí se zjednodušeně (Magdalena: kvůli měřítku zjednodušit): průleh jako mělká prohlubeň s výsadbou, nádrž s vodou
a rákosem; podzemní objekty ve skutečné velikosti a hloubce, ve stejném měřítku a od stejné nuly jako sítě pod zemí
(Bára 12. 11. 2026), i bez sítí se pod ulicí ukáže zemina s metry. Rozměr se nastaví v „Další volby“ (šířka, od hloubky,
výška; `segment.underSize`), výchozí je odhad: rýha 1,5 m široká v hloubce 0,4–1,4 m (příklad ve Standardech má rýhu
1,5 m s nadržením 0,5 m), nádrž přes šířku části bez 0,3 m z každé strany v hloubce 0,8–2,3 m, šachta 1 m v hloubce
0,5–3 m; Standardy rozměry neurčují, dává je výpočet. Se zapnutými sítěmi Návrh upozorní, když objekt narazí na síť
(červeně, překryv s kreslenou sítí) nebo je k ní blíž než 0,5 m (oranžově; Bára 12. 11. 2026: varovat i při blízkosti;
Standardy kap. 6.2.9 jen žádají střety se sítěmi a ochrannými pásmy prověřit, odstupy nedávají, 0,5 m je hranice
upozornění, ne ochranné pásmo), sítě se kreslí přes objekty, aby byl střet vidět. Stejně se hlídají nové stromy
z Návrhu (strom v části i stromořadí, kde Stav do 1 m strom nemá; Bára 13. 11. 2026) podle Pražských stavebních
předpisů (souhrnné znění IPR 2025/01, příloha č. 1, bod I, minimální vzdálenost podzemní sítě od paty kmene, měřeno
napříč ulicí k okraji sítě): vodovod 2,5 m (1,0 m s technickým opatřením), kanalizace 2,5 m, stoka do DN 500 1,5 m
(blíž s kořenovou bariérou, hlubší než 6 m nevadí), plynovod NTL a STL 1 m, VTL 4 m, teplovod 2,5 m (oboje bez
opatření), silnoproud do 22 kV, veřejné osvětlení a elektronické komunikace 1,0 m (0,5 m), 110 kV 1,5 m (1,0 m),
kolektor s nadložím pod 5 m 3,0 m (1,5 m). Blíž než bez opatření oranžově (jen s kořenovou bariérou nebo chráničkou),
blíž i než s opatřením červeně. Produktovody a potrubní pošta v předpisech nejsou; nadzemní vedení („nadz.“) se
mezi sítě pod zemí neberou; kabel protikorozní ochrany plynovodu je kabel; síť v chráničce má opatření už v sobě;
stoka neznámého průměru bere 2,5 m; strom mezi dvěma stěnami „tělesa kolektoru“ stojí nad kolektorem; kolektor
neznámé hloubky nejvýš oranžově. Za stávající se strom bere podle polohy od A (do 1 m), takže strom posunutý
v Návrhu rozšířením sousední části o víc se hlásí jako nový.
Dále modré šipky ukazují přítok ze zpevněných ploch vedle; pod zelení, stromořadím, předzahrádkou a průlehem je ornice, pod travnatým tramvajovým tělesem ornice a štěrkové lože
s pražci, štěrkové těleso je štěrkové až dolů (Bára: žádný beton pod zelení); zatravňovací
dlažba jako pás betonových tvárnic s trávou mezi nimi (Bára: na první pohled něco mezi parkováním a trávníkem). Ilustrace (zelená střecha přístřešku, výsadba průlehu, rákos) kreslila
„kreslířka“ ve třech kolech s „kritikem“ podle fotek z Wikimedia Commons.
