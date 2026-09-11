/**
 * TOUTES LES COORDONNÉES DU SITE SONT ICI.
 * Changer le numéro de téléphone = une ligne, une seule fois,
 * et l'en-tête, le pied de page et la section contact suivent.
 */
export const site = {
  name: 'DO HAB',
  legalName: 'DO HAB',
  street: 'Daalstraat 116A',
  postcode: '1790',
  city: 'Affligem',
  country: 'BE',

  // ⚠ À FAIRE CONFIRMER PAR LE PATRON avant la mise en ligne
  vat: 'BE 0803.752.490',

  phone: '+32 471 94 43 64',
  phoneHref: 'tel:+32471944364',
  whatsapp: 'https://wa.me/32471944364',
  email: 'info@dohab.be',

  // zone couverte, utilisée dans le JSON-LD et le pied de page
  areaServed: ['Vlaams-Brabant', 'Brussel', 'Bruxelles'],

  locales: ['nl', 'fr', 'en'] as const,
  defaultLocale: 'nl' as const
};

export type Locale = (typeof site.locales)[number];
