#!/usr/bin/env python3
"""
Génère migrations/0003_import_galerie.sql : reprend l'ancienne galerie
(src/data/projets.ts + src/data/galerie-auto.json, titres et descriptions
dans src/i18n/*.json) dans la table `realisations`, une photo par
réalisation, publiées, sans prix.

À lancer une seule fois, depuis la racine du projet :
    python3 outils/import_galerie.py

Le SQL produit peut être rejoué sans risque : chaque réalisation porte
l'id de l'ancienne galerie (legacy_id, unique) et n'est insérée que si
elle n'existe pas encore.
"""
import json
import re
from pathlib import Path

from PIL import Image

RACINE = Path(__file__).resolve().parent.parent
SORTIE = RACINE / 'migrations' / '0003_import_galerie.sql'


def projets_ts():
    """Le tableau de projets.ts est écrit en JSON : on le lit tel quel."""
    src = (RACINE / 'src/data/projets.ts').read_text(encoding='utf-8')
    debut = src.index('export const projets')
    tableau = src[src.index('= [', debut) + 2: src.rindex(']') + 1]
    return json.loads(tableau)


def sql(v):
    if v is None:
        return 'NULL'
    if isinstance(v, int):
        return str(v)
    return "'" + str(v).replace("'", "''") + "'"


def main():
    textes = {l: json.loads((RACINE / f'src/i18n/{l}.json').read_text(encoding='utf-8'))
              for l in ('fr', 'nl', 'en')}
    auto = json.loads((RACINE / 'src/data/galerie-auto.json').read_text(encoding='utf-8'))
    tout = projets_ts() + auto
    # même ordre qu'avant : par pièce, puis dans l'ordre des fichiers
    ordre = ['cuisine', 'salon', 'dressing', 'bain']
    tout.sort(key=lambda p: ordre.index(p['room']))

    lignes = [
        '-- Généré par outils/import_galerie.py : l\'ancienne galerie, une photo par réalisation.',
        '-- Rejouable : rien n\'est inséré deux fois (legacy_id unique).',
    ]
    n = len(tout)
    for i, p in enumerate(tout):
        pid = p['id']
        if not re.fullmatch(r'[a-z0-9-]+', pid):
            raise SystemExit(f'id inattendu : {pid}')
        t = {l: textes[l].get(f'{pid}.t') for l in textes}
        c = {l: textes[l].get(f'{pid}.c') for l in textes}
        # un texte néerlandais/anglais identique au français n'apporte rien
        for l in ('nl', 'en'):
            if t[l] == t['fr']:
                t[l] = None
            if c[l] == c['fr']:
                c[l] = None
        img = RACINE / 'public/photos' / p['photo']
        with Image.open(img) as im:
            w, h = im.size
        src = f"/photos/{p['photo']}"
        valeurs = [p['room'], p.get('finish'), t['fr'], t['nl'], t['en'], c['fr'], c['nl'], c['en'],
                   1, n - i, pid, 'import']
        lignes.append(
            'INSERT OR IGNORE INTO realisations (room, finish, title_fr, title_nl, title_en, '
            'desc_fr, desc_nl, desc_en, published, sort, legacy_id, created_by) VALUES ('
            + ', '.join(sql(v) for v in valeurs) + ');')
        lignes.append(
            'INSERT INTO realisation_photos (realisation_id, src, width, height, position) '
            f'SELECT id, {sql(src)}, {w}, {h}, 0 FROM realisations WHERE legacy_id = {sql(pid)} '
            f'AND NOT EXISTS (SELECT 1 FROM realisation_photos WHERE src = {sql(src)});')
    SORTIE.write_text('\n'.join(lignes) + '\n', encoding='utf-8')
    print(f'{n} réalisations → {SORTIE.relative_to(RACINE)}')


if __name__ == '__main__':
    main()
