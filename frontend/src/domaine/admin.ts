/**
 * Le tableau de bord administrateur — ecran A1.
 *
 * **C'est la seule vue cote administrateur.** Tout le reste — fiches,
 * recherche, edition, actions — vit dans l'admin Django et ne se dessine pas
 * (§13.6 du cahier des charges). Cette page existe parce que c'est precisement
 * ce que l'admin Django ne sait pas faire : donner une vue d'ensemble en un
 * ecran.
 *
 * **Trois choses n'y figurent jamais**, et ce sont des absences voulues :
 *
 * - **aucune donnee personnelle**. Des compteurs et des montants. Un nom
 *   n'apparait qu'une fois le dossier ouvert, et cet acces est journalise
 *   (§13.5). Les types ci-dessous n'ont donc pas de champ d'identite, sauf
 *   l'alerte, ou le groupeur concerne est le sujet meme de l'alerte ;
 * - **aucun bouton qui deplace de l'argent**. Depuis une vue d'ensemble on
 *   *va vers* un dossier ; on ne rembourse pas en un clic sans l'avoir ouvert.
 *   Toute action sur l'argent est tracee et motivee (§18.3) ;
 * - **le nombre d'inscrits en grand**. C'est la mesure qui flatte et n'engage
 *   a rien. Ce qui compte est le nombre de campagnes allees jusqu'a la
 *   livraison.
 */

export type GraviteAlerte = "danger" | "attention";

export interface Alerte {
  id: string;
  gravite: GraviteAlerte;
  texte: string;
  /** Le libelle du lien vers le dossier concerne. */
  lien: string;
}

export interface FileDeTravail {
  id: string;
  libelle: string;
  nombre: number;
  /**
   * Le plus ancien en attente, en jours.
   *
   * **C'est cette ligne qui fait agir, pas le compteur.** Six dossiers vieux
   * d'une heure ne sont pas un probleme ; un dossier vieux de neuf jours en
   * est un.
   */
  plusAncienJours?: number;
  /**
   * Vrai pour « Livraisons non confirmees ».
   *
   * C'est la **seule file ou notre propre argent est expose**, puisque le
   * groupeur a deja ete paye. Les autres coutent de la confiance ; celle-ci
   * coute du cash — et un ecran qui les traite a egalite ment sur les
   * priorites. Elle porte donc un filet `danger` et non `bordure`.
   */
  argentExpose?: boolean;
}

export interface Indicateur {
  id: string;
  libelle: string;
  valeur: string;
  detail?: string;
}

export interface LigneActivite {
  id: string;
  date: string;
  texte: string;
}

/**
 * Le rapprochement entre l'argent detenu calcule et le solde reel.
 *
 * **C'est la ligne la plus serieuse de l'ecran.** Le jour ou les deux
 * divergent, quelque chose ne va pas, et il faut le voir tout de suite — pas
 * le decouvrir au prochain rapprochement mensuel.
 */
export interface Rapprochement {
  /** 0 quand tout concorde. Positif ou negatif sinon. */
  ecart: number;
}
