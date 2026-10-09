import { useEffect, useState } from "react";
import type { MediaProduit } from "../domaine/groupage";
import { IconeLecture } from "./Icones";

/**
 * La galerie de la fiche produit — jusqu'a 4 images et 2 videos.
 *
 * ## La regle qui commande tout le reste : rien ne se telecharge tout seul
 *
 * Le public vise a un **forfait de donnees limite** (§18.1), et une video pese
 * cent fois une photo. Trois consequences, et aucune n'est negociable :
 *
 * - **`preload="none"`** : tant que l'acheteur n'a pas appuye, la video ne
 *   coute rien. Sans cet attribut, le navigateur en telecharge le debut des
 *   l'ouverture de la fiche — pour une video qui, le plus souvent, ne sera
 *   jamais regardee ;
 * - **aucune lecture automatique**, nulle part. On voit l'affiche, on appuie ;
 * - **le son coupe au depart** (§1.6), parce qu'une fiche produit qui se met a
 *   parler dans un taxi se referme aussitot.
 *
 * ## Ce qui est montre quand il n'y a qu'une image
 *
 * **Rien de plus qu'avant** : pas de vignettes, pas de compteur, pas de
 * fleches. Une galerie d'un seul element est une galerie qui ment sur ce
 * qu'elle contient, et les commandes qu'elle affiche ne menent nulle part.
 *
 * ## L'accessibilite n'est pas une option ici
 *
 * Les vignettes sont de vrais boutons dans une liste, atteignables au clavier,
 * et celle qui est affichee porte `aria-current`. Le texte alternatif de
 * chaque image retombe sur le nom du produit quand le groupeur ne l'a pas
 * renseigne : un `alt` vide sur la photo principale d'une fiche d'achat laisse
 * un lecteur d'ecran annoncer « image », ce qui n'aide personne a decider.
 */
export default function GalerieMedia({
  medias,
  titre,
  children,
}: {
  medias: MediaProduit[];
  /** Le nom du produit — le repli du texte alternatif. */
  titre: string;
  /**
   * Ce qui se pose **sur** le media : retour, partage, pastille de statut.
   *
   * En `children` plutot qu'en proprietes nommees : la galerie n'a pas a
   * connaitre le detail de ce que l'ecran 3 superpose, et l'ecran 3 n'a pas a
   * refaire le cadre.
   */
  children?: React.ReactNode;
}) {
  const [actif, setActif] = useState(0);
  /** La video que l'acheteur a demandee. Avant ce geste, rien ne charge. */
  const [lance, setLance] = useState(false);

  /* Changer de media coupe la lecture en cours : sans ce retour a zero, on
     reviendrait sur une image avec le son d'une video qui tourne derriere. */
  useEffect(() => {
    setLance(false);
  }, [actif]);

  if (medias.length === 0) {
    return <div className="aspect-4/5 w-full bg-surface-douce lg:rounded-xl" />;
  }

  const media = medias[Math.min(actif, medias.length - 1)];
  const texte = media.alt?.trim() || titre;

  return (
    <div>
      <div className="relative aspect-4/5 w-full overflow-hidden bg-surface-douce lg:rounded-xl">
        {media.type === "image" ? (
          <img
            src={media.url}
            alt={texte}
            /* Seule la couverture est prioritaire : les autres ne sont
               demandees que si l'acheteur les ouvre. */
            fetchPriority={actif === 0 ? "high" : "auto"}
            decoding="async"
            className="size-full object-cover"
          />
        ) : lance ? (
          /* `autoPlay` ne contredit pas la regle ci-dessus : cet element
             n'existe qu'apres l'appui. Sans lui, l'acheteur devrait appuyer
             deux fois — une pour demander la video, une pour la lancer. */
          <video
            src={media.url}
            poster={media.affiche}
            controls
            autoPlay
            muted
            playsInline
            className="size-full bg-black object-contain"
          >
            {texte}
          </video>
        ) : (
          <button
            type="button"
            onClick={() => setLance(true)}
            className="group size-full"
            aria-label={`Lire la vidéo : ${texte}`}
          >
            {media.affiche ? (
              <img
                src={media.affiche}
                alt=""
                decoding="async"
                className="size-full object-cover"
              />
            ) : null}
            {/* Le bouton est **pose sur** l'affiche, pas a cote : c'est la
                qu'on appuie d'instinct. Fond blanc a 92 % comme les autres
                commandes posees sur un media (§2.1).
                ⚠️ La mention est **sous le bouton, au centre**, et non en bas
                du cadre : le bas-gauche porte deja la pastille de statut, et
                les deux se chevauchaient. */}
            <span className="absolute inset-0 flex flex-col items-center justify-center gap-3">
              <span className="flex size-16 items-center justify-center rounded-full bg-white/92 text-texte">
                <IconeLecture taille={28} />
              </span>
              {/* Dit franchement ce que l'appui va couter. Sur un forfait
                  limite, c'est une information, pas un ornement. */}
              <span className="rounded-full bg-white/92 px-3 py-1 text-xs font-medium text-texte-secondaire">
                Vidéo — se lance quand vous appuyez
              </span>
            </span>
          </button>
        )}

        {children}
      </div>

      {/* ⚠️ Un seul media : aucune commande. Voir l'en-tete. */}
      {medias.length > 1 ? (
        <ul
          className="mt-3 flex gap-2 overflow-x-auto px-4 lg:px-0"
          aria-label={`Les ${medias.length} médias du produit`}
        >
          {medias.map((vignette, rang) => (
            <li key={`${vignette.url}-${rang}`} className="shrink-0">
              <button
                type="button"
                onClick={() => setActif(rang)}
                aria-current={rang === actif ? "true" : undefined}
                aria-label={
                  vignette.type === "video"
                    ? `Vidéo ${rang + 1}`
                    : `Photo ${rang + 1}`
                }
                className={`relative block size-16 overflow-hidden rounded-xl border-2 ${
                  rang === actif ? "border-texte" : "border-bordure"
                }`}
              >
                <img
                  src={vignette.type === "video" ? vignette.affiche : vignette.url}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  className="size-full bg-surface-douce object-cover"
                />
                {/* La pastille dit **avant l'appui** que c'est une video. Sans
                    elle, on clique sur ce qu'on croit etre une photo et on
                    declenche un telechargement qu'on n'avait pas demande. */}
                {vignette.type === "video" ? (
                  <span className="absolute inset-0 flex items-center justify-center bg-black/30 text-white">
                    <IconeLecture taille={18} />
                  </span>
                ) : null}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
