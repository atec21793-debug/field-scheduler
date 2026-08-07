'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { EventItem } from '@/app/page';
import { ArrowLeft, Calendar, MapPin, ShoppingCart } from 'lucide-react';
import Link from 'next/link';

export default function UnOrderedListPage() {
  const [events, setEvents] = useState<(EventItem & { ordered?: boolean })[]>([]);
  const [loading, setLoading] = useState(true);

  // 未発注のデータを取得（不要なカードの除外条件を含む）
  const fetchUnOrderedEvents = async () => {
    setLoading(true);
    let query = supabase
      .from('events')
      .select('*')
      .or('ordered.is.null,ordered.eq.false') // 未発注のもの
      .not('title', 'ilike', '%休み%')
      .not('title', 'ilike', '%🎌%')
      .not('title', 'ilike', '%（く）%')
      .not('title', 'ilike', '%(く)%')
      .not('title', 'ilike', '%（工事）%')
      .not('title', 'ilike', '%(工事)%')
      .not('title', 'ilike', '%現調%')
      .not('title', 'ilike', '%点検%')
      
      .order('date', { ascending: true });

    const { data, error } = await query;

    if (!error && data) {
      setEvents(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUnOrderedEvents();
  }, []);

  // リスト内から直接「発注済み」にチェックを入れた時の処理
  const handleToggleOrdered = async (id: string | number, currentOrdered: boolean) => {
    const nextOrdered = !currentOrdered;
    const { error } = await supabase
      .from('events')
      .update({ ordered: nextOrdered })
      .eq('id', id);

    if (!error) {
      // リストから即座に除外
      setEvents((prev) => prev.filter((event) => String(event.id) !== String(id)));
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
            <h1 className="text-lg font-bold text-gray-800 flex items-center space-x-2">
              <ShoppingCart className="text-indigo-600" size={20} />
              <span>未発注リスト</span>
            </h1>
          </div>
          <span className="text-xs font-semibold px-3 py-1 bg-amber-50 text-amber-700 rounded-full border border-amber-200">
            未発注: {events.length}件
          </span>
        </div>

        {/* コンテンツリスト */}
        {loading ? (
          <div className="text-center py-12 text-gray-400 text-sm">読み込み中...</div>
        ) : events.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center text-gray-400 space-y-2">
            <ShoppingCart size={32} className="mx-auto text-gray-300" />
            <p className="text-sm font-medium">未発注の予定はありません。すばらしい！</p>
          </div>
        ) : (
          <div className="space-y-3">
            {events.map((event) => {
              const displayTitle = (event.title || '').replace(/^★\s*/, '');
              const isStarred = (event.title || '').startsWith('★');

              return (
                <div 
                  key={event.id}
                  className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:shadow-md transition"
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center space-x-2">
                      {isStarred && <span className="text-amber-500 font-bold text-xs">★</span>}
                      <h2 className="text-sm font-bold text-gray-800">{displayTitle}</h2>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
                      <div className="flex items-center space-x-1">
                        <Calendar size={14} className="text-blue-500 flex-shrink-0" />
                        <span>{event.date} {event.start_time ? `(${event.start_time})` : ''}</span>
                      </div>

                      {/* 住所表示部分 */}
                      {event.address && (
                        <div className="flex items-center space-x-1">
                          <MapPin size={14} className="text-red-500 flex-shrink-0" />
                          <span className="text-gray-600 truncate max-w-[220px] sm:max-w-sm">{event.address}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* チェックボタン（押すと発注済みになりリストから消える） */}
                  <button
                    onClick={() => handleToggleOrdered(event.id, event.ordered || false)}
                    className="w-full sm:w-auto flex items-center justify-center space-x-1.5 px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-semibold transition flex-shrink-0"
                  >
                    <ShoppingCart size={14} />
                    <span>発注済みにする</span>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}