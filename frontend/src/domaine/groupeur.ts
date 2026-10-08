import type { Categorie, Quartier } from "./groupage";

/**
 * Le modele du cote groupeur — ecrans 13 a 21.
 *
 * **La regle d'anonymat tient ici aussi, et c'est elle qui protege le modele
 * economique** (§1.7). Le groupeur voit des **codes et des quartiers**, jamais
 * un nom, un numero ou une adresse. Un groupeur qui pourrait se constituer un
 * fichier de clients les servirait hors plateforme, au meme prix, sans
 * commission. Aucun type de ce fichier ne porte donc d'identite d'acheteur —
 * et ce n'est pas un oubli a combler.
 *
 * Les identites ne sortent qu'une fois, vers le livreur, le jour de la tournee
 * (`domaine/livreur.ts`).
 */

/** La commission de la plateforme : 5 %, a la charge du groupeur. */
export const TAUX_COMMISSION = 0.05;

/**
 * Ce que le groupeur touche sur un montant collecte.
 *
 * **La commission ne porte jamais sur les frais de livraison** : ceux-ci sont
 * payes par l'acheteur et vont au transporteur. Les melanger ferait payer au
 * groupeur une commission sur de l'argent qui ne passe pas par lui.
 */
export function calculerVersement(collecteSurLesParts: number): {
  collecte: number;
  commission: number;
  verse: number;
} {
  const commission = Math.round(collecteSurLesParts * TAUX_COMMISSION);
  return {
    collecte: collecteSurLesParts,
    commission,
    verse: collecteSurLesParts - commission,
  };
}

export type StatutCampagne =
  | "ouverte"
  | "a-decider"
  | "en-cours"
  | "livree"
  | "annulee";

export const LIBELLE_CAMPAGNE: Record<StatutCampagne, string> = {
  ouverte: "Ouverte",
  "a-decider": "À décider",
  "en-cours": "Commande en cours",
  livree: "Livrée",
  annulee: "Annulée",
};

/** Une campagne vue par son groupeur. */
export interface Campagne {
  id: string;
  produit: string;
  categorie: Categorie;
  prixPart: number;
  commandes: number;
  /** Collecte sur les parts, hors frais de livraison. */
  collecte: number;
  heuresRestantes: number;
  statut: StatutCampagne;
  photo?: string;
}

/**
 * Une commande vue par le groupeur : **un code, pas une personne**.
 *
 * Il n'y a volontairement ni nom, ni telephone, ni adresse — seulement le
 * quartier, qui lui sert a organiser ses tournees et qui n'identifie personne.
 */
export interface CommandeGroupeur {
  codeLivraison: string;
  quantite: number;
  variante?: string;
  montant: number;
  quartier: Quartier;
}

/** Une entree de « A faire aujourd'hui » (ecran 13). */
export interface Tache {
  id: string;
  /** `urgent` passe la pastille en `danger`, les autres en `marque`. */
  urgence: "urgent" | "normal";
  libelle: string;
  /** Vers quel ecran la tache mene. */
  destination: "decision" | "justificatif" | "questions" | "demandes";
}

/** Une ligne du portefeuille (ecran 18). */
export interface MouvementPortefeuille {
  id: string;
  date: string;
  libelle: string;
  /** Positif pour un versement, negatif pour une retenue. */
  montant?: number;
  /** Remplace le montant quand la ligne n'en porte pas. */
  mention?: string;
}

/** Une demande agregee, cote groupeur (ecran 19). */
export interface DemandeAgregee {
  id: string;
  produit: string;
  personnes: number;
  quartier: Quartier;
  /** Depuis combien de jours la demande s'accumule. */
  joursEcoules: number;
  budgetMoyen: number;
  volumeEstime: string;
}

/** Une ligne de l'histogramme des revenus par campagne (ecran 21). */
export interface RevenuParCampagne {
  campagne: string;
  /** Absent quand la campagne a ete annulee : elle reste visible, sans barre. */
  verse?: number;
}

/** Les statistiques du groupeur (ecran 21). */
export interface Statistiques {
  /**
   * **Ce qu'il a touche, pas ce qu'il a encaisse.** Le collecte inclut
   * l'argent qui n'est pas encore a lui ; mettre en avant un chiffre plus
   * flatteur que la realite detruit la credibilite du tableau de bord au
   * premier versement.
   */
  verse: number;
  variationVerse: number;
  campagnesAbouties: { reussies: number; total: number };
  participants: number;
  variationParticipants: number;
  panierMoyen: number;
  variationPanier: number;
  /**
   * Campagnes allees jusqu'a la livraison sur campagnes lancees.
   *
   * **Le lui montrer est un acte de loyaute** : c'est le chiffre qui
   * conditionne ses plafonds d'exposition (§10.4 du cahier des charges), donc
   * il doit savoir sur quoi il est juge.
   */
  tauxReussite: number;
  revenusParCampagne: RevenuParCampagne[];
  parCategorie: { categorie: string; part: number }[];
  parQuartier: { quartier: Quartier; commandes: number; part: number }[];
  /**
   * Les constats de « Ce que ca vous dit ».
   *
   * **Un constat, jamais un conseil.** « Votre panier moyen baisse » est un
   * fait ; « augmentez vos prix » est un conseil commercial dont nous ne
   * sommes pas responsables, et qui nous rendrait comptables de ses pertes.
   */
  constats: { ton: "info" | "attention" | "succes"; texte: string }[];
}
