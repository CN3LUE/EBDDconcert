import type { SeatSectionInfo } from '../types/plaza';

// KSPO DOME 360도 좌석 섹션 데이터 생성 (실제 반원 닻 모양 돌출무대 기준)
export const ARENA_SECTIONS: SeatSectionInfo[] = (() => {
  const sections: SeatSectionInfo[] = [
    {
      id: 'FLOOR-A',
      label: 'FLOOR 에 (A구역)',
      tier: 'FLOOR',
      badge: '에',
      x: -3.6,
      y: 0.24,
      z: -2.0,
      rotY: 0,
      width: 4.6,
      depth: 5.6,
      color: 0x3b82f6,
    },
    {
      id: 'FLOOR-B',
      label: 'FLOOR 바 (B구역)',
      tier: 'FLOOR',
      badge: '바',
      x: 3.6,
      y: 0.24,
      z: -2.0,
      rotY: 0,
      width: 4.6,
      depth: 5.6,
      color: 0x0284c7,
    },
  ];

  // FLOOR 뛰 (C ~ J 구역 · 반원 닻 외곽을 따라 배치)
  const floorLetters = ['C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
  floorLetters.forEach((letter, idx) => {
    const t = idx / (floorLetters.length - 1);
    const ang = Math.PI * (0.96 - t * 0.92);
    const r = 11.2;
    const x = Math.cos(ang) * r;
    const z = -4.2 + Math.sin(ang) * r;
    sections.push({
      id: `FLOOR-${letter}`,
      label: `FLOOR 뛰 (${letter}구역)`,
      tier: 'FLOOR',
      badge: '뛰',
      x,
      y: 0.24,
      z,
      rotY: Math.atan2(x, z + 4.2),
      width: 3.1,
      depth: 2.8,
      color: 0x6366f1,
    });
  });

  // 1F S석 (15 ~ 1 구역)
  for (let i = 0; i < 15; i++) {
    const num = 15 - i;
    const t = i / 14;
    const ang = Math.PI * (1.14 - t * 1.28);
    const r = 16.0;
    const x = Math.cos(ang) * r;
    const z = -1.5 + Math.sin(ang) * r;
    sections.push({
      id: `1F-${num}`,
      label: `1F S석 ${num}구역`,
      tier: '1F',
      x,
      y: 3.6,
      z,
      rotY: Math.atan2(x, z + 1.5),
      width: 3.9,
      depth: 4.6,
      color: 0x38bdf8,
    });
  }

  // 2F A석 (43 ~ 24 구역)
  for (let i = 0; i < 20; i++) {
    const num = 43 - i;
    const t = i / 19;
    const ang = Math.PI * (1.16 - t * 1.32);
    const r = 22.4;
    const x = Math.cos(ang) * r;
    const z = -1.5 + Math.sin(ang) * r;
    sections.push({
      id: `2F-${num}`,
      label: `2F A석 ${num}구역`,
      tier: '2F',
      x,
      y: 8.4,
      z,
      rotY: Math.atan2(x, z + 1.5),
      width: 4.2,
      depth: 5.6,
      color: 0x0e749b,
    });
  }

  return sections;
})();

export const SEAT_ZONES = ARENA_SECTIONS.map((s) => s.label);

export function getSeatSectionByLabel(label: string): SeatSectionInfo {
  return ARENA_SECTIONS.find((s) => s.label === label) || ARENA_SECTIONS[0];
}
