import { useCallback, useEffect, useRef, useState } from "react";
import { ANNONCEURS } from "../../donnees/annonceurs";
import { IconeRetour } from "../../ui/Icones";

/**
 * `BandeauPartenaires` — SPEC_ECRANS_FIGMA.md §2.14, §9.3 du cahier des
 * charges. L'emplacement publicitaire vendu aux entreprises, ici en bannieres
 * illustrees qui defilent seules.
 *
 * ⚠️ **Le defilement automatique est un ecart assume avec le §2.14**, qui
 * ecrit « pas de rotation automatique : un contenu qui bouge seul au-dessus
 * d'un fil qu'on fait defiler est desagreable et empeche de toucher ce qu'on
 * visait ». La demande est explicite et posterieure, donc elle s'applique —
 * mais la gene decrite par la spec est reelle, et quatre garde-fous la
 * ramenent a peu de chose :
 *
 * - **la rotation s'arrete au survol et au focus clavier**, donc elle ne
 *   derobe jamais la cible d'un clic en cours ;
 * - **elle s'arrete aussi des qu'on fait defiler a la main**, et ne reprend
 *   pas : un geste de l'utilisateur l'emporte sur l'automatisme ;
 * - **elle ne demarre pas du tout** si le systeme demande a reduire les
 *   animations — reglage d'accessibilite courant sur Android ;
 * - **elle se met en pause quand l'onglet est en arriere-plan**, pour ne pas
 *   faire tourner une minuterie et des images dans le vide sur un forfait de
 *   donnees limite.
 *
 * Le §2.14 est a corriger, sans quoi il contredit l'ecran construit.
 *
 * **Les deux autres regles du §2.14 tiennent, et elles ne sont pas
 * negociables :** la mention « Sponsorise » est affichee — obligation de
 * loyaute, pas option de mise en page — et une banniere ne porte **ni prix ni
 * bouton « Commander »**. Sur un produit qui vend la confiance, laisser
 * confondre une publicite et un groupage est le genre d'erreur qui coute cher.
 *
 * **Variante `aucun-annonceur` : le bandeau disparait entierement.** Pas de
 * « Votre publicite ici », pas de place vide — un emplacement vide fait plus
 * de mal qu'une absence.
 *
 * Les annonceurs et les visuels sont **fictifs** : voir `donnees/annonceurs.ts`.
 */

/** Assez pour lire une accroche, assez court pour que le suivant arrive. */
const INTERVALLE_MS = 5000;

export default function BandeauPartenaires() {
  const [indice, setIndice] = useState(0);
  const [enPause, setEnPause] = useState(false);
  /** Un geste manuel coupe la rotation pour de bon. */
  const [abandonnee, setAbandonnee] = useState(false);
  const piste = useRef<HTMLUListElement>(null);
  const defilementAutomatique = useRef(false);

  const total = ANNONCEURS.length;

  const allerA = useCallback((cible: number) => {
    const element = piste.current;
    if (!element) {
      return;
    }
    const prochain = (cible + ANNONCEURS.length) % ANNONCEURS.length;
    defilementAutomatique.current = true;
    element.scrollTo({
      left: prochain * element.clientWidth,
      behavior: "smooth",
    });
    setIndice(prochain);
    // Le temps que le defilement doux se termine avant de reecouter.
    window.setTimeout(() => {
      defilementAutomatique.current = false;
    }, 600);
  }, []);

  // La rotation elle-meme, avec ses quatre conditions d'arret.
  useEffect(() => {
    if (total < 2 || enPause || abandonnee) {
      return;
    }
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }
    const minuteur = window.setInterval(() => {
      if (!document.hidden) {
        allerA(indice + 1);
      }
    }, INTERVALLE_MS);
    return () => window.clearInterval(minuteur);
  }, [indice, enPause, abandonnee, total, allerA]);

  // Un defilement au doigt ou a la molette met fin a la rotation.
  useEffect(() => {
    const element = piste.current;
    if (!element) {
      return;
    }
    const auDefilement = () => {
      const position = Math.round(element.scrollLeft / element.clientWidth);
      setIndice(position);
      if (!defilementAutomatique.current) {
        setAbandonnee(true);
      }
    };
    element.addEventListener("scroll", auDefilement, { passive: true });
    return () => element.removeEventListener("scroll", auDefilement);
  }, []);

  if (total === 0) {
    return null;
  }

  return (
    <section
      aria-label="Partenaires"
      aria-roledescription="carrousel"
      onMouseEnter={() => setEnPause(true)}
      onMouseLeave={() => setEnPause(false)}
      onFocusCapture={() => setEnPause(true)}
      onBlurCapture={() => setEnPause(false)}
      className="py-4"
    >
      <div className="group relative overflow-hidden rounded-xl">
        <ul
          ref={piste}
          className="defilement-discret relative flex snap-x snap-mandatory overflow-x-auto"
        >
          {ANNONCEURS.map((annonceur, position) => (
            <li
              key={annonceur.id}
              aria-roledescription="diapositive"
              aria-label={`${position + 1} sur ${total}`}
              className="w-full shrink-0 snap-start"
            >
              <button
                type="button"
                /* Plus basse sur grand ecran : une banniere de 400 px de haut
                   repousse le catalogue sous la ligne de flottaison. */
                className="relative block aspect-3/1 w-full overflow-hidden text-left lg:aspect-[4/1]"
              >
                <img
                  src={annonceur.image}
                  alt={annonceur.imageAlt}
                  loading={position === 0 ? "eager" : "lazy"}
                  decoding="async"
                  className="absolute inset-0 size-full object-cover"
                />
                {/* Le voile porte le contraste du texte blanc, exactement
                    comme sur le fil (§1.3). */}
                <span
                  aria-hidden="true"
                  className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/45 to-transparent"
                />
                {/* `pl-16` : le texte demarre apres la fleche de gauche, qui est
                    centree verticalement du meme cote. Sans ca, les deux se
                    superposent des que la souris entre dans la banniere. */}
                <span className="absolute inset-y-0 left-0 flex max-w-[70%] flex-col justify-center gap-1 pr-5 pl-16 lg:pl-20">
                  <span className="text-lg font-semibold text-white lg:text-2xl">
                    {annonceur.nom}
                  </span>
                  <span className="text-sm text-white/90 lg:text-base">
                    {annonceur.accroche}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>

        {total > 1 ? (
          <>
            <FlecheBanniere
              sens="precedent"
              onClick={() => {
                setAbandonnee(true);
                allerA(indice - 1);
              }}
            />
            <FlecheBanniere
              sens="suivant"
              onClick={() => {
                setAbandonnee(true);
                allerA(indice + 1);
              }}
            />

            <div className="absolute right-4 bottom-3 flex gap-1.5">
              {ANNONCEURS.map((annonceur, position) => (
                <button
                  key={annonceur.id}
                  type="button"
                  aria-label={`Aller à l'annonce ${position + 1}`}
                  aria-current={position === indice}
                  onClick={() => {
                    setAbandonnee(true);
                    allerA(position);
                  }}
                  className="p-1.5"
                >
                  <span
                    className={`block h-1.5 rounded-full transition-all ${
                      position === indice ? "w-5 bg-white" : "w-1.5 bg-white/60"
                    }`}
                  />
                </button>
              ))}
            </div>
          </>
        ) : null}
      </div>

      {/* Discret mais present. C'est une obligation de loyaute (§9.3). */}
      <p className="mt-1.5 text-xs text-texte-secondaire">Sponsorisé</p>
    </section>
  );
}

function FlecheBanniere({
  sens,
  onClick,
}: {
  sens: "precedent" | "suivant";
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={sens === "precedent" ? "Annonce précédente" : "Annonce suivante"}
      /* Visibles au survol et au clavier seulement : la banniere n'est pas
         l'endroit ou l'on veut attirer l'oeil en permanence. */
      className={`absolute top-1/2 flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-texte opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100 ${
        sens === "precedent" ? "left-3" : "right-3"
      }`}
    >
      <IconeRetour
        taille={18}
        className={sens === "suivant" ? "rotate-180" : undefined}
      />
    </button>
  );
}
