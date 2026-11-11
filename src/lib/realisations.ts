/**
 * Réalisations : toutes les requêtes SQL (admin et site public).
 * Même règles que lib/db.ts : requêtes paramétrées uniquement, prix en
 * centimes, suppression logique (deleted_at) pour les réalisations.
 * Les photos, elles, sont vraiment supprimées (ligne + fichier R2) :
 * il n'y a pas d'historique à garder sur une image retirée.
 */

export const ROOMS = ['cuisine', 'dressing', 'salon', 'bain', 'escalier'] as const;
export type Room = (typeof ROOMS)[number];

/** Clé de traduction du nom de chaque pièce (src/i18n/*.json). */
export const roomKey: Record<Room, string> = {
  cuisine: 'filter.kitchen',
  dressing: 'filter.dressing',
  salon: 'filter.living',
  bain: 'filter.bath',
  escalier: 'nav.stairs'
};

/** Noms des pièces dans l'admin (en français, comme le reste de l'admin). */
export const roomFr: Record<Room, string> = {
  cuisine: 'Cuisine',
  dressing: 'Chambre / dressing',
  salon: 'Salon & TV',
  bain: 'Salle de bain',
  escalier: 'Escalier'
};

/** Ordre d'affichage des pièces dans la galerie « Toutes ». */
export const ROOM_ORDER: Room[] = ['cuisine', 'salon', 'dressing', 'bain', 'escalier'];

export const MAX_PHOTOS = 30;

export interface RealisationInput {
  room: Room;
  finish: string | null;
  title_fr: string | null;
  title_nl: string | null;
  title_en: string | null;
  desc_fr: string | null;
  desc_nl: string | null;
  desc_en: string | null;
  commune: string | null;
  year: number | null;
  price_cents: number | null;
  show_price: 0 | 1;
  published: 0 | 1;
}

export interface RealisationRow extends RealisationInput {
  id: number;
  sort: number;
  created_by: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface ListRow extends RealisationRow {
  photo_count: number;
  cover: string | null;
}

export interface PhotoRow {
  id: number;
  realisation_id: number;
  src: string;
  thumb: string | null;
  width: number | null;
  height: number | null;
  position: number;
}

const COLS = `id, room, finish, title_fr, title_nl, title_en, desc_fr, desc_nl, desc_en,
  commune, year, price_cents, show_price, published, sort, created_by, created_at, updated_at`;

// ------------------------------------------------------------------ admin

export async function listRealisations(db: D1Database): Promise<ListRow[]> {
  const { results } = await db.prepare(`
    SELECT ${COLS.split(',').map((c) => `r.${c.trim()}`).join(', ')},
      (SELECT COUNT(*) FROM realisation_photos p WHERE p.realisation_id = r.id) AS photo_count,
      (SELECT COALESCE(p.thumb, p.src) FROM realisation_photos p WHERE p.realisation_id = r.id
         ORDER BY p.position, p.id LIMIT 1) AS cover
    FROM realisations r
    WHERE r.deleted_at IS NULL
    ORDER BY r.published, r.sort DESC, r.id DESC`).all<ListRow>();
  return results;
}

export async function getRealisation(db: D1Database, id: number): Promise<RealisationRow | null> {
  return db.prepare(`SELECT ${COLS} FROM realisations WHERE id = ? AND deleted_at IS NULL`)
    .bind(id).first<RealisationRow>();
}

export async function listPhotos(db: D1Database, realisationId: number): Promise<PhotoRow[]> {
  const { results } = await db.prepare(`
    SELECT id, realisation_id, src, thumb, width, height, position
    FROM realisation_photos WHERE realisation_id = ? ORDER BY position, id`)
    .bind(realisationId).all<PhotoRow>();
  return results;
}

const INPUT_COLS = ['room', 'finish', 'title_fr', 'title_nl', 'title_en', 'desc_fr', 'desc_nl', 'desc_en',
  'commune', 'year', 'price_cents', 'show_price', 'published'] as const;

/** Nouvelle réalisation, placée en tête de sa pièce. Renvoie son id. */
export async function createRealisation(db: D1Database, r: RealisationInput, by: string | undefined): Promise<number> {
  const row = await db.prepare(`
    INSERT INTO realisations (${INPUT_COLS.join(', ')}, sort, created_by)
    VALUES (${INPUT_COLS.map(() => '?').join(', ')},
            (SELECT COALESCE(MAX(sort), 0) + 1 FROM realisations), ?)
    RETURNING id`)
    .bind(...INPUT_COLS.map((c) => r[c]), by ?? null)
    .first<{ id: number }>();
  return row!.id;
}

export async function updateRealisation(db: D1Database, id: number, r: RealisationInput): Promise<boolean> {
  const res = await db.prepare(`
    UPDATE realisations SET ${INPUT_COLS.map((c) => `${c} = ?`).join(', ')},
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ? AND deleted_at IS NULL`)
    .bind(...INPUT_COLS.map((c) => r[c]), id).run();
  return res.meta.changes > 0;
}

export async function setPublished(db: D1Database, id: number, published: boolean): Promise<boolean> {
  const res = await db.prepare(`UPDATE realisations SET published = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ? AND deleted_at IS NULL`).bind(published ? 1 : 0, id).run();
  return res.meta.changes > 0;
}

/** Remonte la réalisation en première position de sa pièce. */
export async function moveToTop(db: D1Database, id: number): Promise<boolean> {
  const res = await db.prepare(`UPDATE realisations
    SET sort = (SELECT COALESCE(MAX(sort), 0) + 1 FROM realisations), updated_at = CURRENT_TIMESTAMP
    WHERE id = ? AND deleted_at IS NULL`).bind(id).run();
  return res.meta.changes > 0;
}

export async function deleteRealisation(db: D1Database, id: number): Promise<boolean> {
  const res = await db.prepare(`UPDATE realisations SET deleted_at = CURRENT_TIMESTAMP, published = 0
    WHERE id = ? AND deleted_at IS NULL`).bind(id).run();
  return res.meta.changes > 0;
}

export async function countPhotos(db: D1Database, realisationId: number): Promise<number> {
  const row = await db.prepare('SELECT COUNT(*) AS n FROM realisation_photos WHERE realisation_id = ?')
    .bind(realisationId).first<{ n: number }>();
  return row?.n ?? 0;
}

/** Ajoute une photo à la fin (la première ajoutée devient la couverture). */
export async function addPhoto(db: D1Database, realisationId: number,
  p: { src: string; thumb: string | null; width: number | null; height: number | null }): Promise<number> {
  const row = await db.prepare(`
    INSERT INTO realisation_photos (realisation_id, src, thumb, width, height, position)
    VALUES (?, ?, ?, ?, ?, (SELECT COALESCE(MAX(position), -1) + 1 FROM realisation_photos
                            WHERE realisation_id = ?))
    RETURNING id`)
    .bind(realisationId, p.src, p.thumb, p.width, p.height, realisationId)
    .first<{ id: number }>();
  return row!.id;
}

export async function getPhoto(db: D1Database, photoId: number): Promise<PhotoRow | null> {
  return db.prepare(`SELECT id, realisation_id, src, thumb, width, height, position
    FROM realisation_photos WHERE id = ?`).bind(photoId).first<PhotoRow>();
}

export async function deletePhotoRow(db: D1Database, photoId: number): Promise<void> {
  await db.prepare('DELETE FROM realisation_photos WHERE id = ?').bind(photoId).run();
}

/**
 * Change l'ordre des photos : 'left' / 'right' échange avec la voisine,
 * 'first' en fait la couverture. Les positions sont réécrites 0, 1, 2…
 * dans un seul batch (transaction).
 */
export async function movePhoto(db: D1Database, photoId: number, dir: 'left' | 'right' | 'first'): Promise<boolean> {
  const photo = await getPhoto(db, photoId);
  if (!photo) return false;
  const ids = (await listPhotos(db, photo.realisation_id)).map((p) => p.id);
  const i = ids.indexOf(photoId);
  if (dir === 'first') {
    ids.splice(i, 1);
    ids.unshift(photoId);
  } else {
    const j = dir === 'left' ? i - 1 : i + 1;
    if (j < 0 || j >= ids.length) return true;
    [ids[i], ids[j]] = [ids[j], ids[i]];
  }
  await db.batch(ids.map((pid, pos) =>
    db.prepare('UPDATE realisation_photos SET position = ? WHERE id = ?').bind(pos, pid)));
  return true;
}

/** '/media/r/12/abc.webp' → 'r/12/abc.webp' ; une photo du site → null. */
export function r2Key(src: string | null): string | null {
  return src && src.startsWith('/media/') ? src.slice('/media/'.length) : null;
}
