import { LIBELLE_QUARTIER, type Quartier } from "./groupage";

/**
 * Frais de livraison — §11.1 du cahier des charges.
 *
 * **Le calcul reel n'existe pas encore : la fonction renvoie 1 000 F pour
 * toute position.** C'est volontaire et ecrit tel quel dans la spec. Ce qui
 * compte des aujourd'hui, c'est la forme du contrat :
 *
 * - les frais sont une **ligne distincte** du prix de la part, jamais fondus
 *   dedans — la part est la meme pour tous, les frais varient ;
 * - ils dependent de la **position**, qui est conservee sur la commande ;
 * - il n'y a que **deux reponses possibles** : un montant, ou « zone non
 *   desservie ». Pas de troisieme cas « tarif calcule plus tard » — on ne
 *   demande jamais a quelqu'un de payer un total qu'on completera apres
 *   (ecran 5, point 6).
 *
 * La position precise ne remonte **jamais** au groupeur (§1.7) : elle ne sort
 * qu'une fois, vers le livreur, le jour de la tournee (ecran 22).
 */

export interface Position {
  /** Comment la position a ete obtenue — les deux chemins sont normaux. */
  source: "gps" | "lieu";
  quartier: Quartier;
  /** Repere en texte libre. Obligatoire, meme avec le GPS. */
  repere: string;
}

export type ResultatFrais =
  | { desservi: true; montant: number; lieu: string }
  | { desservi: false; lieu: string };

/** Le tarif unique actuel. Une seule constante a changer le jour du vrai calcul. */
export const FRAIS_PROVISOIRES = 1000;

export function calculerFraisLivraison(position: Position): ResultatFrais {
  const lieu = LIBELLE_QUARTIER[position.quartier];
  return { desservi: true, montant: FRAIS_PROVISOIRES, lieu };
}

/**
 * Code de livraison de la commande.
 *
 * C1 renvoie `K7M-4PQ`, le code du fil rouge de la demonstration (§3) : c'est
 * celui que le jury retrouve sur la confirmation, le suivi, l'ecran du
 * groupeur et la tournee du livreur. Les autres groupages recoivent un code de
 * la meme forme, tire au sort. Cote Django, ce sera un champ genere a la
 * creation de la commande.
 */
export function genererCodeLivraison(idGroupage: string): string {
  if (idGroupage === "C1") {
    return "K7M-4PQ";
  }
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const tirer = (longueur: number) =>
    Array.from(
      { length: longueur },
      () => alphabet[Math.floor(Math.random() * alphabet.length)],
    ).join("");
  return `${tirer(3)}-${tirer(3)}`;
}
