'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { EventItem } from '@/app/page';
import { ArrowLeft, Calendar, MapPin, ShoppingCart } from 'lucide-react';
import Link from 'next/link';

export default function UnOrderedListPage() {
  const [events, setEvents] = useState<(EventItem & { ordered?: boolean; memo?: string })[]>([]);
  const [loading, setLoading] = useState(true);

  // 未発注かつメモに「kw」が含まれているデータのみを取得
  const fetchUnOrderedEvents = async () => {
    setLoading(true);
    let query = supabase
      .from('events')
      .select('*')
      .or('ordered.is.null,ordered.eq.false') // 未発注のもの
      .not('memo', 'is', null)                // メモが空ではないもの
      .ilike('memo', '%kw%')                  // メモに「kw」が含まれているもの
      .not('title', 'ilike', '%休み%')
      .not('title', 'ilike', '%🎌%')
      .not('title', 'ilike', '%（く）%')
      .not('title', 'ilike', '%(く)%')
      .not('title', 'ilike', '%（工事）%')
      .not('title', 'ilike', '%(工事)%')
      .not('title', 'ilike', '%現調%')
      .not('title', 'ilike', '%点検%')
      .not('title', 'ilike', '%カクシン%')
      .not('title', 'ilike', '%リブラン%')
      .not('title', 'ilike', '%NJS%')
      .not('title', 'ilike', '%佐藤工務店%')
      .not('title', 'ilike', '%ジェイトップ%')
      .order('date', { ascending: true });

    const { data, error } = await query;

    if (!error && data) {
      // 型アサーションを追加してTypeScriptのエラーを解消
      setEvents(data as (EventItem & { ordered?: boolean; memo?: string })[]);
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

  // メモを更新した時の処理（入力中の状態保持）
  const handleMemoChange = (id: string | number, newMemo: string) => {
    setEvents((prev) =>
      prev.map((event) => (String(event.id) === String(id) ? { ...event, memo: newMemo } : event))
    );
  };

  // フォーカスが外れた時にDBへ保存
  const handleMemoBlur = async (id: string | number, memo: string | undefined) => {
    await supabase
      .from('events')
      .update({ memo: memo || '' })
      .eq('id', id);
  };

  // ドロップダウンで選択したkWをメモに追加する処理
  const handleSelectKw = async (id: string | number, currentMemo: string | undefined, kw: string) => {
    const updatedMemo = currentMemo ? `${currentMemo.trim()} ${kw}` : kw;
    
    handleMemoChange(id, updatedMemo);

    await supabase
      .from('events')
      .update({ memo: updatedMemo })
      .eq('id', id);
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
            <p className="text-sm font-medium">kWが選択された未発注の予定はありません。</p>
          </div>
        ) : (
          <div className="space-y-3">
            {events.map((event) => {
              const displayTitle = (event.title || '').replace(/^★\s*/, '');
              const isStarred = (event.title || '').startsWith('★');

              // メモをスペースやカンマで分割して個別のタグとして扱えるようにする
              const memoItems = event.memo ? event.memo.trim().split(/[\s,]+/).filter(Boolean) : [];

              return (
                <div 
                  key={event.id}
                  className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex flex-col gap-3 hover:shadow-md transition"
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center space-x-2 flex-wrap">
                        {isStarred && <span className="text-amber-500 font-bold text-xs">★</span>}
                        <h2 className="text-sm font-bold text-gray-800">{displayTitle}</h2>
                        
                        {/* 選択されたメモを1つずつ枠線で囲んで表示 */}
                        {memoItems.map((item, index) => (
                          <span 
                            key={index} 
                            className="text-xs text-gray-700 bg-gray-50 px-2 py-0.5 rounded-md border border-gray-200 font-medium"
                          >
                            {item}
                          </span>
                        ))}
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
                      <span>発注済みにする</span>
                    </button>
                  </div>

                  {/* メモ編集エリア ＆ kW選択ドロップダウン */}
                  <div className="pt-2 border-t border-gray-100 flex flex-col sm:flex-row gap-2 items-start sm:items-center">
                    <input
                      type="text"
                      value={event.memo || ''}
                      onChange={(e) => handleMemoChange(event.id, e.target.value)}
                      onBlur={(e) => handleMemoBlur(event.id, e.target.value)}
                      placeholder="メモを入力..."
                      className="flex-1 w-full text-xs px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 text-gray-700"
                    />

                    <select
                      onChange={(e) => {
                        if (e.target.value) {
                          handleSelectKw(event.id, event.memo, e.target.value);
                          e.target.value = ""; 
                        }
                      }}
                      defaultValue=""
                      className="text-xs px-2 py-1.5 bg-white border border-gray-200 rounded-lg text-gray-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                    >
                      <option value="" disabled>kwを選択</option>
                      <option value="2.2kw">2.2kw</option>
                      <option value="2.5kw">2.5kw</option>
                      <option value="2.8kw">2.8kw</option>
                      <option value="3.6kw">3.6kw</option>
                      <option value="4.0kw">4.0kw</option>
                      <option value="5.6kw">5.6kw</option>
                      <option value="6.0kw">6.0kw</option>
                    </select>
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