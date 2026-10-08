import { IconeCloche, IconeDemander, IconeRecherche } from "../../ui/Icones";
import Logo from "../../ui/Logo";

/**
 * L'en-tete des grands ecrans — quatre elements, et rien d'autre :
 * **logo, barre de recherche, bouton « Demander », bouton de notifications.**
 *
 * La recherche occupe le centre et toute la largeur disponible. C'est l'action
 * principale d'un catalogue, et la reduire a une loupe la cache : sur une page
 * longue, rien ne dit a l'utilisateur qu'il peut chercher autre chose que ce
 * qu'il voit (meme raisonnement qu'a l'ecran 1, point 2).
 *
 * Le bouton « Demander » est colle a la recherche, et c'est voulu : un echec
 * de recherche se transforme en demande de produit (ecran 11) au lieu de
 * laisser quelqu'un repartir les mains vides.
 *
 * ⚠️ **« Mes commandes » et « Profil » ne sont plus ici.** Ils y etaient, et
 * ils ont ete retires pour tenir la liste de quatre elements. Sur un site
 * marchand, le suivi de commande est une des raisons principales de revenir —
 * pour l'instant il n'est atteignable que par le pied de page. A rouvrir.
 *
 * Le chrome reste celui de l'acheteur : orange (§1.2). Rien de bleu ici.
 */
export default function EnTeteBureau({
  recherche,
  onRecherche,
  onDemander,
  notifications = 0,
  onAccueil,
}: {
  recherche: string;
  onRecherche: (valeur: string) => void;
  /** Vers l'ecran 11. Un echec de recherche n'est jamais un cul-de-sac. */
  onDemander: () => void;
  notifications?: number;
  onAccueil: () => void;
}) {
  return (
    <header className="sticky top-0 z-20 border-b border-bordure bg-white">
      {/* Pleine largeur, comme le reste de la page : un en-tete arrete a
          1 280 px au-dessus d'un contenu qui va d'un bord a l'autre laisse le
          logo flotter au milieu de nulle part sur un grand ecran. */}
      <div className="flex h-20 items-center gap-4 px-4 lg:gap-8 lg:px-8">
        <button
          type="button"
          onClick={onAccueil}
          aria-label="Group Achat, accueil"
          className="shrink-0"
        >
          <Logo variante="couleur" disposition="cote" hauteur={32} />
        </button>

        <div className="flex flex-1 items-center gap-3">
          <label htmlFor="recherche-bureau" className="sr-only">
            Rechercher un produit
          </label>
          <div className="flex h-12 flex-1 items-center gap-2 rounded-[10px] border border-bordure px-3 focus-within:border-2 focus-within:border-primaire">
            <IconeRecherche
              taille={20}
              className="shrink-0 text-texte-secondaire"
            />
            <input
              id="recherche-bureau"
              type="search"
              value={recherche}
              onChange={(evenement) => onRecherche(evenement.target.value)}
              placeholder="Rechercher un produit…"
              className="h-full w-full bg-transparent outline-none placeholder:text-texte-secondaire"
            />
          </div>

          <button
            type="button"
            onClick={onDemander}
            className="inline-flex h-12 shrink-0 items-center gap-1.5 rounded-[10px] bg-primaire px-5 font-semibold text-white active:bg-primaire-presse"
          >
            <IconeDemander taille={18} />
            Demander
          </button>
        </div>

        <button
          type="button"
          aria-label={
            notifications > 0
              ? `Notifications, ${notifications} non lue${notifications > 1 ? "s" : ""}`
              : "Notifications"
          }
          className="relative flex size-12 shrink-0 items-center justify-center rounded-full text-texte hover:bg-surface-douce"
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
    </header>
  );
}
