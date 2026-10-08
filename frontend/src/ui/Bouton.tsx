import type { RoleChrome } from "./chrome";

/**
 * `Bouton` — SPEC_ECRANS_FIGMA.md §2.7.
 *
 * Hauteur 52, coins 10, pleine largeur moins les marges.
 *
 * **Deux axes : `style` et `role`**, parce que la couleur d'action depend du
 * cote du produit ou l'on se trouve (§1.2). Cote acheteur elle est orange,
 * cote groupeur elle est bleue — et ce n'est pas un gout : le bouton groupeur
 * contraste a **10,36:1** contre 4,62:1 pour l'orange. Ses ecrans portent des
 * decisions sur des sommes a cinq chiffres, donc ils y gagnent.
 *
 * **Jamais `marque` `#FF6A00` en fond avec du texte blanc** : 2,87:1,
 * illisible. Le seul bouton autorise dans l'orange vif est le bouton flottant
 * du groupeur, et son texte y est `#14181F`.
 */
export type StyleBouton = "primaire" | "secondaire" | "danger-texte";

const STYLES: Record<RoleChrome, Record<StyleBouton, string>> = {
  acheteur: {
    primaire: "bg-primaire text-white active:bg-primaire-presse",
    secondaire:
      "border-[1.5px] border-primaire text-primaire active:bg-primaire-fond",
    "danger-texte": "text-danger active:bg-danger-fond",
  },
  groupeur: {
    primaire: "bg-confiance text-white active:bg-confiance-presse",
    secondaire:
      "border-[1.5px] border-confiance text-confiance active:bg-confiance-fond",
    "danger-texte": "text-danger active:bg-danger-fond",
  },
};

/** §2.7 : l'etat desactive est le meme quel que soit le style. */
const DESACTIVE = "bg-surface-douce text-texte-secondaire";

export default function Bouton({
  style = "primaire",
  role = "acheteur",
  desactive = false,
  chargement = false,
  pleineLargeur = true,
  type = "button",
  onClick,
  children,
}: {
  style?: StyleBouton;
  role?: RoleChrome;
  desactive?: boolean;
  chargement?: boolean;
  pleineLargeur?: boolean;
  type?: "button" | "submit";
  onClick?: () => void;
  children: React.ReactNode;
}) {
  const inerte = desactive || chargement;
  return (
    <button
      type={type}
      disabled={inerte}
      aria-busy={chargement || undefined}
      onClick={onClick}
      className={`inline-flex h-13 items-center justify-center gap-2 rounded-[10px] px-5 font-semibold transition-colors ${
        pleineLargeur ? "w-full" : ""
      } ${inerte ? DESACTIVE : STYLES[role][style]}`}
    >
      {chargement ? (
        <span
          className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent"
          aria-hidden="true"
        />
      ) : null}
      {children}
    </button>
  );
}

/**
 * Le bouton principal ancre en bas, sur fond blanc, avec **une ombre haute
 * tres legere** : c'est l'un des trois seuls elements autorises a porter une
 * ombre, parce qu'il flotte reellement au-dessus du contenu (§1.0, §2.7).
 */
export function BoutonAncre({
  children,
  auDessusDeLaBarreNav = false,
}: {
  children: React.ReactNode;
  auDessusDeLaBarreNav?: boolean;
}) {
  return (
    /* Sur un grand ecran, un bouton colle au bas de la fenetre n'a plus de
       sens : il n'y a pas de pouce a menager, et il mange la hauteur utile.
       `lg:static` le rend au flux, et il perd son ombre avec son flottement —
       le §1.0 ne tolere l'ombre que sur ce qui flotte vraiment. */
    <div
      className={`fixed inset-x-0 z-20 mx-auto max-w-[430px] bg-white px-4 py-3 shadow-[0_-2px_12px_rgba(20,24,31,0.06)] lg:static lg:max-w-none lg:px-0 lg:shadow-none ${
        auDessusDeLaBarreNav ? "bottom-18" : "bottom-0"
      }`}
    >
      {children}
    </div>
  );
}
