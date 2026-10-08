/**
 * Mise en forme des montants, des dates et du temps restant.
 *
 * Le vocabulaire visible est fixe par SPEC_ECRANS_FIGMA.md §3 : « 4 000 F CFA »
 * et « RESTE 2 JOURS ». Les variantes de couleur du compteur viennent du §2.4.
 */

/** Espace fine insecable, pour que « 4 000 » ne se coupe jamais en fin de ligne. */
const ESPACE_FINE = " ";
/** Espace insecable, entre le nombre et son unite. */
const ESPACE_INSECABLE = " ";

/**
 * « 4 000 F CFA ». Le prix complet partout ou l'utilisateur lit un montant
 * (§3) — le `F` seul reste reserve aux tableaux denses et a l'administration.
 *
 * `Intl` n'est pas utilise ici : son separateur de milliers varie selon
 * l'implementation de la WebView Android, et on veut un rendu identique
 * partout.
 */
export function formaterFrancs(montant: number): string {
  const entier = Math.round(montant).toString();
  const groupes: string[] = [];
  for (let fin = entier.length; fin > 0; fin -= 3) {
    groupes.unshift(entier.slice(Math.max(0, fin - 3), fin));
  }
  return `${groupes.join(ESPACE_FINE)}${ESPACE_INSECABLE}F${ESPACE_INSECABLE}CFA`;
}

/** « 12 octobre » — le mois en entier, l'annee est toujours l'annee en cours. */
export function formaterDateCourte(dateISO: string): string {
  const date = new Date(`${dateISO}T12:00:00`);
  if (Number.isNaN(date.getTime())) {
    return dateISO;
  }
  const mois = [
    "janvier",
    "février",
    "mars",
    "avril",
    "mai",
    "juin",
    "juillet",
    "août",
    "septembre",
    "octobre",
    "novembre",
    "décembre",
  ];
  return `${date.getDate()}${ESPACE_INSECABLE}${mois[date.getMonth()]}`;
}

/** Les quatre etats du `CompteurTemps` (§2.4). */
export type UrgenceTemps = "large" | "proche" | "derniere-heure" | "terminee";

export interface TempsRestant {
  urgence: UrgenceTemps;
  /** « RESTE 2 JOURS » — capitales, court, lisible sur une photo (§3). */
  libelle: string;
  /** Version lue a voix haute par un lecteur d'ecran. */
  libelleAccessible: string;
}

/**
 * Traduit un nombre d'heures en libelle et en niveau d'urgence.
 *
 * Les seuils : moins de 24 h est une urgence reelle (`danger`), jusqu'a
 * 72 h la cloture est proche (orange), au-dela le compteur reste sobre.
 * C'est le seul element de pression de l'application (§2.4) — il n'y a ni
 * minimum ni places limitees, donc il ne faut pas le banaliser.
 */
export function decrireTempsRestant(heuresRestantes: number): TempsRestant {
  if (heuresRestantes <= 0) {
    return {
      urgence: "terminee",
      libelle: "GROUPAGE CLÔTURÉ",
      libelleAccessible: "Groupage clôturé",
    };
  }

  if (heuresRestantes < 24) {
    const heures = Math.max(1, Math.round(heuresRestantes));
    return {
      urgence: "derniere-heure",
      libelle: `RESTE ${heures}${ESPACE_INSECABLE}H`,
      libelleAccessible: `Reste ${heures} heure${heures > 1 ? "s" : ""}`,
    };
  }

  const jours = Math.floor(heuresRestantes / 24);
  return {
    urgence: heuresRestantes <= 72 ? "proche" : "large",
    libelle: `RESTE ${jours}${ESPACE_INSECABLE}JOUR${jours > 1 ? "S" : ""}`,
    libelleAccessible: `Reste ${jours} jour${jours > 1 ? "s" : ""}`,
  };
}
