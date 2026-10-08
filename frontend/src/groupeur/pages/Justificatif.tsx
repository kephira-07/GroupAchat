import { useState } from "react";
import { formaterFrancs } from "../../domaine/format";
import { EnTeteGroupeur } from "../mise-en-page/ChromeGroupeur";
import Bouton from "../../ui/Bouton";
import Champ from "../../ui/Champ";
import Encart from "../../ui/Encart";
import FriseEtapes from "../../ui/FriseEtapes";
import { IconeCoche, IconeDepot } from "../../ui/Icones";

/**
 * Ecran 17 — Deposer un justificatif d'achat. SPEC_ECRANS_FIGMA.md, ecran 17.
 *
 * **La piece maitresse du dispositif de securisation** (§10 du cahier des
 * charges). A traiter avec autant de soin que le paiement : c'est le seul
 * moment ou l'on verifie que l'argent verse a servi a acheter la marchandise.
 *
 * **Deux depots successifs, dans cet ordre** : le devis avant de recevoir le
 * versement, le recu apres l'achat. L'ordre n'est pas administratif, il est
 * protecteur — un devis valide conditionne le deblocage.
 *
 * **Le delai du recu est une date et une heure, pas « sous 72 h ».** Un delai
 * relatif oblige a calculer, et on se trompe.
 *
 * ⚠️ **L'etat « refuse » est celui qu'on oublie et celui qui arrivera le plus
 * souvent** : une photo de recu prise a la va-vite dans un marche est rarement
 * nette du premier coup. Il est donc traite ici comme un etat normal du
 * parcours, pas comme une erreur.
 *
 * **Variante a prevoir** : au-dela d'un certain montant, Group Achat regle le
 * fournisseur elle-meme et le groupeur ne recoit rien en main (§10.3). Le
 * seuil n'est pas fixe, mais la variante existera — elle est donc dessinee.
 */
type Etat = "a-deposer" | "en-verification" | "refuse" | "valide";

export default function Justificatif({
  montantVerse = 121600,
  onRetour,
}: {
  montantVerse?: number;
  onRetour: () => void;
}) {
  const [phase, setPhase] = useState<"devis" | "recu">("devis");
  const [etat, setEtat] = useState<Etat>("a-deposer");
  const [montant, setMontant] = useState("");
  const [fournisseur, setFournisseur] = useState("");
  /** Au-dela du seuil, Group Achat paie le fournisseur directement (§10.3). */
  const [paiementDirect] = useState(false);

  const estDevis = phase === "devis";

  return (
    <div className="pb-28">
      <EnTeteGroupeur
        titre={estDevis ? "Devis de votre fournisseur" : "Reçu de paiement"}
        sousTitre={estDevis ? "Étape 1 sur 2" : "Étape 2 sur 2"}
        onRetour={onRetour}
      />

      <div className="space-y-5 px-4 pt-5">
        {estDevis ? (
          paiementDirect ? (
            <Encart variante="info" role="groupeur">
              Group Achat règle directement votre fournisseur sur la base de ce
              devis. Vous recevrez la confirmation du paiement.
            </Encart>
          ) : (
            <p className="text-texte-secondaire">
              Déposez le devis ou la facture. Vos{" "}
              <strong className="font-semibold text-texte">
                {formaterFrancs(montantVerse)}
              </strong>{" "}
              sont versés après vérification.
            </p>
          )
        ) : (
          /* Une date et une heure, jamais « sous 72 h ». */
          <Encart variante="attention" role="groupeur" titre="Délai">
            Déposez votre reçu <strong>avant le 9 octobre à 14 h</strong>. Sans
            reçu, la campagne est annulée et les acheteurs remboursés.
          </Encart>
        )}

        {etat === "refuse" ? (
          <Encart variante="danger" role="groupeur" titre="Document refusé">
            Document illisible. Déposez une photo plus nette.
          </Encart>
        ) : null}

        {etat === "valide" ? (
          <div className="flex items-start gap-2 rounded-xl bg-succes-fond px-3 py-3 text-succes">
            <IconeCoche taille={20} className="mt-0.5 shrink-0" />
            <p className="text-sm font-semibold">
              {formaterFrancs(montantVerse)} versés le 7 octobre
            </p>
          </div>
        ) : null}

        {etat === "en-verification" ? (
          <section>
            <p className="font-medium text-texte">
              En cours de vérification — réponse sous 4 h ouvrées
            </p>
            <div className="mt-3">
              <FriseEtapes
                indiceEnCours={1}
                etapes={[
                  { libelle: "Document déposé", detail: "il y a quelques instants" },
                  { libelle: "Vérification", detail: "sous 4 h ouvrées" },
                  {
                    libelle: estDevis ? "Versement" : "Campagne confirmée",
                    detail: estDevis
                      ? formaterFrancs(montantVerse)
                      : "les acheteurs sont prévenus",
                  },
                ]}
              />
            </div>
            <div className="mt-5 space-y-3">
              {/* De quoi montrer les deux issues en demonstration. */}
              <Bouton role="groupeur" onClick={() => setEtat("valide")}>
                Simuler : document validé
              </Bouton>
              <Bouton style="danger-texte" onClick={() => setEtat("refuse")}>
                Simuler : document refusé
              </Bouton>
            </div>
          </section>
        ) : null}

        {etat === "a-deposer" || etat === "refuse" ? (
          <>
            <Champ
              libelle={estDevis ? "Montant du devis" : "Montant payé"}
              valeur={montant}
              onChanger={(v) => setMontant(v.replace(/\D/g, ""))}
              inputMode="numeric"
              exemple="118000"
              aide={montant ? `Soit ${formaterFrancs(Number(montant))}` : undefined}
            />

            {estDevis ? (
              <Champ
                libelle="Nom du fournisseur"
                valeur={fournisseur}
                onChanger={setFournisseur}
                exemple="Établissements Kodjo"
              />
            ) : null}

            <div className="rounded-xl border border-dashed border-bordure p-6 text-center">
              <IconeDepot taille={32} className="mx-auto text-texte-secondaire" />
              <p className="mt-2 font-medium text-texte">
                {estDevis ? "Photo ou PDF du devis" : "Photo du reçu"}
              </p>
              <p className="mt-1 text-sm text-texte-secondaire">
                Cadrez bien le document et évitez les reflets.
              </p>
              <div className="mx-auto mt-3 max-w-56">
                <Bouton role="groupeur" style="secondaire">
                  {etat === "refuse" ? "Déposer à nouveau" : "Déposer un document"}
                </Bouton>
              </div>
            </div>
          </>
        ) : null}
      </div>

      {etat === "a-deposer" || etat === "refuse" ? (
        <div className="fixed inset-x-0 bottom-0 z-20 mx-auto max-w-[430px] bg-white px-4 py-3 shadow-[0_-2px_12px_rgba(20,24,31,0.06)]">
          <Bouton
            role="groupeur"
            desactive={montant === ""}
            onClick={() => setEtat("en-verification")}
          >
            {estDevis ? "Envoyer pour vérification" : "Envoyer"}
          </Bouton>
        </div>
      ) : null}

      {etat === "valide" && estDevis ? (
        <div className="fixed inset-x-0 bottom-0 z-20 mx-auto max-w-[430px] bg-white px-4 py-3 shadow-[0_-2px_12px_rgba(20,24,31,0.06)]">
          <Bouton
            role="groupeur"
            onClick={() => {
              setPhase("recu");
              setEtat("a-deposer");
              setMontant("");
            }}
          >
            Déposer mon reçu de paiement
          </Bouton>
        </div>
      ) : null}
    </div>
  );
}
