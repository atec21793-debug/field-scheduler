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
    const actualDuration = Math.max(durationMin, 30);

    return {
      event,
      startMin,
      endMin: startMin + actualDuration,
    };
  });

  // 最大3カラム（三分割）に収まるように重複を考慮してカラムインデックスを割り当てるロジック
  const positionedEvents = React.useMemo(() => {
    const sorted = [...parsedEvents].sort((a, b) => a.startMin - b.startMin || b.endMin - a.endMin);
    
    // イベント同士の重なりを判定して最大3つのカラム（0, 1, 2）に振り分ける
    const assigned: { event: EventItem; startMin: number; endMin: number; colIndex: number; totalCols: number }[] = [];

    sorted.forEach((item) => {
      // 既に割り当てられたイベントのうち、時間が重複しているものを抽出
      const overlapping = assigned.filter(
        (other) => item.startMin < other.endMin && item.endMin > other.startMin
      );

      // 使用されているカラムインデックスのセット
      const usedCols = new Set(overlapping.map((o) => o.colIndex));

      // 0, 1, 2 の中から空いている最小のインデックスを探す
      let colIndex = 0;
      for (let i = 0; i < 3; i++) {
        if (!usedCols.has(i)) {
          colIndex = i;
          break;
        }
      }

      // この時間帯で同時に重なっている最大数を計算（最大3）
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
      {/* ヘッダー部分：日付と休みメンバー表示 */}
      <div className="flex items-center justify-between px-4 py-2 border-b bg-gray-50">
        <div className="text-base font-bold text-gray-800">
          {currentDate.getFullYear()}年 {currentDate.getMonth() + 1}月 {currentDate.getDate()}日
        </div>

        {dayAbsences.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap">
            {dayAbsences.map((abs, idx) => (
              <span
                key={idx}
                className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-50 text-red-700 border border-red-200"
              >
                {abs.member} ({abs.type})
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto flex relative">
        {/* 時間数字カラム */}
        <div className="w-8 flex-shrink-0 border-r border-gray-200 bg-gray-50/30">
          {hours.map((hour) => (
            <div key={hour} style={{ height: `${HOUR_HEIGHT}px` }} className="text-right pr-1 pt-1 text-xs text-gray-500 font-medium border-b border-gray-100">
              {hour}
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
            
            // 三分割（最大3カラム）をベースにした幅と左位置の計算
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