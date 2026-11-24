# A/B: budovy Kodaně a Aarhusu (23. 11. 2026)

`run.mjs` (semínko 20261130): v centru Kodaně a Aarhusu po 30 budovách z OSM (15 s `building:levels`, 15 bez), bod uvnitř
obrysu se ptá jako aplikace u fasády (`towns/denmark.js`: Kodaň `k101:bygning`, Aarhus `geokodede_bbr_bygninger`), jen
potřebná pole, pauza 1,5 s. A = jen OSM, B = data města. Výsledky `vysledky/rezy.json`.

| Město | domů | podlaží: data / OSM | rok: data / OSM | materiál | shoda podlaží s OSM (stejně / do 1) |
|---|---|---|---|---|---|
| Kodaň | 30 | 23 / 15 | 22 / 0 | 20 | 11/14 / 14/14 |
| Aarhus | 29 | 20 / 14 | 24 / 0 | 22 | 4/11 / 10/11 |

- Kodaň: BBR má počet podlaží přímo (bez podkroví, podkroví zvlášť podle plochy), shoda s OSM dobrá.
  **Zapnutá od 24. 11. 2026** (`?kbhbyg=0` vypne): licence vrstvy `k101:bygning` v katalogu opendata.dk uvedená není
  (obrys je GeoDanmark CC BY 4.0, BBR „frie data“), Bára přesto rozhodla: „Kodaňská data bych použila.“
- Aarhus: podlaží jen odhadem z ploch (celková plocha bez využitého podkroví / zastavěná plocha), proto `fromHeight`:
  kde OSM podlaží má, platí OSM. Rok stavby a materiál zdí přidává skoro všude (OSM rok v centrech nemá vůbec). Zapnutý
  (`?aarbyg=0` vypne), dataset „BBR-ejendomme og BBR-bygninger“ CC BY 4.0 (opendata.dk; vrstva v katalogu je
  `BBR_bygning`, která už na serveru není, dnešní `geokodede_bbr_bygninger` má stejná pole).
- Bez fotek z ulice; vzhled domů (`nordicLook("DK")`) se mění hlavně rokem (cihlový činžák do 1930).
