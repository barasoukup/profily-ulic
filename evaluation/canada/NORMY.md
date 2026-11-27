# Kanada (Toronto): normy šířek a stání (25. 11. 2026)

Rešerše agenta Sonnet 25. 11. 2026, každá hodnota čtená ve zdroji (pdftotext, tabulky kontrolované na obrázku stránky).
Zapojeno v `app/public/countries/CA.js` (`limitsCA`), vše jen oranžově (Bára: žádné vymyšlené hodnoty; příručky jsou pro nový
návrh ve městě, aplikace čte stávající ulice a i obce kolem Toronta, kde neplatí).

## Zdroje

- **LWG**: City of Toronto, Road Engineering Design Guidelines, Lane Widths Guideline V3.0, listopad 2025
  (toronto.ca/wp-content/uploads/2025/11/96f7-Lane-Widths-Guideline-Version-3.0.pdf).
- **OSBDG**: City of Toronto, On-Street Bikeway Design Guidelines, 2023, soubor z 12/2025 (…/2025/12/951e-OSBDG-Finalv4.pdf); sloupce
  Default / Upper / Lower limit.
- **CSG**: Toronto Complete Streets Guidelines, 2017, kap. 4 (…/2017/11/98b5-Chapter-4.pdf).
- Toronto Municipal Code ch. 950 (znění 30. 7. 2026), Highway Traffic Act s. 170 (e-Laws, znění 1. 7. 2026).

## Zapojené hodnoty (základ, pod ním oranžově)

| díl | základ | co zdroj píše |
|---|---|---|
| chodník | 2,1 m | CSG odd. 4.3 (s. 78): „This minimum space (2.1 metres) provides a safe, universally accessible path“ |
| cyklopruh | 1,5 m | OSBDG tab. 3.4 (PDF s. 33): 1,6 / 1,8 / 1,5 |
| jednosměrná cyklostezka | 1,5 m | OSBDG tab. 3.1 (PDF s. 21): 2,1 / 2,6 / 1,5 při malém a středním provozu |
| obousměrná cyklostezka | 2,4 m | OSBDG tab. 3.2 (PDF s. 21): 3,5 / 4,5 / 2,4 |
| pruh pro autobusy | 3,3 m | LWG tab. 11 (PDF s. 23): „Priority Bus Lanes should be 3.3 m to 3.5 m wide.“ |
| jízdní pruh | 3,0 m | LWG tab. 5 (PDF s. 18): „Through lanes should be 3.0 m to 3.5 m wide.“; tab. 2 (s. 15): „The target width for curb lanes is 3.3 m.“, od 60 km/h nejméně 3,3, cíl 3,5 |
| řadicí pruh | 3,0 m | LWG tab. 6 a 7 (PDF s. 18–19) |
| podélné stání | 2,0 m | LWG tab. 12 (PDF s. 24): „Dedicated parking lanes should be 2.0 m to 2.4 m wide.“ (zda je 2,0 minimum nebo cíl, je z tabulky nejasné) |

Bez varování (šířku jsme ve zdroji nenašli): společná stezka, kolmé a šikmé stání, tramvajový pás (výkres T-216.02-10 uvádí „TTC
TRACK ALLOWANCE 5735“ mm, není to návrhové minimum), jednosměrka s cyklisty v protisměru (OSBDG tab. 3.6 má šířku protisměrného
cyklopruhu, ne vozovky).

## Stání

**3 m na směr** (`freeLane: 3`) je obvyklá šířka aplikace, **ne torontský předpis**: HTA s. 170 ani ch. 950 žádnou šířku volné
vozovky nemají (s. 170 (12) jen „interfere with the movement of traffic“; ch. 950 zakazuje stát na chodníku, u hydrantu do 3 m, u vjezdu
do 0,6 m, jinde podle značek). 6 m volné šířky zná jen stavební předpis pro příjezd hasičů na pozemku (OBC 3.2.5.6, znění zrušeného
O. Reg. 332/12). LWG s. 3.2 chce 6,0 m vozovky v místní ulici s cykloopatřením, pokud hasiči neschválí méně.

## Neověřeno

OTM Book 18 (nečtená v primárním zdroji), Multi-Use Trail Design Guidelines, TAC Geometric Design Guide (placený), ch. 903, 910,
880, současné OBC (O. Reg. 163/24). Městské předpisy obcí kolem Toronta jsme nehledali.
