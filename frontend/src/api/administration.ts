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
  versement_etat: string | null;
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

// ── Les virements ──────────────────────────────────────────────────────────

export interface VersementAdmin {
  id: number;
  campagne: number;
  campagne_titre: string;
  /** Le pseudonyme, celui que les acheteurs voient. */
  groupeur: string;
  /** Son nom reel. **On ne vire pas de l'argent a un pseudonyme.** */
  groupeur_nom: string;
  groupeur_mobile_money: string;
  collecte: string;
  commission: string;
  verse: string;
  frais_livraison_collectes: string;
  etat: "en-attente" | "effectue" | "annule";
  libere_le: string | null;
  libere_par: string;
  effectue_le: string;
  /** Le devis fournisseur. `null` tant que le groupeur ne l'a pas depose. */
  devis: {
    id: number;
    nature: string;
    fournisseur: string;
    montant: string;
    etat: string;
    depose_le: string;
  } | null;
  /** ⚠️ Faux sans devis : le §10.3 l'interdit. */
  liberable: boolean;
  jours_d_attente: number;
}

export function listerLesVersements(
  jetonAdmin: string,
  etat: string | undefined,
  signal?: AbortSignal,
): Promise<VersementAdmin[]> {
  return appeler("/administration/versements/", {
    parametres: { etat },
    jetonAdmin,
    signal,
  });
}

/**
 * Fait partir l'argent vers le groupeur.
 *
 * ⚠️ **Le serveur refuse sans devis** (§10.3) : c'est le dernier moment ou un
 * controle sert encore a quelque chose. Apres, il n'y a plus de levier sur le
 * groupeur — ni caution, ni solde retenu.
 *
 * ⚠️ **Aucun virement reel n'est emis** : le paiement est simule jusqu'a
 * l'agrement d'un agregateur (§18.2). L'appel note que l'argent doit partir,
 * et qui l'a decide.
 */
export function libererLeVersement(
  jetonAdmin: string,
  id: number,
  decidePar: string,
  signal?: AbortSignal,
): Promise<VersementAdmin> {
  return appeler(`/administration/${id}/liberer/`, {
    methode: "POST",
    corps: { decide_par: decidePar },
    jetonAdmin,
    signal,
  });
}
