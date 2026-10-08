/**
 * Les pieces d'un dossier KYC — vocabulaire partage (§10.5, contrôles 1 et 4).
 *
 * ⚠️ **Une piece n'est jamais designee par une adresse.** L'API ne renvoie
 * qu'une **reference de stockage**, opaque, et ce fichier ne contient donc
 * aucune fonction qui construirait une URL d'image. C'est delibere : le §10.5
 * exige que les pieces d'identite et les selfies soient conserves hors du
 * stockage des photos de produits, avec un acces restreint et une duree de
 * conservation fixee. Ce stockage sera monte au deploiement sur le VPS.
 *
 * Tant qu'il n'existe pas, **aucun ecran n'affiche de piece**, et la facon la
 * plus sure de s'y tenir est de n'avoir nulle part le code qui le permettrait.
 */

export type NaturePiece =
  | "piece-recto"
  | "piece-verso"
  | "selfie"
  | "etal"
  | "justificatif";

export const LIBELLE_PIECE_DEPOSEE: Record<NaturePiece, string> = {
  "piece-recto": "Pièce d'identité — recto",
  "piece-verso": "Pièce d'identité — verso",
  selfie: "Selfie tenant la pièce",
  etal: "Lieu d'activité",
  justificatif: "Justificatif d'activité",
};

/**
 * Les trois pieces sans lesquelles un dossier n'est pas examinable.
 *
 * Le selfie en fait partie, et ce n'est pas une formalite : **sans lui, une
 * piece d'identite volee suffit** a passer le contrôle n° 1. Les deux autres
 * natures appartiennent au niveau Confirme, apres trois groupages livres.
 *
 * ⚠️ Meme liste que `_PIECES_EXIGEES` dans `backend/groupachat/api_kyc.py`.
 * **C'est le serveur qui refuse** un dossier incomplet ; cette liste ne sert
 * qu'a le dire avant l'envoi.
 */
export const PIECES_EXIGEES: readonly NaturePiece[] = [
  "piece-recto",
  "piece-verso",
  "selfie",
];
