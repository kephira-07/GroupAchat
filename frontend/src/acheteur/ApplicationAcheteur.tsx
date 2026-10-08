import { useEffect, useState } from "react";
import FeuilleConnexion, {
  type Identite,
} from "./composants/FeuilleConnexion";
import type { Commande } from "../domaine/commande";
import { FILTRES_PAR_DEFAUT, type Filtres } from "../domaine/filtres";
import { formaterFrancs } from "../domaine/format";
import type { Groupage } from "../domaine/groupage";
import { payer } from "../api/campagnes";
import { ErreurApi, poserLeJetonAcheteur } from "../api/client";
import {
  lireLeJeton,
  lireMonProfil,
  oublierLeJeton,
  seDeconnecter,
  type Profil,
} from "../api/session";
import {
  FournisseurCatalogue,
  useCatalogue,
} from "../api/CatalogueContexte";
import useEstBureau from "../hooks/useEstBureau";
import BarreNav, { type OngletAcheteur } from "./mise-en-page/BarreNav";
import EnTeteBureau from "./mise-en-page/EnTeteBureau";
import Commander, { type BrouillonPaiement } from "./pages/Commander";
import Confirmation from "./pages/Confirmation";
import DemanderProduit from "./pages/DemanderProduit";
import DetailCommande from "./pages/DetailCommande";
import DetailGroupage from "./pages/DetailGroupage";
import Fil from "./pages/Fil";
import GroupagesOuverts from "./pages/GroupagesOuverts";
import MesCommandes from "./pages/MesCommandes";
import MesDemandes from "./pages/MesDemandes";
import Paiement from "./pages/Paiement";
import PageProfil from "./pages/Profil";
import Questions from "./pages/Questions";

/**
 * Le routeur du cote acheteur — ecrans 0 a 12.
 *
 * Si vous cherchez quel ecran mene a quel autre de ce cote-la, c'est ici et
 * nulle part ailleurs. Le cote groupeur a son propre routeur,
 * `ApplicationGroupeur` : les deux n'ont ni le meme chrome, ni la meme barre
 * de navigation, ni les memes ecrans.
 *
 * ## Les ecrans construits
 *
 * | | Ecran | Fichier |
 * |---|---|---|
 * | 1 | Le fil *(telephone)* | `pages/Fil` |
 * | 2 | Catalogue | `pages/GroupagesOuverts` |
 * | 3 | Detail d'un groupage | `pages/DetailGroupage` |
 * | 4 | Connexion *(feuille)* | `composants/FeuilleConnexion` |
 * | 5 | Commander | `pages/Commander` |
 * | 6 | Paiement simule | `pages/Paiement` |
 * | 7 | Confirmation | `pages/Confirmation` |
 * | 8 | Mes commandes | `pages/MesCommandes` |
 * | 9 | Detail d'une commande | `pages/DetailCommande` |
 * | 10 | Questions publiques | `pages/Questions` |
 * | 11 | Demander un produit | `pages/DemanderProduit` |
 * | 12 | Mes demandes | `pages/MesDemandes` |
 * | — | Profil *(4e onglet, « 12 et reglages »)* | `pages/Profil` |
 *
 * Les ecrans 13 a 22 et A1 vivent ailleurs : `ApplicationGroupeur` pour le
 * cote groupeur, `pages/TourneeLivreur` pour le livreur et
 * `pages/TableauDeBordAdmin` pour l'administration. `main.tsx` choisit lequel
 * monter.
 *
 * ## Deux architectures selon la largeur
 *
 * | | Telephone | Ordinateur (≥ 768 px) |
 * |---|---|---|
 * | Ouverture | Demarrage, puis **le fil** | **Le catalogue** |
 * | Navigation | `BarreNav` en bas | `EnTeteBureau` + pied de page |
 *
 * Le fil et la barre du bas ne sont **pas montes** au-dela de 768 px : les
 * cacher en CSS leur laisserait telecharger leurs images et garder leurs
 * ecouteurs de defilement pour rien.
 *
 * La page de demarrage et le choix de profil appartiennent a `App.tsx`, qui
 * les montre avant d'entrer ici.
 *
 * ## Pas de bibliotheque de routage
 *
 * Treize ecrans enchaines n'en ont pas besoin, et chaque kilo-octet compte sur
 * l'Android d'entree de gamme du §5 du cahier des charges. **Le jour ou il
 * faudra des URL partageables** — le partage d'un groupage est un levier de
 * croissance de l'ecran 3 — ce `useState` deviendra un vrai routeur, et le
 * type `Ecran` ci-dessous donnera directement la table des routes.
 *
 * ## La regle a ne pas casser
 *
 * L'etat du parcours vit **ici**, pas dans les pages. C'est ce qui permet de
 * tenir la promesse du §1.5 : fermer la feuille de connexion ramene a l'ecran
 * 5 **intact**, parce que l'ecran 5 n'a jamais ete demonte. Deplacer cet etat
 * dans une page casserait cette promesse sans que rien ne le signale.
 */

type Ecran =
  | { nom: "fil" }
  | { nom: "catalogue" }
  | { nom: "groupage"; groupage: Groupage }
  | { nom: "commander"; groupage: Groupage }
  | { nom: "paiement"; brouillon: BrouillonPaiement }
  | { nom: "confirmation"; commande: Commande }
  | { nom: "mes-commandes" }
  | { nom: "commande"; commande: Commande }
  | { nom: "questions"; groupage: Groupage }
  | { nom: "demander" }
  | { nom: "mes-demandes" }
  | { nom: "profil" };

/** Les ecrans de premier niveau, ceux qui gardent la barre du bas. */
const ECRANS_AVEC_BARRE_NAV: Ecran["nom"][] = [
  "fil",
  "catalogue",
  "mes-commandes",
  "mes-demandes",
  "profil",
];

/**
 * Le point d'entree du cote acheteur.
 *
 * Il ne fait qu'une chose en plus du routeur : **poser le fournisseur de
 * catalogue**. Le catalogue est charge une fois ici et partage par tous les
 * ecrans, plutot que retelecharge a chaque navigation — voir
 * `api/CatalogueContexte.tsx` pour le raisonnement, qui tient au forfait de
 * donnees limite du §5.
 */
export default function ApplicationAcheteur() {
  return (
    <FournisseurCatalogue>
      <RouteurAcheteur />
    </FournisseurCatalogue>
  );
}

function RouteurAcheteur() {
  const estBureau = useEstBureau();
  const { groupages } = useCatalogue();

  /**
   * ⚠️ **La reconnexion automatique.** C'est ici qu'elle se joue.
   *
   * Au lancement, le jeton retenu est posé puis vérifié auprès du serveur.
   * S'il répond, l'acheteur est connecté sans rien avoir fait — ni code SMS,
   * ni saisie d'adresse. S'il répond 401, le jeton est périmé : on l'oublie,
   * et la feuille reviendra au moment de payer, comme pour un nouveau venu.
   *
   * **Vérifié, et pas seulement lu.** Se fier au jeton stocké afficherait
   * « connecté » à quelqu'un dont la session a expiré, qui ne le découvrirait
   * qu'au moment de payer — c'est-à-dire au pire moment.
   */
  useEffect(() => {
    const jeton = lireLeJeton();
    if (!jeton) {
      return;
    }
    poserLeJetonAcheteur(jeton);

    let abandonne = false;
    lireMonProfil()
      .then((profil) => {
        if (!abandonne) {
          setProfil(profil);
          setIdentite({
            telephone: profil.telephone,
            nom: profil.nom || undefined,
          });
        }
      })
      .catch(() => {
        /* Jeton périmé, révoqué, ou serveur injoignable. Dans les trois cas,
           on repart anonyme : le catalogue se lit sans compte (§1.5), et la
           feuille reviendra d'elle-même au paiement. */
        if (!abandonne) {
          oublierLeJeton();
          poserLeJetonAcheteur("");
        }
      });

    return () => {
      abandonne = true;
    };
  }, []);

  const [ecran, setEcran] = useState<Ecran>({ nom: "fil" });
  const [onglet, setOnglet] = useState<OngletAcheteur>("accueil");
  const [filtres, setFiltres] = useState<Filtres>(FILTRES_PAR_DEFAUT);
  const [identite, setIdentite] = useState<Identite>();
  /** Le profil complet, dont **l'adresse par défaut** qui pré-remplit l'écran 5. */
  const [profil, setProfil] = useState<Profil>();
  /** Commande en attente de connexion : le paiement reprend seul apres. */
  const [enAttenteDeConnexion, setEnAttenteDeConnexion] =
    useState<BrouillonPaiement>();
  /**
   * Connexion demandee **sans rien a reprendre ensuite**.
   *
   * Le §1.5 impose sous chaque onglet protege un lien « J'ai deja un compte —
   * me connecter ». Il n'avait rien pour s'ouvrir : la feuille ne se montait
   * que s'il y avait un paiement en attente, donc le lien ne faisait rien.
   * Deux etats distincts plutot qu'un seul, parce que les deux fins
   * diffferent — l'une reprend le paiement, l'autre reste ou elle est.
   */
  const [connexionDemandee, setConnexionDemandee] = useState(false);
  const [commandesPassees, setCommandesPassees] = useState(0);

  const connecte = identite !== undefined;

  /**
   * Relit le profil complet apres une connexion.
   *
   * ⚠️ Indispensable : `onConnecte` ne renvoie qu'une `Identite` — numero et
   * nom. Sans cet appel, `profil` reste vide jusqu'au prochain chargement de
   * page, et l'onglet Profil affiche son squelette de chargement indefiniment
   * alors que la session est ouverte.
   */
  const rafraichirLeProfil = () => {
    lireMonProfil()
      .then(setProfil)
      .catch(() => {
        /* La session vient de s'ouvrir, donc l'echec est reseau. L'identite
           suffit a tout le parcours d'achat ; l'adresse par defaut
           reapparaitra au prochain lancement. */
      });
  };

  /** Sur ordinateur, le fil n'existe pas : « accueil » montre le catalogue. */
  const vue: Ecran =
    estBureau && ecran.nom === "fil" ? { nom: "catalogue" } : ecran;

  const ouvrirGroupage = (groupage: Groupage) =>
    setEcran({ nom: "groupage", groupage });

  const ouvrirCatalogue = () => {
    setOnglet("groupage");
    setEcran({ nom: "catalogue" });
  };

  const ouvrirDemande = () => {
    setOnglet("profil");
    setEcran({ nom: "demander" });
  };

  /**
   * Declenche par « Payer ». C'est le **seul** point ou un compte est exige
   * (§1.5) : si l'utilisateur en a un, on va droit a l'ecran 6.
   */
  const demanderPaiement = (brouillon: BrouillonPaiement) => {
    if (connecte) {
      setEcran({ nom: "paiement", brouillon });
      return;
    }
    setEnAttenteDeConnexion(brouillon);
  };

  return (
    <div
      className={
        estBureau
          ? "min-h-dvh bg-white"
          : "relative mx-auto min-h-dvh max-w-[430px] bg-white"
      }
    >
      {/* L'en-tete du site, permanent sur ordinateur : on doit pouvoir revenir
          au catalogue depuis n'importe quel ecran. */}
      {estBureau ? (
        <EnTeteBureau
          recherche={filtres.recherche}
          onRecherche={(recherche) => {
            setFiltres({ ...filtres, recherche });
            setEcran({ nom: "catalogue" });
          }}
          onDemander={ouvrirDemande}
          notifications={1}
          onAccueil={() => {
            setFiltres(FILTRES_PAR_DEFAUT);
            setEcran({ nom: "catalogue" });
          }}
        />
      ) : null}

      {vue.nom === "fil" ? (
        <Fil onOuvrirGroupage={ouvrirGroupage} onRechercher={ouvrirCatalogue} />
      ) : null}

      {vue.nom === "catalogue" ? (
        <GroupagesOuverts
          estBureau={estBureau}
          filtres={filtres}
          onFiltres={setFiltres}
          onOuvrirGroupage={ouvrirGroupage}
          onDemanderProduit={ouvrirDemande}
        />
      ) : null}

      {vue.nom === "groupage" ? (
        <DetailGroupage
          groupage={vue.groupage}
          estBureau={estBureau}
          onRetour={() =>
            setEcran({
              nom: !estBureau && onglet === "accueil" ? "fil" : "catalogue",
            })
          }
          onCommander={() =>
            setEcran({ nom: "commander", groupage: vue.groupage })
          }
          onQuestions={() =>
            setEcran({ nom: "questions", groupage: vue.groupage })
          }
        />
      ) : null}

      {/* L'ecran 5 reste monte pendant la connexion : quantite, variante,
          position et repere survivent a la feuille (§1.5). */}
      {vue.nom === "commander" ? (
        <Commander
          groupage={vue.groupage}
          /* Son adresse habituelle, modifiable : on se fait livrer ailleurs
             un jour sur dix. */
          adresseConnue={
            profil?.quartier
              ? { quartier: profil.quartier, repere: profil.repere }
              : undefined
          }
          estBureau={estBureau}
          telephoneConnu={identite?.telephone}
          onRetour={() => setEcran({ nom: "groupage", groupage: vue.groupage })}
          onPayer={demanderPaiement}
        />
      ) : null}

      {vue.nom === "paiement" ? (
        <Paiement
          brouillon={vue.brouillon}
          estBureau={estBureau}
          telephoneCompte={identite?.telephone}
          onRetour={() =>
            setEcran({ nom: "commander", groupage: vue.brouillon.groupage })
          }
          onPaye={async () => {
            try {
              const commande = await payer({
                campagne: vue.brouillon.groupage.id,
                /* Le numero **de livraison** saisi a l'ecran 5, qui peut
                   differer de celui du compte. L'acheteur, lui, est identifie
                   par son jeton de session. */
                telephone: vue.brouillon.telephone || undefined,
                quantite: vue.brouillon.quantite,
                variante: vue.brouillon.variante,
                /* La position est **conservee sur la commande** (§6 du
                   PRD) : c'est elle qui determinera les frais de livraison
                   reels, et c'est aussi ce que le livreur suivra. */
                quartier: vue.brouillon.position.quartier,
                repere: vue.brouillon.position.repere,
                /* ⚠️ **Generee une fois par brouillon, pas par tentative.**
                   C'est elle qui fait qu'un double appui — ou un reessai
                   apres une coupure — n'encaisse qu'une seule fois : le
                   serveur reconnait la cle et renvoie la commande existante
                   au lieu d'en creer une seconde. La regenerer ici
                   supprimerait toute la protection. */
                cle_idempotence: vue.brouillon.cleIdempotence,
              });

              setCommandesPassees((nombre) => nombre + 1);
              setEcran({
                nom: "confirmation",
                commande: {
                  ...vue.brouillon,
                  id: String(commande.id),
                  /* Le code de livraison vient **du serveur** : c'est lui qui
                     le garantit unique, et c'est celui que le livreur
                     demandera. En generer un dans le navigateur donnerait a
                     l'acheteur un code que personne ne reconnaitrait. */
                  codeLivraison: commande.code_livraison,
                  statut: "payee",
                  passeeLe: commande.passee_le.slice(0, 10),
                },
              });
              return undefined;
            } catch (cause) {
              return cause instanceof ErreurApi
                ? cause.messageLisible
                : "Le paiement n'a pas abouti. Réessayez.";
            }
          }}
        />
      ) : null}

      {vue.nom === "confirmation" ? (
        <Confirmation
          commande={vue.commande}
          estBureau={estBureau}
          onSuivre={() => {
            setOnglet("commandes");
            setEcran({ nom: "commande", commande: vue.commande });
          }}
          onFermer={ouvrirCatalogue}
        />
      ) : null}

      {vue.nom === "mes-commandes" ? (
        <MesCommandes
          estBureau={estBureau}
          connecte={connecte}
          telephone={identite?.telephone}
          onOuvrirCommande={(commande) =>
            setEcran({ nom: "commande", commande })
          }
          onVoirGroupages={ouvrirCatalogue}
          onSeConnecter={() => setConnexionDemandee(true)}
        />
      ) : null}

      {vue.nom === "commande" ? (
        <DetailCommande
          commande={vue.commande}
          estBureau={estBureau}
          onRetour={() => {
            setOnglet("commandes");
            setEcran({ nom: "mes-commandes" });
          }}
          onQuestions={() =>
            setEcran({ nom: "questions", groupage: vue.commande.groupage })
          }
        />
      ) : null}

      {vue.nom === "questions" ? (
        <Questions
          groupage={vue.groupage}
          estBureau={estBureau}
          telephone={identite?.telephone}
          onRetour={() => setEcran({ nom: "groupage", groupage: vue.groupage })}
          /* Poser une question demande un compte, le lire non (§1.5). La
             feuille de connexion s'ouvre donc au moment de l'envoi. */
          onSeConnecter={() => setConnexionDemandee(true)}
        />
      ) : null}

      {vue.nom === "demander" ? (
        <DemanderProduit
          estBureau={estBureau}
          onRetour={ouvrirCatalogue}
          onEnvoyee={() => setEcran({ nom: "mes-demandes" })}
        />
      ) : null}

      {vue.nom === "mes-demandes" ? (
        <MesDemandes
          estBureau={estBureau}
          connecte={connecte}
          onDemanderProduit={ouvrirDemande}
          onOuvrirGroupage={(id) => {
            const groupage = groupages.find((g) => g.id === id);
            if (groupage) {
              ouvrirGroupage(groupage);
            }
          }}
          onSeConnecter={() => setConnexionDemandee(true)}
        />
      ) : null}

      {vue.nom === "profil" ? (
        <PageProfil
          estBureau={estBureau}
          connecte={connecte}
          profil={profil}
          onVoirCampagnes={ouvrirCatalogue}
          onMesDemandes={() => setEcran({ nom: "mes-demandes" })}
          onDemanderProduit={ouvrirDemande}
          onSeConnecter={() => setConnexionDemandee(true)}
          onProfilMisAJour={(misAJour: Profil) => {
            setProfil(misAJour);
            /* L'identite porte le nom affiche ailleurs dans l'application :
               la laisser en arriere ferait reapparaitre l'ancien nom a
               l'ecran de commande. */
            setIdentite({
              telephone: misAJour.telephone,
              nom: misAJour.nom || undefined,
            });
          }}
          onSeDeconnecter={() => {
            void seDeconnecter();
            poserLeJetonAcheteur("");
            setIdentite(undefined);
            setProfil(undefined);
            /* On reste sur l'onglet : il montre alors son etat vide du §1.5,
               ce qui est la reponse honnete a « je viens de me deconnecter ».
               Renvoyer au fil ferait croire a une erreur. */
          }}
        />
      ) : null}

      {/* Ecran 4 — la feuille monte par-dessus l'ecran en cours. */}
      {enAttenteDeConnexion ? (
        <FeuilleConnexion
          rappelContexte={`Vous commandez : ${enAttenteDeConnexion.groupage.produit} — ${enAttenteDeConnexion.quantite} part${
            enAttenteDeConnexion.quantite > 1 ? "s" : ""
          }, ${formaterFrancs(enAttenteDeConnexion.total)}`}
          /* ⚠️ L'adresse qu'il vient de saisir à l'écran 5. Elle part avec le
             code et devient son adresse par défaut : on ne lui demande rien
             de plus, et sa prochaine commande arrivera pré-remplie. */
          adresse={{
            quartier: enAttenteDeConnexion.position.quartier,
            repere: enAttenteDeConnexion.position.repere,
          }}
          onFermer={() => setEnAttenteDeConnexion(undefined)}
          onConnecte={(nouvelleIdentite) => {
            setIdentite(nouvelleIdentite);
            const brouillon = enAttenteDeConnexion;
            setEnAttenteDeConnexion(undefined);
            rafraichirLeProfil();
            // L'action reprend seule : la feuille redescend sur le paiement.
            setEcran({ nom: "paiement", brouillon });
          }}
        />
      ) : null}

      {/* Ecran 4, sans rien a reprendre : le lien du §1.5. */}
      {connexionDemandee && !enAttenteDeConnexion ? (
        <FeuilleConnexion
          rappelContexte="Connectez-vous pour retrouver vos commandes, vos demandes et votre adresse de livraison."
          onFermer={() => setConnexionDemandee(false)}
          onConnecte={(nouvelleIdentite) => {
            setIdentite(nouvelleIdentite);
            setConnexionDemandee(false);
            rafraichirLeProfil();
          }}
        />
      ) : null}

      {/* La barre du bas est un composant mobile : sur ordinateur, c'est
          l'en-tete et le pied de page qui portent la navigation. */}
      {!estBureau && ECRANS_AVEC_BARRE_NAV.includes(vue.nom) ? (
        <BarreNav
          actif={onglet}
          commandesEnCours={commandesPassees}
          onChanger={(nouvelOnglet) => {
            setOnglet(nouvelOnglet);
            switch (nouvelOnglet) {
              case "accueil":
                return setEcran({ nom: "fil" });
              case "groupage":
                return setEcran({ nom: "catalogue" });
              case "commandes":
                return setEcran({ nom: "mes-commandes" });
              case "profil":
                return setEcran({ nom: "profil" });
            }
          }}
        />
      ) : null}
    </div>
  );
}
