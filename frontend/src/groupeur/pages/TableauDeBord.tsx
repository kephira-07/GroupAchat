import {
  type EtatDossier,
  peutLancerUnGroupage,
} from "../../domaine/recrutement";
import BandeauDossier from "../mise-en-page/BandeauDossier";
import Vignette from "../../composants/Vignette";
import { formaterFrancs } from "../../domaine/format";
import { LIBELLE_CAMPAGNE, type Campagne } from "../../domaine/groupeur";
import { decrireTempsRestant } from "../../domaine/format";
import { useEspaceGroupeur } from "../../api/EspaceGroupeurContexte";
import { ErreurReseau, ListeEnChargement } from "../../ui/EtatReseau";
import { EnTeteGroupeur } from "../mise-en-page/ChromeGroupeur";
import { IconeDemander } from "../../ui/Icones";

/**
 * Ecran 13 — Tableau de bord groupeur. SPEC_ECRANS_FIGMA.md, ecran 13.
 *
 * **Chrome bleu** (§1.2) : en-tete, tuiles de chiffres et onglet actif en
 * `confiance`. **L'orange n'apparait que deux fois**, et c'est exactement ce
 * que la regle de dominance autorise : la section « A faire aujourd'hui » et
 * le bouton flottant. Ailleurs il serait du bruit ; ici il est l'alerte.
 *
 * Le pseudonyme est utilise **meme sur son propre ecran** : « Bonjour Mama
 * Gro », jamais son nom reel. C'est cohérent avec le reste du produit, et ca
 * evite qu'une capture d'ecran de son tableau de bord expose son identite.
 *
 * **Les quatre tuiles sont cliquables** vers les statistiques : un chiffre
 * affiche sans moyen d'aller voir ce qu'il contient est une frustration.
 *
 * Le bouton flottant est le seul endroit du produit ou `marque` `#FF6A00` sert
 * de fond de bouton, et son icone y est `#14181F` (6,20:1). Sur un ecran bleu,
 * c'est l'element le plus reperable de toute l'interface groupeur — et c'est
 * voulu : creer une campagne est l'action qui fait vivre la plateforme.
 */
export default function TableauDeBord({
  onStatistiques,
  onCampagne,
  onTache,
  onCreer,
  dossier,
  onReprendreLeDossier,
}: {
  onStatistiques: () => void;
  onCampagne: (campagne: Campagne) => void;
  onTache: (destination: string) => void;
  onCreer: () => void;
  /**
   * L'etat du dossier KYC (§10.5).
   *
   * Absent = valide, qui est le cas de la grande majorite des sessions : un
   * groupeur depose son dossier une fois et travaille ensuite pendant des
   * mois. Le defaut porte donc sur le cas courant, et les ecrans qui ne
   * connaissent pas encore cette notion continuent de fonctionner.
   */
  dossier?: {
    etat: EtatDossier;
    motif?: string;
    courriel?: string;
    pseudonyme?: string;
  };
  onReprendreLeDossier?: () => void;
}) {
  const peutCreer =
    dossier === undefined || peutLancerUnGroupage(dossier.etat);

  const espace = useEspaceGroupeur();
  const bord = espace.tableauDeBord;

  /* ⚠️ Les quatre chiffres viennent **du serveur**, pas d'une somme calculee
     ici sur la liste des campagnes. « En collecte » et « disponible » ne se
     deduisent pas l'un de l'autre : le premier est l'argent des acheteurs sur
     des campagnes ouvertes — detenu jusqu'a la cloture, et qui n'appartient
     pas encore au groupeur — le second est ce qui lui a ete verse. Les
     recalculer dans le navigateur ferait deux definitions a tenir d'accord,
     et c'est exactement la que naissent les ecarts de tresorerie. */
  const ouvertes = bord?.campagnes_ouvertes ?? 0;
  const commandes = bord?.commandes ?? 0;

  /**
   * ⚠️ **Un dossier non valide n'a pas de chiffres, et il ne faut surtout pas
   * lui en montrer.**
   *
   * Sans ce retour anticipe, l'ecran affichait « vous pourrez creer votre
   * premier groupage des que votre dossier sera valide » **au-dessus de trois
   * campagnes ouvertes, 122 commandes et 135 000 F en cours de collecte** —
   * les chiffres de demonstration, qui appartiennent a un groupeur valide. Un
   * ecran qui se contredit a dix centimetres d'intervalle apprend a ne pas
   * le lire.
   *
   * Ce que le nouveau venu voit a la place : l'etat de son dossier, et ce
   * qu'il pourra faire ensuite. **Ce n'est pas une porte close** — la barre du
   * bas reste la, les autres ecrans s'ouvrent, il decouvre l'outil. C'est
   * simplement un tableau de bord sans tableau, parce qu'il n'y a encore rien
   * a y mettre.
   */
  if (!peutCreer && dossier) {
    return (
      <div className="relative pb-18">
        {/* Son pseudonyme a lui, pas celui du jeu de demonstration. */}
        <EnTeteGroupeur
          titre={`Bonjour ${dossier.pseudonyme || bord?.pseudonyme || ""}`}
        />

        <BandeauDossier
          etat={dossier.etat}
          motif={dossier.motif}
          courriel={dossier.courriel}
          onReprendre={onReprendreLeDossier}
        />

        <section className="px-4 pt-6">
          <h2 className="text-lg font-semibold text-texte">
            Ce que vous pourrez faire
          </h2>
          <ol className="mt-3 space-y-3">
            {[
              {
                titre: "Lancer un groupage",
                detail:
                  "Vous fixez le produit, le prix d'une part et la date de clôture. Les acheteurs s'y ajoutent.",
              },
              {
                titre: "Suivre vos commandes",
                detail:
                  "Vous voyez les codes de livraison et les quartiers — jamais les noms ni les numéros de vos acheteurs.",
              },
              {
                titre: "Être payé à la clôture",
                detail:
                  "L'intégralité du montant collecté, commission de 5 % retenue. Jamais sur les frais de livraison.",
              },
            ].map((etape, indice) => (
              <li key={etape.titre} className="flex gap-3">
                <span
                  aria-hidden="true"
                  className="flex size-7 shrink-0 items-center justify-center rounded-full bg-confiance-fond text-sm font-semibold text-confiance"
                >
                  {indice + 1}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-medium text-texte">
                    {etape.titre}
                  </span>
                  <span className="mt-0.5 block text-sm text-texte-secondaire">
                    {etape.detail}
                  </span>
                </span>
              </li>
            ))}
          </ol>

          <p className="mt-6 text-sm text-texte-secondaire">
            En attendant, vous pouvez parcourir les autres écrans : ils vous
            montrent l&apos;outil tel qu&apos;il sera une fois votre dossier
            validé.
          </p>
        </section>
      </div>
    );
  }

  /**
   * L'attente garde **la forme du tableau de bord**, en-tete compris.
   *
   * C'est le premier ecran que le groupeur voit en ouvrant l'application :
   * un ecran blanc d'une seconde donne l'impression qu'elle n'a pas demarre,
   * alors qu'une en-tete bleue avec des tuiles en attente dit qu'elle se
   * remplit.
   */
  if (espace.chargement) {
    return (
      <div className="relative pb-18" aria-busy="true">
        <EnTeteGroupeur titre="Bonjour" />
        <div className="-mt-3 px-4">
          <div className="grid grid-cols-2 gap-3">
            {[0, 1, 2, 3].map((indice) => (
              <span
                key={indice}
                className="h-20 rounded-xl bg-confiance-fond"
                aria-hidden="true"
              />
            ))}
          </div>
        </div>
        <ListeEnChargement nombre={3} className="px-4 pt-6" />
      </div>
    );
  }

  if (espace.erreur) {
    return (
      <div className="relative pb-18">
        <EnTeteGroupeur titre="Mon tableau de bord" />
        <ErreurReseau
          erreur={espace.erreur}
          onReessayer={espace.recharger}
          role="groupeur"
        />
      </div>
    );
  }

  return (
    <div className="relative pb-18">
      <EnTeteGroupeur titre={`Bonjour ${bord?.pseudonyme ?? ""}`} />

      {/* L'etat du dossier, avant toute autre chose : il conditionne ce que
          tout le reste de l'ecran permet de faire. */}
      {dossier ? (
        <BandeauDossier
          etat={dossier.etat}
          motif={dossier.motif}
          courriel={dossier.courriel}
          onReprendre={onReprendreLeDossier}
        />
      ) : null}

      {/* Les quatre tuiles, en bleu, chevauchant l'en-tete. */}
      <div className="-mt-3 px-4">
        <div className="grid grid-cols-2 gap-3">
          <Tuile valeur={String(ouvertes)} libelle="campagnes ouvertes" onClick={onStatistiques} />
          <Tuile valeur={String(commandes)} libelle="commandes" onClick={onStatistiques} />
          <Tuile
            valeur={formaterFrancs(bord?.en_collecte ?? 0)}
            libelle="en cours de collecte"
            onClick={onStatistiques}
          />
          <Tuile
            valeur={formaterFrancs(bord?.disponible ?? 0)}
            libelle="disponibles"
            onClick={onStatistiques}
          />
        </div>

        <button
          type="button"
          onClick={onStatistiques}
          className="mt-3 min-h-12 text-sm font-semibold text-confiance"
        >
          Voir toutes mes statistiques
        </button>
      </div>

      {/* « A faire aujourd'hui » — le seul bloc orange de l'ecran, et la
          raison d'ouvrir l'application le matin. */}
      <section className="mt-4 px-4">
        <h2 className="text-lg font-semibold text-texte">
          À faire aujourd&apos;hui
        </h2>
        <ul className="mt-3 overflow-hidden rounded-xl bg-primaire-fond">
          {(bord?.taches ?? []).map((tache) => (
            <li key={tache.id} className="border-b border-white/70 last:border-b-0">
              <button
                type="button"
                onClick={() => onTache(tache.destination)}
                className="flex w-full items-center gap-3 px-3 py-3 text-left"
              >
                <span
                  aria-hidden="true"
                  className={`size-2.5 shrink-0 rounded-full ${
                    tache.urgence === "urgent" ? "bg-danger" : "bg-marque"
                  }`}
                />
                <span className="text-sm font-medium text-primaire-texte-sur-fond">
                  {tache.libelle}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-6 px-4">
        <h2 className="text-lg font-semibold text-texte">Mes campagnes</h2>
        <ul className="mt-2">
          {espace.campagnes.map((campagne) => (
            <li key={campagne.id} className="border-b border-bordure last:border-b-0">
              <button
                type="button"
                onClick={() => onCampagne(campagne)}
                className="flex w-full items-center gap-3 py-3 text-left active:bg-surface-douce"
              >
                <div className="size-12 shrink-0">
                  <Vignette photo={campagne.photo} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-texte">
                    {campagne.produit}
                  </p>
                  <p className="text-sm text-texte-secondaire">
                    {campagne.commandes} commandes
                    <span aria-hidden="true"> · </span>
                    {campagne.heuresRestantes > 0
                      ? decrireTempsRestant(campagne.heuresRestantes).libelleAccessible
                      : LIBELLE_CAMPAGNE[campagne.statut]}
                  </p>
                </div>
                <span className="shrink-0 text-sm font-semibold text-texte">
                  {formaterFrancs(campagne.collecte)}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </section>

      {/* Le bouton flottant. Seul usage autorise de `marque` en fond de
          bouton, avec une icone sombre (6,20:1).

          ⚠️ **Il disparait tant que le dossier n'est pas valide — il n'est pas
          grise.** Un bouton desactive a l'air d'une panne : on appuie, rien ne
          se passe, on appuie plus fort. Le bandeau en haut de l'ecran dit en
          une phrase ce qui est ferme et pourquoi, ce qu'un bouton inerte ne
          dira jamais.

          Et ce n'est qu'un confort : le verrou reel est dans `Campagne.save()`
          cote serveur, qui refuse une campagne d'un groupeur non valide. Une
          interface ne protege rien — il suffit d'une requete directe. */}
      {peutCreer ? (
        <button
          type="button"
          onClick={onCreer}
          aria-label="Créer une campagne"
          className="fixed right-4 bottom-24 z-10 flex size-14 items-center justify-center rounded-full bg-marque text-texte shadow-[0_2px_10px_rgba(20,24,31,0.25)]"
        >
          <IconeDemander taille={26} />
        </button>
      ) : null}
    </div>
  );
}

/** Une tuile de chiffre. Fond `confiance`, texte blanc (10,36:1). */
function Tuile({
  valeur,
  libelle,
  onClick,
}: {
  valeur: string;
  libelle: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-xl bg-confiance p-3 text-left text-white"
    >
      <span className="block text-xl font-bold">{valeur}</span>
      <span className="mt-0.5 block text-xs text-white/85">{libelle}</span>
    </button>
  );
}
