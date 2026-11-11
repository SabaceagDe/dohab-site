/**
 * LES PRIX INDICATIFS (section « Prix » de l'accueil).
 *
 * from = prix de départ en euros, TVA comprise (prix pour particuliers),
 *        nombre entier sans point ni espace : 4500, pas "4.500".
 *        null = la carte affiche « Sur devis ».
 *
 * L'exemple de projet de chaque carte est dans i18n/*.json, clé
 * price.<id>.ex : si tu changes un prix, vérifie que l'exemple correspond
 * toujours (même taille, même matériau) dans les trois langues.
 * Pour ajouter une carte : une ligne ici + la clé price.<id>.ex.
 */
export interface Prix {
  id: string;
  key: string;            // clé de traduction du nom de la pièce
  from: number | null;
}

export const prix: Prix[] = [
  { id: 'cuisine',  key: 'filter.kitchen',  from: null },
  { id: 'dressing', key: 'filter.dressing', from: null },
  { id: 'salon',    key: 'filter.living',   from: null },
  { id: 'bain',     key: 'filter.bath',     from: null },
  { id: 'escalier', key: 'nav.stairs',      from: null }
];
