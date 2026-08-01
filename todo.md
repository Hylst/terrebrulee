# TODO de Terre Brûlée

Audit fait le 2026-08-01 sur l'export brut (`artillery-game-with-terrain-destruction (3)`),
suivi d'une passe QA navigateur (Playwright + Chromium) avec vérification réelle du
correctif principal et de la mécanique centrale (tir, destruction de terrain, tour par
tour).

---

## ✅ Corrigé — l'avantage de mobilité de la faction Valkyrie ne s'appliquait jamais

- [x] **Valkyrie est censée avoir « une vitesse et une mobilité doublées » (commentaire du
  code d'origine, `moveT = 4.0` au lieu des 2.0 par défaut), mais cet avantage n'avait
  strictement aucun effet en partie réelle.** `placeTanks` calcule bien `moveTimeLeft = 4.0`
  à la mise en place initiale, mais ce char ne joue jamais son tour pendant cette fenêtre
  (le joueur 1/Titan commence toujours). Dès que le premier tour se termine,
  `completeTurn` (dans `App.tsx`) écrase `moveTimeLeft` avec une constante codée en dur
  à `2.0`, quelle que soit la faction — donc la toute première fois où Valkyrie peut
  effectivement bouger, son budget de déplacement a déjà été ramené au même niveau que
  n'importe quelle autre faction. Corrigé en extrayant `getBaseMoveTime(faction)` dans
  `game.ts` (utilisée à la fois par `placeTanks` et par `completeTurn`), pour que la
  remise à zéro en début de tour respecte la faction au lieu d'une constante universelle.
  **Effet secondaire du même bug** : la barre de temps de déplacement à l'écran
  (`drawMoveTimer` dans `renderer.ts`) divisait aussi par la constante `MOVE_TIME` fixe
  plutôt que par le budget réel de la faction — pour Valkyrie avec son vrai 4.0 (avant que
  `completeTurn` ne l'écrase), le ratio dépassait 100% et la barre de progression aurait
  débordé visuellement de son cadre. Même correctif (`getBaseMoveTime`) résout aussi ce
  second symptôme. **Vérifié par mesure directe** : partie IA lancée (Titan vs Valkyrie),
  tir du joueur 1, tour transmis au joueur 2 (Valkyrie/IA) — `moveTimeLeft` relevé à
  3,983 (soit 4,0 moins un pas de déplacement déjà consommé par l'IA au moment de la
  lecture, cohérent avec un budget réel de 4,0 et non 2,0). Tour suivant revenu au joueur 1
  (Titan) : `moveTimeLeft` = 2,0 exactement, confirmant l'absence de régression pour les
  factions non concernées.

## ✅ Corrigé — coquille dans le texte de destruction des barils

- [x] `detonateBarrel` affichait « RÉSÉVOIR EXPLOSÉ ! » (lettre manquante) au lieu de
  « RÉSERVOIR EXPLOSÉ ! ». Corrigé.

## ✅ La passe QA navigateur

- [x] 0 erreur console, 0 exception non gérée
- [x] **Mécanique centrale observée réellement** : tir déclenché en partie IA, 47 des 500
  premières colonnes de terrain échantillonnées ont changé de hauteur après l'impact
  (cratère réel, pas juste un effet visuel de particules)
- [x] **Correctif Valkyrie vérifié par mesure numérique** (voir ci-dessus), pas seulement
  par lecture de code
- [x] Cycle de tours complet vérifié : joueur 1 → IA (joueur 2) → joueur 1, avec l'IA qui
  se déplace et tire automatiquement sans intervention
- [x] Aucun débordement horizontal en 390×844, en menu comme en jeu (testé en PvP et PvE)

### Méthode de vérification

Instrumentation temporaire `window.__qa` placée en tête de la boucle de jeu dans
`App.tsx`, mise à jour à chaque frame quel que soit l'état (menu ou partie en cours) —
contrairement à Sans Escale, ce jeu garde son état de simulation dans un `useRef`
(`stateRef`) plutôt que dans du state React, donc pas de risque de closure figée ici : la
sonde lit toujours l'état courant. Retirée avant le build final (hash de bundle identique
avant/après son ajout puis son retrait). Un script Playwright pilote un vrai clic sur
« IA Facile », déclenche un tir au clavier (Espace), et échantillonne `window.__qa` toutes
les 150ms jusqu'à détecter le changement de joueur actif.

---

## ⬜ Idées d'amélioration (non corrigées, notes d'audit)

- [ ] **Écran de configuration incomplet.** `App.tsx` déclare `setSetupP1Fac`,
  `setSetupP2Fac`, `setSetupSky` et `setAimMode`, mais aucun bouton du menu ne les appelle
  jamais (confirmé par `tsc --noEmit`, 4 avertissements de variables inutilisées). Les
  factions de départ (Titan vs Valkyrie) et le ciel de départ (Crépuscule) sont donc
  **toujours** les mêmes quel que soit le mode choisi, et le mode de visée « Slingshot »
  (glisser depuis le char façon Angry Birds, entièrement implémenté dans les gestionnaires
  souris/tactile) n'est **jamais accessible** — le jeu reste bloqué sur le mode « Réticule
  Curseur ». Pas un bug de logique (rien n'est cassé), mais un écran de sélection
  visiblement prévu puis jamais branché. Pas corrigé : compléter cet écran serait ajouter
  une fonctionnalité, pas réparer un défaut existant.
- [ ] `updateTrees` (dans `game.ts`) teste si un arbre doit trembler/brûler près d'une
  explosion avec `Math.abs(tree.height - CANVAS_HEIGHT + getTerrainHeight(...)) < e.maxRadius`,
  une formule qui ne fait intervenir nulle part la position Y réelle de l'explosion
  (`e.y`). En pratique, les arbres situés bas dans le décor réagissent à presque toute
  explosion proche en X, ceux situés en hauteur (sommets, plateaux) ne réagissent
  quasiment jamais, indépendamment de la distance verticale réelle à l'impact. Effet
  purement cosmétique (les arbres sont un obstacle décoratif, pas un enjeu de score) : pas
  corrigé.
