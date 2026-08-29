'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, Plus, Trash2, Edit2, X, Clock, Calendar as CalendarIcon, MapPin, FileText } from 'lucide-react';

interface OutsourcingItem {
  id: string;
  contractor: string | null;
  title: string;
  date: string | null;
  time: string | null;
  address: string | null;
  memo: string | null;
  color: string;
}

export default function OutsourcingPage() {
  const [items, setItems] = useState<OutsourcingItem[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [contractor, setContractor] = useState('');
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
  const [memo, setMemo] = useState('');
  
  const colorOptions = [
    { label: 'グレー', value: '#4b5563' },
    { label: '赤', value: '#dc2626' },
    { label: '濃い青', value: '#1e3a8a' },
    { label: '水色', value: '#38bdf8' },
    { label: '黄色', value: '#cab919' },
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

  const handleOpenCreateModal = () => {
    setEditingId(null);
    setContractor('');
    setTitle('');
    setIsVacant(false);
    setDate('');
    setStartTime('09:00');
    setEndTime('10:00');
    setAddress('');
    setMemo('');
    setColor(colorOptions[0].value);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: OutsourcingItem) => {
    setEditingId(item.id);
    setContractor(item.contractor || '');
    
    const titleVal = item.title || '';
    if (titleVal.startsWith('🈳')) {
      setIsVacant(true);
      setTitle(titleVal.replace('🈳', ''));
    } else {
      setIsVacant(false);
      setTitle(titleVal);
    }

    setDate(item.date || '');

    if (item.time && item.time.includes('-')) {
      const parts = item.time.split('-').map((s) => s.trim());
      setStartTime(parts[0] || '09:00');
      setEndTime(parts[1] || '10:00');
    } else {
      setStartTime('09:00');
      setEndTime('10:00');
    }

    setAddress(item.address || '');
    setMemo(item.memo || '');
    setColor(item.color || colorOptions[0].value);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const finalTitle = isVacant ? `🈳${title}` : title;
    const timeValue = startTime && endTime ? `${startTime} - ${endTime}` : null;

    if (editingId) {
      const { error } = await supabase
        .from('outsourcing_events')
        .update({
          contractor: contractor.trim() ? contractor : null,
          title: finalTitle,
          date: date ? date : null,
          time: timeValue,
          address,
          memo: memo.trim() ? memo : null,
          color,
        })
        .eq('id', editingId);

      if (!error) {
        setIsModalOpen(false);
        fetchOutsourcingData();
      }
    } else {
      const { error } = await supabase.from('outsourcing_events').insert([
        {
          contractor: contractor.trim() ? contractor : null,
          title: finalTitle,
          date: date ? date : null,
          time: timeValue,
          address,
          memo: memo.trim() ? memo : null,
          color,
        },
      ]);

      if (!error) {
        setIsModalOpen(false);
        fetchOutsourcingData();
      }
    }
  };

  const handleDeleteItem = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('本当に削除しますか？')) return;
    const { error } = await supabase.from('outsourcing_events').delete().eq('id', id);
    if (!error) {
      setItems(items.filter((item) => item.id !== id));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="max-w-2xl mx-auto space-y-4">
        
        {/* ヘッダーカード */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Link
              href="/"
              className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200 transition"
              aria-label="戻る"
            >
              <ArrowLeft size={18} />
            </Link>
            <h1 className="text-lg font-bold text-gray-800">業務委託</h1>
          </div>
          
          <div className="flex items-center space-x-3">
            <span className="text-xs bg-amber-50 text-amber-700 px-3 py-1 rounded-full font-semibold border border-amber-200">
              登録: {items.length}件
            </span>
            <button
              onClick={handleOpenCreateModal}
              className="flex items-center space-x-1 px-3.5 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 transition shadow-sm"
            >
              <Plus size={15} />
              <span>新規登録</span>
            </button>
          </div>
        </div>

        {/* リスト部分（カードクリックで編集モーダルが開く） */}
        <div className="space-y-3">
          {items.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center text-gray-400 text-xs border border-gray-100 shadow-sm">
              業務委託の登録はありません。
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                onClick={() => handleOpenEditModal(item)}
                className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm hover:border-blue-300 hover:shadow-md transition cursor-pointer space-y-2.5"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2 pointer-events-none">
                    <span
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: item.color || '#4b5563' }}
                    />
                    {item.contractor && (
                      <span className="text-[11px] bg-gray-100 text-gray-700 px-2 py-0.5 rounded font-medium border border-gray-200">
                        {item.contractor}
                      </span>
                    )}
                    <span className="text-gray-900 font-bold text-sm">{item.title}</span>
                  </div>

                  <div className="flex items-center space-x-1.5" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(item)}
                      className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                      title="編集"
                    >
                      <Edit2 size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleDeleteItem(item.id, e)}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                      title="削除"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 pt-1 border-t border-gray-50 pointer-events-none">
                  {item.date && (
                    <span className="flex items-center space-x-1">
                      <CalendarIcon size={13} className="text-gray-400" />
                      <span>{item.date}</span>
                    </span>
                  )}
                  {item.time && (
                    <span className="flex items-center space-x-1">
                      <Clock size={13} className="text-gray-400" />
                      <span>{item.time}</span>
                    </span>
                  )}
                  {item.address && (
                    <span className="flex items-center space-x-1">
                      <MapPin size={13} className="text-gray-400" />
                      <span>{item.address}</span>
                    </span>
                  )}
                </div>

                {item.memo && (
                  <div className="text-xs bg-gray-50 text-gray-600 p-2.5 rounded-xl border border-gray-100 flex items-start space-x-2 mt-2 pointer-events-none">
                    <FileText size={14} className="text-gray-400 mt-0.5 flex-shrink-0" />
                    <p className="whitespace-pre-wrap leading-relaxed">{item.memo}</p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* モーダル */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
                <h3 className="text-base font-bold text-gray-800">
                  {editingId ? '業務委託の編集' : '新規業務委託の登録'}
                </h3>
                <button type="button" onClick={() => setIsModalOpen(false)} className="p-1 rounded-full hover:bg-gray-100 text-gray-500">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">委託先</label>
                  <input
                    type="text"
                    value={contractor}
                    onChange={(e) => setContractor(e.target.value)}
                    placeholder="例: 株式会社○○"
                    className="w-full border border-gray-200 bg-gray-50 rounded-lg px-3 py-2 text-sm focus:bg-white focus:ring-2 focus:ring-blue-100 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">タイトル・現場名</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    placeholder="例: ○○様邸 現場施工"
                    className="w-full border border-gray-200 bg-gray-50 rounded-lg px-3 py-2 text-sm focus:bg-white focus:ring-2 focus:ring-blue-100 outline-none"
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
                    空室に設定
                  </label>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-gray-600">予定日</label>
                    {date && (
                      <button type="button" onClick={() => setDate('')} className="text-[11px] text-blue-600 hover:underline">
                        クリア
                      </button>
                    )}
                  </div>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full border border-gray-200 bg-gray-50 rounded-lg px-3 py-2 text-sm focus:bg-white focus:ring-2 focus:ring-blue-100 outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">開始時間</label>
                    <select value={startTime} onChange={(e) => handleStartTimeChange(e.target.value)} className="w-full border border-gray-200 bg-gray-50 rounded-lg px-3 py-2 text-sm">
                      {timeOptions.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">終了時間</label>
                    <select value={endTime} onChange={(e) => setEndTime(e.target.value)} className="w-full border border-gray-200 bg-gray-50 rounded-lg px-3 py-2 text-sm">
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
                    className="w-full border border-gray-200 bg-gray-50 rounded-lg px-3 py-2 text-sm focus:bg-white focus:ring-2 focus:ring-blue-100 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">メモ・詳細</label>
                  <textarea
                    value={memo}
                    onChange={(e) => setMemo(e.target.value)}
                    rows={3}
                    placeholder="作業の注意点やメモなどを入力..."
                    className="w-full border border-gray-200 bg-gray-50 rounded-lg px-3 py-2 text-sm focus:bg-white focus:ring-2 focus:ring-blue-100 outline-none resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">カードカラー</label>
                  <div className="flex space-x-3">
                    {colorOptions.map((c) => (
                      <button
                        key={c.value}
                        type="button"
                        style={{ backgroundColor: c.value }}
                        onClick={() => setColor(c.value)}
                        className={`w-7 h-7 rounded-full transition ${color === c.value ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : 'opacity-70 hover:opacity-100'}`}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex space-x-2 pt-4 flex-shrink-0">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-50">キャンセル</button>
                  <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 shadow-sm">
                    {editingId ? '更新する' : '登録する'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}