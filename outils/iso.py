#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Petit moteur isométrique : on décrit des volumes en 3D, il sort du SVG.

Projection : +x part vers le bas-droite, +y vers le bas-gauche, +z vers le haut.
La caméra est donc en (1, 1, 1) : une face est visible quand sa normale
sortante pointe vers elle, c'est-à-dire quand n·(1,1,1) > 0.

ATTENTION au sens des contours : ils se donnent dans le sens trigonométrique
vu de dessus — (0,0), (1,0), (1,1), (0,1). Dans l'autre sens, les normales
sortent vers l'intérieur et on dessine les faces cachées par-dessus les
autres. C'est le genre de bug qui ne se voit qu'à l'image.
"""
import math

C = math.cos(math.radians(30))
# 0.5 serait l'isométrie d'école. On écrase le sol à 0.30 : en isométrie
# stricte, une volée réelle (giron 28, hauteur 18,5) paraît presque plate,
# parce que la descente du sol mange la montée. À 0.30 la pente se lit.
S = 0.30


def iso(p):
    """(x, y, z) du monde → (X, Y) de l'écran."""
    x, y, z = p
    return ((x - y) * C, (x + y) * S - z)


def _norm(v):
    n = math.sqrt(sum(c * c for c in v)) or 1.0
    return tuple(c / n for c in v)


def _cross(a, b):
    return (a[1] * b[2] - a[2] * b[1],
            a[2] * b[0] - a[0] * b[2],
            a[0] * b[1] - a[1] * b[0])


class Scene:
    """Accumule des faces puis les dessine de la plus lointaine à la plus
    proche. En isométrie la profondeur, c'est x + y + z : plus c'est grand,
    plus c'est près de l'œil."""

    def __init__(self):
        self.faces = []

    def face(self, pts, fill, stroke='#AEA695', w=0.9, depth=None):
        d = depth if depth is not None else sum(sum(p) for p in pts) / len(pts)
        self.faces.append((d, pts, fill, stroke, w))

    def quad(self, pts, fill, **kw):
        """Quadrilatère quelconque, dessiné seulement s'il regarde la caméra."""
        a, b, c = pts[0], pts[1], pts[2]
        n = _cross([c[i] - b[i] for i in range(3)], [a[i] - b[i] for i in range(3)])
        if sum(n) <= 1e-9:
            return
        self.face(pts, fill, **kw)

    # ---------------------------------------------------------------- volumes
    def prisme(self, contour, z_haut, ep, dessus, cote_x, cote_y):
        """Un polygone (x, y) extrudé vers le bas sur `ep`.
        Sert aux marches, y compris aux marches balancées qui ne sont pas
        rectangulaires."""
        z_bas = z_haut - ep
        n = len(contour)
        for i in range(n):
            ax, ay = contour[i]
            bx, by = contour[(i + 1) % n]
            nx, ny = (by - ay), -(bx - ax)      # normale sortante de l'arête
            if nx + ny <= 1e-9:
                continue                        # face cachée
            teinte = cote_x if nx >= ny else cote_y
            self.face([(ax, ay, z_bas), (bx, by, z_bas),
                       (bx, by, z_haut), (ax, ay, z_haut)], teinte)
        self.face([(x, y, z_haut) for x, y in contour], dessus)

    def boite(self, o, t, dessus, cote_x, cote_y):
        x, y, z = o
        dx, dy, dz = t
        self.prisme([(x, y), (x + dx, y), (x + dx, y + dy), (x, y + dy)],
                    z + dz, dz, dessus, cote_x, cote_y)

    def poutre(self, a, b, larg, haut=None, dessus='#fff', cote_x='#eee',
               cote_y='#ddd', depth=None):
        """Barre de section rectangulaire tendue entre deux points :
        barreau, main courante, limon. La section reste d'aplomb — un limon
        est une planche verticale, pas une planche perpendiculaire à la
        pente — sauf si la barre est elle-même verticale."""
        haut = larg if haut is None else haut
        d = _norm([b[i] - a[i] for i in range(3)])
        if abs(d[2]) < 0.99:
            u = [c * larg / 2 for c in _norm(_cross(d, (0, 0, 1)))]
            v = [0, 0, haut / 2]
        else:
            u = [larg / 2, 0, 0]
            v = [0, haut / 2, 0]
        coins = []
        prof = (sum(a) + sum(b)) / 2
        for p in (a, b):
            for su, sv in ((1, 1), (1, -1), (-1, -1), (-1, 1)):
                coins.append(tuple(p[i] + su * u[i] + sv * v[i] for i in range(3)))
        A, B = coins[:4], coins[4:]
        prof = prof if depth is None else depth
        for i in range(4):                                   # les quatre flancs
            j = (i + 1) % 4
            self.quad([A[i], A[j], B[j], B[i]],
                      cote_x if i % 2 else cote_y, depth=prof)
        self.quad([B[0], B[1], B[2], B[3]], dessus, depth=prof)   # les deux bouts
        self.quad([A[3], A[2], A[1], A[0]], dessus, depth=prof)

    # ------------------------------------------------------------------ sortie
    def svg(self, largeur, hauteur, marge=16, titre=''):
        pret = sorted(((d, [iso(p) for p in pts], f, s, w)
                       for d, pts, f, s, w in self.faces), key=lambda t: t[0])
        xs = [p[0] for f in pret for p in f[1]]
        ys = [p[1] for f in pret for p in f[1]]
        x0, x1, y0, y1 = min(xs), max(xs), min(ys), max(ys)
        ech = min((largeur - 2 * marge) / (x1 - x0), (hauteur - 2 * marge) / (y1 - y0))
        ox = marge + ((largeur - 2 * marge) - (x1 - x0) * ech) / 2 - x0 * ech
        oy = marge + ((hauteur - 2 * marge) - (y1 - y0) * ech) / 2 - y0 * ech

        out = [f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {largeur} {hauteur}" '
               f'fill="none" role="img" aria-label="{titre}">',
               f'  <title>{titre}</title>',
               '  <g stroke-linejoin="round" vector-effect="non-scaling-stroke">']
        for d, pts, fill, stroke, w in pret:
            coords = ' '.join(f'{ox + x * ech:.1f},{oy + y * ech:.1f}' for x, y in pts)
            out.append(f'    <polygon points="{coords}" fill="{fill}" '
                       f'stroke="{stroke}" stroke-width="{w}"/>')
        out += ['  </g>', '</svg>', '']
        return '\n'.join(out)


# ---- teintes : un bois très clair, cohérent avec le reste du site ----------
DESSUS = '#F7F3EC'
COTE_X = '#E8E1D5'
COTE_Y = '#D7CEBD'
RAIL_D = '#F2EDE4'
RAIL_X = '#E4DCCE'
RAIL_Y = '#D3C9B7'
