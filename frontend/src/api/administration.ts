import { appeler } from "./client";

/**
 * Ce que l'administration interroge. **Derriere le jeton d'administration.**
 *
 * ⚠️ Ces routes voient **tout** : les montants detenus, les noms reels des
 * groupeurs, leurs numeros Mobile Money, les groupages echoues. C'est le
 * contraire exact de `campagnes.ts`, qui ne laisse sortir qu'un pseudonyme.
 * Les deux fichiers sont separes pour qu'on ne confonde jamais l'un avec
 * l'autre — voir `api_admin.py` cote serveur, qui applique la meme separation.
 */

// ── Le tableau de bord ─────────────────────────────────────────────────────

export interface FileAdmin {
  id: string;
  libelle: string;
  nombre: number;
  detail: string;
  /** ⚠️ `true` quand **notre propre tresorerie** est engagee. */
  argent_expose: boolean;
  plus_ancien_jours: number;
}

export interface IndicateurAdmin {
  id: string;
  libelle: string;
  valeur: number;
  unite: string;
  detail: string;
  ton: "neutre" | "attention" | "succes";
}

export interface AlerteAdmin {
  id: string;
  gravite: "danger" | "attention";
  texte: string;
  /** L'ecran vers lequel l'alerte mene. */
  destination: string;
}

export interface TableauDeBordAdmin {
  files: FileAdmin[];
  indicateurs: IndicateurAdmin[];
  alertes: AlerteAdmin[];
  /** Quatorze jours, **jours vides compris** : sinon la courbe ment sur le rythme. */
  serie_collecte: { jour: string; montant: number }[];
  repartition_statuts: { statut: string; libelle: string; nombre: number }[];
  activite: { date: string; texte: string }[];
}

export function lireLeTableauDeBordAdmin(
  jetonAdmin: string,
  signal?: AbortSignal,
): Promise<TableauDeBordAdmin> {
  return appeler("/administration/tableau-de-bord/", { jetonAdmin, signal });
}

// ── Les groupages ──────────────────────────────────────────────────────────

export interface GroupageAdmin {
  id: number;
  titre: string;
  categorie: string;
  prix_part: string;
  statut: string;
  groupeur: string;
  acheteurs_confirmes: number;
  collecte: string;
  heures_restantes: number;
  date_fin: string;
  cree_le: string;
  /** `null` quand la campagne n'a pas encore ete cloturee. */
  retrait_etat: string | null;
  /**
   * Les degats d'un groupage **annule** : combien de gens rembourses, pour
   * combien. `null` pour tous les autres etats.
   *
   * ⚠️ Sans ce champ, un groupage annule affiche « 0 acheteur, 0 F » — exact,
   * puisque les commandes sont passees a « remboursee », et parfaitement
   * inutile a qui regarde precisement les echecs.
   */
  rembourses: { acheteurs: number; montant: number } | null;
}

export function listerLesGroupages(
  jetonAdmin: string,
  statut: string | undefined,
  signal?: AbortSignal,
): Promise<GroupageAdmin[]> {
  return appeler("/administration/groupages/", {
    parametres: { statut },
    jetonAdmin,
    signal,
  });
}

// ── Les retraits ───────────────────────────────────────────────────────────

export interface RetraitAdmin {
  id: number;
  campagne: number;
  campagne_titre: string;
  /** Le pseudonyme, celui que les acheteurs voient. */
  groupeur: string;
  /** Son nom reel. **On ne vire pas de l'argent a un pseudonyme.** */
  groupeur_nom: string;
  groupeur_mobile_money: string;
  collecte: string;
  /** 1 500 F par groupage abouti. **Un montant fixe, pas un taux** (§9.2). */
  frais_plateforme: string;
  net: string;
  frais_livraison_collectes: string;
  etat: "retirable" | "demande" | "effectue" | "annule";
  /** Quand le groupeur a appuye sur « Retirer mes fonds ». */
  demande_le: string | null;
  libere_le: string | null;
  libere_par: string;
  effectue_le: string;
  /**
   * Le devis fournisseur. `null` tant que le groupeur ne l'a pas depose.
   *
   * ⚠️ **Il n'autorise rien.** Il est la pour etre lu : chez qui il achete, et
   * pour combien. Le retrait part meme sans lui (§10.2).
   */
  devis: {
    id: number;
    nature: string;
    fournisseur: string;
    montant: string;
    etat: string;
    depose_le: string;
  } | null;
  /** Vrai seulement si le groupeur a demande son retrait. */
  executable: boolean;
  /** Depuis combien de jours il attend **sa demande**, pas la cloture. */
  jours_d_attente: number;
}

export function listerLesRetraits(
  jetonAdmin: string,
  etat: string | undefined,
  signal?: AbortSignal,
): Promise<RetraitAdmin[]> {
  return appeler("/administration/retraits/", {
    parametres: { etat },
    jetonAdmin,
    signal,
  });
}

/**
 * Fait partir l'argent que le groupeur a demande.
 *
 * ⚠️ **Le serveur refuse ce qu'il n'a pas demande**, et rien d'autre. Le devis
 * fournisseur n'entre plus dans ce controle : son solde est a lui depuis le
 * paiement de ses acheteurs, et le §9.1 du cahier des charges assume cette
 * perte de levier au lieu de la masquer derriere un refus indefendable.
 *
 * ⚠️ **Aucun virement reel n'est emis** : le paiement est simule jusqu'a
 * l'agrement d'un agregateur (§18.2). L'appel note que l'argent doit partir,
 * et qui l'a execute.
 */
export function executerLeRetrait(
  jetonAdmin: string,
  id: number,
  decidePar: string,
  signal?: AbortSignal,
): Promise<RetraitAdmin> {
  return appeler(`/administration/${id}/executer/`, {
    methode: "POST",
    corps: { decide_par: decidePar },
    jetonAdmin,
    signal,
  });
}
