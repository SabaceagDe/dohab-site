// Photos d'une réalisation.
//
// _action=upload (appelé par le script de l'admin, une photo par requête) :
//   le navigateur a déjà réduit la photo (2000 px + une miniature 900 px) et
//   l'a réencodée, ce qui retire au passage les données EXIF — dont la
//   position GPS du téléphone, qui donnerait l'adresse du client.
//   Ici on revérifie tout : type réel du fichier (ses premiers octets, pas
//   son nom), taille, nombre de photos, puis on range les deux fichiers
//   dans R2 sous un nom aléatoire. Réponse en JSON.
//
// _action=delete | left | right | first : formulaires classiques, réponse
//   par redirection 303 vers la fiche de la réalisation.
import type { APIRoute } from 'astro';
import {
  addPhoto, countPhotos, deletePhotoRow, getPhoto, getRealisation, MAX_PHOTOS, movePhoto, r2Key
} from '../../../lib/realisations';
import { id } from '../../../lib/forms';

export const prerender = false;

const MAX_FULL = 8 * 1024 * 1024;
const MAX_THUMB = 2 * 1024 * 1024;

/** Type réel d'une image d'après ses premiers octets (« nombre magique »). */
function sniff(b: Uint8Array): 'webp' | 'jpg' | null {
  if (b.length > 12 && b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 &&
      b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50) return 'webp';   // RIFF....WEBP
  if (b.length > 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'jpg';    // JPEG
  return null;
}

async function readImage(v: FormDataEntryValue | null, max: number) {
  if (!v || typeof v === 'string' || v.size === 0 || v.size > max) return null;
  const bytes = new Uint8Array(await v.arrayBuffer());
  const kind = sniff(bytes);
  return kind ? { bytes, kind } : null;
}

const dim = (v: FormDataEntryValue | null) => {
  const n = typeof v === 'string' ? Number(v) : NaN;
  return Number.isInteger(n) && n > 0 && n <= 10000 ? n : null;
};

export const POST: APIRoute = async ({ request, locals, redirect }) => {
  const { DB: db, PHOTOS: bucket } = locals.runtime.env;
  const fd = await request.formData();
  const action = fd.get('_action');

  if (action === 'upload') {
    const realId = id(fd.get('realisation_id'));
    const real = realId ? await getRealisation(db, realId) : null;
    if (!real) return Response.json({ error: 'introuvable' }, { status: 404 });
    if ((await countPhotos(db, real.id)) >= MAX_PHOTOS) return Response.json({ error: 'trop' }, { status: 400 });

    const full = await readImage(fd.get('full'), MAX_FULL);
    if (!full) return Response.json({ error: 'photo' }, { status: 400 });
    const thumb = await readImage(fd.get('thumb'), MAX_THUMB);

    const name = crypto.randomUUID();
    const key = `r/${real.id}/${name}.${full.kind}`;
    const type = (k: string) => (k === 'webp' ? 'image/webp' : 'image/jpeg');
    await bucket.put(key, full.bytes, { httpMetadata: { contentType: type(full.kind) } });
    let thumbKey: string | null = null;
    if (thumb) {
      thumbKey = `r/${real.id}/${name}-m.${thumb.kind}`;
      await bucket.put(thumbKey, thumb.bytes, { httpMetadata: { contentType: type(thumb.kind) } });
    }
    const photoId = await addPhoto(db, real.id, {
      src: `/media/${key}`,
      thumb: thumbKey ? `/media/${thumbKey}` : null,
      width: dim(fd.get('width')),
      height: dim(fd.get('height'))
    });
    return Response.json({ id: photoId });
  }

  const photoId = id(fd.get('photo_id'));
  const photo = photoId ? await getPhoto(db, photoId) : null;
  if (!photo) return redirect('/admin/realisations?err=introuvable', 303);
  const back = `/admin/realisations/${photo.realisation_id}`;

  if (action === 'delete') {
    await deletePhotoRow(db, photo.id);
    // le fichier n'est retiré de R2 qu'après la ligne : au pire il reste un
    // fichier orphelin, jamais une ligne qui pointe vers une image absente
    const keys = [r2Key(photo.src), r2Key(photo.thumb)].filter((k): k is string => Boolean(k));
    if (keys.length) await bucket.delete(keys);
    return redirect(`${back}?ok=supprime`, 303);
  }
  if (action === 'left' || action === 'right' || action === 'first') {
    await movePhoto(db, photo.id, action);
    return redirect(`${back}?ok=ordre#photos`, 303);
  }
  return redirect(`${back}?err=action`, 303);
};
