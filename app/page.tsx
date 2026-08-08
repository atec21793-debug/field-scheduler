'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import CalendarHeader from '@/components/CalendarHeader';
import MonthView from '@/components/MonthView';
import WeekView from '@/components/WeekView';
import DayView from '@/components/DayView';
import EventModal from '@/components/EventModal';
import EventFormModal from '@/components/EventFormModal';
import Link from 'next/link';
import { ShoppingCart } from 'lucide-react';

export type EventItem = {
  id: number;
  date: string | null;
  title: string;
  status: string;
  inserted_at: string;
  time: string | null;
  address: string | null;
  start_time: string | null;
  end_time: string | null;
  color: string | null;
  memo?: string | null;
  report?: string | null;
  ordered?: boolean;
};

export default function Home() {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('week');
  const [events, setEvents] = useState<EventItem[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [targetDateForCreate, setTargetDateForCreate] = useState<string>('');
  const [targetTimeForCreate, setTargetTimeForCreate] = useState<string>('09:00');

  const fetchEvents = async () => {
    let query = supabase.from('events').select('*');

    if (searchQuery.trim() !== '') {
      query = query.ilike('title', `%${searchQuery.trim()}%`);
    }

    const { data, error } = await query;
    if (error) {
      console.error('Error fetching events:', error);
    } else if (data) {
      setEvents(data);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [searchQuery]);

  const handleNavigate = (direction: 'prev' | 'today' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'today') {
      setCurrentDate(new Date());
      return;
    }
    const amount = direction === 'next' ? 1 : -1;
    if (viewMode === 'month') newDate.setMonth(newDate.getMonth() + amount);
    else if (viewMode === 'week') newDate.setDate(newDate.getDate() + amount * 7);
    else newDate.setDate(newDate.getDate() + amount);
    setCurrentDate(newDate);
  };

  const handleCellClick = (dateStr: string, timeStr: string = '09:00') => {
    setTargetDateForCreate(dateStr);
    setTargetTimeForCreate(timeStr);
    setIsCreateModalOpen(true);
  };

  // ドラッグ＆ドロップでカレンダーにドロップされた時の処理
  const handleDropToCalendar = async (dateStr: string, timeStr: string = '09:00', eventIdStr: string) => {
    const eventId = Number(eventIdStr);
    if (!eventId) return;

    // Supabaseの該当イベントの日付・時間を更新（必要に応じてステータスも通常に戻す）
    const { error } = await supabase
      .from('events')
      .update({ 
        date: dateStr,
        start_time: timeStr,
        status: 'scheduled' 
      })
      .eq('id', eventId);

    if (error) {
      console.error('Error updating event date:', error);
    } else {
      fetchEvents();
    }
  };

  // 日付が未定（null）のものを抽出
  // ※ 「日延未定」の判定条件は既存のデータに合わせて調整してください（例: status === 'postponed' または titleに「日延べ」が含まれる等）
  const unscheduledEvents = events.filter((ev) => !ev.date && ev.status !== 'postponed' && !ev.title.includes('日延べ'));
  const postponedEvents = events.filter((ev) => !ev.date && (ev.status === 'postponed' || ev.title.includes('日延べ')));

  return (
    <main className="flex flex-col h-screen bg-white">
      <CalendarHeader
        currentDate={currentDate}
        viewMode={viewMode}
        setViewMode={setViewMode}
        onNavigate={handleNavigate}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />

      {/* 検索キーワード入力時のみ一覧を表示するエリア */}
      {searchQuery.trim() !== '' && (
        <div className="bg-gray-50 border-b border-gray-200 px-4 py-3 max-h-48 overflow-y-auto">
          <div className="text-xs font-bold text-gray-500 mb-2">
            検索結果: {events.length}件の予定
          </div>
          {events.length === 0 ? (
            <div className="text-xs text-gray-400">一致する予定はありません</div>
          ) : (
            <div className="space-y-1.5">
              {events.map((ev) => (
                <div
                  key={ev.id}
                  onClick={() => {
                    setSelectedEvent(ev);
                    setIsModalOpen(true);
                  }}
                  className="flex items-center justify-between bg-white p-2 rounded border border-gray-200 text-xs shadow-sm cursor-pointer hover:bg-blue-50 transition"
                >
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-gray-700">{ev.date || '未定'}</span>
                    {ev.start_time && (
                      <span className="text-gray-500">{ev.start_time}〜</span>
                    )}
                    <span className="font-bold text-blue-600">{ev.title}</span>
                  </div>
                  {ev.ordered && (
                    <span className="text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded font-medium">
                      発注済み
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* メインエリア（サイドバー ＋ カレンダー） */}
      <div className="flex flex-1 overflow-hidden">
        {/* 未定・日延未定カード置き場（サイドバー） */}
        <aside className="w-72 bg-gray-50 border-r border-gray-200 p-4 overflow-y-auto flex flex-col space-y-6">
          {/* 未定リスト */}
          <div>
            <h3 className="text-xs font-bold text-gray-600 mb-2 flex items-center justify-between">
              <span>📌 未定リスト</span>
              <span className="bg-gray-200 text-gray-700 px-1.5 py-0.5 rounded text-[10px]">
                {unscheduledEvents.length}
              </span>
            </h3>
            <div className="space-y-2">
              {unscheduledEvents.map((ev) => (
                <div
                  key={ev.id}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData('text/plain', ev.id.toString());
                  }}
                  onClick={() => {
                    setSelectedEvent(ev);
                    setIsModalOpen(true);
                  }}
                  className="bg-white p-2.5 rounded border border-gray-200 text-xs shadow-sm cursor-grab active:cursor-grabbing hover:border-blue-400 transition"
                >
                  <div className="font-bold text-gray-800">{ev.title}</div>
                  {ev.address && <div className="text-gray-500 text-[10px] truncate mt-1">{ev.address}</div>}
                </div>
              ))}
              {unscheduledEvents.length === 0 && (
                <div className="text-[11px] text-gray-400 text-center py-2">未定の案件はありません</div>
              )}
            </div>
          </div>

          {/* 日延未定リスト */}
          <div>
            <h3 className="text-xs font-bold text-amber-600 mb-2 flex items-center justify-between">
              <span>⏳ 日延未定リスト</span>
              <span className="bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded text-[10px]">
                {postponedEvents.length}
              </span>
            </h3>
            <div className="space-y-2">
              {postponedEvents.map((ev) => (
                <div
                  key={ev.id}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData('text/plain', ev.id.toString());
                  }}
                  onClick={() => {
                    setSelectedEvent(ev);
                    setIsModalOpen(true);
                  }}
                  className="bg-white p-2.5 rounded border border-amber-200 text-xs shadow-sm cursor-grab active:cursor-grabbing hover:border-amber-400 transition"
                >
                  <div className="font-bold text-gray-800">{ev.title}</div>
                  {ev.address && <div className="text-gray-500 text-[10px] truncate mt-1">{ev.address}</div>}
                </div>
              ))}
              {postponedEvents.length === 0 && (
                <div className="text-[11px] text-gray-400 text-center py-2">日延未定の案件はありません</div>
              )}
            </div>
          </div>
        </aside>

        {/* カレンダー本体 */}
        <div 
          className="flex-1 overflow-auto"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const eventId = e.dataTransfer.getData('text/plain');
            // セル以外にドロップされた場合は、現在表示されている週/日の最初の日にデフォルトで配置するなど調整可能です
          }}
        >
          {viewMode === 'month' && (
            <MonthView currentDate={currentDate} events={events} onSelectEvent={(e) => { setSelectedEvent(e); setIsModalOpen(true); }} onCellClick={handleCellClick} />
          )}
          {viewMode === 'week' && (
            <WeekView 
              currentDate={currentDate} 
              events={events} 
              onSelectEvent={(e) => { setSelectedEvent(e); setIsModalOpen(true); }} 
              onCellClick={handleCellClick} 
              onUpdate={fetchEvents}
              onNavigate={(dir) => handleNavigate(dir)} 
            />
          )}
          {viewMode === 'day' && (
            <DayView currentDate={currentDate} events={events} onSelectEvent={(e) => { setSelectedEvent(e); setIsModalOpen(true); }} onCellClick={handleCellClick} />
          )}
        </div>
      </div>

      {isModalOpen && selectedEvent && (
        <EventModal event={selectedEvent} onClose={() => setIsModalOpen(false)} onUpdate={fetchEvents} />
      )}

      {isCreateModalOpen && (
        <EventFormModal defaultDate={targetDateForCreate} defaultTime={targetTimeForCreate} onClose={() => setIsCreateModalOpen(false)} onCreated={fetchEvents} />
      )}
    </main>
  );
}