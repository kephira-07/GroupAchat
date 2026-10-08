import { useCallback, useEffect, useState } from "react";
import { ErreurApi } from "./client";

/**
 * Charger des donnees, avec les trois etats qu'un ecran doit savoir dessiner.
 *
 * ## Les trois etats, et pourquoi aucun n'est facultatif
 *
 * Les constantes TypeScript que ce hook remplace n'avaient qu'un seul etat :
 * presentes. Une API en a trois, et **oublier les deux autres est la facon la
 * plus courante de rendre une application penible** :
 *
 * | Etat | Ce que l'ecran doit montrer |
 * |---|---|
 * | **chargement** | Une attente *qui a la forme du contenu*, pas un tourniquet centre |
 * | **erreur** | Ce qui s'est passe, et un bouton pour reessayer |
 * | **donnees** | Le contenu |
 *
 * Le premier compte particulierement ici : le §5 du cahier des charges part
 * d'une connexion irreguliere a Lome. Une liste qui met trois secondes a
 * arriver est l'ordinaire, et pendant ces trois secondes l'ecran doit avoir
 * l'air de se remplir, pas d'etre casse.
 *
 * ## Ce qu'il fait contre les requetes qui se croisent
 *
 * Il **annule la requete precedente** quand les dependances changent. Sans
 * cela, taper « riz » dans la recherche lance quatre requetes (`r`, `ri`,
 * `riz`), et **rien ne garantit qu'elles reviennent dans l'ordre** : la
 * reponse de `ri` peut arriver apres celle de `riz` et ecraser le bon
 * resultat. C'est un defaut qui ne se voit jamais en local, ou tout repond en
 * deux millisecondes, et systematiquement sur un reseau mobile.
 */
export interface Requete<T> {
  donnees: T | undefined;
  chargement: boolean;
  erreur: ErreurApi | undefined;
  /** Relance l'appel — c'est ce que branche le bouton « Réessayer ». */
  recharger: () => void;
}

export function useRequete<T>(
  /**
   * L'appel a executer. Il recoit un `AbortSignal` **qu'il doit transmettre**
   * a `appeler`, sans quoi l'annulation ne sert a rien.
   */
  executer: (signal: AbortSignal) => Promise<T>,
  /**
   * Les valeurs dont depend l'appel : un changement le relance.
   *
   * ⚠️ Elles sont comparees par leur **representation JSON**, et non par
   * identite. C'est volontaire : la plupart des appels dependent d'un objet de
   * filtres reconstruit a chaque rendu, qui relancerait une requete en boucle
   * si on comparait les references.
   */
  dependances: unknown[],
  /** `false` suspend l'appel — pour un detail dont l'identifiant manque encore. */
  actif = true,
): Requete<T> {
  const [donnees, setDonnees] = useState<T>();
  const [chargement, setChargement] = useState(actif);
  const [erreur, setErreur] = useState<ErreurApi>();
  const [essai, setEssai] = useState(0);

  const cle = JSON.stringify(dependances);

  const recharger = useCallback(() => setEssai((n) => n + 1), []);

  useEffect(() => {
    if (!actif) {
      setChargement(false);
      return;
    }

    const controleur = new AbortController();
    let abandonne = false;

    setChargement(true);
    setErreur(undefined);

    executer(controleur.signal)
      .then((resultat) => {
        if (!abandonne) {
          setDonnees(resultat);
          setChargement(false);
        }
      })
      .catch((cause) => {
        /* Une annulation n'est pas une panne : elle arrive a chaque frappe
           dans la recherche. L'afficher ferait clignoter un message d'erreur
           pendant qu'on tape. */
        if (cause instanceof DOMException && cause.name === "AbortError") {
          return;
        }
        if (!abandonne) {
          setErreur(
            cause instanceof ErreurApi
              ? cause
              : new ErreurApi("Une erreur inattendue est survenue.", -1),
          );
          setChargement(false);
        }
      });

    return () => {
      abandonne = true;
      controleur.abort();
    };
    /* `executer` est volontairement hors des dependances : il est redefini a
       chaque rendu par l'appelant, et l'y mettre relancerait la requete en
       boucle. Ce sont `cle` et `essai` qui decident quand rappeler. */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cle, essai, actif]);

  return { donnees, chargement, erreur, recharger };
}

/**
 * Executer une action qui **modifie** quelque chose : payer, deposer, trancher.
 *
 * Separe de `useRequete` parce que les deux n'ont rien a voir :
 *
 * - une lecture part **toute seule** a l'affichage ; une action part sur un
 *   geste, et jamais autrement ;
 * - une lecture ratee se reessaie sans risque ; **une action ratee, non** —
 *   reessayer un paiement peut le doubler. C'est l'ecran qui decide, et c'est
 *   pourquoi ce hook n'a pas de `recharger` ;
 * - une action rend des **erreurs de champ** a accrocher sous les cases du
 *   formulaire, ce dont une lecture n'a pas l'usage.
 */
export interface Action<Entree, Sortie> {
  executer: (entree: Entree) => Promise<Sortie | undefined>;
  enCours: boolean;
  erreur: ErreurApi | undefined;
  /** Efface l'erreur — a appeler quand l'utilisateur corrige sa saisie. */
  oublierLErreur: () => void;
}

export function useAction<Entree, Sortie>(
  executerLAppel: (entree: Entree) => Promise<Sortie>,
): Action<Entree, Sortie> {
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<ErreurApi>();

  const executer = useCallback(
    async (entree: Entree) => {
      /* ⚠️ Garde contre le double appui, et elle n'est pas decorative : sur un
         reseau lent, appuyer deux fois sur « Payer » est le geste naturel. La
         cle d'idempotence protege le serveur ; cette garde evite surtout
         d'afficher deux fois le resultat. */
      if (enCours) {
        return undefined;
      }
      setEnCours(true);
      setErreur(undefined);
      try {
        return await executerLAppel(entree);
      } catch (cause) {
        setErreur(
          cause instanceof ErreurApi
            ? cause
            : new ErreurApi("Une erreur inattendue est survenue.", -1),
        );
        return undefined;
      } finally {
        setEnCours(false);
      }
    },
    [executerLAppel, enCours],
  );

  return {
    executer,
    enCours,
    erreur,
    oublierLErreur: useCallback(() => setErreur(undefined), []),
  };
}
