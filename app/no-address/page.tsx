'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { EventItem } from '@/app/page';
import { ArrowLeft, Calendar } from 'lucide-react';
import Link from 'next/link';

export default function NoAddressListPage() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  // 各カードごとの入力中住所を管理するステート
  const [addressInputs, setAddressInputs] = useState<{ [key: string]: string }>({});

  // 今日以降で住所が未入力のデータを取得（不要なカードを除外）
  const fetchNoAddressEvents = async () => {
    setLoading(true);

    // 今日の日付文字列 (YYYY-MM-DD) を取得
    const todayStr = new Date().toISOString().split('T')[0];

    let query = supabase
      .from('events')
      .select('*')
      .or('address.is.null,address.eq.""') // 住所が未入力
      .gte('date', todayStr) // 今日以降の予定に限定
      .not('title', 'ilike', '%休み%')
      .not('title', 'ilike', '%🎌%')
      
      .order('date', { ascending: true });

    const { data, error } = await query;

    if (!error && data) {
      setEvents(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchNoAddressEvents();
  }, []);

  // 住所を保存してリストから除外する処理
  const handleSaveAddress = async (id: string | number) => {
    const newAddress = addressInputs[id];
    if (!newAddress || !newAddress.trim()) {
      alert('住所を入力してください');
      return;
    }

    const { error } = await supabase
      .from('events')
      .update({ address: newAddress.trim() })
      .eq('id', id);

    if (!error) {
      // 成功したら画面のリストから即座に除外
      setEvents((prev) => prev.filter((event) => String(event.id) !== String(id)));
    } else {
      alert('保存に失敗しました');
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
              住所なしリスト
            </h1>
          </div>
          <span className="text-xs font-semibold px-3 py-1 bg-red-50 text-red-700 rounded-full border border-red-200">
            未入力: {events.length}件
          </span>
        </div>

        {/* コンテンツリスト */}
        {loading ? (
          <div className="text-center py-12 text-gray-400 text-sm">読み込み中...</div>
        ) : events.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center text-gray-400 space-y-2">
            <p className="text-sm font-medium text-gray-400">これ以降、住所が未入力の予定はありません。</p>
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

                    {/* カレンダーアイコン付きの日付表示 */}
                    <div className="flex items-center space-x-1 text-xs text-gray-500 font-medium">
                      <Calendar size={14} className="text-blue-500 flex-shrink-0" />
                      <span>{event.date} {event.start_time ? `(${event.start_time})` : ''}</span>
                    </div>
                  </div>

                  {/* 住所入力・保存エリア */}
                  <div className="flex items-center space-x-2 w-full sm:w-auto">
                    <input
                      type="text"
                      placeholder="住所を入力..."
                      value={addressInputs[event.id] || ''}
                      onChange={(e) =>
                        setAddressInputs({ ...addressInputs, [event.id]: e.target.value })
                      }
                      className="flex-1 sm:w-56 px-3 py-1.5 text-xs bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
                    />
                    <button
                      onClick={() => handleSaveAddress(event.id)}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition flex-shrink-0"
                    >
                      保存
                    </button>
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