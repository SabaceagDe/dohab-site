/**
 * LES QUATRE TUILES DE PIÈCE en haut de page.
 * key = clé de traduction, la même que celle du filtre correspondant.
 */
export const rooms = [
  {
    "room": "dressing",
    "key": "filter.dressing",
    "photo": "armoire-noyer.webp"
  },
  {
    "room": "cuisine",
    "key": "filter.kitchen",
    "photo": "cuisine-ilot-marbre.webp"
  },
  {
    "room": "salon",
    "key": "filter.living",
    "photo": "mur-tv-pierre.webp"
  },
  {
    "room": "bain",
    "key": "filter.bath",
    "photo": "bain-noyer-miroir-ovale.webp"
  }
] as const;
