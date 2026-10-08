/**
 * `FriseEtapes` — SPEC_ECRANS_FIGMA.md §2.13.
 *
 * Frise verticale a 4 ou 5 etapes : un point de 10 px et un trait vertical de
 * 2 px entre les points. Etapes franchies en `primaire`, etape en cours en
 * `primaire` avec un anneau, etapes a venir en `bordure`. Libelle 16 et date
 * 12 a droite de chaque point. **Pas d'encadrement autour de la frise.**
 */
export interface Etape {
  libelle: string;
  detail: string;
}

export default function FriseEtapes({
  etapes,
  indiceEnCours,
}: {
  etapes: Etape[];
  /** Index de l'etape en cours. Les precedentes sont franchies. */
  indiceEnCours: number;
}) {
  return (
    <ol className="relative">
      {etapes.map((etape, indice) => {
        const franchie = indice < indiceEnCours;
        const enCours = indice === indiceEnCours;
        const derniere = indice === etapes.length - 1;

        return (
          <li key={etape.libelle} className="relative flex gap-3 pb-5 last:pb-0">
            {/* Le trait relie ce point au suivant. */}
            {derniere ? null : (
              <span
                aria-hidden="true"
                className={`absolute top-4 left-[7px] h-full w-0.5 ${
                  franchie ? "bg-primaire" : "bg-bordure"
                }`}
              />
            )}

            <span
              aria-hidden="true"
              className={`relative mt-[7px] size-2.5 shrink-0 rounded-full ${
                franchie || enCours ? "bg-primaire" : "bg-bordure"
              } ${enCours ? "ring-4 ring-primaire-fond" : ""}`}
            />

            <div className="min-w-0 flex-1">
              <p
                className={
                  franchie || enCours
                    ? "font-medium text-texte"
                    : "text-texte-secondaire"
                }
              >
                {etape.libelle}
                {enCours ? (
                  <span className="sr-only"> — étape en cours</span>
                ) : null}
              </p>
              <p className="text-xs text-texte-secondaire">{etape.detail}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
