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

  // Numéro d'entreprise confirmé par Denis ; clé de contrôle mod 97 vérifiée.
  // Identique au numéro de TVA : en Belgique c'est le même.
  vat: 'BE 0803.752.490',
  enterpriseNumber: '0803.752.490',

  // Données publiques de la Banque-Carrefour des Entreprises (BCE).
  // La forme juridique et la ville du RPM se traduisent : voir les clés
  // legal.formv et legal.rpmv dans src/i18n/*.json.
  manager: 'Ivan Ursu',        // gérant, mentionné comme responsable du site
  incorporated: '2023-07-08',

  // Hébergeur, à mentionner dans les mentions légales
  host: {
    name: 'Cloudflare, Inc.',
    address: '101 Townsend Street, San Francisco, CA 94107, USA',
    url: 'https://www.cloudflare.com'
  },

  // Sous-traitant qui achemine le formulaire de contact
  formProcessor: {
    name: 'Web3Forms',
    privacy: 'https://web3forms.com/privacy'
  },

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
