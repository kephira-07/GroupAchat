import { type Groupage } from "../../domaine/groupage";
import { formaterFrancs } from "../../domaine/format";
import CompteurTemps from "./CompteurTemps";
import { IconeVerifie } from "../../ui/Icones";

/**
 * La carte de la rangee « Se termine bientot » — **volontairement differente
 * de `CarteGroupage`.**
 *
 * ## Pourquoi deux formes de carte
 *
 * Les deux rangees de la page d'accueil ne disent pas la meme chose. La grille
 * du bas est un **catalogue** : on la parcourt, on compare, les cartes doivent
 * donc se ressembler pour que la comparaison soit juste. Cette rangee-ci est
 * une **alerte** : ces groupages ferment dans moins de 48 h, et qui les manque
 * ne les retrouvera pas.
 *
 * Deux messages, deux formes. Avec la meme carte des deux cotes, l'urgence ne
 * se verrait que dans le titre de section — c'est-a-dire nulle part, pour qui
 * fait defiler.
 *
 * | | `CarteGroupage` *(grille)* | **`CarteUrgente`** *(ici)* |
 * |---|---|---|
 * | Media | 4/3, texte en dessous | **3/4 vertical**, texte **pose dessus** |
 * | Compteur | sous le titre | **en haut du media**, premier element lu |
 * | Prix | `primaire` sur blanc | **blanc**, en grand, sur le voile |
 * | Contenu de la part | deux lignes | retire — ici on choisit, on ne compare pas |
 *
 * ## ⚠️ Le voile, et pourquoi il n'est pas decoratif
 *
 * Du texte blanc pose sur une photo n'a **pas de contraste calculable** : il
 * depend de l'image, et une photo claire — un carton beige, un sachet blanc —
 * le fait tomber sous 2:1 sans qu'aucun outil ne le signale.
 *
 * Le bloc de texte porte donc **son propre voile**, du bas vers son sommet, et
 * les deux bouts sont verifies dans le **pire cas, une photo entierement
 * blanche** :
 *
 * | Sous le texte | Couleur reelle | Blanc pur | Blanc a 85 % |
 * |---|---|---|---|
 * | `from-black/85` *(bas)* | `#262626` | **15,13:1** | **11,25:1** |
 * | `to-black/70` *(haut du bloc)* | `#4D4D4D` | **8,45:1** | **6,65:1** |
 *
 * **Le voile s'arrete avec le bloc de texte** au lieu de se fondre vers le
 * haut de la carte. Un degrade qui va jusqu'a `transparent` ne vaut que
 * 3,36:1 en son milieu : un titre sur deux lignes qui remonterait dans cette
 * zone deviendrait illisible sur une photo claire, et c'est exactement le
 * genre de panne qui ne se voit sur aucune des photos de demonstration.
 *
 * ⚠️ **Le compteur garde l'aplat `marque` a texte sombre** (§2.4). Du blanc
 * sur `#FF6A00` ne tient qu'a 2,87:1 : c'est interdit, et c'est la premiere
 * chose qu'on casse en redessinant une carte « plus visible ».
 *
 * Aucun prix barre, aucune pastille de reduction, aucun « au lieu de » (§3) —
 * la regle ne s'assouplit pas parce que la carte est plus vendeuse.
 */
export default function CarteUrgente({
  groupage,
  onOuvrir,
}: {
  groupage: Groupage;
  onOuvrir: (groupage: Groupage) => void;
}) {
  return (
    <li className="w-56 shrink-0 snap-start sm:w-64">
      <button
        type="button"
        onClick={() => onOuvrir(groupage)}
        className="group relative block aspect-3/4 w-full overflow-hidden rounded-2xl text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primaire"
      >
        {groupage.photo ? (
          <img
            src={groupage.photo}
            alt={groupage.photoAlt ?? groupage.produit}
            loading="lazy"
            decoding="async"
            className="absolute inset-0 size-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <span className="absolute inset-0 bg-surface-douce" />
        )}

        {/* Le compteur, en haut : c'est la raison d'etre de cette rangee, donc
            le premier element qu'on doit lire. Il porte son propre aplat, il
            n'a pas besoin du voile. */}
        <span className="absolute top-3 left-3">
          <CompteurTemps heuresRestantes={groupage.heuresRestantes} surMedia />
        </span>

        {/* Le bloc de texte et son voile ne font qu'un : le voile ne deborde
            pas, et il ne va jamais jusqu'a `transparent` sous une lettre. */}
        <span className="absolute inset-x-0 bottom-0 flex flex-col gap-1 bg-gradient-to-t from-black/85 to-black/70 p-4 pt-6">
          <span className="line-clamp-2 text-[15px] leading-snug font-semibold text-white">
            {groupage.produit}
          </span>

          <span className="flex items-baseline gap-1.5">
            <span className="text-xl font-bold text-white">
              {formaterFrancs(groupage.prixPart)}
            </span>
            {/* `white/85` : 6,65:1 au point le plus clair du voile. C'est la
                seule opacite de texte de ce composant, et elle est calculee. */}
            <span className="text-xs font-medium text-white/85">la part</span>
          </span>

          <span className="mt-0.5 flex items-center gap-1.5 text-xs text-white/85">
            <IconeVerifie taille={12} className="shrink-0" />
            {groupage.groupeur}
            <span aria-hidden="true">·</span>
            <strong className="font-semibold text-white">
              {groupage.acheteursConfirmes}
            </strong>
            confirmés
          </span>
        </span>
      </button>
    </li>
  );
}
