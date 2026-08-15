import React, { useEffect, useRef, useState, useCallback } from 'react';
import { AtmosphereTheme } from '../types';
import { soundSynth } from '../services/audioSynth';

interface NightSceneCanvasProps {
  atmosphere: AtmosphereTheme;
  isPlaying: boolean;
  onCatClick?: () => void;
  onTreeClick?: () => void;
  reducedMotion?: boolean;
}

interface FallingLeaf {
  x: number;
  y: number;
  z: number; // 0: background, 1: midground, 2: foreground
  vx: number;
  vy: number;
  angle: number;
  vAngle: number;
  size: number;
  color: string;
  wobble: number;
  wobbleSpeed: number;
  opacity: number;
}

interface Firefly {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  alpha: number;
  alphaSpeed: number;
  baseColor: string;
  glowColor: string;
}

interface Star {
  x: number;
  y: number;
  size: number;
  alpha: number;
  twinkleSpeed: number;
  color: string;
}

interface RainDrop {
  x: number;
  y: number;
  length: number;
  speed: number;
  alpha: number;
}

interface Ripple {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  alpha: number;
}

export const NightSceneCanvas: React.FC<NightSceneCanvasProps> = ({
  atmosphere,
  isPlaying,
  onCatClick,
  onTreeClick,
  reducedMotion = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Interaction & animation states
  const [catAwakeProgress, setCatAwakeProgress] = useState(0);
  const [catIsPurring, setCatIsPurring] = useState(false);
  const [treeClickRipple, setTreeClickRipple] = useState(0);

  // Parallax offsets
  const mousePosRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });

  // Entity storage refs
  const leavesRef = useRef<FallingLeaf[]>([]);
  const firefliesRef = useRef<Firefly[]>([]);
  const starsRef = useRef<Star[]>([]);
  const rainRef = useRef<RainDrop[]>([]);
  const ripplesRef = useRef<Ripple[]>([]);
  const timeRef = useRef(0);
  const catAwakeRef = useRef(0);

  // Person micro-animation states
  const personAnimRef = useRef({
    headTilt: 0,
    footTap: 0,
    phoneGlance: 0,
    postureShift: 0,
    breath: 0,
  });

  // Cat micro-animation states
  const catAnimRef = useRef({
    earTwitch: 0,
    tailAngle: 0,
    stretch: 0,
    blink: 0,
    breath: 0,
  });

  // Spawn initial stars
  const initStars = useCallback((width: number, height: number) => {
    const stars: Star[] = [];
    const count = Math.floor((width * height) / 4500);
    const starColors = ['#ffffff', '#e0e7ff', '#fef3c7', '#c7d2fe', '#bae6fd'];

    for (let i = 0; i < count; i++) {
      stars.push({
        x: Math.random() * width,
        y: Math.random() * (height * 0.65),
        size: Math.random() * 1.8 + 0.5,
        alpha: Math.random() * 0.8 + 0.2,
        twinkleSpeed: Math.random() * 0.03 + 0.008,
        color: starColors[Math.floor(Math.random() * starColors.length)],
      });
    }
    starsRef.current = stars;
  }, []);

  // Spawn fireflies
  const initFireflies = useCallback((width: number, height: number, count: number) => {
    const fireflies: Firefly[] = [];
    for (let i = 0; i < count; i++) {
      fireflies.push({
        x: width * 0.2 + Math.random() * (width * 0.75),
        y: height * 0.35 + Math.random() * (height * 0.55),
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        radius: Math.random() * 2.2 + 1.2,
        alpha: Math.random(),
        alphaSpeed: Math.random() * 0.04 + 0.015,
        baseColor: '#fef08a',
        glowColor: 'rgba(250, 204, 21, 0.4)',
      });
    }
    firefliesRef.current = fireflies;
  }, []);

  // Spawn raindrops
  const initRain = useCallback((width: number, height: number) => {
    const drops: RainDrop[] = [];
    const count = Math.floor(width * 0.25);
    for (let i = 0; i < count; i++) {
      drops.push({
        x: Math.random() * width,
        y: Math.random() * height,
        length: Math.random() * 22 + 12,
        speed: Math.random() * 14 + 16,
        alpha: Math.random() * 0.4 + 0.2,
      });
    }
    rainRef.current = drops;
  }, []);

  // Trigger burst of leaves (e.g. on tree click or spacebar)
  const spawnLeafBurst = useCallback((count = 6, originX?: number, originY?: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const w = canvas.width;
    const h = canvas.height;

    const baseX = originX !== undefined ? originX : w * 0.48;
    const baseY = originY !== undefined ? originY : h * 0.38;

    const colors = [
      atmosphere.leafColorPrimary,
      atmosphere.leafColorSecondary,
      atmosphere.leafHighlight,
      '#102a24',
      '#2d4a3e',
    ];

    for (let i = 0; i < count; i++) {
      leavesRef.current.push({
        x: baseX + (Math.random() - 0.5) * (w * 0.35),
        y: baseY + (Math.random() - 0.5) * (h * 0.2),
        z: Math.floor(Math.random() * 3),
        vx: (Math.random() * 0.8 + 0.3) * atmosphere.windSpeed,
        vy: Math.random() * 0.9 + 0.6,
        angle: Math.random() * Math.PI * 2,
        vAngle: (Math.random() - 0.5) * 0.05,
        size: Math.random() * 8 + 6,
        color: colors[Math.floor(Math.random() * colors.length)],
        wobble: Math.random() * Math.PI * 2,
        wobbleSpeed: Math.random() * 0.04 + 0.02,
        opacity: 0.85,
      });
    }
  }, [atmosphere]);

  // Handle Cat Click
  const handleCatWake = useCallback((e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    soundSynth.playCatPurr();
    setCatIsPurring(true);
    catAwakeRef.current = 1.0;
    setCatAwakeProgress(1.0);

    if (onCatClick) onCatClick();

    setTimeout(() => {
      setCatIsPurring(false);
    }, 3200);
  }, [onCatClick]);

  // Handle Tree Click
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const clickY = ((e.clientY - rect.top) / rect.height) * canvas.height;

    // Check if clicked near cat (around tree base right)
    const catX = canvas.width * 0.54;
    const catY = canvas.height * 0.86;
    const distToCat = Math.hypot(clickX - catX, clickY - catY);

    if (distToCat < 70) {
      handleCatWake();
      return;
    }

    // Check if clicked tree canopy or trunk
    const treeTrunkX = canvas.width * 0.45;
    const treeCanopyY = canvas.height * 0.4;
    if (clickY < canvas.height * 0.85 && Math.abs(clickX - treeTrunkX) < canvas.width * 0.35) {
      soundSynth.playLeafFlutter();
      spawnLeafBurst(10, clickX, clickY);
      setTreeClickRipple(1);
      if (onTreeClick) onTreeClick();
      setTimeout(() => setTreeClickRipple(0), 400);
    }
  };

  // Spacebar global pulse handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in chat input
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

      if (e.code === 'Space') {
        e.preventDefault();
        soundSynth.playSpacePulse();
        spawnLeafBurst(8);
        catAnimRef.current.earTwitch = 1.0;
        personAnimRef.current.footTap = 1.0;

        // Pulse fireflies
        firefliesRef.current.forEach((f) => {
          f.alpha = 1.0;
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [spawnLeafBurst]);

  // Mouse Move Parallax
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (reducedMotion) return;
      const nx = (e.clientX / window.innerWidth - 0.5) * 2;
      const ny = (e.clientY / window.innerHeight - 0.5) * 2;
      mousePosRef.current.targetX = nx * 14;
      mousePosRef.current.targetY = ny * 8;
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [reducedMotion]);

  // Main Canvas Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    let animFrameId: number;

    const handleResize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = parent.clientWidth;
      const h = parent.clientHeight;

      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.scale(dpr, dpr);

      initStars(w, h);
      initFireflies(w, h, atmosphere.fireflyCount);
      initRain(w, h);
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    // Initial leaves
    spawnLeafBurst(6);

    // Natural occasional leaf detach timer
    const leafInterval = setInterval(() => {
      if (Math.random() > 0.4) {
        spawnLeafBurst(Math.floor(Math.random() * 2 + 1));
      }
    }, 4500);

    // RENDER LOOP
    const render = () => {
      timeRef.current += 0.016;
      const t = timeRef.current;
      const parent = canvas.parentElement;
      if (!parent) return;

      const w = parent.clientWidth;
      const h = parent.clientHeight;

      // Smooth mouse parallax
      mousePosRef.current.x += (mousePosRef.current.targetX - mousePosRef.current.x) * 0.05;
      mousePosRef.current.y += (mousePosRef.current.targetY - mousePosRef.current.y) * 0.05;
      const px = mousePosRef.current.x;
      const py = mousePosRef.current.y;

      // Update cat awake transition
      if (catAwakeRef.current > 0) {
        catAwakeRef.current -= 0.005;
        if (catAwakeRef.current < 0) catAwakeRef.current = 0;
        setCatAwakeProgress(catAwakeRef.current);
      }

      // Update Person Micro-Movements
      const musicBeat = isPlaying ? Math.sin(t * 3.8) : 0;
      personAnimRef.current.breath = Math.sin(t * 1.2) * 1.5;
      personAnimRef.current.headTilt = Math.sin(t * 0.6) * 0.04 + (isPlaying ? Math.sin(t * 3.8) * 0.03 : 0);
      if (isPlaying && Math.sin(t * 3.8) > 0.8) {
        personAnimRef.current.footTap = Math.min(personAnimRef.current.footTap + 0.3, 1.0);
      } else {
        personAnimRef.current.footTap *= 0.88;
      }
      // Periodic phone glance
      personAnimRef.current.phoneGlance = Math.sin(t * 0.15) > 0.7 ? 1.0 : 0.0;

      // Update Cat Micro-Movements
      catAnimRef.current.breath = Math.sin(t * 1.8) * 2;
      catAnimRef.current.tailAngle = Math.sin(t * 1.2) * 0.2;
      if (Math.random() < 0.008) {
        catAnimRef.current.earTwitch = 1.0;
      } else {
        catAnimRef.current.earTwitch *= 0.9;
      }

      // ==========================================
      // 1. SKY GRADIENT & HORIZON
      // ==========================================
      const skyGrad = ctx.createLinearGradient(0, 0, 0, h);
      skyGrad.addColorStop(0, atmosphere.skyGradient[0]);
      skyGrad.addColorStop(0.55, atmosphere.skyGradient[1]);
      skyGrad.addColorStop(1, atmosphere.skyGradient[2]);
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, w, h);

      // Horizon atmospheric glow
      const horizonGrad = ctx.createRadialGradient(
        w * 0.5 + px * 0.2,
        h * 0.75 + py * 0.2,
        w * 0.1,
        w * 0.5,
        h * 0.75,
        w * 0.8
      );
      horizonGrad.addColorStop(0, atmosphere.horizonGlow);
      horizonGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = horizonGrad;
      ctx.fillRect(0, h * 0.4, w, h * 0.6);

      // ==========================================
      // 2. CELESTIAL BODIES (Moon / Stars / Sun)
      // ==========================================
      if (atmosphere.starsOpacity > 0.1) {
        ctx.save();
        starsRef.current.forEach((star) => {
          const starAlpha = Math.max(0, Math.min(1, star.alpha + Math.sin(t * 2 + star.twinkleSpeed * 100) * 0.3)) * atmosphere.starsOpacity;
          ctx.fillStyle = star.color;
          ctx.globalAlpha = starAlpha;
          ctx.beginPath();
          ctx.arc(star.x + px * 0.1, star.y + py * 0.1, star.size, 0, Math.PI * 2);
          ctx.fill();
        });
        ctx.restore();
      }

      // Moon
      if (atmosphere.moonVisible) {
        ctx.save();
        const moonX = w * 0.22 + px * 0.15;
        const moonY = h * 0.22 + py * 0.15;
        const moonRadius = Math.min(w, h) * 0.055;

        // Moon Outer Glow
        const moonGlow = ctx.createRadialGradient(moonX, moonY, moonRadius * 0.8, moonX, moonY, moonRadius * 4.5);
        moonGlow.addColorStop(0, 'rgba(255, 255, 255, 0.45)');
        moonGlow.addColorStop(0.4, 'rgba(199, 210, 254, 0.15)');
        moonGlow.addColorStop(1, 'transparent');
        ctx.fillStyle = moonGlow;
        ctx.beginPath();
        ctx.arc(moonX, moonY, moonRadius * 4.5, 0, Math.PI * 2);
        ctx.fill();

        // Moon Body
        const moonBodyGrad = ctx.createLinearGradient(moonX - moonRadius, moonY - moonRadius, moonX + moonRadius, moonY + moonRadius);
        moonBodyGrad.addColorStop(0, '#ffffff');
        moonBodyGrad.addColorStop(1, '#e2e8f0');
        ctx.fillStyle = moonBodyGrad;
        ctx.beginPath();
        ctx.arc(moonX, moonY, moonRadius, 0, Math.PI * 2);
        ctx.fill();

        // Subtle Moon Craters
        ctx.fillStyle = 'rgba(148, 163, 184, 0.25)';
        ctx.beginPath();
        ctx.arc(moonX - moonRadius * 0.3, moonY - moonRadius * 0.2, moonRadius * 0.22, 0, Math.PI * 2);
        ctx.arc(moonX + moonRadius * 0.25, moonY + moonRadius * 0.3, moonRadius * 0.28, 0, Math.PI * 2);
        ctx.arc(moonX - moonRadius * 0.1, moonY + moonRadius * 0.4, moonRadius * 0.15, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      }

      // ==========================================
      // 3. DISTANT CITY SKYLINE & CLOUDS
      // ==========================================
      ctx.save();
      const cityBaseY = h * 0.72 + py * 0.3;
      const cityAlpha = atmosphere.cityLightsOpacity;
      ctx.globalAlpha = cityAlpha * 0.6;
      ctx.fillStyle = '#060913';

      // Distant city silhouette blocks
      const cityWidths = [45, 60, 35, 75, 50, 40, 80, 55, 65, 90, 40, 70, 50, 60];
      const cityHeights = [60, 110, 85, 140, 95, 70, 130, 80, 115, 150, 75, 100, 65, 90];
      let curX = 0;
      for (let i = 0; i < cityWidths.length * 3; i++) {
        const idx = i % cityWidths.length;
        const bw = cityWidths[idx] * (w / 1200);
        const bh = cityHeights[idx] * (h / 800);
        const bx = curX + px * 0.2;
        const by = cityBaseY - bh;

        ctx.fillRect(bx, by, bw, bh + 100);

        // Tiny window lights
        if (cityAlpha > 0.3) {
          ctx.fillStyle = (i % 3 === 0) ? 'rgba(254, 240, 138, 0.45)' : 'rgba(199, 210, 254, 0.35)';
          const windowRows = Math.floor(bh / 16);
          const windowCols = Math.floor(bw / 12);
          for (let r = 1; r < windowRows; r++) {
            for (let c = 1; c < windowCols; c++) {
              if ((r * 7 + c * 13 + i) % 5 > 2) {
                ctx.fillRect(bx + c * 10, by + r * 14, 3, 5);
              }
            }
          }
          ctx.fillStyle = '#060913';
        }

        // Antenna with blinker
        if (i % 4 === 0) {
          ctx.fillRect(bx + bw * 0.5 - 1, by - 22, 2, 22);
          if (Math.sin(t * 4 + i) > 0.5) {
            ctx.fillStyle = '#ef4444';
            ctx.beginPath();
            ctx.arc(bx + bw * 0.5, by - 22, 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#060913';
          }
        }

        curX += bw + 6;
        if (curX > w * 1.2) break;
      }
      ctx.restore();

      // ==========================================
      // 4. GRASS HILLS & GROUND LAYERS
      // ==========================================
      const groundY = h * 0.78 + py * 0.5;

      // Midground Hill
      ctx.save();
      const midHillGrad = ctx.createLinearGradient(0, groundY - 40, 0, h);
      midHillGrad.addColorStop(0, '#090f18');
      midHillGrad.addColorStop(1, '#05070c');
      ctx.fillStyle = midHillGrad;
      ctx.beginPath();
      ctx.moveTo(-50, groundY + 20);
      ctx.quadraticCurveTo(w * 0.3 + px * 0.4, groundY - 35, w * 0.7, groundY + 10);
      ctx.quadraticCurveTo(w * 0.9, groundY + 30, w + 50, groundY);
      ctx.lineTo(w + 50, h + 50);
      ctx.lineTo(-50, h + 50);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      // Foreground Main Grassy Mound
      ctx.save();
      const foreHillGrad = ctx.createLinearGradient(0, groundY, 0, h);
      foreHillGrad.addColorStop(0, atmosphere.grassColor);
      foreHillGrad.addColorStop(0.3, '#040609');
      foreHillGrad.addColorStop(1, '#020305');
      ctx.fillStyle = foreHillGrad;

      ctx.beginPath();
      ctx.moveTo(-50, h * 0.86);
      ctx.bezierCurveTo(
        w * 0.25 + px * 0.6,
        groundY - 15,
        w * 0.65 + px * 0.6,
        groundY + 10,
        w + 50,
        h * 0.88
      );
      ctx.lineTo(w + 50, h + 50);
      ctx.lineTo(-50, h + 50);
      ctx.closePath();
      ctx.fill();

      // Swaying Grass Blades on the Hill Top
      ctx.strokeStyle = atmosphere.leafHighlight;
      ctx.lineWidth = 1.4;
      const grassCount = Math.floor(w / 18);
      const windSway = Math.sin(t * 2 * atmosphere.windSpeed) * (8 * atmosphere.windSpeed);

      for (let g = 0; g < grassCount; g++) {
        const gx = (g / grassCount) * w + (Math.sin(g * 99) * 8);
        const gy = groundY + Math.sin(gx / w * Math.PI) * 12;
        const grassH = 14 + Math.sin(g * 33) * 8;

        ctx.beginPath();
        ctx.moveTo(gx, gy);
        ctx.quadraticCurveTo(
          gx + windSway * 0.5,
          gy - grassH * 0.5,
          gx + windSway + Math.sin(g) * 3,
          gy - grassH
        );
        ctx.stroke();
      }
      ctx.restore();

      // ==========================================
      // 5. THE MASSIVE ANCIENT TREE
      // ==========================================
      ctx.save();
      const treeBaseX = w * 0.46 + px * 0.7;
      const treeBaseY = groundY + 45;
      const trunkWidth = Math.min(w, h) * 0.14;

      // Tree Trunk Shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
      ctx.beginPath();
      ctx.ellipse(treeBaseX + 30, treeBaseY + 5, trunkWidth * 1.4, 24, -0.1, 0, Math.PI * 2);
      ctx.fill();

      // Trunk and Core Limbs (Organic curve paths)
      const trunkGrad = ctx.createLinearGradient(treeBaseX - trunkWidth, treeBaseY, treeBaseX + trunkWidth, h * 0.2);
      trunkGrad.addColorStop(0, atmosphere.barkColor);
      trunkGrad.addColorStop(0.5, '#0e121d');
      trunkGrad.addColorStop(1, '#07090f');
      ctx.fillStyle = trunkGrad;

      // Main Trunk
      ctx.beginPath();
      // Left base flare
      ctx.moveTo(treeBaseX - trunkWidth * 1.2, treeBaseY);
      ctx.quadraticCurveTo(treeBaseX - trunkWidth * 0.5, treeBaseY - 120, treeBaseX - trunkWidth * 0.4, h * 0.46);
      // Left primary branch
      ctx.bezierCurveTo(
        treeBaseX - trunkWidth * 1.5,
        h * 0.4,
        treeBaseX - w * 0.28,
        h * 0.32,
        treeBaseX - w * 0.35,
        h * 0.3
      );
      ctx.quadraticCurveTo(treeBaseX - w * 0.22, h * 0.35, treeBaseX - trunkWidth * 0.2, h * 0.4);
      // Center & Top branches
      ctx.bezierCurveTo(
        treeBaseX - trunkWidth * 0.1,
        h * 0.28,
        treeBaseX + trunkWidth * 0.2,
        h * 0.22,
        treeBaseX + w * 0.08,
        h * 0.18
      );
      // Right heavy branch
      ctx.bezierCurveTo(
        treeBaseX + trunkWidth * 0.6,
        h * 0.32,
        treeBaseX + w * 0.32,
        h * 0.35,
        treeBaseX + w * 0.42,
        h * 0.38
      );
      ctx.quadraticCurveTo(treeBaseX + trunkWidth * 0.7, h * 0.44, treeBaseX + trunkWidth * 0.5, h * 0.52);
      // Right base flare
      ctx.quadraticCurveTo(treeBaseX + trunkWidth * 0.6, treeBaseY - 80, treeBaseX + trunkWidth * 1.3, treeBaseY);
      ctx.closePath();
      ctx.fill();

      // Bark Texture Ridges
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
      ctx.lineWidth = 2;
      for (let r = -2; r <= 2; r++) {
        ctx.beginPath();
        ctx.moveTo(treeBaseX + r * (trunkWidth * 0.2), treeBaseY - 10);
        ctx.quadraticCurveTo(
          treeBaseX + r * (trunkWidth * 0.15) + Math.sin(r) * 15,
          treeBaseY - 160,
          treeBaseX + r * (trunkWidth * 0.1) + (r > 0 ? 40 : -40),
          h * 0.44
        );
        ctx.stroke();
      }

      // CANOPY LEAF CLUSTERS (Layered organic clouds with wind sway)
      const canopyClusters = [
        { cx: treeBaseX - w * 0.28, cy: h * 0.3, r: Math.min(w, h) * 0.18, swayFactor: 1.2 },
        { cx: treeBaseX - w * 0.15, cy: h * 0.22, r: Math.min(w, h) * 0.22, swayFactor: 1.0 },
        { cx: treeBaseX + w * 0.05, cy: h * 0.16, r: Math.min(w, h) * 0.24, swayFactor: 0.9 },
        { cx: treeBaseX + w * 0.25, cy: h * 0.24, r: Math.min(w, h) * 0.23, swayFactor: 1.1 },
        { cx: treeBaseX + w * 0.38, cy: h * 0.34, r: Math.min(w, h) * 0.19, swayFactor: 1.3 },
        { cx: treeBaseX - w * 0.02, cy: h * 0.32, r: Math.min(w, h) * 0.2, swayFactor: 0.8 },
      ];

      // Render Canopy Back Layer
      canopyClusters.forEach((cl, i) => {
        const sway = Math.sin(t * 1.5 * atmosphere.windSpeed + i) * (10 * cl.swayFactor * atmosphere.windSpeed);
        const grad = ctx.createRadialGradient(
          cl.cx + sway,
          cl.cy - cl.r * 0.2,
          cl.r * 0.2,
          cl.cx + sway,
          cl.cy,
          cl.r
        );
        grad.addColorStop(0, atmosphere.leafColorPrimary);
        grad.addColorStop(0.7, atmosphere.leafColorSecondary);
        grad.addColorStop(1, 'rgba(4, 7, 12, 0.95)');

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(cl.cx + sway, cl.cy, cl.r, 0, Math.PI * 2);
        ctx.fill();

        // Canopy Highlights / Rim Light
        ctx.strokeStyle = atmosphere.leafHighlight;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(cl.cx + sway, cl.cy, cl.r * 0.94, Math.PI * 1.1, Math.PI * 1.8);
        ctx.stroke();
      });

      // Ambient Sunlight/Moonlight Rays Filtering Through Canopy
      if (atmosphere.lightingTone) {
        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        const lightShaft = ctx.createLinearGradient(treeBaseX - w * 0.1, 0, treeBaseX + 60, treeBaseY);
        lightShaft.addColorStop(0, 'transparent');
        lightShaft.addColorStop(0.4, 'rgba(255, 255, 255, 0.06)');
        lightShaft.addColorStop(0.7, 'rgba(99, 102, 241, 0.04)');
        lightShaft.addColorStop(1, 'transparent');
        ctx.fillStyle = lightShaft;
        ctx.beginPath();
        ctx.moveTo(treeBaseX - w * 0.2, h * 0.1);
        ctx.lineTo(treeBaseX + w * 0.15, h * 0.1);
        ctx.lineTo(treeBaseX + w * 0.25, treeBaseY);
        ctx.lineTo(treeBaseX - w * 0.05, treeBaseY);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }

      ctx.restore();

      // ==========================================
      // 6. THE ANONYMOUS PERSON WITH HEADPHONES
      // ==========================================
      ctx.save();
      const personBaseX = treeBaseX + trunkWidth * 0.38;
      const personBaseY = treeBaseY - 8;
      const pScale = Math.min(w, h) / 750;

      // Person Ground Shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.beginPath();
      ctx.ellipse(personBaseX + 8, personBaseY + 12, 38 * pScale, 12 * pScale, 0, 0, Math.PI * 2);
      ctx.fill();

      // Breathing / Posture Shift Offset
      const breathOffsetY = personAnimRef.current.breath;
      const headTiltAngle = personAnimRef.current.headTilt;
      const footTapOffset = personAnimRef.current.footTap * 4;

      // Relaxed Legs / Seated Silhouette
      ctx.fillStyle = '#080c16';
      // Legs bent forward
      ctx.beginPath();
      ctx.moveTo(personBaseX - 10 * pScale, personBaseY - 15 * pScale);
      ctx.quadraticCurveTo(
        personBaseX + 28 * pScale,
        personBaseY - 8 * pScale,
        personBaseX + 45 * pScale,
        personBaseY + 8 * pScale - footTapOffset
      ); // foot
      ctx.quadraticCurveTo(
        personBaseX + 30 * pScale,
        personBaseY + 14 * pScale,
        personBaseX - 14 * pScale,
        personBaseY + 10 * pScale
      );
      ctx.closePath();
      ctx.fill();

      // Torso / Oversized Hoodie
      const hoodieGrad = ctx.createLinearGradient(
        personBaseX,
        personBaseY - 55 * pScale,
        personBaseX,
        personBaseY
      );
      hoodieGrad.addColorStop(0, '#131929');
      hoodieGrad.addColorStop(1, '#090d16');
      ctx.fillStyle = hoodieGrad;

      ctx.beginPath();
      ctx.moveTo(personBaseX - 18 * pScale, personBaseY - 48 * pScale + breathOffsetY);
      ctx.quadraticCurveTo(
        personBaseX + 16 * pScale,
        personBaseY - 42 * pScale + breathOffsetY,
        personBaseX + 14 * pScale,
        personBaseY - 10 * pScale
      );
      ctx.quadraticCurveTo(
        personBaseX - 2 * pScale,
        personBaseY + 5 * pScale,
        personBaseX - 22 * pScale,
        personBaseY - 8 * pScale
      );
      ctx.closePath();
      ctx.fill();

      // Relaxed Arms resting on knee / holding phone
      ctx.fillStyle = '#0c1220';
      ctx.beginPath();
      ctx.moveTo(personBaseX - 5 * pScale, personBaseY - 35 * pScale + breathOffsetY);
      ctx.quadraticCurveTo(
        personBaseX + 24 * pScale,
        personBaseY - 22 * pScale,
        personBaseX + 22 * pScale,
        personBaseY - 5 * pScale
      );
      ctx.lineTo(personBaseX + 16 * pScale, personBaseY - 3 * pScale);
      ctx.quadraticCurveTo(
        personBaseX + 15 * pScale,
        personBaseY - 20 * pScale,
        personBaseX - 12 * pScale,
        personBaseY - 30 * pScale + breathOffsetY
      );
      ctx.closePath();
      ctx.fill();

      // Glowing Retro Phone Screen (occasional glance)
      const phoneGlowAlpha = personAnimRef.current.phoneGlance > 0.5 ? 0.85 : 0.4;
      ctx.fillStyle = `rgba(165, 180, 252, ${phoneGlowAlpha})`;
      ctx.fillRect(personBaseX + 18 * pScale, personBaseY - 14 * pScale, 10 * pScale, 16 * pScale);

      // Subtle phone ambient cast on face/hands
      ctx.fillStyle = `rgba(129, 140, 248, ${phoneGlowAlpha * 0.35})`;
      ctx.beginPath();
      ctx.arc(personBaseX + 22 * pScale, personBaseY - 12 * pScale, 18 * pScale, 0, Math.PI * 2);
      ctx.fill();

      // Head & Hoodie Cap
      ctx.save();
      ctx.translate(personBaseX - 6 * pScale, personBaseY - 56 * pScale + breathOffsetY);
      ctx.rotate(headTiltAngle);

      // Head Silhouette
      ctx.fillStyle = '#0a0e1a';
      ctx.beginPath();
      ctx.arc(0, 0, 14 * pScale, 0, Math.PI * 2);
      ctx.fill();

      // GLOWING OVERSIZED HEADPHONES
      // Headband
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 3.5 * pScale;
      ctx.beginPath();
      ctx.arc(0, -2 * pScale, 15 * pScale, Math.PI * 0.9, Math.PI * 2.1);
      ctx.stroke();

      // Headphone Ear Cup (Left/Right)
      const hpGlowIntensity = isPlaying ? 0.7 + Math.sin(t * 4) * 0.3 : 0.4;
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.ellipse(8 * pScale, 2 * pScale, 5 * pScale, 9 * pScale, 0.2, 0, Math.PI * 2);
      ctx.fill();

      // Glowing Ring Indicator on Headphone
      ctx.strokeStyle = `rgba(99, 102, 241, ${hpGlowIntensity})`;
      ctx.lineWidth = 2 * pScale;
      ctx.shadowColor = '#6366f1';
      ctx.shadowBlur = isPlaying ? 12 : 4;
      ctx.beginPath();
      ctx.ellipse(8 * pScale, 2 * pScale, 4 * pScale, 7 * pScale, 0.2, 0, Math.PI * 2);
      ctx.stroke();
      ctx.shadowBlur = 0; // reset

      ctx.restore(); // restore head

      ctx.restore(); // restore person

      // ==========================================
      // 7. THE SLEEPING / INTERACTIVE CAT
      // ==========================================
      ctx.save();
      // In rainy weather, cat cuddles even closer
      const catBaseX = atmosphere.ambientType === 'rain' 
        ? personBaseX + 38 * pScale 
        : personBaseX + 54 * pScale;
      const catBaseY = personBaseY + 6;
      const cScale = pScale * 0.95;

      // Cat Shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
      ctx.beginPath();
      ctx.ellipse(catBaseX, catBaseY + 8, 24 * cScale, 8 * cScale, 0, 0, Math.PI * 2);
      ctx.fill();

      const catBreath = catAnimRef.current.breath;
      const isAwake = catAwakeRef.current > 0.05;

      // Cat Body (Curled warmth)
      const catGrad = ctx.createLinearGradient(catBaseX - 20 * cScale, catBaseY - 15 * cScale, catBaseX + 20 * cScale, catBaseY + 10 * cScale);
      catGrad.addColorStop(0, '#1e293b');
      catGrad.addColorStop(0.6, '#0f172a');
      catGrad.addColorStop(1, '#080d1a');
      ctx.fillStyle = catGrad;

      // Main Torso
      ctx.beginPath();
      ctx.ellipse(
        catBaseX,
        catBaseY - 4 * cScale + (isAwake ? 0 : catBreath * 0.5),
        18 * cScale,
        13 * cScale + (isAwake ? 0 : catBreath * 0.8),
        -0.1,
        0,
        Math.PI * 2
      );
      ctx.fill();

      // Cat Tail (Curling & Flicking)
      const tailFlick = isAwake ? Math.sin(t * 8) * 0.4 : catAnimRef.current.tailAngle;
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 3.8 * cScale;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(catBaseX + 16 * cScale, catBaseY - 2 * cScale);
      ctx.quadraticCurveTo(
        catBaseX + 28 * cScale + tailFlick * 8,
        catBaseY - 14 * cScale,
        catBaseX + 22 * cScale + tailFlick * 14,
        catBaseY - 20 * cScale
      );
      ctx.stroke();

      // Cat Head
      const catHeadY = isAwake 
        ? catBaseY - 15 * cScale // lifts head when awake!
        : catBaseY - 6 * cScale;

      ctx.beginPath();
      ctx.arc(catBaseX - 14 * cScale, catHeadY, 11 * cScale, 0, Math.PI * 2);
      ctx.fill();

      // Cat Ears (with micro-twitch)
      const earTwitch = catAnimRef.current.earTwitch * 3;
      ctx.beginPath();
      // Left Ear
      ctx.moveTo(catBaseX - 22 * cScale, catHeadY - 5 * cScale);
      ctx.lineTo(catBaseX - 25 * cScale - earTwitch, catHeadY - 16 * cScale);
      ctx.lineTo(catBaseX - 16 * cScale, catHeadY - 10 * cScale);
      // Right Ear
      ctx.moveTo(catBaseX - 14 * cScale, catHeadY - 10 * cScale);
      ctx.lineTo(catBaseX - 10 * cScale + earTwitch, catHeadY - 17 * cScale);
      ctx.lineTo(catBaseX - 6 * cScale, catHeadY - 6 * cScale);
      ctx.fill();

      // Cat Eyes / Sleeping lines vs Awake Luminous Feline Eyes
      if (isAwake) {
        // Glowing friendly eyes
        ctx.fillStyle = '#38bdf8';
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        // Left Eye
        ctx.ellipse(catBaseX - 17 * cScale, catHeadY, 2.5 * cScale, 3.5 * cScale, 0, 0, Math.PI * 2);
        // Right Eye
        ctx.ellipse(catBaseX - 11 * cScale, catHeadY, 2.5 * cScale, 3.5 * cScale, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0; // reset
      } else {
        // Peaceful curved sleeping lines
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.lineWidth = 1.2 * cScale;
        ctx.beginPath();
        ctx.arc(catBaseX - 17 * cScale, catHeadY + 1 * cScale, 3 * cScale, 0.1, Math.PI * 0.9);
        ctx.arc(catBaseX - 11 * cScale, catHeadY + 1 * cScale, 3 * cScale, 0.1, Math.PI * 0.9);
        ctx.stroke();
      }

      // Tiny nose
      ctx.fillStyle = '#f472b6';
      ctx.beginPath();
      ctx.arc(catBaseX - 14 * cScale, catHeadY + 4 * cScale, 1.2 * cScale, 0, Math.PI * 2);
      ctx.fill();

      // Purr vibration aura if just clicked
      if (catIsPurring) {
        ctx.strokeStyle = 'rgba(236, 72, 153, 0.45)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(catBaseX, catBaseY - 5, 32 * cScale + Math.sin(t * 15) * 4, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.restore();

      // ==========================================
      // 8. FALLING LEAVES SYSTEM (3 Depth Layers)
      // ==========================================
      ctx.save();
      const updatedLeaves: FallingLeaf[] = [];

      leavesRef.current.forEach((leaf) => {
        leaf.wobble += leaf.wobbleSpeed;
        leaf.angle += leaf.vAngle;
        leaf.x += leaf.vx + Math.sin(leaf.wobble) * 1.5;
        leaf.y += leaf.vy;

        // Ground landing check
        const groundThreshold = groundY + 40 + Math.sin((leaf.x / w) * Math.PI) * 20;

        if (leaf.y < groundThreshold && leaf.x < w + 50) {
          updatedLeaves.push(leaf);

          // Draw Leaf
          ctx.save();
          ctx.translate(leaf.x + px * (leaf.z * 0.4 + 0.2), leaf.y + py * (leaf.z * 0.4 + 0.2));
          ctx.rotate(leaf.angle);

          // Dynamic scale based on depth layer (0: back, 1: mid, 2: fore)
          const zScale = leaf.z === 2 ? 1.3 : leaf.z === 1 ? 1.0 : 0.7;
          ctx.scale(zScale, zScale);

          ctx.fillStyle = leaf.color;
          ctx.globalAlpha = leaf.opacity * (leaf.z === 0 ? 0.5 : 0.9);

          // Elegant curved leaf shape
          ctx.beginPath();
          ctx.moveTo(0, -leaf.size);
          ctx.quadraticCurveTo(leaf.size * 0.6, 0, 0, leaf.size);
          ctx.quadraticCurveTo(-leaf.size * 0.6, 0, 0, -leaf.size);
          ctx.fill();

          // Leaf center spine vein
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
          ctx.lineWidth = 0.8;
          ctx.beginPath();
          ctx.moveTo(0, -leaf.size);
          ctx.lineTo(0, leaf.size);
          ctx.stroke();

          ctx.restore();
        }
      });
      leavesRef.current = updatedLeaves;
      ctx.restore();

      // ==========================================
      // 9. FIREFLIES
      // ==========================================
      if (atmosphere.fireflyCount > 0) {
        ctx.save();
        firefliesRef.current.forEach((ff) => {
          ff.x += ff.vx + Math.sin(t * 1.5 + ff.y) * 0.3;
          ff.y += ff.vy + Math.cos(t * 1.2 + ff.x) * 0.3;
          ff.alpha += ff.alphaSpeed;
          if (ff.alpha > 1 || ff.alpha < 0) {
            ff.alphaSpeed = -ff.alphaSpeed;
          }

          // Screen bounds wrap
          if (ff.x < 0) ff.x = w;
          if (ff.x > w) ff.x = 0;
          if (ff.y < h * 0.2) ff.y = h * 0.8;
          if (ff.y > h * 0.9) ff.y = h * 0.3;

          const currentAlpha = Math.max(0, Math.min(1, ff.alpha));

          // Firefly Outer Glow
          const ffGrad = ctx.createRadialGradient(
            ff.x + px * 0.5,
            ff.y + py * 0.5,
            0,
            ff.x + px * 0.5,
            ff.y + py * 0.5,
            ff.radius * 5
          );
          ffGrad.addColorStop(0, ff.glowColor);
          ffGrad.addColorStop(1, 'transparent');
          ctx.fillStyle = ffGrad;
          ctx.beginPath();
          ctx.arc(ff.x + px * 0.5, ff.y + py * 0.5, ff.radius * 5, 0, Math.PI * 2);
          ctx.fill();

          // Firefly Core
          ctx.fillStyle = ff.baseColor;
          ctx.globalAlpha = currentAlpha;
          ctx.beginPath();
          ctx.arc(ff.x + px * 0.5, ff.y + py * 0.5, ff.radius, 0, Math.PI * 2);
          ctx.fill();
        });
        ctx.restore();
      }

      // ==========================================
      // 10. RAIN & GROUND SPLASHES
      // ==========================================
      if (atmosphere.rainIntensity > 0) {
        ctx.save();
        ctx.strokeStyle = 'rgba(186, 230, 253, 0.45)';
        ctx.lineWidth = 1.2;

        rainRef.current.forEach((drop) => {
          drop.y += drop.speed;
          drop.x += atmosphere.windSpeed * 3.5;

          if (drop.y > h) {
            drop.y = -drop.length;
            drop.x = Math.random() * w;

            // Trigger ground splash ripple
            if (Math.random() > 0.7) {
              ripplesRef.current.push({
                x: drop.x,
                y: groundY + Math.random() * (h - groundY),
                radius: 1,
                maxRadius: Math.random() * 8 + 4,
                alpha: 0.5,
              });
            }
          }

          ctx.beginPath();
          ctx.moveTo(drop.x, drop.y);
          ctx.lineTo(drop.x + atmosphere.windSpeed * 4, drop.y + drop.length);
          ctx.stroke();
        });

        // Draw Splash Ripples
        const updatedRipples: Ripple[] = [];
        ripplesRef.current.forEach((rip) => {
          rip.radius += 0.4;
          rip.alpha -= 0.025;
          if (rip.alpha > 0 && rip.radius < rip.maxRadius) {
            ctx.strokeStyle = `rgba(186, 230, 253, ${rip.alpha})`;
            ctx.beginPath();
            ctx.ellipse(rip.x, rip.y, rip.radius * 2, rip.radius * 0.6, 0, 0, Math.PI * 2);
            ctx.stroke();
            updatedRipples.push(rip);
          }
        });
        ripplesRef.current = updatedRipples;

        ctx.restore();
      }

      // ==========================================
      // 11. ATMOSPHERIC FOG & VIGNETTE
      // ==========================================
      if (atmosphere.fogDensity > 0) {
        ctx.save();
        const fogGrad = ctx.createLinearGradient(0, groundY - 80, 0, h);
        fogGrad.addColorStop(0, 'transparent');
        fogGrad.addColorStop(0.5, `rgba(15, 23, 42, ${atmosphere.fogDensity * 0.45})`);
        fogGrad.addColorStop(1, `rgba(5, 5, 8, ${atmosphere.fogDensity * 0.85})`);
        ctx.fillStyle = fogGrad;
        ctx.fillRect(0, groundY - 80, w, h);
        ctx.restore();
      }

      // Tree click visual wave feedback
      if (treeClickRipple > 0) {
        ctx.save();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(treeBaseX, h * 0.35, 120 * treeClickRipple, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      animFrameId = requestAnimationFrame(render);
    };

    animFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animFrameId);
      window.removeEventListener('resize', handleResize);
      clearInterval(leafInterval);
    };
  }, [atmosphere, isPlaying, initStars, initFireflies, initRain, spawnLeafBurst, treeClickRipple, reducedMotion]);

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden select-none">
      <canvas
        ref={canvasRef}
        onClick={handleCanvasClick}
        className="w-full h-full cursor-pointer block touch-none"
        title="Click the tree to shake leaves, click the sleeping cat to wake it"
      />

      {/* Interactive Cat Wake Badge Tooltip */}
      {catIsPurring && (
        <div 
          className="absolute pointer-events-none transition-all duration-300 font-mono-code text-[11px] text-pink-300 bg-black/60 px-3 py-1 rounded-full border border-pink-500/30 backdrop-blur-md animate-bounce"
          style={{
            left: '52%',
            top: '76%',
            transform: 'translate(-50%, -100%)',
          }}
        >
          *purrr...* the cat gets it 🐾
        </div>
      )}
    </div>
  );
};
