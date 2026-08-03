import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { EventItem } from '@/app/page';
import { X, MapPin, Check, Edit2, Calendar, Clock } from 'lucide-react';

interface EventModalProps {
  event: EventItem;
  onClose: () => void;
  onUpdate: () => void;
}

export default function EventModal({ event, onClose, onUpdate }: EventModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isRescheduling, setIsRescheduling] = useState(false);

  const [title, setTitle] = useState(event.title);
  const [address, setAddress] = useState(event.address || '');
  const [startTime, setStartTime] = useState(event.start_time || '09:00');
  const [endTime, setEndTime] = useState(event.end_time || '10:00');
  
  // 指定された5色: グレー、赤、濃い青、黄色、紫
  const colorOptions = [
    { label: 'グレー', value: '#4b5563' },
    { label: '赤', value: '#dc2626' },
    { label: '濃い青', value: '#1e3a8a' },
    { label: '黄色', value: '#d97706' },
    { label: '紫', value: '#7c3aed' },
  ];
  const [color, setColor] = useState(event.color || colorOptions[0].value);

  // 日付の代わりに 'undecided' を選べるようにするステート
  const [rescheduleType, setRescheduleType] = useState<'date' | 'undecided'>('date');
  const [newDate, setNewDate] = useState(event.date);

  const timeOptions: string[] = [];
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      timeOptions.push(`${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`);
    }
  }

  // 開始時間が変わったら自動で1時間後を終了時間に設定（編集時）
  const handleStartTimeChange = (newStart: string) => {
    setStartTime(newStart);
    const [h, m] = newStart.split(':').map(Number);
    const endH = (h + 1) % 24;
    setEndTime(`${endH.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);
  };

  const handleToggleComplete = async () => {
    const nextStatus = event.status === 'completed' ? 'active' : 'completed';
    const { error } = await supabase.from('events').update({ status: nextStatus }).eq('id', event.id);
    if (!error) { onUpdate(); onClose(); }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from('events').update({
      title,
      address,
      start_time: startTime,
      end_time: endTime,
      time: `${startTime} - ${endTime}`,
      color,
    }).eq('id', event.id);

    if (!error) { onUpdate(); onClose(); }
  };

  const handleReschedule = async (e: React.FormEvent) => {
    e.preventDefault();

    if (rescheduleType === 'undecided') {
      // 1. 「未定」の場合：元のタイトルの先頭に「[日延べ] 」を付与し、日付を変更せずそのままにする
      const updatedTitle = event.title.startsWith('[日延べ]') 
        ? event.title 
        : `[日延べ] ${event.title}`;

      const { error } = await supabase.from('events').update({
        title: updatedTitle,
      }).eq('id', event.id);

      if (!error) { onUpdate(); onClose(); }
    } else {
      // 2. 日程が決まっている場合：
      // ① 元のカードを半透明（クラス等で制御するためタイトル等にフラグや「[日延べ]」を付与）にし、
      // ② 選択した日付に新しいカードを新規追加する

      const postponedTitle = event.title.startsWith('[日延べ]') 
        ? event.title 
        : `[日延べ] ${event.title}`;

      // A. 元のカードを更新（半透明化の目印としてタイトル変更、またはDBにカラムがあればそれを利用）
      const { error: updateError } = await supabase.from('events').update({
        title: postponedTitle,
        // ※もしデータベースに is_postponed などのカラムがあればここで true に更新できます
      }).eq('id', event.id);

      if (updateError) return;

      // B. 新しい日付に新規カードを作成
      const { error: insertError } = await supabase.from('events').insert([{
        title: event.title.replace(/^\[日延べ\]\s*/, ''), // 新しい方は「日延べ」を取った本来のタイトルにする場合
        date: newDate,
        start_time: event.start_time,
        end_time: event.end_time,
        time: event.time,
        address: event.address,
        color: event.color,
        status: 'active',
      }]);

      if (!insertError) { onUpdate(); onClose(); }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800">
            {isEditing ? '予定の編集' : isRescheduling ? '日延べ（期日変更）' : '予定の詳細'}
          </h3>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100 text-gray-500"><X size={20} /></button>
        </div>

        <div className="p-6">
          {!isEditing && !isRescheduling ? (
            <div className="space-y-4">
              <div>
                <h4 className="text-xl font-bold text-gray-900">{event.title}</h4>
                <p className="text-sm text-gray-500 mt-1">
                  日付: {event.date} {event.start_time && event.end_time && `(${event.start_time} 〜 ${event.end_time})`}
                </p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg space-y-2 text-sm">
                <div className="flex items-center text-gray-700"><span className="font-semibold w-20">状態:</span><span className={event.status === 'completed' ? 'text-green-600 font-bold' : 'text-blue-600 font-bold'}>{event.status === 'completed' ? '完了済み' : '進行中'}</span></div>
                {event.address && (
                  <div className="flex items-start text-gray-700">
                    <span className="font-semibold w-20 flex items-center"><MapPin size={14} className="mr-1"/>住所:</span>
                    <a href={`https://maps.google.com/?q=${encodeURIComponent(event.address)}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline hover:text-blue-800 break-all">{event.address}</a>
                  </div>
                )}
              </div>
              <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
                <button onClick={handleToggleComplete} className={`flex-1 flex items-center justify-center px-4 py-2 rounded-md text-sm font-medium transition ${event.status === 'completed' ? 'bg-gray-200 text-gray-800' : 'bg-green-600 text-white'}`}>
                  <Check size={16} className="mr-1.5" />{event.status === 'completed' ? '未完了に戻す' : '完了にする'}
                </button>
                <button onClick={() => setIsEditing(true)} className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"><Edit2 size={16} className="mr-1.5" />編集</button>
                <button onClick={() => setIsRescheduling(true)} className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"><Calendar size={16} className="mr-1.5" />日延べ</button>
              </div>
            </div>
          ) : isEditing ? (
            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div><label className="block text-xs font-semibold text-gray-600 mb-1">タイトル</label><input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1 flex items-center"><Clock size={14} className="mr-1" />開始時間</label>
                  <select value={startTime} onChange={(e) => handleStartTimeChange(e.target.value)} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white">
                    {timeOptions.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1 flex items-center"><Clock size={14} className="mr-1" />終了時間</label>
                  <select value={endTime} onChange={(e) => setEndTime(e.target.value)} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white">
                    {timeOptions.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div><label className="block text-xs font-semibold text-gray-600 mb-1">住所</label><input type="text" value={address} onChange={(e) => setAddress(e.target.value)} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" /></div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">カードカラー</label>
                <div className="flex space-x-3">
                  {colorOptions.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      title={c.label}
                      style={{ backgroundColor: c.value }}
                      onClick={() => setColor(c.value)}
                      className={`w-7 h-7 rounded-full transition ${color === c.value ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : 'opacity-70 hover:opacity-100'}`}
                    />
                  ))}
                </div>
              </div>
              <div className="flex space-x-2 pt-2">
                <button type="button" onClick={() => setIsEditing(false)} className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-sm">キャンセル</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md text-sm">保存</button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleReschedule} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-2">日延べ先の選択</label>
                <div className="flex space-x-4 mb-3">
                  <label className="flex items-center text-sm cursor-pointer">
                    <input 
                      type="radio" 
                      name="rescheduleType" 
                      checked={rescheduleType === 'date'} 
                      onChange={() => setRescheduleType('date')} 
                      className="mr-1.5"
                    />
                    日付を指定する
                  </label>
                  <label className="flex items-center text-sm cursor-pointer">
                    <input 
                      type="radio" 
                      name="rescheduleType" 
                      checked={rescheduleType === 'undecided'} 
                      onChange={() => setRescheduleType('undecided')} 
                      className="mr-1.5"
                    />
                    未定にする
                  </label>
                </div>

                {rescheduleType === 'date' && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">新しい期日</label>
                    <input 
                      type="date" 
                      value={newDate} 
                      onChange={(e) => setNewDate(e.target.value)} 
                      required 
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" 
                    />
                  </div>
                )}
              </div>

              <div className="flex flex-col space-y-2 pt-2">
                <button type="submit" className="w-full px-4 py-2 bg-blue-600 text-white rounded-md text-sm">日延べを確定する</button>
                <button type="button" onClick={() => setIsRescheduling(false)} className="w-full px-4 py-2 text-sm text-gray-500">キャンセル</button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}