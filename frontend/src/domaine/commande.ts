import type { Groupage, Quartier } from "./groupage";

/**
 * Le modele d'une commande, de la position de livraison et des statuts.
 *
 * Les noms suivent le §6 du PRD. **Trois champs y sont signales comme a ne pas
 * oublier**, et ils sont tous les trois ici :
 *
 * - `fraisLivraison` est **separe** de `montantParts`. La part est la meme pour
 *   tous, les frais dependent de la position ; les fondre interdirait a
 *   l'acheteur de verifier qu'on ne lui a rien glisse dans le total ;
 * - `position` est **conservee sur la commande**, parce que c'est elle qui a
 *   determine les frais et que le livreur en aura besoin le jour de la tournee ;
 * - `cleIdempotence` protege le paiement. Sans elle, un acheteur qui touche
 *   deux fois « Confirmer » sur un reseau lent paie deux fois.
 *
 * **Regle d'anonymat (§1.7)** : la position precise ne remonte **jamais** au
 * groupeur. Lui ne voit qu'un code et un quartier (ecran 15). Les identites ne
 * sortent qu'une fois, vers le livreur, le jour de la livraison (ecran 22).
 */

export interface Position {
  /** Comment la position a ete obtenue — les deux chemins sont normaux. */
  source: "gps" | "lieu";
  quartier: Quartier;
  /** Repere en texte libre. Obligatoire, meme avec le GPS. */
  repere: string;
}

/**
 * Les statuts d'une commande — §2.8 de la spec des ecrans.
 *
 * La couleur se lit sans lire : bleu, Group Achat tient l'argent ; orange, ca
 * avance ; vert, c'est fait ; rouge, il y a un probleme ; gris, c'est clos.
 */
export type StatutCommande =
  | "payee"
  | "cloturee"
  | "chez-le-groupeur"
  | "en-livraison"
  | "livree"
  | "litige"
  | "remboursee"
  | "annulee";

export const LIBELLE_STATUT: Record<StatutCommande, string> = {
  payee: "Payée — en attente de clôture",
  cloturee: "Groupage clôturé",
  "chez-le-groupeur": "Commande en cours chez le groupeur",
  "en-livraison": "En cours de livraison",
  livree: "Livrée",
  litige: "Litige",
  remboursee: "Remboursée",
  annulee: "Groupage annulé",
};

/** Les statuts qui comptent comme « en cours » dans l'onglet de l'ecran 8. */
export const STATUTS_EN_COURS: readonly StatutCommande[] = [
  "payee",
  "cloturee",
  "chez-le-groupeur",
  "en-livraison",
  "litige",
];

export function estEnCours(statut: StatutCommande): boolean {
  return STATUTS_EN_COURS.includes(statut);
}

export interface Commande {
  id: string;
  groupage: Groupage;
  quantite: number;
  variante?: string;
  position: Position;
  /** Numero a joindre a la livraison. */
  telephone: string;
  /** Prix des parts, hors livraison. */
  montantParts: number;
  /** Ligne distincte, jamais fondue dans la part. */
  fraisLivraison: number;
  /** `montantParts + fraisLivraison`. C'est ce que l'acheteur paie. */
  total: number;
  /** Code a montrer au livreur, et a lui seul. */
  codeLivraison: string;
  statut: StatutCommande;
  /** Date de la commande, au format ISO. */
  passeeLe: string;
  /**
   * Cle d'idempotence du paiement (§6 du PRD).
   *
   * Elle est generee **avant** l'appel de paiement, pas apres : c'est tout
   * l'interet. Deux appuis sur « Confirmer » portent la meme cle, et le serveur
   * n'encaisse qu'une fois.
   */
  cleIdempotence: string;
}

/** Une commande en cours de constitution, avant paiement. */
export type BrouillonCommande = Omit<
  Commande,
  "id" | "codeLivraison" | "statut" | "passeeLe"
>;

/** Identifiant court et lisible, du genre de ceux qu'on dicte au telephone. */
export function genererIdentifiant(prefixe: string): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const tirage = Array.from(
    { length: 6 },
    () => alphabet[Math.floor(Math.random() * alphabet.length)],
  ).join("");
  return `${prefixe}-${tirage}`;
}
