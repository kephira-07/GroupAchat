import { useState } from "react";
import { formaterDateCourte } from "../../domaine/format";
import { ACTIVITE, ALERTES, FILES, INDICATEURS } from "../../donnees/admin";
import { IconeAlerte, IconeCoche } from "../../ui/Icones";

/**
 * Ecran A1 — Tableau de bord administrateur. SPEC_ECRANS_FIGMA.md, ecran A1.
 *
 * **C'est la seule vue cote administrateur.** Tout le reste — fiches,
 * recherche, edition, actions — vit dans l'admin Django (§13.6 du cahier des
 * charges). Cette page existe parce que c'est precisement ce que l'admin
 * Django ne sait pas faire : donner une vue d'ensemble en un ecran.
 *
 * **Chrome neutre, ni orange ni bleu.** Les deux chromes de marque
 * appartiennent aux deux publics ; l'outil interne n'en porte aucun. Cette
 * neutralite est utile : elle evite de confondre une capture d'ecran interne
 * avec le produit.
 *
 * **1 280 x 800, pas 390.** C'est le seul ecran du produit destine a un
 * ordinateur — l'administrateur travaille assis, avec un clavier, pas dans un
 * taxi.
 *
 * ## L'ordre vertical, qui est tout le propos
 *
 * Alertes, puis files de travail, puis indicateurs, puis activite recente.
 * **L'activite est en dernier parce que c'est le seul bloc qui regarde le
 * passe** ; tout ce qui precede demande une action.
 *
 * ⚠️ **Trois absences voulues** :
 *
 * - **aucun bouton qui deplace de l'argent.** Depuis une vue d'ensemble on *va
 *   vers* un dossier ; on ne rembourse pas en un clic sans l'avoir ouvert.
 *   Toute action sur l'argent est tracee et motivee (§18.3) ;
 * - **aucune donnee personnelle.** Des compteurs et des montants. Un nom
 *   n'apparait qu'une fois le dossier ouvert, et cet acces est journalise ;
 * - **le nombre d'inscrits en grand.** C'est la mesure qui flatte et n'engage
 *   a rien. Ce qui compte est le nombre de campagnes allees jusqu'a la
 *   livraison.
 *
 * Le basculeur « journee calme » n'est pas un gadget : la spec demande de
 * savoir dessiner cet etat, qui est **le plus frequent et celui qu'on
 * oublie**. Un administrateur qui ouvre son ecran tous les matins pour voir un
 * mur rouge finit par ne plus l'ouvrir.
 */
export default function TableauDeBordAdmin({
  onDossiersKyc,
}: {
  /**
   * Ouvre l'ecran A2 depuis la file « Dossiers KYC a valider ».
   *
   * **Une seule des six files mene quelque part aujourd'hui**, et c'est voulu
   * plutot que subi : les cinq autres n'ont pas encore d'ecran. Leur tuile
   * reste affichee — la faire disparaitre deplacerait les cartes d'un jour a
   * l'autre et on ne retrouverait plus rien — mais elle n'est pas cliquable,
   * et le curseur le dit. Un bouton qui ne fait rien est pire qu'un bouton
   * absent : on appuie deux fois avant de comprendre.
   */
  onDossiersKyc: () => void;
}) {
  const [journeeCalme, setJourneeCalme] = useState(false);
  const [ecart, setEcart] = useState(0);

  const alertes = journeeCalme ? [] : ALERTES;
  const files = journeeCalme
    ? FILES.map((f) => ({
        ...f,
        nombre: f.id === "F1" ? 1 : 0,
        plusAncienJours: f.id === "F1" ? 1 : undefined,
      }))
    : FILES;

  return (
    /* Fond `surface-douce`, cartes blanches : le chrome neutre. */
    <div className="min-h-dvh bg-surface-douce">
      <header className="border-b border-bordure bg-white">
        <div className="mx-auto flex max-w-[1280px] items-center justify-between gap-4 px-8 py-4">
          <div>
            <h1 className="text-xl font-semibold text-texte">
              Group Achat — Administration
            </h1>
            <p className="text-sm text-texte-secondaire">
              {new Date().toLocaleDateString("fr-FR", {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}
            </p>
          </div>

          {/* De quoi montrer les trois etats demandes par la spec. */}
          <div className="flex items-center gap-4 text-sm">
            <label className="flex items-center gap-2 text-texte-secondaire">
              <input
                type="checkbox"
                checked={journeeCalme}
                onChange={(e) => setJourneeCalme(e.target.checked)}
                className="size-4"
              />
              Journée calme
            </label>
            <label className="flex items-center gap-2 text-texte-secondaire">
              <input
                type="checkbox"
                checked={ecart !== 0}
                onChange={(e) => setEcart(e.target.checked ? 12500 : 0)}
                className="size-4"
              />
              Écart de rapprochement
            </label>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1280px] space-y-8 px-8 py-8">
        {/* 1. Les alertes. Rien quand il n'y a rien : pas de bloc vide
            « aucune alerte », qui prend de la place et apprend a ignorer la
            zone. */}
        {alertes.length > 0 ? (
          <ul className="space-y-2">
            {alertes.map((alerte) => (
              <li
                key={alerte.id}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 ${
                  alerte.gravite === "danger"
                    ? "bg-danger-fond text-danger"
                    : "bg-primaire-fond text-primaire-texte-sur-fond"
                }`}
              >
                <IconeAlerte taille={20} className="shrink-0" />
                <p className="min-w-0 flex-1 text-sm font-medium">
                  {alerte.texte}
                </p>
                <button
                  type="button"
                  className="shrink-0 text-sm font-semibold underline"
                >
                  {alerte.lien}
                </button>
              </li>
            ))}
          </ul>
        ) : null}

        {/* 2. Les six files de travail, en 3 x 2. */}
        <section>
          <h2 className="text-lg font-semibold text-texte">Files de travail</h2>
          <ul className="mt-3 grid grid-cols-3 gap-4">
            {files.map((file) => {
              /* F1 est la file des dossiers KYC : la seule a avoir son ecran
                 (A2). Repere par son identifiant et non par son libelle, qui
                 se reformule. */
              const ouvrable = file.id === "F1";
              return (
              <li key={file.id}>
                <button
                  type="button"
                  disabled={!ouvrable}
                  onClick={ouvrable ? onDossiersKyc : undefined}
                  className={`w-full rounded-xl border bg-white p-5 text-left transition-colors ${
                    ouvrable
                      ? "cursor-pointer hover:border-texte-secondaire"
                      : "cursor-default"
                  } ${
                    /* La seule file ou notre propre argent est expose. Les
                       autres coutent de la confiance ; celle-ci coute du cash,
                       et un ecran qui les traite a egalite ment sur les
                       priorites. */
                    file.argentExpose ? "border-danger" : "border-bordure"
                  }`}
                >
                  <span
                    className={`block text-[22px] font-bold ${
                      file.nombre === 0 ? "text-texte-secondaire" : "text-texte"
                    }`}
                  >
                    {file.nombre}
                  </span>
                  <span
                    className={`mt-0.5 block font-semibold ${
                      file.nombre === 0 ? "text-texte-secondaire" : "text-texte"
                    }`}
                  >
                    {file.libelle}
                  </span>
                  {/* C'est cette ligne qui fait agir, pas le compteur. */}
                  {file.plusAncienJours !== undefined ? (
                    <span className="mt-1 block text-xs text-texte-secondaire">
                      le plus ancien : {file.plusAncienJours} jour
                      {file.plusAncienJours > 1 ? "s" : ""}
                    </span>
                  ) : null}
                </button>
              </li>
              );
            })}
          </ul>
        </section>

        {/* 3. Les quatre indicateurs. */}
        <section>
          <h2 className="text-lg font-semibold text-texte">Indicateurs</h2>
          <ul className="mt-3 grid grid-cols-4 gap-4">
            {INDICATEURS.map((indicateur) => (
              <li
                key={indicateur.id}
                className="rounded-xl border border-bordure bg-white p-5"
              >
                <p className="text-sm font-medium text-texte-secondaire">
                  {indicateur.libelle}
                </p>
                <p className="mt-1 text-[22px] font-bold text-texte">
                  {indicateur.valeur}
                </p>
                {indicateur.detail ? (
                  <p className="text-xs text-texte-secondaire">
                    {indicateur.detail}
                  </p>
                ) : null}

                {/* La ligne la plus serieuse de l'ecran : le jour ou l'argent
                    detenu calcule et le solde reel divergent, il faut le voir
                    tout de suite. */}
                {indicateur.id === "I1" ? (
                  <p
                    className={`mt-2 flex items-center gap-1.5 text-xs font-semibold ${
                      ecart === 0 ? "text-succes" : "text-danger"
                    }`}
                  >
                    {ecart === 0 ? (
                      <IconeCoche taille={14} />
                    ) : (
                      <IconeAlerte taille={14} />
                    )}
                    {ecart === 0
                      ? "Rapprochement : écart de 0 F"
                      : `Écart de ${ecart.toLocaleString("fr-FR")} F — à instruire`}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        </section>

        {/* 4. L'activite recente, en dernier : le seul bloc qui regarde le
            passe. */}
        <section>
          <h2 className="text-lg font-semibold text-texte">Activité récente</h2>
          <ul className="mt-3 overflow-hidden rounded-xl border border-bordure bg-white">
            {ACTIVITE.map((ligne) => (
              <li
                key={ligne.id}
                className="flex items-center gap-4 border-b border-bordure px-5 py-3 text-sm last:border-b-0"
              >
                <span className="w-20 shrink-0 text-texte-secondaire">
                  {formaterDateCourte(ligne.date)}
                </span>
                <span className="text-texte">{ligne.texte}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
