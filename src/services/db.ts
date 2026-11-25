import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInAnonymously,
  signInWithPopup,
  signOut,
  type User,
} from 'firebase/auth';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocFromServer,
  getFirestore,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { ARENA_SECTIONS } from '../constants/arenaSections';
import { FLOWER_COLORS, INITIAL_MEMOS } from '../constants/plazaData';
import type { PlazaMemo, PublicAdventAnswer, UserProfileState } from '../types/plaza';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const currentUser = auth.currentUser;
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: currentUser?.uid,
      email: currentUser?.email,
      emailVerified: currentUser?.emailVerified,
      isAnonymous: currentUser?.isAnonymous,
      tenantId: currentUser?.tenantId,
      providerInfo:
        currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}
void testConnection();

export interface CloudUserPayload {
  myProfile: UserProfileState;
  checkedDates: string[];
  adventAnswers: Record<string, string>;
  ebddJumps: number;
  runBestScore: number;
  roofBestScore: number;
}

const LOCAL_STATE_KEY = 'kspo_plaza_user_state_v1';

export function loadLocalUserState(fallbackProfile: UserProfileState): CloudUserPayload | null {
  try {
    const raw = window.localStorage.getItem(LOCAL_STATE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as Record<string, unknown>;
    const rawProfile = data.myProfile as (Partial<UserProfileState> & { hairStyle?: string }) | undefined;
    const normalizedHair =
      rawProfile?.hairStyle === 'long' ||
      rawProfile?.hairStyle === 'ponytail' ||
      rawProfile?.hairStyle === 'short'
        ? rawProfile.hairStyle
        : rawProfile?.hairStyle === 'dandy'
          ? 'short'
          : fallbackProfile.hairStyle;

    return {
      myProfile: rawProfile
        ? {
            ...fallbackProfile,
            ...rawProfile,
            hairStyle: normalizedHair,
            hasWristband: true,
          }
        : fallbackProfile,
      checkedDates: Array.isArray(data.checkedDates) ? (data.checkedDates as string[]).slice(0, 100) : [],
      adventAnswers:
        data.adventAnswers && typeof data.adventAnswers === 'object'
          ? (data.adventAnswers as Record<string, string>)
          : {},
      ebddJumps: typeof data.ebddJumps === 'number' ? Math.max(0, data.ebddJumps) : 1,
      runBestScore: typeof data.runBestScore === 'number' ? Math.max(0, data.runBestScore) : 0,
      roofBestScore: typeof data.roofBestScore === 'number' ? Math.max(0, data.roofBestScore) : 0,
    };
  } catch {
    return null;
  }
}

export function saveLocalUserState(payload: CloudUserPayload): void {
  try {
    window.localStorage.setItem(LOCAL_STATE_KEY, JSON.stringify(payload));
  } catch {
    // ignore storage quota errors
  }
}

function sanitizeHexColor(hex: string, fallback = '#2563eb'): string {
  return /^#[0-9a-fA-F]{6}$/.test(hex) ? hex : fallback;
}

function sanitizeId(raw: string, fallback = 'anon_writer'): string {
  const cleaned = raw.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 64);
  return cleaned.length > 0 ? cleaned : fallback;
}

function sanitizeProfile(p: UserProfileState): UserProfileState {
  const hair = p.hairStyle === 'long' || p.hairStyle === 'ponytail' || p.hairStyle === 'short' ? p.hairStyle : 'long';
  const outfit =
    p.outfitStyle === 'track_jacket' ||
    p.outfitStyle === 'white_tee' ||
    p.outfitStyle === 'navy_tee' ||
    p.outfitStyle === 'sky_tee'
      ? p.outfitStyle
      : 'white_tee';
  const cap = p.capStyle === 'official_cap' || p.capStyle === 'navy_cap' || p.capStyle === 'none' ? p.capStyle : 'none';
  const validHand = (h: string): UserProfileState['leftHandItem'] =>
    h === 'fan' || h === 'lightstick' || h === 'slogan' || h === 'none' ? h : 'none';

  return {
    name: (p.name || '보이스팬').trim().slice(0, 20) || '보이스팬',
    seatZone: (p.seatZone || ARENA_SECTIONS[0].label).trim().slice(0, 40) || ARENA_SECTIONS[0].label,
    hoodieColor: sanitizeHexColor(p.hoodieColor, '#ffffff'),
    lightstickColor: sanitizeHexColor(p.lightstickColor, '#2563eb'),
    hairStyle: hair,
    outfitStyle: outfit,
    capStyle: cap,
    hasSloganTowel: Boolean(p.hasSloganTowel),
    hasWristband: true,
    leftHandItem: validHand(p.leftHandItem),
    rightHandItem: validHand(p.rightHandItem),
  };
}

export function initFirebaseAuth(
  onUserChange: (user: User | null) => void,
  onAuthFallbackNeeded?: (needed: boolean) => void
): () => void {
  const unsub = onAuthStateChanged(auth, async (currentUser) => {
    if (currentUser) {
      onAuthFallbackNeeded?.(false);
      onUserChange(currentUser);
      return;
    }

    onUserChange(null);
    try {
      await signInAnonymously(auth);
      onAuthFallbackNeeded?.(false);
    } catch (err) {
      const code = (err as { code?: string })?.code || '';
      if (code === 'auth/admin-restricted-operation' || code === 'auth/operation-not-allowed') {
        onAuthFallbackNeeded?.(true);
        console.warn('Anonymous auth is not enabled yet in Firebase Console. Google sign-in can be used instead.');
      } else {
        console.error('Auth initialization error:', err);
      }
    }
  });

  return unsub;
}

export async function signInWithGoogle(): Promise<User | null> {
  const provider = new GoogleAuthProvider();
  const result = await signInWithPopup(auth, provider);
  return result.user;
}

export async function signOutFirebase(): Promise<void> {
  await signOut(auth);
}

export function subscribeUserCloudState(
  userId: string,
  fallbackProfile: UserProfileState,
  onLoaded: (payload: CloudUserPayload) => void,
  onSynced: () => void
): () => void {
  const path = `users/${userId}`;
  const userDocRef = doc(db, 'users', userId);
  return onSnapshot(
    userDocRef,
    (snap) => {
      if (snap.exists()) {
        const data = snap.data() as Record<string, unknown>;
        const rawProfile = data.myProfile as (Partial<UserProfileState> & { hairStyle?: string }) | undefined;
        const normalizedHair =
          rawProfile?.hairStyle === 'long' ||
          rawProfile?.hairStyle === 'ponytail' ||
          rawProfile?.hairStyle === 'short'
            ? rawProfile.hairStyle
            : rawProfile?.hairStyle === 'dandy'
              ? 'short'
              : fallbackProfile.hairStyle;
        const loadedProfile: UserProfileState = rawProfile
          ? {
              ...fallbackProfile,
              ...rawProfile,
              hairStyle: normalizedHair,
              hasWristband: true,
            }
          : fallbackProfile;
        const loadedChecked = Array.isArray(data.checkedDates) ? (data.checkedDates as string[]) : [];
        const loadedAnswers =
          data.adventAnswers && typeof data.adventAnswers === 'object'
            ? (data.adventAnswers as Record<string, string>)
            : {};
        const loadedJumps = typeof data.ebddJumps === 'number' ? data.ebddJumps : 1;
        const loadedRunBest = typeof data.runBestScore === 'number' ? data.runBestScore : 0;
        const loadedRoofBest = typeof data.roofBestScore === 'number' ? data.roofBestScore : 0;

        onLoaded({
          myProfile: loadedProfile,
          checkedDates: loadedChecked,
          adventAnswers: loadedAnswers,
          ebddJumps: loadedJumps,
          runBestScore: loadedRunBest,
          roofBestScore: loadedRoofBest,
        });
      }
      onSynced();
    },
    (err) => {
      onSynced();
      try {
        handleFirestoreError(err, OperationType.GET, path);
      } catch {
        // already logged structured FirestoreErrorInfo
      }
    }
  );
}

export async function saveUserCloudState(userId: string, payload: CloudUserPayload): Promise<void> {
  const path = `users/${userId}`;
  const userDocRef = doc(db, 'users', userId);
  const sanitizedChecked = Array.from(
    new Set(payload.checkedDates.filter((d) => /^202[67]-\d{2}-\d{2}$/.test(d)))
  ).slice(0, 100);
  const sanitizedAnswers: Record<string, string> = {};
  for (const [k, v] of Object.entries(payload.adventAnswers)) {
    if (/^202[67]-\d{2}-\d{2}$/.test(k) && typeof v === 'string' && Object.keys(sanitizedAnswers).length < 100) {
      sanitizedAnswers[k] = v.slice(0, 120);
    }
  }

  try {
    await setDoc(
      userDocRef,
      {
        uid: userId,
        myProfile: sanitizeProfile(payload.myProfile),
        checkedDates: sanitizedChecked,
        adventAnswers: sanitizedAnswers,
        ebddJumps: Math.max(0, Math.min(100000, Math.floor(payload.ebddJumps))),
        runBestScore: Math.max(0, Math.min(1000000, Math.floor(payload.runBestScore))),
        roofBestScore: Math.max(0, Math.min(1000000, Math.floor(payload.roofBestScore))),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export function subscribePublicAdventAnswers(
  onUpdate: (items: PublicAdventAnswer[]) => void
): () => void {
  const path = 'advent_answers';
  const q = query(collection(db, 'advent_answers'), where('isPublic', '==', true));
  return onSnapshot(
    q,
    (snap) => {
      const items: PublicAdventAnswer[] = [];
      snap.forEach((d) => {
        const v = d.data() as Record<string, unknown>;
        if (v && typeof v.dateStr === 'string' && typeof v.text === 'string') {
          const ts = v.createdAt as { toMillis?: () => number } | number | undefined;
          const millis =
            typeof ts === 'number' ? ts : ts && typeof ts.toMillis === 'function' ? ts.toMillis() : 0;
          items.push({
            id: d.id,
            dateStr: v.dateStr,
            text: v.text,
            createdAt: millis,
          });
        }
      });
      items.sort((a, b) => b.createdAt - a.createdAt);
      onUpdate(items);
    },
    (err) => {
      try {
        handleFirestoreError(err, OperationType.LIST, path);
      } catch {
        // logged structured error
      }
    }
  );
}

export async function addPublicAdventAnswer(
  authorUid: string,
  dateStr: string,
  text: string
): Promise<void> {
  const path = 'advent_answers';
  const safeText = text.trim().slice(0, 120);
  if (!safeText || !/^202[67]-\d{2}-\d{2}$/.test(dateStr)) return;
  try {
    await addDoc(collection(db, 'advent_answers'), {
      authorUid,
      isPublic: true,
      dateStr,
      text: safeText,
      createdAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, path);
  }
}

export function subscribeFlowerMemos(onUpdate: (memos: PlazaMemo[]) => void): () => void {
  const path = 'flower_memos';
  const q = query(collection(db, 'flower_memos'), where('isPublic', '==', true));
  return onSnapshot(
    q,
    (snap) => {
      const cloudMemos: PlazaMemo[] = [];
      snap.forEach((d) => {
        const v = d.data() as Record<string, unknown>;
        if (v && typeof v.text === 'string') {
          cloudMemos.push({
            id: d.id,
            authorId: typeof v.authorId === 'string' ? v.authorId : undefined,
            author: typeof v.author === 'string' ? v.author : '보이스팬',
            seatZone: typeof v.seatZone === 'string' ? v.seatZone : ARENA_SECTIONS[0].label,
            text: v.text,
            color: typeof v.color === 'string' ? v.color : FLOWER_COLORS[6].hex,
            x: typeof v.x === 'number' ? v.x : 0,
            z: typeof v.z === 'number' ? v.z : 12,
            likes: typeof v.likes === 'number' ? v.likes : 1,
            likedByMe: false,
            createdAt: typeof v.createdAtLabel === 'string' ? v.createdAtLabel : '방금 전',
          });
        }
      });
      cloudMemos.sort((a, b) => b.id.localeCompare(a.id));
      onUpdate([...cloudMemos, ...INITIAL_MEMOS]);
    },
    (err) => {
      try {
        handleFirestoreError(err, OperationType.LIST, path);
      } catch {
        // logged structured error
      }
    }
  );
}

export async function addPublicFlowerMemo(memo: {
  authorUid: string;
  authorId: string;
  author: string;
  seatZone: string;
  text: string;
  color: string;
  x: number;
  z: number;
}): Promise<string | null> {
  const path = 'flower_memos';
  const safeText = memo.text.trim().slice(0, 60);
  if (!safeText) return null;
  try {
    const created = await addDoc(collection(db, 'flower_memos'), {
      authorUid: memo.authorUid,
      authorId: sanitizeId(memo.authorId),
      isPublic: true,
      author: (memo.author || '보이스팬').trim().slice(0, 20) || '보이스팬',
      seatZone: (memo.seatZone || ARENA_SECTIONS[0].label).trim().slice(0, 40),
      text: safeText,
      color: sanitizeHexColor(memo.color, FLOWER_COLORS[6].hex),
      x: Math.max(-120, Math.min(120, Number(memo.x) || 0)),
      z: Math.max(-120, Math.min(120, Number(memo.z) || 12)),
      likes: 1,
      createdAtLabel: '방금 전',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return created.id;
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, path);
  }
}

export async function updatePublicFlowerMemo(
  id: string,
  updates: { text: string; color: string }
): Promise<void> {
  const path = `flower_memos/${id}`;
  const safeText = updates.text.trim().slice(0, 60);
  if (!safeText) return;
  try {
    await updateDoc(doc(db, 'flower_memos', id), {
      text: safeText,
      color: sanitizeHexColor(updates.color, FLOWER_COLORS[6].hex),
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

export async function togglePublicFlowerMemoLike(
  id: string,
  nextLikes: number
): Promise<void> {
  const path = `flower_memos/${id}`;
  try {
    await updateDoc(doc(db, 'flower_memos', id), {
      likes: Math.max(0, nextLikes),
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

export async function deletePublicFlowerMemo(id: string): Promise<void> {
  const path = `flower_memos/${id}`;
  try {
    await deleteDoc(doc(db, 'flower_memos', id));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}
