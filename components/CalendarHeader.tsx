import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { EventItem } from '@/app/page';
import { supabase } from '@/lib/supabase';

interface CalendarHeaderProps {
  currentDate: Date;
  viewMode: 'month' | 'week' | 'day';
  setViewMode: (mode: 'month' | 'week' | 'day') => void;
  onNavigate: (direction: 'prev' | 'today' | 'next') => void;
  events?: EventItem[];
  onUpdate?: () => void;
}

export default function CalendarHeader({
  currentDate,
  viewMode,
  setViewMode,
  onNavigate,
  events = [],
  onUpdate,
}: CalendarHeaderProps) {
  const formattedYearMonth = `${currentDate.getFullYear()}年 ${currentDate.getMonth() + 1}月`;

  // 週表示の場合にその週の7日間を計算する
  const getWeekDays = () => {
    const startOfWeek = new Date(currentDate);
    const day = startOfWeek.getDay();
    startOfWeek.setDate(startOfWeek.getDate() - day);

    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(startOfWeek);
      d.setDate(d.getDate() + i);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const dateStr = String(d.getDate()).padStart(2, '0');
      return {
        dateString: `${year}-${month}-${dateStr}`,
        dayName: ['日', '月', '火', '水', '木', '金', '土'][i],
        dayNumber: d.getDate(),
      };
    });
  };

  const weekDays = viewMode === 'week' ? getWeekDays() : [];

  // 日付セルをクリックしたとき（休みの追加）
  const handleHeaderCellClick = async (dateStr: string) => {
    const name = prompt('お休みする人の名前を入力してください:');
    if (!name || !name.trim()) return;

    const holidayTitle = `${name.trim()} 🎌`;

    // Supabaseに水色カードとして保存（color: '#38bdf8'）
    const { error } = await supabase.from('events').insert([
      {
        title: holidayTitle,
        date: dateStr,
        color: '#38bdf8',
        status: 'active',
      },
    ]);

    if (!error && onUpdate) {
      onUpdate();
    }
  };

  // 水色の休みカードをクリックしたとき（削除）
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
    <header className="flex flex-col border-b border-gray-200 bg-white">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-semibold text-gray-800 min-w-[120px]">
            {formattedYearMonth}
          </h1>
          <div className="flex items-center space-x-1">
            <button onClick={() => onNavigate('prev')} className="p-2 rounded-full hover:bg-gray-100 text-gray-600">
              <ChevronLeft size={20} />
            </button>
            <button onClick={() => onNavigate('today')} className="px-3 py-1.5 text-sm font-medium border border-gray-300 rounded-md hover:bg-gray-50 text-gray-700">
              今日
            </button>
            <button onClick={() => onNavigate('next')} className="p-2 rounded-full hover:bg-gray-100 text-gray-600">
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        <div className="flex bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setViewMode('day')}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition ${viewMode === 'day' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600'}`}
          >
            日
          </button>
          <button
            onClick={() => setViewMode('week')}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition ${viewMode === 'week' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600'}`}
          >
            週
          </button>
          <button
            onClick={() => setViewMode('month')}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition ${viewMode === 'month' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600'}`}
          >
            月
          </button>
        </div>
      </div>

      {/* 週表示の場合に曜日・日付の下に水色の休みカードを表示するエリア */}
      {viewMode === 'week' && (
        <div className="flex border-t border-gray-200 bg-gray-50 text-xs text-gray-600">
          <div className="w-8 flex-shrink-0 border-r border-gray-200" />
          <div className="grid grid-cols-7 flex-1 divide-x divide-gray-200">
            {weekDays.map((wd, index) => {
              const dayEvents = events.filter((e) => e.date === wd.dateString);
              // 「🎌」が含まれる、またはカラーが水色（#38bdf8）のものを休みとして抽出
              const holidayEvents = dayEvents.filter((e) => e.title.includes('🎌') || e.color === '#38bdf8');
              const isToday = new Date().toDateString() === new Date(wd.dateString).toDateString();

              return (
                <div 
                  key={index} 
                  className="flex flex-col items-center py-2 px-1 cursor-pointer hover:bg-gray-100 transition"
                  onClick={() => handleHeaderCellClick(wd.dateString)}
                  title="クリックして休みを追加"
                >
                  <span className="font-semibold">{wd.dayName}</span>
                  <span className={`mt-1 text-sm h-7 w-7 flex items-center justify-center rounded-full ${isToday ? 'bg-blue-600 text-white font-bold' : 'text-gray-800'}`}>
                    {wd.dayNumber}
                  </span>
                  
                  {/* 水色の休みカード表示エリア */}
                  <div className="mt-1.5 flex flex-col gap-1 w-full items-center">
                    {holidayEvents.map((ev) => (
                      <div
                        key={ev.id}
                        style={{ backgroundColor: ev.color || '#38bdf8' }}
                        className="text-white text-[10px] px-1.5 py-0.5 rounded shadow-sm w-full text-center truncate"
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
      )}
    </header>
  );
}