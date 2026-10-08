import {
  IconeAccueil,
  IconeCarton,
  IconePortefeuille,
  IconeRetour,
  IconeStatistiques,
} from "../../ui/Icones";

/**
 * Le chrome du cote groupeur — SPEC_ECRANS_FIGMA.md §1.2, ecran 13.
 *
 * **Bleu dominant.** En-tete `confiance` a texte blanc (10,36:1), onglet actif
 * `confiance`. **L'orange n'y est jamais une action, toujours une alerte** :
 * il ne sort que pour « A faire aujourd'hui », les comptes a rebours et le
 * bouton flottant de creation.
 *
 * Le fond est **blanc comme partout** (§1.0) : seuls l'en-tete et les cartes
 * de chiffres portent le bleu. Un ecran entierement bleu ferait disparaitre
 * les encarts et les statuts, qui comptent sur le fond blanc pour se detacher.
 */
export type OngletGroupeur =
  | "tableau-de-bord"
  | "campagnes"
  | "statistiques"
  | "portefeuille";

const ONGLETS: {
  cle: OngletGroupeur;
  libelle: string;
  Icone: (p: { taille?: number }) => React.ReactElement;
}[] = [
  { cle: "tableau-de-bord", libelle: "Tableau de bord", Icone: IconeAccueil },
  { cle: "campagnes", libelle: "Mes campagnes", Icone: IconeCarton },
  { cle: "statistiques", libelle: "Statistiques", Icone: IconeStatistiques },
  { cle: "portefeuille", libelle: "Portefeuille", Icone: IconePortefeuille },
];

/**
 * La barre de navigation groupeur. Quatre onglets, fixes par l'ecran 13.
 *
 * C'est l'arrivee de l'ecran 21 qui fixe le quatrieme : sans lui, les
 * statistiques resteraient un ecran qu'on ne retrouve pas.
 */
export function BarreNavGroupeur({
  actif,
  onChanger,
}: {
  actif: OngletGroupeur;
  onChanger: (onglet: OngletGroupeur) => void;
}) {
  return (
    <nav
      aria-label="Navigation groupeur"
      className="fixed inset-x-0 bottom-0 z-20 mx-auto h-18 max-w-[430px] border-t border-bordure bg-white"
    >
      <ul className="flex h-full">
        {ONGLETS.map(({ cle, libelle, Icone }) => {
          const estActif = cle === actif;
          return (
            <li key={cle} className="flex-1">
              <button
                type="button"
                aria-current={estActif ? "page" : undefined}
                onClick={() => onChanger(cle)}
                className={`flex size-full flex-col items-center justify-center gap-1 px-1 ${
                  /* Onglet actif en `confiance`, jamais en orange (§1.2). */
                  estActif ? "text-confiance" : "text-texte-secondaire"
                }`}
              >
                <Icone taille={24} />
                <span className="text-center text-[11px] leading-tight font-medium">
                  {libelle}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/**
 * L'en-tete bleu des ecrans groupeur. Fond `confiance`, texte blanc.
 *
 * `onRetour` est absent sur les ecrans de premier niveau, et volontairement
 * absent aussi sur l'ecran 16 : **on ne quitte pas l'ecran de decision sans
 * decider ou sans le refermer explicitement**.
 */
export function EnTeteGroupeur({
  titre,
  sousTitre,
  onRetour,
  action,
}: {
  titre: string;
  sousTitre?: string;
  onRetour?: () => void;
  action?: React.ReactNode;
}) {
  return (
    <header className="bg-confiance px-4 pt-5 pb-5 text-white">
      <div className="flex items-start gap-2">
        {onRetour ? (
          <button
            type="button"
            onClick={onRetour}
            aria-label="Retour"
            className="-ml-2 flex size-11 shrink-0 items-center justify-center text-white"
          >
            <IconeRetour />
          </button>
        ) : null}

        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-semibold">{titre}</h1>
          {sousTitre ? (
            <p className="mt-0.5 text-sm text-white/85">{sousTitre}</p>
          ) : null}
        </div>

        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
    </header>
  );
}
