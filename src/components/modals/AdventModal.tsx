import React, { useEffect, useMemo, useState } from 'react';
import {
  Check,
  ChevronDown,
  ChevronRight,
  Flag,
  Footprints,
  Lock,
  MessageSquare,
  Pencil,
  RotateCcw,
  Users,
  X,
} from 'lucide-react';
import {
  ADVENT_DAILY_LIST,
  ADVENT_END_DATE,
  ADVENT_MONTHS,
  ADVENT_START_DATE,
} from '../../constants/plazaData';
import { getLocalizedQuestion } from '../../i18n/adventQuestionsI18n';
import { useI18n } from '../../i18n/LanguageContext';
import type { AdventDailyItem, PublicAdventAnswer } from '../../types/plaza';

export function AdventModal({
  todayKstStr,
  dDayRemaining,
  adventTab,
  onChangeAdventTab,
  checkedDates,
  adventProgressPct,
  selectedAdventMonth,
  onSelectAdventMonth,
  adventTrackRows,
  selectedAdventDate,
  onSelectAdventDate,
  currentAdventObj,
  adventAnswers,
  adventAnswerInput,
  onChangeAdventAnswerInput,
  publicAdventAnswers,
  recordedDiaryList,
  answeredCount,
  nextUnlockMilestone,
  onCheckInAdvent,
  onShowToast,
  isAdminMode = false,
  questionOverrides = {},
  onSaveAdminQuestion,
  onResetAdminQuestion,
  onClose,
}: {
  todayKstStr: string;
  dDayRemaining: number;
  adventTab: 'calendar' | 'diary' | 'peers';
  onChangeAdventTab: (tab: 'calendar' | 'diary' | 'peers') => void;
  checkedDates: string[];
  adventProgressPct: number;
  selectedAdventMonth: string;
  onSelectAdventMonth: (monthKey: string) => void;
  adventTrackRows: Array<{ rowIndex: number; isReversed: boolean; items: AdventDailyItem[] }>;
  selectedAdventDate: string;
  onSelectAdventDate: (dateStr: string) => void;
  currentAdventObj: AdventDailyItem;
  adventAnswers: Record<string, string>;
  adventAnswerInput: string;
  onChangeAdventAnswerInput: (val: string) => void;
  publicAdventAnswers: PublicAdventAnswer[];
  recordedDiaryList: AdventDailyItem[];
  answeredCount: number;
  nextUnlockMilestone: { day: number; label: string; shortName: string; icon: string } | null;
  onCheckInAdvent: (dateStr: string) => void;
  onShowToast: (msg: string) => void;
  isAdminMode?: boolean;
  questionOverrides?: Record<string, string>;
  onSaveAdminQuestion?: (dateStr: string, newQuestion: string) => void;
  onResetAdminQuestion?: (dateStr: string) => void;
  onClose: () => void;
}) {
  const { lang, t } = useI18n();
  const [peerFilterMode, setPeerFilterMode] = useState<'all' | 'selected'>('all');
  const [expandedPeerDates, setExpandedPeerDates] = useState<Record<string, boolean>>({});
  const [isEditingQuestion, setIsEditingQuestion] = useState<boolean>(false);
  const [questionDraft, setQuestionDraft] = useState<string>('');

  const getQuestionIdx = (item: AdventDailyItem) => {
    if (item.dateStr === '2027-02-20') return 86;
    if (item.dateStr === '2027-02-21') return 87;
    return (item.dayNumber - 1) % 86;
  };
  const getDisplayQuestion = (item: AdventDailyItem) => {
    const custom = questionOverrides[item.dateStr];
    if (custom && custom.trim()) return custom.trim();
    return getLocalizedQuestion(getQuestionIdx(item), lang);
  };
  const localizedQuestion = getDisplayQuestion(currentAdventObj);
  const hasQuestionOverride = Boolean(questionOverrides[currentAdventObj.dateStr]);

  useEffect(() => {
    setIsEditingQuestion(false);
    setQuestionDraft('');
  }, [currentAdventObj.dateStr, isAdminMode]);

  // 날짜별로 묶인 익명 답변 목록 (질문 1개당 답변들이 드롭다운 아래 줄글로 나열)
  const { groupedPeerDays, totalSharedCount } = useMemo(() => {
    const dayLookup = new Map(ADVENT_DAILY_LIST.map((item) => [item.dateStr, item]));
    const bucket = new Map<
      string,
      {
        dateStr: string;
        dayObj: AdventDailyItem;
        answers: Array<{ id: string; text: string }>;
        seenTexts: Set<string>;
      }
    >();

    const ensureBucket = (dateStr: string) => {
      let existing = bucket.get(dateStr);
      if (!existing) {
        const dayObj = dayLookup.get(dateStr) || currentAdventObj;
        existing = {
          dateStr,
          dayObj,
          answers: [],
          seenTexts: new Set<string>(),
        };
        bucket.set(dateStr, existing);
      }
      return existing;
    };

    for (const entry of publicAdventAnswers) {
      if (!isAdminMode && entry.dateStr > todayKstStr) continue;
      const grp = ensureBucket(entry.dateStr);
      if (!grp.seenTexts.has(entry.text)) {
        grp.seenTexts.add(entry.text);
        grp.answers.push({ id: entry.id, text: entry.text });
      }
    }

    const unlockedDays = isAdminMode
      ? [...ADVENT_DAILY_LIST].reverse()
      : ADVENT_DAILY_LIST.filter((item) => item.dateStr <= todayKstStr).reverse();
    const starterPool = unlockedDays.slice(0, 3);
    for (const dayObj of starterPool) {
      const grp = ensureBucket(dayObj.dateStr);
      dayObj.sampleAnswers.forEach((sampleTxt, idx) => {
        if (!grp.seenTexts.has(sampleTxt)) {
          grp.seenTexts.add(sampleTxt);
          grp.answers.push({ id: `sample-${dayObj.dateStr}-${idx}`, text: sampleTxt });
        }
      });
    }

    const groups = Array.from(bucket.values())
      .filter((g) => g.answers.length > 0)
      .sort((a, b) => b.dateStr.localeCompare(a.dateStr));

    const count = groups.reduce((acc, g) => acc + g.answers.length, 0);
    return { groupedPeerDays: groups, totalSharedCount: count };
  }, [publicAdventAnswers, currentAdventObj, todayKstStr, isAdminMode]);

  const visiblePeerGroups = useMemo(() => {
    if (peerFilterMode === 'selected') {
      return groupedPeerDays.filter((g) => g.dateStr === currentAdventObj.dateStr);
    }
    return groupedPeerDays;
  }, [groupedPeerDays, peerFilterMode, currentAdventObj.dateStr]);

  const togglePeerDate = (dateStr: string, defaultOpen: boolean) => {
    setExpandedPeerDates((prev) => {
      const current = prev[dateStr] ?? defaultOpen;
      return { ...prev, [dateStr]: !current };
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md">
      <div className="w-full max-w-4xl max-h-[90vh] flex flex-col rounded-3xl bg-slate-900 border border-blue-400/30 shadow-2xl overflow-hidden">
        <div className="p-3.5 sm:p-5 border-b border-white/10 flex items-start sm:items-center justify-between gap-2 bg-gradient-to-r from-blue-950/80 to-slate-900">
          <div className="min-w-0">
            <h2 className="text-sm sm:text-lg font-extrabold text-white flex items-center gap-1.5 sm:gap-2 break-keep">
              <Flag className="w-4 h-4 sm:w-5 sm:h-5 text-amber-300 shrink-0" />
              <span className="truncate sm:whitespace-normal">{t.adventTitle}</span>
              {isAdminMode && (
                <span className="px-2 py-0.5 rounded-full bg-amber-400/20 border border-amber-300/60 text-[10px] font-black text-amber-200 shrink-0 whitespace-nowrap">
                  {t.adminModeBadge}
                </span>
              )}
            </h2>
            <p className="text-[11px] sm:text-xs text-blue-200/80 mt-0.5 break-keep leading-snug">
              {t.adventSubtitle}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/15 text-slate-300 shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-2 sm:px-4 pt-2 sm:pt-3 flex items-center justify-between gap-2 border-b border-white/10 bg-slate-900/60">
          <div className="grid grid-cols-3 sm:flex w-full sm:w-auto gap-1 sm:gap-2">
            <button
              onClick={() => onChangeAdventTab('calendar')}
              className={`px-1.5 sm:px-4 py-2.5 text-[11px] sm:text-sm font-bold border-b-2 transition flex items-center justify-center whitespace-nowrap ${
                adventTab === 'calendar'
                  ? 'border-sky-400 text-sky-300'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              <span className="sm:hidden truncate">
                {t.adventTabCourseShort(checkedDates.length, ADVENT_DAILY_LIST.length)}
              </span>
              <span className="hidden sm:inline">
                {t.adventTabCourse(checkedDates.length, ADVENT_DAILY_LIST.length)}
              </span>
            </button>
            <button
              onClick={() => onChangeAdventTab('diary')}
              className={`px-1.5 sm:px-4 py-2.5 text-[11px] sm:text-sm font-bold border-b-2 transition flex items-center justify-center gap-1 sm:gap-1.5 whitespace-nowrap ${
                adventTab === 'diary'
                  ? 'border-sky-400 text-sky-300'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5 hidden sm:block shrink-0" />
              <span className="sm:hidden truncate">
                {t.adventTabDiaryShort(recordedDiaryList.length)}
              </span>
              <span className="hidden sm:inline">
                {t.adventTabDiary(recordedDiaryList.length)}
              </span>
            </button>
            <button
              onClick={() => onChangeAdventTab('peers')}
              className={`px-1.5 sm:px-4 py-2.5 text-[11px] sm:text-sm font-bold border-b-2 transition flex items-center justify-center gap-1 sm:gap-1.5 whitespace-nowrap ${
                adventTab === 'peers'
                  ? 'border-sky-400 text-sky-300'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5 hidden sm:block shrink-0" />
              <span className="sm:hidden truncate">{t.adventTabPeersShort(totalSharedCount)}</span>
              <span className="hidden sm:inline">{t.adventTabPeers(totalSharedCount)}</span>
            </button>
          </div>
          <span className="hidden md:inline-flex px-2.5 py-1 mb-2 rounded-full bg-blue-600/30 border border-sky-400/40 text-[11px] font-extrabold text-sky-200 shrink-0 whitespace-nowrap">
            {t.adventUntilFinish(dDayRemaining)}
          </span>
        </div>

        <div className="p-3 sm:p-5 overflow-y-auto flex-1">
          {adventTab === 'calendar' ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              {/* 좌측: 결승선까지 이어지는 S자 블루 러닝 트랙 */}
              <div className="lg:col-span-7 space-y-3">
                <div className="p-3 rounded-2xl bg-slate-950/80 border border-blue-400/25 space-y-2">
                  <div className="flex items-center justify-between gap-2 text-[11px] font-extrabold">
                    <span className="text-emerald-300 whitespace-nowrap">🚩 START (11.26)</span>
                    <span className="text-pink-300 whitespace-nowrap">🏁 FINISH (02.20-21)</span>
                  </div>
                  <div className="relative h-3 rounded-full bg-slate-800 overflow-hidden border border-white/10">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-blue-600 via-sky-400 to-amber-300 transition-all duration-500"
                      style={{ width: `${Math.max(4, adventProgressPct)}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between gap-2 text-[11px] font-extrabold">
                    <span className="text-sky-300 whitespace-nowrap">
                      {t.adventProgressLabel(
                        adventProgressPct,
                        checkedDates.length,
                        ADVENT_DAILY_LIST.length
                      )}
                    </span>
                    <span className="md:hidden px-2 py-0.5 rounded-full bg-blue-600/30 border border-sky-400/40 text-[10px] text-sky-200 whitespace-nowrap">
                      {t.adventUntilFinish(dDayRemaining)}
                    </span>
                  </div>
                </div>

                {/* 구간(LAP) 선택 탭 */}
                <div className="flex flex-wrap gap-1.5">
                  {ADVENT_MONTHS.map((m) => (
                    <button
                      key={m.key}
                      onClick={() => onSelectAdventMonth(m.key)}
                      className={`px-2.5 py-1.5 rounded-xl text-[11px] font-extrabold border transition whitespace-nowrap ${
                        selectedAdventMonth === m.key
                          ? 'bg-blue-600 border-sky-300 text-white shadow'
                          : 'bg-slate-950/70 border-white/10 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      {t.adventMonths[m.key] ?? m.label}
                    </button>
                  ))}
                  <button
                    onClick={() => onSelectAdventMonth('all')}
                    className={`px-2.5 py-1.5 rounded-xl text-[11px] font-extrabold border transition whitespace-nowrap ${
                      selectedAdventMonth === 'all'
                        ? 'bg-indigo-600 border-sky-300 text-white shadow'
                        : 'bg-slate-950/70 border-white/10 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    {t.adventAll88}
                  </button>
                </div>

                {/* S자 지그재그 스타디움 블루 트랙 코스 */}
                <div className="p-3 rounded-2xl bg-slate-950/75 border border-white/10 max-h-[410px] overflow-y-auto space-y-0">
                  {adventTrackRows.map((row, rIdx) => {
                    const isLastRow = rIdx === adventTrackRows.length - 1;
                    const paddedSlots: Array<AdventDailyItem | null> = [
                      ...row.items,
                      ...Array(Math.max(0, 5 - row.items.length)).fill(null),
                    ];
                    const displaySlots = row.isReversed ? [...paddedSlots].reverse() : paddedSlots;

                    return (
                      <div key={`track-row-${row.rowIndex}`} className="relative">
                        <div className="relative px-2 py-2.5 rounded-2xl bg-gradient-to-r from-blue-800/80 via-blue-700/85 to-blue-800/80 border-y-2 border-white/35 grid grid-cols-5 items-center gap-1.5 sm:gap-2">
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
                            const isDay1 = item.dateStr === '2027-02-20';
                            const isDay2 = item.dateStr === ADVENT_END_DATE;
                            const isConcertDay = isDay1 || isDay2;
                            const isFuture = !isAdminMode && item.dateStr > todayKstStr;

                            return (
                              <button
                                key={item.dateStr}
                                onClick={() => {
                                  if (isFuture) {
                                    onShowToast(
                                      t.adventLockedToast(item.year, item.month, item.day, item.dDay)
                                    );
                                    return;
                                  }
                                  onSelectAdventDate(item.dateStr);
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
                                {isDay1 && !isToday && (
                                  <span className="absolute -top-2.5 px-1.5 py-0.5 rounded-full bg-white text-[8px] font-black text-blue-700 shadow">
                                    🏁 DAY 1
                                  </span>
                                )}
                                {isDay2 && !isToday && (
                                  <span className="absolute -top-2.5 px-1.5 py-0.5 rounded-full bg-white text-[8px] font-black text-pink-600 shadow">
                                    🏁 DAY 2
                                  </span>
                                )}

                                <span className="text-[9px] font-bold opacity-80">
                                  {item.month}/{item.day}
                                </span>
                                <span className="text-[11px] sm:text-xs font-black leading-none">
                                  {isDay1 ? 'D-DAY 1' : isDay2 ? 'D-DAY 2' : `D-${item.dDay}`}
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
                          {t.adventCheckedBadge}
                        </span>
                      )}
                    </div>

                    {!isAdminMode && currentAdventObj.dateStr > todayKstStr ? (
                      <div className="p-5 rounded-2xl bg-slate-900/90 border border-amber-400/30 text-center space-y-2.5 my-auto">
                        <div className="w-11 h-11 rounded-2xl bg-amber-400/15 border border-amber-300/40 flex items-center justify-center mx-auto">
                          <Lock className="w-5 h-5 text-amber-300" />
                        </div>
                        <div className="text-sm font-extrabold text-amber-200 [word-break:keep-all]">
                          {t.adventLockedCardTitle(currentAdventObj.month, currentAdventObj.day)}
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed [word-break:keep-all]">
                          {t.adventLockedCardDesc(
                            currentAdventObj.year,
                            currentAdventObj.month,
                            currentAdventObj.day,
                            currentAdventObj.dDay
                          )}
                        </p>
                      </div>
                    ) : (
                      <>
                        <div className="px-3 py-2 rounded-xl bg-blue-950/60 border border-blue-400/25 flex items-center justify-between gap-2 text-xs">
                          <span className="text-blue-200 font-bold shrink-0">
                            {checkedDates.includes(currentAdventObj.dateStr)
                              ? nextUnlockMilestone
                                ? t.adventDoneCountNext(answeredCount, nextUnlockMilestone.day)
                                : t.adventAllMdDone
                              : nextUnlockMilestone
                              ? t.adventNextItemLabel(nextUnlockMilestone.day)
                              : t.adventTodayReward}
                          </span>
                          <span className="text-amber-300 font-extrabold text-right">
                            {nextUnlockMilestone
                              ? nextUnlockMilestone.label
                              : currentAdventObj.rewardLabel}
                          </span>
                        </div>

                        <div className="p-3.5 rounded-xl bg-slate-900/90 border border-white/10 space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <div className="text-[11px] font-extrabold text-sky-400">
                              {t.adventTodayQuestion}
                            </div>
                            {isAdminMode && !isEditingQuestion && (
                              <div className="flex items-center gap-1">
                                {hasQuestionOverride && onResetAdminQuestion && (
                                  <button
                                    type="button"
                                    onClick={() => onResetAdminQuestion(currentAdventObj.dateStr)}
                                    title="기본 질문으로 복원"
                                    className="px-2 py-0.5 rounded-lg bg-white/5 hover:bg-white/15 border border-white/10 text-[10px] font-bold text-slate-300 flex items-center gap-1 transition"
                                  >
                                    <RotateCcw className="w-2.5 h-2.5" />
                                    <span>초기화</span>
                                  </button>
                                )}
                                {onSaveAdminQuestion && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setQuestionDraft(localizedQuestion);
                                      setIsEditingQuestion(true);
                                    }}
                                    className="px-2 py-0.5 rounded-lg bg-amber-400/20 hover:bg-amber-400/30 border border-amber-300/50 text-[10px] font-extrabold text-amber-200 flex items-center gap-1 transition"
                                  >
                                    <Pencil className="w-2.5 h-2.5" />
                                    <span>질문 수정</span>
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                          {isAdminMode && isEditingQuestion ? (
                            <div className="space-y-2">
                              <textarea
                                rows={2}
                                maxLength={200}
                                value={questionDraft}
                                onChange={(e) => setQuestionDraft(e.target.value)}
                                placeholder="수정할 질문을 입력하세요 (최대 200자)"
                                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-amber-400/50 text-xs text-white focus:outline-none resize-none"
                              />
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => setIsEditingQuestion(false)}
                                  className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-[11px] font-bold text-slate-200 transition"
                                >
                                  취소
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const trimmed = questionDraft.trim();
                                    if (!trimmed || !onSaveAdminQuestion) return;
                                    onSaveAdminQuestion(currentAdventObj.dateStr, trimmed);
                                    setIsEditingQuestion(false);
                                  }}
                                  className="px-2.5 py-1 rounded-lg bg-amber-400 hover:bg-amber-300 text-[11px] font-extrabold text-slate-950 flex items-center gap-1 transition"
                                >
                                  <Check className="w-3 h-3" />
                                  <span>질문 저장</span>
                                </button>
                              </div>
                            </div>
                          ) : (
                            <p className="text-xs sm:text-sm font-bold text-white leading-relaxed">
                              Q. {localizedQuestion}
                            </p>
                          )}
                          {adventAnswers[currentAdventObj.dateStr] && (
                            <div className="mt-2 p-2.5 rounded-lg bg-blue-600/20 border border-sky-400/30 text-xs text-sky-100">
                              <span className="font-bold text-sky-300">{t.adventMyRecordPrefix}</span>
                              {adventAnswers[currentAdventObj.dateStr]}
                            </div>
                          )}
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-300 mb-1.5">
                            {t.adventAnswerLabel}
                          </label>
                          <textarea
                            rows={3}
                            maxLength={120}
                            value={adventAnswerInput}
                            onChange={(e) => onChangeAdventAnswerInput(e.target.value)}
                            placeholder={t.adventAnswerPlaceholder}
                            className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/15 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-sky-400 resize-none"
                          />
                        </div>

                        <button
                          type="button"
                          onClick={() => onChangeAdventTab('peers')}
                          className="w-full px-3 py-2 rounded-xl bg-slate-900/90 hover:bg-blue-950/80 border border-sky-400/25 text-[11px] font-bold text-sky-200 flex items-center justify-center gap-1.5 transition"
                        >
                          <span>{t.adventPeersViewAllBtn(totalSharedCount)}</span>
                        </button>
                      </>
                    )}
                  </div>

                  {(isAdminMode || currentAdventObj.dateStr <= todayKstStr) && (
                    <button
                      onClick={() => onCheckInAdvent(currentAdventObj.dateStr)}
                      className="w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-500 hover:to-sky-400 text-xs font-extrabold text-white shadow-lg transition active:scale-95"
                    >
                      {checkedDates.includes(currentAdventObj.dateStr)
                        ? t.adventUpdateAnswerBtn
                        : t.adventCompleteAnswerBtn}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : adventTab === 'diary' ? (
            <div className="space-y-2.5">
              {recordedDiaryList.length === 0 ? (
                <div className="p-10 rounded-2xl bg-slate-950/60 border border-white/10 text-center text-xs sm:text-sm text-slate-400">
                  {t.adventEmptyDiary}
                </div>
              ) : (
                recordedDiaryList.map((item) => {
                  const qText = getDisplayQuestion(item);
                  const dLabel =
                    item.dateStr === '2027-02-20'
                      ? 'D-DAY 1'
                      : item.dateStr === '2027-02-21'
                      ? 'D-DAY 2'
                      : `D-${item.dDay}`;
                  return (
                    <div
                      key={item.dateStr}
                      className="p-3.5 rounded-2xl bg-slate-950/70 border border-blue-400/25 space-y-1.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-extrabold text-sky-300">
                          {item.dateStr} ({dLabel})
                        </span>
                        <span className="text-[11px] font-bold text-emerald-300">
                          {t.adventCheckedBadge}
                        </span>
                      </div>
                      <p className="text-xs font-bold text-white">Q. {qText}</p>
                      {adventAnswers[item.dateStr] && (
                        <p className="text-xs text-sky-100 bg-slate-900/90 p-2.5 rounded-xl">
                          💬 {adventAnswers[item.dateStr]}
                        </p>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-xs font-bold text-sky-200">{t.adventPeerRecords}</div>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => setPeerFilterMode('all')}
                    className={`px-3 py-1.5 rounded-xl text-[11px] font-extrabold border transition whitespace-nowrap ${
                      peerFilterMode === 'all'
                        ? 'bg-blue-600 border-sky-300 text-white'
                        : 'bg-slate-950/70 border-white/10 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    {t.adventPeersAllFilter}
                  </button>
                  <button
                    onClick={() => setPeerFilterMode('selected')}
                    className={`px-3 py-1.5 rounded-xl text-[11px] font-extrabold border transition whitespace-nowrap ${
                      peerFilterMode === 'selected'
                        ? 'bg-blue-600 border-sky-300 text-white'
                        : 'bg-slate-950/70 border-white/10 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    {t.adventPeersDayFilter(currentAdventObj.month, currentAdventObj.day)}
                  </button>
                </div>
              </div>

              {visiblePeerGroups.length === 0 ? (
                <div className="p-10 rounded-2xl bg-slate-950/60 border border-white/10 text-center text-xs sm:text-sm text-slate-400">
                  {t.adventEmptyPeers}
                </div>
              ) : (
                <div className="space-y-2">
                  {visiblePeerGroups.map((group, idx) => {
                    const qText = getDisplayQuestion(group.dayObj);
                    const dLabel =
                      group.dateStr === '2027-02-20'
                        ? 'D-DAY 1'
                        : group.dateStr === '2027-02-21'
                        ? 'D-DAY 2'
                        : `D-${group.dayObj.dDay}`;
                    const defaultOpen = idx === 0 || peerFilterMode === 'selected';
                    const isOpen = expandedPeerDates[group.dateStr] ?? defaultOpen;

                    return (
                      <div
                        key={group.dateStr}
                        className="rounded-2xl bg-slate-950/75 border border-sky-400/20 overflow-hidden"
                      >
                        <button
                          type="button"
                          onClick={() => togglePeerDate(group.dateStr, defaultOpen)}
                          className="w-full px-3.5 py-2.5 flex items-start justify-between gap-2 text-left hover:bg-slate-900/70 transition"
                        >
                          <div className="min-w-0 flex-1 space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 rounded-md bg-blue-950/90 border border-blue-400/30 text-[10px] font-extrabold text-sky-300">
                                {group.dateStr} ({dLabel})
                              </span>
                              <span className="text-[10px] font-bold text-slate-400">
                                {group.answers.length}
                              </span>
                            </div>
                            <p className="text-xs font-bold text-white leading-snug">
                              Q. {qText}
                            </p>
                          </div>
                          <span className="mt-1 text-slate-400 shrink-0">
                            {isOpen ? (
                              <ChevronDown className="w-4 h-4 text-sky-300" />
                            ) : (
                              <ChevronRight className="w-4 h-4" />
                            )}
                          </span>
                        </button>

                        {isOpen && (
                          <div className="border-t border-white/10 bg-slate-900/50 divide-y divide-white/5 px-3.5">
                            {group.answers.map((ans) => (
                              <p
                                key={ans.id}
                                className="py-2 text-xs text-slate-100 leading-relaxed flex items-start gap-2"
                              >
                                <span className="text-sky-400 shrink-0">•</span>
                                <span>{ans.text}</span>
                              </p>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
