/**
 * Icones en traits de 1,5 px, 24 px (§1.0 regle 5, §2.2). Jamais pleines,
 * jamais multicolores. Pas d'illustration, pas de bibliotheque d'icones : du
 * SVG en ligne, zero octet a telecharger sur un forfait de donnees limite.
 *
 * Les quatre icones de la barre de navigation reprennent la maquette fournie :
 * maison, deux personnes, recu, silhouette.
 */

interface ProprietesIcone {
  /** Cote de l'icone en pixels. 24 par defaut, 48 pour l'etat vide (§2.12). */
  taille?: number;
  className?: string;
}

function Svg({
  taille = 24,
  className,
  children,
}: ProprietesIcone & { children: React.ReactNode }) {
  return (
    <svg
      width={taille}
      height={taille}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  );
}

/* ── Barre de navigation ─────────────────────────────────────────────────── */

export function IconeAccueil(proprietes: ProprietesIcone) {
  return (
    <Svg {...proprietes}>
      <path d="M3.8 10.3L12 3.8l8.2 6.5V19a1.3 1.3 0 01-1.3 1.3H5.1A1.3 1.3 0 013.8 19v-8.7z" />
    </Svg>
  );
}

/** Deux personnes : l'onglet Groupage, la vue liste des offres. */
export function IconeGroupage(proprietes: ProprietesIcone) {
  return (
    <Svg {...proprietes}>
      <circle cx="9.2" cy="8" r="3.4" />
      <path d="M3.6 19.4c0-2.9 2.5-5 5.6-5s5.6 2.1 5.6 5" />
      <path d="M15.6 5.2a3.4 3.4 0 012.6 3.3 3.4 3.4 0 01-1 2.4" />
      <path d="M17.4 14.9c1.8.6 3 2.3 3 4.5" />
    </Svg>
  );
}

/** Un recu : l'onglet Commandes. */
export function IconeCommandes(proprietes: ProprietesIcone) {
  return (
    <Svg {...proprietes}>
      <path d="M5.5 3.8h10.2a1.3 1.3 0 011.3 1.3v15.1l-2.6-1.5-2.6 1.5-2.6-1.5-2.6 1.5-2.4-1.4V5.1a1.3 1.3 0 011.3-1.3z" />
      <path d="M8 8h6.2M8 11.4h6.2M8 14.8h3.6" />
    </Svg>
  );
}

export function IconeProfil(proprietes: ProprietesIcone) {
  return (
    <Svg {...proprietes}>
      <circle cx="12" cy="8.3" r="3.7" />
      <path d="M4.8 20.2c0-3.5 3.2-5.9 7.2-5.9s7.2 2.4 7.2 5.9" />
    </Svg>
  );
}

/* ── Reste de l'application ──────────────────────────────────────────────── */

export function IconeHorloge(proprietes: ProprietesIcone) {
  return (
    <Svg {...proprietes}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7.5V12l3 2" />
    </Svg>
  );
}

export function IconeBouclier(proprietes: ProprietesIcone) {
  return (
    <Svg {...proprietes}>
      <path d="M12 3l7 3v5.5c0 4-3 7.5-7 9-4-1.5-7-5-7-9V6l7-3z" />
      <path d="M9 12l2 2 4-4" />
    </Svg>
  );
}

export function IconeLieu(proprietes: ProprietesIcone) {
  return (
    <Svg {...proprietes}>
      <path d="M12 21s7-5.5 7-11a7 7 0 10-14 0c0 5.5 7 11 7 11z" />
      <circle cx="12" cy="10" r="2.5" />
    </Svg>
  );
}

export function IconeCalendrier(proprietes: ProprietesIcone) {
  return (
    <Svg {...proprietes}>
      <rect x="3.5" y="5.5" width="17" height="15" rx="2.5" />
      <path d="M3.5 10h17M8.5 3.5v4M15.5 3.5v4" />
    </Svg>
  );
}

export function IconeRecherche(proprietes: ProprietesIcone) {
  return (
    <Svg {...proprietes}>
      <circle cx="11" cy="11" r="6.5" />
      <path d="M15.8 15.8L20.5 20.5" />
    </Svg>
  );
}

/** Signalement d'un message. Discret, en traits, jamais plein. */
export function IconeDrapeau(proprietes: ProprietesIcone) {
  return (
    <Svg {...proprietes}>
      <path d="M5.5 20.5V4M5.5 5.2h10l-1.6 3.4 1.6 3.4h-10" />
    </Svg>
  );
}

/** Histogramme : l'onglet Statistiques du groupeur. */
/**
 * Telephone — n'apparait **que** sur la tournee du livreur (ecran 22).
 *
 * Si vous vous apprêtez a l'utiliser ailleurs, relisez le §1.7 : il n'y a
 * aucun autre endroit du produit ou un numero s'affiche.
 */
export function IconeTelephone(proprietes: ProprietesIcone) {
  return (
    <Svg {...proprietes}>
      <path d="M6.5 3.5h3l1.5 4-2 1.5a11 11 0 006 6l1.5-2 4 1.5v3a1.5 1.5 0 01-1.6 1.5C11.5 19 5 12.5 4.9 5.1A1.5 1.5 0 016.5 3.5z" />
    </Svg>
  );
}

export function IconeStatistiques(proprietes: ProprietesIcone) {
  return (
    <Svg {...proprietes}>
      <path d="M4 20.5V3.5M4 20.5h16" />
      <path d="M8 20.5v-6M12.5 20.5v-10M17 20.5v-4" />
    </Svg>
  );
}

/** Portefeuille : l'onglet du meme nom. */
export function IconePortefeuille(proprietes: ProprietesIcone) {
  return (
    <Svg {...proprietes}>
      <path d="M3.5 7.5a2 2 0 012-2h11a2 2 0 012 2v1" />
      <path d="M3.5 7.5v10a2 2 0 002 2h13a2 2 0 002-2v-7a2 2 0 00-2-2h-15" />
      <path d="M17 13.5v.2" />
    </Svg>
  );
}

/** Fleche entrante : un versement recu. */
export function IconeEntree(proprietes: ProprietesIcone) {
  return (
    <Svg {...proprietes}>
      <path d="M12 4.5v12M7.5 12L12 16.5 16.5 12" />
      <path d="M4.5 20h15" />
    </Svg>
  );
}

/** Pourcentage : la commission. */
export function IconePourcent(proprietes: ProprietesIcone) {
  return (
    <Svg {...proprietes}>
      <path d="M6.5 17.5l11-11" />
      <circle cx="7.5" cy="7.5" r="2.2" />
      <circle cx="16.5" cy="16.5" r="2.2" />
    </Svg>
  );
}

/** Depot de document : les justificatifs de l'ecran 17. */
export function IconeDepot(proprietes: ProprietesIcone) {
  return (
    <Svg {...proprietes}>
      <path d="M12 16V4.5M8 8.5L12 4.5l4 4" />
      <path d="M4.5 15.5v3A1.5 1.5 0 006 20h12a1.5 1.5 0 001.5-1.5v-3" />
    </Svg>
  );
}

export function IconeCarton(proprietes: ProprietesIcone) {
  return (
    <Svg {...proprietes}>
      <path d="M4 8.5l8-4 8 4v7l-8 4-8-4v-7z" />
      <path d="M4 8.5l8 4 8-4M12 12.5v7" />
    </Svg>
  );
}

export function IconeCloche(proprietes: ProprietesIcone) {
  return (
    <Svg {...proprietes}>
      <path d="M6.5 10a5.5 5.5 0 0111 0c0 4 1.5 5.5 1.5 5.5h-14S6.5 14 6.5 10z" />
      <path d="M10.3 19a2 2 0 003.4 0" />
    </Svg>
  );
}

export function IconeDemander(proprietes: ProprietesIcone) {
  return (
    <Svg {...proprietes}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 8.2v7.6M8.2 12h7.6" />
    </Svg>
  );
}

/** Bulle de question : les questions sont publiques, jamais une messagerie. */
export function IconeQuestion(proprietes: ProprietesIcone) {
  return (
    <Svg {...proprietes}>
      <path d="M20.5 12.6c0 4-3.8 7.2-8.5 7.2a9.8 9.8 0 01-2.8-.4L4.5 21l1.3-3.9a6.9 6.9 0 01-2.3-5c0-4 3.8-7.2 8.5-7.2s8.5 3.2 8.5 7.2z" />
    </Svg>
  );
}

/** Pastille « groupeur selectionne » a cote du pseudonyme (maquette). */
export function IconeVerifie(proprietes: ProprietesIcone) {
  return (
    <svg
      width={proprietes.taille ?? 16}
      height={proprietes.taille ?? 16}
      viewBox="0 0 24 24"
      className={proprietes.className}
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="12" cy="12" r="10" fill="currentColor" />
      <path
        d="M7.5 12.3l3 3 6-6.2"
        fill="none"
        stroke="white"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconeChevronBas(proprietes: ProprietesIcone) {
  return (
    <Svg {...proprietes}>
      <path d="M6.5 9.5L12 15l5.5-5.5" />
    </Svg>
  );
}

export function IconeChevronHaut(proprietes: ProprietesIcone) {
  return (
    <Svg {...proprietes}>
      <path d="M6.5 14.5L12 9l5.5 5.5" />
    </Svg>
  );
}

export function IconeCamion(proprietes: ProprietesIcone) {
  return (
    <Svg {...proprietes}>
      <path d="M3 7.5h10.5v9H3zM13.5 10.5h4l3 3v3h-7z" />
      <circle cx="7" cy="18" r="1.8" />
      <circle cx="17" cy="18" r="1.8" />
    </Svg>
  );
}

export function IconeRetour(proprietes: ProprietesIcone) {
  return (
    <Svg {...proprietes}>
      <path d="M14.5 5.5L8 12l6.5 6.5" />
    </Svg>
  );
}

export function IconeFermer(proprietes: ProprietesIcone) {
  return (
    <Svg {...proprietes}>
      <path d="M6 6l12 12M18 6L6 18" />
    </Svg>
  );
}

export function IconeCoche(proprietes: ProprietesIcone) {
  return (
    <Svg {...proprietes}>
      <path d="M4.5 12.5l5 5 10-11" />
    </Svg>
  );
}

export function IconeInfo(proprietes: ProprietesIcone) {
  return (
    <Svg {...proprietes}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5.5M12 7.8v.4" />
    </Svg>
  );
}

export function IconeAlerte(proprietes: ProprietesIcone) {
  return (
    <Svg {...proprietes}>
      <path d="M12 4.5l8.5 14.5h-17L12 4.5z" />
      <path d="M12 10v3.8M12 16.4v.3" />
    </Svg>
  );
}

export function IconePartager(proprietes: ProprietesIcone) {
  return (
    <Svg {...proprietes}>
      <path d="M12 15.5V4M8.5 7.5L12 4l3.5 3.5" />
      <path d="M5.5 13v6a1.5 1.5 0 001.5 1.5h10a1.5 1.5 0 001.5-1.5v-6" />
    </Svg>
  );
}

export function IconeFiltre(proprietes: ProprietesIcone) {
  return (
    <Svg {...proprietes}>
      <path d="M3.5 6.5h17M6.5 12h11M10 17.5h4" />
    </Svg>
  );
}

export function IconeTri(proprietes: ProprietesIcone) {
  return (
    <Svg {...proprietes}>
      <path d="M7 4.5v15M7 19.5l-3-3M7 19.5l3-3" />
      <path d="M17 19.5v-15M17 4.5l-3 3M17 4.5l3 3" />
    </Svg>
  );
}
