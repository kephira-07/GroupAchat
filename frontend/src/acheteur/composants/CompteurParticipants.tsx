import { IconeGroupage } from "../../ui/Icones";

/**
 * `CompteurParticipants` — SPEC_ECRANS_FIGMA.md §2.5.
 *
 * « 32 acheteurs confirmés » (§3 : jamais « commandes », jamais
 * « participants »). **Ni fraction ni jauge** : il n'y a pas de plafond ni de
 * minimum sur un groupage, donc il n'existe aucun denominateur a remplir. Un
 * nombre qui monte suffit, et il rassure.
 */
export default function CompteurParticipants({
  acheteursConfirmes,
  avecIcone = false,
}: {
  acheteursConfirmes: number;
  avecIcone?: boolean;
}) {
  return (
    <span className="inline-flex items-center gap-1">
      {avecIcone ? <IconeGroupage taille={16} /> : null}
      <span>
        <strong className="font-semibold text-texte">
          {acheteursConfirmes}
        </strong>
        {acheteursConfirmes > 1
          ? " acheteurs confirmés"
          : " acheteur confirmé"}
      </span>
    </span>
  );
}
