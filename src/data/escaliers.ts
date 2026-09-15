/**
 * LES CONFIGURATIONS D'ESCALIER.
 *
 * Pour l'instant ce sont des dessins techniques (public/illustrations/),
 * en attendant les photos de chantiers terminés. Le jour où tu as une
 * vraie photo : dépose le fichier dans public/illustrations/ et change
 * la ligne `image` ci-dessous. Rien d'autre à toucher.
 *
 * Le titre et la description se traduisent dans src/i18n/*.json sous
 * les clés "<id>.t" et "<id>.c", exactement comme les réalisations.
 */
export interface Escalier {
  id: string;      // sert de clé de traduction
  image: string;   // nom du fichier dans public/illustrations/
}

export const escaliers: Escalier[] = [
  { id: 'esc-droit', image: 'escalier-droit.svg' },
  { id: 'esc-quart', image: 'escalier-quart-tournant.svg' },
  { id: 'esc-demi', image: 'escalier-demi-tournant.svg' },
  { id: 'esc-garde-corps', image: 'garde-corps.svg' }
];
