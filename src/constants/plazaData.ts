import { ARENA_SECTIONS } from './arenaSections';
import type {
  AdventDailyItem,
  CapStyle,
  DomeAlbumSpineInfo,
  FanPeer,
  HairStyle,
  HandItemType,
  OutfitStyle,
  PlazaMemo,
} from '../types/plaza';

export const MAX_ROOM_CAPACITY = 30;
export const PLAZA_GROUND_RADIUS = 58;
export const TRACK_CENTER_X = 0;
export const TRACK_CENTER_Z = 12;
export const LANE_RADII = [14.2, 15.2, 16.2, 17.2, 18.2];

export function getLanePosition(laneIdx: number, angle: number): { x: number; z: number } {
  const safeIdx = Math.max(0, Math.min(LANE_RADII.length - 1, laneIdx));
  const r = LANE_RADII[safeIdx];
  return {
    x: TRACK_CENTER_X + Math.cos(angle) * r,
    z: TRACK_CENTER_Z + Math.sin(angle) * r,
  };
}

export const PLAZA_BENCHES: Array<{ id: number; x: number; z: number; rot: number }> = [
  { id: 1, x: -6.5, z: 7.5, rot: Math.PI / 3 },
  { id: 2, x: 6.5, z: 7.5, rot: -Math.PI / 3 },
  { id: 3, x: -6.5, z: 16.5, rot: (Math.PI * 2) / 3 },
  { id: 4, x: 6.5, z: 16.5, rot: -(Math.PI * 2) / 3 },
];

export function getConcertDDay(): number {
  const target = new Date('2027-02-20T00:00:00+09:00').getTime();
  const now = Date.now();
  return Math.max(0, Math.ceil((target - now) / (1000 * 60 * 60 * 24)));
}

export const ROOM_LIST = [
  {
    id: 1,
    name: '1레인',
    desc: '',
    baseCount: 9,
    spawnAngle: Math.PI * 0.5,
    accentHex: '#38bdf8',
  },
  {
    id: 2,
    name: '2레인',
    desc: '',
    baseCount: 8,
    spawnAngle: Math.PI * 0.36,
    accentHex: '#60a5fa',
  },
  {
    id: 3,
    name: '3레인',
    desc: '',
    baseCount: 10,
    spawnAngle: Math.PI * 0.64,
    accentHex: '#f472b6',
  },
  {
    id: 4,
    name: '4레인',
    desc: '',
    baseCount: 6,
    spawnAngle: Math.PI * 0.22,
    accentHex: '#818cf8',
  },
  {
    id: 5,
    name: '5레인',
    desc: '',
    baseCount: 8,
    spawnAngle: Math.PI * 0.78,
    accentHex: '#fbbf24',
  },
];

export interface AudioTrackItem {
  title: string;
  src: string;
  duration: number;
}

export const PLAZA_AUDIO_TRACK: AudioTrackItem = {
  title: '달리기 (광장 BGM)',
  src: './assets/aistudio/CNBLUE______________________Special_Clip_4463e805.mp3',
  duration: 185.913458,
};

export const ARENA_AUDIO_TRACKS: AudioTrackItem[] = [
  {
    title: '공연장 LIVE TRACK 01',
    src: './assets/aistudio/track-01_d0e9c2d5.mp3',
    duration: 275.952,
  },
  {
    title: '공연장 LIVE TRACK 02',
    src: './assets/aistudio/track-02_eea6f051.mp3',
    duration: 322.896,
  },
  {
    title: '공연장 LIVE TRACK 03',
    src: './assets/aistudio/track-03_3f96aa9e.mp3',
    duration: 270.552,
  },
];

export const AUDIO_TRACKS = ARENA_AUDIO_TRACKS;

export function getLiveRadioState(
  mode: 'plaza' | 'arena',
  nowMs: number = Date.now()
): { trackIndex: number; track: AudioTrackItem; currentTime: number } {
  const nowSec = nowMs / 1000;
  if (mode === 'plaza') {
    const dur = PLAZA_AUDIO_TRACK.duration;
    const currentTime = ((nowSec % dur) + dur) % dur;
    return {
      trackIndex: 0,
      track: PLAZA_AUDIO_TRACK,
      currentTime,
    };
  }

  const totalDur = ARENA_AUDIO_TRACKS.reduce((sum, t) => sum + t.duration, 0);
  let cursor = ((nowSec % totalDur) + totalDur) % totalDur;
  for (let i = 0; i < ARENA_AUDIO_TRACKS.length; i++) {
    const t = ARENA_AUDIO_TRACKS[i];
    if (cursor < t.duration || i === ARENA_AUDIO_TRACKS.length - 1) {
      return {
        trackIndex: i,
        track: t,
        currentTime: Math.max(0, Math.min(cursor, t.duration - 0.1)),
      };
    }
    cursor -= t.duration;
  }

  return {
    trackIndex: 0,
    track: ARENA_AUDIO_TRACKS[0],
    currentTime: 0,
  };
}

export const OUTFIT_OPTIONS: Array<{
  id: OutfitStyle;
  name: string;
  desc: string;
  baseHex: string;
}> = [
  {
    id: 'track_jacket',
    name: '화이트 트랙 자켓',
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

export const CAP_OPTIONS: Array<{ id: CapStyle; name: string; swatch: string }> = [
  { id: 'official_cap', name: '화이트 데님 캡', swatch: '#f1f5f9' },
  { id: 'navy_cap', name: '딥네이비 볼캡', swatch: '#1e3a8a' },
  { id: 'none', name: '착용 안 함', swatch: '#475569' },
];

export const HAIR_OPTIONS: Array<{ id: HairStyle; name: string; desc: string }> = [
  { id: 'long', name: '긴 생머리', desc: '어깨 아래로 흐르는 롱헤어' },
  { id: 'ponytail', name: '포니테일', desc: '달릴 때 살랑이는 리본 포니테일' },
  { id: 'short', name: '스포티 숏컷', desc: '깔끔하고 경쾌한 짧은 머리' },
];

export const LIGHTSTICK_PALETTE = [
  { name: '블루', hex: '#2563eb', unlockDay: 1 },
  { name: '스카이블루', hex: '#38bdf8', unlockDay: 9 },
  { name: '화이트', hex: '#e0f2fe', unlockDay: 10 },
  { name: '골드', hex: '#fbbf24', unlockDay: 11 },
  { name: '핑크', hex: '#f472b6', unlockDay: 12 },
  { name: '레드', hex: '#ef4444', unlockDay: 13 },
];

// 어드벤트 질문 답변 누적 횟수에 따라 순차 획득하는 착용 MD 아이템 로드맵
export const ADVENT_UNLOCK_MILESTONES: Array<{
  day: number;
  label: string;
  shortName: string;
  icon: string;
}> = [
  { day: 1, label: '💎 뛰봉', shortName: '뛰봉', icon: '💎' },
  { day: 2, label: '🪭 에.바.뛰. 부채', shortName: '에.바.뛰. 부채', icon: '🪭' },
  { day: 3, label: '🧢 화이트 데님 캡', shortName: '화이트 데님 캡', icon: '🧢' },
  { day: 4, label: '💙 CNBLUE 슬로건', shortName: 'CNBLUE 양손 슬로건', icon: '💙' },
  { day: 5, label: '🧥 트랙 자켓', shortName: '화이트 트랙 자켓', icon: '🧥' },
  { day: 6, label: '🧢 네이비 볼캡', shortName: '딥네이비 볼캡', icon: '🧢' },
  { day: 7, label: '👕 네이비 티셔츠', shortName: '네이비 투어 티셔츠', icon: '👕' },
  { day: 8, label: '👕 스카이블루 티셔츠', shortName: '스카이블루 보이스 티', icon: '👕' },
  { day: 9, label: '✨ 뛰봉 · 스카이블루', shortName: '뛰봉 스카이블루', icon: '✨' },
  { day: 10, label: '❄️ 뛰봉 · 화이트', shortName: '뛰봉 화이트', icon: '❄️' },
  { day: 11, label: '🌟 뛰봉 · 골드', shortName: '뛰봉 골드', icon: '🌟' },
  { day: 12, label: '🌸 뛰봉 · 핑크', shortName: '뛰봉 핑크', icon: '🌸' },
  { day: 13, label: '❤️ 뛰봉 · 레드', shortName: '뛰봉 레드', icon: '❤️' },
];

export const OUTFIT_UNLOCK_DAY: Record<OutfitStyle, number> = {
  white_tee: 0,
  track_jacket: 5,
  navy_tee: 7,
  sky_tee: 8,
};

export const CAP_UNLOCK_DAY: Record<CapStyle, number> = {
  none: 0,
  official_cap: 3,
  navy_cap: 6,
};

export const HAND_ITEM_UNLOCK_DAY: Record<HandItemType, number> = {
  none: 0,
  lightstick: 1,
  fan: 2,
  slogan: 4,
};

export const FLOWER_COLORS = [
  { name: '레드', hex: '#ef4444' },
  { name: '오렌지', hex: '#f97316' },
  { name: '옐로우', hex: '#facc15' },
  { name: '라임', hex: '#84cc16' },
  { name: '그린', hex: '#22c55e' },
  { name: '민트', hex: '#14b8a6' },
  { name: '스카이', hex: '#38bdf8' },
  { name: '블루', hex: '#2563eb' },
  { name: '퍼플', hex: '#8b5cf6' },
  { name: '핑크', hex: '#f472b6' },
];

export const INITIAL_MEMOS: PlazaMemo[] = [];

export const NPC_NAMES = [
  '나잇러너',
  '에바뛰장인',
  '체조요정',
  '꽃이었다',
  '씨엔블루가조타',
  '밍',
  '정신이있니',
  '보이스1기',
  '파란물결',
  '떼창마스터',
  '뛰봉',
  '달려라보이스',
  '스탠딩줘세요',
  '앵콜외쳐라',
  '올공산책러',
  '뇽뇽뇽',
  '트랙질주',
  '기타리프',
  '청춘밴드',
  '잉마헷',
];

export const NPC_SPEECHES = [
  '에바뛰콘 전석 매진 대박!! 💙',
  '180도 개방에 돌출무대까지 최고✨',
  '다음번엔 360도 콘서트 가자!! 🔥',
  '다 같이 에바뛰 해요 🏃‍♂️',
  '그러나, 꽃이었다 최고 🌸',
  'MD 풀착장 완료!',
  '체조경기장 뚜껑 날리러 가보자고🔥',
  '돌출무대 완전 가까워요✨',
  '팀 씨엔블루 영원하자💎',
];

export function createRoomNpcs(roomId: number, count: number): FanPeer[] {
  const safeCount = Math.max(0, Math.min(MAX_ROOM_CAPACITY - 1, count));
  const result: FanPeer[] = [];
  const outfitIds: OutfitStyle[] = ['track_jacket', 'white_tee', 'navy_tee', 'sky_tee'];
  const capIds: CapStyle[] = ['official_cap', 'navy_cap', 'none'];
  const hairIds: HairStyle[] = ['long', 'ponytail', 'short'];

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

export const DAILY_CONCERT_QUESTIONS: string[] = [
  '에바뛰콘 소식을 처음 들었을 때 가장 먼저 든 생각은 무엇인가요?',
  '에바뛰콘 오프닝 첫 곡이었으면 하는 노래는?',
  '씨엔블루 노래 중 가장 처음 들었던 곡은 무엇인가요?',
  '매일 들어도 절대 질리지 않는 나만의 최애곡은?',
  '내가 보이스(BOICE)가 된 운명적인 계기는?',
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
  '뛰봉을 처음 켰을 때의 기분은 어땠나요?',
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
  '본 공연 마지막을 장식했으면 하는 노래는?',
  '비 오는 날 꼭 생각나는 씨엔블루 노래는?',
  '앵콜 첫 곡으로 듣고 싶은 노래는 무엇인가요?',
  '앵앵앵콜까지 끝없이 뛰어놀고 싶은 신나는 곡은?',
  '돌출무대로 멤버들이 다가올 때 외치고 싶은 말은?',
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
  '드디어 에바뛰콘 DAY 1! 영원히 함께 달려갈 씨엔블루에게 보내는 사랑의 메시지 💙',
  '에바뛰콘 DAY 2 파이널! 이틀간의 뜨거운 여운과 씨엔블루에게 남기는 마지막 인사 💙',
];

export const ADVENT_START_DATE = '2026-11-26';
export const ADVENT_CONCERT_DATES = ['2027-02-20', '2027-02-21'] as const;
export const ADVENT_END_DATE = '2027-02-21';

export function getKstTodayStr(): string {
  const now = new Date();
  const kstMs = now.getTime() + 9 * 60 * 60 * 1000;
  const kst = new Date(kstMs);
  const y = kst.getUTCFullYear();
  const m = String(kst.getUTCMonth() + 1).padStart(2, '0');
  const d = String(kst.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export type BandMemberId = 'yonghwa' | 'minhyuk' | 'jungshin';

export interface MemberTimeScheduleItem {
  id: BandMemberId;
  hours: readonly [number, number];
  minute: number;
  timeLabel: string;
  emoji: string;
  nameKo: string;
  runQuoteKo: string;
}

export const MEMBER_TIME_SCHEDULES: readonly MemberTimeScheduleItem[] = [
  {
    id: 'yonghwa',
    hours: [6, 18],
    minute: 22,
    timeLabel: '06:22',
    emoji: '🎸',
    nameKo: '정용화',
    runQuoteKo: '같이 에바뛰 해요!! 🏃‍♂️🔥',
  },
  {
    id: 'minhyuk',
    hours: [6, 18],
    minute: 28,
    timeLabel: '06:28',
    emoji: '🥁',
    nameKo: '강민혁',
    runQuoteKo: '오늘도 힘차게 달려요!! 🥁💙',
  },
  {
    id: 'jungshin',
    hours: [9, 21],
    minute: 15,
    timeLabel: '09:15',
    emoji: '🎸',
    nameKo: '이정신',
    runQuoteKo: '끝까지 같이 뛰어보자!! 🏃‍♂️✨',
  },
] as const;

export function getKstClockParts(nowMs: number = Date.now()): {
  dateStr: string;
  hour: number;
  minute: number;
  second: number;
} {
  const kst = new Date(nowMs + 9 * 60 * 60 * 1000);
  const y = kst.getUTCFullYear();
  const m = String(kst.getUTCMonth() + 1).padStart(2, '0');
  const d = String(kst.getUTCDate()).padStart(2, '0');
  return {
    dateStr: `${y}-${m}-${d}`,
    hour: kst.getUTCHours(),
    minute: kst.getUTCMinutes(),
    second: kst.getUTCSeconds(),
  };
}

export const ADVENT_DAILY_LIST: AdventDailyItem[] = (() => {
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

  for (let i = 0; i < totalDays; i++) {
    const cur = new Date(start.getTime() + i * 24 * 60 * 60 * 1000);
    const year = cur.getUTCFullYear();
    const month = cur.getUTCMonth() + 1;
    const day = cur.getUTCDate();
    const dow = cur.getUTCDay();
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const monthKey = `${year}-${String(month).padStart(2, '0')}`;
    // 2027-02-20 (i = 86) 및 2027-02-21 (i = 87) 이틀 모두 D-DAY 공연일
    const dDay = Math.max(0, totalDays - 2 - i);
    const isDay1 = dateStr === '2027-02-20';
    const isDay2 = dateStr === '2027-02-21';
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
      title: '',
      question: isDay1
        ? DAILY_CONCERT_QUESTIONS[86]
        : isDay2
        ? DAILY_CONCERT_QUESTIONS[87]
        : DAILY_CONCERT_QUESTIONS[i % 86],
      rewardLabel: isDay1
        ? '뛰봉 왕관'
        : isDay2
        ? '영원한 보이스 피니시 배지'
        : milestone
        ? milestone.label
        : rewardPool[i % rewardPool.length],
      sampleAnswers: [],
    });
  }
  return list;
})();

export const ADVENT_MONTHS: Array<{ key: string; year: number; month: number; label: string }> = [
  { key: '2026-11', year: 2026, month: 11, label: 'LAP 1 · 11월 스타트' },
  { key: '2026-12', year: 2026, month: 12, label: 'LAP 2 · 12월 질주' },
  { key: '2027-01', year: 2027, month: 1, label: 'LAP 3 · 1월 스퍼트' },
  { key: '2027-02', year: 2027, month: 2, label: 'LAP 4 · 2월 결승선' },
];

// KSPO DOME 외벽 15칸을 채우는 CNBLUE 역대 앨범 스파인 데이터 (1~15번 전체 적용 완료)
export const DOME_ALBUM_SPINES: DomeAlbumSpineInfo[] = [
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
