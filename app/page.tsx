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
  date: string;
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
  ordered?: boolean; // memberを削除し、orderedを追加
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

      {/* 検索窓の横（または検索バーエリア）に未発注リストボタンを配置 */}
      <div className="bg-gray-50 border-b border-gray-200 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center space-x-2 w-full max-w-md">
          {/* CalendarHeader内部にある検索窓と並びを合わせるためのスペース調整など */}
        </div>
        <Link
          href="/un-ordered"
          className="flex items-center space-x-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-sm transition flex-shrink-0"
          title="未発注リストを開く"
        >
          <ShoppingCart size={15} />
          <span>未発注リスト</span>
        </Link>
      </div>

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
                    <span className="font-semibold text-gray-700">{ev.date}</span>
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

      <div className="flex-1 overflow-auto">
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

      {isModalOpen && selectedEvent && (
        <EventModal event={selectedEvent} onClose={() => setIsModalOpen(false)} onUpdate={fetchEvents} />
      )}

      {isCreateModalOpen && (
        <EventFormModal defaultDate={targetDateForCreate} defaultTime={targetTimeForCreate} onClose={() => setIsCreateModalOpen(false)} onCreated={fetchEvents} />
      )}
    </main>
  );
}