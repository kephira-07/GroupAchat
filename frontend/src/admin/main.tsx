import { StrictMode, useCallback, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import "../index.css";
import { lireLeTableauDeBordAdmin } from "../api/administration";
import { useRequete } from "../api/useRequete";
import { lireLeJeton, oublierLeJeton, retenirLeJeton } from "./jeton";
import Sidebar, { type EcranAdmin } from "./mise-en-page/Sidebar";
import DemandeJeton from "./pages/DemandeJeton";
import DossiersKyc from "./pages/DossiersKyc";
import Groupages from "./pages/Groupages";
import TableauDeBordAdmin from "./pages/TableauDeBordAdmin";
import Retraits from "./pages/Retraits";

/**
 * Le point d'entree de l'administration — **une application a part.**
 *
 * ## Pourquoi un autre port, et pas un quatrieme role dans `App.tsx`
 *
 * L'administration etait a l'origine un role du selecteur de demonstration, a
 * cote de l'acheteur et du groupeur. C'etait commode et faux sur le fond :
 * **personne ne passe d'acheteur a administrateur.** Les deux publics du
 * produit entrent par la meme porte et peuvent changer d'avis — un acheteur
 * devient groupeur — tandis que l'administrateur est un employe de Group
 * Achat, dont l'outil n'a aucune raison d'etre servi par le meme programme que
 * la boutique.
 *
 * Les separer a trois consequences concretes :
 *
 * - **le code d'administration ne part pas dans le paquet du public.** Les
 *   deux constructions sont independantes (`dist/` et `dist-admin/`) : les
 *   montants detenus, les files de travail et les libelles d'alertes ne sont
 *   plus telecharges par chaque acheteur de Lome, sur un forfait limite ;
 * - **on peut fermer l'administration au reseau** sans toucher a la boutique.
 *   Deux ports, c'est deux regles de pare-feu possibles ;
 * - **plus de chemin, meme de demonstration, entre la boutique et l'outil
 *   interne.**
 *
 * ## Les ecrans
 *
 * | | Ecran | Fichier |
 * |---|---|---|
 * | A1 | Tableau de bord | `pages/TableauDeBordAdmin` |
 * | A2 | Dossiers KYC | `pages/DossiersKyc` |
 * | A3 | Retraits des groupeurs | `pages/Retraits` |
 * | A4 | Groupages, tous etats | `pages/Groupages` |
 *
 * ⚠️ **Le port different n'est pas une mesure de securite.** Il n'authentifie
 * personne. Ce qui ferme ces ecrans est le jeton demande a l'entree, et ce
 * jeton lui-meme ne distingue pas deux administrateurs — voir `jeton.ts`.
 */

/**
 * Le routeur — quatre ecrans derriere une barre laterale.
 *
 * Un `useState` suffit : l'outil interne n'a pas d'adresse profonde, et il ne
 * doit pas en avoir. Pouvoir envoyer par message le lien d'un dossier serait
 * une mauvaise idee — ces adresses porteraient un identifiant de personne.
 *
 * ## Le jeton est demande une fois, a l'entree
 *
 * ⚠️ **Il ne l'etait auparavant qu'a l'ouverture de l'ecran A2**, et c'etait
 * defendable tant que le tableau de bord lisait des constantes locales : il
 * n'affichait alors que des compteurs, aucune donnee personnelle. Ce n'est
 * plus vrai — il interroge `/api/administration/`, qui voit les montants
 * detenus, les groupeurs et leurs numeros Mobile Money.
 *
 * La porte est donc remontee a l'entree. Mieux vaut une serrure la ou commence
 * ce qu'elle protege.
 */
function Administration() {
  const [ecran, setEcran] = useState<EcranAdmin>("tableau-de-bord");
  const [jeton, setJeton] = useState(lireLeJeton);
  const [jetonRefuse, setJetonRefuse] = useState(false);

  const poserLeJeton = (nouveau: string) => {
    retenirLeJeton(nouveau);
    setJeton(nouveau);
    setJetonRefuse(false);
  };

  /* `useCallback` : cette fonction part en dependance d'effets dans les
     ecrans, et une nouvelle reference a chaque rendu les relancerait en
     boucle. */
  const refuserLeJeton = useCallback(() => {
    oublierLeJeton();
    setJeton("");
    setJetonRefuse(true);
  }, []);

  /**
   * Les compteurs de la barre laterale.
   *
   * Charges ici plutot que dans chaque ecran : la barre les affiche en
   * permanence, et c'est tout son interet — l'administrateur sait ou il a du
   * travail **sans ouvrir les ecrans**.
   *
   * ⚠️ Cela fait une seconde requete au tableau de bord quand c'est lui qui
   * est affiche. C'est assume : le partager demanderait un contexte, pour un
   * gain d'une requete sur un ecran interne consulte depuis un bureau — pas
   * depuis le forfait mobile que le §5 cherche a menager.
   */
  const bord = useRequete(
    (signal) => lireLeTableauDeBordAdmin(jeton, signal),
    [jeton],
    jeton !== "",
  );

  const [compteurs, setCompteurs] = useState<
    Partial<Record<EcranAdmin, { nombre: number; urgent?: boolean }>>
  >({});

  useEffect(() => {
    const donnees = bord.donnees;
    if (!donnees) {
      return;
    }
    const file = (id: string) =>
      donnees.files.find((entree) => entree.id === id)?.nombre ?? 0;

    setCompteurs({
      /* `urgent` sur les retraits seulement : c'est la seule file ou
         quelqu'un attend son argent pour pouvoir travailler. */
      retraits: {
        nombre: file("retraits"),
        urgent: file("retraits") > 0,
      },
      dossiers: { nombre: file("kyc") },
    });
  }, [bord.donnees]);

  if (!jeton) {
    return (
      <DemandeJeton
        onJeton={poserLeJeton}
        erreur={
          jetonRefuse
            ? "Le serveur a refusé ce jeton. Vérifiez JETON_ADMIN dans le .env."
            : undefined
        }
      />
    );
  }

  return (
    <Sidebar actif={ecran} compteurs={compteurs} onNaviguer={setEcran}>
      {ecran === "tableau-de-bord" ? (
        <TableauDeBordAdmin
          jeton={jeton}
          onNaviguer={setEcran}
          onJetonRefuse={refuserLeJeton}
        />
      ) : null}
      {ecran === "retraits" ? (
        <Retraits jeton={jeton} onJetonRefuse={refuserLeJeton} />
      ) : null}
      {ecran === "groupages" ? (
        <Groupages jeton={jeton} onJetonRefuse={refuserLeJeton} />
      ) : null}
      {ecran === "dossiers" ? (
        <DossiersKyc
          jeton={jeton}
          onRetour={() => setEcran("tableau-de-bord")}
          onJetonRefuse={refuserLeJeton}
        />
      ) : null}
    </Sidebar>
  );
}

const racine = document.getElementById("root");
if (!racine) {
  throw new Error("Element #root introuvable dans admin.html");
}

createRoot(racine).render(
  <StrictMode>
    <Administration />
  </StrictMode>,
);
