# Structure de Terre Brûlée

## Arborescence

```
terre-brulee-game-development/
├── index.html              # template Vite + bloc SEO (lang=fr)
├── package.json            # terrebrulee v0.0.0
├── vite.config.ts          # base '/terrebrulee/', react + tailwind + singlefile
├── tsconfig.json
├── .gitignore                 # deps, secrets, fichiers d'agents IA
├── about.md / README.md / structure.md / features.md / todo.md / changelog.md
├── public/
│   ├── favicon.png
│   ├── og-image.png / og-image.webp
│   └── icon.webp             # carte du menu, 128x128
└── src/
    ├── main.tsx
    ├── index.css
    ├── game.ts                # types, constantes, generation, physique, IA (pur, sans DOM)
    ├── renderer.ts             # tout le dessin Canvas 2D, lit le GameState sans le muter
    ├── audio.ts                # SoundController, effets synthétisés Web Audio
    ├── App.tsx                 # composant React : boucle rAF, entrées clavier/souris/tactile, HUD
    └── utils/cn.ts
```

## Séparation logique / rendu

Contrairement à Sans Escale (tout dans un seul `App.tsx`), ce jeu sépare proprement :
`game.ts` (état + règles, aucune dépendance Canvas), `renderer.ts` (dessin pur, ne modifie
jamais l'état), `App.tsx` (React, `stateRef`/`cameraRef` en `useRef` pour la boucle chaude
à 60 FPS sans re-render, quelques `useState` synchronisés à intervalle pour le HUD).

## Factions

Chaque faction modifie les stats de départ (`placeTanks` dans `game.ts`) : PV, bouclier
initial, inventaire d'armes bonus, et **temps de déplacement par tour**
(`getBaseMoveTime`). Valkyrie double ce dernier (4s au lieu de 2s) — cette valeur doit être
relue à chaque début de tour (`completeTurn` dans `App.tsx`) et pas seulement à la mise en
place initiale, sans quoi l'avantage de faction disparaît dès le premier tour joué (bug
corrigé, voir `todo.md`).

## Terrain et destruction

`terrain: number[]` est un tableau de hauteurs (une colonne tous les `TERRAIN_RESOLUTION`
= 2px). `destroyTerrain` abaisse les colonnes dans le rayon d'une explosion (fonction de
cercle : `bottom = cy + sqrt(r² - dx²)`). Le rendu (`drawTerrain`) retrace ce même tableau
en polygone à chaque frame — aucune texture, aucun masque, juste des hauteurs.

## IA

`aiCalculateDecision` simule des tirs (`simulateShot`, physique identique à
`updateProjectiles` mais sans effets de bord) sur une grille d'angles/puissances, garde le
meilleur score (distance à la cible), puis ajoute du bruit selon la difficulté. Le choix
d'arme est une cascade de probabilités par difficulté, pas un vrai calcul d'utilité.

## Build

`vite-plugin-singlefile` inline le JS et le CSS dans `index.html` (~311 Ko). Le `dist/`
contient en plus `favicon.png`, `og-image.png/webp` et `icon.webp` copiés depuis `public/`.
`base: '/terrebrulee/'` fait résoudre ces assets sous `https://games.hylst.fr/terrebrulee/`.
