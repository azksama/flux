# Validation de FLUX 0.1.0 — préversion

Contrôles effectués le 14 octobre 2026. Les preuves de la conception statique antérieure sont conservées dans [docs/design/VALIDATION.md](docs/design/VALIDATION.md). La [CI GitHub du code livré](https://github.com/azksama/flux/actions/runs/38596236789) est réussie sur Ubuntu (frontend) et Windows (Rust), commit `20dd4a26bb046557d280bf9c4420e17ad7c520e4`.

## Contrôles exécutés

| Surface | Résultat et portée |
|---|---|
| TypeScript / Vite | Compilation de production réussie. Avertissement de taille du bundle HLS, sans erreur. |
| Tests TypeScript | 10 tests réussis : parsing IRC, données locales malformées et contraste des couleurs du chat. |
| Rust | 5 tests unitaires réussis : validation des entrées/URLs, réécriture des playlists et authentification du coffre. |
| Rust statique | `cargo fmt --check` et `cargo clippy --all-targets -- -D warnings` réussis. |
| Réseau Twitch réel | Test Rust facultatif exécuté avec succès : catalogue, chaîne, recherche, catégories, favoris, listes de replays/clips, biographie, manifeste HLS, variante et segment vidéo. Aucun compte utilisé. |
| Navigateur | 6 tests Playwright réussis aux tailles téléphone et ordinateur : onboarding, navigation, persistance du contraste, états vides, liens officiels et débordement. Ce sont des tests de présentation, pas une preuve du service natif. |
| Windows natif | Build NSIS réussi. Le vrai WebView2 a chargé le catalogue, avancé la lecture vidéo au-delà de 2 secondes, ouvert puis fermé le mini-lecteur. Aucune erreur JavaScript capturée. |
| Android natif | APK x86_64 installé sur Android Emulator. Test AndroidJUnitRunner réussi : catalogue réel, lecture, chat connecté, mini-lecteur, rotation portrait/paysage, menu visible, contraste, téléchargement d’un clip réel, lecture via le protocole de fichiers privés, suppression du fichier de test. |
| Dépendances JS | `npm audit` : aucune vulnérabilité signalée à la date du contrôle. Cela ne constitue pas un audit de sécurité exhaustif. |

Le test Android utilise exclusivement Android Emulator, ADB, AndroidX Test et Logcat. Aucun outil ARTEMIS n’a été utilisé. Les captures natives montrent des contenus publics variables ; le panneau « Commercial break in progress » provient réellement de Twitch. FLUX ne contourne pas les publicités.

## Régressions corrigées pendant la validation

- Valeurs par défaut du tri des replays exigées par GraphQL.
- Débordement Android provoqué par les titres longs dans une piste de grille implicite.
- Géométrie du lecteur paysage et prise en compte des barres système Android.
- Relecture indépendante : action du chat maintenue visible en portrait, cibles tactiles du lecteur de 48 px et contraste des pseudonymes à 4,5:1 minimum. Verdict « ship » limité aux trois corrections F1–F3 ; voir [la transposition du design](docs/IMPLEMENTATION_DESIGN.md).
- Domaine CloudFront exact des clips Twitch ajouté à la liste autorisée ; les autres distributions restent refusées.
- Le test ne ferme pas la dernière activité Tauri avant le résultat JUnit : cette fermeture arrête normalement le processus natif.

## Limites de preuve

- L’APK ARM64 est compilé, sans validation sur téléphone physique. Le téléphone x86_64 de l’émulateur et Windows sont les seules cibles natives exécutées ; pas de validation tablette, TV, iOS, Linux ou macOS.
- Le parcours de connexion officiel et les commandes authentifiées sont implémentés mais non validés avec un compte réel : aucun Client ID d’application publique ni compte de test n’a été fourni. Cela inclut envoi du chat, import des suivis, création de clips, édition de chaîne et modération.
- La lecture locale d’un clip MP4 a été vérifiée. Le téléchargement intégral d’un long replay et sa lecture complète n’ont pas été validés en conditions réelles. Le parseur de playlist dispose de tests unitaires.
- Pas de test de lecture prolongée, batterie, interruptions téléphoniques, reprise après arrêt forcé, lecteur d’écran ou clavier physique Android. Les captures ne prouvent pas l’accessibilité complète.
- APK de préversion signés avec une clé de développement et moteur Rust compilé en mode release ; signatures des deux APK vérifiées avec `apksigner`. L’APK x86_64 final réassemblé a été installé et a repassé le test instrumenté en 49,683 secondes sur Android 16 / API 36. Installateur Windows non signé. Ces binaires servent aux essais, pas à une publication Play Store.
- Les fonctions absentes et les parcours délégués à Twitch sont détaillés dans [SCREENS.md](docs/SCREENS.md). Cette livraison n’est pas une parité complète de Xtra.

Les tests natifs et les scripts se trouvent dans le dépôt ; les captures de contrôle et résultats de la livraison sont regroupés dans l’archive QA de la release. Aucun secret, identifiant de session ou fichier utilisateur n’est inclus.
