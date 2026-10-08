import { useEffect, useState } from "react";
import { lireMonDossier, type MonDossierApi } from "../api/dossiers";
import {
  FournisseurEspaceGroupeur,
  useEspaceGroupeur,
} from "../api/EspaceGroupeurContexte";
import { useRequete } from "../api/useRequete";
import { LIBELLE_QUARTIER } from "../domaine/groupage";
import { peutLancerUnGroupage } from "../domaine/recrutement";
import type { Campagne, DemandeAgregee } from "../domaine/groupeur";
import {
  BarreNavGroupeur,
  type OngletGroupeur,
} from "./mise-en-page/ChromeGroupeur";
import CreerCampagne from "./pages/CreerCampagne";
import Decision from "./pages/Decision";
import FilDemandes from "./pages/FilDemandes";
import GererCampagne from "./pages/GererCampagne";
import Justificatif from "./pages/Justificatif";
import Portefeuille from "./pages/Portefeuille";
import QuestionsRecues from "./pages/QuestionsRecues";
import Statistiques from "./pages/Statistiques";
import TableauDeBord from "./pages/TableauDeBord";

/**
 * Le routeur du cote groupeur — ecrans 13 a 21.
 *
 * **Separe du routeur acheteur, et volontairement.** Les deux cotes n'ont ni
 * le meme chrome (§1.2 : orange contre bleu), ni la meme barre de navigation,
 * ni les memes ecrans. Les melanger dans un seul `switch` obligerait a tester
 * le role a chaque branche, et la premiere erreur de chrome passerait
 * inapercue.
 *
 * ## Les ecrans
 *
 * | | Ecran | Fichier |
 * |---|---|---|
 * | 13 | Tableau de bord | `pages/groupeur/TableauDeBord` |
 * | 14 | Creer une campagne | `pages/groupeur/CreerCampagne` |
 * | 15 | Gerer une campagne | `pages/groupeur/GererCampagne` |
 * | 16 | Cloturer et decider | `pages/groupeur/Decision` |
 * | 17 | Deposer un justificatif | `pages/groupeur/Justificatif` |
 * | 18 | Portefeuille | `pages/groupeur/Portefeuille` |
 * | 19 | Fil des demandes | `pages/groupeur/FilDemandes` |
 * | 20 | Questions recues | `pages/groupeur/QuestionsRecues` |
 * | 21 | Statistiques | `pages/groupeur/Statistiques` |
 *
 * **Cote groupeur, la mise en page ne change pas avec la largeur.** Ces ecrans
 * sont faits pour le telephone d'un commercant qui travaille debout dans son
 * magasin ; les etaler sur 1 280 px n'apporterait rien et doublerait le code.
 * Ils restent donc dans une colonne de 430 px centree, comme le cote acheteur
 * sur telephone. Le jour ou un groupeur demandera une version bureau, c'est
 * l'ecran 21 qu'il faudra elargir en premier — un tableau de bord gagne a
 * l'espace, un formulaire non.
 */
type EcranGroupeur =
  | { nom: "tableau-de-bord" }
  | { nom: "creer"; depuis?: DemandeAgregee }
  | { nom: "campagne"; campagne: Campagne }
  | { nom: "decision"; campagne: Campagne }
  | { nom: "justificatif" }
  | { nom: "portefeuille" }
  | { nom: "demandes" }
  | { nom: "questions" }
  | { nom: "statistiques" };

/** Les ecrans de premier niveau, ceux qui gardent la barre du bas. */
const AVEC_BARRE_NAV: EcranGroupeur["nom"][] = [
  "tableau-de-bord",
  "portefeuille",
  "statistiques",
];

export default function ApplicationGroupeur(proprietes: {
  telephone?: string;
  dossierFrais?: MonDossierApi;
  onDossierValide?: () => void;
  onReprendreLeDossier?: () => void;
}) {
  return (
    <FournisseurEspaceGroupeur telephone={proprietes.telephone ?? ""}>
      <RouteurGroupeur {...proprietes} />
    </FournisseurEspaceGroupeur>
  );
}

function RouteurGroupeur({
  telephone = "",
  dossierFrais,
  onDossierValide,
  onReprendreLeDossier,
}: {
  /**
   * Le numero avec lequel le dossier KYC a ete depose.
   *
   * Vide pour un groupeur **deja valide** : on ne relit alors rien, et tout
   * s'ouvre. C'est le cas de toutes les sessions ordinaires — on depose son
   * dossier une fois, on travaille ensuite pendant des mois.
   */
  telephone?: string;
  /** Ce que le depot vient de renvoyer, pour ne pas faire patienter. */
  dossierFrais?: MonDossierApi;
  /** Appele quand la relecture apprend que le dossier est passe valide. */
  onDossierValide?: () => void;
  onReprendreLeDossier?: () => void;
} = {}) {
  const [ecran, setEcran] = useState<EcranGroupeur>({ nom: "tableau-de-bord" });
  const [onglet, setOnglet] = useState<OngletGroupeur>("tableau-de-bord");

  /**
   * L'etat du dossier, **relu a chaque ouverture**.
   *
   * C'est par ici que la decision de l'administrateur rejoint le groupeur
   * dans l'application. Elle lui est annoncee par courriel ou par telephone
   * (§10.5) — une application qu'on rouvre n'est pas un canal d'annonce —
   * mais quand il revient, il doit trouver l'etat a jour et le motif, pas
   * celui de la veille.
   */
  const suivi = useRequete(
    (signal) => lireMonDossier(telephone, signal),
    [telephone],
    telephone !== "",
  );

  /* Ce que le serveur vient de dire l'emporte sur ce que le depot avait
     renvoye : entre les deux, un administrateur a pu trancher. */
  const dossierApi = suivi.donnees ?? dossierFrais;

  /**
   * ⚠️ **Le dossier ne verrouille qu'un seul geste : creer un groupage.**
   *
   * Tout le reste du cote groupeur s'ouvre normalement, et c'est un equilibre
   * delibere : faire attendre quelqu'un devant une porte close pendant deux
   * jours ouvres lui fait oublier le produit, alors que le laisser creer un
   * groupage avant examen viderait de son sens la phrase « groupeurs
   * selectionnes par Group Achat » affichee a l'acheteur sur presque chaque
   * ecran. Il decouvre l'outil ; il n'engage pas encore l'argent des autres.
   *
   * **Et ce n'est qu'un confort d'affichage.** Le verrou reel est dans
   * `Campagne.save()` cote serveur : une interface ne protege rien, il suffit
   * d'une requete directe pour la contourner.
   *
   * ⚠️ **C'est le serveur qui dit s'il peut lancer**, pas un calcul local sur
   * l'etat. `peut_lancer_une_campagne` sort du modele Django, qui connait les
   * conditions reelles ; les deduire ici d'un libelle d'etat creerait une
   * seconde regle a tenir a jour.
   */
  const dossier =
    dossierApi && !dossierApi.peut_lancer_une_campagne
      ? {
          etat: dossierApi.etat,
          motif: dossierApi.motif || undefined,
          pseudonyme: dossierApi.pseudonyme,
        }
      : undefined;

  const peutCreer =
    dossier === undefined || peutLancerUnGroupage(dossier.etat);

  /* Le dossier vient d'etre valide : plus rien a suivre, le numero peut
     s'effacer du navigateur. Dans un effet — prevenir le parent pendant le
     rendu reviendrait a changer son etat au milieu du notre. */
  const estValide = dossierApi?.peut_lancer_une_campagne === true;
  useEffect(() => {
    if (estValide) {
      onDossierValide?.();
    }
  }, [estValide, onDossierValide]);

  const { campagnes, recharger } = useEspaceGroupeur();

  /* ⚠️ `?? CAMPAGNES[0]` a disparu : il y avait toujours une campagne de
     demonstration sous la main, donc l'ecran 16 s'ouvrait meme quand il n'y
     avait rien a decider. Avec de vraies donnees, un groupeur neuf n'a aucune
     campagne, et ouvrir un ecran de decision vide serait pire que de ne pas
     l'ouvrir. */
  const campagneADecider =
    campagnes.find((c) => c.statut === "a-decider") ??
    campagnes.find((c) => c.heuresRestantes === 0);

  /** Les quatre entrees de « A faire aujourd'hui » de l'ecran 13. */
  const ouvrirTache = (destination: string) => {
    switch (destination) {
      case "decision":
        /* Pas de campagne a decider : la tache n'aurait pas du s'afficher.
           On ne navigue pas plutot que d'ouvrir un ecran sans sujet. */
        return campagneADecider
          ? setEcran({ nom: "decision", campagne: campagneADecider })
          : undefined;
      case "justificatif":
        return setEcran({ nom: "justificatif" });
      case "questions":
        return setEcran({ nom: "questions" });
      case "demandes":
        return setEcran({ nom: "demandes" });
    }
  };

  const retourTableau = () => {
    setOnglet("tableau-de-bord");
    setEcran({ nom: "tableau-de-bord" });
  };

  const ouvrirStatistiques = () => {
    setOnglet("statistiques");
    setEcran({ nom: "statistiques" });
  };

  return (
    <div className="relative mx-auto min-h-dvh max-w-[430px] bg-white">
      {ecran.nom === "tableau-de-bord" ? (
        <TableauDeBord
          onStatistiques={ouvrirStatistiques}
          onCampagne={(campagne) => setEcran({ nom: "campagne", campagne })}
          onTache={ouvrirTache}
          onCreer={() => setEcran({ nom: "creer" })}
          dossier={dossier}
          onReprendreLeDossier={onReprendreLeDossier}
        />
      ) : null}

      {ecran.nom === "creer" ? (
        <CreerCampagne
          prerempli={
            ecran.depuis
              ? {
                  produit: ecran.depuis.produit,
                  quantite: ecran.depuis.personnes,
                  /* Le libelle, pas la cle : « Agoè » et non « Agoe ». */
                  quartier: LIBELLE_QUARTIER[ecran.depuis.quartier],
                }
              : undefined
          }
          telephone={telephone}
          onRetour={retourTableau}
          onPubliee={() => {
            /* Le groupage existe : le tableau de bord, la liste et les
               chiffres ont tous change. */
            recharger();
            retourTableau();
          }}
        />
      ) : null}

      {ecran.nom === "campagne" ? (
        <GererCampagne
          campagne={ecran.campagne}
          onRetour={retourTableau}
          onCloturer={() =>
            setEcran({ nom: "decision", campagne: ecran.campagne })
          }
        />
      ) : null}

      {ecran.nom === "decision" ? (
        <Decision
          campagne={ecran.campagne}
          telephone={telephone}
          onCloturee={recharger}
          onFermer={retourTableau}
          onCommander={() => setEcran({ nom: "justificatif" })}
        />
      ) : null}

      {ecran.nom === "justificatif" ? (
        <Justificatif onRetour={retourTableau} />
      ) : null}

      {ecran.nom === "portefeuille" ? (
        <Portefeuille onStatistiques={ouvrirStatistiques} />
      ) : null}

      {ecran.nom === "demandes" ? (
        <FilDemandes
          onRetour={retourTableau}
          onLancerCampagne={(demande) =>
            setEcran({ nom: "creer", depuis: demande })
          }
        />
      ) : null}

      {ecran.nom === "questions" ? (
        <QuestionsRecues onRetour={retourTableau} />
      ) : null}

      {ecran.nom === "statistiques" ? (
        <Statistiques
          onPortefeuille={() => {
            setOnglet("portefeuille");
            setEcran({ nom: "portefeuille" });
          }}
          /* ⚠️ **Le meme verrou qu'au tableau de bord.** L'ecran 21 offre un
             second chemin vers la creation ; le laisser ouvert ferait un
             contournement du premier, et c'est exactement par la que ce genre
             de regle se perd. */
          onCreer={
            peutCreer ? () => setEcran({ nom: "creer" }) : undefined
          }
        />
      ) : null}

      {AVEC_BARRE_NAV.includes(ecran.nom) ? (
        <BarreNavGroupeur
          actif={onglet}
          onChanger={(nouvelOnglet) => {
            setOnglet(nouvelOnglet);
            switch (nouvelOnglet) {
              case "tableau-de-bord":
                return setEcran({ nom: "tableau-de-bord" });
              case "campagnes":
                return campagnes[0]
                  ? setEcran({ nom: "campagne", campagne: campagnes[0] })
                  : setEcran({ nom: "tableau-de-bord" });
              case "statistiques":
                return setEcran({ nom: "statistiques" });
              case "portefeuille":
                return setEcran({ nom: "portefeuille" });
            }
          }}
        />
      ) : null}
    </div>
  );
}
