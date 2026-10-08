import { useState } from "react";
import { formaterFrancs } from "../../domaine/format";
import {
  LIBELLE_QUARTIER,
  QUARTIERS,
  type Quartier,
} from "../../domaine/groupage";
import EnTeteEcran from "../mise-en-page/EnTeteEcran";
import PiedPage from "../mise-en-page/PiedPage";
import Bouton, { BoutonAncre } from "../../ui/Bouton";
import Champ from "../../ui/Champ";
import Encart from "../../ui/Encart";
import { IconeCoche } from "../../ui/Icones";

/**
 * Ecran 11 — Demander un produit. SPEC_ECRANS_FIGMA.md, ecran 11.
 *
 * **Objectif : un formulaire si court qu'on le remplit en marchant.** Cinq
 * champs, dont deux facultatifs. C'est le plafond du §1.0 (« simple »,
 * regle 4) : au-dela de cinq champs visibles, on decoupe en etapes.
 *
 * C'est cet ecran qui fait tenir la promesse du produit : **la demande cree
 * l'offre**. Un echec de recherche n'est donc jamais un cul-de-sac — il mene
 * ici.
 *
 * **La connexion n'est demandee qu'a l'envoi** (§1.5), et tout ce qui a ete
 * saisi est conserve pendant la connexion : l'ecran reste monte, donc l'etat
 * aussi. C'est la meme mecanique qu'a l'ecran 5.
 *
 * L'encart d'entrainement — « 32 personnes ont deja demande… » — est ce qui
 * donne l'impression d'un marche vivant plutot que d'une boite a idees. Il est
 * **calcule a partir de la saisie**, pas affiche en permanence : une phrase
 * d'encouragement qui ne depend de rien ne convainc personne.
 */
export default function DemanderProduit({
  estBureau,
  onRetour,
  onEnvoyee,
}: {
  estBureau: boolean;
  onRetour: () => void;
  onEnvoyee: () => void;
}) {
  const [produit, setProduit] = useState("");
  const [quantite, setQuantite] = useState("");
  const [quartier, setQuartier] = useState<Quartier | "">("");
  const [budget, setBudget] = useState("");
  const [precisions, setPrecisions] = useState("");
  const [envoyee, setEnvoyee] = useState(false);

  const complet = produit.trim() !== "" && quantite.trim() !== "" && quartier;

  if (envoyee) {
    return (
      <EcranEnvoye
        estBureau={estBureau}
        onVoirMesDemandes={onEnvoyee}
        onRetour={onRetour}
      />
    );
  }

  const formulaire = (
    <div className="space-y-5">
      <p className="text-texte-secondaire">
        Dites ce que vous cherchez. Nos groupeurs le verront et pourront lancer
        un groupage.
      </p>

      <Champ
        libelle="Quel produit ?"
        valeur={produit}
        onChanger={setProduit}
        exemple="Huile de palme"
      />

      <Champ
        libelle="Quelle quantité ?"
        valeur={quantite}
        onChanger={setQuantite}
        exemple="20 litres, 2 paires…"
      />

      <div>
        <label
          htmlFor="quartier"
          className="block text-sm font-medium text-texte"
        >
          Votre quartier
        </label>
        <select
          id="quartier"
          value={quartier}
          onChange={(evenement) =>
            setQuartier(evenement.target.value as Quartier)
          }
          className="mt-1.5 h-13 w-full rounded-[10px] border border-bordure bg-white px-3 text-texte outline-none focus:border-2 focus:border-primaire"
        >
          <option value="">Choisissez un quartier</option>
          {QUARTIERS.map((unQuartier) => (
            <option key={unQuartier} value={unQuartier}>
              {LIBELLE_QUARTIER[unQuartier]}
            </option>
          ))}
        </select>
      </div>

      <Champ
        libelle="Budget maximum (facultatif)"
        valeur={budget}
        onChanger={(valeur) => setBudget(valeur.replace(/\D/g, ""))}
        inputMode="numeric"
        exemple="10 000"
        aide={
          budget ? `Soit ${formaterFrancs(Number(budget))}` : "En francs CFA."
        }
      />

      <div>
        <label
          htmlFor="precisions"
          className="block text-sm font-medium text-texte"
        >
          Précisions (facultatif)
        </label>
        <textarea
          id="precisions"
          rows={3}
          value={precisions}
          onChange={(evenement) => setPrecisions(evenement.target.value)}
          placeholder="Marque, couleur, taille…"
          className="mt-1.5 w-full resize-none rounded-[10px] border border-bordure bg-white px-3 py-2.5 outline-none placeholder:text-texte-secondaire focus:border-2 focus:border-primaire"
        />
      </div>

      {/* Calcule a partir de la saisie : c'est ce qui donne l'impression d'un
          marche vivant plutot que d'une boite a idees. */}
      {produit.trim() && quartier ? (
        <Encart variante="info">
          {compterDemandesSimilaires(produit)} personnes ont déjà demandé{" "}
          {produit.trim().toLowerCase()} à {LIBELLE_QUARTIER[quartier]} cette
          semaine. Votre demande rejoindra la leur.
        </Encart>
      ) : null}
    </div>
  );

  if (estBureau) {
    return (
      <>
        <div className="mx-auto max-w-2xl px-4 py-8 lg:px-8">
          <h1 className="mb-5 text-2xl font-semibold text-texte lg:text-3xl">
            Demander un produit
          </h1>
          {formulaire}
          <div className="mt-8 max-w-sm">
            <Bouton desactive={!complet} onClick={() => setEnvoyee(true)}>
              Envoyer ma demande
            </Bouton>
          </div>
        </div>
        <PiedPage />
      </>
    );
  }

  return (
    <div className="pb-28">
      <EnTeteEcran titre="Demander un produit" onRetour={onRetour} />
      <div className="px-4 pt-5">{formulaire}</div>
      <BoutonAncre>
        <Bouton desactive={!complet} onClick={() => setEnvoyee(true)}>
          Envoyer ma demande
        </Bouton>
      </BoutonAncre>
    </div>
  );
}

/**
 * Le nombre affiche dans l'encart.
 *
 * **C'est un chiffre calcule a partir du texte, pas un vrai compte** : la table
 * des demandes agregees n'existe pas encore cote serveur. Il est deterministe
 * — le meme produit donne toujours le meme nombre — pour qu'il ne saute pas a
 * chaque frappe, ce qui se verrait tout de suite. A remplacer par
 * `GET /api/demandes/compte?produit=&quartier=` des que l'API existe.
 */
function compterDemandesSimilaires(produit: string): number {
  const graine = [...produit.trim().toLowerCase()].reduce(
    (total, lettre) => total + lettre.charCodeAt(0),
    0,
  );
  return 8 + (graine % 25);
}

/** L'ecran de confirmation, apres envoi. */
function EcranEnvoye({
  estBureau,
  onVoirMesDemandes,
  onRetour,
}: {
  estBureau: boolean;
  onVoirMesDemandes: () => void;
  onRetour: () => void;
}) {
  const corps = (
    <div className="flex flex-col items-center py-10 text-center">
      <span className="flex size-18 items-center justify-center rounded-full bg-succes-fond text-succes">
        <IconeCoche taille={40} />
      </span>
      <h2 className="mt-4 text-2xl font-semibold text-texte">
        Demande envoyée
      </h2>
      <p className="mt-2 max-w-80 text-texte-secondaire">
        Nous vous prévenons dès qu&apos;un groupeur lance un groupage pour ce
        produit.
      </p>
      <div className="mt-8 w-full max-w-72 space-y-3">
        <Bouton onClick={onVoirMesDemandes}>Voir mes demandes</Bouton>
        <Bouton style="secondaire" onClick={onRetour}>
          Retour aux groupages
        </Bouton>
      </div>
    </div>
  );

  if (estBureau) {
    return (
      <>
        <div className="mx-auto max-w-2xl px-4 py-8 lg:px-8">{corps}</div>
        <PiedPage />
      </>
    );
  }

  return (
    <div className="pb-10">
      <EnTeteEcran titre="Demander un produit" onRetour={onRetour} />
      <div className="px-4">{corps}</div>
    </div>
  );
}
