# Parkování

Orientace stání a odhad stání podle zákona.

## Orientace stání

Podélné, šikmé a kolmé stání se bere z OSM (`orientation` u ploch parkování, `parking:*:orientation` u ulic) nebo
z dat města. U úseků TSK se dopočítá z průměrné hloubky úseku (plocha / délka) a počtu stání (`PS_ZPS`): hloubka
od 4,9 m = kolmé, pod 3 m = podélné, jinak podle délky na stání (pod 3,4 m kolmé, 3,4–4,8 m šikmé, víc podélné).
Kde nic z toho není, odhadne se z hloubky pásu: do 3,2 m podélné, do 4,6 m šikmé, jinak kolmé.
Odhad „kolmé“ vedle vozovky užší než 5 m je šikmé: do kolmého stání se zajíždí z asi 6 m, do šikmého pod 45° ze 3,5 m
(ČSN 73 6056; Laubova, kde stromy mezi stáními kazí délku na stání).
V editoru jde orientace změnit ručně. Kolmé stání má podle ČSN 73 6056 hloubku 5,0 m, s přesahem vozidel
přes obrubník 4,5 m; užší změřený pás kolmého stání se doplní na 4,5 m z chodníku nebo zeleně za obrubníkem.

**Stání na chodníku** (`parking:<strana>=on_kerb|half_on_kerb`, ve starém schématu
`parking:lane:<strana>:<orientace>=on_kerb|half_on_kerb`): technická mapa tam kreslí chodník. `on_kerb` vyčlení
z chodníku u obruby pás celého auta (2 / 4,5 / 5 m podle orientace) na úrovni chodníku, `half_on_kerb` polovinu
z chodníku a polovinu z vozovky jako jednu část přes obrubu (auto nakloněné). Chodníku zůstane aspoň 0,5 m:
na užším se auto zúží (na celém chodníku nejméně na 1 m, polovina na chodníku na 0,3 m), jinak se nekreslí; obojí
řekne hláška u profilu, stejně jako když vozovka po polovině aut nesplní § 25 odst. 3 (3 m pro každý směr).
Pruhy se pak dělí podle zbytku vozovky (nejméně jeden). U úseku TSK, plochy MTVU 704 nebo úseku města u obruby
zůstane jejich šířka a z OSM se vezme jen poloha. Část nese `position` (v Návrhu „Poloha“, v odkazu, do Streetmixu
jako parking-lane, zvýšená u `on_kerb`), varování hlídá zbytek chodníku (min. 1,5 m) a značky jsou IP 11d až IP 11g.
