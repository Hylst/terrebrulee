# Terre Brûlée

**Diplomatie à coups de canon. Deux chars, un terrain qui s'effondre.**

Joue ici : [games.hylst.fr/terrebrulee/](https://games.hylst.fr/terrebrulee/)

![Terre Brûlée](og-image.png)

## Comment on joue

Réglez l'angle (W/S) et la puissance (Q/E) de votre tir, ou cliquez-glissez directement
depuis votre char pour viser à la souris/au tactile. Chaque tir laisse un cratère : le
terrain se déforme en permanence au fil de la partie. Ramassez des caisses de
ravitaillement, évitez les mines, et faites exploser les barils pour des dégâts en zone.

## Contrôles

| Action | Effet |
|--------|-------|
| Clic gauche sur le char + glisser | Viser et régler la puissance |
| Clic droit / molette | Panoramique / zoom |
| W/S | Angle • Q/E | Puissance |
| A/D | Déplacer le char |
| Espace / Entrée | Feu |
| 1-9, Z/X/C/V, Tab | Sélection d'arme |

## Ce qu'il y a dedans

- 15 armes (standard, fragmentation, nucléaire, rebond, foreuse, sniper, salve triple,
  frappe aérienne, téléporteur, mine, napalm, railgun, missile guidé, onde sismique...)
- 4 factions aux bonus distincts : Titan (PV élevés), Valkyrie (mobilité doublée), Aegis
  (bouclier régénérant), Inferno (arsenal incendiaire)
- Terrain entièrement destructible, vent variable, 6 thèmes de ciel
- Mode 1v1 local ou contre une IA à 3 niveaux de difficulté
- Caméra libre (panoramique clavier/souris/tactile, zoom, suivi automatique)

## L'arborescence

```
terre-brulee-game-development/
├── index.html          # template + bloc SEO
├── vite.config.ts      # base '/terrebrulee/' + singlefile
├── public/
│   ├── favicon.png
│   ├── og-image.png / og-image.webp
│   └── icon.webp        # carte du menu, 128x128
└── src/
    ├── main.tsx
    ├── game.ts           # état, physique, IA, generation de terrain
    ├── renderer.ts        # rendu Canvas
    ├── audio.ts           # sons synthétisés
    ├── App.tsx            # boucle React, entrées, HUD
    └── utils/cn.ts
```

## Dev

```bash
npm install
npm run dev       # http://localhost:5173/
npm run build     # dist/index.html, un seul fichier
npm run preview
```

## Stack

React 19, TypeScript 5.9 (strict), Tailwind CSS 4, Vite 7, vite-plugin-singlefile.

Zéro sprite : tout est dessiné en Canvas 2D, les sons sont synthétisés au vol.

## Licence

AGPL-3.0-or-later, Geoffroy Streit (Hylst). Voir `LICENSE`.
