import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInAnonymously,
  signInWithCustomToken,
  onAuthStateChanged,
  type User,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  collection,
  addDoc,
} from 'firebase/firestore';
import { ARENA_SECTIONS } from '../constants/arenaSections';
import { FLOWER_COLORS, INITIAL_MEMOS } from '../constants/plazaData';
import type { PlazaMemo, PublicAdventAnswer, UserProfileState } from '../types/plaza';

declare const __firebase_config: string | undefined;
declare const __app_id: string | undefined;
declare const __initial_auth_token: string | undefined;

const firebaseConfig =
  typeof __firebase_config !== 'undefined' && __firebase_config
    ? JSON.parse(__firebase_config)
    : null;
const firebaseApp = firebaseConfig ? initializeApp(firebaseConfig) : null;
export const auth = firebaseApp ? getAuth(firebaseApp) : null;
export const db = firebaseApp ? getFirestore(firebaseApp) : null;
export const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

export interface CloudUserPayload {
  myProfile: UserProfileState;
  checkedDates: string[];
  adventAnswers: Record<string, string>;
  ebddJumps: number;
  runBestScore: number;
  roofBestScore: number;
}

export function initFirebaseAuth(onUserChange: (user: User | null) => void): () => void {
  if (!auth) return () => {};
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
  return onAuthStateChanged(auth, onUserChange);
}

export function subscribeUserCloudState(
  userId: string,
  fallbackProfile: UserProfileState,
  onLoaded: (payload: CloudUserPayload) => void,
  onSynced: () => void
): () => void {
  if (!db) return () => {};
  const userDocRef = doc(db, 'artifacts', appId, 'users', userId, 'profile', 'main');
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
      console.error('User profile snapshot error:', err);
      onSynced();
    }
  );
}

export async function saveUserCloudState(userId: string, payload: CloudUserPayload): Promise<void> {
  if (!db) return;
  const userDocRef = doc(db, 'artifacts', appId, 'users', userId, 'profile', 'main');
  await setDoc(userDocRef, { ...payload, updatedAt: Date.now() }, { merge: true });
}

export function subscribePublicAdventAnswers(
  onUpdate: (items: PublicAdventAnswer[]) => void
): () => void {
  if (!db) return () => {};
  const adventPublicCol = collection(db, 'artifacts', appId, 'public', 'data', 'advent_answers');
  return onSnapshot(
    adventPublicCol,
    (snap) => {
      const items: PublicAdventAnswer[] = [];
      snap.forEach((d) => {
        const v = d.data() as Record<string, unknown>;
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
      onUpdate(items);
    },
    (err) => console.error('Public advent answers snapshot error:', err)
  );
}

export async function addPublicAdventAnswer(dateStr: string, text: string): Promise<void> {
  if (!db) return;
  const adventPublicCol = collection(db, 'artifacts', appId, 'public', 'data', 'advent_answers');
  await addDoc(adventPublicCol, {
    dateStr,
    text,
    createdAt: Date.now(),
  });
}

export function subscribeFlowerMemos(onUpdate: (memos: PlazaMemo[]) => void): () => void {
  if (!db) return () => {};
  const memosPublicCol = collection(db, 'artifacts', appId, 'public', 'data', 'flower_memos');
  return onSnapshot(
    memosPublicCol,
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
    (err) => console.error('Flower memos snapshot error:', err)
  );
}

export async function addPublicFlowerMemo(memo: {
  authorId: string;
  author: string;
  seatZone: string;
  text: string;
  color: string;
  x: number;
  z: number;
}): Promise<string | null> {
  if (!db) return null;
  const memosPublicCol = collection(db, 'artifacts', appId, 'public', 'data', 'flower_memos');
  const created = await addDoc(memosPublicCol, {
    ...memo,
    likes: 1,
    createdAt: Date.now(),
    createdAtLabel: '방금 전',
  });
  return created.id;
}

export async function updatePublicFlowerMemo(
  id: string,
  updates: { text: string; color: string }
): Promise<void> {
  if (!db) return;
  const memoDocRef = doc(db, 'artifacts', appId, 'public', 'data', 'flower_memos', id);
  await updateDoc(memoDocRef, {
    text: updates.text,
    color: updates.color,
    updatedAt: Date.now(),
  });
}

export async function deletePublicFlowerMemo(id: string): Promise<void> {
  if (!db) return;
  const memoDocRef = doc(db, 'artifacts', appId, 'public', 'data', 'flower_memos', id);
  await deleteDoc(memoDocRef);
}
