# FLUX — transposition du design dans l’application

Revue du 14 octobre 2026, préversion 0.1.0. Le design mobile approuvé reste l’autorité : [DESIGN.md](../DESIGN.md), [son sidecar](../.impeccable/design.json) et [Flux-Mobile.pen](../Flux-Mobile.pen) sont préservés sans modification. Ce complément décrit l’implémentation Android/Windows Rust/Tauri ; il ne remplace ni les tokens canoniques ni l’historique de [conception statique](design/README.md).

## Continuité visuelle

| Élément canonique | Constat dans l’implémentation |
|---|---|
| Encre, surface, texte, texte secondaire, menthe et encre sur menthe | Les six valeurs sont reprises exactement dans les variables CSS. Le rouge du badge direct reste distinct du corail de signalisation. |
| Inter, graisses 400/500/600/700 | Les quatre graisses sont embarquées. La hiérarchie conserve les titres affirmés et les informations secondaires discrètes. |
| Verre V2 : trois étapes de dégradé, flou 18, ombre douce | Les couleurs et positions du dégradé sont reprises en CSS à 145°, avec un flou de 18 px. Les captures montrent bien le contenu sous la navigation et les commandes superposées. |
| Navigation flottante à quatre destinations | Accueil, Explorer, Suivis et Profil restent présents ; hauteur 76 px, rayon 38 px et sélection menthe conservés sur mobile. À 390 px de largeur, la barre mesure 350 px comme le gabarit. |
| Bouton principal en capsule | Couleurs et rayon de 26 px conservés ; dimensions adaptées au contenu. |

Le verre reste cohérent avec « Le direct derrière le verre ». Les images et métadonnées des catalogues natifs proviennent de Twitch et remplacent les personnes et chiffres illustratifs de la maquette. La séquence publicitaire visible dans les lecteurs appartient au flux Twitch.

## Adaptations et écarts constatés

Les styles de [base](../src/styles.css) et [responsive](../src/styles-responsive.css) traduisent les positions statiques en contraintes : largeur mobile fluide, grilles à partir de 640 px, navigation latérale de 224 px à partir de 1000 px, lecteur paysage avec chat dans une colonne de 300 px lorsque la hauteur ne dépasse pas 600 px. Le bureau ajoute une seconde carte à la une. Ces compositions prolongent le système mobile ; le Pen ne définissait aucun breakpoint.

La transposition n’est pas une reproduction pixel à pixel. Le contour de verre en dégradé devient une bordure unie avec reflets internes ; la saturation du flou est augmentée à 145 %. L’ombre CSS utilise une opacité légèrement différente. L’ambiance photographique utilise une opacité de 0,36 contre 0,24 dans le document canonique. La typographie introduit notamment des métadonnées de 9–12 px et des titres de bureau de 42–46 px, hors des neuf tailles documentées. Le bouton principal passe d’une hauteur fixe de 52 px à un minimum de 48 px avec padding. Ces écarts sont consignés, sans modifier la référence ni entreprendre une correction visuelle supplémentaire.

## Corrections d’accessibilité retenues

- **F1 — participation au chat :** en portrait mobile, le lecteur avec chat tient dans la hauteur visible ; les messages défilent dans l’espace restant. L’action de connexion demeure visible dans les captures portrait et paysage. Le clavier et l’envoi avec un compte réel restent hors de cette preuve.
- **F2 — commandes :** les boutons de la barre du lecteur, les commandes superposées du lecteur et du mini-lecteur, l’envoi et les boutons d’emotes disposent de cibles de 48 px. Ce constat ne certifie pas toutes les actions de l’application ; certaines commandes secondaires conservent d’autres dimensions.
- **F3 — pseudos :** [chat-color.ts](../src/chat-color.ts) conserve une couleur Twitch uniquement si son contraste atteint 4,5:1 sur la surface de chat `#152129`, sinon applique la menthe. Une valeur invalide reçoit aussi ce repli. Les tests unitaires de contraste sont consignés dans la validation.

Le contraste renforcé remplace le verre par une surface opaque et supprime l’ambiance ; le focus clavier est visible et la réduction des mouvements respecte également la préférence système. Ces dispositions ne constituent pas un audit exhaustif d’accessibilité.

## Preuves et disposition

Sources examinées : les fichiers canoniques ci-dessus, PRODUCT.md, README.md, les deux feuilles CSS, le calcul des couleurs du chat, [VALIDATION.md](../VALIDATION.md) et la [matrice de couverture](SCREENS.md). Captures natives examinées dans `.impeccable/review/` : `native-home.png`, `native-player.png`, `native-landscape.png`, `native-contrast.png`, `native-offline-clip.png`, `windows-home.png` et `windows-player.png`.

**Disposition : livrable sur le périmètre F1–F3.** Les captures confirment la cohérence du verre, de l’accueil et de l’adaptation au bureau. Les contrôles natifs Android Emulator x86_64 et Windows sont réussis selon VALIDATION.md ; cette revue documentaire ne les réexécute pas. Elle ne prouve ni la fidélité exhaustive des 76 maquettes, ni la parité Xtra, ni les parcours authentifiés sans Client ID et compte de test, ni le fonctionnement sur téléphone ARM64 physique. Les parcours confiés à Twitch et les fonctions absentes restent explicités dans la matrice de couverture.
