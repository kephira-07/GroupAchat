import type { Canal, EtatDossier, Issue, Motif } from "../domaine/recrutement";
import { appeler, type Page } from "./client";

/**
 * Les appels du recrutement — cote groupeur et cote administrateur.
 *
 * ## Les types sont ecrits a la main, et c'est un choix
 *
 * Ils decrivent **ce que les serialiseurs renvoient**, en `snake_case`, tel
 * quel. Aucune conversion automatique vers le `camelCase` du front : une telle
 * conversion rend les champs introuvables au `grep`, et c'est exactement ce
 * qu'on veut pouvoir faire quand on se demande d'ou sort une valeur. Les
 * ecrans traduisent explicitement, en un endroit visible.
 *
 * ⚠️ **Ces types ne sont pas verifies contre le serveur.** TypeScript ne
 * controle rien a l'execution : si un serialiseur change de forme, le front
 * compilera et cassera a l'affichage. Les deux garde-fous sont les tests
 * backend (`test_recrutement.py`, qui verifient champ par champ ce qui sort) et
 * `outils/verifier_recrutement.py`. Un champ ajoute ici sans etre ajoute
 * la-bas ne produira rien.
 */

/** Une piece deposee. `reference` est une cle de stockage, **pas une URL**. */
export interface PieceApi {
  nature:
    | "piece-recto"
    | "piece-verso"
    | "selfie"
    | "etal"
    | "justificatif";
  reference: string;
  depose_le: string;
}

export interface DecisionApi {
  id: number;
  issue: Issue;
  motif: Motif | "";
  libelle_motif: string;
  niveau_accorde: string;
  decide_par: string;
  decide_le: string;
  canal: Canal;
  /** `null` tant que le groupeur n'a pas reellement ete prevenu. */
  notifie_le: string | null;
}

/** Le dossier complet. **Derriere le jeton d'administration.** */
export interface DossierApi {
  id: number;
  pseudonyme: string;
  nom_complet: string;
  telephone: string;
  courriel: string;
  titulaire_mobile_money: string;
  numero_mobile_money: string;
  niveau: string;
  statut_kyc: EtatDossier;
  cree_le: string;
  pieces: PieceApi[];
  decisions_kyc: DecisionApi[];
  /** Le controle n° 2, recalcule par le serveur a chaque lecture. */
  concordance_noms: boolean;
  campagnes_livrees: number;
}

/** L'etat de son propre dossier, tel que le groupeur peut le lire. */
export interface MonDossierApi {
  id: number;
  pseudonyme: string;
  etat: EtatDossier;
  niveau: string;
  /** `null` au niveau Établi : il se fixe au cas par cas (§10.4). */
  plafond: number | null;
  peut_lancer_une_campagne: boolean;
  /** Le motif **public**, jamais la note interne de l'administrateur. */
  motif: string;
  decide_le: string | null;
}

/** La reponse a une decision : ce qui est parti, ou ce qu'il reste a faire. */
export interface ResultatDecision {
  decision: DecisionApi;
  annonce: boolean;
  canal?: Canal;
  /** Rempli pour un appel : le texte a lire au telephone. */
  script?: string;
  sujet?: string;
  corps?: string;
  /** Rempli quand l'annonce a echoue alors que la decision est enregistree. */
  probleme?: string;
  a_refaire?: string;
}

// ── Cote groupeur — sans jeton, c'est le formulaire public ──────────────────

export interface DepotDossier {
  pseudonyme: string;
  nom_complet: string;
  telephone: string;
  courriel: string;
  titulaire_mobile_money: string;
  numero_mobile_money: string;
  pieces: { nature: PieceApi["nature"]; reference: string }[];
}

/**
 * Depose un dossier **et le met en file d'attente**, en un appel.
 *
 * Les deux gestes sont indissociables cote serveur : un dossier cree mais non
 * soumis n'apparaitrait dans la file de personne, alors que son auteur croit
 * avoir termine.
 */
export function deposerUnDossier(
  depot: DepotDossier,
  signal?: AbortSignal,
): Promise<MonDossierApi> {
  return appeler("/groupeurs/", { methode: "POST", corps: depot, signal });
}

/** L'etat de son dossier, retrouve par son numero de telephone. */
export function lireMonDossier(
  telephone: string,
  signal?: AbortSignal,
): Promise<MonDossierApi> {
  return appeler("/groupeurs/dossier/", {
    parametres: { telephone },
    signal,
  });
}

// ── Cote administrateur — jeton obligatoire ────────────────────────────────

export function listerLesDossiers(
  jetonAdmin: string,
  etat: EtatDossier | undefined,
  signal?: AbortSignal,
): Promise<Page<DossierApi>> {
  return appeler("/dossiers/", {
    parametres: { etat },
    jetonAdmin,
    signal,
  });
}

export function trancherUnDossier(
  jetonAdmin: string,
  id: number,
  decision: {
    issue: Issue;
    motif?: Motif;
    canal: Canal;
    decide_par: string;
    niveau?: string;
  },
  signal?: AbortSignal,
): Promise<ResultatDecision> {
  return appeler(`/dossiers/${id}/decision/`, {
    methode: "POST",
    corps: decision,
    jetonAdmin,
    signal,
  });
}

/**
 * Acte que le groupeur a reellement ete prevenu.
 *
 * ⚠️ A n'appeler qu'apres avoir telephone. Rien ne le verifie, et c'est pour
 * cela que c'est un appel separe de la decision plutot qu'un drapeau dans son
 * corps : le journal est opposable (§18.3).
 */
export function acterLAnnonce(
  jetonAdmin: string,
  id: number,
  signal?: AbortSignal,
): Promise<DecisionApi> {
  return appeler(`/dossiers/${id}/annonce-faite/`, {
    methode: "POST",
    corps: {},
    jetonAdmin,
    signal,
  });
}
