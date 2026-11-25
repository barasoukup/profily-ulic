# Slepé posouzení příčných profilů

U každého čísla: `<n>-ortho.jpg` (ortofoto, ulice svisle, řez je žlutá čárkovaná vodorovná čára, strana A vlevo, B vpravo,
10 px = 1 m, značky po 1 m, delší po 5 m), fotky z ulice `<n>-f.jpg` (dívá se nahoru v ortofotu, A vlevo) a `<n>-b.jpg`
(opačně, A vpravo), pokud jsou; fotka může být starší nebo odjinud, pak platí ortofoto. Dva profily X a Y od A do B, díly a
šířky v metrech. Nevíš a nezjišťuj, odkud jsou.

Díly: chodnik; zelen (tráva, keře), stromorad (pás se stromy); parkovani (stání u obruby); pruh (jízdní pruh);
pruh_piktokoridor; krajnice (nepojížděný okraj vozovky); cyklopruh (na vozovce); cyklostezka (mimo vozovku nebo oddělená); stezka_sdilena,
chodnik_kola; delici (dělicí pás, ostrůvek, svodidla); nastupiste; bus; plocha (jiná zpevněná plocha); nezname; predzahradka.

Posuzuj skutečnost v řezu podle pravidel univerzálního měření: každá část široká aspoň asi 0,5 m včetně pásu trávy nebo
stromů mezi chodníkem a obrubou; jednotlivé jamky stromů v dlažbě jsou chodník; stání tam, kde je pruh u obruby určený
ke stání (značení, zálivy, stojící auta na fotce či ortofotu), jinde ne; každý jízdní pruh zvlášť; dělicí pás jen fyzický.
Na straně bez fasády se hodnotí jen po okraj ulice (vozovka a chodník u ní); co je za ním, se nepočítá.

Který profil lépe odpovídá (nejdřív složení a pořadí dílů a počet pruhů, potom šířky)? `X`, `Y`, `stejne`, nebo `nejde`, když
podklady nestačí. Prohlédni ortofoto a každou fotku. Výstup jeden JSON řádek na číslo:
`{"n": 1, "verdict": "X", "jistota": "vysoka|stredni|nizka", "why": "krátce česky"}`
