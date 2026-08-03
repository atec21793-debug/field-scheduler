import React from 'react';
import { EventItem } from '@/app/page';
import EventCard from './EventCard';

interface MonthViewProps {
  currentDate: Date;
  events: EventItem[];
  onSelectEvent: (event: EventItem) => void;
  onCellClick: (dateStr: string, timeStr?: string) => void;
}

export default function MonthView({ currentDate, events, onSelectEvent, onCellClick }: MonthViewProps) {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);

  const startDayOfWeek = firstDayOfMonth.getDay();
  const totalDays = lastDayOfMonth.getDate();

  const days = [];
  for (let i = 0; i < startDayOfWeek; i++) {
    days.push(null);
  }
  for (let d = 1; d <= totalDays; d++) {
    days.push(new Date(year, month, d));
  }

  const weekDayNames = ['日', '月', '火', '水', '木', '金', '土'];

  return (
    <div className="flex flex-col h-full bg-white select-none">
      <div className="grid grid-cols-7 border-b border-gray-200 text-center py-1.5 bg-gray-50 text-xs font-semibold text-gray-600 sticky top-0 z-20">
        {weekDayNames.map((name, index) => <div key={index}>{name}</div>)}
      </div>
      <div className="grid grid-cols-7 grid-rows-6 flex-1 divide-x divide-y divide-gray-200 h-full overflow-hidden">
        {days.map((date, index) => {
          if (!date) return <div key={index} className="bg-gray-50/50" />;

          const dateStr = date.toISOString().split('T')[0];
          const dayEvents = events.filter((ev) => ev.date === dateStr);
          const isToday = new Date().toDateString() === date.toDateString();

          return (
            <div 
              key={index} 
              onClick={() => onCellClick(dateStr, '09:00')} 
              className="p-1 hover:bg-gray-50 cursor-pointer transition flex flex-col overflow-hidden"
            >
              <div className="text-right mb-0.5">
                <span className={`text-[11px] font-medium px-1.5 py-0.2 rounded-full inline-block ${isToday ? 'bg-blue-600 text-white font-bold' : 'text-gray-700'}`}>
                  {date.getDate()}
                </span>
              </div>
              {/* 各カードをブロック要素として強制的に1行に収め、はみ出た分を省略する */}
              <div className="flex-1 space-y-0.5 overflow-hidden">
                {dayEvents.map((event) => (
                  <div key={event.id} className="w-full overflow-hidden whitespace-nowrap text-ellipsis text-[10px] leading-tight">
                    <EventCard event={event} onClick={() => onSelectEvent(event)} />
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}