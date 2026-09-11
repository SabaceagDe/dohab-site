import { defineConfig } from 'astro/config';

// Le néerlandais est la langue par défaut : elle vit à la racine (/).
// Le français et l'anglais sont préfixés (/fr/, /en/).
// Si un jour le français doit passer devant, il suffit de changer
// defaultLocale et de déplacer les pages — rien d'autre ne bouge.
export default defineConfig({
  site: 'https://dohab.be', // à remplacer par le vrai domaine
  i18n: {
    defaultLocale: 'nl',
    locales: ['nl', 'fr', 'en'],
    routing: { prefixDefaultLocale: false }
  }
});
