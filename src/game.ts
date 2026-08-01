export const CANVAS_WIDTH = 1000;
export const CANVAS_HEIGHT = 550;
export const GRAVITY = 0.25;
export const TERRAIN_RESOLUTION = 2;
export const TANK_WIDTH = 36;
export const TANK_HEIGHT = 18;
export const BARREL_LENGTH = 28;
export const MOVE_SPEED = 1.4;
export const MOVE_TIME = 2.0;

export type GameMode = 'menu' | 'pvp' | 'pve';
export type AiDifficulty = 'easy' | 'medium' | 'hard';
export type SkyTheme = 'day' | 'sunset' | 'night' | 'emerald' | 'rain' | 'snow';
export type TankFaction = 'titan' | 'valkyrie' | 'aegis' | 'inferno';

export type WeaponType =
  | 'standard' | 'bertha' | 'cluster' | 'nuke'
  | 'bouncing' | 'drill' | 'sniper' | 'triple'
  | 'airstrike' | 'teleport' | 'mine'
  | 'napalm' | 'railgun' | 'seeker' | 'quake';

export interface WeaponInfo {
  name: string; description: string;
  explosionRadius: number; maxDamage: number;
  color: string; speedMultiplier: number; isSpecial: boolean;
}

export const WEAPONS: Record<WeaponType, WeaponInfo> = {
  standard: { name: 'Obus Standard', description: 'Explosif classique.', explosionRadius: 50, maxDamage: 45, color: '#fbbf24', speedMultiplier: 1.0, isSpecial: false },
  bertha: { name: 'Grosse Bertha', description: 'Perce profond.', explosionRadius: 65, maxDamage: 70, color: '#f97316', speedMultiplier: 0.9, isSpecial: false },
  cluster: { name: 'Fragmentation', description: '5 sous-munitions.', explosionRadius: 35, maxDamage: 30, color: '#38bdf8', speedMultiplier: 1.1, isSpecial: false },
  nuke: { name: 'Frappe Nucléaire', description: 'Dévastation totale.', explosionRadius: 110, maxDamage: 95, color: '#22c55e', speedMultiplier: 0.85, isSpecial: false },
  bouncing: { name: 'Obus Rebond', description: 'Rebondit 3 fois.', explosionRadius: 45, maxDamage: 40, color: '#a855f7', speedMultiplier: 1.05, isSpecial: false },
  drill: { name: 'Foreuse', description: 'Perce 120m de terrain.', explosionRadius: 55, maxDamage: 60, color: '#06b6d4', speedMultiplier: 1.3, isSpecial: false },
  sniper: { name: 'Tir de Sniper', description: 'Vitesse extrême.', explosionRadius: 25, maxDamage: 55, color: '#ec4899', speedMultiplier: 2.8, isSpecial: false },
  triple: { name: 'Salve Triple', description: '3 obus en éventail.', explosionRadius: 40, maxDamage: 35, color: '#eab308', speedMultiplier: 0.95, isSpecial: false },
  airstrike: { name: 'Frappe Aérienne', description: '3 bombes du ciel.', explosionRadius: 40, maxDamage: 35, color: '#6366f1', speedMultiplier: 1.0, isSpecial: true },
  teleport: { name: 'Téléporteur', description: 'Téléporte votre char.', explosionRadius: 20, maxDamage: 0, color: '#14b8a6', speedMultiplier: 3.0, isSpecial: false },
  mine: { name: 'Mine Anti-Char', description: 'Piège au sol.', explosionRadius: 45, maxDamage: 50, color: '#ef4444', speedMultiplier: 1.0, isSpecial: true },
  napalm: { name: 'Napalm', description: 'Brasier étendu en plusieurs impacts.', explosionRadius: 42, maxDamage: 28, color: '#fb7185', speedMultiplier: 0.9, isSpecial: false },
  railgun: { name: 'Canon Railgun', description: 'Obus hypersonique très précis.', explosionRadius: 24, maxDamage: 75, color: '#67e8f9', speedMultiplier: 4.0, isSpecial: false },
  seeker: { name: 'Missile Guidé', description: 'Corrige sa trajectoire vers la cible.', explosionRadius: 48, maxDamage: 48, color: '#facc15', speedMultiplier: 0.95, isSpecial: false },
  quake: { name: 'Onde Sismique', description: 'Creuse une faille large au sol.', explosionRadius: 78, maxDamage: 44, color: '#c084fc', speedMultiplier: 0.75, isSpecial: false },
};

export interface Tank {
  x: number; y: number; vx: number; vy: number;
  health: number; maxHealth: number; shield: number;
  color: string; accent: string; name: string;
  faction: TankFaction;
  inventory: Record<WeaponType, number>;
  currentWeapon: WeaponType;
  recoil: number; recoilAngle: number;
  facing: 1 | -1;
  moveTimeLeft: number; isMoving: boolean;
  muzzleFlash: number; // frames remaining
  treadOffset: number; // for animated tracks
}

export interface Projectile {
  x: number; y: number; vx: number; vy: number;
  type: WeaponType;
  trail: { x: number; y: number; size: number; alpha: number }[];
  isSubmunition?: boolean;
  alive: boolean;
  color: string;
  radius: number;
  senderIndex: 0 | 1;
  bouncesLeft?: number;
  drillDepth?: number;
  underground?: boolean;
  spin: number;
  shellCasing?: { x: number; y: number; vx: number; vy: number; life: number; spin: number; rot: number };
}

export interface Mine {
  x: number; y: number; owner: 0 | 1;
  active: boolean; timer: number; blinkPhase: number;
  armed: boolean;
}

export interface Tree {
  x: number; height: number; alive: boolean;
  shake: number;
}

export interface Particle {
  x: number; y: number; vx: number; vy: number;
  life: number; maxLife: number;
  color: string; size: number; alpha: number;
  rotation?: number; vRot?: number;
  gravity?: number;
}

export interface Explosion {
  x: number; y: number; radius: number; maxRadius: number;
  age: number; maxAge: number;
  particles: Particle[];
  shockwave: number; innerShock: number;
  color: string; isNuke: boolean;
  fireballPulse: number;
}

export interface FloatingText {
  id: string; text: string;
  x: number; y: number; vy: number;
  color: string; life: number; maxLife: number; size: number;
  bold?: boolean;
}

export interface Crate {
  id: string; x: number; y: number; vy: number;
  type: 'health' | 'nuke' | 'cluster' | 'shield' | 'bertha' | 'bouncing' | 'drill' | 'sniper' | 'napalm' | 'railgun' | 'seeker' | 'quake';
  color: string; label: string;
  landed: boolean; active: boolean;
  rot: number; vRot: number;
}

export interface Cloud {
  x: number; y: number; scale: number; opacity: number; speed: number;
}

export interface WaterPuddle {
  x: number; y: number; width: number;
}

export interface ExplosiveBarrel {
  id: string; x: number; y: number; active: boolean;
}

export interface GameState {
  terrain: number[];
  waterTable: number[]; // per-column water level
  players: [Tank, Tank];
  currentPlayer: 0 | 1;
  projectiles: Projectile[];
  explosions: Explosion[];
  particles: Particle[];
  floatingTexts: FloatingText[];
  crates: Crate[];
  mines: Mine[];
  explosiveBarrels: ExplosiveBarrel[];
  trees: Tree[];
  clouds: Cloud[];
  waterPuddles: WaterPuddle[];
  wind: number; targetWind: number;
  angle: number; power: number;
  gameOver: boolean; winner: string | null;
  firing: boolean;
  screenShake: number; shakeX: number; shakeY: number;
  message: string; turnCount: number;
  skyTheme: SkyTheme;
  gameMode: GameMode; aiDifficulty: AiDifficulty;
  cameraOffset: { x: number; y: number }; zoom: number;
  aimTargetX: number;
  p1Faction: TankFaction; p2Faction: TankFaction;
  aiThinking: boolean; aiActionTimer: number;
  heatHaze: number;
  weatherParticles: Particle[];
}

// ─── Terrain & Biomes Diversifiés ───
export function generateTerrain(theme: SkyTheme = 'sunset'): number[] {
  const cols = Math.ceil(CANVAS_WIDTH / TERRAIN_RESOLUTION);
  const h: number[] = new Array(cols);
  const p1 = Math.random() * Math.PI * 2;
  const p2 = Math.random() * Math.PI * 2;
  const p3 = Math.random() * Math.PI * 2;

  if (theme === 'sunset') {
    // Biome : Dunes de Sang (Désert) - Imposantes dunes douces
    for (let i = 0; i < cols; i++) {
      const x = i * TERRAIN_RESOLUTION;
      let v = CANVAS_HEIGHT * 0.72 + Math.sin(x * 0.005 + p1) * 110 + Math.sin(x * 0.012 + p2) * 20;
      h[i] = Math.max(150, Math.min(CANVAS_HEIGHT - 25, v));
    }
  } else if (theme === 'snow') {
    // Biome : Pics Brisés (Alpin) - Montagnes acérées abruptes et gorge centrale
    for (let i = 0; i < cols; i++) {
      const x = i * TERRAIN_RESOLUTION;
      let v = CANVAS_HEIGHT * 0.6 + Math.sin(x * 0.008 + p1) * 90 + Math.sin(x * 0.025 + p2) * 45;
      if (x > 380 && x < 620) {
        v += Math.sin(((x - 380) / 240) * Math.PI) * 75; // Gorge tactique profonde au centre
      }
      h[i] = Math.max(120, Math.min(CANVAS_HEIGHT - 25, v));
    }
  } else if (theme === 'emerald') {
    // Biome : Cavernes de Cristal - Plateaux géométriques en escaliers
    for (let i = 0; i < cols; i++) {
      const x = i * TERRAIN_RESOLUTION;
      let raw = Math.sin(x * 0.006 + p1) * 80 + Math.sin(x * 0.02 + p2) * 30;
      let v = CANVAS_HEIGHT * 0.65 + Math.round(raw / 25) * 25; // Effet terrasses de cristaux
      h[i] = Math.max(140, Math.min(CANVAS_HEIGHT - 30, v));
    }
  } else if (theme === 'night') {
    // Biome : Archipel Flottant - Plateformes surélevées séparées par des abîmes tactiques
    for (let i = 0; i < cols; i++) {
      const x = i * TERRAIN_RESOLUTION;
      let v = CANVAS_HEIGHT * 0.55 + Math.sin(x * 0.01 + p1) * 50;
      // Abîmes (crevasses) entre les îles
      if ((x > 260 && x < 340) || (x > 660 && x < 740)) {
        v = CANVAS_HEIGHT - 5;
      }
      h[i] = Math.max(130, Math.min(CANVAS_HEIGHT - 5, v));
    }
  } else {
    // Biome : Collines Classiques
    for (let i = 0; i < cols; i++) {
      const x = i * TERRAIN_RESOLUTION;
      let v = CANVAS_HEIGHT * 0.65
        + Math.sin(x * 0.006 + p1) * 85
        + Math.sin(x * 0.018 + p2) * 35
        + Math.sin(x * 0.05 + p3) * 15;
      if (x > 350 && x < 650) v += Math.sin(((x - 350) / 300) * Math.PI) * (Math.random() > 0.5 ? 35 : -35);
      h[i] = Math.max(140, Math.min(CANVAS_HEIGHT - 30, v));
    }
  }

  return h;
}

export function generateWaterTable(): number[] {
  const cols = Math.ceil(CANVAS_WIDTH / TERRAIN_RESOLUTION);
  const w: number[] = new Array(cols);
  let val = CANVAS_HEIGHT * 0.85;
  for (let i = 0; i < cols; i++) {
    val += (Math.random() - 0.5) * 0.5;
    val = Math.max(CANVAS_HEIGHT * 0.7, Math.min(CANVAS_HEIGHT * 0.9, val));
    w[i] = val;
  }
  return w;
}

export function getTerrainHeight(terrain: number[], x: number): number {
  const col = Math.floor(x / TERRAIN_RESOLUTION);
  if (col < 0) return terrain[0];
  if (col >= terrain.length) return terrain[terrain.length - 1];
  return terrain[col];
}

function smoothAround(terrain: number[], cx: number, w: number) {
  const cols = terrain.length;
  const sc = Math.max(0, Math.floor((cx - w) / TERRAIN_RESOLUTION));
  const ec = Math.min(cols - 1, Math.floor((cx + w) / TERRAIN_RESOLUTION));
  const base = terrain[Math.floor(cx / TERRAIN_RESOLUTION)];
  for (let i = sc; i <= ec; i++) {
    const d = Math.abs(i * TERRAIN_RESOLUTION - cx) / w;
    const t = Math.max(0, 1 - d * d);
    terrain[i] = terrain[i] * (1 - t) + base * t;
  }
}

export function placeBarrels(terrain: number[]): ExplosiveBarrel[] {
  const barrels: ExplosiveBarrel[] = [];
  // Place 4 tactical explosive oil barrels
  const positions = [250, 400, 600, 750];
  for (const bx of positions) {
    const th = getTerrainHeight(terrain, bx);
    if (th < CANVAS_HEIGHT * 0.85) {
      barrels.push({ id: Math.random().toString(), x: bx + (Math.random() - 0.5) * 30, y: th, active: true });
    }
  }
  return barrels;
}

// Temps de déplacement de base par faction (Valkyrie : vitesse et mobilité doublées).
// Utilisé à la fois pour la mise en place initiale et pour la remise à zéro en début
// de tour, afin que l'avantage de faction ne disparaisse pas après le premier tour.
export function getBaseMoveTime(fac: TankFaction): number {
  return fac === 'valkyrie' ? 4.0 : MOVE_TIME;
}

export function placeTanks(terrain: number[], p1Fac: TankFaction = 'titan', p2Fac: TankFaction = 'valkyrie'): [Tank, Tank] {
  const lx = 100 + Math.floor(Math.random() * 100);
  const rx = CANVAS_WIDTH - 100 - Math.floor(Math.random() * 100);
  smoothAround(terrain, lx, 45);
  smoothAround(terrain, rx, 45);

  const setupFaction = (x: number, color: string, accent: string, name: string, facing: 1 | -1, fac: TankFaction): Tank => {
    let hp = 100;
    let sh = 0;
    const moveT = getBaseMoveTime(fac);
    const inv = { standard: -1, bertha: 2, cluster: 2, nuke: 1, bouncing: 2, drill: 2, sniper: 2, triple: 2, airstrike: 1, teleport: 1, mine: 2, napalm: 2, railgun: 2, seeker: 2, quake: 1 };

    if (fac === 'titan') {
      hp = 130;
      inv.bertha += 2;
      inv.quake += 1;
    } else if (fac === 'valkyrie') {
      hp = 90;
      inv.teleport += 2;
      inv.railgun += 2;
    } else if (fac === 'aegis') {
      sh = 40; // Bouclier énergétique permanent initial
      inv.seeker += 2;
    } else if (fac === 'inferno') {
      inv.napalm += 2;
      inv.triple += 2;
      inv.airstrike += 1;
    }

    return {
      x, y: getTerrainHeight(terrain, x), vx: 0, vy: 0,
      health: hp, maxHealth: hp, shield: sh, color, accent, name, faction: fac,
      inventory: inv, currentWeapon: 'standard', recoil: 0, recoilAngle: 0, facing,
      moveTimeLeft: moveT, isMoving: false, muzzleFlash: 0, treadOffset: 0,
    };
  };

  return [
    setupFaction(lx, '#3b82f6', '#1d4ed8', 'Commandant Bleu', 1, p1Fac),
    setupFaction(rx, '#ef4444', '#b91c1c', 'Général Rouge', -1, p2Fac)
  ];
}

export function placeTrees(terrain: number[]): Tree[] {
  const trees: Tree[] = [];
  for (let x = 40; x < CANVAS_WIDTH - 40; x += 30 + Math.random() * 40) {
    const th = getTerrainHeight(terrain, x);
    if (th < CANVAS_HEIGHT * 0.8 && Math.random() < 0.4) {
      // Avoid placing too close to tank spawns
      if (x < 180 || x > CANVAS_WIDTH - 180 || (x > 300 && x < 700)) {
        trees.push({ x, height: 15 + Math.random() * 25, alive: true, shake: 0 });
      }
    }
  }
  return trees;
}

export function generateWind() { return (Math.random() * 2 - 1) * 0.14; }
export function createClouds(): Cloud[] {
  return Array.from({ length: 8 }, () => ({
    x: Math.random() * CANVAS_WIDTH, y: 20 + Math.random() * 140,
    scale: 0.6 + Math.random() * 0.8, opacity: 0.25 + Math.random() * 0.35,
    speed: (Math.random() * 0.3 + 0.1) * (Math.random() > 0.5 ? 1 : -1),
  }));
}

// ─── Projectiles ───
export function createProjectile(
  tank: Tank, angleDeg: number, power: number,
  sender: 0 | 1, weapon: WeaponType
): Projectile {
  const rad = (angleDeg * Math.PI) / 180;
  const dir = sender === 0 ? 1 : -1;
  const w = WEAPONS[weapon];
  const speed = (power / 100) * 16.5 * w.speedMultiplier;

  tank.recoil = weapon === 'nuke' ? 22 : weapon === 'sniper' ? 6 : 14;
  tank.recoilAngle = angleDeg;
  tank.muzzleFlash = 8;

  return {
    x: tank.x + dir * Math.cos(rad) * BARREL_LENGTH,
    y: tank.y - TANK_HEIGHT - Math.sin(rad) * BARREL_LENGTH,
    vx: dir * Math.cos(rad) * speed,
    vy: -Math.sin(rad) * speed,
    type: weapon, trail: [], alive: true,
    color: w.color,
    radius: weapon === 'nuke' ? 7 : weapon === 'drill' ? 5 : weapon === 'sniper' || weapon === 'railgun' ? 3 : 4,
    senderIndex: sender,
    bouncesLeft: weapon === 'bouncing' ? 3 : 0,
    drillDepth: weapon === 'drill' ? 0 : undefined,
    underground: false,
    spin: 0,
  };
}

export function computeTrajectoryPreview(
  tank: Tank, angleDeg: number, power: number,
  sender: 0 | 1, weapon: WeaponType, wind: number
): { x: number; y: number }[] {
  const points: { x: number; y: number }[] = [];
  const rad = (angleDeg * Math.PI) / 180;
  const dir = sender === 0 ? 1 : -1;
  const w = WEAPONS[weapon];
  const speed = (power / 100) * 16.5 * w.speedMultiplier;
  let px = tank.x + dir * Math.cos(rad) * BARREL_LENGTH;
  let py = tank.y - TANK_HEIGHT - Math.sin(rad) * BARREL_LENGTH;
  let pvx = dir * Math.cos(rad) * speed;
  let pvy = -Math.sin(rad) * speed;
  for (let i = 0; i < 130; i++) {
    points.push({ x: px, y: py });
    pvy += GRAVITY; pvx += wind; px += pvx; py += pvy;
    if (py > CANVAS_HEIGHT || px < -100 || px > CANVAS_WIDTH + 100) break;
  }
  return points;
}

// ─── Update ───
export function updateProjectiles(state: GameState): { hitExplosions: Explosion[] } {
  const explosions: Explosion[] = [];
  const newSubs: Projectile[] = [];

  for (const p of state.projectiles) {
    if (!p.alive) continue;
    p.trail.push({ x: p.x, y: p.y, size: p.radius, alpha: 1 });
    if (p.trail.length > 35) p.trail.shift();
    // Fade trail
    for (let i = 0; i < p.trail.length; i++) {
      p.trail[i].alpha = i / p.trail.length;
      p.trail[i].size = p.radius * (i / p.trail.length) * 0.7;
    }

    // smoke
    if (Math.random() < 0.5 && !p.underground) {
      state.particles.push({
        x: p.x, y: p.y, vx: (Math.random() - 0.5) * 0.6, vy: (Math.random() - 0.5) * 0.5 - 0.2,
        life: 25, maxLife: 25, color: '#94a3b8', size: 3 + Math.random() * 3, alpha: 0.45,
      });
    }

    // Missile guidé : légère correction vers le char adverse, sans supprimer la gravité.
    if (p.type === 'seeker' && !p.underground) {
      const target = state.players[p.senderIndex === 0 ? 1 : 0];
      const dx = target.x - p.x;
      const dy = (target.y - TANK_HEIGHT) - p.y;
      const dist = Math.max(1, Math.sqrt(dx * dx + dy * dy));
      p.vx += (dx / dist) * 0.09;
      p.vy += (dy / dist) * 0.06;
    }

    // Cluster apex
    if (p.type === 'cluster' && !p.isSubmunition && p.vy < 0 && p.vy + GRAVITY >= 0) {
      p.alive = false;
      explosions.push(createExplosion(p.x, p.y, 25, '#38bdf8', false));
      for (let k = -2; k <= 2; k++) {
        const ang = Math.atan2(p.vy, p.vx) + (k * 12 * Math.PI) / 180;
        const spd = Math.sqrt(p.vx * p.vx + p.vy * p.vy) + 2;
        newSubs.push({ x: p.x, y: p.y, vx: Math.cos(ang) * spd, vy: Math.sin(ang) * spd, type: 'cluster', trail: [], isSubmunition: true, alive: true, color: '#38bdf8', radius: 3, senderIndex: p.senderIndex, spin: Math.random() * 10 });
      }
      continue;
    }

    if (!p.underground) { p.vy += GRAVITY; p.vx += state.wind; p.x += p.vx; p.y += p.vy; p.spin += 0.3; }

    if (p.x < -150 || p.x > CANVAS_WIDTH + 150 || p.y > CANVAS_HEIGHT + 150) {
      if (p.type === 'teleport') teleportTank(state, p.senderIndex, Math.max(50, Math.min(CANVAS_WIDTH - 50, p.x)), getTerrainHeight(state.terrain, Math.max(50, Math.min(CANVAS_WIDTH - 50, p.x))));
      p.alive = false; continue;
    }

    const th = getTerrainHeight(state.terrain, p.x);

    // Bouncing
    if (p.type === 'bouncing' && p.bouncesLeft && p.bouncesLeft > 0 && p.y >= th) {
      p.y = th; p.vy = -p.vy * 0.55; p.vx *= 0.75; p.bouncesLeft--;
      explosions.push(createExplosion(p.x, p.y, 15, '#a855f7', false));
      if (p.bouncesLeft <= 0) { p.alive = false; explodeAt(state, p.x, p.y, p.type, p.senderIndex); }
      continue;
    }

    // Drill
    if (p.type === 'drill') {
      if (p.y >= th) {
        p.underground = true;
        p.drillDepth = (p.drillDepth || 0) + Math.sqrt(p.vx * p.vx + p.vy * p.vy);
        destroyTerrain(state, p.x, p.y, 14);
        // Dirt trail from drill
        state.particles.push({
          x: p.x, y: th, vx: (Math.random() - 0.5) * 3, vy: -3 - Math.random() * 3,
          life: 40, maxLife: 40, color: '#78350f', size: 2 + Math.random() * 3, alpha: 1,
          rotation: Math.random() * Math.PI * 2, vRot: (Math.random() - 0.5) * 0.2,
        });
        if ((p.drillDepth || 0) > 140) { p.alive = false; explodeAt(state, p.x, p.y, p.type, p.senderIndex); }
        continue;
      }
    }

    // Direct tank hit
    let hitTank = false;
    for (let idx = 0; idx < 2; idx++) {
      const tank = state.players[idx];
      if (tank.health <= 0) continue;
      const dist = Math.sqrt((p.x - tank.x) ** 2 + (p.y - (tank.y - TANK_HEIGHT / 2)) ** 2);
      if (dist < TANK_WIDTH / 2 + p.radius) { hitTank = true; break; }
    }

    // Explode barrel hit
    let hitBarrel = false;
    for (const barrel of state.explosiveBarrels) {
      if (!barrel.active) continue;
      if (Math.hypot(p.x - barrel.x, p.y - barrel.y) < 18) {
        hitBarrel = true;
        detonateBarrel(state, barrel);
        break;
      }
    }

    // Tree hit
    if (!p.underground) {
      for (const tree of state.trees) {
        if (!tree.alive) continue;
        if (Math.abs(p.x - tree.x) < 6 && p.y < getTerrainHeight(state.terrain, tree.x) && p.y > getTerrainHeight(state.terrain, tree.x) - tree.height) {
          tree.alive = false;
          state.particles.push({ x: tree.x, y: getTerrainHeight(state.terrain, tree.x) - tree.height / 2, vx: (Math.random() - 0.5) * 5, vy: -Math.random() * 5, life: 60, maxLife: 60, color: '#166534', size: 4 + Math.random() * 4, alpha: 1, rotation: Math.random() * Math.PI * 2, vRot: (Math.random() - 0.5) * 0.3, gravity: GRAVITY });
        }
      }
    }

    if (hitTank || hitBarrel || (!p.underground && p.y >= th)) {
      p.alive = false;
      const hitY = hitTank ? p.y : Math.min(p.y, th);
      if (p.type === 'teleport') {
        teleportTank(state, p.senderIndex, p.x, getTerrainHeight(state.terrain, p.x));
        explosions.push(createExplosion(p.x, hitY, 20, '#14b8a6', false));
      } else {
        explodeAt(state, p.x, hitY, p.type, p.senderIndex);
      }
    }
  }
  state.projectiles = state.projectiles.filter((p) => p.alive).concat(newSubs);
  return { hitExplosions: explosions };
}

function teleportTank(state: GameState, idx: 0 | 1, tx: number, ty: number) {
  const tank = state.players[idx];
  // Remove old trail
  for (let i = 0; i < 20; i++) {
    state.particles.push({
      x: tank.x + (Math.random() - 0.5) * 20, y: tank.y - 20 + (Math.random() - 0.5) * 20,
      vx: (Math.random() - 0.5) * 4, vy: (Math.random() - 0.5) * 4,
      life: 30, maxLife: 30, color: '#14b8a6', size: 3 + Math.random() * 3, alpha: 1,
    });
    state.particles.push({
      x: tx + (Math.random() - 0.5) * 20, y: ty - 20 + (Math.random() - 0.5) * 20,
      vx: (Math.random() - 0.5) * 4, vy: (Math.random() - 0.5) * 4,
      life: 30, maxLife: 30, color: '#14b8a6', size: 3 + Math.random() * 3, alpha: 1,
    });
  }
  tank.x = Math.max(30, Math.min(CANVAS_WIDTH - 30, tx));
  tank.y = ty;
  addFloatingText(state, 'TÉLÉPORTATION !', tank.x, tank.y - 50, '#14b8a6', 22);
}

export function detonateBarrel(state: GameState, barrel: ExplosiveBarrel) {
  if (!barrel.active) return;
  barrel.active = false;
  state.explosions.push(createExplosion(barrel.x, barrel.y, 65, '#ea580c', false));
  destroyTerrain(state, barrel.x, barrel.y, 65);
  applyDamage(state, barrel.x, barrel.y, 70, 50, 0); // Explosion secondaire massive
  addFloatingText(state, 'RÉSERVOIR EXPLOSÉ !', barrel.x, barrel.y - 45, '#ea580c', 24);
}

function explodeAt(state: GameState, x: number, y: number, wType: WeaponType, sender: 0 | 1) {
  const w = WEAPONS[wType];
  state.explosions.push(createExplosion(x, y, w.explosionRadius, w.color, wType === 'nuke'));
  destroyTerrain(state, x, y, w.explosionRadius);
  applyDamage(state, x, y, w.explosionRadius, w.maxDamage, sender);

  // Check secondary barrel detonations
  for (const barrel of state.explosiveBarrels) {
    if (barrel.active && Math.hypot(barrel.x - x, barrel.y - y) < w.explosionRadius) {
      setTimeout(() => detonateBarrel(state, barrel), 250);
    }
  }

  if (wType === 'napalm') {
    for (let i = 0; i < 6; i++) {
      const sx = x + (i - 2.5) * 18 + (Math.random() - 0.5) * 12;
      const sy = getTerrainHeight(state.terrain, sx);
      state.explosions.push(createExplosion(sx, sy, 24, '#fb7185', false));
      applyDamage(state, sx, sy, 30, 12, sender);
      for (let j = 0; j < 10; j++) {
        state.particles.push({
          x: sx + (Math.random() - 0.5) * 20, y: sy - Math.random() * 20,
          vx: (Math.random() - 0.5) * 2, vy: -1 - Math.random() * 3,
          life: 80, maxLife: 80, color: Math.random() > 0.5 ? '#fb7185' : '#f97316',
          size: 3 + Math.random() * 5, alpha: 1,
        });
      }
    }
  }

  if (wType === 'quake') {
    for (let i = -4; i <= 4; i++) {
      const fx = x + i * 18;
      const fy = getTerrainHeight(state.terrain, fx);
      destroyTerrain(state, fx, fy, 24 + Math.random() * 12);
    }
    state.screenShake = Math.max(state.screenShake, 22);
    addFloatingText(state, 'FAILLE SISMIQUE !', x, y - 45, '#c084fc', 22);
  }
}

export function createExplosion(x: number, y: number, maxR: number, color: string, isNuke: boolean): Explosion {
  const parts: Particle[] = [];
  const count = isNuke ? 120 : 55;
  for (let i = 0; i < count; i++) {
    const ang = Math.random() * Math.PI * 2;
    const spd = (2 + Math.random() * 9) * (isNuke ? 1.7 : 1);
    const cols = ['#fbbf24', '#f59e0b', color, '#dc2626', '#fef3c7', '#ea580c', '#ffffff'];
    parts.push({ x, y, vx: Math.cos(ang) * spd, vy: Math.sin(ang) * spd - 2, life: 35 + Math.random() * 55, maxLife: 90, color: cols[Math.floor(Math.random() * cols.length)], size: 2 + Math.random() * 7, alpha: 1 });
  }
  const dirt = isNuke ? 55 : 30;
  for (let i = 0; i < dirt; i++) {
    const ang = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 0.9;
    const spd = 4 + Math.random() * 10;
    parts.push({ x, y, vx: Math.cos(ang) * spd, vy: Math.sin(ang) * spd, life: 45 + Math.random() * 55, maxLife: 95, color: Math.random() > 0.4 ? '#78350f' : '#451a03', size: 3 + Math.random() * 5, alpha: 1, rotation: Math.random() * Math.PI * 2, vRot: (Math.random() - 0.5) * 0.4, gravity: GRAVITY * 0.8 });
  }
  return { x, y, radius: 6, maxRadius: maxR, age: 0, maxAge: isNuke ? 90 : 60, particles: parts, shockwave: 0, innerShock: 0, color, isNuke, fireballPulse: 0 };
}

export function updateExplosions(state: GameState) {
  for (const e of state.explosions) {
    e.age++;
    e.fireballPulse += 0.2;
    if (e.radius < e.maxRadius) e.radius += (e.maxRadius - e.radius) * 0.28;
    e.shockwave += e.isNuke ? 10 : 6;
    e.innerShock += e.isNuke ? 4 : 3;
    if (e.age === 1) state.screenShake = Math.max(state.screenShake, e.isNuke ? 35 : 14);
    for (const p of e.particles) {
      p.vy += (p.gravity || GRAVITY * 0.8); p.vx *= 0.95; p.x += p.vx; p.y += p.vy;
      if (p.rotation !== undefined && p.vRot) p.rotation += p.vRot;
      p.life--; p.alpha = Math.max(0, p.life / p.maxLife);
    }
    e.particles = e.particles.filter((p) => p.life > 0);
  }
  state.explosions = state.explosions.filter((e) => e.age < e.maxAge || e.particles.length > 0);
}

export function destroyTerrain(state: GameState, cx: number, cy: number, radius: number) {
  const cols = state.terrain.length;
  const sc = Math.max(0, Math.floor((cx - radius) / TERRAIN_RESOLUTION));
  const ec = Math.min(cols - 1, Math.floor((cx + radius) / TERRAIN_RESOLUTION));
  for (let i = sc; i <= ec; i++) {
    const dx = i * TERRAIN_RESOLUTION - cx;
    const maxDy = Math.sqrt(Math.max(0, radius * radius - dx * dx));
    const bottom = cy + maxDy;
    if (state.terrain[i] < bottom) state.terrain[i] = Math.min(CANVAS_HEIGHT - 10, bottom);
  }
  // Scorched rim (toss more dirt)
  for (let j = 0; j < 18; j++) {
    state.particles.push({
      x: cx + (Math.random() - 0.5) * radius, y: cy + (Math.random() - 0.5) * radius,
      vx: (Math.random() - 0.5) * 7, vy: -2 - Math.random() * 8,
      life: 65, maxLife: 65, color: '#15803d', size: 2 + Math.random() * 4, alpha: 1,
      gravity: GRAVITY,
    });
  }
  // Update water puddles after terrain change
  updateWaterPuddles(state);
}

function updateWaterPuddles(state: GameState) {
  // Find depressions below water table
  state.waterPuddles = [];
  let inPuddle = false;
  let puddleStart = 0;
  for (let i = 1; i < state.terrain.length - 1; i++) {
    const x = i * TERRAIN_RESOLUTION;
    const th = state.terrain[i];
    const wl = state.waterTable[i];
    if (th > wl && !inPuddle) {
      inPuddle = true;
      puddleStart = x;
    } else if (th <= wl && inPuddle) {
      const width = x - puddleStart;
      if (width > 30) {
        state.waterPuddles.push({ x: puddleStart, y: wl - 5, width });
      }
      inPuddle = false;
    }
  }
}

export function applyDamage(state: GameState, cx: number, cy: number, radius: number, maxDmg: number, sender: 0 | 1) {
  for (let idx = 0; idx < 2; idx++) {
    if (idx === sender) continue;
    const tank = state.players[idx];
    if (tank.health <= 0) continue;
    const dx = tank.x - cx;
    const dy = tank.y - TANK_HEIGHT / 2 - cy;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < radius + TANK_WIDTH / 2) {
      const factor = Math.max(0.15, (radius + TANK_WIDTH / 2 - dist) / (radius + TANK_WIDTH / 2));
      let raw = Math.round(maxDmg * factor);
      if (tank.shield > 0) {
        if (tank.shield >= raw) { tank.shield -= raw; addFloatingText(state, `BOUCLIER -${raw}`, tank.x, tank.y - 30, '#a855f7', 18); raw = 0; }
        else { const rem = raw - tank.shield; addFloatingText(state, `BOUCLIER BRISÉ !`, tank.x, tank.y - 30, '#a855f7', 18); tank.shield = 0; raw = rem; }
      }
      if (raw > 0) {
        tank.health = Math.max(0, tank.health - raw);
        const crit = raw >= 50;
        addFloatingText(state, crit ? `CRITIQUE ! -${raw}` : `-${raw} PV`, tank.x + (Math.random() - 0.5) * 20, tank.y - 40, crit ? '#ef4444' : '#f97316', crit ? 28 : 20);
        for (let s = 0; s < 15; s++) state.particles.push({ x: tank.x, y: tank.y - TANK_HEIGHT / 2, vx: (Math.random() - 0.5) * 9, vy: -2 - Math.random() * 7, life: 30, maxLife: 30, color: '#38bdf8', size: 2 + Math.random() * 3, alpha: 1 });
      }
    }
  }
}

export function moveTank(state: GameState, idx: 0 | 1, dir: -1 | 1) {
  const tank = state.players[idx];
  if (tank.moveTimeLeft <= 0 || tank.health <= 0) return;
  const newX = tank.x + dir * MOVE_SPEED;
  if (newX < 30 || newX > CANVAS_WIDTH - 30) return;
  const newY = getTerrainHeight(state.terrain, newX);
  if (newY - tank.y > 40) return;
  tank.x = newX; tank.y = newY; tank.facing = dir as 1 | -1;
  tank.isMoving = true; tank.moveTimeLeft -= 1 / 60;
  if (tank.moveTimeLeft < 0) tank.moveTimeLeft = 0;
  tank.treadOffset = (tank.treadOffset + MOVE_SPEED) % 20;

  // Dust trail
  if (Math.random() < 0.4) {
    state.particles.push({
      x: tank.x - dir * 15, y: tank.y - 2, vx: -dir * (0.5 + Math.random()), vy: -Math.random() * 1.5,
      life: 25, maxLife: 25, color: '#a3a3a3', size: 2 + Math.random() * 3, alpha: 0.6,
    });
  }

  // Mines
  for (const mine of state.mines) {
    if (!mine.active || mine.owner === idx) continue;
    if (Math.abs(mine.x - tank.x) < 18 && Math.abs(mine.y - tank.y) < 25) {
      mine.active = false;
      state.explosions.push(createExplosion(mine.x, mine.y, WEAPONS.mine.explosionRadius, WEAPONS.mine.color, false));
      destroyTerrain(state, mine.x, mine.y, WEAPONS.mine.explosionRadius);
      applyDamage(state, mine.x, mine.y, WEAPONS.mine.explosionRadius, WEAPONS.mine.maxDamage, mine.owner);
      addFloatingText(state, 'MINE !', mine.x, mine.y - 40, '#ef4444', 22);
    }
  }
}

export function updateTanksPhysics(state: GameState) {
  for (const tank of state.players) {
    if (tank.recoil > 0) tank.recoil *= 0.82;
    if (tank.recoil < 0.1) tank.recoil = 0;
    if (tank.muzzleFlash > 0) tank.muzzleFlash--;
    const th = getTerrainHeight(state.terrain, tank.x);
    if (tank.y < th) {
      tank.vy += GRAVITY * 1.5;
      tank.y += tank.vy;
      if (tank.y >= th) { tank.y = th; tank.vy = 0; }
    } else if (tank.y > th + 2) {
      tank.y += (th - tank.y) * 0.4;
    }
  }
}

// ─── Crates ───
export function spawnCrate(state: GameState) {
  const types: Crate['type'][] = ['health', 'shield', 'cluster', 'health', 'nuke', 'bertha', 'bouncing', 'drill', 'sniper', 'napalm', 'railgun', 'seeker', 'quake'];
  const type = types[Math.floor(Math.random() * types.length)];
  const x = 200 + Math.random() * (CANVAS_WIDTH - 400);
  const map: Record<string, { color: string; label: string }> = {
    health: { color: '#22c55e', label: '+35 VIE' },
    shield: { color: '#a855f7', label: '+40 BOUCLIER' },
    nuke: { color: '#eab308', label: 'NUCLÉAIRE!' },
    cluster: { color: '#38bdf8', label: '+2 FRAGMENTATION' },
    bertha: { color: '#f97316', label: '+2 BERTHA' },
    bouncing: { color: '#a855f7', label: '+2 REBOND' },
    drill: { color: '#06b6d4', label: '+2 FOREUSE' },
    sniper: { color: '#ec4899', label: '+2 SNIPER' },
    napalm: { color: '#fb7185', label: '+2 NAPALM' },
    railgun: { color: '#67e8f9', label: '+2 RAILGUN' },
    seeker: { color: '#facc15', label: '+2 GUIDÉ' },
    quake: { color: '#c084fc', label: '+1 SISMIQUE' },
  };
  const info = map[type];
  state.crates.push({ id: Math.random().toString(), x, y: -40, vy: 1.2, type, color: info.color, label: info.label, landed: false, active: true, rot: 0, vRot: (Math.random() - 0.5) * 0.1 });
  addFloatingText(state, `📦 Ravitaillement détecté !`, x, 80, info.color, 16);
}

export function updateCrates(state: GameState) {
  for (const crate of state.crates) {
    if (!crate.active) continue;
    crate.rot += crate.vRot;
    if (!crate.landed) {
      crate.x += Math.sin(Date.now() / 300) * 0.4 + state.wind * 0.5;
      crate.y += crate.vy;
      const th = getTerrainHeight(state.terrain, crate.x);
      if (crate.y >= th - 12) {
        crate.y = th - 12; crate.landed = true;
        for (let i = 0; i < 8; i++) state.particles.push({ x: crate.x, y: crate.y, vx: (Math.random() - 0.5) * 3, vy: -Math.random() * 3, life: 20, maxLife: 20, color: '#e2e8f0', size: 2, alpha: 0.7 });
      }
    }
    for (const tank of state.players) {
      if (tank.health <= 0) continue;
      if (Math.abs(tank.x - crate.x) < TANK_WIDTH && Math.abs(tank.y - crate.y) < 30) {
        crate.active = false;
        if (crate.type === 'health') { tank.health = Math.min(tank.maxHealth, tank.health + 35); addFloatingText(state, `+35 VIE`, tank.x, tank.y - 40, '#22c55e', 24); }
        else if (crate.type === 'shield') { tank.shield = Math.min(50, tank.shield + 40); addFloatingText(state, `+40 BOUCLIER`, tank.x, tank.y - 40, '#a855f7', 24); }
        else if (crate.type === 'nuke') { tank.inventory.nuke = (tank.inventory.nuke || 0) + 1; addFloatingText(state, `+1 NUCLÉAIRE !`, tank.x, tank.y - 40, '#eab308', 24); }
        else {
          const amount = crate.type === 'quake' ? 1 : 2;
          tank.inventory[crate.type] = (tank.inventory[crate.type] || 0) + amount;
          addFloatingText(state, `+${amount} ${WEAPONS[crate.type as WeaponType]?.name || crate.type.toUpperCase()}`, tank.x, tank.y - 40, crate.color, 22);
        }
      }
    }
  }
  state.crates = state.crates.filter((c) => c.active);
}

export function processTurnStart(state: GameState) {
  const nextTank = state.players[state.currentPlayer];
  // Réparation passive du bouclier pour Paladin Électro (Aegis)
  if (nextTank.faction === 'aegis' && nextTank.health > 0) {
    nextTank.shield = Math.min(60, nextTank.shield + 12);
    addFloatingText(state, '+12 BOUCLIER (AEGIS)', nextTank.x, nextTank.y - 35, '#c084fc', 20);
  }
}

// ─── Mines ───
export function placeMine(state: GameState, idx: 0 | 1) {
  const tank = state.players[idx];
  state.mines.push({ x: tank.x, y: tank.y, owner: idx, active: true, timer: 0, blinkPhase: Math.random() * Math.PI * 2, armed: false });
  addFloatingText(state, 'MINE POSÉE', tank.x, tank.y - 30, '#ef4444', 16);
}

export function updateMines(state: GameState) {
  for (const mine of state.mines) {
    if (!mine.active) continue;
    mine.timer++;
    mine.blinkPhase += 0.15;
    mine.armed = mine.timer > 30; // arm after 0.5s
    mine.y = getTerrainHeight(state.terrain, mine.x);
    if (!mine.armed) continue;
    for (let idx = 0; idx < 2; idx++) {
      if (idx === mine.owner) continue;
      const tank = state.players[idx];
      if (tank.health <= 0) continue;
      const d = Math.sqrt((mine.x - tank.x) ** 2 + (mine.y - tank.y) ** 2);
      if (d < 22) {
        mine.active = false;
        state.explosions.push(createExplosion(mine.x, mine.y, WEAPONS.mine.explosionRadius, WEAPONS.mine.color, false));
        destroyTerrain(state, mine.x, mine.y, WEAPONS.mine.explosionRadius);
        applyDamage(state, mine.x, mine.y, WEAPONS.mine.explosionRadius, WEAPONS.mine.maxDamage, mine.owner);
        addFloatingText(state, 'MINE !', mine.x, mine.y - 40, '#ef4444', 22);
      }
    }
  }
  state.mines = state.mines.filter((m) => m.active);
}

// ─── Trees ───
export function updateTrees(state: GameState) {
  for (const tree of state.trees) {
    if (!tree.alive) continue;
    tree.shake *= 0.9;
    // Destroy tree if terrain under it is gone
    if (getTerrainHeight(state.terrain, tree.x) > CANVAS_HEIGHT - 20) {
      tree.alive = false;
    }
    // Check nearby explosion shock
    for (const e of state.explosions) {
      if (Math.abs(tree.x - e.x) < e.maxRadius && Math.abs(tree.height - CANVAS_HEIGHT + getTerrainHeight(state.terrain, tree.x)) < e.maxRadius) {
        tree.shake = 8;
        if (e.maxRadius > 60) tree.alive = false;
      }
    }
  }
}

// ─── Environment ───
export function updateEnvironment(state: GameState) {
  if (state.screenShake > 0) {
    state.screenShake *= 0.87;
    state.shakeX = (Math.random() - 0.5) * state.screenShake;
    state.shakeY = (Math.random() - 0.5) * state.screenShake;
    if (state.screenShake < 0.2) state.screenShake = 0;
  }
  state.wind += (state.targetWind - state.wind) * 0.02;
  state.heatHaze += 0.02;
  for (const c of state.clouds) { c.x += c.speed + state.wind * 1.5; if (c.x < -150) c.x = CANVAS_WIDTH + 150; if (c.x > CANVAS_WIDTH + 150) c.x = -150; }
  for (const p of state.particles) {
    p.x += p.vx + state.wind * 0.5; p.y += p.vy; p.life--; p.alpha = Math.max(0, p.life / p.maxLife);
  }
  state.particles = state.particles.filter((p) => p.life > 0);
  for (const ft of state.floatingTexts) { ft.y += ft.vy; ft.life--; }
  state.floatingTexts = state.floatingTexts.filter((ft) => ft.life > 0);

  // Weather particles (rain / snow)
  updateWeather(state);
}

function updateWeather(state: GameState) {
  if (state.skyTheme === 'rain') {
    for (let i = 0; i < 3; i++) {
      state.weatherParticles.push({
        x: state.cameraOffset.x + CANVAS_WIDTH / 2 + (Math.random() - 0.5) * CANVAS_WIDTH * 1.2,
        y: -10, vx: -2 + state.wind * 20, vy: 8 + Math.random() * 4,
        life: 80, maxLife: 80, color: 'rgba(186,230,253,0.6)', size: 1, alpha: 0.6,
      });
    }
  } else if (state.skyTheme === 'snow') {
    if (Math.random() < 0.5) {
      state.weatherParticles.push({
        x: state.cameraOffset.x + CANVAS_WIDTH / 2 + (Math.random() - 0.5) * CANVAS_WIDTH * 1.2,
        y: -10, vx: state.wind * 10 + (Math.random() - 0.5), vy: 1 + Math.random() * 2,
        life: 200, maxLife: 200, color: '#ffffff', size: 2 + Math.random() * 2, alpha: 0.8,
      });
    }
  }
  for (const wp of state.weatherParticles) {
    wp.x += wp.vx; wp.y += wp.vy; wp.life--;
  }
  state.weatherParticles = state.weatherParticles.filter((wp) => wp.life > 0 && wp.y < CANVAS_HEIGHT + 20);
}

export function addFloatingText(state: GameState, text: string, x: number, y: number, color: string = '#fbbf24', size: number = 18) {
  state.floatingTexts.push({ id: Math.random().toString(), text, x, y, vy: -1.5, color, life: 60, maxLife: 60, size });
}

// ─── Airstrike ───
export function launchAirstrike(state: GameState, targetX: number, sender: 0 | 1) {
  const offsets = [-40, 0, 40];
  for (const off of offsets) {
    const bx = targetX + off + (Math.random() - 0.5) * 20;
    state.projectiles.push({
      x: bx, y: -30, vx: state.wind * 2, vy: 4 + Math.random() * 2,
      type: 'airstrike', trail: [], alive: true, color: '#6366f1', radius: 5,
      senderIndex: sender, spin: 0,
    });
  }
}

// ─── AI ───
export interface AiDecision { angle: number; power: number; weapon: WeaponType; moveDir: -1 | 0 | 1; targetX?: number; }

function simulateShot(tank: Tank, angle: number, power: number, sender: 0 | 1, wind: number, terrain: number[], weapon: WeaponType): { x: number; y: number; hit: boolean } {
  const rad = (angle * Math.PI) / 180;
  const dir = sender === 0 ? 1 : -1;
  const w = WEAPONS[weapon];
  const speed = (power / 100) * 16.5 * w.speedMultiplier;
  let px = tank.x + dir * Math.cos(rad) * BARREL_LENGTH, py = tank.y - TANK_HEIGHT - Math.sin(rad) * BARREL_LENGTH;
  let pvx = dir * Math.cos(rad) * speed, pvy = -Math.sin(rad) * speed;
  for (let i = 0; i < 200; i++) {
    pvy += GRAVITY; pvx += wind; px += pvx; py += pvy;
    if (py > CANVAS_HEIGHT + 100 || px < -100 || px > CANVAS_WIDTH + 100) return { x: px, y: py, hit: false };
    if (py >= getTerrainHeight(terrain, px)) return { x: px, y: getTerrainHeight(terrain, px), hit: true };
  }
  return { x: px, y: py, hit: false };
}

export function aiCalculateDecision(state: GameState, diff: AiDifficulty): AiDecision {
  const ai = state.currentPlayer;
  const en = ai === 0 ? 1 : 0;
  const aiTank = state.players[ai];
  const enemy = state.players[en];

  let moveDir: -1 | 0 | 1 = 0;
  if (aiTank.moveTimeLeft > 0.3) {
    const nearby = state.mines.find((m) => m.active && m.owner !== ai && Math.abs(m.x - aiTank.x) < 100);
    if (nearby) moveDir = nearby.x > aiTank.x ? -1 : 1;
    else if (enemy.health > aiTank.health && Math.random() < 0.4) moveDir = Math.random() > 0.5 ? 1 : -1;
    else if (Math.random() < 0.25) moveDir = Math.random() > 0.5 ? 1 : -1;
    if (aiTank.x < 80) moveDir = 1;
    if (aiTank.x > CANVAS_WIDTH - 80) moveDir = -1;
  }

  let w: WeaponType = 'standard';
  const inv = aiTank.inventory;
  if (diff === 'hard') {
    if (inv.nuke > 0 && enemy.health > 40) w = 'nuke';
    else if (inv.airstrike > 0 && Math.random() < 0.4) w = 'airstrike';
    else if (inv.cluster > 0 && Math.random() < 0.5) w = 'cluster';
    else if (inv.bertha > 0 && Math.random() < 0.4) w = 'bertha';
    else if (inv.sniper > 0 && Math.abs(aiTank.x - enemy.x) > 400) w = 'sniper';
    else if (inv.bouncing > 0 && Math.random() < 0.3) w = 'bouncing';
    else if (inv.railgun > 0 && Math.random() < 0.28) w = 'railgun';
    else if (inv.seeker > 0 && Math.random() < 0.28) w = 'seeker';
    else if (inv.napalm > 0 && Math.random() < 0.25) w = 'napalm';
    else if (inv.quake > 0 && Math.random() < 0.2) w = 'quake';
    else if (inv.mine > 0 && Math.abs(aiTank.x - enemy.x) < 200 && Math.random() < 0.25) w = 'mine';
    else if (inv.drill > 0 && Math.random() < 0.2) w = 'drill';
  } else if (diff === 'medium') {
    if (inv.cluster > 0 && Math.random() < 0.35) w = 'cluster';
    else if (inv.bertha > 0 && Math.random() < 0.3) w = 'bertha';
    else if (inv.bouncing > 0 && Math.random() < 0.2) w = 'bouncing';
    else if (inv.seeker > 0 && Math.random() < 0.2) w = 'seeker';
    else if (inv.napalm > 0 && Math.random() < 0.18) w = 'napalm';
    else if (inv.mine > 0 && Math.random() < 0.15) w = 'mine';
  } else {
    if (inv.bouncing > 0 && Math.random() < 0.15) w = 'bouncing';
    else if (inv.napalm > 0 && Math.random() < 0.12) w = 'napalm';
    else if (inv.mine > 0 && Math.random() < 0.1) w = 'mine';
  }
  if (inv[w] === 0 || (inv[w] !== -1 && inv[w] <= 0)) w = 'standard';

  if (w === 'airstrike') return { angle: 45, power: 50, weapon: w, moveDir, targetX: enemy.x + (Math.random() - 0.5) * (diff === 'hard' ? 30 : diff === 'medium' ? 80 : 150) };
  if (w === 'mine') return { angle: 45, power: 50, weapon: w, moveDir };

  let bestA = 45, bestP = 50, bestS = Infinity;
  const aStep = diff === 'hard' ? 1.5 : diff === 'medium' ? 4 : 8;
  const pStep = diff === 'hard' ? 3 : diff === 'medium' ? 8 : 15;

  for (let a = 10; a <= 80; a += aStep) {
    for (let p = 25; p <= 100; p += pStep) {
      const sim = simulateShot(aiTank, a, p, ai, state.wind, state.terrain, w);
      const dist = Math.abs(sim.x - enemy.x);
      const score = dist + (sim.hit ? 0 : 200);
      if (score < bestS) { bestS = score; bestA = a; bestP = p; }
    }
  }

  if (diff === 'easy') { bestA += (Math.random() - 0.5) * 22; bestP += (Math.random() - 0.5) * 28; }
  else if (diff === 'medium') { bestA += (Math.random() - 0.5) * 12; bestP += (Math.random() - 0.5) * 15; }
  else { bestA += (Math.random() - 0.5) * 3; bestP += (Math.random() - 0.5) * 5; }

  bestA = Math.max(5, Math.min(85, bestA));
  bestP = Math.max(15, Math.min(100, bestP));
  return { angle: bestA, power: bestP, weapon: w, moveDir };
}

// ─── Init ───
export function createInitialState(
  mode: GameMode = 'menu',
  aiDiff: AiDifficulty = 'medium',
  p1Fac: TankFaction = 'titan',
  p2Fac: TankFaction = 'valkyrie',
  sky: SkyTheme = 'sunset'
): GameState {
  const terrain = generateTerrain(sky);
  const waterTable = generateWaterTable();
  const barrels = placeBarrels(terrain);
  const players = placeTanks(terrain, p1Fac, p2Fac);
  const trees = placeTrees(terrain);
  const w = generateWind();
  return {
    terrain, waterTable, players,
    currentPlayer: 0, projectiles: [], explosions: [], particles: [],
    floatingTexts: [], crates: [], mines: [], explosiveBarrels: barrels, trees,
    clouds: createClouds(), waterPuddles: [],
    wind: w, targetWind: w,
    angle: 45, power: 50,
    gameOver: false, winner: null,
    firing: false, screenShake: 0, shakeX: 0, shakeY: 0,
    message: "Tour du Commandant Bleu",
    turnCount: 1, skyTheme: sky,
    gameMode: mode, aiDifficulty: aiDiff,
    cameraOffset: { x: 0, y: 0 }, zoom: 1,
    aimTargetX: CANVAS_WIDTH / 2,
    p1Faction: p1Fac, p2Faction: p2Fac,
    aiThinking: false, aiActionTimer: 0,
    heatHaze: 0, weatherParticles: [],
  };
}
