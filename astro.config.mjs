import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';

// Le néerlandais est la langue par défaut : elle vit à la racine (/).
// Le français et l'anglais sont préfixés (/fr/, /en/).
// Si un jour le français doit passer devant, il suffit de changer
// defaultLocale et de déplacer les pages — rien d'autre ne bouge.
//
// Par défaut les pages sont statiques (générées au build). Celles qui
// déclarent `export const prerender = false` tournent côté serveur, dans le
// Worker Cloudflare, avec la base D1 : les trois pages d'accueil (galerie et
// prix lus dans la base), /media/* (photos R2) et tout /admin.
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
