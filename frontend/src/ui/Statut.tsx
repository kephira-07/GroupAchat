import {
  LIBELLE_STATUT,
  type StatutCommande,
} from "../domaine/commande";

/**
 * `Statut` — SPEC_ECRANS_FIGMA.md §2.8. Hauteur 24, coins complets, texte 12.
 *
 * **La couleur se lit sans lire**, et c'est tout l'interet du composant :
 * bleu, Group Achat tient l'argent ; orange, ca avance ; vert, c'est fait ;
 * rouge, il y a un probleme ; gris, c'est clos (§1.2).
 *
 * « En cours de livraison » est le **seul statut en aplat vif** (`marque`,
 * texte `#14181F`) : c'est celui qui demande de l'attention aujourd'hui. Du
 * blanc sur cet orange ne tiendrait qu'a 2,87:1, d'ou le texte sombre.
 *
 * **Axe `role`.** Sur un ecran groupeur au chrome bleu, une pastille bleue se
 * fond dans le decor et ne signale plus rien. Les statuts « argent detenu » y
 * passent donc en neutre : du point de vue du groupeur, ces etats ne promettent
 * rien, ils constatent qu'un participant a paye. Les ecrans groupeur n'existent
 * pas encore, mais l'axe est la pour qu'on n'ait pas a reprendre le composant.
 */
const STYLES_ACHETEUR: Record<StatutCommande, string> = {
  payee: "bg-confiance-fond text-confiance",
  cloturee: "bg-confiance-fond text-confiance",
  "chez-le-groupeur": "bg-primaire-fond text-primaire-texte-sur-fond",
  "en-livraison": "bg-marque text-texte",
  livree: "bg-succes-fond text-succes",
  litige: "bg-danger-fond text-danger",
  remboursee: "bg-surface-douce text-texte-secondaire",
  annulee: "bg-danger-fond text-danger",
};

const NEUTRE = "bg-surface-douce text-texte-secondaire";

export default function Statut({
  statut,
  role = "acheteur",
}: {
  statut: StatutCommande;
  role?: "acheteur" | "groupeur";
}) {
  const argentDetenu = statut === "payee" || statut === "cloturee";
  const style =
    role === "groupeur" && argentDetenu ? NEUTRE : STYLES_ACHETEUR[statut];

  return (
    <span
      className={`inline-flex h-6 items-center rounded-full px-2.5 text-xs font-medium whitespace-nowrap ${style}`}
    >
      {LIBELLE_STATUT[statut]}
    </span>
  );
}
