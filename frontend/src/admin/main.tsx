import { StrictMode, useCallback, useState } from "react";
import { createRoot } from "react-dom/client";
import "../index.css";
import { lireLeJeton, oublierLeJeton, retenirLeJeton } from "./jeton";
import DemandeJeton from "./pages/DemandeJeton";
import DossiersKyc from "./pages/DossiersKyc";
import TableauDeBordAdmin from "./pages/TableauDeBordAdmin";

/**
 * Le point d'entree de l'administration — **une application a part.**
 *
 * ## Pourquoi un autre port, et pas un quatrieme role dans `App.tsx`
 *
 * L'administration etait jusqu'ici un role du selecteur de demonstration, a
 * cote de l'acheteur et du groupeur. C'etait commode pour montrer l'ecran A1,
 * et faux sur le fond : **personne ne passe d'acheteur a administrateur.** Les
 * deux publics du produit entrent par la meme porte et peuvent changer d'avis
 * (un acheteur devient groupeur) ; l'administrateur, lui, est un employe de
 * Group Achat, et son outil n'a aucune raison d'etre servi par le meme
 * programme que la boutique.
 *
 * Les separer a trois consequences concretes, et c'est pour elles qu'on le
 * fait :
 *
 * - **le code d'administration ne part pas dans le paquet du public.** Les
 *   deux constructions sont independantes (`dist/` et `dist-admin/`) : les
 *   compteurs de files de travail, les montants detenus et les libelles des
 *   alertes ne sont plus telecharges par chaque acheteur de Lome, sur un
 *   forfait de donnees limite ;
 * - **on peut fermer l'administration au reseau** sans toucher a la boutique.
 *   Deux ports, c'est deux regles de pare-feu possibles ; un seul port, c'est
 *   une seule ;
 * - **plus de role `admin` dans le selecteur de demonstration**, donc plus de
 *   chemin, meme de demonstration, entre la boutique et l'outil interne.
 *
 * ⚠️ **Ce n'est pas une mesure de securite.** Un port different n'authentifie
 * personne : cette page s'ouvre encore sans mot de passe, et elle le fera
 * jusqu'a ce que l'authentification soit branchee. Elle reduit la surface, elle
 * ne la protege pas. Le vrai controle d'acces est celui de l'admin Django
 * (§13.6), qui demande un compte.
 *
 * ## Les ecrans
 *
 * | | Ecran | Fichier |
 * |---|---|---|
 * | A1 | Tableau de bord | `pages/TableauDeBordAdmin` |
 * | A2 | Recrutement — dossiers KYC | `pages/DossiersKyc` |
 *
 * **A1 reste une vue d'ensemble ; A2 est un outil de travail.** La difference
 * se voit dans ce que chacun contient : A1 n'affiche aucune donnee
 * personnelle, rien que des compteurs et des montants, et il ne porte aucun
 * bouton qui deplace de l'argent. A2 affiche des noms, des numeros et des
 * references de pieces d'identite, parce qu'on ne peut pas examiner un dossier
 * sans les voir — et c'est pour cette raison qu'il est un ecran separe, auquel
 * on arrive par un geste explicite depuis la file d'attente.
 *
 * Le reste du travail — fiches, recherche, edition, remboursements — vit
 * toujours dans l'admin Django (§13.6), dont l'acces demande un compte.
 */

const racine = document.getElementById("root");
if (!racine) {
  throw new Error("Element #root introuvable dans admin.html");
}

/**
 * Le routeur de l'administration — deux ecrans, pas de bibliotheque.
 *
 * Un `useState` suffit a deux ecrans sans adresse profonde, et l'outil interne
 * n'a pas besoin qu'on puisse envoyer le lien d'un dossier par message : ce
 * serait meme une mauvaise idee, puisque ces adresses porteraient un
 * identifiant de personne.
 *
 * ## Le jeton n'est demande qu'au moment ou il sert
 *
 * L'ecran A1 ne demande rien : il n'affiche que des compteurs et des montants,
 * **aucune donnee personnelle**, et il lit aujourd'hui des constantes locales.
 * C'est A2 qui touche aux noms et aux pieces d'identite, donc c'est en
 * l'ouvrant qu'on demande le jeton.
 *
 * Faire l'inverse — demander le jeton a l'ouverture de l'application — aurait
 * l'air plus rigoureux et le serait moins : ca donnerait l'impression que tout
 * l'outil est protege, alors que seule la route `/api/dossiers/` l'est
 * reellement. Mieux vaut que la porte soit la ou est la serrure.
 */
function Administration() {
  const [ecran, setEcran] = useState<"tableau-de-bord" | "dossiers-kyc">(
    "tableau-de-bord",
  );
  const [jeton, setJeton] = useState(lireLeJeton);
  const [jetonRefuse, setJetonRefuse] = useState(false);

  const poserLeJeton = (nouveau: string) => {
    retenirLeJeton(nouveau);
    setJeton(nouveau);
    setJetonRefuse(false);
  };

  /* `useCallback` : cette fonction part en dependance d'un effet dans A2, et
     une nouvelle reference a chaque rendu y relancerait l'effet en boucle. */
  const refuserLeJeton = useCallback(() => {
    oublierLeJeton();
    setJeton("");
    setJetonRefuse(true);
  }, []);

  if (ecran === "dossiers-kyc") {
    if (!jeton) {
      return (
        <DemandeJeton
          onJeton={poserLeJeton}
          erreur={
            jetonRefuse
              ? "Le serveur a refusé ce jeton. Vérifiez JETON_ADMIN dans backend/.env."
              : undefined
          }
        />
      );
    }
    return (
      <DossiersKyc
        jeton={jeton}
        onRetour={() => setEcran("tableau-de-bord")}
        onJetonRefuse={refuserLeJeton}
      />
    );
  }
  return <TableauDeBordAdmin onDossiersKyc={() => setEcran("dossiers-kyc")} />;
}

createRoot(racine).render(
  <StrictMode>
    <Administration />
  </StrictMode>,
);
