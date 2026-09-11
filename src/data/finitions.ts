/**
 * LES TEINTES.
 * Relevées sur des réalisations existantes — ce ne sont pas des
 * références fournisseur. Les noms ne se traduisent pas.
 */
export interface Finition {
  id: string;
  n: string;    // nom affiché
  hex: string;  // approximation à l'écran, jamais un substitut à un échantillon
}

export const finitions: Finition[] = [
  {
    "id": "blanc",
    "n": "Wit mat / Blanc mat",
    "hex": "#F0EEE9"
  },
  {
    "id": "creme",
    "n": "Crème",
    "hex": "#E4DCCC"
  },
  {
    "id": "gris",
    "n": "Grijs / Gris",
    "hex": "#ADACA6"
  },
  {
    "id": "chene",
    "n": "Eik / Chêne",
    "hex": "#C6A47A"
  },
  {
    "id": "noyer",
    "n": "Noten / Noyer",
    "hex": "#7A5336"
  },
  {
    "id": "bleu",
    "n": "Blauw / Bleu",
    "hex": "#33455C"
  }
];

export const finitionById = (id: string) =>
  finitions.find((f) => f.id === id);
