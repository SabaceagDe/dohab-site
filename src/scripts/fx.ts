/**
 * Les « plus » de la version atelier (dohab.be/experiment) :
 *   1. les titres arrivent mot par mot ;
 *   2. le O du logo suit la souris et grandit sur les photos ;
 *   3. des boutons « aimantés » (ils se penchent vers la souris) ;
 *   4. la bande défilante accélère quand on fait défiler la page.
 *
 * Rien ici n'est nécessaire au site : si ce fichier ne se charge pas, tout
 * reste lisible et cliquable. 2 et 3 n'existent que sur un ordinateur avec
 * une vraie souris ; tout est coupé si le système demande de réduire les
 * animations.
 */
import { lenis } from './smooth';

const reduit = matchMedia('(prefers-reduced-motion: reduce)').matches;
const souris = matchMedia('(hover: hover) and (pointer: fine)').matches;

/* ------------------------------------------------------------------
   1. Titres mot par mot
   Chaque mot d'un <h2> est emballé dans deux <span> : celui du dehors sert
   de fenêtre (ce qui dépasse est caché), celui du dedans monte de sous la
   fenêtre. Le départ est donné par la classe .in que la mise en page pose
   déjà sur les éléments .rv quand ils entrent à l'écran (Base.astro) : pas
   de second observateur. Les espaces insécables (« projet ? ») restent
   dans le mot, donc la ponctuation ne passe jamais seule à la ligne.
   ------------------------------------------------------------------ */
if (!reduit) {
  document.querySelectorAll<HTMLElement>('main h2').forEach((h) => {
    const porte = h.closest('.rv');
    if (!porte || porte.classList.contains('in')) return;   // déjà visible : on n'y touche pas
    const textes: Text[] = [];
    const marche = document.createTreeWalker(h, NodeFilter.SHOW_TEXT);
    while (marche.nextNode()) textes.push(marche.currentNode as Text);
    let i = 0;
    for (const n of textes) {
      const suite = document.createDocumentFragment();
      for (const bout of n.data.split(/([ \n\t]+)/)) {
        if (!bout) continue;
        if (/^[ \n\t]+$/.test(bout)) { suite.appendChild(document.createTextNode(' ')); continue; }
        const fenetre = document.createElement('span');
        fenetre.className = 'mot';
        const mot = document.createElement('span');
        mot.textContent = bout;
        mot.style.setProperty('--i', String(i++));
        fenetre.appendChild(mot);
        suite.appendChild(fenetre);
      }
      n.replaceWith(suite);
    }
    h.classList.add('mots');
  });
}

/* ------------------------------------------------------------------
   2. Curseur
   Le O du logo (l'empreinte de cernes) suit la souris avec un léger retard :
   à chaque image, il parcourt 20 % de la distance qui le sépare de la
   souris. Sur une photo qu'on peut ouvrir, il grandit et tourne. La flèche
   du système reste visible partout ailleurs.
   ------------------------------------------------------------------ */
if (souris && !reduit) {
  const c = document.createElement('div');
  c.className = 'curseur';
  c.setAttribute('aria-hidden', 'true');
  c.appendChild(document.createElement('span'));
  document.body.appendChild(c);
  document.documentElement.classList.add('a-curseur');

  let x = 0, y = 0, cx = 0, cy = 0, enVol = false, pose = false;
  const pas = () => {
    cx += (x - cx) * 0.2;
    cy += (y - cy) * 0.2;
    c.style.translate = `${cx.toFixed(1)}px ${cy.toFixed(1)}px`;
    if (Math.abs(x - cx) + Math.abs(y - cy) > 0.3) requestAnimationFrame(pas);
    else enVol = false;
  };
  const etat = (sous: Element | null) => {
    const photo = sous?.closest('.card, .tile, #prix .item');
    c.classList.toggle('voir', Boolean(photo));
    c.classList.toggle('lien', !photo && Boolean(sous?.closest('a, button, select, label, summary')));
  };
  addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
    x = e.clientX;
    y = e.clientY;
    if (!pose) { pose = true; cx = x; cy = y; }       // première fois : pas de traversée de l'écran
    c.classList.add('la');
    etat(e.target as Element);
    if (!enVol) { enVol = true; requestAnimationFrame(pas); }
  }, { passive: true });
  // la page défile sous une souris immobile : ce qui est dessous a changé
  let prevu = false;
  addEventListener('scroll', () => {
    if (prevu || !pose) return;
    prevu = true;
    requestAnimationFrame(() => { prevu = false; etat(document.elementFromPoint(x, y)); });
  }, { passive: true });
  document.documentElement.addEventListener('mouseleave', () => c.classList.remove('la'));
  addEventListener('pointerdown', () => c.classList.add('appui'));
  addEventListener('pointerup', () => c.classList.remove('appui'));
}

/* ------------------------------------------------------------------
   3. Boutons aimantés
   Le bouton se décale de quelques pixels vers la souris tant qu'elle est
   dessus, et revient à sa place quand elle sort (transition CSS sur
   `translate`, qui ne gêne pas les effets de survol en `transform`).
   ------------------------------------------------------------------ */
if (souris && !reduit) {
  document.querySelectorAll<HTMLElement>('.hero-cta .btn, #contact .btn, #galPlus, .prices-cta').forEach((b) => {
    let r: DOMRect | null = null;
    b.addEventListener('pointerenter', () => { r = b.getBoundingClientRect(); });
    b.addEventListener('pointermove', (e) => {
      if (!r) return;
      const dx = (e.clientX - (r.left + r.width / 2)) / r.width;
      const dy = (e.clientY - (r.top + r.height / 2)) / r.height;
      b.style.translate = `${(dx * 14).toFixed(1)}px ${(dy * 10).toFixed(1)}px`;
    });
    b.addEventListener('pointerleave', () => { r = null; b.style.translate = ''; });
  });
}

/* ------------------------------------------------------------------
   4. Bande défilante
   Elle avance toute seule (animation CSS). Ici on règle juste sa vitesse
   sur celle du défilement : plus on descend vite, plus elle file, et elle
   repart dans l'autre sens quand on remonte.
   ------------------------------------------------------------------ */
const piste = document.querySelector<HTMLElement>('.ruban-piste');
const anim = piste?.getAnimations()[0];
if (anim && lenis) {
  let calme = 0;
  lenis.on('scroll', ({ velocity }: { velocity: number }) => {
    const elan = Math.min(7, Math.abs(velocity) * 0.22);
    anim.playbackRate = (velocity < 0 ? -1 : 1) * (1 + elan);
    clearTimeout(calme);
    calme = window.setTimeout(() => { anim.playbackRate = 1; }, 160);
  });
}
