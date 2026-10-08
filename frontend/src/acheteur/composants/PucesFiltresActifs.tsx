import {
  FILTRES_PAR_DEFAUT,
  SEUIL_PETIT_PRIX,
  type Filtres,
} from "../../domaine/filtres";
import { formaterFrancs } from "../../domaine/format";
import { LIBELLE_CATEGORIE } from "../../domaine/groupage";
import { IconeFermer } from "../../ui/Icones";

/**
 * Les filtres actifs, en puces, **en dehors du tiroir**.
 *
 * ⚠️ **C'est ce composant qui rend le tiroir acceptable.** Le §2 interdit de
 * ranger les filtres derriere un bouton, et sa raison est juste : le danger
 * d'un menu cache n'est pas qu'on ne trouve pas les filtres, c'est qu'on
 * **oublie qu'ils sont actifs** — on croit voir tout le catalogue alors qu'on
 * en voit un quart, et on repart en pensant que le produit n'a rien.
 *
 * Ces puces repondent exactement a ce danger : ce qui est range dans le
 * tiroir, c'est le **choix** des filtres ; leur **etat** reste affiche en
 * permanence, et chacun se retire d'un clic sans rouvrir quoi que ce soit.
 *
 * Elles ne s'affichent que quand il y a quelque chose a montrer : une barre
 * vide en permanence reprendrait la place qu'on vient de gagner.
 */
export default function PucesFiltresActifs({
  filtres,
  onChanger,
}: {
  filtres: Filtres;
  onChanger: (filtres: Filtres) => void;
}) {
  const puces: { cle: string; libelle: string; retirer: Partial<Filtres> }[] =
    [];

  if (filtres.recherche.trim()) {
    puces.push({
      cle: "recherche",
      libelle: `« ${filtres.recherche.trim()} »`,
      retirer: { recherche: "" },
    });
  }
  if (filtres.categorie !== "toutes") {
    puces.push({
      cle: "categorie",
      libelle: LIBELLE_CATEGORIE[filtres.categorie],
      retirer: { categorie: "toutes" },
    });
  }
  if (filtres.termineBientot) {
    puces.push({
      cle: "termineBientot",
      libelle: "Se termine bientôt",
      retirer: { termineBientot: false },
    });
  }
  if (filtres.petitPrix) {
    puces.push({
      cle: "petitPrix",
      /* Le seuil vient du domaine, jamais recopie : `PanneauFiltres`
         affiche le meme, et deux libelles qui divergent feraient douter du
         filtre lui-meme. */
      libelle: `Moins de ${formaterFrancs(SEUIL_PETIT_PRIX)}`,
      retirer: { petitPrix: false },
    });
  }

  if (puces.length === 0) {
    return null;
  }

  return (
    <ul className="flex flex-wrap items-center gap-2">
      {puces.map((puce) => (
        <li key={puce.cle}>
          <button
            type="button"
            onClick={() => onChanger({ ...filtres, ...puce.retirer })}
            /* `primaire-fond` + `primaire-texte-sur-fond` : 4,87:1, la paire
               calculee du §1.2. Jamais `primaire` sur `primaire-fond`, qui ne
               tient qu'a 4,17:1. */
            className="inline-flex items-center gap-1.5 rounded-full bg-primaire-fond py-1.5 pr-2 pl-3 text-sm font-medium text-primaire-texte-sur-fond hover:bg-primaire-fond/70"
          >
            {puce.libelle}
            <IconeFermer taille={14} className="shrink-0" />
            {/* Le libelle visible ne dit pas ce que fait le bouton : une puce
                qui affiche « Mode » doit s'annoncer « Retirer le filtre
                Mode » a qui ne voit pas la croix. */}
            <span className="sr-only">— retirer ce filtre</span>
          </button>
        </li>
      ))}

      {puces.length > 1 ? (
        <li>
          <button
            type="button"
            onClick={() =>
              onChanger({ ...FILTRES_PAR_DEFAUT, tri: filtres.tri })
            }
            className="rounded-full px-2 py-1.5 text-sm font-medium text-texte-secondaire underline hover:text-primaire"
          >
            Tout effacer
          </button>
        </li>
      ) : null}
    </ul>
  );
}
