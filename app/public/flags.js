// The registry of the switches (docs/code-health-plan.md step 7, Bára 28. 11. 2026) and the one place that reads the
// address: ?off=<fix> turns an on-by-default fix off, ?<source>=0 a source of data (?<source>=1 where it is off by
// default), the rest are the user's own choices (?lang=, ?osm=, ?site=, ?stit=, ?mesto= …).
// A new switch is an entry here (id, kind, default, what it does, date, the measurement or report); tests/flags.test.js
// makes sure that every read in the code has its entry and every entry is read, and that no other file reads the
// address; docs/switches.md is made from this list (node tools/build_switches_doc.mjs).
// Reading: in the browser the address; in Node (no location: the tests, the scripts) the object globalThis[scope]
// (PROFILY_SK = { pasport: "0" }, PROFILY_US, PROFILY_OPTS …), each module its own, as before. A script that sets
// globalThis.location before it imports the app (evaluation/) gets the address like the browser.
// kind: fix (a fix that is on, ?off=<id>, or ?<id>=0), source (a source of data, off with ?<id>=0), option (the user's
// own choice or a comparison switch), trial (a feature off by default that waits for a decision; none now).
// date: the first commit that names the switch (git log -S), the report: a path in the repository or null.

const fix = (id, what, date, report = null, how = `?off=${id}`) => ({ id, kind: "fix", default: true, how, what, date, report });
const source = (id, what, date, report = null, on = true) => ({ id, kind: "source", default: on, how: `?${id}=${on ? "0" : "1"}`, what, date, report });
const option = (id, how, def, what, date, report = null) => ({ id, kind: "option", default: def, how, what, date, report });
// A source asked by its id in a table of towns (flag(id) in a loop): the file that reads it.
const town = (id, file, what, date, report = null, on = true) => ({ ...source(id, what, date, report, on), dynamic: file });

export const FLAGS = [
  // ---- fixes: ?off=<id> (ORTHO_P.off, derive.js, ortho-osm.js, app.js, towns/)
  fix("beside", "Pravidlo „za pasportem“: chodník, zeleň a plochy odhadnuté vedle ploch mapy (besidePassport).", "2026-11-16", "evaluation/archive/unification/AUDIT.md"),
  fix("busduo", "Vozovka jen pro autobusy je druhá polovina ulice (bulvár v Paříži).", "2026-11-23", "evaluation/france/ab/boulevards/REPORT.md"),
  fix("buskrajnice", "Buspruh z krajnice, kterou omezení šířky pruhu nechalo u obruby.", "2026-11-23", "evaluation/france/ab/boulevards/REPORT.md"),
  fix("dcarterials", "Washington: tepny podle inventáře DDOT a ostrůvky vedle nich.", "2026-11-25", "evaluation/usa/arterials/REPORT.md"),
  fix("ddotfit", "Washington: inventář DDOT se věří jen tam, kde se vejde do změřené šířky.", "2026-11-27", "evaluation/usa/ddot-fit/REPORT.md"),
  fix("floorsh", "Počet podlaží z výšky přes sdílenou funkci (floors.js); vypnuto: starý výpočet výška / 3,5.", "2026-11-27", "evaluation/archive/floors-height/REPORT.md"),
  fix("gapsortho", "Mezery mezi vozovkami mapy povrchů podle ortofota (Toronto, Boston, sdílené).", "2026-11-27", "evaluation/canada/losses/FIXES.md"),
  fix("gapswide", "Mezera nad 10 m mezi vozovkami s jiným jménem jsou dvě ulice.", "2026-11-27", "evaluation/canada/losses/FIXES.md"),
  fix("kerbbays", "Zálivy stání v obrubách mapy povrchů (Toronto, New York, Boston).", "2026-11-25", "evaluation/canada/REPORT.md"),
  fix("kolodvakrat", "Stezka vedle cesty z OSM (cycleway:<strana>=lane) nedělá ještě cyklopruh ve vozovce.", "2026-11-22", "evaluation/france/REVIEW.md"),
  fix("lawlanes", "Zákonné stání čeká na pruhy a auta modelu (lawKerbs, layLaw).", "2026-11-25", "evaluation/archive/unification/measure2/REPORT.md"),
  fix("mapfill", "Doplnění kolem mapy povrchů: zeleň, chodníky a stání z modelu za koncem mapy.", "2026-11-24", "evaluation/archive/mapfill-cz/REPORT.md"),
  fix("mapgaps", "Mezery mezi vozovkami mapy povrchů (Toronto, Boston).", "2026-11-25", "evaluation/canada/REPORT.md"),
  fix("mostdeska", "Odhad končí na hraně mostovky.", "2026-11-27", "evaluation/archive/bridge-water/edge/REPORT.md"),
  fix("mostvoda", "Voda pod mostem a za krajním chodníkem mostu.", "2026-11-26", "evaluation/archive/bridge-water/REPORT.md"),
  fix("obsluzne", "Obslužné cesty u řezu jako křižovatky.", "2026-11-25", "evaluation/archive/unification/AUDIT.md"),
  fix("osafix", "Opravy osy OSM v každém městě (jedno pravidlo všude).", "2026-11-25", "evaluation/archive/unification/AUDIT.md"),
  fix("osaroad", "Dlážděný pás pod osou mezi dvěma vozovkami je střední pás, jeho osa je střed ulice (test osy).", "2026-11-25", "evaluation/archive/unification/AUDIT.md"),
  fix("osmdomy", "Budovy z OSM doplňují plochy mapy tam, kde mapa budovy nemá.", "2026-11-27", "docs/osm.md"),
  fix("osmwalk", "Chodník z OSM za obrubou před domem nad trávníkem mapy.", "2026-11-16", "docs/profile-derivation.md"),
  fix("otherstreet", "Upozornění „řez vede křižovatkou“ u jiné ulice šikmo v profilu.", "2026-11-25", "docs/decisions.md"),
  fix("parkshare", "Oprava stání z modelu u zákonného pruhu.", "2026-11-24", "evaluation/archive/unification/slovakia-parking/REPORT.md"),
  fix("pesizona", "Pěší zóna je chodník (kreslí se s lidmi a stromy jako chodník).", "2026-11-17"),
  fix("pocetpruhu", "Obousměrka se dělí od 4,0 m, kde je počet pruhů známý a u vozovky je stání.", "2026-11-24", "evaluation/usa/REPORT.md"),
  fix("podkrovi", "Slovinsko: horní podlaží katastru ve střeše (obytné podkroví).", "2026-11-24", "evaluation/slovenia/ab/REPORT.md"),
  fix("protejsi", "Výběr místa řezu mezi křižovatkami: nejbližší volné místo, ne obslužná cesta.", "2026-11-25"),
  fix("railway", "Železniční kolej z OSM vedle ulice jako štěrkové lože.", "2026-11-27", "docs/rail.md"),
  fix("roadtracks", "Cyklostezky z OSM ve vozovce mapy povrchů (Toronto, New York, Boston).", "2026-11-25", "evaluation/canada/REPORT.md"),
  fix("ruiandomy", "Budovy odhadu z RÚIAN, z OSM jen tam, kde RÚIAN žádnou nemá.", "2026-11-23", "docs/profile-derivation.md"),
  fix("srafy", "Šrafy (pruhy mezi plnými čarami) v pruzích z ortofota.", "2026-11-27", "evaluation/orthophoto/REPORT.md"),
  fix("staramapa", "Pole nebo les mapy tam, kde odhad našel domy a chodníky, jde za odhad (mapa ještě nepřekreslená).", "2026-11-23", "docs/profile-derivation.md"),
  fix("trackaxis", "Cyklostezka z OSM přes osu mapy povrchů.", "2026-11-27", "evaluation/canada/losses/FIXES.md"),
  fix("tramsnap", "Koleje tramvaje bez změřených os se přitáhnou k tělesu.", "2026-11-18", "evaluation/germany/tramsnap/REPORT.md"),
  fix("tunneltracks", "Koleje v tunelu pod ulicí se nekreslí.", "2026-11-25", "evaluation/canada/review/results/score.md"),
  fix("ulicky", "Ústí uličky je křižovatka (plocha uličky jen pro ulici, do které ústí).", "2026-11-24", "evaluation/usa/REPORT.md"),
  fix("ulickysve", "Ústí uliček podle obrysů ploch uliček podél ulice (ALLEY_REACH, ALLEY_MOUTH).", "2026-11-25"),
  fix("vsedomy", "Vzhled domu čte všechny budovy OSM, i bez podlaží a výšky.", "2026-11-25", "evaluation/archive/all-buildings/REPORT.md"),
  fix("zabradli", "Zábradlí mostu na okraji ulice na mostě.", "2026-11-27", "evaluation/archive/bridge-water/edge/REPORT.md"),
  // fixes with a switch of their own
  fix("ai", "Obruby vozovky odhadu čte natrénovaný model (ai-kerbs.js).", "2026-11-19", null, "?ai=0"),
  fix("aiplochy", "Model rozhoduje i chodník, zeleň a ostatní mezi obrubou a domem.", "2026-11-19", "evaluation/holdout", "?aiplochy=0"),
  fix("axisroad", "Vlastní vozovka ulice, kterou osa neprotíná (Lippard Avenue).", "2026-11-26", "evaluation/axisroad-check/REPORT.md", "?axisroad=0"),
  fix("dosah", "Strana, kterou uživatel natáhl, pokračuje za poslední cestu nebo chodník.", "2026-11-27", null, "?dosah=0"),
  fix("odhadstani", "Zákonný odhad stání (podle zákona o provozu státu).", "2026-11-17", null, "?odhadstani=0"),
  fix("orez", "Kde pasport města má vozovku pod středem řezu, vozovky, které DTM jen hádá kolem ní, se ořežou (overlay.js).", "2026-11-26", null, "?orez=0"),

  // ---- sources of data: ?<id>=0 leaves them out (?<id>=1 asks for those off by default)
  town("aachen", "app/public/towns/germany.js", "Mapa povrchů Cách (WFS města).", "2026-11-17", "evaluation/germany/ab/REPORT.md"),
  source("aarbyg", "Budovy Aarhusu z BBR (CC BY 4.0).", "2026-11-23", "evaluation/denmark/buildings-ab/REPORT.md"),
  source("av", "Švýcarsko: plochy z úředního vyměřování (Amtliche Vermessung).", "2026-11-17", "evaluation/switzerland/ab/REPORT.md"),
  source("bag", "Nizozemsko: budovy BAG a 3D BAG.", "2026-11-20", "evaluation/netherlands/ab/BUILDINGS.md"),
  source("bdtopo", "Francie: budovy BD TOPO (podlaží, výška).", "2026-11-22"),
  town("berlin", "app/public/towns/germany.js", "Mapa povrchů Berlína.", "2026-11-17", "evaluation/germany/ab/REPORT.md"),
  source("bgt", "Nizozemsko: mapa povrchů BGT (PDOK).", "2026-11-20", "evaluation/netherlands/ab/REPORT.md"),
  source("bologna", "Mapa povrchů Boloně (plochy silnic jsou celé uliční prostory).", "2026-11-23", "evaluation/italy/ab/REPORT.md", false),
  source("bolognadomy", "Výšky budov Boloně.", "2026-11-23", "evaluation/italy/ab/REPORT.md"),
  source("boston", "Mapa povrchů Bostonu (dlaždice z Street Edges a Sidewalk Inventory).", "2026-11-26", "evaluation/usa/boston/REPORT.md"),
  source("bostonhouse", "Budovy Bostonu s podlažími.", "2026-11-26", "evaluation/usa/boston/REPORT.md"),
  source("cama", "Washington: domy z CAMA (podlaží, rok).", "2026-11-25", "evaluation/north-america-art/cama"),
  source("cambridge", "Mapa povrchů Cambridge (MA).", "2026-11-26", "evaluation/usa/boston/REPORT.md"),
  source("catastro", "Španělsko: budovy z katastru.", "2026-11-23"),
  source("dc", "Washington: mapa povrchů Planimetrics 2023.", "2026-11-25", "evaluation/usa/fresh/REPORT.md"),
  source("ddot", "Washington: inventář DDOT Roadway SubBlock (pruhy, stání, cyklopruhy).", "2026-11-27", "evaluation/usa/REPORT.md"),
  source("dls", "Kypr: budovy z DLS s podlažími.", "2026-11-23", "evaluation/cyprus/REPORT.md"),
  source("etak", "Estonsko: budovy ETAK s výškou.", "2026-11-23", "evaluation/estonia/REPORT.md"),
  source("foral", "Baskicko a Navarra: budovy z foralních katastrů (?foral=1 všechny čtyři, ?foral=nc,gi jmenované).", "2026-11-23", "evaluation/spain/foral-ab/REPORT.md"),
  source("grpk", "Litva: obrysy budov GRPK, které ukončují řez u fasády.", "2026-11-24", "evaluation/lithuania/REPORT.md"),
  town("hamburg", "app/public/towns/germany.js", "Mapa povrchů Hamburku.", "2026-11-17", "evaluation/germany/ab/REPORT.md"),
  source("kbhbyg", "Kodaň: budovy Københavns Kommune (stáří, podlaží).", "2026-11-23", "evaluation/denmark/buildings-ab/REPORT.md"),
  source("kbhkant", "Kodaň: okraje vozovek GeoDanmark (vejkant) jako kandidáti obrub.", "2026-11-23", "evaluation/denmark/ab/REPORT.md"),
  source("kbhpark", "Kodaň: parkovací plochy města.", "2026-11-23", "evaluation/denmark/ab/REPORT.md"),
  source("hkibuild", "Helsinky: budovy z registru města.", "2026-11-23", "evaluation/finland/buildings-ab/REPORT.md"),
  source("hkihouses", "Helsinky: obrysy budov registru.", "2026-11-24", "evaluation/finland/buildings-ab/REPORT.md"),
  source("helsinki", "Mapa povrchů Helsinek (YLRE).", "2026-11-23", "evaluation/finland/ab3/REPORT.md"),
  source("hrany", "Čáry map povrchů jako kandidáti obrub (Belgie GRB a PICC, Slovensko).", "2026-11-16", "evaluation/belgium/ab/REPORT.md"),
  source("lombardia", "Lombardie: mapa povrchů (DBT).", "2026-11-24", "evaluation/italy/lombardia/REPORT.md"),
  source("nyc", "Mapa povrchů New Yorku (NYC Planimetric Database).", "2026-11-26", "evaluation/usa/nyc/REPORT.md"),
  source("nychouse", "Budovy New Yorku z obrysů téže služby.", "2026-11-26", "evaluation/usa/nyc/REPORT.md"),
  source("parisstani", "Paříž: stání z evidence parkovacích míst.", "2026-11-23", "evaluation/france/ab/boulevards/REPORT.md"),
  source("pasport", "Slovensko: pasporty měst (Bratislava, Žilina, Banská Bystrica).", "2026-11-16", "evaluation/slovakia/ab/REPORT.md"),
  source("ryhti", "Finsko: budovy z registru Ryhti.", "2026-11-23", "evaluation/finland/buildings-ab/REPORT.md"),
  source("salzburg", "Salcburk: zákaz zastavení a stání z katastru značek.", "2026-11-16"),
  source("sf", "Mapa povrchů San Franciska (DataSF a SFMTA).", "2026-11-26", "evaluation/usa/sf/REPORT.md"),
  source("sfcurb", "San Francisco: stání z digitální obruby SFMTA.", "2026-11-26", "evaluation/usa/sf/REPORT.md"),
  source("sfhouse", "San Francisco: podlaží z výšek obrysů budov.", "2026-11-26", "evaluation/usa/sf/REPORT.md"),
  source("symboly", "Bratislava: symboly druhů ploch technické mapy.", "2026-11-16", "evaluation/slovakia/ab/REPORT.md"),
  source("tallinn", "Mapa povrchů Tallinnu.", "2026-11-23", "evaluation/estonia/ab/REPORT.md"),
  source("toronto", "Mapa povrchů Toronta (OGL – Toronto).", "2026-11-25", "evaluation/canada/REPORT.md"),
  source("torontohouse", "Domy Toronta z mapy.", "2026-11-25", "evaluation/canada/REPORT.md"),
  source("vilnius", "Vilnius: topografické plochy 1 : 500 (licence neuvedená).", "2026-11-24", "evaluation/lithuania/REPORT.md", false),
  source("wbn", "Flandry: Wegenbouwkundige Noodzaak (WBN) z GRB.", "2026-11-24", "evaluation/belgium/ab-wbn/REPORT.md"),
  source("wien", "Vídeň: Flächen-Mehrzweckkarte (FMZK).", "2026-11-16", "evaluation/austria/ab/REPORT.md"),
  source("zbgis", "Slovensko: plochy a šířky ze ZBGIS.", "2026-11-16", "evaluation/slovakia/REPORT.md"),
  source("gurs", "Slovinsko: budovy z katastru GURS.", "2026-11-23", "evaluation/slovenia/ab/REPORT.md"),
  town("krakow", "app/public/towns/poland.js", "Kraków: mapa povrchů MSIP (pravidla města chtějí písemný souhlas správce).", "2026-11-21", "evaluation/archive/licences/REPORT.md", false),
  town("paris", "app/public/towns/france.js", "Paříž: mapa povrchů (Plan de voirie, ODbL).", "2026-11-22", "evaluation/france/ab/REPORT.md"),
  town("zaragoza", "app/public/towns/spain.js", "Zaragoza: mapa povrchů (dlažby 2017).", "2026-11-23", "evaluation/spain/ab/REPORT.md"),

  // ---- the user's own choices and comparison switches
  option("aimodel", "?aimodel=<soubor>", "street", "Jiný soubor modelu obrub v ai/ (srovnání menšího modelu na týchž řezech).", "2026-11-19"),
  option("lang", "?lang=<jazyk>", "podle prohlížeče", "Jazyk rozhraní (cs, sk, en, de a další); zapamatuje se a z adresy zmizí.", "2026-11-12"),
  option("mapa", "?mapa=0", "zapnuto", "Odhad z ortofota a OSM i tam, kde odpovídá technická mapa (porovnání obou).", "2026-11-18"),
  option("mesto", "?mesto=<id>", "podle místa řezu", "Stará adresa města (/brno/ …) otevře mapu nad ním.", "2026-11-10"),
  option("orto", "?orto=0", "zapnuto", "Pruhy a krajnice z čar na ortofotu; vypnuto: profil z pravidel.", "2026-11-11"),
  option("osm", "?osm=r2|balik", "web: R2 a záloha na Pages, lokálně dlaždice", "Odkud se čtou balíky OSM (R2, soubory lokálního serveru).", "2026-11-16", "evaluation/osm-r2/REPORT.md"),
  option("site", "?site=1", "vypnuto", "Zapne sítě pod zemí (Praha), dokud je uživatel nevypne.", "2026-11-12"),
  option("stit", "?stit=0|1|cely", "zapnuto, uříznutý štít", "Obrys štítu u štítových domů: 0 vypne, cely celý souměrný, 1 i u ostatních vzhledů.", "2026-11-23", "evaluation/archive/regional-buildings/REPORT.md"),
];


// The address, parsed once for each value of it (the app may rewrite the address; a script sets location before it
// imports the app).
let seen = null, parsed = null;
const query = () => {
  const s = typeof location === "undefined" ? null : location.search;
  if (s === null) return null;
  if (s !== seen) { seen = s; parsed = new URLSearchParams(s); }
  return parsed;
};

// A reader of switches: flagsOf("PROFILY_SK")("pasport") is the address's ?pasport (null when it has none), in Node
// globalThis.PROFILY_SK.pasport. Without a scope only the address.
export const flagsOf = (scope) => (key) => {
  const q = query();
  return q ? q.get(key) : (scope && globalThis[scope]?.[key]) ?? null;
};
// The reader of ?off=a,b,c as a test of one name.
export const offOf = (scope) => {
  const read = flagsOf(scope);
  return (name) => (read("off") || "").split(",").includes(name);
};
// The app's own reads (the address only).
export const flag = flagsOf(null);
// Every pair of the address, the language aside (a cut saved under other switches is derived again, app.js optsKey).
export const flagPairs = () => [...(query() ?? [])].filter(([k]) => k !== "lang");
// The address without one of its switches (the language chosen in the menu leaves the link).
export const addressWithout = (key) => { const url = new URL(location.href); url.searchParams.delete(key); return url.href; };
