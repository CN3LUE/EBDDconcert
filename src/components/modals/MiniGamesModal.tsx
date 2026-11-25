import React from 'react';
import { Trophy, X } from 'lucide-react';
import { useI18n } from '../../i18n/LanguageContext';
import {
  MiniGameRoofBreaker,
  MiniGameRun,
} from '../MiniGames';
import type { MiniGameAvatarLook } from '../../types/plaza';

export function MiniGamesModal({
  miniGameTab,
  onChangeTab,
  runBestScore,
  roofBestScore,
  avatarLook,
  onAddJumps,
  onUpdateRunBest,
  onUpdateRoofBest,
  onRewardToast,
  onClose,
}: {
  miniGameTab: 'run' | 'roof';
  onChangeTab: (tab: 'run' | 'roof') => void;
  ebddJumps?: number;
  runBestScore: number;
  roofBestScore: number;
  avatarLook: MiniGameAvatarLook;
  onAddJumps: (amount: number) => void;
  onUpdateRunBest: (score: number) => void;
  onUpdateRoofBest: (score: number) => void;
  onRewardToast: (msg: string) => void;
  onClose: () => void;
}) {
  const { t } = useI18n();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-md">
      <div className="w-full max-w-2xl max-h-[92vh] flex flex-col rounded-3xl bg-slate-900 border border-sky-400/35 shadow-2xl overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-blue-950/90 to-slate-900">
          <div>
            <h2 className="text-base sm:text-lg font-extrabold text-white flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-300" />
              <span>{t.miniModalTitle}</span>
            </h2>
            <p className="text-[11px] sm:text-xs text-blue-200/85 mt-0.5">
              {t.miniModalSubtitle(runBestScore, roofBestScore)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/15 text-slate-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-3 sm:px-4 pt-2 sm:pt-3 grid grid-cols-2 sm:flex gap-1.5 sm:gap-2 border-b border-white/10 bg-slate-900/70">
          <button
            onClick={() => onChangeTab('run')}
            className={`px-2 sm:px-3 py-2.5 text-[11px] sm:text-sm font-extrabold border-b-2 transition whitespace-nowrap truncate ${
              miniGameTab === 'run'
                ? 'border-pink-400 text-pink-300'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            {t.miniTabRun(runBestScore)}
          </button>
          <button
            onClick={() => onChangeTab('roof')}
            className={`px-2 sm:px-3 py-2.5 text-[11px] sm:text-sm font-extrabold border-b-2 transition whitespace-nowrap truncate ${
              miniGameTab === 'roof'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            {t.miniTabRoof(roofBestScore)}
          </button>
        </div>

        <div className="p-4 sm:p-5 overflow-y-auto flex-1">
          {miniGameTab === 'run' ? (
            <MiniGameRun
              avatarLook={avatarLook}
              bestScore={runBestScore}
              onAddJumps={onAddJumps}
              onUpdateBestScore={onUpdateRunBest}
              onRewardToast={onRewardToast}
            />
          ) : (
            <MiniGameRoofBreaker
              avatarLook={avatarLook}
              bestScore={roofBestScore}
              onAddJumps={onAddJumps}
              onUpdateBestScore={onUpdateRoofBest}
              onRewardToast={onRewardToast}
            />
          )}
        </div>
      </div>
    </div>
  );
}
