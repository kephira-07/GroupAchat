import { decrireTempsRestant, type UrgenceTemps } from "../../domaine/format";
import { IconeHorloge } from "../../ui/Icones";

/**
 * `CompteurTemps` — SPEC_ECRANS_FIGMA.md §2.4.
 *
 * Le temps restant est le seul element de pression de l'application : il n'y a
 * ni minimum ni places limitees. Puce a icone horloge, sans liseré ni cadre.
 */

const STYLES: Record<UrgenceTemps, string> = {
  large: "bg-white text-texte-secondaire",
  proche: "bg-primaire-fond text-primaire-texte-sur-fond",
  "derniere-heure": "bg-danger-fond text-danger",
  terminee: "bg-surface-douce text-texte-secondaire",
};

export default function CompteurTemps({
  heuresRestantes,
  surMedia = false,
}: {
  heuresRestantes: number;
  /** Sur le fil, pose sur un media sombre (§2.4). */
  surMedia?: boolean;
}) {
  const { urgence, libelle, libelleAccessible } =
    decrireTempsRestant(heuresRestantes);

  /* §2.4 — Sur le fil, le compteur devient un aplat `marque` a texte
     `#14181F`. C'est son usage le plus visible de toute l'application, et
     celui ou l'orange de la marque travaille le mieux. Le texte y est sombre,
     jamais blanc : blanc sur `marque` ne tient qu'a 2,87:1. */
  const style = surMedia ? "bg-marque text-texte" : STYLES[urgence];

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold tracking-wide ${style}`}
    >
      <IconeHorloge taille={14} />
      {/* Le libelle est en capitales et abrege : on en donne la version
          lisible aux lecteurs d'ecran. */}
      <span aria-hidden="true">{libelle}</span>
      <span className="sr-only">{libelleAccessible}</span>
    </span>
  );
}
