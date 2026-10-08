import Bouton from "./Bouton";
import { IconeCarton, IconeRecherche } from "./Icones";

/**
 * `EtatVide` — SPEC_ECRANS_FIGMA.md §2.12.
 *
 * Icone en traits de 1,5 px, 48 px, en `texte-secondaire` : pas
 * d'illustration, pas de dessin de remplissage (§1.0, regle 7). Puis un titre
 * 18, une phrase explicative 16, un bouton secondaire. **C'est le vide autour
 * qui rend un etat vide elegant, pas l'image qu'on y met.**
 *
 * Il sert partout ou une liste peut etre vide : aucun resultat de recherche,
 * aucune commande, aucune demande, aucune question, et **les onglets proteges
 * quand on n'est pas connecte**. Ce dernier cas est le plus important : le
 * §1.5 interdit d'afficher un mur de connexion, et c'est cet etat vide qui le
 * remplace — il explique a quoi sert l'onglet, propose l'action principale, et
 * met la connexion en lien discret dessous.
 *
 * L'icone change selon le registre : une loupe quand on cherchait, un carton
 * quand on attendait quelque chose.
 */
export default function EtatVide({
  titre,
  explication,
  actionLibelle,
  onAction,
  registre = "recherche",
  lienSecondaire,
}: {
  titre: string;
  explication: string;
  /**
   * L'action proposee. **Les deux vont ensemble ou pas du tout.**
   *
   * Elles sont facultatives parce qu'un etat vide n'a pas toujours d'issue a
   * proposer : un groupeur dont le dossier KYC n'est pas encore valide ne peut
   * pas creer de groupage (§10.5), et l'inviter a le faire pour ensuite le
   * refuser serait pire que ne pas l'inviter. L'explication porte alors seule
   * ce qu'il faut savoir.
   */
  actionLibelle?: string;
  onAction?: () => void;
  /** `recherche` pour un filtre sans resultat, `attente` pour une liste vide. */
  registre?: "recherche" | "attente";
  /** Le « J'ai deja un compte » des onglets proteges (§1.5). */
  lienSecondaire?: { libelle: string; onClick: () => void };
}) {
  const Icone = registre === "attente" ? IconeCarton : IconeRecherche;

  return (
    <div className="flex flex-col items-center px-4 py-16 text-center">
      <Icone taille={48} className="text-texte-secondaire" />
      <h2 className="mt-6 text-lg font-semibold text-texte">{titre}</h2>
      <p className="mt-2 max-w-80 text-texte-secondaire">{explication}</p>

      {/* Pas de bouton sans libelle, pas de libelle sans bouton : un
          `actionLibelle` seul laisserait un bouton muet, un `onAction` seul un
          bouton invisible mais cliquable au clavier. */}
      {actionLibelle && onAction ? (
        <div className="mt-8 w-full max-w-72">
          <Bouton style="secondaire" onClick={onAction}>
            {actionLibelle}
          </Bouton>
        </div>
      ) : null}

      {lienSecondaire ? (
        <button
          type="button"
          onClick={lienSecondaire.onClick}
          className="mt-3 min-h-12 text-sm font-medium text-primaire italic"
        >
          {lienSecondaire.libelle}
        </button>
      ) : null}
    </div>
  );
}
