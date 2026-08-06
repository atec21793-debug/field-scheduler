'use client';

import React from 'react';
import { EventItem } from '@/app/page';
import EventCard from './EventCard';

interface DayViewProps {
  currentDate: Date;
  events: EventItem[];
  members?: string[];
  absences?: { member: string; date: string; type: string }[];
  onSelectEvent: (event: EventItem) => void;
  onCellClick: (dateStr: string, timeStr?: string) => void;
}

export default function DayView({
  currentDate,
  events,
  members = [],
  absences = [],
  onSelectEvent,
  onCellClick,
}: DayViewProps) {
  const HOUR_HEIGHT = 40;

  const formatDateStr = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const dateStr = formatDateStr(currentDate);
  const dayEvents = events.filter((ev) => ev.date === dateStr);
  const hours = Array.from({ length: 24 }, (_, i) => i);

  // この日の休みメンバーを抽出
  const dayAbsences = absences.filter((a) => a.date === dateStr);

  const timeToMinutes = (timeStr?: string) => {
    if (!timeStr) return 0;
    const parts = timeStr.split(':');
    if (parts.length < 2) return 0;
    const h = parseInt(parts[0], 10) || 0;
    const m = parseInt(parts[1], 10) || 0;
    return h * 60 + m;
  };

  const parsedEvents = dayEvents.map((event) => {
    const startStr = event.start_time || '09:00';
    const startMin = timeToMinutes(startStr);
    
    let durationMin = 60;
    if (event.end_time) {
      const endMin = timeToMinutes(event.end_time);
      if (endMin > startMin) {
        durationMin = endMin - startMin;
      }
    }
    // 最小の高さを確保しつつ実際の長さに合わせる
    const actualDuration = Math.max(durationMin, 30);

    return {
      event,
      startMin,
      endMin: startMin + actualDuration,
    };
  });

  // 重なりを避けてカラムに割り当てるロジック（最大3カラム）
  const positionedEvents = React.useMemo(() => {
    const sorted = [...parsedEvents].sort((a, b) => a.startMin - b.startMin || b.endMin - a.endMin);
    const assigned: { event: EventItem; startMin: number; endMin: number; colIndex: number; totalCols: number }[] = [];

    sorted.forEach((item) => {
      const overlapping = assigned.filter(
        (other) => item.startMin < other.endMin && item.endMin > other.startMin
      );

      const usedCols = new Set(overlapping.map((o) => o.colIndex));
      let colIndex = 0;
      for (let i = 0; i < 3; i++) {
        if (!usedCols.has(i)) {
          colIndex = i;
          break;
        }
      }

      const groupCount = Math.min(Math.max(overlapping.length + 1, 1), 3);

      assigned.push({
        ...item,
        colIndex: Math.min(colIndex, 2),
        totalCols: groupCount,
      });
    });

    return assigned;
  }, [parsedEvents]);

  return (
    <div className="flex flex-col h-full bg-white select-none">
      {/* ヘッダー部分：日付の右側に休みのメンバーを横並びで配置 */}
      <div className="flex items-center px-4 py-2 border-b bg-gray-50 gap-4 flex-wrap">
        <div className="text-base font-bold text-gray-800">
          {currentDate.getFullYear()}年 {currentDate.getMonth() + 1}月 {currentDate.getDate()}日
        </div>

        {dayAbsences.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap">
            {dayAbsences.map((abs, idx) => (
              <span
                key={idx}
                className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-semibold bg-red-50 text-red-700 border border-red-200"
              >
                {abs.member} ({abs.type})
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto flex relative">
        {/* 時間数字カラム */}
        <div className="w-12 flex-shrink-0 border-r border-gray-200 bg-gray-50/30">
          {hours.map((hour) => (
            <div key={hour} style={{ height: `${HOUR_HEIGHT}px` }} className="text-right pr-2 pt-1 text-xs text-gray-500 font-medium border-b border-gray-100">
              {hour}:00
            </div>
          ))}
        </div>

        {/* タイムライン本体 */}
        <div className="flex-1 relative" style={{ height: `${24 * HOUR_HEIGHT}px` }}>
          {hours.map((hour) => {
            const timeSlot = `${hour.toString().padStart(2, '0')}:00`;
            return (
              <div
                key={hour}
                onClick={() => onCellClick(dateStr, timeSlot)}
                style={{ height: `${HOUR_HEIGHT}px` }}
                className="border-b border-gray-100 hover:bg-blue-50/30 cursor-pointer"
              />
            );
          })}

          {positionedEvents.map(({ event, startMin, endMin, colIndex, totalCols }) => {
            const durationMin = endMin - startMin;
            const topPx = (startMin / 60) * HOUR_HEIGHT;
            const heightPx = (durationMin / 60) * HOUR_HEIGHT;
            
            const cols = Math.max(totalCols, 1);
            const widthPercent = 100 / cols;
            const leftPercent = colIndex * widthPercent;

            return (
              <div
                key={event.id}
                style={{
                  top: `${topPx}px`,
                  height: `${Math.max(heightPx, 30)}px`,
                  position: 'absolute',
                  left: `${leftPercent}%`,
                  width: `${widthPercent}%`,
                  padding: '2px',
                  zIndex: 10 + colIndex,
                }}
                className="overflow-hidden box-border"
              >
                <EventCard event={event} onClick={() => onSelectEvent(event)} />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}