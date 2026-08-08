'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { EventItem } from '@/app/page';
import { ArrowLeft, Calendar, Edit3, X, GripVertical } from 'lucide-react';
import Link from 'next/link';

export default function PostponedListPage() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);

  // 編集モーダル用のステート
  const [editingEvent, setEditingEvent] = useState<EventItem | null>(null);
  const [newDate, setNewDate] = useState('');
  const [newStartTime, setNewStartTime] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 「日延未定」かつ日付が未設定（または条件に合う）データを取得
  const fetchPostponedEvents = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from('events')
      .select('*')
      .ilike('title', '%日延未定%')
      .order('inserted_at', { ascending: false });

    if (!error && data) {
      // 日付が空、またはステータスが日延未定のものを抽出
      const filtered = data.filter((item) => !item.date || item.status === 'postponed' || item.title.includes('日延未定'));
      setEvents(filtered);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPostponedEvents();
  }, []);

  // 編集モーダルを開く
  const handleOpenEdit = (event: EventItem) => {
    setEditingEvent(event);
    setNewDate(event.date || '');
    setNewStartTime(event.start_time || '');
  };

  // 日程更新の保存処理
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEvent || !newDate) return;

    setIsSubmitting(true);

    const { error } = await supabase
      .from('events')
      .update({
        date: newDate,
        start_time: newStartTime || null,
        status: 'scheduled', // 通常ステータスに戻す
      })
      .eq('id', editingEvent.id);

    if (!error) {
      setEvents((prev) => prev.filter((item) => item.id !== editingEvent.id));
      setEditingEvent(null);
    } else {
      alert('更新に失敗しました。');
    }

    setIsSubmitting(false);
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
              日延未定一覧
            </h1>
          </div>
          <span className="text-xs font-semibold px-3 py-1 bg-gray-100 text-gray-700 rounded-full border border-gray-200">
            合計: {events.length}件
          </span>
        </div>

        <div className="text-xs text-gray-500 bg-amber-50 border border-amber-200 p-3 rounded-lg">
          💡 カードをドラッグするか、「日程変更」ボタンからカレンダーに再配置できます。
        </div>

        {/* コンテンツリスト */}
        {loading ? (
          <div className="text-center py-12 text-gray-400 text-sm">読み込み中...</div>
        ) : events.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center text-gray-400 space-y-2">
            <p className="text-sm font-medium text-gray-400">現在、日延未定の予定はありません。</p>
          </div>
        ) : (
          <div className="space-y-3">
            {events.map((event) => (
              <div 
                key={event.id}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData('text/plain', event.id.toString());
                }}
                className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 cursor-grab active:cursor-grabbing hover:border-amber-400 transition"
              >
                <div className="flex items-center space-x-3 flex-1">
                  <div className="text-gray-400">
                    <GripVertical size={18} />
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center space-x-2">
                      <h2 className="text-sm font-bold text-gray-800">{event.title}</h2>
                    </div>

                    <div className="flex items-center space-x-1 text-xs text-gray-500 font-medium">
                      <Calendar size={14} className="text-amber-500 flex-shrink-0" />
                      <span>{event.date ? event.date : '日時未定'} {event.start_time ? `(${event.start_time})` : ''}</span>
                    </div>
                  </div>
                </div>

                {/* 右側：住所と編集ボタン */}
                <div className="flex items-center space-x-3 w-full sm:w-auto justify-between sm:justify-end">
                  <div className="text-xs text-gray-600 bg-gray-50 px-3 py-2 rounded-lg border border-gray-100 max-w-xs truncate">
                    {event.address ? event.address : <span className="text-gray-400">住所未設定</span>}
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation(); // ドラッグイベントの誤発動を防ぐ
                      handleOpenEdit(event);
                    }}
                    className="flex items-center space-x-1 px-3 py-1.5 bg-amber-50 text-amber-700 hover:bg-amber-100 text-xs font-semibold rounded-lg transition border border-amber-200 flex-shrink-0"
                  >
                    <Edit3 size={14} />
                    <span>日程変更</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 日程編集モーダル */}
      {editingEvent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-bold text-gray-800">日程の変更</h3>
              <button 
                onClick={() => setEditingEvent(null)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X size={20} />
              </button>
            </div>

            <div className="text-xs text-gray-600 bg-gray-50 p-3 rounded-lg border">
              <span className="font-bold block text-gray-800 mb-1">{editingEvent.title}</span>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-700">新しい日付</label>
                <input
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-700">時間（任意）</label>
                <input
                  type="time"
                  value={newStartTime}
                  onChange={(e) => setNewStartTime(e.target.value)}
                  className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingEvent(null)}
                  className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition shadow-sm disabled:opacity-50"
                >
                  {isSubmitting ? '保存中...' : '変更を保存'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}