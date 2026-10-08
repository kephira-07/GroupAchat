import {
  DELAI_ANNONCE,
  type EtatDossier,
  LIBELLE_ETAT,
} from "../../domaine/recrutement";
import { IconeAlerte, IconeCoche, IconeInfo } from "../../ui/Icones";

/**
 * L'etat du dossier KYC, en haut du tableau de bord du groupeur.
 *
 * **Il n'apparait que si le dossier n'est pas valide.** Un groupeur valide n'a
 * aucune raison de lire tous les matins qu'il l'est : ce serait du bruit, et
 * le §1.0 regle 7 veut que chaque pixel serve a informer, a rassurer ou a
 * agir.
 *
 * ## Ce que chaque etat doit dire, et pourquoi
 *
 * | Etat | Ce qu'il repond |
 * |---|---|
 * | **En verification** | Quelqu'un regarde, quand, et **par ou la reponse arrive** |
 * | **A completer** | Ce qui manque, et que le reste du dossier est garde |
 * | **Refuse** | Pourquoi, et ce qui reste possible |
 *
 * ⚠️ **Un etat sans motif est une porte fermee sans poignee.** C'est la raison
 * pour laquelle `motif` est affiche tel quel : c'est le texte **destine au
 * groupeur** (`MOTIFS[...].public`), pas la note interne de l'administrateur.
 * La distinction n'est pas cosmetique — « doute serieux sur l'identite » se
 * note en interne et ne se dit pas a l'interesse, parce que le lui dire lui
 * apprendrait quoi corriger pour recommencer.
 *
 * ⚠️ **Ce bandeau n'est pas le canal d'annonce.** La decision part par
 * courriel ou par telephone (§10.5) : quelqu'un qui attend une reponse ne
 * reouvre pas une application chaque jour pour voir si elle est arrivee. Ce
 * bandeau est ce qu'il retrouve **quand il revient**, pas ce qui le previent.
 */
export default function BandeauDossier({
  etat,
  motif,
  courriel,
  onReprendre,
}: {
  etat: EtatDossier;
  /** Le motif **public** de la derniere decision, s'il y en a eu une. */
  motif?: string;
  /** Vide si le groupeur n'en a pas depose : la reponse viendra par appel. */
  courriel?: string;
  /** Rouvre l'inscription. Propose seulement quand elle peut servir. */
  onReprendre?: () => void;
}) {
  if (etat === "valide") {
    return null;
  }

  const apparence = {
    "en-verification": {
      /* `info` et non `attention` : il n'y a rien a corriger, rien ne va mal.
         Un bandeau orange ferait croire a un probleme a chaque ouverture. */
      fond: "bg-confiance-fond text-confiance",
      Icone: IconeInfo,
      titre: `Dossier en cours d'examen`,
    },
    "a-completer": {
      fond: "bg-primaire-fond text-primaire-texte-sur-fond",
      Icone: IconeAlerte,
      titre: "Une pièce à reprendre",
    },
    refuse: {
      fond: "bg-danger-fond text-danger",
      Icone: IconeAlerte,
      titre: "Dossier non validé",
    },
    /* `valide` est traite au-dessus par un retour anticipe, mais la cle doit
       exister pour que TypeScript garantisse l'exhaustivite : si un etat
       s'ajoute un jour, c'est ici qu'on l'oubliera. */
    valide: {
      fond: "bg-succes-fond text-succes",
      Icone: IconeCoche,
      titre: "Dossier validé",
    },
  }[etat];

  const { Icone } = apparence;

  return (
    <div className={`mx-4 mt-3 rounded-xl px-4 py-3 ${apparence.fond}`}>
      <div className="flex items-start gap-2">
        <Icone taille={20} className="mt-0.5 shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="font-semibold">{apparence.titre}</p>

          {etat === "en-verification" ? (
            <p className="mt-1 text-sm">
              Un administrateur l&apos;examine, dossier par dossier. Réponse
              sous {DELAI_ANNONCE},{" "}
              {courriel ? (
                <>
                  par courriel à{" "}
                  <strong className="font-semibold">{courriel}</strong>
                </>
              ) : (
                <>par téléphone, au numéro déposé</>
              )}
              .
            </p>
          ) : null}

          {etat !== "en-verification" && motif ? (
            <p className="mt-1 text-sm">
              {/* Une majuscule en tete : le motif est redige pour venir apres
                  un deux-points dans un courriel, il commence donc en
                  minuscule. Ici il est seul. */}
              {motif.charAt(0).toUpperCase() + motif.slice(1)}.
            </p>
          ) : null}

          {etat === "a-completer" ? (
            <p className="mt-1 text-sm">
              Le reste de votre dossier est conservé — il n&apos;y a que cette
              pièce à reprendre, et nous réexaminons sous {DELAI_ANNONCE}.
            </p>
          ) : null}

          <p className="mt-2 text-sm">
            {/* La phrase qui compte : elle dit **ce qui est ferme**, avant
                qu'il ne cherche le bouton et ne conclue a une panne. */}
            Vous pourrez créer votre premier groupage dès que votre dossier sera
            validé.
          </p>

          {/* Proposé pour « à compléter » seulement. Après un refus, la
              marche à suivre est dans le motif — et pour un titulaire Mobile
              Money qui n'est pas le sien, elle passe par l'ouverture d'un
              compte, pas par ce bouton. */}
          {etat === "a-completer" && onReprendre ? (
            <button
              type="button"
              onClick={onReprendre}
              className="mt-3 min-h-11 rounded-xl bg-white px-4 text-sm font-semibold text-confiance"
            >
              Reprendre mon dossier
            </button>
          ) : null}
        </div>

        <span className="shrink-0 rounded-full bg-white/70 px-2 py-0.5 text-xs font-medium">
          {LIBELLE_ETAT[etat]}
        </span>
      </div>
    </div>
  );
}
