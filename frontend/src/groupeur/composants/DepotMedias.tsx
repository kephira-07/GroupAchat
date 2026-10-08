import {
  MAX_IMAGES,
  MAX_VIDEOS,
  type MediaProduit,
} from "../../domaine/groupage";
import Bouton from "../../ui/Bouton";
import Champ from "../../ui/Champ";
import { IconeFermer } from "../../ui/Icones";

/**
 * Les medias de la fiche — **4 photos et 2 videos au plus**.
 *
 * ## Pourquoi deux limites differentes
 *
 * Elles ne protegent pas la meme chose, et les confondre donnerait un mauvais
 * chiffre des deux cotes :
 *
 * - **quatre photos**, parce qu'une seule ne vend pas. Les faces, l'echelle,
 *   ce que contient reellement une part : un acheteur qui ne trouve pas
 *   l'information ne pose pas de question, il passe au groupage suivant ;
 * - **deux videos**, parce que l'acheteur est sur un **forfait de donnees
 *   limite** (§18.1). Une video pese cent fois une photo, et la troisieme ne
 *   convainc plus personne : elle coute de l'argent a celui qui la regarde.
 *
 * ⚠️ **Les deux limites sont aussi tenues par le serveur**, et c'est la
 * qu'elles comptent : ce formulaire ne fait que les rendre lisibles avant
 * l'aller-retour reseau.
 *
 * ## Des adresses, pas des fichiers — et ca se dit
 *
 * Le stockage objet reste a choisir (§18 du cahier des charges, « Stockage des
 * medias : a definir »). Tant qu'il n'existe pas, un depot de fichier
 * n'aurait **nulle part ou aller**, et un bouton « Choisir un fichier » qui ne
 * mene a rien est pire qu'un champ d'adresse honnete. L'ecran le dit au lieu
 * de le laisser decouvrir.
 *
 * Le jour ou le stockage existe, c'est ce composant qui change — ni le type
 * `MediaProduit`, ni l'API, ni la base.
 */
export default function DepotMedias({
  medias,
  onChanger,
}: {
  medias: MediaProduit[];
  onChanger: (medias: MediaProduit[]) => void;
}) {
  const images = medias.filter((m) => m.type === "image").length;
  const videos = medias.filter((m) => m.type === "video").length;

  const ajouter = (type: MediaProduit["type"]) =>
    onChanger([...medias, { type, url: "", alt: "" }]);

  const modifier = (rang: number, champs: Partial<MediaProduit>) =>
    onChanger(
      medias.map((media, i) => (i === rang ? { ...media, ...champs } : media)),
    );

  const retirer = (rang: number) =>
    onChanger(medias.filter((_, i) => i !== rang));

  return (
    <div className="rounded-xl border border-bordure p-4">
      <div className="flex items-baseline justify-between gap-3">
        <p className="font-medium text-texte">Photos et vidéos</p>
        {/* Le compte est ecrit, pas devine. Un groupeur doit savoir ce qui lui
            reste avant de preparer ses fichiers, pas apres. */}
        <p className="text-sm text-texte-secondaire">
          {images}/{MAX_IMAGES} photos · {videos}/{MAX_VIDEOS} vidéos
        </p>
      </div>

      {/* Les groupeurs sans moyens de tournage ne doivent pas se sentir exclus
          du fil (§1.6). */}
      <p className="mt-1 text-sm text-texte-secondaire">
        La première photo est celle que les acheteurs verront dans la liste.
        Une vidéo filmée au téléphone marche très bien ; une photo nette suffit
        aussi.
      </p>

      {medias.length > 0 ? (
        <ul className="mt-4 space-y-4">
          {medias.map((media, rang) => (
            <li
              key={rang}
              className="rounded-[10px] border border-bordure bg-surface-douce p-3"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-texte">
                  {media.type === "image" ? "Photo" : "Vidéo"} {rang + 1}
                  {rang === 0 && media.type === "image" ? (
                    <span className="ml-2 font-normal text-texte-secondaire">
                      — la couverture
                    </span>
                  ) : null}
                </p>
                <button
                  type="button"
                  onClick={() => retirer(rang)}
                  aria-label={`Retirer le média ${rang + 1}`}
                  className="flex size-8 items-center justify-center rounded-full text-texte-secondaire hover:bg-white"
                >
                  <IconeFermer taille={18} />
                </button>
              </div>

              <div className="mt-2 space-y-3">
                <Champ
                  libelle="Adresse du fichier"
                  valeur={media.url}
                  onChanger={(url) => modifier(rang, { url })}
                  exemple="https://…"
                />
                {media.type === "video" ? (
                  /* ⚠️ L'affiche n'est pas un ornement : sans elle, la carte
                     du fil et les lignes de liste restent vides le temps du
                     chargement — ce que le §1.6 interdit. */
                  <Champ
                    libelle="Image à montrer avant la lecture"
                    valeur={media.affiche ?? ""}
                    onChanger={(affiche) => modifier(rang, { affiche })}
                    exemple="https://…"
                  />
                ) : (
                  <Champ
                    libelle="Ce que la photo montre"
                    valeur={media.alt ?? ""}
                    onChanger={(alt) => modifier(rang, { alt })}
                    exemple="Les écouteurs posés sur fond sombre"
                    aide="Lu à voix haute par les lecteurs d'écran, et affiché si la photo ne charge pas."
                  />
                )}
              </div>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="mt-4 flex gap-3">
        <div className="flex-1">
          <Bouton
            role="groupeur"
            style="secondaire"
            onClick={() => ajouter("image")}
            desactive={images >= MAX_IMAGES}
          >
            + Photo
          </Bouton>
        </div>
        <div className="flex-1">
          <Bouton
            role="groupeur"
            style="secondaire"
            onClick={() => ajouter("video")}
            desactive={videos >= MAX_VIDEOS}
          >
            + Vidéo
          </Bouton>
        </div>
      </div>

      <p className="mt-3 text-xs text-texte-secondaire">
        Collez l&apos;adresse d&apos;une photo déjà en ligne. Le dépôt de
        fichiers depuis le téléphone arrivera avec le stockage des médias.
      </p>
    </div>
  );
}
