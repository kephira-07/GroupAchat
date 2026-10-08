import { createContext, type ReactNode, useContext } from "react";
import {
  lireLePortefeuille,
  lireLeTableauDeBord,
  listerLesDemandes,
  listerMesCampagnes,
  listerLesQuestionsRecues,
  type QuestionRecueApi,
  type TableauDeBordApi,
} from "./espaceGroupeur";
import type { ErreurApi } from "./client";
import { useRequete } from "./useRequete";
import type { Campagne, DemandeAgregee, MouvementPortefeuille } from "../domaine/groupeur";

/**
 * Les donnees du groupeur, chargees une fois et partagees par ses ecrans.
 *
 * Meme raisonnement que `CatalogueContexte` du cote acheteur : le groupeur
 * passe du tableau de bord au portefeuille, aux demandes et retour, et
 * retelecharger a chaque navigation couterait des donnees sur le forfait
 * limite du §5.
 *
 * ## Cinq requetes, et pourquoi pas une seule
 *
 * On aurait pu tout servir en une route. On ne l'a pas fait, pour deux
 * raisons :
 *
 * - **chaque ecran s'affiche des que *sa* donnee est la.** Une route unique
 *   ferait attendre le tableau de bord que le portefeuille soit calcule ;
 * - **l'ecran 13 se recharge souvent, le portefeuille rarement.** Les separer
 *   permet de ne recharger que ce qui bouge — un `recharger()` apres une
 *   cloture n'a pas a redemander les demandes de la semaine.
 *
 * Elles partent **en parallele** : `useRequete` est appele cinq fois, et React
 * lance les cinq effets dans le meme rendu. Ce n'est pas cinq attentes l'une
 * apres l'autre.
 *
 * ⚠️ **Tout est suspendu tant que le numero est vide.** Un groupeur qui n'a
 * pas depose de dossier n'a rien a demander au serveur, et cinq requetes qui
 * reviendraient en 404 rempliraient sa console d'erreurs sans rien lui
 * apprendre.
 */
interface EspaceGroupeur {
  telephone: string;
  tableauDeBord: TableauDeBordApi | undefined;
  campagnes: readonly Campagne[];
  portefeuille: { disponible: number; mouvements: MouvementPortefeuille[] } | undefined;
  demandes: readonly DemandeAgregee[];
  questions: readonly QuestionRecueApi[];
  chargement: boolean;
  erreur: ErreurApi | undefined;
  /** Relance **tout**. Employe apres une action qui change plusieurs ecrans. */
  recharger: () => void;
}

const Contexte = createContext<EspaceGroupeur | undefined>(undefined);

export function FournisseurEspaceGroupeur({
  telephone,
  children,
}: {
  telephone: string;
  children: ReactNode;
}) {
  const actif = telephone !== "";

  const tableau = useRequete(
    (signal) => lireLeTableauDeBord(telephone, signal),
    [telephone],
    actif,
  );
  const campagnes = useRequete(
    (signal) => listerMesCampagnes(telephone, signal),
    [telephone],
    actif,
  );
  const portefeuille = useRequete(
    (signal) => lireLePortefeuille(telephone, signal),
    [telephone],
    actif,
  );
  const demandes = useRequete(
    (signal) => listerLesDemandes(telephone, signal),
    [telephone],
    actif,
  );
  const questions = useRequete(
    (signal) => listerLesQuestionsRecues(telephone, signal),
    [telephone],
    actif,
  );

  const recharger = () => {
    tableau.recharger();
    campagnes.recharger();
    portefeuille.recharger();
    demandes.recharger();
    questions.recharger();
  };

  return (
    <Contexte.Provider
      value={{
        telephone,
        tableauDeBord: tableau.donnees,
        campagnes: campagnes.donnees ?? [],
        portefeuille: portefeuille.donnees,
        demandes: demandes.donnees ?? [],
        questions: questions.donnees ?? [],
        /* « En chargement » tant que **l'essentiel** manque. Les demandes et
           les questions arrivant plus tard ne doivent pas garder tout l'ecran
           en attente : leurs sections ont leur propre etat vide. */
        chargement: tableau.chargement || campagnes.chargement,
        /* La premiere erreur rencontree. Les afficher toutes empilerait cinq
           bandeaux disant la meme coupure de reseau. */
        erreur:
          tableau.erreur ??
          campagnes.erreur ??
          portefeuille.erreur ??
          demandes.erreur ??
          questions.erreur,
        recharger,
      }}
    >
      {children}
    </Contexte.Provider>
  );
}

export function useEspaceGroupeur(): EspaceGroupeur {
  const espace = useContext(Contexte);
  if (espace === undefined) {
    throw new Error(
      "useEspaceGroupeur hors de FournisseurEspaceGroupeur : l'écran doit " +
        "être monté dans ApplicationGroupeur.",
    );
  }
  return espace;
}
