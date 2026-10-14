# FLUX — contexte produit

Demande confirmée : application mobile de streaming à la manière de Twitch, tous les parcours, design moderne, navigation flottante et glassmorphisme. L’utilisateur a validé le design FLUX puis demandé le 14 octobre 2026 son implémentation Rust/Tauri à partir de Xtra et la création d’un dépôt GitHub public.

Le produit est un client Twitch indépendant, pas un hébergeur de streams. Android est la cible mobile de cette livraison ; Windows est la seconde cible compilée. La palette, Inter, le verre translucide et la navigation reprennent le design Pen validé. Les photos et comptes de la maquette ne doivent pas être présentés comme des données live.

Réussite principale : ouvrir l’application, découvrir un vrai direct, le regarder, consulter le chat, retrouver ses créateurs et reprendre ses contenus. La connexion n’est nécessaire que pour les opérations liées au compte. Les préférences et favoris locaux restent disponibles sans compte.

Les 76 maquettes incluent des états et des opérations que Twitch doit gérer. Chaque transition doit soit fonctionner localement ou via une API réelle, soit ouvrir clairement l’outil officiel approprié. Aucun succès de paiement, diffusion, signalement ou publication ne doit être inventé. La couverture exacte et les fonctionnalités non implémentées figurent dans docs/SCREENS.md et docs/ARCHITECTURE.md.

Les documents de la conception statique d’origine sont préservés dans docs/design/. La livraison native est une première version expérimentale tant que la validation de compte réel et d’appareils physiques n’a pas été faite.
