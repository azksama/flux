# FLUX - Design mobile de streaming

76 écrans et variantes éditables dans `Flux-Mobile.pen`, plus une planche de composants. Design moderne en français, verre fumé et navigation flottante. Nom de travail et données fictives.

## Livrables

- `Flux-Mobile.pen` : document pen.dev, textes et calques éditables.
- `assets/` : les 4 photographies utilisées et leurs URL de provenance. Conserver ce dossier à côté du fichier .pen pour une ouverture autonome.
- `exports/Flux-Mobile.pdf` : consultation des 77 planches (guide puis 76 écrans/variantes), avec signets. Les pages sont aplaties depuis les rendus PNG afin de préserver fidèlement le flou du verre ; le fichier .pen reste éditable.
- `exports/screens/` : exports PNG à échelle 2.
- `DESIGN.md` et `.impeccable/design.json` : règles visuelles et tokens.
- `exports/inventory.json` : identifiants et emplacements des planches.

## Parcours

- Entrée : bienvenue → inscription/connexion → vérification → intérêts → notifications → accueil. Récupération et double authentification incluses.
- Spectateur : accueil/exploration → recherche/filtres/catégorie → chaîne → direct/chat. Suivre, partager, s’abonner, offrir, signaler et modérer un membre.
- Contenus : chaîne → planning/à propos → replay → clip → publication. Bibliothèque, mini-lecteur, audio seul, paysage et chat avec clavier.
- Compte : profil → modification, abonnements, réglages, confidentialité, accessibilité, notifications et suppression.
- Créateur : studio → préparation → permissions → aperçu → diffusion → modération → fin → publication du replay. Contenus, statistiques et revenus.
- Exceptions : aucun résultat, suivis/notifications vides, réseau perdu, lecture indisponible, paiement refusé, permissions refusées, chargement, chat réservé, session expirée et erreurs de formulaire.

## Limites du livrable

Il s’agit d’une conception statique, pas d’une application ni d’un prototype cliquable. Les liens entre écrans sont décrits ci-dessus. Aucun backend, paiement réel, envoi de message ou test sur Android n’a été effectué. Les prix, créateurs, audiences et statistiques sont illustratifs. Les photographies sont des visuels de démonstration, pas des captures de vrais directs.

Le gabarit principal mesure 390 × 844 ; le lecteur paysage mesure 844 × 390. Les cibles tactiles, le texte dynamique et les insets doivent être validés lors de l’implémentation. Le clavier est une représentation simplifiée, remplacée par le clavier système dans l’application.

## Inventaire

| N° | Écran / variante | Aperçu |
|---|---|---|
| 01 | Accueil | [PNG](exports/screens/eJFKe.png) |
| 02 | Explorer | [PNG](exports/screens/sl2OB.png) |
| 03 | Direct et chat | [PNG](exports/screens/Jzop9.png) |
| 04 | Bienvenue | [PNG](exports/screens/QhkP7.png) |
| 05 | Connexion | [PNG](exports/screens/YZriH.png) |
| 06 | Inscription | [PNG](exports/screens/R4tf6.png) |
| 07 | Vérification e-mail | [PNG](exports/screens/p3iRSb.png) |
| 08 | Récupération du compte | [PNG](exports/screens/hiZZo.png) |
| 09 | Centres d’intérêt | [PNG](exports/screens/tneNM.png) |
| 10 | Permission notifications | [PNG](exports/screens/S29tu.png) |
| 11 | Recherche | [PNG](exports/screens/p3XdM.png) |
| 12 | Catégorie | [PNG](exports/screens/BWokL.png) |
| 13 | Suivis | [PNG](exports/screens/WuYkL.png) |
| 14 | Chaîne en direct | [PNG](exports/screens/WzjEa.png) |
| 15 | Chaîne hors ligne | [PNG](exports/screens/jFrrZ.png) |
| 16 | Planning de chaîne | [PNG](exports/screens/pngN5.png) |
| 17 | À propos de la chaîne | [PNG](exports/screens/T9moR.png) |
| 18 | Bibliothèque | [PNG](exports/screens/Qv9cV.png) |
| 19 | Lecteur replay | [PNG](exports/screens/X3vhJ.png) |
| 20 | Clips immersifs | [PNG](exports/screens/rShoo.png) |
| 21 | Créer un clip | [PNG](exports/screens/CR8hH.png) |
| 22 | Partager | [PNG](exports/screens/k6UuX.png) |
| 23 | Notifications | [PNG](exports/screens/oYNOn.png) |
| 24 | Profil | [PNG](exports/screens/fk7Yo.png) |
| 25 | Modifier le profil | [PNG](exports/screens/iQzdR.png) |
| 26 | Abonnement à une chaîne | [PNG](exports/screens/D82ch.png) |
| 27 | Offrir un abonnement | [PNG](exports/screens/PG0DU.png) |
| 28 | Paiement | [PNG](exports/screens/X6Ss6.png) |
| 29 | Paiement confirmé | [PNG](exports/screens/FlOvR.png) |
| 30 | Mes abonnements | [PNG](exports/screens/sugIO.png) |
| 31 | Gérer un abonnement | [PNG](exports/screens/NcxmH.png) |
| 32 | Réglages | [PNG](exports/screens/Y76ntc.png) |
| 33 | Compte et sécurité | [PNG](exports/screens/PQ3io.png) |
| 34 | Lecture et données | [PNG](exports/screens/PrUKM.png) |
| 35 | Apparence et accessibilité | [PNG](exports/screens/C4DWaf.png) |
| 36 | Réglages des notifications | [PNG](exports/screens/UfKym.png) |
| 37 | Confidentialité | [PNG](exports/screens/YwUQh.png) |
| 38 | Aide et informations | [PNG](exports/screens/n9LRfH.png) |
| 39 | Studio créateur | [PNG](exports/screens/dPNBx.png) |
| 40 | Préparer un direct | [PNG](exports/screens/Qt0ZG.png) |
| 41 | Caméra et microphone | [PNG](exports/screens/ilvE1.png) |
| 42 | Aperçu avant diffusion | [PNG](exports/screens/Y5fpQg.png) |
| 43 | Diffusion en cours | [PNG](exports/screens/rQ4g6.png) |
| 44 | Modération en direct | [PNG](exports/screens/rCzIC.png) |
| 45 | Actions de modération | [PNG](exports/screens/SYFWc.png) |
| 46 | Fin de diffusion | [PNG](exports/screens/pRgHB.png) |
| 47 | Statistiques | [PNG](exports/screens/Y9TKEc.png) |
| 48 | Contenus du créateur | [PNG](exports/screens/PxNbK.png) |
| 49 | Publier un replay | [PNG](exports/screens/C4lHCm.png) |
| 50 | Revenus | [PNG](exports/screens/t0Mqm0.png) |
| 51 | Filtre de recherche | [PNG](exports/screens/N6ZcuF.png) |
| 52 | Options du lecteur | [PNG](exports/screens/yfMTq.png) |
| 53 | Signaler un contenu | [PNG](exports/screens/YSun1.png) |
| 54 | Signalement envoyé | [PNG](exports/screens/RDfEN.png) |
| 55 | Recherche sans résultat | [PNG](exports/screens/hwAlU.png) |
| 56 | Suivis vides | [PNG](exports/screens/IW249.png) |
| 57 | Connexion perdue | [PNG](exports/screens/a8C5Co.png) |
| 58 | Lecture indisponible | [PNG](exports/screens/k3MJDR.png) |
| 59 | Paiement refusé | [PNG](exports/screens/m0gyvi.png) |
| 60 | Permissions refusées | [PNG](exports/screens/lOWEC.png) |
| 61 | Chargement de l’accueil | [PNG](exports/screens/E9Xte.png) |
| 62 | Chat réservé aux abonnés | [PNG](exports/screens/N7iYWr.png) |
| 63 | Notifications vides | [PNG](exports/screens/u7lYI.png) |
| 64 | Session expirée | [PNG](exports/screens/CMmFi.png) |
| 65 | Lecteur plein écran paysage | [PNG](exports/screens/qt2iv.png) |
| 66 | Navigation avec mini-lecteur | [PNG](exports/screens/OnAcn.png) |
| 67 | Chat et clavier | [PNG](exports/screens/FnvdN.png) |
| 68 | Emotes et réactions | [PNG](exports/screens/rFNuS.png) |
| 69 | Messages privés | [PNG](exports/screens/SWNQL.png) |
| 70 | Conversation privée | [PNG](exports/screens/fNVDi.png) |
| 71 | Erreur de formulaire | [PNG](exports/screens/SpxAj.png) |
| 72 | Contraste renforcé | [PNG](exports/screens/gjSSV.png) |
| 73 | Double authentification | [PNG](exports/screens/o6vBQz.png) |
| 74 | Suppression du compte | [PNG](exports/screens/n1C6P9.png) |
| 75 | Clip publié | [PNG](exports/screens/unWGi.png) |
| 76 | Lecture audio seule | [PNG](exports/screens/SrmsM.png) |
