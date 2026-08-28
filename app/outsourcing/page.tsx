'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, Plus, Trash2, X, Clock } from 'lucide-react';

interface OutsourcingItem {
  id: string;
  contractor: string; // 委託先
  title: string;
  date: string | null;
  time: string | null;
  address: string | null;
  color: string;
}

export default function OutsourcingPage() {
  const [items, setItems] = useState<OutsourcingItem[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // モーダル用フォームの状態
  const [contractor, setContractor] = useState('委託先A'); // デフォルトの委託先
  const [title, setTitle] = useState('');
  const [isVacant, setIsVacant] = useState(false);
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('09:00');

  const getDefaultEndTime = (start: string) => {
    if (!start) return '10:00';
    const [h, m] = start.split(':').map(Number);
    const endH = (h + 1) % 24;
    return `${endH.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  };

  const [endTime, setEndTime] = useState('10:00');
  const [address, setAddress] = useState('');
  
  const colorOptions = [
    { label: 'グレー', value: '#4b5563' },
    { label: '赤', value: '#dc2626' },
    { label: '濃い青', value: '#1e3a8a' },
    { label: '水色', value: '#38bdf8' },
    { label: '黄色', value: '#cab919' },
    { label: '紫', value: '#7c3aed' },
  ];
  const [color, setColor] = useState(colorOptions[0].value);

  // 委託先の選択肢（必要に応じて書き換えてください）
  const contractorOptions = ['委託先A', '委託先B', '委託先C', 'その他'];

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

  const fetchOutsourcingData = async () => {
    const { data, error } = await supabase
      .from('outsourcing_events')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setItems(data);
    }
  };

  useEffect(() => {
    fetchOutsourcingData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const finalTitle = isVacant ? `🈳${title}` : title;

    const { error } = await supabase.from('outsourcing_events').insert([
      {
        contractor,
        title: finalTitle,
        date: date ? date : null,
        time: startTime && endTime ? `${startTime} - ${endTime}` : null,
        address,
        color,
      },
    ]);

    if (!error) {
      setIsModalOpen(false);
      // フォーム初期化
      setTitle('');
      setIsVacant(false);
      setDate('');
      setAddress('');
      setColor(colorOptions[0].value);
      fetchOutsourcingData();
    } else {
      console.error('Error inserting outsourcing event:', error);
    }
  };

  const handleDeleteItem = async (id: string) => {
    const { error } = await supabase.from('outsourcing_events').delete().eq('id', id);
    if (!error) {
      setItems(items.filter((item) => item.id !== id));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Link
              href="/"
              className="flex items-center space-x-1 px-3 py-1.5 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-100 transition"
            >
              <ArrowLeft size={16} />
              <span>カレンダーへ戻る</span>
            </Link>
            <h1 className="text-2xl font-bold text-gray-800">業務委託管理</h1>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center space-x-1 px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition shadow-sm"
          >
            <Plus size={16} />
            <span>新規登録</span>
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 font-medium text-sm text-gray-700">
            登録済みリスト ({items.length}件)
          </div>
          {items.length === 0 ? (
            <div className="p-8 text-center text-gray-500 text-sm">業務委託の登録はありません。</div>
          ) : (
            <div className="divide-y divide-gray-200">
              {items.map((item) => (
                <div key={item.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: item.color || '#4b5563' }}
                      />
                      {item.contractor && (
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-medium border border-gray-200">
                          {item.contractor}
                        </span>
                      )}
                      <span className="text-gray-800 font-semibold text-sm">{item.title}</span>
                    </div>
                    <div className="text-xs text-gray-500 flex items-center space-x-3">
                      {item.date && <span>📅 {item.date}</span>}
                      {item.time && <span>⏰ {item.time}</span>}
                    </div>
                    {item.address && <p className="text-xs text-gray-500">📍 {item.address}</p>}
                  </div>
                  <button
                    onClick={() => handleDeleteItem(item.id)}
                    className="p-2 text-gray-400 hover:text-red-600 transition"
                    title="削除"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {isModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <h3 className="text-lg font-semibold text-gray-800">新規業務委託の登録</h3>
                <button type="button" onClick={() => setIsModalOpen(false)} className="p-1 rounded-full hover:bg-gray-100 text-gray-500">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                {/* 委託先の選択欄を追加 */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">委託先</label>
                  <select
                    value={contractor}
                    onChange={(e) => setContractor(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white"
                  >
                    {contractorOptions.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">タイトル・現場名</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    placeholder="例: ○○様邸 現場施工"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  />
                </div>

                <div className="flex items-center space-x-2 pt-1">
                  <input
                    type="checkbox"
                    id="vacant-checkbox"
                    checked={isVacant}
                    onChange={(e) => setIsVacant(e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="vacant-checkbox" className="text-xs font-semibold text-gray-600 cursor-pointer">
                    空室
                  </label>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-gray-600">予定日（未定にする場合は空欄のままでOK）</label>
                    {date && (
                      <button type="button" onClick={() => setDate('')} className="text-[10px] text-blue-600 hover:underline">
                        日付をクリア
                      </button>
                    )}
                  </div>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white"
                  />
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
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="例: 東京都新宿区..."
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  />
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
                  <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-sm">キャンセル</button>
                  <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md text-sm">登録する</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}