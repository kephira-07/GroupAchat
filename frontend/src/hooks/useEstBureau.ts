import { useEffect, useState } from "react";

/**
 * Vrai au-dela de 768 px de large.
 *
 * **Pourquoi un test en JavaScript plutot que des classes Tailwind.** La
 * plupart des differences entre telephone et ordinateur se reglent en CSS, et
 * c'est ce qu'on fait partout ailleurs. Mais deux d'entre elles changent
 * l'**architecture**, pas la mise en page :
 *
 * - le fil plein ecran (ecran 1) n'existe pas au-dela du telephone. Le defilement
 *   vertical carte par carte est un geste de pouce ; a la molette il est
 *   penible, et sur un site marchand on attend un catalogue, pas un fil ;
 * - la barre de navigation du bas est un composant mobile. Sur ordinateur la
 *   navigation est en haut, et le pied de page prend le relais.
 *
 * Dans les deux cas il faut **ne pas monter le composant du tout**, pas
 * seulement le cacher : un fil masque en CSS telecharge quand meme ses dix
 * photos et garde ses ecouteurs de defilement.
 *
 * Le rendu initial part de `false` — l'hypothese mobile d'abord, conforme au
 * reste du projet — puis se corrige des le premier effet.
 */
/**
 * 768 px, et pas 1024. Une tablette de 820 px traitee comme un telephone donne
 * une colonne de 430 px flottant au milieu du vide : le pire des deux mondes.
 * A partir de 768 px l'architecture du site marchand tient, et les trois
 * paliers se repartissent proprement :
 *
 * | Largeur | Ce qu'on voit |
 * |---|---|
 * | < 768 | Le fil, la barre du bas, une colonne de 430 px |
 * | 768 a 1023 | Le catalogue, grille a 2 colonnes, filtres en puces |
 * | ≥ 1024 | Le catalogue, colonne de filtres laterale, fiche sur 2 colonnes |
 */
const REQUETE = "(min-width: 768px)";

export default function useEstBureau(): boolean {
  const [estBureau, setEstBureau] = useState(() =>
    typeof window === "undefined" ? false : window.matchMedia(REQUETE).matches,
  );

  useEffect(() => {
    const media = window.matchMedia(REQUETE);
    const auChangement = (evenement: MediaQueryListEvent) =>
      setEstBureau(evenement.matches);
    setEstBureau(media.matches);
    media.addEventListener("change", auChangement);
    return () => media.removeEventListener("change", auChangement);
  }, []);

  return estBureau;
}
