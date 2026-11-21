# Nepřátelská recenze větve belgium (20. 11. 2026) a co se z ní udělalo

Recenzent prošel `netherlands..belgium`, `npm test` (320/320) a několik dotazů na GRB, PICC, ortofota a Commons.

| Nález | Co se stalo |
|---|---|
| Podkladové ortofoto: Flandry mimo své území bílé, Valonsko pod nimi neviditelné; bílá BE a LU přes sousedy | opraveno: Flandry `transparent`, Valonsko `png32` průhledně, LU pod BE, každá vrstva jen nad svým regionem (`regions-be.json` z NUTS 1); ověřeno, že mimo region je dlaždice průhledná |
| Čáry: zbytečné dotazy na GRB ve Valonsku a v Bruselu, u jazykové hranice jen jeden region | opraveno: region podle bodu (do 2 km oba), Brusel bez dotazu |
| Ortofoto pruhů u jazykové hranice napůl bílé | opraveno: nejdřív region středu řezu |
| Zpráva A/B nesedí s `rezy.json` (pruhy se měnily, le1 bez čar, mo3 sporné) | opraveno: 9 změn čarami, lépe 4, hůř 2, nerozhodně 3; výsledek označen jako slabý |
| BE cyklostezka min. 1,1 m (to je cyklopruh) | opraveno: 1,3 m (Guide cyclable, D7) |
| BE doporučený cyklopruh 1,7 m minimum (jen Flandry) | opraveno: min. 0,7 m (Valonsko), základ 1,7 m |
| BE pruh 3,2 m pro všechny hlavní ulice (zdroj jen pro hlavní silnice Flander) | opraveno: bez varování |
| BE podélné stání 2 m jen odvozené | opraveno: bez varování |
| BE buspruh: Valonsko připouští 2,75 m | opraveno: min. 2,75 m |
| LU cyklostezka min. 1,5 m (to je samostatná trasa) | opraveno: min. 1,2 m vedle vozovky |
| LU zákonný odhad stání bez obecného pravidla | Bára 21. 11. 2026: zapnout, bez obecné šířky se smí stát skoro všude (průjezdné pruhy aspoň 3 m zůstávají) |
| LU licence CC BY-SA bez odkazu a bez vyznačení úprav | Bára 21. 11. 2026: značky jsou úřední díla, CC BY-SA na Commons je jen označení od toho, kdo je nahrál; v patičce se neuvádí |
| E9 je úředně E9a | opraveno v popisku |
| Balík OSM `be` jako celek (0,7 GB PBF) | otevřené: po prvním běhu workflow změřit, případně rozdělit (pod 512 MB) |
| Jednosměrka s cyklisty v protisměru po směru bez tabulky M4 | otevřené (stejný vzor jako NL) |
