'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';

interface OutsourcingItem {
  id: string;
  contractor: string; // 業者名・委託先
  content: string;    // 作業内容
  location: string;   // 住所・現場
  notes: string;      // 備考・メモ
}

export default function OutsourcingPage() {
  const [items, setItems] = useState<OutsourcingItem[]>([
    {
      id: '1',
      contractor: 'サンプル業者A',
      content: 'エアコン取付 2台',
      location: '東京都新宿区...',
      notes: '鍵の預かりあり',
    },
  ]);

  const [contractor, setContractor] = useState('');
  const [content, setContent] = useState('');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contractor.trim() && !content.trim()) return;

    const newItem: OutsourcingItem = {
      id: Date.now().toString(),
      contractor,
      content,
      location,
      notes,
    };

    setItems([newItem, ...items]);
    setContractor('');
    setContent('');
    setLocation('');
    setNotes('');
  };

  const handleDeleteItem = (id: string) => {
    setItems(items.filter((item) => item.id !== id));
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* ヘルパーヘッダー（カレンダーへ戻るボタン） */}
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
        </div>

        {/* 新規登録フォーム */}
        <form onSubmit={handleAddItem} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
          <h2 className="text-md font-semibold text-gray-700 mb-3">新規業務委託の追加</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
            <input
              type="text"
              value={contractor}
              onChange={(e) => setContractor(e.target.value)}
              placeholder="委託先 / 業者名"
              className="px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="text"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="作業内容（例: エアコン1台脱着）"
              className="px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="現場住所"
              className="px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="備考"
              className="px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            type="submit"
            className="flex items-center justify-center space-x-1 w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition"
          >
            <Plus size={16} />
            <span>追加する</span>
          </button>
        </form>

        {/* 一覧表示 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 font-medium text-sm text-gray-700">
            登録済みリスト ({items.length}件)
          </div>
          {items.length === 0 ? (
            <div className="p-6 text-center text-gray-500 text-sm">業務委託の予定はありません。</div>
          ) : (
            <div className="divide-y divide-gray-200">
              {items.map((item) => (
                <div key={item.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs font-semibold">
                        {item.contractor || '未指定の業者'}
                      </span>
                      <span className="text-gray-800 font-medium text-sm">{item.content}</span>
                    </div>
                    {item.location && <p className="text-xs text-gray-500 mt-1">📍 {item.location}</p>}
                    {item.notes && <p className="text-xs text-gray-400 mt-0.5">備考: {item.notes}</p>}
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
      </div>
    </div>
  );
}