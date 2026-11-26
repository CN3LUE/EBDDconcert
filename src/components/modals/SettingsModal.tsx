import React from 'react';
import {
  Globe,
  LogOut,
  Moon,
  Settings,
  ShieldCheck,
  Shirt,
  Sun,
  Sunset,
  Timer,
  X,
} from 'lucide-react';
import { LANG_OPTIONS, useI18n, type AppLang } from '../../i18n/LanguageContext';
import type { BandMemberId } from '../../constants/plazaData';
import type { SkyTheme, UserProfileState } from '../../types/plaza';

export function SettingsModal({
  myProfile,
  skyTheme,
  isAdminAuthorized = false,
  isAdminMode = false,
  activeMemberRunMember = null,
  onToggleAdminMode,
  onAdminSignIn,
  onSignOut,
  onTriggerMemberRunPreview,
  onStopMemberRunPreview,
  onChangeSkyTheme,
  onChangeLang,
  onOpenProfile,
  onClose,
}: {
  myProfile: UserProfileState;
  skyTheme: SkyTheme;
  isAdminAuthorized?: boolean;
  isAdminMode?: boolean;
  activeMemberRunMember?: BandMemberId | null;
  onToggleAdminMode?: () => void;
  onAdminSignIn?: () => void;
  onSignOut?: () => void;
  onTriggerMemberRunPreview?: (member: BandMemberId) => void;
  onStopMemberRunPreview?: () => void;
  onChangeSkyTheme: (theme: SkyTheme) => void;
  onChangeLang: (nextLang: AppLang) => void;
  onOpenProfile: () => void;
  onClose: () => void;
}) {
  const { lang, t } = useI18n();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md">
      <div className="w-full max-w-md max-h-[90vh] flex flex-col rounded-3xl bg-slate-900 border border-blue-400/25 shadow-2xl overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-blue-950/80 to-slate-900">
          <h2 className="text-base font-extrabold text-white flex items-center gap-2">
            <Settings className="w-4 h-4 text-sky-400" />
            <span>{t.settingsTitle}</span>
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/15 text-slate-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-5 overflow-y-auto space-y-4">
          {/* 1. 내 아바타 & MD 꾸미기 */}
          <div className="p-3.5 rounded-2xl bg-slate-950/75 border border-sky-400/25 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="text-xs font-extrabold text-sky-300 flex items-center gap-1.5">
                <Shirt className="w-3.5 h-3.5 shrink-0" />
                <span>{t.settingsAvatarLabel}</span>
              </div>
              <div className="text-xs text-slate-300 mt-1 truncate">
                {myProfile.name} · {myProfile.seatZone}
              </div>
            </div>
            <button
              type="button"
              onClick={onOpenProfile}
              className="px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-extrabold text-white shrink-0 whitespace-nowrap transition active:scale-95"
            >
              {t.settingsAvatarBtn}
            </button>
          </div>

          {/* 2. 언어 설정 */}
          <div className="p-3.5 rounded-2xl bg-slate-950/75 border border-white/10 space-y-2.5">
            <div className="text-xs font-extrabold text-slate-200 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-sky-400" />
              <span>{t.settingsLangLabel}</span>
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {LANG_OPTIONS.map((opt) => (
                <button
                  key={opt.code}
                  type="button"
                  onClick={() => onChangeLang(opt.code)}
                  className={`py-2 px-1.5 rounded-xl border text-xs font-extrabold transition whitespace-nowrap ${
                    lang === opt.code
                      ? 'bg-sky-500 border-sky-300 text-slate-950 shadow'
                      : 'bg-slate-900 border-white/10 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  {opt.short}
                </button>
              ))}
            </div>
          </div>

          {/* 3. 광장 하늘 시간대 */}
          <div className="p-3.5 rounded-2xl bg-slate-950/75 border border-white/10 space-y-2.5">
            <div className="text-xs font-extrabold text-slate-200 flex items-center gap-1.5">
              <Sun className="w-3.5 h-3.5 text-amber-300" />
              <span>{t.settingsSkyLabel}</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => onChangeSkyTheme('day')}
                className={`py-2 px-2 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition whitespace-nowrap ${
                  skyTheme === 'day'
                    ? 'bg-sky-500 border-sky-300 text-slate-950 shadow'
                    : 'bg-slate-900 border-white/10 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <Sun className="w-3.5 h-3.5 shrink-0" />
                <span>{t.skyDay}</span>
              </button>
              <button
                type="button"
                onClick={() => onChangeSkyTheme('sunset')}
                className={`py-2 px-2 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition whitespace-nowrap ${
                  skyTheme === 'sunset'
                    ? 'bg-amber-400 border-amber-200 text-slate-950 shadow'
                    : 'bg-slate-900 border-white/10 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <Sunset className="w-3.5 h-3.5 shrink-0" />
                <span>{t.skySunset}</span>
              </button>
              <button
                type="button"
                onClick={() => onChangeSkyTheme('night')}
                className={`py-2 px-2 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition whitespace-nowrap ${
                  skyTheme === 'night'
                    ? 'bg-indigo-500 border-indigo-300 text-white shadow'
                    : 'bg-slate-900 border-white/10 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <Moon className="w-3.5 h-3.5 shrink-0" />
                <span>{t.skyNight}</span>
              </button>
            </div>
          </div>

          {/* 4. 관리자 모드 */}
          <div className="p-3.5 rounded-2xl bg-slate-950/75 border border-amber-400/25 flex items-center justify-between gap-2.5">
            <div className="min-w-0">
              <div className="text-xs font-extrabold text-amber-300 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                <span>{t.settingsAdminLabel}</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1 leading-snug [word-break:keep-all]">
                {isAdminAuthorized
                  ? isAdminMode
                    ? t.settingsAdminActiveDesc
                    : t.settingsAdminOffDesc
                  : t.settingsAdminMaintenanceDesc}
              </p>
            </div>

            {isAdminAuthorized ? (
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={onToggleAdminMode}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-extrabold whitespace-nowrap transition active:scale-95 ${
                    isAdminMode
                      ? 'bg-amber-400 border-amber-200 text-slate-950 shadow'
                      : 'bg-slate-800 border-white/15 text-slate-200 hover:bg-slate-700'
                  }`}
                >
                  {isAdminMode ? t.settingsAdminToggleOn : t.settingsAdminToggleOff}
                </button>
                {onSignOut && (
                  <button
                    type="button"
                    onClick={onSignOut}
                    title="로그아웃"
                    aria-label="로그아웃"
                    className="p-1.5 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 text-slate-300 transition"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={onAdminSignIn}
                className="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] font-bold text-slate-400 shrink-0 whitespace-nowrap transition"
              >
                {t.settingsAdminMaintenanceBtn}
              </button>
            )}
          </div>

          {/* 5. 관리자 전용 멤버 타임 테스트 */}
          {isAdminAuthorized && isAdminMode && onTriggerMemberRunPreview && (
            <div className="p-3.5 rounded-2xl bg-amber-950/25 border border-amber-400/35 space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <div className="text-xs font-extrabold text-amber-300 flex items-center gap-1.5">
                  <Timer className="w-3.5 h-3.5 shrink-0" />
                  <span>{t.adminMemberRunLabel}</span>
                </div>
                {activeMemberRunMember && onStopMemberRunPreview && (
                  <button
                    type="button"
                    onClick={onStopMemberRunPreview}
                    className="px-2 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 border border-rose-400/40 text-[10px] font-extrabold text-rose-200 whitespace-nowrap transition"
                  >
                    {t.adminMemberRunStop}
                  </button>
                )}
              </div>
              <p className="text-[11px] text-slate-300 leading-snug [word-break:keep-all]">
                {t.adminMemberRunDesc}
              </p>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => onTriggerMemberRunPreview('yonghwa')}
                  className={`py-2 px-1.5 rounded-xl border text-[11px] font-extrabold whitespace-nowrap transition active:scale-95 ${
                    activeMemberRunMember === 'yonghwa'
                      ? 'bg-sky-500 border-sky-200 text-slate-950 shadow'
                      : 'bg-slate-900 border-white/15 text-sky-200 hover:bg-slate-800'
                  }`}
                >
                  🎸 용화시 06:22
                </button>
                <button
                  type="button"
                  onClick={() => onTriggerMemberRunPreview('minhyuk')}
                  className={`py-2 px-1.5 rounded-xl border text-[11px] font-extrabold whitespace-nowrap transition active:scale-95 ${
                    activeMemberRunMember === 'minhyuk'
                      ? 'bg-amber-400 border-amber-200 text-slate-950 shadow'
                      : 'bg-slate-900 border-white/15 text-amber-200 hover:bg-slate-800'
                  }`}
                >
                  🥁 민혁시 06:28
                </button>
                <button
                  type="button"
                  onClick={() => onTriggerMemberRunPreview('jungshin')}
                  className={`py-2 px-1.5 rounded-xl border text-[11px] font-extrabold whitespace-nowrap transition active:scale-95 ${
                    activeMemberRunMember === 'jungshin'
                      ? 'bg-emerald-400 border-emerald-200 text-slate-950 shadow'
                      : 'bg-slate-900 border-white/15 text-emerald-200 hover:bg-slate-800'
                  }`}
                >
                  🎸 정신시 09:15
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
