import { useMemo, useState } from "react";
import BandeauConfiance from "../composants/BandeauConfiance";
import BandeauPartenaires from "../composants/BandeauPartenaires";
import CarteUrgente from "../composants/CarteUrgente";
import PucesFiltresActifs from "../composants/PucesFiltresActifs";
import TiroirFiltres from "../composants/TiroirFiltres";
import CarteGroupage from "../composants/CarteGroupage";
import LigneGroupage from "../composants/LigneGroupage";
import RechercheEtFiltres from "../composants/RechercheEtFiltres";
import {
  compterParCategorie,
  filtreActif,
  filtrerEtTrier,
  type Filtres,
  separerParUrgence,
} from "../../domaine/filtres";
import type { Groupage } from "../../domaine/groupage";
import { useCatalogue } from "../../api/CatalogueContexte";
import { ErreurReseau, ListeEnChargement } from "../../ui/EtatReseau";
import EnTeteApplication from "../mise-en-page/EnTeteApplication";
import PiedPage from "../mise-en-page/PiedPage";
import Bouton from "../../ui/Bouton";
import Carrousel from "../../ui/Carrousel";
import EtatVide from "../../ui/EtatVide";
import { IconeCarton, IconeFiltre } from "../../ui/Icones";

/**
 * Le catalogue — ecran 2 sur telephone, page d'accueil du site sur ordinateur.
 *
 * **Deux architectures, pas deux feuilles de style.**
 *
 * | | Telephone | Ordinateur (≥ 768 px) |
 * |---|---|---|
 * | Entree | Le fil plein ecran, puis cet ecran | **Cette page directement** |
 * | Resultats | Des **lignes** separees d'un filet (§2.3) | Une **grille de cartes** |
 * | Filtres | Des puces defilantes, faute de place | Une colonne laterale |
 * | Navigation | `BarreNav` en bas | En-tete et pied de page |
 *
 * La ligne du §2.3 reste la bonne forme sur 390 px, pour les raisons que la
 * spec donne : sur fond blanc une carte blanche n'existe pas, et une liste de
 * lignes defile mieux sur un telephone d'entree de gamme. Ces deux raisons
 * tombent sur une grille de bureau, ou il faut bien delimiter des colonnes
 * voisines.
 *
 * **Ce fichier ne contient aucune regle de filtrage.** Le modele, les seuils,
 * le tri et le partage des deux rangees viennent tous de `domaine/filtres.ts`.
 * C'est ce qui garantit que la puce « Se termine bientot » et le carrousel du
 * meme nom montrent exactement les memes groupages.
 *
 * Aucun mur d'authentification des deux cotes (§1.5) : on parcourt et on
 * filtre librement, le compte n'est demande qu'au moment de payer.
 *
 * Deux ecarts assumes : il n'y a **pas de jauge** de participants (§2.5) — un
 * groupage n'ayant ni plafond ni minimum, une jauge n'aurait aucun
 * denominateur reel — et aucun prix barre nulle part (§3).
 */
export default function GroupagesOuverts({
  estBureau,
  filtres,
  onFiltres,
  onOuvrirGroupage,
  onDemanderProduit,
}: {
  estBureau: boolean;
  filtres: Filtres;
  onFiltres: (filtres: Filtres) => void;
  onOuvrirGroupage: (groupage: Groupage) => void;
  onDemanderProduit: () => void;
}) {
  const { groupages, chargement, erreur, recharger } = useCatalogue();

  /* ⚠️ `groupages` passe explicitement aux deux fonctions de filtrage, qui
     acceptaient jusqu'ici une source par defaut lue dans les constantes. Sans
     ce passage, l'ecran filtrerait un catalogue fige pendant que le reste de
     l'application affiche celui du serveur — defaut qui ne se verrait qu'au
     premier produit ajoute en base. */
  const comptesCategories = useMemo(
    () => compterParCategorie(groupages),
    [groupages],
  );
  const resultats = useMemo(
    () => filtrerEtTrier(filtres, groupages),
    [filtres, groupages],
  );
  const nombre = resultats.length;

  /** Le tiroir de filtres. Ferme par defaut : on arrive pour voir, pas pour regler. */
  const [tiroirOuvert, setTiroirOuvert] = useState(false);

  /**
   * Combien de filtres sont poses, pour la pastille du bouton.
   *
   * ⚠️ **La recherche en fait partie, et le tri non.** Un tri ne retire aucun
   * groupage de la liste — annoncer « 1 filtre » parce qu'on a choisi « prix
   * croissant » ferait chercher un filtrage qui n'existe pas. La recherche, à
   * l'inverse, cache des résultats : elle compte.
   */
  const nombreFiltresActifs =
    (filtres.recherche.trim() ? 1 : 0) +
    (filtres.categorie !== "toutes" ? 1 : 0) +
    (filtres.termineBientot ? 1 : 0) +
    (filtres.petitPrix ? 1 : 0);

  const etatVide = (
    <EtatVide
      titre={
        filtres.recherche.trim()
          ? `Aucun groupage pour « ${filtres.recherche.trim()} »`
          : "Aucun groupage ne correspond"
      }
      explication="Élargissez votre recherche, ou demandez ce produit : un groupeur peut le lancer."
      actionLibelle="Demander ce produit"
      onAction={onDemanderProduit}
    />
  );

  const finDeListe = (
    <div className="border-t border-bordure px-4 py-8 text-center lg:px-0 lg:py-12">
      <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-primaire-fond text-primaire-texte-sur-fond">
        <IconeCarton taille={24} />
      </span>
      <p className="mt-3 font-medium text-texte">
        Vous avez vu tous les groupages ouverts
      </p>
      <div className="mx-auto mt-4 max-w-72">
        <Bouton style="secondaire" onClick={onDemanderProduit}>
          Créer une demande d&apos;achat groupé
        </Bouton>
      </div>
    </div>
  );

  /* ── Ordinateur ──────────────────────────────────────────────────────── */
  if (estBureau) {
    /**
     * **La rangee « Les autres groupages » a ete retiree.**
     *
     * Elle rejouait, dans un carrousel a defiler, exactement les cartes que la
     * grille « Tous les groupages ouverts » montre juste en dessous — et sans
     * rien a faire valoir, puisque c'etait par construction la rangee de ce
     * qui ne presse pas. Deux carrousels avant la grille, c'etaient deux
     * gestes avant le catalogue. **Rien n'est perdu** : la grille reste la
     * liste complete, filtres compris.
     *
     * « Se termine bientot » reste, et son maintien est tout le propos : elle
     * porte la seule information qui justifie de sortir un groupage du lot,
     * le temps restant (§2.4).
     */
    const { presqueClotures } = separerParUrgence(resultats);

    /**
     * Le bandeau de tete et la publicite ne s'affichent que sur l'accueil, pas
     * pendant une recherche. Quelqu'un qui a tape « riz » veut ses resultats,
     * pas un bandeau de marque a traverser avant de les atteindre.
     */
    const enRecherche = filtreActif(filtres);

    /**
   * L'attente prend **la forme de la grille**, pas celle d'un tourniquet.
   *
   * Des rectangles a la place des vignettes donnent la bonne hauteur tout de
   * suite : rien ne bouge au moment ou les produits arrivent. Un tourniquet
   * centre, lui, fait sauter toute la page quand le contenu le remplace — et
   * sur la connexion visee par le §5, ce saut arrive apres deux secondes,
   * c'est-a-dire juste au moment ou l'œil s'est pose.
   */
  if (chargement) {
    return (
      <div className="pb-20">
        <EnTeteApplication notifications={1} />
        <ListeEnChargement nombre={6} className="px-4" />
      </div>
    );
  }

  if (erreur) {
    return (
      <div className="pb-20">
        <EnTeteApplication notifications={1} />
        <ErreurReseau erreur={erreur} onReessayer={recharger} />
      </div>
    );
  }

  return (
      <>
        {enRecherche ? null : (
          <>
            {/*
             * Le lavis orange du bandeau de tete — la seule surface coloree de
             * la page, et elle **se degrade vers le blanc**. Le catalogue en
             * dessous garde donc le fond blanc unique que le §1.2 demande, et
             * la couleur ne sert qu'a marquer l'entree du site.
             *
             * ⚠️ **Les deux bouts du degrade sont calcules, pas estimes.** Un
             * texte pose sur un degrade doit tenir sur la teinte la plus claire
             * comme sur la plus foncee, donc chaque paire est verifiee deux
             * fois :
             *
             * | Jeton de texte | sur `primaire-fond` | sur blanc |
             * |---|---|---|
             * | `texte` | 16,08:1 | 17,79:1 |
             * | `texte-secondaire` | 5,42:1 | 6,00:1 |
             * | `primaire-texte-sur-fond` | 4,87:1 | 5,39:1 |
             * | `confiance` | 9,36:1 | 10,36:1 |
             *
             * **`primaire` (#CC4A00) n'y figure pas, et c'est delibere.** Il ne
             * tient qu'a **4,17:1** sur `primaire-fond`, sous le seuil de
             * 4,5:1 : c'est exactement la raison d'etre du jeton
             * `primaire-texte-sur-fond`, qui existe pour que l'orange du texte
             * change avec son fond au lieu de perdre son contraste.
             */}
            <div className="border-b border-bordure bg-gradient-to-b from-primaire-fond to-white">
              {/*
               * ⚠️ **Plus de `max-w-[1280px]`, et c'est voulu.** La page etait
               * posee dans une colonne centree de 1 280 px : sur un ecran de
               * 1 920, cela laissait **320 px de vide de chaque cote**, et la
               * banniere partenaires — une image — s'arretait au milieu de
               * nulle part.
               *
               * Les conteneurs prennent donc toute la largeur, et il ne reste
               * que la gouttiere qui empeche le texte de toucher le bord.
               *
               * La banniere, elle, n'a meme pas de gouttiere : elle va d'un
               * bord a l'autre. Une image qui touche les bords est une image ;
               * une image avec 32 px de blanc autour est une vignette.
               */}
              <BandeauPartenaires />

              <div className="px-4 py-10 lg:px-8 lg:py-14">
                <div className="max-w-2xl">
                  {/*
                   * L'exergue bleu. Le §1.2 reserve le bleu a la confiance cote
                   * acheteur, et il travaille ici pour la meme raison qu'au
                   * `BandeauConfiance` : c'est parce que tout le reste est
                   * orange qu'il arrete l'oeil. Pastille blanche plutot que
                   * `confiance-fond`, qui se perdrait sur le lavis — deux
                   * teintes tres claires cote a cote ne dessinent plus de
                   * forme.
                   */}
                  {/*
                   * ⚠️ **Ecart assume au §1.3**, qui fixe `Titre-ecran` a 24 px.
                   * Cette echelle est celle d'un ecran de 390 px ; a 1 280 px
                   * un titre de 24 px ne tient plus le haut d'une page, il
                   * flotte. Le titre suit donc la largeur de la fenetre :
                   *
                   * | Fenetre | 4,2vw | Rendu |
                   * |---|---|---|
                   * | 768 px *(seuil bureau)* | 32,3 px | **32 px** |
                   * | 1 024 px | 43,0 px | **43 px** |
                   * | 1 143 px et au-dela | ≥ 48 px | **48 px** *(plafond)* |
                   *
                   * La borne basse de 24 px n'est, elle, **jamais atteinte
                   * ici** : il faudrait une fenetre de moins de 571 px, et en
                   * dessous de 768 px c'est la branche telephone qui s'affiche,
                   * avec le jeton `Titre-ecran` de la spec. Elle reste comme
                   * garde-fou, pas comme palier reel.
                   */}
                  <h1 className="text-[clamp(1.5rem,4.2vw,3rem)] leading-[1.06] font-semibold tracking-tight text-texte">
                    Le prix de gros,{" "}
                    <span className="text-primaire-texte-sur-fond">
                      à plusieurs
                    </span>
                  </h1>

                  {/*
                   * Le seul endroit de la page ou l'orange vif `marque`
                   * s'emploie. Il le peut parce que **c'est un trait, pas du
                   * texte** : #FF6A00 ne tient qu'a 2,87:1 sur blanc, ce qui
                   * l'interdit a toute lettre, mais un filet decoratif n'a pas
                   * de contraste a tenir.
                   */}
                  <span
                    aria-hidden="true"
                    className="mt-5 block h-1 w-16 rounded-full bg-marque"
                  />

                  {/*
                   * 18 px sur bureau. Le §1.3 donne 16 px comme **plancher**,
                   * pas comme plafond : une accroche lue a un metre d'un ecran
                   * d'ordinateur gagne les deux pixels, la ou le corps de
                   * texte du catalogue les garderait pour lui.
                   */}
                  <p className="mt-4 max-w-xl text-base text-texte-secondaire lg:text-lg">
                    Rejoignez un groupage et payez votre part. Groupeurs
                    sélectionnés, paiement détenu jusqu&apos;à la clôture.
                  </p>

                </div>
              </div>
            </div>

            {/* Ce qui presse d'abord : le temps restant est le seul element
                de pression de l'application (§2.4). Sur fond blanc, pour que
                la couleur reste au bandeau de tete. */}
            {presqueClotures.length > 0 ? (
              <div className="px-4 pt-10 lg:px-8 lg:pt-12">
                <Carrousel
                  titre="Se termine bientôt"
                  sousTitre={`${presqueClotures.length} groupage${
                    presqueClotures.length > 1 ? "s" : ""
                  } ferme${presqueClotures.length > 1 ? "nt" : ""} dans moins de 48 h`}
                  /* ⚠️ La seule rangee du site qui tourne seule. Son argument
                     est le temps : ce qui ferme dans 48 h et n'est jamais vu
                     est definitivement perdu. Les quatre garde-fous sont dans
                     l'en-tete de `ui/Carrousel.tsx`. */
                  automatique
                  action={
                    /*
                     * « Voir plus » ne mene pas vers une page de plus : il
                     * **pose le filtre** `termineBientot` sur le catalogue qui
                     * est deja en dessous.
                     *
                     * Une page separee aurait fallu l'ecrire, la router et la
                     * tenir a jour, pour montrer exactement ce que la grille
                     * sait deja montrer. Et le resultat est meilleur : on
                     * arrive sur une liste **filtrable**, ou le filtre pose
                     * apparait en puce et se retire d'un clic.
                     */
                    <button
                      type="button"
                      onClick={() => {
                        onFiltres({ ...filtres, termineBientot: true });
                        /* Sans ce defilement, le filtre s'applique a une
                           grille restee hors champ : on clique et rien ne
                           semble se passer. */
                        document
                          .getElementById("catalogue")
                          ?.scrollIntoView({ behavior: "smooth" });
                      }}
                      className="rounded-full px-3 py-2 text-sm font-semibold text-primaire underline underline-offset-2 hover:text-primaire-presse"
                    >
                      Voir plus
                    </button>
                  }
                >
                  {presqueClotures.map((groupage) => (
                    <CarteUrgente
                      key={groupage.id}
                      groupage={groupage}
                      onOuvrir={onOuvrirGroupage}
                    />
                  ))}
                </Carrousel>
              </div>
            ) : null}
          </>
        )}

        <div
          id="catalogue"
          className="border-t border-bordure px-4 py-6 lg:px-8 lg:py-8"
        >
          <div>
            <div className="min-w-0 flex-1">
              <div>
                <h2 className="text-2xl font-semibold tracking-tight text-texte lg:text-[28px]">
                  Tous les groupages ouverts
                </h2>
                {/* Le compteur en deux graisses : le chiffre se lit seul, la
                    phrase ne fait que le qualifier. Pas d'opacite ici — les
                    deux niveaux sont les deux jetons de texte du §1.2, dont le
                    contraste est connu (17,79:1 et 6,00:1 sur blanc). */}
                <p aria-live="polite" className="mt-1 text-texte-secondaire">
                  {nombre === 0 ? (
                    "Aucun groupage ne correspond"
                  ) : (
                    <>
                      <strong className="font-semibold text-texte">
                        {nombre}
                      </strong>{" "}
                      {`groupage${nombre > 1 ? "s" : ""} ouvert${
                        nombre > 1 ? "s" : ""
                      }`}
                    </>
                  )}
                </p>
              </div>

              {/*
               * ⚠️ **La colonne de filtres est devenue un bouton**, ce que le
               * §2 interdisait : « Jamais derriere un bouton "Filtres" — ce
               * serait un menu cache. » La demande est explicite et
               * posterieure, donc elle s'applique ; la raison du §2 reste
               * vraie, et deux choses la ramenent a peu de chose :
               *
               * - **le bouton porte le nombre de filtres actifs**, lisible
               *   sans ouvrir ;
               * - **les filtres actifs restent affiches a cote**, en puces,
               *   et se retirent d'un clic. Ce qui est range, c'est le choix
               *   des filtres ; leur etat ne l'est jamais.
               *
               * Si l'une des deux saute, le tiroir redevient le menu cache que
               * le §2 decrit.
               */}
              <div className="mt-5 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => setTiroirOuvert(true)}
                  className="inline-flex h-11 shrink-0 items-center gap-2 rounded-full border border-bordure px-4 font-medium text-texte hover:border-primaire hover:text-primaire"
                >
                  <IconeFiltre taille={18} />
                  Filtrer
                  {nombreFiltresActifs > 0 ? (
                    <span className="flex size-5 items-center justify-center rounded-full bg-primaire text-xs font-bold text-white">
                      {nombreFiltresActifs}
                    </span>
                  ) : null}
                </button>

                <PucesFiltresActifs filtres={filtres} onChanger={onFiltres} />
              </div>

              {nombre === 0 ? (
                etatVide
              ) : (
                <>
                  <ul className="mt-6 grid grid-cols-2 gap-4 lg:mt-8 lg:gap-6 xl:grid-cols-3">
                    {resultats.map((groupage) => (
                      <CarteGroupage
                        key={groupage.id}
                        groupage={groupage}
                        onOuvrir={onOuvrirGroupage}
                      />
                    ))}
                  </ul>
                  <div className="mt-12">{finDeListe}</div>
                </>
              )}
            </div>
          </div>
        </div>

        <TiroirFiltres
          ouvert={tiroirOuvert}
          onFermer={() => setTiroirOuvert(false)}
          filtres={filtres}
          onChanger={onFiltres}
          comptesCategories={comptesCategories}
          total={groupages.length}
          nombreResultats={nombre}
        />

        <PiedPage />
      </>
    );
  }

  /* ── Telephone : lignes, puces, barre de navigation ──────────────────── */
  return (
    <div className="pb-18">
      <EnTeteApplication
        recherche={filtres.recherche}
        onRecherche={(recherche) => onFiltres({ ...filtres, recherche })}
        onDemander={onDemanderProduit}
        notifications={1}
      />

      <div className="px-4 pt-4">
        <BandeauConfiance />
      </div>

      <div className="mt-4">
        <RechercheEtFiltres
          filtres={filtres}
          onChanger={onFiltres}
          comptesCategories={comptesCategories}
          nombreResultats={nombre}
        />
      </div>

      {nombre === 0 ? (
        etatVide
      ) : (
        <>
          <ul className="px-4">
            {resultats.map((groupage) => (
              <LigneGroupage
                key={groupage.id}
                groupage={groupage}
                onOuvrir={onOuvrirGroupage}
              />
            ))}
          </ul>
          {finDeListe}
        </>
      )}
    </div>
  );
}
