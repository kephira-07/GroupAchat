/**
 * La tournee du livreur — ecran 22.
 *
 * ⚠️ **C'est le seul endroit de tout le produit ou l'identite d'un acheteur
 * est visible** : nom, adresse, telephone. Et uniquement le jour de sa
 * livraison, depuis un lien qui ne couvre que la tournee du jour et qui expire
 * le soir.
 *
 * Ce n'est donc pas un ecran de l'application : c'est une **page web** que le
 * livreur ouvre depuis un lien recu, sans rien installer et sans compte — il
 * est un prestataire partenaire, pas un utilisateur de Group Achat (§6 du
 * cahier des charges).
 *
 * **Le montant paye n'y figure jamais.** Le livreur n'a pas a le connaitre, et
 * l'afficher creerait une tentation inutile. Le type n'a donc aucun champ pour
 * le porter.
 *
 * La preuve de livraison ne conditionne **aucun versement** — le groupeur a
 * deja ete paye a la cloture (§10.1). Elle construit son historique de
 * fiabilite, qui determine son plafond d'exposition. C'est le seul levier qui
 * nous reste sur lui, et c'est ce qui justifie cet ecran.
 */

export type EtatLivraison =
  | "a-livrer"
  | "livree"
  | "livree-sans-code"
  | "refusee";

export interface Livraison {
  id: string;
  /** Prenom et initiale, comme partout ailleurs. */
  nom: string;
  /** Quartier, rue et repere. A Lome le repere vaut plus que la coordonnee. */
  adresse: string;
  /** Visible ici et nulle part ailleurs. */
  telephone: string;
  contenu: string;
  /** Le code que l'acheteur presente. Six caracteres, deux groupes de trois. */
  codeLivraison: string;
  etat: EtatLivraison;
  /** Heure de validation, une fois livree. */
  heure?: string;
}

/** Les motifs de refus. Une liste fermee : une file de litiges doit rester exploitable. */
export const MOTIFS_REFUS: readonly string[] = [
  "Ce n'est pas le produit commandé",
  "Colis abîmé",
  "Client absent",
  "Adresse introuvable",
];

/** Compare deux codes sans tenir compte de la casse ni des tirets. */
export function memeCode(saisi: string, attendu: string): boolean {
  const nettoyer = (code: string) =>
    code.toUpperCase().replace(/[^A-Z0-9]/g, "");
  return nettoyer(saisi) === nettoyer(attendu);
}
