// One page for the whole Czech Republic (Bára 10. 11. 2026). The former city sites (/brno/, /jihlava/, …)
// stay as small pages that send their visitors (and old links with a cut, #rez=…) to the one page, which
// opens the map over that city (?mesto=…). The local server answers those addresses the same way.

// The page left at /<city>/index.html.
export const redirectPage = (id) => `<!doctype html>
<html lang="cs"><head><meta charset="utf-8"><title>Profily ulic</title>
<meta http-equiv="refresh" content="0; url=../?mesto=${id}">
<script>location.replace("../?mesto=${id}" + location.hash);</script>
</head><body><p><a href="../?mesto=${id}">Profily ulic</a></p></body></html>
`;
