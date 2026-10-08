/**
 * L'inscription d'un groupeur et son dossier KYC — §10.5 du cahier des
 * charges.
 *
 * **Ce n'est pas une formalite administrative.** « Nous selectionnons nos
 * groupeurs » ne vaut rien comme phrase marketing ; cela vaut comme **dossier
 * constitue, par groupeur, opposable le jour d'un litige**. C'est la
 * materialisation de la promesse de securite vendue a l'acheteur sur chaque
 * ecran.
 *
 * ## Les trois niveaux, et pourquoi on ne demande pas tout d'emblee
 *
 * Appliquer les sept controles a tout le monde couterait trop cher en temps et
 * ralentirait le recrutement, **qui est le goulot d'etranglement au
 * lancement**. La profondeur de la verification suit donc le montant que le
 * groupeur peut collecter.
 *
 * | Niveau | Controles | Plafond par campagne |
 * |---|---|---|
 * | **Entree** | 1, 2, 3 | 150 000 F |
 * | **Confirme** | + 4, 6, 7 — apres 3 campagnes livrees sans litige | 600 000 F |
 * | **Etabli** | + 5, visite renouvelee, garant — apres 10 campagnes | Au cas par cas |
 *
 * **Le formulaire d'inscription ne couvre donc que le niveau Entree.** Lui
 * demander ses references et son registre de commerce des la premiere minute
 * ferait fuir exactement les commercants que l'on cherche : la plupart des
 * bons groupeurs sont dans l'informel.
 *
 * ## Le controle qui arrete tout
 *
 * ⚠️ **Si le nom du compte Mobile Money ne correspond pas a la piece
 * d'identite, la procedure s'arrete.** Il n'y a pas de bonne raison de
 * recevoir l'argent des acheteurs sur le compte de quelqu'un d'autre. C'est le
 * controle le plus rentable du lot — gratuit, immediat, et c'est sur ce compte
 * que partira l'argent.
 *
 * Le selfie tenant la piece n'est pas decoratif non plus : **sans lui, une
 * piece volee suffit**.
 */

export type TypePiece = "cni" | "passeport" | "carte-consulaire";

export const LIBELLE_PIECE: Record<TypePiece, string> = {
  cni: "Carte nationale d'identité",
  passeport: "Passeport",
  "carte-consulaire": "Carte consulaire",
};

export type Operateur = "t-money" | "flooz";

export const LIBELLE_OPERATEUR: Record<Operateur, string> = {
  "t-money": "T-Money",
  flooz: "Flooz",
};

export type NiveauKyc = "entree" | "confirme" | "etabli";

export const PLAFOND_PAR_NIVEAU: Record<NiveauKyc, number | undefined> = {
  entree: 150000,
  confirme: 600000,
  /* Au cas par cas : pas de valeur, et ne pas en inventer une. */
  etabli: undefined,
};

/** Ce que le groupeur depose a l'inscription. Niveau Entree uniquement. */
export interface DossierGroupeur {
  /** Le pseudonyme sous lequel les acheteurs le verront (§1.7). */
  pseudonyme: string;
  /** Son nom reel, qui ne sort jamais vers les acheteurs. */
  nomComplet: string;
  telephone: string;
  typePiece: TypePiece;
  numeroPiece: string;
  /** Controle 1 : recto, verso et selfie tenant la piece. */
  pieceDeposee: boolean;
  selfieDepose: boolean;
  operateur: Operateur;
  /** Controle 2 : le **nom du titulaire**, pas le numero. */
  titulaireMobileMoney: string;
  numeroMobileMoney: string;
}

export type EtatDossier =
  | "a-completer"
  | "en-verification"
  | "valide"
  | "refuse";

/**
 * Le controle n° 2, verifie des la saisie.
 *
 * La comparaison est volontairement **tolerante sur la forme** — accents,
 * casse, ordre des mots, particules — et stricte sur le fond. Un dossier
 * refuse parce que quelqu'un a ecrit « DOE Akosua » au lieu de « Akosua Doe »
 * serait une perte de temps pour tout le monde.
 *
 * Elle ne remplace pas le controle humain : elle previent le groupeur tout de
 * suite au lieu de le laisser decouvrir le refus quatre heures plus tard.
 */
export function nomsConcordent(piece: string, mobileMoney: string): boolean {
  const normaliser = (nom: string) =>
    nom
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .split(/[\s-]+/)
      .filter((mot) => mot.length > 1)
      .sort()
      .join(" ");

  const a = normaliser(piece);
  const b = normaliser(mobileMoney);
  return a !== "" && a === b;
}
