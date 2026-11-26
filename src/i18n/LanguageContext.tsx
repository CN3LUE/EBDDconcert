import React, { createContext, useContext } from 'react';

export type AppLang = 'ko' | 'en' | 'zh' | 'ja';

export const LANG_OPTIONS: Array<{ code: AppLang; short: string; label: string }> = [
  { code: 'ko', short: '한국어', label: '한국어' },
  { code: 'en', short: 'EN', label: 'English' },
  { code: 'zh', short: '中文', label: '中文' },
  { code: 'ja', short: '日本語', label: '日本語' },
];

export interface TranslationDict {
  loadingPlaza: string;
  headerTitle: string;
  plazaSubtitle: (roomId: number) => string;
  arenaSubtitle: (seatZone: string) => string;
  exitToPlaza: string;
  enterArena: string;
  seatMapBtn: string;
  skyDay: string;
  skySunset: string;
  skyNight: string;
  bgmStop: string;
  bgmPlay: string;
  bgmNext: string;
  dockAdvent: string;
  dockFlowers: string;
  dockLane: (roomId: number) => string;
  dockMiniGames: string;
  greetPeerBtn: string;
  greetPeerToast: (name: string) => string;
  actionRunStop: string;
  actionRunStart: string;
  actionEbdd: string;
  actionSloganWave: string;
  actionLightstickWave: string;
  actionGreet: string;
  actionSit: string;
  actionCry: string;
  actionMenuBtn: string;
  settingsBtn: string;
  settingsTitle: string;
  settingsAvatarLabel: string;
  settingsAvatarBtn: string;
  settingsLangLabel: string;
  settingsSkyLabel: string;
  settingsBgmLabel: string;
  settingsBgmPlazaDesc: string;
  settingsBgmArenaDesc: string;
  cryToast: string;
  yonghwaEyeTitle: string;
  yonghwaEyeQuestion: string;
  yonghwaEyeYes: string;
  yonghwaEyeNo: string;
  speechPlaceholder: string;
  // Rooms
  rooms: Array<{ name: string; desc: string }>;
  roomModalTitle: string;
  roomModalSubtitle: string;
  // Flower Memos
  flowerModalTitle: (count: number) => string;
  flowerModalSubtitle: string;
  flowerColorLabel: string;
  flowerPlaceholder: string;
  flowerSubmitBtn: string;
  flowerMineTag: string;
  flowerEditTitle: string;
  flowerDeleteTitle: string;
  flowerDeleteConfirm: string;
  flowerCancel: string;
  flowerSave: string;
  flowerLikeBtn: (count: number) => string;
  flowerMoveToBtn: string;
  // Seat Map
  seatModalTitle: string;
  seatModalSubtitle: string;
  seatLegendFloor: string;
  seatLegend1F: string;
  seatLegend2F: string;
  seatLegendCurrent: string;
  seatCurrentLabel: string;
  seatTierFloor: string;
  seatTier1F: string;
  seatTier2F: string;
  seatSectionSuffix: (num: string) => string;
  // MiniGames
  miniModalTitle: string;
  miniModalSubtitle: (runBest: number, roofBest: number) => string;
  miniTabRun: (best: number) => string;
  miniTabRoof: (best: number) => string;
  miniRunPassed: (score: number) => string;
  miniBestScore: (best: number) => string;
  miniRunReadyGoal: string;
  miniRunReadySub: string;
  miniRunReadyStart: string;
  miniRunGameOverCount: (finalScore: number) => string;
  miniRunControls: string;
  miniJumpBtn: string;
  miniRoofAltitude: (score: number) => string;
  miniRoofBest: (best: number) => string;
  miniRoofReadyGoal: string;
  miniRoofReadySub: string;
  miniRoofReadyStart: string;
  miniRoofFinal: (finalScore: number) => string;
  miniRoofLeft: string;
  miniRoofRight: string;
  miniTryAgain: string;
  miniRunToast: (cleared: number) => string;
  miniRoofToast: (best: number) => string;
  // Advent
  adventTitle: string;
  adventSubtitle: string;
  adventTabCourse: (checked: number, total: number) => string;
  adventTabCourseShort: (checked: number, total: number) => string;
  adventTabDiary: (count: number) => string;
  adventTabDiaryShort: (count: number) => string;
  adventTabPeers: (count: number) => string;
  adventTabPeersShort: (count: number) => string;
  adventUntilFinish: (dDay: number) => string;
  adventProgressLabel: (pct: number, checked: number, total: number) => string;
  adventMonths: Record<string, string>;
  adventAll88: string;
  adventLockedToast: (y: number, m: number, d: number, dDay: number) => string;
  adventCheckedBadge: string;
  adventAllMdDone: string;
  adventDoneCountNext: (count: number, nextDay: number) => string;
  adventNextItemLabel: (day: number) => string;
  adventTodayReward: string;
  adventTodayQuestion: string;
  adventMyRecordPrefix: string;
  adventAnswerLabel: string;
  adventAnswerPlaceholder: string;
  adventPeerRecords: string;
  adventPeersAllFilter: string;
  adventPeersDayFilter: (month: number, day: number) => string;
  adventPeersViewAllBtn: (count: number) => string;
  adventEmptyPeers: string;
  adventAnonymousLabel: string;
  adventUpdateAnswerBtn: string;
  adventCompleteAnswerBtn: string;
  adventEmptyDiary: string;
  adventLockedCardTitle: (m: number, d: number) => string;
  adventLockedCardDesc: (y: number, m: number, d: number, dDay: number) => string;
  adminModeBadge: string;
  settingsAdminLabel: string;
  settingsAdminMaintenanceDesc: string;
  settingsAdminMaintenanceBtn: string;
  settingsAdminActiveDesc: string;
  settingsAdminOffDesc: string;
  settingsAdminToggleOn: string;
  settingsAdminToggleOff: string;
  profileAdminBanner: string;
  // Profile
  profileTitle: string;
  profileSubtitle: string;
  profileBannerTitle: (count: number) => string;
  profileBannerAllDone: string;
  profileBannerNext: (day: number, label: string) => string;
  profileAnswerBtn: string;
  profileNicknameLabel: string;
  profileNicknamePlaceholder: string;
  profileHairLabel: string;
  profileHairOptions: Record<string, { name: string; desc: string }>;
  profileCapLabel: string;
  profileCapOptions: Record<string, string>;
  profileCapLockToast: (day: number, name: string) => string;
  profileDayGain: (day: number) => string;
  profileOutfitLabel: string;
  profileOutfitOptions: Record<string, { name: string; desc: string }>;
  profileOutfitLockToast: (day: number, name: string) => string;
  profileDayUnit: (day: number) => string;
  profileHandTitle: string;
  profileHandSloganNote: string;
  profileLightstickLockToast: string;
  profileLightstickOnlyLocked: string;
  profileLightstickOnly: string;
  profileFanLockToast: string;
  profileFanOnlyLocked: string;
  profileFanOnly: string;
  profileSloganLockToast: string;
  profileSloganBothLocked: string;
  profileSloganBoth: string;
  profileBothClear: string;
  profileLeftHand: string;
  profileRightHand: string;
  profileHandNone: string;
  profileHandLightstick: string;
  profileHandFan: string;
  profileLightstickColorLabel: string;
  profileColorLockToast: (day: number, colorName: string) => string;
  profileColorNames: Record<string, string>;
}

export const UI_TRANSLATIONS: Record<AppLang, TranslationDict> = {
  ko: {
    loadingPlaza: 'KSPO DOME 3D 러닝 트랙 광장을 준비하고 있습니다...',
    headerTitle: '에바뛰콘 in KSPO DOME',
    plazaSubtitle: (roomId) => `외부 ${roomId}레인 트랙 광장`,
    arenaSubtitle: (seatZone) => `내부 공연장 (${seatZone})`,
    exitToPlaza: '광장으로 나가기',
    enterArena: '공연장 입장',
    seatMapBtn: '좌석배치도',
    skyDay: '낮 테마',
    skySunset: '노을 테마',
    skyNight: '밤 테마',
    bgmStop: 'BGM 정지',
    bgmPlay: 'BGM 재생',
    bgmNext: '다음 BGM 트랙',
    dockAdvent: '어드벤트',
    dockFlowers: '그러나, 꽃이었다',
    dockLane: (roomId) => `${roomId}레인`,
    dockMiniGames: '미니게임',
    greetPeerBtn: '👋 반갑게 인사하기',
    greetPeerToast: (name) => `👋 ${name}님에게 반갑게 인사했습니다!`,
    actionRunStop: '달리기 정지',
    actionRunStart: '달리기 RUN!',
    actionEbdd: '에바뛰!',
    actionSloganWave: '슬로건 흔들기',
    actionLightstickWave: '응원봉 흔들기',
    actionGreet: '👋 인사',
    actionSit: '🪑 쉬기',
    actionCry: '😭 눈물 흘리기',
    actionMenuBtn: '에바뛰 · 응원 · 감정',
    settingsBtn: '환경설정',
    settingsTitle: '환경설정',
    settingsAvatarLabel: '내 아바타 & MD 꾸미기',
    settingsAvatarBtn: '꾸미기 열기 →',
    settingsLangLabel: '언어 설정',
    settingsSkyLabel: '광장 하늘 시간대',
    settingsBgmLabel: '배경음악 (BGM)',
    settingsBgmPlazaDesc: '외부 광장에서는 「달리기」 1곡이 반복 재생됩니다.',
    settingsBgmArenaDesc: '공연장 내부에서는 4곡이 순서대로 재생됩니다.',
    cryToast: '😭 눈물이 차올라서 고갤 들어..💧',
    yonghwaEyeTitle: '👀 정용화와 눈이 마주쳤습니다.',
    yonghwaEyeQuestion: '뛰시겠습니까?',
    yonghwaEyeYes: '예',
    yonghwaEyeNo: '아니오',
    speechPlaceholder: '머리 위 말풍선 한마디 띄우기... (예: 에바뛰콘 가보자고!)',
    rooms: [
      { name: '1레인', desc: '' },
      { name: '2레인', desc: '' },
      { name: '3레인', desc: '' },
      { name: '4레인', desc: '' },
      { name: '5레인', desc: '' },
    ],
    roomModalTitle: '러닝 트랙 레인 선택 (1~5레인)',
    roomModalSubtitle:
      "레인을 선택하면 해당 번호 트랙 위치로 즉시 이동하며, '달리기 RUN!' 시 그 레인을 따라 달립니다!",
    flowerModalTitle: (count) => `그러나, 꽃이었다 (${count}송이)`,
    flowerModalSubtitle:
      '메모를 남기면 지금 내 아바타가 서 있는 광장 땅 위에 입체 꽃이 피어납니다!',
    flowerColorLabel: '피어날 꽃잎 컬러 (10색)',
    flowerPlaceholder: '씨엔블루에게 응원 메모를 적고 꽃을 피워보세요! (60자)',
    flowerSubmitBtn: '🌸 꽃 피우기',
    flowerMineTag: '내 꽃',
    flowerEditTitle: '수정',
    flowerDeleteTitle: '삭제',
    flowerDeleteConfirm: '삭제 확인',
    flowerCancel: '취소',
    flowerSave: '저장',
    flowerLikeBtn: (count) => `물주기 응원 ${count}`,
    flowerMoveToBtn: '이 꽃으로 이동 →',
    seatModalTitle: 'KSPO DOME 좌석배치도 · 구역 선택',
    seatModalSubtitle:
      '원하는 구역을 클릭하면 내 지정 좌석으로 설정되고 3D 공연장 해당 구역으로 즉시 이동합니다!',
    seatLegendFloor: 'FLOOR R석 (에·바·뛰)',
    seatLegend1F: '1F S석 (1~15구역)',
    seatLegend2F: '2F A석 (24~43구역)',
    seatLegendCurrent: '현재 내 구역',
    seatCurrentLabel: '현재 선택된 나의 구역',
    seatTierFloor: 'FLOOR · R석 (의탠딩석 · 에 / 바 / 뛰)',
    seatTier1F: '1F · S석 (1 ~ 15구역)',
    seatTier2F: '2F · A석 (24 ~ 43구역)',
    seatSectionSuffix: (num) => `${num}구역`,
    miniModalTitle: 'EBDD 미니게임 2종',
    miniModalSubtitle: (runBest, roofBest) =>
      `🏃 무한 달리기 최고: ${runBest}개 · ☁️ 천국의 계단 최고: ${roofBest}M`,
    miniTabRun: (best) => `🏃 1. 무한 달리기 (${best})`,
    miniTabRoof: (best) => `☁️ 2. 천국의 계단 (${best}M)`,
    miniRunPassed: (score) => `통과 장애물: ${score}`,
    miniBestScore: (best) => `최고 기록: ${best}`,
    miniRunReadyGoal: '목표: 부딪힐 때까지 무한 달리기! (4개 존 돌파)',
    miniRunReadySub: '장애물을 피해 끝까지 달려보세요! (⭐ 보너스 · 🛡️ 보호막)',
    miniRunReadyStart: '화면 탭 / 스페이스바로 시작',
    miniRunGameOverCount: (finalScore) => `통과한 장애물: ${finalScore}개`,
    miniRunControls: '스페이스 · ↑ · W · 화면 탭 (공중 2단 점프 가능)',
    miniJumpBtn: 'JUMP! (점프)',
    miniRoofAltitude: (score) => `현재 고도: ${score}M`,
    miniRoofBest: (best) => `최고 기록: ${best}M`,
    miniRoofReadyGoal: '목표: 끝없이 올라가는 무한 모드',
    miniRoofReadySub: '1000m · 2000m · 3000m 그 이상까지!',
    miniRoofReadyStart: '화면 좌/우 터치로 시작 & 이동',
    miniRoofFinal: (finalScore) => `최종 기록: ${finalScore}M`,
    miniRoofLeft: '◀ 왼쪽 이동 (← / A)',
    miniRoofRight: '오른쪽 이동 (→ / D) ▶',
    miniTryAgain: 'TRY AGAIN',
    miniRunToast: (cleared) => `🏃 무한 달리기 종료! 통과 장애물 ${cleared}개`,
    miniRoofToast: (best) => `☁️ 천국의 계단 기록: ${best}M 달성!`,
    adventTitle: '에바뛰콘 러닝 트랙 어드벤트',
    adventSubtitle:
      '오늘부터 2027년 2월 20-21일 에바뛰콘 결승선까지 매일 출석 도장을 찍으며 달려보세요!',
    adventTabCourse: (checked, total) => `🏃 러닝 트랙 코스 (${checked}/${total}일)`,
    adventTabCourseShort: (checked, total) => `🏃 트랙 (${checked}/${total})`,
    adventTabDiary: (count) => `내 데일리 기록 (${count})`,
    adventTabDiaryShort: (count) => `내 기록 (${count})`,
    adventTabPeers: (count) => `💙 함께 달리는 보이스들의 기록 (${count})`,
    adventTabPeersShort: (count) => `💙 보이스 (${count})`,
    adventUntilFinish: (dDay) => `결승선까지 ${dDay === 0 ? 'D-DAY' : `D-${dDay}`}`,
    adventProgressLabel: (pct, checked, total) => `트랙 완주율 ${pct}% (${checked} / ${total}일)`,
    adventMonths: {
      '2026-11': 'LAP 1 · 11월 스타트',
      '2026-12': 'LAP 2 · 12월 질주',
      '2027-01': 'LAP 3 · 1월 스퍼트',
      '2027-02': 'LAP 4 · 2월 결승선',
    },
    adventAll88: '전체 88일 코스',
    adventLockedToast: (y, m, d, dDay) =>
      `🔒 ${y}년 ${m}월 ${d}일(D-${dDay}) 자정에 이 구간이 열립니다!`,
    adventCheckedBadge: '✅ 출석 완료',
    adventAllMdDone: '🎉 모든 MD 아이템 획득 완료',
    adventDoneCountNext: (count, nextDay) => `✅ ${count}회 완료 · 다음(${nextDay}회차)`,
    adventNextItemLabel: (day) => `🎁 ${day}회차 아이템 획득`,
    adventTodayReward: '🎁 오늘의 완주 보상',
    adventTodayQuestion: '💬 오늘의 보이스 질문',
    adventMyRecordPrefix: '내 기록: ',
    adventAnswerLabel: '질문에 답하고 아이템 획득하기',
    adventAnswerPlaceholder:
      '질문에 답변을 남기면 1회차 뛰봉, 2회차 부채, 3회차 모자 순으로 아이템이 열려요! (최대 120자)',
    adventPeerRecords: '💙 함께 달리는 보이스들의 기록',
    adventPeersAllFilter: '전체 날짜 보기',
    adventPeersDayFilter: (month, day) => `${month}/${day} 질문만 보기`,
    adventPeersViewAllBtn: (count) => `💙 함께 달리는 보이스들의 익명 기록 보기 (${count}) →`,
    adventEmptyPeers: '아직 공유된 익명 기록이 없습니다. 오늘 첫 기록을 남겨보세요! 💙',
    adventAnonymousLabel: '익명 보이스',
    adventUpdateAnswerBtn: '💙 오늘의 답변 업데이트',
    adventCompleteAnswerBtn: '✅ 답변 완료 & 아이템 받기',
    adventEmptyDiary: '아직 출석 기록이 없습니다. 달력에서 오늘 날짜에 첫 출석 도장을 찍어보세요! 💙',
    adventLockedCardTitle: (m, d) => `🔒 ${m}월 ${d}일 자정에 오픈됩니다`,
    adventLockedCardDesc: (y, m, d, dDay) =>
      `${y}년 ${m}월 ${d}일 (D-${dDay}) 00:00 KST가 되면 오늘의 질문과 아이템 보상이 열립니다! 조금만 기다려 주세요 💙`,
    adminModeBadge: '👑 관리자 모드',
    settingsAdminLabel: '관리자 모드',
    settingsAdminMaintenanceDesc: '현재 시스템 정비 중입니다.',
    settingsAdminMaintenanceBtn: '정비 중',
    settingsAdminActiveDesc: '모든 어드벤트 질문(88일) & 착용 MD 아이템이 열려 있습니다.',
    settingsAdminOffDesc: '일반 팬 화면으로 미리보기 중입니다.',
    settingsAdminToggleOn: '관리자 ON',
    settingsAdminToggleOff: '일반 모드',
    profileAdminBanner: '👑 관리자 모드 활성 · 모든 MD 아이템을 자유롭게 착용해 볼 수 있어요!',
    profileTitle: '내 아바타 & MD 꾸미기',
    profileSubtitle: '헤어스타일 · 캡 · 트랙 자켓 · 뛰봉 · 에.바.뛰. 부채 · 양손 슬로건',
    profileBannerTitle: (count) => `일일 질문 참여 · ${count}회 완료`,
    profileBannerAllDone: '🎉 모든 MD 착용 아이템을 전부 획득했습니다!',
    profileBannerNext: (day, label) => `${day}회차 아이템 획득: ${label}`,
    profileAnswerBtn: '질문 답하기 →',
    profileNicknameLabel: '보이스 닉네임',
    profileNicknamePlaceholder: '닉네임을 입력하세요',
    profileHairLabel: '헤어스타일 선택',
    profileHairOptions: {
      long: { name: '긴 생머리', desc: '어깨 아래로 흐르는 롱헤어' },
      ponytail: { name: '포니테일', desc: '달릴 때 살랑이는 리본 포니테일' },
      short: { name: '스포티 숏컷', desc: '깔끔하고 경쾌한 짧은 머리' },
    },
    profileCapLabel: '01. 모자 착용',
    profileCapOptions: {
      official_cap: '화이트 데님 캡',
      navy_cap: '딥네이비 볼캡',
      none: '착용 안 함',
    },
    profileCapLockToast: (day, name) =>
      `🔒 어드벤트 질문에 ${day}회 답변하면 [${name}]을 받을 수 있어요!`,
    profileDayGain: (day) => `${day}회차 획득`,
    profileOutfitLabel: '02. 상의 착장',
    profileOutfitOptions: {
      track_jacket: { name: '화이트 트랙 자켓', desc: '블루 스트라이프 & CNBLUE 패치' },
      white_tee: { name: '화이트 콘서트 티셔츠', desc: '시원한 블루 로고 포인트' },
      navy_tee: { name: '네이비 투어 티셔츠', desc: '스카이블루 시그니처 그래픽' },
      sky_tee: { name: '스카이블루 보이스 티', desc: '청량한 하늘빛 응원 룩' },
    },
    profileOutfitLockToast: (day, name) =>
      `🔒 어드벤트 질문에 ${day}회 답변하면 [${name}]을 착용할 수 있어요!`,
    profileDayUnit: (day) => `${day}회차`,
    profileHandTitle: '손에 들 응원 MD',
    profileHandSloganNote: '슬로건은 양손 사용',
    profileLightstickLockToast: '🔒 어드벤트 1회차 질문에 답하면 뛰봉을 받을 수 있어요!',
    profileLightstickOnlyLocked: '🔒 1회차 뛰봉',
    profileLightstickOnly: '💎 뛰봉만',
    profileFanLockToast: '🔒 어드벤트 2회차 질문에 답하면 에.바.뛰. 부채를 받을 수 있어요!',
    profileFanOnlyLocked: '🔒 2회차 부채',
    profileFanOnly: '🪭 부채만',
    profileSloganLockToast: '🔒 어드벤트 4회차 질문에 답하면 양손 슬로건을 받을 수 있어요!',
    profileSloganBothLocked: '🔒 4회차 슬로건',
    profileSloganBoth: '💙 양손 슬로건',
    profileBothClear: '🙌 양손 비우기',
    profileLeftHand: '왼손',
    profileRightHand: '오른손',
    profileHandNone: '없음',
    profileHandLightstick: '💎 뛰봉',
    profileHandFan: '🪭 부채',
    profileLightstickColorLabel: '03. 뛰봉 발광 컬러',
    profileColorLockToast: (day, colorName) =>
      `🔒 어드벤트 ${day}회차 질문에 답변하면 [${colorName}] 뛰봉 컬러가 열립니다!`,
    profileColorNames: {
      '#2563eb': '블루',
      '#38bdf8': '스카이블루',
      '#e0f2fe': '화이트',
      '#fbbf24': '골드',
      '#f472b6': '핑크',
      '#ef4444': '레드',
    },
  },
  en: {
    loadingPlaza: 'Preparing KSPO DOME 3D Running Track Plaza...',
    headerTitle: 'Everybody Jump in KSPO DOME',
    plazaSubtitle: (roomId) => `Outdoor Lane ${roomId} Track Plaza`,
    arenaSubtitle: (seatZone) => `Inside Arena (${seatZone})`,
    exitToPlaza: 'Back to Plaza',
    enterArena: 'Enter Arena',
    seatMapBtn: 'Seat Map',
    skyDay: 'Day Sky',
    skySunset: 'Sunset Sky',
    skyNight: 'Night Sky',
    bgmStop: 'Stop BGM',
    bgmPlay: 'Play BGM',
    bgmNext: 'Next BGM Track',
    dockAdvent: 'Advent',
    dockFlowers: 'Flower Memos',
    dockLane: (roomId) => `Lane ${roomId}`,
    dockMiniGames: 'Mini Games',
    greetPeerBtn: '👋 Say Hello',
    greetPeerToast: (name) => `👋 Said hello warmly to ${name}!`,
    actionRunStop: 'Stop Run',
    actionRunStart: 'RUN!',
    actionEbdd: 'EBDD Jump!',
    actionSloganWave: 'Wave Slogan',
    actionLightstickWave: 'Wave Ttuibong',
    actionGreet: '👋 Greet',
    actionSit: '🪑 Rest',
    actionCry: '😭 Cry',
    actionMenuBtn: 'Cheer · Emotes',
    settingsBtn: 'Settings',
    settingsTitle: 'Settings',
    settingsAvatarLabel: 'My Avatar & MD',
    settingsAvatarBtn: 'Customize →',
    settingsLangLabel: 'Language',
    settingsSkyLabel: 'Plaza Sky Time',
    settingsBgmLabel: 'Background Music',
    settingsBgmPlazaDesc: 'Outdoor Plaza plays "Running" on repeat.',
    settingsBgmArenaDesc: 'Inside Arena plays 4 tracks in sequence.',
    cryToast: '😭 Tears welling up, I look up to the sky..💧',
    yonghwaEyeTitle: '👀 You locked eyes with Jung Yonghwa.',
    yonghwaEyeQuestion: 'Will you jump?',
    yonghwaEyeYes: 'Yes',
    yonghwaEyeNo: 'No',
    speechPlaceholder: 'Floating speech bubble... (e.g. Let’s go EBDD!!)',
    rooms: [
      { name: 'Lane 1', desc: '' },
      { name: 'Lane 2', desc: '' },
      { name: 'Lane 3', desc: '' },
      { name: 'Lane 4', desc: '' },
      { name: 'Lane 5', desc: '' },
    ],
    roomModalTitle: 'Select Running Track Lane (1–5)',
    roomModalSubtitle:
      "Pick a lane to warp onto that track, and press 'RUN!' to sprint along it!",
    flowerModalTitle: (count) => `However, It Was a Flower (${count})`,
    flowerModalSubtitle:
      'Leave a cheer memo and a 3D flower will bloom right where your avatar stands!',
    flowerColorLabel: 'Petal Color (10 Colors)',
    flowerPlaceholder: 'Write a cheer memo to CNBLUE and bloom a flower! (60 chars)',
    flowerSubmitBtn: '🌸 Bloom',
    flowerMineTag: 'Mine',
    flowerEditTitle: 'Edit',
    flowerDeleteTitle: 'Delete',
    flowerDeleteConfirm: 'Confirm',
    flowerCancel: 'Cancel',
    flowerSave: 'Save',
    flowerLikeBtn: (count) => `Water Cheer ${count}`,
    flowerMoveToBtn: 'Go to Flower →',
    seatModalTitle: 'KSPO DOME Seat Map · Select Section',
    seatModalSubtitle:
      'Click any section to set your seat and warp straight to that spot inside the 3D arena!',
    seatLegendFloor: 'FLOOR R (EBDD)',
    seatLegend1F: '1F S (Sec 1–15)',
    seatLegend2F: '2F A (Sec 24–43)',
    seatLegendCurrent: 'My Section',
    seatCurrentLabel: 'Currently Selected Section',
    seatTierFloor: 'FLOOR · R Seat (Seated-Standing · E / B / DD)',
    seatTier1F: '1F · S Seat (Sec 1 – 15)',
    seatTier2F: '2F · A Seat (Sec 24 – 43)',
    seatSectionSuffix: (num) => `Sec ${num}`,
    miniModalTitle: 'EBDD Mini Games (2 Modes)',
    miniModalSubtitle: (runBest, roofBest) =>
      `🏃 Endless Run Best: ${runBest} · ☁️ Heaven Stairs Best: ${roofBest}M`,
    miniTabRun: (best) => `🏃 1. Endless Run (${best})`,
    miniTabRoof: (best) => `☁️ 2. Heaven Stairs (${best}M)`,
    miniRunPassed: (score) => `Cleared: ${score}`,
    miniBestScore: (best) => `Best: ${best}`,
    miniRunReadyGoal: 'Goal: Run endlessly until you crash! (4 Zones)',
    miniRunReadySub: 'Dodge obstacles as far as you can! (⭐ Bonus · 🛡️ Shield)',
    miniRunReadyStart: 'Tap Screen / Press Space to Start',
    miniRunGameOverCount: (finalScore) => `Obstacles Cleared: ${finalScore}`,
    miniRunControls: 'Space · ↑ · W · Tap Screen (Double Jump enabled)',
    miniJumpBtn: 'JUMP!',
    miniRoofAltitude: (score) => `Altitude: ${score}M`,
    miniRoofBest: (best) => `Best: ${best}M`,
    miniRoofReadyGoal: 'Goal: Climb endlessly into the sky!',
    miniRoofReadySub: '1000m · 2000m · 3000m and beyond!',
    miniRoofReadyStart: 'Touch Left / Right to Start & Move',
    miniRoofFinal: (finalScore) => `Final Altitude: ${finalScore}M`,
    miniRoofLeft: '◀ Move Left (← / A)',
    miniRoofRight: 'Move Right (→ / D) ▶',
    miniTryAgain: 'TRY AGAIN',
    miniRunToast: (cleared) => `🏃 Endless Run Over! Cleared ${cleared} obstacles`,
    miniRoofToast: (best) => `☁️ Heaven Stairs Record: ${best}M!`,
    adventTitle: 'EBDD Running Track Advent',
    adventSubtitle:
      'Check in daily from today to the 2027.02.20-21 EBDD Concert finish line!',
    adventTabCourse: (checked, total) => `🏃 Track Course (${checked}/${total} Days)`,
    adventTabCourseShort: (checked, total) => `🏃 Track (${checked}/${total})`,
    adventTabDiary: (count) => `My Daily Log (${count})`,
    adventTabDiaryShort: (count) => `My Log (${count})`,
    adventTabPeers: (count) => `💙 Fellow BOICE Logs (${count})`,
    adventTabPeersShort: (count) => `💙 BOICE (${count})`,
    adventUntilFinish: (dDay) => `${dDay === 0 ? 'D-DAY' : `D-${dDay}`} to Finish`,
    adventProgressLabel: (pct, checked, total) => `Progress ${pct}% (${checked} / ${total} Days)`,
    adventMonths: {
      '2026-11': 'LAP 1 · Nov Start',
      '2026-12': 'LAP 2 · Dec Sprint',
      '2027-01': 'LAP 3 · Jan Spurt',
      '2027-02': 'LAP 4 · Feb Finish',
    },
    adventAll88: 'All 88 Days',
    adventLockedToast: (y, m, d, dDay) =>
      `🔒 Unlocks at midnight on ${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')} (D-${dDay})!`,
    adventCheckedBadge: '✅ Checked In',
    adventAllMdDone: '🎉 All MD items unlocked!',
    adventDoneCountNext: (count, nextDay) => `✅ ${count} Done · Next (#${nextDay})`,
    adventNextItemLabel: (day) => `🎁 #${day} Item Unlock`,
    adventTodayReward: '🎁 Today’s Milestone',
    adventTodayQuestion: '💬 Today’s BOICE Question',
    adventMyRecordPrefix: 'My Note: ',
    adventAnswerLabel: 'Answer the question to earn an item',
    adventAnswerPlaceholder:
      'Answer daily questions to unlock Ttuibong (#1), Fan (#2), Cap (#3) & more! (Max 120 chars)',
    adventPeerRecords: '💙 Notes from fellow running BOICE',
    adventPeersAllFilter: 'All Dates',
    adventPeersDayFilter: (month, day) => `${month}/${day} Only`,
    adventPeersViewAllBtn: (count) => `💙 View Anonymous BOICE Logs (${count}) →`,
    adventEmptyPeers: 'No shared anonymous notes yet. Be the first to share today! 💙',
    adventAnonymousLabel: 'Anonymous BOICE',
    adventUpdateAnswerBtn: '💙 Update Today’s Answer',
    adventCompleteAnswerBtn: '✅ Submit & Claim Item',
    adventEmptyDiary: 'No check-ins yet. Stamp today’s date on the track! 💙',
    adventLockedCardTitle: (m, d) => `🔒 Opens on ${m}/${d} at midnight (KST)`,
    adventLockedCardDesc: (y, m, d, dDay) =>
      `This day's question and reward will unlock on ${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')} (D-${dDay}) at 00:00 KST. Stay tuned! 💙`,
    adminModeBadge: '👑 Admin Mode',
    settingsAdminLabel: 'Admin Mode',
    settingsAdminMaintenanceDesc: 'Currently under maintenance.',
    settingsAdminMaintenanceBtn: 'Maintenance',
    settingsAdminActiveDesc: 'All 88 Advent questions & MD items are unlocked.',
    settingsAdminOffDesc: 'Previewing as a regular fan.',
    settingsAdminToggleOn: 'Admin ON',
    settingsAdminToggleOff: 'Fan View',
    profileAdminBanner: '👑 Admin Mode Active · All MD items are unlocked for preview!',
    profileTitle: 'My Avatar & MD',
    profileSubtitle: 'Hairstyle · Cap · Track Jacket · Ttuibong · Fan · Slogan',
    profileBannerTitle: (count) => `Daily Q&A · ${count} Completed`,
    profileBannerAllDone: '🎉 You’ve unlocked all MD items!',
    profileBannerNext: (day, label) => `Unlock at #${day}: ${label}`,
    profileAnswerBtn: 'Answer Q&A →',
    profileNicknameLabel: 'BOICE Nickname',
    profileNicknamePlaceholder: 'Enter your nickname',
    profileHairLabel: 'Hairstyle',
    profileHairOptions: {
      long: { name: 'Long Straight', desc: 'Flowing long hair below shoulders' },
      ponytail: { name: 'Ponytail', desc: 'Bouncy ribbon ponytail for running' },
      short: { name: 'Sporty Short', desc: 'Clean and energetic short cut' },
    },
    profileCapLabel: '01. Cap',
    profileCapOptions: {
      official_cap: 'White Denim Cap',
      navy_cap: 'Deep Navy Cap',
      none: 'None',
    },
    profileCapLockToast: (day, name) =>
      `🔒 Answer ${day} Advent questions to unlock [${name}]!`,
    profileDayGain: (day) => `Unlock #${day}`,
    profileOutfitLabel: '02. Tops',
    profileOutfitOptions: {
      track_jacket: { name: 'Track Jacket', desc: 'Blue stripes & CNBLUE patch' },
      white_tee: { name: 'White Concert Tee', desc: 'Cool blue logo accent' },
      navy_tee: { name: 'Navy Tour Tee', desc: 'Sky-blue signature graphic' },
      sky_tee: { name: 'Sky-Blue BOICE Tee', desc: 'Refreshing sky-blue look' },
    },
    profileOutfitLockToast: (day, name) =>
      `🔒 Answer ${day} Advent questions to wear [${name}]!`,
    profileDayUnit: (day) => `#${day}`,
    profileHandTitle: 'Cheering MD in Hand',
    profileHandSloganNote: 'Slogan uses both hands',
    profileLightstickLockToast: '🔒 Answer 1st Advent question to unlock Ttuibong!',
    profileLightstickOnlyLocked: '🔒 #1 Ttuibong',
    profileLightstickOnly: '💎 Ttuibong',
    profileFanLockToast: '🔒 Answer 2nd Advent question to unlock the EBDD Fan!',
    profileFanOnlyLocked: '🔒 #2 Fan',
    profileFanOnly: '🪭 Fan Only',
    profileSloganLockToast: '🔒 Answer 4th Advent question to unlock the Slogan!',
    profileSloganBothLocked: '🔒 #4 Slogan',
    profileSloganBoth: '💙 Slogan (Both)',
    profileBothClear: '🙌 Empty Hands',
    profileLeftHand: 'Left Hand',
    profileRightHand: 'Right Hand',
    profileHandNone: 'None',
    profileHandLightstick: '💎 Ttuibong',
    profileHandFan: '🪭 Fan',
    profileLightstickColorLabel: '03. Ttuibong Glow Color',
    profileColorLockToast: (day, colorName) =>
      `🔒 Answer #${day} Advent question to unlock [${colorName}] Ttuibong glow!`,
    profileColorNames: {
      '#2563eb': 'Blue',
      '#38bdf8': 'Sky Blue',
      '#e0f2fe': 'White',
      '#fbbf24': 'Gold',
      '#f472b6': 'Pink',
      '#ef4444': 'Red',
    },
  },
  zh: {
    loadingPlaza: '正在准备 KSPO DOME 3D 跑步赛道广场...',
    headerTitle: '演唱会 in KSPO DOME',
    plazaSubtitle: (roomId) => `室外第 ${roomId} 跑道广场`,
    arenaSubtitle: (seatZone) => `场馆内部 (${seatZone})`,
    exitToPlaza: '返回广场',
    enterArena: '进入场馆',
    seatMapBtn: '座位图',
    skyDay: '白天主题',
    skySunset: '晚霞主题',
    skyNight: '夜晚主题',
    bgmStop: '暂停 BGM',
    bgmPlay: '播放 BGM',
    bgmNext: '下一首 BGM',
    dockAdvent: '倒数日历',
    dockFlowers: '然而，曾是花',
    dockLane: (roomId) => `${roomId}跑道`,
    dockMiniGames: '小游戏',
    greetPeerBtn: '👋 热情打招呼',
    greetPeerToast: (name) => `👋 向 ${name} 热情地打了招呼！`,
    actionRunStop: '停止跑步',
    actionRunStart: '开跑 RUN!',
    actionEbdd: '跳起来!',
    actionSloganWave: '挥舞手幅',
    actionLightstickWave: '挥舞跳棒',
    actionGreet: '👋 打招呼',
    actionSit: '🪑 休息',
    actionCry: '😭 流泪',
    actionMenuBtn: '应援 · 动作',
    settingsBtn: '设置',
    settingsTitle: '环境设置',
    settingsAvatarLabel: '我的角色 & 周边装扮',
    settingsAvatarBtn: '打开装扮 →',
    settingsLangLabel: '语言设置',
    settingsSkyLabel: '广场天空时段',
    settingsBgmLabel: '背景音乐 (BGM)',
    settingsBgmPlazaDesc: '室外广场单曲循环《奔跑》BGM。',
    settingsBgmArenaDesc: '场馆内部按顺序循环播放 4 首曲目。',
    cryToast: '😭 泪水涌上来只能仰起头..💧',
    yonghwaEyeTitle: '👀 和郑容和对视了！',
    yonghwaEyeQuestion: '要一起跳起来吗？',
    yonghwaEyeYes: '是',
    yonghwaEyeNo: '否',
    speechPlaceholder: '发送头顶气泡留言... (例: EBDD 冲呀!)',
    rooms: [
      { name: '1跑道', desc: '' },
      { name: '2跑道', desc: '' },
      { name: '3跑道', desc: '' },
      { name: '4跑道', desc: '' },
      { name: '5跑道', desc: '' },
    ],
    roomModalTitle: '选择跑步赛道 (1~5跑道)',
    roomModalSubtitle: '选择跑道即可立即移动到对应轨道位置，点击“开跑 RUN!”将沿着该跑道奔跑！',
    flowerModalTitle: (count) => `然而，曾是花 (${count}朵)`,
    flowerModalSubtitle: '留下应援留言，你的角色所站立的广场地面上就会绽放立体花朵！',
    flowerColorLabel: '花瓣颜色 (10色)',
    flowerPlaceholder: '给 CNBLUE 写下应援留言，让花朵绽放吧！(限60字)',
    flowerSubmitBtn: '🌸 绽放花朵',
    flowerMineTag: '我的花',
    flowerEditTitle: '修改',
    flowerDeleteTitle: '删除',
    flowerDeleteConfirm: '确认删除',
    flowerCancel: '取消',
    flowerSave: '保存',
    flowerLikeBtn: (count) => `浇水应援 ${count}`,
    flowerMoveToBtn: '前往这朵花 →',
    seatModalTitle: 'KSPO DOME 座位图 · 选择区域',
    seatModalSubtitle: '点击想要的区域即可设为我的座位，并立即传送到 3D 场馆对应区域！',
    seatLegendFloor: 'FLOOR R席 (에·바·뛰)',
    seatLegend1F: '1F S席 (1~15区)',
    seatLegend2F: '2F A席 (24~43区)',
    seatLegendCurrent: '当前我的区域',
    seatCurrentLabel: '当前已选区域',
    seatTierFloor: 'FLOOR · R席 (坐站区 · 에 / 바 / 뛰)',
    seatTier1F: '1F · S席 (1 ~ 15区)',
    seatTier2F: '2F · A席 (24 ~ 43区)',
    seatSectionSuffix: (num) => `${num}区`,
    miniModalTitle: 'EBDD 迷你小游戏 2款',
    miniModalSubtitle: (runBest, roofBest) =>
      `🏃 无限跑酷最高: ${runBest}个 · ☁️ 天国的阶梯最高: ${roofBest}M`,
    miniTabRun: (best) => `🏃 1. 无限跑酷 (${best})`,
    miniTabRoof: (best) => `☁️ 2. 天国的阶梯 (${best}M)`,
    miniRunPassed: (score) => `通过障碍物: ${score}`,
    miniBestScore: (best) => `最高纪录: ${best}`,
    miniRunReadyGoal: '目标：无限奔跑直到撞到障碍物！(共4个区域)',
    miniRunReadySub: '躲避障碍物一直往前冲吧！(⭐ 加分 · 🛡️ 护盾)',
    miniRunReadyStart: '点击屏幕 / 按空格键开始',
    miniRunGameOverCount: (finalScore) => `通过障碍物: ${finalScore}个`,
    miniRunControls: '空格 · ↑ · W · 点击屏幕 (支持空中二段跳)',
    miniJumpBtn: 'JUMP! (跳跃)',
    miniRoofAltitude: (score) => `当前高度: ${score}M`,
    miniRoofBest: (best) => `最高纪录: ${best}M`,
    miniRoofReadyGoal: '目标：不断向上攀登的无限模式',
    miniRoofReadySub: '1000m · 2000m · 3000m 冲向更高处！',
    miniRoofReadyStart: '触摸屏幕左/右侧开始并移动',
    miniRoofFinal: (finalScore) => `最终纪录: ${finalScore}M`,
    miniRoofLeft: '◀ 向左移动 (← / A)',
    miniRoofRight: '向右移动 (→ / D) ▶',
    miniTryAgain: 'TRY AGAIN',
    miniRunToast: (cleared) => `🏃 无限跑酷结束！通过障碍物 ${cleared}个`,
    miniRoofToast: (best) => `☁️ 天国的阶梯纪录：达成 ${best}M！`,
    adventTitle: 'EBDD 演唱会跑道倒数日历',
    adventSubtitle:
      '从今天起到 2027年2月20-21日演唱会终点线，每天打卡奔跑吧！',
    adventTabCourse: (checked, total) => `🏃 跑道打卡 (${checked}/${total}天)`,
    adventTabCourseShort: (checked, total) => `🏃 赛道 (${checked}/${total})`,
    adventTabDiary: (count) => `我的每日记录 (${count})`,
    adventTabDiaryShort: (count) => `我的记录 (${count})`,
    adventTabPeers: (count) => `💙 一同奔跑的 BOICE 记录 (${count})`,
    adventTabPeersShort: (count) => `💙 BOICE (${count})`,
    adventUntilFinish: (dDay) => `距终点 ${dDay === 0 ? 'D-DAY' : `D-${dDay}`}`,
    adventProgressLabel: (pct, checked, total) => `赛道完成度 ${pct}% (${checked} / ${total}天)`,
    adventMonths: {
      '2026-11': 'LAP 1 · 11月起跑',
      '2026-12': 'LAP 2 · 12月疾驰',
      '2027-01': 'LAP 3 · 1月冲刺',
      '2027-02': 'LAP 4 · 2月终点线',
    },
    adventAll88: '全部 88天赛道',
    adventLockedToast: (y, m, d, dDay) =>
      `🔒 将于 ${y}年${m}月${d}日 (D-${dDay}) 零点解锁该路段！`,
    adventCheckedBadge: '✅ 打卡完成',
    adventAllMdDone: '🎉 已获得全部周边道具',
    adventDoneCountNext: (count, nextDay) => `✅ 已完成 ${count}次 · 下一项(第${nextDay}次)`,
    adventNextItemLabel: (day) => `🎁 第${day}次道具奖励`,
    adventTodayReward: '🎁 今日完赛奖励',
    adventTodayQuestion: '💬 今日 BOICE 提问',
    adventMyRecordPrefix: '我的记录: ',
    adventAnswerLabel: '回答问题并领取道具',
    adventAnswerPlaceholder:
      '提交回答即可按顺序解锁第1次跳棒、第2次扇子、第3次帽子等周边！(最多120字)',
    adventPeerRecords: '💙 一同奔跑的 BOICE 留言',
    adventPeersAllFilter: '查看全部日期',
    adventPeersDayFilter: (month, day) => `仅看 ${month}/${day} 提问`,
    adventPeersViewAllBtn: (count) => `💙 查看 BOICE 匿名共享记录 (${count}) →`,
    adventEmptyPeers: '暂无匿名共享记录，快来留下今天的第一个足迹吧！💙',
    adventAnonymousLabel: '匿名 BOICE',
    adventUpdateAnswerBtn: '💙 更新今日回答',
    adventCompleteAnswerBtn: '✅ 提交回答 & 领取道具',
    adventEmptyDiary: '暂无打卡记录，快去日历点击今天的日期盖下第一个印章吧！💙',
    adventLockedCardTitle: (m, d) => `🔒 将于 ${m}月${d}日 零点解锁`,
    adventLockedCardDesc: (y, m, d, dDay) =>
      `${y}年${m}月${d}日 (D-${dDay}) 00:00 KST 将开放今日提问与道具奖励，敬请期待！💙`,
    adminModeBadge: '👑 管理员模式',
    settingsAdminLabel: '管理员模式',
    settingsAdminMaintenanceDesc: '当前系统维护中。',
    settingsAdminMaintenanceBtn: '维护中',
    settingsAdminActiveDesc: '已解锁全部 88 天提问与所有周边装扮道具。',
    settingsAdminOffDesc: '当前正在预览普通粉丝视图。',
    settingsAdminToggleOn: '管理员 ON',
    settingsAdminToggleOff: '普通视图',
    profileAdminBanner: '👑 管理员模式已开启 · 可自由试穿全部周边道具！',
    profileTitle: '我的角色 & 周边装扮',
    profileSubtitle: '发型 · 帽子 · 运动夹克 · 跳棒 · 应援扇 · 双手手幅',
    profileBannerTitle: (count) => `每日提问参与 · 已完成 ${count}次`,
    profileBannerAllDone: '🎉 已收集全部可穿戴周边道具！',
    profileBannerNext: (day, label) => `第${day}次获得道具: ${label}`,
    profileAnswerBtn: '去答题 →',
    profileNicknameLabel: 'BOICE 昵称',
    profileNicknamePlaceholder: '请输入昵称',
    profileHairLabel: '选择发型',
    profileHairOptions: {
      long: { name: '长直发', desc: '垂落肩下的飘逸长发' },
      ponytail: { name: '马尾辫', desc: '奔跑时随风摆动的丝带马尾' },
      short: { name: '运动短发', desc: '利落清爽的短发造型' },
    },
    profileCapLabel: '01. 帽子佩戴',
    profileCapOptions: {
      official_cap: '白色牛仔帽',
      navy_cap: '深蓝棒球帽',
      none: '不佩戴',
    },
    profileCapLockToast: (day, name) => `🔒 回答 ${day}次倒数日历提问即可获得 [${name}]！`,
    profileDayGain: (day) => `第${day}次获得`,
    profileOutfitLabel: '02. 上衣穿搭',
    profileOutfitOptions: {
      track_jacket: { name: '白色运动夹克', desc: '蓝色条纹 & CNBLUE 徽章' },
      white_tee: { name: '白色演唱会T恤', desc: '清爽蓝色 Logo 点缀' },
      navy_tee: { name: '深蓝巡演T恤', desc: '天蓝色标志性印花' },
      sky_tee: { name: '天蓝 BOICE T恤', desc: '清凉天蓝色应援穿搭' },
    },
    profileOutfitLockToast: (day, name) => `🔒 回答 ${day}次倒数日历提问即可穿戴 [${name}]！`,
    profileDayUnit: (day) => `第${day}次`,
    profileHandTitle: '手持应援周边',
    profileHandSloganNote: '手幅需双手持有',
    profileLightstickLockToast: '🔒 回答第1次倒数日历提问即可获得跳棒！',
    profileLightstickOnlyLocked: '🔒 第1次 跳棒',
    profileLightstickOnly: '💎 只拿跳棒',
    profileFanLockToast: '🔒 回答第2次倒数日历提问即可获得应援扇！',
    profileFanOnlyLocked: '🔒 第2次 扇子',
    profileFanOnly: '🪭 只拿扇子',
    profileSloganLockToast: '🔒 回答第4次倒数日历提问即可获得双手手幅！',
    profileSloganBothLocked: '🔒 第4次 手幅',
    profileSloganBoth: '💙 双手手幅',
    profileBothClear: '🙌 空出双手',
    profileLeftHand: '左手',
    profileRightHand: '右手',
    profileHandNone: '无',
    profileHandLightstick: '💎 跳棒',
    profileHandFan: '🪭 扇子',
    profileLightstickColorLabel: '03. 跳棒发光颜色',
    profileColorLockToast: (day, colorName) =>
      `🔒 回答第${day}次倒数日历提问即可解锁 [${colorName}] 跳棒灯光！`,
    profileColorNames: {
      '#2563eb': '蓝色',
      '#38bdf8': '天蓝',
      '#e0f2fe': '白色',
      '#fbbf24': '金色',
      '#f472b6': '粉色',
      '#ef4444': '红色',
    },
  },
  ja: {
    loadingPlaza: 'KSPO DOME 3D ランニングトラック広場を準備しています...',
    headerTitle: 'エバティコン in KSPO DOME',
    plazaSubtitle: (roomId) => `屋外 ${roomId}レーン トラック広場`,
    arenaSubtitle: (seatZone) => `会場内 (${seatZone})`,
    exitToPlaza: '広場へ出る',
    enterArena: '会場へ入場',
    seatMapBtn: '座席表',
    skyDay: '昼テーマ',
    skySunset: '夕焼けテーマ',
    skyNight: '夜テーマ',
    bgmStop: 'BGM 停止',
    bgmPlay: 'BGM 再生',
    bgmNext: '次の BGM',
    dockAdvent: 'アドベント',
    dockFlowers: 'しかし、花だった',
    dockLane: (roomId) => `${roomId}レーン`,
    dockMiniGames: 'ミニゲーム',
    greetPeerBtn: '👋 元気に挨拶する',
    greetPeerToast: (name) => `👋 ${name}さんに元気に挨拶しました！`,
    actionRunStop: '走るのをやめる',
    actionRunStart: '走る RUN!',
    actionEbdd: 'エバティ！',
    actionSloganWave: 'スローガンを振る',
    actionLightstickWave: 'ティボンを振る',
    actionGreet: '👋 挨拶',
    actionSit: '🪑 休憩',
    actionCry: '😭 涙を流す',
    actionMenuBtn: '応援 · エモート',
    settingsBtn: '設定',
    settingsTitle: '環境設定',
    settingsAvatarLabel: 'マイアバター & MD着せ替え',
    settingsAvatarBtn: '着せ替えを開く →',
    settingsLangLabel: '言語設定',
    settingsSkyLabel: '広場の空テーマ',
    settingsBgmLabel: 'BGM 設定',
    settingsBgmPlazaDesc: '屋外広場では「Running」1曲がリピート再生されます。',
    settingsBgmArenaDesc: '会場内では4曲が順番に再生されます。',
    cryToast: '😭 涙があふれて見上げるよ..💧',
    yonghwaEyeTitle: '👀 ジョン・ヨンファと目が合いました。',
    yonghwaEyeQuestion: 'ジャンプしますか？',
    yonghwaEyeYes: 'はい',
    yonghwaEyeNo: 'いいえ',
    speechPlaceholder: '頭上の吹き出しメッセージ... (例: エバティコン楽しもう!)',
    rooms: [
      { name: '1レーン', desc: '' },
      { name: '2レーン', desc: '' },
      { name: '3レーン', desc: '' },
      { name: '4レーン', desc: '' },
      { name: '5レーン', desc: '' },
    ],
    roomModalTitle: 'ランニングトラック・レーン選択 (1~5)',
    roomModalSubtitle:
      'レーンを選ぶとそのトラック位置へ移動し、「走る RUN!」でそのレーンに沿って走ります！',
    flowerModalTitle: (count) => `しかし、花だった (${count}輪)`,
    flowerModalSubtitle:
      '応援メモを残すと、今アバターが立っている広場の地面に立体のお花が咲きます！',
    flowerColorLabel: '花びらのカラー (10色)',
    flowerPlaceholder: 'CNBLUEへ応援メモを書いて花を咲かせましょう！(60文字)',
    flowerSubmitBtn: '🌸 花を咲かせる',
    flowerMineTag: '自分の花',
    flowerEditTitle: '編集',
    flowerDeleteTitle: '削除',
    flowerDeleteConfirm: '削除確認',
    flowerCancel: 'キャンセル',
    flowerSave: '保存',
    flowerLikeBtn: (count) => `水やり応援 ${count}`,
    flowerMoveToBtn: 'この花へ移動 →',
    seatModalTitle: 'KSPO DOME 座席表 · エリア選択',
    seatModalSubtitle:
      '希望のエリアをクリックすると自分の指定席に設定され、3D会場のそのエリアへ移動します！',
    seatLegendFloor: 'FLOOR R席 (에·바·뛰)',
    seatLegend1F: '1F S席 (1~15区域)',
    seatLegend2F: '2F A席 (24~43区域)',
    seatLegendCurrent: '現在の自分の席',
    seatCurrentLabel: '現在選択中のエリア',
    seatTierFloor: 'FLOOR · R席 (椅子付きスタンディング · 에 / 바 / 뛰)',
    seatTier1F: '1F · S席 (1 ~ 15区域)',
    seatTier2F: '2F · A席 (24 ~ 43区域)',
    seatSectionSuffix: (num) => `${num}区域`,
    miniModalTitle: 'EBDD ミニゲーム 2種',
    miniModalSubtitle: (runBest, roofBest) =>
      `🏃 無限ラン 最高: ${runBest}個 · ☁️ 天国の階段 最高: ${roofBest}M`,
    miniTabRun: (best) => `🏃 1. 無限ラン (${best})`,
    miniTabRoof: (best) => `☁️ 2. 天国の階段 (${best}M)`,
    miniRunPassed: (score) => `通過障害物: ${score}`,
    miniBestScore: (best) => `最高記録: ${best}`,
    miniRunReadyGoal: '目標：ぶつかるまで無限ランニング！(全4ゾーン)',
    miniRunReadySub: '障害物を避けてどこまでも走ろう！(⭐ ボーナス · 🛡️ シールド)',
    miniRunReadyStart: '画面タップ / スペースキーでスタート',
    miniRunGameOverCount: (finalScore) => `通過した障害物: ${finalScore}個`,
    miniRunControls: 'スペース · ↑ · W · 画面タップ (空中2段ジャンプ可能)',
    miniJumpBtn: 'JUMP! (ジャンプ)',
    miniRoofAltitude: (score) => `現在の高度: ${score}M`,
    miniRoofBest: (best) => `最高記録: ${best}M`,
    miniRoofReadyGoal: '目標：果てしなく登り続ける無限モード',
    miniRoofReadySub: '1000m · 2000m · 3000m その先まで！',
    miniRoofReadyStart: '画面の左/右タッチでスタート＆移動',
    miniRoofFinal: (finalScore) => `最終記録: ${finalScore}M`,
    miniRoofLeft: '◀ 左へ移動 (← / A)',
    miniRoofRight: '右へ移動 (→ / D) ▶',
    miniTryAgain: 'TRY AGAIN',
    miniRunToast: (cleared) => `🏃 無限ラン終了！通過障害物 ${cleared}個`,
    miniRoofToast: (best) => `☁️ 天国の階段 記録：${best}M 達成！`,
    adventTitle: 'エバティコン・トラックアドベント',
    adventSubtitle:
      '今日から2027年2月20〜21日のゴールまで毎日出席スタンプを押して走りましょう！',
    adventTabCourse: (checked, total) => `🏃 トラックコース (${checked}/${total}日)`,
    adventTabCourseShort: (checked, total) => `🏃 コース (${checked}/${total})`,
    adventTabDiary: (count) => `マイ・デイリー記録 (${count})`,
    adventTabDiaryShort: (count) => `マイ記録 (${count})`,
    adventTabPeers: (count) => `💙 一緒に走るBOICEたちの記録 (${count})`,
    adventTabPeersShort: (count) => `💙 BOICE (${count})`,
    adventUntilFinish: (dDay) => `ゴールまで ${dDay === 0 ? 'D-DAY' : `D-${dDay}`}`,
    adventProgressLabel: (pct, checked, total) => `完走率 ${pct}% (${checked} / ${total}日)`,
    adventMonths: {
      '2026-11': 'LAP 1 · 11月スタート',
      '2026-12': 'LAP 2 · 12月疾走',
      '2027-01': 'LAP 3 · 1月スパート',
      '2027-02': 'LAP 4 · 2月ゴール',
    },
    adventAll88: '全88日コース',
    adventLockedToast: (y, m, d, dDay) =>
      `🔒 ${y}年${m}月${d}日(D-${dDay})の0時にこの区間がオープンします！`,
    adventCheckedBadge: '✅ 出席完了',
    adventAllMdDone: '🎉 全MDアイテム獲得完了',
    adventDoneCountNext: (count, nextDay) => `✅ ${count}回完了 · 次(${nextDay}回目)`,
    adventNextItemLabel: (day) => `🎁 ${day}回目アイテム獲得`,
    adventTodayReward: '🎁 今日の完走報酬',
    adventTodayQuestion: '💬 今日のBOICE質問',
    adventMyRecordPrefix: '自分の記録: ',
    adventAnswerLabel: '質問に答えてアイテムを獲得する',
    adventAnswerPlaceholder:
      '質問に答えると1回目ティボン、2回目うちわ、3回目キャップの順にアイテムが解放されます！(最大120文字)',
    adventPeerRecords: '💙 一緒に走るBOICEたちの記録',
    adventPeersAllFilter: 'すべての日付',
    adventPeersDayFilter: (month, day) => `${month}/${day}の質問のみ`,
    adventPeersViewAllBtn: (count) => `💙 BOICEたちの匿名記録を見る (${count}) →`,
    adventEmptyPeers: 'まだ共有された匿名記録がありません。最初の記録を残してみましょう！💙',
    adventAnonymousLabel: '匿名BOICE',
    adventUpdateAnswerBtn: '💙 今日の回答を更新',
    adventCompleteAnswerBtn: '✅ 回答完了 & アイテムを受け取る',
    adventEmptyDiary: 'まだ出席記録がありません。カレンダーから今日の日付に最初のスタンプを押しましょう！💙',
    adventLockedCardTitle: (m, d) => `🔒 ${m}月${d}日 0時にオープンします`,
    adventLockedCardDesc: (y, m, d, dDay) =>
      `${y}年${m}月${d}日 (D-${dDay}) 00:00 KST に質問と報酬が解放されます。もうしばらくお待ちください！💙`,
    adminModeBadge: '👑 管理者モード',
    settingsAdminLabel: '管理者モード',
    settingsAdminMaintenanceDesc: '現在システムメンテナンス中です。',
    settingsAdminMaintenanceBtn: 'メンテナンス中',
    settingsAdminActiveDesc: '全88日分の質問とすべてのMDアイテムが解放されています。',
    settingsAdminOffDesc: '一般ファン画面をプレビュー中です。',
    settingsAdminToggleOn: '管理者 ON',
    settingsAdminToggleOff: '一般モード',
    profileAdminBanner: '👑 管理者モード有効 · すべてのMDアイテムを着せ替えできます！',
    profileTitle: 'マイアバター & MD着せ替え',
    profileSubtitle: 'ヘアスタイル · キャップ · トラックジャケット · ティボン · うちわ · スローガン',
    profileBannerTitle: (count) => `デイリー質問参加 · ${count}回完了`,
    profileBannerAllDone: '🎉 すべてのMD着用アイテムを獲得しました！',
    profileBannerNext: (day, label) => `${day}回目アイテム獲得: ${label}`,
    profileAnswerBtn: '質問に答える →',
    profileNicknameLabel: 'BOICE ニックネーム',
    profileNicknamePlaceholder: 'ニックネームを入力',
    profileHairLabel: 'ヘアスタイル選択',
    profileHairOptions: {
      long: { name: 'ロングストレート', desc: '肩の下まで流れるロングヘア' },
      ponytail: { name: 'ポニーテール', desc: '走る時に揺れるリボンポニーテール' },
      short: { name: 'スポーティショート', desc: 'すっきり軽快なショートカット' },
    },
    profileCapLabel: '01. キャップ着用',
    profileCapOptions: {
      official_cap: 'ホワイトデニムキャップ',
      navy_cap: 'ディープネイビーキャップ',
      none: '着用しない',
    },
    profileCapLockToast: (day, name) =>
      `🔒 アドベント質問に${day}回回答すると [${name}] を獲得できます！`,
    profileDayGain: (day) => `${day}回目獲得`,
    profileOutfitLabel: '02. トップス着用',
    profileOutfitOptions: {
      track_jacket: { name: 'トラックジャケット', desc: 'ブルーライン & CNBLUEパッチ' },
      white_tee: { name: 'ホワイトコンサートT', desc: '爽やかなブルーロゴポイント' },
      navy_tee: { name: 'ネイビーツアーT', desc: 'スカイブルーのシグネチャー柄' },
      sky_tee: { name: 'スカイブルーBOICE T', desc: '清涼感のある空色応援ルック' },
    },
    profileOutfitLockToast: (day, name) =>
      `🔒 アドベント質問に${day}回回答すると [${name}] を着用できます！`,
    profileDayUnit: (day) => `${day}回目`,
    profileHandTitle: '手に持つ応援MD',
    profileHandSloganNote: 'スローガンは両手使用',
    profileLightstickLockToast: '🔒 アドベント1回目の質問に答えるとティボンを獲得できます！',
    profileLightstickOnlyLocked: '🔒 1回目 ティボン',
    profileLightstickOnly: '💎 ティボンのみ',
    profileFanLockToast: '🔒 アドベント2回目の質問に答えるとエバティうちわを獲得できます！',
    profileFanOnlyLocked: '🔒 2回目 うちわ',
    profileFanOnly: '🪭 うちわのみ',
    profileSloganLockToast: '🔒 アドベント4回目の質問に答えると両手スローガンを獲得できます！',
    profileSloganBothLocked: '🔒 4回目 スローガン',
    profileSloganBoth: '💙 両手スローガン',
    profileBothClear: '🙌 両手を空ける',
    profileLeftHand: '左手',
    profileRightHand: '右手',
    profileHandNone: 'なし',
    profileHandLightstick: '💎 ティボン',
    profileHandFan: '🪭 うちわ',
    profileLightstickColorLabel: '03. ティボン発光カラー',
    profileColorLockToast: (day, colorName) =>
      `🔒 アドベント${day}回目の質問に答えると [${colorName}] カラーが解放されます！`,
    profileColorNames: {
      '#2563eb': 'ブルー',
      '#38bdf8': 'スカイブルー',
      '#e0f2fe': 'ホワイト',
      '#fbbf24': 'ゴールド',
      '#f472b6': 'ピンク',
      '#ef4444': 'レッド',
    },
  },
};

interface LanguageContextValue {
  lang: AppLang;
  setLang: (lang: AppLang) => void;
  t: TranslationDict;
}

const LanguageContext = createContext<LanguageContextValue>({
  lang: 'ko',
  setLang: () => {},
  t: UI_TRANSLATIONS.ko,
});

export function LanguageProvider({
  lang,
  setLang,
  children,
}: {
  lang: AppLang;
  setLang: (lang: AppLang) => void;
  children: React.ReactNode;
}) {
  return (
    <LanguageContext.Provider value={{ lang, setLang, t: UI_TRANSLATIONS[lang] }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useI18n() {
  return useContext(LanguageContext);
}
