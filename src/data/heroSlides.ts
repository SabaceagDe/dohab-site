/**
 * LES DIAPOS DU HAUT DE PAGE.
 *
 * L'idée : beaucoup de visiteurs ne descendent jamais. Le carrousel
 * annonce donc chaque pièce dès le premier écran, au lieu de les
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
  // Sur ordinateur la diapo est très large et peu haute : une photo prise
  // en portrait n'en montre qu'une bande. `cadrage` choisit laquelle —
  // '50% 0%' garde le haut, '50% 100%' le bas. Sans effet sur téléphone.
  cadrage?: string;
  lien: string;
  cles: { eyebrow: string; titre: string; sub: string; cta: string };
}

export const diapos: Diapo[] = [
  // La première diapo porte le <h1> de la page (voir Hero.astro).
  {
    id: 'cuisines',
    photo: 'cuisine-noyer-hotte.webp',
    lien: '#work-cuisine',
    cles: { eyebrow: 'sl2.eyebrow', titre: 'sl2.h', sub: 'sl2.sub', cta: 'sl2.cta' }
  },
  {
    id: 'chambre',
    photo: 'chambre-tv-cannele.webp',
    cadrage: '50% 62%',
    lien: '#work-dressing',
    cles: { eyebrow: 'sl6.eyebrow', titre: 'sl6.h', sub: 'sl6.sub', cta: 'sl6.cta' }
  },
  {
    id: 'armoires',
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
    id: 'bain',
    photo: 'bain-noyer-miroir-ovale.webp',
    cadrage: '50% 82%',
    lien: '#work-bain',
    cles: { eyebrow: 'sl7.eyebrow', titre: 'sl7.h', sub: 'sl7.sub', cta: 'sl7.cta' }
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
