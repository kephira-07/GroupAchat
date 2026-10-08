/**
 * Photo 96 x 96, coins 12 (§2.3). Seule la photo est arrondie : c'est elle qui
 * donne sa structure a la ligne.
 *
 * Quand la photo manque, une tuile `surface-douce` **nue** tient sa place
 * exacte — pas d'icone, pas de pictogramme de remplissage : le §1.0 regle 7
 * interdit tout element purement decoratif, et l'etat de chargement de
 * l'ecran 1 est decrit de la meme facon, « fond `surface-douce`, sans logo ni
 * texte ». La mise en page ne bouge donc pas selon que la photo est la ou non.
 *
 * `loading="lazy"` : sur une liste de dix photos et un forfait de donnees
 * limite, seules les lignes atteintes par le defilement sont telechargees.
 */
export default function Vignette({
  photo,
  alt,
  attenuee = false,
}: {
  photo?: string;
  /** Ce que la photo montre. Vide si elle est purement illustrative. */
  alt?: string;
  attenuee?: boolean;
}) {
  const cadre = `size-24 shrink-0 overflow-hidden rounded-xl bg-surface-douce ${
    attenuee ? "opacity-40" : ""
  }`;

  if (!photo) {
    return <div className={cadre} role="presentation" />;
  }

  return (
    <img
      src={photo}
      alt={alt ?? ""}
      width={96}
      height={96}
      loading="lazy"
      decoding="async"
      className={`${cadre} object-cover`}
    />
  );
}
