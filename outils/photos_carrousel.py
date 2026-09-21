"""
RÉ-EXPORT DES PHOTOS DU CARROUSEL DEPUIS LES ORIGINAUX.

Pourquoi ce script existe : les photos servies au carrousel faisaient
1600 px de large pour 60 à 120 ko. C'est correct pour une vignette, c'est
trop peu pour une image plein écran — et sur un écran Retina le navigateur
en réclame le double, donc il agrandit et ça devient mou. Ici on repart des
originaux (HEIC pleine définition sortis du téléphone) et on sort du
2400 px avec une compression plus douce. Le poids double, mais on reste
sous 260 ko par photo, et seule la première se charge tout de suite.

    py outils/photos_carrousel.py

Pour ajouter une photo au carrousel : la déposer dans public/photos/ une
première fois (n'importe comment), ajouter la ligne correspondante dans
PAIRES, relancer le script. Il conserve le rapport d'image du fichier
existant, donc le cadrage à l'écran ne bouge pas.

Dépendances :  py -m pip install pillow pillow-heif
"""
import os
from PIL import Image, ImageOps
import pillow_heif

pillow_heif.register_heif_opener()   # sans ça, Pillow ne lit pas les .HEIC

BUREAU = os.path.join(os.path.expanduser('~'), 'Desktop')
PHOTOS = os.path.join(BUREAU, 'dohab_pictures')


def src(nom):
    # Les originaux sont rangés par pièce (cuisine/, chambre/…) : on les
    # cherche par leur nom, quel que soit le sous-dossier où ils sont.
    for dossier, _, fichiers in os.walk(PHOTOS):
        if nom in fichiers:
            return os.path.join(dossier, nom)
    return os.path.join(PHOTOS, nom)   # introuvable : signalé plus bas


WEB = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
                   'public', 'photos')

LARGEUR, QUALITE = 2400, 80

# (fichier servi par le site, original dont il provient)
# Les correspondances ont été retrouvées en comparant les images, pas au
# hasard : si tu remplaces une photo, mets à jour la ligne.
PAIRES = [
    ('cuisine-noyer-hotte.webp',     src('IMG_9583.HEIC')),
    ('cuisine-noyer-ilot-noir.webp', src('IMG_7242.HEIC')),
    ('armoire-etageres-noyer.webp',  src('IMG_3935.HEIC')),
    # Celle-ci vient de WhatsApp : l'original est déjà recompressé à
    # 2000 px. On ne peut pas faire mieux que 1920 px. Si le patron
    # retrouve la photo d'origine, la substituer ici.
    ('mur-tv-gris-cheminee.webp',
     src('WhatsApp Image 2026-08-28 at 11.48.14.jpeg')),
    ('chambre-tv-cannele.webp',      src('IMG_9263.HEIC')),
    ('bain-noyer-miroir-ovale.webp', src('IMG_3700.HEIC')),
    ('rangement-colonnes-noires.webp', src('IMG_3948.HEIC')),
]

for nom, source in PAIRES:
    chemin = os.path.join(WEB, nom)
    if not os.path.exists(source):
        print(f'!! original introuvable, ignoré : {source}')
        continue

    ancien = Image.open(chemin)
    ar = ancien.size[0] / ancien.size[1]
    avant = os.path.getsize(chemin) // 1024

    # exif_transpose : une photo prise en portrait porte sa rotation dans
    # les métadonnées. Sans ça elle ressort couchée.
    im = ImageOps.exif_transpose(Image.open(source)).convert('RGB')
    W, H = im.size

    # recadrage centré au rapport d'image du fichier qu'on remplace
    if abs(W / H - ar) > 0.005:
        if W / H > ar:
            w = int(H * ar)
            im = im.crop(((W - w) // 2, 0, (W - w) // 2 + w, H))
        else:
            h = int(W / ar)
            im = im.crop((0, (H - h) // 2, W, (H - h) // 2 + h))

    # LARGEUR borne le plus grand côté : une photo en portrait sort en
    # 1800 x 2400, pas en 2400 x 3200 qui pèserait le double pour rien.
    # Et on n'agrandit jamais : ça n'ajoute aucun détail.
    echelle = min(1.0, LARGEUR / max(im.size))
    taille = (round(im.size[0] * echelle), round(im.size[1] * echelle))
    im = im.resize(taille, Image.LANCZOS)
    im.save(chemin, 'WEBP', quality=QUALITE, method=6)

    print(f'{nom:32} {ancien.size[0]}px/{avant}ko  ->  {im.size[0]}px/'
          f'{os.path.getsize(chemin) // 1024}ko')
