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
      <div className="grid grid-cols-7 border-b border-gray-200 text-center py-2 bg-gray-50 text-xs font-semibold text-gray-600 sticky top-0 z-20">
        {weekDayNames.map((name, index) => <div key={index}>{name}</div>)}
      </div>
      {/* カレンダー全体で縦スクロールができるようにし、各マスの高さを内容に合わせて可変にします */}
      <div className="grid grid-cols-7 flex-1 auto-rows-fr divide-x divide-y divide-gray-200 overflow-y-auto">
        {days.map((date, index) => {
          if (!date) return <div key={index} className="bg-gray-50/50 min-h-[100px]" />;

          const dateStr = date.toISOString().split('T')[0];
          const dayEvents = events.filter((ev) => ev.date === dateStr);
          const isToday = new Date().toDateString() === date.toDateString();

          return (
            <div 
              key={index} 
              onClick={() => onCellClick(dateStr, '09:00')} 
              className="min-h-[120px] p-1.5 hover:bg-gray-50 cursor-pointer transition flex flex-col"
            >
              <div className="text-right mb-1">
                <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full inline-block ${isToday ? 'bg-blue-600 text-white font-bold' : 'text-gray-700'}`}>
                  {date.getDate()}
                </span>
              </div>
              {/* セル内の予定を縦に並べてすべて表示（折り返し・スクロールなし） */}
              <div className="flex-1 space-y-1">
                {dayEvents.map((event) => (
                  <div key={event.id} className="w-full">
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