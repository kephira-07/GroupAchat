import { useState } from "react";
import { LIBELLE_QUARTIER, QUARTIERS, type Quartier } from "../../domaine/groupage";
import {
  ecrireEconomieDonnees,
  lireEconomieDonnees,
} from "../../domaine/profil";
import { completerMonProfil, type Profil as ProfilCompte } from "../../api/session";
import { ErreurApi } from "../../api/client";
import EnTeteEcran from "../mise-en-page/EnTeteEcran";
import PiedPage from "../mise-en-page/PiedPage";
import Bouton from "../../ui/Bouton";
import Champ from "../../ui/Champ";
import Encart from "../../ui/Encart";
import EtatVide from "../../ui/EtatVide";
import {
  IconeBouclier,
  IconeCarton,
  IconeDemander,
  IconeProfil,
  IconeTelephone,
} from "../../ui/Icones";

/**
 * Onglet Profil — SPEC_ECRANS_FIGMA.md, ecran 1, « Les onglets, a definir
 * maintenant » : *« Mes informations, mes demandes, mode economie de donnees,
 * aide »*, rattache a « 12 et reglages ».
 *
 * C'est le quatrieme onglet de `BarreNav`, et jusqu'ici il renvoyait vers
 * l'ecran 12 faute d'exister.
 *
 * ## Les quatre blocs, et pourquoi dans cet ordre
 *
 * | Bloc | Ce qu'il porte |
 * |---|---|
 * | Mes informations | Nom, numero, adresse de livraison par defaut |
 * | Mes demandes | Le lien vers l'ecran 12 |
 * | Economie de donnees | La bascule du §1.6 regle 4 |
 * | Aide | Les trois promesses, redites la ou on les cherche |
 *
 * ## ⚠️ Deux etats, et aucun n'est un mur (§1.5)
 *
 * Un visiteur qui touche cet onglet **ne voit pas une invitation a se
 * connecter en travers de l'ecran**. Il voit le patron impose par le §1.5 —
 * un titre, une explication, « Voir les campagnes », et en lien discret « J'ai
 * deja un compte — me connecter ».
 *
 * ⚠️ **Mais la bascule economie de donnees reste au-dessus de cet etat
 * vide**, et c'est delibere. C'est une preference d'appareil, stockee en
 * local, qui n'a besoin d'aucun compte (voir `domaine/profil.ts`) : le
 * visiteur qui fait defiler le fil sans s'etre connecte est **exactement**
 * celui a qui le §1.6 la destine. La placer derriere le compte reviendrait a
 * la refuser a son premier public.
 *
 * ## ⚠️ Ce que cet ecran ne contient pas
 *
 * **Aucun profil de groupeur, aucun moyen d'en joindre un** : §1.7 et §7
 * regle 4 du cahier des charges l'interdisent, et c'est ce qui protege la
 * nous. Le pseudonyme n'est cliquable nulle part, ici pas davantage.
 *
 * **Pas de canal d'assistance.** Le bloc d'aide redit les regles du produit,
 * il ne promet ni numero, ni adresse, ni formulaire : le cahier des charges ne
 * tranche pas encore le canal du support. Inventer un contact serait pire que
 * de ne rien afficher.
 */
export default function Profil({
  estBureau,
  connecte,
  profil,
  onVoirCampagnes,
  onMesDemandes,
  onDemanderProduit,
  onSeConnecter,
  onProfilMisAJour,
  onSeDeconnecter,
}: {
  estBureau: boolean;
  connecte: boolean;
  /** Absent tant que la reconnexion automatique n'a pas repondu (§ `api/session`). */
  profil?: ProfilCompte;
  onVoirCampagnes: () => void;
  onMesDemandes: () => void;
  onDemanderProduit: () => void;
  onSeConnecter: () => void;
  onProfilMisAJour: (profil: ProfilCompte) => void;
  onSeDeconnecter: () => void;
}) {
  /* Lu une seule fois au montage : `lireEconomieDonnees` touche
     `localStorage`, et le relire a chaque rendu serait un acces disque par
     frappe pour une valeur qui ne change qu'ici. */
  const [economie, setEconomie] = useState(lireEconomieDonnees);

  const basculerEconomie = () => {
    const suivant = !economie;
    setEconomie(suivant);
    ecrireEconomieDonnees(suivant);
  };

  const contenu = (
    <div className="space-y-6">
      {connecte ? (
        <BlocInformations
          profil={profil}
          onProfilMisAJour={onProfilMisAJour}
        />
      ) : null}

      {connecte ? (
        <BlocMesDemandes onMesDemandes={onMesDemandes} />
      ) : null}

      <BlocEconomieDonnees actif={economie} onBasculer={basculerEconomie} />

      <BlocAide />

      {!connecte ? (
        /* Le patron du §1.5, decline pour cet onglet. Il arrive **apres** la
           bascule : la preference d'affichage ne depend pas du compte. */
        <EtatVide
          titre="Votre profil apparaîtra ici"
          explication="Commandez une part dans une campagne : votre compte se crée au moment de payer, et vous retrouverez ici vos informations et vos demandes."
          actionLibelle="Voir les campagnes"
          registre="attente"
          onAction={onVoirCampagnes}
          lienSecondaire={{
            libelle: "J'ai déjà un compte — me connecter",
            onClick: onSeConnecter,
          }}
        />
      ) : (
        <BlocDeconnexion onSeDeconnecter={onSeDeconnecter} />
      )}
    </div>
  );

  if (estBureau) {
    return (
      <>
        <div className="mx-auto max-w-[1280px] px-4 py-8 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h1 className="text-2xl font-semibold text-texte lg:text-3xl">
              Mon profil
            </h1>
            {connecte ? (
              <div className="w-full max-w-xs">
                <Bouton style="secondaire" onClick={onDemanderProduit}>
                  Demander un produit
                </Bouton>
              </div>
            ) : null}
          </div>
          <div className="mt-6 max-w-2xl">{contenu}</div>
        </div>
        <PiedPage />
      </>
    );
  }

  return (
    <div className="pb-18">
      <EnTeteEcran titre="Profil" />
      <div className="px-4 py-2">{contenu}</div>
    </div>
  );
}

/* ── Mes informations ────────────────────────────────────────────────────── */

/**
 * Nom, numero, adresse de livraison par defaut.
 *
 * ⚠️ **Le numero ne se modifie pas ici.** Il *est* l'identifiant du compte :
 * le changer serait changer de compte, ce qui demande un nouveau code SMS, pas
 * un champ de formulaire. La feuille de connexion (§ecran 4) est le seul
 * endroit ou un numero est etabli, et c'est ce qui garantit qu'il a ete prouve.
 *
 * ⚠️ **Modifier l'adresse ici ne touche aucune commande deja passee.** Le
 * livreur doit voir l'adresse qui valait au moment de la commande : la
 * position est conservee *sur la commande* (§6 du PRD), pas lue sur le compte.
 * Un demenagement ne doit pas derouter un colis en cours de livraison.
 */
function BlocInformations({
  profil,
  onProfilMisAJour,
}: {
  profil?: ProfilCompte;
  onProfilMisAJour: (profil: ProfilCompte) => void;
}) {
  const [edition, setEdition] = useState(false);
  const [nom, setNom] = useState(profil?.nom ?? "");
  const [quartier, setQuartier] = useState<Quartier | undefined>(
    profil?.quartier as Quartier | undefined,
  );
  const [repere, setRepere] = useState(profil?.repere ?? "");
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState<string>();

  if (!profil) {
    /* La reconnexion automatique n'a pas encore repondu. Un squelette plutot
       qu'un vide : l'onglet est deja ouvert, et afficher « aucune
       information » ferait croire le compte vide. */
    return (
      <Bloc titre="Mes informations" Icone={IconeProfil}>
        <div className="space-y-2" aria-hidden="true">
          <div className="h-4 w-32 animate-pulse rounded bg-surface-douce" />
          <div className="h-4 w-48 animate-pulse rounded bg-surface-douce" />
        </div>
        <p className="sr-only">Chargement de vos informations.</p>
      </Bloc>
    );
  }

  const enregistrer = () => {
    setEnvoi(true);
    setErreur(undefined);
    completerMonProfil({
      nom: nom.trim() || undefined,
      quartier,
      repere: repere.trim() || undefined,
    })
      .then((misAJour) => {
        onProfilMisAJour(misAJour);
        setEdition(false);
      })
      .catch((e: unknown) => {
        /* Le message du serveur s'il en donne un, sinon une phrase qui dit
           quoi faire. « Erreur 500 » n'aide personne a Lome. */
        setErreur(
          e instanceof ErreurApi && e.message
            ? e.message
            : "Vos informations n'ont pas pu être enregistrées. Vérifiez votre connexion et réessayez.",
        );
      })
      .finally(() => setEnvoi(false));
  };

  if (!edition) {
    return (
      <Bloc titre="Mes informations" Icone={IconeProfil}>
        <dl className="divide-y divide-bordure">
          <Ligne libelle="Nom" valeur={profil.nom || "Non renseigné"} />
          <Ligne libelle="Numéro" valeur={profil.telephone} />
          <Ligne
            libelle="Livraison"
            valeur={
              profil.quartier
                ? `${LIBELLE_QUARTIER[profil.quartier as Quartier] ?? profil.quartier}${
                    profil.repere ? ` — ${profil.repere}` : ""
                  }`
                : "Non renseignée"
            }
          />
        </dl>
        <div className="mt-4 max-w-xs">
          <Bouton style="secondaire" onClick={() => setEdition(true)}>
            Modifier
          </Bouton>
        </div>
      </Bloc>
    );
  }

  return (
    <Bloc titre="Mes informations" Icone={IconeProfil}>
      <div className="space-y-4">
        <Champ
          libelle="Nom"
          valeur={nom}
          onChanger={setNom}
          exemple="Akosua Doe"
          aide="Il n'est montré qu'au livreur, le jour de la livraison."
        />

        {/* Le numero est affiche, jamais modifiable : voir l'en-tete. */}
        <div>
          <p className="text-sm font-medium text-texte">Numéro</p>
          <p className="mt-1 flex items-center gap-2 text-texte-secondaire">
            <IconeTelephone taille={18} />
            {profil.telephone}
          </p>
          <p className="mt-1 text-sm text-texte-secondaire">
            Il identifie votre compte. Pour en changer, connectez-vous avec le
            nouveau numéro.
          </p>
        </div>

        <div>
          <p className="text-sm font-medium text-texte">Quartier de livraison</p>
          {/* Les memes pastilles qu'aux ecrans 5 et 11 : une liste fermee,
              parce que les frais de livraison se calculent par quartier
              (§11.1) et qu'un champ libre ne se calcule pas. */}
          <div className="mt-2 flex flex-wrap gap-2">
            {QUARTIERS.map((unQuartier) => {
              const choisi = unQuartier === quartier;
              return (
                <button
                  key={unQuartier}
                  type="button"
                  aria-pressed={choisi}
                  onClick={() => setQuartier(unQuartier)}
                  className={`inline-flex min-h-12 items-center rounded-full px-4 text-sm font-medium ${
                    choisi
                      ? "bg-primaire text-white"
                      : "bg-surface-douce text-texte"
                  }`}
                >
                  {LIBELLE_QUARTIER[unQuartier]}
                </button>
              );
            })}
          </div>
        </div>

        <Champ
          libelle="Repère"
          valeur={repere}
          onChanger={setRepere}
          exemple="En face de la pharmacie du marché"
          aide="À Lomé, le repère vaut plus que la coordonnée : c'est lui que le livreur cherche."
        />

        {erreur ? <Encart variante="danger">{erreur}</Encart> : null}

        <div className="flex flex-wrap gap-3">
          <div className="min-w-40 flex-1">
            <Bouton onClick={enregistrer} chargement={envoi}>
              Enregistrer
            </Bouton>
          </div>
          <div className="min-w-32 flex-1">
            <Bouton
              style="secondaire"
              desactive={envoi}
              onClick={() => {
                /* On remet les valeurs du compte : un abandon ne doit pas
                   laisser le formulaire a moitie modifie au prochain clic
                   sur « Modifier ». */
                setNom(profil.nom ?? "");
                setQuartier(profil.quartier as Quartier | undefined);
                setRepere(profil.repere ?? "");
                setErreur(undefined);
                setEdition(false);
              }}
            >
              Annuler
            </Bouton>
          </div>
        </div>
      </div>
    </Bloc>
  );
}

/* ── Mes demandes ────────────────────────────────────────────────────────── */

function BlocMesDemandes({ onMesDemandes }: { onMesDemandes: () => void }) {
  return (
    <Bloc titre="Mes demandes" Icone={IconeDemander}>
      <p className="text-texte-secondaire">
        Les produits que vous avez demandés, et ceux qu'un groupeur a repris en
        campagne.
      </p>
      <div className="mt-4 max-w-xs">
        <Bouton style="secondaire" onClick={onMesDemandes}>
          Voir mes demandes
        </Bouton>
      </div>
    </Bloc>
  );
}

/* ── Economie de donnees ─────────────────────────────────────────────────── */

/**
 * La bascule du §1.6 regle 4.
 *
 * Un vrai `<input type="checkbox">`, pas un `<div>` avec un `onClick` : la
 * tabulation doit l'atteindre et un lecteur d'ecran doit annoncer son etat.
 * L'apparence d'interrupteur est posee par-dessus en CSS.
 */
function BlocEconomieDonnees({
  actif,
  onBasculer,
}: {
  actif: boolean;
  onBasculer: () => void;
}) {
  return (
    <Bloc titre="Économie de données" Icone={IconeCarton}>
      <label className="flex cursor-pointer items-start gap-4">
        <span className="min-w-0 flex-1">
          <span className="block font-medium text-texte">
            Images seulement, aucune vidéo
          </span>
          <span className="mt-1 block text-sm text-texte-secondaire">
            Le fil affiche la photo de couverture et ne charge aucune vidéo. Les
            logos des partenaires cèdent la place à du texte. À garder activé
            sur un forfait limité.
          </span>
        </span>

        <input
          type="checkbox"
          checked={actif}
          onChange={onBasculer}
          className="peer sr-only"
        />
        {/* La piste et la pastille.
            ⚠️ L'apparence est pilotee par `actif`, l'etat React, et **pas**
            par `peer-checked:`. Le modificateur `peer-*` de Tailwind produit
            un selecteur de freres (`~`) : il atteint la piste, qui est bien
            un frere de la case, mais **jamais la pastille**, qui en est un
            descendant. Ecrite en `peer-checked:`, elle ne se deplacerait
            donc pas. `peer-focus-visible` reste, lui, sur la piste — ou il
            fonctionne. */}
        <span
          aria-hidden="true"
          className={`relative mt-1 h-7 w-12 shrink-0 rounded-full transition-colors peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-primaire ${
            actif ? "bg-primaire" : "bg-bordure"
          }`}
        >
          <span
            className={`absolute top-1 left-1 size-5 rounded-full bg-white transition-transform ${
              actif ? "translate-x-5" : ""
            }`}
          />
        </span>
      </label>
    </Bloc>
  );
}

/* ── Aide ────────────────────────────────────────────────────────────────── */

/**
 * Les trois promesses du produit, redites la ou on vient les chercher.
 *
 * Ce ne sont pas des textes d'habillage : chacun repond a une inquietude que
 * le §1 du cahier des charges documente, et chacun reprend la formulation
 * autorisee. ⚠️ « **detenu jusqu'a la cloture** », jamais « bloque jusqu'a la
 * livraison » — le groupeur est paye integralement a la cloture (§10.1), et le
 * tableau du §1.7 de la spec des ecrans interdit l'autre formulation.
 */
const AIDE: { question: string; reponse: string }[] = [
  {
    question: "Que devient mon argent avant la livraison ?",
    reponse:
      "Il est détenu par Group Achat jusqu'à la clôture de la campagne. Si la campagne n'aboutit pas, vous êtes remboursé intégralement.",
  },
  {
    question: "À quoi sert mon code de livraison ?",
    reponse:
      "Vous vérifiez la marchandise devant le livreur, puis vous lui donnez le code. Si ce n'est pas ce que vous avez commandé, vous refusez le colis.",
  },
  {
    question: "Pourquoi je ne vois qu'un pseudonyme de groupeur ?",
    reponse:
      "Les groupeurs sont sélectionnés un par un par Group Achat, et c'est à Group Achat que vous faites confiance, pas à eux. C'est aussi ce qui vous évite d'être démarché en privé.",
  },
];

function BlocAide() {
  return (
    <Bloc titre="Aide" Icone={IconeBouclier}>
      <dl className="divide-y divide-bordure">
        {AIDE.map(({ question, reponse }) => (
          <div key={question} className="py-3 first:pt-0 last:pb-0">
            <dt className="font-medium text-texte">{question}</dt>
            <dd className="mt-1 text-sm text-texte-secondaire">{reponse}</dd>
          </div>
        ))}
      </dl>
    </Bloc>
  );
}

/* ── Deconnexion ─────────────────────────────────────────────────────────── */

/**
 * ⚠️ Pas de confirmation, et c'est voulu : il n'y a rien a perdre. Les
 * commandes vivent sur le compte, pas dans la session — se reconnecter avec le
 * meme numero les retrouve toutes.
 */
function BlocDeconnexion({ onSeDeconnecter }: { onSeDeconnecter: () => void }) {
  return (
    <div className="pb-4">
      <Bouton style="secondaire" onClick={onSeDeconnecter}>
        Me déconnecter
      </Bouton>
      <p className="mt-2 text-sm text-texte-secondaire">
        Vos commandes restent sur votre compte. Reconnectez-vous avec le même
        numéro pour les retrouver.
      </p>
    </div>
  );
}

/* ── Les deux briques de presentation ────────────────────────────────────── */

function Bloc({
  titre,
  Icone,
  children,
}: {
  titre: string;
  Icone: (p: { taille?: number }) => React.ReactElement;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-bordure p-4">
      <h2 className="flex items-center gap-2 font-semibold text-texte">
        <span className="text-primaire">
          <Icone taille={20} />
        </span>
        {titre}
      </h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function Ligne({ libelle, valeur }: { libelle: string; valeur: string }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-2 py-3 first:pt-0 last:pb-0">
      <dt className="text-sm text-texte-secondaire">{libelle}</dt>
      <dd className="font-medium text-texte">{valeur}</dd>
    </div>
  );
}
