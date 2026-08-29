'use client';

import React, { useState } from 'react';
import { EventItem } from '@/app/page';
import { supabase } from '@/lib/supabase';
import { X, MapPin, Calendar, Check, Trash2, Clock, Edit3, ArrowRight, ShoppingCart } from 'lucide-react';

interface EventModalProps {
  event: EventItem & { ordered?: boolean };
  onClose: () => void;
  onUpdate: () => void;
}

const COLOR_OPTIONS = [
  { label: 'グレー', value: '#4b5563' },
  { label: '赤', value: '#dc2626' },
  { label: '濃い青', value: '#1e3a8a' },
  { label: '水色', value: '#38bdf8' },
  { label: '黄色', value: '#cab919' },
  { label: '紫', value: '#7c3aed' },
];

const KW_OPTIONS = ['2.2kw', '2.5kw', '2.8kw', '3.6kw', '4.0kw', '5.6kw', '6.3kw', '7.1kw', '9.0kw'];

export default function EventModal({ event, onClose, onUpdate }: EventModalProps) {
  // 編集モードの状態
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(event.title || '');
  const [date, setDate] = useState(event.date || '');
  const [startTime, setStartTime] = useState(event.start_time || '');
  const [endTime, setEndTime] = useState(event.end_time || '');
  const [address, setAddress] = useState(event.address || '');
  const [selectedColor, setSelectedColor] = useState(event.color || '#1e3a8a');

  // 重要フラグ (★から始まっているか)
  const [isStarred, setIsStarred] = useState((event.title || '').startsWith('★'));
  
  // --- ordered カラムの値で管理するステート ---
  const [isOrdered, setIsOrdered] = useState(event.ordered || false);
  // ---------------------------------------------

  const [memo, setMemo] = useState(event.memo || '');
  const [report, setReport] = useState(event.report || '');
  const [isSaving, setIsSaving] = useState(false);

  // 日延べ編集用の状態
  const [showPostponeForm, setShowPostponeForm] = useState(false);
  const [postponeType, setPostponeType] = useState<'undecided' | 'date'>('undecided');
  const [newPostponeDate, setNewPostponeDate] = useState(event.date || '');
  const [newPostponeTime, setNewPostponeTime] = useState(event.start_time || '09:00');

  // ヘッダーでの重要フラグの即時変更
  const handleStarToggle = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setIsStarred(checked);

    let cleanTitle = (event.title || '').replace(/^★\s*/, '').trim();
    const newTitle = checked ? `★ ${cleanTitle}` : cleanTitle;

    const { error } = await supabase
      .from('events')
      .update({ title: newTitle })
      .eq('id', event.id);

    if (!error) {
      event.title = newTitle;
      onUpdate();
    }
  };

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

  // 時間文字列（HH:mm）を分に変換するヘルパー
  const timeToMinutes = (timeStr?: string | null) => {
    if (!timeStr) return 0;
    const [h, m] = timeStr.split(':').map(Number);
    return (h || 0) * 60 + (m || 0);
  };

  // 分を時間文字列（HH:mm）に変換するヘルパー
  const minutesToTime = (totalMinutes: number) => {
    const clamped = Math.max(0, Math.min(totalMinutes, 24 * 60 - 1));
    const h = Math.floor(clamped / 60);
    const m = clamped % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  };

  // 予定自体の基本情報の保存
  const handleSaveBasicInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    let cleanTitle = title.replace(/^★\s*/, '').trim();
    const finalTitle = isStarred ? `★ ${cleanTitle}` : cleanTitle;

    const timeString = startTime && endTime ? `${startTime} - ${endTime}` : '';
    const { error } = await supabase
      .from('events')
      .update({
        title: finalTitle,
        date: date || null,
        start_time: startTime || null,
        end_time: endTime || null,
        time: timeString,
        address,
        color: selectedColor,
        ordered: isOrdered,
      })
      .eq('id', event.id);

    setIsSaving(false);
    if (!error) {
      setIsEditing(false);
      onUpdate();
    }
  };

  // 日延べ登録の実行
  const handleConfirmPostpone = async (e: React.FormEvent) => {
    e.preventDefault();

    let cleanTitle = (event.title || '')
      .replace(/^★\s*/, '')
      .replace(/^🔁\s*/, '')
      .replace(/^日延未定\s*/, '')
      .replace(/^日延べ\s*/, '')
      .replace(/\s*\(\d{4}[-/]\d{1,2}[-/]\d{1,2}[^)]*\)/, '')
      .trim();

    if (postponeType === 'undecided') {
      let newTitle = `日延未定 ${cleanTitle}`.trim();
      if (isStarred) newTitle = `★ ${newTitle}`;

      const { error } = await supabase
        .from('events')
        .update({ title: newTitle })
        .eq('id', event.id);

      if (!error) {
        onUpdate();
        onClose();
      }
    } else {
      let durationMinutes = 60;
      if (event.start_time && event.end_time) {
        const startMin = timeToMinutes(event.start_time);
        const endMin = timeToMinutes(event.end_time);
        if (endMin > startMin) {
          durationMinutes = endMin - startMin;
        }
      }

      const newStartMin = timeToMinutes(newPostponeTime);
      const newEndMin = newStartMin + durationMinutes;

      const newStartTimeStr = minutesToTime(newStartMin);
      const newEndTimeStr = minutesToTime(newEndMin);
      const newTimeString = `${newStartTimeStr} - ${newEndTimeStr}`;

      let newCardTitle = `🔁 ${cleanTitle}`.trim();
      if (isStarred) newCardTitle = `★ ${newCardTitle}`;

      const { error: insertError } = await supabase.from('events').insert([
        {
          title: newCardTitle,
          date: newPostponeDate,
          time: newTimeString,
          start_time: newStartTimeStr,
          end_time: newEndTimeStr,
          address: event.address,
          color: event.color,
          memo: event.memo,
          report: event.report,
          status: 'active',
          ordered: isOrdered,
        },
      ]);

      if (insertError) return;

      let originalTitleWithPostpone = `日延べ (${newPostponeDate} ${newStartTimeStr} 〜 ${newEndTimeStr}) ${cleanTitle}`.trim();
      if (isStarred) originalTitleWithPostpone = `★ ${originalTitleWithPostpone}`;

      const { error: updateError } = await supabase
        .from('events')
        .update({ 
          title: originalTitleWithPostpone,
          status: 'completed' 
        })
        .eq('id', event.id);

      if (!updateError) {
        onUpdate();
        onClose();
      }
    }
  };

  // 日延べ解除の処理
  const handleRemovePostpone = async () => {
    let cleanTitle = (event.title || '')
      .replace(/^★\s*/, '')
      .replace(/^🔁\s*/, '')
      .replace(/^日延未定\s*/, '')
      .replace(/^日延べ\s*/, '')
      .replace(/\s*\(\d{4}[-/]\d{1,2}[-/]\d{1,2}[^)]*\)/, '')
      .trim();

    if (isStarred) cleanTitle = `★ ${cleanTitle}`;

    const { error } = await supabase
      .from('events')
      .update({ title: cleanTitle })
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

  // メモや日報の自動保存
  const handleSaveNotes = async () => {
    await supabase
      .from('events')
      .update({ memo, report })
      .eq('id', event.id);
    onUpdate();
  };

  // kWドロップダウンで選択された時の処理（メモに追記して即座にDB保存）
  const handleSelectKw = async (kw: string) => {
    const updatedMemo = memo ? `${memo} ${kw}` : kw;
    setMemo(updatedMemo);
    
    await supabase
      .from('events')
      .update({ memo: updatedMemo, report })
      .eq('id', event.id);
    onUpdate();
  };

  const titleStr = event.title || '';
  const isPostponedUndecided = titleStr.includes('日延未定') || (titleStr.includes('日延べ') && !titleStr.includes('('));

  const formatPostponedInfo = (titleStr: string) => {
    const match = titleStr.match(/\((\d{4})[-/](\d{1,2})[-/](\d{1,2})\s+(\d{2}:\d{2})\s*[〜~-]\s*(\d{2}:\d{2})\)/);
    if (match) {
      const [, , month, day, startTime, endTime] = match;
      return `${parseInt(month, 10)}月${parseInt(day, 10)}日 ${startTime}～${endTime}`;
    }
    const dateMatch = titleStr.match(/\((\d{4})[-/](\d{1,2})[-/](\d{1,2})\)/);
    if (dateMatch) {
      const [, , month, day] = dateMatch;
      return `${parseInt(month, 10)}月${parseInt(day, 10)}日`;
    }
    return null;
  };

  const formattedPostpone = formatPostponedInfo(event.title || '');
  const displayTitle = (event.title || '').replace(/^★\s*/, '');

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div 
        className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]" 
        onClick={(e) => e.stopPropagation()}
      >
        {/* ヘッダー */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50">
          <div className="flex items-center space-x-2 truncate flex-1 mr-2">
            <label className="flex items-center cursor-pointer select-none flex-shrink-0" title="重要マーク(★)を切り替え">
              <input
                type="checkbox"
                checked={isStarred}
                onChange={handleStarToggle}
                className="w-4 h-4 text-amber-600 border-gray-300 rounded focus:ring-amber-500 cursor-pointer"
              />
              <span className="ml-1 text-xs font-bold text-amber-600">★</span>
            </label>

            <h2 className="text-lg font-bold text-gray-800 truncate">
              {isEditing ? '予定の編集' : displayTitle}
            </h2>
          </div>

          <div className="flex items-center space-x-1 flex-shrink-0">
            {!isEditing && (
              <button 
                onClick={() => setIsEditing(true)}
                className="p-1.5 text-blue-500 hover:text-blue-700 rounded-full hover:bg-blue-50 transition"
                title="編集"
              >
                <Edit3 size={18} />
              </button>
            )}
            <button 
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-200 transition"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* コンテンツボディ */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* 編集モード時のフォーム */}
          {isEditing ? (
            <form onSubmit={handleSaveBasicInfo} className="bg-blue-50/50 p-4 rounded-lg border border-blue-200 space-y-3">
              <h3 className="text-xs font-bold text-blue-900">予定情報の編集</h3>
              <div>
                <label className="block text-[11px] font-semibold text-gray-600 mb-1">タイトル</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full text-xs p-2 border border-gray-300 rounded bg-white text-gray-800"
                  required
                />
              </div>

              <div className="flex items-center space-x-2 pt-1 pb-1 bg-white/60 px-2.5 py-1.5 rounded border border-blue-100">
                <input
                  id="orderedCheckbox"
                  type="checkbox"
                  checked={isOrdered}
                  onChange={(e) => setIsOrdered(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 cursor-pointer"
                />
                <label htmlFor="orderedCheckbox" className="text-xs font-semibold text-indigo-900 cursor-pointer flex items-center space-x-1">
                  <ShoppingCart size={14} className="text-indigo-600" />
                  <span>商品発注済み・支給</span>
                </label>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 mb-1">日付</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full text-xs p-2 border border-gray-300 rounded bg-white text-gray-800"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 mb-1">開始時間</label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full text-xs p-2 border border-gray-300 rounded bg-white text-gray-800"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 mb-1">終了時間</label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full text-xs p-2 border border-gray-300 rounded bg-white text-gray-800"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 mb-1">住所</label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full text-xs p-2 border border-gray-300 rounded bg-white text-gray-800"
                    placeholder="場所・住所"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-600 mb-1">カードの色</label>
                <div className="flex space-x-2">
                  {COLOR_OPTIONS.map((colorObj) => (
                    <button
                      key={colorObj.value}
                      type="button"
                      onClick={() => setSelectedColor(colorObj.value)}
                      style={{ backgroundColor: colorObj.value }}
                      className={`w-6 h-6 rounded-full transition transform ${
                        selectedColor === colorObj.value ? 'ring-2 ring-offset-2 ring-blue-600 scale-110' : 'opacity-70 hover:opacity-100'
                      }`}
                      title={colorObj.label}
                    />
                  ))}
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-3 py-1.5 border border-gray-300 rounded text-xs text-gray-600 bg-white hover:bg-gray-50"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-3 py-1.5 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 font-semibold"
                >
                  保存
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-center space-x-2">
                <Calendar size={16} className="text-blue-500 flex-shrink-0" />
                <span>{event.date || '日付未設定'} {event.start_time && event.end_time ? `(${event.start_time} 〜 ${event.end_time})` : ''}</span>
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

              {isOrdered && (
                <div className="flex items-center space-x-1.5 pt-0.5">
                  <span className="inline-flex items-center space-x-1 px-2.5 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-md text-xs font-semibold">
                    <span>商品到着済み</span>
                  </span>
                </div>
              )}

              {formattedPostpone && (
                <div className="flex items-center space-x-2 text-amber-700 font-semibold pt-1">
                  <ArrowRight size={16} className="text-amber-500 flex-shrink-0" />
                  <span>新日程: {formattedPostpone}</span>
                </div>
              )}
            </div>
          )}

          {/* ステータスと各種アクションボタン */}
          <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
            <button
              onClick={handleToggleComplete}
              className={`flex-1 min-w-[110px] flex items-center justify-center space-x-1 py-2 px-3 rounded-lg text-xs font-semibold text-white transition ${
                event.status === 'completed' ? 'bg-gray-500 hover:bg-gray-600' : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              <Check size={16} />
              <span>{event.status === 'completed' ? '完了済み' : '完了にする'}</span>
            </button>

            {isPostponedUndecided ? (
              <button
                onClick={handleRemovePostpone}
                className="flex items-center justify-center space-x-1 py-2 px-3 rounded-lg text-xs font-semibold border bg-amber-500 border-amber-500 text-white hover:bg-amber-600 transition"
              >
                <Clock size={16} />
                <span>日延べ解除</span>
              </button>
            ) : (
              <button
                onClick={() => setShowPostponeForm(!showPostponeForm)}
                className="flex items-center justify-center space-x-1 py-2 px-3 rounded-lg text-xs font-semibold border border-amber-300 text-amber-700 bg-amber-50 hover:bg-amber-100 transition"
              >
                <Clock size={16} />
                <span>日延べ</span>
              </button>
            )}

            <button
              onClick={handleDelete}
              className="flex items-center justify-center space-x-1 py-2 px-3 rounded-lg text-xs font-semibold border border-red-200 text-red-600 hover:bg-red-50 transition"
            >
              <Trash2 size={16} />
              <span>削除</span>
            </button>
          </div>

          {/* 日延べ選択フォーム */}
          {showPostponeForm && !isPostponedUndecided && (
            <form onSubmit={handleConfirmPostpone} className="bg-amber-50/60 p-4 rounded-lg border border-amber-200 space-y-3">
              <h4 className="text-xs font-bold text-amber-900">日延べの処理を選択</h4>
              <div className="flex space-x-4 text-xs text-gray-700">
                <label className="flex items-center space-x-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="postponeType"
                    checked={postponeType === 'undecided'}
                    onChange={() => setPostponeType('undecided')}
                  />
                  <span>未定（日延未定と表示・透過しない）</span>
                </label>
                <label className="flex items-center space-x-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="postponeType"
                    checked={postponeType === 'date'}
                    onChange={() => setPostponeType('date')}
                  />
                  <span>日程を決めて新規作成（元は半透明＋日延べ）</span>
                </label>
              </div>

              {postponeType === 'date' && (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-600 mb-1">新しい日付</label>
                    <input
                      type="date"
                      value={newPostponeDate}
                      onChange={(e) => setNewPostponeDate(e.target.value)}
                      className="w-full text-xs p-2 border border-gray-300 rounded bg-white text-gray-800"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-600 mb-1">開始時間</label>
                    <input
                      type="time"
                      value={newPostponeTime}
                      onChange={(e) => setNewPostponeTime(e.target.value)}
                      className="w-full text-xs p-2 border border-gray-300 rounded bg-white text-gray-800"
                      required
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowPostponeForm(false)}
                  className="px-3 py-1.5 border border-gray-300 rounded text-xs text-gray-600 bg-white hover:bg-gray-50"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-amber-600 text-white rounded text-xs hover:bg-amber-700 font-semibold"
                >
                  決定
                </button>
              </div>
            </form>
          )}

          {/* メモ欄 & kWドロップダウン & 作業内容・日報欄 */}
          <div className="space-y-4 pt-2 border-t border-gray-100">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-gray-700">メモ欄</label>
                {/* kWクイック選択用ドロップダウン */}
                <select
                  onChange={(e) => {
                    if (e.target.value) {
                      handleSelectKw(e.target.value);
                      e.target.value = ""; // 選択後にリセット
                    }
                  }}
                  defaultValue=""
                  className="text-xs px-2 py-1 bg-white border border-gray-300 rounded-md text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="" disabled>kwを選択して追加</option>
                  {KW_OPTIONS.map((kw) => (
                    <option key={kw} value={kw}>{kw}</option>
                  ))}
                </select>
              </div>
              <textarea
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                onBlur={handleSaveNotes}
                placeholder="現場の注意事項やメモを入力..."
                rows={3}
                className="w-full text-xs p-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50/50 text-gray-800"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">作業内容・日報</label>
              <textarea
                value={report}
                onChange={(e) => setReport(e.target.value)}
                onBlur={handleSaveNotes}
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