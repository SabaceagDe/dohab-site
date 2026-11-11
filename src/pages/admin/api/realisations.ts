// Création / modification / publication / suppression d'une réalisation.
// Comme les commandes : POST → redirection 303 → GET. Seule exception, la
// création depuis la page « Nouvelle réalisation » : le script de la page
// demande du JSON (Accept: application/json) pour récupérer l'id, puis
// envoie les photos une par une à /admin/api/photos.
import type { APIRoute } from 'astro';
import {
  createRealisation, deleteRealisation, moveToTop, setPublished, updateRealisation
} from '../../../lib/realisations';
import { id, readRealisation } from '../../../lib/forms';

export const prerender = false;

const LIST = '/admin/realisations';

export const POST: APIRoute = async ({ request, locals, redirect }) => {
  const db = locals.runtime.env.DB;
  const fd = await request.formData();
  const action = fd.get('_action');
  const wantsJson = (request.headers.get('accept') ?? '').includes('application/json');

  if (action === 'create') {
    const r = readRealisation(fd);
    if (!r.ok) {
      return wantsJson ? Response.json({ error: r.error }, { status: 400 })
                       : redirect(`${LIST}/nouvelle?err=${r.error}`, 303);
    }
    const newId = await createRealisation(db, r.value, locals.user);
    return wantsJson ? Response.json({ id: newId })
                     : redirect(`${LIST}/${newId}?ok=reacree`, 303);
  }

  const realId = id(fd.get('realisation_id'));
  if (!realId) return redirect(`${LIST}?err=introuvable`, 303);
  const back = `${LIST}/${realId}`;

  switch (action) {
    case 'update': {
      const r = readRealisation(fd);
      if (!r.ok) return redirect(`${back}?err=${r.error}`, 303);
      const done = await updateRealisation(db, realId, r.value);
      return redirect(done ? `${back}?ok=modifie` : `${LIST}?err=introuvable`, 303);
    }
    case 'publish':
    case 'unpublish': {
      const done = await setPublished(db, realId, action === 'publish');
      return redirect(done ? `${back}?ok=${action === 'publish' ? 'publie' : 'depublie'}` : `${LIST}?err=introuvable`, 303);
    }
    case 'top': {
      const done = await moveToTop(db, realId);
      return redirect(done ? `${back}?ok=enhaut` : `${LIST}?err=introuvable`, 303);
    }
    case 'delete': {
      const done = await deleteRealisation(db, realId);
      return redirect(`${LIST}?${done ? 'ok=supprime' : 'err=introuvable'}`, 303);
    }
  }
  return redirect(`${back}?err=action`, 303);
};
