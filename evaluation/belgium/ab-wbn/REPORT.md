# A/B: plochy GRB ve Flandrech (WBN + WGO), 24. 11. 2026

## Co GRB má
- **WBN (wegbaan)** není vozovka, ale celý uliční prostor od fasády (hranice pozemku) k fasádě, rozdělený na úseky
  (`TYPE` 2 wegsegment) a křižovatkové zóny (`TYPE` 1 kruispuntzone). Ověřeno v Antverpách: hranice WBN leží na
  budovách GBG.
- Dělení uvnitř dávají jen **čáry WGO (wegopdeling)**: `wcz` pata obruby (okraj zóny chodců a cyklistů), `wrb` okraj
  zpevněného pásu pro auta (nezapisuje se do 0,5 m od `wcz`), `woz` okraj nezpevněné plochy (objectenhandboek GRB).
  Čáry nemají strany a často končí metry před sebou nebo před křižovatkou, takže **plochy chodníků se z nich složit
  nedají**: pokus o rovinný graf (s dotažením volných konců do 6 m) nechával celé ulice jednou plochou.
- Plochy chodníků GRB nemá ani jinde: TRN (terén) jen mimo ulici (zpevněno/tráva), WGA jen přístřešky zastávek, WLI
  jsou zase čáry (horní hrana obruby, zídky). Vyzkoušeno v Gentu a Antverpách.

## Jak se to používá (`app/public/towns/belgium.js`)
Druhy se čtou **podél řezu**: od osy ulice (OSM silnice) ven, každá zkřížená čára dává další druh (silnice → `wrb` →
pás u kraje → `wcz` → chodník; `woz` → zeleň), konec WBN je konec ulice, přechod do sousedního polygonu WBN
(křižovatka) pokračuje stejným druhem. Pás mezi `wrb` a obrubou: do 1,6 m vozovka (žlab), 1,6–3 m stání, širší jiná
zpevněná plocha. Z výsledku tenké plochy podél řezu (MTVU 701/702/704/401/1003), před nimi budovy OSM, za nimi zeleň a
voda OSM. Použije se jen:
- ve Flandrech (regiony podle `regions-be.json`), na silnici pro auta (ne na pěšině, v parku),
- když střed řezu leží ve WBN a **řez přejde obrubu (`wcz`) na obou stranách**.
Jinak zůstane dnešní odhad z ortofota a OSM (s čarami WGO jako kandidáty obrub). WGO se stahuje jednou pro čáry i
plochy (paměť podle výřezu), WBN je jeden dotaz navíc. `?wbn=0` vypne.

## A/B
Vzorek `sample.json` (`sample.mjs`, semínko 20261124 a 20261125): náhodné body do 1,5 km od center Antverp, Gentu, Brugg,
Lovaně a Mechelenu (47 řezů) a kontroly v Bruselu a Lutychu (4). Body v menších městech (Aalst, Kortrijk, Hasselt,
Sint-Niklaas, Turnhout, Oostende) místní balík OSM nepokrývá (žádný profil v obou ramenech), vypadly. A = `?wbn=0`
(dnešní stav), B = s WBN; každý řez hned po sobě (`collect.js`). Data `results/rezy.json`, obrázky `images/` nad
ortofotem Flander (nahoře A modře, dole B červeně; `ORTHO=be` v `evaluation/slovakia/ab/images.mjs`).

**WBN použit u 25 ze 47 řezů, všech 25 se změnilo.** Kontroly v Bruselu a Lutychu beze změny (4/4).

- **Lépe B (10):** an2 Prinsesstraat (chodníky na obou stranách, A měl dva pruhy bez chodníku), ge2 Begijnengracht
  (chybějící chodník), ge4 Zonder-Naamstraat (stání na straně aut), br2 Willemijnendreef (ulice končí u domů, A
  pokračoval 15 m „plochou“), le1 Kapellelaan (A jen dva pruhy), gex3 Beukelaarstraat a gex4 Acaciastraat (stání,
  na ortofotu auta), lex2 a lex3 Tessenstraat (stání vlevo, stromořadí místo „krajnice“), mex3 Hanswijkvaart (chodník
  u vody místo zeleně).
- **Hůř B (2):** ge1 Gasmeterlaan (parkoviště jako 7,45 m chodníku, chodník a cyklostezka spojené do „chodník
  s koly“), lex1 Diestsevest (zmizel zelený střední pás, chodník a cyklostezka spojené).
- **Stejně nebo nerozhodně (12):** an1, an4, ge5, br1, le2, le3, le4, me1, anx1, anx4, brx1, brx3 (hlavně jiné šířky
  o 0,2–0,5 m, `nezname` 0,4–1 m na konci).
- **Bez srovnání (1):** mex2 Koningin Astridlaan: A bez profilu, B hrubý (6 pruhů po 4,5 m a krajnice 10,8 m
  bulváru se souběžnými cestami a parkovišti).

## První verze (zamítnuta)
Bez podmínky obruby na obou stranách a i na pěšinách: 24 řezů, lépe 7, hůř 7 (`results/rezy-v1.json`). Hůř byly cesty
v parcích (an5, br3: nesmyslné pruhy), ulice v jedné úrovni (an7, me3: za `wrb` stání i chodník dohromady, GRB je
nerozliší) a tramvajové ulice (an3, ge6: ztracený pruh nebo chodník). Proto podmínky výše.

## Rozhodnutí a otevřené
**Zapnuto** (lépe 10, hůř 2). Otevřené: zóna za obrubou je pro GRB jedna (chodník i cyklostezka); kde OSM má
`cycleway=track`, vzniká „chodník s koly“ místo chodníku a cyklostezky (ge1, lex1, an1). Střední pás bez obruby
(lex1) GRB nemá. Široké bulváry se souběžnými cestami (mex2) jen hrubě.

Licence: Gratis Open Data Licentie Vlaanderen v1.02, uvádět „Bron: Grootschalig Referentie Bestand Vlaanderen, Digitaal
Vlaanderen“ ([GRB downloaden](https://www.vlaanderen.be/digitaal-vlaanderen/onze-diensten-en-platformen/basiskaart-vlaanderen-grb/grb-downloaden-bestellen),
[GRB webdiensten](https://www.vlaanderen.be/digitaal-vlaanderen/onze-diensten-en-platformen/basiskaart-vlaanderen-grb/grb-webdiensten)).
Kredit řezu `beTown: grb` v `credits.js`.
