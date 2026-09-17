/**
 * LES DIAPOS DU HAUT DE PAGE.
 *
 * L'idée : beaucoup de visiteurs ne descendent jamais. Le carrousel
 * annonce donc les quatre métiers dès le premier écran, au lieu de les
 * laisser attendre en bas de page.
 *
 * Pour ajouter ou retirer une diapo : une ligne ici. Les textes se
 * traduisent dans src/i18n/*.json sous les clés indiquées dans `cles`.
 * `lien` est la destination du bouton secondaire ; "#work-cuisine"
 * descend à la galerie ET applique le filtre cuisine (voir Gallery.astro).
 */
export interface Diapo {
  id: string;
  photo?: string;      // fichier dans public/photos/
  dessin?: string;     // fichier dans public/illustrations/ — diapo claire
  lien: string;
  cles: { eyebrow: string; titre: string; sub: string; cta: string };
}

export const diapos: Diapo[] = [
  {
    id: 'atelier',
    photo: 'cuisine-noyer-hotte.webp',
    lien: '#work',
    cles: { eyebrow: 'hero.eyebrow', titre: 'hero.h1', sub: 'hero.sub', cta: 'hero.cta2' }
  },
  {
    id: 'cuisines',
    photo: 'cuisine-noyer-ilot-noir.webp',
    lien: '#work-cuisine',
    cles: { eyebrow: 'sl2.eyebrow', titre: 'sl2.h', sub: 'sl2.sub', cta: 'sl2.cta' }
  },
  {
    id: 'meubles',
    photo: 'armoire-etageres-noyer.webp',
    lien: '#work-dressing',
    cles: { eyebrow: 'sl3.eyebrow', titre: 'sl3.h', sub: 'sl3.sub', cta: 'sl3.cta' }
  },
  {
    id: 'salon',
    photo: 'mur-tv-gris-cheminee.webp',
    lien: '#work-salon',
    cles: { eyebrow: 'sl5.eyebrow', titre: 'sl5.h', sub: 'sl5.sub', cta: 'sl5.cta' }
  },
  {
    // Pas encore de photo d'escalier terminé : on montre le dessin, sur
    // fond clair. Le jour où le patron en envoie une, remplace `dessin`
    // par `photo` et la diapo repasse en photo pleine comme les autres.
    id: 'escaliers',
    dessin: 'escalier-quart-tournant.svg',
    lien: '#escaliers',
    cles: { eyebrow: 'sl4.eyebrow', titre: 'sl4.h', sub: 'sl4.sub', cta: 'sl4.cta' }
  }
];
