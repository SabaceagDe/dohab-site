import nl from './nl.json';
import fr from './fr.json';
import en from './en.json';
import type { Locale } from '../site.config';

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

export const locales = ['nl', 'fr', 'en'] as const;
