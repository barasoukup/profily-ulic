-- Profily ulic: what visitors do, one row per event (the Worker of logging/worker.js writes it).
-- A cut is stored exactly (Bára: there is nothing personal in a cut): its position, bearing and reach as in
-- the link #rez=…, the city, street and street type. No IP address, no cookie: "session" is a random id
-- of one page load, so the cuts of one visit can be counted together.
CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ts TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  kind TEXT NOT NULL,        -- rez | export | ulozeni | sdileni | navrh | porovnat | oprava | hledani | upravy | hlaseni | bez_ulice
  detail TEXT,               -- rez: klik | posun | odkaz; export: png | svg; upravy: oprava | navrh; bez_ulice: bez_ulice | bez_dat
  city TEXT,                 -- city.js id: praha, brno, bratislava, wien … or the rest of a state: cesko, slovensko, austria, cizina
  country TEXT,              -- the state of the cut, ISO 3166-1 (CZ, SK, AT; empty abroad)
  street TEXT,
  highway TEXT,              -- OSM highway of the street
  way_id INTEGER,            -- OSM way
  lat REAL, lon REAL,        -- the cut's centre (WGS 84)
  bearing REAL,              -- degrees, as in #rez=
  reach_left REAL, reach_right REAL,
  session TEXT,
  profile TEXT               -- upravy: {pred, po} short profiles (log.js shortProfile); hlaseni: {co, text, vypocet, stav}
);
-- Added 11. 11. 2026 to the existing database: ALTER TABLE events ADD COLUMN profile TEXT;
-- Added 16. 11. 2026 (cities of every state, the state apart): ALTER TABLE events ADD COLUMN country TEXT;
CREATE INDEX IF NOT EXISTS events_ts ON events (ts);
CREATE INDEX IF NOT EXISTS events_kind_city ON events (kind, city);

-- Messages from the About dialog (Bára 24. 11. 2026; worker.js POST /contact). For the existing database run this file
-- again (logging/README.md): every table is IF NOT EXISTS, nothing else changes.
CREATE TABLE IF NOT EXISTS contacts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ts TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  message TEXT NOT NULL,     -- at most 3 000 characters
  email TEXT,                -- for a reply, only when the visitor gave one
  cut TEXT,                  -- the link of the cut (#rez=…), only when attached
  lang TEXT,                 -- the page's language (cs, en …)
  country TEXT               -- the state of the cut, ISO 3166-1
);
-- The rate limit of messages: a count an hour by a SHA-256 of the hour, the address and the secret RATE_SALT (the address
-- itself is never kept); rows older than two hours are deleted by the Worker.
CREATE TABLE IF NOT EXISTS contact_rate (
  k TEXT PRIMARY KEY,
  hour TEXT NOT NULL,
  n INTEGER NOT NULL
);
