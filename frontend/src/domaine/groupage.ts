/**
 * Le modele d'un groupage — le vocabulaire commun a toute l'application.
 *
 * Ce fichier ne contient **que des types et des constantes de vocabulaire** :
 * aucune donnee, aucun composant, aucun appel reseau. C'est ce qui permet de
 * le lire en entier pour comprendre de quoi parle le produit, et de brancher
 * Django dessus sans rien toucher a l'interface.
 *
 * Les noms de champs suivent le §6 du PRD, pour que la bascule vers
 * `GET /api/campagnes/` soit un simple `fetch`.
 *
 * Trois champs a ne jamais perdre de vue, rappeles par le PRD :
 * les **frais de livraison separes de la part**, la **position conservee** sur
 * la commande, et la **cle d'idempotence** sur le paiement. Les deux derniers
 * vivent dans `commande.ts`.
 */

export type Categorie =
  | "alimentaire"
  | "vetements"
  | "chaussures"
  | "hygiene"
  | "maison"
  | "electronique";

export type Quartier =
  | "Agoe"
  | "Be"
  | "Tokoin"
  | "Adidogome"
  | "Nyekonakpoe"
  | "Hedzranawoe";

/** Une caracteristique du produit, telle que l'ecran 3 les presente en table. */
export interface Caracteristique {
  cle: string;
  valeur: string;
}

/** Variante obligatoire avant de commander — « Taille » pour C2 (ecran 5). */
export interface VarianteProduit {
  libelle: string;
  options: string[];
}

export interface Groupage {
  /** Identifiant interne, celui de la campagne cote Django. */
  id: string;
  /** Intitule visible. « un groupage », jamais « une campagne » (§3). */
  produit: string;
  /** Ce que contient une part — la premiere question de tout acheteur. */
  contenuPart: string;
  /** Description longue, repliee au-dela de 4 lignes sur l'ecran 3. */
  description: string;
  caracteristiques: Caracteristique[];
  /** Prix d'une part, en francs CFA. Les frais de livraison sont a part. */
  prixPart: number;
  /** Acheteurs ayant deja paye leur part. Pas de plafond, pas de minimum. */
  acheteursConfirmes: number;
  /** Pseudonyme du groupeur (§1.7). */
  groupeur: string;
  categorie: Categorie;
  /**
   * Heures avant la cloture. Fixe plutot que calcule depuis l'horloge : la
   * demo doit afficher « RESTE 2 JOURS » sur C1 quel que soit le jour ou on la
   * montre.
   */
  heuresRestantes: number;
  /** Date de cloture affichee en toutes lettres sur l'ecran 3. */
  clotureLe: string;
  /** Nombre de questions publiques posees (ecran 10). */
  questions: number;
  /**
   * Les deux questions les plus recentes, affichees sur l'ecran 3.
   *
   * Elles sont **publiques** : il n'y a pas de messagerie privee dans cette
   * application, et toute question passe par un filtre avant publication.
   * L'auteur n'apparait que comme « Acheteur verifie » — jamais un nom (§1.7).
   */
  questionsRecentes?: { question: string; reponse: string }[];
  variante?: VarianteProduit;
  /** Quartier de remise. Un quartier n'identifie personne (§1.7). */
  quartier: Quartier;
  /** Repere public du point de remise. Jamais une adresse d'acheteur. */
  pointRemise: string;
  /** Date de remise prevue, au format ISO. */
  remiseLe: string;
  /**
   * Photo du produit.
   *
   * Ce sont des photos de banque d'images (Pexels), choisies faute de
   * `medias/` (§1.8) et **approchantes, pas exactes** : le bidon d'huile de
   * palme est une huile de cuisine, le carton de lait est un verre de lait.
   * Elles tiennent pour une demonstration, pas pour une mise en ligne — un
   * acheteur qui recoit autre chose que la photo a raison de se plaindre.
   * A remplacer par les photos reelles des groupeurs.
   */
  photo?: string;
  /** Texte alternatif : ce que la photo montre vraiment. */
  photoAlt?: string;
}

/** Les six quartiers du jeu de demonstration (§3), dans l'ordre de la spec. */
export const QUARTIERS: readonly Quartier[] = [
  "Agoe",
  "Be",
  "Tokoin",
  "Adidogome",
  "Nyekonakpoe",
  "Hedzranawoe",
];

export const LIBELLE_QUARTIER: Record<Quartier, string> = {
  Agoe: "Agoè",
  Be: "Bè",
  Tokoin: "Tokoin",
  Adidogome: "Adidogomé",
  Nyekonakpoe: "Nyékonakpoè",
  Hedzranawoe: "Hédzranawoé",
};

/** Les six categories de l'ecran 2, point 2, dans l'ordre de la spec. */
export const CATEGORIES: readonly Categorie[] = [
  "alimentaire",
  "vetements",
  "chaussures",
  "hygiene",
  "maison",
  "electronique",
];

export const LIBELLE_CATEGORIE: Record<Categorie, string> = {
  alimentaire: "Alimentaire",
  vetements: "Vêtements",
  chaussures: "Chaussures",
  hygiene: "Hygiène",
  maison: "Maison",
  electronique: "Électronique",
};
