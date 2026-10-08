/**
 * Les annonceurs du `BandeauPartenaires` — §2.14 de la spec des ecrans,
 * §9.3 du cahier des charges.
 *
 * **Ce sont des annonceurs fictifs, et des visuels de banque d'images.** Aucune
 * entreprise reelle de Lome n'a ete contactee, et aucun de ces noms ne doit
 * etre montre comme un partenariat acquis devant un jury ou un investisseur.
 * Les photos sont servies depuis le CDN de Pexels et recadrees en banniere.
 *
 * Une regle du §2.14 que les donnees rendent impossible a enfreindre : une
 * vignette ne porte **ni prix ni bouton « Commander »**, et le type n'a donc
 * aucun champ pour en mettre. Une publicite ne doit a aucun moment ressembler
 * a un groupage.
 */
export interface Annonceur {
  id: string;
  nom: string;
  /** Une ligne, pas deux. */
  accroche: string;
  /** Visuel de la banniere, recadre en 3:1. */
  image: string;
  /** Ce que la photo montre vraiment. */
  imageAlt: string;
  /** Ce que le toucher ouvre : une page interne, ou un lien externe. */
  destination: "interne" | "externe";
}

/** Recadrage en banniere, large et basse, servi a la bonne taille. */
function banniere(identifiant: string): string {
  return (
    `https://images.pexels.com/photos/${identifiant}/pexels-photo-${identifiant}.jpeg` +
    "?auto=compress&cs=tinysrgb&w=1200&h=400&fit=crop"
  );
}

export const ANNONCEURS: readonly Annonceur[] = [
  {
    id: "A1",
    nom: "Zem Express",
    accroche: "Votre colis livré à moto dans tout Lomé, en moins de 2 h",
    image: banniere("15854356"),
    imageAlt: "Livreur à scooter dans une rue",
    destination: "interne",
  },
  {
    id: "A2",
    nom: "Kékéli Énergie",
    accroche: "Panneaux solaires et batteries, installation comprise",
    image: banniere("11645008"),
    imageAlt: "Pose de panneaux solaires sur un toit",
    destination: "externe",
  },
  {
    id: "A3",
    nom: "Agbalé Assurances",
    accroche: "Assurance moto et santé, à partir de 2 500 F par mois",
    image: banniere("14140792"),
    imageAlt: "Conducteur de deux-roues casqué",
    destination: "externe",
  },
];
