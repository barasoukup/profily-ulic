-- Profily ulic: what visitors do, one row per event (the Worker of logging/worker.js writes it).
-- A cut is stored exactly (Bára: there is nothing personal in a cut): its position, bearing and reach as in
-- the link #rez=…, the city, street and street type. No IP address, no cookie: "session" is a random id
-- of one page load, so the cuts of one visit can be counted together.
CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ts TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  kind TEXT NOT NULL,        -- rez | export | ulozeni | sdileni | navrh | porovnat | oprava | hledani | upravy | hlaseni
  detail TEXT,               -- rez: klik | posun | odkaz; export: png | svg; upravy: oprava | navrh
  city TEXT,                 -- city.js id: praha, brno, … or cesko
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
CREATE INDEX IF NOT EXISTS events_ts ON events (ts);
CREATE INDEX IF NOT EXISTS events_kind_city ON events (kind, city);
