// Photos déposées depuis l'admin, lues dans le bucket R2 « dohab-photos ».
// Adresse publique : /media/r/<réalisation>/<uuid>.webp (ou -m.webp pour la
// version réduite). Le nom contient un identifiant aléatoire et ne change
// jamais : le navigateur peut garder l'image en cache un an.
import type { APIRoute } from 'astro';

export const prerender = false;

const KEY = /^r\/\d{1,9}\/[0-9a-f-]{36}(-m)?\.(webp|jpg)$/;

export const GET: APIRoute = async ({ params, locals, request }) => {
  const key = params.key ?? '';
  if (!KEY.test(key)) return new Response('Introuvable', { status: 404 });

  const etagIn = request.headers.get('if-none-match');
  const obj = await locals.runtime.env.PHOTOS.get(key, {
    onlyIf: etagIn ? { etagDoesNotMatch: etagIn.replace(/^W\//, '').replace(/"/g, '') } : undefined
  });
  if (!obj) return new Response('Introuvable', { status: 404 });

  const headers = new Headers({
    'Content-Type': obj.httpMetadata?.contentType ?? (key.endsWith('.jpg') ? 'image/jpeg' : 'image/webp'),
    'Cache-Control': 'public, max-age=31536000, immutable',
    ETag: obj.httpEtag,
    'X-Content-Type-Options': 'nosniff'
  });
  // objet sans corps = la condition If-None-Match est remplie : 304
  if (!('body' in obj)) return new Response(null, { status: 304, headers });
  return new Response(obj.body, { headers });
};
