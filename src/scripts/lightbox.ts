/**
 * Visionneuse plein écran, partagée par la galerie et la section « Prix ».
 * Le balisage (#lb, flèches, légende) est dans Footer.astro.
 *
 * Chaque fiche cliquable porte un attribut data-lb avec ses textes et ses
 * photos (JSON écrit côté serveur). À l'ouverture, on met bout à bout les
 * photos de toutes les fiches visibles : les flèches parcourent d'abord les
 * photos d'une réalisation, puis passent à la suivante.
 *
 * Ouverture et fermeture « depuis la vignette » : la photo part de la place
 * exacte de la vignette cliquée et grandit jusqu'au centre (technique FLIP :
 * on mesure la position de départ et d'arrivée, puis on anime la différence
 * avec transform, ce que le navigateur sait faire sans saccade). À la
 * fermeture, elle retourne à sa vignette si celle-ci est à l'écran.
 *
 * La légende est construite avec textContent, jamais innerHTML : les textes
 * viennent de la base, ils ne doivent jamais pouvoir injecter du HTML.
 */
interface Card { t: string; d: string | null; m: string | null; p: string | null; ph: string[] }
interface Slide { src: string; card: Card; i: number; el: HTMLElement }

const lb = document.getElementById('lb');
const img = document.getElementById('lbImg') as HTMLImageElement | null;
const cap = document.getElementById('lbCap');
const reduit = matchMedia('(prefers-reduced-motion: reduce)').matches;
const EASE = 'cubic-bezier(.2,.75,.2,1)';

let slides: Slide[] = [];
let pos = 0;
let ouvert = false;

const defil = () => (window as unknown as { __defil?: { stop(): void; start(): void } | null }).__defil;

function el(tag: string, text: string | null, cls?: string) {
  const e = document.createElement(tag);
  if (text) e.textContent = text;
  if (cls) e.className = cls;
  return e;
}

function legende(s: Slide) {
  if (!cap) return;
  const parts: HTMLElement[] = [el('strong', s.card.t)];
  if (s.card.p) parts.push(el('b', s.card.p, 'prix'));
  if (s.card.d) parts.push(el('span', s.card.d));
  if (s.card.m) parts.push(el('small', s.card.m));
  if (s.card.ph.length > 1) parts.push(el('em', `${s.i + 1} / ${s.card.ph.length}`));
  cap.replaceChildren(...parts);
}

/** La vignette d'une fiche (l'image de sa grille), si elle est visible à l'écran. */
function vignette(card: HTMLElement): HTMLImageElement | null {
  const v = card.querySelector('img');
  if (!v) return null;
  const r = v.getBoundingClientRect();
  return r.bottom > 0 && r.top < innerHeight && r.width > 0 ? v : null;
}

/** Anime l'image entre le rectangle `de` et sa place actuelle (ou l'inverse). */
function flip(de: DOMRect, sens: 'entrer' | 'sortir') {
  if (!img) return Promise.resolve();
  const a = img.getBoundingClientRect();
  if (!a.width || !de.width) return Promise.resolve();
  const dx = de.left + de.width / 2 - (a.left + a.width / 2);
  const dy = de.top + de.height / 2 - (a.top + a.height / 2);
  const s = Math.max(de.width / a.width, de.height / a.height);
  const loin = `translate(${dx}px, ${dy}px) scale(${s})`;
  // la vignette est carrée, la photo non : on la « découpe » pendant le trajet
  const cw = (1 - de.width / (a.width * s)) * 50;
  const ch = (1 - de.height / (a.height * s)) * 50;
  const coupe = `inset(${ch}% ${cw}% ${ch}% ${cw}% round 4px)`;
  const frames = [
    { transform: loin, clipPath: coupe },
    { transform: 'none', clipPath: 'inset(0% 0% 0% 0% round 4px)' }
  ];
  return img.animate(sens === 'entrer' ? frames : frames.reverse(),
    { duration: sens === 'entrer' ? 520 : 420, easing: EASE, fill: 'both' }).finished.then(() => {});
}

function show(i: number, dir: 0 | 1 | -1 = 0) {
  if (!img) return;
  pos = (i + slides.length) % slides.length;
  const s = slides[pos];
  img.getAnimations().forEach((a) => a.cancel());
  img.src = s.src;
  img.alt = s.card.t;
  legende(s);
  if (dir && !reduit) {
    img.animate([
      { opacity: 0, transform: `translateX(${dir * 42}px) scale(.985)` },
      { opacity: 1, transform: 'none' }
    ], { duration: 380, easing: EASE });
  }
}

/** Ouvre la visionneuse sur `start`, en parcourant `cards` (fiches visibles). */
export async function openLightbox(cards: HTMLElement[], start: HTMLElement) {
  if (!lb || !img) return;
  slides = [];
  let first = 0;
  for (const c of cards) {
    let data: Card;
    try { data = JSON.parse(c.dataset.lb ?? ''); } catch { continue; }
    if (c === start) first = slides.length;
    data.ph.forEach((src, i) => slides.push({ src, card: data, i, el: c }));
  }
  if (!slides.length) return;
  lb.classList.toggle('seule', slides.length < 2);

  const v = vignette(start);
  pos = first;
  // on démarre avec l'image de la vignette (déjà chargée) pour que
  // l'animation parte tout de suite, puis on passe à la grande version
  img.src = v?.currentSrc || slides[first].src;
  img.alt = slides[first].card.t;
  legende(slides[first]);
  lb.classList.add('on');
  ouvert = true;
  defil()?.stop();
  document.documentElement.classList.add('lb-ouverte');

  if (v && !reduit) {
    await img.decode().catch(() => {});
    await flip(v.getBoundingClientRect(), 'entrer');
  }
  if (ouvert && pos === first && img.src !== new URL(slides[first].src, location.href).href) {
    const grand = new Image();
    grand.src = slides[first].src;
    grand.decode().then(() => { if (ouvert && pos === first) img.src = grand.src; }).catch(() => {});
  }
  (document.getElementById('lbClose') as HTMLButtonElement | null)?.focus({ preventScroll: true });
}

async function close() {
  if (!lb || !img || !ouvert) return;
  ouvert = false;
  const v = vignette(slides[pos].el);
  if (v && !reduit) {
    lb.classList.add('ferme');            // le fond s'efface pendant que la photo rentre
    await flip(v.getBoundingClientRect(), 'sortir');
  }
  lb.classList.remove('on', 'ferme');
  img.getAnimations().forEach((a) => a.cancel());
  document.documentElement.classList.remove('lb-ouverte');
  defil()?.start();
}

if (lb) {
  document.getElementById('lbPrec')?.addEventListener('click', () => show(pos - 1, -1));
  document.getElementById('lbSuiv')?.addEventListener('click', () => show(pos + 1, 1));
  lb.addEventListener('click', (e) => {
    const t = e.target as HTMLElement;
    if (t === lb || t.id === 'lbClose') close();
  });
  addEventListener('keydown', (e) => {
    if (!ouvert) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowRight') show(pos + 1, 1);
    if (e.key === 'ArrowLeft') show(pos - 1, -1);
  });
  // Au doigt : on glisse vers la gauche pour la suivante. Seul un geste
  // franchement horizontal compte, sinon un tapotement ou un défilement
  // vertical changerait de photo par accident.
  let x0 = 0, y0 = 0;
  lb.addEventListener('touchstart', (e) => { x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; }, { passive: true });
  lb.addEventListener('touchend', (e) => {
    const dx = e.changedTouches[0].clientX - x0;
    const dy = e.changedTouches[0].clientY - y0;
    if (slides.length < 2 || Math.abs(dx) < 50 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
    dx < 0 ? show(pos + 1, 1) : show(pos - 1, -1);
  });
}
