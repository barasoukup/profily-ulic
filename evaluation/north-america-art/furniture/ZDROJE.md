# Severoamerický mobiliář: zdroje a rozměry (25. 11. 2026)

Kreslí `draw.mjs` (1 px = 1 cm), přehled `prehled.png` (`sheet.mjs`). Vlastní kresby; fotky a výkresy sloužily jen jako
předlohy a v repozitáři nejsou. Bez log, názvů dopravců a reklam; piktogramy vlastní. „Odhad“ = měřeno z fotky podle
známého rozměru vedle, ne z normy.

| Kus | Rozměry | Předloha |
|---|---|---|
| Lampa společná | světlo 8,7 m (sloup 28 ft 6 in), výložník 1,8 m, patka 22 in (56 cm) | DDOT Streetlight Policy and Design Guidelines 2013, s. 22–25 (obr. 7, 9); NYC Street Design Manual, kap. Lighting |
| Lampa New York | 30 ft (9,1 m), výložník 8 ft, stoupá 3 ft, patka 22 in, dřík 7,7 → 4,2 in (kresleno širší pro čitelnost) | NYC Street Design Manual 2020, 4.1.1, s. 155; NYC DOT Street Lighting Standard Drawings, LP-038 |
| Bishop's Crook | 26 ft 3 in (8,0 m), svítidlo asi 0,9 m od sloupu (fotka spíš 0,75 m), patka zúžená na 44 cm kvůli kotvě obrázku | Street Design Manual 4.2.2, s. 160; Standard Drawings PIC-004, LP-026 |
| Lampa Washington Globe (No. 16), `lamp-globe`, lampa do 5 m | sloup 16 ft, patka 24 in, koule asi 43 cm a celková výška 5,6 m odhad, světlo 5,2 m | DDOT Guidelines 2013, s. 21–22 a 54 (obr. 6; č. 16 nejběžnější, svislé sloupy černé); Commons: Twin-20 Washington Upright Pole - Washington DC; Street light in Washington, D.C - 2019; Cobrahead Pendant Pole and Washington Upright Pole |
| Lampa Boston (Neighborhood Acorn), `lamp-acorn`, připravená | svítidlo 35 5/8 in, sloup 13 ft 4 in, dřík 6,57 in (12 žlábků), patka Ø 18 in, výška 28 7/8 in | Boston Street Lighting Standards, říjen 2026, L.1.1, L.1.2.2, L.1.2.4 |
| Lampa San Francisco (Path of Gold), `lamp-path-of-gold`, nezapojená | 32 ft 3 in (9,83 m); lucerny asi 41 cm odhad. Tři lucerny slzovitého tvaru | SF Planning 2018-002022COA (výška); Commons: Path of Gold streetlight at Kearny & Market (2008); San Francisco Path Of Gold Lamp at Market and Powell Streets |
| Trakční sloup (i s lampou) | 9,5 m, trolej 5,9 m a 2,86 m od sloupu: stejně jako ostatní sady (poloha daná aplikací); tvar obecný | obecné fotky, žádná norma |
| Lavička | sedák 46, opěradlo 86, područka 64, hloubka 62 cm: obvyklé rozměry, ne norma | obecná ocelová laťová lavička |
| Stojan (obrácené U) | 36 × 30 in (91 × 76 cm), trubka 2 in: obvyklé rozměry | DDOT Bike Parking Guide 2018 (typ stojanu, rozměry neuvádí) |
| Sloupek | Ø 4,5 in (11,4 cm), 30 in (76 cm) | NYC DOT, Design Commission 22. 2. 2021, pipe bollard (list 8). Žlutý pásek je přidaný |
| Označník společný | tabule 12 × 18 in, spodní hrana 2,45 m, děrovaný sloupek 2,5 in: obvyklé rozměry | Commons, Bus stop signs in the United States |
| Označník Washington | skutečná tabule 36 × 18 in (91 × 46 cm), kreslená kratší (72 cm), U-profil; výška odhad; zjednodušeno | WMATA Bus Stop Presentation 19. 11. 2009 (údaj z výsledku hledání, dokument nebyl otevřen); Commons: Democracy Blvd M70 J1 J2 bus stop Bethesda MD 2025-07-28; Morris Rd SE & Hunter Pl SE Stop ID 1000304 01; WMATA Metrobus new stop. Nový vzhled (WMATA, RAC 5. 11. 2025, červená „beacon“ a tabule 18 × 30 in) zatím nekreslen: barvy nebyly rozhodnuté |
| Označník New York | tabule 40 × 46 cm, pouzdro s jízdním řádem: odhad; zjednodušeno (skutečný kruh se nekreslí) | Commons: NYC bus stop branding; 57th St 6th Av td 05; Jackson Hts Roosevelt Av 09 - Q53 SBS stop |
| Označníky Toronto | obal 24 × 100 cm (skutečný asi 150): odhad; zjednodušeno; tramvajový se liší jen piktogramem | Commons: TTC Bus Stop; TTC Bus Sinage on Eglinton Avenue, June 12 2025 |
| Označník Boston | 32 × 94 cm odhad; zjednodušeno | Commons: MBTA 89 and 101 bus stop, Broadway; Old MBTA route 33 bus stop sign; Old bus stop sign near Magoun Square (starší vzhled; tam jsou „old“ značky) |
| Označník San Francisco | 40 × 105 cm odhad; zjednodušeno | Commons: Sign with 78X bus at Ocean and Lee, January 2018 |
| Přístřešek společný | hloubka 5 ft (1,5 m), výška asi 2,5 m: obvyklé rozměry, norma nenalezena | Commons: Washington Bus Shelter - 14th Street NW; Southbound bus stop at City Square, November 2019 |
| Přístřešek Toronto | sloupy 1,2 m od sebe, střecha 1,7 m, výška 2,7 m: odhad | Commons: TTC Bus Stop on Port Union Road, April 30 2026; Another TTC kiosk, 2016 06 19 (1); Bay TTC renewed bus shelter |
| Hydrant, parkovací hodiny (návrhy) | 76 cm; 145 cm: obvyklé rozměry | bez předlohy, jen návrh (`navrhy/`), nezapojené |

Rostliny zelených střech, průlehu a nádrže a kolo u stojanu jsou z pražské sady.

Zapojeno: USA i Washington společná sada, Washington (hranice DC, `towns-us.json`) svou lampu do 5 m, označník a přístřešek s ním
(střecha kratší o 20 cm, aby tabule nezasahovala do jejího okraje). Nezapojené (města v aplikaci zatím nejsou): `newyork/`,
`toronto/`, `boston/`, `sanfrancisco/`.

Lampy: výchozí je všude společná cobra head (Bára 25. 11. 2026). Globe Washingtonu je jeho lampa do 5 m (volba výšky):
sada smí mít jedno nepovinné jméno obrázku `lamp-post-top` (`profile.js postTopLamp`), obrázek vystředěný, s výškou
světla v `data-light`; světlo se posune do zvolené výšky, hlava a patka zůstanou, dřík mezi nimi se natáhne nebo zkrátí.
Sada bez něj kreslí sloupek se svítidlem jako dřív. Nad 5 m cobra head, takže desetimetrový Globe nevznikne. Acorn Bostonu
je na to připravený (`lamp-post-top: "lamp-acorn-left"`), Boston v aplikaci není. Kontrola `compare-lamps.mjs`: 61 měst,
36 kreseb každé (výšky 3–10 m), liší se jen Washington. Snímky `lampy.png`, `lampa-app.png`.

Označníky jsou zjednodušené, aby nepřipomínaly skutečné značky dopravců (Bára 25. 11. 2026): New York bez kruhu a
červené úseče (obyčejná modrá tabule, šedé tabulky tras), Washington bez kruhu s autobusem, svislých pruhů v místě nápisu,
zaobleného vršku a modročervené tabule (břidlicová, kratší), Boston bez zaobleného vršku, černé čepičky a červené paty, San Francisco bez červeného pole
a barevné tečky linky, Toronto bez červené paty, černé tabulky, znaku přístupnosti a červených čísel linek (bílý kratší obal s jednou červenou hlavou). Společné značky beze změny.

Tramvajový přístřešek se nekreslí: kde ho sada nemá, aplikace bere autobusový.

## Kritika
Tři kola s nezávislým kritikem (samostatný agent, viděl jen obrázky, fotky a rozměry), pak ještě dvě na zjednodušené
označníky a přístřešek Washingtonu. Konečné známky: 4,5 společná lampa, trakční sloup, oba společné označníky, přístřešky
(společné, Toronto, Washington, i zelené), lampa New Yorku, Globe, acorn, Path of Gold, označníky Washingtonu, New Yorku,
Toronta a San Francisca, hydrant; 4 sloup s lampou, lavička, stojan, sloupek, Bishop's Crook, označník Bostonu, parkovací
hodiny. Vzdálenost označníku od skutečné značky dopravce (5 = daleko): New York, San Francisco a Washington 4,5, Boston
a Toronto 4 (u Toronta zůstává červená hlava na bílém obalu). Přehled: `*` = nezapojená lampa.
