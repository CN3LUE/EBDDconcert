import {
  LANE_RADII,
  PLAZA_GROUND_RADIUS,
  TRACK_CENTER_X,
  TRACK_CENTER_Z,
} from '../constants/plazaData';
import type { DomeAlbumSpineInfo } from '../types/plaza';

export function drawRoundedRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

export function createNameTagTexture(
  THREE: any,
  name: string,
  speech?: string,
  isMe?: boolean
) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 192;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 말풍선 (상단)
    if (speech && speech.trim()) {
      const msg = speech.trim().slice(0, 32);
      ctx.font = '700 22px system-ui, -apple-system, sans-serif';
      const tw = Math.min(460, ctx.measureText(msg).width + 44);
      const bx = (canvas.width - tw) / 2;
      const by = 14;
      const bh = 58;

      ctx.fillStyle = 'rgba(255, 255, 255, 0.96)';
      drawRoundedRectPath(ctx, bx, by, tw, bh, 22);
      ctx.fill();
      ctx.strokeStyle = isMe ? '#2563eb' : '#94a3b8';
      ctx.lineWidth = 3;
      ctx.stroke();

      // 꼬리 삼각형
      ctx.beginPath();
      ctx.moveTo(canvas.width / 2 - 10, by + bh);
      ctx.lineTo(canvas.width / 2 + 10, by + bh);
      ctx.lineTo(canvas.width / 2, by + bh + 12);
      ctx.closePath();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.96)';
      ctx.fill();

      ctx.fillStyle = '#0f172a';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(msg, canvas.width / 2, by + bh / 2 + 1, tw - 24);
    }

    // 이름 배지 (하단)
    const label = name || '보이스팬';
    ctx.font = '800 26px system-ui, -apple-system, sans-serif';
    const nw = Math.min(380, Math.max(150, ctx.measureText(label).width + 48));
    const nx = (canvas.width - nw) / 2;
    const ny = 104;
    const nh = 54;

    ctx.fillStyle = isMe ? 'rgba(37, 99, 235, 0.92)' : 'rgba(15, 23, 42, 0.84)';
    drawRoundedRectPath(ctx, nx, ny, nw, nh, 24);
    ctx.fill();
    ctx.strokeStyle = isMe ? '#7dd3fc' : 'rgba(255,255,255,0.28)';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, canvas.width / 2, ny + nh / 2 + 1, nw - 24);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

// KSPO DOME 대형 전광판 및 러닝 트랙 아치 배너용 고해상도 텍스처 생성기
export function createMarqueeTexture(
  THREE: any,
  title: string,
  subtitle: string,
  accentHex = '#38bdf8'
) {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    grad.addColorStop(0, '#071436');
    grad.addColorStop(0.5, '#0f2966');
    grad.addColorStop(1, '#071436');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 은은한 LED 스캔라인 패턴
    ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
    for (let y = 0; y < canvas.height; y += 6) {
      ctx.fillRect(0, y, canvas.width, 2);
    }

    // 네온 외곽 프레임
    ctx.strokeStyle = accentHex;
    ctx.lineWidth = 8;
    drawRoundedRectPath(ctx, 14, 14, canvas.width - 28, canvas.height - 28, 22);
    ctx.stroke();

    // 메인 타이틀
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 58px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(title, canvas.width / 2, 102, canvas.width - 80);

    // 서브 타이틀
    ctx.fillStyle = accentHex;
    ctx.font = '700 28px system-ui, -apple-system, sans-serif';
    ctx.fillText(subtitle, canvas.width / 2, 174, canvas.width - 80);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

// 업로드된 EBDD 에바뛰콘 로고/포스터 이미지를 전광판에 선명하게 띄우는 텍스처 생성기
export function createEbddLogoScreenTexture(
  THREE: any,
  imageUrl: string,
  options?: {
    width?: number;
    height?: number;
    footerText?: string;
    accentHex?: string;
  }
) {
  const canvas = document.createElement('canvas');
  canvas.width = options?.width ?? 1280;
  canvas.height = options?.height ?? 512;
  const ctx = canvas.getContext('2d');
  const accentHex = options?.accentHex ?? '#2563eb';
  const footerText = options?.footerText;

  const paintBaseAndFrame = (drawFallbackText: boolean) => {
    if (!ctx) return;
    // 로고·포스터 배경톤(#eae9e4)과 자연스럽게 어우러지는 바탕
    ctx.fillStyle = '#eae9e4';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (drawFallbackText) {
      ctx.fillStyle = '#111827';
      ctx.font = `900 ${Math.round(canvas.height * 0.24)}px system-ui, -apple-system, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('EBDD 에바뛰콘', canvas.width / 2, canvas.height * 0.44);

      ctx.fillStyle = accentHex;
      ctx.font = `800 ${Math.round(canvas.height * 0.09)}px system-ui, -apple-system, sans-serif`;
      ctx.fillText("KEEP DREAMIN' KEEP RUNNIN'", canvas.width / 2, canvas.height * 0.68);
    }
  };

  const paintChromeAndFooter = () => {
    if (!ctx) return;
    if (footerText) {
      const barH = Math.round(canvas.height * 0.145);
      const barY = canvas.height - barH - 14;
      ctx.fillStyle = '#0f172a';
      drawRoundedRectPath(ctx, 20, barY, canvas.width - 40, barH, 14);
      ctx.fill();

      ctx.fillStyle = '#f8fafc';
      ctx.font = `800 ${Math.max(20, Math.round(barH * 0.52))}px system-ui, -apple-system, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(footerText, canvas.width / 2, barY + barH / 2 + 1, canvas.width - 80);
    }

    // 전광판 로열블루 LED 베젤 프레임
    ctx.strokeStyle = accentHex;
    ctx.lineWidth = 12;
    drawRoundedRectPath(ctx, 6, 6, canvas.width - 12, canvas.height - 12, 18);
    ctx.stroke();

    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 3;
    drawRoundedRectPath(ctx, 14, 14, canvas.width - 28, canvas.height - 28, 12);
    ctx.stroke();
  };

  paintBaseAndFrame(true);
  paintChromeAndFooter();

  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;

  if (typeof Image !== 'undefined' && ctx) {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      paintBaseAndFrame(false);
      const padX = 28;
      const padTop = 22;
      const padBottom = footerText ? Math.round(canvas.height * 0.175) + 16 : 22;
      const availW = canvas.width - padX * 2;
      const availH = canvas.height - padTop - padBottom;
      const scale = Math.min(availW / img.naturalWidth, availH / img.naturalHeight);
      const drawW = img.naturalWidth * scale;
      const drawH = img.naturalHeight * scale;
      const drawX = padX + (availW - drawW) / 2;
      const drawY = padTop + (availH - drawH) / 2;
      ctx.drawImage(img, drawX, drawY, drawW, drawH);
      paintChromeAndFooter();
      tex.needsUpdate = true;
    };
    img.src = imageUrl;
  }

  return tex;
}

// 좌석 구역 번호 / 레인 표지판 / CONSOLE 배지 텍스처 생성기
export function createSeatLabelTexture(THREE: any, text: string, bgHex = '#0284c7') {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = bgHex;
    drawRoundedRectPath(ctx, 16, 20, 224, 88, 30);
    ctx.fill();

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.lineWidth = 5;
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = '900 40px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, canvas.width / 2, canvas.height / 2 + 2, 196);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

// KSPO DOME 외부 광장 및 5레인 블루 러닝 트랙 바닥 텍스처 생성기
export function createPlazaGroundTexture(THREE: any) {
  const size = 2048;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    const toCanvasX = (wx: number) => ((wx / PLAZA_GROUND_RADIUS + 1) * 0.5) * size;
    const toCanvasY = (wz: number) => ((wz / PLAZA_GROUND_RADIUS + 1) * 0.5) * size;
    const toCanvasR = (wr: number) => (wr / PLAZA_GROUND_RADIUS) * 0.5 * size;

    // 1) 전체 공원 광장 기본 석재 바닥
    ctx.fillStyle = '#d8e2ee';
    ctx.fillRect(0, 0, size, size);

    // 외곽 올공 잔디밭 테두리
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, toCanvasR(57.5), 0, Math.PI * 2);
    ctx.fillStyle = '#4ade80';
    ctx.fill();

    ctx.beginPath();
    ctx.arc(size / 2, size / 2, toCanvasR(42), 0, Math.PI * 2);
    ctx.fillStyle = '#e2e8f0';
    ctx.fill();

    // 은은한 보도블록 그리드
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.25)';
    ctx.lineWidth = 2;
    for (let i = 0; i <= size; i += 64) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, size);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(size, i);
      ctx.stroke();
    }

    // 2) 트랙 북쪽 -> KSPO DOME 정문 진입 블루 카펫 통로
    const gatePathW = toCanvasR(8.2);
    const gateTopY = toCanvasY(-23.5);
    const gateBotY = toCanvasY(TRACK_CENTER_Z - LANE_RADII[4] + 1);
    ctx.fillStyle = '#1e3a8a';
    ctx.fillRect(toCanvasX(0) - gatePathW / 2, gateTopY, gatePathW, gateBotY - gateTopY);
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 6;
    ctx.strokeRect(toCanvasX(0) - gatePathW / 2, gateTopY, gatePathW, gateBotY - gateTopY);

    // 3) 5레인 스타디움 블루 러닝 트랙 (LANE_RADII = [14.2..18.2])
    const tcx = toCanvasX(TRACK_CENTER_X);
    const tcy = toCanvasY(TRACK_CENTER_Z);
    const outerTrackR = toCanvasR(18.8);
    const innerTrackR = toCanvasR(13.6);

    ctx.beginPath();
    ctx.arc(tcx, tcy, outerTrackR, 0, Math.PI * 2);
    ctx.fillStyle = '#1d4ed8';
    ctx.fill();

    // 트랙 중앙 꽃밭 잔디 정원
    ctx.beginPath();
    ctx.arc(tcx, tcy, innerTrackR, 0, Math.PI * 2);
    ctx.fillStyle = '#22c55e';
    ctx.fill();

    // 중앙 정원 산책로 원형 링
    ctx.beginPath();
    ctx.arc(tcx, tcy, toCanvasR(2.6), 0, Math.PI * 2);
    ctx.fillStyle = '#e2e8f0';
    ctx.fill();

    // 각 레인 흰색 경계선 (1~5레인)
    const laneBounds = [13.7, 14.7, 15.7, 16.7, 17.7, 18.7];
    laneBounds.forEach((r, idx) => {
      ctx.beginPath();
      ctx.arc(tcx, tcy, toCanvasR(r), 0, Math.PI * 2);
      ctx.strokeStyle =
        idx === 0 || idx === laneBounds.length - 1 ? '#ffffff' : 'rgba(255,255,255,0.75)';
      ctx.lineWidth = idx === 0 || idx === laneBounds.length - 1 ? 7 : 4;
      ctx.stroke();
    });

    // 남쪽 스타트 / 피니시 라인
    ctx.save();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.moveTo(tcx, tcy + toCanvasR(13.7));
    ctx.lineTo(tcx, tcy + toCanvasR(18.7));
    ctx.stroke();

    // 레인 번호 (1 ~ 5)
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 22px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    LANE_RADII.forEach((r, i) => {
      ctx.fillText(String(i + 1), tcx + 24, tcy + toCanvasR(r));
    });
    ctx.restore();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

// KSPO DOME 외벽 15칸용 CNBLUE CD 스파인 고해상도 텍스처 생성기
export function createAlbumSpineTexture(THREE: any, album: DomeAlbumSpineInfo) {
  const w = 512;
  const h = 768;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    // 1) 바탕 케이스 프레임 (투명 아크릴 CD 케이스 외곽 느낌)
    ctx.fillStyle = '#d1d5db';
    ctx.fillRect(0, 0, w, h);

    const padX = 24;
    const padTop = 30;
    const padBot = 30;
    const innerW = w - padX * 2;
    const innerH = h - padTop - padBot;

    const drawCnbluePill = (cx: number, cy: number, color: string) => {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(Math.PI / 2);
      ctx.strokeStyle = color;
      ctx.lineWidth = 5;
      drawRoundedRectPath(ctx, -56, -24, 112, 48, 24);
      ctx.stroke();
      ctx.fillStyle = color;
      ctx.font = '800 22px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('CNBLUE', 0, 1);
      ctx.restore();
    };

    const drawVerticalText = (
      text: string,
      cx: number,
      cy: number,
      font: string,
      color: string,
      maxWidth?: number
    ) => {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(Math.PI / 2);
      ctx.fillStyle = color;
      ctx.font = font;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      if (maxWidth) ctx.fillText(text, 0, 0, maxWidth);
      else ctx.fillText(text, 0, 0);
      ctx.restore();
    };

    // 2) 앨범별 고유 디자인 드로잉
    ctx.save();
    ctx.beginPath();
    ctx.rect(padX, padTop, innerW, innerH);
    ctx.clip();

    switch (album.id) {
      case 'bluetory': {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(padX, padTop, innerW, innerH);
        drawCnbluePill(w / 2, 116, '#111827');
        drawVerticalText(
          'Bluetory',
          w / 2,
          365,
          '700 84px Georgia, "Times New Roman", serif',
          '#111827',
          320
        );
        drawVerticalText(
          'CNBLUE 1ST MINI ALBUM',
          w / 2,
          602,
          '800 18px system-ui, sans-serif',
          '#111827',
          210
        );
        break;
      }

      case 'bluelove': {
        const grad = ctx.createLinearGradient(0, padTop, 0, h - padBot);
        grad.addColorStop(0, '#072a66');
        grad.addColorStop(0.5, '#09347a');
        grad.addColorStop(1, '#062254');
        ctx.fillStyle = grad;
        ctx.fillRect(padX, padTop, innerW, innerH);
        drawCnbluePill(w / 2, 112, '#ffffff');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(w / 2 - 58, 226, 116, 232);
        drawVerticalText(
          'BLUELOVE',
          w / 2,
          342,
          '900 44px system-ui, sans-serif',
          '#072a66',
          216
        );
        drawVerticalText(
          'CNBLUE 2ND MINI ALBUM',
          w / 2,
          566,
          '700 17px system-ui, sans-serif',
          '#ffffff',
          195
        );
        ctx.fillStyle = '#ffffff';
        [676, 692, 708].forEach((sy) => {
          ctx.fillRect(padX, sy, innerW, 7);
        });
        break;
      }

      case 'first_step': {
        const grad = ctx.createLinearGradient(0, padTop, 0, h - padBot);
        grad.addColorStop(0, '#9c3c0d');
        grad.addColorStop(0.35, '#d96e2b');
        grad.addColorStop(0.7, '#c75a1a');
        grad.addColorStop(1, '#8c3309');
        ctx.fillStyle = grad;
        ctx.fillRect(padX, padTop, innerW, innerH);
        ctx.strokeStyle = 'rgba(255, 220, 175, 0.14)';
        ctx.lineWidth = 3;
        for (let py = padTop; py < h - padBot; py += 28) {
          for (let px = padX; px < w - padX; px += 28) {
            ctx.beginPath();
            ctx.arc(px + 14, py + 14, 10, 0, Math.PI * 2);
            ctx.stroke();
          }
        }
        drawCnbluePill(w / 2, 114, '#ffffff');
        drawVerticalText(
          'FIRST STEP',
          w / 2,
          346,
          '900 54px Impact, "Arial Black", system-ui, sans-serif',
          '#111111',
          260
        );
        drawVerticalText(
          'CNBLUE THE 1ST ALBUM',
          w / 2,
          586,
          '800 18px system-ui, sans-serif',
          '#ffffff',
          205
        );
        break;
      }

      case 'thank_you': {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(padX, padTop, innerW, innerH);
        drawCnbluePill(w / 2, 116, '#111827');
        drawVerticalText(
          'THANK YOU',
          w / 2,
          342,
          '900 52px system-ui, sans-serif',
          '#111827',
          240
        );
        ctx.fillStyle = '#111827';
        ctx.fillRect(w / 2 - 2, 476, 4, 46);
        drawVerticalText(
          'CNBLUE FIRST STEP +1',
          w / 2,
          616,
          '800 17px system-ui, sans-serif',
          '#111827',
          195
        );
        break;
      }

      case 'ear_fun': {
        ctx.fillStyle = '#141417';
        ctx.fillRect(padX, padTop, innerW, innerH);
        ctx.fillStyle = 'rgba(255,255,255,0.03)';
        for (let y = padTop; y < h - padBot; y += 6) {
          ctx.fillRect(padX, y, innerW, 2);
        }
        drawCnbluePill(w / 2, 116, '#ffffff');
        drawVerticalText(
          'EAR FUN',
          w / 2,
          362,
          'italic 900 62px "Trebuchet MS", system-ui, sans-serif',
          '#f8fafc',
          270
        );
        drawVerticalText(
          'CNBLUE 3RD MINI ALBUM',
          w / 2,
          604,
          '800 17px system-ui, sans-serif',
          '#e2e8f0',
          205
        );
        break;
      }

      case 're_blue': {
        const grad = ctx.createLinearGradient(0, padTop, 0, h - padBot);
        grad.addColorStop(0, '#f0c893');
        grad.addColorStop(0.5, '#f6d8ac');
        grad.addColorStop(1, '#e8bc80');
        ctx.fillStyle = grad;
        ctx.fillRect(padX, padTop, innerW, innerH);
        ctx.strokeStyle = 'rgba(116, 74, 34, 0.34)';
        ctx.lineWidth = 2;
        for (let i = 0; i < 24; i++) {
          ctx.beginPath();
          ctx.moveTo(padX + ((i * 53) % innerW), padTop + ((i * 79) % innerH));
          ctx.lineTo(padX + ((i * 97 + 120) % innerW), padTop + ((i * 41 + 90) % innerH));
          ctx.stroke();
        }
        ctx.save();
        ctx.translate(w / 2, 130);
        ctx.rotate(-0.45);
        ctx.strokeStyle = '#c2410c';
        ctx.lineWidth = 4;
        ctx.strokeRect(-72, -52, 144, 104);
        ctx.restore();
        ctx.fillStyle = '#1f1308';
        ctx.fillRect(w / 2 - 58, 224, 116, 228);
        drawVerticalText(
          'Re:BLUE',
          w / 2,
          338,
          '900 50px system-ui, sans-serif',
          '#f5d5a6',
          210
        );
        drawVerticalText(
          'CNBLUE 4TH MINI ALBUM',
          w / 2,
          592,
          '800 18px system-ui, sans-serif',
          '#1f1308',
          205
        );
        break;
      }

      case 'cant_stop': {
        const grad = ctx.createLinearGradient(0, padTop, 0, h - padBot);
        grad.addColorStop(0, '#133d52');
        grad.addColorStop(0.5, '#0d2c3d');
        grad.addColorStop(1, '#0c2738');
        ctx.fillStyle = grad;
        ctx.fillRect(padX, padTop, innerW, innerH);
        drawCnbluePill(w / 2, 112, '#e2e8f0');
        ctx.strokeStyle = 'rgba(186, 214, 228, 0.45)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(w / 2, 358, 174, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(w / 2, 358, 132, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = 'rgba(203, 224, 236, 0.72)';
        ctx.font = '700 28px Georgia, serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('XI   XII   I', w / 2, 206);
        ctx.fillText('VII   VI   V', w / 2, 510);
        drawVerticalText(
          "Can't Stop",
          w / 2,
          358,
          'italic 700 58px Georgia, "Times New Roman", serif',
          '#f1f5f9',
          240
        );
        drawVerticalText(
          'CNBLUE 5TH MINI ALBUM',
          w / 2,
          622,
          '700 17px system-ui, sans-serif',
          '#e2e8f0',
          190
        );
        break;
      }

      case '2gether': {
        const grad = ctx.createLinearGradient(0, padTop, 0, h - padBot);
        grad.addColorStop(0, '#072a6b');
        grad.addColorStop(0.5, '#0b3582');
        grad.addColorStop(1, '#062259');
        ctx.fillStyle = grad;
        ctx.fillRect(padX, padTop, innerW, innerH);
        drawCnbluePill(w / 2, 114, '#ffffff');
        const drawDiamond = (rx: number, ry: number, lw: number) => {
          ctx.beginPath();
          ctx.moveTo(w / 2, 376 - ry);
          ctx.lineTo(w / 2 + rx, 376);
          ctx.lineTo(w / 2, 376 + ry);
          ctx.lineTo(w / 2 - rx, 376);
          ctx.closePath();
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = lw;
          ctx.stroke();
        };
        drawDiamond(112, 174, 4);
        drawDiamond(98, 152, 2.5);
        drawVerticalText(
          '2gether',
          w / 2,
          376,
          'italic 600 54px Georgia, "Times New Roman", serif',
          '#f8fafc',
          220
        );
        drawVerticalText(
          'CNBLUE 2ND ALBUM',
          w / 2,
          626,
          '700 18px system-ui, sans-serif',
          '#ffffff',
          185
        );
        break;
      }

      case 'blueming': {
        const grad = ctx.createLinearGradient(0, padTop, 0, h - padBot);
        grad.addColorStop(0, '#f8d878');
        grad.addColorStop(0.5, '#fde293');
        grad.addColorStop(1, '#f5cf64');
        ctx.fillStyle = grad;
        ctx.fillRect(padX, padTop, innerW, innerH);
        ctx.fillStyle = 'rgba(179, 134, 24, 0.24)';
        ctx.font = '700 108px Georgia, serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('B', w / 2 - 42, 118);
        ctx.fillText('L', w / 2 + 46, 198);
        ctx.fillText('E', w / 2 - 54, 252);
        ctx.fillText('IN', w / 2 + 12, 488);
        drawVerticalText(
          'BLUEMING',
          w / 2,
          342,
          '700 50px Georgia, "Times New Roman", serif',
          '#3d3113',
          236
        );
        drawVerticalText(
          'CNBLUE 6TH MINI ALBUM',
          w / 2,
          574,
          '800 17px system-ui, sans-serif',
          '#2e250e',
          195
        );
        ctx.fillStyle = '#3d3113';
        ctx.font = '700 32px Georgia, serif';
        ctx.fillText('II', w / 2, 704);
        break;
      }

      case '7cn': {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(padX, padTop, innerW, innerH);
        drawCnbluePill(w / 2, 118, '#0b5e78');
        drawVerticalText(
          '7°CN',
          w / 2,
          348,
          '900 72px system-ui, sans-serif',
          '#0b5e78',
          220
        );
        drawVerticalText(
          'CNBLUE 7TH MINI ALBUM',
          w / 2,
          598,
          '800 18px system-ui, sans-serif',
          '#0b5e78',
          205
        );
        break;
      }

      case 're_code': {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(padX, padTop, innerW, innerH);
        drawCnbluePill(w / 2, 116, '#0b2ca8');
        drawVerticalText(
          'RE-CODE',
          w / 2,
          356,
          '700 76px Georgia, "Times New Roman", serif',
          '#0b2ca8',
          285
        );
        drawVerticalText(
          'CNBLUE 8TH MINI ALBUM',
          w / 2,
          606,
          '800 18px system-ui, sans-serif',
          '#0b2ca8',
          210
        );
        break;
      }

      case 'wanted': {
        const grad = ctx.createLinearGradient(0, padTop, 0, h - padBot);
        grad.addColorStop(0, '#b50c11');
        grad.addColorStop(0.5, '#c81016');
        grad.addColorStop(1, '#a60a0e');
        ctx.fillStyle = grad;
        ctx.fillRect(padX, padTop, innerW, innerH);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.06)';
        for (let y = padTop; y < h - padBot; y += 5) {
          ctx.fillRect(padX, y, innerW, 2);
        }
        ctx.fillStyle = '#f59e0b';
        [58, 204, 480, 704].forEach((barY) => {
          ctx.fillRect(w / 2 - 44, barY, 88, 4);
        });
        drawCnbluePill(w / 2, 126, '#ffffff');
        drawVerticalText(
          'WANTED',
          w / 2,
          342,
          '800 68px Georgia, "Times New Roman", serif',
          '#111111',
          248
        );
        drawVerticalText(
          'CNBLUE 9TH MINI ALBUM',
          w / 2,
          594,
          '800 17px system-ui, sans-serif',
          '#ffffff',
          195
        );
        break;
      }

      case 'x': {
        const grad = ctx.createLinearGradient(0, padTop, 0, h - padBot);
        grad.addColorStop(0, '#031f3b');
        grad.addColorStop(0.5, '#062a4f');
        grad.addColorStop(1, '#021a33');
        ctx.fillStyle = grad;
        ctx.fillRect(padX, padTop, innerW, innerH);
        drawCnbluePill(w / 2, 118, '#ffffff');
        ctx.fillStyle = '#f59e0b';
        [204, 578, 666].forEach((barY) => {
          ctx.fillRect(w / 2 - 44, barY, 88, 4);
        });
        ctx.save();
        ctx.translate(w / 2, 316);
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.moveTo(-66, -54);
        ctx.lineTo(-42, -54);
        ctx.lineTo(66, 54);
        ctx.lineTo(42, 54);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(66, -54);
        ctx.lineTo(42, -54);
        ctx.lineTo(-66, 54);
        ctx.lineTo(-42, 54);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#05284c';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(-14, 14);
        ctx.lineTo(4, -4);
        ctx.stroke();
        ctx.restore();

        ctx.save();
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 4;
        drawRoundedRectPath(ctx, w / 2 - 62, 386, 124, 34, 17);
        ctx.stroke();
        ctx.fillStyle = '#f59e0b';
        ctx.font = '800 20px system-ui, -apple-system, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('CNBLUE', w / 2, 404);
        ctx.restore();

        ctx.fillStyle = '#f59e0b';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = '800 22px system-ui, sans-serif';
        ctx.fillText('10th', w / 2, 452);
        ctx.font = '800 21px system-ui, sans-serif';
        ctx.fillText('Mini Album', w / 2, 480);
        ctx.font = '800 22px system-ui, sans-serif';
        ctx.fillText('[X]', w / 2, 508);
        break;
      }

      case '3logy': {
        const grad = ctx.createLinearGradient(0, padTop, 0, h - padBot);
        grad.addColorStop(0, '#b3c9df');
        grad.addColorStop(0.5, '#c4d7e8');
        grad.addColorStop(1, '#a7bfd7');
        ctx.fillStyle = grad;
        ctx.fillRect(padX, padTop, innerW, innerH);
        for (let i = 0; i < 42; i++) {
          const sx = padX + ((i * 73) % innerW);
          const sy = padTop + ((i * 59) % innerH);
          const sr = 18 + (i % 4) * 9;
          ctx.beginPath();
          ctx.arc(sx, sy, sr, 0, Math.PI * 1.45);
          ctx.strokeStyle =
            i % 2 === 0 ? 'rgba(255, 255, 255, 0.24)' : 'rgba(90, 118, 148, 0.14)';
          ctx.lineWidth = 3;
          ctx.stroke();
        }
        drawCnbluePill(w / 2, 118, '#111827');
        drawVerticalText(
          '3LOGY',
          w / 2,
          342,
          '900 72px system-ui, "Arial Black", sans-serif',
          '#111111',
          248
        );
        drawVerticalText(
          'CNBLUE 11TH MINI ALBUM',
          w / 2,
          596,
          '800 18px system-ui, sans-serif',
          '#111111',
          210
        );
        break;
      }

      case 'running': {
        const grad = ctx.createLinearGradient(0, padTop, 0, h - padBot);
        grad.addColorStop(0, '#edf8ff');
        grad.addColorStop(0.6, '#e6f5ff');
        grad.addColorStop(1, '#dcf0ff');
        ctx.fillStyle = grad;
        ctx.fillRect(padX, padTop, innerW, innerH);
        drawCnbluePill(w / 2, 108, '#0055ff');

        const drawStarburst = (cx: number, cy: number, outerR: number, innerR: number) => {
          ctx.save();
          ctx.translate(cx, cy);
          ctx.fillStyle = '#f97316';
          ctx.beginPath();
          for (let i = 0; i < 16; i++) {
            const ang = (i * Math.PI) / 8;
            const r = i % 2 === 0 ? outerR : innerR;
            const px = Math.cos(ang) * r;
            const py = Math.sin(ang) * r;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
          ctx.closePath();
          ctx.fill();
          ctx.fillStyle = '#edf8ff';
          ctx.beginPath();
          ctx.arc(0, 0, innerR * 0.45, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        };
        drawStarburst(w / 2, 198, 42, 12);

        ctx.fillStyle = '#0055ff';
        ctx.font = '900 66px system-ui, "Apple SD Gothic Neo", "Malgun Gothic", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('달', w / 2, 282);
        ctx.fillText('리', w / 2, 348);
        ctx.fillText('기', w / 2, 414);

        ctx.strokeStyle = '#f97316';
        ctx.lineWidth = 6;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(w / 2 - 40, 468);
        ctx.lineTo(w / 2 - 12, 468);
        ctx.moveTo(w / 2 - 26, 454);
        ctx.lineTo(w / 2 - 26, 482);
        ctx.stroke();
        drawStarburst(w / 2 + 22, 468, 17, 6);

        ctx.strokeStyle = '#0066ff';
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo(w - padX, 496);
        ctx.bezierCurveTo(w / 2 - 40, 502, w / 2 - 120, 526, w - padX, 540);
        ctx.stroke();
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.moveTo(w - padX, 508);
        ctx.bezierCurveTo(w / 2 - 10, 514, w / 2 - 50, 524, w - padX, 530);
        ctx.stroke();

        drawVerticalText(
          'CNBLUE SPECIAL SINGLE',
          w / 2,
          616,
          '800 17px system-ui, sans-serif',
          '#0055ff',
          178
        );

        ctx.fillStyle = '#0077ff';
        ctx.beginPath();
        ctx.moveTo(padX, h - padBot);
        ctx.lineTo(padX, h - padBot - 22);
        ctx.bezierCurveTo(w * 0.4, h - padBot - 44, w * 0.65, h - padBot - 52, w - padX, h - padBot - 82);
        ctx.lineTo(w - padX, h - padBot);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = '#edf8ff';
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo(padX, h - padBot - 8);
        ctx.bezierCurveTo(w * 0.38, h - padBot - 28, w * 0.65, h - padBot - 36, w - padX, h - padBot - 64);
        ctx.stroke();
        break;
      }

      default: {
        const grad = ctx.createLinearGradient(0, padTop, w, h - padBot);
        grad.addColorStop(0, '#0c2461');
        grad.addColorStop(0.5, '#1e3a8a');
        grad.addColorStop(1, '#091a45');
        ctx.fillStyle = grad;
        ctx.fillRect(padX, padTop, innerW, innerH);
        ctx.strokeStyle = 'rgba(125, 211, 252, 0.35)';
        ctx.lineWidth = 4;
        ctx.setLineDash([12, 10]);
        ctx.strokeRect(padX + 20, padTop + 20, innerW - 40, innerH - 40);
        ctx.setLineDash([]);
        drawCnbluePill(w / 2, 118, '#7dd3fc');
        drawVerticalText(
          album.title,
          w / 2,
          368,
          '900 46px system-ui, sans-serif',
          '#e0f2fe',
          240
        );
        drawVerticalText(
          'COMING SOON · NEXT 5',
          w / 2,
          606,
          '800 17px system-ui, sans-serif',
          '#7dd3fc',
          210
        );
        break;
      }
    }
    ctx.restore();

    // 3) 투명 CD 주얼 케이스 상·하단 힌지 & 유리 하이라이트 효과
    const topCap = ctx.createLinearGradient(0, 0, 0, padTop + 10);
    topCap.addColorStop(0, '#f8fafc');
    topCap.addColorStop(0.5, '#94a3b8');
    topCap.addColorStop(1, 'rgba(255,255,255,0.2)');
    ctx.fillStyle = topCap;
    ctx.fillRect(0, 0, w, padTop);

    const botCap = ctx.createLinearGradient(0, h - padBot - 10, 0, h);
    botCap.addColorStop(0, 'rgba(255,255,255,0.2)');
    botCap.addColorStop(0.5, '#94a3b8');
    botCap.addColorStop(1, '#f8fafc');
    ctx.fillStyle = botCap;
    ctx.fillRect(0, h - padBot, w, padBot);

    const sideShine = ctx.createLinearGradient(0, 0, w, 0);
    sideShine.addColorStop(0, 'rgba(255,255,255,0.55)');
    sideShine.addColorStop(0.06, 'rgba(15,23,42,0.25)');
    sideShine.addColorStop(0.12, 'rgba(255,255,255,0.0)');
    sideShine.addColorStop(0.88, 'rgba(255,255,255,0.0)');
    sideShine.addColorStop(0.94, 'rgba(15,23,42,0.25)');
    sideShine.addColorStop(1, 'rgba(255,255,255,0.55)');
    ctx.fillStyle = sideShine;
    ctx.fillRect(0, 0, w, h);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

// 붉은 석양(크림슨 레드 ~ 주황빛 ~ 은은한 황금 지평선) 그라데이션 하늘 텍스처
export function createSunsetSkyTexture(THREE: any) {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    grad.addColorStop(0.0, '#450a0a');
    grad.addColorStop(0.2, '#991b1b');
    grad.addColorStop(0.32, '#dc2626');
    grad.addColorStop(0.41, '#ea580c');
    grad.addColorStop(0.47, '#f97316');
    grad.addColorStop(0.51, '#fbbf24');
    grad.addColorStop(0.56, '#ef4444');
    grad.addColorStop(1.0, '#7f1d1d');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.needsUpdate = true;
  return tex;
}

