/**
 * LES RÉALISATIONS.
 * Ajouter un chantier = déposer la photo dans public/photos/
 * et ajouter une ligne ici. Le titre et la description se
 * traduisent dans src/i18n/*.json sous la clé "<id>.t" et "<id>.c".
 */
export type Room = 'dressing' | 'cuisine' | 'salon' | 'bain';

export interface Projet {
  id: string;      // sert de clé de traduction
  photo: string;   // nom du fichier dans public/photos/
  room: Room;
  finish: string;  // id d'une finition (src/data/finitions.ts)
}

export const projets: Projet[] = [
  {
    "id": "cuisine-noyer-ilot-noir",
    "photo": "cuisine-noyer-ilot-noir.webp",
    "room": "cuisine",
    "finish": "noyer"
  },
  {
    "id": "cuisine-noyer-hotte",
    "photo": "cuisine-noyer-hotte.webp",
    "room": "cuisine",
    "finish": "noyer"
  },
  {
    "id": "cuisine-ilot-marbre",
    "photo": "cuisine-ilot-marbre.webp",
    "room": "cuisine",
    "finish": "noyer"
  },
  {
    "id": "cuisine-chene-vitrines",
    "photo": "cuisine-chene-vitrines.webp",
    "room": "cuisine",
    "finish": "chene"
  },
  {
    "id": "cuisine-chene-colonnes",
    "photo": "cuisine-chene-colonnes.webp",
    "room": "cuisine",
    "finish": "chene"
  },
  {
    "id": "cuisine-blanche-u",
    "photo": "cuisine-blanche-u.webp",
    "room": "cuisine",
    "finish": "blanc"
  },
  {
    "id": "cuisine-creme-fenetre",
    "photo": "cuisine-creme-fenetre.webp",
    "room": "cuisine",
    "finish": "creme"
  },
  {
    "id": "cuisine-ilot-noir",
    "photo": "cuisine-ilot-noir.webp",
    "room": "cuisine",
    "finish": "blanc"
  },
  {
    "id": "cuisine-classique-vitrines",
    "photo": "cuisine-classique-vitrines.webp",
    "room": "cuisine",
    "finish": "creme"
  },
  {
    "id": "cuisine-ilot-pierre",
    "photo": "cuisine-ilot-pierre.webp",
    "room": "cuisine",
    "finish": "blanc"
  },
  {
    "id": "cuisine-vitrines-lumiere",
    "photo": "cuisine-vitrines-lumiere.webp",
    "room": "cuisine",
    "finish": "gris"
  },
  {
    "id": "mur-tv-pierre",
    "photo": "mur-tv-pierre.webp",
    "room": "salon",
    "finish": "blanc"
  },
  {
    "id": "salon-panneau-chene",
    "photo": "salon-panneau-chene.webp",
    "room": "salon",
    "finish": "chene"
  },
  {
    "id": "bibliotheque-bleue",
    "photo": "bibliotheque-bleue.webp",
    "room": "salon",
    "finish": "bleu"
  },
  {
    "id": "meuble-tv-cannele",
    "photo": "meuble-tv-cannele.webp",
    "room": "salon",
    "finish": "blanc"
  },
  {
    "id": "chambre-tv-cannele",
    "photo": "chambre-tv-cannele.webp",
    "room": "salon",
    "finish": "blanc"
  },
  {
    "id": "armoire-grise-niche",
    "photo": "armoire-grise-niche.webp",
    "room": "dressing",
    "finish": "gris"
  },
  {
    "id": "armoire-noyer",
    "photo": "armoire-noyer.webp",
    "room": "dressing",
    "finish": "noyer"
  },
  {
    "id": "entree-noyer-banc",
    "photo": "entree-noyer-banc.webp",
    "room": "dressing",
    "finish": "noyer"
  },
  {
    "id": "rangement-colonnes-noires",
    "photo": "rangement-colonnes-noires.webp",
    "room": "dressing",
    "finish": "blanc"
  },
  {
    "id": "dressing-portes-verre",
    "photo": "dressing-portes-verre.webp",
    "room": "dressing",
    "finish": "blanc"
  },
  {
    "id": "armoire-chene-vitrine",
    "photo": "armoire-chene-vitrine.webp",
    "room": "dressing",
    "finish": "chene"
  },
  {
    "id": "armoire-etageres-noyer",
    "photo": "armoire-etageres-noyer.webp",
    "room": "dressing",
    "finish": "blanc"
  },
  {
    "id": "armoire-classique-angle",
    "photo": "armoire-classique-angle.webp",
    "room": "dressing",
    "finish": "creme"
  },
  {
    "id": "bain-noyer-miroir-ovale",
    "photo": "bain-noyer-miroir-ovale.webp",
    "room": "bain",
    "finish": "noyer"
  },
  {
    "id": "bain-chene-grand-miroir",
    "photo": "bain-chene-grand-miroir.webp",
    "room": "bain",
    "finish": "chene"
  },
  {
    "id": "bain-chene-liseres-noirs",
    "photo": "bain-chene-liseres-noirs.webp",
    "room": "bain",
    "finish": "chene"
  }
];
