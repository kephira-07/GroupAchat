/* ============================================================
   Group Achat — site vitrine

   Ce fichier est PUREMENT ADDITIF. Il surligne le lien de la
   section qu'on est en train de lire, et il fait apparaître les
   blocs au défilement. Rien d'autre.

   La navigation, elle, ne dépend d'aucun script : les liens sont
   toujours visibles dans le HTML, et c'est le CSS seul qui les
   fait passer sur une deuxième ligne sur un petit écran. Une
   barre de navigation qui a besoin de JavaScript pour exister
   disparaît le jour où le script ne charge pas — c'est
   exactement le bug que ce fichier ne doit plus pouvoir causer.
   ============================================================ */

(function () {
  "use strict";

  if (!("IntersectionObserver" in window)) {
    return; // Sans observateur, on ne fait rien : la page reste intacte.
  }

  /* ---------- Le lien actif suit la section lue ---------- */

  var liens = Array.prototype.slice.call(
    document.querySelectorAll(".navigation a[href^='#']")
  );

  var sections = liens
    .map(function (lien) {
      return document.querySelector(lien.getAttribute("href"));
    })
    .filter(Boolean);

  if (sections.length) {
    var observateurNav = new IntersectionObserver(
      function (entrees) {
        entrees.forEach(function (entree) {
          if (!entree.isIntersecting) return;
          liens.forEach(function (lien) {
            lien.classList.toggle(
              "actif",
              lien.getAttribute("href") === "#" + entree.target.id
            );
          });
        });
      },
      // La bande de détection est au tiers haut de l'écran : c'est la
      // section que l'œil lit, pas celle qui vient d'entrer par le bas.
      { rootMargin: "-20% 0px -70% 0px", threshold: 0 }
    );

    sections.forEach(function (section) {
      observateurNav.observe(section);
    });
  }

  /* ---------- Apparition au défilement ---------- */

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return;
  }

  var aAnimer = document.querySelectorAll(
    ".mesure, .carte, .etape, .vue, .releve, .faq details, .encart-livreur"
  );

  var observateurApparition = new IntersectionObserver(
    function (entrees, observateur) {
      entrees.forEach(function (entree) {
        if (!entree.isIntersecting) return;
        entree.target.classList.add("visible");
        observateur.unobserve(entree.target);
      });
    },
    { rootMargin: "0px 0px -6% 0px", threshold: 0.06 }
  );

  Array.prototype.forEach.call(aAnimer, function (element, index) {
    element.classList.add("apparait");
    // Un décalage très court donne le sens de lecture sans faire attendre.
    element.style.transitionDelay = (index % 4) * 55 + "ms";
    observateurApparition.observe(element);
  });
})();
