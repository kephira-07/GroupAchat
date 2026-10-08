import { IconeBouclier } from "../../ui/Icones";

/**
 * `BandeauConfiance` — SPEC_ECRANS_FIGMA.md §2.6.
 *
 * **Le seul element bleu d'un ecran acheteur** (§1.2) : fond
 * `confiance-fond`, texte et bouclier `confiance`, coins 12, ni bordure ni
 * ombre. C'est parce que tout le reste est orange qu'il arrete l'oeil.
 *
 * Formulation contrainte par §1.7 : le groupeur etant paye a la cloture, on
 * ecrit « detenu jusqu'a la cloture », jamais « bloque jusqu'a la livraison ».
 */
export default function BandeauConfiance({
  taille = "compact",
}: {
  taille?: "compact" | "complet";
}) {
  return (
    <div className="flex items-start gap-2 rounded-xl bg-confiance-fond px-3 py-2.5 text-confiance">
      <IconeBouclier taille={20} className="mt-0.5 shrink-0" />
      <div className="text-sm">
        <p className="font-semibold">Groupeurs sélectionnés par Group Achat</p>
        {taille === "complet" ? (
          <p className="mt-0.5">
            Vous êtes livré, ou remboursé. Votre paiement est détenu par Group
            Achat jusqu&apos;à la clôture du groupage. Si le groupage
            n&apos;aboutit pas, vous êtes remboursé intégralement.
          </p>
        ) : (
          <p className="mt-0.5">Vous êtes livré, ou remboursé.</p>
        )}
      </div>
    </div>
  );
}
