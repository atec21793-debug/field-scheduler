import React from 'react';
import { EventItem } from '@/app/page';
import EventCard from './EventCard';

interface WeekViewProps {
  currentDate: Date;
  events: EventItem[];
  onSelectEvent: (event: EventItem) => void;
  onCellClick: (dateStr: string, timeStr?: string) => void;
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

export default function WeekView({ currentDate, events, onSelectEvent, onCellClick }: WeekViewProps) {
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

  return (
    <div className="flex flex-col h-full bg-white select-none overflow-x-auto">
      <div className="flex border-b border-gray-200 bg-gray-50 text-xs font-semibold text-gray-600 sticky top-0 z-20">
        <div className="w-12 flex-shrink-0 text-center py-2 border-r border-gray-200">時間</div>
        <div className="grid grid-cols-7 flex-1">
          {weekDays.map((date, index) => {
            const isToday = new Date().toDateString() === date.toDateString();
            return (
              <div key={index} className="flex flex-col items-center py-2 border-r border-gray-200 last:border-r-0">
                <span>{weekDayNames[index]}</span>
                <span className={`mt-1 text-sm h-7 w-7 flex items-center justify-center rounded-full ${isToday ? 'bg-blue-600 text-white font-bold' : 'text-gray-800'}`}>
                  {date.getDate()}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto relative flex">
        <div className="w-12 flex-shrink-0 border-r border-gray-200 bg-gray-50/30">
          {hours.map((hour) => (
            <div key={hour} style={{ height: `${HOUR_HEIGHT}px` }} className="text-right pr-1 pt-1 text-[11px] text-gray-400 border-b border-gray-100">
              {hour.toString().padStart(2, '0')}:00
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 flex-1 relative divide-x divide-gray-200">
          {weekDays.map((date, dayIndex) => {
            const dateStr = formatDateStr(date);
            const dayEvents = events.filter((ev) => ev.date === dateStr);

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
              let placed = false;
              let colIndex = 0;

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
              const overlapping = tempPositionedEvents.filter(
                (other) => item.startMin < other.endMin && item.endMin > other.startMin
              );
              const maxColInGroup = Math.max(...overlapping.map((o) => o.colIndex), item.colIndex);
              const totalCols = maxColInGroup + 1;

              return {
                ...item,
                totalCols: Math.max(totalCols, 1),
              };
            });

            return (
              <div key={dayIndex} className="relative" style={{ height: `${24 * HOUR_HEIGHT}px` }}>
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

                  return (
                    <div
                      key={event.id}
                      style={{
                        top: `${topPx}px`,
                        height: `${Math.max(heightPx, 20)}px`,
                        position: 'absolute',
                        left: `${leftPercent}%`,
                        width: `${widthPercent}%`,
                        padding: '1px',
                        zIndex: 10 + colIndex,
                      }}
                      className="overflow-hidden box-border"
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
    </div>
  );
}