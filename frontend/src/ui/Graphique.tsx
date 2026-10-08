/**
 * Les graphiques des deux tableaux de bord — groupeur et administration.
 *
 * ## Du SVG écrit à la main, pas une bibliothèque
 *
 * Recharts ou Chart.js pèsent entre 50 et 180 ko compressés. Le §5 du cahier
 * des charges part d'un **forfait de données limité** à Lomé, et ces trois
 * formes-là tiennent en quelques lignes de `path`. On n'ajoute pas cent
 * cinquante kilo-octets au téléchargement d'un commerçant pour tracer une
 * ligne brisée.
 *
 * Ce choix a un coût, et il faut le dire : pas d'info-bulle au survol, pas de
 * zoom, pas d'axes calculés automatiquement. Le jour où un écran demande
 * vraiment ça, une bibliothèque sera le bon choix — pour cet écran-là, chargée
 * à la demande.
 *
 * ## ⚠️ La couleur encode une donnée, elle ne décore pas
 *
 * Le §1.0 règle 7 interdit « toute illustration de remplissage ». Ces
 * graphiques n'en sont pas : **chaque couleur dit quelque chose** — l'état
 * d'un groupage, le sens d'une variation — et chaque forme porte un chiffre
 * qu'on ne pourrait pas lire aussi vite autrement.
 *
 * La règle qui s'applique en conséquence : **aucune couleur sans légende, et
 * aucune information portée par la seule couleur.** Un daltonien doit lire ces
 * écrans, et une capture en noir et blanc doit rester compréhensible — d'où
 * les libellés et les valeurs écrits à côté, toujours.
 */

/** Un point de la courbe. */
export interface PointSerie {
  /** Date ISO, ou n'importe quel libellé d'abscisse. */
  jour: string;
  montant: number;
}

/**
 * Une courbe d'évolution, avec l'aire sous la ligne.
 *
 * ⚠️ **L'axe vertical part toujours de zéro.** Le faire partir du minimum
 * ferait paraître spectaculaire une variation de 3 %, ce qui est la façon la
 * plus courante de mentir avec un graphique — et sur un tableau de bord
 * d'argent, ce serait mentir à celui qui décide.
 */
export function Courbe({
  points,
  couleur = "var(--color-confiance)",
  hauteur = 120,
  libelle,
}: {
  points: readonly PointSerie[];
  couleur?: string;
  hauteur?: number;
  /** Nom accessible — la courbe est une image pour un lecteur d'écran. */
  libelle: string;
}) {
  if (points.length === 0) {
    return null;
  }

  const largeur = 300;
  /* `|| 1` : une série entièrement à zéro diviserait par zéro et produirait
     un `path` rempli de `NaN`, donc une zone vide sans message d'erreur. */
  const maximum = Math.max(...points.map((point) => point.montant), 1);

  const coordonnees = points.map((point, indice) => {
    const x = (indice / Math.max(1, points.length - 1)) * largeur;
    const y = hauteur - (point.montant / maximum) * (hauteur - 8);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  const ligne = `M${coordonnees.join(" L")}`;
  const aire = `${ligne} L${largeur},${hauteur} L0,${hauteur} Z`;

  const total = points.reduce((somme, point) => somme + point.montant, 0);

  return (
    <svg
      viewBox={`0 0 ${largeur} ${hauteur}`}
      preserveAspectRatio="none"
      className="w-full"
      style={{ height: hauteur }}
      role="img"
      aria-label={`${libelle} — ${total} au total sur ${points.length} jours`}
    >
      {/* L'aire, très transparente : elle donne le volume sans voler la
          lisibilité à la ligne, qui porte l'information. */}
      <path d={aire} fill={couleur} opacity="0.12" />
      <path
        d={ligne}
        fill="none"
        stroke={couleur}
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
      {/* Le dernier point, marqué : c'est celui qu'on cherche. */}
      <circle
        cx={largeur}
        cy={
          hauteur -
          (points[points.length - 1].montant / maximum) * (hauteur - 8)
        }
        r="3"
        fill={couleur}
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

/**
 * Une barre de progression, avec son chiffre écrit à côté.
 *
 * Employée pour l'avancement d'un groupage : le temps écoulé, la collecte par
 * rapport au plafond.
 */
export function Barre({
  valeur,
  maximum,
  couleur = "var(--color-confiance)",
  libelle,
  chiffre,
}: {
  valeur: number;
  maximum: number;
  couleur?: string;
  libelle: string;
  /** Ce qui s'écrit à droite. **Jamais la barre seule** : voir l'en-tête. */
  chiffre: string;
}) {
  const part = maximum > 0 ? Math.min(100, (valeur / maximum) * 100) : 0;

  return (
    <div>
      <div className="flex items-baseline justify-between gap-3 text-sm">
        <span className="min-w-0 truncate text-texte">{libelle}</span>
        <span className="shrink-0 font-semibold text-texte">{chiffre}</span>
      </div>
      <div
        className="mt-1.5 h-2 overflow-hidden rounded-full bg-surface-douce"
        role="img"
        aria-label={`${libelle} : ${chiffre}`}
      >
        <div
          className="h-full rounded-full transition-[width] duration-500"
          style={{ width: `${part}%`, backgroundColor: couleur }}
        />
      </div>
    </div>
  );
}

/** Une part de la répartition. */
export interface PartRepartition {
  libelle: string;
  nombre: number;
  couleur: string;
}

/**
 * La répartition, en **barres empilées horizontales** plutôt qu'en camembert.
 *
 * ⚠️ Le camembert est le graphique qu'on choisit en premier et qu'on devrait
 * choisir en dernier : l'œil compare mal des angles, et à cinq parts dont deux
 * petites, il devient illisible. Une barre empilée se lit de gauche à droite,
 * et la légende en dessous porte les chiffres exacts — ce qui est de toute
 * façon ce qu'on vient chercher.
 */
export function Repartition({
  parts,
  libelle,
}: {
  parts: readonly PartRepartition[];
  libelle: string;
}) {
  const total = parts.reduce((somme, part) => somme + part.nombre, 0);

  if (total === 0) {
    return (
      <p className="text-sm text-texte-secondaire">
        Rien à répartir pour l&apos;instant.
      </p>
    );
  }

  const visibles = parts.filter((part) => part.nombre > 0);

  return (
    <div>
      <div
        className="flex h-3 overflow-hidden rounded-full"
        role="img"
        aria-label={`${libelle} : ${visibles
          .map((part) => `${part.nombre} ${part.libelle}`)
          .join(", ")}`}
      >
        {visibles.map((part) => (
          <div
            key={part.libelle}
            style={{
              width: `${(part.nombre / total) * 100}%`,
              backgroundColor: part.couleur,
            }}
          />
        ))}
      </div>

      {/* ⚠️ La légende n'est pas facultative : sans elle, l'information
          reposerait sur la seule couleur. */}
      <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
        {visibles.map((part) => (
          <li key={part.libelle} className="flex items-center gap-2">
            <span
              aria-hidden="true"
              className="size-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: part.couleur }}
            />
            <span className="min-w-0 truncate text-texte-secondaire">
              {part.libelle}
            </span>
            <span className="ml-auto font-semibold text-texte">
              {part.nombre}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Les couleurs d'état, partagées par les deux tableaux de bord.
 *
 * Elles reprennent la grille du §2.8 : bleu quand Group Achat tient l'argent,
 * orange quand ça avance, vert quand c'est fait, rouge quand il y a un
 * problème, gris quand c'est clos. **La couleur se lit sans lire**, et c'est
 * ce qui permet de balayer une liste de trente groupages.
 */
export const COULEUR_STATUT: Record<string, string> = {
  ouverte: "#1E3A8A",
  "a-decider": "#CC4A00",
  "en-cours": "#CC4A00",
  livree: "#047857",
  annulee: "#B42318",
};
