# Changelog de Terre Brûlée

Format inspiré de [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/), versionnage
[SemVer](https://semver.org/lang/fr/).

## [1.1.0] 2026-08-02

### Ajouté
- Lien « ℹ️ Comment ce jeu a été fait » (écran de menu) ouvrant une modale avec la stack,
  les graphismes, la musique, les interactions, l'architecture et les algorithmes notables
  (terrain en courbe de hauteurs, cratères circulaires, 15 armes, 4 factions). Étape 15 du
  chantier de retrofit décrit dans `todo.md` racine du monorepo.

### Vérifié
- Build propre, modale testée à l'ouverture/fermeture, aucune erreur console, aucun
  débordement horizontal en 390×844 (écran de menu et écran de jeu).

## [1.0.0] 2026-08-01

Première version intégrable à Hylst.Games, partie d'un export brut audité puis corrigé.

### Ajouté
- Bloc SEO complet dans `index.html` (description, keywords, og, twitter, robots,
  canonical) et `lang="fr"`
- `favicon.png` 32×32, `og-image.png` 1024×576 (capture réelle du jeu) et sa variante
  `og-image.webp`, `icon.webp` 128×128 pour la carte du menu
- `base: '/terrebrulee/'` dans `vite.config.ts`
- `getBaseMoveTime(faction)` dans `game.ts`, source unique de vérité pour le budget de
  déplacement par faction

### Modifié
- Renommé **Artillery Duel** en **Terre Brûlée** (titre générique anglais remplacé par un
  nom français original)
- `package.json` : `react-vite-tailwind` v0.0.0 devenu `terrebrulee` v0.0.0

### Corrigé
- **L'avantage de mobilité doublée de la faction Valkyrie n'avait jamais d'effet en
  partie réelle.** `completeTurn` réinitialisait le temps de déplacement à une constante
  fixe (2,0s) pour toutes les factions à chaque changement de tour, écrasant le bonus de
  Valkyrie (4,0s) dès son tout premier tour jouable. Corrigé avec `getBaseMoveTime`,
  utilisée de façon cohérente à la mise en place initiale et à chaque nouveau tour.
  Corrige aussi un débordement visuel de la barre de temps de déplacement pour cette même
  faction. Vérifié par mesure numérique directe (valeur relevée ≈ 3,98 au lieu de ≈ 1,98).
- Coquille « RÉSÉVOIR EXPLOSÉ ! » corrigée en « RÉSERVOIR EXPLOSÉ ! ».

### Vérifié
- QA Playwright : tir déclenché, destruction de terrain confirmée (47/500 colonnes
  échantillonnées modifiées après l'impact), cycle de tours complet joueur ↔ IA sans
  intervention manuelle, aucune erreur console, aucun débordement horizontal en 390×844.
