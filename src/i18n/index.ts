import nl from './nl.json';
import fr from './fr.json';
import en from './en.json';
import { site, type Locale } from '../site.config';

const dictionaries = { nl, fr, en } as const;

/**
 * t('nl')('hero.h1') → la chaîne néerlandaise.
 * Si une clé manque dans une langue, on renvoie la clé elle-même :
 * ça saute aux yeux en développement au lieu d'afficher du vide.
 */
export function t(locale: Locale) {
  const dict = dictionaries[locale] as Record<string, string>;
  return (key: string): string => dict[key] ?? key;
}

/** Le chemin d'accueil d'une langue : nl → "/", fr → "/fr/" */
export const localeHref = (locale: Locale) => (locale === 'nl' ? '/' : `/${locale}/`);

/**
 * Les mentions légales. L'adresse est traduite elle aussi : un visiteur
 * francophone n'a pas de raison d'atterrir sur une URL néerlandaise.
 * Pour renommer une de ces pages : change le nom du fichier dans
 * src/pages/ ET la ligne correspondante ci-dessous, rien d'autre.
 */
const legalPaths = {
  nl: '/juridische-informatie/',
  fr: '/fr/mentions-legales/',
  en: '/en/legal-notice/'
} as const;

export const legalHref = (locale: Locale) => legalPaths[locale];

export const locales = ['nl', 'fr', 'en'] as const;

/**
 * Lien WhatsApp avec un premier message déjà écrit dans la langue de la
 * page (clé wa.text) : le client n'a plus qu'à appuyer sur « envoyer ».
 */
export const whatsappHref = (locale: Locale) =>
  `${site.whatsapp}?text=${encodeURIComponent(t(locale)('wa.text'))}`;

/**
 * Montant en euros, sans centimes, à la manière de chaque langue :
 * fr « 8 450 € » · nl « € 8.450 » · en « €8,450 ».
 */
export function euros(locale: Locale, cents: number): string {
  const tag = locale === 'en' ? 'en-IE' : `${locale}-BE`;
  return new Intl.NumberFormat(tag, { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })
    .format(Math.round(cents / 100));
}
