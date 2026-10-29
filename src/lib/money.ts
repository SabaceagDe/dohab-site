/**
 * Argent : on stocke et on calcule en centimes (entiers), jamais en flottants.
 * La conversion texte ↔ centimes ne se fait qu'ici.
 */

/**
 * "1250" "1250.5" "1250,50" "1 250,50" "1.250,50" → 125050
 * Renvoie null si la saisie n'est pas un montant valide (> 0, max 2 décimales).
 */
export function parseEuros(input: unknown): number | null {
  if (typeof input !== 'string') return null;
  let s = input.replace(/[\s  €]/g, '');
  if (s === '') return null;

  if (s.includes(',')) {
    // virgule = séparateur décimal belge ; les points sont des milliers
    s = s.replace(/\./g, '').replace(',', '.');
  } else if ((s.match(/\./g) ?? []).length > 1) {
    // "1.250.000" : plusieurs points = séparateurs de milliers
    s = s.replace(/\./g, '');
  }

  const m = /^(\d{1,9})(?:\.(\d{1,2}))?$/.exec(s);
  if (!m) return null;
  const cents = Number(m[1]) * 100 + Number((m[2] ?? '').padEnd(2, '0'));
  return cents > 0 ? cents : null;
}

const fmt = new Intl.NumberFormat('fr-BE', { style: 'currency', currency: 'EUR' });

/** 125050 → "1 250,50 €" */
export function formatEuros(cents: number): string {
  return fmt.format(cents / 100);
}

/** 125050 → "1250.50" (pour pré-remplir un champ de formulaire) */
export function centsToInput(cents: number): string {
  return (cents / 100).toFixed(2);
}
