# Fonctionnalités de Terre Brûlée

## Gameplay

- ✅ Duel de chars au tour par tour, terrain entièrement destructible
- ✅ 15 armes aux effets distincts (zone, rebonds, forage souterrain, guidage, tir en
  éventail, frappe aérienne, téléportation, mines, incendie étendu, faille sismique...)
- ✅ 2 factions jouables aux bonus propres : Titan (130 PV), Valkyrie (mobilité doublée,
  **désormais réellement doublée à chaque tour, bug corrigé — voir todo.md**), Aegis
  (bouclier initial + régénération passive), Inferno (arsenal incendiaire renforcé)
- ✅ Vent variable affectant la trajectoire, caméra avec suivi automatique du projectile
- ✅ Caisses de ravitaillement (vie, bouclier, armes), barils explosifs, mines
- ✅ Mode 1v1 local ou vs IA (Facile / Moyen / Difficile), IA qui simule ses tirs avant de
  jouer
- ✅ 6 thèmes de ciel (jour, crépuscule, nuit, émeraude, pluie, neige)

## Interface

- ✅ Barres de vie et de bouclier par joueur, indicateur de tour actif
- ✅ Panneau d'arsenal avec quantités par arme, curseurs angle/puissance
- ✅ Caméra libre : panoramique clavier/souris/tactile, molette/pincement pour zoomer,
  recentrage rapide
- ✅ Overlay de victoire avec vainqueur annoncé
- ✅ Jouable au clavier, à la souris ou au tactile (visée + panoramique + pincement)
- ✅ Aucun débordement horizontal en 390×844

## Audio

- ✅ Effets sonores (tir, explosion, déplacement, victoire) synthétisés en Web Audio
- ✅ Musique de fond optionnelle, désactivée par défaut

## Technique

- ✅ Build en un seul fichier (~311 Ko), fonctionne hors ligne
- ✅ Logique de jeu (`game.ts`) et rendu (`renderer.ts`) séparés du composant React
- ✅ Bloc SEO complet, favicon, og-image (capture réelle du jeu)
- ⬜ Pas de tests automatisés embarqués
- ⬜ `tsc --noEmit` remonte 4 avertissements préexistants (setters d'état jamais appelés,
  voir todo.md) — n'affecte pas `npm run build` (esbuild, pas de vérification de types)
