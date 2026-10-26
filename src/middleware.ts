/**
 * Garde de /admin.
 *
 * Cloudflare Access se place devant dohab.be/admin et n'y laisse passer que
 * les e-mails autorisés. Ce middleware vérifie EN PLUS, dans le Worker, la
 * signature du jeton qu'Access ajoute à chaque requête (en-tête
 * Cf-Access-Jwt-Assertion). Défense en profondeur : si Access était mal
 * configuré, ou si le Worker était atteint par une autre route qu'Access ne
 * couvre pas, /admin refuse quand même.
 *
 * Le site public (pages statiques) ne passe jamais par ici.
 */
import { defineMiddleware } from 'astro:middleware';
import { createRemoteJWKSet, jwtVerify } from 'jose';

// Les clés publiques d'Access, mises en cache par instance du Worker.
let jwks: ReturnType<typeof createRemoteJWKSet> | null = null;
let jwksTeam = '';

function keysFor(team: string) {
  if (!jwks || jwksTeam !== team) {
    jwks = createRemoteJWKSet(new URL(`${team}/cdn-cgi/access/certs`));
    jwksTeam = team;
  }
  return jwks;
}

function deny(status: number, message: string) {
  return new Response(message, {
    status,
    headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' }
  });
}

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = context.url;
  if (pathname !== '/admin' && !pathname.startsWith('/admin/')) return next();

  // Anti-CSRF : un formulaire posté depuis un autre site porterait le cookie
  // Access du patron. Tout envoi doit venir de notre propre origine.
  const method = context.request.method;
  if (method !== 'GET' && method !== 'HEAD') {
    const origin = context.request.headers.get('origin');
    if (origin !== context.url.origin) return deny(403, 'Origine refusée.');
  }

  if (import.meta.env.DEV) {
    // `npm run dev` en local : pas d'Access devant localhost.
    context.locals.user = 'dev@localhost';
  } else {
    const env = context.locals.runtime?.env;
    const team = env?.ACCESS_TEAM_DOMAIN?.replace(/\/+$/, '');
    const aud = env?.ACCESS_AUD;
    // On échoue fermé : pas configuré = personne n'entre.
    if (!team || !aud) return deny(503, 'Admin non configuré (Cloudflare Access).');

    const token = context.request.headers.get('cf-access-jwt-assertion');
    if (!token) return deny(403, 'Accès refusé.');

    try {
      const { payload } = await jwtVerify(token, keysFor(team), { issuer: team, audience: aud });
      context.locals.user = typeof payload.email === 'string' ? payload.email : undefined;
    } catch {
      return deny(403, 'Accès refusé.');
    }
  }

  // Copie : certaines réponses (redirections) ont des en-têtes non modifiables.
  const original = await next();
  const response = new Response(original.body, original);
  // Données financières : jamais en cache, jamais indexées.
  response.headers.set('Cache-Control', 'no-store');
  response.headers.set('X-Robots-Tag', 'noindex, nofollow');
  response.headers.set('Referrer-Policy', 'same-origin');
  return response;
});
