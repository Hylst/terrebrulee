import { useEffect, useRef, useState, useCallback } from 'react';
import {
  CANVAS_WIDTH, CANVAS_HEIGHT, createInitialState, createProjectile,
  spawnCrate, updateProjectiles, updateExplosions, updateTanksPhysics,
  updateCrates, updateEnvironment, updateMines, generateWind,
  moveTank, placeMine, launchAirstrike, aiCalculateDecision,
  updateTrees, processTurnStart, getBaseMoveTime, TankFaction, SkyTheme,
  WEAPONS, WeaponType, GameMode, AiDifficulty, GameState,
} from './game';
import { render } from './renderer';
import { soundSystem } from './audio';

// ─── Caméra : état partagé hors React pour les performances ───
type Camera = {
  x: number;   // décalage monde en pixels (positif = vue vers la droite)
  y: number;   // décalage monde en pixels (positif = vue vers le bas)
  zoom: number;
  // suivi automatique
  followX: number;
  followY: number;
  manualOverride: boolean; // true quand le joueur fait un pan manuel
  manualTimer: number;     // frames avant de ré-activer le suivi auto
};

function clampCamera(cam: Camera) {
  // Limites : le terrain fait CANVAS_WIDTH×CANVAS_HEIGHT en espace monde.
  // On laisse 20% de marge supplémentaire pour voir les projectiles en vol.
  const maxX = CANVAS_WIDTH  * 0.3;
  const maxY = CANVAS_HEIGHT * 0.3;
  cam.x = Math.max(-maxX, Math.min(maxX, cam.x));
  cam.y = Math.max(-maxY, Math.min(maxY, cam.y));
}

export default function App() {
  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const stateRef   = useRef<GameState>(createInitialState('menu'));
  const cameraRef  = useRef<Camera>({ x: 0, y: 0, zoom: 1, followX: 0, followY: 0, manualOverride: false, manualTimer: 0 });

  const [, setTick] = useState(0);
  const forceUpdate = useCallback(() => setTick(t => t + 1), []);

  // ─── Game Mode & Faction Setup ───
  const [gameMode,     setGameMode]     = useState<GameMode>('menu');
  const [aiDifficulty, setAiDifficulty] = useState<AiDifficulty>('medium');
  const [setupP1Fac,   setSetupP1Fac]   = useState<WeaponType | any>('titan');
  const [setupP2Fac,   setSetupP2Fac]   = useState<WeaponType | any>('valkyrie');
  const [setupSky,     setSetupSky]     = useState<'day'|'sunset'|'night'|'emerald'|'rain'|'snow'>('sunset');

  // ─── Gameplay UI ───
  const [angle,         setAngle]         = useState(45);
  const [power,         setPower]         = useState(50);
  const [firing,        setFiring]        = useState(false);
  const [gameOver,      setGameOver]      = useState(false);
  const [winner,        setWinner]        = useState<string | null>(null);
  const [currentPlayer, setCurrentPlayer] = useState<0 | 1>(0);
  const [p1Health,      setP1Health]      = useState(100);
  const [p1Shield,      setP1Shield]      = useState(0);
  const [p2Health,      setP2Health]      = useState(100);
  const [p2Shield,      setP2Shield]      = useState(0);
  const [currentWeapon, setCurrentWeapon] = useState<WeaponType>('standard');
  const [p1Inventory,   setP1Inventory]   = useState(stateRef.current.players[0].inventory);
  const [p2Inventory,   setP2Inventory]   = useState(stateRef.current.players[1].inventory);
  const [wind,          setWind]          = useState(0);
  const [turnCount,     setTurnCount]     = useState(1);
  const [skyTheme,      setSkyTheme]      = useState<'day'|'sunset'|'night'|'emerald'|'rain'|'snow'>('sunset');
  const [moveTimeLeft,  setMoveTimeLeft]  = useState(2.0);
  const [isAiTurn,      setIsAiTurn]      = useState(false);
  const [aimMode,       setAimMode]       = useState<'cursor' | 'slingshot'>('cursor');

  // ─── Audio ───
  const [sfxEnabled,   setSfxEnabled]   = useState(true);
  const [musicEnabled, setMusicEnabled] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

  // ─── Input refs ───
  const keysRef        = useRef<Set<string>>(new Set());
  // Viser : drag depuis le tank (clic gauche sur le tank)
  const aimDragRef     = useRef<{ active: boolean; sx: number; sy: number; cx: number; cy: number } | null>(null);
  // Panoramique : clic droit ou clic milieu ou 2 doigts
  const panDragRef     = useRef<{ active: boolean; sx: number; sy: number; lastX: number; lastY: number } | null>(null);
  const touchStartRef  = useRef<{ x: number; y: number; time: number } | null>(null);
  const pinchRef       = useRef<{ dist: number; zoom: number } | null>(null);
  const aiTimerRef     = useRef<number | null>(null);

  // ─── Conversions coordonnées ───
  // canvas CSS → coordonnées canvas (pixels physiques du canvas)
  const getCanvasPx = useCallback((clientX: number, clientY: number) => {
    const cv = canvasRef.current!;
    const r  = cv.getBoundingClientRect();
    return {
      x: (clientX - r.left)  * (CANVAS_WIDTH  / r.width),
      y: (clientY - r.top)   * (CANVAS_HEIGHT / r.height),
    };
  }, []);

  // canvas pixels → espace monde (en tenant compte du zoom + pan camera)
  const canvasToWorld = useCallback((cx: number, cy: number) => {
    const cam = cameraRef.current;
    return {
      x: (cx - CANVAS_WIDTH  / 2) / cam.zoom + CANVAS_WIDTH  / 2 - cam.x,
      y: (cy - CANVAS_HEIGHT / 2) / cam.zoom + CANVAS_HEIGHT / 2 - cam.y,
    };
  }, []);

  useEffect(() => { soundSystem.init(); soundSystem.setSfxVolume(sfxEnabled ? 0.6 : 0); }, [sfxEnabled]);
  useEffect(() => { soundSystem.toggleMusic(musicEnabled); }, [musicEnabled]);

  // Sync sliders → stateRef
  useEffect(() => { stateRef.current.angle = angle; }, [angle]);
  useEffect(() => { stateRef.current.power = power; }, [power]);
  useEffect(() => { stateRef.current.skyTheme = skyTheme; }, [skyTheme]);
  useEffect(() => {
    if (gameMode !== 'menu') stateRef.current.players[stateRef.current.currentPlayer].currentWeapon = currentWeapon;
  }, [currentWeapon, gameMode]);

  // ─── Main Game Loop ───
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let pendingTurn = false;

    const loop = () => {
      const state  = stateRef.current;
      const cam    = cameraRef.current;

      if (gameMode === 'menu') {
        // Menu : afficher juste le fond animé via le renderer
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        render(ctx, state, cam);
        animId = requestAnimationFrame(loop);
        return;
      }

      // ─── Déplacement clavier A/D ───
      const tank = state.players[state.currentPlayer];
      let moved = false;
      if (!state.firing && !state.gameOver && tank.moveTimeLeft > 0) {
        if (keysRef.current.has('arrowleft')  || keysRef.current.has('a')) { moveTank(state, state.currentPlayer, -1); moved = true; }
        if (keysRef.current.has('arrowright') || keysRef.current.has('d')) { moveTank(state, state.currentPlayer,  1); moved = true; }
      }
      if (moved && Math.random() < 0.1 && sfxEnabled) soundSystem.playEngineMove();

      // ─── Pan clavier (flèches + Ctrl / ZQSD pan) ───
      const PAN_SPD = 6 / cam.zoom;
      let panning = false;
      if (keysRef.current.has('arrowleft')  && keysRef.current.has('control')) { cam.x -= PAN_SPD; panning = true; }
      if (keysRef.current.has('arrowright') && keysRef.current.has('control')) { cam.x += PAN_SPD; panning = true; }
      if (keysRef.current.has('arrowup')    && keysRef.current.has('control')) { cam.y -= PAN_SPD; panning = true; }
      if (keysRef.current.has('arrowdown')  && keysRef.current.has('control')) { cam.y += PAN_SPD; panning = true; }
      // Pan simple avec i/j/k/l
      if (keysRef.current.has('j')) { cam.x -= PAN_SPD; panning = true; }
      if (keysRef.current.has('l')) { cam.x += PAN_SPD; panning = true; }
      if (keysRef.current.has('i')) { cam.y -= PAN_SPD; panning = true; }
      if (keysRef.current.has('k')) { cam.y += PAN_SPD; panning = true; }
      if (panning) { clampCamera(cam); cam.manualOverride = true; cam.manualTimer = 180; }

      // ─── Projectiles & physique ───
      if (state.projectiles.length > 0) {
        const { hitExplosions } = updateProjectiles(state);
        hitExplosions.forEach(e => { if (sfxEnabled) soundSystem.playExplosion(e.maxRadius); });
      }
      updateExplosions(state);
      updateTanksPhysics(state);
      updateCrates(state);
      updateMines(state);
      updateTrees(state);
      updateEnvironment(state);

      const flightDone = state.projectiles.length === 0 && state.explosions.length === 0;
      if (state.firing && flightDone && !pendingTurn) {
        pendingTurn = true;
        setTimeout(() => { completeTurn(state); pendingTurn = false; }, 900);
      }

      // ─── Suivi automatique de caméra ───
      if (cam.manualOverride) {
        cam.manualTimer--;
        if (cam.manualTimer <= 0) cam.manualOverride = false;
      } else {
        // Calcul de la cible
        let tx: number, ty: number;
        if (state.projectiles.length > 0 && state.projectiles[0]) {
          tx = state.projectiles[0].x;
          ty = state.projectiles[0].y;
        } else {
          tx = state.players[state.currentPlayer].x;
          ty = state.players[state.currentPlayer].y - 50;
        }
        // Décalage monde : 0 = centré sur le monde, + = vue déplacée à droite
        const targetOffX = tx - CANVAS_WIDTH  / 2;
        const targetOffY = ty - CANVAS_HEIGHT / 2;
        cam.x += (targetOffX - cam.x) * 0.07;
        cam.y += (targetOffY - cam.y) * 0.07;
        clampCamera(cam);
      }

      // Sync zoom depuis state (pour rétrocompatibilité)
      cam.zoom = state.zoom;
      clampCamera(cam);

      render(ctx, state, cam);
      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [gameMode, sfxEnabled]); // eslint-disable-line

  // ─── Fin de tour ───
  const completeTurn = (state: GameState) => {
    const t1 = state.players[0], t2 = state.players[1];
    const p1Dead = t1.health <= 0, p2Dead = t2.health <= 0;
    if (p1Dead || p2Dead) {
      state.gameOver = true; state.firing = false;
      setFiring(false); setGameOver(true);
      if (p1Dead && p2Dead) setWinner('🤝 Égalité Spectaculaire !');
      else if (p1Dead)      setWinner('👑 Victoire du Général Rouge !');
      else                  setWinner('👑 Victoire du Commandant Bleu !');
      if (sfxEnabled) soundSystem.playVictory();
      forceUpdate(); return;
    }
    const next = state.currentPlayer === 0 ? 1 : 0;
    state.currentPlayer = next;
    state.firing = false;
    state.turnCount++;
    state.targetWind = generateWind();
    state.players[next].moveTimeLeft = getBaseMoveTime(state.players[next].faction);
    if (state.turnCount % 3 === 0 && state.crates.length < 3) {
      spawnCrate(state);
      if (sfxEnabled) soundSystem.playPowerup();
    }
    processTurnStart(state);
    setFiring(false); setCurrentPlayer(next); setWind(state.wind);
    setTurnCount(state.turnCount);
    setCurrentWeapon(state.players[next].currentWeapon);
    setP1Inventory({ ...state.players[0].inventory });
    setP2Inventory({ ...state.players[1].inventory });
    setMoveTimeLeft(state.players[next].moveTimeLeft);
    setIsAiTurn(state.gameMode === 'pve' && next === 1);
    // Recentrer sur le nouveau joueur actif
    cameraRef.current.manualOverride = false;
    cameraRef.current.manualTimer    = 0;
  };

  // ─── IA ───
  useEffect(() => {
    if (gameMode !== 'pve' || currentPlayer !== 1 || firing || gameOver) return;
    setIsAiTurn(true);
    const state = stateRef.current;
    const decision = aiCalculateDecision(state, aiDifficulty);
    let moveTime = 0;
    if (decision.moveDir !== 0) {
      const iv = setInterval(() => {
        moveTank(state, 1, decision.moveDir as -1 | 1);
        moveTime += 50;
        if (moveTime >= 800 || state.players[1].moveTimeLeft <= 0) clearInterval(iv);
      }, 50);
    }
    const aimDelay = decision.moveDir !== 0 ? 1200 : 600;
    aiTimerRef.current = window.setTimeout(() => {
      state.angle = decision.angle;
      state.power = decision.power;
      state.players[1].currentWeapon = decision.weapon;
      setAngle(decision.angle);
      setPower(decision.power);
      setCurrentWeapon(decision.weapon);
      const fireDelay = aiDifficulty === 'hard' ? 400 : aiDifficulty === 'medium' ? 700 : 1000;
      aiTimerRef.current = window.setTimeout(() => {
        if (decision.weapon === 'mine') {
          placeMine(state, 1);
          if (sfxEnabled) soundSystem.playClick();
          completeTurn(state);
        } else if (decision.weapon === 'airstrike' && decision.targetX !== undefined) {
          state.firing = true; setFiring(true);
          launchAirstrike(state, decision.targetX, 1);
          if (sfxEnabled) soundSystem.playFire('airstrike');
        } else {
          executeFire(decision.weapon);
        }
        setIsAiTurn(false);
      }, fireDelay);
    }, aimDelay);
    return () => { if (aiTimerRef.current) clearTimeout(aiTimerRef.current); };
  }, [currentPlayer, firing, gameOver, gameMode, aiDifficulty]); // eslint-disable-line

  // ─── Feu ───
  const executeFire = useCallback((weaponOverride?: WeaponType) => {
    const state = stateRef.current;
    const tank  = state.players[state.currentPlayer];
    const w     = weaponOverride || tank.currentWeapon;
    if (state.firing || state.gameOver) return;
    if (w !== 'standard' && tank.inventory[w] <= 0) { if (sfxEnabled) soundSystem.playClick(); return; }
    if (w === 'mine') { placeMine(state, state.currentPlayer); if (sfxEnabled) soundSystem.playClick(); completeTurn(state); return; }
    if (w !== 'standard') { tank.inventory[w]--; setP1Inventory({ ...state.players[0].inventory }); setP2Inventory({ ...state.players[1].inventory }); }
    state.firing = true;
    if (w === 'triple') {
      [-5, 0, 5].forEach((off, i) => {
        setTimeout(() => {
          const p = createProjectile(tank, state.angle + off, state.power, state.currentPlayer, w);
          state.projectiles.push(p);
        }, i * 150);
      });
    } else if (w === 'airstrike') {
      launchAirstrike(state, state.aimTargetX, state.currentPlayer);
    } else {
      state.projectiles.push(createProjectile(tank, state.angle, state.power, state.currentPlayer, w));
    }
    setFiring(true);
    if (sfxEnabled) soundSystem.playFire(w);
    // Réactiver suivi auto sur le projectile
    cameraRef.current.manualOverride = false;
  }, [sfxEnabled]); // eslint-disable-line

  // ─── Nouvelle Partie ───
  const startGame = (mode: GameMode, diff?: AiDifficulty) => {
    const d = diff || aiDifficulty;
    const fac1: TankFaction = setupP1Fac;
    const fac2: TankFaction = setupP2Fac;
    const skyVal: SkyTheme  = setupSky;

    stateRef.current = createInitialState(mode, d, fac1, fac2, skyVal);
    cameraRef.current = { x: 0, y: 0, zoom: 1, followX: 0, followY: 0, manualOverride: false, manualTimer: 0 };
    setGameMode(mode); setAiDifficulty(d); setSkyTheme(skyVal);
    setAngle(45); setPower(50); setFiring(false); setGameOver(false);
    setWinner(null); setCurrentPlayer(0);
    setP1Health(stateRef.current.players[0].health); setP1Shield(stateRef.current.players[0].shield);
    setP2Health(stateRef.current.players[1].health); setP2Shield(stateRef.current.players[1].shield);
    setTurnCount(1); setCurrentWeapon('standard');
    setWind(stateRef.current.wind); setMoveTimeLeft(stateRef.current.players[0].moveTimeLeft); setIsAiTurn(false);
    setP1Inventory(stateRef.current.players[0].inventory);
    setP2Inventory(stateRef.current.players[1].inventory);
    if (sfxEnabled) soundSystem.playClick();
  };
  const handleNewMatch = () => startGame(gameMode, aiDifficulty);

  const selectWeapon = useCallback((w: WeaponType) => {
    const state = stateRef.current;
    const tank  = state.players[state.currentPlayer];
    if (state.firing || state.gameOver) return;
    if (w !== 'standard' && tank.inventory[w] <= 0) return;
    setCurrentWeapon(w); tank.currentWeapon = w;
    if (sfxEnabled) soundSystem.playClick();
  }, [sfxEnabled]);

  // ─── Clavier ───
  useEffect(() => {
    const onDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      keysRef.current.add(key);

      if (gameMode === 'menu') return;
      const state = stateRef.current;
      const cam   = cameraRef.current;

      // Zoom clavier
      if (key === '+' || key === '=') { state.zoom = Math.min(2, state.zoom * 1.1); cam.zoom = state.zoom; }
      if (key === '-' || key === '_') { state.zoom = Math.max(0.5, state.zoom / 1.1); cam.zoom = state.zoom; }
      // Réinitialiser caméra
      if (key === 'home' || key === 'h') { cam.x = 0; cam.y = 0; cam.zoom = 1; state.zoom = 1; cam.manualOverride = false; }

      if (state.firing || state.gameOver) return;

      // Angle & puissance
      if (key === 'arrowup'   && !keysRef.current.has('control')) { e.preventDefault(); setAngle(a => Math.min(90, a + 2)); }
      if (key === 'arrowdown' && !keysRef.current.has('control')) { e.preventDefault(); setAngle(a => Math.max(0, a - 2)); }
      if (key === 'w') setAngle(a => Math.min(90, a + 2));
      if (key === 's') setAngle(a => Math.max(0, a - 2));
      if (key === 'q' || key === 'pageup')   setPower(p => Math.min(100, p + 5));
      if (key === 'e' || key === 'pagedown') setPower(p => Math.max(10,  p - 5));
      // Feu
      if (key === ' ' || key === 'enter') { e.preventDefault(); executeFire(); }
      // Sélection arme
      const wmap: Record<string, WeaponType> = {
        '1':'standard','2':'bertha','3':'cluster','4':'nuke',
        '5':'bouncing','6':'drill','7':'sniper','8':'triple',
        '9':'airstrike','0':'teleport','-':'mine',
        'z':'napalm','x':'railgun','c':'seeker','v':'quake',
      };
      if (wmap[key]) selectWeapon(wmap[key]);
      if (key === 'tab') {
        e.preventDefault();
        const list: WeaponType[] = ['standard','bertha','cluster','nuke','bouncing','drill','sniper','triple','airstrike','teleport','mine','napalm','railgun','seeker','quake'];
        const idx = list.indexOf(currentWeapon);
        selectWeapon(list[(idx + 1) % list.length]);
      }
    };
    const onUp = (e: KeyboardEvent) => { keysRef.current.delete(e.key.toLowerCase()); };
    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup',   onUp);
    return () => { window.removeEventListener('keydown', onDown); window.removeEventListener('keyup', onUp); };
  }, [gameMode, currentWeapon, firing, gameOver, sfxEnabled, executeFire, selectWeapon]);

  // ─── Souris ───
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || gameMode === 'menu') return;

    const cpx = (e: MouseEvent) => getCanvasPx(e.clientX, e.clientY);

    const onDown = (e: MouseEvent) => {
      e.preventDefault();
      const cp = cpx(e);

      // Clic droit ou milieu → panoramique
      if (e.button === 1 || e.button === 2) {
        panDragRef.current = { active: true, sx: cp.x, sy: cp.y, lastX: cp.x, lastY: cp.y };
        return;
      }
      if (e.button !== 0) return;

      const state = stateRef.current;
      if (state.firing || state.gameOver) return;

      const wp   = canvasToWorld(cp.x, cp.y);
      const tank = state.players[state.currentPlayer];

      // Airstrike : clic gauche = repositionner la cible
      if (tank.currentWeapon === 'airstrike') {
        state.aimTargetX = Math.max(50, Math.min(CANVAS_WIDTH - 50, wp.x));
        return;
      }

      // Mode Angry Birds vs Mode Viseur Vectoriel Réticule
      if (aimMode === 'slingshot') {
        const dist = Math.hypot(wp.x - tank.x, wp.y - (tank.y - 20));
        if (dist < 90) {
          aimDragRef.current = { active: true, sx: wp.x, sy: wp.y, cx: wp.x, cy: wp.y };
        } else {
          panDragRef.current = { active: true, sx: cp.x, sy: cp.y, lastX: cp.x, lastY: cp.y };
        }
      } else {
        // En mode Réticule Curseur, un simple clic gauche tire exactement vers ce pointeur !
        const dx  = wp.x - tank.x;
        const dy  = (tank.y - 20) - wp.y;
        const dir = stateRef.current.currentPlayer === 0 ? 1 : -1;
        let ang   = (Math.atan2(dy, dx * dir) * 180) / Math.PI;
        ang = Math.max(0, Math.min(90, ang));
        const dist = Math.hypot(dx, dy);
        setPower(Math.min(100, Math.max(10, Math.round(dist / 3.5))));
        setAngle(Math.round(ang));
        executeFire();
      }
    };

    const onMove = (e: MouseEvent) => {
      const cp  = cpx(e);
      const cam = cameraRef.current;

      // Panoramique
      if (panDragRef.current?.active) {
        const dx = cp.x - panDragRef.current.lastX;
        const dy = cp.y - panDragRef.current.lastY;
        cam.x -= dx / cam.zoom;
        cam.y -= dy / cam.zoom;
        panDragRef.current.lastX = cp.x;
        panDragRef.current.lastY = cp.y;
        clampCamera(cam);
        cam.manualOverride = true;
        cam.manualTimer    = 240; // 4 s de suspension du suivi auto
        return;
      }

      // Écran Bordures (Edge Scrolling)
      const EDGE_DIST = 28;
      const EDGE_SPD  = 7 / cam.zoom;
      let edgePan = false;
      if (cp.x < EDGE_DIST)                  { cam.x -= EDGE_SPD; edgePan = true; }
      if (cp.x > CANVAS_WIDTH - EDGE_DIST)   { cam.x += EDGE_SPD; edgePan = true; }
      if (cp.y < EDGE_DIST)                  { cam.y -= EDGE_SPD; edgePan = true; }
      if (cp.y > CANVAS_HEIGHT - EDGE_DIST)  { cam.y += EDGE_SPD; edgePan = true; }
      if (edgePan) { clampCamera(cam); cam.manualOverride = true; cam.manualTimer = 180; }

      // Mode Réticule Curseur Vectoriel : si la souris bouge sans clic, on pointe instantanément le fût vers le pointeur
      if (aimMode === 'cursor' && !stateRef.current.firing && !stateRef.current.gameOver) {
        const wp   = canvasToWorld(cp.x, cp.y);
        const tank = stateRef.current.players[stateRef.current.currentPlayer];
        const dx   = wp.x - tank.x;
        const dy   = (tank.y - 20) - wp.y;
        const dir  = stateRef.current.currentPlayer === 0 ? 1 : -1;
        let ang    = (Math.atan2(dy, dx * dir) * 180) / Math.PI;
        ang = Math.max(0, Math.min(90, ang));
        const dist = Math.hypot(dx, dy);
        setPower(Math.min(100, Math.max(10, Math.round(dist / 3.5))));
        setAngle(Math.round(ang));
        return;
      }

      // Viser en mode Slingshot
      if (!aimDragRef.current?.active) return;
      const wp   = canvasToWorld(cp.x, cp.y);
      aimDragRef.current.cx = wp.x;
      aimDragRef.current.cy = wp.y;
      const tank = stateRef.current.players[stateRef.current.currentPlayer];
      const dx   = wp.x - tank.x;
      const dy   = (tank.y - 20) - wp.y;
      const dir  = stateRef.current.currentPlayer === 0 ? 1 : -1;
      let ang    = (Math.atan2(dy, dx * dir) * 180) / Math.PI;
      ang = Math.max(0, Math.min(90, ang));
      const dist = Math.hypot(dx, dy);
      setPower(Math.min(100, Math.max(10, Math.round(dist / 3.5))));
      setAngle(Math.round(ang));
    };

    const onUp = (_e: MouseEvent) => {
      if (panDragRef.current?.active) { panDragRef.current = null; return; }
      if (!aimDragRef.current?.active) { aimDragRef.current = null; return; }
      const drag = aimDragRef.current;
      aimDragRef.current = null;
      const dist = Math.hypot(drag.cx - drag.sx, drag.cy - drag.sy);
      if (dist > 12) executeFire();
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const state  = stateRef.current;
      const cam    = cameraRef.current;
      const cp     = getCanvasPx(e.clientX, e.clientY);
      const factor = e.deltaY > 0 ? 0.88 : 1.14;
      const newZ   = Math.max(0.4, Math.min(2.5, cam.zoom * factor));
      // Zoom centré sur le pointeur
      const wx = (cp.x - CANVAS_WIDTH  / 2) / cam.zoom;
      const wy = (cp.y - CANVAS_HEIGHT / 2) / cam.zoom;
      cam.x   += wx * (1 - newZ / cam.zoom);
      cam.y   += wy * (1 - newZ / cam.zoom);
      cam.zoom = newZ; state.zoom = newZ;
      clampCamera(cam);
      cam.manualOverride = true; cam.manualTimer = 180;
    };

    canvas.addEventListener('mousedown',    onDown);
    canvas.addEventListener('mousemove',    onMove);
    canvas.addEventListener('mouseup',      onUp);
    canvas.addEventListener('wheel',        onWheel, { passive: false });
    canvas.addEventListener('contextmenu',  e => e.preventDefault());
    return () => {
      canvas.removeEventListener('mousedown',   onDown);
      canvas.removeEventListener('mousemove',   onMove);
      canvas.removeEventListener('mouseup',     onUp);
      canvas.removeEventListener('wheel',       onWheel);
      canvas.removeEventListener('contextmenu', e => e.preventDefault());
    };
  }, [gameMode, currentWeapon, getCanvasPx, canvasToWorld, executeFire]);

  // ─── Tactile ───
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || gameMode === 'menu') return;

    const getTP = (t: Touch) => getCanvasPx(t.clientX, t.clientY);
    const getTouchDist = (tl: TouchList) => Math.hypot(tl[0].clientX - tl[1].clientX, tl[0].clientY - tl[1].clientY);
    const getTouchMid  = (tl: TouchList) => ({
      x: (tl[0].clientX + tl[1].clientX) / 2,
      y: (tl[0].clientY + tl[1].clientY) / 2,
    });

    const onStart = (e: TouchEvent) => {
      e.preventDefault();

      // Pinch (zoom + pan 2 doigts)
      if (e.touches.length === 2) {
        pinchRef.current   = { dist: getTouchDist(e.touches), zoom: cameraRef.current.zoom };
        aimDragRef.current = null;
        panDragRef.current = null;
        const mid = getTouchMid(e.touches);
        const cp  = getCanvasPx(mid.x, mid.y);
        panDragRef.current = { active: true, sx: cp.x, sy: cp.y, lastX: cp.x, lastY: cp.y };
        return;
      }
      if (e.touches.length !== 1) return;

      const cp   = getTP(e.touches[0]);
      const wp   = canvasToWorld(cp.x, cp.y);
      touchStartRef.current = { x: cp.x, y: cp.y, time: Date.now() };

      const state = stateRef.current;
      if (state.firing || state.gameOver) return;
      const tank = state.players[state.currentPlayer];

      if (tank.currentWeapon === 'airstrike') {
        state.aimTargetX = Math.max(50, Math.min(CANVAS_WIDTH - 50, wp.x));
        return;
      }
      const dist = Math.hypot(wp.x - tank.x, wp.y - (tank.y - 20));
      if (dist < 110) {
        aimDragRef.current = { active: true, sx: wp.x, sy: wp.y, cx: wp.x, cy: wp.y };
      } else {
        panDragRef.current = { active: true, sx: cp.x, sy: cp.y, lastX: cp.x, lastY: cp.y };
      }
    };

    const onMove = (e: TouchEvent) => {
      e.preventDefault();
      const cam = cameraRef.current;

      // Pinch zoom
      if (e.touches.length === 2 && pinchRef.current) {
        const newDist = getTouchDist(e.touches);
        const ratio   = newDist / Math.max(1, pinchRef.current.dist);
        cam.zoom = Math.max(0.4, Math.min(2.5, pinchRef.current.zoom * ratio));
        stateRef.current.zoom = cam.zoom;
        // Pan par le centre des deux doigts
        const mid = getTouchMid(e.touches);
        const cp  = getCanvasPx(mid.x, mid.y);
        if (panDragRef.current) {
          cam.x -= (cp.x - panDragRef.current.lastX) / cam.zoom;
          cam.y -= (cp.y - panDragRef.current.lastY) / cam.zoom;
          panDragRef.current.lastX = cp.x;
          panDragRef.current.lastY = cp.y;
        }
        clampCamera(cam); cam.manualOverride = true; cam.manualTimer = 240;
        return;
      }
      if (e.touches.length !== 1) return;

      const cp = getTP(e.touches[0]);

      // Pan 1 doigt si panDrag
      if (panDragRef.current?.active) {
        cam.x -= (cp.x - panDragRef.current.lastX) / cam.zoom;
        cam.y -= (cp.y - panDragRef.current.lastY) / cam.zoom;
        panDragRef.current.lastX = cp.x;
        panDragRef.current.lastY = cp.y;
        clampCamera(cam); cam.manualOverride = true; cam.manualTimer = 240;
        return;
      }

      // Viser
      if (!aimDragRef.current?.active) return;
      const wp   = canvasToWorld(cp.x, cp.y);
      aimDragRef.current.cx = wp.x;
      aimDragRef.current.cy = wp.y;
      const tank = stateRef.current.players[stateRef.current.currentPlayer];
      const dx   = wp.x - tank.x;
      const dy   = (tank.y - 20) - wp.y;
      const dir  = stateRef.current.currentPlayer === 0 ? 1 : -1;
      let ang    = (Math.atan2(dy, dx * dir) * 180) / Math.PI;
      ang = Math.max(0, Math.min(90, ang));
      const dist = Math.hypot(dx, dy);
      setPower(Math.min(100, Math.max(10, Math.round(dist / 3))));
      setAngle(Math.round(ang));
    };

    const onEnd = (e: TouchEvent) => {
      if (e.touches.length < 2) pinchRef.current = null;
      if (e.touches.length === 0) {
        if (panDragRef.current) { panDragRef.current = null; }
        const start = touchStartRef.current;
        touchStartRef.current = null;
        if (!aimDragRef.current?.active) return;
        const drag = aimDragRef.current;
        aimDragRef.current = null;
        const dist = Math.hypot(drag.cx - drag.sx, drag.cy - drag.sy);
        if (dist > 12) executeFire();
        else if (start && Date.now() - start.time < 250) {
          // Tap court → passer directement en mode viser + feu ? (optionnel)
        }
      }
    };

    canvas.addEventListener('touchstart', onStart, { passive: false });
    canvas.addEventListener('touchmove',  onMove,  { passive: false });
    canvas.addEventListener('touchend',   onEnd);
    return () => {
      canvas.removeEventListener('touchstart', onStart);
      canvas.removeEventListener('touchmove',  onMove);
      canvas.removeEventListener('touchend',   onEnd);
    };
  }, [gameMode, currentWeapon, getCanvasPx, canvasToWorld, executeFire]);

  // ─── Sync UI ───
  useEffect(() => {
    const iv = setInterval(() => {
      const s = stateRef.current;
      if (s.players[0].health !== p1Health) setP1Health(s.players[0].health);
      if (s.players[0].shield !== p1Shield) setP1Shield(s.players[0].shield);
      if (s.players[1].health !== p2Health) setP2Health(s.players[1].health);
      if (s.players[1].shield !== p2Shield) setP2Shield(s.players[1].shield);
      if (s.wind !== wind) setWind(s.wind);
      if (s.players[s.currentPlayer].moveTimeLeft !== moveTimeLeft) setMoveTimeLeft(s.players[s.currentPlayer].moveTimeLeft);
    }, 100);
    return () => clearInterval(iv);
  }, [p1Health, p1Shield, p2Health, p2Shield, wind, moveTimeLeft]);

  const activeTank = gameMode !== 'menu' ? stateRef.current.players[currentPlayer] : null;
  const windDir    = wind >= 0 ? '→' : '←';
  const windStr    = Math.abs(wind * 100).toFixed(1);

  // ─── MENU ───
  if (gameMode === 'menu') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950 flex flex-col items-center justify-center p-6 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          {Array.from({ length: 18 }).map((_, i) => (
            <div key={i} className="absolute rounded-full bg-amber-400 animate-pulse" style={{
              left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%`,
              width: `${4 + Math.random() * 8}px`, height: `${4 + Math.random() * 8}px`,
              animationDelay: `${Math.random() * 3}s`, animationDuration: `${2 + Math.random() * 3}s`,
            }} />
          ))}
        </div>
        <div className="relative z-10 text-center max-w-2xl w-full">
          <div className="mb-2 text-6xl animate-bounce">💥</div>
          <h1 className="text-5xl md:text-7xl font-black tracking-tight bg-gradient-to-r from-amber-400 via-orange-400 to-red-500 bg-clip-text text-transparent mb-3">
            Terre Brûlée
          </h1>
          <p className="text-xl text-slate-300 font-semibold mb-1">Simulation de combat blindé destructible</p>
          <p className="text-amber-400 font-bold text-lg mb-8">🎖️ Créé par Geoffroy</p>

          <div className="space-y-3 mb-8">
            <p className="text-slate-400 text-sm mb-4">Choisissez votre mode de combat :</p>
            <button onClick={() => startGame('pvp')} className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-xl rounded-xl shadow-lg shadow-blue-600/30 transform transition hover:scale-[1.02] active:scale-95">
              👥 1 contre 1 — Local
            </button>
            <div className="grid grid-cols-3 gap-3">
              <button onClick={() => startGame('pve', 'easy')}   className="py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-bold rounded-xl shadow-lg transition hover:scale-[1.02]">🤖 IA Facile</button>
              <button onClick={() => startGame('pve', 'medium')} className="py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-bold rounded-xl shadow-lg transition hover:scale-[1.02]">🤖 IA Moyen</button>
              <button onClick={() => startGame('pve', 'hard')}   className="py-3 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold rounded-xl shadow-lg transition hover:scale-[1.02]">🤖 IA Difficile</button>
            </div>
          </div>

          <div className="bg-slate-900/80 border border-slate-700 rounded-xl p-4 text-left text-sm text-slate-300 space-y-1.5">
            <p className="font-bold text-amber-400 mb-2">🎮 Contrôles :</p>
            <p>• <b className="text-white">Clic gauche sur le char + glisser</b> → viser &amp; régler la puissance</p>
            <p>• <b className="text-white">Clic droit / milieu + glisser</b> → déplacer la vue (panoramique)</p>
            <p>• <b className="text-white">Molette</b> → zoom centré sur le curseur</p>
            <p>• <b className="text-white">Clic gauche ailleurs</b> → panoramique aussi</p>
            <p>• <b className="text-white">Clavier W/S</b> → angle • <b className="text-white">Q/E</b> → puissance</p>
            <p>• <b className="text-white">A / D</b> → déplacer le char • <b className="text-white">ESPACE</b> → feu</p>
            <p>• <b className="text-white">J/L/I/K</b> → panoramique clavier • <b className="text-white">H</b> → recentrer</p>
            <p>• <b className="text-white">+ / -</b> → zoom clavier • <b className="text-white">1-9, Z/X/C/V</b> → armes</p>
            <p>• <b className="text-white">Tactile :</b> 1 doigt sur le char = viser • 1 doigt ailleurs = panoramique • 2 doigts = pincer/zoomer + panoramique</p>
          </div>

          <button
            onClick={() => setShowInfo(true)}
            className="mt-4 text-slate-500 text-xs underline decoration-dotted hover:text-slate-300 transition-colors cursor-pointer"
          >
            ℹ️ Comment ce jeu a été fait
          </button>
        </div>

        {showInfo && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4" onClick={() => setShowInfo(false)}>
            <div className="w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl" onClick={e => e.stopPropagation()}>
              <div className="p-6 space-y-3.5 text-sm leading-relaxed text-slate-300">
                <h3 className="text-xl font-black bg-gradient-to-r from-amber-400 via-orange-400 to-red-500 bg-clip-text text-transparent">Comment ce jeu a été fait</h3>
                <p><strong className="text-white">Stack :</strong> React 19, TypeScript 5.9, Tailwind CSS 4, Vite 7, compilé en un seul fichier HTML, aucune dépendance chargée depuis l'extérieur.</p>
                <p><strong className="text-white">Graphismes :</strong> tout est dessiné en Canvas 2D à chaque image (terrain, chars, projectiles, ciel selon le thème choisi), aucun sprite ni image externe.</p>
                <p><strong className="text-white">Musique &amp; sons :</strong> synthétisés en direct avec l'API Web Audio, aucun fichier audio chargé.</p>
                <p><strong className="text-white">Interactions :</strong> glisser depuis son char pour viser et régler la puissance, glisser ailleurs pour déplacer la vue, molette ou pincement tactile pour zoomer, raccourcis clavier complets (déplacement, angle, puissance, armes, tir).</p>
                <p><strong className="text-white">Architecture :</strong> logique de jeu pure (<code>game.ts</code>) et rendu Canvas (<code>renderer.ts</code>) dans des modules séparés, 4 factions aux caractéristiques différentes (dont une plus mobile), IA à 3 niveaux de difficulté.</p>
                <p><strong className="text-white">Algorithmes notables :</strong> le terrain est une simple courbe de hauteurs par colonne, chaque explosion creuse un cratère circulaire en relevant la hauteur des colonnes touchées. 15 armes aux effets différents (rebond, forage, tir groupé, frappe aérienne, téléportation...), chacune avec son propre rayon d'explosion.</p>
              </div>
              <div className="border-t border-slate-800 p-4 text-center">
                <button onClick={() => setShowInfo(false)} className="px-6 py-2.5 rounded-xl font-black text-white bg-gradient-to-r from-amber-500 to-red-500 hover:brightness-110 active:scale-95 transition-all">Fermer</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ─── JEU ───
  return (
    <div className="min-h-screen bg-slate-950 p-2 md:p-4 text-white font-sans flex flex-col selection:bg-amber-500 selection:text-black">
      <div className="max-w-7xl mx-auto w-full flex-1 flex flex-col">

        {/* Header */}
        <div className="flex flex-col md:flex-row items-center justify-between pb-3 border-b border-slate-800 mb-3 gap-3">
          <div className="text-center md:text-left">
            <h1 className="text-3xl md:text-4xl font-black tracking-tight bg-gradient-to-r from-amber-400 via-orange-400 to-red-500 bg-clip-text text-transparent">
              🎯 Terre Brûlée
            </h1>
            <p className="text-slate-400 text-xs mt-1">
              {gameMode === 'pvp' ? '👥 Mode 1v1 Local' : `🤖 Mode vs IA (${aiDifficulty === 'easy' ? 'Facile' : aiDifficulty === 'medium' ? 'Moyen' : 'Difficile'})`}
              {' • '}<span className="text-amber-400 font-semibold">Créé par Geoffroy</span>
            </p>
          </div>
          <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-800 p-2 rounded-xl flex-wrap justify-center">
            <select value={skyTheme} onChange={e => setSkyTheme(e.target.value as typeof skyTheme)} className="bg-slate-800 text-xs font-bold text-slate-200 rounded-lg px-2 py-2 border border-slate-700 outline-none cursor-pointer">
              <option value="sunset">🌅 Coucher de Soleil</option>
              <option value="day">☀️ Jour</option>
              <option value="night">🌌 Nuit Étoilée</option>
              <option value="emerald">🪨 Planète Émeraude</option>
              <option value="rain">🌧️ Pluie Battante</option>
              <option value="snow">❄️ Neige</option>
            </select>
            <button
              onClick={() => { cameraRef.current.x = 0; cameraRef.current.y = 0; cameraRef.current.zoom = 1; stateRef.current.zoom = 1; cameraRef.current.manualOverride = false; }}
              className="px-2 py-2 rounded-lg text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition" title="Recentrer la vue (H)">
              🎯 Recentrer
            </button>
            <button onClick={() => { setSfxEnabled(!sfxEnabled); soundSystem.playClick(); }} className={`px-2 py-2 rounded-lg text-xs font-bold ${sfxEnabled ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'}`}>{sfxEnabled ? '🔊' : '🔇'}</button>
            <button onClick={() => { setMusicEnabled(!musicEnabled); soundSystem.playClick(); }} className={`px-2 py-2 rounded-lg text-xs font-bold ${musicEnabled ? 'bg-amber-500 text-black' : 'bg-slate-800 text-slate-400'}`}>{musicEnabled ? '🎵' : '🎧'}</button>
            <button onClick={() => setGameMode('menu')} className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-lg border border-slate-700 transition">🏠 Menu</button>
          </div>
        </div>

        {/* Barres de vie */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-4 mb-3 items-center">
          <div className={`rounded-xl p-3 bg-gradient-to-r from-blue-950/60 to-slate-900/60 border-2 transition-all ${currentPlayer === 0 && !firing ? 'border-amber-400 shadow-lg' : 'border-blue-500/30 opacity-80'}`}>
            <div className="flex justify-between mb-1">
              <span className="font-black text-blue-300">Commandant Bleu</span>
              {currentPlayer === 0 && !firing && !gameOver && <span className="text-xs bg-amber-400 text-black px-2 py-0.5 rounded-full font-black animate-pulse">À VOUS</span>}
            </div>
            <div className="h-3 bg-black/40 rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-300" style={{ width: `${p1Health}%` }} /></div>
            <div className="text-right text-xs mt-1 text-blue-100 font-mono">{p1Health} PV {p1Shield > 0 && <span className="text-purple-300">+ {p1Shield} 🛡️</span>}</div>
          </div>

          <div className="flex flex-col items-center justify-center bg-slate-900/80 border border-slate-800 py-2 px-4 rounded-xl">
            <span className="text-xs tracking-widest font-black text-slate-400">TOUR #{turnCount}</span>
            <div className="text-lg font-black">
              {gameOver ? <span className="text-amber-400">{winner}</span>
                : <span>Armée <span className={currentPlayer === 0 ? 'text-blue-400' : 'text-red-400'}>{currentPlayer === 0 ? 'Bleue' : 'Rouge'}</span></span>}
            </div>
            {isAiTurn && <span className="text-xs text-amber-400 animate-pulse">🤖 L'IA réfléchit...</span>}
          </div>

          <div className={`rounded-xl p-3 bg-gradient-to-r from-slate-900/60 to-red-950/60 border-2 transition-all ${currentPlayer === 1 && !firing ? 'border-amber-400 shadow-lg' : 'border-red-500/30 opacity-80'}`}>
            <div className="flex justify-between mb-1">
              {currentPlayer === 1 && !firing && !gameOver && <span className="text-xs bg-amber-400 text-black px-2 py-0.5 rounded-full font-black animate-pulse">À VOUS</span>}
              <span className="font-black text-red-300 ml-auto">Général Rouge</span>
            </div>
            <div className="h-3 bg-black/40 rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-red-600 to-orange-500 transition-all duration-300 ml-auto" style={{ width: `${p2Health}%` }} /></div>
            <div className="text-right text-xs mt-1 text-red-100 font-mono">{p2Health} PV {p2Shield > 0 && <span className="text-purple-300">+ {p2Shield} 🛡️</span>}</div>
          </div>
        </div>

        {/* Canvas — ratio fixe 1000×550 */}
        <div className="relative w-full rounded-xl overflow-hidden border-2 border-slate-700 shadow-2xl bg-black"
          style={{ aspectRatio: `${CANVAS_WIDTH} / ${CANVAS_HEIGHT}` }}>
          <canvas
            ref={canvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            className="absolute inset-0 block w-full h-full touch-none select-none"
            style={{ cursor: panDragRef.current?.active ? 'grabbing' : 'crosshair' }}
          />

          {/* Victoire overlay */}
          {gameOver && (
            <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center backdrop-blur-md p-4 text-center">
              <div className="w-20 h-20 bg-amber-400/10 rounded-full flex items-center justify-center mb-4 border border-amber-400/30"><span className="text-5xl">🏆</span></div>
              <h2 className="text-4xl md:text-5xl font-black text-white mb-2">BATAILLE TERMINÉE</h2>
              <p className="text-2xl font-extrabold bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent mb-6">{winner}</p>
              <div className="flex gap-3">
                <button onClick={handleNewMatch} className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-black font-black rounded-xl shadow-xl hover:scale-105 transition">⚔️ Rejouer</button>
                <button onClick={() => setGameMode('menu')} className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-xl transition">🏠 Menu</button>
              </div>
            </div>
          )}

          {/* Overlay mobile : boutons de déplacement du char + feu */}
          <div className="absolute bottom-2 left-2 right-2 flex justify-between items-end pointer-events-none md:hidden">
            <div className="flex gap-2 pointer-events-auto">
              <button onPointerDown={() => keysRef.current.add('a')}    onPointerUp={() => keysRef.current.delete('a')}    onPointerLeave={() => keysRef.current.delete('a')}    className="w-14 h-14 bg-slate-800/90 border border-slate-600 rounded-xl text-xl font-bold active:bg-slate-700 select-none">⬅️</button>
              <button onPointerDown={() => keysRef.current.add('d')}    onPointerUp={() => keysRef.current.delete('d')}    onPointerLeave={() => keysRef.current.delete('d')}    className="w-14 h-14 bg-slate-800/90 border border-slate-600 rounded-xl text-xl font-bold active:bg-slate-700 select-none">➡️</button>
            </div>
            <div className="flex gap-2 pointer-events-auto">
              <button onClick={() => executeFire()} disabled={firing || gameOver} className="w-16 h-16 bg-gradient-to-br from-red-600 to-orange-600 rounded-full text-xl font-black shadow-lg active:scale-90 transition disabled:opacity-50 select-none">🔥</button>
            </div>
          </div>
        </div>

        {/* Panneau de contrôle */}
        <div className="mt-3 rounded-xl bg-slate-900/95 border border-slate-800 p-3 md:p-4 shadow-2xl">

          {/* Arsenal */}
          <div className="mb-3 pb-3 border-b border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-black tracking-widest text-slate-400">ARSENAL ({currentPlayer === 0 ? 'Bleu' : 'Rouge'}) :</span>
              <div className="flex gap-2">
                <button onClick={() => { spawnCrate(stateRef.current); if (sfxEnabled) soundSystem.playPowerup(); }} className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold px-2 py-1 rounded-lg border border-slate-700 transition">🪂 Caisse</button>
                {activeTank && moveTimeLeft > 0 && !firing && (
                  <span className="text-xs bg-green-900/80 text-green-300 font-bold px-2 py-1 rounded-lg border border-green-700 animate-pulse">
                    ⏱️ Dépl. : {moveTimeLeft.toFixed(1)}s
                  </span>
                )}
              </div>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-8 gap-1.5">
              {(Object.keys(WEAPONS) as WeaponType[]).map((wKey) => {
                const w = WEAPONS[wKey];
                const invCount = currentPlayer === 0 ? p1Inventory[wKey] : p2Inventory[wKey];
                const isSel = currentWeapon === wKey;
                const avail = invCount !== 0;
                return (
                  <button key={wKey} onClick={() => selectWeapon(wKey)} disabled={!avail || firing || gameOver}
                    className={`p-1.5 rounded-lg border flex flex-col text-left transition-all ${isSel ? 'bg-amber-500/15 border-amber-400 ring-1 ring-amber-400/50' : !avail ? 'bg-slate-950/60 border-slate-900 opacity-40 cursor-not-allowed' : 'bg-slate-800/80 hover:bg-slate-800 border-slate-700'}`}>
                    <div className="flex items-center justify-between w-full mb-0.5">
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: w.color }} />
                      <span className={`text-[9px] font-mono font-bold px-1 py-0.5 rounded ml-1 ${invCount === -1 ? 'bg-slate-700 text-slate-300' : invCount > 0 ? 'bg-indigo-900/80 text-indigo-200' : 'bg-red-950 text-red-300'}`}>
                        {invCount === -1 ? '∞' : `${invCount}x`}
                      </span>
                    </div>
                    <span className={`font-bold text-[10px] leading-tight ${isSel ? 'text-amber-300' : 'text-slate-200'}`}>{w.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sliders & Feu */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
            <div className="md:col-span-4 space-y-1 bg-slate-950/50 p-3 rounded-xl border border-slate-800/80">
              <div className="flex justify-between text-sm">
                <label className="font-bold text-slate-300">📐 Angle</label>
                <span className="font-mono text-xl font-black text-amber-400">{angle}°</span>
              </div>
              <input type="range" min="0" max="90" step="1" value={angle} onChange={e => setAngle(+e.target.value)} disabled={firing || gameOver}
                className="w-full h-2.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500 disabled:opacity-40" />
              <div className="flex justify-between text-[10px] text-slate-500 font-bold"><span>0°</span><span>45°</span><span>90°</span></div>
            </div>

            <div className="md:col-span-4 space-y-1 bg-slate-950/50 p-3 rounded-xl border border-slate-800/80">
              <div className="flex justify-between text-sm">
                <label className="font-bold text-slate-300">⚡ Puissance</label>
                <span className="font-mono text-xl font-black text-orange-400">{power}%</span>
              </div>
              <input type="range" min="10" max="100" step="1" value={power} onChange={e => setPower(+e.target.value)} disabled={firing || gameOver}
                className="w-full h-2.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-orange-500 disabled:opacity-40" />
              <div className="flex justify-between text-[10px] text-slate-500 font-bold"><span>10%</span><span>50%</span><span>100%</span></div>
            </div>

            <div className="md:col-span-2 bg-slate-900/60 rounded-lg p-2 text-center border border-slate-700">
              <div className="text-xs text-slate-400 mb-1">VENT</div>
              <div className="flex items-center justify-center gap-2">
                <span className="text-2xl">{windDir}</span>
                <span className="font-mono font-bold text-lg text-sky-300">{windStr}</span>
              </div>
            </div>

            <div className="md:col-span-2 flex gap-2">
              <button onClick={() => executeFire()} disabled={firing || gameOver || (!!activeTank && activeTank.inventory[currentWeapon] === 0)}
                className="flex-1 py-3 bg-gradient-to-br from-red-600 via-orange-600 to-amber-600 hover:from-red-500 hover:to-amber-500 disabled:from-slate-700 disabled:to-slate-700 disabled:text-slate-600 text-white font-black text-lg rounded-xl shadow-lg transform transition active:scale-95 tracking-wider">
                🔥 FEU !
              </button>
            </div>
          </div>

          <div className="mt-2 pt-2 border-t border-slate-800 text-[10px] text-slate-400 flex flex-col sm:flex-row justify-between gap-1">
            <span>💡 <b className="text-amber-400">Sur le char</b> = viser • <b className="text-amber-400">Ailleurs / clic droit</b> = déplacer la vue • <b className="text-amber-400">Molette</b> = zoom • <b className="text-amber-400">H</b> = recentrer • <b className="text-amber-400">J/L/I/K</b> = panoramique</span>
            <span className="font-mono text-slate-500">A/D char • 1-9 armes • Tab cycle • Espace feu</span>
          </div>
        </div>

      </div>
    </div>
  );
}
