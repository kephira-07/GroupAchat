import { IconeCloche, IconeDemander, IconeRecherche } from "../../ui/Icones";
import Logo from "../../ui/Logo";

/**
 * L'en-tete des ecrans d'accueil, d'apres la maquette fournie : le logo a
 * gauche, la cloche de notifications a droite, puis le champ de recherche et
 * le bouton « Demander ».
 *
 * Le bouton « Demander » a cote de la recherche est l'idee de l'ecran 1,
 * point 2 : un echec de recherche se transforme en demande de produit
 * (ecran 11) au lieu de laisser l'utilisateur repartir les mains vides.
 *
 * La recherche en clair plutot qu'une loupe seule est un choix assume de la
 * spec : sur un fil vertical, rien ne dit qu'on peut chercher autre chose que
 * ce qui defile, et une loupe se remarque moins qu'un champ.
 */
export default function EnTeteApplication({
  recherche,
  onRecherche,
  onActiverRecherche,
  onDemander,
  surMedia = false,
  notifications = 0,
}: {
  recherche?: string;
  onRecherche?: (valeur: string) => void;
  /** Sur le fil, toucher le champ bascule vers la vue liste (ecran 2). */
  onActiverRecherche?: () => void;
  /** Vers l'ecran 11. Un echec de recherche n'est jamais un cul-de-sac. */
  onDemander?: () => void;
  /** Sur le fil, l'en-tete est pose sur le media : fond blanc a 92 %. */
  surMedia?: boolean;
  notifications?: number;
}) {
  return (
    <header
      className={`${
        surMedia ? "absolute inset-x-0 top-0 z-10" : "sticky top-0 z-10"
      } bg-white/92 backdrop-blur-sm`}
    >
      <div className="flex h-14 items-center justify-between px-4">
        {/* Fond blanc a 92 % dans les deux cas, donc la version couleur. */}
        <Logo variante="couleur" disposition="cote" hauteur={26} />

        <button
          type="button"
          aria-label={
            notifications > 0
              ? `Notifications, ${notifications} non lue${notifications > 1 ? "s" : ""}`
              : "Notifications"
          }
          className="relative flex size-12 items-center justify-center rounded-full text-texte"
        >
          <IconeCloche taille={22} />
          {notifications > 0 ? (
            <span
              aria-hidden="true"
              className="absolute top-2.5 right-2.5 size-2.5 rounded-full bg-marque"
            />
          ) : null}
        </button>
      </div>

      <div className="flex items-center gap-2 px-4 pb-3">
        <label htmlFor="recherche-entete" className="sr-only">
          Rechercher un produit
        </label>
        <div className="flex h-12 flex-1 items-center gap-2 rounded-[10px] bg-surface-douce px-3 focus-within:bg-white focus-within:ring-2 focus-within:ring-primaire">
          <IconeRecherche
            taille={18}
            className="shrink-0 text-texte-secondaire"
          />
          <input
            id="recherche-entete"
            type="search"
            value={recherche ?? ""}
            readOnly={onRecherche === undefined}
            onFocus={onActiverRecherche}
            onChange={(evenement) => onRecherche?.(evenement.target.value)}
            placeholder="Rechercher un produit…"
            className="h-full w-full bg-transparent text-sm outline-none placeholder:text-texte-secondaire"
          />
        </div>

        <button
          type="button"
          onClick={onDemander}
          className="inline-flex h-12 shrink-0 items-center gap-1.5 rounded-[10px] bg-primaire px-4 font-semibold text-white active:bg-primaire-presse"
        >
          <IconeDemander taille={18} />
          Demander
        </button>
      </div>
    </header>
  );
}
