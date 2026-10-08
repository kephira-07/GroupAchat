import { useState } from "react";
import BandeauConfiance from "../composants/BandeauConfiance";
import Bouton, { BoutonAncre } from "../../ui/Bouton";
import {
  IconeCamion,
  IconeGroupage,
  IconeHorloge,
  IconePartager,
  IconeQuestion,
  IconeRetour,
  IconeVerifie,
} from "../../ui/Icones";
import PiedPage from "../mise-en-page/PiedPage";
import { type Groupage } from "../../domaine/groupage";
import {
  decrireTempsRestant,
  formaterDateCourte,
  formaterFrancs,
} from "../../domaine/format";
import { FRAIS_PROVISOIRES } from "../../domaine/livraison";

/**
 * Ecran 3 — Detail d'un groupage. SPEC_ECRANS_FIGMA.md ecran 3, mis en forme
 * d'apres la maquette fournie.
 *
 * **Objectif : donner tout ce qu'il faut pour decider de payer.** Le bouton ne
 * demande aucun compte (§1.5) — il ouvre l'ecran 5.
 *
 * **Deux mises en page.** Sur telephone, une seule colonne et le bouton ancre
 * en bas, comme la maquette. Sur ordinateur, la fiche produit classique d'un
 * site marchand : le media a gauche, et a droite un **bloc d'achat colle en
 * haut** qui reste visible pendant qu'on lit la fiche — prix, compteurs,
 * garantie, bouton. Un bouton ancre en bas d'ecran est un geste de pouce ; a
 * la souris, c'est le bloc d'achat qui doit suivre.
 *
 * Trois points de la spec qu'il ne faut pas relacher, quelle que soit la
 * largeur :
 *
 * - le `BandeauConfiance` est **avant le bouton, pas apres** ;
 * - les frais de livraison ne sont **jamais annonces comme un tarif unique**
 *   ici. A ce stade l'acheteur n'a pas dit ou il est, donc l'ecran ne peut pas
 *   connaitre son prix : « selon votre position », puis « a partir de
 *   1 000 F CFA ». Ecrire « 1 000 F partout » serait un engagement que le vrai
 *   calcul ne tiendra pas ;
 * - la derniere regle est a ecrire **exactement** comme elle l'est. Une
 *   fenetre de contestation fermee a la livraison est acceptable si elle est
 *   annoncee ; decouverte apres coup, elle est vecue comme une arnaque.
 *
 * Les questions sont **publiques** : il n'y a pas d'echange prive entre un
 * acheteur et un groupeur dans ce produit.
 *
 * ⚠️ Les blocs gris `surface-douce` viennent de la maquette et s'ecartent du
 * §1.0, qui demande de separer par le vide et un filet. La maquette l'emporte
 * parce qu'elle est la decision la plus recente, mais le §1.0 est a corriger.
 */
export default function DetailGroupage({
  groupage,
  estBureau,
  onRetour,
  onCommander,
  onQuestions,
}: {
  groupage: Groupage;
  estBureau: boolean;
  onRetour: () => void;
  onCommander: () => void;
  /** Vers l'ecran 10. Le seul canal entre acheteur et groupeur (§1.7). */
  onQuestions: () => void;
}) {
  const [descriptionDepliee, setDescriptionDepliee] = useState(false);
  const temps = decrireTempsRestant(groupage.heuresRestantes);

  const media = (
    <div className="relative aspect-4/5 w-full overflow-hidden bg-surface-douce lg:rounded-xl">
      {groupage.photo ? (
        <img
          src={groupage.photo}
          alt={groupage.photoAlt ?? groupage.produit}
          fetchPriority="high"
          decoding="async"
          className="size-full object-cover"
        />
      ) : null}

      {/* Les boutons en surimpression sont la pour le pouce. Sur ordinateur,
          le retour est dans le fil d'Ariane et le partage dans le bloc
          d'achat : deux retours a l'ecran seraient un de trop. */}
      {estBureau ? null : (
        <>
          <button
            type="button"
            onClick={onRetour}
            aria-label="Retour"
            className="absolute top-3 left-3 flex size-11 items-center justify-center rounded-full bg-white/92 text-texte"
          >
            <IconeRetour taille={20} />
          </button>
          <button
            type="button"
            aria-label="Partager ce groupage"
            className="absolute top-3 right-3 flex size-11 items-center justify-center rounded-full bg-white/92 text-texte"
          >
            <IconePartager taille={20} />
          </button>
        </>
      )}

      {/* `Statut` (§2.8) : « en cours » est un etat qui avance, donc orange. */}
      <span className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-white/92 px-3 py-1 text-xs font-semibold text-primaire-texte-sur-fond">
        <span aria-hidden="true" className="size-2 rounded-full bg-marque" />
        Groupage en cours
      </span>
    </div>
  );

  /** Titre, prix, compteurs, groupeur. Identique dans les deux mises en page. */
  const enTeteProduit = (
    <div>
      <h2 className="text-2xl font-semibold text-texte lg:text-3xl">
        {groupage.produit}
      </h2>

      {/* Le prix seul. Ni prix barre, ni pastille de reduction (§3). */}
      <p className="mt-2 flex items-baseline gap-2">
        <span className="text-[22px] font-bold text-primaire lg:text-3xl">
          {formaterFrancs(groupage.prixPart)}
        </span>
        <span className="text-texte-secondaire">par part</span>
      </p>

      {/* Une seule horloge : l'encart porte la sienne. */}
      <div className="mt-3 flex items-start gap-2 rounded-xl bg-primaire-fond px-3 py-2.5 text-sm text-primaire-texte-sur-fond">
        <IconeHorloge taille={18} className="mt-0.5 shrink-0" />
        <p>
          <strong className="font-semibold tracking-wide">
            {temps.libelle}
          </strong>{" "}
          — se termine le {formaterDateCourte(groupage.clotureLe)} à 23 h 59
        </p>
      </div>

      {/* Ni fraction ni jauge (§2.5). */}
      <p className="mt-3 flex items-center gap-1.5 text-texte">
        <IconeGroupage taille={18} className="text-texte-secondaire" />
        <strong className="font-semibold">
          {groupage.acheteursConfirmes}
        </strong>{" "}
        acheteurs confirmés
      </p>

      {/* Pseudonyme, non cliquable, sans aucun autre detail (§1.7). */}
      <p className="mt-1.5 flex items-center gap-1.5 text-texte-secondaire">
        Proposé par
        <span className="font-semibold text-texte">{groupage.groupeur}</span>
        <IconeVerifie taille={15} className="text-confiance" />
      </p>
    </div>
  );

  const contenuPart = (
    <section className="rounded-xl bg-surface-douce p-4">
      <h3 className="font-semibold text-texte">Ce que contient une part</h3>
      <p className="mt-1.5 text-texte-secondaire">{groupage.contenuPart}</p>
    </section>
  );

  const livraison = (
    <section className="rounded-xl bg-surface-douce p-4">
      <div className="flex items-start gap-3">
        <IconeCamion
          taille={22}
          className="mt-0.5 shrink-0 text-texte-secondaire"
        />
        <div>
          <h3 className="font-semibold text-texte">
            Délai estimé d&apos;arrivée du colis
          </h3>
          <p className="mt-1 text-texte-secondaire">
            Réception chez vous sous 3 à 5 jours après la clôture, à domicile
            par notre partenaire.
          </p>
          <p className="mt-2 font-semibold text-texte">
            Frais de livraison selon votre position
          </p>
          <p className="text-xs text-texte-secondaire">
            à partir de {formaterFrancs(FRAIS_PROVISOIRES)}
          </p>
        </div>
      </div>
    </section>
  );

  const caracteristiques = (
    <section className="rounded-xl bg-surface-douce p-4">
      <h3 className="font-semibold text-texte">Caractéristiques</h3>
      <dl className="mt-2">
        {groupage.caracteristiques.map((caracteristique) => (
          <div
            key={caracteristique.cle}
            className="flex justify-between gap-4 border-b border-bordure py-2 last:border-b-0 last:pb-0"
          >
            <dt className="text-texte-secondaire">{caracteristique.cle}</dt>
            <dd className="text-right font-medium text-texte">
              {caracteristique.valeur}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );

  const description = (
    <section>
      <h3 className="text-lg font-semibold text-texte">Description</h3>
      <p
        className={`mt-2 text-texte-secondaire ${
          descriptionDepliee ? "" : "line-clamp-4"
        }`}
      >
        {groupage.description}
      </p>
      <button
        type="button"
        onClick={() => setDescriptionDepliee(!descriptionDepliee)}
        className="mt-1 min-h-12 text-sm font-semibold text-primaire"
      >
        {descriptionDepliee ? "Voir moins" : "Voir plus"}
      </button>
    </section>
  );

  const regles = (
    <section>
      <h3 className="text-lg font-semibold text-texte">Les règles</h3>
      <ul className="mt-2 space-y-2">
        {[
          <>
            Paiement à la commande, détenu par Group Achat jusqu&apos;à la
            clôture
          </>,
          <>Le groupeur décide à la clôture si la commande passe</>,
          <>
            <strong className="font-semibold">
              Si le groupage n&apos;aboutit pas, vous êtes remboursé
              intégralement
            </strong>
          </>,
          <>
            <strong className="font-semibold">
              Vérifiez votre commande devant le livreur
            </strong>{" "}
            : la contestation n&apos;est plus possible après acceptation
          </>,
        ].map((regle, indice) => (
          <li key={indice} className="flex gap-2.5 text-texte-secondaire">
            <span
              aria-hidden="true"
              className="mt-2 size-1.5 shrink-0 rounded-full bg-primaire"
            />
            <span>{regle}</span>
          </li>
        ))}
      </ul>
    </section>
  );

  const questions = (
    <section>
      <h3 className="text-lg font-semibold text-texte">
        Questions sur ce groupage
      </h3>

      {groupage.questionsRecentes?.length ? (
        <div className="mt-3 space-y-3">
          {groupage.questionsRecentes.map((echange) => (
            <article
              key={echange.question}
              className="rounded-xl bg-surface-douce p-3"
            >
              <p className="flex items-center gap-1.5 text-xs text-texte-secondaire">
                <IconeQuestion taille={14} />
                Acheteur vérifié
              </p>
              <p className="mt-1 font-medium text-texte">{echange.question}</p>
              <div className="mt-2 border-l-2 border-primaire pl-3">
                <p className="text-xs font-semibold text-primaire">
                  Réponse de {groupage.groupeur}
                </p>
                <p className="mt-0.5 text-sm text-texte-secondaire">
                  {echange.reponse}
                </p>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <p className="mt-2 text-texte-secondaire">
          Aucune question pour l&apos;instant.
        </p>
      )}

      <div className="mt-3 flex flex-wrap gap-3">
        {groupage.questions > 0 ? (
          <button
            type="button"
            onClick={onQuestions}
            className="min-h-12 text-sm font-semibold text-primaire"
          >
            Voir les {groupage.questions} questions
          </button>
        ) : null}
        {estBureau ? (
          <button
            type="button"
            className="ml-auto inline-flex min-h-12 items-center gap-1.5 rounded-[10px] border-[1.5px] border-primaire px-4 text-sm font-semibold text-primaire"
          >
            <IconeQuestion taille={16} />
            Posez une question
          </button>
        ) : null}
      </div>
    </section>
  );

  /* ── Ordinateur : fiche produit en deux colonnes ─────────────────────── */
  if (estBureau) {
    return (
      <>
        <div className="mx-auto max-w-[1280px] px-4 py-6 lg:px-8">
          <nav aria-label="Fil d'Ariane" className="mb-5">
            <button
              type="button"
              onClick={onRetour}
              className="inline-flex min-h-12 items-center gap-1 text-sm font-medium text-texte-secondaire hover:text-primaire"
            >
              <IconeRetour taille={18} />
              Tous les groupages
            </button>
          </nav>

          <div className="flex flex-col gap-8 lg:flex-row lg:gap-12">
            <div className="w-full lg:w-[46%] lg:max-w-xl lg:shrink-0">
              {media}
            </div>

            {/* Le bloc d'achat suit la lecture : on peut commander depuis
                n'importe quel endroit de la fiche. */}
            <div className="min-w-0 flex-1">
              <div className="space-y-5 lg:sticky lg:top-32">
                {enTeteProduit}
                {contenuPart}
                <BandeauConfiance taille="complet" />
                <Bouton onClick={onCommander}>
                  Commander — {formaterFrancs(groupage.prixPart)}
                </Bouton>
                <Bouton style="secondaire">
                  <IconePartager taille={18} />
                  Partager ce groupage
                </Bouton>
              </div>
            </div>
          </div>

          {/* Le detail complet sous la fiche, sur deux colonnes. */}
          <div className="mt-12 grid grid-cols-1 gap-x-12 gap-y-10 border-t border-bordure pt-10 lg:mt-16 lg:grid-cols-2">
            <div className="space-y-10">
              {description}
              {caracteristiques}
            </div>
            <div className="space-y-10">
              {livraison}
              {regles}
              {questions}
            </div>
          </div>
        </div>

        <PiedPage />
      </>
    );
  }

  /* ── Telephone et tablette : une colonne, bouton ancre ───────────────── */
  return (
    <div className="pb-28">
      <header className="sticky top-0 z-10 flex h-14 items-center gap-1 border-b border-bordure bg-white px-2">
        <button
          type="button"
          onClick={onRetour}
          aria-label="Retour"
          className="flex size-12 items-center justify-center text-texte"
        >
          <IconeRetour />
        </button>
        <h1 className="text-lg font-semibold text-texte">Détail du groupage</h1>
      </header>

      {media}

      <div className="space-y-6 px-4 pt-5">
        {enTeteProduit}
        {contenuPart}
        {caracteristiques}
        {description}
        {livraison}
        {regles}
        {questions}
        <BandeauConfiance taille="complet" />
      </div>

      {/* Une question est publique et filtree avant publication — ce n'est pas
          une messagerie privee. */}
      <button
        type="button"
        className="fixed right-4 bottom-24 z-10 inline-flex h-11 items-center gap-1.5 rounded-full bg-primaire px-4 text-sm font-semibold text-white shadow-[0_2px_10px_rgba(20,24,31,0.2)]"
      >
        <IconeQuestion taille={16} />
        Posez une question
      </button>

      {/* Son montant est le prix de la part, pas le total : le total n'existe
          qu'une fois la position connue. */}
      <BoutonAncre>
        <Bouton onClick={onCommander}>
          Commander — {formaterFrancs(groupage.prixPart)}
        </Bouton>
      </BoutonAncre>
    </div>
  );
}
