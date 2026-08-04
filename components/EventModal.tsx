'use client';

import React, { useState } from 'react';
import { EventItem } from '@/app/page';
import { supabase } from '@/lib/supabase';
import { X, MapPin, Calendar, Check, Edit, CalendarDays, Trash2 } from 'lucide-react';

interface EventModalProps {
  event: EventItem;
  onClose: () => void;
  onUpdate: () => void;
}

export default function EventModal({ event, onClose, onUpdate }: EventModalProps) {
  const [memo, setMemo] = useState(event.memo || '');
  const [report, setReport] = useState(event.report || '');
  const [isSaving, setIsSaving] = useState(false);

  // 完了にする処理
  const handleToggleComplete = async () => {
    const newStatus = event.status === 'completed' ? 'active' : 'completed';
    const { error } = await supabase
      .from('events')
      .update({ status: newStatus })
      .eq('id', event.id);

    if (!error) {
      onUpdate();
      onClose();
    }
  };

  // 削除処理
  const handleDelete = async () => {
    if (confirm('この予定を削除しますか？')) {
      const { error } = await supabase.from('events').delete().eq('id', event.id);
      if (!error) {
        onUpdate();
        onClose();
      }
    }
  };

  // メモや日報の保存処理
  const handleSaveNotes = async () => {
    setIsSaving(true);
    const { error } = await supabase
      .from('events')
      .update({ memo, report })
      .eq('id', event.id);

    setIsSaving(false);
    if (!error) {
      onUpdate();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div 
        className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]" 
        onClick={(e) => e.stopPropagation()}
      >
        {/* ヘッダー */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50">
          <h2 className="text-lg font-bold text-gray-800 truncate">{event.title}</h2>
          <button 
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-200 transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* コンテンツボディ（スクロール可能） */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* 日時と場所 */}
          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex items-center space-x-2">
              <Calendar size={16} className="text-blue-500 flex-shrink-0" />
              <span>{event.date} {event.start_time && event.end_time ? `(${event.start_time} 〜 ${event.end_time})` : ''}</span>
            </div>
            {event.address && (
              <div className="flex items-center space-x-2">
                <MapPin size={16} className="text-red-500 flex-shrink-0" />
                <a 
                  href={`https://maps.google.com/?q=${encodeURIComponent(event.address)}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline truncate"
                >
                  {event.address}
                </a>
              </div>
            )}
          </div>

          {/* ステータスと簡易アクションボタン */}
          <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
            <button
              onClick={handleToggleComplete}
              className={`flex-1 min-w-[120px] flex items-center justify-center space-x-1.5 py-2 px-3 rounded-lg text-xs font-semibold text-white transition ${
                event.status === 'completed' ? 'bg-gray-500 hover:bg-gray-600' : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              <Check size={16} />
              <span>{event.status === 'completed' ? '完了済み（未完了に戻す）' : '完了にする'}</span>
            </button>
            <button
              onClick={handleDelete}
              className="flex items-center justify-center space-x-1 py-2 px-3 rounded-lg text-xs font-semibold border border-red-200 text-red-600 hover:bg-red-50 transition"
            >
              <Trash2 size={16} />
              <span>削除</span>
            </button>
          </div>

          {/* メモ欄 & 作業内容・日報欄 */}
          <div className="space-y-4 pt-2 border-t border-gray-100">
            {/* メモ欄 */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">メモ欄</label>
              <textarea
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                onBlur={handleSaveNotes} // フォーカスが外れた時に自動保存
                placeholder="現場の注意事項やメモを入力..."
                rows={3}
                className="w-full text-xs p-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50/50 text-gray-800"
              />
            </div>

            {/* 作業内容・日報欄 */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">作業内容・日報</label>
              <textarea
                value={report}
                onChange={(e) => setReport(e.target.value)}
                onBlur={handleSaveNotes} // フォーカスが外れた時に自動保存
                placeholder="実際の作業内容や日報を入力..."
                rows={3}
                className="w-full text-xs p-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50/50 text-gray-800"
              />
            </div>
            <p className="text-[10px] text-gray-400 text-right">※入力欄からフォーカスを外すと自動保存されます</p>
          </div>
        </div>
      </div>
    </div>
  );
}