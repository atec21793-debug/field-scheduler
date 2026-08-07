'use client';

import React, { useState, useRef } from 'react';
import { EventItem } from '@/app/page';
import EventCard from './EventCard';
import { supabase } from '@/lib/supabase';

interface WeekViewProps {
  currentDate: Date;
  events: EventItem[];
  onSelectEvent: (event: EventItem) => void;
  onCellClick: (dateStr: string, timeStr?: string) => void;
  onUpdate?: () => void | Promise<void>;
  onNavigate?: (direction: 'next' | 'prev') => void;
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

export default function WeekView({ currentDate, events, onSelectEvent, onCellClick, onUpdate, onNavigate }: WeekViewProps) {
  const startOfWeek = new Date(currentDate);
  const day = startOfWeek.getDay();
  startOfWeek.setDate(startOfWeek.getDate() - day);

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(startOfWeek);
    d.setDate(d.getDate() + i);
    return d;
  });

  const weekDayNames = ['日', '月', '火', '水', '木', '金', '土'];
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const HOUR_HEIGHT = 40;

  // モーダル用state
  const [selectedDateForHoliday, setSelectedDateForHoliday] = useState<string | null>(null);
  const [selectedMember, setSelectedMember] = useState<string>('天野');
  const members = ['天野', '佐々木', '山岡'];

  // スワイプ検知用の座標保持用ref
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;

    const diffX = touchEndX - touchStartX.current;
    const diffY = touchEndY - touchStartY.current;

    const threshold = 50;
    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > threshold) {
      if (onNavigate) {
        if (diffX > 0) {
          onNavigate('prev');
        } else {
          onNavigate('next');
        }
      }
    }

    touchStartX.current = null;
    touchStartY.current = null;
  };

  const formatDateStr = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const timeToMinutes = (timeStr?: string) => {
    if (!timeStr) return 0;
    const parts = timeStr.split(':');
    if (parts.length < 2) return 0;
    const h = parseInt(parts[0], 10) || 0;
    const m = parseInt(parts[1], 10) || 0;
    return h * 60 + m;
  };

  // ドラッグ＆ドロップで予定を移動する処理
  const handleDrop = async (e: React.DragEvent, targetDateStr: string, targetHour: number) => {
    e.preventDefault();
    e.stopPropagation();
    const eventIdStr = e.dataTransfer.getData('text/plain');
    if (!eventIdStr) return;

    const eventId = Number(eventIdStr);
    const targetEvent = events.find((ev) => Number(ev.id) === eventId);
    if (!targetEvent) return;

    let durationMinutes = 60;
    if (targetEvent.start_time && targetEvent.end_time) {
      const startMin = timeToMinutes(targetEvent.start_time);
      const endMin = timeToMinutes(targetEvent.end_time);
      if (endMin > startMin) {
        durationMinutes = Math.max(endMin - startMin, 30);
      }
    }

    const newStartH = targetHour;
    const newStartM = targetEvent.start_time ? Number(targetEvent.start_time.split(':')[1]) || 0 : 0;
    
    const newStartTotalMin = newStartH * 60 + newStartM;
    const newEndTotalMin = newStartTotalMin + durationMinutes;

    const newEndH = Math.floor(newEndTotalMin / 60) % 24;
    const newEndM = newEndTotalMin % 60;

    const newStartTime = `${newStartH.toString().padStart(2, '0')}:${newStartM.toString().padStart(2, '0')}`;
    const newEndTime = `${newEndH.toString().padStart(2, '0')}:${newEndM.toString().padStart(2, '0')}`;
    const newTimeString = `${newStartTime} - ${newEndTime}`;

    const { error } = await supabase.from('events').update({
      date: targetDateStr,
      start_time: newStartTime,
      end_time: newEndTime,
      time: newTimeString,
    }).eq('id', eventId);

    if (!error && onUpdate) {
      onUpdate();
    } else if (!error) {
      window.location.reload();
    }
  };

  // ヘッダーのセルをクリックしたとき
  const handleHeaderClick = (dateStr: string) => {
    setSelectedDateForHoliday(dateStr);
    setSelectedMember('天野');
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

  return (
    <div 
      className="flex flex-col h-full bg-white select-none overflow-x-auto relative touch-pan-y"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* ヘッダー部分 */}
      <div className="flex border-b border-gray-200 bg-gray-50 text-xs font-semibold text-gray-600 sticky top-0 z-20 pr-[17px]">
        <div className="w-8 flex-shrink-0 border-r border-gray-200" />
        <div className="grid grid-cols-7 flex-1 divide-x divide-gray-200">
          {weekDays.map((date, index) => {
            const headerDateStr = formatDateStr(date);
            const dayEvents = events.filter((ev) => ev.date === headerDateStr);
            const holidayEvents = dayEvents.filter(
              (ev) => (ev.title && ev.title.includes('🎌')) || ev.color === '#388ddd'
            );
            
            const todayStr = formatDateStr(new Date());
            const isToday = headerDateStr === todayStr;

            return (
              <div 
                key={index} 
                className="flex flex-col items-center py-2 px-1 cursor-pointer hover:bg-gray-100 transition"
                onClick={() => handleHeaderClick(headerDateStr)}
                title="クリックして休みを追加"
              >
                <span>{weekDayNames[index]}</span>
                <span className={`mt-1 text-sm h-7 w-7 flex items-center justify-center rounded-full ${isToday ? 'bg-blue-600 text-white font-bold' : 'text-gray-800'}`}>
                  {date.getDate()}
                </span>
                
                <div className="mt-1 flex flex-col gap-1 w-full items-center">
                  {holidayEvents.map((ev) => (
                    <div
                      key={ev.id}
                      style={{ backgroundColor: ev.color || '#388ddd' }}
                      className="text-white text-[10px] px-1 py-0.5 rounded shadow-sm w-full text-center truncate"
                      onClick={(e) => handleHolidayDelete(e, ev.id)}
                      title="クリックして削除"
                    >
                      {ev.title}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto relative flex">
        {/* 時間数字カラム */}
        <div className="w-8 flex-shrink-0 border-r border-gray-200 bg-gray-50/30">
          {hours.map((hour) => (
            <div key={hour} style={{ height: `${HOUR_HEIGHT}px` }} className="text-right pr-1 pt-1 text-xs text-gray-500 font-medium border-b border-gray-100">
              {hour}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 flex-1 relative divide-x divide-gray-200">
          {weekDays.map((date, dayIndex) => {
            const dateStr = formatDateStr(date);
            const dayEvents = events.filter((ev) => {
              const isHoliday = (ev.title && ev.title.includes('🎌')) || ev.color === '#388ddd';
              return ev.date === dateStr && !isHoliday;
            });

            const parsedEvents: ParsedEvent[] = dayEvents.map((event) => {
              const startStr = event.start_time || '09:00';
              const startMin = timeToMinutes(startStr);
              let durationMin = 60;
              if (event.end_time) {
                const endMin = timeToMinutes(event.end_time);
                if (endMin > startMin) {
                  durationMin = Math.max(endMin - startMin, 30);
                }
              }
              return {
                event,
                startMin,
                endMin: startMin + durationMin,
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

            return (
              <div 
                key={dayIndex} 
                className="relative" 
                style={{ height: `${24 * HOUR_HEIGHT}px` }}
                onDragOver={(e) => e.preventDefault()}
              >
                {hours.map((hour) => {
                  const timeSlot = `${hour.toString().padStart(2, '0')}:00`;
                  return (
                    <div
                      key={hour}
                      onClick={() => onCellClick(dateStr, timeSlot)}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => handleDrop(e, dateStr, hour)}
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
                  const isPostponed = title.includes('日延べ') && !isUndecided;
                  const shouldDim = isPostponed || (isCompleted && !isUndecided);

                  return (
                    <div
                      key={event.id}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        const targetHour = Math.floor(startMin / 60);
                        handleDrop(e, dateStr, targetHour);
                      }}
                      style={{
                        top: `${topPx}px`,
                        height: `${Math.max(heightPx, 20)}px`,
                        position: 'absolute',
                        left: `${leftPercent}%`,
                        width: `${widthPercent}%`,
                        padding: '1px',
                        zIndex: 10 + colIndex,
                      }}
                      className={`overflow-hidden box-border transition-opacity ${shouldDim ? 'opacity-50' : 'opacity-100'}`}
                    >
                      <EventCard event={event} onClick={() => onSelectEvent(event)} />
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      {/* メンバー選択用のドロップダウンモーダル */}
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