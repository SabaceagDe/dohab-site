// Ajout / modification / suppression d'un versement sur une commande.
import type { APIRoute } from 'astro';
import { addPayment, deletePayment, updatePayment } from '../../../lib/db';
import { id, readPayment } from '../../../lib/forms';

export const prerender = false;

export const POST: APIRoute = async ({ request, locals, redirect }) => {
  const db = locals.runtime.env.DB;
  const fd = await request.formData();
  const action = fd.get('_action');

  const orderId = id(fd.get('order_id'));
  if (!orderId) return redirect('/admin/paiements?err=introuvable', 303);
  const back = `/admin/paiements/${orderId}`;

  if (action === 'create') {
    const p = readPayment(fd);
    if (!p.ok || !p.value) return redirect(`${back}?err=${p.ok ? 'montant' : p.error}`, 303);
    const done = await addPayment(db, orderId, p.value);
    return redirect(done ? `${back}?ok=versement` : '/admin/paiements?err=introuvable', 303);
  }

  const paymentId = id(fd.get('payment_id'));
  if (!paymentId) return redirect(`${back}?err=introuvable`, 303);

  if (action === 'update') {
    const p = readPayment(fd);
    if (!p.ok || !p.value) return redirect(`${back}?err=${p.ok ? 'montant' : p.error}`, 303);
    const done = await updatePayment(db, paymentId, orderId, p.value);
    return redirect(`${back}?${done ? 'ok=modifie' : 'err=introuvable'}`, 303);
  }

  if (action === 'delete') {
    const done = await deletePayment(db, paymentId, orderId);
    return redirect(`${back}?${done ? 'ok=supprime' : 'err=introuvable'}`, 303);
  }

  return redirect(`${back}?err=action`, 303);
};
