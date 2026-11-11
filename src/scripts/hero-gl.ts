/**
 * HAUT DE PAGE — passage d'une photo à l'autre dessiné par la carte graphique
 * (WebGL), au lieu d'un simple fondu.
 *
 * Le principe : un <canvas> posé par-dessus les photos du haut de page. Un
 * petit programme exécuté par la carte graphique (le « shader », plus bas)
 * reçoit deux photos — celle qu'on quitte (A) et celle qui arrive (B) — et un
 * nombre t qui va de 0 à 1. Pour chaque pixel il décide combien montrer de A
 * et de B : un front diagonal traverse l'écran, son bord est irrégulier (du
 * « bruit », comme la fibre du bois) et les deux photos glissent légèrement
 * en sens inverse pendant le passage.
 *
 * Tout est « en plus » : les <img> restent en dessous et continuent leur
 * fondu habituel. Si WebGL n'existe pas, si le système demande de réduire
 * les animations, ou si la carte graphique lâche en route, on retire le
 * canvas et le site retombe sur ce fondu, sans rien casser.
 *
 * Aucune bibliothèque : une centaine de lignes de WebGL 1, compris par tous
 * les navigateurs depuis dix ans.
 */

const SOMMETS = `
attribute vec2 p;
varying vec2 v;
void main(){ v = p * .5 + .5; gl_Position = vec4(p, 0., 1.); }`;

const PIXELS = `
precision mediump float;
varying vec2 v;
uniform sampler2D A, B;
uniform vec4 cA, cB;   // cadrage de chaque photo : échelle (xy) et décalage (zw)
uniform float t;       // avancement du passage, 0 → 1
uniform float g;       // graine : le bord n'est jamais deux fois le même

float h(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float bruit(vec2 p){
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3. - 2. * f);
  return mix(mix(h(i), h(i + vec2(1., 0.)), f.x),
             mix(h(i + vec2(0., 1.)), h(i + vec2(1., 1.)), f.x), f.y);
}
// une photo, recadrée comme « object-fit: cover », avec un léger zoom
vec4 photo(sampler2D s, vec4 c, vec2 uv, float zoom){
  uv = (uv - .5) / zoom + .5;
  uv = uv * c.xy + c.zw;
  return texture2D(s, vec2(uv.x, 1. - uv.y));
}
void main(){
  float n = bruit(v * vec2(2.5, 4.) + g) * .6 + bruit(v * vec2(7., 11.) - g) * .4;
  float front = (v.x + (1. - v.y) * .28) / 1.28;       // diagonale, de gauche à droite
  float large = .26;                                   // largeur du bord flou
  float pos = mix(-large - .16, 1.16, t);
  float m = 1. - smoothstep(pos, pos + large, front + (n - .5) * .3);   // 0 = A, 1 = B
  vec4 a = photo(A, cA, v + vec2(-.04 * m, 0.), 1.08 + .04 * t);
  vec4 b = photo(B, cB, v + vec2(.04 * (1. - m), 0.), 1.14 - .06 * t);
  gl_FragColor = mix(a, b, m);
}`;

const DUREE = 1500;   // ms
const adouci = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);

export interface Rideau { aller(i: number): void }

export function rideau(hero: HTMLElement, imgs: HTMLImageElement[]): Rideau | null {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return null;
  const zone = hero.querySelector<HTMLElement>('.hero-fonds');
  if (!zone || imgs.length < 2) return null;

  const cv = document.createElement('canvas');
  cv.className = 'hero-gl';
  const gl = cv.getContext('webgl', { alpha: false, antialias: false, powerPreference: 'low-power' });
  if (!gl) return null;

  // --- le programme (deux shaders compilés puis liés) ---
  const compiler = (type: number, source: string) => {
    const s = gl.createShader(type)!;
    gl.shaderSource(s, source);
    gl.compileShader(s);
    return s;
  };
  const prog = gl.createProgram()!;
  gl.attachShader(prog, compiler(gl.VERTEX_SHADER, SOMMETS));
  gl.attachShader(prog, compiler(gl.FRAGMENT_SHADER, PIXELS));
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return null;
  gl.useProgram(prog);

  // un seul grand triangle qui couvre tout l'écran
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const lieu = gl.getAttribLocation(prog, 'p');
  gl.enableVertexAttribArray(lieu);
  gl.vertexAttribPointer(lieu, 2, gl.FLOAT, false, 0, 0);
  const u = (nom: string) => gl.getUniformLocation(prog, nom);
  const uA = u('A'), uB = u('B'), ucA = u('cA'), ucB = u('cB'), ut = u('t'), ug = u('g');

  // --- les photos, envoyées à la carte graphique (« textures ») ---
  // Pas plus grandes que nécessaire : une photo de 2400 px occupe 17 Mo de
  // mémoire graphique ; sur un téléphone, 1000 px suffisent largement.
  const dpr = Math.min(devicePixelRatio || 1, 1.5);
  const cote = Math.min(2048, Math.ceil(Math.max(screen.width, screen.height) * dpr * 1.1));
  const textures = new Map<number, WebGLTexture>();

  const charger = async (i: number): Promise<void> => {
    if (textures.has(i)) return;
    const img = imgs[i];
    if (img.loading === 'lazy') img.loading = 'eager';
    await img.decode();
    const k = Math.min(1, cote / Math.max(img.naturalWidth, img.naturalHeight));
    const w = Math.round(img.naturalWidth * k), h = Math.round(img.naturalHeight * k);
    let source: TexImageSource;
    try {
      // réduction faite par le navigateur, hors du fil principal quand il le peut
      source = await createImageBitmap(img, { resizeWidth: w, resizeHeight: h, resizeQuality: 'high' });
    } catch {
      const c = document.createElement('canvas');
      c.width = w;
      c.height = h;
      c.getContext('2d')!.drawImage(img, 0, 0, w, h);
      source = c;
    }
    if (textures.has(i) || mort) return;
    const tex = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, source);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    textures.set(i, tex);
    (source as ImageBitmap).close?.();
  };

  // Même recadrage que le CSS (object-fit: cover + object-position) : quelle
  // partie de la photo tombe dans le canvas, sous forme échelle + décalage.
  const cadrage = (i: number): [number, number, number, number] => {
    const img = imgs[i];
    const pos = getComputedStyle(img).objectPosition.split(' ').map((x) => parseFloat(x) / 100);
    const px = Number.isFinite(pos[0]) ? pos[0] : 0.5;
    const py = Number.isFinite(pos[1]) ? pos[1] : 0.5;
    const rc = cv.width / cv.height;
    const ri = img.naturalWidth / img.naturalHeight;
    if (rc > ri) { const sy = ri / rc; return [1, sy, 0, (1 - sy) * py]; }
    const sx = rc / ri;
    return [sx, 1, (1 - sx) * px, 0];
  };

  let de = 0, vers = 0, t0 = 0, graine = 0;
  let enCours = false, visible = true, mort = false, demande = 0;

  const dessiner = (t: number) => {
    const a = textures.get(de), b = textures.get(vers);
    if (!a || !b || mort) return;
    gl.viewport(0, 0, cv.width, cv.height);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, a);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, b);
    gl.uniform1i(uA, 0);
    gl.uniform1i(uB, 1);
    gl.uniform4fv(ucA, cadrage(de));
    gl.uniform4fv(ucB, cadrage(vers));
    gl.uniform1f(ut, t);
    gl.uniform1f(ug, graine);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };

  // on ne garde en mémoire que la photo affichée et la suivante
  const ranger = () => {
    const suivante = (vers + 1) % imgs.length;
    for (const [i, tex] of textures) {
      if (i !== vers && i !== suivante) { gl.deleteTexture(tex); textures.delete(i); }
    }
    charger(suivante).catch(() => {});
  };

  const pas = (maintenant: number) => {
    if (mort) return;
    const x = Math.min(1, (maintenant - t0) / DUREE);
    dessiner(adouci(x));
    if (x < 1) return void requestAnimationFrame(pas);
    enCours = false;
    de = vers;
    ranger();
  };

  const lacher = () => {            // retour au fondu des <img>
    mort = true;
    cv.remove();
  };

  const taille = () => {
    const w = Math.round(zone.clientWidth * dpr), h = Math.round(zone.clientHeight * dpr);
    if (!w || !h || (cv.width === w && cv.height === h)) return;
    cv.width = w;
    cv.height = h;
    if (!enCours) dessiner(1);
  };

  zone.appendChild(cv);
  taille();
  new ResizeObserver(taille).observe(zone);
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(hero);
  cv.addEventListener('webglcontextlost', lacher);

  // première photo : dès qu'elle est dessinée, le canvas passe devant
  charger(0).then(() => {
    dessiner(1);
    cv.classList.add('pret');
    ranger();
  }).catch(lacher);

  return {
    async aller(i: number) {
      if (mort || i === vers) return;
      const jeton = ++demande;
      try { await charger(i); } catch { return lacher(); }
      if (jeton !== demande || mort) return;      // une autre demande est arrivée entre-temps
      if (enCours) de = vers;                     // clic pendant un passage : on repart de la photo en cours d'arrivée
      vers = i;
      graine = Math.random() * 10;
      if (!visible || document.hidden) {          // personne ne regarde : pas d'animation
        de = vers;
        dessiner(1);
        return ranger();
      }
      t0 = performance.now();
      if (!enCours) { enCours = true; requestAnimationFrame(pas); }
    }
  };
}
