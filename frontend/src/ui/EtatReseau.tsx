import type { ErreurApi } from "../api/client";
import Bouton from "./Bouton";
import type { RoleChrome } from "./chrome";
import { IconeAlerte } from "./Icones";

/**
 * Ce qu'on montre pendant qu'on charge, et quand ca echoue.
 *
 * **Ces deux etats sont la moitie du travail d'une application branchee sur un
 * reseau**, et celle qu'on oublie. Le §5 du cahier des charges part d'un
 * forfait de donnees limite et d'une connexion irreguliere a Lome : une liste
 * qui met trois secondes a arriver est l'ordinaire, pas l'accident.
 */

/**
 * Une barre grise qui remplace un texte en cours de chargement.
 *
 * ⚠️ **Pas de clignotement ni de vague animee.** Un squelette qui pulse attire
 * l'œil sur l'attente au lieu de la faire oublier, et sur un telephone
 * d'entree de gamme l'animation coute du processeur. Une forme stable suffit a
 * dire « ca arrive ».
 */
export function Squelette({
  largeur = "100%",
  hauteur = 16,
  className = "",
}: {
  largeur?: string;
  hauteur?: number;
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={`block rounded bg-surface-douce ${className}`}
      style={{ width: largeur, height: hauteur }}
    />
  );
}

/**
 * L'attente, **a la forme du contenu attendu**.
 *
 * Un tourniquet centre ne dit rien de ce qui arrive et fait sauter la page
 * quand le contenu le remplace. Des rectangles a la place des vignettes
 * donnent la bonne hauteur tout de suite : rien ne bouge au moment ou les
 * donnees arrivent.
 */
export function ListeEnChargement({
  nombre = 6,
  className = "",
}: {
  nombre?: number;
  className?: string;
}) {
  return (
    <ul
      className={className}
      aria-busy="true"
      /* `aria-label` plutot que du texte visible : un lecteur d'ecran doit
         savoir qu'on charge, un voyant le voit deja aux formes. */
      aria-label="Chargement en cours"
    >
      {Array.from({ length: nombre }, (_, indice) => (
        <li key={indice} className="flex gap-3 py-3">
          <Squelette largeur="88px" hauteur={88} className="shrink-0 rounded-xl" />
          <span className="min-w-0 flex-1 space-y-2 py-1">
            <Squelette largeur="75%" />
            <Squelette largeur="50%" hauteur={13} />
            <Squelette largeur="35%" hauteur={13} />
          </span>
        </li>
      ))}
    </ul>
  );
}

/**
 * L'echec, avec de quoi en sortir.
 *
 * ⚠️ **Toujours un bouton « Reessayer ».** Sur une connexion irreguliere, la
 * meme requete marche souvent a la seconde tentative ; sans ce bouton, la
 * seule issue est de recharger la page — c'est-a-dire de tout retelecharger,
 * sur un forfait limite.
 *
 * ⚠️ **Et jamais le message technique.** « Failed to fetch » ou « Erreur 500 »
 * n'apprennent rien a quelqu'un qui voulait acheter des ecouteurs. Le client
 * traduit en francais, et distingue la coupure de reseau — qui est du ressort
 * de l'utilisateur — d'une panne serveur, qui ne l'est pas : dire « ce n'est
 * pas vous » evite qu'il recommence dix fois.
 */
export function ErreurReseau({
  erreur,
  onReessayer,
  role,
}: {
  erreur: ErreurApi;
  onReessayer: () => void;
  role?: RoleChrome;
}) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center px-4 py-12 text-center"
    >
      <IconeAlerte taille={40} className="text-texte-secondaire" />
      <h2 className="mt-4 text-lg font-semibold text-texte">
        {erreur.estHorsLigne ? "Pas de connexion" : "Ça n'a pas marché"}
      </h2>
      <p className="mt-2 max-w-80 text-texte-secondaire">
        {erreur.messageLisible}
      </p>
      <div className="mt-6 w-full max-w-64">
        <Bouton style="secondaire" role={role} onClick={onReessayer}>
          Réessayer
        </Bouton>
      </div>
    </div>
  );
}
