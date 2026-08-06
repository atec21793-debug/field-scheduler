'use client';

import React, { useState } from 'react';
import { EventItem } from '@/app/page';
import EventCard from './EventCard';
import { supabase } from '@/lib/supabase';

interface DayViewProps {
  currentDate: Date;
  events: EventItem[];
  members?: string[];
  absences?: { member: string; date: string; type: string }[];
  onSelectEvent: (event: EventItem) => void;
  onCellClick: (dateStr: string, timeStr?: string) => void;
  onUpdate?: () => void | Promise<void>;
}

interface ParsedEvent {
  event: EventItem;
  startMin: number;
  endMin: number;
}

interface PositionedEvent extends ParsedEvent {
  colIndex: number;
  totalCols: number;
}

export default function DayView({
  currentDate,
  events,
  members = ['天野', '佐々木', '山岡'],
  absences = [],
  onSelectEvent,
  onCellClick,
  onUpdate,
}: DayViewProps) {
  const HOUR_HEIGHT = 40;
  const hours = Array.from({ length: 24 }, (_, i) => i);

  // モーダル用state（お休み追加用）
  const [selectedDateForHoliday, setSelectedDateForHoliday] = useState<string | null>(null);
  const [selectedMember, setSelectedMember] = useState<string>(members[0] || '天野');

  const formatDateStr = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const dateStr = formatDateStr(currentDate);
  
  // この日のイベントを取得
  const dayEvents = events.filter((ev) => ev.date === dateStr);
  const holidayEvents = dayEvents.filter(
    (ev) => (ev.title && ev.title.includes('🎌')) || ev.color === '#388ddd'
  );

  // 通常の予定のみを抽出
  const normalEvents = dayEvents.filter((ev) => {
    const isHoliday = (ev.title && ev.title.includes('🎌')) || ev.color === '#388ddd';
    return !isHoliday;
  });

  const timeToMinutes = (timeStr?: string | null) => {
    if (!timeStr) return 0;
    const parts = timeStr.split(':');
    if (parts.length < 2) return 0;
    const h = parseInt(parts[0], 10) || 0;
    const m = parseInt(parts[1], 10) || 0;
    return h * 60 + m;
  };

  const parsedEvents: ParsedEvent[] = normalEvents.map((event) => {
    const startStr = event.start_time || '09:00';
    const startMin = timeToMinutes(startStr);
    
    // 終了時間を正確に計算
    let endMin = startMin + 60; // デフォルト1時間後
    if (event.end_time) {
      const parsedEndMin = timeToMinutes(event.end_time);
      if (parsedEndMin > startMin) {
        endMin = parsedEndMin;
      }
    }

    return {
      event,
      startMin,
      endMin,
    };
  });

  parsedEvents.sort((a, b) => a.startMin - b.startMin || (b.endMin - b.startMin) - (a.endMin - a.startMin));

  const tempPositionedEvents: Omit<PositionedEvent, 'totalCols'>[] = [];
  const columns: ParsedEvent[][] = [];

  for (const item of parsedEvents) {
    let colIndex = 0;
    let placed = false;

    for (let i = 0; i < columns.length; i++) {
      const lastEventInCol = columns[i][columns[i].length - 1];
      if (lastEventInCol.endMin <= item.startMin) {
        columns[i].push(item);
        colIndex = i;
        placed = true;
        break;
      }
    }

    if (!placed) {
      colIndex = columns.length;
      columns.push([item]);
    }

    tempPositionedEvents.push({
      ...item,
      colIndex,
    });
  }

  const finalPositionedEvents: PositionedEvent[] = tempPositionedEvents.map((item) => {
    const getConnectedGroup = (target: typeof tempPositionedEvents[0]) => {
      const visited = new Set<string>();
      const queue = [target];
      visited.add(String(target.event.id));

      const group = [];

      while (queue.length > 0) {
        const current = queue.shift()!;
        group.push(current);

        for (const other of tempPositionedEvents) {
          if (!visited.has(String(other.event.id))) {
            if (current.startMin < other.endMin && current.endMin > other.startMin) {
              visited.add(String(other.event.id));
              queue.push(other);
            }
          }
        }
      }
      return group;
    };

    const group = getConnectedGroup(item);
    const maxColInGroup = Math.max(...group.map((g) => g.colIndex));
    const totalCols = maxColInGroup + 1;

    return {
      ...item,
      totalCols: Math.max(totalCols, 1),
    };
  });

  // ヘッダー（余白部分）をクリックしてお休みを追加
  const handleHeaderClick = () => {
    setSelectedDateForHoliday(dateStr);
    setSelectedMember(members[0] || '天野');
  };

  const handleConfirmHoliday = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDateForHoliday) return;

    const holidayTitle = `${selectedMember} 🎌`;

    const { error } = await supabase.from('events').insert([
      {
        title: holidayTitle,
        date: selectedDateForHoliday,
        color: '#388ddd',
        status: 'active',
      },
    ]);

    if (!error && onUpdate) {
      onUpdate();
    }
    setSelectedDateForHoliday(null);
  };

  const handleHolidayDelete = async (e: React.MouseEvent, eventId: number) => {
    e.stopPropagation();
    if (confirm('このお休みの予定を削除しますか？')) {
      const { error } = await supabase.from('events').delete().eq('id', eventId);
      if (!error && onUpdate) {
        onUpdate();
      }
    }
  };

  const isToday = new Date().toDateString() === currentDate.toDateString();

  return (
    <div className="flex flex-col h-full bg-white select-none">
      {/* ヘッダー部分：日付の「横」にカードを配置 */}
      <div 
        className="flex items-center border-b border-gray-200 bg-gray-50 text-xs font-semibold text-gray-600 sticky top-0 z-20 px-4 py-2 gap-4"
      >
        <div className="w-12 flex-shrink-0" />
        <div 
          className="flex-1 flex items-center gap-3 cursor-pointer hover:bg-gray-100/50 transition py-1 rounded"
          onClick={handleHeaderClick}
          title="クリックして休みを追加"
        >
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-sm font-bold text-gray-800">
              {currentDate.getFullYear()}年 {currentDate.getMonth() + 1}月 {currentDate.getDate()}日
            </span>
            <span className={`h-6 px-2 flex items-center justify-center rounded-full text-xs ${isToday ? 'bg-blue-600 text-white font-bold' : 'text-gray-800 bg-gray-200'}`}>
              {['日', '月', '火', '水', '木', '金', '土'][currentDate.getDay()]}
            </span>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap flex-1">
            {holidayEvents.map((ev) => (
              <div
                key={ev.id}
                style={{ backgroundColor: ev.color || '#388ddd' }}
                className="text-white text-xs px-2.5 py-1 rounded shadow-sm font-semibold flex items-center gap-1"
                onClick={(e) => handleHolidayDelete(e, ev.id)}
                title="クリックして削除"
              >
                <span>{ev.title}</span>
                <span className="text-[10px] opacity-75">×</span>
              </div>
            ))}
          </div>
        </div>
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

          {finalPositionedEvents.map(({ event, startMin, endMin, colIndex, totalCols }) => {
            const durationMin = endMin - startMin;
            const topPx = (startMin / 60) * HOUR_HEIGHT;
            const heightPx = (durationMin / 60) * HOUR_HEIGHT;
            
            const widthPercent = 100 / totalCols;
            const leftPercent = colIndex * widthPercent;

            const isCompleted = event.status === 'completed' || (event as any).completed;
            const title = event.title || '';
            const isUndecided = title.includes('日延未定');
            const isPostponed = title.includes('日延べ');
            const shouldDim = isPostponed || (isCompleted && !isUndecided);

            return (
              <div
                key={event.id}
                style={{
                  top: `${topPx}px`,
                  height: `${Math.max(heightPx, 20)}px`,
                  position: 'absolute',
                  left: `${leftPercent}%`,
                  width: `${widthPercent}%`,
                  padding: '2px',
                  zIndex: 10 + colIndex,
                }}
                className={`overflow-hidden box-border transition-opacity ${shouldDim ? 'opacity-50' : 'opacity-100'}`}
              >
                <EventCard event={event} onClick={() => onSelectEvent(event)} />
              </div>
            );
          })}
        </div>
      </div>

      {/* メンバー選択用のドロップダウンモーダル（お休み追加用） */}
      {selectedDateForHoliday && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedDateForHoliday(null)}>
          <div className="bg-white rounded-lg shadow-xl w-full max-w-xs p-5" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-sm font-bold text-gray-800 mb-3">お休み登録 ({selectedDateForHoliday})</h3>
            <form onSubmit={handleConfirmHoliday} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">メンバー選択</label>
                <select
                  value={selectedMember}
                  onChange={(e) => setSelectedMember(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {members.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
              <div className="flex space-x-2 pt-1">
                <button
                  type="button"
                  onClick={() => setSelectedDateForHoliday(null)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-xs text-gray-600 hover:bg-gray-50"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-md text-xs hover:bg-blue-700"
                >
                  追加
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}