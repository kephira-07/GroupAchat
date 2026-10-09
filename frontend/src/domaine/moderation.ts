/**
 * Le filtre des messages publics — §14.2 du cahier des charges, etats de
 * moderation de l'ecran 10.
 *
 * **Pourquoi ce filtre existe.** Un groupeur qui recupere les numeros de ses
 * acheteurs peut leur proposer la meme marchandise hors plateforme, au meme
 * prix, et sans nous. L'anonymat des deux cotes (§1.7) est ce qui protege
 * le modele economique, et les questions publiques sont le dernier endroit par
 * ou un numero pouvait passer.
 *
 * **Ce module est volontairement bete.** C'est le niveau 1 du §14.2 : des
 * regles lexicales, qui tournent a chaque frappe et sans reseau. Le niveau 2 —
 * un classifieur — arrivera cote serveur et repondra a l'envoi. Les deux
 * produisent le meme encart, c'est pourquoi le type de retour est commun.
 *
 * **Le signal arrive AVANT l'appui sur « Envoyer ».** L'utilisateur n'a pas a
 * echouer pour apprendre : il voit tout de suite que ca ne passera pas. C'est
 * la difference entre un garde-fou et une punition.
 *
 * ⚠️ **La redaction des messages est la copie la plus sensible du produit**, et
 * elle est dictee mot pour mot par la spec. Ne pas la reecrire sans relire le
 * tableau de l'ecran 10 :
 *
 * - « ne **sera** pas publie », au futur : rien n'est encore parti ;
 * - « permettraient de **vous** identifier » : on parle de sa protection, pas
 *   de notre reglement ;
 * - « les echanges **restent anonymes** » : on rappelle une protection, on
 *   n'enonce pas une interdiction ;
 * - **jamais** « tentative de contournement », « interdit », « violation ».
 *   La plupart des gens qui ecrivent leur numero le font **de bonne foi**,
 *   pour etre joints a la livraison. Les traiter en fraudeurs est faux, et les
 *   fait fuir.
 */

export type MotifRefus = "numero" | "contact" | "hors-plateforme";

export interface VerdictModeration {
  /** Vrai si le message peut partir tel quel. */
  publiable: boolean;
  motif?: MotifRefus;
  /** Le passage exact en cause, a surligner dans le champ. */
  passage?: string;
}

/**
 * Un numero de telephone togolais, ecrit comme les gens l'ecrivent : avec ou
 * sans indicatif, avec des espaces, des points ou des tirets au milieu.
 */
const NUMERO =
  /(?:\+?228[\s.-]*)?(?:\d[\s.-]*){8,}/;

/** Les autres facons de donner un contact. */
const CONTACT =
  /\b(whatsapp|whats app|wasap|telegram|facebook|messenger|e-?mail|gmail|appelle[-\s]?moi|appeler[-\s]?moi|mon num[eé]ro)\b/i;

/** Les propositions de vente hors plateforme. */
const HORS_PLATEFORME =
  /\b(hors (?:du )?site|en dehors (?:du|de la) (?:site|plateforme)|directement avec (?:toi|vous)|sans passer par)\b/i;

export function verifier(message: string): VerdictModeration {
  /* Le numero est cherche **en premier**, et l'ordre compte. « Appelez-moi au
     90 12 34 56 » declenche les deux regles ; signaler « Appelez-moi » comme
     passage en cause n'aide personne, alors que surligner le numero montre
     exactement ce qu'il faut effacer. Le serveur applique le meme ordre. */
  const numero = message.match(NUMERO);
  // Au moins huit chiffres : « 20 litres » ou « 2 paires » doivent passer.
  if (numero && (numero[0].match(/\d/g) ?? []).length >= 8) {
    return { publiable: false, motif: "numero", passage: numero[0].trim() };
  }

  const contact = message.match(CONTACT);
  if (contact) {
    return { publiable: false, motif: "contact", passage: contact[0] };
  }

  const horsPlateforme = message.match(HORS_PLATEFORME);
  if (horsPlateforme) {
    return {
      publiable: false,
      motif: "hors-plateforme",
      passage: horsPlateforme[0],
    };
  }

  return { publiable: true };
}

/** Le texte de l'encart, selon le motif. Formulations contraintes. */
export function expliquer(motif: MotifRefus): {
  titre: string;
  corps: string;
  /** Ligne supplementaire pour le cas de bonne foi. */
  rassurance?: string;
} {
  const commun = {
    titre: "Ce message ne sera pas publié.",
    corps:
      "Il contient des informations qui permettraient de vous identifier. Pour votre sécurité, les échanges restent anonymes sur Group Achat. Posez votre question sur le produit — le groupeur répond ici même.",
  };

  if (motif === "numero") {
    return {
      ...commun,
      /* Le cas de bonne foi : quelqu'un qui donne son numero veut etre
         joignable. La bonne reponse n'est pas de le bloquer et de s'arreter
         la, c'est de lui dire ou ca va. */
      rassurance:
        "Votre numéro est déjà enregistré pour la livraison. Le livreur l'aura le jour de sa tournée.",
    };
  }

  if (motif === "hors-plateforme") {
    return {
      titre: "Ce message ne sera pas publié.",
      corps:
        "Votre paiement n'est protégé que sur Group Achat. Une commande passée ailleurs ne l'est plus, et nous ne pourrions pas vous rembourser.",
    };
  }

  return commun;
}
