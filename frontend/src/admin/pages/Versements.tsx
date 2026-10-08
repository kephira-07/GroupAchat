import { useState } from "react";
import {
  libererLeVersement,
  listerLesVersements,
  type VersementAdmin,
} from "../../api/administration";
import { useAction, useRequete } from "../../api/useRequete";
import { formaterDateCourte, formaterFrancs } from "../../domaine/format";
import { ErreurReseau, ListeEnChargement } from "../../ui/EtatReseau";
import { IconeAlerte, IconeCoche } from "../../ui/Icones";

/**
 * Les virements aux groupeurs — §10.3.
 *
 * **C'est le dernier écran où un contrôle sert encore à quelque chose.** Une
 * fois l'argent parti, il n'y a plus de levier sur le groupeur : ni caution —
 * le §10.6 l'a écartée — ni solde retenu, puisqu'il est payé intégralement à
 * la clôture. Tout le dispositif de sécurité se joue ici.
 *
 * ## Ce que l'administrateur regarde avant d'appuyer
 *
 * Deux choses, et elles sont côte à côte sur chaque ligne :
 *
 * - **chez qui il achète, et pour combien** — le devis. Sans lui, le bouton
 *   est fermé, et c'est le serveur qui refuse, pas l'interface ;
 * - **depuis combien de temps il attend** — un groupeur qui attend depuis cinq
 *   jours ne peut pas acheter la marchandise qu'il a vendue, et ce sont ses
 *   acheteurs qui attendront ensuite.
 *
 * ⚠️ **Le montant n'est pas le chiffre qui doit faire agir**, l'ancienneté si.
 * D'où le tri : du plus ancien au plus récent, jamais du plus gros montant.
 *
 * ⚠️ **Aucun virement réel n'est émis.** Le paiement est simulé jusqu'à
 * l'agrément d'un agrégateur (§18.2) : libérer note que l'argent doit partir,
 * et qui l'a décidé. L'écran le dit plutôt que de laisser croire autre chose.
 */
export default function Versements({
  jeton,
  onJetonRefuse,
}: {
  jeton: string;
  onJetonRefuse: () => void;
}) {
  const [filtre, setFiltre] = useState<"en-attente" | "effectue" | "">(
    "en-attente",
  );

  const requete = useRequete(
    (signal) => listerLesVersements(jeton, filtre || undefined, signal),
    [jeton, filtre],
  );

  const liberation = useAction(async (id: number) => {
    const resultat = await libererLeVersement(jeton, id, "Administration");
    requete.recharger();
    return resultat;
  });

  if (requete.erreur?.statut === 403) {
    onJetonRefuse();
  }

  const versements = requete.donnees ?? [];
  const aLiberer = versements.filter((versement) => versement.liberable);
  const sansDevis = versements.filter(
    (versement) => versement.etat === "en-attente" && !versement.devis,
  );

  return (
    <div className="mx-auto max-w-[1100px] px-8 py-6">
      <header>
        <h1 className="text-2xl font-semibold text-texte">Virements</h1>
        <p className="mt-1 text-texte-secondaire">
          Le groupeur est payé à la clôture. L&apos;argent part quand il a
          montré chez qui il achète.
        </p>
      </header>

      <div className="mt-4 flex gap-2">
        {(
          [
            ["en-attente", "À traiter"],
            ["effectue", "Effectués"],
            ["", "Tous"],
          ] as const
        ).map(([valeur, libelle]) => (
          <button
            key={valeur || "tous"}
            type="button"
            onClick={() => setFiltre(valeur)}
            aria-pressed={filtre === valeur}
            className={`rounded-xl border px-4 py-2 text-sm font-medium ${
              filtre === valeur
                ? "border-texte bg-texte text-white"
                : "border-bordure text-texte hover:border-texte-secondaire"
            }`}
          >
            {libelle}
          </button>
        ))}
      </div>

      {filtre === "en-attente" && versements.length > 0 ? (
        <p className="mt-4 rounded-xl border border-bordure bg-white px-4 py-3 text-sm text-texte-secondaire">
          <strong className="font-semibold text-texte">
            {aLiberer.length} prêt{aLiberer.length > 1 ? "s" : ""} à partir
          </strong>
          {sansDevis.length > 0 ? (
            <>
              {" · "}
              {sansDevis.length} en attente du devis du groupeur — rien à faire
              de notre côté
            </>
          ) : null}
        </p>
      ) : null}

      {liberation.erreur ? (
        <p
          role="alert"
          className="mt-4 rounded-xl border border-danger bg-danger-fond px-4 py-3 text-sm text-danger"
        >
          {liberation.erreur.estRefusDeSaisie
            ? Object.values(liberation.erreur.champs)[0]?.[0]
            : liberation.erreur.messageLisible}
        </p>
      ) : null}

      {requete.chargement ? (
        <ListeEnChargement nombre={3} className="mt-4" />
      ) : requete.erreur ? (
        <ErreurReseau erreur={requete.erreur} onReessayer={requete.recharger} />
      ) : versements.length === 0 ? (
        <p className="mt-6 rounded-xl border border-bordure bg-white p-8 text-center text-texte-secondaire">
          Aucun virement dans cet état. C&apos;est l&apos;état normal : traitez
          les virements le jour où ils arrivent et cette liste reste vide.
        </p>
      ) : (
        <ul className="mt-4 space-y-3">
          {versements.map((versement) => (
            <li key={versement.id}>
              <Ligne
                versement={versement}
                enCours={liberation.enCours}
                onLiberer={() => liberation.executer(versement.id)}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Ligne({
  versement,
  enCours,
  onLiberer,
}: {
  versement: VersementAdmin;
  enCours: boolean;
  onLiberer: () => void;
}) {
  /* Au-delà de deux jours, le groupeur est bloqué pour acheter. C'est le seul
     seuil de cet écran, et il porte sur le temps, pas sur le montant. */
  const enRetard =
    versement.etat === "en-attente" && versement.jours_d_attente > 2;

  return (
    <div
      className={`rounded-xl border bg-white p-5 ${
        enRetard ? "border-danger" : "border-bordure"
      }`}
    >
      <div className="flex items-start gap-4">
        <div className="min-w-0 flex-1">
          <h2 className="font-semibold text-texte">
            {versement.campagne_titre}
          </h2>
          <p className="mt-0.5 text-sm text-texte-secondaire">
            {/* Le pseudonyme **et** le nom réel : l'administration est le seul
                endroit où les deux se voient ensemble, et c'est nécessaire —
                on ne vire pas de l'argent à un pseudonyme. */}
            {versement.groupeur} · {versement.groupeur_nom} ·{" "}
            {versement.groupeur_mobile_money}
          </p>
        </div>

        <div className="shrink-0 text-right">
          <p className="text-[22px] font-bold text-texte">
            {formaterFrancs(Number(versement.verse))}
          </p>
          <p className="text-xs text-texte-secondaire">
            {formaterFrancs(Number(versement.collecte))} collectés −{" "}
            {formaterFrancs(Number(versement.commission))} de commission
          </p>
        </div>
      </div>

      {/* ⚠️ Les frais de livraison sont dits à part, et ils ne sont **jamais**
          amputés de la commission : ils vont au transporteur, ce n'est pas
          l'argent du groupeur. */}
      <p className="mt-2 text-xs text-texte-secondaire">
        + {formaterFrancs(Number(versement.frais_livraison_collectes))} de
        frais de livraison collectés, destinés au transporteur
      </p>

      {versement.etat === "effectue" ? (
        <p className="mt-4 flex items-center gap-2 rounded-lg bg-succes-fond px-3 py-2 text-sm text-succes">
          <IconeCoche taille={16} />
          Versé le{" "}
          {formaterDateCourte(versement.libere_le?.slice(0, 10) ?? "")} par{" "}
          {versement.libere_par}
        </p>
      ) : versement.etat === "annule" ? (
        <p className="mt-4 rounded-lg bg-surface-douce px-3 py-2 text-sm text-texte-secondaire">
          Groupage annulé — aucune commission, rien n&apos;est parti.
        </p>
      ) : versement.devis ? (
        <>
          <div className="mt-4 rounded-lg bg-surface-douce px-3 py-2.5 text-sm">
            <p className="font-semibold text-texte">Devis fournisseur</p>
            <p className="mt-0.5 text-texte-secondaire">
              {versement.devis.fournisseur} —{" "}
              {formaterFrancs(Number(versement.devis.montant))}, déposé le{" "}
              {formaterDateCourte(versement.devis.depose_le.slice(0, 10))}
            </p>
          </div>

          <div className="mt-4 flex items-center gap-3">
            <button
              type="button"
              disabled={enCours}
              onClick={onLiberer}
              className={`rounded-xl px-5 py-2.5 text-sm font-semibold ${
                enCours
                  ? "cursor-wait bg-surface-douce text-texte-secondaire"
                  : "bg-texte text-white hover:opacity-90"
              }`}
            >
              {enCours ? "…" : "Faire le virement"}
            </button>
            <p
              className={`text-sm ${
                enRetard ? "font-semibold text-danger" : "text-texte-secondaire"
              }`}
            >
              {versement.jours_d_attente === 0
                ? "clôturé aujourd'hui"
                : `attend depuis ${versement.jours_d_attente} jour${
                    versement.jours_d_attente > 1 ? "s" : ""
                  }`}
            </p>
          </div>

          {/* Dit franchement ce que le bouton fait, et ne fait pas. */}
          <p className="mt-2 text-xs text-texte-secondaire">
            Aucun virement n&apos;est réellement émis : le paiement est simulé
            jusqu&apos;à l&apos;agrément d&apos;un agrégateur. Le bouton note
            que l&apos;argent doit partir, et qui l&apos;a décidé.
          </p>
        </>
      ) : (
        <p className="mt-4 flex items-start gap-2 rounded-lg bg-primaire-fond px-3 py-2.5 text-sm text-primaire-texte-sur-fond">
          <IconeAlerte taille={16} className="mt-0.5 shrink-0" />
          <span>
            <strong className="font-semibold">
              Le groupeur n&apos;a pas déposé son devis.
            </strong>{" "}
            L&apos;argent ne peut pas partir avant qu&apos;on sache chez qui il
            achète — c&apos;est le dernier contrôle avant le décaissement. Rien
            à faire de notre côté, sinon le relancer.
          </span>
        </p>
      )}
    </div>
  );
}
