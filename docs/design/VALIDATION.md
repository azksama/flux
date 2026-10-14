# Validation du design FLUX

## Preuves statiques

- Document pen.dev : 77 frames racines, 76 écrans/variantes et 1 guide.
- Contrôle MCP après construction : `rootCount: 77`, `overlaps: []`, `problems: []`, `placeholders: []`.
- 3 composants réutilisables : navigation flottante, bouton principal, barre système.
- Photographies résolues, téléchargées dans assets et référencées localement.
- PDF de consultation : 77 pages, sans chiffrement, assemblées à partir des PNG pen.dev à échelle 2 pour préserver le flou du verre. L’export PDF vectoriel natif perdait le flou d’arrière-plan : il n’est donc pas le livrable de référence. Rendu Poppler vérifié.
- Inventaire des exports et planches contact dans exports/review. Relecture indépendante : voir exports/review/independent-review.md.

## Corrections visuelles

L’aperçu avant diffusion a reçu une protection sombre pour le retour et un fond opaque pour le texte de visibilité, avec une marge intérieure de 14 px.

Après retour utilisateur, 83 surfaces de verre ont été corrigées : transparence accrue, arrière-plan flouté à 18 px, contour lumineux en dégradé, ombre légère. Le menu d’accueil repose sur un contenu visible afin de rendre le verre perceptible. Les textes inactifs du menu sont blancs. Voir exports/review/glass-v2-review.md pour la relecture de cette version.

## Portée

Ces contrôles portent sur les maquettes et les exports. Ils ne prouvent ni navigation fonctionnelle, ni lecture vidéo, ni accessibilité runtime, ni paiement, ni fonctionnement Android. Aucun outil ARTEMIS utilisé.
