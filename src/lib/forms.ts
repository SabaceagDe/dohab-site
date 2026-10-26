/**
 * Lecture et validation des formulaires admin, côté serveur.
 * La validation du navigateur (required, type="date"…) n'est qu'un confort :
 * tout est revérifié ici, et la base a ses propres CHECK en dernier rempart.
 */
import { parseEuros } from './money';
import type { OrderInput, PaymentInput } from './db';

export type Result<T> = { ok: true; value: T } | { ok: false; error: ErrorCode };

export type ErrorCode = 'client' | 'total' | 'montant' | 'date' | 'introuvable' | 'action';

/** Textes affichés à l'écran pour chaque code d'erreur. */
export const errorText: Record<ErrorCode, string> = {
  client: 'Le nom du client est obligatoire.',
  total: 'Le total doit être un montant supérieur à 0 (ex. 4500 ou 4500,50).',
  montant: 'Le montant du versement doit être supérieur à 0 (ex. 1500 ou 1500,50).',
  date: 'La date du versement est invalide.',
  introuvable: 'Cette commande ou ce versement n’existe pas (ou a été supprimé).',
  action: 'Action inconnue.'
};

export const okText = {
  cree: 'Commande enregistrée.',
  modifie: 'Modifications enregistrées.',
  supprime: 'Supprimé.',
  versement: 'Versement ajouté.'
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
