/**
 * Défilement doux (bibliothèque Lenis) et barre de navigation.
 *
 * Lenis lisse la molette et le pavé tactile : la page glisse au lieu de
 * sauter par crans. Sur téléphone, le défilement natif est gardé (il est
 * déjà fluide et c'est ce que les doigts attendent).
 * Désactivé si le système demande de réduire les animations.
 *
 * Les liens d'ancre (#contact, #work-cuisine…) passent par Lenis pour
 * glisser jusqu'à la section. Pour #work-…, on prévient la galerie (elle
 * écoute « hashchange ») afin qu'elle applique le filtre de la pièce.
 */
import Lenis from 'lenis';

const reduit = matchMedia('(prefers-reduced-motion: reduce)').matches;
const nav = document.querySelector<HTMLElement>('.nav');

export const lenis = reduit ? null : new Lenis({ lerp: 0.09, wheelMultiplier: 0.9 });
(window as unknown as { __defil?: Lenis | null }).__defil = lenis;

if (lenis) {
  const boucle = (t: number) => { lenis.raf(t); requestAnimationFrame(boucle); };
  requestAnimationFrame(boucle);
}

/** Hauteur de la barre collante, pour ne pas cacher le titre de la section. */
export const decalage = () => -((nav?.offsetHeight ?? 0) + 8);

export function allerA(el: Element) {
  if (lenis) lenis.scrollTo(el as HTMLElement, { offset: decalage(), duration: 1.2 });
  else el.scrollIntoView({ behavior: reduit ? 'auto' : 'smooth', block: 'start' });
}

document.addEventListener('click', (e) => {
  const a = (e.target as HTMLElement).closest<HTMLAnchorElement>('a[href*="#"]');
  if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey) return;
  const url = new URL(a.href, location.href);
  if (url.pathname !== location.pathname || !url.hash) return;   // autre page : navigation normale
  const piece = /^#work-[a-z]+$/.test(url.hash);
  const cible = document.querySelector(piece ? '#work' : url.hash);
  if (!cible) return;
  e.preventDefault();
  history.pushState(null, '', url.hash);
  if (piece) dispatchEvent(new HashChangeEvent('hashchange'));   // la galerie filtre et descend
  else allerA(cible);
});

// La barre est transparente au-dessus de la grande photo d'accueil, puis
// prend un fond dès qu'on descend.
if (nav) {
  const maj = () => {
    nav.classList.toggle('solide', scrollY > 40);
    // le bouton WhatsApp flottant attend qu'on ait quitté le haut de page
    document.body.classList.toggle('defile', scrollY > innerHeight * 0.5);
  };
  maj();
  addEventListener('scroll', maj, { passive: true });
}
