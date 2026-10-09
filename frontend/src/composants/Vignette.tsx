/**
 * Photo du produit, carree, coins 12 (§2.3). Seule la photo est arrondie :
 * c'est elle qui donne sa structure a la ligne.
 *
 * ## Trois tailles, et il faut la demander
 *
 * 96 px sur une ligne de liste (§2.3), 64 px dans un recapitulatif de
 * commande, 48 px dans une liste dense.
 *
 * ⚠️ **La taille etait figee a 96 px**, et quatre ecrans l'enveloppaient dans
 * une boite plus petite en croyant la reduire — `<div className="size-12">`.
 * Une image de 96 px dans une boite de 48 n'est pas reduite : elle **deborde**
 * par le haut et par le bas, et sur une liste elle mord sur les lignes
 * voisines. Le defaut se voyait sur le tableau de bord du groupeur, les
 * questions recues et l'ecran 10.
 *
 * Les classes sont ecrites en toutes lettres : Tailwind ne voit pas les noms
 * fabriques a l'execution, et `size-${n}` ne produirait aucune regle.
 *
 * Quand la photo manque, une tuile `surface-douce` **nue** tient sa place
 * exacte — pas d'icone, pas de pictogramme : le §1.0 regle 7 interdit tout
 * element purement decoratif, et la mise en page ne bouge donc pas selon que
 * la photo est la ou non.
 *
 * `loading="lazy"` : sur une liste de dix photos et un forfait de donnees
 * limite, seules les lignes atteintes par le defilement sont telechargees.
 */
const CADRES = {
  48: "size-12",
  64: "size-16",
  96: "size-24",
} as const;

export default function Vignette({
  photo,
  alt,
  taille = 96,
  attenuee = false,
}: {
  photo?: string;
  /** Ce que la photo montre. Vide si elle est purement illustrative. */
  alt?: string;
  /** Le cote en pixels. 96 par defaut, comme la ligne de liste du §2.3. */
  taille?: keyof typeof CADRES;
  attenuee?: boolean;
}) {
  const cadre = `${CADRES[taille]} shrink-0 overflow-hidden rounded-xl bg-surface-douce ${
    attenuee ? "opacity-40" : ""
  }`;

  if (!photo) {
    return <div className={cadre} role="presentation" />;
  }

  return (
    <img
      src={photo}
      alt={alt ?? ""}
      width={taille}
      height={taille}
      loading="lazy"
      decoding="async"
      className={`${cadre} object-cover`}
    />
  );
}
