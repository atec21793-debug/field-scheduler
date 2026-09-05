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
  
  // サイドバーの開閉状態（デフォルトは非表示: false）
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // サイドバー内のタブ切り替え状態 ('unscheduled' または 'postponed')
  const [sidebarTab, setSidebarTab] = useState<'unscheduled' | 'postponed'>('unscheduled');
  
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

  // カレンダーからサイドバー（未定リスト / 日延未定リスト）へドロップされた時の処理
  const handleDropToSidebar = async (e: React.DragEvent, targetStatus: 'unscheduled' | 'postponed') => {
    e.preventDefault();
    const eventIdStr = e.dataTransfer.getData('text/plain');
    const eventId = Number(eventIdStr);
    if (!eventId) return;

    // 日付と時間をクリアし、必要に応じてステータスを更新
    const updateData: any = {
      date: null,
      start_time: null,
      end_time: null,
      time: null,
    };

    if (targetStatus === 'postponed') {
      updateData.status = 'postponed';
    } else {
      updateData.status = 'active';
    }

    const { error } = await supabase
      .from('events')
      .update(updateData)
      .eq('id', eventId);

    if (error) {
      console.error('Error moving event to sidebar:', error);
    } else {
      fetchEvents();
    }
  };

  // リストの抽出条件
  const unscheduledEvents = events.filter((ev) => !ev.date && ev.status !== 'postponed' && !ev.title.includes('日延未定'));
  const postponedEvents = events.filter((ev) => ev.status === 'postponed' || ev.title.includes('日延未定'));

  const totalUnscheduledCount = unscheduledEvents.length + postponedEvents.length;

  return (
    <main className="flex flex-col h-screen bg-white relative overflow-hidden">
      {/* ヘッダー部分 */}
      <div className="flex items-center border-b border-gray-200 px-2 bg-white">
        <div className="flex-1">
          <CalendarHeader
            currentDate={currentDate}
            viewMode={viewMode}
            setViewMode={setViewMode}
            onNavigate={handleNavigate}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
          />
        </div>
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
      <div className="flex flex-1 overflow-hidden relative">
        {/* 未定・日延未定カード置き場（折りたたみ可能なサイドバー） */}
        <aside 
          className={`absolute inset-y-0 left-0 z-30 w-72 bg-gray-50 border-r border-gray-200 p-4 overflow-y-auto flex flex-col space-y-4 shadow-2xl transition-transform duration-300 ease-in-out ${
            isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          {/* サイドバー閉じるボタン付きヘッダー */}
          <div className="flex items-center justify-between pb-2 border-b border-gray-200">
            <span className="text-xs font-bold text-gray-700">未定・日延未定管理</span>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-200 rounded transition text-xs font-bold"
              title="サイドバーを閉じる"
            >
              ✕ 閉じる
            </button>
          </div>

          {/* タブ切り替えボタン */}
          <div className="flex rounded-lg bg-gray-200 p-1">
            <button
              onClick={() => setSidebarTab('unscheduled')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-md transition flex items-center justify-center space-x-1 ${
                sidebarTab === 'unscheduled'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <span>未定</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${sidebarTab === 'unscheduled' ? 'bg-blue-100 text-blue-700' : 'bg-gray-300 text-gray-700'}`}>
                {unscheduledEvents.length}
              </span>
            </button>
            <button
              onClick={() => setSidebarTab('postponed')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-md transition flex items-center justify-center space-x-1 ${
                sidebarTab === 'postponed'
                  ? 'bg-white text-amber-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <span>日延未定</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${sidebarTab === 'postponed' ? 'bg-amber-100 text-amber-700' : 'bg-gray-300 text-gray-700'}`}>
                {postponedEvents.length}
              </span>
            </button>
          </div>

          {/* 未定タブの中身 */}
          {sidebarTab === 'unscheduled' && (
            <div 
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => handleDropToSidebar(e, 'unscheduled')}
              className="flex-1 flex flex-col min-h-[200px] rounded-lg p-1 transition"
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-bold text-gray-600">未定リスト</h3>
                <button
                  onClick={() => {
                    setTargetDateForCreate(''); // 日付なし（未定）で作成
                    setIsCreateModalOpen(true);
                  }}
                  className="px-2 py-1 bg-blue-600 text-white text-[10px] font-semibold rounded hover:bg-blue-700 transition"
                >
                  ＋ 新規作成
                </button>
              </div>
              <div className="space-y-2 overflow-y-auto flex-1">
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
                  <div className="text-[11px] text-gray-400 text-center py-8 border border-dashed border-gray-200 rounded">
                    ここにドロップして未定に戻す
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 日延未定タブの中身 */}
          {sidebarTab === 'postponed' && (
            <div 
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => handleDropToSidebar(e, 'postponed')}
              className="flex-1 flex flex-col min-h-[200px] rounded-lg p-1 transition"
            >
              <h3 className="text-xs font-bold text-amber-600 mb-2">日延未定リスト</h3>
              <div className="space-y-2 overflow-y-auto flex-1">
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
                  <div className="text-[11px] text-gray-400 text-center py-8 border border-dashed border-amber-200 rounded">
                    ここにドロップして日延未定に戻す
                  </div>
                )}
              </div>
            </div>
          )}
        </aside>

        {/* カレンダー本体 */}
        <div 
          className="flex-1 overflow-auto relative"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
          }}
        >
          {/* 「0」の数字のあたり（top-20付近）に配置する白い「＞」タブ */}
          {!isSidebarOpen && (
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="absolute left-0 top-20 z-20 bg-white hover:bg-gray-100 text-gray-700 border border-gray-300 border-l-0 font-bold px-1.5 py-3 rounded-r-md shadow-sm text-xs flex flex-col items-center space-y-1 transition"
              title="未定リストを開く"
            >
              <span className="text-xs">＞</span>
              {totalUnscheduledCount > 0 && (
                <span className="bg-blue-600 text-white w-4 h-4 rounded-full flex items-center justify-center text-[9px]">
                  {totalUnscheduledCount}
                </span>
              )}
            </button>
          )}

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
        <EventModal 
          event={{ ...selectedEvent, allEvents: events }} 
          onClose={() => setIsModalOpen(false)} 
          onUpdate={fetchEvents} 
        />
      )}

      {isCreateModalOpen && (
        <EventFormModal defaultDate={targetDateForCreate} defaultTime={targetTimeForCreate} onClose={() => setIsCreateModalOpen(false)} onCreated={fetchEvents} />
      )}
    </main>
  );
}