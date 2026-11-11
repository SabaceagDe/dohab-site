-- Réalisations : les meubles réellement posés, avec leurs photos et, si on
-- le souhaite, le prix auquel ils ont été vendus. Gérées depuis
-- /admin/realisations, affichées dans la galerie et la section « Prix ».
--
-- Une réalisation = une pièce (cuisine, chambre…) + une ou plusieurs photos.
-- Le prix est toujours enregistré en centimes (comme les paiements) ; il
-- n'apparaît sur le site que si show_price = 1.
CREATE TABLE IF NOT EXISTS realisations (
  id           INTEGER PRIMARY KEY,
  room         TEXT    NOT NULL CHECK (room IN ('cuisine', 'dressing', 'salon', 'bain', 'escalier')),
  finish       TEXT,                    -- id d'une teinte (src/data/finitions.ts) ou NULL
  title_fr     TEXT,                    -- NULL = le nom de la pièce
  title_nl     TEXT,                    -- NULL = le texte français
  title_en     TEXT,
  desc_fr      TEXT,
  desc_nl      TEXT,
  desc_en      TEXT,
  commune      TEXT,                    -- la ville seulement, jamais l'adresse du client
  year         INTEGER CHECK (year IS NULL OR year BETWEEN 2000 AND 2100),
  price_cents  INTEGER CHECK (price_cents IS NULL OR price_cents > 0),   -- TVA comprise
  show_price   INTEGER NOT NULL DEFAULT 0 CHECK (show_price IN (0, 1)),
  published    INTEGER NOT NULL DEFAULT 0 CHECK (published IN (0, 1)),
  sort         INTEGER NOT NULL DEFAULT 0,  -- plus grand = plus haut dans sa pièce
  legacy_id    TEXT UNIQUE,             -- id dans l'ancienne galerie (import)
  created_by   TEXT,
  created_at   TEXT    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   TEXT,
  deleted_at   TEXT
);

-- src / thumb : adresse de l'image telle que le site l'affiche.
--   '/photos/xxx.webp'      fichier livré avec le site (galerie importée)
--   '/media/r/12/….webp'    image déposée depuis l'admin, stockée dans R2
-- Pour une image R2, la clé de l'objet est l'adresse sans '/media/'.
CREATE TABLE IF NOT EXISTS realisation_photos (
  id              INTEGER PRIMARY KEY,
  realisation_id  INTEGER NOT NULL REFERENCES realisations(id),
  src             TEXT    NOT NULL,
  thumb           TEXT,                 -- version réduite pour la grille ; NULL = src
  width           INTEGER,
  height          INTEGER,
  position        INTEGER NOT NULL DEFAULT 0,   -- 0 = photo de couverture
  created_at      TEXT    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS realisations_public ON realisations(published, deleted_at, room, sort);
CREATE INDEX IF NOT EXISTS realisation_photos_parent ON realisation_photos(realisation_id, position);
