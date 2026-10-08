import { createContext, type ReactNode, useContext } from "react";
import { listerLesGroupages } from "./campagnes";
import type { ErreurApi } from "./client";
import { useRequete } from "./useRequete";
import type { Groupage } from "../domaine/groupage";

/**
 * Le catalogue, charge **une fois** et partage par tous les ecrans acheteur.
 *
 * ## Pourquoi un contexte et pas des props
 *
 * Six ecrans lisent le catalogue — le fil, les groupages ouverts, la fiche
 * produit, le paiement, les demandes, la recherche — et ils ne sont pas
 * voisins dans l'arbre. Le faire descendre en props traverserait des
 * composants qui n'en ont aucun usage, et chaque nouvel ecran demanderait de
 * rallonger la chaine.
 *
 * ## Pourquoi un seul chargement, et pas un par ecran
 *
 * La raison est economique : **le §5 du cahier des charges part d'un forfait
 * de donnees limite**. Charger le catalogue a chaque navigation reviendrait a
 * le retelecharger six fois pour un parcours ordinaire — ouvrir le fil,
 * filtrer, ouvrir un produit, revenir, en ouvrir un autre, payer. Ici il
 * arrive une fois et sert partout.
 *
 * ⚠️ **Il n'est pas rafraichi tout seul.** Les compteurs d'acheteurs confirmes
 * et le temps restant vieillissent donc pendant la session. C'est acceptable,
 * et meme preferable a un rafraichissement periodique qui consommerait des
 * donnees en continu sans que personne ne l'ait demande. Le moment ou la
 * fraicheur compte vraiment est **le paiement**, et la le serveur recalcule
 * tout : une campagne cloturee entre-temps fait echouer l'appel avec un
 * message clair, plutot que d'encaisser sur un groupage ferme.
 */
interface Catalogue {
  groupages: readonly Groupage[];
  chargement: boolean;
  erreur: ErreurApi | undefined;
  recharger: () => void;
}

const ContexteCatalogue = createContext<Catalogue | undefined>(undefined);

export function FournisseurCatalogue({ children }: { children: ReactNode }) {
  const requete = useRequete((signal) => listerLesGroupages(signal), []);

  return (
    <ContexteCatalogue.Provider
      value={{
        /* `?? []` plutot que `undefined` : les ecrans lisent une liste, et une
           liste vide pendant le chargement leur evite a tous un test
           supplementaire. C'est `chargement` qui dit s'il faut dessiner
           l'attente. */
        groupages: requete.donnees ?? [],
        chargement: requete.chargement,
        erreur: requete.erreur,
        recharger: requete.recharger,
      }}
    >
      {children}
    </ContexteCatalogue.Provider>
  );
}

/**
 * Le catalogue, pour un ecran acheteur.
 *
 * Leve si le fournisseur manque, plutot que de renvoyer une liste vide : un
 * catalogue vide ressemble a un chargement en cours, et on chercherait
 * longtemps avant de penser a un oubli de `FournisseurCatalogue`.
 */
export function useCatalogue(): Catalogue {
  const catalogue = useContext(ContexteCatalogue);
  if (catalogue === undefined) {
    throw new Error(
      "useCatalogue hors de FournisseurCatalogue : l'écran doit être monté " +
        "dans ApplicationAcheteur.",
    );
  }
  return catalogue;
}
