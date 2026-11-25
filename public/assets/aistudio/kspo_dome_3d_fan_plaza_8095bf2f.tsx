import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Users,
  Sparkles,
  Calendar,
  MessageSquare,
  Music,
  Volume2,
  VolumeX,
  Sun,
  Sunset,
  Moon,
  X,
  Send,
  Heart,
  Check,
  Lock,
  Flame,
  Compass,
  Footprints,
  LayoutGrid,
  Building2,
  Shirt,
  Star,
  MapPin,
  Gamepad2,
  Trophy,
  Zap,
  RotateCcw,
  Flag,
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInAnonymously,
  signInWithCustomToken,
  onAuthStateChanged,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  setDoc,
  onSnapshot,
  collection,
  addDoc,
} from 'firebase/firestore';

declare const __firebase_config: string | undefined;
declare const __app_id: string | undefined;
declare const __initial_auth_token: string | undefined;

const firebaseConfig =
  typeof __firebase_config !== 'undefined' && __firebase_config
    ? JSON.parse(__firebase_config)
    : null;
const firebaseApp = firebaseConfig ? initializeApp(firebaseConfig) : null;
const auth = firebaseApp ? getAuth(firebaseApp) : null;
const db = firebaseApp ? getFirestore(firebaseApp) : null;
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

declare global {
  interface Window {
    THREE: any;
    webkitAudioContext?: typeof AudioContext;
  }
}

// ============================================================================
// 1. 타입 정의 & 광장/공연장/MD 상수 데이터
// ============================================================================

type SkyTheme = 'day' | 'sunset' | 'night';
type ViewMode = 'plaza' | 'arena';
type AvatarAction = 'idle' | 'walk' | 'run' | 'wave' | 'cheer' | 'greet' | 'sit';
type OutfitStyle = 'track_jacket' | 'white_tee' | 'navy_tee' | 'sky_tee';
type CapStyle = 'official_cap' | 'navy_cap' | 'none';
type HandItemType = 'fan' | 'lightstick' | 'slogan' | 'none';
type HairStyle = 'long' | 'ponytail' | 'dandy' | 'short';

interface FanPeer {
  id: string;
  name: string;
  seatZone: string;
  hoodieColor: string;
  lightstickColor: string;
  hairStyle?: HairStyle;
  outfitStyle?: OutfitStyle;
  capStyle?: CapStyle;
  hasSloganTowel?: boolean;
  hasWristband?: boolean;
  leftHandItem?: HandItemType;
  rightHandItem?: HandItemType;
  x: number;
  z: number;
  targetX: number;
  targetZ: number;
  rotationY: number;
  action: AvatarAction;
  actionUntil?: number;
  speech?: string;
  speechUntil?: number;
  isNpc?: boolean;
  laneRadius?: number;
  trackAngle?: number;
}

interface PlazaMemo {
  id: string;
  author: string;
  seatZone: string;
  text: string;
  color: string;
  x: number;
  z: number;
  likes: number;
  likedByMe: boolean;
  createdAt: string;
}

interface SeatSectionInfo {
  id: string;
  label: string;
  tier: 'FLOOR' | '1F' | '2F';
  badge?: '에' | '바' | '뛰';
  x: number;
  y: number;
  z: number;
  rotY: number;
  width: number;
  depth: number;
  color: number;
}

const MAX_ROOM_CAPACITY = 30;
const PLAZA_GROUND_RADIUS = 58;
const TRACK_CENTER_X = 0;
const TRACK_CENTER_Z = 12;
const LANE_RADII = [14.2, 15.2, 16.2, 17.2, 18.2];

function getLanePosition(laneIdx: number, angle: number): { x: number; z: number } {
  const safeIdx = Math.max(0, Math.min(LANE_RADII.length - 1, laneIdx));
  const r = LANE_RADII[safeIdx];
  return {
    x: TRACK_CENTER_X + Math.cos(angle) * r,
    z: TRACK_CENTER_Z + Math.sin(angle) * r,
  };
}

function getConcertDDay(): number {
  const target = new Date('2027-02-20T00:00:00+09:00').getTime();
  const now = Date.now();
  return Math.max(0, Math.ceil((target - now) / (1000 * 60 * 60 * 24)));
}

const ROOM_LIST = [
  {
    id: 1,
    name: "1레인 · KEEP RUNNIN'",
    desc: '가장 안쪽 최단 코스 · 에바뛰콘 워밍업 런!',
    baseCount: 18,
    spawnAngle: Math.PI * 0.5,
    accentHex: '#38bdf8',
  },
  {
    id: 2,
    name: '2레인 · 에바뛰 스프린트',
    desc: '공식 다이아 응원봉 들고 힘차게 질주하는 레인',
    baseCount: 15,
    spawnAngle: Math.PI * 0.36,
    accentHex: '#60a5fa',
  },
  {
    id: 3,
    name: '3레인 · 그러나, 꽃이었다',
    desc: '그러나, 꽃이었다 정원을 바라보며 달리는 메인 센터 레인',
    baseCount: 21,
    spawnAngle: Math.PI * 0.64,
    accentHex: '#f472b6',
  },
  {
    id: 4,
    name: '4레인 · 영원한 보이스',
    desc: '전 세계 보이스들이 함께 모여 인사 나누는 레인',
    baseCount: 12,
    spawnAngle: Math.PI * 0.22,
    accentHex: '#818cf8',
  },
  {
    id: 5,
    name: '5레인 · 앵콜 떼창존',
    desc: '가장 넓은 외곽 트랙 · 떼창 연습하면서 달려요!',
    baseCount: 16,
    spawnAngle: Math.PI * 0.78,
    accentHex: '#fbbf24',
  },
];

const AUDIO_TRACKS = [
  { title: 'TRACK 01 · KEEP RUNNIN (BGM)', src: './audio/track-01.mp3' },
  { title: 'TRACK 02 · 그러나, 꽃이었다 (BGM)', src: './audio/track-02.mp3' },
  { title: 'TRACK 03 · 에바뛰 앵콜 (BGM)', src: './audio/track-03.mp3' },
];

const OUTFIT_OPTIONS: Array<{
  id: OutfitStyle;
  name: string;
  desc: string;
  baseHex: string;
}> = [
  {
    id: 'track_jacket',
    name: '공식 화이트 트랙 자켓',
    desc: '블루 스트라이프 & CNBLUE 패치',
    baseHex: '#f8fafc',
  },
  {
    id: 'white_tee',
    name: '화이트 콘서트 티셔츠',
    desc: '시원한 블루 로고 포인트',
    baseHex: '#ffffff',
  },
  {
    id: 'navy_tee',
    name: '네이비 투어 티셔츠',
    desc: '스카이블루 시그니처 그래픽',
    baseHex: '#1e3a8a',
  },
  {
    id: 'sky_tee',
    name: '스카이블루 보이스 티',
    desc: '청량한 하늘빛 응원 룩',
    baseHex: '#38bdf8',
  },
];

const CAP_OPTIONS: Array<{ id: CapStyle; name: string; swatch: string }> = [
  { id: 'official_cap', name: '화이트 데님 캡', swatch: '#f1f5f9' },
  { id: 'navy_cap', name: '딥네이비 볼캡', swatch: '#1e3a8a' },
  { id: 'none', name: '착용 안 함', swatch: '#475569' },
];

const HAIR_OPTIONS: Array<{ id: HairStyle; name: string; desc: string }> = [
  { id: 'long', name: '긴 생머리', desc: '어깨 아래로 흐르는 롱헤어' },
  { id: 'ponytail', name: '포니테일', desc: '달릴 때 살랑이는 리본 포니테일' },
  { id: 'dandy', name: '댄디 가르마', desc: '자연스러운 볼륨 쉼표 가르마' },
  { id: 'short', name: '스포티 숏컷', desc: '깔끔하고 경쾌한 짧은 머리' },
];

const LIGHTSTICK_PALETTE = [
  { name: '로열 블루', hex: '#2563eb', unlockDay: 1 },
  { name: '스카이 시안', hex: '#38bdf8', unlockDay: 9 },
  { name: '아이스 화이트', hex: '#e0f2fe', unlockDay: 10 },
  { name: '선셋 골드', hex: '#fbbf24', unlockDay: 11 },
  { name: '체리 블라썸', hex: '#f472b6', unlockDay: 12 },
];

// 어드벤트 질문 답변 누적 횟수에 따라 순차 해금되는 착용 MD 아이템 로드맵
const ADVENT_UNLOCK_MILESTONES: Array<{
  day: number;
  label: string;
  shortName: string;
  icon: string;
}> = [
  { day: 1, label: '💎 공식 다이아 응원봉 (로열 블루)', shortName: '공식 다이아 응원봉', icon: '💎' },
  { day: 2, label: '🪭 에.바.뛰. 직사각 부채', shortName: '에.바.뛰. 부채', icon: '🪭' },
  { day: 3, label: '🧢 공식 화이트 데님 캡', shortName: '화이트 데님 캡', icon: '🧢' },
  { day: 4, label: '💙 CNBLUE 양손 공식 슬로건', shortName: 'CNBLUE 양손 슬로건', icon: '💙' },
  { day: 5, label: '🧥 공식 화이트 트랙 자켓', shortName: '화이트 트랙 자켓', icon: '🧥' },
  { day: 6, label: '🧢 딥네이비 볼캡', shortName: '딥네이비 볼캡', icon: '🧢' },
  { day: 7, label: '👕 네이비 투어 티셔츠', shortName: '네이비 투어 티셔츠', icon: '👕' },
  { day: 8, label: '👕 스카이블루 보이스 티', shortName: '스카이블루 보이스 티', icon: '👕' },
  { day: 9, label: '✨ 응원봉 · 스카이 시안 컬러', shortName: '응원봉 스카이 시안', icon: '✨' },
  { day: 10, label: '❄️ 응원봉 · 아이스 화이트 컬러', shortName: '응원봉 아이스 화이트', icon: '❄️' },
  { day: 11, label: '🌟 응원봉 · 선셋 골드 컬러', shortName: '응원봉 선셋 골드', icon: '🌟' },
  { day: 12, label: '🌸 응원봉 · 체리 블라썸 컬러', shortName: '응원봉 체리 블라썸', icon: '🌸' },
];

const OUTFIT_UNLOCK_DAY: Record<OutfitStyle, number> = {
  white_tee: 0,
  track_jacket: 5,
  navy_tee: 7,
  sky_tee: 8,
};

const CAP_UNLOCK_DAY: Record<CapStyle, number> = {
  none: 0,
  official_cap: 3,
  navy_cap: 6,
};

const HAND_ITEM_UNLOCK_DAY: Record<HandItemType, number> = {
  none: 0,
  lightstick: 1,
  fan: 2,
  slogan: 4,
};

const FLOWER_COLORS = [
  { name: '보이스 블루', hex: '#38bdf8' },
  { name: '로열 사파이어', hex: '#3b82f6' },
  { name: '벚꽃 핑크', hex: '#f472b6' },
  { name: '햇살 옐로우', hex: '#facc15' },
  { name: '라벤더 퍼플', hex: '#a78bfa' },
  { name: '순백 화이트', hex: '#f8fafc' },
];

// KSPO DOME 360도 좌석 섹션 데이터 생성 (실제 반원 닻 모양 돌출무대 기준)
const ARENA_SECTIONS: SeatSectionInfo[] = (() => {
  const sections: SeatSectionInfo[] = [
    {
      id: 'FLOOR-A',
      label: 'FLOOR 에 (A구역)',
      tier: 'FLOOR',
      badge: '에',
      x: -3.6,
      y: 0.24,
      z: -2.0,
      rotY: 0,
      width: 4.6,
      depth: 5.6,
      color: 0x3b82f6,
    },
    {
      id: 'FLOOR-B',
      label: 'FLOOR 바 (B구역)',
      tier: 'FLOOR',
      badge: '바',
      x: 3.6,
      y: 0.24,
      z: -2.0,
      rotY: 0,
      width: 4.6,
      depth: 5.6,
      color: 0x0284c7,
    },
  ];

  // FLOOR 뛰 (C ~ J 구역 · 반원 닻 외곽을 따라 배치)
  const floorLetters = ['C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
  floorLetters.forEach((letter, idx) => {
    const t = idx / (floorLetters.length - 1);
    const ang = Math.PI * (0.96 - t * 0.92);
    const r = 11.2;
    const x = Math.cos(ang) * r;
    const z = -4.2 + Math.sin(ang) * r;
    sections.push({
      id: `FLOOR-${letter}`,
      label: `FLOOR 뛰 (${letter}구역)`,
      tier: 'FLOOR',
      badge: '뛰',
      x,
      y: 0.24,
      z,
      rotY: Math.atan2(x, z + 4.2),
      width: 3.1,
      depth: 2.8,
      color: 0x6366f1,
    });
  });

  // 1F S석 (15 ~ 1 구역)
  for (let i = 0; i < 15; i++) {
    const num = 15 - i;
    const t = i / 14;
    const ang = Math.PI * (1.14 - t * 1.28);
    const r = 16.0;
    const x = Math.cos(ang) * r;
    const z = -1.5 + Math.sin(ang) * r;
    sections.push({
      id: `1F-${num}`,
      label: `1F S석 ${num}구역`,
      tier: '1F',
      x,
      y: 3.6,
      z,
      rotY: Math.atan2(x, z + 1.5),
      width: 3.9,
      depth: 4.6,
      color: 0x38bdf8,
    });
  }

  // 2F A석 (43 ~ 24 구역)
  for (let i = 0; i < 20; i++) {
    const num = 43 - i;
    const t = i / 19;
    const ang = Math.PI * (1.16 - t * 1.32);
    const r = 22.4;
    const x = Math.cos(ang) * r;
    const z = -1.5 + Math.sin(ang) * r;
    sections.push({
      id: `2F-${num}`,
      label: `2F A석 ${num}구역`,
      tier: '2F',
      x,
      y: 8.4,
      z,
      rotY: Math.atan2(x, z + 1.5),
      width: 4.2,
      depth: 5.6,
      color: 0x0e749b,
    });
  }

  return sections;
})();

const SEAT_ZONES = ARENA_SECTIONS.map((s) => s.label);

function getSeatSectionByLabel(label: string): SeatSectionInfo {
  return ARENA_SECTIONS.find((s) => s.label === label) || ARENA_SECTIONS[0];
}

const INITIAL_MEMOS: PlazaMemo[] = [
  {
    id: 'flower-init-1',
    author: '블루웨이브',
    seatZone: 'FLOOR 에 (A구역)',
    text: '체조경기장 360도 돌출무대라니 벌써 심장 터질 것 같아요!! 끝까지 에바뛰 💙',
    color: '#38bdf8',
    x: -5.4,
    z: 10.2,
    likes: 24,
    likedByMe: false,
    createdAt: '10분 전',
  },
  {
    id: 'flower-init-2',
    author: '꽃길만걷자',
    seatZone: '1F S석 8구역',
    text: '그러나, 꽃이었다 라이브로 들으면 무조건 울 것 같아요 🌸 씨엔블루 영원하자!',
    color: '#f472b6',
    x: 4.8,
    z: 9.6,
    likes: 19,
    likedByMe: false,
    createdAt: '25분 전',
  },
  {
    id: 'flower-init-3',
    author: '드럼비트민혁',
    seatZone: 'FLOOR 바 (B구역)',
    text: '트랙 자켓이랑 에.바.뛰. 부채 풀착장 완료! 다 같이 목 쉬도록 떼창해요 🔥',
    color: '#facc15',
    x: 2.2,
    z: 16.8,
    likes: 15,
    likedByMe: false,
    createdAt: '1시간 전',
  },
  {
    id: 'flower-init-4',
    author: '보이스포에버',
    seatZone: '2F A석 33구역',
    text: '2층에서도 파란 응원봉 물결로 천장 뚫어드릴게요! KEEP DREAMIN KEEP RUNNIN 💎',
    color: '#a78bfa',
    x: -4.2,
    z: 15.6,
    likes: 31,
    likedByMe: false,
    createdAt: '2시간 전',
  },
];

const NPC_NAMES = [
  '블루러너',
  '에바뛰장인',
  '체조요정',
  '꽃이었다',
  '용화바라기',
  '민혁드럼',
  '정신베이스',
  '보이스1기',
  '파란물결',
  '떼창마스터',
  '다이아봉',
  '달려라보이스',
  '스탠딩전사',
  '앵콜요정',
  '올공산책러',
  '하늘빛멜로디',
  '트랙질주',
  '기타리프',
  '청춘밴드',
  '별빛보이스',
];

const NPC_SPEECHES = [
  '에바뛰콘 너무 기대돼요!! 💙',
  '다 같이 트랙 달려요 🏃‍♂️',
  '그러나, 꽃이었다 최고 🌸',
  '공식 MD 풀착장 완료!',
  '체조경기장 떼창 가보자고🔥',
  '오늘도 출석 도장 꾹!',
  '돌출무대 완전 가까워요✨',
  '씨엔블루 영원하자💎',
];

function createRoomNpcs(roomId: number, count: number): FanPeer[] {
  const safeCount = Math.max(0, Math.min(MAX_ROOM_CAPACITY - 1, count));
  const result: FanPeer[] = [];
  const outfitIds: OutfitStyle[] = ['track_jacket', 'white_tee', 'navy_tee', 'sky_tee'];
  const capIds: CapStyle[] = ['official_cap', 'navy_cap', 'none'];
  const hairIds: HairStyle[] = ['long', 'ponytail', 'dandy', 'short'];

  for (let i = 0; i < safeCount; i++) {
    const isRunner = i < Math.ceil(safeCount * 0.55);
    const laneIdx = (roomId - 1 + i) % LANE_RADII.length;
    const laneRadius = LANE_RADII[laneIdx];
    const angle = (i / Math.max(1, safeCount)) * Math.PI * 2 + roomId * 0.7;

    let x = 0;
    let z = 0;
    if (isRunner) {
      x = TRACK_CENTER_X + Math.cos(angle) * laneRadius;
      z = TRACK_CENTER_Z + Math.sin(angle) * laneRadius;
    } else {
      const innerR = 4.2 + ((i * 2.7) % 7.5);
      x = TRACK_CENTER_X + Math.cos(angle) * innerR;
      z = TRACK_CENTER_Z + Math.sin(angle) * innerR;
    }

    const outfitStyle = outfitIds[(i + roomId) % outfitIds.length];
    const outfitObj = OUTFIT_OPTIONS.find((o) => o.id === outfitStyle) || OUTFIT_OPTIONS[0];
    const stickObj = LIGHTSTICK_PALETTE[(i + roomId) % LIGHTSTICK_PALETTE.length];
    const sec = ARENA_SECTIONS[(i * 3 + roomId) % ARENA_SECTIONS.length];
    const hairStyle: HairStyle = hairIds[(i + roomId) % hairIds.length];
    const holdsSlogan = i % 4 === 1;

    result.push({
      id: `npc-r${roomId}-${i}`,
      name: NPC_NAMES[(i + roomId * 3) % NPC_NAMES.length],
      seatZone: sec.label,
      hoodieColor: outfitObj.baseHex,
      lightstickColor: stickObj.hex,
      hairStyle,
      outfitStyle,
      capStyle: capIds[(i + roomId) % capIds.length],
      hasSloganTowel: false,
      hasWristband: true,
      leftHandItem: holdsSlogan ? 'slogan' : i % 2 === 0 ? 'fan' : 'none',
      rightHandItem: holdsSlogan ? 'slogan' : 'lightstick',
      x,
      z,
      targetX: x,
      targetZ: z,
      rotationY: angle + Math.PI / 2,
      action: isRunner ? 'run' : i % 3 === 0 ? 'wave' : 'idle',
      speech: i % 3 === 0 ? NPC_SPEECHES[(i + roomId) % NPC_SPEECHES.length] : undefined,
      isNpc: true,
      laneRadius: isRunner ? laneRadius : undefined,
      trackAngle: isRunner ? angle : undefined,
    });
  }
  return result;
}

const DAILY_CONCERT_QUESTIONS: string[] = [
  '에바뛰콘 소식을 처음 들었을 때 가장 먼저 든 생각은 무엇인가요?',
  '내가 보이스(BOICE)가 된 운명적인 계기는?',
  '씨엔블루 노래 중 가장 처음 들었던 곡은 무엇인가요?',
  '매일 들어도 절대 질리지 않는 나만의 최애곡은?',
  '비 오는 날 꼭 생각나는 씨엔블루 노래는?',
  '기분 좋을 때 들으면 텐션이 폭발하는 곡은?',
  '위로가 필요할 때 찾아 듣는 나만의 힐링곡은?',
  '이번 KSPO DOME 에바뛰콘에서 가장 기대되는 무대는?',
  '「그러나, 꽃이었다」에서 가장 마음에 와닿는 가사 한 줄은?',
  '공연장에서 다 같이 떼창할 때 가장 소름 돋는 구간은?',
  '정용화의 보컬 중 가장 좋아하는 매력 포인트는?',
  '강민혁의 드럼 연주가 가장 빛난다고 생각하는 곡은?',
  '이정신의 베이스 라인이 가장 매력적인 곡은?',
  '씨엔블루 밴드 라이브의 가장 큰 매력은 무엇인가요?',
  '콘서트 당일 아침에 눈을 떴을 때 기분은 어떨 것 같나요?',
  'KSPO DOME 광장에 도착하자마자 가장 먼저 하고 싶은 일은?',
  '이번 공연에서 가장 가고 싶거나 예매한 나의 최애 구역은?',
  '의탠딩(FLOOR) vs 1·2층 지정석, 나의 취향은?',
  '2027 공식 MD 중 가장 마음에 드는 아이템은 무엇인가요?',
  '공식 다이아 응원봉을 처음 켰을 때의 기분은 어땠나요?',
  '콘서트 가방에 꼭 챙겨가는 나만의 필수 준비물은?',
  '에바뛰(에브리바디 뛰어)를 몇 분 연속으로 뛸 수 있나요?',
  '역대 씨엔블루 콘서트에서 가장 기억에 남는 멘트는?',
  '멤버들의 장난기 넘치는 케미 중 가장 좋아하는 순간은?',
  '지금까지 본 씨엔블루 무대 의상 중 레전드 착장은?',
  '다시 보고 싶은 역대 콘서트 VCR이나 무대 연출은?',
  '라이브 편곡 버전이 원곡보다 더 좋았던 곡은?',
  '어쿠스틱 버전으로 꼭 들어보고 싶은 씨엔블루 노래는?',
  '강렬한 락 사운드로 속이 뻥 뚫리는 최애 곡은?',
  '달달하고 로맨틱해서 설레는 씨엔블루 노래는?',
  '드라이브할 때 무조건 1번으로 트는 플레이리스트 곡은?',
  '새벽 감성에 젖고 싶을 때 듣는 씨엔블루 곡은?',
  '아침 출근/등교길에 에너지를 주는 노래는?',
  '러닝 트랙을 달릴 때 듣기 딱 좋은 씨엔블루 노래는?',
  '가사가 정말 한 편의 시 같다고 느꼈던 명곡은?',
  '뮤직비디오 영상미가 가장 인상 깊었던 곡은?',
  '앨범 커버 디자인이 가장 예뻤던 앨범은?',
  '타이틀곡 못지않게 아끼는 숨은 수록곡 명곡은?',
  '일본 발표곡 중 한국 콘서트에서 꼭 듣고 싶은 곡은?',
  '멤버별 솔로곡 중 최애곡을 하나 꼽는다면?',
  '에바뛰콘 오프닝 첫 곡으로 터졌으면 하는 노래는?',
  '본 공연 마지막을 장식했으면 하는 노래는?',
  '앵콜 첫 곡으로 듣고 싶은 노래는 무엇인가요?',
  '리앵콜까지 끝없이 뛰어놀고 싶은 신나는 곡은?',
  '360도 돌출무대로 멤버들이 다가올 때 외치고 싶은 말은?',
  '응원법 중 가장 자신 있게 외칠 수 있는 곡은?',
  '공연 전날 밤 푹 잘 수 있을까요, 설레서 밤샐 것 같나요?',
  '공연 끝나고 뒤풀이로 꼭 먹고 싶은 메뉴는?',
  '함께 콘서트에 가고 싶은 보이스 친구나 가족이 있나요?',
  '혼자 가는 콘서트(혼콘)의 장점은 무엇일까요?',
  '오늘 광장에 함께 있는 보이스들에게 건네고 싶은 한마디는?',
  '씨엔블루를 하나의 색깔로 표현한다면 어떤 색인가요?',
  '씨엔블루와 가장 잘 어울리는 계절은 언제인가요?',
  '나에게 ‘파란색’이 특별하게 느껴지는 이유가 있다면?',
  '씨엔블루 덕분에 새로 생긴 취미나 좋은 습관이 있나요?',
  '덕질하면서 가장 뿌듯하고 행복했던 순간은?',
  '주변 사람에게 씨엔블루 입덕 영업용으로 추천하는 곡은?',
  '공연장에서 전주만 나와도 눈물 날 것 같은 곡은?',
  '듣기만 해도 웃음이 터지는 유쾌한 씨엔블루 곡은?',
  '멤버들에게 꼭 한 번 선물해주고 싶은 것이 있다면?',
  '만약 1일 매니저가 된다면 멤버들을 위해 하고 싶은 일은?',
  '밴드 악기 중 하나를 배운다면 기타·드럼·베이스 중 무엇?',
  '노래방에서 꼭 부르게 되는 씨엔블루 애창곡은?',
  '전주 1초만 들어도 바로 맞출 수 있는 자신 있는 곡은?',
  '브릿지 파트가 예술이라고 생각하는 명곡은?',
  '엔딩 여운이 가장 길게 남는 씨엔블루 노래는?',
  '페스티벌이나 야외 무대에서 보고 싶은 특별한 곡은?',
  '씨엔블루가 출연했던 예능/콘텐츠 중 가장 재밌었던 것은?',
  '멤버들의 유행어나 명대사 중 기억에 남는 것은?',
  '팬송 중 가장 애틋하고 고맙게 느껴지는 곡은?',
  '10년 뒤에도 씨엔블루와 함께하고 싶은 모습은?',
  '공연장 입장 직전 가장 떨리는 순간은 언제인가요?',
  '암전되고 파란 응원봉 물결이 켜질 때의 기분은?',
  '돌출무대에서 멤버와 눈이 마주친다면 어떤 포즈를 지을까?',
  '내가 직접 에바뛰콘 슬로건 문구를 만든다면?',
  'KSPO DOME 포토존에서 찍고 싶은 인증샷 포즈는?',
  '티켓팅에 성공했을 때의 기분을 한 단어로 표현하면?',
  '오늘 에바뛰를 위한 내 체력 게이지는 몇 퍼센트인가요?',
  '2시간 넘게 뛰기 위해 준비한 나만의 체력 관리법은?',
  '공연 영상을 다시 돌려볼 때 가장 먼저 찾는 장면은?',
  '씨엔블루 음악이 내 인생에서 차지하는 의미는?',
  '힘들었던 날 씨엔블루 노래로 버텼던 기억이 있나요?',
  '보이스라서 가장 행복하다고 느꼈던 순간은?',
  '정용화에게 꼭 전하고 싶은 고마움의 한마디는?',
  '강민혁에게 꼭 전하고 싶은 고마움의 한마디는?',
  '이정신에게 꼭 전하고 싶은 고마움의 한마디는?',
  '이번 KSPO DOME 콘서트를 한 줄로 예고한다면?',
  '드디어 D-DAY! 영원히 함께 달려갈 씨엔블루에게 보내는 사랑의 메시지 💙',
];

const ADVENT_START_DATE = '2026-11-25';
const ADVENT_END_DATE = '2027-02-20';

function getKstTodayStr(): string {
  const now = new Date();
  const kstMs = now.getTime() + 9 * 60 * 60 * 1000;
  const kst = new Date(kstMs);
  const y = kst.getUTCFullYear();
  const m = String(kst.getUTCMonth() + 1).padStart(2, '0');
  const d = String(kst.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

interface AdventDailyItem {
  dateStr: string;
  monthKey: string;
  year: number;
  month: number;
  day: number;
  dow: number;
  dayNumber: number;
  dDay: number;
  title: string;
  question: string;
  rewardLabel: string;
  sampleAnswers: string[];
}

const ADVENT_DAILY_LIST: AdventDailyItem[] = (() => {
  const list: AdventDailyItem[] = [];
  const start = new Date(`${ADVENT_START_DATE}T00:00:00Z`);
  const end = new Date(`${ADVENT_END_DATE}T00:00:00Z`);
  const totalDays = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  const rewardPool = [
    '러닝 스타트 배지',
    '블루 기타 피크',
    '그러나, 꽃이었다 씨앗',
    '에.바.뛰. 미니 스티커',
    '황금 마이크 배지',
    '트랙 완주 패치',
    '블루 응원 리본',
  ];
  const titlePool = [
    '설렘 카운트다운',
    '오늘의 플레이리스트',
    '그러나, 꽃이었다',
    '체조경기장 떼창 준비',
    '드레스코드 체크',
    '보이스 출석 도장',
  ];

  for (let i = 0; i < totalDays; i++) {
    const cur = new Date(start.getTime() + i * 24 * 60 * 60 * 1000);
    const year = cur.getUTCFullYear();
    const month = cur.getUTCMonth() + 1;
    const day = cur.getUTCDate();
    const dow = cur.getUTCDay();
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const monthKey = `${year}-${String(month).padStart(2, '0')}`;
    const dDay = totalDays - 1 - i;
    const isConcertDay = dateStr === ADVENT_END_DATE;
    const milestone = ADVENT_UNLOCK_MILESTONES[i];

    list.push({
      dateStr,
      monthKey,
      year,
      month,
      day,
      dow,
      dayNumber: i + 1,
      dDay,
      title: isConcertDay ? 'D-DAY 에바뛰콘!' : titlePool[i % titlePool.length],
      question: isConcertDay
        ? DAILY_CONCERT_QUESTIONS[DAILY_CONCERT_QUESTIONS.length - 1]
        : DAILY_CONCERT_QUESTIONS[i % (DAILY_CONCERT_QUESTIONS.length - 1)],
      rewardLabel: isConcertDay
        ? '다이아 응원봉 왕관'
        : milestone
        ? `${milestone.label} (착용 해금)`
        : rewardPool[i % rewardPool.length],
      sampleAnswers: [
        `${month}월 ${day}일 오늘도 출석 완료! 에바뛰콘까지 같이 달려요 💙`,
        `D-${dDay === 0 ? 'DAY' : dDay} 매일 질문에 답하면서 기다리는 시간이 제일 설레요!!`,
      ],
    });
  }
  return list;
})();

const ADVENT_MONTHS: Array<{ key: string; year: number; month: number; label: string }> = [
  { key: '2026-11', year: 2026, month: 11, label: 'LAP 1 · 11월 스타트' },
  { key: '2026-12', year: 2026, month: 12, label: 'LAP 2 · 12월 질주' },
  { key: '2027-01', year: 2027, month: 1, label: 'LAP 3 · 1월 스퍼트' },
  { key: '2027-02', year: 2027, month: 2, label: 'LAP 4 · 2월 결승선' },
];

interface DomeAlbumSpineInfo {
  slot: number;
  id: string;
  title: string;
  subtitle: string;
  comingSoon?: boolean;
}

// KSPO DOME 외벽 15칸을 채우는 CNBLUE 역대 앨범 스파인 데이터 (1~15번 전체 적용 완료)
const DOME_ALBUM_SPINES: DomeAlbumSpineInfo[] = [
  { slot: 1, id: 'bluetory', title: 'Bluetory', subtitle: 'CNBLUE 1ST MINI ALBUM' },
  { slot: 2, id: 'bluelove', title: 'BLUELOVE', subtitle: 'CNBLUE 2ND MINI ALBUM' },
  { slot: 3, id: 'first_step', title: 'FIRST STEP', subtitle: 'CNBLUE THE 1ST ALBUM' },
  { slot: 4, id: 'thank_you', title: 'THANK YOU', subtitle: 'CNBLUE FIRST STEP +1' },
  { slot: 5, id: 'ear_fun', title: 'EAR FUN', subtitle: 'CNBLUE 3RD MINI ALBUM' },
  { slot: 6, id: 're_blue', title: 'Re:BLUE', subtitle: 'CNBLUE 4TH MINI ALBUM' },
  { slot: 7, id: 'cant_stop', title: "Can't Stop", subtitle: 'CNBLUE 5TH MINI ALBUM' },
  { slot: 8, id: '2gether', title: '2gether', subtitle: 'CNBLUE 2ND ALBUM' },
  { slot: 9, id: 'blueming', title: 'BLUEMING', subtitle: 'CNBLUE 6TH MINI ALBUM' },
  { slot: 10, id: '7cn', title: '7°CN', subtitle: 'CNBLUE 7TH MINI ALBUM' },
  { slot: 11, id: 're_code', title: 'RE-CODE', subtitle: 'CNBLUE 8TH MINI ALBUM' },
  { slot: 12, id: 'wanted', title: 'WANTED', subtitle: 'CNBLUE 9TH MINI ALBUM' },
  { slot: 13, id: 'x', title: 'X', subtitle: 'CNBLUE 10TH MINI ALBUM [X]' },
  { slot: 14, id: '3logy', title: '3LOGY', subtitle: 'CNBLUE 11TH MINI ALBUM' },
  { slot: 15, id: 'running', title: '달리기', subtitle: 'CNBLUE SPECIAL SINGLE' },
];

// ============================================================================
// 2-1. 2D 캔버스/3D 텍스처 헬퍼 & 공용 UI 컴포넌트
// ============================================================================

function drawRoundedRectPath(
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

function createNameTagTexture(
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
function createMarqueeTexture(
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

// 좌석 구역 번호 / 레인 표지판 / CONSOLE 배지 텍스처 생성기
function createSeatLabelTexture(THREE: any, text: string, bgHex = '#0284c7') {
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
function createPlazaGroundTexture(THREE: any) {
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
      ctx.strokeStyle = idx === 0 || idx === laneBounds.length - 1 ? '#ffffff' : 'rgba(255,255,255,0.75)';
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
function createAlbumSpineTexture(THREE: any, album: DomeAlbumSpineInfo) {
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

    // 2) 앨범별 고유 디자인 드로잉 (보내주신 10종 스파인 디자인 재현)
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
        // 중앙 화이트 박스 + 네이비 BLUELOVE
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
        // 하단 화이트 3줄 스트라이프
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
        // 오렌지 다마스크/빈티지 패턴 결
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
        // 은은한 블랙 텍스처
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
        // 빈티지 런던 지도 스케치 라인 + 오렌지 사각 구역
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
        // 다크 브라운 직사각형 + 컷아웃 Re:BLUE
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
        // 시계 문자판 링 & 로마 숫자 (XI XII I / VII VI V)
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
        // 화이트 이중 다이아몬드 프레임
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
        // 은은한 양각 타이포 패턴 (B, L, E, IN)
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
        // 은은한 레드 텍스처 결
        ctx.fillStyle = 'rgba(0, 0, 0, 0.06)';
        for (let y = padTop; y < h - padBot; y += 5) {
          ctx.fillRect(padX, y, innerW, 2);
        }
        // 4개의 골드 수평 구분 바
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
        // 오렌지-골드 수평 구분선 3개
        ctx.fillStyle = '#f59e0b';
        [204, 578, 666].forEach((barY) => {
          ctx.fillRect(w / 2 - 44, barY, 88, 4);
        });
        // 중앙 정방향 오렌지 X 심볼
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
        // 교차점 은은한 다크 컷 포인트
        ctx.strokeStyle = '#05284c';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(-14, 14);
        ctx.lineTo(4, -4);
        ctx.stroke();
        ctx.restore();

        // 가로형(정방향) 오렌지 CNBLUE 필 로고
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

        // 정방향 3줄 텍스트 (10th / Mini Album / [X])
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
        // 은은한 플로럴/마블 소용돌이 양각 패턴
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

        // 상단 오렌지 8각 스타버스트 아이콘
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

        // 세로 정방향 볼드 한글 "달 / 리 / 기"
        ctx.fillStyle = '#0055ff';
        ctx.font = '900 66px system-ui, "Apple SD Gothic Neo", "Malgun Gothic", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('달', w / 2, 282);
        ctx.fillText('리', w / 2, 348);
        ctx.fillText('기', w / 2, 414);

        // 하단 작은 오렌지 십자(+) & 스타버스트 포인트
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

        // 굽이치는 블루 러닝 로드(트랙 곡선) 일러스트
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

        // 세로 블루 타이틀
        drawVerticalText(
          'CNBLUE SPECIAL SINGLE',
          w / 2,
          616,
          '800 17px system-ui, sans-serif',
          '#0055ff',
          178
        );

        // 최하단 대각선 블루 웨이브 리본
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
        // 11~15번 추후 5종 사진이 들어갈 로열블루 COMING SOON 슬롯
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

function buildEbddFanMesh(THREE: any) {
  const fanGroup = new THREE.Group();

  // 직사각 응원 부채 손잡이 (아바타가 쥐는 기준점 x=0, 부채 판의 오른쪽 모서리 아래에 배치)
  const handle = new THREE.Mesh(
    new THREE.BoxGeometry(0.056, 0.24, 0.026),
    new THREE.MeshStandardMaterial({ color: 0x1d4ed8, roughness: 0.4 })
  );
  handle.position.set(0, 0.09, 0);
  fanGroup.add(handle);

  const gripCap = new THREE.Mesh(
    new THREE.CylinderGeometry(0.032, 0.032, 0.03, 12),
    new THREE.MeshStandardMaterial({ color: 0x1e3a8a, roughness: 0.45 })
  );
  gripCap.rotation.x = Math.PI / 2;
  gripCap.position.set(0, -0.02, 0);
  fanGroup.add(gripCap);

  // 직사각형 에.바.뛰. 응원 부채 텍스처 (겉 파란 네모 테두리 없이 깔끔한 화이트 바탕)
  const canvas = document.createElement('canvas');
  canvas.width = 320;
  canvas.height = 240;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 320, 240);

    // 상단 작은 로고 라인
    ctx.fillStyle = '#2563eb';
    ctx.font = '800 18px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('CNBLUE LIVE 2027', 160, 54);

    // 메인 "에.바.뛰." 타이포그래피
    ctx.fillStyle = '#0c2366';
    ctx.font = '900 68px system-ui, -apple-system, sans-serif';
    ctx.fillText('에.바.뛰.', 160, 124);

    // 하단 블루 리본 바
    ctx.fillStyle = '#1d4ed8';
    ctx.fillRect(44, 174, 232, 28);
    ctx.fillStyle = '#ffffff';
    ctx.font = '800 15px system-ui, -apple-system, sans-serif';
    ctx.fillText("KEEP DREAMIN' KEEP RUNNIN'", 160, 188);
  }

  const fanTex = new THREE.CanvasTexture(canvas);
  const faceMat = new THREE.MeshStandardMaterial({
    map: fanTex,
    roughness: 0.35,
  });
  const sideMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.45 });

  // 손잡이(x=0)가 부채 판의 오른쪽 모서리 아래에 위치하도록 판을 왼쪽(-x)으로 이동
  const rectBoard = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.35, 0.022), [
    sideMat,
    sideMat,
    sideMat,
    sideMat,
    faceMat,
    faceMat,
  ]);
  rectBoard.position.set(-0.18, 0.38, 0);
  fanGroup.add(rectBoard);

  return fanGroup;
}

// 1번 이미지의 선명한 로열 블루(#0018e8) + 2번 이미지의 가로형 화이트 라운드 테두리 CNBLUE 슬로건 3D 메쉬
function buildCnblueSloganMesh(THREE: any) {
  const sloganGroup = new THREE.Group();

  const canvas = document.createElement('canvas');
  canvas.width = 640;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    // 1번 이미지와 동일한 선명한 CNBLUE 로열 블루 바탕
    ctx.fillStyle = '#0018e8';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 은은한 타월 직조 질감 라인
    ctx.fillStyle = 'rgba(255, 255, 255, 0.035)';
    for (let y = 0; y < canvas.height; y += 4) {
      ctx.fillRect(0, y, canvas.width, 1);
    }

    // 2번 이미지 비율의 굵은 화이트 캡슐(필) 외곽 테두리
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 22;
    drawRoundedRectPath(ctx, 22, 24, 596, 208, 104);
    ctx.stroke();

    // CNBLUE 시그니처 라운드 블록 로고 (양쪽 둥근 C·E 포함 벡터 드로잉)
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 17;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // C
    ctx.beginPath();
    ctx.moveTo(146, 82);
    ctx.lineTo(112, 82);
    ctx.quadraticCurveTo(88, 82, 88, 106);
    ctx.lineTo(88, 150);
    ctx.quadraticCurveTo(88, 174, 112, 174);
    ctx.lineTo(146, 174);
    ctx.stroke();

    // N
    ctx.beginPath();
    ctx.moveTo(170, 174);
    ctx.lineTo(170, 84);
    ctx.lineTo(226, 172);
    ctx.lineTo(226, 82);
    ctx.stroke();

    // B
    ctx.beginPath();
    ctx.moveTo(252, 174);
    ctx.lineTo(252, 82);
    ctx.lineTo(286, 82);
    ctx.quadraticCurveTo(308, 82, 308, 104);
    ctx.quadraticCurveTo(308, 126, 286, 126);
    ctx.lineTo(252, 126);
    ctx.moveTo(286, 126);
    ctx.lineTo(290, 126);
    ctx.quadraticCurveTo(312, 126, 312, 150);
    ctx.quadraticCurveTo(312, 174, 290, 174);
    ctx.lineTo(252, 174);
    ctx.stroke();

    // L
    ctx.beginPath();
    ctx.moveTo(334, 82);
    ctx.lineTo(334, 150);
    ctx.quadraticCurveTo(334, 174, 356, 174);
    ctx.lineTo(388, 174);
    ctx.stroke();

    // U
    ctx.beginPath();
    ctx.moveTo(410, 82);
    ctx.lineTo(410, 146);
    ctx.quadraticCurveTo(410, 174, 439, 174);
    ctx.quadraticCurveTo(468, 174, 468, 146);
    ctx.lineTo(468, 82);
    ctx.stroke();

    // E (CNBLUE 로고 특유의 왼쪽이 둥근 E)
    ctx.beginPath();
    ctx.moveTo(550, 82);
    ctx.lineTo(516, 82);
    ctx.quadraticCurveTo(492, 82, 492, 106);
    ctx.lineTo(492, 150);
    ctx.quadraticCurveTo(492, 174, 516, 174);
    ctx.lineTo(550, 174);
    ctx.moveTo(494, 128);
    ctx.lineTo(546, 128);
    ctx.stroke();
  }

  const sloganTex = new THREE.CanvasTexture(canvas);
  const faceMat = new THREE.MeshStandardMaterial({
    map: sloganTex,
    roughness: 0.62,
  });
  const sideMat = new THREE.MeshStandardMaterial({
    color: 0x0015d1,
    roughness: 0.65,
  });

  const bannerMesh = new THREE.Mesh(new THREE.BoxGeometry(1.24, 0.48, 0.03), [
    sideMat,
    sideMat,
    sideMat,
    sideMat,
    faceMat,
    faceMat,
  ]);
  sloganGroup.add(bannerMesh);

  return sloganGroup;
}

function FlowerBloomIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <circle cx="12" cy="12" r="2.6" fill="currentColor" />
      <path d="M12 3.5c1.8 0 3 1.7 2.4 3.4-.3.9-1.2 1.8-2.4 2.5-1.2-.7-2.1-1.6-2.4-2.5C9 5.2 10.2 3.5 12 3.5Z" />
      <path d="M12 20.5c1.8 0 3-1.7 2.4-3.4-.3-.9-1.2-1.8-2.4-2.5-1.2.7-2.1 1.6-2.4 2.5-.6 1.7.6 3.4 2.4 3.4Z" />
      <path d="M3.5 12c0-1.8 1.7-3 3.4-2.4.9.3 1.8 1.2 2.5 2.4-.7 1.2-1.6 2.1-2.5 2.4-1.7.6-3.4-.6-3.4-2.4Z" />
      <path d="M20.5 12c0-1.8-1.7-3-3.4-2.4-.9.3-1.8 1.2-2.5 2.4.7 1.2 1.6 2.1 2.5 2.4 1.7.6 3.4-.6 3.4-2.4Z" />
    </svg>
  );
}

function AvatarPreview3D({
  threeReady,
  profile,
  buildFanAvatarMesh,
}: {
  threeReady: boolean;
  profile: {
    name: string;
    hoodieColor: string;
    lightstickColor: string;
    hairStyle: HairStyle;
    outfitStyle: OutfitStyle;
    capStyle: CapStyle;
    hasSloganTowel: boolean;
    hasWristband: boolean;
    leftHandItem: HandItemType;
    rightHandItem: HandItemType;
  };
  buildFanAvatarMesh: (THREE: any, options: any) => any;
}) {
  const previewRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!threeReady || !previewRef.current || !window.THREE) return;
    const THREE = window.THREE;
    const container = previewRef.current;
    let animId = 0;
    let disposed = false;

    try {
      const width = container.clientWidth || 240;
      const height = container.clientHeight || 260;

      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x0f172a);

      const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 50);
      camera.position.set(0, 1.55, 4.1);
      camera.lookAt(0, 1.15, 0);

      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      container.innerHTML = '';
      container.appendChild(renderer.domElement);

      scene.add(new THREE.AmbientLight(0xffffff, 0.85));
      const keyLight = new THREE.DirectionalLight(0xffffff, 0.9);
      keyLight.position.set(3, 6, 5);
      scene.add(keyLight);

      const pedestal = new THREE.Mesh(
        new THREE.CylinderGeometry(0.95, 1.05, 0.14, 32),
        new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.45 })
      );
      pedestal.position.y = -0.07;
      scene.add(pedestal);

      const avatar = buildFanAvatarMesh(THREE, {
        name: profile.name,
        hoodieColor: profile.hoodieColor,
        lightstickColor: profile.lightstickColor,
        hairStyle: profile.hairStyle,
        outfitStyle: profile.outfitStyle,
        capStyle: profile.capStyle,
        hasSloganTowel: profile.hasSloganTowel,
        hasWristband: profile.hasWristband,
        leftHandItem: profile.leftHandItem,
        rightHandItem: profile.rightHandItem,
        isMe: true,
      });
      if (avatar.userData?.nameSprite) {
        avatar.userData.nameSprite.visible = false;
      }
      scene.add(avatar);

      let yaw = 0.2;
      let dragging = false;
      let lastX = 0;

      const onDown = (e: PointerEvent) => {
        dragging = true;
        lastX = e.clientX;
      };
      const onMove = (e: PointerEvent) => {
        if (!dragging) return;
        yaw += (e.clientX - lastX) * 0.015;
        lastX = e.clientX;
      };
      const onUp = () => {
        dragging = false;
      };

      const dom = renderer.domElement;
      dom.addEventListener('pointerdown', onDown);
      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp);

      const clock = new THREE.Clock();
      const loop = () => {
        if (disposed) return;
        animId = requestAnimationFrame(loop);
        const t = clock.getElapsedTime();
        if (!dragging) yaw += 0.008;
        avatar.rotation.y = yaw;
        if (avatar.userData?.bodyGroup) {
          avatar.userData.bodyGroup.position.y = 0.88 + Math.sin(t * 2.5) * 0.025;
        }
        renderer.render(scene, camera);
      };
      loop();

      return () => {
        disposed = true;
        cancelAnimationFrame(animId);
        dom.removeEventListener('pointerdown', onDown);
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onUp);
        renderer.dispose();
      };
    } catch {
      return undefined;
    }
  }, [threeReady, profile, buildFanAvatarMesh]);

  return (
    <div className="relative w-full h-64 rounded-2xl overflow-hidden border border-sky-400/25 bg-slate-950">
      <div ref={previewRef} className="w-full h-full cursor-grab active:cursor-grabbing" />
      <span className="absolute bottom-2 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-slate-900/80 border border-white/10 text-[10px] text-sky-200 pointer-events-none">
        드래그해서 360° 회전
      </span>
    </div>
  );
}

// ============================================================================
// 2-2. 오리지널 에바뛰 미니게임 2종 컴포넌트
//      1) 🏃 무한 달리기 (4개 존 · 7종 장애물 · 2단 점프 · 보호막/별 아이템)
//      2) ☁️ 천국의 계단 (무한 수직 등반 · 4종 발판 · 지하~우주 배경)
// ============================================================================

function getEbddBadgeName(jumps: number): string {
  if (jumps >= 50000) return '☁️ 공중부양자';
  if (jumps >= 10000) return '🤸 에바뛰고수';
  if (jumps >= 5000) return '🏃‍➡️ 에바뛰중수';
  if (jumps >= 1000) return '🚶 에바뛰초보';
  return '🌱 비기너';
}

function overlap(a1: number, a2: number, b1: number, b2: number): boolean {
  return a1 < b2 && a2 > b1;
}

interface MiniGameAvatarLook {
  hoodieColor: string;
  lightstickColor: string;
  hairStyle: HairStyle;
  capStyle: CapStyle;
  leftHandItem: HandItemType;
  rightHandItem: HandItemType;
}

// 3D 광장 아바타의 착장을 미니게임 캔버스 캐릭터로 그려주는 공용 렌더러
function drawPlazaAvatarOnCanvas(
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

  // 헤어 (앞머리 + 긴머리/댄디 가르마)
  ctx.fillStyle = look.hairStyle === 'short' || look.hairStyle === 'dandy' ? '#1e1b18' : '#241a17';
  ctx.beginPath();
  ctx.arc(cx, y + 10.5 * scale, 9.8 * scale, Math.PI, Math.PI * 2);
  ctx.fill();
  if (look.hairStyle === 'long') {
    ctx.fillRect(cx - 10.5 * scale, y + 10 * scale, 3 * scale, 18 * scale);
    ctx.fillRect(cx + 7.5 * scale, y + 10 * scale, 3 * scale, 18 * scale);
  } else if (look.hairStyle === 'dandy') {
    ctx.beginPath();
    ctx.arc(cx - 4 * scale, y + 8 * scale, 4.2 * scale, 0, Math.PI * 2);
    ctx.arc(cx + 4.5 * scale, y + 8 * scale, 3.8 * scale, 0, Math.PI * 2);
    ctx.fill();
  }

  // 공식 모자 (CAP)
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

  // 왼손 / 오른손 MD 아이템 (양손 CNBLUE 슬로건 / 직사각 에.바.뛰. 부채 / 다이아 응원봉)
  const isHoldingSlogan = look.leftHandItem === 'slogan' || look.rightHandItem === 'slogan';
  if (isHoldingSlogan) {
    // 1번 이미지의 선명한 파란색 + 2번 이미지 형태의 가로형 양손 슬로건
    const sw = 34 * scale;
    const sh = 13 * scale;
    const sx = cx - sw / 2;
    const sy = y + 21 * scale;
    ctx.fillStyle = '#0018e8';
    ctx.fillRect(sx, sy, sw, sh);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = Math.max(1.2, 1.4 * scale);
    drawRoundedRectPath(ctx, sx + 1.5 * scale, sy + 1.5 * scale, sw - 3 * scale, sh - 3 * scale, 5 * scale);
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
      ctx.fillStyle = look.lightstickColor;
      ctx.beginPath();
      ctx.arc(cx - 15 * scale, y + 16 * scale, 4.2 * scale, 0, Math.PI * 2);
      ctx.fill();
    }

    if (look.rightHandItem === 'fan') {
      ctx.fillStyle = '#1d4ed8';
      ctx.fillRect(cx + 19 * scale, y + 21 * scale, 2 * scale, 5 * scale);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(cx + 10 * scale, y + 13 * scale, 12 * scale, 9 * scale);
    } else if (look.rightHandItem === 'lightstick') {
      ctx.fillStyle = look.lightstickColor;
      ctx.beginPath();
      ctx.arc(cx + 15 * scale, y + 16 * scale, 4.2 * scale, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.restore();
}

function MiniGameRun({
  avatarLook,
  bestScore,
  onAddJumps,
  onUpdateBestScore,
  onRewardToast,
}: {
  avatarLook: MiniGameAvatarLook;
  bestScore: number;
  onAddJumps: (amount: number) => void;
  onUpdateBestScore: (score: number) => void;
  onRewardToast: (msg: string) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [gameState, setGameState] = useState<'READY' | 'PLAYING' | 'GAMEOVER'>('READY');
  const [score, setScore] = useState<number>(0);
  const [finalScore, setFinalScore] = useState<number>(0);
  const [reward, setReward] = useState<number>(0);

  const frameRef = useRef<number>(0);
  const stateRef = useRef<'READY' | 'PLAYING' | 'GAMEOVER'>('READY');
  const jumpActionRef = useRef<() => void>(() => {});
  const bananaImgRef = useRef<HTMLImageElement | null>(null);

  const propsRef = useRef({ avatarLook, onAddJumps, onUpdateBestScore, onRewardToast });
  useEffect(() => {
    propsRef.current = { avatarLook, onAddJumps, onUpdateBestScore, onRewardToast };
  }, [avatarLook, onAddJumps, onUpdateBestScore, onRewardToast]);

  const OBSTACLES_PER_REWARD = 10;
  const REWARD_PER_GROUP = 5;
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
    setReward(0);
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
    let bonusJumps = 0;
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
      const obstacleReward = Math.floor(clearedObstacles / OBSTACLES_PER_REWARD) * REWARD_PER_GROUP;
      const totalEarned = obstacleReward + bonusJumps;
      setFinalScore(clearedObstacles);
      setReward(totalEarned);

      const { onAddJumps: add, onUpdateBestScore: updateBest, onRewardToast: toast } = propsRef.current;
      if (obstacleReward > 0) add(obstacleReward);
      updateBest(clearedObstacles);
      toast(`🏃 무한 달리기 종료! 장애물 ${clearedObstacles}개 통과 (+${totalEarned} 에바뛰)`);
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
            spawnPauseUntil = frame + Math.ceil(pitWidth / pitSpawnSpeed) + (isDoubleJumpPit ? 48 : 24);
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
          const collisionBottom = o.type === 'drone' ? y + 28 : o.type === 'banana' ? y + o.h : y + o.h - 2;
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
              bonusJumps += 1;
              setReward(bonusJumps);
              propsRef.current.onAddJumps(1);
            }
            items.splice(i, 1);
          }
        }
      }
      if (simulationSteps >= 3) frameAccumulator = 0;

      // 배경 & 4개 존 렌더링
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
        <div className="flex items-center gap-3">
          <span className="font-extrabold text-sky-300">통과 장애물: {score}</span>
          <span className="font-bold text-pink-400">최고 기록: {bestScore}</span>
        </div>
        <span className="text-[11px] text-amber-300 font-bold">
          장애물 10개당 +5 · ⭐ +1 에바뛰
        </span>
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
              목표: 부딪힐 때까지 무한 달리기! (4개 존 돌파)
            </p>
            <p className="text-xs text-[#5de4ff] mt-1">
              장애물 {OBSTACLES_PER_REWARD}개당 {REWARD_PER_GROUP} 에바뛰 · ⭐ 즉시 +1 · 🛡️ 보호막
            </p>
            <span className="mt-4 px-4 py-2 rounded-xl bg-white text-slate-950 text-xs sm:text-sm font-black shadow-lg animate-pulse">
              화면 탭 / 스페이스바로 시작
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
              +{reward.toLocaleString()} 에바뛰 획득
            </p>
            <p className="text-xs sm:text-sm font-bold text-[#ff62c0] mt-0.5">
              통과한 장애물: {finalScore}개
            </p>
            <button
              onClick={start}
              className="mt-4 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-500 hover:to-sky-400 text-xs sm:text-sm font-extrabold text-white shadow-lg flex items-center gap-1.5 transition active:scale-95"
            >
              <RotateCcw className="w-4 h-4" />
              <span>TRY AGAIN</span>
            </button>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between gap-2 text-[11px] text-slate-300 px-1">
        <span>스페이스 · ↑ · W · 화면 탭 (공중 2단 점프 가능)</span>
        <button
          type="button"
          onPointerDown={(e) => {
            e.preventDefault();
            if (stateRef.current === 'PLAYING') jumpActionRef.current();
            else start();
          }}
          className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-extrabold text-white active:scale-95 transition shrink-0"
        >
          점프 (JUMP)
        </button>
      </div>
    </div>
  );
}

function MiniGameRoofBreaker({
  avatarLook,
  bestScore,
  onAddJumps,
  onUpdateBestScore,
  onRewardToast,
}: {
  avatarLook: MiniGameAvatarLook;
  bestScore: number;
  onAddJumps: (amount: number) => void;
  onUpdateBestScore: (score: number) => void;
  onRewardToast: (msg: string) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [gameState, setGameState] = useState<'READY' | 'PLAYING' | 'GAMEOVER'>('READY');
  const [score, setScore] = useState<number>(0);
  const [finalScore, setFinalScore] = useState<number>(0);
  const [reward, setReward] = useState<number>(0);

  const frameRef = useRef<number>(0);
  const stateRef = useRef<'READY' | 'PLAYING' | 'GAMEOVER'>('READY');
  const keysRef = useRef<{ left: boolean; right: boolean }>({ left: false, right: false });

  const propsRef = useRef({ avatarLook, onAddJumps, onUpdateBestScore, onRewardToast });
  useEffect(() => {
    propsRef.current = { avatarLook, onAddJumps, onUpdateBestScore, onRewardToast };
  }, [avatarLook, onAddJumps, onUpdateBestScore, onRewardToast]);

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
    setReward(0);
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
      const lastX = Math.max(8, Math.min(GAME_WIDTH - width - 8, Math.random() * (GAME_WIDTH - width)));

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
      const earned = Math.floor(best / 100);
      setFinalScore(best);
      setReward(earned);

      const { onAddJumps: add, onUpdateBestScore: updateBest, onRewardToast: toast } = propsRef.current;
      if (earned > 0) add(earned);
      updateBest(best);
      toast(`☁️ 천국의 계단 기록: ${best}M 달성! (+${earned} 에바뛰)`);
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
              Math.min(1, Math.max(0, (GAME_HEIGHT - p.y) / PIXELS_PER_METER) / DIFFICULTY_ALTITUDE) *
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

      drawPlazaAvatarOnCanvas(ctx, player.x, player.y - camera, PLAYER_SIZE, propsRef.current.avatarLook);

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
        <div className="flex items-center gap-3">
          <span className="font-extrabold text-sky-300">현재 고도: {score}M</span>
          <span className="font-bold text-cyan-300">최고 기록: {bestScore}M</span>
        </div>
        <span className="text-[11px] text-amber-300 font-bold">100M마다 +1 에바뛰 획득</span>
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
              목표: 끝없이 올라가는 무한 모드
            </p>
            <p className="text-xs text-[#5de4ff] mt-1">1000m · 2000m · 3000m 그 이상까지!</p>
            <p className="text-xs text-[#ffd45f] mt-1">100m마다 +1 에바뛰 획득</p>
            <span className="mt-4 px-4 py-2 rounded-xl bg-white text-slate-950 text-xs font-black shadow-lg animate-pulse">
              화면 좌/우 터치로 시작 & 이동
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
              +{reward.toLocaleString()} 에바뛰 획득
            </p>
            <p className="text-xs sm:text-sm font-bold text-[#5de4ff] mt-0.5">
              최종 기록: {finalScore}M
            </p>
            <button
              onClick={start}
              className="mt-4 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-sky-500 hover:from-indigo-500 hover:to-sky-400 text-xs sm:text-sm font-extrabold text-white shadow-lg flex items-center gap-1.5 transition active:scale-95"
            >
              <RotateCcw className="w-4 h-4" />
              <span>TRY AGAIN</span>
            </button>
          </div>
        )}
      </div>

      {/* 모바일/마우스용 좌·우 홀드 이동 버튼 */}
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
          ◀ 왼쪽 (A / ←)
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
          오른쪽 (D / →) ▶
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// 3. 메인 앱 컴포넌트
// ============================================================================

export function App() {
  // --- 클라우드 인증 & 동기화 상태 ---
  const [user, setUser] = useState<any>(null);
  const [cloudSynced, setCloudSynced] = useState<boolean>(false);
  const [publicAdventAnswers, setPublicAdventAnswers] = useState<
    Array<{ id: string; dateStr: string; text: string; createdAt: number }>
  >([]);
  const lastSavedSnapshotRef = useRef<string>('');

  // --- 3D & 환경 상태 ---
  const [threeReady, setThreeReady] = useState<boolean>(false);
  const [skyTheme, setSkyTheme] = useState<SkyTheme>('day');
  const [viewMode, setViewMode] = useState<ViewMode>('plaza');
  const viewModeRef = useRef<ViewMode>('plaza');
  const [currentRoomId, setCurrentRoomId] = useState<number>(1);
  const currentRoomIdRef = useRef<number>(1);
  const [toastMsg, setToastMsg] = useState<string>('');
  const toastTimerRef = useRef<number | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => {
      setToastMsg('');
    }, 3200);
  }, []);

  // --- 내 아바타 프로필 (기본 착장으로 시작, 어드벤트 질문 답변 시 공식 MD 순차 해금) ---
  const [myProfile, setMyProfile] = useState<{
    name: string;
    seatZone: string;
    hoodieColor: string;
    lightstickColor: string;
    hairStyle: HairStyle;
    outfitStyle: OutfitStyle;
    capStyle: CapStyle;
    hasSloganTowel: boolean;
    hasWristband: boolean;
    leftHandItem: HandItemType;
    rightHandItem: HandItemType;
  }>(() => ({
    name: `보이스_${Math.floor(100 + Math.random() * 899)}`,
    seatZone: ARENA_SECTIONS[0].label,
    hoodieColor: '#ffffff',
    lightstickColor: '#2563eb',
    hairStyle: 'long' as HairStyle,
    outfitStyle: 'white_tee' as OutfitStyle,
    capStyle: 'none' as CapStyle,
    hasSloganTowel: false,
    hasWristband: true,
    leftHandItem: 'none' as HandItemType,
    rightHandItem: 'none' as HandItemType,
  }));

  const myProfileRef = useRef(myProfile);
  useEffect(() => {
    myProfileRef.current = myProfile;
  }, [myProfile]);

  // --- 내 아바타 위치, 트랙 주행 상태, 액션 ---
  const initSpawn = getLanePosition(0, ROOM_LIST[0].spawnAngle);
  const myPosRef = useRef({
    x: initSpawn.x,
    y: 0,
    z: initSpawn.z,
    targetX: initSpawn.x,
    targetY: 0,
    targetZ: initSpawn.z,
    rotationY: ROOM_LIST[0].spawnAngle + Math.PI / 2,
  });
  const isTrackRunningRef = useRef<boolean>(false);
  const trackAngleRef = useRef<number>(ROOM_LIST[0].spawnAngle);

  const [myAction, setMyAction] = useState<AvatarAction>('idle');
  const myActionRef = useRef<AvatarAction>('idle');
  const [speechInput, setSpeechInput] = useState<string>('');
  const mySpeechRef = useRef<string>('');
  const mySpeechTimerRef = useRef<number | null>(null);

  // --- 접속자(최대 30명) & 선택된 팬 ---
  const [peers, setPeers] = useState<FanPeer[]>(() => {
    const room = ROOM_LIST[0];
    return createRoomNpcs(room.id, room.baseCount - 1);
  });
  const peersRef = useRef<FanPeer[]>(peers);
  useEffect(() => {
    peersRef.current = peers;
  }, [peers]);
  const [selectedPeer, setSelectedPeer] = useState<FanPeer | null>(null);

  // --- 「그러나, 꽃이었다」 메모 ---
  const [memos, setMemos] = useState<PlazaMemo[]>(INITIAL_MEMOS);
  const memosRef = useRef<PlazaMemo[]>(memos);
  useEffect(() => {
    memosRef.current = memos;
  }, [memos]);

  const [selectedMemo, setSelectedMemo] = useState<PlazaMemo | null>(null);
  const [newMemoText, setNewMemoText] = useState<string>('');
  const [newMemoColor, setNewMemoColor] = useState<string>(FLOWER_COLORS[0].hex);

  // --- 매일매일 데일리 어드벤트 캘린더 (~2027.02.20) ---
  const todayKstStr = useMemo(() => getKstTodayStr(), []);
  const defaultSelectedDate = useMemo(() => {
    if (todayKstStr < ADVENT_START_DATE) return ADVENT_START_DATE;
    if (todayKstStr > ADVENT_END_DATE) return ADVENT_END_DATE;
    return todayKstStr;
  }, [todayKstStr]);

  const [checkedDates, setCheckedDates] = useState<string[]>([]);
  const [selectedAdventDate, setSelectedAdventDate] = useState<string>(defaultSelectedDate);
  const [selectedAdventMonth, setSelectedAdventMonth] = useState<string>(
    defaultSelectedDate.slice(0, 7)
  );
  const [adventAnswerInput, setAdventAnswerInput] = useState<string>('');
  const [adventAnswers, setAdventAnswers] = useState<Record<string, string>>({});

  // --- 모달 & 오디오 ---
  const [activeModal, setActiveModal] = useState<
    'none' | 'advent' | 'memos' | 'room' | 'profile' | 'seatmap' | 'minigames'
  >('none');
  const [miniGameTab, setMiniGameTab] = useState<'run' | 'roof'>('run');
  const [ebddJumps, setEbddJumps] = useState<number>(1);
  const [runBestScore, setRunBestScore] = useState<number>(0);
  const [roofBestScore, setRoofBestScore] = useState<number>(0);

  // 1) Firebase 인증 초기화 (RULE 3: 쿼리 전 인증 우선 실행)
  useEffect(() => {
    if (!auth) return undefined;
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });
    return () => unsubscribe();
  }, []);

  // 2) 인증 완료 후 Firestore 실시간 동기화 (개인 프로필/답변/해금 + 익명 공개 기록 + 꽃 메모)
  useEffect(() => {
    if (!user || !db) return undefined;

    // 개인 데이터 구독 (/artifacts/{appId}/users/{userId}/profile/main)
    const userDocRef = doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'main');
    const unsubUser = onSnapshot(
      userDocRef,
      (snap) => {
        if (snap.exists()) {
          const data = snap.data() as any;
          const loadedProfile = data.myProfile
            ? { ...myProfileRef.current, ...data.myProfile, hasWristband: true }
            : myProfileRef.current;
          const loadedChecked = Array.isArray(data.checkedDates) ? data.checkedDates : [];
          const loadedAnswers =
            data.adventAnswers && typeof data.adventAnswers === 'object' ? data.adventAnswers : {};
          const loadedJumps = typeof data.ebddJumps === 'number' ? data.ebddJumps : 1;
          const loadedRunBest = typeof data.runBestScore === 'number' ? data.runBestScore : 0;
          const loadedRoofBest = typeof data.roofBestScore === 'number' ? data.roofBestScore : 0;

          lastSavedSnapshotRef.current = JSON.stringify({
            myProfile: loadedProfile,
            checkedDates: loadedChecked,
            adventAnswers: loadedAnswers,
            ebddJumps: loadedJumps,
            runBestScore: loadedRunBest,
            roofBestScore: loadedRoofBest,
          });

          setMyProfile(loadedProfile);
          setCheckedDates(loadedChecked);
          setAdventAnswers(loadedAnswers);
          setEbddJumps(loadedJumps);
          setRunBestScore(loadedRunBest);
          setRoofBestScore(loadedRoofBest);
        }
        setCloudSynced(true);
      },
      (err) => {
        console.error('User profile snapshot error:', err);
        setCloudSynced(true);
      }
    );

    // 공개 익명 어드벤트 답변 구독 (/artifacts/{appId}/public/data/advent_answers)
    const adventPublicCol = collection(db, 'artifacts', appId, 'public', 'data', 'advent_answers');
    const unsubAdventPublic = onSnapshot(
      adventPublicCol,
      (snap) => {
        const items: Array<{ id: string; dateStr: string; text: string; createdAt: number }> = [];
        snap.forEach((d) => {
          const v = d.data() as any;
          if (v && typeof v.dateStr === 'string' && typeof v.text === 'string') {
            items.push({
              id: d.id,
              dateStr: v.dateStr,
              text: v.text,
              createdAt: typeof v.createdAt === 'number' ? v.createdAt : 0,
            });
          }
        });
        items.sort((a, b) => b.createdAt - a.createdAt);
        setPublicAdventAnswers(items);
      },
      (err) => console.error('Public advent answers snapshot error:', err)
    );

    // 공개 「그러나, 꽃이었다」 메모 구독 (/artifacts/{appId}/public/data/flower_memos)
    const memosPublicCol = collection(db, 'artifacts', appId, 'public', 'data', 'flower_memos');
    const unsubMemos = onSnapshot(
      memosPublicCol,
      (snap) => {
        const cloudMemos: PlazaMemo[] = [];
        snap.forEach((d) => {
          const v = d.data() as any;
          if (v && typeof v.text === 'string') {
            cloudMemos.push({
              id: d.id,
              author: v.author || '익명 보이스',
              seatZone: v.seatZone || ARENA_SECTIONS[0].label,
              text: v.text,
              color: v.color || FLOWER_COLORS[0].hex,
              x: typeof v.x === 'number' ? v.x : 0,
              z: typeof v.z === 'number' ? v.z : 12,
              likes: typeof v.likes === 'number' ? v.likes : 1,
              likedByMe: false,
              createdAt: v.createdAtLabel || '방금 전',
            });
          }
        });
        if (cloudMemos.length > 0) {
          cloudMemos.sort((a, b) => b.id.localeCompare(a.id));
          setMemos([...cloudMemos, ...INITIAL_MEMOS]);
        }
      },
      (err) => console.error('Flower memos snapshot error:', err)
    );

    return () => {
      unsubUser();
      unsubAdventPublic();
      unsubMemos();
    };
  }, [user]);

  // 3) 내 프로필·어드벤트 답변·미니게임 기록 자동 클라우드 저장 (디바운스)
  useEffect(() => {
    if (!user || !db || !cloudSynced) return undefined;
    const payload = {
      myProfile,
      checkedDates,
      adventAnswers,
      ebddJumps,
      runBestScore,
      roofBestScore,
    };
    const serialized = JSON.stringify(payload);
    if (serialized === lastSavedSnapshotRef.current) return undefined;

    const timer = window.setTimeout(() => {
      lastSavedSnapshotRef.current = serialized;
      const userDocRef = doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'main');
      setDoc(userDocRef, { ...payload, updatedAt: Date.now() }, { merge: true }).catch((err) =>
        console.error('Save user state error:', err)
      );
    }, 350);

    return () => window.clearTimeout(timer);
  }, [user, cloudSynced, myProfile, checkedDates, adventAnswers, ebddJumps, runBestScore, roofBestScore]);

  // 어드벤트 질문 답변 누적 개수 -> 착용 가능한 MD 아이템 해금 기준
  const answeredCount = useMemo(
    () => Object.values(adventAnswers).filter((v) => v && v.trim().length > 0).length,
    [adventAnswers]
  );

  const nextUnlockMilestone = useMemo(
    () => ADVENT_UNLOCK_MILESTONES.find((m) => m.day > answeredCount) || null,
    [answeredCount]
  );

  const handleAddEbddJumps = useCallback((amount: number) => {
    const safe = Math.max(0, Math.floor(amount));
    if (safe <= 0) return;
    setEbddJumps((prev) => prev + safe);
  }, []);
  const handleUpdateRunBest = useCallback((score: number) => {
    setRunBestScore((prev) => Math.max(prev, Math.floor(score)));
  }, []);
  const handleUpdateRoofBest = useCallback((score: number) => {
    setRoofBestScore((prev) => Math.max(prev, Math.floor(score)));
  }, []);
  const [adventTab, setAdventTab] = useState<'calendar' | 'diary'>('calendar');
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const [trackIndex, setTrackIndex] = useState<number>(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // --- Three.js 컨테이너 및 객체 참조 ---
  const mountRef = useRef<HTMLDivElement | null>(null);
  const mySessionIdRef = useRef<string>(`fan-${Math.random().toString(36).slice(2, 9)}`);
  const bcRef = useRef<BroadcastChannel | null>(null);

  const sceneObjectsRef = useRef<{
    scene?: any;
    camera?: any;
    renderer?: any;
    plazaWorldGroup?: any;
    arenaWorldGroup?: any;
    fog?: any;
    ambientLight?: any;
    dirLight?: any;
    myGroup?: any;
    myNameSprite?: any;
    myLightstickMat?: any;
    myHoodieMat?: any;
    targetRing?: any;
    archBannerMesh?: any;
    flowerMeshes?: Map<string, any>;
    peerGroups?: Map<string, any>;
    adventMonument?: any;
    bandMembers?: {
      minhyuk?: any;
      yonghwa?: any;
      jungshin?: any;
    };
    particles?: Array<{
      mesh: any;
      vy: number;
      vx?: number;
      vz?: number;
      life: number;
      isDust?: boolean;
    }>;
  }>({});

  // ============================================================================
  // 4. Three.js 동적 로드
  // ============================================================================
  useEffect(() => {
    if (window.THREE) {
      setThreeReady(true);
      return;
    }
    const existing = document.getElementById('threejs-cdn-script') as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener('load', () => setThreeReady(true));
      return;
    }
    const script = document.createElement('script');
    script.id = 'threejs-cdn-script';
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
    script.async = true;
    script.onload = () => setThreeReady(true);
    script.onerror = () => showToast('3D 엔진을 불러오는 데 실패했습니다. 네트워크를 확인해 주세요.');
    document.head.appendChild(script);
  }, [showToast]);

  // ============================================================================
  // 5. 배경 음악 (public/audio/track-01~03.mp3 호환)
  // ============================================================================
  const toggleAudio = useCallback(() => {
    if (!audioRef.current) {
      const audio = new Audio(AUDIO_TRACKS[trackIndex].src);
      audio.loop = true;
      audio.volume = 0.45;
      audioRef.current = audio;
    }
    const audio = audioRef.current;
    if (isPlayingAudio) {
      audio.pause();
      setIsPlayingAudio(false);
    } else {
      audio.src = AUDIO_TRACKS[trackIndex].src;
      audio
        .play()
        .then(() => {
          setIsPlayingAudio(true);
          showToast(`🎵 ${AUDIO_TRACKS[trackIndex].title} 재생 중`);
        })
        .catch(() => {
          setIsPlayingAudio(false);
          showToast('🎵 오디오 파일은 GitHub Pages 배포 환경(public/audio)에서 자동 재생됩니다.');
        });
    }
  }, [isPlayingAudio, trackIndex, showToast]);

  const nextAudioTrack = useCallback(() => {
    const nextIdx = (trackIndex + 1) % AUDIO_TRACKS.length;
    setTrackIndex(nextIdx);
    if (audioRef.current && isPlayingAudio) {
      audioRef.current.src = AUDIO_TRACKS[nextIdx].src;
      audioRef.current.play().catch(() => {});
    }
    showToast(`🎵 다음 트랙: ${AUDIO_TRACKS[nextIdx].title}`);
  }, [trackIndex, isPlayingAudio, showToast]);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // ============================================================================
  // 6. 프로필 변경 & 3D 아바타 MD 착장 실시간 동기화
  // ============================================================================
  useEffect(() => {
    const THREE = window.THREE;
    const objs = sceneObjectsRef.current;
    if (THREE && objs.myGroup && objs.myGroup.userData) {
      const ud = objs.myGroup.userData;
      const outfitObj =
        OUTFIT_OPTIONS.find((o) => o.id === myProfile.outfitStyle) || OUTFIT_OPTIONS[0];
      ud.hoodieMat.color.set(outfitObj.baseHex);
      if (ud.jacketStripeGroup) {
        ud.jacketStripeGroup.visible = myProfile.outfitStyle === 'track_jacket';
      }
      if (ud.teeLogoMesh) {
        ud.teeLogoMesh.visible = myProfile.outfitStyle !== 'track_jacket';
        ud.teeLogoMesh.material.color.set(
          myProfile.outfitStyle === 'white_tee' ? '#2563eb' : '#93c5fd'
        );
      }
      if (ud.longHairGroup) {
        ud.longHairGroup.visible = myProfile.hairStyle === 'long';
      }
      if (ud.ponytailGroup) {
        ud.ponytailGroup.visible = myProfile.hairStyle === 'ponytail';
      }
      if (ud.dandyHairGroup) {
        ud.dandyHairGroup.visible = myProfile.hairStyle === 'dandy';
      }
      if (ud.hairMesh && ud.hairMesh.material) {
        ud.hairMesh.material.color.set(
          myProfile.hairStyle === 'short' || myProfile.hairStyle === 'dandy' ? 0x1e1b18 : 0x261c19
        );
      }
      if (ud.capGroup) {
        ud.capGroup.visible = myProfile.capStyle !== 'none';
        if (ud.capCrownMat && ud.capBrimMat) {
          if (myProfile.capStyle === 'official_cap') {
            ud.capCrownMat.color.set('#f1f5f9');
            ud.capBrimMat.color.set('#cbd5e1');
          } else {
            ud.capCrownMat.color.set('#1e3a8a');
            ud.capBrimMat.color.set('#172554');
          }
        }
      }
      if (ud.wristbandGroup) {
        ud.wristbandGroup.visible = true;
      }
      if (ud.rightWristbandGroup) {
        ud.rightWristbandGroup.visible = true;
      }
      const isHoldingSlogan =
        myProfile.leftHandItem === 'slogan' || myProfile.rightHandItem === 'slogan';
      if (ud.heldSloganGroup) {
        ud.heldSloganGroup.visible = isHoldingSlogan;
      }
      if (ud.leftStickGroup) {
        ud.leftStickGroup.visible = !isHoldingSlogan && myProfile.leftHandItem === 'lightstick';
      }
      if (ud.leftFanGroup) {
        ud.leftFanGroup.visible = !isHoldingSlogan && myProfile.leftHandItem === 'fan';
      }
      if (ud.rightStickGroup) {
        ud.rightStickGroup.visible = !isHoldingSlogan && myProfile.rightHandItem === 'lightstick';
      }
      if (ud.rightFanGroup) {
        ud.rightFanGroup.visible = !isHoldingSlogan && myProfile.rightHandItem === 'fan';
      }
      ud.isHoldingSlogan = isHoldingSlogan;
      ud.leftHandItem = myProfile.leftHandItem;
      ud.rightHandItem = myProfile.rightHandItem;

      if (ud.lightstickMat) {
        ud.lightstickMat.color.set(myProfile.lightstickColor);
        ud.lightstickMat.emissive.set(myProfile.lightstickColor);
      }
      if (ud.nameSprite) {
        const tex = createNameTagTexture(THREE, myProfile.name, mySpeechRef.current, true);
        if (ud.nameSprite.material.map) ud.nameSprite.material.map.dispose();
        ud.nameSprite.material.map = tex;
        ud.nameSprite.material.needsUpdate = true;
      }
    }
  }, [myProfile]);

  // 외부 광장 <-> KSPO DOME 공연장 내부 전환
  const switchViewMode = useCallback(
    (nextMode: ViewMode, customSeatLabel?: string) => {
      viewModeRef.current = nextMode;
      setViewMode(nextMode);
      isTrackRunningRef.current = false;
      const objs = sceneObjectsRef.current;
      if (objs.plazaWorldGroup && objs.arenaWorldGroup) {
        objs.plazaWorldGroup.visible = nextMode === 'plaza';
        objs.arenaWorldGroup.visible = nextMode === 'arena';
      }
      if (nextMode === 'arena') {
        const seat = getSeatSectionByLabel(customSeatLabel || myProfileRef.current.seatZone);
        myPosRef.current.x = seat.x;
        myPosRef.current.y = seat.y;
        myPosRef.current.z = seat.z;
        myPosRef.current.targetX = seat.x;
        myPosRef.current.targetY = seat.y;
        myPosRef.current.targetZ = seat.z;
        myPosRef.current.rotationY = Math.atan2(-seat.x, -4.5 - seat.z);
        myActionRef.current = 'wave';
        setMyAction('wave');
        showToast(`🏟️ KSPO DOME 내부 [${seat.label}]에 입장했습니다!`);
      } else {
        const room = ROOM_LIST[currentRoomIdRef.current - 1] || ROOM_LIST[0];
        const pos = getLanePosition(room.id - 1, room.spawnAngle);
        trackAngleRef.current = room.spawnAngle;
        myPosRef.current.x = pos.x;
        myPosRef.current.y = 0;
        myPosRef.current.z = pos.z;
        myPosRef.current.targetX = pos.x;
        myPosRef.current.targetY = 0;
        myPosRef.current.targetZ = pos.z;
        myPosRef.current.rotationY = room.spawnAngle + Math.PI / 2;
        myActionRef.current = 'idle';
        setMyAction('idle');
        showToast(`🏃‍♂️ ${room.name}으로 나왔습니다!`);
      }
    },
    [showToast]
  );

  // 레인(1~5레인) 변경 시: 해당 레인 트랙 실제 좌표로 즉시 이동 + 배너/NPC 업데이트
  const handleChangeRoom = useCallback(
    (roomId: number) => {
      currentRoomIdRef.current = roomId;
      setCurrentRoomId(roomId);
      const room = ROOM_LIST.find((r) => r.id === roomId) || ROOM_LIST[0];

      if (viewModeRef.current === 'arena') {
        viewModeRef.current = 'plaza';
        setViewMode('plaza');
        if (sceneObjectsRef.current.plazaWorldGroup && sceneObjectsRef.current.arenaWorldGroup) {
          sceneObjectsRef.current.plazaWorldGroup.visible = true;
          sceneObjectsRef.current.arenaWorldGroup.visible = false;
        }
      }

      // 선택한 레인의 전용 스타트 지점으로 즉시 이동!
      const pos = getLanePosition(room.id - 1, room.spawnAngle);
      trackAngleRef.current = room.spawnAngle;
      myPosRef.current.x = pos.x;
      myPosRef.current.y = 0;
      myPosRef.current.z = pos.z;
      myPosRef.current.targetX = pos.x;
      myPosRef.current.targetY = 0;
      myPosRef.current.targetZ = pos.z;
      myPosRef.current.rotationY = room.spawnAngle + Math.PI / 2;
      isTrackRunningRef.current = false;
      myActionRef.current = 'idle';
      setMyAction('idle');

      // 트랙 아치 배너 문구도 선택한 레인 테마로 업데이트
      const THREE = window.THREE;
      const archMesh = sceneObjectsRef.current.archBannerMesh;
      if (THREE && archMesh) {
        const tex = createMarqueeTexture(
          THREE,
          `LANE ${room.id} · ${room.name.split('·')[1]?.trim() || room.name}`,
          room.desc,
          room.accentHex
        );
        if (archMesh.material.map) archMesh.material.map.dispose();
        archMesh.material.map = tex;
        archMesh.material.needsUpdate = true;
      }

      setPeers(createRoomNpcs(room.id, room.baseCount - 1));
      setSelectedPeer(null);
      setActiveModal('none');
      showToast(`🚩 [${room.name}] 트랙 위치로 이동했습니다! '달리기 RUN!'을 눌러 달려보세요.`);
    },
    [showToast]
  );

  // 멀티 탭 실시간 동기화 (BroadcastChannel) + NPC 자연스러운 트랙 러닝/산책 AI
  useEffect(() => {
    try {
      const bc = new BroadcastChannel(`kspo_plaza_room_${currentRoomId}`);
      bcRef.current = bc;
      bc.onmessage = (ev) => {
        const data = ev.data;
        if (!data || data.senderId === mySessionIdRef.current) return;
        if (data.type === 'peer_state') {
          setPeers((prev) => {
            const exists = prev.some((p) => p.id === data.peer.id);
            if (exists) {
              return prev.map((p) => (p.id === data.peer.id ? { ...p, ...data.peer } : p));
            }
            if (prev.length >= MAX_ROOM_CAPACITY - 1) return prev;
            return [...prev, data.peer];
          });
        } else if (data.type === 'new_memo') {
          setMemos((prev) => {
            if (prev.some((m) => m.id === data.memo.id)) return prev;
            return [data.memo, ...prev];
          });
        }
      };
      return () => {
        bc.close();
        bcRef.current = null;
      };
    } catch {
      return undefined;
    }
  }, [currentRoomId]);

  useEffect(() => {
    const syncInterval = window.setInterval(() => {
      if (bcRef.current) {
        bcRef.current.postMessage({
          type: 'peer_state',
          senderId: mySessionIdRef.current,
          peer: {
            id: mySessionIdRef.current,
            name: myProfileRef.current.name,
            seatZone: myProfileRef.current.seatZone,
            hoodieColor: myProfileRef.current.hoodieColor,
            lightstickColor: myProfileRef.current.lightstickColor,
            hairStyle: myProfileRef.current.hairStyle,
            outfitStyle: myProfileRef.current.outfitStyle,
            capStyle: myProfileRef.current.capStyle,
            hasSloganTowel: myProfileRef.current.hasSloganTowel,
            hasWristband: myProfileRef.current.hasWristband,
            leftHandItem: myProfileRef.current.leftHandItem,
            rightHandItem: myProfileRef.current.rightHandItem,
            x: myPosRef.current.x,
            z: myPosRef.current.z,
            targetX: myPosRef.current.targetX,
            targetZ: myPosRef.current.targetZ,
            rotationY: myPosRef.current.rotationY,
            action: myActionRef.current,
            actionUntil: Date.now() + 3000,
            speech: mySpeechRef.current || undefined,
            speechUntil: Date.now() + 6000,
            isNpc: false,
          },
        });
      }
    }, 1200);

    const npcInterval = window.setInterval(() => {
      setPeers((prev) =>
        prev.map((p) => {
          if (!p.isNpc || p.laneRadius !== undefined || Math.random() > 0.35) return p;
          const innerAngle = Math.random() * Math.PI * 2;
          const innerR = 4 + Math.random() * 9.5;
          const nx = TRACK_CENTER_X + Math.cos(innerAngle) * innerR;
          const nz = TRACK_CENTER_Z + Math.sin(innerAngle) * innerR;
          return {
            ...p,
            targetX: nx,
            targetZ: nz,
            action: Math.random() > 0.65 ? 'wave' : 'walk',
          };
        })
      );
    }, 4500);

    return () => {
      window.clearInterval(syncInterval);
      window.clearInterval(npcInterval);
    };
  }, []);

  // ============================================================================
  // 7. 파티클 & 액션 트리거 헬퍼
  // ============================================================================
  const spawnFloatingParticles = useCallback((hexColor: string) => {
    const THREE = window.THREE;
    const objs = sceneObjectsRef.current;
    if (!THREE || !objs.scene || !objs.particles) return;

    for (let i = 0; i < 8; i++) {
      const mesh = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.13, 0),
        new THREE.MeshBasicMaterial({
          color: hexColor,
          transparent: true,
          opacity: 0.95,
        })
      );
      mesh.position.set(
        myPosRef.current.x + (Math.random() - 0.5) * 1.3,
        myPosRef.current.y + 1.4 + Math.random() * 0.6,
        myPosRef.current.z + (Math.random() - 0.5) * 1.3
      );
      objs.scene.add(mesh);
      objs.particles.push({
        mesh,
        vy: 1.4 + Math.random() * 1.1,
        vx: (Math.random() - 0.5) * 0.9,
        vz: (Math.random() - 0.5) * 0.9,
        life: 0.95,
      });
    }
  }, []);

  const triggerAction = useCallback(
    (action: AvatarAction, message?: string) => {
      if (action !== 'run') {
        isTrackRunningRef.current = false;
      }
      myActionRef.current = action;
      setMyAction(action);
      if (action === 'wave' || action === 'cheer') {
        spawnFloatingParticles(myProfileRef.current.lightstickColor);
      }
      if (message) showToast(message);
    },
    [spawnFloatingParticles, showToast]
  );

  const handleSendSpeech = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const text = speechInput.trim();
      if (!text) return;
      mySpeechRef.current = text;
      setSpeechInput('');

      const THREE = window.THREE;
      const objs = sceneObjectsRef.current;
      if (THREE && objs.myNameSprite) {
        const tex = createNameTagTexture(THREE, myProfileRef.current.name, text, true);
        if (objs.myNameSprite.material.map) objs.myNameSprite.material.map.dispose();
        objs.myNameSprite.material.map = tex;
        objs.myNameSprite.material.needsUpdate = true;
      }

      if (mySpeechTimerRef.current) window.clearTimeout(mySpeechTimerRef.current);
      mySpeechTimerRef.current = window.setTimeout(() => {
        mySpeechRef.current = '';
        if (window.THREE && sceneObjectsRef.current.myNameSprite) {
          const cleanTex = createNameTagTexture(window.THREE, myProfileRef.current.name, '', true);
          if (sceneObjectsRef.current.myNameSprite.material.map) {
            sceneObjectsRef.current.myNameSprite.material.map.dispose();
          }
          sceneObjectsRef.current.myNameSprite.material.map = cleanTex;
          sceneObjectsRef.current.myNameSprite.material.needsUpdate = true;
        }
      }, 7500);
    },
    [speechInput]
  );

  // ============================================================================
  // 8. 3D 캐릭터 & 3D 「그러나, 꽃이었다」 꽃 오브젝트 생성 헬퍼
  // ============================================================================
  const buildFanAvatarMesh = useCallback(
    (
      THREE: any,
      options: {
        name: string;
        hoodieColor: string;
        lightstickColor: string;
        hairStyle?: HairStyle;
        outfitStyle?: OutfitStyle;
        capStyle?: CapStyle;
        hasSloganTowel?: boolean;
        hasWristband?: boolean;
        leftHandItem?: HandItemType;
        rightHandItem?: HandItemType;
        speech?: string;
        isMe?: boolean;
      }
    ) => {
      const group = new THREE.Group();
      const hairStyle: HairStyle = options.hairStyle || 'long';
      const outfitStyle = options.outfitStyle || 'track_jacket';
      const capStyle = options.capStyle || 'official_cap';
      const hasWristband = true;
      const leftHandItem: HandItemType = options.leftHandItem ?? 'fan';
      const rightHandItem: HandItemType = options.rightHandItem ?? 'lightstick';
      const isHoldingSlogan = leftHandItem === 'slogan' || rightHandItem === 'slogan';

      const shadow = new THREE.Mesh(
        new THREE.CircleGeometry(0.46, 20),
        new THREE.MeshBasicMaterial({
          color: 0x0f172a,
          transparent: true,
          opacity: 0.24,
        })
      );
      shadow.rotation.x = -Math.PI / 2;
      shadow.position.y = 0.02;
      group.add(shadow);

      // 다리 + 05. 공식 투라인 블루 스트라이프 크루 삭스 + 화이트 러닝화
      const buildLeg = (sideX: number) => {
        const legPivot = new THREE.Group();
        legPivot.position.set(sideX, 0.52, 0);

        const pant = new THREE.Mesh(
          new THREE.CylinderGeometry(0.145, 0.13, 0.3, 12),
          new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.75 })
        );
        pant.position.y = -0.14;
        legPivot.add(pant);

        const sock = new THREE.Mesh(
          new THREE.CylinderGeometry(0.115, 0.11, 0.16, 12),
          new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.6 })
        );
        sock.position.y = -0.35;
        legPivot.add(sock);

        const stripeMat = new THREE.MeshBasicMaterial({ color: 0x1d4ed8 });
        const s1 = new THREE.Mesh(new THREE.TorusGeometry(0.116, 0.014, 6, 16), stripeMat);
        s1.rotation.x = Math.PI / 2;
        s1.position.y = -0.3;
        const s2 = s1.clone();
        s2.position.y = -0.34;
        legPivot.add(s1, s2);

        const shoe = new THREE.Mesh(
          new THREE.BoxGeometry(0.24, 0.13, 0.36),
          new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.45 })
        );
        shoe.position.set(0, -0.46, 0.06);
        legPivot.add(shoe);

        const shoeSole = new THREE.Mesh(
          new THREE.BoxGeometry(0.25, 0.04, 0.37),
          new THREE.MeshBasicMaterial({ color: 0x2563eb })
        );
        shoeSole.position.set(0, -0.51, 0.06);
        legPivot.add(shoeSole);

        return legPivot;
      };

      const leftLeg = buildLeg(-0.2);
      const rightLeg = buildLeg(0.2);
      group.add(leftLeg, rightLeg);

      // 몸통 (달리기 트랙 자켓 / 콘서트 티셔츠)
      const bodyGroup = new THREE.Group();
      bodyGroup.position.y = 0.88;
      const outfitObj = OUTFIT_OPTIONS.find((o) => o.id === outfitStyle) || OUTFIT_OPTIONS[0];
      const hoodieMat = new THREE.MeshStandardMaterial({
        color: outfitObj.baseHex,
        roughness: 0.5,
      });
      const bodyMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.43, 0.78, 16), hoodieMat);
      bodyGroup.add(bodyMesh);

      const jacketStripeGroup = new THREE.Group();
      const blueAccentMat = new THREE.MeshStandardMaterial({ color: 0x1d4ed8, roughness: 0.4 });
      const navyCollar = new THREE.Mesh(
        new THREE.TorusGeometry(0.32, 0.065, 8, 20),
        new THREE.MeshStandardMaterial({ color: 0x1e3a8a, roughness: 0.5 })
      );
      navyCollar.rotation.x = Math.PI / 2;
      navyCollar.position.y = 0.36;
      const zipperLine = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.74, 0.06), blueAccentMat);
      zipperLine.position.set(0, 0, 0.39);
      const chestPatch = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.09, 0.05), blueAccentMat);
      chestPatch.position.set(0.15, 0.14, 0.37);
      const shoulderBarL = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.06, 0.24), blueAccentMat);
      shoulderBarL.position.set(-0.34, 0.34, 0);
      const shoulderBarR = shoulderBarL.clone();
      shoulderBarR.position.x = 0.34;
      jacketStripeGroup.add(navyCollar, zipperLine, chestPatch, shoulderBarL, shoulderBarR);
      jacketStripeGroup.visible = outfitStyle === 'track_jacket';
      bodyGroup.add(jacketStripeGroup);

      const teeLogoMesh = new THREE.Mesh(
        new THREE.TorusGeometry(0.13, 0.032, 8, 20, Math.PI * 1.4),
        new THREE.MeshBasicMaterial({
          color: outfitStyle === 'white_tee' ? '#2563eb' : '#93c5fd',
        })
      );
      teeLogoMesh.position.set(0, 0.08, 0.39);
      teeLogoMesh.rotation.z = Math.PI * 0.3;
      teeLogoMesh.visible = outfitStyle !== 'track_jacket';
      bodyGroup.add(teeLogoMesh);

      // 양손으로 펼쳐 드는 공식 CNBLUE 슬로건 (1번 로열 블루 + 2번 가로형 캡슐 로고)
      const heldSloganGroup = buildCnblueSloganMesh(THREE);
      heldSloganGroup.position.set(0, 0.08, 0.54);
      heldSloganGroup.visible = isHoldingSlogan;
      bodyGroup.add(heldSloganGroup);

      // 머리 & 헤어
      const headMesh = new THREE.Mesh(
        new THREE.SphereGeometry(0.39, 20, 20),
        new THREE.MeshStandardMaterial({ color: 0xffedd5, roughness: 0.6 })
      );
      headMesh.position.y = 0.68;
      bodyGroup.add(headMesh);

      const hairMat = new THREE.MeshStandardMaterial({
        color: hairStyle === 'short' || hairStyle === 'dandy' ? 0x1e1b18 : 0x261c19,
        roughness: 0.82,
      });
      const hairMesh = new THREE.Mesh(
        new THREE.SphereGeometry(0.41, 20, 16, 0, Math.PI * 2, 0, Math.PI * 0.58),
        hairMat
      );
      hairMesh.position.y = 0.72;
      hairMesh.rotation.x = -0.15;
      bodyGroup.add(hairMesh);

      // 댄디 가르마 (쉼표 볼륨 앞머리) 파츠
      const dandyHairGroup = new THREE.Group();
      const bangL = new THREE.Mesh(new THREE.SphereGeometry(0.145, 12, 12), hairMat);
      bangL.scale.set(1.05, 1.25, 0.65);
      bangL.position.set(-0.13, 0.86, 0.35);
      bangL.rotation.z = 0.26;
      const bangR = new THREE.Mesh(new THREE.SphereGeometry(0.135, 12, 12), hairMat);
      bangR.scale.set(1.0, 1.18, 0.65);
      bangR.position.set(0.145, 0.86, 0.34);
      bangR.rotation.z = -0.24;
      const sideBurnL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.26, 0.16), hairMat);
      sideBurnL.position.set(-0.35, 0.64, 0.04);
      const sideBurnR = sideBurnL.clone();
      sideBurnR.position.x = 0.35;
      dandyHairGroup.add(bangL, bangR, sideBurnL, sideBurnR);
      dandyHairGroup.visible = hairStyle === 'dandy';
      bodyGroup.add(dandyHairGroup);

      // 여성 긴 생머리 (Long Hair) 파츠
      const longHairGroup = new THREE.Group();
      const backHairMain = new THREE.Mesh(
        new THREE.CylinderGeometry(0.37, 0.44, 0.88, 18, 1, false, Math.PI * 0.58, Math.PI * 0.84),
        hairMat
      );
      backHairMain.position.set(0, 0.34, -0.04);
      const backHairFill = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.76, 0.16), hairMat);
      backHairFill.position.set(0, 0.34, -0.34);
      const sideLockL = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.065, 0.72, 10), hairMat);
      sideLockL.position.set(-0.34, 0.42, 0.08);
      sideLockL.rotation.z = 0.08;
      const sideLockR = sideLockL.clone();
      sideLockR.position.x = 0.34;
      sideLockR.rotation.z = -0.08;
      longHairGroup.add(backHairMain, backHairFill, sideLockL, sideLockR);
      longHairGroup.visible = hairStyle === 'long';
      bodyGroup.add(longHairGroup);

      // 여성 포니테일 (Ponytail) 파츠 (모자 뒤쪽으로도 자연스럽게 묶임)
      const ponytailGroup = new THREE.Group();
      const ponySideL = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.045, 0.36, 8), hairMat);
      ponySideL.position.set(-0.33, 0.58, 0.12);
      ponySideL.rotation.z = 0.12;
      const ponySideR = ponySideL.clone();
      ponySideR.position.x = 0.33;
      ponySideR.rotation.z = -0.12;

      const scrunchie = new THREE.Mesh(
        new THREE.TorusGeometry(0.095, 0.036, 8, 16),
        new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.4 })
      );
      scrunchie.position.set(0, 0.72, -0.41);

      const ponytailPivot = new THREE.Group();
      ponytailPivot.position.set(0, 0.72, -0.43);
      const ponyUpper = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 12), hairMat);
      ponyUpper.scale.set(0.95, 1.35, 1.0);
      ponyUpper.position.set(0, -0.1, -0.09);
      ponyUpper.rotation.x = 0.42;
      const ponyTailCone = new THREE.Mesh(new THREE.ConeGeometry(0.145, 0.58, 12), hairMat);
      ponyTailCone.position.set(0, -0.42, -0.16);
      ponyTailCone.rotation.x = Math.PI + 0.12;
      ponytailPivot.add(ponyUpper, ponyTailCone);

      ponytailGroup.add(ponySideL, ponySideR, scrunchie, ponytailPivot);
      ponytailGroup.visible = hairStyle === 'ponytail';
      bodyGroup.add(ponytailGroup);

      // 01. 공식 화이트 데님 캡 모자
      const capGroup = new THREE.Group();
      capGroup.position.set(0, 0.79, 0);
      const capCrownMat = new THREE.MeshStandardMaterial({
        color: capStyle === 'official_cap' ? 0xf1f5f9 : 0x1e3a8a,
        roughness: 0.65,
      });
      const capBrimMat = new THREE.MeshStandardMaterial({
        color: capStyle === 'official_cap' ? 0xcbd5e1 : 0x172554,
        roughness: 0.65,
      });
      const capCrown = new THREE.Mesh(
        new THREE.SphereGeometry(0.425, 20, 14, 0, Math.PI * 2, 0, Math.PI * 0.48),
        capCrownMat
      );
      const capBrim = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.4, 0.055, 18), capBrimMat);
      capBrim.position.set(0, 0.02, 0.28);
      capBrim.rotation.x = 0.12;
      const denimPatch = new THREE.Mesh(
        new THREE.BoxGeometry(0.2, 0.06, 0.14),
        new THREE.MeshStandardMaterial({ color: 0x3b82f6, roughness: 0.7 })
      );
      denimPatch.position.set(0.14, 0.02, 0.53);
      const capLogo = new THREE.Mesh(
        new THREE.TorusGeometry(0.085, 0.024, 6, 16, Math.PI * 1.45),
        new THREE.MeshBasicMaterial({ color: 0x2563eb })
      );
      capLogo.position.set(0, 0.15, 0.4);
      capLogo.rotation.z = Math.PI * 0.28;
      capGroup.add(capCrown, capBrim, denimPatch, capLogo);
      capGroup.visible = capStyle !== 'none';
      bodyGroup.add(capGroup);

      // 눈
      const eyeGeo = new THREE.SphereGeometry(0.048, 8, 8);
      const eyeMat = new THREE.MeshBasicMaterial({ color: 0x0f172a });
      const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
      leftEye.position.set(-0.13, 0.67, 0.36);
      const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
      rightEye.position.set(0.13, 0.67, 0.36);
      bodyGroup.add(leftEye, rightEye);

      // 공식 다이아 응원봉 3D 조립 헬퍼 (왼손·오른손 공용)
      const lightstickMat = new THREE.MeshStandardMaterial({
        color: options.lightstickColor,
        emissive: options.lightstickColor,
        emissiveIntensity: 1.15,
        roughness: 0.15,
        metalness: 0.25,
      });

      const createLightstickAttachment = () => {
        const stickPivot = new THREE.Group();
        stickPivot.position.set(0, -0.36, 0.28);
        stickPivot.rotation.x = 0.5;

        const stickHandle = new THREE.Mesh(
          new THREE.CylinderGeometry(0.052, 0.042, 0.42, 12),
          new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.3, metalness: 0.2 })
        );
        stickPivot.add(stickHandle);

        const collarRing = new THREE.Mesh(
          new THREE.TorusGeometry(0.068, 0.022, 8, 16),
          new THREE.MeshStandardMaterial({
            color: 0x38bdf8,
            emissive: 0x2563eb,
            emissiveIntensity: 1.0,
          })
        );
        collarRing.rotation.x = Math.PI / 2;
        collarRing.position.y = 0.21;
        stickPivot.add(collarRing);

        const globeMesh = new THREE.Mesh(
          new THREE.SphereGeometry(0.22, 18, 18),
          new THREE.MeshStandardMaterial({
            color: 0xe0f2fe,
            transparent: true,
            opacity: 0.34,
            roughness: 0.08,
            metalness: 0.15,
          })
        );
        globeMesh.position.y = 0.41;
        stickPivot.add(globeMesh);

        const stickHead = new THREE.Mesh(new THREE.OctahedronGeometry(0.145, 0), lightstickMat);
        stickHead.scale.set(0.88, 1.28, 0.88);
        stickHead.position.y = 0.41;
        stickPivot.add(stickHead);

        return { stickPivot, stickHead };
      };

      const createFanAttachment = (isLeftHand: boolean) => {
        const fanPivot = new THREE.Group();
        fanPivot.position.set(isLeftHand ? -0.02 : 0.02, -0.36, 0.36);
        fanPivot.rotation.x = 0.48;
        fanPivot.rotation.y = isLeftHand ? 0.14 : -0.14;
        const fanMesh = buildEbddFanMesh(THREE);
        fanPivot.add(fanMesh);
        return fanPivot;
      };

      // 왼팔 + 04. 화이트 손목 아대 + 왼손 MD (부채 / 응원봉)
      const leftArmPivot = new THREE.Group();
      leftArmPivot.position.set(-0.45, 0.24, 0);
      const armGeo = new THREE.CylinderGeometry(0.1, 0.1, 0.5, 10);
      const leftArm = new THREE.Mesh(armGeo, hoodieMat);
      leftArm.position.set(0, -0.2, 0.06);
      leftArm.rotation.x = -0.35;
      leftArmPivot.add(leftArm);

      const wristbandGroup = new THREE.Group();
      const leftBand = new THREE.Mesh(
        new THREE.CylinderGeometry(0.118, 0.118, 0.11, 12),
        new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.6 })
      );
      leftBand.position.set(0, -0.34, 0.16);
      leftBand.rotation.x = -0.35;
      const leftBandStripe = new THREE.Mesh(
        new THREE.TorusGeometry(0.12, 0.015, 6, 14),
        new THREE.MeshBasicMaterial({ color: 0x1d4ed8 })
      );
      leftBandStripe.rotation.x = Math.PI / 2 - 0.35;
      leftBandStripe.position.set(0, -0.34, 0.16);
      wristbandGroup.add(leftBand, leftBandStripe);
      wristbandGroup.visible = hasWristband;
      leftArmPivot.add(wristbandGroup);

      const leftStickObj = createLightstickAttachment();
      leftStickObj.stickPivot.visible = !isHoldingSlogan && leftHandItem === 'lightstick';
      const leftFanGroup = createFanAttachment(true);
      leftFanGroup.visible = !isHoldingSlogan && leftHandItem === 'fan';
      leftArmPivot.add(leftStickObj.stickPivot, leftFanGroup);
      if (isHoldingSlogan) {
        leftArmPivot.rotation.x = -0.88;
        leftArmPivot.rotation.z = -0.12;
      }
      bodyGroup.add(leftArmPivot);

      // 오른팔 + 04. 로열블루 손목 아대 + 오른손 MD (응원봉 / 부채)
      const rightArmPivot = new THREE.Group();
      rightArmPivot.position.set(0.45, 0.24, 0);
      const rightArm = new THREE.Mesh(armGeo, hoodieMat);
      rightArm.position.set(0, -0.2, 0.08);
      rightArm.rotation.x = -0.45;
      rightArmPivot.add(rightArm);

      const rightWristbandGroup = new THREE.Group();
      const rightBand = new THREE.Mesh(
        new THREE.CylinderGeometry(0.118, 0.118, 0.11, 12),
        new THREE.MeshStandardMaterial({ color: 0x1d4ed8, roughness: 0.55 })
      );
      rightBand.position.set(0, -0.34, 0.18);
      rightBand.rotation.x = -0.45;
      rightWristbandGroup.add(rightBand);
      rightWristbandGroup.visible = hasWristband;
      rightArmPivot.add(rightWristbandGroup);

      const rightStickObj = createLightstickAttachment();
      rightStickObj.stickPivot.visible = !isHoldingSlogan && rightHandItem === 'lightstick';
      const rightFanGroup = createFanAttachment(false);
      rightFanGroup.visible = !isHoldingSlogan && rightHandItem === 'fan';
      rightArmPivot.add(rightStickObj.stickPivot, rightFanGroup);
      if (isHoldingSlogan) {
        rightArmPivot.rotation.x = -0.88;
        rightArmPivot.rotation.z = 0.12;
      }
      bodyGroup.add(rightArmPivot);
      group.add(bodyGroup);

      // 닉네임 + 말풍선 스프라이트
      const tagTex = createNameTagTexture(THREE, options.name, options.speech, options.isMe);
      const tagMat = new THREE.SpriteMaterial({ map: tagTex, transparent: true, depthTest: false });
      const nameSprite = new THREE.Sprite(tagMat);
      nameSprite.position.set(0, 2.52, 0);
      nameSprite.scale.set(2.7, 1.0, 1);
      group.add(nameSprite);

      group.userData = {
        leftLeg,
        rightLeg,
        leftArmPivot,
        bodyGroup,
        bodyMesh,
        rightArmPivot,
        stickHead: rightStickObj.stickHead,
        rightStickHead: rightStickObj.stickHead,
        leftStickHead: leftStickObj.stickHead,
        leftStickGroup: leftStickObj.stickPivot,
        leftFanGroup,
        rightStickGroup: rightStickObj.stickPivot,
        rightFanGroup,
        heldSloganGroup,
        isHoldingSlogan,
        leftHandItem,
        rightHandItem,
        nameSprite,
        hoodieMat,
        lightstickMat,
        hairMesh,
        longHairGroup,
        ponytailGroup,
        ponytailPivot,
        dandyHairGroup,
        jacketStripeGroup,
        teeLogoMesh,
        capGroup,
        capCrownMat,
        capBrimMat,
        wristbandGroup,
        rightWristbandGroup,
        lastSpeech: options.speech || '',
      };

      return group;
    },
    []
  );

  // 3D 「그러나, 꽃이었다 (Still, a Flower)」 땅에 피어나는 꽃 오브젝트 생성
  const buildBloomFlowerMesh = useCallback((THREE: any, memo: PlazaMemo) => {
    const fGroup = new THREE.Group();
    fGroup.position.set(memo.x, 0, memo.z);

    // 바닥 은은한 꽃빛 오라 링
    const aura = new THREE.Mesh(
      new THREE.RingGeometry(0.28, 0.65, 24),
      new THREE.MeshBasicMaterial({
        color: memo.color,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.45,
      })
    );
    aura.rotation.x = -Math.PI / 2;
    aura.position.y = 0.03;
    fGroup.add(aura);

    // 살랑이는 꽃대 그룹
    const swayGroup = new THREE.Group();

    // 초록 줄기
    const stemMat = new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.65 });
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.038, 0.055, 1.15, 8), stemMat);
    stem.position.y = 0.57;
    swayGroup.add(stem);

    // 양쪽 나뭇잎 2장
    const leafGeo = new THREE.SphereGeometry(0.22, 10, 8);
    const leafL = new THREE.Mesh(leafGeo, stemMat);
    leafL.scale.set(1.4, 0.25, 0.65);
    leafL.position.set(-0.22, 0.45, 0);
    leafL.rotation.z = 0.45;
    const leafR = new THREE.Mesh(leafGeo, stemMat);
    leafR.scale.set(1.4, 0.25, 0.65);
    leafR.position.set(0.22, 0.62, 0);
    leafR.rotation.z = -0.45;
    swayGroup.add(leafL, leafR);

    // 꽃송이 머리 (약간 위를 향해 활짝 핀 각도)
    const blossomHead = new THREE.Group();
    blossomHead.position.set(0, 1.18, 0);
    blossomHead.rotation.x = 0.35;

    const petalMat = new THREE.MeshStandardMaterial({
      color: memo.color,
      emissive: memo.color,
      emissiveIntensity: 0.55,
      roughness: 0.28,
    });

    // 6장의 입체 꽃잎
    for (let p = 0; p < 6; p++) {
      const pAngle = (p / 6) * Math.PI * 2;
      const petal = new THREE.Mesh(new THREE.SphereGeometry(0.23, 12, 10), petalMat);
      petal.scale.set(0.78, 0.24, 1.38);
      petal.position.set(Math.cos(pAngle) * 0.27, 0, Math.sin(pAngle) * 0.27);
      petal.rotation.y = -pAngle + Math.PI / 2;
      petal.rotation.x = -0.22;
      blossomHead.add(petal);
    }

    // 중앙 황금빛 수술
    const pistil = new THREE.Mesh(
      new THREE.SphereGeometry(0.16, 12, 12),
      new THREE.MeshStandardMaterial({
        color: 0xfacc15,
        emissive: 0xf59e0b,
        emissiveIntensity: 0.85,
      })
    );
    pistil.scale.set(1, 0.65, 1);
    pistil.position.y = 0.05;
    blossomHead.add(pistil);

    swayGroup.add(blossomHead);
    fGroup.add(swayGroup);

    // 꽃 위 메모 말풍선 스프라이트
    const tagTex = createNameTagTexture(THREE, `🌸 ${memo.author}`, memo.text, false);
    const sprite = new THREE.Sprite(
      new THREE.SpriteMaterial({ map: tagTex, transparent: true, depthTest: false })
    );
    sprite.position.set(0, 2.25, 0);
    sprite.scale.set(2.85, 1.06, 1);
    fGroup.add(sprite);

    fGroup.traverse((child: any) => {
      child.userData = { ...child.userData, memoId: memo.id };
    });

    fGroup.userData = { swayGroup, aura };
    return fGroup;
  }, []);

  // 씨엔블루 3인 멤버(강민혁·정용화·이정신) 치비 캐릭터 + 악기(드럼·일렉기타·베이스) 생성 헬퍼
  const buildBandMemberMesh = useCallback(
    (
      THREE: any,
      member: {
        id: 'minhyuk' | 'yonghwa' | 'jungshin';
        name: string;
        roleLabel: string;
        quote: string;
      }
    ) => {
      const root = new THREE.Group();

      // 무대 위 발밑 스포트라이트 링
      const spotRing = new THREE.Mesh(
        new THREE.RingGeometry(0.65, 1.05, 32),
        new THREE.MeshBasicMaterial({
          color: 0x38bdf8,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.55,
        })
      );
      spotRing.rotation.x = -Math.PI / 2;
      spotRing.position.y = 0.02;
      root.add(spotRing);

      // 캐릭터 본체 (치비 비율 + IMG_5990.png의 화이트·블루 CNBLUE 트랙 자켓 풀착장)
      const charGroup = new THREE.Group();

      const buildLeg = (sideX: number) => {
        const leg = new THREE.Group();
        leg.position.set(sideX, 0.54, 0);
        const pant = new THREE.Mesh(
          new THREE.CylinderGeometry(0.155, 0.14, 0.36, 12),
          new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.7 })
        );
        pant.position.y = -0.17;
        const shoe = new THREE.Mesh(
          new THREE.BoxGeometry(0.26, 0.14, 0.38),
          new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 })
        );
        shoe.position.set(0, -0.42, 0.06);
        const sole = new THREE.Mesh(
          new THREE.BoxGeometry(0.27, 0.045, 0.39),
          new THREE.MeshBasicMaterial({ color: 0x2563eb })
        );
        sole.position.set(0, -0.48, 0.06);
        leg.add(pant, shoe, sole);
        return leg;
      };

      const leftLeg = buildLeg(-0.21);
      const rightLeg = buildLeg(0.21);
      charGroup.add(leftLeg, rightLeg);

      const bodyGroup = new THREE.Group();
      bodyGroup.position.y = 0.92;

      // 화이트 트랙 자켓 바디
      const jacketMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.45 });
      const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.37, 0.45, 0.82, 18), jacketMat);
      bodyGroup.add(torso);

      // 네이비 카라 + 블루 지퍼 라인 + CNBLUE 가슴 패치 + 어깨 블루 스트라이프
      const blueTrimMat = new THREE.MeshStandardMaterial({ color: 0x1d4ed8, roughness: 0.38 });
      const navyCollar = new THREE.Mesh(
        new THREE.TorusGeometry(0.34, 0.07, 8, 22),
        new THREE.MeshStandardMaterial({ color: 0x1e3a8a, roughness: 0.5 })
      );
      navyCollar.rotation.x = Math.PI / 2;
      navyCollar.position.y = 0.38;

      const zipper = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.78, 0.06), blueTrimMat);
      zipper.position.set(0, 0, 0.41);

      const badge = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.1, 0.05), blueTrimMat);
      badge.position.set(0.16, 0.15, 0.39);

      const stripeL = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.07, 0.28), blueTrimMat);
      stripeL.position.set(-0.36, 0.35, 0);
      const stripeR = stripeL.clone();
      stripeR.position.x = 0.36;
      bodyGroup.add(navyCollar, zipper, badge, stripeL, stripeR);

      // 치비 비율 큰 머리 (radius 0.45)
      const head = new THREE.Mesh(
        new THREE.SphereGeometry(0.45, 24, 24),
        new THREE.MeshStandardMaterial({ color: 0xffedd5, roughness: 0.55 })
      );
      head.position.y = 0.75;
      bodyGroup.add(head);

      // 멤버별 시그니처 헤어스타일 (IMG_5990.png 반영)
      const hairMat = new THREE.MeshStandardMaterial({
        color: member.id === 'jungshin' ? 0x29201c : 0x181514,
        roughness: 0.82,
      });
      const hairCap = new THREE.Mesh(
        new THREE.SphereGeometry(0.475, 22, 18, 0, Math.PI * 2, 0, Math.PI * 0.58),
        hairMat
      );
      hairCap.position.y = 0.79;
      hairCap.rotation.x = -0.16;
      bodyGroup.add(hairCap);

      if (member.id === 'yonghwa') {
        // 정용화: 앞머리 가르마 쉼표 헤어
        const bangL = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 12), hairMat);
        bangL.scale.set(1.1, 1.35, 0.65);
        bangL.position.set(-0.15, 0.92, 0.4);
        bangL.rotation.z = 0.28;
        const bangR = new THREE.Mesh(new THREE.SphereGeometry(0.15, 12, 12), hairMat);
        bangR.scale.set(1.0, 1.25, 0.65);
        bangR.position.set(0.17, 0.92, 0.39);
        bangR.rotation.z = -0.25;
        bodyGroup.add(bangL, bangR);
      } else if (member.id === 'jungshin') {
        // 이정신: 풍성한 5:5 웨이브 가르마 헤어
        const waveOffsets = [
          [-0.36, 0.88, 0.24],
          [-0.42, 0.72, 0.14],
          [0.36, 0.88, 0.24],
          [0.42, 0.72, 0.14],
          [-0.17, 0.96, 0.36],
          [0.17, 0.96, 0.36],
        ];
        waveOffsets.forEach(([wx, wy, wz]) => {
          const curl = new THREE.Mesh(new THREE.SphereGeometry(0.165, 12, 12), hairMat);
          curl.position.set(wx, wy, wz);
          bodyGroup.add(curl);
        });
      } else {
        // 강민혁: 깔끔하게 올린 스파이키 숏헤어
        const spikeOffsets = [
          [-0.18, 1.18, 0.14, 0.25],
          [0, 1.23, 0.12, 0],
          [0.18, 1.18, 0.14, -0.25],
          [-0.28, 1.08, 0.22, 0.35],
          [0.28, 1.08, 0.22, -0.35],
        ];
        spikeOffsets.forEach(([sx, sy, sz, rz]) => {
          const spike = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.24, 8), hairMat);
          spike.position.set(sx, sy, sz);
          spike.rotation.z = rz;
          spike.rotation.x = 0.2;
          bodyGroup.add(spike);
        });
      }

      // 반짝이는 눈 + 흰 하이라이트 + 발그레 볼 + BOICE♡ 포인트
      const eyeMat = new THREE.MeshBasicMaterial({ color: 0x0f172a });
      const glintMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
      [-0.15, 0.15].forEach((ex) => {
        const eye = new THREE.Mesh(new THREE.SphereGeometry(0.058, 10, 10), eyeMat);
        eye.position.set(ex, 0.73, 0.42);
        const glint = new THREE.Mesh(new THREE.SphereGeometry(0.02, 8, 8), glintMat);
        glint.position.set(ex - 0.018, 0.75, 0.468);
        bodyGroup.add(eye, glint);
      });

      const blushMat = new THREE.MeshBasicMaterial({ color: 0xfda4af });
      const blushL = new THREE.Mesh(new THREE.CircleGeometry(0.065, 12), blushMat);
      blushL.position.set(-0.26, 0.65, 0.39);
      blushL.rotation.y = -0.32;
      const blushR = new THREE.Mesh(new THREE.CircleGeometry(0.065, 12), blushMat);
      blushR.position.set(0.26, 0.65, 0.39);
      blushR.rotation.y = 0.32;
      bodyGroup.add(blushL, blushR);

      // 양팔 피벗
      const armGeo = new THREE.CylinderGeometry(0.11, 0.11, 0.52, 10);
      const leftArmPivot = new THREE.Group();
      leftArmPivot.position.set(-0.48, 0.26, 0);
      const leftArm = new THREE.Mesh(armGeo, jacketMat);
      leftArm.position.set(0, -0.2, 0.12);
      leftArmPivot.add(leftArm);

      const rightArmPivot = new THREE.Group();
      rightArmPivot.position.set(0.48, 0.26, 0);
      const rightArm = new THREE.Mesh(armGeo, jacketMat);
      rightArm.position.set(0, -0.2, 0.12);
      rightArmPivot.add(rightArm);

      bodyGroup.add(leftArmPivot, rightArmPivot);
      charGroup.add(bodyGroup);

      // ====================================================================
      // 포지션별 3D 악기 풀세트 조립
      // ====================================================================
      if (member.id === 'minhyuk') {
        // [1] 드러머 강민혁: 드럼 의자 착석 + 풀 3D 드럼 키트 + 드럼스틱
        charGroup.position.set(0, -0.14, -0.38);
        leftLeg.rotation.x = -0.85;
        rightLeg.rotation.x = -0.85;
        leftArmPivot.rotation.x = -0.95;
        leftArmPivot.rotation.z = -0.25;
        rightArmPivot.rotation.x = -0.95;
        rightArmPivot.rotation.z = 0.25;

        const stickMat = new THREE.MeshStandardMaterial({ color: 0xfef3c7, roughness: 0.4 });
        const stickL = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.014, 0.46, 8), stickMat);
        stickL.position.set(0.05, -0.42, 0.26);
        stickL.rotation.x = Math.PI * 0.42;
        leftArmPivot.add(stickL);

        const stickR = stickL.clone();
        stickR.position.x = -0.05;
        rightArmPivot.add(stickR);

        const drumKit = new THREE.Group();
        drumKit.position.set(0, 0, 0.58);

        const chromeMat = new THREE.MeshStandardMaterial({
          color: 0xe2e8f0,
          metalness: 0.85,
          roughness: 0.2,
        });
        const drumShellMat = new THREE.MeshStandardMaterial({
          color: 0x1d4ed8,
          metalness: 0.45,
          roughness: 0.25,
        });
        const drumHeadMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.5 });
        const cymbalMat = new THREE.MeshStandardMaterial({
          color: 0xfacc15,
          metalness: 0.8,
          roughness: 0.22,
        });

        // 드럼 의자
        const throne = new THREE.Mesh(
          new THREE.CylinderGeometry(0.32, 0.32, 0.14, 16),
          new THREE.MeshStandardMaterial({ color: 0x0f172a })
        );
        throne.position.set(0, 0.54, -0.96);
        const throneLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 0.54, 10), chromeMat);
        throneLeg.position.set(0, 0.27, -0.96);
        drumKit.add(throne, throneLeg);

        // 메인 베이스 킥 드럼 (CNBLUE 블루 쉘 + 화이트 전면 헤드)
        const kickDrum = new THREE.Mesh(
          new THREE.CylinderGeometry(0.68, 0.68, 0.72, 24),
          drumShellMat
        );
        kickDrum.rotation.x = Math.PI / 2;
        kickDrum.position.set(0, 0.68, 0.12);

        const kickFrontHead = new THREE.Mesh(new THREE.CircleGeometry(0.64, 24), drumHeadMat);
        kickFrontHead.position.set(0, 0.68, 0.49);
        const kickLogoRing = new THREE.Mesh(
          new THREE.TorusGeometry(0.28, 0.03, 8, 24),
          new THREE.MeshBasicMaterial({ color: 0x2563eb })
        );
        kickLogoRing.position.set(0, 0.68, 0.5);
        drumKit.add(kickDrum, kickFrontHead, kickLogoRing);

        // 스네어 드럼 + 스탠드
        const snare = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.2, 18), drumHeadMat);
        snare.position.set(-0.38, 0.92, -0.36);
        const snareStand = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.04, 0.85, 8), chromeMat);
        snareStand.position.set(-0.38, 0.42, -0.36);
        drumKit.add(snare, snareStand);

        // 상단 2연 탐탐 (Rack Toms)
        [-0.24, 0.24].forEach((tx, idx) => {
          const tom = new THREE.Mesh(
            new THREE.CylinderGeometry(0.23 - idx * 0.02, 0.23 - idx * 0.02, 0.24, 16),
            drumShellMat
          );
          tom.position.set(tx, 1.38, 0.02);
          tom.rotation.x = -0.28;
          const tomTop = new THREE.Mesh(
            new THREE.CircleGeometry(0.22 - idx * 0.02, 16),
            drumHeadMat
          );
          tomTop.position.set(tx, 1.49, -0.02);
          tomTop.rotation.x = -Math.PI / 2 - 0.28;
          drumKit.add(tom, tomTop);
        });

        // 플로어 탐 (Floor Tom)
        const floorTom = new THREE.Mesh(
          new THREE.CylinderGeometry(0.34, 0.34, 0.48, 18),
          drumShellMat
        );
        floorTom.position.set(0.56, 0.78, -0.28);
        const floorTomHead = new THREE.Mesh(new THREE.CircleGeometry(0.33, 18), drumHeadMat);
        floorTomHead.rotation.x = -Math.PI / 2;
        floorTomHead.position.set(0.56, 1.03, -0.28);
        drumKit.add(floorTom, floorTomHead);

        // 하이햇 + 크래시/라이드 심벌 3종
        const cymbals = [
          { x: -0.76, y: 1.24, z: -0.25, r: 0.3 },
          { x: -0.66, y: 1.72, z: 0.16, r: 0.38 },
          { x: 0.74, y: 1.66, z: 0.12, r: 0.42 },
        ];
        cymbals.forEach((c) => {
          const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.03, c.y, 8), chromeMat);
          stand.position.set(c.x, c.y / 2, c.z);
          const disc = new THREE.Mesh(new THREE.CylinderGeometry(c.r, c.r, 0.02, 20), cymbalMat);
          disc.position.set(c.x, c.y, c.z);
          disc.rotation.z = c.x < 0 ? -0.14 : 0.14;
          drumKit.add(stand, disc);
        });

        root.add(drumKit);
      } else {
        // [2] 정용화(일렉기타) & [3] 이정신(베이스) 악기 + 스탠드 마이크
        const isBass = member.id === 'jungshin';
        const instrumentGroup = new THREE.Group();
        instrumentGroup.position.set(0.04, -0.16, 0.45);
        instrumentGroup.rotation.z = isBass ? 0.36 : 0.32;
        instrumentGroup.rotation.y = -0.12;

        // 기타/베이스 바디 (정용화: 레드 일렉기타 / 이정신: 딥네이비 베이스)
        const guitarBody = new THREE.Mesh(
          new THREE.BoxGeometry(isBass ? 0.56 : 0.52, isBass ? 0.74 : 0.66, 0.11),
          new THREE.MeshStandardMaterial({
            color: isBass ? 0x1e3a8a : 0xdc2626,
            emissive: isBass ? 0x000000 : 0x450a0a,
            emissiveIntensity: isBass ? 0 : 0.35,
            metalness: 0.38,
            roughness: 0.22,
          })
        );
        const pickguard = new THREE.Mesh(
          new THREE.BoxGeometry(0.32, 0.42, 0.125),
          new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 })
        );
        pickguard.position.set(0.05, -0.04, 0);
        instrumentGroup.add(guitarBody, pickguard);

        // 넥 & 지판 (베이스는 넥이 더 길게 제작)
        const neckLen = isBass ? 1.18 : 0.92;
        const neck = new THREE.Mesh(
          new THREE.BoxGeometry(0.11, neckLen, 0.07),
          new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.5 })
        );
        neck.position.set(0, 0.3 + neckLen / 2, 0.01);
        instrumentGroup.add(neck);

        // 헤드스톡 (정용화 기타 레드 매칭)
        const headstock = new THREE.Mesh(
          new THREE.BoxGeometry(0.17, 0.24, 0.07),
          new THREE.MeshStandardMaterial({ color: isBass ? 0x1e3a8a : 0xdc2626, roughness: 0.28 })
        );
        headstock.position.set(-0.02, 0.3 + neckLen + 0.1, 0.01);
        instrumentGroup.add(headstock);

        // 어깨 스트랩
        const strap = new THREE.Mesh(
          new THREE.TorusGeometry(0.46, 0.032, 6, 20),
          new THREE.MeshStandardMaterial({ color: 0x0f172a })
        );
        strap.position.set(-0.08, 0.18, -0.34);
        strap.rotation.y = Math.PI / 2;
        strap.rotation.x = 0.42;
        instrumentGroup.add(strap);

        bodyGroup.add(instrumentGroup);

        // 기타/베이스 연주 팔 포즈
        leftArmPivot.rotation.x = -1.15;
        leftArmPivot.rotation.z = -0.45;
        rightArmPivot.rotation.x = -0.95;
        rightArmPivot.rotation.z = 0.32;

        // 앞쪽 스탠드 보컬 마이크
        const micGroup = new THREE.Group();
        micGroup.position.set(0, 0, 0.86);
        const micBase = new THREE.Mesh(
          new THREE.CylinderGeometry(0.24, 0.26, 0.05, 16),
          new THREE.MeshStandardMaterial({ color: 0x1e293b })
        );
        micBase.position.y = 0.025;
        const micPole = new THREE.Mesh(
          new THREE.CylinderGeometry(0.022, 0.026, 1.48, 8),
          new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.85, roughness: 0.2 })
        );
        micPole.position.y = 0.74;
        const micHead = new THREE.Mesh(
          new THREE.SphereGeometry(0.075, 12, 12),
          new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.7, roughness: 0.3 })
        );
        micHead.position.set(0, 1.5, -0.05);
        micGroup.add(micBase, micPole, micHead);
        root.add(micGroup);
      }

      root.add(charGroup);

      // 멤버 이름 & 포지션 배지 스프라이트
      const tagTex = createNameTagTexture(THREE, member.name, member.roleLabel, true);
      const tagSprite = new THREE.Sprite(
        new THREE.SpriteMaterial({ map: tagTex, transparent: true, depthTest: false })
      );
      tagSprite.position.set(0, 2.75, 0);
      tagSprite.scale.set(2.9, 1.08, 1);
      root.add(tagSprite);

      root.traverse((child: any) => {
        child.userData = {
          ...child.userData,
          bandMemberQuote: member.quote,
        };
      });

      root.userData = {
        charGroup,
        bodyGroup,
        leftArmPivot,
        rightArmPivot,
        spotRing,
      };
      return root;
    },
    []
  );

  // ============================================================================
  // 9. 메인 Three.js 3D 씬 초기화 (외부 러닝트랙 광장 + KSPO DOME 내부 좌석배치도)
  // ============================================================================
  useEffect(() => {
    if (!threeReady || !mountRef.current) return;
    const THREE = window.THREE;
    if (!THREE) return;

    const container = mountRef.current;
    let animationFrameId = 0;
    let isDisposed = false;

    try {
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0xbae6fd);
      const fog = new THREE.FogExp2(0xbae6fd, 0.0085);
      scene.fog = fog;

      const width = container.clientWidth || window.innerWidth;
      const height = container.clientHeight || window.innerHeight;
      const camera = new THREE.PerspectiveCamera(46, width / height, 0.1, 260);
      camera.position.set(0, 14, 28);

      const renderer = new THREE.WebGLRenderer({
        antialias: true,
        powerPreference: 'high-performance',
      });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      if (THREE.ACESFilmicToneMapping) {
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 0.96;
      }
      container.innerHTML = '';
      container.appendChild(renderer.domElement);

      // 조명 세팅 (실내와 동일한 선명한 색감과 입체 음영 유지)
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.68);
      scene.add(ambientLight);

      const dirLight = new THREE.DirectionalLight(0xffffff, 0.82);
      dirLight.position.set(22, 38, 24);
      scene.add(dirLight);

      // ======================================================================
      // WORLD A: KSPO DOME 외부 러닝 트랙 광장
      // ======================================================================
      const plazaWorldGroup = new THREE.Group();
      plazaWorldGroup.visible = viewModeRef.current === 'plaza';
      scene.add(plazaWorldGroup);

      const groundTex = createPlazaGroundTexture(THREE);
      const ground = new THREE.Mesh(
        new THREE.CircleGeometry(PLAZA_GROUND_RADIUS, 64),
        new THREE.MeshStandardMaterial({ map: groundTex, roughness: 0.85 })
      );
      ground.rotation.x = -Math.PI / 2;
      ground.name = 'plaza_ground';
      plazaWorldGroup.add(ground);

      // START / KEEP RUNNIN' 메인 러닝 아치 게이트 (트랙 남쪽 스타트라인 위)
      const startArchGroup = new THREE.Group();
      startArchGroup.position.set(0, 0, TRACK_CENTER_Z + LANE_RADII[2]);
      const archPillarL = new THREE.Mesh(
        new THREE.CylinderGeometry(0.28, 0.34, 4.6, 12),
        new THREE.MeshStandardMaterial({ color: 0x2563eb, roughness: 0.35 })
      );
      archPillarL.position.set(-4.8, 2.3, 0);
      const archPillarR = archPillarL.clone();
      archPillarR.position.x = 4.8;
      const initRoom = ROOM_LIST[currentRoomIdRef.current - 1] || ROOM_LIST[0];
      const archBannerTex = createMarqueeTexture(
        THREE,
        `LANE ${initRoom.id} · ${initRoom.name.split('·')[1]?.trim() || initRoom.name}`,
        initRoom.desc,
        initRoom.accentHex
      );
      const archTop = new THREE.Mesh(
        new THREE.BoxGeometry(10.6, 1.55, 0.55),
        new THREE.MeshBasicMaterial({ map: archBannerTex })
      );
      archTop.position.set(0, 4.6, 0);
      startArchGroup.add(archPillarL, archPillarR, archTop);
      plazaWorldGroup.add(startArchGroup);

      // 1~5레인 전용 위치 표지판 (각 레인의 스폰 각도 옆에 세워서 시각적 구분)
      ROOM_LIST.forEach((rm, idx) => {
        const markerPos = getLanePosition(idx, rm.spawnAngle);
        const signGroup = new THREE.Group();
        const outDirX = Math.cos(rm.spawnAngle);
        const outDirZ = Math.sin(rm.spawnAngle);
        signGroup.position.set(markerPos.x + outDirX * 1.4, 0, markerPos.z + outDirZ * 1.4);

        const pole = new THREE.Mesh(
          new THREE.CylinderGeometry(0.06, 0.06, 2.2, 8),
          new THREE.MeshStandardMaterial({ color: 0x1e293b })
        );
        pole.position.y = 1.1;
        const board = new THREE.Sprite(
          new THREE.SpriteMaterial({
            map: createSeatLabelTexture(THREE, `${rm.id}레인`, rm.accentHex),
            transparent: true,
            depthTest: false,
          })
        );
        board.position.y = 2.45;
        board.scale.set(1.8, 0.85, 1);
        signGroup.add(pole, board);
        plazaWorldGroup.add(signGroup);
      });

      // KSPO DOME 랜드마크 건축물 (북쪽 z = -23.5에 배치하여 1레인 북쪽 트랙과 완벽 분리)
      const domeGroup = new THREE.Group();
      domeGroup.position.set(0, 0, -23.5);

      const baseStep1 = new THREE.Mesh(
        new THREE.CylinderGeometry(16.5, 17.5, 1.2, 48),
        new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.7 })
      );
      baseStep1.position.y = 0.6;
      domeGroup.add(baseStep1);

      const wallMesh = new THREE.Mesh(
        new THREE.CylinderGeometry(15.2, 15.6, 5.2, 48),
        new THREE.MeshStandardMaterial({
          color: 0x0f172a,
          emissive: 0x172554,
          emissiveIntensity: 0.25,
          roughness: 0.45,
          metalness: 0.35,
        })
      );
      wallMesh.position.y = 3.8;
      domeGroup.add(wallMesh);

      // KSPO DOME 외벽 15칸 CNBLUE 앨범 스파인 갤러리
      // 정문 왼쪽(-18°) 바로 옆 1번 Bluetory부터 시계방향으로 외벽을 한 바퀴 돌아 정문 오른쪽(+18°) 바로 옆 15번 달리기로 마무리
      const degToRad = (deg: number) => (deg * Math.PI) / 180;
      const gateHalfDeg = 18; // 정문 게이트 영역 [-18°, +18°]
      const bayDeg = (360 - gateHalfDeg * 2) / 15; // 각 앨범 칸 = 21.6°
      const panelGapDeg = 0.7;

      const albumBayStartsDeg: number[] = DOME_ALBUM_SPINES.map(
        (_, idx) => -gateHalfDeg - (idx + 1) * bayDeg
      );

      const pillarGeo = new THREE.BoxGeometry(0.32, 5.5, 0.62);
      const pillarMat = new THREE.MeshStandardMaterial({
        color: 0xf8fafc,
        roughness: 0.32,
        metalness: 0.35,
      });

      DOME_ALBUM_SPINES.forEach((album, idx) => {
        const startDeg = albumBayStartsDeg[idx];
        const thetaStart = degToRad(startDeg + panelGapDeg / 2);
        const thetaLength = degToRad(bayDeg - panelGapDeg);
        const spineTex = createAlbumSpineTexture(THREE, album);

        const panelMesh = new THREE.Mesh(
          new THREE.CylinderGeometry(15.46, 15.86, 5.15, 14, 1, true, thetaStart, thetaLength),
          new THREE.MeshStandardMaterial({
            map: spineTex,
            roughness: 0.3,
            metalness: 0.12,
          })
        );
        panelMesh.position.y = 3.8;
        panelMesh.userData = {
          albumInfo: album,
        };
        domeGroup.add(panelMesh);

        // 각 앨범 스파인 경계선에 깔끔한 화이트 프레임 기둥 배치 (앨범 아트를 가리지 않음)
        const divRad = degToRad(startDeg);
        const pillar = new THREE.Mesh(pillarGeo, pillarMat);
        pillar.position.set(Math.sin(divRad) * 15.62, 3.8, Math.cos(divRad) * 15.62);
        pillar.rotation.y = divRad;
        domeGroup.add(pillar);
      });

      // 정문 좌측 경계(-18°) 마감 기둥 추가
      const leftGatePillarRad = degToRad(-18);
      const leftGatePillar = new THREE.Mesh(pillarGeo, pillarMat);
      leftGatePillar.position.set(
        Math.sin(leftGatePillarRad) * 15.62,
        3.8,
        Math.cos(leftGatePillarRad) * 15.62
      );
      leftGatePillar.rotation.y = leftGatePillarRad;
      domeGroup.add(leftGatePillar);

      const roofMesh = new THREE.Mesh(
        new THREE.SphereGeometry(15.4, 48, 24, 0, Math.PI * 2, 0, Math.PI * 0.44),
        new THREE.MeshStandardMaterial({
          color: 0xf1f5f9,
          roughness: 0.35,
          metalness: 0.25,
        })
      );
      roofMesh.scale.set(1, 0.56, 1);
      roofMesh.position.y = 5.4;
      domeGroup.add(roofMesh);

      const ledRing1 = new THREE.Mesh(
        new THREE.TorusGeometry(15.35, 0.18, 12, 64),
        new THREE.MeshStandardMaterial({
          color: 0x38bdf8,
          emissive: 0x38bdf8,
          emissiveIntensity: 1.2,
        })
      );
      ledRing1.rotation.x = Math.PI / 2;
      ledRing1.position.y = 6.45;
      domeGroup.add(ledRing1);

      const crownRing = new THREE.Mesh(
        new THREE.TorusGeometry(4.0, 0.25, 12, 48),
        new THREE.MeshStandardMaterial({
          color: 0x60a5fa,
          emissive: 0x3b82f6,
          emissiveIntensity: 1.1,
        })
      );
      crownRing.rotation.x = Math.PI / 2;
      crownRing.position.y = 13.8;
      domeGroup.add(crownRing);

      const marqueeTex = createMarqueeTexture(
        THREE,
        'EBDD 에바뛰콘 · KSPO DOME',
        "2027.02.20 - 02.21 · KEEP DREAMIN' KEEP RUNNIN'"
      );
      const marqueeBoard = new THREE.Mesh(
        new THREE.BoxGeometry(9.2, 2.5, 0.6),
        new THREE.MeshBasicMaterial({ map: marqueeTex })
      );
      marqueeBoard.position.set(0, 5.2, 15.65);
      marqueeBoard.name = 'enter_arena_gate';
      domeGroup.add(marqueeBoard);

      const gateFrame = new THREE.Mesh(
        new THREE.BoxGeometry(6.2, 3.6, 1.4),
        new THREE.MeshStandardMaterial({
          color: 0x1d4ed8,
          emissive: 0x2563eb,
          emissiveIntensity: 0.65,
          roughness: 0.3,
        })
      );
      gateFrame.position.set(0, 1.8, 15.3);
      gateFrame.name = 'enter_arena_gate';
      domeGroup.add(gateFrame);

      const gateTagTex = createNameTagTexture(
        THREE,
        '🏟️ 공연장 정문 입구',
        '정문 앞으로 걸어가면 자동 입장!',
        true
      );
      const gateSprite = new THREE.Sprite(
        new THREE.SpriteMaterial({ map: gateTagTex, transparent: true, depthTest: false })
      );
      gateSprite.position.set(0, 2.7, 16.6);
      gateSprite.scale.set(3.8, 1.4, 1);
      gateSprite.name = 'enter_arena_gate';
      domeGroup.add(gateSprite);

      plazaWorldGroup.add(domeGroup);

      // 트랙 중앙 정원 어드벤트 카운트다운 기념비
      const monumentGroup = new THREE.Group();
      monumentGroup.position.set(TRACK_CENTER_X, 0, TRACK_CENTER_Z);
      monumentGroup.name = 'advent_monument';

      const monBase = new THREE.Mesh(
        new THREE.CylinderGeometry(1.7, 2.0, 0.45, 24),
        new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.4 })
      );
      monBase.position.y = 0.22;
      monBase.name = 'advent_monument';
      monumentGroup.add(monBase);

      const crystalMesh = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.95, 0),
        new THREE.MeshStandardMaterial({
          color: 0x2563eb,
          emissive: 0x3b82f6,
          emissiveIntensity: 1.0,
          roughness: 0.15,
          metalness: 0.3,
        })
      );
      crystalMesh.scale.set(0.9, 1.25, 0.9);
      crystalMesh.position.y = 2.0;
      crystalMesh.name = 'advent_monument';
      monumentGroup.add(crystalMesh);

      const monTagTex = createNameTagTexture(
        THREE,
        '💎 데일리 어드벤트 출석 (~2027.02.20)',
        '클릭해서 오늘의 출석 도장 찍기!',
        true
      );
      const monSprite = new THREE.Sprite(
        new THREE.SpriteMaterial({ map: monTagTex, transparent: true, depthTest: false })
      );
      monSprite.position.set(0, 3.65, 0);
      monSprite.scale.set(3.6, 1.35, 1);
      monSprite.name = 'advent_monument';
      monumentGroup.add(monSprite);

      plazaWorldGroup.add(monumentGroup);

      // 주변 나무 & 벤치 (트랙 외곽 배치)
      const trunkMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.9 });
      const leafMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.8 });
      const treeCoords = [
        [-27, -6],
        [27, -6],
        [-31, 10],
        [31, 10],
        [-28, 28],
        [28, 28],
        [-16, 40],
        [16, 40],
      ];
      treeCoords.forEach(([tx, tz]) => {
        const tree = new THREE.Group();
        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.4, 2.2, 8), trunkMat);
        trunk.position.y = 1.1;
        const foliage1 = new THREE.Mesh(new THREE.ConeGeometry(1.8, 3.0, 10), leafMat);
        foliage1.position.y = 3.1;
        const foliage2 = new THREE.Mesh(new THREE.ConeGeometry(1.35, 2.4, 10), leafMat);
        foliage2.position.y = 4.5;
        tree.add(trunk, foliage1, foliage2);
        tree.position.set(tx, 0, tz);
        plazaWorldGroup.add(tree);
      });

      const benchMat = new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.7 });
      const benchPositions = [
        { x: -6.5, z: 7.5, rot: Math.PI / 3 },
        { x: 6.5, z: 7.5, rot: -Math.PI / 3 },
        { x: -6.5, z: 16.5, rot: Math.PI / 4 },
        { x: 6.5, z: 16.5, rot: -Math.PI / 4 },
      ];
      benchPositions.forEach((b) => {
        const bench = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.45, 0.9), benchMat);
        bench.position.set(b.x, 0.35, b.z);
        bench.rotation.y = b.rot;
        plazaWorldGroup.add(bench);
      });

      // ======================================================================
      // WORLD B: KSPO DOME 내부 3D 공연장 (올림픽체조경기장 VR 투어 스타일 실감 구현)
      // ======================================================================
      const arenaWorldGroup = new THREE.Group();
      arenaWorldGroup.visible = viewModeRef.current === 'arena';
      scene.add(arenaWorldGroup);

      // 1) 아레나 전체 바닥 & 외벽
      const arenaFloor = new THREE.Mesh(
        new THREE.CircleGeometry(32, 64),
        new THREE.MeshStandardMaterial({ color: 0x0b1220, roughness: 0.85 })
      );
      arenaFloor.rotation.x = -Math.PI / 2;
      arenaFloor.name = 'arena_floor';
      arenaWorldGroup.add(arenaFloor);

      const arenaWall = new THREE.Mesh(
        new THREE.CylinderGeometry(28.5, 28.5, 19.5, 64, 1, true),
        new THREE.MeshStandardMaterial({
          color: 0x09111e,
          side: THREE.BackSide,
          roughness: 0.88,
        })
      );
      arenaWall.position.y = 9.75;
      arenaWorldGroup.add(arenaWall);

      // 2) 체조경기장 특유의 웅장한 케이블 돔 천장 트러스 & 리깅 & 스포트라이트 빔
      const domeRoofGroup = new THREE.Group();
      domeRoofGroup.position.set(0, 0, -1.5);

      const ceilingShell = new THREE.Mesh(
        new THREE.SphereGeometry(28.5, 48, 20, 0, Math.PI * 2, 0, Math.PI * 0.38),
        new THREE.MeshStandardMaterial({
          color: 0x0f172a,
          side: THREE.BackSide,
          roughness: 0.7,
        })
      );
      ceilingShell.scale.set(1, 0.42, 1);
      ceilingShell.position.y = 14.0;
      domeRoofGroup.add(ceilingShell);

      // 방사형 강철 돔 트러스 늑골 24개
      const ribMat = new THREE.MeshStandardMaterial({
        color: 0x334155,
        metalness: 0.75,
        roughness: 0.35,
      });
      for (let i = 0; i < 24; i++) {
        const ang = (i / 24) * Math.PI * 2;
        const rib = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.22, 26), ribMat);
        rib.position.set(Math.cos(ang) * 14, 18.2, Math.sin(ang) * 14);
        rib.rotation.y = -ang + Math.PI / 2;
        rib.rotation.x = 0.22;
        domeRoofGroup.add(rib);
      }
      arenaWorldGroup.add(domeRoofGroup);

      // 3) 계단형 메인 STAGE + 좌우 사이드 중계 전광판 + 밴드 악기 풀세트
      const stageMat = new THREE.MeshStandardMaterial({
        color: 0x111827,
        roughness: 0.4,
        metalness: 0.25,
      });
      const stageEdgeGlowMat = new THREE.MeshStandardMaterial({
        color: 0x38bdf8,
        emissive: 0x2563eb,
        emissiveIntensity: 1.5,
      });

      // 메인 무대 3단 계단형 데크 (실제 좌석배치도 상단 계단형 STAGE 형태 반영)
      const stageMainFront = new THREE.Mesh(new THREE.BoxGeometry(22.0, 1.45, 5.2), stageMat);
      stageMainFront.position.set(0, 0.725, -11.4);
      const stageMainMid = new THREE.Mesh(new THREE.BoxGeometry(17.8, 1.45, 2.2), stageMat);
      stageMainMid.position.set(0, 0.725, -14.8);
      const stageMainBack = new THREE.Mesh(new THREE.BoxGeometry(13.6, 1.45, 2.0), stageMat);
      stageMainBack.position.set(0, 0.725, -16.6);
      arenaWorldGroup.add(stageMainFront, stageMainMid, stageMainBack);

      // 메인 무대 전면 LED 라인
      const stageFrontLed = new THREE.Mesh(new THREE.BoxGeometry(22.1, 0.14, 0.16), stageEdgeGlowMat);
      stageFrontLed.position.set(0, 1.42, -8.8);
      arenaWorldGroup.add(stageFrontLed);

      // 밴드 2단 리프트 라이저
      const bandRiser = new THREE.Mesh(new THREE.BoxGeometry(13.5, 0.65, 3.2), stageMat);
      bandRiser.position.set(0, 1.77, -14.0);
      arenaWorldGroup.add(bandRiser);

      // 초대형 메인 LED 전광판 (가로 17.6 x 높이 6.8)
      const arenaLedTex = createMarqueeTexture(
        THREE,
        'CNBLUE · EBDD 에바뛰콘',
        "KEEP DREAMIN' KEEP RUNNIN' · KSPO DOME LIVE"
      );
      const stageLed = new THREE.Mesh(
        new THREE.BoxGeometry(17.6, 6.8, 0.5),
        new THREE.MeshBasicMaterial({ map: arenaLedTex })
      );
      stageLed.position.set(0, 5.4, -17.4);
      arenaWorldGroup.add(stageLed);

      // 좌·우 대형 사이드 중계 LED 스크린 (각도 기울여서 객석 전체에서 잘 보이도록 배치)
      const sideScreenTex = createMarqueeTexture(
        THREE,
        'CNBLUE LIVE 2027',
        '그러나, 꽃이었다 · RUNNING'
      );
      const leftSideScreen = new THREE.Mesh(
        new THREE.BoxGeometry(4.8, 6.2, 0.4),
        new THREE.MeshBasicMaterial({ map: sideScreenTex })
      );
      leftSideScreen.position.set(-11.4, 5.2, -14.6);
      leftSideScreen.rotation.y = 0.34;
      const rightSideScreen = leftSideScreen.clone();
      rightSideScreen.position.x = 11.4;
      rightSideScreen.rotation.y = -0.34;
      arenaWorldGroup.add(leftSideScreen, rightSideScreen);

      // 밴드 앰프 스택 (좌우 무대 위 배치)
      const ampMat = new THREE.MeshStandardMaterial({ color: 0x1f2937, roughness: 0.6 });
      const ampL = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.8, 0.9), ampMat);
      ampL.position.set(-6.8, 2.95, -14.2);
      const ampR = ampL.clone();
      ampR.position.x = 6.8;
      arenaWorldGroup.add(ampL, ampR);

      // 4) 실제 공연장 구조: 반원 닻(⚓) 모양 돌출 무대 (중앙 직선 통로 + 남쪽 하단 반원 아크)
      const stageH = 1.38;
      const anchorCenterZ = -5.0;
      const outerR = 9.0;
      const innerR = 7.0;

      // 4-1. 닻의 중앙 기둥(직선 돌출 통로): 메인 무대 전면(z = -8.8) -> 반원 최하단(z = +3.1) 연결
      const catwalkLen = 12.0;
      const catwalkCenterZ = -2.85;
      const centerCatwalk = new THREE.Mesh(new THREE.BoxGeometry(2.4, stageH, catwalkLen), stageMat);
      centerCatwalk.position.set(0, stageH / 2, catwalkCenterZ);
      arenaWorldGroup.add(centerCatwalk);

      const bridgeLedL = new THREE.Mesh(
        new THREE.BoxGeometry(0.12, 0.12, catwalkLen - 0.8),
        stageEdgeGlowMat
      );
      bridgeLedL.position.set(-1.22, stageH + 0.01, catwalkCenterZ - 0.3);
      const bridgeLedR = bridgeLedL.clone();
      bridgeLedR.position.x = 1.22;
      arenaWorldGroup.add(bridgeLedL, bridgeLedR);

      // 4-2. 닻의 하단 반원 아크 (열린 U자형 남쪽 180° 반원: 서쪽 -> 남쪽 -> 동쪽)
      const anchorArcGroup = new THREE.Group();
      anchorArcGroup.position.set(0, 0, anchorCenterZ);

      // 반원 상판 (thetaStart = Math.PI, thetaLength = Math.PI -> rotation.x = -PI/2 시 남쪽(+Z) 반원)
      const arcTopMesh = new THREE.Mesh(
        new THREE.RingGeometry(innerR, outerR, 56, 1, Math.PI, Math.PI),
        new THREE.MeshStandardMaterial({
          color: 0x182234,
          side: THREE.DoubleSide,
          roughness: 0.38,
          metalness: 0.25,
        })
      );
      arcTopMesh.rotation.x = -Math.PI / 2;
      arcTopMesh.position.y = stageH;
      anchorArcGroup.add(arcTopMesh);

      // 반원 입체 외벽 & 내벽 (thetaStart = -PI/2, thetaLength = PI -> 서 -> 남(+Z) -> 동)
      const outerArcWall = new THREE.Mesh(
        new THREE.CylinderGeometry(outerR, outerR, stageH, 56, 1, true, -Math.PI / 2, Math.PI),
        new THREE.MeshStandardMaterial({ color: 0x0f172a, side: THREE.DoubleSide, roughness: 0.5 })
      );
      outerArcWall.position.y = stageH / 2;
      const innerArcWall = new THREE.Mesh(
        new THREE.CylinderGeometry(innerR, innerR, stageH, 56, 1, true, -Math.PI / 2, Math.PI),
        new THREE.MeshStandardMaterial({ color: 0x0f172a, side: THREE.DoubleSide, roughness: 0.5 })
      );
      innerArcWall.position.y = stageH / 2;
      anchorArcGroup.add(outerArcWall, innerArcWall);

      // 반원 서쪽·동쪽 양 끝단 마감 벽 & 네온 LED 엣지
      const tipWidth = outerR - innerR;
      const tipMidR = (outerR + innerR) / 2;
      [-tipMidR, tipMidR].forEach((tx) => {
        const capWall = new THREE.Mesh(new THREE.BoxGeometry(tipWidth, stageH, 0.14), stageMat);
        capWall.position.set(tx, stageH / 2, 0);
        const capLed = new THREE.Mesh(
          new THREE.BoxGeometry(tipWidth + 0.1, 0.12, 0.14),
          stageEdgeGlowMat
        );
        capLed.position.set(tx, stageH + 0.02, 0);
        anchorArcGroup.add(capWall, capLed);
      });

      // 반원 외경·내경 파란 네온 LED 아크 (rotation.x = +PI/2 시 남쪽(+Z) 180° 반원)
      const outerLedArc = new THREE.Mesh(
        new THREE.TorusGeometry(outerR, 0.11, 10, 56, Math.PI),
        stageEdgeGlowMat
      );
      outerLedArc.rotation.x = Math.PI / 2;
      outerLedArc.position.y = stageH + 0.02;

      const innerLedArc = new THREE.Mesh(
        new THREE.TorusGeometry(innerR, 0.1, 10, 56, Math.PI),
        stageEdgeGlowMat
      );
      innerLedArc.rotation.x = Math.PI / 2;
      innerLedArc.position.y = stageH + 0.02;
      anchorArcGroup.add(outerLedArc, innerLedArc);

      arenaWorldGroup.add(anchorArcGroup);

      // ======================================================================
      // 씨엔블루 3인 멤버 무대 배치 (좌측 드러머 · 중앙 반원 닻 최전방 프론트맨 · 우측 베이스)
      // ======================================================================
      const memberMinhyuk = buildBandMemberMesh(THREE, {
        id: 'minhyuk',
        name: '🥁 강민혁',
        roleLabel: 'DRUM · 드러머',
        quote: '🥁 강민혁: 심장 터지는 드럼 비트로 끝까지 함께 달려요!!',
      });
      memberMinhyuk.position.set(-4.3, 1.45, -11.4);
      arenaWorldGroup.add(memberMinhyuk);

      // 정용화 (FRONTMAN · 기타 & 보컬) -> 반원 닻 돌출무대 정중앙 최전방 교차점에 배치!
      const memberYonghwa = buildBandMemberMesh(THREE, {
        id: 'yonghwa',
        name: '🎸 정용화',
        roleLabel: 'FRONTMAN · 기타 & 보컬',
        quote: '🎸 정용화: 보이스 소리 질러!! 돌출무대까지 다 같이 에바뛰!!',
      });
      memberYonghwa.position.set(0, 1.38, 3.0);
      arenaWorldGroup.add(memberYonghwa);

      const memberJungshin = buildBandMemberMesh(THREE, {
        id: 'jungshin',
        name: '🎸 이정신',
        roleLabel: 'BASS · 베이스',
        quote: '🎸 이정신: 묵직한 베이스 그루브로 체조경기장 흔들어볼게요 💙',
      });
      memberJungshin.position.set(4.3, 1.45, -11.2);
      arenaWorldGroup.add(memberJungshin);

      // 5) CONSOLE 부스 (F·G구역 뒤쪽 중앙)
      const consoleBox = new THREE.Mesh(
        new THREE.BoxGeometry(6.0, 1.4, 2.0),
        new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.55 })
      );
      consoleBox.position.set(0, 0.7, 10.2);
      arenaWorldGroup.add(consoleBox);

      const consoleTag = new THREE.Sprite(
        new THREE.SpriteMaterial({
          map: createSeatLabelTexture(THREE, 'CONSOLE', '#334155'),
          transparent: true,
          depthTest: false,
        })
      );
      consoleTag.position.set(0, 2.3, 10.2);
      consoleTag.scale.set(2.5, 1.0, 1);
      arenaWorldGroup.add(consoleTag);

      // 6) VR 투어 스타일 입체 계단식 좌석 구역 & 개별 의자 열 & 투명 유리 난간 배치
      const railGlassMat = new THREE.MeshStandardMaterial({
        color: 0x7dd3fc,
        transparent: true,
        opacity: 0.28,
        roughness: 0.15,
      });

      ARENA_SECTIONS.forEach((sec) => {
        const secGroup = new THREE.Group();
        secGroup.position.set(sec.x, 0, sec.z);
        secGroup.rotation.y = sec.rotY;

        if (sec.tier === 'FLOOR') {
          // FLOOR 의탠딩 구역: A(에)·B(바)는 반원 닻 안쪽 4분원 부채꼴 형태로 정확히 제작!
          const isCenterAB = sec.id === 'FLOOR-A' || sec.id === 'FLOOR-B';
          let floorPlate: any;

          if (isCenterAB) {
            const pocketR = 6.25;
            const centerSy = 5.0; // world z = -5.0 -> 2D shape sy = +5.0
            const topSy = 4.6; // world z = -4.6 -> 상단 수평 직선
            const innerX = 1.65; // 중앙 돌출 통로(x = ±1.2)와의 여유 간격
            const topX = Math.sqrt(pocketR * pocketR - (topSy - centerSy) * (topSy - centerSy));
            const botSy = centerSy - Math.sqrt(pocketR * pocketR - innerX * innerX);

            const shape = new THREE.Shape();
            if (sec.id === 'FLOOR-A') {
              const aStart = Math.atan2(topSy - centerSy, -topX);
              const aEnd = Math.atan2(botSy - centerSy, -innerX);
              shape.moveTo(-innerX, topSy);
              shape.lineTo(-topX, topSy);
              shape.absarc(0, centerSy, pocketR, aStart, aEnd, false);
              shape.lineTo(-innerX, topSy);
            } else {
              const bStart = Math.atan2(botSy - centerSy, innerX);
              const bEnd = Math.atan2(topSy - centerSy, topX);
              shape.moveTo(innerX, topSy);
              shape.lineTo(innerX, botSy);
              shape.absarc(0, centerSy, pocketR, bStart, bEnd, false);
              shape.lineTo(innerX, topSy);
            }

            const extrudeGeo = new THREE.ExtrudeGeometry(shape, {
              depth: 0.24,
              bevelEnabled: false,
            });
            floorPlate = new THREE.Mesh(
              extrudeGeo,
              new THREE.MeshStandardMaterial({
                color: sec.color,
                roughness: 0.55,
              })
            );
            floorPlate.rotation.x = -Math.PI / 2;
            floorPlate.position.set(-sec.x, 0, -sec.z);
          } else {
            floorPlate = new THREE.Mesh(
              new THREE.BoxGeometry(sec.width, 0.24, sec.depth),
              new THREE.MeshStandardMaterial({
                color: sec.color,
                roughness: 0.55,
              })
            );
            floorPlate.position.y = 0.12;
          }

          floorPlate.userData = { seatZone: sec.label, seatSection: sec };
          secGroup.add(floorPlate);
        } else {
          // 1F S석 & 2F A석: 체조경기장처럼 계단식 스탠드(Tiered Bleachers) + 의자 열 + 유리 난간!
          const steps = sec.tier === '1F' ? 6 : 8;
          const baseBottomY = sec.tier === '1F' ? 0.6 : 4.2;
          const topY = sec.y;
          const stepH = (topY - baseBottomY) / steps;
          const stepD = sec.depth / steps;

          // 하단 받침 구조물
          const underStruct = new THREE.Mesh(
            new THREE.BoxGeometry(sec.width, baseBottomY, sec.depth),
            new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.8 })
          );
          underStruct.position.y = baseBottomY / 2;
          underStruct.userData = { seatZone: sec.label, seatSection: sec };
          secGroup.add(underStruct);

          // 계단 단차 + 좌석 의자 행
          const stepMat = new THREE.MeshStandardMaterial({
            color: sec.color,
            roughness: 0.5,
          });
          const seatChairMat = new THREE.MeshStandardMaterial({
            color: sec.tier === '1F' ? 0x0284c7 : 0x1d4ed8,
            roughness: 0.4,
          });

          for (let s = 0; s < steps; s++) {
            const curH = baseBottomY + (s + 1) * stepH;
            const localZ = -sec.depth / 2 + stepD * (s + 0.5);
            const tread = new THREE.Mesh(
              new THREE.BoxGeometry(sec.width - 0.12, curH - baseBottomY, stepD * 0.96),
              stepMat
            );
            tread.position.set(0, baseBottomY + (curH - baseBottomY) / 2, localZ);
            tread.userData = { seatZone: sec.label, seatSection: sec };
            secGroup.add(tread);

            // 개별 좌석 등받이 열 디테일
            const chairRow = new THREE.Mesh(
              new THREE.BoxGeometry(sec.width - 0.35, 0.24, 0.16),
              seatChairMat
            );
            chairRow.position.set(0, curH + 0.12, localZ + stepD * 0.22);
            chairRow.userData = { seatZone: sec.label, seatSection: sec };
            secGroup.add(chairRow);
          }

          // 구역 앞쪽 투명 안전 유리 난간
          const frontRail = new THREE.Mesh(
            new THREE.BoxGeometry(sec.width, 0.55, 0.08),
            railGlassMat
          );
          frontRail.position.set(0, baseBottomY + stepH + 0.28, -sec.depth / 2 + 0.05);
          secGroup.add(frontRail);
        }

        const shortText = sec.id.replace('FLOOR-', '').replace('1F-', '').replace('2F-', '');
        const badgeBg =
          sec.badge === '에'
            ? '#0284c7'
            : sec.badge === '바'
            ? '#0d9488'
            : sec.badge === '뛰'
            ? '#7c3aed'
            : sec.tier === '1F'
            ? '#0ea5e9'
            : '#0c4a6e';
        const labelSprite = new THREE.Sprite(
          new THREE.SpriteMaterial({
            map: createSeatLabelTexture(
              THREE,
              sec.badge ? `${sec.badge} ${shortText}` : shortText,
              badgeBg
            ),
            transparent: true,
            depthTest: false,
          })
        );
        labelSprite.position.set(0, sec.y + 0.75, 0);
        labelSprite.scale.set(1.55, 0.75, 1);
        labelSprite.userData = { seatZone: sec.label, seatSection: sec };
        secGroup.add(labelSprite);

        arenaWorldGroup.add(secGroup);
      });

      // 내 캐릭터 & 클릭 목표 링
      const initProfile = myProfileRef.current;
      const myGroup = buildFanAvatarMesh(THREE, {
        name: initProfile.name,
        hoodieColor: initProfile.hoodieColor,
        lightstickColor: initProfile.lightstickColor,
        hairStyle: initProfile.hairStyle,
        outfitStyle: initProfile.outfitStyle,
        capStyle: initProfile.capStyle,
        hasSloganTowel: initProfile.hasSloganTowel,
        hasWristband: initProfile.hasWristband,
        leftHandItem: initProfile.leftHandItem,
        rightHandItem: initProfile.rightHandItem,
        isMe: true,
      });
      myGroup.position.set(myPosRef.current.x, myPosRef.current.y, myPosRef.current.z);
      scene.add(myGroup);

      const targetRing = new THREE.Mesh(
        new THREE.RingGeometry(0.45, 0.7, 28),
        new THREE.MeshBasicMaterial({
          color: 0x38bdf8,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.85,
        })
      );
      targetRing.rotation.x = -Math.PI / 2;
      targetRing.position.set(myPosRef.current.x, 0.04, myPosRef.current.z);
      targetRing.visible = false;
      scene.add(targetRing);

      const flowerMeshes = new Map<string, any>();
      const peerGroups = new Map<string, any>();
      const particles: Array<{
        mesh: any;
        vy: number;
        vx?: number;
        vz?: number;
        life: number;
        isDust?: boolean;
      }> = [];

      sceneObjectsRef.current = {
        scene,
        camera,
        renderer,
        plazaWorldGroup,
        arenaWorldGroup,
        fog,
        ambientLight,
        dirLight,
        myGroup,
        myNameSprite: myGroup.userData.nameSprite,
        myLightstickMat: myGroup.userData.lightstickMat,
        myHoodieMat: myGroup.userData.hoodieMat,
        targetRing,
        archBannerMesh: archTop,
        flowerMeshes,
        peerGroups,
        adventMonument: crystalMesh,
        bandMembers: {
          minhyuk: memberMinhyuk,
          yonghwa: memberYonghwa,
          jungshin: memberJungshin,
        },
        particles,
      };

      // ======================================================================
      // 카메라 컨트롤 & 포인터/터치/키보드 인터랙션
      // ======================================================================
      let camYaw = 0;
      let camPitch = 0.44;
      let camDistance = 17.5;

      let isDragging = false;
      let pointerDownX = 0;
      let pointerDownY = 0;
      let lastPointerX = 0;
      let lastPointerY = 0;
      let pinchStartDist = 0;

      const raycaster = new THREE.Raycaster();
      const pointerNDC = new THREE.Vector2();
      const pressedKeys = new Set<string>();
      const domElem = renderer.domElement;

      const handlePointerDown = (e: PointerEvent) => {
        isDragging = true;
        pointerDownX = e.clientX;
        pointerDownY = e.clientY;
        lastPointerX = e.clientX;
        lastPointerY = e.clientY;
      };

      const handlePointerMove = (e: PointerEvent) => {
        if (!isDragging) return;
        const dx = e.clientX - lastPointerX;
        const dy = e.clientY - lastPointerY;
        lastPointerX = e.clientX;
        lastPointerY = e.clientY;
        camYaw -= dx * 0.0065;
        camPitch = Math.max(0.18, Math.min(1.15, camPitch + dy * 0.0055));
      };

      const handlePointerUp = (e: PointerEvent) => {
        if (!isDragging) return;
        isDragging = false;
        const moved = Math.hypot(e.clientX - pointerDownX, e.clientY - pointerDownY);

        if (moved < 8) {
          const rect = domElem.getBoundingClientRect();
          pointerNDC.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
          pointerNDC.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

          raycaster.setFromCamera(pointerNDC, camera);
          const hits = raycaster.intersectObjects(scene.children, true);

          for (const hit of hits) {
            let objCursor = hit.object;
            let hidden = false;
            while (objCursor) {
              if (objCursor.visible === false) {
                hidden = true;
                break;
              }
              objCursor = objCursor.parent;
            }
            if (hidden) continue;

            if (hit.object.name === 'enter_arena_gate') {
              switchViewMode('arena');
              return;
            }
            if (hit.object.name === 'advent_monument') {
              setActiveModal('advent');
              return;
            }
            if (hit.object.userData?.bandMemberQuote) {
              spawnFloatingParticles('#38bdf8');
              showToast(hit.object.userData.bandMemberQuote);
              return;
            }
            if (hit.object.userData?.albumInfo) {
              const alb: DomeAlbumSpineInfo = hit.object.userData.albumInfo;
              showToast(
                alb.comingSoon
                  ? `💿 [${alb.slot}/15] 다음 5종 앨범이 채워질 예정인 KSPO DOME 외벽 슬롯입니다!`
                  : `💿 [${alb.slot}/15] ${alb.title} — ${alb.subtitle}`
              );
              return;
            }
            if (hit.object.userData?.seatSection) {
              const sec: SeatSectionInfo = hit.object.userData.seatSection;
              isTrackRunningRef.current = false;
              myPosRef.current.targetX = sec.x;
              myPosRef.current.targetY = sec.y;
              myPosRef.current.targetZ = sec.z;
              myPosRef.current.x = sec.x;
              myPosRef.current.y = sec.y;
              myPosRef.current.z = sec.z;
              myPosRef.current.rotationY = Math.atan2(-sec.x, -4.5 - sec.z);
              setMyProfile((prev) => ({ ...prev, seatZone: sec.label }));
              showToast(`💺 [${sec.label}] 구역으로 자리를 옮겼습니다!`);
              return;
            }
            if (hit.object.userData?.memoId) {
              const found = memosRef.current.find((m) => m.id === hit.object.userData.memoId);
              if (found) {
                setSelectedMemo(found);
                setActiveModal('memos');
                return;
              }
            }
            if (hit.object.userData?.peerId) {
              const foundPeer = peersRef.current.find((p) => p.id === hit.object.userData.peerId);
              if (foundPeer) {
                setSelectedPeer(foundPeer);
                return;
              }
            }
            if (hit.object.name === 'plaza_ground') {
              let tx = hit.point.x;
              let tz = hit.point.z;

              // 정문 입구 통로(|x| < 4.2, z: -4.5 ~ -12.5)는 걸어서 들어갈 수 있도록 허용
              const isWalkingToFrontGate = Math.abs(tx) < 4.2 && tz < -4.5 && tz > -12.5;
              if (isWalkingToFrontGate) {
                tz = Math.max(-7.8, tz);
              } else {
                // 북쪽 KSPO DOME 외벽 충돌 방지
                const distToDome = Math.hypot(tx, tz - -23.5);
                if (distToDome < 18.2) {
                  const angle = Math.atan2(tz - -23.5, tx);
                  tx = Math.cos(angle) * 18.4;
                  tz = -23.5 + Math.sin(angle) * 18.4;
                }
              }

              isTrackRunningRef.current = false;
              myPosRef.current.targetX = tx;
              myPosRef.current.targetY = 0;
              myPosRef.current.targetZ = tz;
              myActionRef.current = 'walk';
              setMyAction('walk');

              targetRing.position.set(tx, 0.04, tz);
              targetRing.visible = true;
              return;
            }
          }
        }
      };

      const handleWheel = (e: WheelEvent) => {
        e.preventDefault();
        camDistance = Math.max(8, Math.min(38, camDistance + e.deltaY * 0.015));
      };

      const handleTouchStart = (e: TouchEvent) => {
        if (e.touches.length === 2) {
          pinchStartDist = Math.hypot(
            e.touches[0].clientX - e.touches[1].clientX,
            e.touches[0].clientY - e.touches[1].clientY
          );
        }
      };

      const handleTouchMove = (e: TouchEvent) => {
        if (e.touches.length === 2) {
          const dist = Math.hypot(
            e.touches[0].clientX - e.touches[1].clientX,
            e.touches[0].clientY - e.touches[1].clientY
          );
          const delta = pinchStartDist - dist;
          pinchStartDist = dist;
          camDistance = Math.max(8, Math.min(38, camDistance + delta * 0.04));
        }
      };

      const handleKeyDown = (e: KeyboardEvent) => {
        const tag = (e.target as HTMLElement)?.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
        pressedKeys.add(e.key.toLowerCase());
      };

      const handleKeyUp = (e: KeyboardEvent) => {
        pressedKeys.delete(e.key.toLowerCase());
      };

      const handleResize = () => {
        const w = container.clientWidth || window.innerWidth;
        const h = container.clientHeight || window.innerHeight;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      };

      domElem.addEventListener('pointerdown', handlePointerDown);
      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', handlePointerUp);
      domElem.addEventListener('wheel', handleWheel, { passive: false });
      domElem.addEventListener('touchstart', handleTouchStart, { passive: true });
      domElem.addEventListener('touchmove', handleTouchMove, { passive: true });
      window.addEventListener('keydown', handleKeyDown);
      window.addEventListener('keyup', handleKeyUp);
      window.addEventListener('resize', handleResize);

      // ======================================================================
      // 메인 애니메이션 루프 (60fps)
      // ======================================================================
      const clock = new THREE.Clock();
      let dustCooldown = 0;

      const spawnDustCloud = (x: number, y: number, z: number) => {
        const puff = new THREE.Mesh(
          new THREE.SphereGeometry(0.18 + Math.random() * 0.08, 8, 8),
          new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.85,
          })
        );
        puff.position.set(
          x + (Math.random() - 0.5) * 0.35,
          y + 0.16,
          z + (Math.random() - 0.5) * 0.35
        );
        scene.add(puff);
        particles.push({
          mesh: puff,
          vy: 0.45 + Math.random() * 0.35,
          vx: (Math.random() - 0.5) * 0.5,
          vz: (Math.random() - 0.5) * 0.5,
          life: 0.55,
          isDust: true,
        });
      };

      const animate = () => {
        if (isDisposed) return;
        animationFrameId = requestAnimationFrame(animate);
        const dt = Math.min(clock.getDelta(), 0.05);
        const elapsed = clock.getElapsedTime();
        dustCooldown -= dt;

        // 1. 키보드 이동 시 트랙 자동 주행 해제 & 자유 이동
        let keyDx = 0;
        let keyDz = 0;
        if (pressedKeys.has('w') || pressedKeys.has('arrowup')) keyDz -= 1;
        if (pressedKeys.has('s') || pressedKeys.has('arrowdown')) keyDz += 1;
        if (pressedKeys.has('a') || pressedKeys.has('arrowleft')) keyDx -= 1;
        if (pressedKeys.has('d') || pressedKeys.has('arrowright')) keyDx += 1;

        if ((keyDx !== 0 || keyDz !== 0) && viewModeRef.current === 'plaza') {
          isTrackRunningRef.current = false;
          const sinY = Math.sin(camYaw);
          const cosY = Math.cos(camYaw);
          const moveX = keyDx * cosY + keyDz * sinY;
          const moveZ = -keyDx * sinY + keyDz * cosY;
          const len = Math.hypot(moveX, moveZ) || 1;
          myPosRef.current.targetX = myPosRef.current.x + (moveX / len) * 1.8;
          myPosRef.current.targetZ = myPosRef.current.z + (moveZ / len) * 1.8;
          targetRing.visible = false;
        }

        // 2. 원형 러닝 트랙 전용 주행 모드 vs 자유 이동 모드
        if (isTrackRunningRef.current && viewModeRef.current === 'plaza') {
          const activeLaneIdx = Math.max(
            0,
            Math.min(LANE_RADII.length - 1, currentRoomIdRef.current - 1)
          );
          const laneR = LANE_RADII[activeLaneIdx];
          const linearSpeed = 8.4; // 초당 8.4m 일정 속도로 트랙 질주
          const angularSpeed = linearSpeed / laneR;

          // 반시계방향(육상 트랙 정방향)으로 원형 궤도 각도 진행
          trackAngleRef.current -= angularSpeed * dt;
          const nextPt = getLanePosition(activeLaneIdx, trackAngleRef.current);

          const stepDx = nextPt.x - myPosRef.current.x;
          const stepDz = nextPt.z - myPosRef.current.z;
          const stepDist = Math.hypot(stepDx, stepDz);

          if (stepDist > 0.25) {
            // 트랙 바깥에 있었다면 먼저 해당 레인 진입점으로 부드럽게 합류
            const joinSpeed = 9.5;
            myPosRef.current.x += (stepDx / stepDist) * Math.min(stepDist, joinSpeed * dt);
            myPosRef.current.z += (stepDz / stepDist) * Math.min(stepDist, joinSpeed * dt);
            myPosRef.current.rotationY = Math.atan2(stepDx, stepDz);
          } else {
            myPosRef.current.x = nextPt.x;
            myPosRef.current.z = nextPt.z;
            // 원의 접선 방향(반시계방향 진행 벡터: (sin(theta), -cos(theta)))을 정확히 바라봄
            const tangentX = Math.sin(trackAngleRef.current);
            const tangentZ = -Math.cos(trackAngleRef.current);
            myPosRef.current.rotationY = Math.atan2(tangentX, tangentZ);
          }

          myPosRef.current.targetX = myPosRef.current.x;
          myPosRef.current.targetZ = myPosRef.current.z;
          targetRing.visible = false;

          if (myActionRef.current !== 'run') {
            myActionRef.current = 'run';
            setMyAction('run');
          }
          if (dustCooldown <= 0) {
            spawnDustCloud(myPosRef.current.x, 0, myPosRef.current.z);
            dustCooldown = 0.1;
          }
        } else {
          // 자유 클릭/키보드 이동 보간
          const dx = myPosRef.current.targetX - myPosRef.current.x;
          const dz = myPosRef.current.targetZ - myPosRef.current.z;
          const dist = Math.hypot(dx, dz);

          if (dist > 0.14) {
            const speed = 6.5;
            myPosRef.current.x += (dx / dist) * Math.min(dist, speed * dt);
            myPosRef.current.z += (dz / dist) * Math.min(dist, speed * dt);
            myPosRef.current.rotationY = Math.atan2(dx, dz);
            if (myActionRef.current !== 'walk') {
              myActionRef.current = 'walk';
              setMyAction('walk');
            }
          } else if (myActionRef.current === 'walk' || myActionRef.current === 'run') {
            myActionRef.current = viewModeRef.current === 'arena' ? 'wave' : 'idle';
            setMyAction(myActionRef.current);
            targetRing.visible = false;
          }
        }

        myPosRef.current.y += (myPosRef.current.targetY - myPosRef.current.y) * 0.18;

        const animateAvatar = (group: any, action: AvatarAction, phase: number): number => {
          const ud = group.userData;
          if (!ud) return 0;
          let wholeBodyJumpY = 0;
          const holdingSlogan = Boolean(ud.isHoldingSlogan);

          if (action === 'run') {
            ud.leftLeg.rotation.x = Math.sin(elapsed * 16 + phase) * 0.85;
            ud.rightLeg.rotation.x = -Math.sin(elapsed * 16 + phase) * 0.85;
            ud.bodyGroup.position.y = 0.88 + Math.abs(Math.sin(elapsed * 16 + phase)) * 0.08;
            ud.bodyGroup.rotation.x = 0.18;
            if (holdingSlogan) {
              if (ud.leftArmPivot) {
                ud.leftArmPivot.rotation.x = -0.92 + Math.sin(elapsed * 16 + phase) * 0.08;
                ud.leftArmPivot.rotation.z = -0.12;
              }
              ud.rightArmPivot.rotation.x = -0.92 + Math.sin(elapsed * 16 + phase) * 0.08;
              ud.rightArmPivot.rotation.z = 0.12;
              if (ud.heldSloganGroup) {
                ud.heldSloganGroup.position.set(0, 0.1 + Math.abs(Math.sin(elapsed * 16 + phase)) * 0.04, 0.56);
                ud.heldSloganGroup.rotation.set(-0.08, 0, Math.sin(elapsed * 16 + phase) * 0.07);
              }
            } else {
              if (ud.leftArmPivot) {
                ud.leftArmPivot.rotation.x = -Math.sin(elapsed * 16 + phase) * 0.75;
              }
              ud.rightArmPivot.rotation.x = -0.8 + Math.sin(elapsed * 16 + phase) * 0.65;
              ud.rightArmPivot.rotation.z = 0;
            }
          } else if (action === 'walk') {
            ud.leftLeg.rotation.x = Math.sin(elapsed * 11 + phase) * 0.55;
            ud.rightLeg.rotation.x = -Math.sin(elapsed * 11 + phase) * 0.55;
            ud.bodyGroup.position.y = 0.88 + Math.abs(Math.sin(elapsed * 11 + phase)) * 0.05;
            if (holdingSlogan) {
              if (ud.leftArmPivot) {
                ud.leftArmPivot.rotation.x = -0.88 + Math.sin(elapsed * 11 + phase) * 0.05;
                ud.leftArmPivot.rotation.z = -0.12;
              }
              ud.rightArmPivot.rotation.x = -0.88 + Math.sin(elapsed * 11 + phase) * 0.05;
              ud.rightArmPivot.rotation.z = 0.12;
              if (ud.heldSloganGroup) {
                ud.heldSloganGroup.position.set(0, 0.09, 0.54);
                ud.heldSloganGroup.rotation.set(0, 0, Math.sin(elapsed * 11 + phase) * 0.05);
              }
            } else {
              if (ud.leftArmPivot) {
                ud.leftArmPivot.rotation.x = -Math.sin(elapsed * 11 + phase) * 0.4;
              }
              ud.rightArmPivot.rotation.x = -0.3 + Math.sin(elapsed * 11 + phase) * 0.35;
              ud.rightArmPivot.rotation.z = 0;
            }
            ud.bodyGroup.rotation.x = 0.06;
          } else if (action === 'cheer') {
            // 에바뛰! 상반신과 하반신이 분리되지 않고 온몸이 통째로 점프!
            wholeBodyJumpY = Math.abs(Math.sin(elapsed * 8.5 + phase)) * 0.72;
            ud.bodyGroup.position.y = 0.88;
            ud.bodyGroup.rotation.x = -0.05;
            ud.leftLeg.rotation.x = Math.sin(elapsed * 8.5 + phase) * 0.35;
            ud.rightLeg.rotation.x = -Math.sin(elapsed * 8.5 + phase) * 0.35;
            if (holdingSlogan) {
              if (ud.leftArmPivot) {
                ud.leftArmPivot.rotation.x = -2.35 + Math.sin(elapsed * 8.5 + phase) * 0.18;
                ud.leftArmPivot.rotation.z = -0.14;
              }
              ud.rightArmPivot.rotation.x = -2.35 + Math.sin(elapsed * 8.5 + phase) * 0.18;
              ud.rightArmPivot.rotation.z = 0.14;
              if (ud.heldSloganGroup) {
                ud.heldSloganGroup.position.set(0, 1.3 + Math.sin(elapsed * 8.5 + phase) * 0.06, 0.24);
                ud.heldSloganGroup.rotation.set(-0.1, 0, Math.sin(elapsed * 8.5 + phase) * 0.09);
              }
            } else {
              if (ud.leftArmPivot) {
                ud.leftArmPivot.rotation.x = -2.2 + Math.cos(elapsed * 8.5 + phase) * 0.25;
              }
              ud.rightArmPivot.rotation.x = -2.65 + Math.sin(elapsed * 8.5 + phase) * 0.25;
              ud.rightArmPivot.rotation.z = -0.22;
            }
          } else if (action === 'wave') {
            ud.leftLeg.rotation.x = 0;
            ud.rightLeg.rotation.x = 0;
            ud.bodyGroup.position.y = 0.88 + Math.sin(elapsed * 4 + phase) * 0.03;
            ud.bodyGroup.rotation.x = 0;
            ud.bodyGroup.rotation.z = 0;
            if (holdingSlogan) {
              // 양손으로 CNBLUE 슬로건을 머리 위로 높이 들어 흔들기!
              if (ud.leftArmPivot) {
                ud.leftArmPivot.rotation.x = -2.28 + Math.sin(elapsed * 9 + phase) * 0.22;
                ud.leftArmPivot.rotation.z = -0.14 + Math.cos(elapsed * 9 + phase) * 0.08;
              }
              ud.rightArmPivot.rotation.x = -2.28 + Math.sin(elapsed * 9 + phase) * 0.22;
              ud.rightArmPivot.rotation.z = 0.14 + Math.cos(elapsed * 9 + phase) * 0.08;
              if (ud.heldSloganGroup) {
                ud.heldSloganGroup.position.set(0, 1.26 + Math.sin(elapsed * 9 + phase) * 0.07, 0.28);
                ud.heldSloganGroup.rotation.set(-0.1, 0, Math.cos(elapsed * 9 + phase) * 0.12);
              }
            } else {
              if (ud.leftArmPivot) {
                if (ud.leftHandItem && ud.leftHandItem !== 'none') {
                  ud.leftArmPivot.rotation.x = -2.25 + Math.cos(elapsed * 12 + phase) * 0.4;
                  ud.leftArmPivot.rotation.z = 0.25 + Math.sin(elapsed * 12 + phase) * 0.25;
                } else {
                  ud.leftArmPivot.rotation.x = 0;
                  ud.leftArmPivot.rotation.z = 0;
                }
              }
              ud.rightArmPivot.rotation.x = -2.35 + Math.sin(elapsed * 12 + phase) * 0.45;
              ud.rightArmPivot.rotation.z = -0.3 + Math.cos(elapsed * 12 + phase) * 0.3;
            }
          } else if (action === 'greet') {
            // 반갑게 손 흔들기 인사 (슬로건 착용 시 양손으로 슬로건을 앞세워 반갑게 흔듦)
            ud.leftLeg.rotation.x = 0;
            ud.rightLeg.rotation.x = 0;
            ud.bodyGroup.position.y = 0.88 + Math.abs(Math.sin(elapsed * 6 + phase)) * 0.04;
            ud.bodyGroup.rotation.x = 0;
            ud.bodyGroup.rotation.z = Math.sin(elapsed * 6 + phase) * 0.06;
            if (holdingSlogan) {
              if (ud.leftArmPivot) {
                ud.leftArmPivot.rotation.x = -1.05;
                ud.leftArmPivot.rotation.z = -0.12;
              }
              ud.rightArmPivot.rotation.x = -1.05;
              ud.rightArmPivot.rotation.z = 0.12;
              if (ud.heldSloganGroup) {
                ud.heldSloganGroup.position.set(0, 0.18, 0.56);
                ud.heldSloganGroup.rotation.set(0, 0, Math.sin(elapsed * 8 + phase) * 0.16);
              }
            } else {
              if (ud.leftArmPivot) {
                ud.leftArmPivot.rotation.x = -2.5;
                ud.leftArmPivot.rotation.z = 0.45 + Math.sin(elapsed * 12 + phase) * 0.48;
              }
              ud.rightArmPivot.rotation.x = -0.45;
              ud.rightArmPivot.rotation.z = -0.15 + Math.cos(elapsed * 6 + phase) * 0.1;
            }
          } else if (action === 'sit') {
            ud.bodyGroup.position.y = 0.58;
            ud.leftLeg.rotation.x = -1.2;
            ud.rightLeg.rotation.x = -1.2;
            ud.bodyGroup.rotation.x = 0;
            ud.bodyGroup.rotation.z = 0;
            if (holdingSlogan) {
              if (ud.leftArmPivot) {
                ud.leftArmPivot.rotation.x = -0.82;
                ud.leftArmPivot.rotation.z = -0.12;
              }
              ud.rightArmPivot.rotation.x = -0.82;
              ud.rightArmPivot.rotation.z = 0.12;
              if (ud.heldSloganGroup) {
                ud.heldSloganGroup.position.set(0, 0.08, 0.54);
                ud.heldSloganGroup.rotation.set(0, 0, Math.sin(elapsed * 2.5) * 0.04);
              }
            } else {
              if (ud.leftArmPivot) {
                ud.leftArmPivot.rotation.x = 0;
                ud.leftArmPivot.rotation.z = 0;
              }
              ud.rightArmPivot.rotation.x = -0.4 + Math.sin(elapsed * 3) * 0.15;
              ud.rightArmPivot.rotation.z = 0;
            }
          } else {
            ud.leftLeg.rotation.x = 0;
            ud.rightLeg.rotation.x = 0;
            ud.bodyGroup.position.y = 0.88 + Math.sin(elapsed * 2.5 + phase) * 0.025;
            ud.bodyGroup.rotation.x = 0;
            ud.bodyGroup.rotation.z = 0;
            if (holdingSlogan) {
              if (ud.leftArmPivot) {
                ud.leftArmPivot.rotation.x = -0.88 + Math.sin(elapsed * 2.5 + phase) * 0.04;
                ud.leftArmPivot.rotation.z = -0.12;
              }
              ud.rightArmPivot.rotation.x = -0.88 + Math.sin(elapsed * 2.5 + phase) * 0.04;
              ud.rightArmPivot.rotation.z = 0.12;
              if (ud.heldSloganGroup) {
                ud.heldSloganGroup.position.set(0, 0.08, 0.54);
                ud.heldSloganGroup.rotation.set(0, 0, Math.sin(elapsed * 2.5 + phase) * 0.03);
              }
            } else {
              if (ud.leftArmPivot) {
                ud.leftArmPivot.rotation.x =
                  ud.leftHandItem && ud.leftHandItem !== 'none'
                    ? -0.25 + Math.cos(elapsed * 2.5 + phase) * 0.08
                    : 0;
                ud.leftArmPivot.rotation.z = 0;
              }
              ud.rightArmPivot.rotation.x = -0.25 + Math.sin(elapsed * 2.5 + phase) * 0.08;
              ud.rightArmPivot.rotation.z = 0;
            }
          }
          if (ud.rightStickHead) ud.rightStickHead.rotation.y += dt * 3.0;
          if (ud.leftStickHead) ud.leftStickHead.rotation.y += dt * 3.0;
          if (ud.ponytailPivot) {
            const swaySpeed = action === 'run' ? 16 : action === 'walk' ? 11 : 3.2;
            const swayAmp = action === 'run' ? 0.34 : action === 'walk' ? 0.18 : 0.06;
            ud.ponytailPivot.rotation.z = Math.sin(elapsed * swaySpeed + phase) * swayAmp;
            ud.ponytailPivot.rotation.x =
              action === 'run' ? 0.25 + Math.abs(Math.sin(elapsed * 16 + phase)) * 0.14 : 0.05;
          }
          return wholeBodyJumpY;
        };

        const myJumpY = animateAvatar(myGroup, myActionRef.current, 0);
        myGroup.position.set(myPosRef.current.x, myPosRef.current.y + myJumpY, myPosRef.current.z);
        myGroup.rotation.y = myPosRef.current.rotationY;

        // 공연장 정문 입구 영역에 도달하면 클릭 없이 자동으로 공연장 내부 입장!
        if (
          viewModeRef.current === 'plaza' &&
          Math.abs(myPosRef.current.x) < 3.8 &&
          myPosRef.current.z < -6.2 &&
          myPosRef.current.z > -11.5
        ) {
          targetRing.visible = false;
          switchViewMode('arena');
        }

        if (targetRing.visible) {
          const s = 1 + Math.sin(elapsed * 6) * 0.15;
          targetRing.scale.set(s, s, 1);
        }

        // 3. 다른 팬(최대 30명) 3D 아바타 동기화 (트랙 러너 NPC는 실제로 트랙 원형을 따라 달림)
        const activePeers = peersRef.current;
        const activeIds = new Set(activePeers.map((p) => p.id));

        peerGroups.forEach((grp, id) => {
          if (!activeIds.has(id)) {
            scene.remove(grp);
            peerGroups.delete(id);
          }
        });

        activePeers.forEach((peer, idx) => {
          let grp = peerGroups.get(peer.id);
          if (!grp) {
            grp = buildFanAvatarMesh(THREE, {
              name: peer.name,
              hoodieColor: peer.hoodieColor,
              lightstickColor: peer.lightstickColor,
              hairStyle: peer.hairStyle,
              outfitStyle: peer.outfitStyle,
              capStyle: peer.capStyle,
              hasSloganTowel: peer.hasSloganTowel,
              hasWristband: peer.hasWristband,
              leftHandItem: peer.leftHandItem,
              rightHandItem: peer.rightHandItem,
              speech: peer.speech,
              isMe: false,
            });
            grp.position.set(peer.x, 0, peer.z);
            grp.userData.simAngle = peer.trackAngle ?? 0;
            grp.traverse((child: any) => {
              child.userData = { ...child.userData, peerId: peer.id };
            });
            scene.add(grp);
            peerGroups.set(peer.id, grp);
          }

          const curSpeech =
            peer.speech && (!peer.speechUntil || peer.speechUntil > Date.now())
              ? peer.speech
              : '';
          if (grp.userData.lastSpeech !== curSpeech) {
            grp.userData.lastSpeech = curSpeech;
            const newTex = createNameTagTexture(THREE, peer.name, curSpeech, false);
            if (grp.userData.nameSprite.material.map) {
              grp.userData.nameSprite.material.map.dispose();
            }
            grp.userData.nameSprite.material.map = newTex;
            grp.userData.nameSprite.material.needsUpdate = true;
          }

          if (viewModeRef.current === 'arena') {
            const seatSec = getSeatSectionByLabel(peer.seatZone);
            const offsetX = ((idx % 3) - 1) * 0.68;
            const offsetZ = Math.floor(idx / 3) % 2 === 0 ? -0.45 : 0.45;
            const pJumpY = animateAvatar(grp, 'wave', idx * 0.7);
            grp.position.set(seatSec.x + offsetX, seatSec.y + pJumpY, seatSec.z + offsetZ);
            grp.rotation.y = Math.atan2(-(seatSec.x + offsetX), -4.5 - (seatSec.z + offsetZ));
          } else if (peer.isNpc && peer.laneRadius) {
            // NPC 트랙 러너는 원형 트랙 레인을 따라 반시계방향 주행
            const npcSpeed = 6.2 + (idx % 3) * 0.7;
            grp.userData.simAngle -= (npcSpeed / peer.laneRadius) * dt;
            const ang = grp.userData.simAngle;
            const pJumpY = animateAvatar(grp, 'run', idx * 0.9);
            grp.position.set(
              TRACK_CENTER_X + Math.cos(ang) * peer.laneRadius,
              pJumpY,
              TRACK_CENTER_Z + Math.sin(ang) * peer.laneRadius
            );
            grp.rotation.y = Math.atan2(Math.sin(ang), -Math.cos(ang));
          } else {
            const pdx = peer.targetX - grp.position.x;
            const pdz = peer.targetZ - grp.position.z;
            const pdist = Math.hypot(pdx, pdz);
            let visualAction: AvatarAction = peer.action;

            if (pdist > 0.15) {
              const pSpeed = 3.6;
              grp.position.x += (pdx / pdist) * Math.min(pdist, pSpeed * dt);
              grp.position.z += (pdz / pdist) * Math.min(pdist, pSpeed * dt);
              grp.rotation.y = Math.atan2(pdx, pdz);
              visualAction = 'walk';
            } else if (visualAction === 'walk' || visualAction === 'run') {
              visualAction = 'idle';
            }

            const pJumpY = animateAvatar(grp, visualAction, idx * 1.1);
            grp.position.y = pJumpY;
          }
        });

        // 3-2. 씨엔블루 3인 멤버 라이브 연주 애니메이션 (드럼 · 일렉기타 · 베이스)
        if (memberMinhyuk?.userData) {
          const ud = memberMinhyuk.userData;
          ud.leftArmPivot.rotation.x = -0.95 + Math.sin(elapsed * 14) * 0.35;
          ud.rightArmPivot.rotation.x = -0.95 - Math.sin(elapsed * 14) * 0.35;
          ud.bodyGroup.position.y = 0.92 + Math.abs(Math.sin(elapsed * 7)) * 0.04;
        }
        if (memberYonghwa?.userData) {
          const ud = memberYonghwa.userData;
          ud.rightArmPivot.rotation.x = -0.95 + Math.sin(elapsed * 13) * 0.28;
          ud.charGroup.position.y = Math.abs(Math.sin(elapsed * 6.5)) * 0.1;
          ud.charGroup.rotation.y = Math.sin(elapsed * 2.2) * 0.16;
        }
        if (memberJungshin?.userData) {
          const ud = memberJungshin.userData;
          ud.rightArmPivot.rotation.x = -0.95 + Math.cos(elapsed * 11) * 0.22;
          ud.charGroup.position.y = Math.abs(Math.cos(elapsed * 5.8)) * 0.07;
          ud.charGroup.rotation.z = Math.sin(elapsed * 3.0) * 0.05;
        }

        // 4. 「그러나, 꽃이었다」 응원 꽃밭 3D 오브젝트 동기화
        const currentMemos = memosRef.current;
        const memoIds = new Set(currentMemos.map((m) => m.id));
        flowerMeshes.forEach((mesh, id) => {
          if (!memoIds.has(id)) {
            plazaWorldGroup.remove(mesh);
            flowerMeshes.delete(id);
          }
        });

        currentMemos.forEach((memo, idx) => {
          let fGroup = flowerMeshes.get(memo.id);
          if (!fGroup) {
            fGroup = buildBloomFlowerMesh(THREE, memo);
            plazaWorldGroup.add(fGroup);
            flowerMeshes.set(memo.id, fGroup);
          }
          // 바람에 살랑이는 꽃대 모션
          if (fGroup.userData?.swayGroup) {
            fGroup.userData.swayGroup.rotation.z = Math.sin(elapsed * 2.0 + idx) * 0.08;
            fGroup.userData.swayGroup.rotation.x = Math.cos(elapsed * 1.7 + idx) * 0.06;
          }
        });

        // 5. 중앙 어드벤트 기념비 회전
        crystalMesh.rotation.y = elapsed * 0.9;
        crystalMesh.position.y = 2.0 + Math.sin(elapsed * 2.4) * 0.14;

        // 6. 파티클 업데이트
        for (let i = particles.length - 1; i >= 0; i--) {
          const pt = particles[i];
          pt.mesh.position.y += pt.vy * dt;
          if (pt.vx) pt.mesh.position.x += pt.vx * dt;
          if (pt.vz) pt.mesh.position.z += pt.vz * dt;
          if (pt.isDust) {
            pt.mesh.scale.multiplyScalar(1 + dt * 1.4);
          }
          pt.life -= dt;
          pt.mesh.material.opacity = Math.max(0, pt.life * 1.5);
          if (pt.life <= 0) {
            scene.remove(pt.mesh);
            particles.splice(i, 1);
          }
        }

        // 7. 카메라 부드러운 팔로우
        const activeDist =
          viewModeRef.current === 'arena' ? Math.max(camDistance, 22) : camDistance;
        const targetCamX = myPosRef.current.x + Math.sin(camYaw) * Math.cos(camPitch) * activeDist;
        const targetCamY =
          myPosRef.current.y + Math.max(2.6, Math.sin(camPitch) * activeDist);
        const targetCamZ = myPosRef.current.z + Math.cos(camYaw) * Math.cos(camPitch) * activeDist;

        camera.position.x += (targetCamX - camera.position.x) * 0.12;
        camera.position.y += (targetCamY - camera.position.y) * 0.12;
        camera.position.z += (targetCamZ - camera.position.z) * 0.12;

        if (viewModeRef.current === 'arena') {
          camera.lookAt(
            myPosRef.current.x * 0.35,
            myPosRef.current.y + 1.8,
            myPosRef.current.z * 0.35 - 5.5
          );
        } else {
          camera.lookAt(myPosRef.current.x, 1.4, myPosRef.current.z - 2.0);
        }

        renderer.render(scene, camera);
      };

      animate();

      return () => {
        isDisposed = true;
        cancelAnimationFrame(animationFrameId);
        domElem.removeEventListener('pointerdown', handlePointerDown);
        window.removeEventListener('pointermove', handlePointerMove);
        window.removeEventListener('pointerup', handlePointerUp);
        domElem.removeEventListener('wheel', handleWheel);
        domElem.removeEventListener('touchstart', handleTouchStart);
        domElem.removeEventListener('touchmove', handleTouchMove);
        window.removeEventListener('keydown', handleKeyDown);
        window.removeEventListener('keyup', handleKeyUp);
        window.removeEventListener('resize', handleResize);
        renderer.dispose();
      };
    } catch {
      showToast('3D 광장을 초기화하는 중 문제가 발생했습니다.');
    }
  }, [
    threeReady,
    buildFanAvatarMesh,
    buildBloomFlowerMesh,
    buildBandMemberMesh,
    spawnFloatingParticles,
    showToast,
    switchViewMode,
  ]);

  useEffect(() => {
    const THREE = window.THREE;
    const objs = sceneObjectsRef.current;
    if (!THREE || !objs.scene || !objs.fog || !objs.ambientLight || !objs.dirLight) return;

    if (viewMode === 'arena') {
      objs.scene.background = new THREE.Color(0x050914);
      objs.fog.color = new THREE.Color(0x050914);
      objs.ambientLight.intensity = 0.9;
      objs.dirLight.color = new THREE.Color(0x93c5fd);
      objs.dirLight.intensity = 1.1;
      return;
    }

    if (skyTheme === 'day') {
      objs.scene.background = new THREE.Color(0xbae6fd);
      objs.fog.color = new THREE.Color(0xbae6fd);
      objs.ambientLight.intensity = 0.68;
      objs.dirLight.color = new THREE.Color(0xffffff);
      objs.dirLight.intensity = 0.82;
    } else if (skyTheme === 'sunset') {
      objs.scene.background = new THREE.Color(0x312e81);
      objs.fog.color = new THREE.Color(0x312e81);
      objs.ambientLight.intensity = 0.65;
      objs.dirLight.color = new THREE.Color(0xfdba74);
      objs.dirLight.intensity = 0.88;
    } else {
      objs.scene.background = new THREE.Color(0x090d16);
      objs.fog.color = new THREE.Color(0x090d16);
      objs.ambientLight.intensity = 0.55;
      objs.dirLight.color = new THREE.Color(0x93c5fd);
      objs.dirLight.intensity = 0.8;
    }
  }, [skyTheme, viewMode]);

  // ============================================================================
  // 10. 비즈니스 핸들러 (꽃 피우기 메모, 어드벤트 출석, 100문 100답, 트랙 주행)
  // ============================================================================
  const handleAddMemo = (e: React.FormEvent) => {
    e.preventDefault();
    const text = newMemoText.trim();
    if (!text) return;

    const memoX =
      viewMode === 'plaza'
        ? myPosRef.current.x + (Math.random() - 0.5) * 1.2
        : TRACK_CENTER_X + (Math.random() - 0.5) * 14;
    const memoZ =
      viewMode === 'plaza'
        ? myPosRef.current.z + (Math.random() - 0.5) * 1.2
        : TRACK_CENTER_Z + (Math.random() - 0.5) * 14;

    const created: PlazaMemo = {
      id: `flower-${Date.now()}`,
      author: myProfile.name,
      seatZone: myProfile.seatZone,
      text,
      color: newMemoColor,
      x: memoX,
      z: memoZ,
      likes: 1,
      likedByMe: true,
      createdAt: '방금 전',
    };

    setMemos((prev) => [created, ...prev]);
    setNewMemoText('');
    setSelectedMemo(created);
    spawnFloatingParticles(newMemoColor);
    showToast('🌸 땅에 「그러나, 꽃이었다」 꽃이 활짝 피어났습니다!');

    if (user && db) {
      const memosPublicCol = collection(db, 'artifacts', appId, 'public', 'data', 'flower_memos');
      addDoc(memosPublicCol, {
        author: myProfile.name,
        seatZone: myProfile.seatZone,
        text,
        color: newMemoColor,
        x: memoX,
        z: memoZ,
        likes: 1,
        createdAt: Date.now(),
        createdAtLabel: '방금 전',
      }).catch((err) => console.error('Save flower memo error:', err));
    }

    if (bcRef.current) {
      bcRef.current.postMessage({
        type: 'new_memo',
        senderId: mySessionIdRef.current,
        memo: created,
      });
    }
  };

  const handleToggleMemoLike = (id: string) => {
    setMemos((prev) =>
      prev.map((m) =>
        m.id === id
          ? {
              ...m,
              likes: m.likedByMe ? m.likes - 1 : m.likes + 1,
              likedByMe: !m.likedByMe,
            }
          : m
      )
    );
    setSelectedMemo((prev) =>
      prev && prev.id === id
        ? {
            ...prev,
            likes: prev.likedByMe ? prev.likes - 1 : prev.likes + 1,
            likedByMe: !prev.likedByMe,
          }
        : prev
    );
  };

  const handleCheckInAdvent = (dateStr: string) => {
    const answerText = adventAnswerInput.trim();
    const hadPreviousAnswer = Boolean(adventAnswers[dateStr]?.trim());

    if (!answerText && !hadPreviousAnswer) {
      showToast('💬 오늘의 질문에 답변을 입력해야 출석 도장과 착용 MD 아이템이 해금됩니다!');
      return;
    }

    let nextAnswers = adventAnswers;
    let newlyAnswered = false;

    if (answerText) {
      nextAnswers = { ...adventAnswers, [dateStr]: answerText };
      newlyAnswered = !hadPreviousAnswer;
      setAdventAnswers(nextAnswers);
      setAdventAnswerInput('');

      // 익명 기록 목록에 즉시 반영 (오프라인/로컬 환경에서도 바로 노출)
      setPublicAdventAnswers((prev) => [
        {
          id: `local-${Date.now()}`,
          dateStr,
          text: answerText,
          createdAt: Date.now(),
        },
        ...prev.filter((item) => !(item.dateStr === dateStr && item.text === answerText)),
      ]);

      // 익명 공개 답변 컬렉션에 닉네임 없이 저장 (다른 보이스들에게 익명으로 표시)
      if (user && db) {
        const adventPublicCol = collection(
          db,
          'artifacts',
          appId,
          'public',
          'data',
          'advent_answers'
        );
        addDoc(adventPublicCol, {
          dateStr,
          text: answerText,
          createdAt: Date.now(),
        }).catch((err) => console.error('Save anonymous advent answer error:', err));
      }
    }

    const nextDates = checkedDates.includes(dateStr)
      ? checkedDates
      : [...checkedDates, dateStr].sort();
    if (!checkedDates.includes(dateStr)) {
      setCheckedDates(nextDates);
    }

    const newAnsweredCount = Object.values(nextAnswers).filter(
      (v) => v && v.trim().length > 0
    ).length;

    if (newlyAnswered) {
      const unlockedItem = ADVENT_UNLOCK_MILESTONES.find((m) => m.day === newAnsweredCount);
      spawnFloatingParticles('#facc15');

      // 1~3일차 핵심 착용 아이템 해금 시 빈 슬롯이라면 즉시 자동 착용!
      if (newAnsweredCount === 1) {
        setMyProfile((p) =>
          p.rightHandItem === 'none' ? { ...p, rightHandItem: 'lightstick' } : p
        );
      } else if (newAnsweredCount === 2) {
        setMyProfile((p) => (p.leftHandItem === 'none' ? { ...p, leftHandItem: 'fan' } : p));
      } else if (newAnsweredCount === 3) {
        setMyProfile((p) => (p.capStyle === 'none' ? { ...p, capStyle: 'official_cap' } : p));
      }

      if (unlockedItem) {
        showToast(
          `🎉 ${newAnsweredCount}일차 답변 완료! [${unlockedItem.label}] 착용 아이템이 해금되었습니다!`
        );
      } else {
        showToast(
          `✨ ${dateStr} 출석 & 답변 완료! (누적 ${newAnsweredCount}/${ADVENT_DAILY_LIST.length}일)`
        );
      }
    } else if (answerText) {
      showToast(`💙 ${dateStr} 데일리 답변이 수정되어 저장되었습니다!`);
    }
  };

  // 달리기 RUN! 토글: 현재 선택된 레인 트랙 위를 실제로 원형 주행!
  const handleTrackSprint = () => {
    if (viewMode === 'arena') {
      switchViewMode('plaza');
    }

    if (isTrackRunningRef.current) {
      isTrackRunningRef.current = false;
      myActionRef.current = 'idle';
      setMyAction('idle');
      showToast('⏸️ 트랙 달리기를 잠시 멈췄습니다.');
      return;
    }

    // 현재 위치에서 가장 가까운 원형 트랙 각도를 계산해서 해당 레인 위로 정확히 진입!
    const curAngle = Math.atan2(
      myPosRef.current.z - TRACK_CENTER_Z,
      myPosRef.current.x - TRACK_CENTER_X
    );
    trackAngleRef.current = curAngle;
    isTrackRunningRef.current = true;
    myActionRef.current = 'run';
    setMyAction('run');
    spawnFloatingParticles('#38bdf8');
    showToast(
      `🏃‍♂️ ${currentRoomId}레인 블루 트랙을 따라 힘차게 달립니다! (한 번 더 누르면 정지)`
    );
  };

  const currentAdventObj =
    ADVENT_DAILY_LIST.find((d) => d.dateStr === selectedAdventDate) || ADVENT_DAILY_LIST[0];

  // 선택한 날짜의 익명 보이스 기록 최대 2개 (실제 클라우드 익명 답변 우선 + 기본 익명 문구 보완)
  const visibleAnonymousRecords = useMemo(() => {
    const cloudForDate = publicAdventAnswers
      .filter((item) => item.dateStr === currentAdventObj.dateStr)
      .map((item) => item.text);
    const merged: string[] = [];
    for (const txt of [...cloudForDate, ...currentAdventObj.sampleAnswers]) {
      if (!merged.includes(txt)) merged.push(txt);
      if (merged.length >= 2) break;
    }
    return merged.slice(0, 2);
  }, [publicAdventAnswers, currentAdventObj]);

  const adventTrackRows = useMemo(() => {
    const items =
      selectedAdventMonth === 'all'
        ? ADVENT_DAILY_LIST
        : ADVENT_DAILY_LIST.filter((x) => x.monthKey === selectedAdventMonth);
    const perRow = 5;
    const rows: Array<{ rowIndex: number; isReversed: boolean; items: AdventDailyItem[] }> = [];
    for (let i = 0; i < items.length; i += perRow) {
      const rowIndex = Math.floor(i / perRow);
      rows.push({
        rowIndex,
        isReversed: rowIndex % 2 === 1,
        items: items.slice(i, i + perRow),
      });
    }
    return rows;
  }, [selectedAdventMonth]);

  const adventProgressPct = Math.round((checkedDates.length / ADVENT_DAILY_LIST.length) * 100);

  const recordedDiaryList = useMemo(() => {
    return ADVENT_DAILY_LIST.filter(
      (item) => checkedDates.includes(item.dateStr) || Boolean(adventAnswers[item.dateStr])
    ).reverse();
  }, [checkedDates, adventAnswers]);

  const currentRoomCapacity = Math.min(MAX_ROOM_CAPACITY, peers.length + 1);
  const dDayRemaining = getConcertDDay();

  // ============================================================================
  // 11. UI 렌더링
  // ============================================================================
  return (
    <div className="relative w-full h-screen overflow-hidden bg-slate-950 text-white select-none font-sans">
      {/* 3D WebGL 캔버스 마운트 */}
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* 3D 로딩 오버레이 */}
      {!threeReady && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-slate-950/95">
          <div className="w-12 h-12 rounded-full border-4 border-blue-500/30 border-t-sky-400 animate-spin mb-4" />
          <p className="text-sm font-bold text-sky-200">
            KSPO DOME 3D 러닝 트랙 광장을 준비하고 있습니다...
          </p>
        </div>
      )}

      {/* 상단 HUD 헤더 */}
      <header className="absolute top-0 left-0 right-0 z-20 p-3 sm:p-4 flex flex-wrap items-start justify-between gap-2 pointer-events-none">
        {/* 좌측: 공연 배지 + 내부 입장 + 좌석배치도 + 레인 선택 */}
        <div className="flex flex-wrap items-center gap-2 pointer-events-auto">
          <div className="px-3.5 py-2 rounded-2xl bg-slate-900/80 backdrop-blur-md border border-blue-400/30 shadow-xl flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-sky-400 flex items-center justify-center shadow-inner">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs sm:text-sm font-bold tracking-tight text-white">
                  EBDD 에바뛰콘 · KSPO DOME
                </span>
                <span className="px-1.5 py-0.5 text-[10px] font-extrabold rounded-md bg-blue-600 text-white">
                  {dDayRemaining === 0 ? 'D-DAY' : `D-${dDayRemaining}`}
                </span>
              </div>
              <p className="text-[10px] text-blue-200/80 hidden sm:block">
                2027.02.20-21 ·{' '}
                {viewMode === 'plaza'
                  ? `외부 ${currentRoomId}레인 트랙 광장`
                  : `내부 공연장 (${myProfile.seatZone})`}
              </p>
            </div>
          </div>

          <button
            onClick={() => switchViewMode(viewMode === 'plaza' ? 'arena' : 'plaza')}
            className={`px-3.5 py-2.5 rounded-2xl backdrop-blur-md border text-xs font-extrabold flex items-center gap-1.5 shadow-lg transition active:scale-95 ${
              viewMode === 'arena'
                ? 'bg-emerald-600/95 border-emerald-300/60 text-white hover:bg-emerald-500'
                : 'bg-indigo-600/90 border-indigo-300/50 text-white hover:bg-indigo-500'
            }`}
          >
            {viewMode === 'arena' ? (
              <>
                <Compass className="w-4 h-4 text-emerald-200" />
                <span>광장으로 나가기</span>
              </>
            ) : (
              <>
                <Building2 className="w-4 h-4 text-sky-200" />
                <span>공연장 입장</span>
              </>
            )}
          </button>

          <button
            onClick={() => setActiveModal('seatmap')}
            className="px-3.5 py-2.5 rounded-2xl bg-slate-900/85 hover:bg-slate-800 backdrop-blur-md border border-sky-400/45 text-xs font-extrabold text-sky-200 flex items-center gap-1.5 shadow-lg transition active:scale-95"
          >
            <LayoutGrid className="w-4 h-4 text-sky-400" />
            <span>좌석배치도</span>
          </button>
        </div>

        {/* 우측: 하늘 테마 + 오디오 + 내 아바타 MD 꾸미기 */}
        <div className="flex items-center gap-1.5 sm:gap-2 pointer-events-auto">
          {viewMode === 'plaza' && (
            <div className="flex items-center p-1 rounded-2xl bg-slate-900/75 backdrop-blur-md border border-white/15 shadow-lg">
              <button
                onClick={() => setSkyTheme('day')}
                title="낮 테마"
                className={`p-1.5 rounded-xl transition ${
                  skyTheme === 'day'
                    ? 'bg-sky-500 text-slate-950'
                    : 'text-slate-300 hover:bg-white/10'
                }`}
              >
                <Sun className="w-4 h-4" />
              </button>
              <button
                onClick={() => setSkyTheme('sunset')}
                title="노을 테마"
                className={`p-1.5 rounded-xl transition ${
                  skyTheme === 'sunset'
                    ? 'bg-amber-400 text-slate-950'
                    : 'text-slate-300 hover:bg-white/10'
                }`}
              >
                <Sunset className="w-4 h-4" />
              </button>
              <button
                onClick={() => setSkyTheme('night')}
                title="밤 테마"
                className={`p-1.5 rounded-xl transition ${
                  skyTheme === 'night'
                    ? 'bg-indigo-500 text-white'
                    : 'text-slate-300 hover:bg-white/10'
                }`}
              >
                <Moon className="w-4 h-4" />
              </button>
            </div>
          )}

          <div className="flex items-center p-1 rounded-2xl bg-slate-900/75 backdrop-blur-md border border-white/15 shadow-lg">
            <button
              onClick={toggleAudio}
              title={isPlayingAudio ? 'BGM 정지' : 'BGM 재생'}
              className={`p-1.5 rounded-xl transition ${
                isPlayingAudio
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-300 hover:bg-white/10'
              }`}
            >
              {isPlayingAudio ? (
                <Volume2 className="w-4 h-4" />
              ) : (
                <VolumeX className="w-4 h-4" />
              )}
            </button>
            <button
              onClick={nextAudioTrack}
              title="다음 BGM 트랙"
              className="p-1.5 rounded-xl text-slate-300 hover:bg-white/10 transition"
            >
              <Music className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={() => setActiveModal('profile')}
            className="px-3 py-2 rounded-2xl bg-slate-900/85 hover:bg-slate-800 backdrop-blur-md border border-sky-400/40 text-xs font-extrabold text-white flex items-center gap-1.5 shadow-lg transition active:scale-95"
          >
            <Shirt className="w-4 h-4 text-sky-400" />
            <span className="hidden sm:inline max-w-[96px] truncate">{myProfile.name}</span>
          </button>
        </div>
      </header>

      {/* 상단 토스트 알림 배너 */}
      {toastMsg && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-40 px-4 py-2.5 rounded-2xl bg-slate-900/95 border border-sky-400/50 text-xs sm:text-sm font-bold text-sky-100 shadow-2xl backdrop-blur-md max-w-[92vw] text-center pointer-events-none">
          {toastMsg}
        </div>
      )}

      {/* 우측 퀵 메뉴 도크 (어드벤트 · 그러나, 꽃이었다 · 1~5레인 · 미니게임) */}
      <aside className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-2 pointer-events-auto">
        <button
          onClick={() => setActiveModal('advent')}
          className="px-3 py-2.5 rounded-2xl bg-slate-900/85 hover:bg-slate-800 backdrop-blur-md border border-amber-400/40 text-xs font-extrabold text-amber-200 flex items-center gap-2 shadow-xl transition active:scale-95"
        >
          <Calendar className="w-4 h-4 text-amber-300 shrink-0" />
          <span className="hidden sm:inline">어드벤트</span>
          <span className="px-1.5 py-0.5 rounded-md bg-amber-400/20 text-[10px] text-amber-300">
            {checkedDates.length}
          </span>
        </button>

        <button
          onClick={() => setActiveModal('memos')}
          className="px-3 py-2.5 rounded-2xl bg-slate-900/85 hover:bg-slate-800 backdrop-blur-md border border-pink-400/40 text-xs font-extrabold text-pink-200 flex items-center gap-2 shadow-xl transition active:scale-95"
        >
          <FlowerBloomIcon className="w-4 h-4 text-pink-400 shrink-0" />
          <span className="hidden sm:inline">그러나, 꽃이었다</span>
          <span className="px-1.5 py-0.5 rounded-md bg-pink-400/20 text-[10px] text-pink-300">
            {memos.length}
          </span>
        </button>

        <button
          onClick={() => setActiveModal('room')}
          className="px-3 py-2.5 rounded-2xl bg-slate-900/85 hover:bg-slate-800 backdrop-blur-md border border-sky-400/40 text-xs font-extrabold text-sky-200 flex items-center gap-2 shadow-xl transition active:scale-95"
        >
          <Users className="w-4 h-4 text-sky-400 shrink-0" />
          <span className="hidden sm:inline">{currentRoomId}레인</span>
          <span className="px-1.5 py-0.5 rounded-md bg-sky-400/20 text-[10px] text-sky-300">
            {currentRoomCapacity}/{MAX_ROOM_CAPACITY}
          </span>
        </button>

        <button
          onClick={() => setActiveModal('minigames')}
          className="px-3 py-2.5 rounded-2xl bg-gradient-to-br from-blue-600/90 to-indigo-600/90 hover:from-blue-500 hover:to-indigo-500 backdrop-blur-md border border-sky-300/50 text-xs font-extrabold text-white flex items-center gap-2 shadow-xl transition active:scale-95"
        >
          <Gamepad2 className="w-4 h-4 text-amber-300 shrink-0" />
          <span className="hidden sm:inline">미니게임</span>
        </button>
      </aside>

      {/* 선택한 다른 보이스 팬 프로필 팝업 카드 */}
      {selectedPeer && (
        <div className="absolute left-3 sm:left-4 bottom-36 sm:bottom-32 z-30 w-64 p-3.5 rounded-2xl bg-slate-900/95 backdrop-blur-md border border-sky-400/40 shadow-2xl space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="text-xs font-extrabold text-white flex items-center gap-1.5">
                <Star className="w-3.5 h-3.5 text-sky-400" />
                <span>{selectedPeer.name}</span>
              </div>
              <div className="text-[11px] text-sky-300 flex items-center gap-1 mt-0.5">
                <MapPin className="w-3 h-3" />
                <span>{selectedPeer.seatZone}</span>
              </div>
            </div>
            <button
              onClick={() => setSelectedPeer(null)}
              className="p-1 rounded-lg bg-white/5 hover:bg-white/15 text-slate-300"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          {selectedPeer.speech && (
            <p className="text-xs text-slate-200 bg-slate-950/75 p-2 rounded-xl border border-white/10">
              “{selectedPeer.speech}”
            </p>
          )}
          <button
            onClick={() => {
              triggerAction('greet', `👋 ${selectedPeer.name}님에게 반갑게 인사했습니다!`);
              setSelectedPeer(null);
            }}
            className="w-full py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-extrabold text-white transition"
          >
            👋 반갑게 인사하기
          </button>
        </div>
      )}

      {/* 하단 액션 바 & 한마디 말풍선 입력 */}
      <footer className="absolute bottom-0 left-0 right-0 z-20 p-3 sm:p-4 flex flex-col items-center gap-2 pointer-events-none">
        <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 pointer-events-auto">
          <button
            onClick={handleTrackSprint}
            className={`px-3.5 py-2.5 rounded-2xl backdrop-blur-md border text-xs font-extrabold flex items-center gap-1.5 shadow-lg transition active:scale-95 ${
              myAction === 'run'
                ? 'bg-sky-500 border-white text-slate-950'
                : 'bg-gradient-to-r from-blue-600 to-sky-500 border-sky-300/60 text-white hover:from-blue-500 hover:to-sky-400'
            }`}
          >
            <Footprints className="w-4 h-4" />
            <span>{myAction === 'run' ? '달리기 정지' : '달리기 RUN!'}</span>
          </button>

          <button
            onClick={() => triggerAction('cheer', '🔥 에브리바디 뛰어!! 에바뛰 점프!!')}
            className={`px-3.5 py-2.5 rounded-2xl backdrop-blur-md border text-xs font-extrabold flex items-center gap-1.5 shadow-lg transition active:scale-95 ${
              myAction === 'cheer'
                ? 'bg-amber-500 border-amber-200 text-slate-950'
                : 'bg-slate-900/80 border-white/15 text-slate-100 hover:bg-slate-800'
            }`}
          >
            <Flame className="w-4 h-4 text-amber-400" />
            <span>에바뛰!</span>
          </button>

          <button
            onClick={() => {
              const holdingSlogan =
                myProfile.leftHandItem === 'slogan' || myProfile.rightHandItem === 'slogan';
              triggerAction(
                'wave',
                holdingSlogan
                  ? '💙 양손으로 CNBLUE 공식 슬로건을 높이 들어 흔듭니다!'
                  : '💎 공식 다이아 응원봉을 힘차게 흔듭니다!'
              );
            }}
            className={`px-3.5 py-2.5 rounded-2xl backdrop-blur-md border text-xs font-bold flex items-center gap-1.5 shadow-lg transition active:scale-95 ${
              myAction === 'wave'
                ? 'bg-blue-600 border-blue-300 text-white'
                : 'bg-slate-900/80 border-white/15 text-slate-100 hover:bg-slate-800'
            }`}
          >
            <Sparkles className="w-4 h-4 text-sky-400" />
            <span>
              {myProfile.leftHandItem === 'slogan' || myProfile.rightHandItem === 'slogan'
                ? '슬로건 흔들기'
                : '응원봉 흔들기'}
            </span>
          </button>

          <button
            onClick={() => triggerAction('greet', '🙇‍♂️ 주변 보이스 팬들에게 반갑게 인사합니다!')}
            className={`px-3.5 py-2.5 rounded-2xl backdrop-blur-md border text-xs font-bold flex items-center gap-1.5 shadow-lg transition active:scale-95 ${
              myAction === 'greet'
                ? 'bg-emerald-600 border-emerald-300 text-white'
                : 'bg-slate-900/80 border-white/15 text-slate-100 hover:bg-slate-800'
            }`}
          >
            <span>👋 인사</span>
          </button>

          <button
            onClick={() => triggerAction('sit', '🪑 광장에서 잠시 쉬어가며 숨을 고릅니다.')}
            className={`px-3.5 py-2.5 rounded-2xl backdrop-blur-md border text-xs font-bold flex items-center gap-1.5 shadow-lg transition active:scale-95 ${
              myAction === 'sit'
                ? 'bg-indigo-600 border-indigo-300 text-white'
                : 'bg-slate-900/80 border-white/15 text-slate-100 hover:bg-slate-800'
            }`}
          >
            <span>🪑 쉬기</span>
          </button>
        </div>

        {/* 한마디 말풍선 입력바 */}
        <form
          onSubmit={handleSendSpeech}
          className="w-full max-w-md flex items-center gap-2 p-1.5 rounded-2xl bg-slate-900/85 backdrop-blur-md border border-white/15 shadow-2xl pointer-events-auto"
        >
          <input
            type="text"
            maxLength={36}
            value={speechInput}
            onChange={(e) => setSpeechInput(e.target.value)}
            placeholder="머리 위 말풍선 한마디 띄우기... (예: 에바뛰콘 가보자고!)"
            className="flex-1 bg-transparent px-3 py-1.5 text-xs sm:text-sm text-white placeholder:text-slate-400 focus:outline-none"
          />
          <button
            type="submit"
            className="p-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white transition active:scale-95"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </footer>

      {/* ====================================================================== */}
      {/* 모달 1: 2027.02.20 결승선까지 달리는 데일리 어드벤트 러닝 트랙            */}
      {/* ====================================================================== */}
      {activeModal === 'advent' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-4xl max-h-[90vh] flex flex-col rounded-3xl bg-slate-900 border border-blue-400/30 shadow-2xl overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-blue-950/80 to-slate-900">
              <div>
                <h2 className="text-base sm:text-lg font-extrabold text-white flex items-center gap-2">
                  <Flag className="w-5 h-5 text-amber-300" />
                  <span>에바뛰콘 러닝 트랙 어드벤트 (~2027.02.20 결승선)</span>
                </h2>
                <p className="text-xs text-blue-200/80 mt-0.5">
                  오늘({todayKstStr})부터 2027년 2월 20일 에바뛰콘 결승선까지 매일 출석 도장을 찍으며 달려보세요!
                </p>
              </div>
              <button
                onClick={() => setActiveModal('none')}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/15 text-slate-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-4 pt-3 flex items-center justify-between gap-2 border-b border-white/10 bg-slate-900/60">
              <div className="flex gap-2">
                <button
                  onClick={() => setAdventTab('calendar')}
                  className={`px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition ${
                    adventTab === 'calendar'
                      ? 'border-sky-400 text-sky-300'
                      : 'border-transparent text-slate-400 hover:text-white'
                  }`}
                >
                  🏃 러닝 트랙 코스 ({checkedDates.length}/{ADVENT_DAILY_LIST.length}일)
                </button>
                <button
                  onClick={() => setAdventTab('diary')}
                  className={`px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition flex items-center gap-1.5 ${
                    adventTab === 'diary'
                      ? 'border-sky-400 text-sky-300'
                      : 'border-transparent text-slate-400 hover:text-white'
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>내 데일리 기록 ({recordedDiaryList.length})</span>
                </button>
              </div>
              <span className="hidden sm:inline-flex px-2.5 py-1 mb-2 rounded-full bg-blue-600/30 border border-sky-400/40 text-[11px] font-extrabold text-sky-200">
                결승선까지 {dDayRemaining === 0 ? 'D-DAY' : `D-${dDayRemaining}`}
              </span>
            </div>

            <div className="p-4 sm:p-5 overflow-y-auto flex-1">
              {adventTab === 'calendar' ? (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                  {/* 좌측: 결승선까지 이어지는 S자 블루 러닝 트랙 */}
                  <div className="lg:col-span-7 space-y-3">
                    {/* 전체 완주 진행률 바 */}
                    <div className="p-3 rounded-2xl bg-slate-950/80 border border-blue-400/25 space-y-2">
                      <div className="flex items-center justify-between text-[11px] font-extrabold">
                        <span className="text-emerald-300">🚩 START (11.25)</span>
                        <span className="text-sky-300">
                          트랙 완주율 {adventProgressPct}% ({checkedDates.length} /{' '}
                          {ADVENT_DAILY_LIST.length}일)
                        </span>
                        <span className="text-pink-300">🏁 FINISH (02.20)</span>
                      </div>
                      <div className="relative h-3 rounded-full bg-slate-800 overflow-hidden border border-white/10">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-blue-600 via-sky-400 to-amber-300 transition-all duration-500"
                          style={{ width: `${Math.max(4, adventProgressPct)}%` }}
                        />
                      </div>
                    </div>

                    {/* 구간(LAP) 선택 탭 */}
                    <div className="flex flex-wrap gap-1.5">
                      {ADVENT_MONTHS.map((m) => (
                        <button
                          key={m.key}
                          onClick={() => setSelectedAdventMonth(m.key)}
                          className={`px-2.5 py-1.5 rounded-xl text-[11px] font-extrabold border transition ${
                            selectedAdventMonth === m.key
                              ? 'bg-blue-600 border-sky-300 text-white shadow'
                              : 'bg-slate-950/70 border-white/10 text-slate-300 hover:bg-slate-800'
                          }`}
                        >
                          {m.label}
                        </button>
                      ))}
                      <button
                        onClick={() => setSelectedAdventMonth('all')}
                        className={`px-2.5 py-1.5 rounded-xl text-[11px] font-extrabold border transition ${
                          selectedAdventMonth === 'all'
                            ? 'bg-indigo-600 border-sky-300 text-white shadow'
                            : 'bg-slate-950/70 border-white/10 text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        전체 88일 코스
                      </button>
                    </div>

                    {/* S자 지그재그 스타디움 블루 트랙 코스 */}
                    <div className="p-3 rounded-2xl bg-slate-950/75 border border-white/10 max-h-[410px] overflow-y-auto space-y-0">
                      {adventTrackRows.map((row, rIdx) => {
                        const isLastRow = rIdx === adventTrackRows.length - 1;
                        // 5칸 고정 그리드 슬롯 생성 (역방향 줄은 오른쪽 코너 커넥터에 맞춰 정렬)
                        const paddedSlots: Array<AdventDailyItem | null> = [
                          ...row.items,
                          ...Array(Math.max(0, 5 - row.items.length)).fill(null),
                        ];
                        const displaySlots = row.isReversed
                          ? [...paddedSlots].reverse()
                          : paddedSlots;

                        return (
                          <div key={`track-row-${row.rowIndex}`} className="relative">
                            {/* 블루 러닝 레인 바 */}
                            <div className="relative px-2 py-2.5 rounded-2xl bg-gradient-to-r from-blue-800/80 via-blue-700/85 to-blue-800/80 border-y-2 border-white/35 grid grid-cols-5 items-center gap-1.5 sm:gap-2">
                              {/* 중앙 흰색 점선 레인 가이드 */}
                              <div className="pointer-events-none absolute inset-x-4 top-1/2 -translate-y-1/2 border-t-2 border-dashed border-white/30" />

                              {displaySlots.map((item, sIdx) => {
                                if (!item) {
                                  return (
                                    <div
                                      key={`empty-${row.rowIndex}-${sIdx}`}
                                      className="h-full"
                                      aria-hidden="true"
                                    />
                                  );
                                }
                                const isChecked = checkedDates.includes(item.dateStr);
                                const isSelected = selectedAdventDate === item.dateStr;
                                const isToday = item.dateStr === todayKstStr;
                                const isStartDay = item.dateStr === ADVENT_START_DATE;
                                const isConcertDay = item.dateStr === ADVENT_END_DATE;
                                const isFuture = item.dateStr > todayKstStr;

                                return (
                                  <button
                                    key={item.dateStr}
                                    onClick={() => {
                                      if (isFuture) {
                                        showToast(
                                          `🔒 ${item.year}년 ${item.month}월 ${item.day}일(D-${item.dDay}) 자정에 이 구간이 열립니다!`
                                        );
                                        return;
                                      }
                                      setSelectedAdventDate(item.dateStr);
                                    }}
                                    className={`relative z-10 w-full min-w-0 py-2 px-1 rounded-xl border-2 flex flex-col items-center justify-center gap-0.5 transition ${
                                      isSelected
                                        ? 'bg-sky-400 border-white text-slate-950 shadow-lg scale-105'
                                        : isConcertDay
                                        ? 'bg-gradient-to-b from-amber-400 to-pink-500 border-white text-slate-950 shadow-md'
                                        : isChecked
                                        ? 'bg-blue-950/90 border-amber-300 text-sky-100'
                                        : isFuture
                                        ? 'bg-slate-950/80 border-blue-400/25 text-slate-400'
                                        : 'bg-slate-900/90 border-sky-300/60 text-white hover:bg-blue-900'
                                    } ${isToday ? 'ring-2 ring-amber-300 ring-offset-1 ring-offset-blue-900' : ''}`}
                                  >
                                    {isToday && (
                                      <span className="absolute -top-2.5 px-1.5 py-0.5 rounded-full bg-amber-300 text-[8px] font-black text-slate-950 shadow">
                                        🏃 NOW
                                      </span>
                                    )}
                                    {isStartDay && !isToday && (
                                      <span className="absolute -top-2.5 px-1.5 py-0.5 rounded-full bg-emerald-400 text-[8px] font-black text-slate-950">
                                        START
                                      </span>
                                    )}
                                    {isConcertDay && !isToday && (
                                      <span className="absolute -top-2.5 px-1.5 py-0.5 rounded-full bg-white text-[8px] font-black text-pink-600 shadow">
                                        🏁 FINISH
                                      </span>
                                    )}

                                    <span className="text-[9px] font-bold opacity-80">
                                      {item.month}/{item.day}
                                    </span>
                                    <span className="text-[11px] sm:text-xs font-black leading-none">
                                      {isConcertDay ? 'D-DAY' : `D-${item.dDay}`}
                                    </span>
                                    <div className="mt-0.5">
                                      {isChecked ? (
                                        <Check
                                          className={`w-3.5 h-3.5 ${
                                            isSelected ? 'text-slate-950' : 'text-amber-300'
                                          }`}
                                        />
                                      ) : isConcertDay ? (
                                        <Flag className="w-3.5 h-3.5 text-slate-950" />
                                      ) : isFuture ? (
                                        <Lock className="w-3 h-3 opacity-60" />
                                      ) : (
                                        <Footprints
                                          className={`w-3 h-3 ${
                                            isSelected ? 'text-slate-950' : 'text-sky-300'
                                          }`}
                                        />
                                      )}
                                    </div>
                                  </button>
                                );
                              })}
                            </div>

                            {/* 다음 줄로 이어지는 S자 코너 트랙 커넥터 */}
                            {!isLastRow && (
                              <div
                                className={`flex ${
                                  row.isReversed ? 'justify-start pl-6' : 'justify-end pr-6'
                                }`}
                              >
                                <div className="w-5 h-3.5 bg-blue-700/80 border-x-2 border-white/35 flex items-center justify-center">
                                  <div className="h-full border-l-2 border-dashed border-white/35" />
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* 우측: 선택한 트랙 구간의 오늘의 질문 & 출석 도장 */}
                  <div className="lg:col-span-5 flex flex-col gap-3">
                    <div className="p-4 rounded-2xl bg-slate-950/85 border border-sky-400/30 space-y-3 flex-1 flex flex-col justify-between">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="px-2 py-0.5 rounded-lg bg-blue-600 text-[10px] font-black text-white">
                                DAY {currentAdventObj.dayNumber}
                              </span>
                              <span className="px-2 py-0.5 rounded-lg bg-amber-400/20 border border-amber-300/40 text-[10px] font-extrabold text-amber-300">
                                {currentAdventObj.dDay === 0
                                  ? '🏁 D-DAY'
                                  : `D-${currentAdventObj.dDay}`}
                              </span>
                            </div>
                            <h3 className="text-sm sm:text-base font-extrabold text-white mt-1.5">
                              {currentAdventObj.year}.{String(currentAdventObj.month).padStart(2, '0')}.
                              {String(currentAdventObj.day).padStart(2, '0')} · {currentAdventObj.title}
                            </h3>
                          </div>
                          {checkedDates.includes(currentAdventObj.dateStr) && (
                            <span className="px-2 py-1 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-[10px] font-extrabold text-emerald-300 shrink-0">
                              ✅ 출석 완료
                            </span>
                          )}
                        </div>

                        {/* 오늘의 트랙 보상 */}
                        <div className="px-3 py-2 rounded-xl bg-blue-950/60 border border-blue-400/25 flex items-center justify-between gap-2 text-xs">
                          <span className="text-blue-200 font-bold shrink-0">
                            {checkedDates.includes(currentAdventObj.dateStr)
                              ? nextUnlockMilestone
                                ? `✅ ${answeredCount}회 완료 · 다음(${nextUnlockMilestone.day}회)`
                                : '🎉 모든 MD 해금 완료'
                              : nextUnlockMilestone
                              ? `🎁 답변 시 해금 (${nextUnlockMilestone.day}회차)`
                              : '🎁 오늘의 완주 보상'}
                          </span>
                          <span className="text-amber-300 font-extrabold text-right">
                            {nextUnlockMilestone
                              ? nextUnlockMilestone.label
                              : currentAdventObj.rewardLabel}
                          </span>
                        </div>

                        {/* 오늘의 질문 카드 */}
                        <div className="p-3.5 rounded-xl bg-slate-900/90 border border-white/10 space-y-2">
                          <div className="text-[11px] font-extrabold text-sky-400">
                            💬 오늘의 보이스 질문
                          </div>
                          <p className="text-xs sm:text-sm font-bold text-white leading-relaxed">
                            Q. {currentAdventObj.question}
                          </p>
                          {adventAnswers[currentAdventObj.dateStr] && (
                            <div className="mt-2 p-2.5 rounded-lg bg-blue-600/20 border border-sky-400/30 text-xs text-sky-100">
                              <span className="font-bold text-sky-300">내 기록: </span>
                              {adventAnswers[currentAdventObj.dateStr]}
                            </div>
                          )}
                        </div>

                        {/* 답변 입력칸 */}
                        <div>
                          <label className="block text-[11px] font-bold text-slate-300 mb-1.5">
                            질문에 답하고 착용 아이템 해금하기 (익명으로 공유됨)
                          </label>
                          <textarea
                            rows={2}
                            maxLength={120}
                            value={adventAnswerInput}
                            onChange={(e) => setAdventAnswerInput(e.target.value)}
                            placeholder="질문에 답변을 남기면 1일차 응원봉, 2일차 부채, 3일차 모자 순으로 아이템이 열려요! (최대 120자)"
                            className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/15 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-sky-400 resize-none"
                          />
                        </div>

                        {/* 다른 보이스들의 익명 기록 (닉네임 없이 익명으로 2개 노출) */}
                        <div className="space-y-1.5">
                          <div className="text-[10px] font-bold text-slate-400">
                            💙 함께 달리는 보이스들의 기록 (익명)
                          </div>
                          {visibleAnonymousRecords.map((text, idx) => (
                            <div
                              key={`${currentAdventObj.dateStr}-anon-${idx}`}
                              className="px-2.5 py-1.5 rounded-lg bg-slate-900/75 border border-white/5 text-[11px] text-slate-300 flex items-start gap-1.5"
                            >
                              <span className="px-1.5 py-0.5 rounded bg-sky-500/15 text-[10px] font-extrabold text-sky-300 shrink-0">
                                익명
                              </span>
                              <span className="leading-snug">{text}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <button
                        onClick={() => handleCheckInAdvent(currentAdventObj.dateStr)}
                        className="w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-500 hover:to-sky-400 text-xs font-extrabold text-white shadow-lg transition active:scale-95"
                      >
                        {checkedDates.includes(currentAdventObj.dateStr)
                          ? '💙 오늘의 답변 업데이트'
                          : `✅ 답변 완료 & ${nextUnlockMilestone ? nextUnlockMilestone.shortName : '보상'} 해금하기`}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {recordedDiaryList.length === 0 ? (
                    <div className="p-10 rounded-2xl bg-slate-950/60 border border-white/10 text-center text-xs sm:text-sm text-slate-400">
                      아직 출석 기록이 없습니다. 달력에서 오늘 날짜에 첫 출석 도장을 찍어보세요! 💙
                    </div>
                  ) : (
                    recordedDiaryList.map((item) => (
                      <div
                        key={item.dateStr}
                        className="p-3.5 rounded-2xl bg-slate-950/70 border border-blue-400/25 space-y-1.5"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-extrabold text-sky-300">
                            {item.dateStr} ({item.dDay === 0 ? 'D-DAY' : `D-${item.dDay}`})
                          </span>
                          <span className="text-[11px] font-bold text-amber-300">
                            ✅ 출석 완료 · 🎁 {item.rewardLabel}
                          </span>
                        </div>
                        <p className="text-xs font-bold text-white">Q. {item.question}</p>
                        {adventAnswers[item.dateStr] && (
                          <p className="text-xs text-sky-100 bg-slate-900/90 p-2.5 rounded-xl">
                            💬 {adventAnswers[item.dateStr]}
                          </p>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================== */}
      {/* 모달 2: 「그러나, 꽃이었다」 메모장                                      */}
      {/* ====================================================================== */}
      {activeModal === 'memos' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-xl max-h-[88vh] flex flex-col rounded-3xl bg-slate-900 border border-sky-400/30 shadow-2xl overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-sky-950/70 to-slate-900">
              <div>
                <h2 className="text-base font-extrabold text-white flex items-center gap-2">
                  <FlowerBloomIcon className="w-5 h-5 text-sky-400" />
                  <span>그러나, 꽃이었다 ({memos.length}송이)</span>
                </h2>
                <p className="text-[11px] text-slate-300 mt-0.5">
                  메모를 남기면 지금 내 아바타가 서 있는 광장 땅 위에 입체 꽃이 피어납니다!
                </p>
              </div>
              <button
                onClick={() => {
                  setActiveModal('none');
                  setSelectedMemo(null);
                }}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/15 text-slate-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={handleAddMemo}
              className="p-4 border-b border-white/10 bg-slate-950/60 space-y-2.5"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300">피어날 꽃잎 컬러</span>
                <div className="flex items-center gap-1.5">
                  {FLOWER_COLORS.map((c) => (
                    <button
                      type="button"
                      key={c.hex}
                      onClick={() => setNewMemoColor(c.hex)}
                      title={c.name}
                      className={`w-6 h-6 rounded-full border-2 transition ${
                        newMemoColor === c.hex
                          ? 'border-white scale-110'
                          : 'border-transparent opacity-70'
                      }`}
                      style={{ backgroundColor: c.hex }}
                    />
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  maxLength={60}
                  value={newMemoText}
                  onChange={(e) => setNewMemoText(e.target.value)}
                  placeholder="씨엔블루와 보이스들에게 응원 메모를 적고 꽃을 피워보세요! (60자)"
                  className="flex-1 px-3.5 py-2 rounded-xl bg-slate-900 border border-white/15 text-xs sm:text-sm text-white focus:outline-none focus:border-sky-400"
                />
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-extrabold text-white shrink-0 transition"
                >
                  🌸 꽃 피우기
                </button>
              </div>
            </form>

            <div className="p-4 overflow-y-auto space-y-2.5 flex-1">
              {memos.map((memo) => {
                const isFocused = selectedMemo?.id === memo.id;
                return (
                  <div
                    key={memo.id}
                    className={`p-3.5 rounded-2xl border transition ${
                      isFocused
                        ? 'bg-blue-600/20 border-sky-400'
                        : 'bg-slate-950/65 border-white/10'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-3 h-3 rounded-full shrink-0 border border-white/40"
                          style={{ backgroundColor: memo.color }}
                        />
                        <span className="text-xs font-extrabold text-white">{memo.author}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-sky-300">
                          {memo.seatZone}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400">{memo.createdAt}</span>
                    </div>
                    <p className="mt-2 text-xs sm:text-sm text-slate-100 leading-relaxed">
                      {memo.text}
                    </p>
                    <div className="mt-2.5 flex items-center justify-between">
                      <button
                        onClick={() => handleToggleMemoLike(memo.id)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition ${
                          memo.likedByMe
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-400/40'
                            : 'bg-white/5 text-slate-300 hover:bg-white/10'
                        }`}
                      >
                        <Heart className="w-3 h-3 fill-current" />
                        <span>물주기 응원 {memo.likes}</span>
                      </button>

                      <button
                        onClick={() => {
                          if (viewMode === 'arena') switchViewMode('plaza');
                          isTrackRunningRef.current = false;
                          myPosRef.current.targetX = memo.x;
                          myPosRef.current.targetZ = memo.z + 1.6;
                          myActionRef.current = 'walk';
                          setMyAction('walk');
                          setActiveModal('none');
                          showToast(`🌸 ${memo.author}님이 피운 응원 꽃 위치로 이동합니다!`);
                        }}
                        className="text-[11px] font-bold text-sky-400 hover:underline"
                      >
                        이 꽃으로 이동 →
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================== */}
      {/* 모달 3: 러닝 트랙 레인(1~5레인) 선택 및 즉시 이동                        */}
      {/* ====================================================================== */}
      {activeModal === 'room' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-white/15 shadow-2xl overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between">
              <div>
                <h2 className="text-base font-extrabold text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-sky-400" />
                  <span>러닝 트랙 레인 선택 (1~5레인)</span>
                </h2>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  레인을 선택하면 해당 번호 트랙 위치로 즉시 이동하며, '달리기 RUN!' 시 그 레인을 따라 달립니다!
                </p>
              </div>
              <button
                onClick={() => setActiveModal('none')}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/15 text-slate-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-2">
              {ROOM_LIST.map((room) => {
                const isCurrent = room.id === currentRoomId;
                const count = isCurrent ? currentRoomCapacity : room.baseCount;
                return (
                  <button
                    key={room.id}
                    onClick={() => handleChangeRoom(room.id)}
                    className={`w-full p-3.5 rounded-2xl border flex items-center justify-between gap-2 transition ${
                      isCurrent
                        ? 'bg-blue-600/25 border-sky-400 text-white'
                        : 'bg-slate-950/60 border-white/10 text-slate-200 hover:bg-slate-800'
                    }`}
                  >
                    <div className="text-left">
                      <div className="text-sm font-extrabold flex items-center gap-1.5">
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: room.accentHex }}
                        />
                        <span>{room.name}</span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">{room.desc}</div>
                    </div>
                    <span className="px-2.5 py-1 rounded-xl bg-slate-900 border border-white/10 text-xs font-extrabold text-sky-300 shrink-0">
                      {count} / {MAX_ROOM_CAPACITY}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================== */}
      {/* 모달 4: 내 아바타 & 2027 공식 MD 풀착장 커스터마이징                      */}
      {/* ====================================================================== */}
      {activeModal === 'profile' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-3xl bg-slate-900 border border-blue-400/25 shadow-2xl overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between">
              <div>
                <h2 className="text-base font-extrabold text-white flex items-center gap-1.5">
                  <Shirt className="w-4 h-4 text-sky-400" />
                  <span>내 아바타 & 공식 MD 꾸미기</span>
                </h2>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  헤어스타일 · 공식 캡 · 트랙 자켓 · 응원봉 · 에.바.뛰. 부채 · 양손 슬로건
                </p>
              </div>
              <button
                onClick={() => setActiveModal('none')}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/15 text-slate-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 sm:p-5 overflow-y-auto grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
              {/* 좌측: 3D 캐릭터 실시간 미리보기 */}
              <div className="md:col-span-5 flex flex-col gap-2.5 md:sticky md:top-0">
                <AvatarPreview3D
                  threeReady={threeReady}
                  profile={myProfile}
                  buildFanAvatarMesh={buildFanAvatarMesh}
                />
                <div className="p-3 rounded-2xl bg-slate-950/75 border border-white/10 text-center">
                  <div className="text-xs font-extrabold text-white">{myProfile.name}</div>
                  <div className="text-[11px] text-sky-300 mt-0.5 truncate">
                    {myProfile.seatZone}
                  </div>
                </div>
              </div>

              {/* 우측: 착장 및 프로필 설정 */}
              <div className="md:col-span-7 space-y-4">
                {/* 어드벤트 MD 해금 현황 안내 배너 */}
                <div className="p-3 rounded-2xl bg-gradient-to-r from-blue-950/80 to-indigo-950/70 border border-amber-400/35 flex items-center justify-between gap-2">
                  <div>
                    <div className="text-xs font-extrabold text-amber-300 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>어드벤트 답변 해금: {answeredCount}회 완료</span>
                    </div>
                    <p className="text-[11px] text-blue-100/85 mt-0.5">
                      {nextUnlockMilestone
                        ? `다음 해금(${nextUnlockMilestone.day}일차): ${nextUnlockMilestone.label}`
                        : '🎉 모든 공식 MD 착용 아이템을 전부 해금했습니다!'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveModal('advent')}
                    className="px-2.5 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-[11px] font-black shrink-0 transition"
                  >
                    질문 답하기 →
                  </button>
                </div>

                {/* 닉네임 설정 */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    보이스 닉네임
                  </label>
                  <input
                    type="text"
                    maxLength={14}
                    value={myProfile.name}
                    onChange={(e) => setMyProfile((p) => ({ ...p, name: e.target.value }))}
                    placeholder="닉네임을 입력하세요"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-white/15 text-xs sm:text-sm text-white focus:outline-none focus:border-sky-400"
                  />
                </div>

                {/* 헤어스타일 선택 */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    헤어스타일 선택
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {HAIR_OPTIONS.map((hair) => (
                      <button
                        type="button"
                        key={hair.id}
                        onClick={() => setMyProfile((p) => ({ ...p, hairStyle: hair.id }))}
                        className={`p-2.5 rounded-xl border text-left transition ${
                          myProfile.hairStyle === hair.id
                            ? 'border-sky-400 bg-sky-500/20 text-white'
                            : 'border-white/10 bg-slate-800/60 text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        <div className="text-xs font-extrabold">{hair.name}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">
                          {hair.desc}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 01. 공식 모자 착용 (3일차 화이트 데님 캡 · 6일차 딥네이비 볼캡 해금) */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    01. 공식 모자 착용 (어드벤트 답변 해금)
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {CAP_OPTIONS.map((cap) => {
                      const reqDay = CAP_UNLOCK_DAY[cap.id];
                      const isUnlocked = answeredCount >= reqDay;
                      return (
                        <button
                          type="button"
                          key={cap.id}
                          onClick={() => {
                            if (!isUnlocked) {
                              showToast(
                                `🔒 어드벤트 질문에 ${reqDay}일 답변하면 [${cap.name}]을 착용할 수 있어요!`
                              );
                              return;
                            }
                            setMyProfile((p) => ({ ...p, capStyle: cap.id }));
                          }}
                          className={`p-2 rounded-xl border text-xs font-bold flex flex-col items-center justify-center gap-1 transition ${
                            !isUnlocked
                              ? 'border-white/5 bg-slate-950/70 text-slate-500 opacity-75'
                              : myProfile.capStyle === cap.id
                              ? 'border-sky-400 bg-sky-500/20 text-white'
                              : 'border-white/10 bg-slate-800/60 text-slate-300 hover:bg-slate-800'
                          }`}
                        >
                          <div className="flex items-center gap-1.5 max-w-full">
                            {isUnlocked ? (
                              <span
                                className="w-3 h-3 rounded-full border border-white/30 shrink-0"
                                style={{ backgroundColor: cap.swatch }}
                              />
                            ) : (
                              <Lock className="w-3 h-3 text-amber-400/80 shrink-0" />
                            )}
                            <span className="truncate">{cap.name}</span>
                          </div>
                          {!isUnlocked && (
                            <span className="text-[9px] text-amber-300/90 font-bold">
                              {reqDay}일차 해금
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 공식 상의 의상 선택 */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    02. 공식 상의 착장 (화이트 티 기본 제공)
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {OUTFIT_OPTIONS.map((outfit) => {
                      const reqDay = OUTFIT_UNLOCK_DAY[outfit.id];
                      const isUnlocked = answeredCount >= reqDay;
                      return (
                        <button
                          type="button"
                          key={outfit.id}
                          onClick={() => {
                            if (!isUnlocked) {
                              showToast(
                                `🔒 어드벤트 질문에 ${reqDay}일 답변하면 [${outfit.name}]을 착용할 수 있어요!`
                              );
                              return;
                            }
                            setMyProfile((p) => ({
                              ...p,
                              outfitStyle: outfit.id,
                              hoodieColor: outfit.baseHex,
                            }));
                          }}
                          className={`p-2.5 rounded-xl border text-left transition ${
                            !isUnlocked
                              ? 'border-white/5 bg-slate-950/70 text-slate-500 opacity-75'
                              : myProfile.outfitStyle === outfit.id
                              ? 'border-sky-400 bg-sky-500/20 text-white'
                              : 'border-white/10 bg-slate-800/60 text-slate-300 hover:bg-slate-800'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-1.5">
                            <div className="flex items-center gap-1.5 min-w-0">
                              {isUnlocked ? (
                                <span
                                  className="w-3 h-3 rounded-full border border-white/40 shrink-0"
                                  style={{ backgroundColor: outfit.baseHex }}
                                />
                              ) : (
                                <Lock className="w-3 h-3 text-amber-400/80 shrink-0" />
                              )}
                              <span className="text-xs font-extrabold truncate">{outfit.name}</span>
                            </div>
                            {!isUnlocked && (
                              <span className="text-[9px] text-amber-300 font-bold shrink-0">
                                {reqDay}일차
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5 truncate">
                            {outfit.desc}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 손에 들 응원 MD: 1일차 응원봉 / 2일차 에.바.뛰. 부채 / 4일차 CNBLUE 양손 슬로건 */}
                <div className="p-3 rounded-2xl bg-slate-950/75 border border-sky-400/25 space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <label className="text-xs font-extrabold text-sky-300">
                      손에 들 공식 응원 MD (1일차 응원봉 · 2일차 부채 · 4일차 슬로건)
                    </label>
                    <span className="text-[10px] text-slate-400 shrink-0">
                      슬로건은 양손 사용
                    </span>
                  </div>

                  {/* 원클릭 추천 조합 프리셋 */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        if (answeredCount < HAND_ITEM_UNLOCK_DAY.lightstick) {
                          showToast('🔒 어드벤트 1일차 질문에 답하면 공식 응원봉이 해금됩니다!');
                          return;
                        }
                        setMyProfile((p) => ({
                          ...p,
                          leftHandItem: 'none',
                          rightHandItem: 'lightstick',
                        }));
                      }}
                      className={`py-2 px-2 rounded-xl border text-[11px] font-bold transition ${
                        answeredCount < HAND_ITEM_UNLOCK_DAY.lightstick
                          ? 'bg-slate-950 border-white/5 text-slate-500 opacity-75'
                          : myProfile.leftHandItem === 'none' &&
                            myProfile.rightHandItem === 'lightstick'
                          ? 'bg-blue-600 border-sky-300 text-white'
                          : 'bg-slate-900 border-white/10 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      {answeredCount < HAND_ITEM_UNLOCK_DAY.lightstick ? '🔒 1일차 응원봉' : '💎 응원봉만'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (answeredCount < HAND_ITEM_UNLOCK_DAY.fan) {
                          showToast('🔒 어드벤트 2일차 질문에 답하면 에.바.뛰. 부채가 해금됩니다!');
                          return;
                        }
                        setMyProfile((p) => ({
                          ...p,
                          leftHandItem: 'none',
                          rightHandItem: 'fan',
                        }));
                      }}
                      className={`py-2 px-2 rounded-xl border text-[11px] font-bold transition ${
                        answeredCount < HAND_ITEM_UNLOCK_DAY.fan
                          ? 'bg-slate-950 border-white/5 text-slate-500 opacity-75'
                          : myProfile.leftHandItem === 'none' && myProfile.rightHandItem === 'fan'
                          ? 'bg-blue-600 border-sky-300 text-white'
                          : 'bg-slate-900 border-white/10 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      {answeredCount < HAND_ITEM_UNLOCK_DAY.fan ? '🔒 2일차 부채' : '🪭 부채만'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (answeredCount < HAND_ITEM_UNLOCK_DAY.slogan) {
                          showToast('🔒 어드벤트 4일차 질문에 답하면 CNBLUE 양손 슬로건이 해금됩니다!');
                          return;
                        }
                        setMyProfile((p) => ({
                          ...p,
                          leftHandItem: 'slogan',
                          rightHandItem: 'slogan',
                        }));
                      }}
                      className={`py-2 px-2 rounded-xl border text-[11px] font-extrabold transition ${
                        answeredCount < HAND_ITEM_UNLOCK_DAY.slogan
                          ? 'bg-slate-950 border-white/5 text-slate-500 opacity-75'
                          : myProfile.leftHandItem === 'slogan' ||
                            myProfile.rightHandItem === 'slogan'
                          ? 'bg-[#0018e8] border-white text-white shadow'
                          : 'bg-slate-900 border-white/10 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      {answeredCount < HAND_ITEM_UNLOCK_DAY.slogan ? '🔒 4일차 슬로건' : '💙 슬로건 (양손)'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (answeredCount < HAND_ITEM_UNLOCK_DAY.fan) {
                          showToast('🔒 어드벤트 2일차까지 답하면 부채+응원봉 조합을 착용할 수 있어요!');
                          return;
                        }
                        setMyProfile((p) => ({
                          ...p,
                          leftHandItem: 'fan',
                          rightHandItem: 'lightstick',
                        }));
                      }}
                      className={`py-2 px-2 rounded-xl border text-[11px] font-extrabold transition ${
                        answeredCount < HAND_ITEM_UNLOCK_DAY.fan
                          ? 'bg-slate-950 border-white/5 text-slate-500 opacity-75'
                          : myProfile.leftHandItem !== 'none' &&
                            myProfile.rightHandItem !== 'none' &&
                            myProfile.leftHandItem !== 'slogan' &&
                            myProfile.rightHandItem !== 'slogan'
                          ? 'bg-gradient-to-r from-blue-600 to-sky-500 border-white text-white shadow'
                          : 'bg-slate-900 border-white/10 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      {answeredCount < HAND_ITEM_UNLOCK_DAY.fan ? '🔒 2일차 풀세트' : '🔥 부채+응원봉'}
                    </button>
                  </div>

                  {(myProfile.leftHandItem === 'slogan' ||
                    myProfile.rightHandItem === 'slogan') && (
                    <div className="px-2.5 py-1.5 rounded-xl bg-[#0018e8]/25 border border-blue-400/50 text-[11px] text-sky-100 font-semibold flex items-center justify-between">
                      <span>💙 CNBLUE 가로형 슬로건을 양손으로 들고 있어요!</span>
                      <span className="text-[10px] text-sky-300 shrink-0 ml-2">양손 착용 중</span>
                    </div>
                  )}

                  {/* 왼손 / 오른손 개별 선택 (잠금 체크 포함) */}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div>
                      <div className="text-[10px] font-bold text-slate-400 mb-1">왼손 (LEFT)</div>
                      <div className="grid grid-cols-2 gap-1">
                        {(
                          [
                            { id: 'fan', label: '🪭 부채' },
                            { id: 'lightstick', label: '💎 응원봉' },
                            { id: 'slogan', label: '💙 슬로건' },
                            { id: 'none', label: '없음' },
                          ] as const
                        ).map((opt) => {
                          const reqDay = HAND_ITEM_UNLOCK_DAY[opt.id];
                          const isUnlocked = answeredCount >= reqDay;
                          return (
                            <button
                              type="button"
                              key={opt.id}
                              onClick={() => {
                                if (!isUnlocked) {
                                  showToast(
                                    `🔒 어드벤트 ${reqDay}일차 질문에 답변하면 [${opt.label}]이 해금됩니다!`
                                  );
                                  return;
                                }
                                setMyProfile((p) =>
                                  opt.id === 'slogan'
                                    ? { ...p, leftHandItem: 'slogan', rightHandItem: 'slogan' }
                                    : {
                                        ...p,
                                        leftHandItem: opt.id,
                                        rightHandItem:
                                          p.rightHandItem === 'slogan' ? 'none' : p.rightHandItem,
                                      }
                                );
                              }}
                              className={`py-1.5 rounded-lg border text-[10px] font-bold transition ${
                                !isUnlocked
                                  ? 'bg-slate-950 border-white/5 text-slate-600'
                                  : myProfile.leftHandItem === opt.id
                                  ? 'bg-sky-500/25 border-sky-400 text-white'
                                  : 'bg-slate-900 border-white/10 text-slate-400'
                              }`}
                            >
                              {isUnlocked ? opt.label : `🔒 ${reqDay}일`}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <div className="text-[10px] font-bold text-slate-400 mb-1">오른손 (RIGHT)</div>
                      <div className="grid grid-cols-2 gap-1">
                        {(
                          [
                            { id: 'lightstick', label: '💎 응원봉' },
                            { id: 'fan', label: '🪭 부채' },
                            { id: 'slogan', label: '💙 슬로건' },
                            { id: 'none', label: '없음' },
                          ] as const
                        ).map((opt) => {
                          const reqDay = HAND_ITEM_UNLOCK_DAY[opt.id];
                          const isUnlocked = answeredCount >= reqDay;
                          return (
                            <button
                              type="button"
                              key={opt.id}
                              onClick={() => {
                                if (!isUnlocked) {
                                  showToast(
                                    `🔒 어드벤트 ${reqDay}일차 질문에 답변하면 [${opt.label}]이 해금됩니다!`
                                  );
                                  return;
                                }
                                setMyProfile((p) =>
                                  opt.id === 'slogan'
                                    ? { ...p, leftHandItem: 'slogan', rightHandItem: 'slogan' }
                                    : {
                                        ...p,
                                        rightHandItem: opt.id,
                                        leftHandItem:
                                          p.leftHandItem === 'slogan' ? 'none' : p.leftHandItem,
                                      }
                                );
                              }}
                              className={`py-1.5 rounded-lg border text-[10px] font-bold transition ${
                                !isUnlocked
                                  ? 'bg-slate-950 border-white/5 text-slate-600'
                                  : myProfile.rightHandItem === opt.id
                                  ? 'bg-sky-500/25 border-sky-400 text-white'
                                  : 'bg-slate-900 border-white/10 text-slate-400'
                              }`}
                            >
                              {isUnlocked ? opt.label : `🔒 ${reqDay}일`}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    10. 공식 다이아 응원봉 발광 컬러
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {LIGHTSTICK_PALETTE.map((c) => {
                      const isUnlocked = answeredCount >= c.unlockDay;
                      return (
                        <button
                          key={c.hex}
                          onClick={() => {
                            if (!isUnlocked) {
                              showToast(
                                `🔒 어드벤트 ${c.unlockDay}일차 질문에 답변하면 [${c.name}] 응원봉 컬러가 열립니다!`
                              );
                              return;
                            }
                            setMyProfile((p) => ({ ...p, lightstickColor: c.hex }));
                          }}
                          className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition ${
                            !isUnlocked
                              ? 'border-white/5 bg-slate-950/70 text-slate-500 opacity-75'
                              : myProfile.lightstickColor === c.hex
                              ? 'border-sky-400 bg-sky-500/20 text-white'
                              : 'border-white/10 bg-slate-800/60 text-slate-300'
                          }`}
                        >
                          {isUnlocked ? (
                            <span
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: c.hex }}
                            />
                          ) : (
                            <Lock className="w-3 h-3 text-amber-400/80" />
                          )}
                          <span>{c.name}</span>
                          {!isUnlocked && (
                            <span className="text-[10px] text-amber-300">{c.unlockDay}일</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <button
                  onClick={() => {
                    setActiveModal('none');
                    showToast('✨ 공식 MD 아바타 착장이 적용되었습니다!');
                  }}
                  className="w-full py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-sm font-extrabold text-white transition"
                >
                  착장 완료 및 돌아가기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================== */}
      {/* 모달 5: KSPO DOME 인터랙티브 360° 좌석배치도 & 구역 즉시 이동            */}
      {/* ====================================================================== */}
      {activeModal === 'seatmap' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-md">
          <div className="w-full max-w-4xl max-h-[92vh] flex flex-col rounded-3xl bg-slate-900 border border-sky-400/35 shadow-2xl overflow-hidden">
            {/* 모달 헤더 */}
            <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-blue-950/80 to-slate-900">
              <div>
                <h2 className="text-base sm:text-lg font-extrabold text-white flex items-center gap-2">
                  <LayoutGrid className="w-5 h-5 text-sky-400" />
                  <span>KSPO DOME 좌석배치도 · 구역 선택</span>
                </h2>
                <p className="text-[11px] sm:text-xs text-blue-200/80 mt-0.5">
                  원하는 구역을 클릭하면 내 지정 좌석으로 설정되고 3D 공연장 해당 구역으로 즉시 이동합니다!
                </p>
              </div>
              <button
                onClick={() => setActiveModal('none')}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/15 text-slate-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 본문: 좌측 인터랙티브 SVG 배치도 + 우측 등급별 빠른 선택 */}
            <div className="p-4 sm:p-5 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
              {/* SVG 원형 아레나 배치도 */}
              <div className="lg:col-span-7 flex flex-col items-center">
                <div className="w-full max-w-[460px] rounded-2xl bg-slate-950/90 border border-white/10 p-2 sm:p-3 shadow-inner">
                  <svg viewBox="0 0 640 560" className="w-full h-auto select-none">
                    {/* 배경 외곽 돔 링 */}
                    <circle
                      cx="320"
                      cy="290"
                      r="254"
                      fill="#0b1220"
                      stroke="#1e293b"
                      strokeWidth="3"
                    />

                    {/* 계단형 MAIN STAGE (실제 배치도 형태) */}
                    <path
                      d="M 238 22 L 402 22 L 402 36 L 424 36 L 424 52 L 456 52 L 456 96 L 184 96 L 184 52 L 216 52 L 216 36 L 238 36 Z"
                      fill="#1e293b"
                      stroke="#38bdf8"
                      strokeWidth="2"
                    />
                    <text
                      x="320"
                      y="68"
                      textAnchor="middle"
                      fill="#e0f2fe"
                      fontSize="16"
                      fontWeight="900"
                    >
                      STAGE
                    </text>

                    {/* 2F A석 (43 ~ 24구역) */}
                    {ARENA_SECTIONS.filter((s) => s.tier === '2F').map((sec, idx, arr) => {
                      const cx = 320;
                      const cy = 290;
                      const rIn = 196;
                      const rOut = 242;
                      const t = idx / (arr.length - 1);
                      const centerAng = Math.PI * (1.16 - t * 1.32);
                      const halfStep = (Math.PI * 1.32) / (arr.length - 1) / 2.15;
                      const a1 = centerAng + halfStep;
                      const a2 = centerAng - halfStep;

                      const x1In = cx + Math.cos(a1) * rIn;
                      const y1In = cy + Math.sin(a1) * rIn;
                      const x2In = cx + Math.cos(a2) * rIn;
                      const y2In = cy + Math.sin(a2) * rIn;
                      const x1Out = cx + Math.cos(a1) * rOut;
                      const y1Out = cy + Math.sin(a1) * rOut;
                      const x2Out = cx + Math.cos(a2) * rOut;
                      const y2Out = cy + Math.sin(a2) * rOut;

                      const labelR = (rIn + rOut) / 2;
                      const lx = cx + Math.cos(centerAng) * labelR;
                      const ly = cy + Math.sin(centerAng) * labelR;
                      const isSelected = myProfile.seatZone === sec.label;
                      const numText = sec.id.replace('2F-', '');

                      const d = [
                        `M ${x1In.toFixed(1)} ${y1In.toFixed(1)}`,
                        `L ${x1Out.toFixed(1)} ${y1Out.toFixed(1)}`,
                        `A ${rOut} ${rOut} 0 0 0 ${x2Out.toFixed(1)} ${y2Out.toFixed(1)}`,
                        `L ${x2In.toFixed(1)} ${y2In.toFixed(1)}`,
                        `A ${rIn} ${rIn} 0 0 1 ${x1In.toFixed(1)} ${y1In.toFixed(1)}`,
                        'Z',
                      ].join(' ');

                      return (
                        <g
                          key={sec.id}
                          onClick={() => {
                            setMyProfile((p) => ({ ...p, seatZone: sec.label }));
                            setActiveModal('none');
                            switchViewMode('arena', sec.label);
                          }}
                          className="cursor-pointer hover:opacity-90 transition-opacity"
                        >
                          <path
                            d={d}
                            fill={isSelected ? '#f59e0b' : '#0e749b'}
                            stroke={isSelected ? '#ffffff' : '#0f172a'}
                            strokeWidth={isSelected ? '2.5' : '1.5'}
                          />
                          <text
                            x={lx}
                            y={ly + 4}
                            textAnchor="middle"
                            fill="#ffffff"
                            fontSize="11"
                            fontWeight="800"
                          >
                            {numText}
                          </text>
                        </g>
                      );
                    })}

                    {/* 1F S석 (15 ~ 1구역) */}
                    {ARENA_SECTIONS.filter((s) => s.tier === '1F').map((sec, idx, arr) => {
                      const cx = 320;
                      const cy = 290;
                      const rIn = 146;
                      const rOut = 188;
                      const t = idx / (arr.length - 1);
                      const centerAng = Math.PI * (1.14 - t * 1.28);
                      const halfStep = (Math.PI * 1.28) / (arr.length - 1) / 2.15;
                      const a1 = centerAng + halfStep;
                      const a2 = centerAng - halfStep;

                      const x1In = cx + Math.cos(a1) * rIn;
                      const y1In = cy + Math.sin(a1) * rIn;
                      const x2In = cx + Math.cos(a2) * rIn;
                      const y2In = cy + Math.sin(a2) * rIn;
                      const x1Out = cx + Math.cos(a1) * rOut;
                      const y1Out = cy + Math.sin(a1) * rOut;
                      const x2Out = cx + Math.cos(a2) * rOut;
                      const y2Out = cy + Math.sin(a2) * rOut;

                      const labelR = (rIn + rOut) / 2;
                      const lx = cx + Math.cos(centerAng) * labelR;
                      const ly = cy + Math.sin(centerAng) * labelR;
                      const isSelected = myProfile.seatZone === sec.label;
                      const numText = sec.id.replace('1F-', '');

                      const d = [
                        `M ${x1In.toFixed(1)} ${y1In.toFixed(1)}`,
                        `L ${x1Out.toFixed(1)} ${y1Out.toFixed(1)}`,
                        `A ${rOut} ${rOut} 0 0 0 ${x2Out.toFixed(1)} ${y2Out.toFixed(1)}`,
                        `L ${x2In.toFixed(1)} ${y2In.toFixed(1)}`,
                        `A ${rIn} ${rIn} 0 0 1 ${x1In.toFixed(1)} ${y1In.toFixed(1)}`,
                        'Z',
                      ].join(' ');

                      return (
                        <g
                          key={sec.id}
                          onClick={() => {
                            setMyProfile((p) => ({ ...p, seatZone: sec.label }));
                            setActiveModal('none');
                            switchViewMode('arena', sec.label);
                          }}
                          className="cursor-pointer hover:opacity-90 transition-opacity"
                        >
                          <path
                            d={d}
                            fill={isSelected ? '#f59e0b' : '#38bdf8'}
                            stroke={isSelected ? '#ffffff' : '#0f172a'}
                            strokeWidth={isSelected ? '2.5' : '1.5'}
                          />
                          <text
                            x={lx}
                            y={ly + 4}
                            textAnchor="middle"
                            fill="#0f172a"
                            fontSize="11"
                            fontWeight="900"
                          >
                            {numText}
                          </text>
                        </g>
                      );
                    })}

                    {/* FLOOR 뛰 (C ~ J구역) */}
                    {ARENA_SECTIONS.filter(
                      (s) => s.tier === 'FLOOR' && s.id !== 'FLOOR-A' && s.id !== 'FLOOR-B'
                    ).map((sec, idx, arr) => {
                      const cx = 320;
                      const cy = 200;
                      const rIn = 118;
                      const rOut = 148;
                      const t = idx / (arr.length - 1);
                      const centerAng = Math.PI * (0.95 - t * 0.9);
                      const halfStep = (Math.PI * 0.9) / (arr.length - 1) / 2.2;
                      const a1 = centerAng + halfStep;
                      const a2 = centerAng - halfStep;

                      const x1In = cx + Math.cos(a1) * rIn;
                      const y1In = cy + Math.sin(a1) * rIn;
                      const x2In = cx + Math.cos(a2) * rIn;
                      const y2In = cy + Math.sin(a2) * rIn;
                      const x1Out = cx + Math.cos(a1) * rOut;
                      const y1Out = cy + Math.sin(a1) * rOut;
                      const x2Out = cx + Math.cos(a2) * rOut;
                      const y2Out = cy + Math.sin(a2) * rOut;

                      const labelR = (rIn + rOut) / 2;
                      const lx = cx + Math.cos(centerAng) * labelR;
                      const ly = cy + Math.sin(centerAng) * labelR;
                      const isSelected = myProfile.seatZone === sec.label;
                      const letter = sec.id.replace('FLOOR-', '');

                      const d = [
                        `M ${x1In.toFixed(1)} ${y1In.toFixed(1)}`,
                        `L ${x1Out.toFixed(1)} ${y1Out.toFixed(1)}`,
                        `A ${rOut} ${rOut} 0 0 0 ${x2Out.toFixed(1)} ${y2Out.toFixed(1)}`,
                        `L ${x2In.toFixed(1)} ${y2In.toFixed(1)}`,
                        `A ${rIn} ${rIn} 0 0 1 ${x1In.toFixed(1)} ${y1In.toFixed(1)}`,
                        'Z',
                      ].join(' ');

                      return (
                        <g
                          key={sec.id}
                          onClick={() => {
                            setMyProfile((p) => ({ ...p, seatZone: sec.label }));
                            setActiveModal('none');
                            switchViewMode('arena', sec.label);
                          }}
                          className="cursor-pointer hover:opacity-90 transition-opacity"
                        >
                          <path
                            d={d}
                            fill={isSelected ? '#f59e0b' : '#6366f1'}
                            stroke={isSelected ? '#ffffff' : '#0f172a'}
                            strokeWidth={isSelected ? '2.5' : '1.5'}
                          />
                          <text
                            x={lx}
                            y={ly + 4}
                            textAnchor="middle"
                            fill="#ffffff"
                            fontSize="11"
                            fontWeight="800"
                          >
                            {letter}
                          </text>
                        </g>
                      );
                    })}

                    {/* 반원 닻(⚓) 모양 돌출 무대: 중앙 직선 통로 + 열린 하단 반원 아크 */}
                    {/* 중앙 직선 통로 (닻 기둥) */}
                    <rect
                      x="308"
                      y="96"
                      width="24"
                      height="196"
                      fill="#1e293b"
                      stroke="#38bdf8"
                      strokeWidth="1.8"
                    />
                    {/* 열린 하단 반원 아크 (닻 갈고리: 중심 (320, 192), 반지름 100) */}
                    <path
                      d="M 220 192 A 100 100 0 0 0 420 192"
                      fill="none"
                      stroke="#1e293b"
                      strokeWidth="20"
                      strokeLinecap="butt"
                    />
                    <path
                      d="M 210 192 A 110 110 0 0 0 430 192"
                      fill="none"
                      stroke="#38bdf8"
                      strokeWidth="1.8"
                    />
                    <path
                      d="M 230 192 A 90 90 0 0 0 410 192"
                      fill="none"
                      stroke="#38bdf8"
                      strokeWidth="1.8"
                    />
                    {/* 반원 아크 양 끝단 마감선 */}
                    <line x1="210" y1="192" x2="230" y2="192" stroke="#38bdf8" strokeWidth="1.8" />
                    <line x1="410" y1="192" x2="430" y2="192" stroke="#38bdf8" strokeWidth="1.8" />

                    {/* FLOOR A / B 상단 여백 안내 텍스트 */}
                    <text
                      x="198"
                      y="174"
                      textAnchor="middle"
                      fill="#94a3b8"
                      fontSize="10"
                      fontWeight="800"
                    >
                      FLOOR
                    </text>
                    <text
                      x="442"
                      y="174"
                      textAnchor="middle"
                      fill="#94a3b8"
                      fontSize="10"
                      fontWeight="800"
                    >
                      FLOOR
                    </text>

                    {/* FLOOR 에 (A구역) — 닻 좌측 안쪽 4분원 부채꼴 */}
                    {(() => {
                      const secA = ARENA_SECTIONS.find((s) => s.id === 'FLOOR-A')!;
                      const isSelA = myProfile.seatZone === secA.label;
                      return (
                        <g
                          onClick={() => {
                            setMyProfile((p) => ({ ...p, seatZone: secA.label }));
                            setActiveModal('none');
                            switchViewMode('arena', secA.label);
                          }}
                          className="cursor-pointer hover:opacity-90"
                        >
                          <path
                            d="M 238 192 A 82 82 0 0 0 302 272 L 302 192 Z"
                            fill={isSelA ? '#f59e0b' : '#3b82f6'}
                            stroke="#7dd3fc"
                            strokeWidth={isSelA ? '2.5' : '1.5'}
                          />
                          <rect x="256" y="176" width="28" height="20" rx="10" fill="#0284c7" />
                          <text
                            x="270"
                            y="190"
                            textAnchor="middle"
                            fill="#ffffff"
                            fontSize="11"
                            fontWeight="900"
                          >
                            에
                          </text>
                          <text
                            x="276"
                            y="232"
                            textAnchor="middle"
                            fill="#ffffff"
                            fontSize="13"
                            fontWeight="900"
                          >
                            A
                          </text>
                        </g>
                      );
                    })()}

                    {/* FLOOR 바 (B구역) — 닻 우측 안쪽 4분원 부채꼴 */}
                    {(() => {
                      const secB = ARENA_SECTIONS.find((s) => s.id === 'FLOOR-B')!;
                      const isSelB = myProfile.seatZone === secB.label;
                      return (
                        <g
                          onClick={() => {
                            setMyProfile((p) => ({ ...p, seatZone: secB.label }));
                            setActiveModal('none');
                            switchViewMode('arena', secB.label);
                          }}
                          className="cursor-pointer hover:opacity-90"
                        >
                          <path
                            d="M 338 192 L 338 272 A 82 82 0 0 0 402 192 Z"
                            fill={isSelB ? '#f59e0b' : '#0284c7'}
                            stroke="#5eead4"
                            strokeWidth={isSelB ? '2.5' : '1.5'}
                          />
                          <rect x="356" y="176" width="28" height="20" rx="10" fill="#0d9488" />
                          <text
                            x="370"
                            y="190"
                            textAnchor="middle"
                            fill="#ffffff"
                            fontSize="11"
                            fontWeight="900"
                          >
                            바
                          </text>
                          <text
                            x="364"
                            y="232"
                            textAnchor="middle"
                            fill="#ffffff"
                            fontSize="13"
                            fontWeight="900"
                          >
                            B
                          </text>
                        </g>
                      );
                    })()}

                    {/* 뛰 배지 (반원 닻 최하단 포인트) */}
                    <rect x="304" y="294" width="32" height="20" rx="10" fill="#7c3aed" />
                    <text
                      x="320"
                      y="308"
                      textAnchor="middle"
                      fill="#ffffff"
                      fontSize="11"
                      fontWeight="900"
                    >
                      뛰
                    </text>

                    {/* CONSOLE 부스 */}
                    <rect
                      x="275"
                      y="360"
                      width="90"
                      height="24"
                      rx="6"
                      fill="#334155"
                      stroke="#64748b"
                      strokeWidth="1.2"
                    />
                    <text
                      x="320"
                      y="376"
                      textAnchor="middle"
                      fill="#cbd5e1"
                      fontSize="10"
                      fontWeight="800"
                    >
                      CONSOLE
                    </text>
                  </svg>
                </div>

                {/* 범례 */}
                <div className="mt-2.5 flex flex-wrap items-center justify-center gap-3 text-[11px] text-slate-300">
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-sm bg-blue-500 inline-block" />
                    FLOOR R석 (에·바·뛰)
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-sm bg-sky-400 inline-block" />
                    1F S석 (1~15구역)
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-sm bg-cyan-700 inline-block" />
                    2F A석 (24~43구역)
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-sm bg-amber-500 inline-block" />
                    현재 내 구역
                  </span>
                </div>
              </div>

              {/* 우측: 등급별 빠른 구역 리스트 */}
              <div className="lg:col-span-5 space-y-3">
                <div className="p-3.5 rounded-2xl bg-blue-950/50 border border-blue-400/30">
                  <div className="text-[11px] font-bold text-sky-300">현재 선택된 나의 구역</div>
                  <div className="text-sm font-extrabold text-white mt-0.5">
                    {myProfile.seatZone}
                  </div>
                </div>

                {/* FLOOR R석 */}
                <div>
                  <div className="text-xs font-extrabold text-blue-300 mb-1.5">
                    FLOOR · R석 (의탠딩석 · 에 / 바 / 뛰)
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {ARENA_SECTIONS.filter((s) => s.tier === 'FLOOR').map((sec) => (
                      <button
                        key={sec.id}
                        onClick={() => {
                          setMyProfile((p) => ({ ...p, seatZone: sec.label }));
                          setActiveModal('none');
                          switchViewMode('arena', sec.label);
                        }}
                        className={`px-2.5 py-1.5 rounded-xl text-xs font-bold border transition ${
                          myProfile.seatZone === sec.label
                            ? 'bg-amber-500 border-white text-slate-950'
                            : 'bg-slate-800/80 border-white/10 text-slate-200 hover:bg-blue-600'
                        }`}
                      >
                        {sec.badge} ({sec.id.replace('FLOOR-', '')})
                      </button>
                    ))}
                  </div>
                </div>

                {/* 1F S석 */}
                <div>
                  <div className="text-xs font-extrabold text-sky-300 mb-1.5">
                    1F · S석 (1 ~ 15구역)
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {ARENA_SECTIONS.filter((s) => s.tier === '1F').map((sec) => (
                      <button
                        key={sec.id}
                        onClick={() => {
                          setMyProfile((p) => ({ ...p, seatZone: sec.label }));
                          setActiveModal('none');
                          switchViewMode('arena', sec.label);
                        }}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition ${
                          myProfile.seatZone === sec.label
                            ? 'bg-amber-500 border-white text-slate-950'
                            : 'bg-slate-800/80 border-white/10 text-slate-200 hover:bg-sky-500 hover:text-slate-950'
                        }`}
                      >
                        {sec.id.replace('1F-', '')}구역
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2F A석 */}
                <div>
                  <div className="text-xs font-extrabold text-cyan-300 mb-1.5">
                    2F · A석 (24 ~ 43구역)
                  </div>
                  <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1">
                    {ARENA_SECTIONS.filter((s) => s.tier === '2F').map((sec) => (
                      <button
                        key={sec.id}
                        onClick={() => {
                          setMyProfile((p) => ({ ...p, seatZone: sec.label }));
                          setActiveModal('none');
                          switchViewMode('arena', sec.label);
                        }}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition ${
                          myProfile.seatZone === sec.label
                            ? 'bg-amber-500 border-white text-slate-950'
                            : 'bg-slate-800/80 border-white/10 text-slate-200 hover:bg-cyan-600'
                        }`}
                      >
                        {sec.id.replace('2F-', '')}구역
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================== */}
      {/* 모달 6: 에바뛰 미니게임 2종 아케이드 허브                                */}
      {/* ====================================================================== */}
      {/* 모달 6: 오리지널 에바뛰 미니게임 2종 (무한 달리기 · 천국의 계단)           */}
      {/* ====================================================================== */}
      {activeModal === 'minigames' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-md">
          <div className="w-full max-w-2xl max-h-[92vh] flex flex-col rounded-3xl bg-slate-900 border border-sky-400/35 shadow-2xl overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-blue-950/90 to-slate-900">
              <div>
                <h2 className="text-base sm:text-lg font-extrabold text-white flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-amber-300" />
                  <span>EBDD 에바뛰 미니게임 2종</span>
                </h2>
                <p className="text-[11px] sm:text-xs text-blue-200/85 mt-0.5 flex flex-wrap items-center gap-2">
                  <span>{getEbddBadgeName(ebddJumps)}</span>
                  <span className="text-amber-300 font-extrabold flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5" />
                    누적 {ebddJumps.toLocaleString()} 에바뛰
                  </span>
                </p>
              </div>
              <button
                onClick={() => setActiveModal('none')}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/15 text-slate-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 2종 미니게임 전환 탭 */}
            <div className="px-4 pt-3 flex flex-wrap gap-1.5 sm:gap-2 border-b border-white/10 bg-slate-900/70">
              <button
                onClick={() => setMiniGameTab('run')}
                className={`px-3 py-2.5 text-xs sm:text-sm font-extrabold border-b-2 transition ${
                  miniGameTab === 'run'
                    ? 'border-pink-400 text-pink-300'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                🏃 1. 무한 달리기 ({runBestScore})
              </button>
              <button
                onClick={() => setMiniGameTab('roof')}
                className={`px-3 py-2.5 text-xs sm:text-sm font-extrabold border-b-2 transition ${
                  miniGameTab === 'roof'
                    ? 'border-cyan-400 text-cyan-300'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                ☁️ 2. 천국의 계단 ({roofBestScore}M)
              </button>
            </div>

            <div className="p-4 sm:p-5 overflow-y-auto flex-1">
              {miniGameTab === 'run' ? (
                <MiniGameRun
                  avatarLook={{
                    hoodieColor: myProfile.hoodieColor,
                    lightstickColor: myProfile.lightstickColor,
                    hairStyle: myProfile.hairStyle,
                    capStyle: myProfile.capStyle,
                    leftHandItem: myProfile.leftHandItem,
                    rightHandItem: myProfile.rightHandItem,
                  }}
                  bestScore={runBestScore}
                  onAddJumps={handleAddEbddJumps}
                  onUpdateBestScore={handleUpdateRunBest}
                  onRewardToast={showToast}
                />
              ) : (
                <MiniGameRoofBreaker
                  avatarLook={{
                    hoodieColor: myProfile.hoodieColor,
                    lightstickColor: myProfile.lightstickColor,
                    hairStyle: myProfile.hairStyle,
                    capStyle: myProfile.capStyle,
                    leftHandItem: myProfile.leftHandItem,
                    rightHandItem: myProfile.rightHandItem,
                  }}
                  bestScore={roofBestScore}
                  onAddJumps={handleAddEbddJumps}
                  onUpdateBestScore={handleUpdateRoofBest}
                  onRewardToast={showToast}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;