# Pařížské bulváry a krajnice (23. 11. 2026)

Bára 23. 11. 2026: „Ty bulváry a krajnice musíme vyřešit. Zjisti, v čem je problém.“ Cílený vzorek `body.json`:
30 pařížských bulvárů a avenue (adresa ulice z hledání Géoplateforme, řez s jejím jménem), 26 s profilem (4 body
mimo lokální balík OSM). A = stav před opravou (`a.json`), B = po ní (`b.json`), obrázky `images/` (nahoře A modře,
dole B červeně, nad ortofotem IGN).

## V čem byl problém

1. **Ortofoto IGN pruhy v Paříži nepřeměří.** Ve 4 ze 6 prověřených bulvárů nenašlo žádnou čáru (`__lanesWhy`:
   „žádné čáry“): vozovky jsou ve stínu domů a stromů a Paříž čáry mezi pruhy často nemaluje. Zůstávají pravidla:
   pruhy podle OSM se stropem 4 m a zbytek vozovky jako krajnice.
2. **Mapa povrchů počítá podélné stání do vozovky** (jen zálivy v chodníku má zvlášť jako „Piste“). Na hlavních ulicích
   se stání podle zákona neodhaduje, takže pruh stání u obruby skončil jako krajnice (Bd Voltaire, Rue de Castiglione).
3. **Buspruh v protisměru, který OSM nepočítá do `lanes`** (Rue La Fayette: `lanes=1`, `busway:left=lane`,
   `oneway:psv=no`), se nedostal do profilu a zbyla po něm krajnice.
4. **Bulvár se středovou promenádou** (Bd Marguerite de Rochechouart u Anvers): severní vozovka je v OSM jen pro autobusy
   (`highway=service`, `psv=yes`, `access=no`) a není to „druhá polovina ulice“. Řez proto začal na jižní vozovce
   a dosah 22 m skončil uprostřed promenády.
5. Mimo bulváry: bod A/B pa18 (Bd de Magenta) padl na cyklostezku za koncem bulváru na křižovatce Barbès, bv2
   (Sébastopol) do ústí boční ulice; to jsou místa řezu, ne chyba bulváru.

## Co je opraveno

- **Pařížská evidence parkovacích míst** (`stationnement-voie-publique-emplacements`, ODbL, denně aktualizovaná, 65 816
  úseků: bod uprostřed pruhu stání, délka, hloubka, podélné / kolmé / šikmé, strana ulice). Zapojená v
  `towns/france.js parking` jako `kerbParking`, v `derive.js` rozhoduje každou obrubu vozovky: úsek do 5 m od řezu
  podél ulice (mezera vjezdu není konec stání) a do své hloubky od obruby = stání té šířky a způsobu; obruba bez úseku
  stání nemá (evidence pokrývá celou Paříž). Jen úseky ve vozovce („Chaussée“, „Faux lincoln“, „Contre terre plein“);
  jen stejná ulice (kromě náměstí, kde evidence píše ulici, ne náměstí). `?parisstani=0` vypne.
- **Buspruh z krajnice:** krajnice aspoň 2,75 m u obruby, kde OSM značí buspruh (`busway:<strana>=lane`) a žádný pruh na
  něj nezbyl, je buspruh (v protisměru podle `busway:<strana>:oneway=-1` nebo `oneway:psv=no`). `?off=buskrajnice`.
- **Vozovka jen pro autobusy jako druhá polovina ulice** (`highway=busway` nebo `service` s `psv/bus` a `access=no`), jen
  když jiná se stejným jménem není. `?off=busduo`.
- **Delší dosah u francouzských hlavních ulic:** strana, na které profil skončí dosahem 22 m ve středovém pásu,
  promenádě, zeleni nebo chodníku, dostane 35 m (`countries/FR.js wideStreets`, `app.js`). Na straně, která končí
  u fasády, se nic nemění (zkoušela jsem 35 m všude: u La Fayette přibylo 27 m „neznámého“ a u Saint-Michel park).

## Výsledek

| | A | B |
|---|---|---|
| bulvárů s krajnicí aspoň 1 m (z 26) | 11 | 10 |
| krajnice celkem | 72,2 m | 64,7 m |
| dílů stání | 17 | 22 |

- Lépe: Bd Voltaire (stání místo krajnic, pruhy 3,5 m), Rue de Castiglione a Bd Saint-Germain (stání podle evidence),
  Rue La Fayette (buspruh s cyklisty v protisměru), Bd Marguerite de Rochechouart (celý bulvár s promenádou a oběma
  vozovkami).
- Sporné: Rue Fromentin a Rue des Chaufourniers ztratily na jedné straně odhad stání podle zákona (evidence tam nic nemá,
  pruh 5,1–5,2 m). Evidence je úřední a úplná, takže ji beru jako pravdu.
- Původních 40 pařížských řezů (`../results/b-stani.json` proti `b-po-recenzi.json`): změna u 14, většinou stání
  1,8 m z evidence místo odhadu 2 m nebo stání na druhé straně (Rue Malar). Rue Louis Codet má nově stání na obou
  stranách. Place des Alpes ztratila odhad stání (krajnice 1,6 m). Quai aux Fleurs ztratil jednu stranu stání.
- Kontroly v Česku (`cz-a.json`, `cz-b.json`: 20 řezů na ulicích s vozovkou jen pro autobusy nebo s buspruhem, Praha,
  Brno, Plzeň, Liberec): Praha a Brno beze změny, Plzeň (Plaská) a Liberec (Mařanova) posun o centimetry. Regrese
  odhadu proti MTVU Prahy a Brna (`evaluation/ortho-osm/regression.mjs`) beze změny.

## Co zůstává

Krajnice u 10 bulvárů. Jsou to vozovky širší, než kolik pruhů OSM počítá × 4 m, a bez čar na ortofotu. Na snímcích
(např. Rue de Castiglione) je to nejspíš široký nevyznačený pruh, místo na zásobování, na taxi nebo na zastavení.
Zkusila jsem krajnice ve Francii úplně vypnout (pruhy si rozdělí celou vozovku): vyšly pruhy 7–11 m a ztratil se buspruh
i cyklostezka, kterou aplikace vyřezává právě z krajnice. Proto zůstávají. Další krok by potřeboval lepší zdroj čar:
pařížský PCRS (Plan Corps de Rue Simplifié, 5 cm, Licence Ouverte) je jen ke stažení po souborech, ne jako služba.
