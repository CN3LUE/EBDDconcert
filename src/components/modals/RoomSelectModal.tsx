import React from 'react';
import { Users, X } from 'lucide-react';
import { MAX_ROOM_CAPACITY, ROOM_LIST } from '../../constants/plazaData';
import { useI18n } from '../../i18n/LanguageContext';

export function RoomSelectModal({
  currentRoomId,
  currentRoomCapacity,
  onSelectRoom,
  onClose,
}: {
  currentRoomId: number;
  currentRoomCapacity: number;
  onSelectRoom: (roomId: number) => void;
  onClose: () => void;
}) {
  const { t } = useI18n();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-white/15 shadow-2xl overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between">
          <div>
            <h2 className="text-base font-extrabold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-sky-400" />
              <span>{t.roomModalTitle}</span>
            </h2>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {t.roomModalSubtitle}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/15 text-slate-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-2">
          {ROOM_LIST.map((room, idx) => {
            const isCurrent = room.id === currentRoomId;
            const count = isCurrent ? currentRoomCapacity : room.baseCount;
            const trRoom = t.rooms[idx] ?? room;
            return (
              <button
                key={room.id}
                onClick={() => onSelectRoom(room.id)}
                className={`w-full p-3.5 rounded-2xl border flex items-center justify-between gap-2 transition ${
                  isCurrent
                    ? 'bg-blue-600/25 border-sky-400 text-white'
                    : 'bg-slate-950/60 border-white/10 text-slate-200 hover:bg-slate-800'
                }`}
              >
                <div className="text-left">
                  <div className="text-sm font-extrabold flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: room.accentHex }}
                    />
                    <span>{trRoom.name}</span>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-xl bg-slate-900 border border-white/10 text-xs font-extrabold text-sky-300 shrink-0">
                  {count} / {MAX_ROOM_CAPACITY}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
