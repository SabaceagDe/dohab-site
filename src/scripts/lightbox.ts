/**
 * Visionneuse plein écran, partagée par la galerie et la section « Prix ».
 * Le balisage (#lb, flèches, légende) est dans Footer.astro.
 *
 * Chaque fiche cliquable porte un attribut data-lb avec ses textes et ses
 * photos (JSON écrit côté serveur). À l'ouverture, on met bout à bout les
 * photos de toutes les fiches visibles : les flèches parcourent d'abord les
 * photos d'une réalisation, puis passent à la suivante.
 *
 * La légende est construite avec textContent, jamais innerHTML : les textes
 * viennent de la base, ils ne doivent jamais pouvoir injecter du HTML.
 */
interface Card { t: string; d: string | null; m: string | null; p: string | null; ph: string[] }
interface Slide { src: string; card: Card; i: number }

const lb = document.getElementById('lb');
const img = document.getElementById('lbImg') as HTMLImageElement | null;
const cap = document.getElementById('lbCap');

let slides: Slide[] = [];
let pos = 0;

function el(tag: string, text: string | null, cls?: string) {
  const e = document.createElement(tag);
  if (text) e.textContent = text;
  if (cls) e.className = cls;
  return e;
}

function show(i: number, dir: 0 | 1 | -1 = 0) {
  if (!img || !cap) return;
  pos = (i + slides.length) % slides.length;      // on boucle aux deux bouts
  const s = slides[pos];
  img.src = s.src;
  img.alt = s.card.t;
  const parts: HTMLElement[] = [el('strong', s.card.t)];
  if (s.card.p) parts.push(el('b', s.card.p, 'prix'));
  if (s.card.d) parts.push(el('span', s.card.d));
  if (s.card.m) parts.push(el('small', s.card.m));
  if (s.card.ph.length > 1) parts.push(el('em', `${s.i + 1} / ${s.card.ph.length}`));
  cap.replaceChildren(...parts);
  // petit glissement dans le sens du geste ; relancer l'animation demande
  // de retirer la classe, forcer un recalcul, puis la remettre
  img.classList.remove('vers-g', 'vers-d');
  if (dir) { void img.offsetWidth; img.classList.add(dir > 0 ? 'vers-g' : 'vers-d'); }
}

/** Ouvre la visionneuse sur `start`, en parcourant `cards` (fiches visibles). */
export function openLightbox(cards: HTMLElement[], start: HTMLElement) {
  if (!lb) return;
  slides = [];
  let first = 0;
  for (const c of cards) {
    let data: Card;
    try { data = JSON.parse(c.dataset.lb ?? ''); } catch { continue; }
    if (c === start) first = slides.length;
    data.ph.forEach((src, i) => slides.push({ src, card: data, i }));
  }
  if (!slides.length) return;
  lb.classList.toggle('seule', slides.length < 2);
  show(first);
  lb.classList.add('on');
}

const close = () => lb?.classList.remove('on');

if (lb) {
  document.getElementById('lbPrec')?.addEventListener('click', () => show(pos - 1, -1));
  document.getElementById('lbSuiv')?.addEventListener('click', () => show(pos + 1, 1));
  lb.addEventListener('click', (e) => {
    const t = e.target as HTMLElement;
    if (t === lb || t.id === 'lbClose') close();
  });
  addEventListener('keydown', (e) => {
    if (!lb.classList.contains('on')) return;
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
