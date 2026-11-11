/**
 * Lecture et validation des formulaires admin, côté serveur.
 * La validation du navigateur (required, type="date"…) n'est qu'un confort :
 * tout est revérifié ici, et la base a ses propres CHECK en dernier rempart.
 */
import { parseEuros } from './money';
import type { OrderInput, PaymentInput } from './db';
import { ROOMS, type RealisationInput, type Room } from './realisations';
import { finitions } from '../data/finitions';

export type Result<T> = { ok: true; value: T } | { ok: false; error: ErrorCode };

export type ErrorCode = 'client' | 'total' | 'montant' | 'date' | 'introuvable' | 'action'
  | 'piece' | 'prix' | 'annee' | 'photo' | 'trop';

/** Textes affichés à l'écran pour chaque code d'erreur. */
export const errorText: Record<ErrorCode, string> = {
  client: 'Le nom du client est obligatoire.',
  total: 'Le total doit être un montant supérieur à 0 (ex. 4500 ou 4500,50).',
  montant: 'Le montant du versement doit être supérieur à 0 (ex. 1500 ou 1500,50).',
  date: 'La date du versement est invalide.',
  introuvable: 'Cette commande ou ce versement n’existe pas (ou a été supprimé).',
  action: 'Action inconnue.',
  piece: 'Choisissez la pièce (cuisine, chambre…).',
  prix: 'Le prix doit être un montant supérieur à 0 (ex. 8450 ou 8 450), ou rester vide.',
  annee: 'L’année doit être entre 2000 et l’an prochain, ou rester vide.',
  photo: 'Cette photo n’a pas pu être enregistrée (format JPEG ou WebP attendu, 8 Mo maximum).',
  trop: 'Trop de photos pour une seule réalisation (30 maximum).'
};

export const okText = {
  cree: 'Commande enregistrée.',
  modifie: 'Modifications enregistrées.',
  supprime: 'Supprimé.',
  versement: 'Versement ajouté.',
  reacree: 'Réalisation enregistrée.',
  publie: 'Publiée : elle est visible sur le site.',
  depublie: 'Retirée du site (gardée en brouillon).',
  enhaut: 'Placée en premier dans sa pièce.',
  photos: 'Photos ajoutées.',
  ordre: 'Ordre des photos mis à jour.'
} as const;
export type OkCode = keyof typeof okText;

const METHODS = ['virement', 'cash', 'autre'];

/** Texte optionnel : trim, chaîne vide → null, longueur bornée. */
function text(fd: FormData, key: string, max = 500): string | null {
  const v = fd.get(key);
  if (typeof v !== 'string') return null;
  const t = v.trim().slice(0, max);
  return t === '' ? null : t;
}

/** Entier positif (pour les id) ou null. */
export function id(v: unknown): number | null {
  if (typeof v !== 'string' || !/^\d{1,9}$/.test(v)) return null;
  const n = Number(v);
  return n > 0 ? n : null;
}

/** Date AAAA-MM-JJ qui existe vraiment (refuse 2026-02-30). */
function isoDate(v: unknown): string | null {
  if (typeof v !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return null;
  const d = new Date(`${v}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === v ? v : null;
}

/** Aujourd'hui à Bruxelles, au format AAAA-MM-JJ. */
export function todayBrussels(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Brussels' }).format(new Date());
}

export function readOrder(fd: FormData): Result<OrderInput> {
  const client_name = text(fd, 'client_name', 200);
  if (!client_name) return { ok: false, error: 'client' };
  const total_cents = parseEuros(fd.get('total'));
  if (total_cents === null) return { ok: false, error: 'total' };
  return {
    ok: true,
    value: {
      client_name,
      client_phone: text(fd, 'client_phone', 50),
      address: text(fd, 'address', 300),
      label: text(fd, 'label', 200),
      total_cents,
      note: text(fd, 'note', 2000)
    }
  };
}

/**
 * Versement. Avec `optional`, un montant laissé vide veut dire « pas de
 * versement » (cas de l'acompte dans le formulaire de nouvelle commande).
 */
export function readPayment(fd: FormData, optional = false): Result<PaymentInput | null> {
  const raw = fd.get('amount');
  if (optional && (typeof raw !== 'string' || raw.trim() === '')) return { ok: true, value: null };
  const amount_cents = parseEuros(raw);
  if (amount_cents === null) return { ok: false, error: 'montant' };
  const paid_on = isoDate(fd.get('paid_on'));
  if (!paid_on) return { ok: false, error: 'date' };
  const m = text(fd, 'method', 20);
  return {
    ok: true,
    value: {
      amount_cents,
      paid_on,
      method: m && METHODS.includes(m) ? m : null,
      note: text(fd, 'payment_note', 500)
    }
  };
}

/**
 * Réalisation (galerie). Le prix est facultatif ; il n'est affiché sur le
 * site que si la case « afficher le prix » est cochée ET qu'un prix existe.
 */
export function readRealisation(fd: FormData): Result<RealisationInput> {
  const room = fd.get('room');
  if (typeof room !== 'string' || !(ROOMS as readonly string[]).includes(room)) return { ok: false, error: 'piece' };
  const f = fd.get('finish');
  const finish = typeof f === 'string' && finitions.some((x) => x.id === f) ? f : null;

  const rawPrice = fd.get('price');
  let price_cents: number | null = null;
  if (typeof rawPrice === 'string' && rawPrice.trim() !== '') {
    price_cents = parseEuros(rawPrice);
    if (price_cents === null) return { ok: false, error: 'prix' };
  }

  const rawYear = fd.get('year');
  let year: number | null = null;
  if (typeof rawYear === 'string' && rawYear.trim() !== '') {
    const y = Number(rawYear.trim());
    const max = new Date().getFullYear() + 1;
    if (!Number.isInteger(y) || y < 2000 || y > max) return { ok: false, error: 'annee' };
    year = y;
  }

  return {
    ok: true,
    value: {
      room: room as Room,
      finish,
      title_fr: text(fd, 'title_fr', 120),
      title_nl: text(fd, 'title_nl', 120),
      title_en: text(fd, 'title_en', 120),
      desc_fr: text(fd, 'desc_fr', 1000),
      desc_nl: text(fd, 'desc_nl', 1000),
      desc_en: text(fd, 'desc_en', 1000),
      commune: text(fd, 'commune', 80),
      year,
      price_cents,
      show_price: price_cents !== null && fd.get('show_price') === '1' ? 1 : 0,
      published: fd.get('published') === '1' ? 1 : 0
    }
  };
}
