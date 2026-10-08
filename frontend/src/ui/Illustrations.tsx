/**
 * Les deux illustrations de l'ecran de choix du profil.
 *
 * ⚠️ **Le §1.0 regle 7 interdit « toute illustration de remplissage, motif de
 * fond ou separateur ornemental » : dans cette application, tout pixel sert a
 * informer, a rassurer ou a agir.** Ces deux dessins ne sont pas une exception
 * a la regle, ils en sont une application — ils **informent**, et c'est a cette
 * condition qu'ils ont le droit d'exister :
 *
 * - celle de l'acheteur montre **plusieurs personnes et un seul achat** : c'est
 *   le mecanisme du groupage, et c'est precisement ce que quelqu'un qui arrive
 *   pour la premiere fois ne connait pas. Un dessin l'explique plus vite que la
 *   phrase en dessous ;
 * - celle du groupeur montre **un lot en gros qui se repartit en parts** :
 *   c'est son metier sur la plateforme, resume en une image.
 *
 * Un paysage de Lome, un telephone stylise ou trois formes colorees seraient en
 * revanche exactement ce que la regle interdit. **Le test a appliquer avant
 * d'en ajouter une troisieme : qu'apprend-elle a quelqu'un qui ne sait pas
 * encore ce qu'est un groupage ?** Si la reponse est « rien », elle n'a pas sa
 * place.
 *
 * **Du SVG en ligne, pas une image.** Zero octet a telecharger sur le forfait
 * de donnees limite du §5 du cahier des charges, et le dessin suit la couleur
 * du texte autour de lui.
 *
 * Les formes sont pleines et plates — du 2D assume — la ou les icones du §1.0
 * regle 5 sont en traits de 1,5 px. La difference est voulue : une icone se lit
 * a 24 px et doit rester legere, une illustration se lit a 110 px et doit
 * porter une scene.
 */

/**
 * « A plusieurs, un seul achat. »
 *
 * Trois personnes, trois fleches, une caisse. C'est tout le modele, et ca se
 * comprend sans legende.
 *
 * Dessinee en blanc : elle vit sur l'aplat `primaire` de la carte acheteur.
 * Les nuances sont obtenues par l'opacite, jamais par une seconde couleur —
 * un aplat orange porte deja la couleur de l'ecran.
 */
export function IllustrationAcheteur({
  className,
}: {
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 120 96"
      className={className}
      role="img"
      aria-label="Trois acheteurs réunissent leur commande en un seul achat"
    >
      <g fill="currentColor">
        {/* Les trois acheteurs. Celui du milieu est plus haut : la scene a un
            sommet, donc un sens de lecture. */}
        <circle cx="22" cy="20" r="7" opacity="0.75" />
        <path
          d="M8 40c0-7 6.3-12 14-12s14 5 14 12z"
          opacity="0.75"
        />

        <circle cx="60" cy="13" r="8" />
        <path d="M44 35c0-8 7.2-13.5 16-13.5S76 27 76 35z" />

        <circle cx="98" cy="20" r="7" opacity="0.75" />
        <path
          d="M84 40c0-7 6.3-12 14-12s14 5 14 12z"
          opacity="0.75"
        />

        {/* Les trois apports qui convergent. */}
        <path
          d="M26 44v6l-3-1 4 7 4-7-3 1v-6z"
          opacity="0.6"
        />
        <path d="M57 40v8l-3-1 6 8 6-8-3 1v-8z" opacity="0.85" />
        <path
          d="M90 44v6l-3-1 4 7 4-7-3 1v-6z"
          opacity="0.6"
        />
      </g>

      {/* La caisse commune : une seule, et c'est le propos. */}
      <g>
        <rect x="34" y="66" width="52" height="26" rx="3" fill="currentColor" />
        <rect
          x="34"
          y="66"
          width="52"
          height="8"
          rx="3"
          fill="currentColor"
          opacity="0.55"
        />
        {/* Les trois parts a l'interieur, qui rappellent les trois acheteurs.
            Le trait reprend `primaire` en dur parce qu'il **evide** la caisse
            pour laisser voir la carte au travers : ce n'est pas une couleur de
            dessin, c'est le fond. Si la carte acheteur changeait de couleur,
            cette valeur changerait avec elle. */}
        <path
          d="M51.3 74v18M68.7 74v18"
          stroke="#CC4A00"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </g>
    </svg>
  );
}

/**
 * « Un lot en gros, reparti en parts. »
 *
 * Le commercant, sa caisse, et les parts qui en sortent. C'est son metier sur
 * la plateforme, et c'est ce que le mot « groupeur » ne dit pas tout seul.
 *
 * Dessinee en `confiance` : elle vit sur la carte blanche a contour bleu, et
 * le chrome groupeur est bleu (§1.2).
 */
export function IllustrationGroupeur({
  className,
}: {
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 120 96"
      className={className}
      role="img"
      aria-label="Un groupeur achète un lot en gros et le répartit en parts"
    >
      {/* Le groupeur. */}
      <g fill="currentColor">
        <circle cx="26" cy="15" r="8" />
        <path d="M10 37c0-8 7.2-13.5 16-13.5S42 29 42 37z" />
      </g>

      {/* Son lot, achete en une fois. */}
      <g>
        <rect x="6" y="44" width="46" height="44" rx="3" fill="currentColor" />
        <rect
          x="6"
          y="44"
          width="46"
          height="11"
          rx="3"
          fill="currentColor"
          opacity="0.55"
        />
      </g>

      {/* La repartition. La fleche va du lot vers les parts : le sens compte,
          c'est lui qui distingue le groupeur de l'acheteur. */}
      <path
        d="M58 66h10l-1-4 9 6-9 6 1-4H58z"
        fill="currentColor"
        opacity="0.6"
      />

      {/* Les parts qui en sortent. */}
      <g fill="currentColor">
        <rect x="84" y="40" width="30" height="14" rx="2" opacity="0.85" />
        <rect x="84" y="59" width="30" height="14" rx="2" opacity="0.7" />
        <rect x="84" y="78" width="30" height="14" rx="2" opacity="0.55" />
      </g>
    </svg>
  );
}
