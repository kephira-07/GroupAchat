import { formaterDateCourte, formaterFrancs } from "../../domaine/format";
import { useEspaceGroupeur } from "../../api/EspaceGroupeurContexte";
import { EnTeteGroupeur } from "../mise-en-page/ChromeGroupeur";
import Encart from "../../ui/Encart";
import {
  IconeEntree,
  IconeHorloge,
  IconePourcent,
} from "../../ui/Icones";

/**
 * Ecran 18 — Portefeuille groupeur. SPEC_ECRANS_FIGMA.md, ecran 18.
 *
 * **Objectif : montrer ou est l'argent et a quel titre.** C'est l'ecran qui
 * explique le modele economique sans un mot de pitch.
 *
 * **L'encart explicatif n'est pas facultatif.** Un groupeur qui decouvre la
 * retenue au moment du versement se sent trompe. Elle est dite ici, a l'ecran
 * 14 au moment de fixer le prix, et a l'ecran 16 au moment de decider : **trois
 * fois, et c'est volontaire**.
 *
 * La derniere ligne de l'historique — « Campagne annulee, aucune commission »
 * — vaut d'etre montree : elle prouve ce que le §7 du cahier des charges
 * annonce, au lieu de le promettre.
 *
 * Le portefeuille dit *combien*, les statistiques disent *pourquoi*. **Deux
 * ecrans distincts, volontairement** : on ne melange pas l'analyse et le
 * mouvement d'argent.
 */
export default function Portefeuille({
  onStatistiques,
}: {
  onStatistiques: () => void;
}) {
  const { portefeuille, tableauDeBord } = useEspaceGroupeur();

  const mouvements = portefeuille?.mouvements ?? [];

  /**
   * Le versé et la commission se **somment depuis l'historique**, ils ne sont
   * pas servis séparément.
   *
   * C'est volontaire : deux chiffres qu'on peut additionner soi-même à partir
   * des lignes affichées juste en dessous ne doivent pas venir d'un autre
   * calcul, sinon le total et le détail peuvent se contredire à l'écran — et
   * c'est le détail qu'on croit, à juste titre.
   */
  const verse = mouvements
    .filter((mouvement) => (mouvement.montant ?? 0) > 0)
    .reduce((total, mouvement) => total + (mouvement.montant ?? 0), 0);

  const commission = -mouvements
    .filter((mouvement) => (mouvement.montant ?? 0) < 0)
    .reduce((total, mouvement) => total + (mouvement.montant ?? 0), 0);

  const dernier = mouvements.find((mouvement) => (mouvement.montant ?? 0) > 0);

  return (
    <div className="pb-18">
      <EnTeteGroupeur titre="Portefeuille" />

      <div className="space-y-6 px-4 pt-5">
        {/* La carte principale. Fond `confiance`, texte blanc (10,36:1). */}
        <div className="rounded-2xl bg-confiance p-5 text-white">
          <p className="text-sm text-white/85">Disponible</p>
          <p className="mt-1 text-3xl font-bold">
            {formaterFrancs(portefeuille?.disponible ?? 0)}
          </p>
          <button
            type="button"
            className="mt-4 h-12 w-full rounded-[10px] bg-white font-semibold text-confiance"
          >
            Retirer mes fonds
          </button>
        </div>

        <div className="space-y-3">
          <TuileMontant
            Icone={IconeHorloge}
            montant={tableauDeBord?.en_collecte ?? 0}
            libelle="En cours de collecte"
            /* ⚠️ « détenu jusqu'à la clôture », jamais « bloqué jusqu'à la
               livraison » (§1.7). Le groupeur est payé intégralement à la
               clôture : écrire autre chose serait faux, et ferait croire à une
               retenue qui n'existe pas. */
            detail="Détenu par Group Achat jusqu'à la clôture"
          />
          <TuileMontant
            Icone={IconeEntree}
            montant={verse}
            libelle="Versé"
            detail={
              dernier
                ? `Dernier versement : ${dernier.libelle.replace("Versement — ", "")}`
                : "Aucun versement pour l'instant"
            }
          />
          <TuileMontant
            Icone={IconePourcent}
            montant={commission}
            libelle="Commission Group Achat"
            detail="5 % sur les campagnes abouties"
          />
        </div>

        {/* A ne pas omettre : c'est le troisieme et dernier rappel. */}
        <Encart variante="info" role="groupeur" titre="Comment vous êtes payé">
          Vous recevez l&apos;intégralité du montant collecté à la clôture de
          chaque campagne, moins 5 % de commission. Aucune commission sur une
          campagne annulée. Les frais de livraison payés par vos acheteurs ne
          vous sont pas versés : ils vont au transporteur.
        </Encart>

        <section>
          <h2 className="text-lg font-semibold text-texte">Historique</h2>
          <ul className="mt-2">
            {mouvements.map((mouvement) => (
              <li
                key={mouvement.id}
                className="flex items-start justify-between gap-3 border-b border-bordure py-3 last:border-b-0"
              >
                <div className="min-w-0">
                  <p className="text-sm text-texte">{mouvement.libelle}</p>
                  <p className="text-xs text-texte-secondaire">
                    {formaterDateCourte(mouvement.date)}
                  </p>
                </div>
                <span
                  className={`shrink-0 text-sm font-semibold ${
                    mouvement.montant === undefined
                      ? "text-texte-secondaire"
                      : mouvement.montant > 0
                        ? "text-succes"
                        : "text-texte"
                  }`}
                >
                  {mouvement.montant === undefined
                    ? (mouvement.mention ?? "—")
                    : `${mouvement.montant > 0 ? "+" : "−"} ${formaterFrancs(Math.abs(mouvement.montant))}`}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <button
          type="button"
          onClick={onStatistiques}
          className="min-h-12 text-sm font-semibold text-confiance"
        >
          Voir mes statistiques
        </button>

        <p className="pb-2 text-center text-xs text-texte-secondaire">
          Démonstration — aucun mouvement de fonds réel.
        </p>
      </div>
    </div>
  );
}

function TuileMontant({
  Icone,
  montant,
  libelle,
  detail,
}: {
  Icone: (p: { taille?: number; className?: string }) => React.ReactElement;
  montant: number;
  libelle: string;
  detail: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-bordure p-3">
      <Icone taille={20} className="mt-0.5 shrink-0 text-texte-secondaire" />
      <div className="min-w-0">
        <p className="text-lg font-bold text-texte">{formaterFrancs(montant)}</p>
        <p className="text-sm font-medium text-texte">{libelle}</p>
        <p className="text-xs text-texte-secondaire">{detail}</p>
      </div>
    </div>
  );
}
