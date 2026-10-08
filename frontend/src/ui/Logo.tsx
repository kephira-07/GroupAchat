import blancCote from "../assets/logoBlancIconeaCote.svg";
import blancHaut from "../assets/logoBlancconeenhaut.svg";
import couleurCote from "../assets/logoCouleurIconeaCote.svg";
import couleurHaut from "../assets/logoCouleurIconeenhaut.svg";

/**
 * Le logo Group Achat, dans les quatre declinaisons fournies.
 *
 * | | `cote` (158 x 35) | `haut` (307 x 177) |
 * |---|---|---|
 * | `couleur` | en-tetes sur fond blanc | page de demarrage claire |
 * | `blanc` | sur un media sombre | page de demarrage sur aplat orange |
 *
 * **Quelle version sur quel fond.** La version `blanc` est monochrome : elle
 * est faite pour un fond fonce ou un aplat de couleur, jamais pour du blanc.
 * La version `couleur` porte l'orange et le bleu de la marque et demande un
 * fond clair.
 *
 * Les fichiers gardent leurs propres teintes (`#FE6C00`, `#1F3B8D`), tres
 * legerement differentes des jetons `marque` et `confiance` du §1.2. C'est
 * voulu : un logo n'est pas un composant d'interface, on ne le repeint pas
 * pour le faire entrer dans une palette.
 *
 * Les SVG sont integres au paquet sous forme de donnees (voir
 * `assetsInlineLimit` dans `vite.config.ts`) : le logo s'affiche avec la page,
 * sans requete supplementaire. C'est ce qui permet a la page de demarrage de
 * ne jamais apparaitre vide.
 */
export type VarianteLogo = "couleur" | "blanc";
export type DispositionLogo = "cote" | "haut";

const FICHIERS: Record<VarianteLogo, Record<DispositionLogo, string>> = {
  couleur: { cote: couleurCote, haut: couleurHaut },
  blanc: { cote: blancCote, haut: blancHaut },
};

/** Proportions d'origine, pour reserver la place exacte et eviter tout saut. */
const PROPORTIONS: Record<DispositionLogo, { l: number; h: number }> = {
  cote: { l: 158, h: 35 },
  haut: { l: 307, h: 177 },
};

export default function Logo({
  variante = "couleur",
  disposition = "cote",
  hauteur = 28,
  className,
}: {
  variante?: VarianteLogo;
  disposition?: DispositionLogo;
  hauteur?: number;
  className?: string;
}) {
  const { l, h } = PROPORTIONS[disposition];
  return (
    <img
      src={FICHIERS[variante][disposition]}
      alt="Group Achat"
      width={Math.round((hauteur * l) / h)}
      height={hauteur}
      className={className}
      /* Le logo fait partie de la premiere impression : jamais differe. */
      fetchPriority="high"
      decoding="async"
    />
  );
}
