#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Les quatre configurations d'escalier, en isométrie.

Ce sont des dessins techniques, pas des photos : ils montrent ce qu'on
fabrique sans laisser croire qu'il s'agit d'un chantier précis. Les cotes
sont réalistes — giron 28 cm, hauteur de marche 18,5 cm, emmarchement
95 cm — pour que les proportions tiennent debout à l'œil d'un menuisier.
"""
import pathlib, sys
sys.path.insert(0, '/home/claude')
from iso import Scene, DESSUS, COTE_X, COTE_Y, RAIL_D, RAIL_X, RAIL_Y

G, R, W, T = 0.28, 0.185, 0.95, 0.04     # giron, hauteur, emmarchement, épaisseur
HR = 0.92                                # hauteur de main courante au-dessus du nez
EP, EP_N = 0.042, 0.075                  # section des barreaux, des poteaux
E_LIM, H_LIM = 0.045, 0.26               # limon : épaisseur, hauteur

BOIS = dict(dessus=DESSUS, cote_x=COTE_X, cote_y=COTE_Y)
FER = dict(dessus=RAIL_D, cote_x=RAIL_X, cote_y=RAIL_Y)


def marche(sc, x, y, z, dx=G, dy=W):
    sc.boite((x, y, z - T), (dx, dy, T), DESSUS, COTE_X, COTE_Y)


def limon(sc, a, b, prof=None):
    """La planche latérale qui porte les marches : une seule pièce filante,
    d'aplomb, du pied de la volée jusqu'en haut."""
    sc.poutre(a, b, E_LIM, H_LIM, depth=prof, **BOIS)


def rampe(sc, nez, prof=None):
    """Main courante, poteaux aux deux bouts, un barreau par marche."""
    hauts = [(x, y, z + HR) for x, y, z in nez]
    for i in range(len(hauts) - 1):
        sc.poutre(hauts[i], hauts[i + 1], 0.05, 0.05, depth=prof, **FER)
    for k, ((x, y, z), h) in enumerate(zip(nez, hauts)):
        poteau = k in (0, len(nez) - 1)
        e = EP_N if poteau else EP
        sc.poutre((x, y, z - (0.14 if poteau else 0)), h, e, e, depth=prof, **FER)


# ---------------------------------------------------------------- 1. droit
def droit():
    """La volée monte vers -y. Le long de +x elle s'étalait en largeur et
    la vignette la réduisait à un ruban ; dans ce sens-là, la composition
    est plus haute que large et les marches se voient."""
    sc, n = Scene(), 12
    for i in range(n):
        marche(sc, 0, -(i + 1) * G, (i + 1) * R, dx=W, dy=G)
    # Limon devant, rampe derrière : le limon court sous les marches et ne
    # masque donc rien, alors qu'une rampe posée devant cacherait le nez de
    # chaque marche — et c'est justement ce qu'on vient regarder.
    limon(sc, (W + E_LIM / 2, 0, R - T - H_LIM / 2),
          (W + E_LIM / 2, -n * G, n * R - T - H_LIM / 2))
    rampe(sc, [(0.06, -(i * G + G / 2), (i + 1) * R) for i in range(n)])
    return sc.svg(680, 520, titre='Escalier droit')


# ------------------------------------------------------ 2. quart tournant
def quart_tournant():
    """Volée basse vers +x, trois marches balancées dans le quart,
    volée haute vers +y. Le pivot, c'est le coin intérieur du virage."""
    sc, n1, n2 = Scene(), 0, 11
    cx, z0 = n1 * G, n1 * R
    P = (cx, 0.0)                                # coin intérieur : tout converge ici

    def bord(s):                                 # le bord extérieur du quart
        return (cx + s, W) if s <= W else (cx + W, W - (s - W))

    s = [0, 2 * W / 3, 4 * W / 3, 2 * W]
    # contours donnés dans le sens trigonométrique, sinon les faces cachées
    # se dessinent par-dessus les visibles
    for k, c in enumerate([[P, bord(s[1]), bord(s[0])],
                           [P, bord(s[2]), (cx + W, W), bord(s[1])],
                           [P, bord(s[3]), bord(s[2])]]):
        # extrudées sur toute la hauteur de marche, pas seulement l'épaisseur
        # du plateau : sans contremarche elles flottaient dans le vide.
        sc.prisme(c, z0 + (k + 1) * R, R, DESSUS, COTE_X, COTE_Y)

    # Le poteau d'angle : il tient la rampe au droit du pivot et, sur le
    # dessin, il rattache le quart tournant au reste de l'escalier.
    sc.poutre((cx, 0, 0), (cx, 0, z0 + 3 * R + HR), 0.09, 0.09, **FER)

    z1 = z0 + 3 * R
    for j in range(n2):
        marche(sc, cx, -(j + 1) * G, z1 + (j + 1) * R, dx=W, dy=G)
    limon(sc, (cx + W + E_LIM / 2, 0, z1 + R - T - H_LIM / 2),
          (cx + W + E_LIM / 2, -n2 * G, z1 + n2 * R - T - H_LIM / 2))

    rampe(sc, [(cx + 0.06, -(j * G + G / 2), z1 + (j + 1) * R) for j in range(n2)])
    return sc.svg(680, 520, titre='Escalier quart tournant')


# ------------------------------------------------------- 3. demi-tournant
def demi_tournant():
    """Deux volées parallèles et un palier de repos : le demi-tour complet.
    Comme la volée droite, les volées filent vers -y : la vignette est
    alors plus haute que large et les marches restent lisibles."""
    sc, n = Scene(), 8
    jour = 0.14
    x2 = W + jour                                # décalage de la volée retour

    for i in range(n):                           # volée aller, vers -y
        marche(sc, 0, -(i + 1) * G, (i + 1) * R, dx=W, dy=G)
    limon(sc, (W + E_LIM / 2, 0, R - T - H_LIM / 2),
          (W + E_LIM / 2, -n * G, n * R - T - H_LIM / 2))

    z0, yp = n * R, -n * G
    # Le palier passe sous tout le reste : sans profondeur forcée, son centre
    # de gravité le ferait dessiner par-dessus les marches de la volée retour.
    # C'est la limite connue de l'algorithme du peintre sur une grande surface.
    sc.boite((0, yp - W, z0 - T), (2 * W + jour, W, T), DESSUS, COTE_X, COTE_Y)
    sc.faces[-5:] = [(-1e6, *f[1:]) for f in sc.faces[-5:]]

    for j in range(n):                           # volée retour, vers +y
        marche(sc, x2, yp - W + j * G, z0 + (j + 1) * R, dx=W, dy=G)
    limon(sc, (x2 + W + E_LIM / 2, yp - W, z0 + R - T - H_LIM / 2),
          (x2 + W + E_LIM / 2, yp - W + n * G, z0 + n * R - T - H_LIM / 2))

    rampe(sc, [(0.06, -(i * G + G / 2), (i + 1) * R) for i in range(n)])
    rampe(sc, [(x2 + 0.06, yp - W + j * G + G / 2, z0 + (j + 1) * R) for j in range(n)])
    return sc.svg(680, 520, titre='Escalier demi-tournant')


# ---------------------------------------------------------- 4. garde-corps
def garde_corps():
    sc, lg, n = Scene(), 3.0, 11
    sc.boite((0, 0, 0), (lg, 0.09, 0.07), DESSUS, COTE_X, COTE_Y)          # lisse basse
    for i in range(n):
        x = 0.18 + i * (lg - 0.36) / (n - 1)
        sc.boite((x, 0.024, 0.07), (EP, EP, HR - 0.15), DESSUS, COTE_X, COTE_Y)
    for x in (0.0, lg - EP_N):                                             # poteaux
        sc.boite((x, 0.008, 0.07), (EP_N, EP_N, HR - 0.15), DESSUS, COTE_X, COTE_Y)
    sc.boite((-0.04, -0.025, HR - 0.08), (lg + 0.08, 0.14, 0.07),
             DESSUS, COTE_X, COTE_Y)                                       # main courante
    return sc.svg(680, 520, titre='Garde-corps')


OUT = pathlib.Path('/mnt/user-data/outputs/dohab-site/public/illustrations')
OUT.mkdir(parents=True, exist_ok=True)
for nom, f in (('escalier-droit', droit),
               ('escalier-quart-tournant', quart_tournant),
               ('escalier-demi-tournant', demi_tournant),
               ('garde-corps', garde_corps)):
    svg = f()
    (OUT / f'{nom}.svg').write_text(svg, encoding='utf-8')
    print(f'{nom}.svg  {round(len(svg)/1024,1)} ko')
