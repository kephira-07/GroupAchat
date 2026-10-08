import { CATEGORIES, type Categorie, LIBELLE_CATEGORIE } from "../../domaine/groupage";
import {
  type Filtres,
  LIBELLE_TRI,
  ORDRE_TRI,
  SEUIL_PETIT_PRIX,
} from "../../domaine/filtres";
import { formaterFrancs } from "../../domaine/format";
import { IconeChevronBas, IconeHorloge, IconeTri } from "../../ui/Icones";

/**
 * Categories, filtres et tri — SPEC_ECRANS_FIGMA.md ecran 2, points 2 a 4,
 * mis en forme d'apres la maquette fournie (le champ de recherche est dans
 * `EnTeteApplication`).
 *
 * C'est la forme marchande classique — puces de categorie, puces de filtre,
 * tri — mais **ramenee a ce que ce produit a vraiment a filtrer**. Les deux
 * filtres de la spec sont les deux seuls qui aient un sens ici : le temps
 * restant, qui est le seul element de pression de l'application (§2.4), et un
 * seuil de prix. Pas de note vendeur, pas de « livraison gratuite », pas de
 * fourchette a deux curseurs : il n'y a ni notation des groupeurs (§1.7), ni
 * livraison offerte, et un curseur de prix sur dix offres est une
 * complication sans gain.
 *
 * Categorie active : contour et texte `primaire` sur fond blanc, comme la
 * maquette. Jamais `marque` avec du blanc dessus, qui ne tient qu'a 2,87:1.
 */

/*
 * Le modele de filtrage n'est pas ici. Il est dans `domaine/filtres.ts`,
 * parce que trois interfaces differentes montrent les memes filtres : ces
 * puces, la colonne laterale de bureau et les deux carrousels de l'accueil.
 * Ce composant **montre** des regles, il n'en decide aucune.
 */

export default function RechercheEtFiltres({
  filtres,
  onChanger,
  comptesCategories,
  nombreResultats,
}: {
  filtres: Filtres;
  onChanger: (filtres: Filtres) => void;
  comptesCategories: Record<Categorie, number>;
  nombreResultats: number;
}) {
  const modifier = (partie: Partial<Filtres>) =>
    onChanger({ ...filtres, ...partie });

  /** Le tri tourne d'un appui a l'autre : pas de menu cache (§1.0, simple 5). */
  const triSuivant = () => {
    const position = ORDRE_TRI.indexOf(filtres.tri);
    modifier({ tri: ORDRE_TRI[(position + 1) % ORDRE_TRI.length] });
  };

  return (
    <div className="space-y-3">
      {/* Les categories, en puces defilantes. */}
      <div
        role="group"
        aria-label="Filtrer par catégorie"
        className="defilement-discret flex gap-2 overflow-x-auto px-4"
      >
        <Puce
          active={filtres.categorie === "toutes"}
          onClick={() => modifier({ categorie: "toutes" })}
        >
          Tout
        </Puce>
        {CATEGORIES.map((categorie) => (
          <Puce
            key={categorie}
            active={filtres.categorie === categorie}
            onClick={() =>
              modifier({
                categorie:
                  filtres.categorie === categorie ? "toutes" : categorie,
              })
            }
          >
            <span>{LIBELLE_CATEGORIE[categorie]}</span>
            <span className="text-texte-secondaire">
              {comptesCategories[categorie]}
            </span>
          </Puce>
        ))}
      </div>

      {/* Les deux filtres. */}
      <div className="defilement-discret flex gap-2 overflow-x-auto px-4">
        <Puce
          active={filtres.termineBientot}
          onClick={() => modifier({ termineBientot: !filtres.termineBientot })}
        >
          <IconeHorloge taille={15} />
          Se termine bientôt
        </Puce>
        <Puce
          active={filtres.petitPrix}
          onClick={() => modifier({ petitPrix: !filtres.petitPrix })}
        >
          <IconeTri taille={15} />
          Moins de {formaterFrancs(SEUIL_PETIT_PRIX)}
        </Puce>
      </div>

      {/* Le compte et le tri, sur la meme ligne comme la maquette. */}
      <div className="flex items-center justify-between gap-3 px-4">
        <p aria-live="polite" className="text-sm text-texte-secondaire">
          {nombreResultats === 0
            ? "Aucun groupage"
            : `${nombreResultats} groupage${nombreResultats > 1 ? "s" : ""} ouvert${
                nombreResultats > 1 ? "s" : ""
              }`}
        </p>

        <button
          type="button"
          onClick={triSuivant}
          className="inline-flex min-h-12 shrink-0 items-center gap-1 text-sm text-texte-secondaire"
        >
          Trier par :{" "}
          <span className="font-medium text-texte">
            {LIBELLE_TRI[filtres.tri]}
          </span>
          <IconeChevronBas taille={16} />
        </button>
      </div>
    </div>
  );
}

function Puce({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      /* min-h-12 : zone tactile de 48 px (§1.1). */
      className={`inline-flex min-h-12 shrink-0 items-center gap-1.5 rounded-full border px-4 text-sm font-medium whitespace-nowrap transition-colors ${
        active
          ? "border-primaire bg-primaire-fond text-primaire"
          : "border-bordure bg-white text-texte active:bg-surface-douce"
      }`}
    >
      {children}
    </button>
  );
}
