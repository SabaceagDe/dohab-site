/**
 * Ce que le site public montre : les réalisations publiées, avec leurs
 * photos, prêtes à afficher dans la galerie et la section « Prix ».
 *
 * Lu à chaque visite de l'accueil (deux petites requêtes D1). Si la base
 * ne répond pas, ou si la migration n'est pas encore passée, on retombe
 * sur l'ancienne galerie livrée avec le site : l'accueil ne casse jamais.
 */
import type { Locale } from '../site.config';
import { ROOM_ORDER, ROOMS, roomKey, type Room } from './realisations';
import { euros, t } from '../i18n';
import { projets } from '../data/projets';
import auto from '../data/galerie-auto.json';
import nl from '../i18n/nl.json';
import fr from '../i18n/fr.json';
import en from '../i18n/en.json';

export interface PublicPhoto { src: string; thumb: string; w: number | null; h: number | null }
type Texts = Record<Locale, string | null>;

export interface PublicRealisation {
  id: string;
  room: Room;
  finish: string | null;
  title: Texts;
  desc: Texts;
  commune: string | null;
  year: number | null;
  /** prix en centimes, uniquement s'il doit être affiché */
  price: number | null;
  photos: PublicPhoto[];
}

/** Texte dans la langue demandée, sinon en français, sinon null. */
export const pick = (t: Texts, locale: Locale) => t[locale] ?? t.fr ?? null;

interface Row {
  id: number; room: Room; finish: string | null;
  title_fr: string | null; title_nl: string | null; title_en: string | null;
  desc_fr: string | null; desc_nl: string | null; desc_en: string | null;
  commune: string | null; year: number | null; price_cents: number | null; show_price: number;
}
interface PRow { realisation_id: number; src: string; thumb: string | null; width: number | null; height: number | null }

export async function loadVitrine(db: D1Database | undefined): Promise<PublicRealisation[]> {
  if (!db) return fallback();
  try {
    const [reals, photos] = await db.batch([
      db.prepare(`SELECT id, room, finish, title_fr, title_nl, title_en, desc_fr, desc_nl, desc_en,
                         commune, year, price_cents, show_price
                  FROM realisations WHERE published = 1 AND deleted_at IS NULL
                  ORDER BY sort DESC, id DESC`),
      db.prepare(`SELECT p.realisation_id, p.src, p.thumb, p.width, p.height
                  FROM realisation_photos p JOIN realisations r ON r.id = p.realisation_id
                  WHERE r.published = 1 AND r.deleted_at IS NULL
                  ORDER BY p.position, p.id`)
    ]);
    const byReal = new Map<number, PublicPhoto[]>();
    for (const p of photos.results as PRow[]) {
      const list = byReal.get(p.realisation_id) ?? [];
      list.push({ src: p.src, thumb: p.thumb ?? p.src, w: p.width, h: p.height });
      byReal.set(p.realisation_id, list);
    }
    const out: PublicRealisation[] = [];
    for (const r of reals.results as Row[]) {
      const ph = byReal.get(r.id);
      if (!ph?.length) continue;              // pas encore de photo : rien à montrer
      out.push({
        id: String(r.id),
        room: r.room,
        finish: r.finish,
        title: { fr: r.title_fr, nl: r.title_nl, en: r.title_en },
        desc: { fr: r.desc_fr, nl: r.desc_nl, en: r.desc_en },
        commune: r.commune,
        year: r.year,
        price: r.show_price && r.price_cents ? r.price_cents : null,
        photos: ph
      });
    }
    return byRoom(out);
  } catch (e) {
    console.error('vitrine: lecture D1 impossible, galerie livrée avec le site', e);
    return fallback();
  }
}

/** Tri stable par pièce : dans chaque pièce, l'ordre de la requête est gardé. */
function byRoom(list: PublicRealisation[]) {
  return list.sort((a, b) => ROOM_ORDER.indexOf(a.room) - ROOM_ORDER.indexOf(b.room));
}

/** L'ancienne galerie (projets.ts + galerie-auto.json), au même format. */
function fallback(): PublicRealisation[] {
  const dict: Record<Locale, Record<string, string>> = { nl, fr, en };
  const txt = (key: string): Texts => ({ fr: dict.fr[key] ?? null, nl: dict.nl[key] ?? null, en: dict.en[key] ?? null });
  const items = [...projets, ...(auto as typeof projets)].filter((p) => (ROOMS as readonly string[]).includes(p.room));
  return byRoom(items.map((p) => ({
    id: p.id,
    room: p.room as Room,
    finish: p.finish ?? null,
    title: txt(`${p.id}.t`),
    desc: txt(`${p.id}.c`),
    commune: null,
    year: null,
    price: null,
    photos: [{ src: `/photos/${p.photo}`, thumb: `/photos/${p.photo}`, w: null, h: null }]
  })));
}

/**
 * Textes prêts à afficher pour une réalisation dans une langue, plus le
 * paquet JSON lu par la visionneuse (src/scripts/lightbox.ts).
 */
export function present(r: PublicRealisation, locale: Locale) {
  const tr = t(locale);
  const title = pick(r.title, locale) ?? tr(roomKey[r.room]);
  const desc = pick(r.desc, locale);
  const meta = [r.commune, r.year].filter(Boolean).join(' · ') || null;
  const price = r.price ? euros(locale, r.price) : null;
  const priceText = price ? `${tr('prices.sold')} ${price}` : null;
  const lb = JSON.stringify({ t: title, d: desc, m: meta, p: priceText, ph: r.photos.map((p) => p.src) });
  return { title, desc, meta, price, priceText, lb, cover: r.photos[0] };
}
