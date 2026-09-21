"""
AJOUTER DES PHOTOS À LA GALERIE.

    py outils/galerie.py

Le dossier Bureau/dohab_pictures est rangé par pièce :

    dohab_pictures/
        cuisine/          -> filtre « Cuisines »
        chambre/          -> filtre « Chambre » (armoires, dressings, entrées…)
        salon/            -> filtre « Salon & TV »
        salle-de-bain/    -> filtre « Salle de bain »
        _non-publiees/    -> ignoré : ce que tu veux garder sans le montrer

Dépose une photo (HEIC, JPG, PNG… telle qu'elle sort du téléphone) dans le
bon sous-dossier, lance le script, puis git add / commit / push.

Ce que fait le script, pour chaque photo pas encore publiée :
  1. la tourne dans le bon sens, la réduit à 2000 px de côté et l'enregistre
     en .webp dans public/photos/ ;
  2. l'ajoute à src/data/galerie-auto.json, avec la pièce de son dossier ;
  3. note son nom dans src/data/galerie-sources.json, pour ne jamais la
     publier deux fois.

Une photo ajoutée ainsi s'affiche avec le nom de sa pièce comme titre et
sans teinte. Pour lui donner un vrai titre, ajoute "<id>.t" dans les trois
fichiers de src/i18n/ ; pour une teinte, remplis "finish" dans
galerie-auto.json (blanc, creme, gris, chene, noyer ou bleu).

Changer une photo de catégorie : déplace-la dans un autre sous-dossier et
relance. La retirer du site : mets-la dans _non-publiees/ et relance.
(Ça vaut pour les photos ajoutées par ce script. Les 37 premières
réalisations, avec leurs textes écrits à la main, se règlent dans
src/data/projets.ts.)

AVANT DE PUBLIER, regarde la photo : pas de visage, même dans un miroir,
pas de plaque d'immatriculation, pas de papier lisible. Le script ne voit
rien de tout ça.

Dépendances (une seule fois) :  py -m pip install pillow pillow-heif
"""
import json
import os
import re
import sys

from PIL import Image, ImageOps
import pillow_heif

pillow_heif.register_heif_opener()   # sans ça, Pillow ne lit pas les .HEIC

RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PHOTOS = os.path.join(os.path.expanduser('~'), 'Desktop', 'dohab_pictures')
WEB = os.path.join(RACINE, 'public', 'photos')
AUTO = os.path.join(RACINE, 'src', 'data', 'galerie-auto.json')
SOURCES = os.path.join(RACINE, 'src', 'data', 'galerie-sources.json')

# nom du sous-dossier -> pièce utilisée par le site
PIECES = {'cuisine': 'cuisine', 'chambre': 'dressing',
          'salon': 'salon', 'salle-de-bain': 'bain'}
CACHEES = '_non-publiees'
FORMATS = ('.heic', '.heif', '.jpg', '.jpeg', '.png', '.webp', '.dng')
COTE, QUALITE = 2000, 80


def lire(chemin):
    with open(chemin, encoding='utf-8') as f:
        return json.load(f)


def ecrire(chemin, donnees):
    with open(chemin, 'w', encoding='utf-8') as f:
        json.dump(donnees, f, ensure_ascii=False, indent=2)
        f.write('\n')


def identifiant(dossier, nom):
    # "IMG_4209.HEIC" dans cuisine/ -> "cuisine-img-4209"
    base = re.sub(r'[^a-z0-9]+', '-', os.path.splitext(nom)[0].lower()).strip('-')
    return f'{dossier}-{base}'


def convertir(source, cible):
    # exif_transpose : une photo prise en portrait porte sa rotation dans
    # les métadonnées ; sans ça elle ressort couchée
    im = ImageOps.exif_transpose(Image.open(source)).convert('RGB')
    e = min(1.0, COTE / max(im.size))          # on n'agrandit jamais
    im = im.resize((round(im.size[0] * e), round(im.size[1] * e)), Image.LANCZOS)
    im.save(cible, 'WEBP', quality=QUALITE, method=6)


def main():
    if not os.path.isdir(PHOTOS):
        sys.exit(f'Dossier introuvable : {PHOTOS}')

    auto = lire(AUTO)
    sources = lire(SOURCES)
    par_source = {p['source']: p for p in auto}
    ajoutees, deplacees, retirees = [], [], []

    # ce qui se trouve maintenant dans chaque sous-dossier
    ici = {}
    for dossier in list(PIECES) + [CACHEES]:
        chemin = os.path.join(PHOTOS, dossier)
        os.makedirs(chemin, exist_ok=True)
        for nom in sorted(os.listdir(chemin)):
            if nom.lower().endswith(FORMATS):
                ici[nom] = dossier

    # 1) photos retirées ou changées de pièce
    for nom, p in list(par_source.items()):
        dossier = ici.get(nom)
        if dossier == CACHEES:
            auto.remove(p)
            sources.pop(nom, None)
            retirees.append(nom)
        elif dossier in PIECES and PIECES[dossier] != p['room']:
            p['room'] = PIECES[dossier]
            deplacees.append(f'{nom} -> {dossier}')

    # 2) photos nouvelles : placées en tête, pour que les plus récentes
    #    sortent en premier dans leur pièce
    nouvelles = []
    for nom, dossier in ici.items():
        if dossier == CACHEES or nom in sources:
            continue
        pid = identifiant(dossier, nom)
        try:
            convertir(os.path.join(PHOTOS, dossier, nom), os.path.join(WEB, pid + '.webp'))
        except Exception as e:
            # un vrai fichier RAW, par exemple, que Pillow ne sait pas lire :
            # on le signale et on continue avec les autres
            print(f'!! illisible, ignorée : {dossier}/{nom} ({e})')
            continue
        nouvelles.append({'id': pid, 'photo': pid + '.webp',
                          'room': PIECES[dossier], 'finish': '', 'source': nom})
        sources[nom] = pid + '.webp'
        ajoutees.append(f'{nom} -> {dossier}')
    auto[:0] = nouvelles

    ecrire(AUTO, auto)
    ecrire(SOURCES, dict(sorted(sources.items())))

    for titre, liste in (('Ajoutées', ajoutees), ('Changées de pièce', deplacees),
                         ('Retirées du site', retirees)):
        if liste:
            print(f'{titre} ({len(liste)}) :')
            for ligne in liste:
                print('   ', ligne)
    if not (ajoutees or deplacees or retirees):
        print('Rien de nouveau.')
    else:
        print('\nÀ faire : git add -A, git commit, git push.')


if __name__ == '__main__':
    main()
