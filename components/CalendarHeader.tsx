import React, { useState } from 'react';
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
  const [selectedDateForHoliday, setSelectedDateForHoliday] = useState<string | null>(null);
  const [selectedMember, setSelectedMember] = useState<string>('天野');

  const members = ['天野', '佐々木', '山岡'];

  // 週表示の場合の7日間を計算
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

  // 日付セルをクリックしたとき（ドロップダウン用モーダルを開く）
  const handleHeaderCellClick = (dateStr: string) => {
    setSelectedDateForHoliday(dateStr);
    setSelectedMember('天野');
  };

  // 休みを確定して保存
  const handleConfirmHoliday = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDateForHoliday) return;

    const holidayTitle = `${selectedMember} 🎌`;

    const { error } = await supabase.from('events').insert([
      {
        title: holidayTitle,
        date: selectedDateForHoliday,
        color: '#38bdf8',
        status: 'active',
      },
    ]);

    if (!error && onUpdate) {
      onUpdate();
    }
    setSelectedDateForHoliday(null);
  };

  // 休みカードをクリックしたとき（削除）
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
      {/* 上部コントロールバー（年月、前へ/次へ、表示切り替え） */}
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

      {/* 週表示のときの1つに統合されたヘッダー ＆ 休みカードエリア */}
      {viewMode === 'week' && (
        <div className="flex border-t border-gray-200 bg-gray-50 text-xs text-gray-600">
          <div className="w-12 flex-shrink-0 border-r border-gray-200" /> {/* 時間軸の幅に合わせる */}
          <div className="grid grid-cols-7 flex-1 divide-x divide-gray-200">
            {weekDays.map((wd, index) => {
              const dayEvents = events.filter((e) => e.date === wd.dateString);
              // 休みカード（🎌が含まれる、または水色 `#38bdf8` のもの）を抽出
              const holidayEvents = dayEvents.filter(
                (e) => (e.title && e.title.includes('🎌')) || e.color === '#38bdf8'
              );
              const isToday = new Date().toDateString() === new Date(wd.dateString).toDateString();

              return (
                <div 
                  key={index} 
                  className="flex flex-col items-center py-2 px-1 cursor-pointer hover:bg-gray-100 transition min-h-[60px]"
                  onClick={() => handleHeaderCellClick(wd.dateString)}
                  title="クリックして休みを追加"
                >
                  <span className="font-semibold">{wd.dayName}</span>
                  <span className={`mt-1 text-sm h-7 w-7 flex items-center justify-center rounded-full ${isToday ? 'bg-blue-600 text-white font-bold' : 'text-gray-800'}`}>
                    {wd.dayNumber}
                  </span>
                  
                  {/* 休みカード表示エリア */}
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

      {/* メンバー選択用のドロップダウンモーダル */}
      {selectedDateForHoliday && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
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
    </header>
  );
}