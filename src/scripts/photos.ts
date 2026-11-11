/**
 * Envoi des photos depuis l'admin (code exécuté dans le navigateur).
 *
 * Une photo de téléphone fait 3 à 8 Mo et 4000 px de large. Avant l'envoi,
 * on la redessine dans un <canvas> :
 *   - version « grande » : 2000 px maximum, pour l'agrandissement ;
 *   - miniature : 900 px, pour la grille de la galerie ;
 *   - format WebP (JPEG si le navigateur ne sait pas écrire du WebP) ;
 *   - le réencodage supprime les données EXIF, dont la position GPS.
 * Résultat : environ 300 à 600 Ko par photo, envoyés une par une.
 */

export const FULL_PX = 2000;
export const THUMB_PX = 900;

async function load(file: File): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(file);
  const img = new Image();
  img.src = url;
  try {
    await img.decode();          // l'orientation EXIF est appliquée par le navigateur
  } catch {
    URL.revokeObjectURL(url);
    throw new Error('format');   // ex. photo HEIC sur un ordinateur Windows
  }
  return img;
}

function encode(img: HTMLImageElement, max: number, quality: number): Promise<{ blob: Blob; w: number; h: number }> {
  const scale = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
  const w = Math.round(img.naturalWidth * scale);
  const h = Math.round(img.naturalHeight * scale);
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, w, h);
  return new Promise((resolve, reject) => {
    canvas.toBlob((webp) => {
      // Safari ancien : pas d'encodeur WebP, il renvoie du PNG → on passe en JPEG
      if (webp && webp.type === 'image/webp') return resolve({ blob: webp, w, h });
      canvas.toBlob((jpg) => (jpg ? resolve({ blob: jpg, w, h }) : reject(new Error('format'))), 'image/jpeg', quality);
    }, 'image/webp', quality);
  });
}

/** Réduit puis envoie une photo. Lève une erreur (code court) en cas d'échec. */
export async function uploadPhoto(realisationId: number | string, file: File): Promise<void> {
  const img = await load(file);
  const full = await encode(img, FULL_PX, 0.82);
  const thumb = await encode(img, THUMB_PX, 0.78);
  URL.revokeObjectURL(img.src);

  const ext = (b: Blob) => (b.type === 'image/webp' ? 'webp' : 'jpg');
  const fd = new FormData();
  fd.set('_action', 'upload');
  fd.set('realisation_id', String(realisationId));
  fd.set('width', String(full.w));
  fd.set('height', String(full.h));
  fd.set('full', full.blob, `photo.${ext(full.blob)}`);
  fd.set('thumb', thumb.blob, `mini.${ext(thumb.blob)}`);

  let res: Response;
  try {
    res = await fetch('/admin/api/photos', { method: 'POST', body: fd, headers: { Accept: 'application/json' } });
  } catch {
    // réseau coupé, ou session Cloudflare Access expirée (redirection refusée)
    throw new Error('reseau');
  }
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? 'photo');
  }
}

export const uploadError: Record<string, string> = {
  format: 'format non lu par ce navigateur (essayez depuis le téléphone, ou en JPEG)',
  reseau: 'connexion perdue ou session expirée — rechargez la page',
  photo: 'fichier refusé',
  trop: '30 photos maximum par réalisation',
  introuvable: 'réalisation introuvable'
};
