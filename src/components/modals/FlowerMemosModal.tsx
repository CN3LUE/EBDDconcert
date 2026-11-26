import React, { useEffect, useState } from 'react';
import { Check, Heart, Pencil, Trash2, X } from 'lucide-react';
import { FLOWER_COLORS } from '../../constants/plazaData';
import { useI18n } from '../../i18n/LanguageContext';
import { formatRelativeMemoTime } from '../../services/db';
import { FlowerBloomIcon } from '../AvatarPreview3D';
import type { PlazaMemo } from '../../types/plaza';

export function FlowerMemosModal({
  memos,
  myWriterIds,
  selectedMemo,
  newMemoText,
  newMemoColor,
  onChangeMemoText,
  onChangeMemoColor,
  onSubmitMemo,
  onUpdateMemo,
  onDeleteMemo,
  onToggleMemoLike,
  onMoveToMemo,
  isAdminMode = false,
  onClose,
}: {
  memos: PlazaMemo[];
  myWriterIds: string[];
  selectedMemo: PlazaMemo | null;
  newMemoText: string;
  newMemoColor: string;
  onChangeMemoText: (text: string) => void;
  onChangeMemoColor: (hex: string) => void;
  onSubmitMemo: (e: React.FormEvent) => void;
  onUpdateMemo: (id: string, text: string, color: string) => void;
  onDeleteMemo: (id: string) => void;
  onToggleMemoLike: (id: string) => void;
  onMoveToMemo: (memo: PlazaMemo) => void;
  isAdminMode?: boolean;
  onClose: () => void;
}) {
  const { lang, t } = useI18n();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState<string>('');
  const [editColor, setEditColor] = useState<string>(FLOWER_COLORS[6].hex);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [, setTimeTick] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => setTimeTick((n) => n + 1), 30000);
    return () => window.clearInterval(id);
  }, []);

  const startEdit = (memo: PlazaMemo) => {
    setEditingId(memo.id);
    setEditText(memo.text);
    setEditColor(memo.color);
    setConfirmDeleteId(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditText('');
  };

  const saveEdit = (id: string) => {
    const trimmed = editText.trim();
    if (!trimmed) return;
    onUpdateMemo(id, trimmed, editColor);
    setEditingId(null);
    setEditText('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md">
      <div className="w-full max-w-xl max-h-[88vh] flex flex-col rounded-3xl bg-slate-900 border border-sky-400/30 shadow-2xl overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-sky-950/70 to-slate-900">
          <div>
            <h2 className="text-base font-extrabold text-white flex items-center gap-2">
              <FlowerBloomIcon className="w-5 h-5 text-sky-400" />
              <span>{t.flowerModalTitle(memos.length)}</span>
            </h2>
            <p className="text-[11px] text-slate-300 mt-0.5">
              {t.flowerModalSubtitle}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/15 text-slate-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form
          onSubmit={onSubmitMemo}
          className="p-4 border-b border-white/10 bg-slate-950/60 space-y-2.5"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-bold text-slate-300 shrink-0">{t.flowerColorLabel}</span>
            <div className="flex flex-wrap items-center gap-1.5">
              {FLOWER_COLORS.map((c) => (
                <button
                  type="button"
                  key={c.hex}
                  onClick={() => onChangeMemoColor(c.hex)}
                  title={c.name}
                  className={`w-6 h-6 rounded-full border-2 transition ${
                    newMemoColor === c.hex
                      ? 'border-white scale-110 shadow'
                      : 'border-transparent opacity-75 hover:opacity-100'
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
              onChange={(e) => onChangeMemoText(e.target.value)}
              placeholder={t.flowerPlaceholder}
              className="flex-1 px-3.5 py-2 rounded-xl bg-slate-900 border border-white/15 text-xs sm:text-sm text-white focus:outline-none focus:border-sky-400"
            />
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-extrabold text-white shrink-0 transition"
            >
              {t.flowerSubmitBtn}
            </button>
          </div>
        </form>

        <div className="p-4 overflow-y-auto space-y-2.5 flex-1">
          {memos.length === 0 && (
            <div className="p-10 rounded-2xl bg-slate-950/60 border border-white/10 text-center text-xs sm:text-sm text-slate-400">
              {lang === 'en'
                ? 'No flowers planted yet. Plant the very first cheer flower! 🌸'
                : lang === 'zh'
                ? '还没有绽放的花朵，快来种下第一朵应援之花吧！🌸'
                : lang === 'ja'
                ? 'まだ咲いている花がありません。最初の応援の花を咲かせましょう！🌸'
                : '아직 피어난 꽃이 없습니다. 첫 번째 응원 꽃을 피워보세요! 🌸'}
            </div>
          )}
          {memos.map((memo) => {
            const isFocused = selectedMemo?.id === memo.id;
            const isMine = Boolean(memo.authorId && myWriterIds.includes(memo.authorId));
            const canDelete = isMine || isAdminMode;
            const isEditing = editingId === memo.id;
            const isConfirmingDelete = confirmDeleteId === memo.id;

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
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="w-3 h-3 rounded-full shrink-0 border border-white/40"
                      style={{ backgroundColor: isEditing ? editColor : memo.color }}
                    />
                    <span className="text-xs font-extrabold text-white truncate">{memo.author}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-sky-300 shrink-0">
                      {memo.seatZone}
                    </span>
                    {isMine && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-emerald-500/20 border border-emerald-400/35 text-emerald-300 font-bold shrink-0">
                        {t.flowerMineTag}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-[10px] text-slate-400">
                      {formatRelativeMemoTime(memo.createdAtMs, memo.createdAt, lang)}
                    </span>
                    {(isMine || canDelete) && !isEditing && (
                      <>
                        {isMine && (
                          <button
                            type="button"
                            onClick={() => startEdit(memo)}
                            title={t.flowerEditTitle}
                            className="p-1 rounded-lg bg-white/5 hover:bg-sky-500/25 text-slate-300 hover:text-sky-300 transition"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {canDelete &&
                          (isConfirmingDelete ? (
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => {
                                  onDeleteMemo(memo.id);
                                  setConfirmDeleteId(null);
                                }}
                                className="px-2 py-0.5 rounded-md bg-rose-600 hover:bg-rose-500 text-[10px] font-extrabold text-white transition"
                              >
                                {t.flowerDeleteConfirm}
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteId(null)}
                                className="px-1.5 py-0.5 rounded-md bg-white/10 hover:bg-white/20 text-[10px] font-bold text-slate-300 transition"
                              >
                                {t.flowerCancel}
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(memo.id)}
                              title={isAdminMode && !isMine ? '관리자 삭제' : t.flowerDeleteTitle}
                              className="p-1 rounded-lg bg-white/5 hover:bg-rose-500/25 text-slate-300 hover:text-rose-300 transition"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          ))}
                      </>
                    )}
                  </div>
                </div>

                {isEditing ? (
                  <div className="mt-2.5 space-y-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {FLOWER_COLORS.map((c) => (
                        <button
                          type="button"
                          key={c.hex}
                          onClick={() => setEditColor(c.hex)}
                          title={c.name}
                          className={`w-5 h-5 rounded-full border-2 transition ${
                            editColor === c.hex
                              ? 'border-white scale-110'
                              : 'border-transparent opacity-70 hover:opacity-100'
                          }`}
                          style={{ backgroundColor: c.hex }}
                        />
                      ))}
                    </div>
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        maxLength={60}
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        className="flex-1 px-3 py-1.5 rounded-xl bg-slate-900 border border-sky-400/50 text-xs text-white focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => saveEdit(memo.id)}
                        className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-[11px] font-extrabold text-white flex items-center gap-1 shrink-0 transition"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>{t.flowerSave}</span>
                      </button>
                      <button
                        type="button"
                        onClick={cancelEdit}
                        className="px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-[11px] font-bold text-slate-200 shrink-0 transition"
                      >
                        {t.flowerCancel}
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="mt-2 text-xs sm:text-sm text-slate-100 leading-relaxed">
                    {memo.text}
                  </p>
                )}

                <div className="mt-2.5 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => onToggleMemoLike(memo.id)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition whitespace-nowrap ${
                      memo.likedByMe
                        ? 'bg-sky-500/20 text-sky-300 border border-sky-400/40'
                        : 'bg-white/5 text-slate-300 hover:bg-white/10'
                    }`}
                  >
                    <Heart className="w-3 h-3 fill-current shrink-0" />
                    <span>{t.flowerLikeBtn(memo.likes)}</span>
                    {memo.likedByMe && (
                      <Check className="w-3 h-3 text-sky-300 shrink-0" />
                    )}
                  </button>

                  <button
                    onClick={() => onMoveToMemo(memo)}
                    className="text-[11px] font-bold text-sky-400 hover:underline whitespace-nowrap"
                  >
                    {t.flowerMoveToBtn}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
