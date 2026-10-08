import type { RoleChrome } from "./chrome";
import { IconeAlerte, IconeCoche, IconeInfo } from "./Icones";

/**
 * `Encart` — SPEC_ECRANS_FIGMA.md §2.11.
 *
 * Fond teinte, icone + texte, coins 12, **sans bordure ni ombre** : sur fond
 * blanc, un aplat de couleur douce se detache seul.
 *
 * Le bleu informe et rassure, l'orange presse (§1.2). Un encart `info` et un
 * encart `attention` ne disent donc pas la meme chose, et leur couleur le dit
 * avant le texte — ne pas les intervertir pour des raisons d'equilibre visuel.
 */
export type VarianteEncart = "info" | "attention" | "succes" | "danger";

const STYLES: Record<VarianteEncart, string> = {
  info: "bg-confiance-fond text-confiance",
  attention: "bg-primaire-fond text-primaire-texte-sur-fond",
  succes: "bg-succes-fond text-succes",
  danger: "bg-danger-fond text-danger",
};

const ICONES: Record<
  VarianteEncart,
  (p: { taille?: number; className?: string }) => React.ReactElement
> = {
  info: IconeInfo,
  attention: IconeAlerte,
  succes: IconeCoche,
  danger: IconeAlerte,
};

export default function Encart({
  variante,
  titre,
  role = "acheteur",
  children,
}: {
  variante: VarianteEncart;
  titre?: string;
  /**
   * Cote groupeur, un encart `info` bleu se fond dans le chrome bleu et ne
   * signale plus rien : il passe donc en neutre. L'orange, lui, y garde toute
   * sa force — c'est son seul metier de ce cote-la (§1.2).
   */
  role?: RoleChrome;
  children: React.ReactNode;
}) {
  const Icone = ICONES[variante];
  const style =
    role === "groupeur" && variante === "info"
      ? "bg-surface-douce text-texte-secondaire"
      : STYLES[variante];

  return (
    <div
      className={`flex items-start gap-2 rounded-xl px-3 py-2.5 text-sm ${style}`}
    >
      <Icone taille={18} className="mt-0.5 shrink-0" />
      <div>
        {titre ? <p className="font-semibold">{titre}</p> : null}
        <p className={titre ? "mt-0.5" : ""}>{children}</p>
      </div>
    </div>
  );
}
