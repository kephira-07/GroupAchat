import type { Categorie, Groupage } from "./groupage";

/**
 * Le modele de filtrage du catalogue, et la seule implementation du tri.
 *
 * **Pourquoi ici et pas dans le composant.** Trois interfaces differentes
 * montrent les memes filtres — les puces de l'ecran 2 sur telephone, la
 * colonne laterale sur ordinateur, et les deux carrousels de l'accueil. Si
 * chacune portait sa propre logique, le jour ou un seuil change il faudrait le
 * corriger a trois endroits, et on en oublierait un. Les composants ne font
 * donc que **montrer** ces regles ; ils n'en decident aucune.
 *
 * Les filtres retenus sont ceux du §2 de la spec des ecrans, et il n'y en a
 * pas d'autres **parce qu'il n'y a rien d'autre a filtrer** : il n'existe ni
 * notation des groupeurs (§1.7), ni livraison offerte, ni stock. Ajouter un
 * critere ici veut dire ajouter une donnee au modele, pas seulement une case.
 */

export type Tri = "fin-proche" | "prix" | "acheteurs";

export interface Filtres {
  recherche: string;
  categorie: Categorie | "toutes";
  termineBientot: boolean;
  petitPrix: boolean;
  tri: Tri;
}

export const FILTRES_PAR_DEFAUT: Filtres = {
  recherche: "",
  categorie: "toutes",
  termineBientot: false,
  petitPrix: false,
  /* Par defaut, la cloture la plus proche d'abord : ce qui presse se lit en
     premier. C'est le seul element de pression de l'application (§2.4). */
  tri: "fin-proche",
};

/** Seuil de la puce « Moins de 10 000 F » (ecran 2, point 3). */
export const SEUIL_PETIT_PRIX = 10000;

/**
 * Au-dela de 48 h, un groupage ne « se termine » plus bientot.
 *
 * **Ce seuil sert deux fois** : la puce « Se termine bientot » et le partage
 * entre les deux carrousels de l'accueil. Un seul endroit, donc l'acheteur qui
 * filtre retrouve exactement ce qu'il voyait dans la rangee.
 */
export const SEUIL_TERMINE_BIENTOT = 48;

export const LIBELLE_TRI: Record<Tri, string> = {
  "fin-proche": "Fin proche",
  prix: "Prix",
  acheteurs: "Acheteurs confirmés",
};

export const ORDRE_TRI: readonly Tri[] = ["fin-proche", "prix", "acheteurs"];

/**
 * Compare sans tenir compte des accents ni de la casse.
 *
 * Indispensable ici : personne ne tape « Écouteurs » avec son accent sur un
 * clavier de telephone, et une recherche qui ne trouve rien pour cette raison
 * passe pour un catalogue vide.
 */
export function normaliser(texte: string): string {
  return texte
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

/** Vrai des qu'un filtre ou une recherche est actif. */
export function filtreActif(filtres: Filtres): boolean {
  return (
    filtres.recherche.trim() !== "" ||
    filtres.categorie !== "toutes" ||
    filtres.termineBientot ||
    filtres.petitPrix
  );
}

/** Applique les filtres puis le tri. La seule implementation des deux. */
export function filtrerEtTrier(
  filtres: Filtres,
  source: readonly Groupage[],
): Groupage[] {
  const recherche = normaliser(filtres.recherche.trim());

  const retenus = source.filter((groupage) => {
    if (
      filtres.categorie !== "toutes" &&
      groupage.categorie !== filtres.categorie
    ) {
      return false;
    }
    if (
      filtres.termineBientot &&
      groupage.heuresRestantes > SEUIL_TERMINE_BIENTOT
    ) {
      return false;
    }
    if (filtres.petitPrix && groupage.prixPart >= SEUIL_PETIT_PRIX) {
      return false;
    }
    if (recherche) {
      // Le contenu d'une part est fouille aussi : on cherche « micro » et on
      // doit trouver les ecouteurs.
      const champs = normaliser(
        `${groupage.produit} ${groupage.contenuPart} ${groupage.groupeur}`,
      );
      if (!champs.includes(recherche)) {
        return false;
      }
    }
    return true;
  });

  return retenus.sort((a, b) => {
    switch (filtres.tri) {
      case "prix":
        return a.prixPart - b.prixPart;
      case "acheteurs":
        return b.acheteursConfirmes - a.acheteursConfirmes;
      default:
        return a.heuresRestantes - b.heuresRestantes;
    }
  });
}

/** Le partage des deux rangees de l'accueil, sur le meme seuil que la puce. */
export function separerParUrgence(groupages: readonly Groupage[]): {
  presqueClotures: Groupage[];
  autres: Groupage[];
} {
  return {
    presqueClotures: groupages.filter(
      (g) => g.heuresRestantes <= SEUIL_TERMINE_BIENTOT,
    ),
    autres: groupages.filter((g) => g.heuresRestantes > SEUIL_TERMINE_BIENTOT),
  };
}

/** Le nombre de groupages par categorie, pour les compteurs des filtres. */
export function compterParCategorie(
  source: readonly Groupage[],
): Record<Categorie, number> {
  const comptes = {} as Record<Categorie, number>;
  for (const groupage of source) {
    comptes[groupage.categorie] = (comptes[groupage.categorie] ?? 0) + 1;
  }
  return comptes;
}
