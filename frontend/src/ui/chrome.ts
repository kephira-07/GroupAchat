/**
 * Les deux chromes du produit — SPEC_ECRANS_FIGMA.md §1.2.
 *
 * L'application sert **deux publics qui ne font pas la meme chose** :
 * l'acheteur fait ses courses, le groupeur gere son affaire. Chacun a sa
 * couleur dominante, et le chrome dit immediatement de quel cote on se trouve.
 *
 * | | Acheteur (ecrans 1 a 12) | Groupeur (ecrans 13 a 21) |
 * |---|---|---|
 * | Dominante | **Orange** `#CC4A00` | **Bleu** `#1E3A8A` |
 * | Boutons, liens, onglet actif | Orange | Bleu |
 * | Role de la seconde couleur | Le bleu = **la garantie**, rien d'autre | L'orange = **l'urgence**, rien d'autre |
 *
 * **La regle de dominance, dans les deux cas :** une seule couleur porte
 * l'action, l'autre est un signal rare. **Au plus un element de la seconde
 * couleur par ecran** — si vous en comptez deux, l'un des deux est de trop.
 *
 * **Ne jamais les inverser.** Un ecran groupeur avec un bouton orange, ou un
 * ecran acheteur avec un onglet actif bleu, casse le seul repere permanent
 * qu'ont les deux publics.
 *
 * L'ecran A1 de l'administration n'a **aucun** de ces deux chromes : il est
 * neutre, et cette neutralite est utile — elle evite de confondre une capture
 * d'ecran interne avec le produit. Il n'a donc pas de valeur ici.
 *
 * Ce fichier ne contient qu'un type : c'est volontaire. Les couleurs elles-
 * memes vivent dans `index.css`, et les composants du `ui/` les appliquent.
 */
export type RoleChrome = "acheteur" | "groupeur";
