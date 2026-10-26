// Création / modification / suppression d'une commande.
// Formulaires HTML classiques : on répond toujours par une redirection 303
// (POST → redirection → GET), donc un rafraîchissement ne renvoie rien.
// La protection CSRF (vérification de l'en-tête Origin) est dans src/middleware.ts.
import type { APIRoute } from 'astro';
import { createOrder, deleteOrder, updateOrder } from '../../../lib/db';
import { id, readOrder, readPayment } from '../../../lib/forms';

export const prerender = false;

export const POST: APIRoute = async ({ request, locals, redirect }) => {
  const db = locals.runtime.env.DB;
  const fd = await request.formData();
  const action = fd.get('_action');

  if (action === 'create') {
    const order = readOrder(fd);
    if (!order.ok) return redirect(`/admin/paiements?err=${order.error}`, 303);
    const advance = readPayment(fd, true);
    if (!advance.ok) return redirect(`/admin/paiements?err=${advance.error}`, 303);
    const newId = await createOrder(db, order.value, advance.value);
    return redirect(`/admin/paiements/${newId}?ok=cree`, 303);
  }

  const orderId = id(fd.get('order_id'));
  if (!orderId) return redirect('/admin/paiements?err=introuvable', 303);
  const back = `/admin/paiements/${orderId}`;

  if (action === 'update') {
    const order = readOrder(fd);
    if (!order.ok) return redirect(`${back}?err=${order.error}`, 303);
    const done = await updateOrder(db, orderId, order.value);
    return redirect(done ? `${back}?ok=modifie` : '/admin/paiements?err=introuvable', 303);
  }

  if (action === 'delete') {
    const done = await deleteOrder(db, orderId);
    return redirect(`/admin/paiements?${done ? 'ok=supprime' : 'err=introuvable'}`, 303);
  }

  return redirect(`${back}?err=action`, 303);
};
