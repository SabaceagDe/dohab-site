# dohab-site

Site vitrine DO HAB — Astro, généré en statique, trois langues.
Aucun serveur, aucune base de données : le build produit des fichiers HTML.

## Démarrer

```bash
npm install
npm run dev      # http://localhost:4321
```

`npm run build` produit le site final dans `dist/`. C'est ce dossier
qu'on déposera sur Cloudflare Pages ou Netlify.

## Où se trouve quoi

| Je veux changer… | J'ouvre… |
| --- | --- |
| un numéro, un e-mail, la TVA, l'adresse | `src/site.config.ts` |
| n'importe quel texte visible | `src/i18n/nl.json`, `fr.json`, `en.json` |
| ajouter / retirer une réalisation | `src/data/projets.ts` + la photo dans `public/photos/` |
| les teintes du nuancier | `src/data/finitions.ts` |
| les quatre tuiles de pièce | `src/data/rooms.ts` |
| les couleurs, la typo, les espacements | `src/styles/tokens.css` |
| le reste du style | `src/styles/global.css` |
| la structure d'une section | `src/components/*.astro` |
| l'ordre des sections | `src/pages/index.astro` (et `fr/`, `en/`) |

## Comment c'est construit

```
src/
├─ site.config.ts     coordonnées de l'entreprise, une seule source
├─ data/              les réalisations, les teintes, les pièces
├─ i18n/              les trois dictionnaires + le helper t()
├─ styles/            tokens.css (couleurs, typo) + global.css
├─ layouts/Base.astro <head>, hreflang, JSON-LD, script d'apparition
├─ components/        une section = un composant
└─ pages/             index.astro (nl) · fr/index.astro · en/index.astro
```

Le frontmatter d'un composant (entre les `---`) tourne **au build**.
Le markup en dessous devient du HTML figé. Seuls les `<script>` partent
dans le navigateur — ici uniquement pour le filtrage, l'agrandissement
des photos et les apparitions au défilement.

`src/components/Gallery.astro` est le composant de référence :
il montre le schéma que suivent tous les autres.

### Les langues

Le néerlandais est à la racine (`/`), le français et l'anglais sont
préfixés (`/fr/`, `/en/`). Ce sont trois vraies pages, pas un bouton
JavaScript : Google peut les indexer séparément et chacune déclare ses
sœurs en `hreflang`. Pour mettre le français devant, il suffit de changer
`defaultLocale` dans `astro.config.mjs` et de déplacer les pages.

## À faire (dans l'ordre)

1. **Brancher le formulaire** — clé gratuite sur web3forms.com, à coller
   dans `src/components/Contact.astro`, puis remplacer le `<script>` de
   démonstration par un vrai `fetch`. Sans ça le formulaire n'envoie rien.
2. **Page mentions légales** — `src/pages/mentions-legales.astro` et ses
   deux traductions. Nom légal, adresse, numéro d'entreprise, contact,
   plus une note vie privée pour le formulaire. Obligatoire en Belgique.
3. **Confirmer le numéro de TVA** auprès du patron (`src/site.config.ts`).
4. **Photos en pleine résolution** — celles-ci sont passées par WhatsApp
   (598 px de petit côté). Le héros en a besoin.
5. **Passer les images à `astro:assets`** — déplacer `public/photos` vers
   `src/photos`, importer, utiliser `<Picture />`. Astro génère alors
   l'AVIF, le WebP et le `srcset` tout seul. C'est le plus gros gain de
   performance restant.
6. **Sitemap** — `npx astro add sitemap`.
7. **Déploiement** — Cloudflare Workers, connecté au dépôt GitHub.
   `wrangler.jsonc` à la racine dit simplement : sers le dossier `dist`.
   Chaque `git push` sur `main` relance le build et met le site à jour.
   Domaine et compte au nom de l'entreprise.

## Ce qu'on ne construit pas

Pas de comptes, pas d'espace client, pas de back-office, pas de
calculateur de prix, pas de réservation en ligne, pas de bannière
cookies (parce qu'aucun cookie tiers n'est posé).

## Référence

`reference-maquette.html` est la maquette d'origine en un seul fichier.
Elle n'est pas utilisée par le site, elle sert de repère visuel.
