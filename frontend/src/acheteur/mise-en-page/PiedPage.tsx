import { IconeBouclier } from "../../ui/Icones";
import Logo from "../../ui/Logo";

/**
 * Le pied de page des grands ecrans.
 *
 * Sur telephone, la `BarreNav` du bas remplit ce role et il n'y a pas de pied
 * de page : il serait toujours sous la barre, donc jamais vu. Sur ordinateur
 * il reprend la promesse de plateforme et les mentions qu'un site marchand
 * doit porter.
 *
 * Il repete la garantie — « livre ou rembourse » — parce que sur un catalogue
 * long, le bandeau du haut est hors champ au moment ou l'on hesite.
 *
 * Les liens ne menent nulle part : les pages correspondantes n'existent pas
 * encore. Ils sont la pour que la structure du site soit juste, pas pour faire
 * semblant.
 */
export default function PiedPage() {
  return (
    <footer className="mt-16 border-t border-bordure bg-surface-douce">
      <div className="px-4 py-12 lg:px-8">
        <div className="flex flex-wrap gap-12">
          <div className="max-w-xs">
            <Logo variante="couleur" disposition="cote" hauteur={30} />
            <p className="mt-3 text-sm text-texte-secondaire">
              Le prix de gros, à plusieurs. Des groupeurs sélectionnés à Lomé,
              un paiement détenu jusqu&apos;à la clôture.
            </p>
            <p className="mt-4 flex items-start gap-2 text-sm font-medium text-confiance">
              <IconeBouclier taille={18} className="mt-0.5 shrink-0" />
              Vous êtes livré, ou remboursé.
            </p>
          </div>

          <Colonne titre="Acheter">
            <Lien>Tous les groupages</Lien>
            <Lien>Demander un produit</Lien>
            <Lien>Mes commandes</Lien>
            <Lien>Suivre une livraison</Lien>
          </Colonne>

          <Colonne titre="Vendre">
            <Lien>Devenir groupeur</Lien>
            <Lien>Comment ça marche</Lien>
            <Lien>Commission et versements</Lien>
          </Colonne>

          <Colonne titre="Group Achat">
            <Lien>À propos</Lien>
            <Lien>Aide</Lien>
            <Lien>Conditions de vente</Lien>
            <Lien>Confidentialité</Lien>
          </Colonne>
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-bordure pt-6 text-sm text-texte-secondaire">
          <p>© 2026 Group Achat — Lomé, Togo</p>
          {/* Dit au meme endroit que partout ailleurs : le paiement n'est pas
              reel tant que l'agregateur n'est pas agree (§18.2 du cahier des
              charges). */}
          <p>Démonstration — aucun paiement réel n&apos;est effectué.</p>
        </div>
      </div>
    </footer>
  );
}

function Colonne({
  titre,
  children,
}: {
  titre: string;
  children: React.ReactNode;
}) {
  return (
    <nav aria-label={titre}>
      <h2 className="text-sm font-semibold text-texte">{titre}</h2>
      <ul className="mt-3 space-y-2">{children}</ul>
    </nav>
  );
}

function Lien({ children }: { children: React.ReactNode }) {
  return (
    <li>
      <button
        type="button"
        className="text-sm text-texte-secondaire hover:text-primaire"
      >
        {children}
      </button>
    </li>
  );
}
