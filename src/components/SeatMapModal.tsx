import React from 'react';
import { LayoutGrid, X } from 'lucide-react';
import { ARENA_SECTIONS } from '../constants/arenaSections';
import { useI18n } from '../i18n/LanguageContext';

export function SeatMapModal({
  currentSeatZone,
  onSelectSeat,
  onClose,
}: {
  currentSeatZone: string;
  onSelectSeat: (seatLabel: string) => void;
  onClose: () => void;
}) {
  const { t } = useI18n();
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-md">
      <div className="w-full max-w-4xl max-h-[92vh] flex flex-col rounded-3xl bg-slate-900 border border-sky-400/35 shadow-2xl overflow-hidden">
        {/* 모달 헤더 */}
        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-blue-950/80 to-slate-900">
          <div>
            <h2 className="text-base sm:text-lg font-extrabold text-white flex items-center gap-2">
              <LayoutGrid className="w-5 h-5 text-sky-400" />
              <span>{t.seatModalTitle}</span>
            </h2>
            <p className="text-[11px] sm:text-xs text-blue-200/80 mt-0.5">
              {t.seatModalSubtitle}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/15 text-slate-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 본문: 좌측 인터랙티브 SVG 배치도 + 우측 등급별 빠른 선택 */}
        <div className="p-4 sm:p-5 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
          {/* SVG 원형 아레나 배치도 */}
          <div className="lg:col-span-7 flex flex-col items-center">
            <div className="w-full max-w-[460px] rounded-2xl bg-slate-950/90 border border-white/10 p-2 sm:p-3 shadow-inner">
              <svg viewBox="0 0 640 560" className="w-full h-auto select-none">
                <circle
                  cx="320"
                  cy="290"
                  r="254"
                  fill="#0b1220"
                  stroke="#1e293b"
                  strokeWidth="3"
                />

                {/* 계단형 MAIN STAGE */}
                <path
                  d="M 238 22 L 402 22 L 402 36 L 424 36 L 424 52 L 456 52 L 456 96 L 184 96 L 184 52 L 216 52 L 216 36 L 238 36 Z"
                  fill="#1e293b"
                  stroke="#38bdf8"
                  strokeWidth="2"
                />
                <text
                  x="320"
                  y="68"
                  textAnchor="middle"
                  fill="#e0f2fe"
                  fontSize="16"
                  fontWeight="900"
                >
                  STAGE
                </text>

                {/* 2F A석 (43 ~ 24구역) */}
                {ARENA_SECTIONS.filter((s) => s.tier === '2F').map((sec, idx, arr) => {
                  const cx = 320;
                  const cy = 290;
                  const rIn = 196;
                  const rOut = 242;
                  const t = idx / (arr.length - 1);
                  const centerAng = Math.PI * (1.16 - t * 1.32);
                  const halfStep = (Math.PI * 1.32) / (arr.length - 1) / 2.15;
                  const a1 = centerAng + halfStep;
                  const a2 = centerAng - halfStep;

                  const x1In = cx + Math.cos(a1) * rIn;
                  const y1In = cy + Math.sin(a1) * rIn;
                  const x2In = cx + Math.cos(a2) * rIn;
                  const y2In = cy + Math.sin(a2) * rIn;
                  const x1Out = cx + Math.cos(a1) * rOut;
                  const y1Out = cy + Math.sin(a1) * rOut;
                  const x2Out = cx + Math.cos(a2) * rOut;
                  const y2Out = cy + Math.sin(a2) * rOut;

                  const labelR = (rIn + rOut) / 2;
                  const lx = cx + Math.cos(centerAng) * labelR;
                  const ly = cy + Math.sin(centerAng) * labelR;
                  const isSelected = currentSeatZone === sec.label;
                  const numText = sec.id.replace('2F-', '');

                  const d = [
                    `M ${x1In.toFixed(1)} ${y1In.toFixed(1)}`,
                    `L ${x1Out.toFixed(1)} ${y1Out.toFixed(1)}`,
                    `A ${rOut} ${rOut} 0 0 0 ${x2Out.toFixed(1)} ${y2Out.toFixed(1)}`,
                    `L ${x2In.toFixed(1)} ${y2In.toFixed(1)}`,
                    `A ${rIn} ${rIn} 0 0 1 ${x1In.toFixed(1)} ${y1In.toFixed(1)}`,
                    'Z',
                  ].join(' ');

                  return (
                    <g
                      key={sec.id}
                      onClick={() => onSelectSeat(sec.label)}
                      className="cursor-pointer hover:opacity-90 transition-opacity"
                    >
                      <path
                        d={d}
                        fill={isSelected ? '#f59e0b' : '#0e749b'}
                        stroke={isSelected ? '#ffffff' : '#0f172a'}
                        strokeWidth={isSelected ? '2.5' : '1.5'}
                      />
                      <text
                        x={lx}
                        y={ly + 4}
                        textAnchor="middle"
                        fill="#ffffff"
                        fontSize="11"
                        fontWeight="800"
                      >
                        {numText}
                      </text>
                    </g>
                  );
                })}

                {/* 1F S석 (15 ~ 1구역) */}
                {ARENA_SECTIONS.filter((s) => s.tier === '1F').map((sec, idx, arr) => {
                  const cx = 320;
                  const cy = 290;
                  const rIn = 146;
                  const rOut = 188;
                  const t = idx / (arr.length - 1);
                  const centerAng = Math.PI * (1.14 - t * 1.28);
                  const halfStep = (Math.PI * 1.28) / (arr.length - 1) / 2.15;
                  const a1 = centerAng + halfStep;
                  const a2 = centerAng - halfStep;

                  const x1In = cx + Math.cos(a1) * rIn;
                  const y1In = cy + Math.sin(a1) * rIn;
                  const x2In = cx + Math.cos(a2) * rIn;
                  const y2In = cy + Math.sin(a2) * rIn;
                  const x1Out = cx + Math.cos(a1) * rOut;
                  const y1Out = cy + Math.sin(a1) * rOut;
                  const x2Out = cx + Math.cos(a2) * rOut;
                  const y2Out = cy + Math.sin(a2) * rOut;

                  const labelR = (rIn + rOut) / 2;
                  const lx = cx + Math.cos(centerAng) * labelR;
                  const ly = cy + Math.sin(centerAng) * labelR;
                  const isSelected = currentSeatZone === sec.label;
                  const numText = sec.id.replace('1F-', '');

                  const d = [
                    `M ${x1In.toFixed(1)} ${y1In.toFixed(1)}`,
                    `L ${x1Out.toFixed(1)} ${y1Out.toFixed(1)}`,
                    `A ${rOut} ${rOut} 0 0 0 ${x2Out.toFixed(1)} ${y2Out.toFixed(1)}`,
                    `L ${x2In.toFixed(1)} ${y2In.toFixed(1)}`,
                    `A ${rIn} ${rIn} 0 0 1 ${x1In.toFixed(1)} ${y1In.toFixed(1)}`,
                    'Z',
                  ].join(' ');

                  return (
                    <g
                      key={sec.id}
                      onClick={() => onSelectSeat(sec.label)}
                      className="cursor-pointer hover:opacity-90 transition-opacity"
                    >
                      <path
                        d={d}
                        fill={isSelected ? '#f59e0b' : '#38bdf8'}
                        stroke={isSelected ? '#ffffff' : '#0f172a'}
                        strokeWidth={isSelected ? '2.5' : '1.5'}
                      />
                      <text
                        x={lx}
                        y={ly + 4}
                        textAnchor="middle"
                        fill="#0f172a"
                        fontSize="11"
                        fontWeight="900"
                      >
                        {numText}
                      </text>
                    </g>
                  );
                })}

                {/* FLOOR 뛰 (C ~ J구역) */}
                {ARENA_SECTIONS.filter(
                  (s) => s.tier === 'FLOOR' && s.id !== 'FLOOR-A' && s.id !== 'FLOOR-B'
                ).map((sec, idx, arr) => {
                  const cx = 320;
                  const cy = 200;
                  const rIn = 118;
                  const rOut = 148;
                  const t = idx / (arr.length - 1);
                  const centerAng = Math.PI * (0.95 - t * 0.9);
                  const halfStep = (Math.PI * 0.9) / (arr.length - 1) / 2.2;
                  const a1 = centerAng + halfStep;
                  const a2 = centerAng - halfStep;

                  const x1In = cx + Math.cos(a1) * rIn;
                  const y1In = cy + Math.sin(a1) * rIn;
                  const x2In = cx + Math.cos(a2) * rIn;
                  const y2In = cy + Math.sin(a2) * rIn;
                  const x1Out = cx + Math.cos(a1) * rOut;
                  const y1Out = cy + Math.sin(a1) * rOut;
                  const x2Out = cx + Math.cos(a2) * rOut;
                  const y2Out = cy + Math.sin(a2) * rOut;

                  const labelR = (rIn + rOut) / 2;
                  const lx = cx + Math.cos(centerAng) * labelR;
                  const ly = cy + Math.sin(centerAng) * labelR;
                  const isSelected = currentSeatZone === sec.label;
                  const letter = sec.id.replace('FLOOR-', '');

                  const d = [
                    `M ${x1In.toFixed(1)} ${y1In.toFixed(1)}`,
                    `L ${x1Out.toFixed(1)} ${y1Out.toFixed(1)}`,
                    `A ${rOut} ${rOut} 0 0 0 ${x2Out.toFixed(1)} ${y2Out.toFixed(1)}`,
                    `L ${x2In.toFixed(1)} ${y2In.toFixed(1)}`,
                    `A ${rIn} ${rIn} 0 0 1 ${x1In.toFixed(1)} ${y1In.toFixed(1)}`,
                    'Z',
                  ].join(' ');

                  return (
                    <g
                      key={sec.id}
                      onClick={() => onSelectSeat(sec.label)}
                      className="cursor-pointer hover:opacity-90 transition-opacity"
                    >
                      <path
                        d={d}
                        fill={isSelected ? '#f59e0b' : '#6366f1'}
                        stroke={isSelected ? '#ffffff' : '#0f172a'}
                        strokeWidth={isSelected ? '2.5' : '1.5'}
                      />
                      <text
                        x={lx}
                        y={ly + 4}
                        textAnchor="middle"
                        fill="#ffffff"
                        fontSize="11"
                        fontWeight="800"
                      >
                        {letter}
                      </text>
                    </g>
                  );
                })}

                {/* 반원 닻(⚓) 모양 돌출 무대 */}
                <rect
                  x="308"
                  y="96"
                  width="24"
                  height="196"
                  fill="#1e293b"
                  stroke="#38bdf8"
                  strokeWidth="1.8"
                />
                <path
                  d="M 220 192 A 100 100 0 0 0 420 192"
                  fill="none"
                  stroke="#1e293b"
                  strokeWidth="20"
                  strokeLinecap="butt"
                />
                <path
                  d="M 210 192 A 110 110 0 0 0 430 192"
                  fill="none"
                  stroke="#38bdf8"
                  strokeWidth="1.8"
                />
                <path
                  d="M 230 192 A 90 90 0 0 0 410 192"
                  fill="none"
                  stroke="#38bdf8"
                  strokeWidth="1.8"
                />
                <line x1="210" y1="192" x2="230" y2="192" stroke="#38bdf8" strokeWidth="1.8" />
                <line x1="410" y1="192" x2="430" y2="192" stroke="#38bdf8" strokeWidth="1.8" />

                <text
                  x="198"
                  y="174"
                  textAnchor="middle"
                  fill="#94a3b8"
                  fontSize="10"
                  fontWeight="800"
                >
                  FLOOR
                </text>
                <text
                  x="442"
                  y="174"
                  textAnchor="middle"
                  fill="#94a3b8"
                  fontSize="10"
                  fontWeight="800"
                >
                  FLOOR
                </text>

                {/* FLOOR 에 (A구역) */}
                {(() => {
                  const secA = ARENA_SECTIONS.find((s) => s.id === 'FLOOR-A')!;
                  const isSelA = currentSeatZone === secA.label;
                  return (
                    <g
                      onClick={() => onSelectSeat(secA.label)}
                      className="cursor-pointer hover:opacity-90"
                    >
                      <path
                        d="M 238 192 A 82 82 0 0 0 302 272 L 302 192 Z"
                        fill={isSelA ? '#f59e0b' : '#3b82f6'}
                        stroke="#7dd3fc"
                        strokeWidth={isSelA ? '2.5' : '1.5'}
                      />
                      <rect x="256" y="176" width="28" height="20" rx="10" fill="#0284c7" />
                      <text
                        x="270"
                        y="190"
                        textAnchor="middle"
                        fill="#ffffff"
                        fontSize="11"
                        fontWeight="900"
                      >
                        에
                      </text>
                      <text
                        x="276"
                        y="232"
                        textAnchor="middle"
                        fill="#ffffff"
                        fontSize="13"
                        fontWeight="900"
                      >
                        A
                      </text>
                    </g>
                  );
                })()}

                {/* FLOOR 바 (B구역) */}
                {(() => {
                  const secB = ARENA_SECTIONS.find((s) => s.id === 'FLOOR-B')!;
                  const isSelB = currentSeatZone === secB.label;
                  return (
                    <g
                      onClick={() => onSelectSeat(secB.label)}
                      className="cursor-pointer hover:opacity-90"
                    >
                      <path
                        d="M 338 192 L 338 272 A 82 82 0 0 0 402 192 Z"
                        fill={isSelB ? '#f59e0b' : '#0284c7'}
                        stroke="#5eead4"
                        strokeWidth={isSelB ? '2.5' : '1.5'}
                      />
                      <rect x="356" y="176" width="28" height="20" rx="10" fill="#0d9488" />
                      <text
                        x="370"
                        y="190"
                        textAnchor="middle"
                        fill="#ffffff"
                        fontSize="11"
                        fontWeight="900"
                      >
                        바
                      </text>
                      <text
                        x="364"
                        y="232"
                        textAnchor="middle"
                        fill="#ffffff"
                        fontSize="13"
                        fontWeight="900"
                      >
                        B
                      </text>
                    </g>
                  );
                })()}

                {/* 뛰 배지 */}
                <rect x="304" y="294" width="32" height="20" rx="10" fill="#7c3aed" />
                <text
                  x="320"
                  y="308"
                  textAnchor="middle"
                  fill="#ffffff"
                  fontSize="11"
                  fontWeight="900"
                >
                  뛰
                </text>

                {/* CONSOLE 부스 */}
                <rect
                  x="275"
                  y="360"
                  width="90"
                  height="24"
                  rx="6"
                  fill="#334155"
                  stroke="#64748b"
                  strokeWidth="1.2"
                />
                <text
                  x="320"
                  y="376"
                  textAnchor="middle"
                  fill="#cbd5e1"
                  fontSize="10"
                  fontWeight="800"
                >
                  CONSOLE
                </text>
              </svg>
            </div>

            {/* 범례 */}
            <div className="mt-2.5 flex flex-wrap items-center justify-center gap-3 text-[11px] text-slate-300">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-blue-500 inline-block" />
                {t.seatLegendFloor}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-sky-400 inline-block" />
                {t.seatLegend1F}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-cyan-700 inline-block" />
                {t.seatLegend2F}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-amber-500 inline-block" />
                {t.seatLegendCurrent}
              </span>
            </div>
          </div>

          {/* 우측: 등급별 빠른 구역 리스트 */}
          <div className="lg:col-span-5 space-y-3">
            <div className="p-3.5 rounded-2xl bg-blue-950/50 border border-blue-400/30">
              <div className="text-[11px] font-bold text-sky-300">{t.seatCurrentLabel}</div>
              <div className="text-sm font-extrabold text-white mt-0.5">{currentSeatZone}</div>
            </div>

            {/* FLOOR R석 */}
            <div>
              <div className="text-xs font-extrabold text-blue-300 mb-1.5">
                {t.seatTierFloor}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {ARENA_SECTIONS.filter((s) => s.tier === 'FLOOR').map((sec) => (
                  <button
                    key={sec.id}
                    onClick={() => onSelectSeat(sec.label)}
                    className={`px-2.5 py-1.5 rounded-xl text-xs font-bold border transition ${
                      currentSeatZone === sec.label
                        ? 'bg-amber-500 border-white text-slate-950'
                        : 'bg-slate-800/80 border-white/10 text-slate-200 hover:bg-blue-600'
                    }`}
                  >
                    {sec.badge} ({sec.id.replace('FLOOR-', '')})
                  </button>
                ))}
              </div>
            </div>

            {/* 1F S석 */}
            <div>
              <div className="text-xs font-extrabold text-sky-300 mb-1.5">
                {t.seatTier1F}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {ARENA_SECTIONS.filter((s) => s.tier === '1F').map((sec) => (
                  <button
                    key={sec.id}
                    onClick={() => onSelectSeat(sec.label)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition ${
                      currentSeatZone === sec.label
                        ? 'bg-amber-500 border-white text-slate-950'
                        : 'bg-slate-800/80 border-white/10 text-slate-200 hover:bg-sky-500 hover:text-slate-950'
                    }`}
                  >
                    {t.seatSectionSuffix(sec.id.replace('1F-', ''))}
                  </button>
                ))}
              </div>
            </div>

            {/* 2F A석 */}
            <div>
              <div className="text-xs font-extrabold text-cyan-300 mb-1.5">
                {t.seatTier2F}
              </div>
              <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1">
                {ARENA_SECTIONS.filter((s) => s.tier === '2F').map((sec) => (
                  <button
                    key={sec.id}
                    onClick={() => onSelectSeat(sec.label)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition ${
                      currentSeatZone === sec.label
                        ? 'bg-amber-500 border-white text-slate-950'
                        : 'bg-slate-800/80 border-white/10 text-slate-200 hover:bg-cyan-600'
                    }`}
                  >
                    {t.seatSectionSuffix(sec.id.replace('2F-', ''))}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
