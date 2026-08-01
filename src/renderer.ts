import {
  CANVAS_WIDTH, CANVAS_HEIGHT, TERRAIN_RESOLUTION,
  TANK_WIDTH, TANK_HEIGHT, BARREL_LENGTH, getBaseMoveTime,
  GameState, Tank, Projectile, Explosion, Cloud, Crate, FloatingText, Mine, Particle, Tree,
  WEAPONS, computeTrajectoryPreview,
} from './game';

export interface CameraState {
  x: number; y: number; zoom: number;
}

export function render(ctx: CanvasRenderingContext2D, state: GameState, camera?: CameraState) {
  // Caméra externe optionnelle (App.tsx) ; sinon on lit state.zoom + state.cameraOffset
  const activeCam: CameraState = camera ?? { x: state.cameraOffset.x, y: state.cameraOffset.y, zoom: state.zoom };

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  // Le fond et le HUD restent en espace ecran. Avant, ils etaient transformes par
  // la camera, ce qui pouvait laisser apparaitre des zones noires apres un zoom.
  ctx.save();
  drawSky(ctx, state);
  drawStars(ctx, state);
  drawSunMoon(ctx, state);
  drawClouds(ctx, state.clouds);
  drawWeather(ctx, state);
  drawMountains(ctx, state.skyTheme);
  ctx.restore();

  ctx.save();
  applyWorldCamera(ctx, state, activeCam);

  // Terrain et objets du champ de bataille suivent la camera/zoom.
  drawTerrain(ctx, state.terrain, state.skyTheme);
  drawWaterPuddles(ctx, state);
  for (const t of state.trees) drawTree(ctx, t, state);
  for (const b of state.explosiveBarrels) drawExplosiveBarrel(ctx, b);
  for (const m of state.mines) drawMine(ctx, m);
  for (const c of state.crates) drawCrate(ctx, c);
  drawTank(ctx, state.players[0], 0, state);
  drawTank(ctx, state.players[1], 1, state);
  if (!state.firing && !state.gameOver && state.gameMode !== 'menu') drawTrajectory(ctx, state);
  for (const p of state.projectiles) drawProjectile(ctx, p);
  drawParticles(ctx, state.particles);
  for (const e of state.explosions) drawExplosion(ctx, e);
  for (const ft of state.floatingTexts) drawFloatingText(ctx, ft);
  if (!state.firing && !state.gameOver) drawMoveTimer(ctx, state);
  ctx.restore();

  ctx.save();
  drawWindHUD(ctx, state.wind);
  if (state.skyTheme === 'sunset' || state.skyTheme === 'day') drawHeatHaze(ctx, state);
  ctx.restore();
}

function applyWorldCamera(ctx: CanvasRenderingContext2D, state: GameState, cam: CameraState) {
  if (state.screenShake > 0) ctx.translate(state.shakeX, state.shakeY);
  const cx = CANVAS_WIDTH / 2;
  const cy = CANVAS_HEIGHT / 2;
  ctx.translate(cx, cy);
  ctx.scale(cam.zoom, cam.zoom);
  ctx.translate(-cx + cam.x, -cy + cam.y);
}

let starCache: { x: number; y: number; r: number; alpha: number; speed: number }[] | null = null;

function drawSky(ctx: CanvasRenderingContext2D, state: GameState) {
  const g = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
  switch (state.skyTheme) {
    case 'sunset': g.addColorStop(0, '#1e1b4b'); g.addColorStop(0.4, '#701a75'); g.addColorStop(0.7, '#ea580c'); g.addColorStop(1, '#fef08a'); break;
    case 'night': g.addColorStop(0, '#030712'); g.addColorStop(0.5, '#111827'); g.addColorStop(1, '#1f2937'); break;
    case 'day': g.addColorStop(0, '#0284c7'); g.addColorStop(0.6, '#38bdf8'); g.addColorStop(1, '#bae6fd'); break;
    case 'emerald': g.addColorStop(0, '#064e3b'); g.addColorStop(0.5, '#047857'); g.addColorStop(1, '#34d399'); break;
    case 'rain': g.addColorStop(0, '#1e293b'); g.addColorStop(0.6, '#475569'); g.addColorStop(1, '#94a3b8'); break;
    case 'snow': g.addColorStop(0, '#c7d2fe'); g.addColorStop(0.6, '#e0e7ff'); g.addColorStop(1, '#f1f5f9'); break;
  }
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
}

function drawStars(ctx: CanvasRenderingContext2D, state: GameState) {
  if (state.skyTheme === 'day' || state.skyTheme === 'rain' || state.skyTheme === 'snow') return;
  if (!starCache) {
    starCache = Array.from({ length: 100 }, () => ({
      x: Math.random() * CANVAS_WIDTH, y: Math.random() * CANVAS_HEIGHT * 0.6,
      r: Math.random() * 1.8 + 0.3, alpha: Math.random(), speed: Math.random() * 0.04 + 0.01,
    }));
  }
  for (const s of starCache) {
    s.alpha += s.speed;
    if (s.alpha > 1 || s.alpha < 0.1) s.speed = -s.speed;
    ctx.fillStyle = `rgba(255,255,255,${s.alpha})`;
    ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2); ctx.fill();
  }
}

function drawSunMoon(ctx: CanvasRenderingContext2D, state: GameState) {
  ctx.save();
  ctx.beginPath();
  if (state.skyTheme === 'sunset') { ctx.fillStyle = 'rgba(255,237,213,0.95)'; ctx.shadowColor = 'rgba(249,115,22,0.9)'; ctx.shadowBlur = 50; ctx.arc(CANVAS_WIDTH - 180, 140, 50, 0, Math.PI * 2); }
  else if (state.skyTheme === 'night') { ctx.fillStyle = 'rgba(226,232,240,0.95)'; ctx.shadowColor = 'rgba(99,102,241,0.5)'; ctx.shadowBlur = 30; ctx.arc(CANVAS_WIDTH - 150, 100, 38, 0, Math.PI * 2); }
  else if (state.skyTheme === 'day') { ctx.fillStyle = 'rgba(254,240,138,1)'; ctx.shadowColor = 'rgba(250,204,21,0.9)'; ctx.shadowBlur = 55; ctx.arc(160, 90, 45, 0, Math.PI * 2); }
  else if (state.skyTheme === 'emerald') { ctx.fillStyle = 'rgba(167,243,208,0.8)'; ctx.shadowColor = 'rgba(16,185,129,0.9)'; ctx.shadowBlur = 55; ctx.arc(CANVAS_WIDTH - 200, 120, 60, 0, Math.PI * 2); }
  else if (state.skyTheme === 'rain') { ctx.fillStyle = 'rgba(148,163,184,0.9)'; ctx.shadowColor = 'rgba(71,85,105,0.6)'; ctx.shadowBlur = 20; ctx.arc(CANVAS_WIDTH - 160, 120, 40, 0, Math.PI * 2); }
  else if (state.skyTheme === 'snow') { ctx.fillStyle = 'rgba(248,250,252,0.95)'; ctx.shadowColor = 'rgba(186,230,253,0.8)'; ctx.shadowBlur = 35; ctx.arc(180, 90, 42, 0, Math.PI * 2); }
  ctx.fill();
  ctx.restore();
}

function drawClouds(ctx: CanvasRenderingContext2D, clouds: Cloud[]) {
  for (const c of clouds) {
    ctx.save();
    ctx.translate(c.x, c.y);
    ctx.scale(c.scale, c.scale);
    ctx.globalAlpha = c.opacity;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0, 0, 25, 0, Math.PI * 2);
    ctx.arc(20, -10, 30, 0, Math.PI * 2);
    ctx.arc(45, 0, 22, 0, Math.PI * 2);
    ctx.arc(25, 10, 24, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

function drawWeather(ctx: CanvasRenderingContext2D, state: GameState) {
  for (const wp of state.weatherParticles) {
    ctx.save();
    ctx.globalAlpha = wp.alpha;
    ctx.fillStyle = wp.color;
    if (state.skyTheme === 'rain') {
      ctx.beginPath();
      ctx.moveTo(wp.x, wp.y);
      ctx.lineTo(wp.x + wp.vx * 0.8, wp.y + wp.vy * 0.8);
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = wp.color;
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.arc(wp.x, wp.y, wp.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}

function drawMountains(ctx: CanvasRenderingContext2D, theme: string) {
  ctx.fillStyle = (theme === 'day' || theme === 'emerald') ? 'rgba(15,23,42,0.4)' : 'rgba(15,23,42,0.7)';
  ctx.beginPath(); ctx.moveTo(0, CANVAS_HEIGHT * 0.55);
  for (let i = 0; i <= 7; i++) ctx.lineTo((CANVAS_WIDTH / 7) * i, CANVAS_HEIGHT * 0.48 + Math.sin(i * 1.7) * 55);
  ctx.lineTo(CANVAS_WIDTH, CANVAS_HEIGHT); ctx.lineTo(0, CANVAS_HEIGHT); ctx.closePath(); ctx.fill();

  ctx.fillStyle = (theme === 'day' || theme === 'emerald') ? 'rgba(2,132,199,0.4)' : 'rgba(30,41,59,0.85)';
  ctx.beginPath(); ctx.moveTo(0, CANVAS_HEIGHT * 0.62);
  for (let i = 0; i <= 9; i++) ctx.lineTo((CANVAS_WIDTH / 9) * i, CANVAS_HEIGHT * 0.56 + Math.sin(i * 2.2) * 35);
  ctx.lineTo(CANVAS_WIDTH, CANVAS_HEIGHT); ctx.lineTo(0, CANVAS_HEIGHT); ctx.closePath(); ctx.fill();
}

function drawWaterPuddles(ctx: CanvasRenderingContext2D, state: GameState) {
  for (const puddle of state.waterPuddles) {
    const grad = ctx.createLinearGradient(0, puddle.y, 0, puddle.y + 15);
    grad.addColorStop(0, 'rgba(56,189,248,0.7)');
    grad.addColorStop(1, 'rgba(14,116,144,0.8)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(puddle.x + puddle.width / 2, puddle.y + 5, puddle.width / 2, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    // Ripple
    const r = Math.sin(state.heatHaze * 3 + puddle.x * 0.01) * 2;
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(puddle.x + puddle.width / 2, puddle.y + 5 + r, puddle.width / 2 - 5, 3, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
}

function drawTerrain(ctx: CanvasRenderingContext2D, terrain: number[], theme: string) {
  const grad = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
  switch (theme) {
    case 'emerald': grad.addColorStop(0, '#059669'); grad.addColorStop(0.3, '#047857'); grad.addColorStop(1, '#022c22'); break;
    case 'night': grad.addColorStop(0, '#374151'); grad.addColorStop(0.3, '#1f2937'); grad.addColorStop(1, '#030712'); break;
    case 'snow': grad.addColorStop(0, '#f8fafc'); grad.addColorStop(0.15, '#e2e8f0'); grad.addColorStop(0.4, '#64748b'); grad.addColorStop(1, '#334155'); break;
    default: grad.addColorStop(0, '#16a34a'); grad.addColorStop(0.1, '#15803d'); grad.addColorStop(0.35, '#78350f'); grad.addColorStop(1, '#381804');
  }
  ctx.fillStyle = grad;
  ctx.beginPath(); ctx.moveTo(0, CANVAS_HEIGHT);
  for (let i = 0; i < terrain.length; i++) ctx.lineTo(i * TERRAIN_RESOLUTION, terrain[i]);
  ctx.lineTo(CANVAS_WIDTH, CANVAS_HEIGHT); ctx.closePath(); ctx.fill();

  // Grass/top rim
  const rimColor = theme === 'emerald' ? '#34d399' : theme === 'night' ? '#6b7280' : theme === 'snow' ? '#ffffff' : '#4ade80';
  ctx.strokeStyle = rimColor;
  ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(0, terrain[0]);
  for (let i = 1; i < terrain.length; i++) ctx.lineTo(i * TERRAIN_RESOLUTION, terrain[i]);
  ctx.stroke();

  // Subsoil strata
  ctx.strokeStyle = 'rgba(0,0,0,0.25)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let i = 0; i < terrain.length; i += 10) {
    if (terrain[i] + 40 < CANVAS_HEIGHT) { ctx.moveTo(i * TERRAIN_RESOLUTION, terrain[i] + 25); ctx.lineTo(i * TERRAIN_RESOLUTION + 15, terrain[i] + 35); }
  }
  ctx.stroke();
}

function drawTree(ctx: CanvasRenderingContext2D, tree: Tree, state: GameState) {
  if (!tree.alive) return;
  const baseY = getTerrainHeight(state.terrain, tree.x);
  ctx.save();
  ctx.translate(tree.x, baseY);
  ctx.rotate(Math.sin(Date.now() / 200 + tree.x) * 0.02 + tree.shake * 0.1);
  // Trunk
  ctx.fillStyle = '#78350f';
  ctx.fillRect(-2, -tree.height, 4, tree.height);
  // Canopy
  const canopyY = -tree.height + 3;
  ctx.fillStyle = '#15803d';
  ctx.beginPath();
  ctx.arc(0, canopyY - 6, 10, 0, Math.PI * 2);
  ctx.arc(-7, canopyY, 8, 0, Math.PI * 2);
  ctx.arc(7, canopyY, 8, 0, Math.PI * 2);
  ctx.arc(0, canopyY - 12, 9, 0, Math.PI * 2);
  ctx.fill();
  // Highlight
  ctx.fillStyle = '#22c55e';
  ctx.beginPath();
  ctx.arc(-3, canopyY - 8, 5, 0, Math.PI * 2);
  ctx.arc(4, canopyY - 10, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function getTerrainHeight(terrain: number[], x: number): number {
  const col = Math.floor(x / TERRAIN_RESOLUTION);
  if (col < 0) return terrain[0];
  if (col >= terrain.length) return terrain[terrain.length - 1];
  return terrain[col];
}

function drawMine(ctx: CanvasRenderingContext2D, mine: Mine) {
  if (!mine.active) return;
  const blink = Math.sin(mine.blinkPhase) > 0;
  ctx.save();
  // Body
  ctx.fillStyle = '#374151';
  ctx.beginPath();
  ctx.arc(mine.x, mine.y - 5, 7, 0, Math.PI * 2);
  ctx.fill();
  // Spikes
  ctx.fillStyle = '#111827';
  for (let i = 0; i < 6; i++) {
    const ang = (i / 6) * Math.PI * 2;
    ctx.beginPath();
    ctx.arc(mine.x + Math.cos(ang) * 7, mine.y - 5 + Math.sin(ang) * 7, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }
  // Blink
  if (mine.armed) {
    ctx.fillStyle = blink ? '#ef4444' : '#7f1d1d';
    ctx.shadowColor = '#ef4444';
    ctx.shadowBlur = blink ? 10 : 3;
    ctx.beginPath();
    ctx.arc(mine.x, mine.y - 5, 2, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.fillStyle = '#6b7280';
    ctx.beginPath();
    ctx.arc(mine.x, mine.y - 5, 2, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawCrate(ctx: CanvasRenderingContext2D, crate: Crate) {
  ctx.save();
  ctx.translate(crate.x, crate.y);
  ctx.rotate(crate.rot);
  if (!crate.landed) {
    ctx.fillStyle = '#ef4444';
    ctx.beginPath(); ctx.arc(0, -28, 18, Math.PI, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.arc(0, -28, 12, Math.PI, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#cbd5e1'; ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-18, -28); ctx.lineTo(-6, -8);
    ctx.moveTo(18, -28); ctx.lineTo(6, -8);
    ctx.stroke();
  }
  ctx.fillStyle = '#b45309'; ctx.fillRect(-12, -12, 24, 24);
  ctx.fillStyle = crate.color; ctx.fillRect(-10, -10, 20, 20);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(-3, -12, 6, 24);
  ctx.fillRect(-12, -3, 24, 6);
  ctx.rotate(-crate.rot);
  ctx.fillStyle = crate.color;
  ctx.font = 'bold 11px sans-serif'; ctx.textAlign = 'center';
  ctx.shadowColor = '#000'; ctx.shadowBlur = 4;
  ctx.fillText(crate.label, 0, -34);
  ctx.restore();
}

function drawExplosiveBarrel(ctx: CanvasRenderingContext2D, barrel: { x: number; y: number; active: boolean }) {
  if (!barrel.active) return;
  ctx.save();
  ctx.translate(barrel.x, barrel.y);
  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.beginPath(); ctx.ellipse(0, 1, 10, 3, 0, 0, Math.PI * 2); ctx.fill();

  // Barrel metallic body
  ctx.fillStyle = '#b91c1c'; // Red hazard
  ctx.fillRect(-7, -18, 14, 18);

  // Metal ribs
  ctx.fillStyle = '#111827';
  ctx.fillRect(-8, -15, 16, 2);
  ctx.fillRect(-8, -7, 16, 2);
  ctx.fillRect(-7, -18, 14, 2);

  // Hazard Icon (Skull or Flame)
  ctx.fillStyle = '#fef08a';
  ctx.beginPath(); ctx.arc(0, -11, 2.5, 0, Math.PI * 2); ctx.fill();
  ctx.fillRect(-1.5, -9, 3, 2);

  ctx.restore();
}

function drawTank(ctx: CanvasRenderingContext2D, tank: Tank, idx: number, state: GameState) {
  const x = tank.x, y = tank.y;
  const isActive = state.currentPlayer === idx && !state.firing && !state.gameOver;
  ctx.save();

  // Shield bubble
  if (tank.shield > 0) {
    const a = 0.35 + Math.sin(Date.now() / 150) * 0.15;
    ctx.fillStyle = `rgba(168,85,247,${a * 0.3})`;
    ctx.strokeStyle = '#c084fc';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(x, y - 10, 32, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    // Shield shimmer
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(x, y - 10, 32, -0.5 + Math.sin(Date.now() / 300) * 0.3, 0.5 + Math.sin(Date.now() / 300) * 0.3); ctx.stroke();
  }

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.beginPath(); ctx.ellipse(x, y + 2, TANK_WIDTH / 2 + 2, 5, 0, 0, Math.PI * 2); ctx.fill();

  // Tracks with animated tread
  ctx.fillStyle = '#111827';
  ctx.beginPath(); ctx.roundRect(x - TANK_WIDTH / 2, y - 8, TANK_WIDTH, 8, 3); ctx.fill();

  // Animated tread cogs
  const treadPos = tank.treadOffset % 6;
  for (let i = 0; i < 6; i++) {
    ctx.fillStyle = i % 2 === 0 ? '#4b5563' : '#374151';
    ctx.fillRect(x - TANK_WIDTH / 2 + 2 + i * 5.5 - treadPos, y - 7, 3, 5);
  }

  // ─── Custom Sprites by Faction ───
  if (tank.faction === 'titan') {
    // Faction : Titan (Blindé Lourd) - Formes angulaires épaisses, double blindage
    ctx.fillStyle = '#1f2937';
    ctx.beginPath(); ctx.roundRect(x - TANK_WIDTH / 2 - 2, y - TANK_HEIGHT - 2, TANK_WIDTH + 4, TANK_HEIGHT - 6, [2, 2, 0, 0]); ctx.fill();
    ctx.fillStyle = tank.color;
    ctx.fillRect(x - TANK_WIDTH / 2 + 2, y - TANK_HEIGHT + 1, TANK_WIDTH - 4, TANK_HEIGHT - 10);
    ctx.fillStyle = tank.accent;
    ctx.fillRect(x - TANK_WIDTH / 2 + 2, y - TANK_HEIGHT + 6, TANK_WIDTH - 4, 3);

    // Tourelle lourde
    ctx.fillStyle = tank.accent;
    ctx.fillRect(x - 9, y - TANK_HEIGHT - 8, 18, 8);
    ctx.fillStyle = tank.color;
    ctx.fillRect(x - 5, y - TANK_HEIGHT - 8, 10, 8);
  } else if (tank.faction === 'valkyrie') {
    // Faction : Valkyrie (Scout Rapide) - Formes effilées aérodynamiques, ailerons
    ctx.fillStyle = tank.color;
    ctx.beginPath();
    const fDir = idx === 0 ? 1 : -1;
    ctx.moveTo(x - fDir * (TANK_WIDTH / 2), y - 8);
    ctx.lineTo(x + fDir * (TANK_WIDTH / 2 + 6), y - TANK_HEIGHT + 2);
    ctx.lineTo(x - fDir * (TANK_WIDTH / 2 - 4), y - TANK_HEIGHT - 3);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = tank.accent;
    ctx.fillRect(x - 6, y - TANK_HEIGHT + 1, 12, 3);

    // Tourelle profilée
    ctx.fillStyle = tank.accent;
    ctx.beginPath(); ctx.ellipse(x, y - TANK_HEIGHT + 1, 9, 6, Math.PI / 6 * fDir, 0, Math.PI * 2); ctx.fill();
  } else if (tank.faction === 'aegis') {
    // Faction : Aegis (Paladin Électro) - Dôme énergétique et résonateur de foudre
    ctx.fillStyle = tank.color;
    ctx.beginPath(); ctx.roundRect(x - TANK_WIDTH / 2 + 2, y - TANK_HEIGHT, TANK_WIDTH - 4, TANK_HEIGHT - 8, [8, 8, 0, 0]); ctx.fill();
    ctx.fillStyle = '#c084fc'; // Éclair violet
    ctx.fillRect(x - 4, y - TANK_HEIGHT + 2, 8, 4);

    // Tourelle ronde surmontée de pointes plasma
    ctx.fillStyle = tank.accent;
    ctx.beginPath(); ctx.arc(x, y - TANK_HEIGHT, 9, Math.PI, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath(); ctx.arc(x, y - TANK_HEIGHT - 9, 3, 0, Math.PI * 2); ctx.fill();
  } else {
    // Faction : Inferno / Pyromane - Pointes menaçantes et motifs de flammes
    ctx.fillStyle = tank.color;
    ctx.beginPath(); ctx.roundRect(x - TANK_WIDTH / 2 + 2, y - TANK_HEIGHT, TANK_WIDTH - 4, TANK_HEIGHT - 8, [3, 3, 0, 0]); ctx.fill();
    // Flammes
    ctx.fillStyle = '#facc15';
    ctx.beginPath();
    ctx.moveTo(x - 12, y - TANK_HEIGHT); ctx.lineTo(x - 8, y - TANK_HEIGHT + 6); ctx.lineTo(x - 4, y - TANK_HEIGHT);
    ctx.moveTo(x + 4, y - TANK_HEIGHT); ctx.lineTo(x + 8, y - TANK_HEIGHT + 6); ctx.lineTo(x + 12, y - TANK_HEIGHT);
    ctx.fill();

    // Tourelle épineuse
    ctx.fillStyle = tank.accent;
    ctx.beginPath(); ctx.arc(x, y - TANK_HEIGHT, 10, Math.PI, Math.PI * 2); ctx.fill();
  }

  // Gun Barrel with recoil
  const dir = idx === 0 ? 1 : -1;
  const aimDeg = isActive ? state.angle : 45;
  const aimRad = (aimDeg * Math.PI) / 180;
  const barrelLen = Math.max(10, BARREL_LENGTH - (tank.recoil || 0));
  const bx = x + dir * Math.cos(aimRad) * barrelLen;
  const by = y - TANK_HEIGHT - Math.sin(aimRad) * barrelLen;

  ctx.strokeStyle = tank.accent;
  ctx.lineWidth = tank.faction === 'titan' ? 6.5 : tank.faction === 'valkyrie' ? 3.5 : 5;
  ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(x, y - TANK_HEIGHT); ctx.lineTo(bx, by); ctx.stroke();

  // Metallic or Plasma Barrel highlight
  ctx.strokeStyle = tank.faction === 'valkyrie' ? '#38bdf8' : tank.faction === 'inferno' ? '#facc15' : 'rgba(255,255,255,0.5)';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(x, y - TANK_HEIGHT); ctx.lineTo(bx, by); ctx.stroke();

  // Muzzle flash
  if (tank.muzzleFlash > 0) {
    const flashSize = tank.muzzleFlash * 3;
    const flashGrad = ctx.createRadialGradient(bx, by, 0, bx, by, flashSize);
    flashGrad.addColorStop(0, 'rgba(255,255,255,1)');
    flashGrad.addColorStop(0.3, tank.faction === 'valkyrie' ? 'rgba(56,189,248,0.9)' : 'rgba(253,230,138,0.9)');
    flashGrad.addColorStop(0.7, 'rgba(249,115,22,0.5)');
    flashGrad.addColorStop(1, 'rgba(249,115,22,0)');
    ctx.fillStyle = flashGrad;
    ctx.beginPath(); ctx.arc(bx, by, flashSize, 0, Math.PI * 2); ctx.fill();
  }

  // Turn Indicator chevron
  if (isActive) {
    ctx.fillStyle = '#f59e0b';
    ctx.shadowColor = '#fcd34d'; ctx.shadowBlur = 14;
    ctx.beginPath();
    const bob = Math.sin(Date.now() / 150) * 4;
    ctx.moveTo(x - 8, y - TANK_HEIGHT - 28 + bob);
    ctx.lineTo(x + 8, y - TANK_HEIGHT - 28 + bob);
    ctx.lineTo(x, y - TANK_HEIGHT - 18 + bob);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  ctx.restore();
}

function drawTrajectory(ctx: CanvasRenderingContext2D, state: GameState) {
  const tank = state.players[state.currentPlayer];
  const weapon = WEAPONS[tank.currentWeapon];

  if (weapon.isSpecial && tank.currentWeapon === 'airstrike') {
    const tx = state.aimTargetX;
    ctx.strokeStyle = 'rgba(99,102,241,0.7)';
    ctx.lineWidth = 2; ctx.setLineDash([10, 10]);
    ctx.beginPath(); ctx.moveTo(tx, 0); ctx.lineTo(tx, CANVAS_HEIGHT); ctx.stroke();
    ctx.setLineDash([]);
    ctx.strokeStyle = '#6366f1'; ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(tx - 14, 85); ctx.lineTo(tx + 14, 85);
    ctx.moveTo(tx, 73); ctx.lineTo(tx, 97);
    ctx.stroke();
    // Dashed circle
    ctx.strokeStyle = 'rgba(99,102,241,0.5)';
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(tx, 85, 25, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = '#6366f1'; ctx.font = 'bold 11px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('CIBLE AÉRIENNE', tx, 62);
    return;
  }

  const points = computeTrajectoryPreview(tank, state.angle, state.power, state.currentPlayer, tank.currentWeapon, state.wind);
  ctx.strokeStyle = weapon.color;
  ctx.lineWidth = 2; ctx.setLineDash([6, 6]);
  ctx.beginPath();
  for (let i = 0; i < points.length; i++) { if (i === 0) ctx.moveTo(points[i].x, points[i].y); else ctx.lineTo(points[i].x, points[i].y); }
  ctx.stroke();
  ctx.setLineDash([]);
  // Impact reticle
  if (points.length > 0) {
    const last = points[points.length - 1];
    ctx.fillStyle = weapon.color;
    ctx.shadowColor = weapon.color; ctx.shadowBlur = 12;
    ctx.beginPath(); ctx.arc(last.x, last.y, 5, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;
    // Cross
    ctx.strokeStyle = weapon.color; ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(last.x - 8, last.y); ctx.lineTo(last.x - 4, last.y);
    ctx.moveTo(last.x + 4, last.y); ctx.lineTo(last.x + 8, last.y);
    ctx.moveTo(last.x, last.y - 8); ctx.lineTo(last.x, last.y - 4);
    ctx.moveTo(last.x, last.y + 4); ctx.lineTo(last.x, last.y + 8);
    ctx.stroke();
  }
}

function drawProjectile(ctx: CanvasRenderingContext2D, p: Projectile) {
  // Trail
  for (let i = 0; i < p.trail.length; i++) {
    const t = p.trail[i];
    ctx.fillStyle = p.color;
    ctx.globalAlpha = t.alpha * 0.7;
    ctx.beginPath();
    ctx.arc(t.x, t.y, t.size + 1, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // Outer glow
  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = p.color;
  ctx.shadowBlur = 20;
  ctx.beginPath();
  ctx.arc(p.x, p.y, p.radius + 2, 0, Math.PI * 2);
  ctx.fill();
  // Inner core
  ctx.fillStyle = p.color;
  ctx.shadowBlur = 0;
  ctx.beginPath();
  ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
  ctx.fill();

  // Spin highlight
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(p.spin);
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.beginPath();
  ctx.arc(-p.radius * 0.3, -p.radius * 0.3, p.radius * 0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawParticles(ctx: CanvasRenderingContext2D, particles: Particle[]) {
  for (const p of particles) {
    ctx.save();
    ctx.translate(p.x, p.y);
    if (p.rotation !== undefined) ctx.rotate(p.rotation);
    ctx.fillStyle = p.color;
    ctx.globalAlpha = p.alpha;
    // Rounded particles for smoke, rect for debris
    if (p.color === '#94a3b8' || p.color.startsWith('rgba')) {
      ctx.beginPath(); ctx.arc(0, 0, p.size * 0.5, 0, Math.PI * 2); ctx.fill();
    } else {
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
    }
    ctx.restore();
  }
}

function drawExplosion(ctx: CanvasRenderingContext2D, e: Explosion) {
  ctx.save();

  // Shockwave ring
  if (e.shockwave < e.maxRadius * 3) {
    const a = 1 - e.shockwave / (e.maxRadius * 3);
    ctx.strokeStyle = e.isNuke ? `rgba(74,222,128,${a})` : `rgba(255,255,255,${a * 0.9})`;
    ctx.lineWidth = e.isNuke ? 7 : 4;
    ctx.beginPath(); ctx.arc(e.x, e.y, e.shockwave, 0, Math.PI * 2); ctx.stroke();
  }
  // Inner bright shock
  if (e.innerShock > 0 && e.innerShock < e.maxRadius * 1.5) {
    const a = 1 - e.innerShock / (e.maxRadius * 1.5);
    ctx.strokeStyle = `rgba(255,255,255,${a * 0.6})`;
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(e.x, e.y, e.innerShock, 0, Math.PI * 2); ctx.stroke();
  }

  // Fireball with pulsing
  if (e.age < 40) {
    const fa = 1 - e.age / 40;
    const pulseSize = e.radius + Math.sin(e.fireballPulse) * 3;
    const grad = ctx.createRadialGradient(e.x, e.y, 0, e.x, e.y, pulseSize);
    grad.addColorStop(0, `rgba(255,255,255,${fa})`);
    grad.addColorStop(0.15, `rgba(253,230,138,${fa})`);
    grad.addColorStop(0.45, e.isNuke ? `rgba(34,197,94,${fa})` : `rgba(245,158,11,${fa})`);
    grad.addColorStop(0.75, e.isNuke ? `rgba(6,78,59,${fa * 0.7})` : `rgba(185,28,28,${fa * 0.7})`);
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.beginPath(); ctx.arc(e.x, e.y, pulseSize, 0, Math.PI * 2); ctx.fill();
  }

  // Debris and sparks
  for (const p of e.particles) {
    ctx.fillStyle = p.color;
    ctx.globalAlpha = p.alpha;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawFloatingText(ctx: CanvasRenderingContext2D, ft: FloatingText) {
  ctx.save();
  const a = ft.life / ft.maxLife;
  ctx.fillStyle = ft.color;
  ctx.globalAlpha = a;
  ctx.font = `900 ${ft.size}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.shadowColor = '#000000'; ctx.shadowBlur = 10;
  // Slight upward bob
  ctx.fillText(ft.text, ft.x + Math.sin(ft.life * 0.3) * 2, ft.y);
  ctx.restore();
}

function drawWindHUD(ctx: CanvasRenderingContext2D, wind: number) {
  const cx = CANVAS_WIDTH / 2, cy = 35;
  ctx.save();
  ctx.fillStyle = 'rgba(15,23,42,0.8)';
  ctx.beginPath(); ctx.roundRect(cx - 100, cy - 26, 200, 52, 12); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.25)'; ctx.lineWidth = 1; ctx.stroke();
  ctx.fillStyle = '#94a3b8'; ctx.font = 'bold 9px sans-serif'; ctx.textAlign = 'center';
  ctx.fillText('FORCE DU VENT', cx, cy - 12);
  const bw = 140;
  const wn = Math.max(-1, Math.min(1, wind / 0.14));
  ctx.fillStyle = 'rgba(255,255,255,0.1)';
  ctx.beginPath(); ctx.roundRect(cx - bw / 2, cy, bw, 9, 4); ctx.fill();
  const al = Math.abs(wn) * (bw / 2);
  ctx.fillStyle = wind >= 0 ? '#38bdf8' : '#f43f5e';
  ctx.beginPath();
  if (wind >= 0) ctx.roundRect(cx, cy, al, 9, [0, 4, 4, 0]);
  else ctx.roundRect(cx - al, cy, al, 9, [4, 0, 0, 4]);
  ctx.fill();
  // Tick marks
  ctx.fillStyle = 'rgba(255,255,255,0.3)';
  for (let i = -5; i <= 5; i++) {
    ctx.fillRect(cx + i * 14, cy + 3, 1, 3);
  }
  // Readout
  ctx.fillStyle = '#ffffff'; ctx.font = 'bold 10px monospace';
  const s = Math.abs(wind * 100).toFixed(1);
  ctx.fillText(wind >= 0 ? `+${s}` : `-${s}`, cx + (wind >= 0 ? 1 : -1) * (al + 25), cy + 7);
  ctx.restore();
}

function drawMoveTimer(ctx: CanvasRenderingContext2D, state: GameState) {
  const tank = state.players[state.currentPlayer];
  if (tank.moveTimeLeft <= 0 || tank.health <= 0) return;
  const pct = tank.moveTimeLeft / getBaseMoveTime(tank.faction);
  ctx.save();
  // Background pill
  ctx.fillStyle = 'rgba(0,0,0,0.75)';
  ctx.beginPath(); ctx.roundRect(tank.x - 35, tank.y - 70, 70, 20, 10); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.15)'; ctx.lineWidth = 1; ctx.stroke();
  // Bar
  ctx.fillStyle = pct > 0.5 ? '#22c55e' : pct > 0.25 ? '#eab308' : '#ef4444';
  ctx.beginPath(); ctx.roundRect(tank.x - 33, tank.y - 68, 66 * pct, 16, 8); ctx.fill();
  // Timer text
  ctx.fillStyle = '#ffffff'; ctx.font = 'bold 10px sans-serif'; ctx.textAlign = 'center';
  ctx.fillText(`⏱ ${tank.moveTimeLeft.toFixed(1)}s`, tank.x, tank.y - 56);
  ctx.restore();
}

function drawHeatHaze(ctx: CanvasRenderingContext2D, _state: GameState) {
  // subtle warm vignette at bottom
  const v = ctx.createRadialGradient(CANVAS_WIDTH / 2, CANVAS_HEIGHT - 50, 50, CANVAS_WIDTH / 2, CANVAS_HEIGHT, 400);
  v.addColorStop(0, 'rgba(0,0,0,0)');
  v.addColorStop(1, 'rgba(249,115,22,0.08)');
  ctx.fillStyle = v;
  ctx.fillRect(0, CANVAS_HEIGHT - 200, CANVAS_WIDTH, 200);
}
