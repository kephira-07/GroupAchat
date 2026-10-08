import type {
  Alerte,
  FileDeTravail,
  Indicateur,
  LigneActivite,
} from "../domaine/admin";

/**
 * Le jeu de demonstration de l'ecran A1.
 *
 * Il montre une **journee ordinaire avec une alerte serieuse** : un changement
 * de compte Mobile Money, qui est le signal de fraude le plus courant, et une
 * file de livraisons non confirmees qui traine depuis neuf jours.
 *
 * La spec demande aussi de savoir dessiner la **journee calme** — pas
 * d'alerte, files a zero ou a un. C'est l'etat le plus frequent et celui qu'on
 * oublie : un administrateur qui ouvre son ecran tous les matins pour voir un
 * mur rouge finit par ne plus l'ouvrir. L'ecran A1 sait basculer entre les
 * deux, pour qu'on puisse montrer les deux.
 */
export const ALERTES: readonly Alerte[] = [
  {
    id: "AL1",
    gravite: "danger",
    texte:
      "Changement de compte Mobile Money — Lomé Deals, il y a 2 h, avant un versement de 381 710 F",
    lien: "Ouvrir le dossier",
  },
  {
    id: "AL2",
    gravite: "attention",
    texte: "Chez Sika approche son plafond d'exposition : 480 000 F sur 500 000 F",
    lien: "Ouvrir le dossier",
  },
];

export const FILES: readonly FileDeTravail[] = [
  {
    id: "F1",
    libelle: "Dossiers KYC à valider",
    nombre: 4,
    plusAncienJours: 2,
  },
  {
    id: "F2",
    libelle: "Justificatifs d'achat à contrôler",
    nombre: 2,
    plusAncienJours: 1,
  },
  {
    id: "F3",
    libelle: "Contestations à arbitrer",
    nombre: 1,
    plusAncienJours: 4,
  },
  {
    id: "F4",
    libelle: "Livraisons non confirmées (7 j)",
    nombre: 3,
    plusAncienJours: 9,
    /* La seule file ou notre propre argent est expose : le groupeur a deja
       ete paye. Elle porte un filet `danger`. */
    argentExpose: true,
  },
  { id: "F5", libelle: "Messages signalés", nombre: 6, plusAncienJours: 1 },
  /* Une file a zero reste affichee : la faire disparaitre deplacerait les
     cartes d'un jour a l'autre, et on ne retrouverait plus rien. */
  { id: "F6", libelle: "Retours de colis", nombre: 0 },
];

export const INDICATEURS: readonly Indicateur[] = [
  {
    id: "I1",
    libelle: "Argent détenu en ce moment",
    valeur: "1 284 000 F",
  },
  {
    id: "I2",
    libelle: "Groupages en cours",
    valeur: "11",
    detail: "dont 3 à échéance sous 48 h",
  },
  { id: "I3", libelle: "Taux de livraison (30 j)", valeur: "94 %" },
  { id: "I4", libelle: "Commission encaissée (30 j)", valeur: "72 400 F" },
];

export const ACTIVITE: readonly LigneActivite[] = [
  {
    id: "AC1",
    date: "2026-10-07",
    texte: "Groupage clôturé — Écouteurs filaires, 32 commandes",
  },
  {
    id: "AC2",
    date: "2026-10-07",
    texte: "Versement effectué — Mama Gro, 121 600 F",
  },
  { id: "AC3", date: "2026-10-07", texte: "Devis fournisseur validé — Mama Gro" },
  { id: "AC4", date: "2026-10-06", texte: "Dossier KYC validé — Chez Sika" },
  {
    id: "AC5",
    date: "2026-10-06",
    texte: "Message signalé retiré — questions du groupage C4",
  },
  {
    id: "AC6",
    date: "2026-10-05",
    texte: "Litige tranché en faveur de l'acheteur — commande B3N-6ZX",
  },
  {
    id: "AC7",
    date: "2026-10-05",
    texte: "Groupage annulé — Savon de Marseille, 12 remboursements",
  },
  {
    id: "AC8",
    date: "2026-10-04",
    texte: "Plafond d'exposition relevé — Lomé Deals, 500 000 F",
  },
  {
    id: "AC9",
    date: "2026-10-04",
    texte: "Versement effectué — Lomé Deals, 381 710 F",
  },
  {
    id: "AC10",
    date: "2026-10-03",
    texte: "Dossier KYC refusé — pièce d'identité illisible",
  },
];
