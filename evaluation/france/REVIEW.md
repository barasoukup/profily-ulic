# Nepřátelská recenze větve france (22. 11. 2026) a co se z ní udělalo

Recenzent (Fable) prošel `poland..france`, `npm test` (328/328) a ověřil pořadí souřadnic, třídy Plan de voirie, CSP,
regiony Geofabriku a hranici několika dotazy. Chybu, která by Francii rozbila, nenašel.

| Nález | Co se stalo |
|---|---|
| Dvojitá cyklostezka: „Piste cyclable“ z mapy a cyklopruh z OSM na téže straně (Rue de Cléry, Avenue de la Bourdonnais) | opraveno obecně v `derive.js`: cyklostezka z mapy hned u obruby nahrazuje cyklopruh z OSM na té straně (`?off=kolodvakrat`); A/B znovu: změnily se jen tyto 2 řezy (`ab/results/b-po-recenzi.json`) |
| Široká vozovka z mapy jako „pruh 4 m + krajnice 5–6 m“ (Bd de Magenta, Rue de Castiglione), buspruh mapy („Couloir bus“) se ztratí | částečně opraveno 23. 11. (`ab/boulevards/REPORT.md`): stání z evidence parkovacích míst, buspruh z krajnice; krajnice u 10 z 26 bulvárů zůstávají |
| Bulvár se středovou promenádou (Bd de Rochechouart) končí za terre-plein, druhá vozovka chybí | opraveno 23. 11.: dosah 35 m na straně končící ve středovém pásu, vozovka jen pro autobusy jako druhá polovina ulice |
| Výška domu z BD TOPO se zahodí bez `nombre_d_etages`, počet podlaží je zašuměný | opraveno: bez počtu nebo mimo 2,4–5 m na podlaží rozhoduje výška (asi 3 m na podlaží) |
| Llívia (španělská enkláva) jako Francie | opraveno: hranice Francie i s vnitřními prstenci, test |
| Minimum chodníku 1,2 m (platí jen bez zdi a překážek po obou stranách) | opraveno: 1,4 m, základ 1,8 m (Paříž); v popisku „znění z roku 2007“ |
| „Dovoleno jen na vyznačených místech“ R417-11 neříká | opraveno: „velmi obtěžující stání, přestupek 4. třídy“; francouzsky „stationnement très gênant“, ve 23 jazycích |
| Chybějící vrstvy Plan de voirie (ostrůvky, oddělovače, rampy, 589 ploch bez třídy) | otevřené (`docs/backlog.md`), nejspíš i „plocha 0,65 m“ u fasády |
| `looksFrench` chytá é a ô (čeština, slovenština) | opraveno, test |
| Kostel jako kancelář, obchodní dům jako hala | opraveno, test |
| Jednosměrka se 2+ pruhy varovala pod 3 m | opraveno: 2,5 m (Grand Lyon, double voie) |
| Cyklopruh červeně až pod 1 m (pařížská výjimka) | opraveno: 1,2 m (Grand Lyon) |
| Cyklostezka obousměrná nerozlišená | otevřené (aplikace směr stezky nezná) |
| `c8a` jako B22a (povinná), většina stezek C113 (doporučená) | ponecháno: OSM to nerozlišuje; C113.svg nepřevzaté |
| Licence značek: Francie nemá výslovný paragraf o úředních dílech | **(Bára)** potvrdit pro Francii zvlášť (u Lucemburska rozhodla, že značky jsou úřední díla) |
| Stránkování Opendatasoft bez řazení | ponecháno: do 13 záznamů na vrstvu a okno, jedna stránka |
| Memo podle přesného okna | opraveno: okno zaokrouhlené na 4 desetinná místa |
| Aktuálnost mapy (Ville de Paris úplnost nezaručuje) | zapsáno v `SOURCES.md` |
| Zpráva A/B: výhry neprošly stejnou kontrolou jako prohry, vzorek jen do 4 km, posuzovatel bez fotek | zpráva doplněna; cílené řezy (mosty přes Périphérique, nábřeží) otevřené v `docs/backlog.md` |
| Quai aux Fleurs: druhá vozovka v nižší úrovni (mapa úrovně nemá) | otevřené (`docs/backlog.md`) |
