import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { X, Clock } from 'lucide-react';

interface EventFormModalProps {
  defaultDate: string;
  defaultTime: string;
  onClose: () => void;
  onCreated: () => void;
}

export default function EventFormModal({ defaultDate, defaultTime, onClose, onCreated }: EventFormModalProps) {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(defaultDate);
  const [startTime, setStartTime] = useState(defaultTime);
  
  // デフォルトで開始時間の1時間後を終了時間にする
  const getDefaultEndTime = (start: string) => {
    const [h, m] = start.split(':').map(Number);
    const endH = (h + 1) % 24;
    return `${endH.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  };

  const [endTime, setEndTime] = useState(getDefaultEndTime(defaultTime));
  const [address, setAddress] = useState('');
  
  // 指定された5色: グレー、赤、濃い青、黄色、紫（デフォルトはグレー）
  const colorOptions = [
    { label: 'グレー', value: '#4b5563' },
    { label: '赤', value: '#dc2626' },
    { label: '濃い青', value: '#1e3a8a' },
    { label: '黄色', value: '#d97706' },
    { label: '紫', value: '#7c3aed' },
  ];
  const [color, setColor] = useState(colorOptions[0].value);

  const timeOptions: string[] = [];
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      timeOptions.push(`${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`);
    }
  }

  const handleStartTimeChange = (newStart: string) => {
    setStartTime(newStart);
    setEndTime(getDefaultEndTime(newStart));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const { error } = await supabase.from('events').insert([
      {
        title,
        date,
        time: `${startTime} - ${endTime}`,
        start_time: startTime,
        end_time: endTime,
        address,
        color,
        status: 'active',
      },
    ]);

    if (!error) {
      onCreated();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800">新規現場予定の登録</h3>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100 text-gray-500"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">タイトル・現場名</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="例: ○○様邸 現場施工" className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">予定日</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" />
          </div>

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

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">住所</label>
            <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="例: 東京都新宿区..." className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" />
          </div>

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

          <div className="flex space-x-2 pt-4">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-sm">キャンセル</button>
            <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md text-sm">登録する</button>
          </div>
        </form>
      </div>
    </div>
  );
}