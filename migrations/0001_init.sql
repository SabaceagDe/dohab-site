-- Suivi des paiements clients (montants HTVA, en centimes d'euro).
--
-- Principe : on ne stocke JAMAIS l'acompte ni le reste à payer.
-- Une commande a un total ; chaque versement est une ligne de `payments`.
-- payé = somme des versements, reste = total - payé, calculés à la lecture.
-- Impossible donc qu'un « reste » saisi à la main ne colle plus aux versements.
--
-- Suppression = on remplit deleted_at (rien n'est effacé pour de vrai).

CREATE TABLE orders (
  id            INTEGER PRIMARY KEY,
  client_name   TEXT    NOT NULL CHECK (length(trim(client_name)) > 0),
  client_phone  TEXT,
  address       TEXT,
  label         TEXT,                      -- ex. « Cuisine + dressing »
  total_cents   INTEGER NOT NULL CHECK (total_cents > 0),
  note          TEXT,
  created_at    TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT,
  deleted_at    TEXT
);

CREATE TABLE payments (
  id            INTEGER PRIMARY KEY,
  order_id      INTEGER NOT NULL REFERENCES orders(id),
  amount_cents  INTEGER NOT NULL CHECK (amount_cents > 0),
  paid_on       TEXT    NOT NULL CHECK (date(paid_on) IS paid_on),  -- AAAA-MM-JJ
  method        TEXT    CHECK (method IN ('virement', 'cash', 'autre')),
  note          TEXT,
  created_at    TEXT    NOT NULL DEFAULT (datetime('now')),
  deleted_at    TEXT
);

CREATE INDEX payments_order ON payments(order_id);
