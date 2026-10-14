---
name: FLUX Mobile
description: Streaming mobile sombre, surfaces de verre et navigation flottante.
colors:
  mint: "#B2F5D4"
  on-mint: "#10291F"
  live: "#FF786F"
  live-badge: "#C34845"
  white: "#FFFFFF"
  ink: "#0A1014"
  surface: "#152129"
  text: "#F2F7F5"
  muted: "#A6B8BB"
  glass-fill-start: "#E4FFF238"
  glass-fill-middle: "#D4F5ED14"
  glass-fill-end: "#162C354D"
  glass-stroke-start: "#EEFFF5A6"
  glass-stroke-middle: "#E2FFF21A"
  glass-stroke-end: "#D5F7EA5C"
  glass-nav-base: "#132A3333"
  glass-camera-tint: "#07141BA6"
  glass-opaque: "#22343D"
  glass-shadow: "#00000040"
typography:
  size-13:
    fontFamily: "Inter"
    fontSize: "13px"
  size-14:
    fontFamily: "Inter"
    fontSize: "14px"
  size-16:
    fontFamily: "Inter"
    fontSize: "16px"
  size-18:
    fontFamily: "Inter"
    fontSize: "18px"
  size-21:
    fontFamily: "Inter"
    fontSize: "21px"
  size-23:
    fontFamily: "Inter"
    fontSize: "23px"
  size-26:
    fontFamily: "Inter"
    fontSize: "26px"
  size-30:
    fontFamily: "Inter"
    fontSize: "30px"
  size-32:
    fontFamily: "Inter"
    fontSize: "32px"
rounded:
  primary-button: "26px"
  floating-nav: "38px"
components:
  button-primary:
    backgroundColor: "{colors.mint}"
    textColor: "{colors.on-mint}"
    rounded: "{rounded.primary-button}"
    width: "350px"
    height: "52px"
  floating-nav:
    backgroundColor: "{colors.glass-nav-base}"
    textColor: "{colors.text}"
    rounded: "{rounded.floating-nav}"
    width: "350px"
    height: "76px"
  live-badge:
    backgroundColor: "{colors.live-badge}"
    textColor: "{colors.white}"
---

# Design System: FLUX Mobile

## Overview

**Creative North Star: "Le direct derrière le verre"**

Ce nom décrit la direction réalisée ; il ne constitue pas une préférence supplémentaire attribuée à l’utilisateur. Les demandes confirmées sont une application mobile, un design moderne, du glassmorphisme et un menu flottant. Le nom FLUX, la langue française et la palette sont les choix de conception de cette livraison.

Le système place les images de diffusion sur un fond sombre, avec des commandes arrondies et une navigation de verre. L’accent menthe identifie les actions principales et la destination sélectionnée. Les informations de direct utilisent un accent distinct pour conserver une hiérarchie lisible. La révision V2 répond à la correction de l’utilisateur sur l’opacité excessive des panneaux : 83 surfaces de verre ont été rendues plus transparentes, avec des reflets en dégradé et une ombre douce.

**Key Characteristics:**

- Fond sombre et contenu vidéo au premier plan.
- Navigation flottante à quatre destinations.
- Verre transparent en dégradé, reflets fins et ombre douce.
- Accent menthe pour les actions principales.

Ce document capture le design statique éditable de `Flux-Mobile.pen`, à partir des valeurs observées pendant sa création et de `exports/inventory.json`. Il ne décrit pas une application développée. Les noms descriptifs des tokens sont documentaires ; leurs valeurs font référence. Android reste une hypothèse de gabarit selon `PRODUCT.md`.

## Colors

La palette associe des neutres sombres légèrement bleutés à une menthe lumineuse et à un accent chaud pour le direct. Les valeurs exactes figurent dans le frontmatter.

### Primary

- **Menthe lumineuse** (`mint`) : fond du bouton principal et capsule de destination active.
- **Encre sur menthe** (`on-mint`) : texte des actions sur fond menthe.

### Secondary

- **Corail de direct** (`live`) : accent signalant le direct.
- **Rouge de badge** (`live-badge`) : fond du badge avec texte blanc. Cette nuance diffère volontairement du corail de la palette.

### Neutral

- **Encre nocturne** (`ink`) : arrière-plan principal.
- **Ardoise de surface** (`surface`) : séparation tonale des contenus.
- **Blanc doux** (`text`) : texte principal.
- **Gris de lecture** (`muted`) : informations secondaires.
- **Blanc** (`white`) : texte du badge de direct.
- **Verre en dégradé** (`glass-fill-start`, `glass-fill-middle`, `glass-fill-end`) : trois étapes du fond transparent.
- **Reflets de verre** (`glass-stroke-start`, `glass-stroke-middle`, `glass-stroke-end`) : trois étapes du contour lumineux.
- **Base de navigation** (`glass-nav-base`) : teinte sous le dégradé de la barre flottante.
- **Teinte caméra** (`glass-camera-tint`) : protection sous le verre des écrans 42 et 43.
- **Surface opaque** (`glass-opaque`) : notice de l’aperçu avant diffusion.
- **Ombre du verre** (`glass-shadow`) : détachement doux des surfaces flottantes.

**The Badge Contrast Rule.** Conserver le rouge de badge sous le texte blanc du direct ; ne pas le remplacer automatiquement par le corail de la palette.

Les rampes du sidecar sont des aperçus OKLCH synthétiques pour le panneau documentaire. Elles ne constituent pas des couleurs supplémentaires approuvées ou utilisées dans les écrans.

## Typography

**Display Font:** Inter.  
**Body Font:** Inter.

La maquette emploie une seule famille sans sérif et les graisses 400, 500, 600 et 700. Le frontmatter conserve les neuf tailles observées sans imposer une correspondance universelle entre taille et rôle. Les valeurs de hauteur de ligne et d’approche ne sont pas normalisées ici, faute de token commun établi.

**Conseil d’implémentation :** utiliser les petites tailles pour les métadonnées et libellés, les tailles intermédiaires pour le contenu et les titres de section, puis les grandes pour les titres de page. Vérifier les textes agrandis et les traductions avant d’en faire un contrat typographique responsive. Le repli `sans-serif` des aperçus HTML est une commodité de rendu, pas une seconde police du design.

## Layout

L’inventaire contient 76 écrans ou états : 75 portraits de 390 × 844 et un lecteur paysage de 844 × 390. Une planche séparée de 1820 × 900 expose le guide et les composants. Les positions sur le grand canevas servent à organiser la livraison.

Les écrans utilisent des positions explicites. Le bouton principal et la navigation ont une largeur de 350 dans le gabarit portrait ; les dimensions exactes sont définies dans leurs tokens. Aucune grille responsive, aucun breakpoint et aucune règle automatique de redistribution n’ont été validés.

**Conseils d’implémentation :** traduire ces positions en contraintes de mise en page, prendre en compte les zones système et le clavier, maintenir l’accès au contenu sous la navigation et vérifier les orientations. Les écrans 65, 66 et 67 documentent respectivement le lecteur paysage, le mini-lecteur et le chat avec clavier ; ils restent des états dessinés.

## Elevation & Depth

La V2 applique un fond linéaire à rotation native 145°, avec les trois couleurs `glass-fill-*` aux positions 0, 0,45 et 1. Le contour de 1 px suit la même rotation et les mêmes positions avec `glass-stroke-*`. L’effet `background_blur` vaut 18. Une ombre extérieure détache les panneaux : décalage horizontal 0, vertical 8, flou 24, couleur `glass-shadow`. Le sidecar conserve ces propriétés hors du schéma de tokens principal ; le fond du composant dans le frontmatter ne représente que sa couche de base.

L’accueil et le direct avec chat possèdent seuls une photographie IRL d’ambiance, avec une opacité de 0,24 et un flou de 64. L’accueil laisse également du contenu média visible derrière la navigation. Ce traitement d’ambiance ne s’étend pas automatiquement à tous les écrans.

Les surfaces de verre de l’aperçu avant diffusion (42) et de la diffusion en cours (43) ajoutent la teinte caméra sous le dégradé pour protéger la lecture. La notice `rrFbx` de l’écran 42 reste opaque, avec une marge intérieure de texte de 14. La navigation de l’écran 72 conserve également son traitement opaque de contraste renforcé. Ces corrections visuelles ne constituent pas une validation exhaustive de contraste sur toutes les vidéos possibles.

**Provenance V1, non normative :** la première version utilisait le fond `#22343DCC`, un contour `#D6FFF324`, un flou de 24 et aucune ombre d’interface. Ces valeurs sont remplacées pour le verre courant par les tokens et effets V2 ci-dessus.

**The Glass Readability Rule.** Maintenir une surface protectrice derrière les commandes qui chevauchent une image de diffusion.

**Conseil d’implémentation :** prévoir un fond opaque de repli lorsque le flou est indisponible ou lorsque le contraste renforcé est demandé. Mesurer la lisibilité sur des contenus réels clairs, sombres et très contrastés.

## Shapes

Les éléments principaux utilisent une silhouette de capsule : bouton principal et navigation flottante. Leurs rayons sont normatifs dans le frontmatter. La destination active apparaît dans une capsule menthe à l’intérieur de la barre de verre.

Les formes locales des cartes, champs et panneaux restent définies par leur écran. Aucun rayon global unique n’est déduit de ces composants non normalisés.

## Components

Trois composants sont réellement réutilisables dans le fichier natif. Les autres motifs visuels sont présents dans des compositions statiques et ne doivent pas être présentés comme une bibliothèque de composants codée.

| Composant natif | Identifiant | Rôle |
| --- | --- | --- |
| Navigation flottante | `eKp2A` | Accueil, Explorer, Suivis, Profil |
| Bouton principal | `wYjTN` | Action dominante en menthe |
| Barre de statut | `heqCu` | Habillage supérieur du gabarit mobile |

### Buttons

Le bouton principal est une capsule menthe avec texte encre. Ses dimensions et son rayon sont définis dans le frontmatter. Aucun comportement de pression, focus ou chargement n’est exécuté par le fichier statique.

### Navigation

La barre de verre contient quatre destinations et une sélection menthe. Sa base transparente reçoit le dégradé de verre, son contour lumineux, le flou et l’ombre V2. Les libellés et icônes inactifs des instances utilisent désormais le blanc doux `text` ; la sélection menthe reste inchangée. L’écran 72 conserve une navigation opaque. L’écran 66 montre la coexistence avec un mini-lecteur. La position et la sélection illustrées ne fournissent pas de navigation interactive.

### Status and live badge

La barre de statut réutilisable fait partie du gabarit. Le badge de direct est un motif visuel distinct, avec un fond rouge adapté au texte blanc ; ce n’est pas un quatrième composant natif réutilisable déclaré.

### States and implementation guidance

La livraison couvre notamment chargement, absence de résultats, liste vide, connexion perdue, lecture indisponible, paiement refusé, permissions refusées, session expirée, erreur de formulaire et contraste renforcé. Ces écrans décrivent des présentations possibles ; aucun réseau, paiement, capteur ou compte réel n’est connecté.

Le sidecar propose trois aperçus HTML autonomes : bouton, navigation et badge. Leur structure HTML, les dimensions internes non documentées et les styles de survol/focus/pression sont des adaptations documentaires et des conseils d’implémentation, pas des comportements extraits d’une application. Inter doit être disponible sur l’hôte pour un rendu typographique fidèle. Aucun déplacement animé n’est spécifié.

## Do's and Don'ts

### Do:

- **Do** conserver la hiérarchie fond sombre, contenu vidéo, commandes de verre et accent menthe.
- **Do** réutiliser les trois composants natifs pour les nouvelles compositions compatibles.
- **Do** protéger les commandes superposées aux images avec un fond lisible.
- **Do** distinguer les tokens observés des conseils d’implémentation.

### Don't:

- **Don't** présenter les cadres statiques comme un prototype fonctionnel ou une application testée.
- **Don't** convertir les dimensions de canevas en promesse de comportement responsive.
- **Don't** confondre le corail de palette avec le rouge du badge de direct.
- **Don't** présenter les aperçus HTML ou les rampes synthétiques comme des composants natifs supplémentaires.

