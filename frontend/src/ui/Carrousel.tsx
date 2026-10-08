import { useEffect, useId, useRef, useState } from "react";
import { IconeRetour } from "./Icones";

/**
 * Carrousel horizontal — les rangees de la page d'accueil du site.
 *
 * **Il defile, il ne tourne pas tout seul.** Le §2.14 tranche ce point pour le
 * bandeau partenaires, et la raison vaut pour toutes les rangees : un contenu
 * qui bouge seul pendant qu'on lit est desagreable, et il fait rater ce qu'on
 * visait au moment du clic. Ici, rien ne bouge sans un geste.
 *
 * Le defilement est celui du navigateur (`scroll-snap`), pas une animation
 * calculee en JavaScript : c'est plus fluide, ca marche au doigt comme a la
 * molette, et ca ne coute rien sur une machine modeste.
 *
 * Les fleches **disparaissent quand elles ne servent a rien** — en bout de
 * course ou quand tout tient a l'ecran. Une fleche grisee qui reste la est un
 * bouton qui ment.
 *
 * Le contenu reste atteignable au clavier et au lecteur d'ecran : c'est une
 * liste, et le defilement n'est qu'une facon de la montrer.
 */
export default function Carrousel({
  titre,
  sousTitre,
  children,
}: {
  titre: string;
  sousTitre?: string;
  children: React.ReactNode;
}) {
  /* Sans nom accessible, une <section> n'est pas annoncee comme une region :
     un lecteur d'ecran traverse alors les rangees sans dire laquelle il lit. */
  const idTitre = useId();
  const piste = useRef<HTMLUListElement>(null);
  const [peutReculer, setPeutReculer] = useState(false);
  const [peutAvancer, setPeutAvancer] = useState(false);

  useEffect(() => {
    const element = piste.current;
    if (!element) {
      return;
    }
    const mesurer = () => {
      const reste =
        element.scrollWidth - element.clientWidth - element.scrollLeft;
      setPeutReculer(element.scrollLeft > 8);
      setPeutAvancer(reste > 8);
    };
    mesurer();
    element.addEventListener("scroll", mesurer, { passive: true });
    const observateur = new ResizeObserver(mesurer);
    observateur.observe(element);
    return () => {
      element.removeEventListener("scroll", mesurer);
      observateur.disconnect();
    };
  }, [children]);

  /** Une « page » = la largeur visible moins un peu, pour garder un repere. */
  const defiler = (sens: -1 | 1) => {
    const element = piste.current;
    if (!element) {
      return;
    }
    element.scrollBy({
      left: sens * (element.clientWidth * 0.85),
      behavior: "smooth",
    });
  };

  return (
    <section aria-labelledby={idTitre} className="mt-10 first:mt-0">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2
            id={idTitre}
            className="text-xl font-semibold text-texte lg:text-2xl"
          >
            {titre}
          </h2>
          {sousTitre ? (
            <p className="mt-0.5 text-sm text-texte-secondaire">{sousTitre}</p>
          ) : null}
        </div>

        <div className="flex shrink-0 gap-2">
          <FlecheCarrousel
            sens="precedent"
            visible={peutReculer}
            onClick={() => defiler(-1)}
          />
          <FlecheCarrousel
            sens="suivant"
            visible={peutAvancer}
            onClick={() => defiler(1)}
          />
        </div>
      </div>

      <ul
        ref={piste}
        /*
         * `-mx-4 px-4` : les cartes touchent le bord de la zone de defilement
         * mais restent alignees sur la marge au repos.
         *
         * `relative` n'est pas decoratif et il ne faut pas le retirer. Une
         * zone de defilement en `position: static` n'est pas le bloc
         * conteneur de ses descendants positionnes en absolu : ceux-ci se
         * calent alors sur un ancetre plus haut, **echappent au clipping** et
         * etirent toute la page vers la droite. Sans lui, le site gagne une
         * barre de defilement horizontale et 650 px de vide.
         */
        className="defilement-discret relative mt-4 -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-1 lg:gap-6"
      >
        {children}
      </ul>
    </section>
  );
}

function FlecheCarrousel({
  sens,
  visible,
  onClick,
}: {
  sens: "precedent" | "suivant";
  visible: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={sens === "precedent" ? "Précédent" : "Suivant"}
      aria-hidden={!visible}
      tabIndex={visible ? 0 : -1}
      className={`flex size-11 items-center justify-center rounded-full border border-bordure text-texte transition-opacity hover:border-primaire hover:text-primaire ${
        visible ? "opacity-100" : "pointer-events-none opacity-0"
      }`}
    >
      <IconeRetour
        taille={20}
        className={sens === "suivant" ? "rotate-180" : undefined}
      />
    </button>
  );
}
