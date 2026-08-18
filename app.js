/* HIPPOSTAT — APPLICATION DU PROGRAMME DU JOUR */

/*
     * Modifiez uniquement ce nom lorsque
     * vous changez de fichier quotidien.
     */
    const FICHIER_CSV =
  "./data/programme-du-jour.csv";

  
    const GRAPHIQUE_PLACES = {

    PREMIERE: 1,
    DERNIERE: 7,

    NON_CLASSE: 8,

    DAI: 10

    };


    /*
     * Données chargées depuis le CSV.
     */
    let donneesProgramme = [];
    let lignesCourseCourante = [];

    let chevauxSelectionnes =
     new Set();

    /*
     * Instance Chart.js.
     * Elle doit être détruite avant chaque nouvel affichage.
     */
    Chart.register(
    ChartDataLabels
    );

    let graphiqueGains = null;

    let graphiqueEvolution = null;

    let graphiqueComparatif = null;

   
    /*
     * Palette utilisée pour les participations historiques.
     */
    const couleurs = [
      "rgba(54, 162, 235, 0.75)",
      "rgba(255, 99, 132, 0.75)",
      "rgba(255, 206, 86, 0.75)",
      "rgba(75, 192, 192, 0.75)",
      "rgba(153, 102, 255, 0.75)",
      "rgba(255, 159, 64, 0.75)",
      "rgba(99, 199, 132, 0.75)",
      "rgba(201, 110, 220, 0.75)",
      "rgba(120, 140, 160, 0.75)",
      "rgba(210, 100, 100, 0.75)",
      "rgba(70, 170, 210, 0.75)",
      "rgba(180, 180, 80, 0.75)"
    ];


    document.addEventListener(
      "DOMContentLoaded",
      chargerProgramme
    );

    document
  .getElementById(
    "selectionnerTous"
  )
  .addEventListener(
    "click",
    function() {

      document
        .querySelectorAll(
          "#listeChevaux input[type='checkbox']"
        )
        .forEach(function(caseACocher) {

          caseACocher.checked =
            true;

          chevauxSelectionnes.add(
            caseACocher.value
          );
        });

      mettreAJourGraphiquesSelection();
    }
  );

  document
  .getElementById(
    "deselectionnerTous"
  )
  .addEventListener(
    "click",
    function() {

      document
        .querySelectorAll(
          "#listeChevaux input[type='checkbox']"
        )
        .forEach(function(caseACocher) {

          caseACocher.checked =
            false;
        });

      chevauxSelectionnes.clear();

      mettreAJourGraphiquesSelection();
    }
  );


    /**************************************************
     * CHARGEMENT DU CSV
     **************************************************/
    async function chargerProgramme() {

      try {

        const reponse =
          await fetch(FICHIER_CSV);

        if (!reponse.ok) {

          throw new Error(
            "Impossible de charger le CSV : HTTP " +
            reponse.status
          );
        }

        const texte =
          await reponse.text();

        const resultat =
          Papa.parse(texte, {
            header: true,
            delimiter: ";",
            skipEmptyLines: true,
            transformHeader: function(entete) {

              /*
               * Suppression éventuelle du BOM UTF-8.
               */
              return String(entete || "")
                .replace(/^\uFEFF/, "")
                .trim();
            }
          });

        if (
          resultat.errors &&
          resultat.errors.length > 0
        ) {

          console.warn(
            "Avertissements CSV :",
            resultat.errors
          );
        }

        donneesProgramme =
          resultat.data.filter(function(ligne) {
            

            return (
              ligne.CourseIDProgramme &&
              ligne.Cheval
            );
          });

        if (donneesProgramme.length === 0) {

          throw new Error(
            "Le CSV ne contient aucune donnée exploitable."
          );
        }

        let lignesCourseCourante = [];

        let chevauxSelectionnes =
        new Set();

        remplirListeCourses();

        document
          .getElementById("chargement")
          .classList.add("hidden");

        document
          .getElementById("contenu")
          .classList.remove("hidden");

        const select =
          document.getElementById(
            "selectionCourse"
          );

        select.addEventListener(
          "change",
          function() {

            afficherCourse(
              select.value
            );
   gtag(
      "event",
      "changement_course",
      {
        course_id:
          select.value
      }
    );

              
          }
        );

        /*
         * Affichage automatique de la première course.
         */
        if (select.options.length > 0) {

          afficherCourse(
            select.value
          );
        }

      } catch (erreur) {

        console.error(erreur);

        document
          .getElementById("chargement")
          .classList.add("hidden");

        const zoneErreur =
          document.getElementById("erreur");

        zoneErreur.textContent =
          erreur.message;

        zoneErreur.classList.remove(
          "hidden"
        );
      }
    }


    /**************************************************
     * LISTE DES COURSES
     **************************************************/
    function remplirListeCourses() {

      const coursesParID =
        new Map();

      donneesProgramme.forEach(
        function(ligne) {

          const courseID =
            nettoyerTexte(
              ligne.CourseIDProgramme
            );

          if (
            !courseID ||
            coursesParID.has(courseID)
          ) {
            return;
          }

          coursesParID.set(
            courseID,
            ligne
          );
        }
      );

      const courses = Array.from(
        coursesParID.entries()
      );

      courses.sort(function(a, b) {

        const ligneA = a[1];
        const ligneB = b[1];

        const reunionA =
          extraireNombre(
            ligneA.Réunion
          );

        const reunionB =
          extraireNombre(
            ligneB.Réunion
          );

        if (reunionA !== reunionB) {
          return reunionA - reunionB;
        }

        const courseA =
          extraireNombre(
            ligneA.Course
          );

        const courseB =
          extraireNombre(
            ligneB.Course
          );

        return courseA - courseB;
      });

      const select =
        document.getElementById(
          "selectionCourse"
        );

      select.innerHTML = "";

      courses.forEach(function(entree) {

        const courseID =
          entree[0];

        const ligne =
          entree[1];

        const option =
          document.createElement(
            "option"
          );

        option.value =
          courseID;

        option.textContent =
          construireLibelleCourse(
            ligne
          );

        select.appendChild(option);
      });
    }


    function construireLibelleCourse(ligne) {

      const morceaux = [
        ligne.Réunion,
        ligne.Course,
        ligne.Heure,
        ligne.Hippodrome
      ]
        .map(nettoyerTexte)
        .filter(Boolean);

      return (
        morceaux.join(" — ") +
        " [" +
        ligne.CourseIDProgramme +
        "]"
      );
    }


    /**************************************************
     * AFFICHAGE D'UNE COURSE
     **************************************************/
    function afficherCourse(
  courseID
) {

  const lignesCourse =
    donneesProgramme.filter(
      function(ligne) {

        return (
          String(
            ligne.CourseIDProgramme || ""
          ).trim() ===
          String(
            courseID || ""
          ).trim()
        );
      }
    );

  if (lignesCourse.length === 0) {
    return;
  }

  /*
   * Informations générales de la course.
   */
  afficherInformationsCourse(
  lignesCourse
  );

  /*
   * Conservation des lignes complètes.
   */
  lignesCourseCourante =
    lignesCourse;

  /*
   * Création de la checklist.
   */
  afficherChecklistChevaux(
    lignesCourseCourante
  );

  /*
   * Création des deux graphiques avec
   * tous les chevaux cochés au départ.
   */
  mettreAJourGraphiquesSelection();
}

    /**************************************************
     * INFORMATIONS DE LA COURSE
     **************************************************/
    function afficherInformationsCourse(
      lignesCourse
    ) {

      const ligne =
        lignesCourse[0];

      const partants =
        obtenirPartantsUniques(
          lignesCourse
        );

      const titre = [
        ligne.Réunion,
        ligne.Course,
        ligne.Hippodrome
      ]
        .map(nettoyerTexte)
        .filter(Boolean)
        .join(" — ");

      const infos = [
        ["Date", ligne.DateProgramme],
        ["Heure", ligne.Heure],
        ["Discipline", ligne.Discipline],
        ["Distance", formaterDistance(
          ligne.DistanceProgramme
        )],
        ["Allocation", formaterEuro(
          ligne.AllocationProgramme
        )],
        ["Partants", partants.length],
        ["Pays", ligne.Pays]
      ];

      const contenuInfos =
        infos
          .filter(function(info) {

            return (
              info[1] !== "" &&
              info[1] !== null &&
              info[1] !== undefined
            );
          })
          .map(function(info) {

            return (
              "<span>" +
              "<strong>" +
              echapperHTML(info[0]) +
              " :</strong> " +
              echapperHTML(info[1]) +
              "</span>"
            );
          })
          .join("");

      document
        .getElementById("courseInfo")
        .innerHTML =
          "<h2>" +
          echapperHTML(titre) +
          "</h2>" +
          '<div class="course-meta">' +
          contenuInfos +
          "</div>";
    }


    /**************************************************
     * GRAPHIQUE DES GAINS
     **************************************************/
    function afficherGraphiqueGains(
      lignesCourse
    ) {

      const partants =
        obtenirPartantsUniques(
          lignesCourse
        );

      let gainMaximum = 0;

      lignesCourse.forEach(function(ligne) {

      const gain =
      convertirNombre(
      ligne.GainEstimé
    );

  if (gain > gainMaximum) {
    gainMaximum = gain;
  }
});

      /*
       * Historique regroupé par partant.
       */
      const historiquesParPartant =
        new Map();

      partants.forEach(function(partant) {

        const cle =
          construireClePartant(
            partant
          );

        historiquesParPartant.set(
          cle,
          []
        );
      });

      lignesCourse.forEach(function(ligne) {

        const cle =
          construireClePartant(
            ligne
          );

        if (
          !historiquesParPartant.has(cle)
        ) {
          historiquesParPartant.set(
            cle,
            []
          );
        }

        /*
         * Une ligne sans CourseIDHistorique
         * correspond à un cheval sans historique.
         */
        if (!ligne.CourseIDHistorique) {
          return;
        }

        historiquesParPartant
          .get(cle)
          .push(ligne);
      });

      /*
       * Tri chronologique de l'historique
       * de chaque cheval.
       */
      historiquesParPartant.forEach(
        function(historique) {

          historique.sort(function(a, b) {

            return nettoyerTexte(
              a.DateHistorique
            ).localeCompare(
              nettoyerTexte(
                b.DateHistorique
              )
            );
          });
        }
      );

      /*
       * Nombre maximum de participations retrouvé
       * parmi les chevaux de la course.
       */
      let nombreMaximumParticipations = 0;

      historiquesParPartant.forEach(
        function(historique) {

          nombreMaximumParticipations =
            Math.max(
              nombreMaximumParticipations,
              historique.length
            );
        }
      );

      const labels =
        partants.map(function(partant) {

          return (
            partant.NuméroProgramme +
            " - " +
            partant.Cheval
          );
        });

      const datasets = [];

      /*
       * Un dataset correspond au rang chronologique
       * de la participation historique.
       *
       * Sortie 1, Sortie 2, Sortie 3...
       */
      for (
        let indexHistorique = 0;
        indexHistorique <
          nombreMaximumParticipations;
        indexHistorique++
      ) {

        const couleur =
          couleurs[
            indexHistorique %
            couleurs.length
          ];

        const donnees =
          new Array(
            partants.length
          ).fill(0);

        const details =
          new Array(
            partants.length
          ).fill(null);

          const couleursBarres =
          new Array(
          partants.length
          ).fill(
          "rgba(210, 210, 210, 0.45)"
          );



        partants.forEach(
          function(partant, indexPartant) {

            const cle =
              construireClePartant(
                partant
              );

            const historique =
              historiquesParPartant.get(
                cle
              ) || [];

            const sortie =
              historique[
                indexHistorique
              ];

            if (!sortie) {
              return;
            }

            donnees[indexPartant] =
              convertirNombre(
                sortie.GainEstimé
              );

            couleursBarres[indexPartant] =
               obtenirCouleurSelonPlace(
              sortie.Place,
              sortie.StatutHistorique
              ); 

            details[indexPartant] = {
              courseID:
                sortie.CourseIDHistorique ||
                "",
              date:
                sortie.DateHistorique ||
                "",
              place:
                sortie.Place ||
                "",
              statut:
                sortie.StatutHistorique ||
                "",
              allocation:
                sortie.AllocationHistorique ||
                "",
              pourcentage:
                sortie.PourcentageAllocation ||
                ""
            };
          }
        );

       datasets.push({

  label:
    "Participation " +
    (indexHistorique + 1),

  data:
    donnees,

  details:
    details,

  backgroundColor:
    couleursBarres,

  /*
   * Sépare clairement deux courses successives,
   * même lorsqu’elles ont la même couleur.
   */
  borderColor:
    "rgba(255, 255, 255, 0.85)",

  borderWidth:
    1.2,

  borderSkipped:
    false
});
      }

      if (graphiqueGains) {
        graphiqueGains.destroy();
        graphiqueGains = null;
      }

      const contexte =
        document
          .getElementById(
            "gainsParCheval"
          )
          .getContext("2d");

      graphiqueGains =
        new Chart(contexte, {

          type: "bar",

          data: {
            labels: labels,
            datasets: datasets
          },

options: {

  responsive: true,

  maintainAspectRatio: false,


  layout: {
  padding: {
  top: 4,
  right: 8,
  bottom: 0,
  left: 0
    }
  },


  interaction: {
    mode: "nearest",
    intersect: true
  },

  plugins: {

    datalabels: {
        display: false
        },


    title: {
      display: true,
      text:
        "Historique des gains",

      color:
        "#f1f5f9",

      font: {
        size: 17,
        weight: "bold"
      },

      padding: {
        top: 8,
        bottom: 14
      }
    },

    legend: {
      display: false
    },

    tooltip: {

      backgroundColor:
        "rgba(15, 23, 42, 0.96)",

      titleColor:
        "#ffffff",

      bodyColor:
        "#e2e8f0",

      borderColor:
        "rgba(255, 255, 255, 0.25)",

      borderWidth:
        1,

      padding:
        12,

      callbacks: {

        title: function(contextes) {

          return contextes.length

            ? contextes[0].label
            : "";
        },

        label: function(contexte) {

          const valeur =
            convertirNombre(
              contexte.raw
            );

          const detail =
            contexte.dataset.details[
              contexte.dataIndex
            ];

          if (!detail) {
            return "";
          }

          return [

            "Course : " +
              detail.courseID,

            "Date : " +
              detail.date,

            "Place : " +
              detail.place,

            "Statut : " +
              detail.statut,

            "Allocation : " +
              formaterEuro(
                detail.allocation
              ),

            "Gain estimé : " +
              formaterEuro(valeur),

            "% allocation : " +
              detail.pourcentage
          ];
        }
      }
    }
  },

  scales: {

   x: {
  stacked: true,

  border: {
    color: "rgba(226, 232, 240, 0.45)"
  },

  grid: {
     color: "rgba(255, 255, 255, 0.06)",
      lineWidth: 1
  },

  title: {
    display: true,
    text: "Partants",
    color: "#d8dee9"
  },

ticks: {
  color: "#d8dee9",
  maxRotation: 42,
  minRotation: 35,
  autoSkip: false,

  font: {
    size: 10
  }
}
},

   y: {
  stacked: true,
  beginAtZero: true,

  border: {
    color: "rgba(226, 232, 240, 0.45)"
  },

  grid: {
    color: "rgba(255, 255, 255, 0.08)"
  },

  title: {
    display: true,
    text: "Gains estimés (€)",
    color: "#d8dee9"
  },

  ticks: {
    color: "#d8dee9",

    callback: function(valeur) {
      return Number(valeur)
        .toLocaleString("fr-FR") + " €";
    }
  }
}
  }
}
        });
    }

    /**************************************************
 * GRAPHIQUE CHRONOLOGIQUE DES PERFORMANCES
 *
 * X : date historique
 * Y : place obtenue
 * Taille : gain estimé
 * Couleur : cheval
 * DAI : ligne spécifique en bas du graphique
 **************************************************/
function afficherGraphiqueEvolution(
  lignesCourse
) {

  const partants =
    obtenirPartantsUniques(
      lignesCourse
    );

   
    /*
   * Gain maximal de toutes les performances
   * de la course sélectionnée.
   * 
   */
let gainMaximum = 0;

lignesCourse.forEach(function(ligne) {

  const gain =
    obtenirGainHistorique(
      ligne
    );

  if (gain > gainMaximum) {
    gainMaximum = gain;
  }
});

if (gainMaximum <= 0) {
  gainMaximum = 1;
}


/*
 * Valeurs utilisées sur l'axe Y
 */
 
  const datasets = [];

  partants.forEach(
    function(partant, indexPartant) {

      const clePartant =
        construireClePartant(
          partant
        );

      const couleurCheval =
        obtenirCouleurCheval(
          indexPartant,
          partants.length
        );

      const points = [];
      const couleursPoints = [];
      const borduresPoints = [];

      lignesCourse.forEach(function(ligne) {

        const statutNormalise =
  normaliserStatutGraphique(
    ligne.StatutHistorique
  );

const estDisqualifie =
  statutNormalise.indexOf("DISQUAL") !== -1 ||
  statutNormalise === "DAI";

const estResultatAbsent =
  statutNormalise === "RESULTAT ABSENT";

const rang =
  extrairePlaceNumerique(
    ligne.Place
  );

const estNonClasse =
rang === 0 &&
!estDisqualifie;

let valeurY;

if (estDisqualifie) {

  valeurY =
    GRAPHIQUE_PLACES.DAI;

} else if (
  estResultatAbsent ||
  estNonClasse
) {

  valeurY =
    GRAPHIQUE_PLACES.NON_CLASSE;

} else {

  valeurY =
    rang;
}


        if (
          construireClePartant(ligne) !==
          clePartant
        ) {
          return;
        }

        if (!ligne.DateHistorique) {
          return;
        }

        const timestamp =
          convertirDateEnTimestamp(
            ligne.DateHistorique
          );

        if (timestamp === null) {
          return;
        }


                /*
         * On conserve :
         * - les résultats classés ;
         * - les disqualifications.
         *
         * Les résultats absents sont ignorés.
         */
        if (
          rang === null &&
          !estDisqualifie
        ) {
          return;
        }

        const gain =
        obtenirGainHistorique(
        ligne
        );

        const rayon =
         estDisqualifie
         ? 5
         : calculerRayonBulle(
        gain,
        gainMaximum
        );

        console.log(
        ligne.Cheval,
        "gain=",
        gain,
        "rayon=",
        rayon
        );
console.log(
  "INFOS HISTORIQUES :",
  ligne.Cheval,
  ligne.HippodromeHistorique,
  ligne.DisciplineHistorique,
  ligne.DistanceHistorique,
  ligne.NombrePartantsHistorique,
  ligne.TempsVainqueur,
  ligne.Temps,
  ligne.RéductionKm
);
points.push({

  x: timestamp,

  y: valeurY,

  r: rayon,

  numero:
    ligne.NuméroProgramme || "",

  cheval:
    ligne.Cheval || "",

  date:
    ligne.DateHistorique || "",

  courseID:
    ligne.CourseIDHistorique || "",

  place:
    ligne.Place || "",

  statut:
    ligne.StatutHistorique || "",

  hippodrome:
    ligne.HippodromeHistorique || "",

  discipline:
    ligne.DisciplineHistorique || "",

  distance:
    ligne.DistanceHistorique || "",

  poids:
  ligne.PoidsHistorique || "",

  nombrePartants:
    ligne.NombrePartantsHistorique || "",

  allocation:
    ligne.AllocationHistorique || "",

  gain:
    gain,

  jockey:
    ligne.JockeyHistorique || "",

  tempsVainqueur:
    ligne.TempsVainqueur || "",

  temps:
    ligne.Temps || "",

  reductionKm:
    ligne.RéductionKm ||
    ligne.ReductionKm ||
    "",

  estDisqualifie:
    estDisqualifie,

  estNonClasse:
    estNonClasse
});
        /*
         * Les DAI restent rouges.
         * Les autres points gardent la couleur
         * propre au cheval.
         */
        couleursPoints.push(
          estDisqualifie
            ? "rgba(220, 53, 69, 0.88)"
            : couleurCheval
        );

        borduresPoints.push(
          estDisqualifie
            ? "rgba(255, 150, 160, 1)"
            : "rgba(255, 255, 255, 0.85)"
        );
      });

      if (points.length === 0) {
        return;
      }

      datasets.push({

        label:
          partant.NuméroProgramme +
          " - " +
          partant.Cheval,

        data:
          points,

        backgroundColor:
          couleursPoints,

        borderColor:
          borduresPoints,

        borderWidth:
          1.2,

        hoverBorderWidth:
          2
      });
    }
  );

  if (graphiqueEvolution) {

    graphiqueEvolution.destroy();

    graphiqueEvolution = null;
  }

  const canvas =
    document.getElementById(
      "evolutionPerformances"
    );


  if (!canvas) {

    console.warn(
      "Canvas evolutionPerformances introuvable."
    );

    return;
  }

  const contexte =
    canvas.getContext("2d");

  graphiqueEvolution =
    new Chart(contexte, {

      type: "bubble",

      data: {
        datasets: datasets
      },

      options: {

        responsive: true,

        maintainAspectRatio: false,
     
        interaction: {
          mode: "nearest",
          intersect: true
        },


        plugins: {



           datalabels: {

            display: true,

            formatter: function(value) {

            return value.numero;
            },

            color: "#ffffff",

            font: {

            weight: "bold",

            size: 10
            },

            textStrokeColor: "#000",

            textStrokeWidth: 2
            },

          title: {
            display: true,

            text:
              "Évolution des performances",

            color:
              "#f1f5f9",

            font: {
              size: 17,
              weight: "bold"
            },

            padding: {
              bottom: 16
            }
          },

          /*
           * Avec 15 à 18 chevaux, la légende Chart.js
           * deviendrait trop volumineuse.
           */
          legend: {
            display: false
          },

          tooltip: {

            backgroundColor:
              "rgba(15, 23, 42, 0.97)",

            titleColor:
              "#ffffff",

            bodyColor:
              "#e2e8f0",

            borderColor:
              "rgba(255, 255, 255, 0.25)",

            borderWidth:
              1,

            padding:
              12,

           callbacks: {

title: function(contextes) {

  if (!contextes.length) {
    return "";
  }

  const point =
    contextes[0].raw;

  const numero =
    String(
      point.numero || ""
    ).trim();

  const cheval =
    String(
      point.cheval || ""
    ).trim();

  return (
    "🐎 " +
    [numero, cheval]
      .filter(Boolean)
      .join(" - ")
  );
},

  label: function(contexte) {

    return construireInfobulle(
      contexte.raw
    );
  }
}
          }
        },

        scales: {

          x: {

            type: "linear",

            min:
              obtenirTimestampMinimum(
                datasets
              ),

            max:
              obtenirTimestampMaximum(
                datasets
              ),

            border: {
              color:
                "rgba(226, 232, 240, 0.50)"
            },

            grid: {
              color:
                "rgba(255, 255, 255, 0.06)"
            },

            title: {
              display: true,
              text: "Date",
              color: "#d8dee9"
            },

            ticks: {

              color:
                "#d8dee9",

              maxTicksLimit:
                10,

              callback: function(valeur) {

                return formaterDateTimestamp(
                  Number(valeur)
                );
              }
            }
          },

y: {

  reverse: true,

  min: 0.4,

  max: 10.6,

  ticks: {

    stepSize: 1,

    color: "#d8dee9",

    callback: function(valeur) {

      const nombre =
        Number(valeur);

      if (nombre === GRAPHIQUE_PLACES.NON_CLASSE) {
        return "Non classé";
      }

      if (nombre === GRAPHIQUE_PLACES.DAI) {
        return "DAI";
      }

      if (
        nombre >= 1 &&
        nombre <= 7
      ) {
        return nombre;
      }

      /*
       * La valeur 9 reste volontairement vide.
       */
      return "";
    }
  },

  title: {
    display: true,
    text: "Place",
    color: "#d8dee9"
  }
}
        }
      }
    });

    afficherGraphiqueComparatif(
  lignesCourse
);
}


    /**************************************************
     * PARTANTS UNIQUES
     **************************************************/
    function obtenirPartantsUniques(
      lignesCourse
    ) {

      const index =
        new Map();

      lignesCourse.forEach(function(ligne) {

        const cle =
          construireClePartant(
            ligne
          );

        if (!index.has(cle)) {
          index.set(cle, ligne);
        }
      });

      const partants =
        Array.from(
          index.values()
        );

      partants.sort(function(a, b) {

        return (
          convertirNombre(
            a.NuméroProgramme
          ) -
          convertirNombre(
            b.NuméroProgramme
          )
        );
      });

      return partants;
    }


    function construireClePartant(ligne) {

      return (
        nettoyerTexte(
          ligne.CourseIDProgramme
        ) +
        "|" +
        nettoyerTexte(
          ligne.NuméroProgramme
        ) +
        "|" +
        nettoyerTexte(
          ligne.Cheval
        ).toUpperCase()
      );
    }


    /**************************************************
     * OUTILS
     **************************************************/
    function nettoyerTexte(valeur) {

      if (
        valeur === null ||
        valeur === undefined
      ) {
        return "";
      }

      return String(valeur).trim();
    }


    function convertirNombre(valeur) {

      if (
        valeur === null ||
        valeur === undefined ||
        valeur === ""
      ) {
        return 0;
      }

      const texte =
        String(valeur)
          .replace(/\u00A0|\u202F/g, "")
          .replace(/[€%]/g, "")
          .replace(/\s/g, "")
          .replace(",", ".")
          .trim();

      const nombre =
        Number(texte);

      return Number.isFinite(nombre)
        ? nombre
        : 0;
    }


    function extraireNombre(valeur) {

      const correspondance =
        String(valeur || "")
          .match(/\d+/);

      return correspondance
        ? Number(correspondance[0])
        : 0;
    }


    function formaterEuro(valeur) {

      const nombre =
        convertirNombre(valeur);

      if (!nombre) {

        const texte =
          nettoyerTexte(valeur);

        return texte || "0 €";
      }

      return nombre.toLocaleString(
        "fr-FR",
        {
          maximumFractionDigits: 0
        }
      ) + " €";
    }


    function formaterDistance(valeur) {

      const texte =
        nettoyerTexte(valeur);

      if (!texte) {
        return "";
      }

      if (/m$/i.test(texte)) {
        return texte;
      }

      return texte + " m";
    }


    function echapperHTML(valeur) {

      return String(
        valeur === null ||
        valeur === undefined
          ? ""
          : valeur
      )
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
    }

   function obtenirCouleurSelonPlace(
  place,
  statut
) {

  const statutNormalise =
    String(statut || "")
      .toUpperCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim();

 



  const correspondance =
    String(place || "")
      .match(/\d+/);

  const rang =
    correspondance
      ? Number(correspondance[0])
      : 0;

  if (rang === 1) {
    return "rgba(34, 139, 34, 0.85)";
  }

  if (rang === 2) {
    return "rgba(76, 175, 80, 0.75)";
  }

  if (rang === 3) {
    return "rgba(129, 199, 132, 0.65)";
  }

  if (
    rang === 4 ||
    rang === 5
  ) {
    return "rgba(100, 181, 246, 0.70)";
  }

  if (rang >= 6) {
    return "rgba(180, 180, 180, 0.70)";
  }

  return "rgba(210, 210, 210, 0.45)";
}
/**************************************************
 * PLACE NUMÉRIQUE
 **************************************************/
function extrairePlaceNumerique(place) {

  const correspondance =
    String(place || "")
      .match(/\d+/);

  if (!correspondance) {
    return null;
  }

  const rang =
    Number(
      correspondance[0]
    );

  return Number.isFinite(rang)
    ? rang
    : null;
}


/**************************************************
 * NORMALISATION DU STATUT
 **************************************************/
function normaliserStatutGraphique(statut) {

  return String(statut || "")
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}


/**************************************************
 * DATE CSV VERS TIMESTAMP
 **************************************************/
function convertirDateEnTimestamp(dateTexte) {

  const texte =
    String(dateTexte || "")
      .trim();

  if (!texte) {
    return null;
  }

  /*
   * Format YYYY-MM-DD.
   */
  let correspondance =
    texte.match(
      /^(\d{4})-(\d{2})-(\d{2})$/
    );

  if (correspondance) {

    return new Date(
      Number(correspondance[1]),
      Number(correspondance[2]) - 1,
      Number(correspondance[3])
    ).getTime();
  }

  /*
   * Format DD/MM/YYYY.
   */
  correspondance =
    texte.match(
      /^(\d{2})\/(\d{2})\/(\d{4})$/
    );

  if (correspondance) {

    return new Date(
      Number(correspondance[3]),
      Number(correspondance[2]) - 1,
      Number(correspondance[1])
    ).getTime();
  }

  const date =
    new Date(texte);

  const timestamp =
    date.getTime();

  return Number.isFinite(timestamp)
    ? timestamp
    : null;
}


/**************************************************
 * FORMATAGE DATE DE L'AXE
 **************************************************/
function formaterDateTimestamp(timestamp) {

  const date =
    new Date(timestamp);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "";
  }

  return date.toLocaleDateString(
    "fr-FR",
    {
      month: "short",
      year: "2-digit"
    }
  );
}


/**************************************************
 * TAILLE DES BULLES
 **************************************************/
function calculerRayonBulle(
  gain,
  gainMaximum
) {

  const montant =
    Math.max(
      0,
      convertirNombre(gain)
    );

  const maximum =
    Math.max(
      1,
      convertirNombre(gainMaximum)
    );

  if (montant <= 0) {
    return 4;
  }

  /*
   * La surface de la bulle suit approximativement
   * l'importance du gain.
   */
  const proportion =
    Math.sqrt(
      montant / maximum
    );

  const rayonMinimum = 4;
  const rayonMaximum = 20;

  return (
    rayonMinimum +
    proportion *
    (
      rayonMaximum -
      rayonMinimum
    )
  );
}


/**************************************************
 * COULEUR PROPRE À CHAQUE CHEVAL
 **************************************************/
function obtenirCouleurCheval(
  index,
  total
) {

  const nombre =
    Math.max(
      1,
      total
    );

  const teinte =
    Math.round(
      index *
      360 /
      nombre
    );

  return (
    "hsla(" +
    teinte +
    ", 68%, 56%, 0.62)"
  );
}


/**************************************************
 * BORNES CHRONOLOGIQUES
 **************************************************/
function obtenirTimestampMinimum(
  datasets
) {

  const valeurs = [];

  datasets.forEach(function(dataset) {

    dataset.data.forEach(function(point) {

      if (
        Number.isFinite(point.x)
      ) {
        valeurs.push(point.x);
      }
    });
  });

  if (valeurs.length === 0) {
    return undefined;
  }

  const minimum =
    Math.min.apply(
      null,
      valeurs
    );

  /*
   * Marge de 15 jours à gauche.
   */
  return minimum -
    15 * 24 * 60 * 60 * 1000;
}


function obtenirTimestampMaximum(
  datasets
) {

  const valeurs = [];

  datasets.forEach(function(dataset) {

    dataset.data.forEach(function(point) {

      if (
        Number.isFinite(point.x)
      ) {
        valeurs.push(point.x);
      }
    });
  });

  if (valeurs.length === 0) {
    return undefined;
  }

  const maximum =
    Math.max.apply(
      null,
      valeurs
    );

  /*
   * Marge de 15 jours à droite.
   */
  return maximum +
    15 * 24 * 60 * 60 * 1000;
}

/**************************************************
 * RÉCUPÈRE LE GAIN HISTORIQUE
 **************************************************/
function obtenirGainHistorique(ligne) {

  if (!ligne) {
    return 0;
  }

  const valeursPossibles = [

    ligne.GainEstimé,

    ligne.GainEstime,

    ligne.GainEstiméAllocationHistorique,

    ligne.GainEstimeAllocationHistorique,

    ligne["Gain estimé"],

    ligne["Gain historique"]
  ];

  for (
    let i = 0;
    i < valeursPossibles.length;
    i++
  ) {

    const valeur =
      convertirNombre(
        valeursPossibles[i]
      );

    if (valeur > 0) {
      return valeur;
    }
  }

  return 0;
}

function obtenirJockeyHistorique(ligne) {

  if (!ligne) {
    return "";
  }

  const valeursPossibles = [

    ligne.JockeyHistorique,

    ligne["JockeyHistorique"],

    ligne["Jockey / Driver"],

    ligne.Jockey,

    ligne.Driver,

    ligne.driver
  ];

  for (
    let i = 0;
    i < valeursPossibles.length;
    i++
  ) {

    const valeur =
      String(
        valeursPossibles[i] || ""
      ).trim();

    if (valeur !== "") {
      return valeur;
    }
  }

  return "";
}

function afficherChecklistChevaux(
  lignesCourse
) {

  const conteneur =
    document.getElementById(
      "listeChevaux"
    );

  if (!conteneur) {
    return;
  }

  conteneur.innerHTML = "";

  const partants =
    obtenirPartantsUniques(
      lignesCourse
    );

  chevauxSelectionnes =
    new Set();

  partants.forEach(function(partant) {

    const cle =
      construireClePartant(
        partant
      );

    chevauxSelectionnes.add(cle);

    const bloc =
      document.createElement("div");

    bloc.className =
      "cheval-checkbox";

    const input =
      document.createElement("input");

    input.type =
      "checkbox";

    input.checked =
      true;

    input.id =
      "cheval_" +
      cle.replace(
        /[^a-zA-Z0-9]/g,
        "_"
      );

    input.dataset.cle =
      cle;

    const label =
      document.createElement("label");

    label.htmlFor =
      input.id;

    label.textContent =
      (
        partant.NuméroProgramme ||
        ""
      ) +
      " - " +
      (
        partant.Cheval ||
        ""
      );

    input.addEventListener(
      "change",
      function() {

        if (input.checked) {

          chevauxSelectionnes.add(
            cle
          );

        } else {

          chevauxSelectionnes.delete(
            cle
          );
        }

        rafraichirGraphiquesSelection(
          lignesCourse
        );
      }
    );

    bloc.appendChild(input);
    bloc.appendChild(label);

    conteneur.appendChild(bloc);
  });
}

function filtrerLignesParSelection(
  lignesCourse
) {

  return lignesCourse.filter(
    function(ligne) {

      const cle =
        construireClePartant(
          ligne
        );

      return chevauxSelectionnes.has(
        cle
      );
    }
  );
}

function rafraichirGraphiquesSelection(
  lignesCourse
) {

  console.log(
  "ENTREE afficherTableauSyntheseCourse"
);



 let lignesFiltrees =
  filtrerLignesParSelection(
    lignesCourse
  );


const caseConfrontations =
  document.getElementById(
    "filtreConfrontationsDirectes"
  );


if (
  caseConfrontations &&
  caseConfrontations.checked
) {

console.log(
  "AVANT confrontation :",
  lignesFiltrees.length
);

const caseConfrontations =
  document.getElementById(
    "filtreConfrontationsDirectes"
  );

if (
  caseConfrontations &&
  caseConfrontations.checked
) {
  
  lignesFiltrees =
    filtrerConfrontationsDirectes(
      lignesFiltrees
    );

  console.log(
    "APRES confrontation :",
    lignesFiltrees.length
  );
}

}
 
  afficherGraphiqueGains(
    lignesCourse
  );

  console.log(
  "AVANT TABLEAU SYNTHESE",
  lignesCourse.length
);

  afficherTableauSyntheseCourse(
  lignesCourse
);

console.log(
  "APRES TABLEAU SYNTHESE"
);

  afficherGraphiqueEvolution(
    lignesFiltrees
  );

  afficherGraphiqueComparatif(
  lignesCourse
);
}

function formaterResultatHistorique(ligne) {

  const statut =
    normaliserStatutGraphique(
      ligne.StatutHistorique
    );

  const place =
    String(
      ligne.Place || ""
    ).trim();

  if (
    statut.includes("DISQUAL") ||
    statut === "DAI"
  ) {
    return "🔴 DAI";
  }

  if (
    statut === "NON CLASSE" ||
    statut === "NON CLASSEMENT"
  ) {
    return "⚪ Non classé";
  }

  if (
    statut === "NP" ||
    statut === "NON PARTANT"
  ) {
    return "⛔ Non-partant";
  }

  if (
    statut === "RESULTAT ABSENT"
  ) {
    return "⚫ Résultat absent";
  }

  if (place) {
    return "Résultat : " + place;
  }

  return "Résultat non renseigné";
}

function libelleResultat(ligne) {

  const statut =
    normaliserStatutGraphique(
      ligne.StatutHistorique
    );

  if (statut === "DISQUALIFIE") {
    return "DAI";
  }

  if (statut === "RESULTAT ABSENT") {
    return "Non classé";
  }

  return ligne.Place;
}

function construireInfobulle(point) {

  const lignes = [];

  /*
   * Date + code de la course.
   *
   * R4C1_2026-02-26 devient R4C1,
   * puisque la date est déjà affichée.
   */
  const date =
    formaterDateInfobulle(
      point.date
    );

  const codeCourse =
    extraireCodeCourseInfobulle(
      point.courseID
    );

  const dateCourse =
    [date, codeCourse]
      .filter(function(valeur) {
        return String(valeur || "").trim();
      })
      .join(" • ");

  ajouterLigneInfobulle(
    lignes,
    "📅 ",
    dateCourse
  );

  ajouterLigneInfobulle(
    lignes,
    "📍 ",
    point.hippodrome
  );

  /*
   * Séparation visuelle.
   */
  ajouterSeparateurInfobulle(
    lignes
  );

  /*
   * Discipline et distance sur une seule ligne.
   */
  const disciplineDistance =
    [
      point.discipline,
      formaterDistanceInfobulle(
        point.distance
      )
    ]
    .filter(function(valeur) {
      return String(valeur || "").trim();
    })
    .join(" • ");

  ajouterLigneInfobulle(
    lignes,
    "🏇 ",
    disciplineDistance
  );

  /*
 * POIDS
 */
ajouterLigneInfobulle(
  lignes,
  "⚖️ ",
  point.poids
    ? point.poids + " kg"
    : ""
);

  ajouterLigneInfobulle(
    lignes,
    "👥 ",
    point.nombrePartants
      ? point.nombrePartants +
        " partants"
      : ""
  );

  ajouterSeparateurInfobulle(
    lignes
  );

  /*
   * Résultat :
   * - place réelle ;
   * - DAI ;
   * - Non classé ;
   * - Non-partant.
   */
  ajouterLigneInfobulle(
    lignes,
    "🏁 ",
    formaterResultatPoint(
      point
    )
  );

  ajouterSeparateurInfobulle(
    lignes
  );

  ajouterLigneInfobulle(
    lignes,
    "💰 Gain estimé : ",
    formaterEuro(
      point.gain
    )
  );

  ajouterLigneInfobulle(
    lignes,
    "🏆 Allocation : ",
    formaterEuro(
      point.allocation
    )
  );

  ajouterSeparateurInfobulle(
    lignes
  );

  ajouterLigneInfobulle(
    lignes,
    "👤 ",
    point.jockey
  );

  /*
   * La séparation suivante n’est ajoutée
   * que si au moins un chrono existe.
   */
  const aUnChrono =
    [
      point.tempsVainqueur,
      point.temps,
      point.reductionKm
    ]
    .some(function(valeur) {
      return String(
        valeur || ""
      ).trim() !== "";
    });

  if (aUnChrono) {

    ajouterSeparateurInfobulle(
      lignes
    );
  }

  ajouterLigneInfobulle(
    lignes,
    "⏱ Temps vainqueur : ",
    point.tempsVainqueur
  );

  ajouterLigneInfobulle(
    lignes,
    "⏱ Temps : ",
    point.temps
  );

  ajouterLigneInfobulle(
    lignes,
    "⚡ Réduction km : ",
    point.reductionKm
  );

  return lignes;
}

function ajouterLigneInfobulle(
  lignes,
  libelle,
  valeur
) {

  if (
    valeur === null ||
    valeur === undefined
  ) {
    return;
  }

  const texte =
    String(valeur).trim();

  if (!texte) {
    return;
  }

  lignes.push(
    libelle + texte
  );
}

function formaterResultatPoint(point) {

  const statut =
    normaliserStatutGraphique(
      point.statut
    );

  if (
    statut.includes("DISQUAL") ||
    statut === "DAI"
  ) {
    return "DAI";
  }

  if (
    statut === "RESULTAT ABSENT"
  ) {
    return "Non classé";
  }

  if (
    statut === "NP" ||
    statut === "NON PARTANT"
  ) {
    return "Non-partant";
  }

  return String(
    point.place || ""
  ).trim();
}

function ajouterSeparateurInfobulle(
  lignes
) {

  /*
   * Chart.js accepte une chaîne vide pour
   * créer un léger espace vertical.
   *
   * On évite deux séparateurs consécutifs.
   */
  if (
    lignes.length > 0 &&
    lignes[lignes.length - 1] !== ""
  ) {
    lignes.push("");
  }
}

function formaterDateInfobulle(
  dateTexte
) {

  const texte =
    String(dateTexte || "").trim();

  const correspondance =
    texte.match(
      /^(\d{4})-(\d{2})-(\d{2})$/
    );

  if (!correspondance) {
    return texte;
  }

  return (
    correspondance[3] +
    "/" +
    correspondance[2] +
    "/" +
    correspondance[1]
  );
}

function extraireCodeCourseInfobulle(
  courseID
) {

  const texte =
    String(courseID || "").trim();

  if (!texte) {
    return "";
  }

  /*
   * R4C1_2026-02-26 → R4C1
   */
  return texte.split("_")[0];
}

function formaterDistanceInfobulle(
  distance
) {

  const texte =
    String(distance || "").trim();

  if (!texte) {
    return "";
  }

  /*
   * Évite 2850m et affiche 2850 m.
   */
  return texte.replace(
    /(\d)\s*m$/i,
    "$1 m"
  );
}

function afficherChecklistChevaux(
  lignesCourse
) {

  const section =
    document.getElementById(
      "selectionChevaux"
    );

  const conteneur =
    document.getElementById(
      "listeChevaux"
    );

  conteneur.innerHTML = "";

  const chevauxParCle =
    new Map();

  lignesCourse.forEach(function(ligne) {

    const cheval =
      String(
        ligne.Cheval || ""
      ).trim();

    if (!cheval) {
      return;
    }

    const numero =
      String(
        ligne.NuméroProgramme ||
        ligne.NumeroProgramme ||
        ""
      ).trim();

    const cle =
      normaliserCleChevalInterface(
        cheval
      );

    if (!chevauxParCle.has(cle)) {

      chevauxParCle.set(cle, {
        cle: cle,
        numero: numero,
        cheval: cheval
      });
    }
  });

  const chevaux =
    Array.from(
      chevauxParCle.values()
    );

  chevaux.sort(function(a, b) {

    const numeroA =
      Number(a.numero);

    const numeroB =
      Number(b.numero);

    if (
      Number.isFinite(numeroA) &&
      Number.isFinite(numeroB)
    ) {
      return numeroA - numeroB;
    }

    return a.cheval.localeCompare(
      b.cheval,
      "fr"
    );
  });

  chevauxSelectionnes =
    new Set(
      chevaux.map(function(cheval) {
        return cheval.cle;
      })
    );

  chevaux.forEach(function(cheval) {

    const label =
      document.createElement(
        "label"
      );

    label.className =
      "choix-cheval";

    const caseACocher =
      document.createElement(
        "input"
      );

    caseACocher.type =
      "checkbox";

    caseACocher.checked =
      true;

    caseACocher.value =
      cheval.cle;

    caseACocher.dataset.cheval =
      cheval.cheval;

    caseACocher.addEventListener(
      "change",
      gererChangementSelectionCheval
    );

    const numero =
      document.createElement(
        "span"
      );

    numero.className =
      "choix-cheval-numero";

    numero.textContent =
      cheval.numero || "–";

    const nom =
      document.createElement(
        "span"
      );

    nom.className =
      "choix-cheval-nom";

    nom.textContent =
      cheval.cheval;

    nom.title =
      cheval.cheval;

    label.appendChild(
      caseACocher
    );

    label.appendChild(
      numero
    );

    label.appendChild(
      nom
    );

    conteneur.appendChild(
      label
    );
  });

  section.classList.remove(
    "hidden"
  );
}

function normaliserCleChevalInterface(
  cheval
) {

  return String(cheval || "")
    .trim()
    .toUpperCase()
    .normalize("NFD")
    .replace(
      /[\u0300-\u036f]/g,
      ""
    )
    .replace(
      /\s+/g,
      " "
    );
}

function gererChangementSelectionCheval(
  evenement
) {

  const caseACocher =
    evenement.target;

  const cleCheval =
    caseACocher.value;

  if (caseACocher.checked) {

    chevauxSelectionnes.add(
      cleCheval
    );

  } else {

    chevauxSelectionnes.delete(
      cleCheval
    );
  }

  // Google Analytics
  if (typeof gtag === "function") {

    gtag(
      "event",
      "selection_cheval",
      {
        cheval: caseACocher.value,
        selection: caseACocher.checked
          ? "coche"
          : "decoche"
      }
    );

  }


  mettreAJourGraphiquesSelection();
}
function obtenirLignesChevauxSelectionnes() {




  return lignesCourseCourante.filter(
    function(ligne) {

      const cleCheval =
        normaliserCleChevalInterface(
          ligne.Cheval
        );

      if (
        chevauxSelectionnes.has(
          cleCheval
        )
      ) {

        console.log(
          "TEST NUMERO :",
          ligne.Cheval,
          "Numero =", ligne.Numero,
          "Num =", ligne.Num,
          "N° =", ligne["N°"],
          "NumeroPartant =", ligne.NumeroPartant
        );

        return true;
      }

      return false;
    }
  );
}

function mettreAJourGraphiquesSelection() {

  /*
   * Données correspondant aux
   * chevaux actuellement sélectionnés.
   */
  let lignesFiltrees =
    obtenirLignesChevauxSelectionnes();


  /*
   * ==========================================
   * FILTRE : 3 DERNIERS MOIS
   * ==========================================
   */
  const case3Mois =
    document.getElementById(
      "filtre3Mois"
    );


  if (
    case3Mois &&
    case3Mois.checked
  ) {

    console.log(
      "AVANT filtre 3 mois :",
      lignesFiltrees.length
    );


    lignesFiltrees =
      filtrerTroisDerniersMois(
        lignesFiltrees
      );


    console.log(
      "APRES filtre 3 mois :",
      lignesFiltrees.length
    );
  }


  /*
   * ==========================================
   * FILTRE : CONFRONTATIONS DIRECTES
   * ==========================================
   */
  const caseConfrontations =
    document.getElementById(
      "filtreConfrontationsDirectes"
    );


  if (
    caseConfrontations &&
    caseConfrontations.checked
  ) {

    console.log(
      "AVANT confrontation :",
      lignesFiltrees.length
    );


    lignesFiltrees =
      filtrerConfrontationsDirectes(
        lignesFiltrees
      );


    console.log(
      "APRES confrontation :",
      lignesFiltrees.length
    );
  }


  /*
   * ==========================================
   * AFFICHAGES
   * ==========================================
   */

  afficherGraphiqueGains(
    lignesFiltrees
  );


  afficherTableauSyntheseCourse(
    lignesFiltrees
  );


  afficherGraphiqueEvolution(
    lignesFiltrees
  );


  afficherTableauConfrontationsDirectes(
    lignesFiltrees
  );

}


const pluginLienDistanceReduction = {

  id:
    "lienDistanceReduction",


  afterDatasetsDraw(chart) {

    const ctx =
      chart.ctx;

    const datasets =
      chart.data.datasets;


    /*
     * Recherche des datasets Distance.
     */
    datasets.forEach(
      function(datasetDistance, indexDistance) {

        if (
          datasetDistance.yAxisID !==
          "yDistance"
        ) {
          return;
        }


        /*
         * Recherche du dataset Réduction
         * correspondant au même cheval.
         */
        const indexReduction =
          datasets.findIndex(
            function(dataset) {

              return (
                dataset.yAxisID ===
                  "yReduction" &&
                dataset.cleCheval ===
                  datasetDistance.cleCheval
              );
            }
          );


        if (
          indexReduction === -1
        ) {
          return;
        }


        const metaDistance =
          chart.getDatasetMeta(
            indexDistance
          );

        const metaReduction =
          chart.getDatasetMeta(
            indexReduction
          );


        datasetDistance.data.forEach(
          function(pointDistance, i) {

            /*
             * Recherche de la réduction
             * ayant exactement la même date.
             */
            const indexPointReduction =
              datasets[indexReduction]
                .data
                .findIndex(
                  function(pointReduction) {

                    return (
                      pointReduction.x ===
                      pointDistance.x
                    );
                  }
                );


            if (
              indexPointReduction === -1
            ) {
              return;
            }


            const barre =
              metaDistance.data[i];

            const point =
              metaReduction.data[
                indexPointReduction
              ];


            if (
              !barre ||
              !point
            ) {
              return;
            }


            /*
             * Trait entre le sommet
             * de la barre et le point.
             */
            ctx.save();

            ctx.beginPath();

            ctx.moveTo(
              barre.x,
              barre.y
            );

            ctx.lineTo(
              point.x,
              point.y
            );

            ctx.strokeStyle =
              datasetDistance.borderColor ||
              datasetDistance.backgroundColor;

            ctx.globalAlpha =
              0.60;

            ctx.lineWidth =
              1.5;

            ctx.stroke();

            ctx.restore();
          }
        );
      }
    );
  }
};

function afficherGraphiqueComparatifTrot(
  canvas,
  lignesComparaison,
  partants
) {

  /*
   * Nettoyage ancien graphique
   */
  if (graphiqueComparatif) {

    graphiqueComparatif.destroy();

    graphiqueComparatif = null;
  }


  const datasets = [];

  let distanceMin = 0;
  let distanceMax = 3000;
  /*
   * Une couleur par cheval,
   * cohérente avec les autres graphiques.
   */
  partants.forEach(
    function(partant, indexPartant) {

        const numeroPartant =
  partant.NuméroProgramme ||
  partant.NumeroProgramme ||
  partant["N°"] ||
  ""

      const clePartant =
        construireClePartant(
          partant
        );

      const couleurCheval =
        obtenirCouleurCheval(
          indexPartant,
          partants.length
        );


      const pointsDistance = [];
      const pointsReduction = [];


      lignesComparaison.forEach(
        function(ligne) {

          if (
            construireClePartant(ligne) !==
            clePartant
          ) {
            return;
          }


          const timestamp =
            convertirDateEnTimestamp(
              ligne.DateHistorique
            );

          if (timestamp === null) {
            return;
          }


          /*
           * DISTANCE
           */
  /*
 * DISTANCE
 */
const distance =
  parseFloat(
    String(
      ligne.DistanceHistorique || ""
    )
      .replace(/[^\d.,-]/g, "")
      .replace(",", ".")
  );


/*
 * REDUCTION KILOMETRIQUE
 */
const reduction =
  convertirReductionEnSecondes(
    ligne.RéductionKm ||
    ligne.ReductionKm ||
    ligne.ReductionHistorique ||
    ""
  );


/*
 * On conserve uniquement les courses
 * possédant à la fois :
 *
 * - une distance
 * - une réduction kilométrique
 */
if (
  isNaN(distance) ||
  reduction === null ||
  isNaN(reduction)
) {
  return;
}


/*
 * DISTANCE
 */
pointsDistance.push({

  x:
    timestamp,

  y:
    distance,

  cheval:
    ligne.Cheval || "",

  date:
    ligne.DateHistorique || ""
});


/*
 * REDUCTION
 */
pointsReduction.push({

  x:
    timestamp,

  y:
    reduction,

  cheval:
    ligne.Cheval || "",

  date:
    ligne.DateHistorique || ""
});

         

        }
      );


  /*
   * =========================================
   * CALCUL AUTOMATIQUE DE L'ECHELLE DISTANCE
   * =========================================
   */

  const toutesDistances =
    datasets
      .filter(
        function(dataset) {

          return (
            dataset.yAxisID ===
            "yDistance"
          );
        }
      )
      .flatMap(
        function(dataset) {

          return dataset.data.map(
            function(point) {

              return point.y;
            }
          );
        }
      )
      .filter(
        function(valeur) {

          return Number.isFinite(
            valeur
          );
        }
      );


  let distanceMin = 0;
  let distanceMax = 3000;


  if (toutesDistances.length > 0) {

    distanceMin =
      Math.floor(
        (
          Math.min(
            ...toutesDistances
          ) - 100
        ) / 100
      ) * 100;


    distanceMax =
      Math.ceil(
        (
          Math.max(
            ...toutesDistances
          ) + 100
        ) / 100
      ) * 100;
  }


  console.log(
    "Echelle distance :",
    distanceMin,
    "→",
    distanceMax
  );



      /*
       * BARRES = DISTANCE
       */
      if (pointsDistance.length > 0) {

        datasets.push({

            cleCheval:
             clePartant,

          type:
            "bar",

          label:
          (
           partant.NuméroProgramme
          ? partant.NuméroProgramme + " — "
          : ""
          ) +
          partant.Cheval,
          data:
            pointsDistance,

          yAxisID:
            "yDistance",

          backgroundColor:
            couleurCheval,

          borderColor:
            couleurCheval,

          borderWidth:
            1,

       /*
 * Largeur de la barre sur l'axe temporel.
 * Ici environ 4 jours.
 */
barThickness: 16,


maxBarThickness:
  18,

borderRadius: 3,

order:
  2
        });
      }


      /*
       * LIGNE / POINTS = REDUCTION
       */
      if (pointsReduction.length > 0) {

        datasets.push({

  type:
    "scatter",

  cleCheval:
    clePartant,

  label:
  (
    numeroPartant
      ? numeroPartant + " — "
      : ""
  ) +
  partant.Cheval,

  data:
    pointsReduction,

  yAxisID:
    "yReduction",

  backgroundColor:
    couleurCheval,

  borderColor:
    "#ffffff",

  pointBackgroundColor:
    couleurCheval,

  pointBorderColor:
    "#ffffff",

  pointBorderWidth:
    2,

pointRadius:
  7,

pointHoverRadius:
  7,

pointBorderWidth:
  2,

pointBorderColor:
  "#ffffff",

 
  order:
    1
});
      }

    }
  );

  const toutesReductions =
  datasets
    .filter(function(dataset) {
      return dataset.yAxisID === "yReduction";
    })
    .flatMap(function(dataset) {
      return dataset.data.map(function(point) {
        return point.y;
      });
    })
    .filter(function(valeur) {
      return Number.isFinite(valeur);
    });


let reductionMin = null;
let reductionMax = null;


if (toutesReductions.length > 0) {

  reductionMin =
    Math.floor(
      (
        Math.min(...toutesReductions) -
        0.3
      ) * 10
    ) / 10;


  reductionMax
    Math.ceil(
      (
        Math.max(...toutesReductions) +
        0.3
      ) * 10
    ) / 10;
}


  graphiqueComparatif =
    new Chart(
      canvas.getContext("2d"),
      {



        data: {
          datasets:
            datasets
        },

          plugins: [
        pluginLienDistanceReduction
      ],


        options: {

          responsive:
            true,

          maintainAspectRatio:
            false,


          /*
           * Pas d'infobulle.
           */
          interaction: {
            mode:
              "nearest",

            intersect:
              false
          },


          plugins: {


            title: {

              display:
                true,

              text:
                "Comparaison Trot — 8 dernières courses",

              color:
                "#1f3045",

              font: {
                size:
                  18,

                weight:
                  "bold"
              },

              padding: {
                bottom:
                  16
              }
            },


            legend: {

  display:
    true,

  position:
    "top",

  labels: {

    usePointStyle:
      true,

    boxWidth:
      12,

    filter:
      function(
        legendItem,
        chartData
      ) {

        const dataset =
          chartData.datasets[
            legendItem.datasetIndex
          ];

        /*
         * On garde uniquement
         * les datasets Réduction.
         *
         * Les barres Distance sont
         * masquées dans la légende.
         */
        return (
          dataset.yAxisID ===
          "yReduction"
        );
      }
  }
},


            tooltip: {
              enabled:
                false
            },


            /*
             * Valeurs écrites
             * directement sur le graphique.
             */
            datalabels: {

  display:
    function(context) {

      return (
        context.raw &&
        context.raw.y !== null &&
        context.raw.y !== undefined
      );
    },


  formatter:
    function(value, context) {

      /*
       * DISTANCE
       */
      if (
  context.dataset.yAxisID ===
  "yDistance"
) {

  let dateAffichee = "";

  if (value.date) {

    const date =
      new Date(value.date);

    if (!isNaN(date.getTime())) {

      dateAffichee =
        date.toLocaleDateString(
          "fr-FR",
          {
            day: "2-digit",
            month: "2-digit"
          }
        );
    }
  }


  return [
    Number(value.y)
      .toLocaleString("fr-FR") +
      " m",

    dateAffichee
  ];
}


      /*
       * REDUCTION
       */
      if (
        context.dataset.yAxisID ===
        "yReduction"
      ) {

        return formaterReductionSecondes(
          value.y
        );
      }


      return "";
    },


  color:
    "#1f3045",


  font:
    function(context) {

      /*
       * Distance un peu plus discrète
       */
      if (
        context.dataset.yAxisID ===
        "yDistance"
      ) {

        return {
          size: 9,
          weight: "bold"
        };
      }


      /*
       * Réduction légèrement plus visible
       */
      return {
        size: 11,
        weight: "bold"
      };
    },


  /*
   * POSITION VERTICALE
   */
  anchor:
    function(context) {

      if (
        context.dataset.yAxisID ===
        "yDistance"
      ) {

        /*
         * Valeur vers le sommet
         * de la barre
         */
        return "end";
      }


      /*
       * Réduction centrée
       * sur son point
       */
      return "center";
    },


  align:
    function(context) {

      if (
        context.dataset.yAxisID ===
        "yDistance"
      ) {

        /*
         * Distance à l'intérieur
         * de la barre
         */
        return "start";
      }


      /*
       * Réduction au-dessus
       * du point
       */
      return "top";
    },


  offset:
    function(context) {

      if (
        context.dataset.yAxisID ===
        "yDistance"
      ) {

        return 6;
      }


      return 7;
    },


  /*
   * Evite que les labels
   * sortent trop facilement
   * du graphique.
   */
  clamp:
    true
},

          },


          scales: {


            /*
             * CHRONOLOGIE
             */
            x: {

              type:
                "linear",

              position:
                "bottom",

              title: {

                display:
                  true,

                text:
                  "Chronologie"
              },


              ticks: {

                maxTicksLimit:
                  8,

                callback:
                  function(value) {

                    const date =
                      new Date(value);

                    if (
                      isNaN(
                        date.getTime()
                      )
                    ) {
                      return "";
                    }

                    return date
                      .toLocaleDateString(
                        "fr-FR",
                        {
                          day:
                            "2-digit",

                          month:
                            "2-digit"
                        }
                      );
                  }
              }
            },


            /*
             * AXE GAUCHE = DISTANCE
             */
            yDistance: {

              type:
                "linear",

              position:
                "left",

              beginAtZero: false,

              min:
              1900,

              max:
              3100,

              title: {

                display:
                  true,

                text:
                  "Distance (m)"
              },


              ticks: {

                callback:
                  function(value) {

                    return (
                      Number(value)
                        .toLocaleString(
                          "fr-FR"
                        )
                    );
                  }
              }
            },


            /*
             * AXE DROIT = REDUCTION
             *
             * reverse = true :
             * meilleur chrono plus haut.
             */
            yReduction: {

  type: "linear",

  position: "right",

  reverse: false,

  min: reductionMin,

  max: reductionMax,

  grid: {
    drawOnChartArea: false
  },

  title: {
    display: true,
    text: "Réduction kilométrique"
  },

  ticks: {

    stepSize: 0.5,

    callback: function(value) {

      return formaterReductionSecondes(
        value
      );
    }
  }
}

          }

        }

      }
    );
}

function afficherGraphiqueComparatif(
  lignesCourse
) {

 console.log(
    "=== GRAPHIQUE COMPARATIF ==="
  );

  console.log(
    "Nombre de lignes :",
    lignesCourse
      ? lignesCourse.length
      : 0
  );


  const canvas =
    document.getElementById(
      "graphiqueComparatif"
    );

  console.log(
    "Canvas comparatif :",
    canvas
  );


  if (
    !Array.isArray(lignesCourse) ||
    lignesCourse.length === 0
  ) {

    console.warn(
      "Aucune ligne pour le graphique comparatif."
    );

    return;
  }


  if (!canvas) {

    console.warn(
      "Canvas graphiqueComparatif introuvable."
    );

    return;
  }


  /*
   * Discipline de la course
   */
  const discipline =
    String(
      lignesCourse[0].Discipline || ""
    )
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(
        /[\u0300-\u036f]/g,
        ""
      );


  const estTrot =
    discipline.includes("trot") ||
    discipline.includes("attele") ||
    discipline.includes("monte");


  const estGalop =
    discipline.includes("galop") ||
    discipline.includes("plat") ||
    discipline.includes("obstacle") ||
    discipline.includes("haies") ||
    discipline.includes("steeple");


  /*
   * Maximum 2 chevaux
   */
  const partants =
    obtenirPartantsUniques(
      lignesCourse
    )
      .slice(0, 2);


  if (partants.length === 0) {
    return;
  }


  /*
   * Maximum 8 dernières courses
   * par cheval
   */
  const lignesComparaison = [];


  partants.forEach(
    function(partant) {

      const clePartant =
        construireClePartant(
          partant
        );


      const historique =
        lignesCourse
          .filter(
            function(ligne) {

              return (
                construireClePartant(
                  ligne
                ) === clePartant &&
                ligne.DateHistorique
              );
            }
          )
          .sort(
            function(a, b) {

              return (
                convertirDateEnTimestamp(
                  b.DateHistorique
                ) -
                convertirDateEnTimestamp(
                  a.DateHistorique
                )
              );
            }
          )
          .slice(0, 8);


      historique.forEach(
        function(ligne) {

          lignesComparaison.push(
            ligne
          );
        }
      );
    }
  );

;

  const toutesDistances =
  datasets
    .filter(
      function(dataset) {
        return dataset.yAxisID === "yDistance";
      }
    )
    .flatMap(
      function(dataset) {
        return dataset.data.map(
          function(point) {
            return point.y;
          }
        );
      }
    )
    .filter(
      function(valeur) {
        return Number.isFinite(valeur);
      }
    );


if (toutesDistances.length > 0) {

  distanceMin =
    Math.floor(
      (
        Math.min(...toutesDistances) -
        100
      ) / 100
    ) * 100;


  distanceMax =
    Math.ceil(
      (
        Math.max(...toutesDistances) +
        100
      ) / 100
    ) * 100;
}


  /*
   * Remise dans l'ordre chronologique
   */
  lignesComparaison.sort(
    function(a, b) {

      return (
        convertirDateEnTimestamp(
          a.DateHistorique
        ) -
        convertirDateEnTimestamp(
          b.DateHistorique
        )
      );
    }
  );


  if (estTrot) {

    afficherGraphiqueComparatifTrot(
      canvas,
      lignesComparaison,
      partants
    );

    return;
  }


  if (estGalop) {

    afficherGraphiqueComparatifGalop(
      canvas,
      lignesComparaison,
      partants
    );

    return;
  }


  console.log(
    "Graphique comparatif indisponible pour :",
    discipline
  );
}

function afficherGraphiqueComparatif(
  lignesCourse
) {

  if (
    !Array.isArray(lignesCourse) ||
    lignesCourse.length === 0
  ) {
    return;
  }

  const canvas =
    document.getElementById(
      "graphiqueComparatif"
    );

  if (!canvas) {

    console.warn(
      "Canvas graphiqueComparatif introuvable."
    );

    return;
  }


  /*
   * Discipline de la course
   */
  const discipline =
    String(
      lignesCourse[0].Discipline || ""
    )
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(
        /[\u0300-\u036f]/g,
        ""
      );


  const estTrot =
    discipline.includes("trot") ||
    discipline.includes("attele") ||
    discipline.includes("monte");


  const estGalop =
    discipline.includes("galop") ||
    discipline.includes("plat") ||
    discipline.includes("obstacle") ||
    discipline.includes("haies") ||
    discipline.includes("steeple");


  /*
   * Maximum 2 chevaux
   */
  const partants =
    obtenirPartantsUniques(
      lignesCourse
    )
      .slice(0, 2);


  if (partants.length === 0) {
    return;
  }


  /*
   * Maximum 8 dernières courses
   * par cheval
   */
  const lignesComparaison = [];


  partants.forEach(
    function(partant) {


      const clePartant =
        construireClePartant(
          partant
        );


      const historique =
        lignesCourse
          .filter(
            function(ligne) {

              return (
                construireClePartant(
                  ligne
                ) === clePartant &&
                ligne.DateHistorique
              );
            }
          )
          .sort(
            function(a, b) {

              return (
                convertirDateEnTimestamp(
                  b.DateHistorique
                ) -
                convertirDateEnTimestamp(
                  a.DateHistorique
                )
              );
            }
          )
          .slice(0, 8);


      historique.forEach(
        function(ligne) {

          lignesComparaison.push(
            ligne
          );
        }
      );
    }
  );


  /*
   * Remise dans l'ordre chronologique
   */
  lignesComparaison.sort(
    function(a, b) {

      return (
        convertirDateEnTimestamp(
          a.DateHistorique
        ) -
        convertirDateEnTimestamp(
          b.DateHistorique
        )
      );
    }
  );


  if (estTrot) {

    afficherGraphiqueComparatifTrot(
      canvas,
      lignesComparaison,
      partants
    );

    return;
  }


  if (estGalop) {

    afficherGraphiqueComparatifGalop(
      canvas,
      lignesComparaison,
      partants
    );

    return;
  }


  console.log(
    "Graphique comparatif indisponible pour :",
    discipline
  );
}

function convertirReductionEnSecondes(
  texte
) {

  if (!texte) {
    return null;
  }

  const valeur =
    String(texte)
      .trim()
      .replace(/’/g, "'");


  /*
   * Formats acceptés :
   *
   * 01'15''70
   * 1'15''7
   * 1'15"7
   * 1'15"70
   */
  const match =
    valeur.match(
      /(\d+)'(\d{1,2})(?:''|["”])?(\d{1,2})?/
    );


  if (!match) {
    return null;
  }


  const minutes =
    Number(match[1]);

  const secondes =
    Number(match[2]);

  /*
   * 70 -> 0.70
   * 7  -> 0.7
   */
  const fraction =
    match[3]
      ? Number(
          "0." + match[3]
        )
      : 0;


  return (
    minutes * 60 +
    secondes +
    fraction
  );
}

function formaterReductionSecondes(
  secondes
) {

  if (
    secondes === null ||
    secondes === undefined ||
    isNaN(secondes)
  ) {
    return "";
  }


  const minutes =
    Math.floor(
      secondes / 60
    );


  const reste =
    secondes -
    minutes * 60;


  const sec =
    Math.floor(
      reste
    );


  let dixieme =
    Math.round(
      (reste - sec) * 10
    );


  /*
   * Sécurité en cas d'arrondi à 10.
   */
  if (dixieme === 10) {

    dixieme = 0;

    return (
      minutes +
      "'" +
      String(sec + 1)
        .padStart(
          2,
          "0"
        ) +
      '"' +
      dixieme
    );
  }


  return (
    minutes +
    "'" +
    String(sec)
      .padStart(
        2,
        "0"
      ) +
    '"' +
    dixieme
  );
}

function afficherGraphiqueComparatifGalop(
  canvas,
  lignesComparaison,
  partants
) {

  /*
   * Nettoyage ancien graphique
   */
  if (graphiqueComparatif) {

    graphiqueComparatif.destroy();

    graphiqueComparatif = null;
  }


  const datasets = [];


  /*
   * =========================================
   * CONSTRUCTION DES DATASETS PAR CHEVAL
   * =========================================
   */
  partants.forEach(
    function(partant, indexPartant) {

      const clePartant =
        construireClePartant(
          partant
        );


      const numeroPartant =
        partant.NuméroProgramme ||
        partant.NumeroProgramme ||
        partant["N°"] ||
        "";


      const couleurCheval =
        obtenirCouleurCheval(
          indexPartant,
          partants.length
        );


      const pointsPoids = [];
      const pointsGain = [];


      lignesComparaison.forEach(
        function(ligne) {

          /*
           * Seulement les lignes
           * correspondant au cheval.
           */
          if (
            construireClePartant(
              ligne
            ) !== clePartant
          ) {
            return;
          }


          /*
           * Date
           */
          const timestamp =
            convertirDateEnTimestamp(
              ligne.DateHistorique
            );


          if (timestamp === null) {
            return;
          }


          /*
           * =================================
           * POIDS
           * =================================
           */
          const poids =
            parseFloat(
              String(
                ligne.PoidsHistorique || ""
              )
                .replace(/[^\d.,-]/g, "")
                .replace(",", ".")
            );


          /*
           * =================================
           * GAIN
           * =================================
           */
          const gain =
            Number(
              obtenirGainHistorique(
                ligne
              )
            );


          /*
           * Pour ce graphique,
           * une performance n'est utilisée
           * que si poids ET gain existent.
           */
          if (
            isNaN(poids) ||
            !Number.isFinite(gain)
          ) {
            return;
          }


          /*
           * POIDS
           */
          pointsPoids.push({

            x:
              timestamp,

            y:
              poids,

            cheval:
              ligne.Cheval || "",

            date:
              ligne.DateHistorique || ""
          });


          /*
           * GAIN
           */
          pointsGain.push({

            x:
              timestamp,

            y:
              gain,

            cheval:
              ligne.Cheval || "",

            date:
              ligne.DateHistorique || ""
          });

        }
      );


      /*
       * =====================================
       * BARRES = POIDS
       * =====================================
       */
      if (pointsPoids.length > 0) {

        datasets.push({

          type:
            "bar",

          label:
            partant.Cheval +
            " — Poids",

          cleCheval:
            clePartant,

          data:
            pointsPoids,

          yAxisID:
            "yPoids",

          backgroundColor:
            couleurCheval,

          borderColor:
            couleurCheval,

          borderWidth:
            1,

          borderRadius:
            3,

          barThickness:
            16,

          maxBarThickness:
            18,

          order:
            2
        });
      }


      /*
       * =====================================
       * POINTS = GAIN
       * =====================================
       */
      if (pointsGain.length > 0) {

        datasets.push({

          type:
            "scatter",

          label:
            (
              numeroPartant
                ? numeroPartant + " — "
                : ""
            ) +
            partant.Cheval,

          cleCheval:
            clePartant,

          data:
            pointsGain,

          yAxisID:
            "yGain",

          backgroundColor:
            couleurCheval,

          borderColor:
            "#ffffff",

          pointBackgroundColor:
            couleurCheval,

          pointBorderColor:
            "#ffffff",

          pointBorderWidth:
            2,

          pointRadius:
            7,

          pointHoverRadius:
            7,

          order:
            1
        });
      }

    }
  );


  /*
   * Aucun élément exploitable.
   */
  if (datasets.length === 0) {

    console.warn(
      "Aucune donnée exploitable pour le graphique Galop."
    );

    return;
  }


  /*
   * =========================================
   * ECHELLE POIDS AUTOMATIQUE
   * =========================================
   */

  const tousPoids =
    datasets
      .filter(
        function(dataset) {

          return (
            dataset.yAxisID ===
            "yPoids"
          );
        }
      )
      .flatMap(
        function(dataset) {

          return dataset.data.map(
            function(point) {

              return point.y;
            }
          );
        }
      )
      .filter(
        function(valeur) {

          return Number.isFinite(
            valeur
          );
        }
      );


  let poidsMin = null;
  let poidsMax = null;


  if (tousPoids.length > 0) {

    poidsMin =
      Math.floor(
        (
          Math.min(...tousPoids) -
          1
        ) * 2
      ) / 2;


    poidsMax =
      Math.ceil(
        (
          Math.max(...tousPoids) +
          1
        ) * 2
      ) / 2;
  }


  /*
   * =========================================
   * ECHELLE GAIN AUTOMATIQUE
   * =========================================
   */

  const tousGains =
    datasets
      .filter(
        function(dataset) {

          return (
            dataset.yAxisID ===
            "yGain"
          );
        }
      )
      .flatMap(
        function(dataset) {

          return dataset.data.map(
            function(point) {

              return point.y;
            }
          );
        }
      )
      .filter(
        function(valeur) {

          return Number.isFinite(
            valeur
          );
        }
      );


  let gainMin = 0;
  let gainMax = null;


  if (tousGains.length > 0) {

    const maximum =
      Math.max(
        ...tousGains
      );


    /*
     * Petite marge supérieure.
     */
    gainMax =
      maximum > 0
        ? maximum * 1.10
        : 1;
  }


  /*
   * =========================================
   * CREATION DU GRAPHIQUE
   * =========================================
   */

  graphiqueComparatif =
    new Chart(
      canvas.getContext("2d"),
      {

        data: {

          datasets:
            datasets
        },


        options: {

          responsive:
            true,

          maintainAspectRatio:
            false,


          interaction: {

            mode:
              "nearest",

            intersect:
              false
          },


          plugins: {


            /*
             * TITRE
             */
            title: {

              display:
                true,

              text:
                "Comparaison Galop — 8 dernières courses",

              color:
                "#1f3045",

              font: {

                size:
                  18,

                weight:
                  "bold"
              },

              padding: {

                bottom:
                  16
              }
            },


            /*
             * LEGENDE
             *
             * On affiche uniquement
             * le dataset Gain :
             * une seule entrée par cheval.
             */
            legend: {

              display:
                true,

              position:
                "top",

              labels: {

                usePointStyle:
                  true,

                boxWidth:
                  12,

                filter:
                  function(
                    legendItem,
                    chartData
                  ) {

                    const dataset =
                      chartData.datasets[
                        legendItem.datasetIndex
                      ];


                    return (
                      dataset.yAxisID ===
                      "yGain"
                    );
                  }
              }
            },


            /*
             * Pas d'infobulle
             */
            tooltip: {

              enabled:
                false
            },


            /*
             * VALEURS DIRECTEMENT
             * SUR LE GRAPHIQUE
             */
            datalabels: {

              display:
                function(context) {

                  return (
                    context.raw &&
                    context.raw.y !== null &&
                    context.raw.y !== undefined
                  );
                },


              formatter:
                function(
                  value,
                  context
                ) {


                  /*
                   * POIDS
                   */
                  if (
                    context.dataset.yAxisID ===
                    "yPoids"
                  ) {

                    return (
                      String(
                        Number(value.y)
                      )
                        .replace(
                          ".",
                          ","
                        ) +
                      " kg"
                    );
                  }


                  /*
                   * GAIN
                   */
                  if (
                    context.dataset.yAxisID ===
                    "yGain"
                  ) {

                    return (
                      Number(value.y)
                        .toLocaleString(
                          "fr-FR"
                        ) +
                      " €"
                    );
                  }


                  return "";
                },


              color:
                "#1f3045",


              font:
                function(context) {

                  if (
                    context.dataset.yAxisID ===
                    "yPoids"
                  ) {

                    return {

                      size:
                        9,

                      weight:
                        "bold"
                    };
                  }


                  return {

                    size:
                      10,

                    weight:
                      "bold"
                  };
                },


              anchor:
                function(context) {

                  if (
                    context.dataset.yAxisID ===
                    "yPoids"
                  ) {

                    return "end";
                  }


                  return "center";
                },


              align:
                function(context) {

                  if (
                    context.dataset.yAxisID ===
                    "yPoids"
                  ) {

                    return "start";
                  }


                  return "top";
                },


              offset:
                function(context) {

                  if (
                    context.dataset.yAxisID ===
                    "yPoids"
                  ) {

                    return 6;
                  }


                  return 7;
                },


              clamp:
                true
            }

          },


          /*
           * =================================
           * AXES
           * =================================
           */
          scales: {


            /*
             * CHRONOLOGIE
             */
            x: {

              type:
                "linear",

              position:
                "bottom",

              title: {

                display:
                  true,

                text:
                  "Chronologie"
              },


              ticks: {

                maxTicksLimit:
                  8,

                callback:
                  function(value) {

                    const date =
                      new Date(
                        value
                      );


                    if (
                      isNaN(
                        date.getTime()
                      )
                    ) {

                      return "";
                    }


                    return date
                      .toLocaleDateString(
                        "fr-FR",
                        {

                          day:
                            "2-digit",

                          month:
                            "2-digit"
                        }
                      );
                  }
              }
            },


            /*
             * AXE GAUCHE = POIDS
             */
            yPoids: {

              type:
                "linear",

              position:
                "left",

              beginAtZero:
                false,

              min:
                poidsMin,

              max:
                poidsMax,

              title: {

                display:
                  true,

                text:
                  "Poids (kg)"
              },


              ticks: {

                stepSize:
                  1,

                callback:
                  function(value) {

                    return (
                      String(value)
                        .replace(
                          ".",
                          ","
                        ) +
                      " kg"
                    );
                  }
              }
            },


            /*
             * AXE DROIT = GAIN
             */
            yGain: {

              type:
                "linear",

              position:
                "right",

              beginAtZero:
                true,

              min:
                gainMin,

              max:
                gainMax,

              grid: {

                drawOnChartArea:
                  false
              },


              title: {

                display:
                  true,

                text:
                  "Gain (€)"
              },


              ticks: {

                callback:
                  function(value) {

                    return (
                      Number(value)
                        .toLocaleString(
                          "fr-FR"
                        ) +
                      " €"
                    );
                  }
              }
            }

          }

        }

      }
    );
}

function afficherTableauSyntheseCourse(
  lignesCourse
) {

  const conteneur =
    document.getElementById(
      "tableauSyntheseCourse"
    );

  if (!conteneur) {
    return;
  }

  if (
    !Array.isArray(lignesCourse) ||
    lignesCourse.length === 0
  ) {
    conteneur.innerHTML = "";
    return;
  }


  const partantsSynthese =
    obtenirPartantsUniques(
      lignesCourse
    );


  console.log(
    "Partants synthèse :",
    partantsSynthese
  );


  const statistiques = [];


  partantsSynthese.forEach(
    function(partant) {

      // suite du calcul...
    

      const clePartant =
        construireClePartant(
          partant
        );


      const lignesCheval =
        lignesCourse.filter(
          function(ligne) {

            return (
              construireClePartant(
                ligne
              ) === clePartant
            );
          }
        );


      /*
       * On ne conserve que les
       * performances avec une date.
       */
      const historique =
        lignesCheval
          .filter(
            function(ligne) {

              return !!ligne.DateHistorique;
            }
          )
          .sort(
            function(a, b) {

              return (
                convertirDateEnTimestamp(
                  b.DateHistorique
                ) -
                convertirDateEnTimestamp(
                  a.DateHistorique
                )
              );
            }
          );


      let courses = 0;
      let victoires = 0;
      let top3 = 0;
      let gains = 0;


      historique.forEach(
        function(ligne) {

          const place =
            extrairePlaceNumerique(
              ligne.Place
            );


          /*
           * Une ligne historique
           * exploitable = une course.
           */
          courses++;


          if (place === 1) {
            victoires++;
          }


          if (
            place !== null &&
            place >= 1 &&
            place <= 3
          ) {
            top3++;
          }


          const gain =
            Number(
              obtenirGainHistorique(
                ligne
              )
            );


          if (
            Number.isFinite(gain)
          ) {
            gains += gain;
          }
        }
      );


      /*
       * Musique :
       * 5 dernières performances.
       */
     const musique =
  historique
    .slice(0, 5)
    .map(
      function(ligne) {

        return formaterMusiqueHistorique(
          ligne
        );
      }
    )
    .filter(Boolean)
    .join(" ");


      const pourcentageTop3 =
        courses > 0
          ? (
              top3 /
              courses *
              100
            )
          : 0;

      const gainMoyen =
      courses > 0
    ? gains / courses
    : 0;    


      statistiques.push({

        numero:
          partant.NuméroProgramme ||
          partant.NumeroProgramme ||
          "",

        cheval:
          partant.Cheval || "",

        musique:
          musique,

        courses:
          courses,

        victoires:
          victoires,

        top3:
          top3,

        pourcentageTop3:
          pourcentageTop3,

        gains:
          gains,

        gainMoyen:
        gainMoyen
      });

    }
  );


  /*
   * Construction HTML
   */
  let html = `

    <div class="tableau-synthese-course">

      <h3>
        Synthèse des partants
      </h3>

      <div class="tableau-synthese-scroll">

        <table>

          <thead>

            <tr>
              <th>N°</th>
              <th>Cheval</th>
              <th>Musique (5)</th>
              <th>Courses</th>
              <th>Victoires</th>
              <th>Top 3</th>
              <th>% Top 3</th>
              <th>Gains</th>
              <th>Gain moyen</th>
            </tr>

          </thead>

          <tbody>
  `;


  statistiques.forEach(
    function(stat) {

      html += `

        <tr>

          <td>
            ${stat.numero}
          </td>

          <td class="nom-cheval">
            ${stat.cheval}
          </td>

          <td>
            ${stat.musique}
          </td>

          <td>
            ${stat.courses}
          </td>

          <td>
            ${stat.victoires}
          </td>

          <td>
            ${stat.top3}
          </td>

          <td>
            ${stat.pourcentageTop3
              .toFixed(0)} %
          </td>

          <td>
            ${stat.gains
              .toLocaleString(
                "fr-FR"
              )} €
          </td>

          <td>
        ${Math.round(
        stat.gainMoyen
        ).toLocaleString(
         "fr-FR"
        )} €
</td>

        </tr>
      `;
    }
  );


  html += `

          </tbody>

        </table>

      </div>

    </div>
  `;


  conteneur.innerHTML =
    html;
}

function formaterMusiqueHistorique(
  ligne
) {

  if (!ligne) {
    return "";
  }


  /*
   * ============================
   * DISCIPLINE
   * ============================
   */
  const discipline =
    String(
      ligne.DisciplineHistorique ||
      ligne.Discipline ||
      ""
    )
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(
        /[\u0300-\u036f]/g,
        ""
      );


  let suffixe = "";


  /*
   * TROT
   */
  if (
    discipline.includes("attele")
  ) {

    suffixe = "a";

  } else if (
    discipline.includes("monte")
  ) {

    suffixe = "m";


  /*
   * GALOP
   */
  } else if (
    discipline.includes("plat")
  ) {

    suffixe = "p";

  } else if (
    discipline.includes("haie")
  ) {

    suffixe = "h";

  } else if (
    discipline.includes("steeple")
  ) {

    suffixe = "s";
  }


  /*
   * ============================
   * STATUT
   * ============================
   */
  const statut =
    String(
      ligne.StatutHistorique ||
      ""
    )
      .trim()
      .toUpperCase();


  /*
   * TOMBÉ
   *
   * Th = tombé en haies
   * Ts = tombé en steeple
   */
  if (
    statut.includes("TOMBE")
  ) {

    return (
      "T" +
      suffixe
    );
  }


  /*
   * DISQUALIFIÉ
   *
   * Da = attelé
   * Dm = monté
   */
  if (
    statut.includes("DISQUAL") ||
    statut === "DAI"
  ) {

    return (
      "D" +
      suffixe
    );
  }


  /*
   * ============================
   * PLACE
   * ============================
   */
  const place =
    extrairePlaceNumerique(
      ligne.Place
    );


  /*
   * Performance classée
   */
  if (
    place !== null &&
    place > 0
  ) {

    return (
      place +
      suffixe
    );
  }


  /*
   * Non classé
   */
  return (
    "0" +
    suffixe
  );
}


function detecterConfrontationsDirectes(
  lignesCourse
) {

  console.log(
    "======================================"
  );

  console.log(
    "DETECTION CONFRONTATIONS DIRECTES"
  );

  console.log(
    "======================================"
  );


  if (
    !Array.isArray(lignesCourse) ||
    lignesCourse.length === 0
  ) {

    console.log(
      "Aucune donnée."
    );

    return [];
  }


  /*
   * =====================================
   * CLE CHEVAL
   *
   * Pour le premier test :
   * uniquement le nom normalisé.
   *
   * Plus tard :
   * nom + pays + discipline générale.
   * =====================================
   */
  function cleCheval(ligne) {

    return String(
      ligne.Cheval || ""
    )
      .trim()
      .toUpperCase()
      .normalize("NFD")
      .replace(
        /[\u0300-\u036f]/g,
        ""
      );
  }


  /*
   * =====================================
   * CHEVAUX DE LA COURSE ACTUELLE
   * =====================================
   */
  const partantsActuels =
    obtenirPartantsUniques(
      lignesCourse
    );


  const chevauxActuels =
    new Set();


  partantsActuels.forEach(
    function(partant) {

      const cle =
        cleCheval(
          partant
        );

      if (cle) {

        chevauxActuels.add(
          cle
        );
      }
    }
  );


  console.log(
    "Nombre de partants actuels :",
    chevauxActuels.size
  );


  /*
   * =====================================
   * REGROUPEMENT PAR COURSE HISTORIQUE
   * =====================================
   */
  const coursesHistoriques =
    new Map();


  lignesCourse.forEach(
    function(ligne) {

      const courseID =
        String(
          ligne.CourseIDHistorique ||
          ""
        ).trim();


      if (!courseID) {
        return;
      }


      const cle =
        cleCheval(
          ligne
        );


      /*
       * On ne s'intéresse qu'aux
       * chevaux présents aujourd'hui.
       */
      if (
        !chevauxActuels.has(
          cle
        )
      ) {
        return;
      }


      if (
        !coursesHistoriques.has(
          courseID
        )
      ) {

        coursesHistoriques.set(
          courseID,
          []
        );
      }


      coursesHistoriques
        .get(courseID)
        .push(
          ligne
        );
    }
  );


  /*
   * =====================================
   * RECHERCHE DES COURSES COMMUNES
   * =====================================
   */
  const confrontations = [];


  coursesHistoriques.forEach(
    function(
      lignes,
      courseID
    ) {

      /*
       * Plusieurs lignes du même cheval
       * ne doivent pas compter plusieurs fois.
       */
      const chevauxPresents =
        new Set();


      lignes.forEach(
        function(ligne) {

          chevauxPresents.add(
            cleCheval(
              ligne
            )
          );
        }
      );


      /*
       * Il faut au minimum
       * deux chevaux différents.
       */
      if (
        chevauxPresents.size < 2
      ) {
        return;
      }


      confrontations.push({

        courseID:
          courseID,

        lignes:
          lignes

      });


      /*
       * =================================
       * AFFICHAGE CONSOLE
       * =================================
       */

      console.log(
        "--------------------------------------"
      );

      console.log(
        "COURSE COMMUNE :",
        courseID
      );


      lignes.forEach(
        function(ligne) {

          console.log(
            "→",
            ligne.Cheval,
            "| Place :",
            ligne.Place,
            "| Date :",
            ligne.DateHistorique
          );
        }
      );

    }
  );


  console.log(
    "======================================"
  );

  console.log(
    "Nombre de courses avec confrontation :",
    confrontations.length
  );

  console.log(
    "======================================"
  );


  return confrontations;
}

function filtrerConfrontationsDirectes(
  lignesCourse
) {

  if (
    !Array.isArray(lignesCourse) ||
    lignesCourse.length === 0
  ) {
    return [];
  }


  function cleCheval(ligne) {

    return String(
      ligne.Cheval || ""
    )
      .trim()
      .toUpperCase()
      .normalize("NFD")
      .replace(
        /[\u0300-\u036f]/g,
        ""
      );
  }


  const partantsActuels =
    obtenirPartantsUniques(
      lignesCourse
    );


  const chevauxActuels =
    new Set(
      partantsActuels
        .map(
          function(partant) {

            return cleCheval(
              partant
            );
          }
        )
        .filter(Boolean)
    );


  const coursesHistoriques =
    new Map();


  lignesCourse.forEach(
    function(ligne) {

      const courseID =
        String(
          ligne.CourseIDHistorique || ""
        ).trim();


      if (!courseID) {
        return;
      }


      const cle =
        cleCheval(
          ligne
        );


      if (
        !chevauxActuels.has(
          cle
        )
      ) {
        return;
      }


      if (
        !coursesHistoriques.has(
          courseID
        )
      ) {

        coursesHistoriques.set(
          courseID,
          []
        );
      }


      coursesHistoriques
        .get(courseID)
        .push(
          ligne
        );
    }
  );


  const coursesCommunes =
    new Set();


  coursesHistoriques.forEach(
    function(
      lignes,
      courseID
    ) {

      const chevauxPresents =
        new Set(
          lignes
            .map(
              function(ligne) {

                return cleCheval(
                  ligne
                );
              }
            )
            .filter(Boolean)
        );


      if (
        chevauxPresents.size >= 2
      ) {

        coursesCommunes.add(
          courseID
        );
      }
    }
  );


  return lignesCourse.filter(
    function(ligne) {

      const courseID =
        String(
          ligne.CourseIDHistorique || ""
        ).trim();


      return (
        courseID &&
        coursesCommunes.has(
          courseID
        )
      );
    }
  );
}

document.addEventListener(
  "DOMContentLoaded",
  function() {

    const caseConfrontations =
      document.getElementById(
        "filtreConfrontationsDirectes"
      );

    if (!caseConfrontations) {

      console.warn(
        "Case filtreConfrontationsDirectes introuvable"
      );

      return;
    }


    console.log(
      "Filtre confrontations initialisé"
    );


    caseConfrontations.addEventListener(
      "change",
      function() {

        console.log(
          "Case confrontations modifiée :",
          caseConfrontations.checked
        );

        mettreAJourGraphiquesSelection();
      }
    );
/*
 * ==========================================
 * FILTRE 3 DERNIERS MOIS
 * ==========================================
 */

const case3Mois =
  document.getElementById(
    "filtre3Mois"
  );


if (case3Mois) {

  case3Mois.addEventListener(
    "change",
    function() {

      console.log(
        "Filtre 3 mois modifié :",
        case3Mois.checked
      );

      mettreAJourGraphiquesSelection();

    }
  );
}
  }



  
);

function afficherTableauConfrontationsDirectes(
  lignes
) {

  const zone =
    document.getElementById(
      "zoneConfrontationsDirectes"
    );

  const corps =
    document.getElementById(
      "corpsTableauConfrontations"
    );

  const caseConfrontations =
    document.getElementById(
      "filtreConfrontationsDirectes"
    );

  const numerosActuels =
  construireMapNumeroPartantActuel();


  if (
    !zone ||
    !corps
  ) {
    return;
  }


  /*
   * Filtre désactivé :
   * on masque complètement le tableau.
   */
  if (
    !caseConfrontations ||
    !caseConfrontations.checked
  ) {

    zone.style.display = "none";
    corps.innerHTML = "";

    return;
  }


  if (
    !Array.isArray(lignes) ||
    lignes.length === 0
  ) {

    zone.style.display = "block";

    corps.innerHTML = `
      <tr>
        <td colspan="4" class="aucune-confrontation">
          Aucune confrontation directe trouvée.
        </td>
      </tr>
    `;

    return;
  }


  /*
   * ==========================================
   * REGROUPEMENT PAR COURSE HISTORIQUE
   * ==========================================
   */

  const courses =
    new Map();


  lignes.forEach(
    function(ligne) {

      const courseID =
        String(
          ligne.CourseIDHistorique || ""
        ).trim();


      if (!courseID) {
        return;
      }


      if (!courses.has(courseID)) {

        courses.set(
          courseID,
          []
        );
      }


      courses
        .get(courseID)
        .push(ligne);

    }
  );


  /*
   * ==========================================
   * TRANSFORMATION EN TABLEAU
   * ==========================================
   */

  const confrontations = [];


  courses.forEach(
    function(
      lignesCourse,
      courseID
    ) {

      if (
        lignesCourse.length < 2
      ) {
        return;
      }


      const premiereLigne =
        lignesCourse[0];


      confrontations.push({

        courseID:
          courseID,

        hippodrome:
          premiereLigne.HippodromeHistorique ||
          premiereLigne.Hippodrome ||
          "",

        date:
          premiereLigne.DateHistorique ||
          "",

        lignes:
          lignesCourse

      });

    }
  );


  /*
   * ==========================================
   * TRI :
   * PLUS RECENT → PLUS ANCIEN
   * ==========================================
   */

  confrontations.sort(
    function(a, b) {

      return (
        new Date(b.date) -
        new Date(a.date)
      );

    }
  );


  /*
   * ==========================================
   * CONSTRUCTION HTML
   * ==========================================
   */

  corps.innerHTML = "";


  confrontations.forEach(
    function(confrontation) {

      /*
       * Classement des chevaux.
       *
       * Les places numériques sont affichées
       * en premier.
       * DAI / 0 / autres résultats viennent
       * ensuite.
       */

      const lignesClassees =
        [...confrontation.lignes];


      lignesClassees.sort(
        function(a, b) {

          const placeA =
            extrairePlaceNumerique(
              a.Place
            );

          const placeB =
            extrairePlaceNumerique(
              b.Place
            );


          const valeurA =
            placeA !== null &&
            placeA > 0
              ? placeA
              : 999;


          const valeurB =
            placeB !== null &&
            placeB > 0
              ? placeB
              : 999;


          return valeurA - valeurB;

        }
      );


    const classement =
  '<div class="liste-classement-confrontation">' +

  lignesClassees
    .map(
      function(ligne) {

        const cheval =
          String(
            ligne.Cheval || ""
          ).trim();

        const cleCheval =
  normaliserCleChevalInterface(
    ligne.Cheval
  );

const numeroActuel =
  numerosActuels.get(
    cleCheval
  ) || "";

  

          const numero =
  String(
    ligne.Numero ||
    ligne.Num ||
    ligne["N°"] ||
    ""
  ).trim();

        const placeBrute =
          String(
            ligne.Place || ""
          ).trim();

        const place =
          extrairePlaceNumerique(
            ligne.Place
          );

        let affichagePlace = "";


        if (
          place !== null &&
          place > 0
        ) {

          affichagePlace =
            place + "e";

        } else if (
          placeBrute
            .toUpperCase()
            .includes("DAI")
        ) {

          affichagePlace =
            "DAI";

        } else {

          affichagePlace =
            "NC";
        }


return `
  <span class="cheval-confrontation">

    <strong class="numero-confrontation">
      ${numeroActuel}
    </strong>

    <span class="tiret-confrontation">—</span>

    <span class="nom-cheval-confrontation">
      ${cheval}
    </span>

    <span class="tiret-confrontation">—</span>

    <strong class="place-confrontation">
      ${affichagePlace}
    </strong>

  </span>
`;
      }
    )
    .join(
      '<span class="separateur-confrontation">•</span>'
    )

  + '</div>';


      /*
       * Code réunion/course :
       *
       * R3C4_2026-07-26
       * devient R3C4
       */

      const codeCourse =
        confrontation.courseID
          .split("_")[0];


      /*
       * Date française
       */

      let dateAffichee =
        confrontation.date;


      if (confrontation.date) {

        const morceaux =
          String(
            confrontation.date
          ).split("-");


        if (
          morceaux.length === 3
        ) {

          dateAffichee =
            morceaux[2] +
            "/" +
            morceaux[1] +
            "/" +
            morceaux[0];
        }
      }


      const tr =
        document.createElement(
          "tr"
        );


      tr.innerHTML = `
        <td class="course-confrontation">
          ${codeCourse}
        </td>

        <td>
          ${confrontation.hippodrome}
        </td>

        <td class="date-confrontation">
          ${dateAffichee}
        </td>

        <td class="classement-confrontation">
          ${classement}
        </td>
      `;


      corps.appendChild(
        tr
      );

    }
  );


  zone.style.display =
    "block";
}

function construireMapNumeroPartantActuel() {

  const mapNumeros =
    new Map();


  const partantsActuels =
    obtenirPartantsUniques(
      lignesCourseCourante
    );


  partantsActuels.forEach(
    function(partant) {

      const cleCheval =
        normaliserCleChevalInterface(
          partant.Cheval
        );


      const numero =
        partant.NuméroProgramme ||
        partant.NumeroProgramme ||
        partant.Numero ||
        partant["N°"] ||
        "";


      if (
        cleCheval &&
        numero !== ""
      ) {

        mapNumeros.set(
          cleCheval,
          numero
        );
      }

    }
  );


  return mapNumeros;
}

function filtrerTroisDerniersMois(
  lignes
) {

  if (
    !Array.isArray(lignes) ||
    lignes.length === 0
  ) {
    return [];
  }


  /*
   * Date de la course actuellement analysée.
   *
   * On recherche la date la plus récente disponible
   * dans les lignes historiques.
   */
  const dates =
    lignes
      .map(function(ligne) {

        return ligne.DateHistorique
          ? new Date(ligne.DateHistorique)
          : null;

      })
      .filter(function(date) {

        return (
          date &&
          !isNaN(date.getTime())
        );

      });


  if (dates.length === 0) {
    return lignes;
  }


  const dateReference =
    new Date(
      Math.max(
        ...dates.map(
          date => date.getTime()
        )
      )
    );


  /*
   * Recul de 3 mois calendaires.
   */
  const dateLimite =
    new Date(dateReference);

  dateLimite.setMonth(
    dateLimite.getMonth() - 3
  );


  console.log(
    "Filtre 3 mois :",
    dateLimite.toLocaleDateString("fr-FR"),
    "→",
    dateReference.toLocaleDateString("fr-FR")
  );


  return lignes.filter(
    function(ligne) {

      if (!ligne.DateHistorique) {
        return false;
      }


      const date =
        new Date(
          ligne.DateHistorique
        );


      if (
        isNaN(date.getTime())
      ) {
        return false;
      }


      return (
        date >= dateLimite &&
        date <= dateReference
      );

    }
  );
}