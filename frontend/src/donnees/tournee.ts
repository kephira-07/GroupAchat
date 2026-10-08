import type { Livraison } from "../domaine/livreur";

/**
 * La tournee du jour — ecran 22.
 *
 * ⚠️ **Le seul jeu de donnees du produit qui porte des identites.** Noms,
 * adresses et telephones n'apparaissent nulle part ailleurs, et ici seulement
 * le jour de la livraison.
 *
 * La premiere ligne est celle du fil rouge : **Akosua D., Tokoin, code
 * `K7M-4PQ`** (§3). C'est elle que le jury suit depuis la confirmation.
 *
 * Trois livraisons sont deja faites et douze au total, pour que la barre de
 * progression de l'ecran ait quelque chose a montrer.
 */
export const TOURNEE: readonly Livraison[] = [
  {
    id: "L1",
    nom: "Kodjo A.",
    adresse: "Agoè, carrefour Assiyéyé, à côté de la station Togo Oil",
    telephone: "+228 91 45 67 89",
    contenu: "Huile de palme 20 L — 1 part",
    codeLivraison: "R4D-9TK",
    etat: "livree",
    heure: "08 h 40",
  },
  {
    id: "L2",
    nom: "Afi M.",
    adresse: "Bè, marché de Bè, entrée nord",
    telephone: "+228 92 11 05 44",
    contenu: "Pagne complet 6 yards — 2 parts",
    codeLivraison: "H8P-2WQ",
    etat: "livree",
    heure: "09 h 15",
  },
  {
    id: "L3",
    nom: "Yawa T.",
    adresse: "Adidogomé, face au lycée, portail bleu",
    telephone: "+228 90 77 32 18",
    contenu: "Baskets homme pointure 42 — 1 part",
    codeLivraison: "B3N-6ZX",
    etat: "livree",
    heure: "10 h 02",
  },
  {
    id: "L4",
    nom: "Akosua D.",
    adresse: "Tokoin, rue des Cocotiers, près de la pharmacie Sodji",
    telephone: "+228 90 12 34 56",
    contenu: "Écouteurs filaires avec micro — 1 part",
    codeLivraison: "K7M-4PQ",
    etat: "a-livrer",
  },
  {
    id: "L5",
    nom: "Kossi E.",
    adresse: "Nyékonakpoè, boulevard du 13 Janvier, dépôt Akofa",
    telephone: "+228 93 28 16 70",
    contenu: "Riz parfumé, sac de 25 kg — 1 part",
    codeLivraison: "T2J-8CF",
    etat: "a-livrer",
  },
  {
    id: "L6",
    nom: "Dodzi K.",
    adresse: "Hédzranawoé, rue des Flamboyants, supérette Dzidudu",
    telephone: "+228 99 04 51 23",
    contenu: "Lait en poudre, carton de 24 boîtes — 1 part",
    codeLivraison: "W9L-3HN",
    etat: "a-livrer",
  },
];

/** Le total de la tournee, dont certaines livraisons ne sont pas listees ici. */
export const TOTAL_TOURNEE = 12;
