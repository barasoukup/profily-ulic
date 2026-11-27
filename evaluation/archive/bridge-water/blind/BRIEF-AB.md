# Slepé posouzení příčných profilů

U každého čísla: `<n>-ortho.jpg` (ortofoto, ulice svisle, řez je žlutá čárkovaná vodorovná čára, strana A vlevo, B vpravo,
10 px = 1 m, značky po 1 m, delší po 5 m), fotky z ulice `<n>-f.jpg` (dívá se nahoru v ortofotu, A vlevo) a `<n>-b.jpg`
(opačně, A vpravo), pokud jsou; fotka může být starší nebo odjinud, pak platí ortofoto. Dva profily X a Y od A do B, díly a
šířky v metrech. Nevíš a nezjišťuj, odkud jsou.

Díly: chodnik; zelen; stromorad (pás se stromy); parkovani; pruh (jízdní pruh); obsluzna; pruh_piktokoridor (jízdní pruh);
krajnice (nepojížděný okraj vozovky); cyklopruh (na vozovce); cyklostezka (mimo vozovku nebo oddělená); stezka_sdilena,
chodnik_kola; delici (dělicí pás, ostrůvek, svodidla); nastupiste; bus; plocha (jiná zpevněná plocha); nezname;
predzahradka, zahradka; voda.

Nejdřív si z podkladů sám urči, co v řezu od A do B skutečně je, teprve pak čti profily. Který z nich lépe odpovídá
skutečnosti (nejdřív složení, pořadí dílů a počet jízdních pruhů, potom šířky)? Na straně, kde ulice nekončí fasádou, se
hodnotí jen po okraj ulice. Odpověz `X`, `Y`, `stejne`, nebo `nejde`, když podklady nestačí. Prohlédni ortofoto a každou
fotku. Výstup jeden JSON řádek na číslo:
`{"n": 1, "verdict": "X", "jistota": "vysoka|stredni|nizka", "why": "krátce česky"}`
