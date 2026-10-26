import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';

// Le néerlandais est la langue par défaut : elle vit à la racine (/).
// Le français et l'anglais sont préfixés (/fr/, /en/).
// Si un jour le français doit passer devant, il suffit de changer
// defaultLocale et de déplacer les pages — rien d'autre ne bouge.
//
// Le site public reste 100 % statique (output par défaut). Seules les pages
// qui déclarent `export const prerender = false` (tout ce qui est sous
// /admin) tournent côté serveur, dans le Worker Cloudflare, avec la base D1.
//
// Adaptateur en v12 : c'est la dernière version compatible Astro 5.
// Les v13/v14 exigent Astro 6/7 — monter Astro sera un chantier séparé.
export default defineConfig({
  site: 'https://dohab.be',
  adapter: cloudflare({
    // en `npm run dev`, fournit env.DB à partir de la base locale (.wrangler/)
    platformProxy: { enabled: true }
  }),
  i18n: {
    defaultLocale: 'nl',
    locales: ['nl', 'fr', 'en'],
    routing: { prefixDefaultLocale: false }
  },
  // l'ancienne page de calcul vit désormais derrière la connexion admin
  redirects: {
    '/calcul': '/admin/calcul'
  }
});
