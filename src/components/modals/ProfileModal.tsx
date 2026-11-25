import React from 'react';
import { Cloud, Lock, LogOut, Shirt, Sparkles, X } from 'lucide-react';
import type { User } from 'firebase/auth';
import {
  CAP_OPTIONS,
  CAP_UNLOCK_DAY,
  HAIR_OPTIONS,
  HAND_ITEM_UNLOCK_DAY,
  LIGHTSTICK_PALETTE,
  OUTFIT_OPTIONS,
  OUTFIT_UNLOCK_DAY,
} from '../../constants/plazaData';
import { useI18n } from '../../i18n/LanguageContext';
import { AvatarPreview3D } from '../AvatarPreview3D';
import type { UserProfileState } from '../../types/plaza';

export function ProfileModal({
  threeReady,
  myProfile,
  setMyProfile,
  answeredCount,
  nextUnlockMilestone,
  firebaseUser,
  authFallbackNeeded,
  onSignInGoogle,
  onSignOutGoogle,
  onOpenAdvent,
  onShowToast,
  onClose,
}: {
  threeReady: boolean;
  myProfile: UserProfileState;
  setMyProfile: React.Dispatch<React.SetStateAction<UserProfileState>>;
  answeredCount: number;
  nextUnlockMilestone: { day: number; label: string; shortName: string; icon: string } | null;
  firebaseUser?: User | null;
  authFallbackNeeded?: boolean;
  onSignInGoogle?: () => void;
  onSignOutGoogle?: () => void;
  onOpenAdvent: () => void;
  onShowToast: (msg: string) => void;
  onClose: () => void;
}) {
  const { lang, t } = useI18n();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-3xl bg-slate-900 border border-blue-400/25 shadow-2xl overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between">
          <div>
            <h2 className="text-base font-extrabold text-white flex items-center gap-1.5">
              <Shirt className="w-4 h-4 text-sky-400" />
              <span>{t.profileTitle}</span>
            </h2>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {t.profileSubtitle}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/15 text-slate-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-5 overflow-y-auto grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
          {/* 좌측: 3D 캐릭터 실시간 미리보기 */}
          <div className="md:col-span-5 flex flex-col gap-2.5 md:sticky md:top-0">
            <AvatarPreview3D threeReady={threeReady} profile={myProfile} />
            <div className="p-3 rounded-2xl bg-slate-950/75 border border-white/10 text-center">
              <div className="text-xs font-extrabold text-white">{myProfile.name}</div>
              <div className="text-[11px] text-sky-300 mt-0.5 truncate">{myProfile.seatZone}</div>
            </div>
          </div>

          {/* 우측: 착장 및 프로필 설정 */}
          <div className="md:col-span-7 space-y-4">
            <div className="p-3 rounded-2xl bg-gradient-to-r from-blue-950/80 to-indigo-950/70 border border-amber-400/35 flex items-center justify-between gap-2">
              <div>
                <div className="text-xs font-extrabold text-amber-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{t.profileBannerTitle(answeredCount)}</span>
                </div>
                <p className="text-[11px] text-blue-100/85 mt-0.5">
                  {nextUnlockMilestone
                    ? t.profileBannerNext(nextUnlockMilestone.day, nextUnlockMilestone.label)
                    : t.profileBannerAllDone}
                </p>
              </div>
              <button
                type="button"
                onClick={onOpenAdvent}
                className="px-2.5 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-[11px] font-black shrink-0 transition"
              >
                {t.profileAnswerBtn}
              </button>
            </div>

            {/* 닉네임 설정 */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                {t.profileNicknameLabel}
              </label>
              <input
                type="text"
                maxLength={14}
                value={myProfile.name}
                onChange={(e) => setMyProfile((p) => ({ ...p, name: e.target.value }))}
                placeholder={t.profileNicknamePlaceholder}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-white/15 text-xs sm:text-sm text-white focus:outline-none focus:border-sky-400"
              />
            </div>

            {/* 헤어스타일 선택 */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                {t.profileHairLabel}
              </label>
              <div className="grid grid-cols-2 gap-2">
                {HAIR_OPTIONS.map((hair) => {
                  const hTr = t.profileHairOptions[hair.id] ?? hair;
                  return (
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
                      <div className="text-xs font-extrabold">{hTr.name}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">
                        {hTr.desc}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 01. 공식 모자 착용 */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                {t.profileCapLabel}
              </label>
              <div className="grid grid-cols-3 gap-2">
                {CAP_OPTIONS.map((cap) => {
                  const reqDay = CAP_UNLOCK_DAY[cap.id];
                  const isUnlocked = answeredCount >= reqDay;
                  const capName = t.profileCapOptions[cap.id] ?? cap.name;
                  return (
                    <button
                      type="button"
                      key={cap.id}
                      onClick={() => {
                        if (!isUnlocked) {
                          onShowToast(t.profileCapLockToast(reqDay, capName));
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
                        <span className="truncate">{capName}</span>
                      </div>
                      {!isUnlocked && (
                        <span className="text-[9px] text-amber-300/90 font-bold">
                          {t.profileDayGain(reqDay)}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 02. 공식 상의 의상 선택 */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                {t.profileOutfitLabel}
              </label>
              <div className="grid grid-cols-2 gap-2">
                {OUTFIT_OPTIONS.map((outfit) => {
                  const reqDay = OUTFIT_UNLOCK_DAY[outfit.id];
                  const isUnlocked = answeredCount >= reqDay;
                  const oTr = t.profileOutfitOptions[outfit.id] ?? outfit;
                  return (
                    <button
                      type="button"
                      key={outfit.id}
                      onClick={() => {
                        if (!isUnlocked) {
                          onShowToast(t.profileOutfitLockToast(reqDay, oTr.name));
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
                          <span className="text-xs font-extrabold truncate">{oTr.name}</span>
                        </div>
                        {!isUnlocked && (
                          <span className="text-[9px] text-amber-300 font-bold shrink-0">
                            {t.profileDayUnit(reqDay)}
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5 truncate">
                        {oTr.desc}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 손에 들 응원 MD */}
            <div className="p-3 rounded-2xl bg-slate-950/75 border border-sky-400/25 space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <label className="text-xs font-extrabold text-sky-300">
                  {t.profileHandTitle}
                </label>
                <span className="text-[10px] text-slate-400 shrink-0">{t.profileHandSloganNote}</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    if (answeredCount < HAND_ITEM_UNLOCK_DAY.lightstick) {
                      onShowToast(t.profileLightstickLockToast);
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
                  {answeredCount < HAND_ITEM_UNLOCK_DAY.lightstick
                    ? t.profileLightstickOnlyLocked
                    : t.profileLightstickOnly}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (answeredCount < HAND_ITEM_UNLOCK_DAY.fan) {
                      onShowToast(t.profileFanLockToast);
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
                  {answeredCount < HAND_ITEM_UNLOCK_DAY.fan
                    ? t.profileFanOnlyLocked
                    : t.profileFanOnly}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (answeredCount < HAND_ITEM_UNLOCK_DAY.slogan) {
                      onShowToast(t.profileSloganLockToast);
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
                  {answeredCount < HAND_ITEM_UNLOCK_DAY.slogan
                    ? t.profileSloganBothLocked
                    : t.profileSloganBoth}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (answeredCount < HAND_ITEM_UNLOCK_DAY.fan) {
                      onShowToast(t.profileFanLockToast);
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
                  {answeredCount < HAND_ITEM_UNLOCK_DAY.fan
                    ? lang === 'en'
                      ? '🔒 #2 Full Set'
                      : lang === 'zh'
                      ? '🔒 第2次 套装'
                      : lang === 'ja'
                      ? '🔒 2回目 セット'
                      : '🔒 2회차 풀세트'
                    : lang === 'en'
                    ? '🔥 Fan+Stick'
                    : lang === 'zh'
                    ? '🔥 扇子+跳棒'
                    : lang === 'ja'
                    ? '🔥 うちわ+棒'
                    : '🔥 부채+뛰봉'}
                </button>
              </div>

              {(myProfile.leftHandItem === 'slogan' || myProfile.rightHandItem === 'slogan') && (
                <div className="px-2.5 py-1.5 rounded-xl bg-[#0018e8]/25 border border-blue-400/50 text-[11px] text-sky-100 font-semibold flex items-center justify-between">
                  <span>💙 CNBLUE {t.profileSloganBoth}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 pt-1">
                <div>
                  <div className="text-[10px] font-bold text-slate-400 mb-1">{t.profileLeftHand}</div>
                  <div className="grid grid-cols-2 gap-1">
                    {(
                      [
                        { id: 'fan', label: t.profileHandFan },
                        { id: 'lightstick', label: t.profileHandLightstick },
                        { id: 'slogan', label: t.profileSloganBoth },
                        { id: 'none', label: t.profileHandNone },
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
                              onShowToast(t.profileCapLockToast(reqDay, opt.label));
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
                          {isUnlocked ? opt.label : `🔒 ${t.profileDayUnit(reqDay)}`}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <div className="text-[10px] font-bold text-slate-400 mb-1">{t.profileRightHand}</div>
                  <div className="grid grid-cols-2 gap-1">
                    {(
                      [
                        { id: 'lightstick', label: t.profileHandLightstick },
                        { id: 'fan', label: t.profileHandFan },
                        { id: 'slogan', label: t.profileSloganBoth },
                        { id: 'none', label: t.profileHandNone },
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
                              onShowToast(t.profileCapLockToast(reqDay, opt.label));
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
                          {isUnlocked ? opt.label : `🔒 ${t.profileDayUnit(reqDay)}`}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* 03. 뛰봉 발광 컬러 */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                {t.profileLightstickColorLabel}
              </label>
              <div className="flex flex-wrap gap-2">
                {LIGHTSTICK_PALETTE.map((c) => {
                  const isUnlocked = answeredCount >= c.unlockDay;
                  const cName = t.profileColorNames[c.hex] ?? c.name;
                  return (
                    <button
                      key={c.hex}
                      onClick={() => {
                        if (!isUnlocked) {
                          onShowToast(t.profileColorLockToast(c.unlockDay, cName));
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
                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: c.hex }} />
                      ) : (
                        <Lock className="w-3 h-3 text-amber-400/80" />
                      )}
                      <span>{cName}</span>
                      {!isUnlocked && (
                        <span className="text-[10px] text-amber-300">
                          {t.profileDayUnit(c.unlockDay)}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-950/75 border border-white/10 flex items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="text-[11px] font-bold text-slate-200 flex items-center gap-1.5">
                  <Cloud className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                  <span className="truncate">
                    {firebaseUser && !firebaseUser.isAnonymous
                      ? firebaseUser.email || 'Google Sync'
                      : firebaseUser?.isAnonymous
                      ? lang === 'en'
                        ? 'Auto-saved on this device'
                        : lang === 'zh'
                        ? '已自动云端保存'
                        : lang === 'ja'
                        ? 'クラウド自動保存中'
                        : '클라우드 자동 저장 중'
                      : authFallbackNeeded
                      ? lang === 'en'
                        ? 'Sign in with Google to sync'
                        : lang === 'zh'
                        ? '登录 Google 同步记录'
                        : lang === 'ja'
                        ? 'Googleログインでクラウド同期'
                        : 'Google 로그인으로 클라우드 연동'
                      : lang === 'en'
                      ? 'Cloud Sync'
                      : '클라우드 동기화'}
                  </span>
                </div>
              </div>
              {firebaseUser && !firebaseUser.isAnonymous ? (
                <button
                  type="button"
                  onClick={onSignOutGoogle}
                  className="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 text-[11px] font-bold text-slate-300 flex items-center gap-1 shrink-0 whitespace-nowrap transition"
                >
                  <LogOut className="w-3 h-3" />
                  <span>{lang === 'en' ? 'Sign out' : '로그아웃'}</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onSignInGoogle}
                  className="px-2.5 py-1.5 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 border border-sky-400/40 text-[11px] font-extrabold text-sky-200 shrink-0 whitespace-nowrap transition"
                >
                  {lang === 'en' ? 'Google Sync' : 'Google 연동'}
                </button>
              )}
            </div>

            <button
              onClick={() => {
                onClose();
              }}
              className="w-full py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-sm font-extrabold text-white transition"
            >
              {lang === 'en'
                ? 'Done & Return'
                : lang === 'zh'
                ? '完成装扮并返回'
                : lang === 'ja'
                ? '着せ替え完了・戻る'
                : '착장 완료 및 돌아가기'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
