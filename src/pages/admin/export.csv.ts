// Export complet en CSV — sauvegarde manuelle et ouverture dans Excel.
// Format « Excel belge » : séparateur point-virgule, virgule décimale,
// BOM UTF-8 pour que les accents s'affichent correctement.
import type { APIRoute } from 'astro';
import { exportRows } from '../../lib/db';
import { todayBrussels } from '../../lib/forms';

export const prerender = false;

const euros = (cents: number | null) => (cents === null ? '' : (cents / 100).toFixed(2).replace('.', ','));

function cell(v: unknown): string {
  let s = v === null || v === undefined ? '' : String(v);
  // Neutralise les formules (=, +, -, @) : injection CSV dans Excel.
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[";\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export const GET: APIRoute = async ({ locals }) => {
  const rows = await exportRows(locals.runtime.env.DB);

  const header = [
    'Commande', 'Client', 'Téléphone', 'Adresse', 'Travaux', 'Total HTVA',
    'Créée le', 'Date versement', 'Montant versement', 'Moyen', 'Note versement'
  ];
  const lines = rows.map((r) =>
    [
      r.order_id, r.client_name, r.client_phone, r.address, r.label, euros(r.total_cents),
      r.created_at.slice(0, 10), r.paid_on, euros(r.amount_cents), r.method, r.payment_note
    ].map(cell).join(';')
  );

  const body = '﻿' + [header.map(cell).join(';'), ...lines].join('\r\n') + '\r\n';
  return new Response(body, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="dohab-paiements-${todayBrussels()}.csv"`
    }
  });
};
