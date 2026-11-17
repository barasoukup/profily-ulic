# Posuzování profilů podle snímků z ulice: pražský pilot (17. 11. 2026)

**Otázka (Bára):** může AI se snímky z ulice hodnotit řezy tam, kde nemáme technickou mapu (SK, AT, DE)?

**Postup:** 96 pražských řezů regrese (`pilot-data.mjs`, pravda = profil aplikace z MTVU, odhad = z ortofota a OSM),
snímky z Mapillary (`fetch-images.mjs`, do 30 m, podél ulice oběma směry), posuzovatel Sonnet podle `POKYN.md`.
Posuzovatel profil aplikace **neviděl**, jen popsal 9 znaků. Skóre `score.mjs` počítá jen odpovědi, kde si byl jistý.

**Pokrytí:** snímky má 53 z 96 řezů (hlavní ulice ano, vedlejší většinou ne), použitelných 46 (zbytek křižovatky,
podjezdy, daleko).

| znak | AI = pravda (MTVU) | odhad = pravda | odhad = AI | AI nejistá |
|---|---|---|---|---|
| počet pruhů | 57 % (4/7) | 65 % | 86 % | 39 |
| stání vlevo | 94 % (30/32) | 89 % | 88 % | 14 |
| stání vpravo | 100 % (29/29) | 91 % | 93 % | 17 |
| cyklo | 83 % (24/29) | 93 % | 90 % | 17 |
| tramvaj | 95 % (37/39) | 99 % | 97 % | 7 |
| chodník vlevo | 81 % (22/27) | 80 % | 96 % | 19 |
| chodník vpravo | 89 % (24/27) | 68 % | 81 % | 19 |
| stromořadí | 86 % (19/22) | 82 % | 73 % | 24 |
| dělicí pás | 75 % (24/32) | 89 % | 84 % | 14 |
| **celkem** | **87 %** (213/244) | 84 % | 89 % | |

(sloupec „odhad = pravda“ je ze všech 96 řezů)

**Závěry:**
- AI z fotek spolehlivě pozná **stání (94–100 %), tramvaj (95 %), chodníky (81–89 %) a stromořadí (86 %)**.
- **Počet pruhů** z fotky skoro neurčí (39 ze 46 nejistých): na to zůstává ortofoto a značení.
- **Dělicí pás:** zbylé neshody jsou hlavně dálnice, kde profil podle MTVU ukazuje jen jednu vozovku a střed leží za ním
  (chyba „pravdy“, ne AI). Pravda je profil aplikace z MTVU, sama má chyby (pruhy a stání podle pravidel a TSK).
- Jako rozhodčí pro SK, AT a DE je metoda použitelná na **složení ulice** (stání, chodníky, tramvaj, stromy, cyklo),
  ne na šířky a počty pruhů. Slabina: Mapillary má snímky jen asi z poloviny ulic, hlavně hlavních.
- Cena: 53 řezů × 2 snímky = asi 0,5 mil. tokenů (2 agenti Sonnet).
