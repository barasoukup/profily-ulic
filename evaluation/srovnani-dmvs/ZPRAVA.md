# Mapa města, nebo národní DTM ČÚZK? Srovnání profilů (10. 11. 2026)

**Otázka:** Dávají technické mapy měst (živé vektorové služby) lepší profily ulic než národní DTM ČÚZK
(IS DMVS, plní ji kraje)? Kdo má pravdu, když se liší? A zpracovávají se mapy měst snáz?

**Odpověď:** Ano, mapy měst jsou lepší a zpracovávají se snáz. Rozdíl ale skoro celý dělá **pokrytí DMVS**,
nikoli kvalita kresby:

- Pokrytí DMVS se podle krajů velmi liší:
  - Ústecký kraj (Most), Plzeňský kraj a Praha mají DTM v obcích celou.
  - Vysočina (Jihlava), Moravskoslezský kraj (Opava) a Jihomoravský kraj (Brno) mají zatím hlavně silnice I.–III. třídy.
    Místní ulice v nich chybí a profil spadne na odhad z OSM.
- Kde DMVS ulici má, dává skoro stejný profil jako mapa města (medián rozdílu vozovky 0,06–0,10 m v Mostě,
  Plzni a Praze). Mapa města se do DTM kraje nejspíš přímo předává.
- Zbylé chyby DMVS vznikají v našem čtení obrázku WMS, ne v datech:
  - plochy stejné barvy se slijí,
  - mosty vypadnou,
  - tramvajový pás se nepozná.

Skript: `evaluation/compare_dmvs.mjs`. Každý řez se spočítá dvakrát stejně jako `run_brno.mjs`: s plochami
města a s `dmvs.js surfaces()` pro stejný výřez. OSM, linie a parkování zůstávají stejné.

- Obrázky obou profilů nad ortofotem dělá `evaluation/render_dmvs.mjs`.
- Data jsou v `evaluation/<město>/data/dmvs/`, obrázky v `dmvs-png/` a verdikty v `dmvs-review.md`.
- Praha se počítá jen z cache lokálního serveru (`pilot/cache`), IPR se neptá. Řez bez uložené odpovědi se přeskočí.

## Čísla

„Liší se“ znamená, že se liší vozovka nebo chodník o víc než 0,5 m, nebo je jiný okraj profilu.
Medián je absolutní rozdíl na řezech, kde mají plochy obě mapy.

| město (kraj) | řezů | DMVS bez ploch → odhad z OSM | obě mají plochy | vozovka ±0,5 m | chodník ±0,5 m | medián Δ vozovky | posouzeno: město / DMVS / obě / žádná |
|---|---|---|---|---|---|---|---|
| Jihlava (Vysočina) | 89 | 48 (54 %) | 41 | 8 | 37 | 1,46 m | 9 / 3 / 6 / 0 |
| Opava (Moravskoslezský) | 50 | 23 (46 %) | 27 | 8 | 19 | 1,30 m | 12 / 2 / 1 / 0 |
| Brno (Jihomoravský) | 40 | 28 (70 %) | 12 | 6 | 8 | 0,57 m | 5 / 0 / 4 / 2 |
| Most (Ústecký) | 57 | 1 | 56 | 40 | 48 | 0,06 m | 6 / 2 / 2 / 1 |
| Plzeň (Plzeňský) | 46 | 0 | 46 | 41 | 43 | 0,06 m | 4 / 1 / 6 / 0 |
| Praha (IPR z cache) | 38 | 1 | 37 | 31 | 33 | 0,10 m | 5 / 1 / 6 / 0 |

**Celkem posouzeno 78 lišících se řezů:**

| výsledek | řezů | podíl |
|---|---|---|
| lepší mapa města | 41 | 53 % |
| lepší DMVS | 9 | 12 % |
| obě stejně dobré | 25 | 32 % |
| obě špatně | 3 | 4 % |

V Plzni a Praze se většina lišících se řezů liší jen okrajem profilu (zahrada / zeleň / budova z výplně
RÚIAN), ne vozovkou.

**Kdy má DMVS ulici podle třídy** (Jihlava / Opava / Brno):
- hlavní silnice: 30/32, 14/16, 5/13;
- tertiary/unclassified: 4/22, 9/14, 3/9;
- místní ulice: 7/35, 4/20, 4/18.

Most, Plzeň a Praha mají plochy ve všech třídách.

## Čas na kliknutí (jen dotaz na plochy, medián)

| město | mapa města | DMVS (ulice v DTM je) | DMVS (prázdné místo) |
|---|---|---|---|
| Jihlava | 58 ms | 1,26 s | 0,48 s |
| Opava | 123 ms | 1,00 s | 0,48 s |
| Most | 116 ms | 1,10 s (jednou 21 s, timeout GetFeatureInfo) | – |
| Plzeň | 585 ms | 0,89 s | – |
| Brno | 210 ms | 1,06 s | 0,57 s |
| Praha | (cache) | 3,8 s | – |

- DMVS potřebuje 2 obrázky, 0–16 dotazů GetFeatureInfo (medián 2–6) a 2 dotazy RÚIAN. Je 2–20× pomalejší
  než vektorová služba města.
- V Mostě 4 řezy napoprvé spadly na `fetch failed` u GetFeatureInfo a prošly až při opakování.

## Typické chyby

**DMVS (čtení obrázku):**
1. **Chybí pokrytí:** profil je jen odhad z OSM (6 m, bez chodníků). Patří sem většina místních ulic v Jihlavě,
   Opavě a Brně: Brno č. 7 Heršpická (město 35,6 m, šest pruhů), č. 35 Kamenice, Jihlava č. 42 a 61.
   Kde v prázdném DTM stojí domy z RÚIAN, nevznikne ani odhad. Celá ulice je pak jedna plocha „Neurčeno“
   (Brno č. 95 náměstí Svobody 33 m, Jihlava č. 85 Palackého).
2. **Slité plochy jedné barvy:** bílá je vozovka, parkoviště i hospodářsky nevyužitá plocha, světle šedá je
   ostrůvek, nástupiště i dělicí pás. Tam, kde chybí hraniční čára, splynou. Proto se objeví druhá „vozovka“
   v trávě, v poli nebo v lese (Jihlava č. 19: 19,8 m místo 7,9 m; Most č. 14; Plzeň č. 21) a krajnice
   široké 3 m. V Praze č. 25 Kolbenova vyšla celá ulice jako zpevněná plocha 26 m s nulovou vozovkou.
3. **Mosty:** typ „plocha mostovky“ `dmvs.js` nezná (29× „neznámý typ“). Plocha pak vypadne a vozovka
   chybí. Jihlava č. 12 má 4,9 m místo 10 m, č. 16 vyšel most jako „zeď 11,5 m“, Praha č. 14 Hlávkův most
   má 17,7 m místo 26,8 m.
4. **Tramvaje:** pás se splete se zdí nebo zpevněnou plochou (Praha č. 14, Brno č. 60).
5. Okraje profilu DMVS často dotáhne přes zahradu a parcely RÚIAN dál než mapa města. Je to jen kosmetika.

**Mapy měst:**
- **Jihlava (pasport komunikací):** vozovka bývá o 1,5–2,5 m širší než asfalt, krajnice leží v trávě. Tady
  bývá DMVS přesnější (č. 9, 10). Jednou vznikl nesmyslný pruh na kruhovém objezdu (č. 23).
- **Most:** tramvajový pás jako zpevněná plocha (č. 7), úzká ulice jako chodník (č. 44).
- **Brno, Praha:** výjimečně jedna velká plocha přes celou ulici (Brno č. 5 Žabovřeská, č. 100; Praha č. 10
  Kbelská, deska železničního mostu).
- **Opava, Plzeň:** téměř bez chyb.

## Jednoduchost zpracování

Bára má pravdu: vektory jsou jednodušší a robustnější.

- **Město:** jeden nebo několik dotazů `query` vrátí polygony s typem. Převod typů je 10–40 řádků
  (`brnoMtvuCode`, `surfaces` v `towns/*.js`). Chyby jsou jen datové a dají se opravit převodní tabulkou.
- **DMVS:** `dmvs.js` má 513 řádků. Obsahuje vlastní dekodér PNG, přichytávání pixelů k paletě legendy, hledání
  souvislých ploch, obrysování a zjednodušování, dotazy GetFeatureInfo na každou plochu bez jednoznačné barvy
  a doplnění z RÚIAN.
  - Kresba je jen tak dobrá, jak dobře jde barva a hraniční čára obrázku. Při 0,1 m/px je rozlišení dobré,
    ale typ, který barva neurčí, se musí dotázat. Neuložené nebo neznámé typy („plocha mostovky“) pak tiše
    vypadnou.
  - Každá změna stylu WMS na straně ČÚZK (barvy legendy) by čtení rozbila bez chybové hlášky.
  - Výhoda DMVS: jeden kód pro celou ČR a žádná převodní tabulka pro každé město.

## Doporučení

1. **Mapy měst ponechat všude, kde jsou:** Praha, Brno, Jihlava, Opava, Most, Plzeň. Jsou rychlejší a mají
   úplné pokrytí.
   - Brno, Jihlava a Opava je potřebují nutně, protože DMVS jejich krajů místní ulice zatím nemá.
   - V Mostě a Plzni by DMVS stačila, kresba je tam stejná. Mapa města je ale 5–10× rychlejší a nemá chyby
     ze čtení obrázku.
2. **DMVS je dost dobrá** jako univerzální cesta pro města bez vlastní služby v krajích, kde je DTM vyplněná.
   Podle tohoto vzorku jsou to Ústecký, Plzeňský kraj a Praha, z dřívějška také Pardubice. Mimo ně
   (Vysočina, Moravskoslezský a Jihomoravský kraj) dává hlavně silnice I.–III. třídy.
3. **Mezery uvnitř dat města DMVS plnit nemá.** V zkoumaných městech nemělo město plochy jen u 4 řezů z 320
   (3 v Jihlavě, 1 v Praze). DMVS tam měla plochy jen zčásti. Současné chování `sources.js` stačí: DMVS jen tam,
   kde město nevrátí nic.
4. **Opravy v `dmvs.js`, které stojí za to** (do `pilot/public` jsem nesahala):
   - Do `TYPES` přidat `/mostovk/` (plocha mostovky) jako vozovku, nebo 700 jako mostní konstrukci. Tím se
     vrátí mosty.
   - Když DTM ve výřezu nemá nic (`anyDtm` je false), vynechat i budovy z RÚIAN, případně je nechat jen jako
     okraj. Profil pak spadne na přiznaný odhad z OSM místo „Neurčeno“ přes celou ulici (Brno č. 95,
     Jihlava č. 85).
   - Bílou plochu přes 12 m napříč, která sahá do zeleně, ověřit druhým dotazem GetFeatureInfo u jejího okraje.
     Případně oddělit bílé plochy, mezi nimiž je hraniční čára jen z vrstvy `dopr_st`. Tím ubude druhá
     „vozovka“ v poli.
   - Kratší timeout GetFeatureInfo (dnes 20 s) a jedno opakování. Most č. 15 až 18 a jeden řez za 21 s.

## Soubory
- `evaluation/compare_dmvs.mjs`: výpočet obou profilů. `--summary` vypíše čísla, `ONLY=…` a `MAX=…` omezí
  řezy, `CITY=praha` počítá jen z cache.
- `evaluation/render_dmvs.mjs`: obrázek A/B nad ortofotem.
- Výsledky a verdikty (git je ignoruje): `evaluation/{jihlava,opava,most,plzen,brno,praha}/data/dmvs/`,
  `dmvs-png/` a `dmvs-review.md`.
