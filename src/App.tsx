import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Users,
  Sparkles,
  Calendar,
  Volume2,
  VolumeX,
  X,
  Send,
  Compass,
  Footprints,
  LayoutGrid,
  Building2,
  Star,
  MapPin,
  Gamepad2,
  Flame,
  Settings,
  ChevronUp,
} from 'lucide-react';
import type { User } from 'firebase/auth';
import {
  LANG_OPTIONS,
  LanguageProvider,
  UI_TRANSLATIONS,
  type AppLang,
} from './i18n/LanguageContext';

import {
  ARENA_SECTIONS,
  getSeatSectionByLabel,
} from './constants/arenaSections';
import {
  ADVENT_DAILY_LIST,
  ADVENT_END_DATE,
  ADVENT_START_DATE,
  ADVENT_UNLOCK_MILESTONES,
  ARENA_AUDIO_TRACKS,
  createRoomNpcs,
  DOME_ALBUM_SPINES,
  FLOWER_COLORS,
  getConcertDDay,
  getKstTodayStr,
  getLanePosition,
  INITIAL_MEMOS,
  LANE_RADII,
  MAX_ROOM_CAPACITY,
  OUTFIT_OPTIONS,
  PLAZA_AUDIO_TRACK,
  PLAZA_BENCHES,
  ROOM_LIST,
  TRACK_CENTER_X,
  TRACK_CENTER_Z,
} from './constants/plazaData';
import {
  addPublicAdventAnswer,
  addPublicFlowerMemo,
  deletePublicFlowerMemo,
  initFirebaseAuth,
  loadLocalUserState,
  saveLocalUserState,
  saveUserCloudState,
  signInWithGoogle,
  signOutFirebase,
  subscribeFlowerMemos,
  subscribePublicAdventAnswers,
  subscribeUserCloudState,
  togglePublicFlowerMemoLike,
  updatePublicFlowerMemo,
} from './services/db';
import {
  createAlbumSpineTexture,
  createEbddLogoScreenTexture,
  createMarqueeTexture,
  createNameTagTexture,
  createPlazaGroundTexture,
  createSeatLabelTexture,
  createSunsetSkyTexture,
} from './three/textures';
import { buildBloomFlowerMesh } from './three/propsBuilders';
import { buildBandMemberMesh, buildFanAvatarMesh } from './three/avatarBuilder';
import { FlowerBloomIcon } from './components/AvatarPreview3D';
import { SeatMapModal } from './components/SeatMapModal';
import { AdventModal } from './components/modals/AdventModal';
import { FlowerMemosModal } from './components/modals/FlowerMemosModal';
import { RoomSelectModal } from './components/modals/RoomSelectModal';
import { ProfileModal } from './components/modals/ProfileModal';
import { MiniGamesModal } from './components/modals/MiniGamesModal';
import { SettingsModal } from './components/modals/SettingsModal';
import type {
  ActiveModalType,
  AdventDailyItem,
  AvatarAction,
  DomeAlbumSpineInfo,
  FanPeer,
  PlazaMemo,
  PublicAdventAnswer,
  SeatSectionInfo,
  SkyTheme,
  UserProfileState,
  ViewMode,
} from './types/plaza';

declare global {
  interface Window {
    THREE: any;
    webkitAudioContext?: typeof AudioContext;
  }
}

export function App() {
  // --- 클라우드 인증 & 동기화 상태 ---
  const [user, setUser] = useState<User | null>(null);
  const [cloudSynced, setCloudSynced] = useState<boolean>(false);
  const [authFallbackNeeded, setAuthFallbackNeeded] = useState<boolean>(false);
  const [publicAdventAnswers, setPublicAdventAnswers] = useState<PublicAdventAnswer[]>([]);
  const lastSavedSnapshotRef = useRef<string>('');

  // --- 3D & 환경 상태 ---
  const [threeReady, setThreeReady] = useState<boolean>(false);
  const [skyTheme, setSkyTheme] = useState<SkyTheme>('day');
  const skyThemeRef = useRef<SkyTheme>('day');
  useEffect(() => {
    skyThemeRef.current = skyTheme;
  }, [skyTheme]);
  const [viewMode, setViewMode] = useState<ViewMode>('plaza');
  const viewModeRef = useRef<ViewMode>('plaza');
  const [currentRoomId, setCurrentRoomId] = useState<number>(1);
  const currentRoomIdRef = useRef<number>(1);
  const [lang, setLang] = useState<AppLang>(() => {
    try {
      const saved = localStorage.getItem('kspo_plaza_lang');
      if (saved === 'ko' || saved === 'en' || saved === 'zh' || saved === 'ja') return saved;
    } catch {
      // ignore storage access issues
    }
    return 'ko';
  });
  const handleChangeLang = useCallback((nextLang: AppLang) => {
    setLang(nextLang);
    try {
      localStorage.setItem('kspo_plaza_lang', nextLang);
    } catch {
      // ignore storage access issues
    }
  }, []);
  const t = UI_TRANSLATIONS[lang];
  const [toastMsg, setToastMsg] = useState<string>('');
  const toastTimerRef = useRef<number | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => {
      setToastMsg('');
    }, 3200);
  }, []);

  const defaultProfileRef = useRef<UserProfileState>({
    name: `보이스_${Math.floor(100 + Math.random() * 899)}`,
    seatZone: ARENA_SECTIONS[0].label,
    hoodieColor: '#ffffff',
    lightstickColor: '#2563eb',
    hairStyle: 'long',
    outfitStyle: 'white_tee',
    capStyle: 'none',
    hasSloganTowel: false,
    hasWristband: true,
    leftHandItem: 'none',
    rightHandItem: 'none',
  });

  const initialLocalStateRef = useRef(loadLocalUserState(defaultProfileRef.current));

  // --- 내 아바타 프로필 (기본 착장으로 시작, 어드벤트 질문 답변 시 MD 순차 해금) ---
  const [myProfile, setMyProfile] = useState<UserProfileState>(
    () => initialLocalStateRef.current?.myProfile ?? defaultProfileRef.current
  );

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
  const pendingBenchRef = useRef<{ id: number; x: number; z: number; rot: number } | null>(null);

  const [myAction, setMyAction] = useState<AvatarAction>('idle');
  const myActionRef = useRef<AvatarAction>('idle');
  const [speechInput, setSpeechInput] = useState<string>('');
  const mySpeechRef = useRef<string>('');
  const mySpeechTimerRef = useRef<number | null>(null);

  // --- 작성자 식별자 (내가 쓴 꽃 메모 수정/삭제 권한 확인용) ---
  const localWriterIdRef = useRef<string>('');
  if (!localWriterIdRef.current) {
    try {
      const savedWriterId = window.localStorage.getItem('kspo_plaza_writer_id');
      if (savedWriterId) {
        localWriterIdRef.current = savedWriterId;
      } else {
        const createdWriterId = `writer-${Math.random().toString(36).slice(2, 10)}`;
        window.localStorage.setItem('kspo_plaza_writer_id', createdWriterId);
        localWriterIdRef.current = createdWriterId;
      }
    } catch {
      localWriterIdRef.current = `writer-${Math.random().toString(36).slice(2, 10)}`;
    }
  }
  const myWriterIds = useMemo(() => {
    const ids = [localWriterIdRef.current];
    if (user?.uid && !ids.includes(user.uid)) ids.push(user.uid);
    return ids;
  }, [user]);

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
  const [newMemoColor, setNewMemoColor] = useState<string>(FLOWER_COLORS[6].hex);

  // --- 매일매일 데일리 어드벤트 캘린더 (~2027.02.20) ---
  const todayKstStr = useMemo(() => getKstTodayStr(), []);
  const defaultSelectedDate = useMemo(() => {
    if (todayKstStr < ADVENT_START_DATE) return ADVENT_START_DATE;
    if (todayKstStr > ADVENT_END_DATE) return ADVENT_END_DATE;
    return todayKstStr;
  }, [todayKstStr]);

  const [checkedDates, setCheckedDates] = useState<string[]>(
    () => initialLocalStateRef.current?.checkedDates ?? []
  );
  const [selectedAdventDate, setSelectedAdventDate] = useState<string>(defaultSelectedDate);
  const [selectedAdventMonth, setSelectedAdventMonth] = useState<string>(
    defaultSelectedDate.slice(0, 7)
  );
  const [adventAnswerInput, setAdventAnswerInput] = useState<string>('');
  const [adventAnswers, setAdventAnswers] = useState<Record<string, string>>(
    () => initialLocalStateRef.current?.adventAnswers ?? {}
  );

  // --- 모달 & 미니게임 & 오디오 ---
  const [activeModal, setActiveModal] = useState<ActiveModalType>('none');
  const [miniGameTab, setMiniGameTab] = useState<'run' | 'roof'>('run');
  const [ebddJumps, setEbddJumps] = useState<number>(
    () => initialLocalStateRef.current?.ebddJumps ?? 1
  );
  const [runBestScore, setRunBestScore] = useState<number>(
    () => initialLocalStateRef.current?.runBestScore ?? 0
  );
  const [roofBestScore, setRoofBestScore] = useState<number>(
    () => initialLocalStateRef.current?.roofBestScore ?? 0
  );
  const [adventTab, setAdventTab] = useState<'calendar' | 'diary' | 'peers'>('calendar');
  const [actionMenuOpen, setActionMenuOpen] = useState<boolean>(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const [trackIndex, setTrackIndex] = useState<number>(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const viewModeAudioRef = useRef<ViewMode>('plaza');
  viewModeAudioRef.current = viewMode;

  // 1) Firebase 인증 초기화
  useEffect(() => {
    return initFirebaseAuth(setUser, setAuthFallbackNeeded);
  }, []);

  // 2) 인증 완료 후 Firestore 실시간 동기화
  useEffect(() => {
    if (!user) return undefined;

    const unsubUser = subscribeUserCloudState(
      user.uid,
      myProfileRef.current,
      (loaded) => {
        lastSavedSnapshotRef.current = JSON.stringify(loaded);
        setMyProfile(loaded.myProfile);
        setCheckedDates(loaded.checkedDates);
        setAdventAnswers(loaded.adventAnswers);
        setEbddJumps(loaded.ebddJumps);
        setRunBestScore(loaded.runBestScore);
        setRoofBestScore(loaded.roofBestScore);
      },
      () => setCloudSynced(true)
    );

    const unsubAdventPublic = subscribePublicAdventAnswers(setPublicAdventAnswers);
    const unsubMemos = subscribeFlowerMemos(setMemos);

    return () => {
      unsubUser();
      unsubAdventPublic();
      unsubMemos();
    };
  }, [user]);

  // 3) 내 프로필·어드벤트 답변·미니게임 기록 로컬 + 클라우드 자동 저장
  useEffect(() => {
    const payload = {
      myProfile,
      checkedDates,
      adventAnswers,
      ebddJumps,
      runBestScore,
      roofBestScore,
    };
    saveLocalUserState(payload);

    if (!user || !cloudSynced) return undefined;
    const serialized = JSON.stringify(payload);
    if (serialized === lastSavedSnapshotRef.current) return undefined;

    const timer = window.setTimeout(() => {
      lastSavedSnapshotRef.current = serialized;
      saveUserCloudState(user.uid, payload).catch((err) =>
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
    sunsetSkyDome?: any;
    sunsetSunMesh?: any;
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
  // 4. Three.js 동적 로드 (r128)
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
  // 5. 배경 음악 (광장: 달리기 1곡 반복 / 공연장: 3곡 순차 재생)
  // ============================================================================
  const activeTracks = useMemo(
    () => (viewMode === 'plaza' ? [PLAZA_AUDIO_TRACK] : ARENA_AUDIO_TRACKS),
    [viewMode]
  );

  const ensureAudioInstance = useCallback(() => {
    if (!audioRef.current) {
      const audio = new Audio();
      audio.volume = 0.45;
      audio.addEventListener('ended', () => {
        if (viewModeAudioRef.current === 'arena') {
          setTrackIndex((prev) => {
            const nextIdx = (prev + 1) % ARENA_AUDIO_TRACKS.length;
            if (audioRef.current) {
              audioRef.current.src = ARENA_AUDIO_TRACKS[nextIdx].src;
              audioRef.current.loop = false;
              audioRef.current.play().catch(() => {});
            }
            return nextIdx;
          });
        }
      });
      audioRef.current = audio;
    }
    return audioRef.current;
  }, []);

  const toggleAudio = useCallback(() => {
    const audio = ensureAudioInstance();
    const currentTrack = activeTracks[trackIndex % activeTracks.length] ?? activeTracks[0];
    if (isPlayingAudio) {
      audio.pause();
      setIsPlayingAudio(false);
    } else {
      audio.src = currentTrack.src;
      audio.loop = viewMode === 'plaza';
      audio
        .play()
        .then(() => {
          setIsPlayingAudio(true);
          showToast(`🎵 ${currentTrack.title} 재생 중`);
        })
        .catch(() => {
          setIsPlayingAudio(false);
          showToast('🎵 브라우저에서 재생이 차단되었습니다. BGM 버튼을 다시 눌러주세요.');
        });
    }
  }, [ensureAudioInstance, activeTracks, trackIndex, isPlayingAudio, viewMode, showToast]);

  // 광장 ↔ 공연장 이동 시 해당 구역 플레이리스트로 자동 전환
  useEffect(() => {
    setTrackIndex(0);
    if (!audioRef.current || !isPlayingAudio) return;
    const nextTrack = viewMode === 'plaza' ? PLAZA_AUDIO_TRACK : ARENA_AUDIO_TRACKS[0];
    audioRef.current.src = nextTrack.src;
    audioRef.current.loop = viewMode === 'plaza';
    audioRef.current.play().catch(() => {});
  }, [viewMode]); // eslint-disable-line react-hooks/exhaustive-deps

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
      if (ud.hairMesh && ud.hairMesh.material) {
        ud.hairMesh.material.color.set(
          myProfile.hairStyle === 'short' ? 0x1e1b18 : 0x261c19
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
      pendingBenchRef.current = null;
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
      pendingBenchRef.current = null;
      myActionRef.current = 'idle';
      setMyAction('idle');

      const THREE = window.THREE;
      const archMesh = sceneObjectsRef.current.archBannerMesh;
      if (THREE && archMesh) {
        const tex = createMarqueeTexture(
          THREE,
          `LANE ${room.id} · KSPO DOME`,
          "KEEP DREAMIN' KEEP RUNNIN'",
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
        } else if (data.type === 'update_memo') {
          setMemos((prev) =>
            prev.map((m) =>
              m.id === data.id ? { ...m, text: data.text, color: data.color } : m
            )
          );
        } else if (data.type === 'delete_memo') {
          setMemos((prev) => prev.filter((m) => m.id !== data.id));
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
      if (action !== 'sit') {
        pendingBenchRef.current = null;
        if (viewModeRef.current === 'plaza') {
          myPosRef.current.targetY = 0;
        }
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

  const handleSitOnBench = useCallback(
    (specificBench?: { id: number; x: number; z: number; rot: number }) => {
      if (viewModeRef.current === 'arena') {
        triggerAction('sit', '🪑 공연장 좌석에 편하게 앉았습니다.');
        return;
      }

      let targetBench = specificBench;
      if (!targetBench) {
        let bestDist = Infinity;
        for (const b of PLAZA_BENCHES) {
          const d = Math.hypot(b.x - myPosRef.current.x, b.z - myPosRef.current.z);
          if (d < bestDist) {
            bestDist = d;
            targetBench = b;
          }
        }
      }
      if (!targetBench) return;

      isTrackRunningRef.current = false;
      const distToBench = Math.hypot(
        targetBench.x - myPosRef.current.x,
        targetBench.z - myPosRef.current.z
      );

      if (distToBench <= 0.25) {
        pendingBenchRef.current = null;
        myPosRef.current.x = targetBench.x;
        myPosRef.current.z = targetBench.z;
        myPosRef.current.targetX = targetBench.x;
        myPosRef.current.targetZ = targetBench.z;
        myPosRef.current.targetY = 0.34;
        myPosRef.current.rotationY = targetBench.rot;
        myActionRef.current = 'sit';
        setMyAction('sit');
        showToast('🪑 벤치에 앉아 잠시 숨을 고릅니다.');
        return;
      }

      pendingBenchRef.current = targetBench;
      myPosRef.current.targetX = targetBench.x;
      myPosRef.current.targetZ = targetBench.z;
      myPosRef.current.targetY = 0;
      myActionRef.current = 'walk';
      setMyAction('walk');
      showToast('🪑 가까운 벤치로 걸어가서 앉습니다!');
    },
    [triggerAction, showToast]
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
  // 8. 메인 Three.js 3D 씬 초기화 (외부 러닝트랙 광장 + KSPO DOME 내부 좌석배치도)
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

      // 노을 골든아워(붉은색~주황~노란빛) 그라데이션 스카이 돔 & 석양
      const sunsetSkyTex = createSunsetSkyTexture(THREE);
      const sunsetSkyDome = new THREE.Mesh(
        new THREE.SphereGeometry(165, 32, 24),
        new THREE.MeshBasicMaterial({
          map: sunsetSkyTex,
          side: THREE.BackSide,
          depthWrite: false,
          fog: false,
        })
      );
      sunsetSkyDome.visible = skyThemeRef.current === 'sunset';
      plazaWorldGroup.add(sunsetSkyDome);

      const sunsetSunMesh = new THREE.Group();
      const sunCore = new THREE.Mesh(
        new THREE.SphereGeometry(8.5, 24, 24),
        new THREE.MeshBasicMaterial({ color: 0xfdba74, fog: false })
      );
      const sunHalo = new THREE.Mesh(
        new THREE.SphereGeometry(13.5, 24, 24),
        new THREE.MeshBasicMaterial({
          color: 0xef4444,
          transparent: true,
          opacity: 0.44,
          depthWrite: false,
          fog: false,
        })
      );
      sunsetSunMesh.add(sunCore, sunHalo);
      sunsetSunMesh.position.set(-46, 15, -96);
      sunsetSunMesh.visible = skyThemeRef.current === 'sunset';
      plazaWorldGroup.add(sunsetSunMesh);

      const groundTex = createPlazaGroundTexture(THREE);
      const ground = new THREE.Mesh(
        new THREE.CircleGeometry(58, 64),
        new THREE.MeshStandardMaterial({ map: groundTex, roughness: 0.85 })
      );
      ground.rotation.x = -Math.PI / 2;
      ground.name = 'plaza_ground';
      plazaWorldGroup.add(ground);

      // START / KEEP RUNNIN' 메인 러닝 아치 게이트
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
        `LANE ${initRoom.id} · KSPO DOME`,
        "KEEP DREAMIN' KEEP RUNNIN'",
        initRoom.accentHex
      );
      const archTop = new THREE.Mesh(
        new THREE.BoxGeometry(10.6, 1.55, 0.55),
        new THREE.MeshBasicMaterial({ map: archBannerTex })
      );
      archTop.position.set(0, 4.6, 0);
      startArchGroup.add(archPillarL, archPillarR, archTop);
      plazaWorldGroup.add(startArchGroup);

      // KSPO DOME 랜드마크 건축물
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
      const degToRad = (deg: number) => (deg * Math.PI) / 180;
      const gateHalfDeg = 18;
      const bayDeg = (360 - gateHalfDeg * 2) / 15;
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

        const divRad = degToRad(startDeg);
        const pillar = new THREE.Mesh(pillarGeo, pillarMat);
        pillar.position.set(Math.sin(divRad) * 15.62, 3.8, Math.cos(divRad) * 15.62);
        pillar.rotation.y = divRad;
        domeGroup.add(pillar);
      });

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

      const marqueeTex = createEbddLogoScreenTexture(
        THREE,
        './assets/aistudio/_____2026-11-25_154800_832ac68b.png',
        {
          width: 1280,
          height: 360,
          footerText: '2027.02.20 SAT - 02.21 SUN · KSPO DOME',
          accentHex: '#2563eb',
        }
      );
      const gateBezelMat = new THREE.MeshStandardMaterial({
        color: 0x0f172a,
        roughness: 0.4,
        metalness: 0.3,
      });
      const marqueeBoard = new THREE.Mesh(
        new THREE.BoxGeometry(9.2, 2.5, 0.6),
        [
          gateBezelMat,
          gateBezelMat,
          gateBezelMat,
          gateBezelMat,
          new THREE.MeshBasicMaterial({ map: marqueeTex }),
          gateBezelMat,
        ]
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
        '💎 데일리 어드벤트 출석 (~2027.02.20-21)',
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

      // 주변 나무 & 벤치
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

      const benchWoodMat = new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.7 });
      const benchFrameMat = new THREE.MeshStandardMaterial({
        color: 0x1e293b,
        metalness: 0.45,
        roughness: 0.5,
      });
      PLAZA_BENCHES.forEach((b) => {
        const benchGroup = new THREE.Group();
        benchGroup.position.set(b.x, 0, b.z);
        benchGroup.rotation.y = b.rot;

        const seatPlank = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.14, 0.86), benchWoodMat);
        seatPlank.position.set(0, 0.46, 0);

        const backRest = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.52, 0.12), benchWoodMat);
        backRest.position.set(0, 0.82, -0.38);
        backRest.rotation.x = -0.14;

        [-1.08, 1.08].forEach((lx) => {
          const legFront = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.46, 0.14), benchFrameMat);
          legFront.position.set(lx, 0.23, 0.3);
          const legBack = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.88, 0.14), benchFrameMat);
          legBack.position.set(lx, 0.44, -0.36);
          const armRest = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.08, 0.76), benchFrameMat);
          armRest.position.set(lx, 0.66, 0.02);
          benchGroup.add(legFront, legBack, armRest);
        });

        benchGroup.add(seatPlank, backRest);
        benchGroup.traverse((child: any) => {
          child.userData = { ...child.userData, plazaBench: b };
        });
        plazaWorldGroup.add(benchGroup);
      });

      // ======================================================================
      // WORLD B: KSPO DOME 내부 3D 공연장
      // ======================================================================
      const arenaWorldGroup = new THREE.Group();
      arenaWorldGroup.visible = viewModeRef.current === 'arena';
      scene.add(arenaWorldGroup);

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

      const stageMainFront = new THREE.Mesh(new THREE.BoxGeometry(22.0, 1.45, 5.2), stageMat);
      stageMainFront.position.set(0, 0.725, -11.4);
      const stageMainMid = new THREE.Mesh(new THREE.BoxGeometry(17.8, 1.45, 2.2), stageMat);
      stageMainMid.position.set(0, 0.725, -14.8);
      const stageMainBack = new THREE.Mesh(new THREE.BoxGeometry(13.6, 1.45, 2.0), stageMat);
      stageMainBack.position.set(0, 0.725, -16.6);
      arenaWorldGroup.add(stageMainFront, stageMainMid, stageMainBack);

      const stageFrontLed = new THREE.Mesh(new THREE.BoxGeometry(22.1, 0.14, 0.16), stageEdgeGlowMat);
      stageFrontLed.position.set(0, 1.42, -8.8);
      arenaWorldGroup.add(stageFrontLed);

      const bandRiser = new THREE.Mesh(new THREE.BoxGeometry(13.5, 0.65, 3.2), stageMat);
      bandRiser.position.set(0, 1.77, -14.0);
      arenaWorldGroup.add(bandRiser);

      const screenFrameMat = new THREE.MeshStandardMaterial({
        color: 0x0f172a,
        roughness: 0.4,
        metalness: 0.3,
      });
      const arenaLedTex = createEbddLogoScreenTexture(
        THREE,
        './assets/aistudio/_____2026-11-25_154800_832ac68b.png',
        {
          width: 1280,
          height: 512,
          footerText: 'CNBLUE LIVE 2027.02.20 - 02.21 · KSPO DOME',
          accentHex: '#2563eb',
        }
      );
      const stageLed = new THREE.Mesh(
        new THREE.BoxGeometry(17.6, 6.8, 0.5),
        [
          screenFrameMat,
          screenFrameMat,
          screenFrameMat,
          screenFrameMat,
          new THREE.MeshBasicMaterial({ map: arenaLedTex }),
          screenFrameMat,
        ]
      );
      stageLed.position.set(0, 5.4, -17.4);
      arenaWorldGroup.add(stageLed);

      const sideScreenTex = createEbddLogoScreenTexture(
        THREE,
        './assets/aistudio/image_6b0d8129.png',
        {
          width: 768,
          height: 1024,
          accentHex: '#2563eb',
        }
      );
      const leftSideScreen = new THREE.Mesh(
        new THREE.BoxGeometry(4.8, 6.2, 0.4),
        [
          screenFrameMat,
          screenFrameMat,
          screenFrameMat,
          screenFrameMat,
          new THREE.MeshBasicMaterial({ map: sideScreenTex }),
          screenFrameMat,
        ]
      );
      leftSideScreen.position.set(-11.4, 5.2, -14.6);
      leftSideScreen.rotation.y = 0.34;

      const rightSideScreenTex = createEbddLogoScreenTexture(
        THREE,
        './assets/aistudio/image_dfa5f632.png',
        {
          width: 768,
          height: 1080,
          accentHex: '#2563eb',
        }
      );
      const rightSideScreen = new THREE.Mesh(
        new THREE.BoxGeometry(4.8, 6.2, 0.4),
        [
          screenFrameMat,
          screenFrameMat,
          screenFrameMat,
          screenFrameMat,
          new THREE.MeshBasicMaterial({ map: rightSideScreenTex }),
          screenFrameMat,
        ]
      );
      rightSideScreen.position.set(11.4, 5.2, -14.6);
      rightSideScreen.rotation.y = -0.34;
      arenaWorldGroup.add(leftSideScreen, rightSideScreen);

      const ampMat = new THREE.MeshStandardMaterial({ color: 0x1f2937, roughness: 0.6 });
      const ampL = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.8, 0.9), ampMat);
      ampL.position.set(-6.8, 2.95, -14.2);
      const ampR = ampL.clone();
      ampR.position.x = 6.8;
      arenaWorldGroup.add(ampL, ampR);

      // 반원 닻(⚓) 모양 돌출 무대
      const stageH = 1.38;
      const anchorCenterZ = -5.0;
      const outerR = 9.0;
      const innerR = 7.0;

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

      const anchorArcGroup = new THREE.Group();
      anchorArcGroup.position.set(0, 0, anchorCenterZ);

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

      // 씨엔블루 3인 멤버 무대 배치
      const memberMinhyuk = buildBandMemberMesh(THREE, {
        id: 'minhyuk',
        name: '🥁 강민혁',
        roleLabel: 'DRUM · 드러머',
        quote: '🥁 강민혁: 심장 터지는 드럼 비트로 끝까지 함께 달려요!!',
      });
      memberMinhyuk.position.set(-4.3, 1.45, -11.4);
      arenaWorldGroup.add(memberMinhyuk);

      const memberYonghwa = buildBandMemberMesh(THREE, {
        id: 'yonghwa',
        name: '🎸 정용화',
        roleLabel: '에블바디뛰엌!!!!!!',
        quote: '🎸 정용화: 에블바디뛰엌!!!!!! 보이스 소리 질러!!',
      });
      memberYonghwa.position.set(0, 1.38, 3.0);
      arenaWorldGroup.add(memberYonghwa);

      const memberJungshin = buildBandMemberMesh(THREE, {
        id: 'jungshin',
        name: '🎸 이정신',
        roleLabel: 'BASS · 에바뛰 함께 달려!',
        quote: '🎸 이정신: 묵직한 베이스 그루브로 체조경기장 흔들어볼게요 💙',
      });
      memberJungshin.position.set(4.3, 1.45, -10.5);
      arenaWorldGroup.add(memberJungshin);

      // 메인 무대 위 고정 스탠드 마이크 (보컬/베이스 스팟)
      [
        { x: 0, z: -9.3 },
        { x: 4.3, z: -10.1 },
      ].forEach((mp) => {
        const micStand = new THREE.Group();
        micStand.position.set(mp.x, 1.45, mp.z);
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
        micHead.position.set(0, 1.5, 0.04);
        micStand.add(micBase, micPole, micHead);
        arenaWorldGroup.add(micStand);
      });

      // CONSOLE 부스
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

      // 계단식 좌석 구역 & 개별 의자 열 & 투명 유리 난간 배치
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
          const isCenterAB = sec.id === 'FLOOR-A' || sec.id === 'FLOOR-B';
          let floorPlate: any;

          if (isCenterAB) {
            const pocketR = 6.25;
            const centerSy = 5.0;
            const topSy = 4.6;
            const innerX = 1.65;
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
          const steps = sec.tier === '1F' ? 6 : 8;
          const baseBottomY = sec.tier === '1F' ? 0.6 : 4.2;
          const topY = sec.y;
          const stepH = (topY - baseBottomY) / steps;
          const stepD = sec.depth / steps;

          const underStruct = new THREE.Mesh(
            new THREE.BoxGeometry(sec.width, baseBottomY, sec.depth),
            new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.8 })
          );
          underStruct.position.y = baseBottomY / 2;
          underStruct.userData = { seatZone: sec.label, seatSection: sec };
          secGroup.add(underStruct);

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

            const chairRow = new THREE.Mesh(
              new THREE.BoxGeometry(sec.width - 0.35, 0.24, 0.16),
              seatChairMat
            );
            chairRow.position.set(0, curH + 0.12, localZ + stepD * 0.22);
            chairRow.userData = { seatZone: sec.label, seatSection: sec };
            secGroup.add(chairRow);
          }

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
        sunsetSkyDome,
        sunsetSunMesh,
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

      // 카메라 컨트롤 & 포인터/터치/키보드 인터랙션
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
            if (hit.object.userData?.plazaBench) {
              handleSitOnBench(hit.object.userData.plazaBench);
              targetRing.visible = false;
              return;
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

              const isWalkingToFrontGate = Math.abs(tx) < 4.2 && tz < -4.5 && tz > -12.5;
              if (isWalkingToFrontGate) {
                tz = Math.max(-7.8, tz);
              } else {
                const distToDome = Math.hypot(tx, tz - -23.5);
                if (distToDome < 18.2) {
                  const angle = Math.atan2(tz - -23.5, tx);
                  tx = Math.cos(angle) * 18.4;
                  tz = -23.5 + Math.sin(angle) * 18.4;
                }
              }

              isTrackRunningRef.current = false;
              pendingBenchRef.current = null;
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

      // 메인 애니메이션 루프 (60fps)
      const clock = new THREE.Clock();
      let dustCooldown = 0;
      let tearCooldown = 0;

      const spawnTearDrops = (x: number, y: number, z: number, rotY: number) => {
        const forwardX = Math.sin(rotY);
        const forwardZ = Math.cos(rotY);
        const rightX = Math.cos(rotY);
        const rightZ = -Math.sin(rotY);
        [-0.13, 0.13].forEach((eyeSide) => {
          const drop = new THREE.Mesh(
            new THREE.SphereGeometry(0.042, 6, 6),
            new THREE.MeshBasicMaterial({
              color: 0x38bdf8,
              transparent: true,
              opacity: 0.92,
            })
          );
          drop.scale.set(0.8, 1.35, 0.8);
          drop.position.set(
            x + rightX * eyeSide + forwardX * 0.4,
            y + 1.48,
            z + rightZ * eyeSide + forwardZ * 0.4
          );
          scene.add(drop);
          particles.push({
            mesh: drop,
            vy: -1.65 - Math.random() * 0.45,
            vx: forwardX * (0.28 + Math.random() * 0.18) + (Math.random() - 0.5) * 0.15,
            vz: forwardZ * (0.28 + Math.random() * 0.18) + (Math.random() - 0.5) * 0.15,
            life: 0.7,
          });
        });
      };

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

      // 정용화 & 이정신 무대 위 상시 질주 경로
      const yonghwaStagePath = [
        { x: 0, y: 1.45, z: -9.8 },
        { x: 0, y: 1.38, z: -4.0 },
        { x: 0, y: 1.38, z: 3.0 },
        { x: 3.0, y: 1.38, z: 2.4 },
        { x: 5.65, y: 1.38, z: 0.65 },
        { x: 7.5, y: 1.38, z: -2.0 },
        { x: 8.0, y: 1.38, z: -5.0 },
        { x: 7.5, y: 1.38, z: -2.0 },
        { x: 5.65, y: 1.38, z: 0.65 },
        { x: 3.0, y: 1.38, z: 2.4 },
        { x: 0, y: 1.38, z: 3.0 },
        { x: -3.0, y: 1.38, z: 2.4 },
        { x: -5.65, y: 1.38, z: 0.65 },
        { x: -7.5, y: 1.38, z: -2.0 },
        { x: -8.0, y: 1.38, z: -5.0 },
        { x: -7.5, y: 1.38, z: -2.0 },
        { x: -5.65, y: 1.38, z: 0.65 },
        { x: -3.0, y: 1.38, z: 2.4 },
        { x: 0, y: 1.38, z: 3.0 },
        { x: 0, y: 1.38, z: -4.0 },
        { x: 0, y: 1.45, z: -9.8 },
        { x: 7.5, y: 1.45, z: -9.8 },
        { x: 7.5, y: 1.45, z: -12.4 },
        { x: 1.5, y: 1.45, z: -11.4 },
      ];
      const yonghwaRunnerState = { wpIdx: 2 };

      const jungshinStagePath = [
        { x: 8.8, y: 1.45, z: -9.6 },
        { x: 1.2, y: 1.45, z: -9.5 },
        { x: -9.2, y: 1.45, z: -9.5 },
        { x: -9.2, y: 1.45, z: -13.0 },
        { x: -6.8, y: 1.45, z: -13.0 },
        { x: -9.2, y: 1.45, z: -9.5 },
        { x: 1.2, y: 1.45, z: -9.5 },
        { x: 2.2, y: 1.45, z: -12.6 },
        { x: 8.8, y: 1.45, z: -12.6 },
      ];
      const jungshinRunnerState = { wpIdx: 1 };

      const disposeObjectResources = (rootObj: any) => {
        rootObj?.traverse?.((obj: any) => {
          if (obj.geometry) obj.geometry.dispose();
          if (obj.material) {
            if (Array.isArray(obj.material)) {
              obj.material.forEach((m: any) => {
                if (m.map) m.map.dispose();
                m.dispose();
              });
            } else {
              if (obj.material.map) obj.material.map.dispose();
              obj.material.dispose();
            }
          }
        });
      };

      const animate = () => {
        if (isDisposed) return;
        animationFrameId = requestAnimationFrame(animate);
        const dt = Math.min(clock.getDelta(), 0.05);
        const elapsed = clock.getElapsedTime();
        dustCooldown -= dt;
        tearCooldown -= dt;

        // 1. 키보드 이동
        let keyDx = 0;
        let keyDz = 0;
        if (pressedKeys.has('w') || pressedKeys.has('arrowup')) keyDz -= 1;
        if (pressedKeys.has('s') || pressedKeys.has('arrowdown')) keyDz += 1;
        if (pressedKeys.has('a') || pressedKeys.has('arrowleft')) keyDx -= 1;
        if (pressedKeys.has('d') || pressedKeys.has('arrowright')) keyDx += 1;

        if ((keyDx !== 0 || keyDz !== 0) && viewModeRef.current === 'plaza') {
          isTrackRunningRef.current = false;
          pendingBenchRef.current = null;
          myPosRef.current.targetY = 0;
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
          pendingBenchRef.current = null;
          myPosRef.current.targetY = 0;
          const activeLaneIdx = Math.max(
            0,
            Math.min(LANE_RADII.length - 1, currentRoomIdRef.current - 1)
          );
          const laneR = LANE_RADII[activeLaneIdx];
          const linearSpeed = 8.4;
          const angularSpeed = linearSpeed / laneR;

          trackAngleRef.current -= angularSpeed * dt;
          const nextPt = getLanePosition(activeLaneIdx, trackAngleRef.current);

          const stepDx = nextPt.x - myPosRef.current.x;
          const stepDz = nextPt.z - myPosRef.current.z;
          const stepDist = Math.hypot(stepDx, stepDz);

          if (stepDist > 0.25) {
            const joinSpeed = 9.5;
            myPosRef.current.x += (stepDx / stepDist) * Math.min(stepDist, joinSpeed * dt);
            myPosRef.current.z += (stepDz / stepDist) * Math.min(stepDist, joinSpeed * dt);
            myPosRef.current.rotationY = Math.atan2(stepDx, stepDz);
          } else {
            myPosRef.current.x = nextPt.x;
            myPosRef.current.z = nextPt.z;
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
          } else if (pendingBenchRef.current && viewModeRef.current === 'plaza') {
            const bench = pendingBenchRef.current;
            pendingBenchRef.current = null;
            myPosRef.current.x = bench.x;
            myPosRef.current.z = bench.z;
            myPosRef.current.targetX = bench.x;
            myPosRef.current.targetZ = bench.z;
            myPosRef.current.targetY = 0.34;
            myPosRef.current.rotationY = bench.rot;
            myActionRef.current = 'sit';
            setMyAction('sit');
            targetRing.visible = false;
            showToast('🪑 벤치에 앉아 잠시 쉬며 숨을 고릅니다.');
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
          if (ud.cryGroup) {
            ud.cryGroup.visible = action === 'cry';
          }

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
                ud.heldSloganGroup.position.set(
                  0,
                  0.1 + Math.abs(Math.sin(elapsed * 16 + phase)) * 0.04,
                  0.56
                );
                ud.heldSloganGroup.rotation.set(
                  -0.08,
                  0,
                  Math.sin(elapsed * 16 + phase) * 0.07
                );
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
                ud.heldSloganGroup.position.set(
                  0,
                  1.3 + Math.sin(elapsed * 8.5 + phase) * 0.06,
                  0.24
                );
                ud.heldSloganGroup.rotation.set(
                  -0.1,
                  0,
                  Math.sin(elapsed * 8.5 + phase) * 0.09
                );
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
              if (ud.leftArmPivot) {
                ud.leftArmPivot.rotation.x = -2.28 + Math.sin(elapsed * 9 + phase) * 0.22;
                ud.leftArmPivot.rotation.z = -0.14 + Math.cos(elapsed * 9 + phase) * 0.08;
              }
              ud.rightArmPivot.rotation.x = -2.28 + Math.sin(elapsed * 9 + phase) * 0.22;
              ud.rightArmPivot.rotation.z = 0.14 + Math.cos(elapsed * 9 + phase) * 0.08;
              if (ud.heldSloganGroup) {
                ud.heldSloganGroup.position.set(
                  0,
                  1.26 + Math.sin(elapsed * 9 + phase) * 0.07,
                  0.28
                );
                ud.heldSloganGroup.rotation.set(
                  -0.1,
                  0,
                  Math.cos(elapsed * 9 + phase) * 0.12
                );
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
          } else if (action === 'cry') {
            ud.leftLeg.rotation.x = 0;
            ud.rightLeg.rotation.x = 0;
            ud.bodyGroup.position.y = 0.86 + Math.abs(Math.sin(elapsed * 8 + phase)) * 0.03;
            ud.bodyGroup.rotation.x = 0.08 + Math.sin(elapsed * 8 + phase) * 0.04;
            ud.bodyGroup.rotation.z = Math.sin(elapsed * 5 + phase) * 0.04;
            if (holdingSlogan) {
              if (ud.leftArmPivot) {
                ud.leftArmPivot.rotation.x = -0.92 + Math.sin(elapsed * 8 + phase) * 0.06;
                ud.leftArmPivot.rotation.z = -0.12;
              }
              ud.rightArmPivot.rotation.x = -0.92 + Math.sin(elapsed * 8 + phase) * 0.06;
              ud.rightArmPivot.rotation.z = 0.12;
              if (ud.heldSloganGroup) {
                ud.heldSloganGroup.position.set(0, 0.09, 0.54);
                ud.heldSloganGroup.rotation.set(0, 0, Math.sin(elapsed * 8 + phase) * 0.05);
              }
            } else {
              if (ud.leftArmPivot) {
                ud.leftArmPivot.rotation.x = -1.65 + Math.sin(elapsed * 10 + phase) * 0.16;
                ud.leftArmPivot.rotation.z = -0.35;
              }
              ud.rightArmPivot.rotation.x = -1.65 - Math.sin(elapsed * 10 + phase) * 0.16;
              ud.rightArmPivot.rotation.z = 0.35;
            }
            if (ud.tearDropL && ud.tearDropR) {
              const pL = (elapsed * 2.2 + phase) % 1;
              const pR = (elapsed * 2.2 + 0.5 + phase) % 1;
              ud.tearDropL.position.y = 0.63 - pL * 0.24;
              ud.tearDropL.position.z = 0.382 + pL * 0.03;
              ud.tearDropR.position.y = 0.63 - pR * 0.24;
              ud.tearDropR.position.z = 0.382 + pR * 0.03;
            }
            if (ud.tearStreamL && ud.tearStreamR) {
              const streamPulse = 0.88 + Math.sin(elapsed * 10 + phase) * 0.14;
              ud.tearStreamL.scale.y = streamPulse;
              ud.tearStreamR.scale.y = streamPulse;
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

        if (myActionRef.current === 'cry' && tearCooldown <= 0) {
          spawnTearDrops(
            myPosRef.current.x,
            myPosRef.current.y + myJumpY,
            myPosRef.current.z,
            myPosRef.current.rotationY
          );
          tearCooldown = 0.16;
        }

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

        // 3. 다른 팬(최대 30명) 3D 아바타 동기화
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

        // 3-2. 씨엔블루 3인 멤버 라이브 연주 & 무대 위 질주/워킹 애니메이션
        const advanceStageRunner = (
          memberGroup: any,
          path: Array<{ x: number; y: number; z: number }>,
          runnerState: { wpIdx: number },
          mode: 'always_run' | 'walk_run_cycle',
          phase: number
        ) => {
          if (!memberGroup?.userData) return;
          const isRunning =
            mode === 'always_run' ? true : (elapsed + phase) % 7.0 < 3.0;
          const speed = mode === 'always_run' ? 3.4 : isRunning ? 2.65 : 1.35;

          const wp = path[runnerState.wpIdx % path.length];
          const dx = wp.x - memberGroup.position.x;
          const dz = wp.z - memberGroup.position.z;
          const dist = Math.hypot(dx, dz);

          if (dist < 0.22) {
            runnerState.wpIdx = (runnerState.wpIdx + 1) % path.length;
          } else {
            const step = Math.min(dist, speed * dt);
            memberGroup.position.x += (dx / dist) * step;
            memberGroup.position.z += (dz / dist) * step;
            memberGroup.position.y += (wp.y - memberGroup.position.y) * Math.min(1, dt * 10);

            const targetYaw = Math.atan2(dx, dz);
            let yawDiff = targetYaw - memberGroup.rotation.y;
            while (yawDiff > Math.PI) yawDiff -= Math.PI * 2;
            while (yawDiff < -Math.PI) yawDiff += Math.PI * 2;
            memberGroup.rotation.y += yawDiff * Math.min(1, dt * 12);
          }

          const ud = memberGroup.userData;
          const strideFreq = isRunning ? 10.5 : 6.0;
          const runCycle = elapsed * strideFreq + phase;
          const legAmp = isRunning ? 0.8 : 0.44;
          if (ud.leftLeg && ud.rightLeg) {
            ud.leftLeg.rotation.x = Math.sin(runCycle) * legAmp;
            ud.rightLeg.rotation.x = -Math.sin(runCycle) * legAmp;
          }
          if (ud.hasLightstick) {
            ud.rightArmPivot.rotation.x = -2.25 + Math.sin(runCycle * 0.65) * 0.28;
            ud.rightArmPivot.rotation.z = -0.18 + Math.cos(runCycle * 0.65) * 0.1;
          } else {
            ud.rightArmPivot.rotation.x = -0.95 + Math.sin(runCycle) * (isRunning ? 0.3 : 0.16);
          }
          ud.bodyGroup.rotation.x = isRunning ? 0.14 : 0.05;
          ud.charGroup.position.y = Math.abs(Math.sin(runCycle)) * (isRunning ? 0.13 : 0.04);
        };

        if (memberMinhyuk?.userData) {
          const ud = memberMinhyuk.userData;
          ud.leftArmPivot.rotation.x = -0.95 + Math.sin(elapsed * 14) * 0.35;
          ud.rightArmPivot.rotation.x = -0.95 - Math.sin(elapsed * 14) * 0.35;
          ud.bodyGroup.position.y = 0.92 + Math.abs(Math.sin(elapsed * 7)) * 0.04;
        }
        advanceStageRunner(memberYonghwa, yonghwaStagePath, yonghwaRunnerState, 'always_run', 0);
        advanceStageRunner(memberJungshin, jungshinStagePath, jungshinRunnerState, 'walk_run_cycle', 1.4);

        // 4. 「그러나, 꽃이었다」 응원 꽃밭 3D 오브젝트 동기화 (추가/수정/삭제 실시간 반영)
        const currentMemos = memosRef.current;
        const memoIds = new Set(currentMemos.map((m) => m.id));
        flowerMeshes.forEach((mesh, id) => {
          if (!memoIds.has(id)) {
            plazaWorldGroup.remove(mesh);
            disposeObjectResources(mesh);
            flowerMeshes.delete(id);
          }
        });

        currentMemos.forEach((memo, idx) => {
          let fGroup = flowerMeshes.get(memo.id);
          if (
            fGroup &&
            (fGroup.userData.memoText !== memo.text || fGroup.userData.memoColor !== memo.color)
          ) {
            plazaWorldGroup.remove(fGroup);
            disposeObjectResources(fGroup);
            flowerMeshes.delete(memo.id);
            fGroup = undefined;
          }
          if (!fGroup) {
            fGroup = buildBloomFlowerMesh(THREE, memo);
            fGroup.userData.memoText = memo.text;
            fGroup.userData.memoColor = memo.color;
            plazaWorldGroup.add(fGroup);
            flowerMeshes.set(memo.id, fGroup);
          }
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
            pt.mesh.geometry?.dispose();
            pt.mesh.material?.dispose();
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
        scene.traverse((obj: any) => {
          if (obj.geometry) obj.geometry.dispose();
          if (obj.material) {
            if (Array.isArray(obj.material)) {
              obj.material.forEach((m: any) => {
                if (m.map) m.map.dispose();
                m.dispose();
              });
            } else {
              if (obj.material.map) obj.material.map.dispose();
              obj.material.dispose();
            }
          }
        });
        renderer.dispose();
      };
    } catch {
      showToast('3D 광장을 초기화하는 중 문제가 발생했습니다.');
    }
  }, [threeReady, spawnFloatingParticles, showToast, switchViewMode, handleSitOnBench]);

  useEffect(() => {
    const THREE = window.THREE;
    const objs = sceneObjectsRef.current;
    if (!THREE || !objs.scene || !objs.fog || !objs.ambientLight || !objs.dirLight) return;

    if (viewMode === 'arena') {
      if (objs.sunsetSkyDome) objs.sunsetSkyDome.visible = false;
      if (objs.sunsetSunMesh) objs.sunsetSunMesh.visible = false;
      objs.scene.background = new THREE.Color(0x050914);
      objs.fog.color = new THREE.Color(0x050914);
      objs.fog.density = 0.0085;
      objs.ambientLight.color = new THREE.Color(0xffffff);
      objs.ambientLight.intensity = 0.9;
      objs.dirLight.color = new THREE.Color(0x93c5fd);
      objs.dirLight.intensity = 1.1;
      return;
    }

    if (skyTheme === 'day') {
      if (objs.sunsetSkyDome) objs.sunsetSkyDome.visible = false;
      if (objs.sunsetSunMesh) objs.sunsetSunMesh.visible = false;
      objs.scene.background = new THREE.Color(0xbae6fd);
      objs.fog.color = new THREE.Color(0xbae6fd);
      objs.fog.density = 0.0085;
      objs.ambientLight.color = new THREE.Color(0xffffff);
      objs.ambientLight.intensity = 0.68;
      objs.dirLight.color = new THREE.Color(0xffffff);
      objs.dirLight.intensity = 0.82;
    } else if (skyTheme === 'sunset') {
      if (objs.sunsetSkyDome) objs.sunsetSkyDome.visible = true;
      if (objs.sunsetSunMesh) objs.sunsetSunMesh.visible = true;
      objs.scene.background = new THREE.Color(0xdc2626);
      objs.fog.color = new THREE.Color(0xf87171);
      objs.fog.density = 0.0040;
      objs.ambientLight.color = new THREE.Color(0xffd4c8);
      objs.ambientLight.intensity = 0.68;
      objs.dirLight.color = new THREE.Color(0xfb923c);
      objs.dirLight.intensity = 1.0;
    } else {
      if (objs.sunsetSkyDome) objs.sunsetSkyDome.visible = false;
      if (objs.sunsetSunMesh) objs.sunsetSunMesh.visible = false;
      objs.scene.background = new THREE.Color(0x090d16);
      objs.fog.color = new THREE.Color(0x090d16);
      objs.fog.density = 0.0085;
      objs.ambientLight.color = new THREE.Color(0xffffff);
      objs.ambientLight.intensity = 0.55;
      objs.dirLight.color = new THREE.Color(0x93c5fd);
      objs.dirLight.intensity = 0.8;
    }
  }, [skyTheme, viewMode]);

  // ============================================================================
  // 9. 비즈니스 핸들러
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

    const writerId = user?.uid || localWriterIdRef.current;
    const localId = `flower-${Date.now()}`;
    const created: PlazaMemo = {
      id: localId,
      authorId: writerId,
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

    if (user) {
      addPublicFlowerMemo({
        authorUid: user.uid,
        authorId: writerId,
        author: myProfile.name,
        seatZone: myProfile.seatZone,
        text,
        color: newMemoColor,
        x: memoX,
        z: memoZ,
      })
        .then((cloudId) => {
          if (cloudId) {
            setMemos((prev) => prev.map((m) => (m.id === localId ? { ...m, id: cloudId } : m)));
          }
        })
        .catch((err) => console.error('Save flower memo error:', err));
    }

    if (bcRef.current) {
      bcRef.current.postMessage({
        type: 'new_memo',
        senderId: mySessionIdRef.current,
        memo: created,
      });
    }
  };

  const handleUpdateMemo = (id: string, text: string, color: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setMemos((prev) => prev.map((m) => (m.id === id ? { ...m, text: trimmed, color } : m)));
    setSelectedMemo((prev) => (prev && prev.id === id ? { ...prev, text: trimmed, color } : prev));
    showToast('🌸 응원 꽃 문구가 수정되었습니다!');

    if (user && !id.startsWith('flower-')) {
      updatePublicFlowerMemo(id, { text: trimmed, color }).catch((err) =>
        console.error('Update flower memo error:', err)
      );
    }

    if (bcRef.current) {
      bcRef.current.postMessage({
        type: 'update_memo',
        senderId: mySessionIdRef.current,
        id,
        text: trimmed,
        color,
      });
    }
  };

  const handleDeleteMemo = (id: string) => {
    setMemos((prev) => prev.filter((m) => m.id !== id));
    setSelectedMemo((prev) => (prev && prev.id === id ? null : prev));
    showToast('🗑️ 작성한 꽃 응원 문구를 삭제했습니다.');

    if (user && !id.startsWith('flower-')) {
      deletePublicFlowerMemo(id).catch((err) => console.error('Delete flower memo error:', err));
    }

    if (bcRef.current) {
      bcRef.current.postMessage({
        type: 'delete_memo',
        senderId: mySessionIdRef.current,
        id,
      });
    }
  };

  const handleToggleMemoLike = (id: string) => {
    const target = memosRef.current.find((m) => m.id === id);
    const nextLikes = target ? Math.max(0, target.likedByMe ? target.likes - 1 : target.likes + 1) : 1;

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

    if (user && !id.startsWith('flower-')) {
      togglePublicFlowerMemoLike(id, nextLikes).catch((err) =>
        console.error('Toggle flower memo like error:', err)
      );
    }
  };

  const handleCheckInAdvent = (dateStr: string) => {
    const answerText = adventAnswerInput.trim();
    const hadPreviousAnswer = Boolean(adventAnswers[dateStr]?.trim());

    if (!answerText && !hadPreviousAnswer) {
      showToast('💬 오늘의 질문에 답변을 입력해야 출석 도장과 착용 MD 아이템을 받을 수 있어요!');
      return;
    }

    let nextAnswers = adventAnswers;
    let newlyAnswered = false;

    if (answerText) {
      nextAnswers = { ...adventAnswers, [dateStr]: answerText };
      newlyAnswered = !hadPreviousAnswer;
      setAdventAnswers(nextAnswers);
      setAdventAnswerInput('');

      setPublicAdventAnswers((prev) => [
        {
          id: `local-${Date.now()}`,
          dateStr,
          text: answerText,
          createdAt: Date.now(),
        },
        ...prev.filter((item) => !(item.dateStr === dateStr && item.text === answerText)),
      ]);

      if (user) {
        addPublicAdventAnswer(user.uid, dateStr, answerText).catch((err) =>
          console.error('Save advent answer error:', err)
        );
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
          `🎉 ${newAnsweredCount}회차 답변 완료! [${unlockedItem.label}] 아이템을 획득했습니다!`
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

  const handleTrackSprint = () => {
    if (viewMode === 'arena') {
      switchViewMode('plaza');
    }

    pendingBenchRef.current = null;
    myPosRef.current.targetY = 0;

    if (isTrackRunningRef.current) {
      isTrackRunningRef.current = false;
      myActionRef.current = 'idle';
      setMyAction('idle');
      showToast('⏸️ 트랙 달리기를 잠시 멈췄습니다.');
      return;
    }

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
  // 10. UI 렌더링
  // ============================================================================
  return (
    <LanguageProvider lang={lang} setLang={handleChangeLang}>
      <div className="relative w-full h-screen overflow-hidden bg-slate-950 text-white select-none font-sans">
        {/* 3D WebGL 캔버스 마운트 */}
        <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

        {/* 3D 로딩 오버레이 */}
        {!threeReady && (
          <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-slate-950/95">
            <div className="w-12 h-12 rounded-full border-4 border-blue-500/30 border-t-sky-400 animate-spin mb-4" />
            <p className="text-sm font-bold text-sky-200">
              {t.loadingPlaza}
            </p>
          </div>
        )}

        {/* 상단 HUD 헤더 */}
        <header className="absolute top-0 left-0 right-0 z-20 p-2.5 sm:p-4 flex flex-wrap items-start justify-between gap-1.5 sm:gap-2 pointer-events-none">
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 pointer-events-auto">
            <div className="px-2.5 py-1.5 sm:px-3.5 sm:py-2 rounded-2xl bg-slate-900/80 backdrop-blur-md border border-blue-400/30 shadow-xl flex items-center gap-2 sm:gap-2.5">
              <div className="w-16 h-8 sm:w-[88px] sm:h-10 rounded-xl overflow-hidden bg-[#eae9e4] border border-white/25 flex items-center justify-center shadow-inner shrink-0">
                <img
                  src="./assets/aistudio/_____2026-11-25_161517_dc269b5c.png"
                  alt="EBDD"
                  className="h-[60px] sm:h-[82px] w-auto max-w-none -rotate-90 object-contain shrink-0"
                />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] sm:text-sm font-bold tracking-tight text-white whitespace-nowrap">
                    {t.headerTitle}
                  </span>
                  <span className="px-1.5 py-0.5 text-[10px] font-extrabold rounded-md bg-blue-600 text-white whitespace-nowrap shrink-0">
                    {dDayRemaining === 0 ? 'D-DAY' : `D-${dDayRemaining}`}
                  </span>
                </div>
                <p className="text-[10px] text-blue-200/80 hidden sm:block">
                  2027.02.20-21 ·{' '}
                  {viewMode === 'plaza'
                    ? t.plazaSubtitle(currentRoomId)
                    : t.arenaSubtitle(myProfile.seatZone)}
                </p>
              </div>
            </div>

            <button
              onClick={() => switchViewMode(viewMode === 'plaza' ? 'arena' : 'plaza')}
              className={`px-2.5 py-2 sm:px-3.5 sm:py-2.5 rounded-2xl backdrop-blur-md border text-[11px] sm:text-xs font-extrabold flex items-center gap-1.5 shadow-lg transition active:scale-95 whitespace-nowrap ${
                viewMode === 'arena'
                  ? 'bg-emerald-600/95 border-emerald-300/60 text-white hover:bg-emerald-500'
                  : 'bg-indigo-600/90 border-indigo-300/50 text-white hover:bg-indigo-500'
              }`}
            >
              {viewMode === 'arena' ? (
                <>
                  <Compass className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-200 shrink-0" />
                  <span>{t.exitToPlaza}</span>
                </>
              ) : (
                <>
                  <Building2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-sky-200 shrink-0" />
                  <span>{t.enterArena}</span>
                </>
              )}
            </button>

            <button
              onClick={() => setActiveModal('seatmap')}
              className="px-2.5 py-2 sm:px-3.5 sm:py-2.5 rounded-2xl bg-slate-900/85 hover:bg-slate-800 backdrop-blur-md border border-sky-400/45 text-[11px] sm:text-xs font-extrabold text-sky-200 flex items-center gap-1.5 shadow-lg transition active:scale-95 whitespace-nowrap"
            >
              <LayoutGrid className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-sky-400 shrink-0" />
              <span>{t.seatMapBtn}</span>
            </button>
          </div>

          <div className="flex items-center justify-end gap-1.5 sm:gap-2 pointer-events-auto">
            <button
              onClick={toggleAudio}
              title={isPlayingAudio ? t.bgmStop : t.bgmPlay}
              className={`p-2 sm:px-3 sm:py-2 rounded-2xl backdrop-blur-md border text-xs font-extrabold flex items-center gap-1.5 shadow-lg transition active:scale-95 ${
                isPlayingAudio
                  ? 'bg-blue-600/90 border-sky-300/60 text-white'
                  : 'bg-slate-900/80 border-white/15 text-slate-200 hover:bg-slate-800'
              }`}
            >
              {isPlayingAudio ? <Volume2 className="w-4 h-4 shrink-0" /> : <VolumeX className="w-4 h-4 shrink-0" />}
              <span className="hidden sm:inline whitespace-nowrap">BGM</span>
            </button>

            <button
              onClick={() => setActiveModal('settings')}
              title={t.settingsBtn}
              className="px-2.5 py-2 sm:px-3.5 rounded-2xl bg-slate-900/85 hover:bg-slate-800 backdrop-blur-md border border-sky-400/40 text-[11px] sm:text-xs font-extrabold text-white flex items-center gap-1.5 shadow-lg transition active:scale-95 whitespace-nowrap"
            >
              <Settings className="w-4 h-4 text-sky-400 shrink-0" />
              <span>{t.settingsBtn}</span>
            </button>
          </div>
        </header>

        {/* 상단 토스트 알림 배너 */}
        {toastMsg && (
          <div className="fixed top-20 left-1/2 -translate-x-1/2 z-40 px-4 py-2.5 rounded-2xl bg-slate-900/95 border border-sky-400/50 text-xs sm:text-sm font-bold text-sky-100 shadow-2xl backdrop-blur-md max-w-[92vw] text-center pointer-events-none">
            {toastMsg}
          </div>
        )}

        {/* 우측 퀵 메뉴 도크 */}
        <aside className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-2 pointer-events-auto">
          <button
            onClick={() => setActiveModal('advent')}
            className="px-3 py-2.5 rounded-2xl bg-slate-900/85 hover:bg-slate-800 backdrop-blur-md border border-amber-400/40 text-xs font-extrabold text-amber-200 flex items-center gap-2 shadow-xl transition active:scale-95"
          >
            <Calendar className="w-4 h-4 text-amber-300 shrink-0" />
            <span className="hidden sm:inline">{t.dockAdvent}</span>
            <span className="px-1.5 py-0.5 rounded-md bg-amber-400/20 text-[10px] text-amber-300">
              {checkedDates.length}
            </span>
          </button>

          <button
            onClick={() => setActiveModal('memos')}
            className="px-3 py-2.5 rounded-2xl bg-slate-900/85 hover:bg-slate-800 backdrop-blur-md border border-pink-400/40 text-xs font-extrabold text-pink-200 flex items-center gap-2 shadow-xl transition active:scale-95"
          >
            <FlowerBloomIcon className="w-4 h-4 text-pink-400 shrink-0" />
            <span className="hidden sm:inline">{t.dockFlowers}</span>
            <span className="px-1.5 py-0.5 rounded-md bg-pink-400/20 text-[10px] text-pink-300">
              {memos.length}
            </span>
          </button>

          <button
            onClick={() => setActiveModal('room')}
            className="px-3 py-2.5 rounded-2xl bg-slate-900/85 hover:bg-slate-800 backdrop-blur-md border border-sky-400/40 text-xs font-extrabold text-sky-200 flex items-center gap-2 shadow-xl transition active:scale-95"
          >
            <Users className="w-4 h-4 text-sky-400 shrink-0" />
            <span className="hidden sm:inline">{t.dockLane(currentRoomId)}</span>
            <span className="px-1.5 py-0.5 rounded-md bg-sky-400/20 text-[10px] text-sky-300">
              {currentRoomCapacity}/{MAX_ROOM_CAPACITY}
            </span>
          </button>

          <button
            onClick={() => setActiveModal('minigames')}
            className="px-3 py-2.5 rounded-2xl bg-gradient-to-br from-blue-600/90 to-indigo-600/90 hover:from-blue-500 hover:to-indigo-500 backdrop-blur-md border border-sky-300/50 text-xs font-extrabold text-white flex items-center gap-2 shadow-xl transition active:scale-95"
          >
            <Gamepad2 className="w-4 h-4 text-amber-300 shrink-0" />
            <span className="hidden sm:inline">{t.dockMiniGames}</span>
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
              triggerAction('greet', t.greetPeerToast(selectedPeer.name));
              setSelectedPeer(null);
            }}
            className="w-full py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-extrabold text-white transition"
          >
            {t.greetPeerBtn}
          </button>
        </div>
      )}

      {/* 하단 액션 바 (달리기 RUN + 응원/감정 5종 메뉴) & 한마디 말풍선 입력 */}
      <footer className="absolute bottom-0 left-0 right-0 z-20 p-2.5 sm:p-4 flex flex-col items-center gap-2 pointer-events-none">
        <div className="relative flex items-center justify-center gap-2 pointer-events-auto">
          <button
            onClick={() => {
              setActionMenuOpen(false);
              handleTrackSprint();
            }}
            className={`px-4 py-2.5 rounded-2xl backdrop-blur-md border text-xs sm:text-sm font-extrabold flex items-center gap-1.5 shadow-lg transition active:scale-95 whitespace-nowrap ${
              myAction === 'run'
                ? 'bg-sky-500 border-white text-slate-950'
                : 'bg-gradient-to-r from-blue-600 to-sky-500 border-sky-300/60 text-white hover:from-blue-500 hover:to-sky-400'
            }`}
          >
            <Footprints className="w-4 h-4 shrink-0" />
            <span>{myAction === 'run' ? t.actionRunStop : t.actionRunStart}</span>
          </button>

          <div className="relative">
            {actionMenuOpen && (
              <div className="absolute bottom-full right-0 sm:left-1/2 sm:-translate-x-1/2 mb-2 w-52 p-2 rounded-2xl bg-slate-900/95 backdrop-blur-md border border-sky-400/35 shadow-2xl flex flex-col gap-1 z-30">
                <button
                  type="button"
                  onClick={() => {
                    triggerAction('cheer', '🔥 에브리바디 뛰어!! 에바뛰 점프!!');
                    setActionMenuOpen(false);
                  }}
                  className={`w-full px-3 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition text-left ${
                    myAction === 'cheer'
                      ? 'bg-amber-500 text-slate-950'
                      : 'text-slate-100 hover:bg-white/10'
                  }`}
                >
                  <Flame className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>{t.actionEbdd}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const holdingSlogan =
                      myProfile.leftHandItem === 'slogan' || myProfile.rightHandItem === 'slogan';
                    triggerAction(
                      'wave',
                      holdingSlogan
                        ? '💙 양손으로 CNBLUE 슬로건을 높이 들어 흔듭니다!'
                        : '💎 뛰봉을 힘차게 흔듭니다!'
                    );
                    setActionMenuOpen(false);
                  }}
                  className={`w-full px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition text-left ${
                    myAction === 'wave'
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-100 hover:bg-white/10'
                  }`}
                >
                  <Sparkles className="w-4 h-4 text-sky-400 shrink-0" />
                  <span>
                    {myProfile.leftHandItem === 'slogan' || myProfile.rightHandItem === 'slogan'
                      ? t.actionSloganWave
                      : t.actionLightstickWave}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    triggerAction('greet', '🙇‍♂️ 주변 보이스 팬들에게 반갑게 인사합니다!');
                    setActionMenuOpen(false);
                  }}
                  className={`w-full px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition text-left ${
                    myAction === 'greet'
                      ? 'bg-emerald-600 text-white'
                      : 'text-slate-100 hover:bg-white/10'
                  }`}
                >
                  <span>{t.actionGreet}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    handleSitOnBench();
                    setActionMenuOpen(false);
                  }}
                  className={`w-full px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition text-left ${
                    myAction === 'sit'
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-100 hover:bg-white/10'
                  }`}
                >
                  <span>{t.actionSit}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (myAction === 'cry') {
                      triggerAction('idle');
                    } else {
                      triggerAction('cry', t.cryToast);
                    }
                    setActionMenuOpen(false);
                  }}
                  className={`w-full px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition text-left ${
                    myAction === 'cry'
                      ? 'bg-sky-500 text-slate-950'
                      : 'text-slate-100 hover:bg-white/10'
                  }`}
                >
                  <span>{t.actionCry}</span>
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={() => setActionMenuOpen((prev) => !prev)}
              className={`px-4 py-2.5 rounded-2xl backdrop-blur-md border text-xs sm:text-sm font-extrabold flex items-center gap-1.5 shadow-lg transition active:scale-95 whitespace-nowrap ${
                actionMenuOpen || ['cheer', 'wave', 'greet', 'sit', 'cry'].includes(myAction)
                  ? 'bg-indigo-600/90 border-sky-300/70 text-white'
                  : 'bg-slate-900/85 border-white/20 text-slate-100 hover:bg-slate-800'
              }`}
            >
              <Sparkles className="w-4 h-4 text-amber-300 shrink-0" />
              <span>{t.actionMenuBtn}</span>
              <ChevronUp
                className={`w-4 h-4 shrink-0 transition-transform ${
                  actionMenuOpen ? 'rotate-180' : ''
                }`}
              />
            </button>
          </div>
        </div>

        <form
          onSubmit={handleSendSpeech}
          className="w-full max-w-md flex items-center gap-2 p-1.5 rounded-2xl bg-slate-900/85 backdrop-blur-md border border-white/15 shadow-2xl pointer-events-auto"
        >
          <input
            type="text"
            maxLength={36}
            value={speechInput}
            onChange={(e) => setSpeechInput(e.target.value)}
            placeholder={t.speechPlaceholder}
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

      {/* 모달 1: 데일리 어드벤트 러닝 트랙 */}
      {activeModal === 'advent' && (
        <AdventModal
          todayKstStr={todayKstStr}
          dDayRemaining={dDayRemaining}
          adventTab={adventTab}
          onChangeAdventTab={setAdventTab}
          checkedDates={checkedDates}
          adventProgressPct={adventProgressPct}
          selectedAdventMonth={selectedAdventMonth}
          onSelectAdventMonth={setSelectedAdventMonth}
          adventTrackRows={adventTrackRows}
          selectedAdventDate={selectedAdventDate}
          onSelectAdventDate={setSelectedAdventDate}
          currentAdventObj={currentAdventObj}
          adventAnswers={adventAnswers}
          adventAnswerInput={adventAnswerInput}
          onChangeAdventAnswerInput={setAdventAnswerInput}
          publicAdventAnswers={publicAdventAnswers}
          recordedDiaryList={recordedDiaryList}
          answeredCount={answeredCount}
          nextUnlockMilestone={nextUnlockMilestone}
          onCheckInAdvent={handleCheckInAdvent}
          onShowToast={showToast}
          onClose={() => setActiveModal('none')}
        />
      )}

      {/* 모달 2: 「그러나, 꽃이었다」 메모장 */}
      {activeModal === 'memos' && (
        <FlowerMemosModal
          memos={memos}
          myWriterIds={myWriterIds}
          selectedMemo={selectedMemo}
          newMemoText={newMemoText}
          newMemoColor={newMemoColor}
          onChangeMemoText={setNewMemoText}
          onChangeMemoColor={setNewMemoColor}
          onSubmitMemo={handleAddMemo}
          onUpdateMemo={handleUpdateMemo}
          onDeleteMemo={handleDeleteMemo}
          onToggleMemoLike={handleToggleMemoLike}
          onMoveToMemo={(memo) => {
            if (viewMode === 'arena') switchViewMode('plaza');
            isTrackRunningRef.current = false;
            pendingBenchRef.current = null;
            myPosRef.current.targetX = memo.x;
            myPosRef.current.targetY = 0;
            myPosRef.current.targetZ = memo.z + 1.6;
            myActionRef.current = 'walk';
            setMyAction('walk');
            setActiveModal('none');
            showToast(`🌸 ${memo.author}님이 피운 응원 꽃 위치로 이동합니다!`);
          }}
          onClose={() => {
            setActiveModal('none');
            setSelectedMemo(null);
          }}
        />
      )}

      {/* 모달 3: 러닝 트랙 레인(1~5레인) 선택 */}
      {activeModal === 'room' && (
        <RoomSelectModal
          currentRoomId={currentRoomId}
          currentRoomCapacity={currentRoomCapacity}
          onSelectRoom={handleChangeRoom}
          onClose={() => setActiveModal('none')}
        />
      )}

      {/* 모달 4: 내 아바타 & MD 꾸미기 */}
      {activeModal === 'profile' && (
        <ProfileModal
          threeReady={threeReady}
          myProfile={myProfile}
          setMyProfile={setMyProfile}
          answeredCount={answeredCount}
          nextUnlockMilestone={nextUnlockMilestone}
          firebaseUser={user}
          authFallbackNeeded={authFallbackNeeded}
          onSignInGoogle={() => {
            signInWithGoogle()
              .then(() => showToast('☁️ Google 계정으로 클라우드 동기화가 연결되었습니다!'))
              .catch((err) => {
                console.error('Google sign-in error:', err);
                showToast('로그인 창이 닫혔거나 팝업이 차단되었습니다.');
              });
          }}
          onSignOutGoogle={() => {
            signOutFirebase()
              .then(() => showToast('로그아웃되었습니다.'))
              .catch((err) => console.error('Sign out error:', err));
          }}
          onOpenAdvent={() => setActiveModal('advent')}
          onShowToast={showToast}
          onClose={() => setActiveModal('none')}
        />
      )}

      {/* 모달 5: KSPO DOME 인터랙티브 360° 좌석배치도 */}
      {activeModal === 'seatmap' && (
        <SeatMapModal
          currentSeatZone={myProfile.seatZone}
          onSelectSeat={(seatLabel) => {
            setMyProfile((p) => ({ ...p, seatZone: seatLabel }));
            setActiveModal('none');
            switchViewMode('arena', seatLabel);
          }}
          onClose={() => setActiveModal('none')}
        />
      )}

      {/* 모달 6: EBDD 에바뛰 미니게임 2종 */}
      {activeModal === 'minigames' && (
        <MiniGamesModal
          miniGameTab={miniGameTab}
          onChangeTab={setMiniGameTab}
          ebddJumps={ebddJumps}
          runBestScore={runBestScore}
          roofBestScore={roofBestScore}
          avatarLook={{
            hoodieColor: myProfile.hoodieColor,
            lightstickColor: myProfile.lightstickColor,
            hairStyle: myProfile.hairStyle,
            capStyle: myProfile.capStyle,
            leftHandItem: myProfile.leftHandItem,
            rightHandItem: myProfile.rightHandItem,
          }}
          onAddJumps={handleAddEbddJumps}
          onUpdateRunBest={handleUpdateRunBest}
          onUpdateRoofBest={handleUpdateRoofBest}
          onRewardToast={showToast}
          onClose={() => setActiveModal('none')}
        />
      )}

      {/* 모달 7: 환경설정 (프로필/MD · 언어 · 하늘) */}
      {activeModal === 'settings' && (
        <SettingsModal
          myProfile={myProfile}
          skyTheme={skyTheme}
          onChangeSkyTheme={setSkyTheme}
          onChangeLang={handleChangeLang}
          onOpenProfile={() => setActiveModal('profile')}
          onClose={() => setActiveModal('none')}
        />
      )}
      </div>
    </LanguageProvider>
  );
}

export default App;
