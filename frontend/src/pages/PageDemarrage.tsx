import { useEffect, useState } from "react";
import Logo from "../ui/Logo";

/**
 * Page de demarrage — l'ecran de lancement, avant le fil.
 *
 * **Elle ne demande rien et ne bloque personne.** Le §1.5 interdit trois
 * choses a l'ouverture : un ecran de connexion, un tutoriel bloquant et une
 * fenetre « creez un compte ». Une page de demarrage n'en est pas une a deux
 * conditions, tenues ici : elle **disparait seule**, et **un appui la passe**.
 * Elle ne doit jamais devenir l'endroit ou l'on explique le produit — le fil
 * s'en charge en trois secondes.
 *
 * **Le fond est `primaire` `#CC4A00`, pas `marque` `#FF6A00`.** C'est le seul
 * detail qui compte ici : le logo blanc sur `marque` ne contraste qu'a 2,87:1,
 * et le §1.2 l'interdit sans exception — y compris pour le nom de la marque,
 * qui reste du texte. Sur `primaire`, le blanc tient a 4,62:1. Les deux
 * oranges se ressemblent a l'oeil ; un seul se lit au soleil de Lome.
 *
 * La version `blanc` du logo, en disposition `haut`, est faite exactement pour
 * cet usage : monochrome, centree, sur un aplat de couleur.
 *
 * Sans animation si le systeme demande a les reduire — c'est un reglage
 * d'accessibilite courant sur Android, et il n'y a aucune raison de le forcer.
 */

/** Assez pour voir le logo, trop court pour agacer. */
const DUREE_MS = 1400;

export default function PageDemarrage({ onTermine }: { onTermine: () => void }) {
  const [sort, setSort] = useState(false);

  useEffect(() => {
    const debutSortie = window.setTimeout(() => setSort(true), DUREE_MS);
    // +300 ms : le temps du fondu, sinon l'ecran saute.
    const fin = window.setTimeout(onTermine, DUREE_MS + 300);
    return () => {
      window.clearTimeout(debutSortie);
      window.clearTimeout(fin);
    };
  }, [onTermine]);

  return (
    <div
      /* Un appui passe l'ecran : personne n'est retenu. */
      onClick={onTermine}
      role="status"
      aria-label="Group Achat, chargement"
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-primaire transition-opacity duration-300 motion-reduce:transition-none ${
        sort ? "opacity-0" : "opacity-100"
      }`}
    >
      <div className="animate-[apparition_600ms_ease-out_both] motion-reduce:animate-none">
        <Logo variante="blanc" disposition="haut" hauteur={132} />
      </div>

      <p className="mt-8 px-8 text-center text-sm text-white">
        Le prix de gros, à plusieurs.
      </p>

      {/* Indicateur discret : il dit que ca charge, il ne decore pas. */}
      <span
        aria-hidden="true"
        className="absolute bottom-16 size-6 animate-spin rounded-full border-2 border-white/35 border-t-white motion-reduce:animate-none"
      />
    </div>
  );
}
