'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { EventItem } from '@/app/page';
import { ArrowLeft, Calendar } from 'lucide-react';
import Link from 'next/link';

export default function StarredListPage() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);

  // 今日以降で「★」から始まるタイトルのデータを取得
  const fetchStarredEvents = async () => {
    setLoading(true);

    const todayStr = new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('events')
      .select('*')
      .gte('date', todayStr)
      .ilike('title', '★%')
      .order('date', { ascending: true });

    if (!error && data) {
      setEvents(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchStarredEvents();
  }, []);

  // ★のトグル（クリックされたら★を外し、リストから除外する）
  const handleToggleStar = async (event: EventItem) => {
    const rawTitle = event.title || '';
    // 先頭の「★」や「★ 」を取り除く
    const newTitle = rawTitle.replace(/^★\s*/, '');

    const { error } = await supabase
      .from('events')
      .update({ title: newTitle })
      .eq('id', event.id);

    if (!error) {
      // 成功したら画面上のリストからも即座に除外する
      setEvents((prev) => prev.filter((item) => item.id !== event.id));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* ヘッダー */}
        <div className="flex items-center justify-between bg-white px-6 py-4 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center space-x-3">
            <Link 
              href="/"
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition"
              title="カレンダーに戻る"
            >
              <ArrowLeft size={20} />
            </Link>
            <h1 className="text-lg font-bold text-gray-800">
              依頼書ないやつ
            </h1>
          </div>
          <span className="text-xs font-semibold px-3 py-1 bg-amber-50 text-amber-700 rounded-full border border-amber-200">
            合計: {events.length}件
          </span>
        </div>

        {/* コンテンツリスト */}
        {loading ? (
          <div className="text-center py-12 text-gray-400 text-sm">読み込み中...</div>
        ) : events.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center text-gray-400 space-y-2">
            <p className="text-sm font-medium text-gray-400">現在、対象の予定はありません。</p>
          </div>
        ) : (
          <div className="space-y-3">
            {events.map((event) => {
              const displayTitle = (event.title || '').replace(/^★\s*/, '');

              return (
                <div 
                  key={event.id}
                  className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:shadow-md transition"
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center space-x-2">
                      {/* ★をクリックすると外れてリストから消える */}
                      <button
                        onClick={() => handleToggleStar(event)}
                        className="text-amber-500 hover:text-amber-600 hover:scale-110 transition p-1"
                        title="クリックして★を外す"
                      >
                        <span className="font-bold text-base">★</span>
                      </button>
                      <h2 className="text-sm font-bold text-gray-800">{displayTitle}</h2>
                    </div>

                    <div className="flex items-center space-x-1 text-xs text-gray-500 font-medium">
                      <Calendar size={14} className="text-blue-500 flex-shrink-0" />
                      <span>{event.date} {event.start_time ? `(${event.start_time})` : ''}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}