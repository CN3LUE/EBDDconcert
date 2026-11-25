import React, { useCallback, useEffect, useRef, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { useI18n } from '../i18n/LanguageContext';
import { drawRoundedRectPath } from '../three/textures';
import type { MiniGameAvatarLook } from '../types/plaza';

export function getEbddBadgeName(jumps: number): string {
  if (jumps >= 50000) return '☁️ 공중부양자';
  if (jumps >= 10000) return '🤸 에바뛰고수';
  if (jumps >= 5000) return '🏃‍➡️ 에바뛰중수';
  if (jumps >= 1000) return '🚶 에바뛰초보';
  return '🌱 비기너';
}

function overlap(a1: number, a2: number, b1: number, b2: number): boolean {
  return a1 < b2 && a2 > b1;
}

// 3D 광장 아바타의 착장을 미니게임 캔버스 캐릭터로 그려주는 공용 렌더러
export function drawPlazaAvatarOnCanvas(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  look: MiniGameAvatarLook
) {
  ctx.save();
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';
  ctx.filter = 'none';
  ctx.shadowColor = 'rgba(0,0,0,0)';
  ctx.shadowBlur = 0;

  const cx = x + size / 2;
  const scale = size / 48;

  // 뒷머리 (긴 생머리 / 포니테일)
  if (look.hairStyle === 'long') {
    ctx.fillStyle = '#241a17';
    drawRoundedRectPath(ctx, cx - 12 * scale, y + 9 * scale, 24 * scale, 25 * scale, 6 * scale);
    ctx.fill();
  } else if (look.hairStyle === 'ponytail') {
    ctx.fillStyle = '#241a17';
    ctx.beginPath();
    ctx.ellipse(cx - 11.5 * scale, y + 17 * scale, 5 * scale, 9.5 * scale, 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.arc(cx - 9.5 * scale, y + 11 * scale, 2.5 * scale, 0, Math.PI * 2);
    ctx.fill();
  }

  // 다리 & 러닝화
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(cx - 8 * scale, y + 34 * scale, 6 * scale, 10 * scale);
  ctx.fillRect(cx + 2 * scale, y + 34 * scale, 6 * scale, 10 * scale);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(cx - 9 * scale, y + 41 * scale, 8 * scale, 5 * scale);
  ctx.fillRect(cx + 1 * scale, y + 41 * scale, 8 * scale, 5 * scale);
  ctx.fillStyle = '#2563eb';
  ctx.fillRect(cx - 9 * scale, y + 45 * scale, 8 * scale, 2 * scale);
  ctx.fillRect(cx + 1 * scale, y + 45 * scale, 8 * scale, 2 * scale);

  // 상의 몸통
  const torsoHalfW = 11 * scale;
  ctx.fillStyle = look.hoodieColor || '#f8fafc';
  drawRoundedRectPath(ctx, cx - torsoHalfW, y + 18 * scale, torsoHalfW * 2, 18 * scale, 5 * scale);
  ctx.fill();
  ctx.fillStyle = '#1d4ed8';
  ctx.fillRect(cx - 2 * scale, y + 18 * scale, 4 * scale, 18 * scale);

  // 얼굴
  ctx.fillStyle = '#ffedd5';
  ctx.beginPath();
  ctx.arc(cx, y + 12 * scale, 9.5 * scale, 0, Math.PI * 2);
  ctx.fill();

  // 헤어
  ctx.fillStyle = look.hairStyle === 'short' ? '#1e1b18' : '#241a17';
  ctx.beginPath();
  ctx.arc(cx, y + 10.5 * scale, 9.8 * scale, Math.PI, Math.PI * 2);
  ctx.fill();
  if (look.hairStyle === 'long') {
    ctx.fillRect(cx - 10.5 * scale, y + 10 * scale, 3 * scale, 18 * scale);
    ctx.fillRect(cx + 7.5 * scale, y + 10 * scale, 3 * scale, 18 * scale);
  }

  // 공식 모자
  if (look.capStyle !== 'none') {
    const capColor = look.capStyle === 'official_cap' ? '#f1f5f9' : '#1e3a8a';
    const brimColor = look.capStyle === 'official_cap' ? '#cbd5e1' : '#172554';
    ctx.fillStyle = capColor;
    ctx.beginPath();
    ctx.arc(cx, y + 9 * scale, 10.2 * scale, Math.PI, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = brimColor;
    ctx.fillRect(cx - 8 * scale, y + 8 * scale, 18 * scale, 3 * scale);
  }

  // 눈
  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.arc(cx - 3.5 * scale, y + 12.5 * scale, 1.4 * scale, 0, Math.PI * 2);
  ctx.arc(cx + 3.5 * scale, y + 12.5 * scale, 1.4 * scale, 0, Math.PI * 2);
  ctx.fill();

  // 왼손 / 오른손 MD 아이템
  const isHoldingSlogan = look.leftHandItem === 'slogan' || look.rightHandItem === 'slogan';
  if (isHoldingSlogan) {
    const sw = 34 * scale;
    const sh = 13 * scale;
    const sx = cx - sw / 2;
    const sy = y + 21 * scale;
    ctx.fillStyle = '#0018e8';
    ctx.fillRect(sx, sy, sw, sh);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = Math.max(1.2, 1.4 * scale);
    drawRoundedRectPath(
      ctx,
      sx + 1.5 * scale,
      sy + 1.5 * scale,
      sw - 3 * scale,
      sh - 3 * scale,
      5 * scale
    );
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.font = `900 ${Math.max(5, Math.round(6.2 * scale))}px system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('CNBLUE', cx, sy + sh / 2 + 0.4 * scale);
  } else {
    if (look.leftHandItem === 'fan') {
      ctx.fillStyle = '#1d4ed8';
      ctx.fillRect(cx - 13 * scale, y + 21 * scale, 2 * scale, 5 * scale);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(cx - 22 * scale, y + 13 * scale, 12 * scale, 9 * scale);
    } else if (look.leftHandItem === 'lightstick') {
      ctx.fillStyle = '#181a1f';
      ctx.fillRect(cx - 16 * scale, y + 20 * scale, 2.4 * scale, 6 * scale);
      ctx.fillStyle = '#2563eb';
      ctx.fillRect(cx - 17 * scale, y + 19 * scale, 4.4 * scale, 1.6 * scale);
      ctx.fillStyle = 'rgba(240, 249, 255, 0.85)';
      ctx.beginPath();
      ctx.arc(cx - 14.8 * scale, y + 15 * scale, 4.4 * scale, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = look.lightstickColor;
      ctx.beginPath();
      ctx.moveTo(cx - 14.8 * scale, y + 11.4 * scale);
      ctx.lineTo(cx - 11.8 * scale, y + 15 * scale);
      ctx.lineTo(cx - 14.8 * scale, y + 18.6 * scale);
      ctx.lineTo(cx - 17.8 * scale, y + 15 * scale);
      ctx.closePath();
      ctx.fill();
    }

    if (look.rightHandItem === 'fan') {
      ctx.fillStyle = '#1d4ed8';
      ctx.fillRect(cx + 19 * scale, y + 21 * scale, 2 * scale, 5 * scale);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(cx + 10 * scale, y + 13 * scale, 12 * scale, 9 * scale);
    } else if (look.rightHandItem === 'lightstick') {
      ctx.fillStyle = '#181a1f';
      ctx.fillRect(cx + 13.6 * scale, y + 20 * scale, 2.4 * scale, 6 * scale);
      ctx.fillStyle = '#2563eb';
      ctx.fillRect(cx + 12.6 * scale, y + 19 * scale, 4.4 * scale, 1.6 * scale);
      ctx.fillStyle = 'rgba(240, 249, 255, 0.85)';
      ctx.beginPath();
      ctx.arc(cx + 14.8 * scale, y + 15 * scale, 4.4 * scale, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = look.lightstickColor;
      ctx.beginPath();
      ctx.moveTo(cx + 14.8 * scale, y + 11.4 * scale);
      ctx.lineTo(cx + 17.8 * scale, y + 15 * scale);
      ctx.lineTo(cx + 14.8 * scale, y + 18.6 * scale);
      ctx.lineTo(cx + 11.8 * scale, y + 15 * scale);
      ctx.closePath();
      ctx.fill();
    }
  }

  ctx.restore();
}

export function MiniGameRun({
  avatarLook,
  bestScore,
  onUpdateBestScore,
  onRewardToast,
}: {
  avatarLook: MiniGameAvatarLook;
  bestScore: number;
  onAddJumps?: (amount: number) => void;
  onUpdateBestScore: (score: number) => void;
  onRewardToast: (msg: string) => void;
}) {
  const { t } = useI18n();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [gameState, setGameState] = useState<'READY' | 'PLAYING' | 'GAMEOVER'>('READY');
  const [score, setScore] = useState<number>(0);
  const [finalScore, setFinalScore] = useState<number>(0);

  const frameRef = useRef<number>(0);
  const stateRef = useRef<'READY' | 'PLAYING' | 'GAMEOVER'>('READY');
  const jumpActionRef = useRef<() => void>(() => {});
  const bananaImgRef = useRef<HTMLImageElement | null>(null);

  const propsRef = useRef({ avatarLook, onUpdateBestScore, onRewardToast, t });
  useEffect(() => {
    propsRef.current = { avatarLook, onUpdateBestScore, onRewardToast, t };
  }, [avatarLook, onUpdateBestScore, onRewardToast, t]);

  const GAME_WIDTH = 700;
  const GAME_HEIGHT = 340;
  const GROUND_Y = 280;
  const PLAYER_SIZE = 48;

  useEffect(() => {
    const img = new Image();
    img.src = './banana-peel.png';
    img.onload = () => {
      bananaImgRef.current = img;
    };
    img.onerror = () => {
      bananaImgRef.current = null;
    };
  }, []);

  const start = useCallback(() => {
    stateRef.current = 'PLAYING';
    setScore(0);
    setFinalScore(0);
    setGameState('PLAYING');
  }, []);

  useEffect(() => {
    const startKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (['Space', 'ArrowUp', 'KeyW'].includes(e.code) && stateRef.current !== 'PLAYING') {
        e.preventDefault();
        start();
      }
    };
    window.addEventListener('keydown', startKey);
    return () => window.removeEventListener('keydown', startKey);
  }, [start]);

  useEffect(() => {
    if (gameState !== 'PLAYING') return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const player = { y: GROUND_Y - PLAYER_SIZE, vy: 0, jumps: 0, shield: 0, invincible: 0 };
    const obstacles: Array<{ x: number; w: number; h: number; type: string; y: number | null }> = [];
    const pits: Array<{ x: number; w: number; isDoubleJumpPit: boolean }> = [];
    const items: Array<{ x: number; y: number; kind: 'shield' | 'star' }> = [];

    let frame = 0;
    let clearedObstacles = 0;
    let speed = 7;
    let lastSpawn = 0;
    let fellIntoPit = false;
    let spawnPauseUntil = 0;
    let lastItemSpawn = 0;
    let nextItemDelay = 360 + Math.random() * 180;
    let done = false;

    const jump = () => {
      if (fellIntoPit) return;
      if (player.jumps < 2) {
        player.vy = player.jumps === 0 ? -15.5 : -13;
        player.jumps += 1;
      }
    };
    jumpActionRef.current = jump;

    const playKey = (e: KeyboardEvent) => {
      if (['Space', 'ArrowUp', 'KeyW'].includes(e.code)) {
        e.preventDefault();
        jump();
      }
    };
    window.addEventListener('keydown', playKey);

    const finish = () => {
      if (done) return;
      done = true;
      stateRef.current = 'GAMEOVER';
      setGameState('GAMEOVER');
      setFinalScore(clearedObstacles);

      const { onUpdateBestScore: updateBest, onRewardToast: toast, t: curT } = propsRef.current;
      updateBest(clearedObstacles);
      toast(curT.miniRunToast(clearedObstacles));
    };

    const FIXED_FRAME_MS = 1000 / 60;
    let lastFrameTime = performance.now();
    let frameAccumulator = 0;

    const abyssGradient = ctx.createLinearGradient(0, GROUND_Y, 0, GAME_HEIGHT);
    abyssGradient.addColorStop(0, '#050006');
    abyssGradient.addColorStop(1, '#6b0039');

    const stageThemes = [
      { name: 'NIGHT RUNNER', top: '#090f2e', bottom: '#31174b', ground: '#514579', line: '#5de4ff', glow: '#ff62c0' },
      { name: 'YOUNG FOREVER', top: '#f8d45a', bottom: '#f28a38', ground: '#8a5635', line: '#fff3ad', glow: '#ffd84d' },
      { name: 'COLD LOVE', top: '#08233d', bottom: '#287ca0', ground: '#526f93', line: '#d8fbff', glow: '#75e8ff' },
      { name: 'RACER', top: '#260617', bottom: '#7b123f', ground: '#41213d', line: '#ff62c0', glow: '#ff334f' },
    ];
    const stageGradients = stageThemes.map((theme) => {
      const gradient = ctx.createLinearGradient(0, 0, 0, GAME_HEIGHT);
      gradient.addColorStop(0, theme.top);
      gradient.addColorStop(1, theme.bottom);
      return gradient;
    });

    const loop = (timestamp = performance.now()) => {
      frameAccumulator += Math.min(50, Math.max(0, timestamp - lastFrameTime)) / FIXED_FRAME_MS;
      lastFrameTime = timestamp;
      let simulationSteps = 0;

      while (frameAccumulator >= 1 && simulationSteps < 3) {
        frameAccumulator -= 1;
        simulationSteps += 1;
        frame += 1;

        const difficulty = 1 - Math.exp(-clearedObstacles / 140);
        speed = 7 + 11 * Math.pow(difficulty, 0.72);

        for (let i = pits.length - 1; i >= 0; i -= 1) {
          const pit = pits[i];
          const pitTravelSpeed = pit.isDoubleJumpPit ? Math.min(speed, 12) : speed;
          pit.x -= pitTravelSpeed;
          if (pit.x + pit.w < 0) {
            pits.splice(i, 1);
            clearedObstacles += 1;
            setScore(clearedObstacles);
          }
        }

        player.vy += 0.78;
        player.y += player.vy;
        const overPit = pits.some((pit) => overlap(66, 98, pit.x + 3, pit.x + pit.w - 3));
        if (!fellIntoPit && overPit && player.vy >= 0 && player.y + PLAYER_SIZE >= GROUND_Y - 2) {
          fellIntoPit = true;
        }
        if (player.y >= GROUND_Y - PLAYER_SIZE && !overPit && !fellIntoPit) {
          player.y = GROUND_Y - PLAYER_SIZE;
          player.vy = 0;
          player.jumps = 0;
        }
        if (player.y > GAME_HEIGHT + 30) {
          finish();
          return;
        }
        player.shield = Math.max(0, player.shield - 1);
        player.invincible = Math.max(0, player.invincible - 1);

        const itemNearSpawnLane = items.some((item) => item.x > GAME_WIDTH - 210);
        const spawnInterval = Math.max(30, 92 - difficulty * 62);
        if (!itemNearSpawnLane && frame >= spawnPauseUntil && frame - lastSpawn > spawnInterval) {
          lastSpawn = frame;
          const spawnPit = clearedObstacles >= 4 && Math.random() < 0.13 + difficulty * 0.11;
          if (spawnPit) {
            const isDoubleJumpPit = clearedObstacles >= 100 && Math.random() < 0.45;
            const normalPitWidth = 92 + Math.random() * 48;
            const pitWidth = isDoubleJumpPit
              ? normalPitWidth * (2.5 + Math.random() * 0.5)
              : normalPitWidth;
            pits.push({ x: GAME_WIDTH + 30, w: pitWidth, isDoubleJumpPit });
            const pitSpawnSpeed = isDoubleJumpPit ? Math.min(speed, 12) : speed;
            spawnPauseUntil =
              frame + Math.ceil(pitWidth / pitSpawnSpeed) + (isDoubleJumpPit ? 48 : 24);
          } else {
            const availableTypes = ['barrier', 'sign', 'banana', 'bomb'];
            if (difficulty > 0.1) availableTypes.push('drone');
            if (difficulty > 0.22) availableTypes.push('laser');
            if (difficulty > 0.36) availableTypes.push('waterBalloon');
            if (difficulty > 0.58) availableTypes.push('laser', 'bomb', 'waterBalloon');
            const type = availableTypes[Math.floor(Math.random() * availableTypes.length)];
            const dimMap: Record<string, { w: number; h: number }> = {
              laser: { w: 58, h: 20 },
              drone: { w: 34, h: 76 },
              barrier: { w: 42, h: 38 },
              sign: { w: 27, h: 62 },
              banana: { w: 34, h: 21 },
              bomb: { w: 38, h: 38 },
              waterBalloon: { w: 34, h: 42 },
            };
            const dimensions = dimMap[type];
            const laserY =
              type === 'laser'
                ? [GROUND_Y - 26, GROUND_Y - 58, GROUND_Y - 95][Math.floor(Math.random() * 3)]
                : null;
            obstacles.push({ x: GAME_WIDTH + 20, ...dimensions, type, y: laserY });
          }
        }

        const hazardNearItemLane =
          obstacles.some((o) => o.x + o.w > GAME_WIDTH - 210) ||
          pits.some((pit) => pit.x + pit.w > GAME_WIDTH - 210);
        if (frame - lastItemSpawn >= nextItemDelay && !hazardNearItemLane) {
          lastItemSpawn = frame;
          nextItemDelay = 360 + Math.random() * 180;
          items.push({
            x: GAME_WIDTH + 35,
            y: GROUND_Y - (72 + Math.random() * 55),
            kind: Math.random() < 0.22 ? 'shield' : 'star',
          });
        }

        for (let i = obstacles.length - 1; i >= 0; i -= 1) {
          const o = obstacles[i];
          o.x -= speed;
          const y =
            o.type === 'laser'
              ? (o.y ?? GROUND_Y - 26)
              : o.type === 'drone'
              ? 165 + Math.sin((frame + o.x) / 13) * 14
              : o.type === 'waterBalloon'
              ? 196 + Math.sin((frame + o.x) / 16) * 32
              : o.type === 'bomb'
              ? GROUND_Y - o.h + Math.sin(frame / 5) * 2
              : GROUND_Y - o.h;
          if (o.x + o.w < 0) {
            obstacles.splice(i, 1);
            clearedObstacles += 1;
            setScore(clearedObstacles);
            continue;
          }
          const collisionTop = o.type === 'drone' ? y + 11 : o.type === 'banana' ? y + 8 : y + 4;
          const collisionBottom =
            o.type === 'drone' ? y + 28 : o.type === 'banana' ? y + o.h : y + o.h - 2;
          const collision =
            overlap(67, 97, o.x + 4, o.x + o.w - 4) &&
            overlap(player.y + 7, player.y + PLAYER_SIZE - 5, collisionTop, collisionBottom);
          if (collision && player.invincible === 0) {
            if (player.shield > 0) {
              player.shield = 0;
              player.invincible = 45;
              obstacles.splice(i, 1);
            } else {
              finish();
              return;
            }
          }
        }

        for (let i = items.length - 1; i >= 0; i -= 1) {
          const item = items[i];
          item.x -= speed;
          if (item.x < 0) {
            items.splice(i, 1);
            continue;
          }
          if (
            overlap(58, 106, item.x - 12, item.x + 12) &&
            overlap(player.y, player.y + PLAYER_SIZE, item.y - 12, item.y + 12)
          ) {
            if (item.kind === 'shield') {
              player.shield = 520;
            } else {
              clearedObstacles += 1;
              setScore(clearedObstacles);
            }
            items.splice(i, 1);
          }
        }
      }
      if (simulationSteps >= 3) frameAccumulator = 0;

      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
      ctx.filter = 'none';
      ctx.shadowColor = 'rgba(0,0,0,0)';
      ctx.shadowBlur = 0;

      const stageNumber = Math.min(stageThemes.length - 1, Math.floor(clearedObstacles / 50));
      const theme = stageThemes[stageNumber];
      ctx.fillStyle = stageGradients[stageNumber];
      ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

      ctx.save();
      ctx.globalAlpha = 0.18;
      ctx.fillStyle = theme.glow;
      for (let i = 0; i < 9; i += 1) {
        const bx = ((i * 104 - frame * speed * 0.07) % (GAME_WIDTH + 120)) - 40;
        const bh = 28 + ((i * 23 + stageNumber * 17) % 70);
        ctx.fillRect(bx, GROUND_Y - bh, 48 + (i % 3) * 14, bh);
      }
      ctx.restore();

      for (let i = 0; i < 12; i += 1) {
        ctx.globalAlpha = 0.28;
        ctx.fillStyle = i % 3 ? '#5de4ff' : '#ff62c0';
        const sx = (i * 89 - frame * speed * 0.18) % (GAME_WIDTH + 80);
        ctx.fillRect(sx < 0 ? sx + GAME_WIDTH + 80 : sx, 65 + (i % 5) * 27, 2, 2);
      }

      ctx.globalAlpha = 1;
      ctx.fillStyle = theme.ground;
      ctx.fillRect(0, GROUND_Y, GAME_WIDTH, GAME_HEIGHT - GROUND_Y);
      ctx.strokeStyle = theme.line;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, GROUND_Y);
      ctx.lineTo(GAME_WIDTH, GROUND_Y);
      ctx.stroke();

      pits.forEach((pit) => {
        ctx.save();
        ctx.fillStyle = abyssGradient;
        ctx.fillRect(pit.x, GROUND_Y - 2, pit.w, GAME_HEIGHT - GROUND_Y + 2);
        ctx.shadowColor = '#ff2f8b';
        ctx.shadowBlur = 12;
        ctx.strokeStyle = '#ff77bd';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(pit.x, GROUND_Y);
        ctx.lineTo(pit.x, GAME_HEIGHT);
        ctx.moveTo(pit.x + pit.w, GROUND_Y);
        ctx.lineTo(pit.x + pit.w, GAME_HEIGHT);
        ctx.stroke();
        ctx.restore();
      });

      items.forEach((item) => {
        ctx.save();
        ctx.globalAlpha = 1;
        ctx.fillStyle = '#ffffff';
        ctx.font = '26px "Apple Color Emoji", "Segoe UI Emoji", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(item.kind === 'shield' ? '🛡️' : '⭐', item.x, item.y);
        ctx.restore();
      });

      obstacles.forEach((o) => {
        const y =
          o.type === 'laser'
            ? (o.y ?? GROUND_Y - 26)
            : o.type === 'drone'
            ? 165 + Math.sin((frame + o.x) / 13) * 14
            : o.type === 'waterBalloon'
            ? 196 + Math.sin((frame + o.x) / 16) * 32
            : o.type === 'bomb'
            ? GROUND_Y - o.h + Math.sin(frame / 5) * 2
            : GROUND_Y - o.h;

        if (o.type === 'barrier') {
          ctx.fillStyle = '#ff5a61';
          ctx.fillRect(o.x, y, o.w, o.h);
          ctx.fillStyle = '#ffd45f';
          ctx.fillRect(o.x + 5, y + 12, o.w - 10, 8);
        }
        if (o.type === 'sign') {
          ctx.fillStyle = '#55e2ff';
          ctx.fillRect(o.x + 10, y, 7, o.h);
          ctx.fillStyle = '#fff';
          ctx.fillRect(o.x, y, o.w, 23);
        }
        if (o.type === 'drone') {
          ctx.fillStyle = '#ff62c0';
          ctx.fillRect(o.x, y + 11, o.w, 17);
          ctx.fillStyle = '#b6f6ff';
          ctx.fillRect(o.x + 8, y + 15, o.w - 16, 5);
        }
        if (o.type === 'laser') {
          ctx.save();
          ctx.fillStyle = '#3b174e';
          ctx.fillRect(o.x, y, 8, o.h);
          ctx.fillRect(o.x + o.w - 8, y, 8, o.h);
          ctx.shadowColor = '#ff2f8b';
          ctx.shadowBlur = 10;
          ctx.fillStyle = '#ff2f8b';
          ctx.fillRect(o.x + 8, y + 8, o.w - 16, 4);
          ctx.restore();
        }
        if (o.type === 'banana') {
          ctx.save();
          if (bananaImgRef.current) {
            ctx.imageSmoothingEnabled = true;
            ctx.drawImage(bananaImgRef.current, o.x - 4, y - 5, o.w + 8, o.h + 7);
          } else {
            ctx.font = '28px "Apple Color Emoji", "Segoe UI Emoji", sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('🍌', o.x + o.w / 2, y + o.h / 2);
          }
          ctx.restore();
        }
        if (o.type === 'bomb') {
          ctx.save();
          ctx.translate(o.x + 19, y + 20);
          ctx.rotate(frame * 0.08);
          ctx.fillStyle = '#17131e';
          ctx.beginPath();
          ctx.arc(0, 0, 16, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#8d78a8';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(9, -13);
          ctx.quadraticCurveTo(18, -24, 21, -15);
          ctx.stroke();
          ctx.fillStyle = frame % 12 < 6 ? '#ffd45f' : '#ff5a61';
          ctx.fillRect(19, -19, 5, 5);
          ctx.restore();
        }
        if (o.type === 'waterBalloon') {
          ctx.save();
          ctx.fillStyle = '#66d9ff';
          ctx.strokeStyle = '#d7f8ff';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.ellipse(o.x + 17, y + 18, 15, 18, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          ctx.fillStyle = '#b9f3ff';
          ctx.fillRect(o.x + 10, y + 9, 6, 5);
          ctx.fillStyle = '#2b91c4';
          ctx.beginPath();
          ctx.moveTo(o.x + 14, y + 36);
          ctx.lineTo(o.x + 20, y + 36);
          ctx.lineTo(o.x + 17, y + 42);
          ctx.fill();
          ctx.restore();
        }
      });

      if (player.shield > 0) {
        ctx.strokeStyle = '#9bfbff';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(82, player.y + 24, 34, 0, Math.PI * 2);
        ctx.stroke();
      }
      drawPlazaAvatarOnCanvas(ctx, 58, player.y, PLAYER_SIZE, propsRef.current.avatarLook);

      ctx.fillStyle = '#0c0c23';
      ctx.fillRect(18, 15, 220, 44);
      ctx.strokeStyle = '#5de4ff';
      ctx.strokeRect(18, 15, 220, 44);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 18px monospace';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';
      ctx.fillText(`RUN  ${String(clearedObstacles).padStart(3, '0')} / ∞`, 30, 43);
      ctx.fillStyle = theme.line;
      ctx.font = 'bold 12px monospace';
      ctx.textAlign = 'right';
      ctx.fillText(`ZONE ${stageNumber + 1} · ${theme.name}`, GAME_WIDTH - 18, 30);

      frameRef.current = requestAnimationFrame(loop);
    };

    frameRef.current = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(frameRef.current);
      window.removeEventListener('keydown', playKey);
    };
  }, [gameState]);

  useEffect(() => {
    if (gameState === 'READY' && canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (!ctx) return;
      ctx.fillStyle = '#090f2e';
      ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
      ctx.fillStyle = '#514579';
      ctx.fillRect(0, GROUND_Y, GAME_WIDTH, GAME_HEIGHT - GROUND_Y);
      ctx.strokeStyle = '#5de4ff';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, GROUND_Y);
      ctx.lineTo(GAME_WIDTH, GROUND_Y);
      ctx.stroke();
      drawPlazaAvatarOnCanvas(ctx, 58, GROUND_Y - PLAYER_SIZE, PLAYER_SIZE, avatarLook);
    }
  }, [gameState, avatarLook]);

  return (
    <div
      className="space-y-3 select-none"
      onContextMenu={(e) => e.preventDefault()}
      onDragStart={(e) => e.preventDefault()}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 rounded-2xl bg-slate-950/80 border border-white/10 text-xs">
        <span className="font-extrabold text-sky-300">{t.miniRunPassed(score)}</span>
        <span className="font-bold text-pink-400">{t.miniBestScore(bestScore)}</span>
      </div>

      <div className="relative w-full rounded-2xl overflow-hidden border-2 border-indigo-400/40 bg-[#090f2e] shadow-xl">
        <canvas
          ref={canvasRef}
          width={GAME_WIDTH}
          height={GAME_HEIGHT}
          className="w-full h-auto cursor-pointer block"
          style={{ touchAction: 'none' }}
          onPointerDown={(e) => {
            e.preventDefault();
            if (stateRef.current === 'PLAYING') jumpActionRef.current();
            else start();
          }}
        />

        {gameState === 'READY' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#070715cc] text-white p-4 text-center pointer-events-none">
            <h3
              className="text-2xl sm:text-3xl font-black text-[#ff62c0]"
              style={{ textShadow: '0 0 14px #ff62c0' }}
            >
              READY?
            </h3>
            <p className="font-bold text-xs sm:text-sm text-white mt-2">
              {t.miniRunReadyGoal}
            </p>
            <p className="text-xs text-[#5de4ff] mt-1">{t.miniRunReadySub}</p>
            <span className="mt-4 px-4 py-2 rounded-xl bg-white text-slate-950 text-xs sm:text-sm font-black shadow-lg animate-pulse">
              {t.miniRunReadyStart}
            </span>
          </div>
        )}

        {gameState === 'GAMEOVER' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#070715d9] text-white p-4 text-center">
            <h3
              className="text-2xl sm:text-3xl font-black text-[#ff5a61]"
              style={{ textShadow: '0 0 14px #ff5a61' }}
            >
              GAME OVER
            </h3>
            <p className="text-base sm:text-lg font-extrabold text-white mt-2">
              {t.miniRunGameOverCount(finalScore)}
            </p>
            <p className="text-xs sm:text-sm font-bold text-[#ff62c0] mt-0.5">
              {t.miniBestScore(Math.max(bestScore, finalScore))}
            </p>
            <button
              onClick={start}
              className="mt-4 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-500 hover:to-sky-400 text-xs sm:text-sm font-extrabold text-white shadow-lg flex items-center gap-1.5 transition active:scale-95"
            >
              <RotateCcw className="w-4 h-4" />
              <span>{t.miniTryAgain}</span>
            </button>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between gap-2 text-[11px] text-slate-300 px-1">
        <span>{t.miniRunControls}</span>
        <button
          type="button"
          onPointerDown={(e) => {
            e.preventDefault();
            if (stateRef.current === 'PLAYING') jumpActionRef.current();
            else start();
          }}
          className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-extrabold text-white active:scale-95 transition shrink-0"
        >
          {t.miniJumpBtn}
        </button>
      </div>
    </div>
  );
}

export function MiniGameRoofBreaker({
  avatarLook,
  bestScore,
  onUpdateBestScore,
  onRewardToast,
}: {
  avatarLook: MiniGameAvatarLook;
  bestScore: number;
  onAddJumps?: (amount: number) => void;
  onUpdateBestScore: (score: number) => void;
  onRewardToast: (msg: string) => void;
}) {
  const { t } = useI18n();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [gameState, setGameState] = useState<'READY' | 'PLAYING' | 'GAMEOVER'>('READY');
  const [score, setScore] = useState<number>(0);
  const [finalScore, setFinalScore] = useState<number>(0);

  const frameRef = useRef<number>(0);
  const stateRef = useRef<'READY' | 'PLAYING' | 'GAMEOVER'>('READY');
  const keysRef = useRef<{ left: boolean; right: boolean }>({ left: false, right: false });

  const propsRef = useRef({ avatarLook, onUpdateBestScore, onRewardToast, t });
  useEffect(() => {
    propsRef.current = { avatarLook, onUpdateBestScore, onRewardToast, t };
  }, [avatarLook, onUpdateBestScore, onRewardToast, t]);

  const DIFFICULTY_ALTITUDE = 1500;
  const GAME_WIDTH = 420;
  const GAME_HEIGHT = 610;
  const PLAYER_SIZE = 42;
  const PIXELS_PER_METER = 7.5;

  const start = useCallback(() => {
    keysRef.current = { left: false, right: false };
    stateRef.current = 'PLAYING';
    setScore(0);
    setFinalScore(0);
    setGameState('PLAYING');
  }, []);

  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (['Space', 'Enter'].includes(e.code) && stateRef.current !== 'PLAYING') {
        e.preventDefault();
        start();
      }
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [start]);

  useEffect(() => {
    if (gameState !== 'PLAYING') return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const player = { x: 189, y: GAME_HEIGHT - 125, vx: 0, vy: -13.1 };

    const getPlatformWidth = (altitude: number) => {
      const difficulty = Math.min(1, Math.max(0, altitude) / DIFFICULTY_ALTITUDE);
      return 145 - (145 - 50) * Math.pow(difficulty, 1.05);
    };

    const platforms: Array<{
      x: number;
      y: number;
      w: number;
      type: 'normal' | 'moving' | 'fragile' | 'boost';
      dir: number;
      used: boolean;
    }> = [
      {
        x: GAME_WIDTH / 2 - 72.5,
        y: GAME_HEIGHT - 20,
        w: 145,
        type: 'normal',
        dir: 1,
        used: false,
      },
    ];
    let lastY = GAME_HEIGHT - 20;

    for (let i = 1; i < 12; i++) {
      const diff = i / 12;
      const g = 58 + diff * 12;
      lastY -= g;
      const altitude = Math.max(0, (GAME_HEIGHT - 20 - lastY) / PIXELS_PER_METER);
      const w = getPlatformWidth(altitude);
      platforms.push({
        x: Math.random() * (GAME_WIDTH - w),
        y: lastY,
        w,
        type: 'normal',
        dir: Math.random() > 0.5 ? 1 : -1,
        used: false,
      });
    }

    let camera = 0;
    let best = 0;
    let reported = 0;
    let done = false;

    const addPlatform = () => {
      if (platforms.length === 0) return;
      const highestY = platforms[platforms.length - 1].y;
      const heightFromStart = Math.max(0, GAME_HEIGHT - 20 - highestY);
      const estimatedAltitude = heightFromStart / PIXELS_PER_METER;
      const difficulty = Math.min(1, estimatedAltitude / DIFFICULTY_ALTITUDE);

      const minGap = 52 + difficulty * 20;
      const randomGap = Math.random() * (8 + difficulty * 15);
      const gap = minGap + randomGap;

      lastY = highestY - gap;
      const nextAltitude = Math.max(0, (GAME_HEIGHT - 20 - lastY) / PIXELS_PER_METER);
      const width = getPlatformWidth(nextAltitude);
      const lastX = Math.max(
        8,
        Math.min(GAME_WIDTH - width - 8, Math.random() * (GAME_WIDTH - width))
      );

      let movingChance = 0;
      if (estimatedAltitude >= 800) movingChance = 0.5;
      else if (estimatedAltitude >= 400) movingChance = 0.38;
      else if (estimatedAltitude >= 300) movingChance = 0.25;
      else if (estimatedAltitude >= 200) movingChance = 0.14;
      else if (estimatedAltitude >= 120) movingChance = 0.05;

      let type: 'normal' | 'moving' | 'fragile' | 'boost' =
        Math.random() < movingChance ? 'moving' : 'normal';
      if (estimatedAltitude > 500 && Math.random() < 0.2) type = 'fragile';
      if (Math.random() > 0.92) type = 'boost';

      platforms.push({
        x: lastX,
        y: lastY,
        w: width,
        type,
        dir: Math.random() > 0.5 ? 1 : -1,
        used: false,
      });
    };

    const keyDown = (e: KeyboardEvent) => {
      if (['ArrowLeft', 'KeyA'].includes(e.code)) {
        keysRef.current.left = true;
        e.preventDefault();
      }
      if (['ArrowRight', 'KeyD'].includes(e.code)) {
        keysRef.current.right = true;
        e.preventDefault();
      }
    };
    const keyUp = (e: KeyboardEvent) => {
      if (['ArrowLeft', 'KeyA'].includes(e.code)) keysRef.current.left = false;
      if (['ArrowRight', 'KeyD'].includes(e.code)) keysRef.current.right = false;
    };

    window.addEventListener('keydown', keyDown);
    window.addEventListener('keyup', keyUp);

    const finish = () => {
      if (done) return;
      done = true;
      keysRef.current = { left: false, right: false };
      stateRef.current = 'GAMEOVER';
      setGameState('GAMEOVER');
      setFinalScore(best);

      const { onUpdateBestScore: updateBest, onRewardToast: toast, t: curT } = propsRef.current;
      updateBest(best);
      toast(curT.miniRoofToast(best));
    };

    const drawBackground = (c: CanvasRenderingContext2D, alt: number) => {
      const bg = c.createLinearGradient(0, 0, 0, GAME_HEIGHT);
      if (alt < 200) {
        bg.addColorStop(0, '#2a1e12');
        bg.addColorStop(1, '#110b05');
      } else if (alt < 500) {
        bg.addColorStop(0, '#4facfe');
        bg.addColorStop(1, '#00f2fe');
      } else if (alt < 800) {
        bg.addColorStop(0, '#1a2a6c');
        bg.addColorStop(1, '#112b3c');
      } else {
        bg.addColorStop(0, '#0f0c29');
        bg.addColorStop(1, '#302b63');
      }
      c.fillStyle = bg;
      c.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    };

    const FIXED_FRAME_MS = 1000 / 60;
    let lastFrameTime = performance.now();
    let frameAccumulator = 0;

    const loop = (timestamp = performance.now()) => {
      frameAccumulator += Math.min(100, Math.max(0, timestamp - lastFrameTime)) / FIXED_FRAME_MS;
      lastFrameTime = timestamp;
      let simulationSteps = 0;

      while (frameAccumulator >= 1 && simulationSteps < 6) {
        frameAccumulator -= 1;
        simulationSteps += 1;

        const keys = keysRef.current;
        player.vx += keys.left ? -0.72 : keys.right ? 0.72 : -player.vx * 0.16;
        player.vx = Math.max(-6.4, Math.min(6.4, player.vx));
        player.x += player.vx;
        if (player.x < -PLAYER_SIZE) player.x = GAME_WIDTH;
        if (player.x > GAME_WIDTH) player.x = -PLAYER_SIZE;

        player.vy += 0.6;
        const oldBottom = player.y + PLAYER_SIZE;
        player.y += player.vy;

        const playerScreenY = player.y - camera;
        if (player.vy > 0 && playerScreenY > GAME_HEIGHT - PLAYER_SIZE + 8) {
          finish();
          return;
        }

        platforms.forEach((p) => {
          if (p.type === 'moving') {
            const moveSpeed =
              1.1 +
              Math.min(
                1,
                Math.max(0, (GAME_HEIGHT - p.y) / PIXELS_PER_METER) / DIFFICULTY_ALTITUDE
              ) *
                1.5;
            p.x += p.dir * moveSpeed;
            if (p.x < 0 || p.x + p.w > GAME_WIDTH) p.dir *= -1;
          }
        });

        if (player.vy > 0) {
          for (const p of platforms) {
            const platformScreenY = p.y - camera;
            const platformIsVisible = platformScreenY >= -12 && platformScreenY <= GAME_HEIGHT;
            const landing =
              platformIsVisible &&
              !p.used &&
              oldBottom <= p.y + 12 &&
              player.y + PLAYER_SIZE >= p.y &&
              player.x + PLAYER_SIZE - 8 > p.x &&
              player.x + 8 < p.x + p.w;
            if (landing) {
              player.vy = p.type === 'boost' ? -16.5 : -13.2;
              if (p.type === 'fragile') p.used = true;
              break;
            }
          }
        }

        if (player.y < camera + 265) camera = player.y - 265;

        if (platforms.length > 0) {
          while (platforms.length > 0 && platforms[platforms.length - 1].y > camera - 260) {
            addPlatform();
          }
          while (platforms.length > 0 && platforms[0].y > camera + GAME_HEIGHT + 80) {
            platforms.shift();
          }
        }

        best = Math.max(best, Math.floor(Math.max(0, -camera / PIXELS_PER_METER)));
        if (best !== reported) {
          reported = best;
          setScore(best);
        }
        if (player.y - camera > GAME_HEIGHT - PLAYER_SIZE + 8) {
          finish();
          return;
        }
      }
      if (simulationSteps >= 6) frameAccumulator = 0;

      drawBackground(ctx, best);

      platforms.forEach((p) => {
        const y = p.y - camera;
        if (y < -20 || y > GAME_HEIGHT + 20 || p.used) return;
        const color =
          p.type === 'moving'
            ? '#ff62c0'
            : p.type === 'boost'
            ? '#ffd45f'
            : p.type === 'fragile'
            ? '#a982f2'
            : '#5de4ff';
        ctx.fillStyle = color;
        ctx.fillRect(p.x, y, p.w, 11);
        ctx.fillStyle = 'rgba(255,255,255,.78)';
        ctx.fillRect(p.x + 3, y + 2, p.w - 6, 2);
      });

      drawPlazaAvatarOnCanvas(
        ctx,
        player.x,
        player.y - camera,
        PLAYER_SIZE,
        propsRef.current.avatarLook
      );

      ctx.fillStyle = 'rgba(6,8,28,.85)';
      ctx.fillRect(12, 14, 215, 44);
      ctx.strokeStyle = '#5de4ff';
      ctx.strokeRect(12, 14, 215, 44);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 18px monospace';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';
      ctx.fillText(`ALT ${String(best).padStart(4, '0')}M / ∞`, 24, 43);

      frameRef.current = requestAnimationFrame(loop);
    };

    frameRef.current = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(frameRef.current);
      window.removeEventListener('keydown', keyDown);
      window.removeEventListener('keyup', keyUp);
    };
  }, [gameState]);

  useEffect(() => {
    if (gameState === 'READY' && canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (!ctx) return;
      const bg = ctx.createLinearGradient(0, 0, 0, GAME_HEIGHT);
      bg.addColorStop(0, '#2a1e12');
      bg.addColorStop(1, '#110b05');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

      ctx.fillStyle = '#5de4ff';
      ctx.fillRect(145, GAME_HEIGHT - 45, 130, 11);
      ctx.fillStyle = 'rgba(255,255,255,.78)';
      ctx.fillRect(148, GAME_HEIGHT - 43, 124, 2);

      drawPlazaAvatarOnCanvas(
        ctx,
        GAME_WIDTH / 2 - PLAYER_SIZE / 2,
        GAME_HEIGHT - 125,
        PLAYER_SIZE,
        avatarLook
      );
    }
  }, [gameState, avatarLook]);

  const stopMove = () => {
    keysRef.current.left = false;
    keysRef.current.right = false;
  };

  return (
    <div
      className="space-y-3 select-none flex flex-col items-center"
      onContextMenu={(e) => e.preventDefault()}
      onDragStart={(e) => e.preventDefault()}
    >
      <div className="w-full flex flex-wrap items-center justify-between gap-2 px-3 py-2 rounded-2xl bg-slate-950/80 border border-white/10 text-xs">
        <span className="font-extrabold text-sky-300">{t.miniRoofAltitude(score)}</span>
        <span className="font-bold text-cyan-300">{t.miniRoofBest(bestScore)}</span>
      </div>

      <div className="relative w-full max-w-[330px] rounded-2xl overflow-hidden border-2 border-sky-400/40 bg-[#211535] shadow-xl">
        <canvas
          ref={canvasRef}
          width={GAME_WIDTH}
          height={GAME_HEIGHT}
          className="w-full h-auto cursor-crosshair block"
          style={{ touchAction: 'none' }}
          onPointerDown={(e) => {
            e.preventDefault();
            e.currentTarget.setPointerCapture?.(e.pointerId);
            if (stateRef.current !== 'PLAYING') {
              start();
              return;
            }
            const rect = e.currentTarget.getBoundingClientRect();
            const isLeft = e.clientX - rect.left < rect.width / 2;
            keysRef.current.left = isLeft;
            keysRef.current.right = !isLeft;
          }}
          onPointerUp={(e) => {
            e.preventDefault();
            if (e.currentTarget.hasPointerCapture?.(e.pointerId)) {
              e.currentTarget.releasePointerCapture(e.pointerId);
            }
            stopMove();
          }}
          onPointerCancel={stopMove}
          onPointerLeave={stopMove}
        />

        {gameState === 'READY' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#070715cc] text-white p-4 text-center pointer-events-none">
            <h3
              className="text-2xl sm:text-3xl font-black text-[#5de4ff]"
              style={{ textShadow: '0 0 14px #5de4ff' }}
            >
              READY?
            </h3>
            <p className="font-bold text-xs sm:text-sm text-white mt-2">
              {t.miniRoofReadyGoal}
            </p>
            <p className="text-xs text-[#5de4ff] mt-1">{t.miniRoofReadySub}</p>
            <span className="mt-4 px-4 py-2 rounded-xl bg-white text-slate-950 text-xs font-black shadow-lg animate-pulse">
              {t.miniRoofReadyStart}
            </span>
          </div>
        )}

        {gameState === 'GAMEOVER' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#070715d9] text-white p-4 text-center">
            <h3
              className="text-2xl sm:text-3xl font-black text-[#ff5a61]"
              style={{ textShadow: '0 0 14px #ff5a61' }}
            >
              GAME OVER
            </h3>
            <p className="text-base sm:text-lg font-extrabold text-white mt-2">
              {t.miniRoofFinal(finalScore)}
            </p>
            <p className="text-xs sm:text-sm font-bold text-[#5de4ff] mt-0.5">
              {t.miniRoofBest(Math.max(bestScore, finalScore))}
            </p>
            <button
              onClick={start}
              className="mt-4 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-sky-500 hover:from-indigo-500 hover:to-sky-400 text-xs sm:text-sm font-extrabold text-white shadow-lg flex items-center gap-1.5 transition active:scale-95"
            >
              <RotateCcw className="w-4 h-4" />
              <span>{t.miniTryAgain}</span>
            </button>
          </div>
        )}
      </div>

      <div className="w-full max-w-[330px] grid grid-cols-2 gap-2">
        <button
          type="button"
          onPointerDown={(e) => {
            e.preventDefault();
            if (stateRef.current !== 'PLAYING') start();
            keysRef.current.left = true;
            keysRef.current.right = false;
          }}
          onPointerUp={stopMove}
          onPointerLeave={stopMove}
          onPointerCancel={stopMove}
          className="py-2.5 rounded-2xl bg-slate-800 hover:bg-sky-600/40 border border-white/15 text-xs font-extrabold text-white active:scale-95 transition"
        >
          {t.miniRoofLeft}
        </button>
        <button
          type="button"
          onPointerDown={(e) => {
            e.preventDefault();
            if (stateRef.current !== 'PLAYING') start();
            keysRef.current.right = true;
            keysRef.current.left = false;
          }}
          onPointerUp={stopMove}
          onPointerLeave={stopMove}
          onPointerCancel={stopMove}
          className="py-2.5 rounded-2xl bg-slate-800 hover:bg-sky-600/40 border border-white/15 text-xs font-extrabold text-white active:scale-95 transition"
        >
          {t.miniRoofRight}
        </button>
      </div>
    </div>
  );
}
