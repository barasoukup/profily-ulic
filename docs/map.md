# Mapa

Mapové podklady a vrstvy.

## Mapa

Podkladové mapy **Mapa**, **Ortofoto**, **Technická mapa** a **OpenStreetMap**. Mapa je OSM s mapami měst (v Praze
rychlý rastr IPR z ArcGIS Online, v Brně MTVU města), ortofoto ČÚZK s ortofoty měst, technická mapa DMVS ČÚZK
s mapami měst; vrstvy měst se načítají a uvádějí jen na jejich území. Navrch jdou zapnout linie technické mapy,
plochy u řezu a další data řezu (`public/maplayers.js`): parkování z místních dat a z OSM, body (stromy, lampy,
sloupy…; v dosahu plné, mimo dosah prázdné), ploty, zdi a svahy, koleje, osy ulic, budovy na fasádách, dosah bodů.
Kreslí se jen to, co už kliknutí načetlo, nic se kvůli tomu znovu neptá. Vybraný podklad a vrstvy si prohlížeč
pamatuje.

**Hledání adres** (`public/search.js`): vyhledávací služba RÚIAN ČÚZK, návrhy od 3 znaků s prodlevou 300 ms; adresa
nebo ulice rovnou udělá řez na své ulici.

Barevný proužek pod každou částí ukazuje původ: zelená = změřeno z technické mapy, hnědá = doplněno z OSM,
modrá = otevřená data města, tyrkysová = parkování z dat města, šedá = odhad, oranžovohnědá = podle čar na ortofotu,
fialová = upraveno ručně. Vybraná část profilu se vyznačí modře na čáře řezu v mapě.
