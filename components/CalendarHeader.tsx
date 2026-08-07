import React from 'react';
import { ChevronLeft, ChevronRight, Search, X } from 'lucide-react';
import Link from 'next/link';

interface CalendarHeaderProps {
  currentDate: Date;
  viewMode: 'month' | 'week' | 'day';
  setViewMode: (mode: 'month' | 'week' | 'day') => void;
  onNavigate: (direction: 'prev' | 'today' | 'next') => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export default function CalendarHeader({
  currentDate,
  viewMode,
  setViewMode,
  onNavigate,
  searchQuery,
  setSearchQuery,
}: CalendarHeaderProps) {
  const formattedYearMonth = `${currentDate.getFullYear()}年 ${currentDate.getMonth() + 1}月`;

  return (
    <header className="flex flex-col sm:flex-row items-center justify-between border-b border-gray-200 px-4 py-3 bg-white gap-3">
      <div className="flex items-center space-x-4 w-full sm:w-auto justify-between sm:justify-start">
        <h1 className="text-xl font-semibold text-gray-800 min-w-[120px]">
          {formattedYearMonth}
        </h1>
        <div className="flex items-center space-x-1">
          <button onClick={() => onNavigate('prev')} className="p-2 rounded-full hover:bg-gray-100 text-gray-600">
            <ChevronLeft size={20} />
          </button>
          <button onClick={() => onNavigate('today')} className="px-3 py-1.5 text-sm font-medium border border-gray-300 rounded-md hover:bg-gray-50 text-gray-700">
            今日
          </button>
          <button onClick={() => onNavigate('next')} className="p-2 rounded-full hover:bg-gray-100 text-gray-600">
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      <div className="flex items-center space-x-3 w-full sm:w-auto justify-end flex-wrap sm:flex-nowrap">
        {/* 検索バーの左側に配置したボタン群（未発注・住所なし・★つき） */}
        <div className="flex items-center space-x-2 flex-shrink-0">
          <Link
            href="/un-ordered"
            style={{ backgroundColor: '#f3f4f6', color: '#374151', borderColor: '#d1d5db' }}
            className="flex items-center space-x-1 px-3 py-1.5 border rounded-md text-sm font-medium shadow-sm transition hover:bg-gray-200"
            title="未発注リストを開く"
          >
            <span>未発注</span>
          </Link>

          <Link
            href="/no-address"
            style={{ backgroundColor: '#f3f4f6', color: '#374151', borderColor: '#d1d5db' }}
            className="flex items-center space-x-1 px-3 py-1.5 border rounded-md text-sm font-medium shadow-sm transition hover:bg-gray-200"
            title="住所なしリストを開く"
          >
            <span>住所</span>
          </Link>

          <Link
            href="/starred"
            style={{ backgroundColor: '#f3f4f6', color: '#374151', borderColor: '#d1d5db' }}
            className="flex items-center space-x-1 px-3 py-1.5 border rounded-md text-sm font-medium shadow-sm transition hover:bg-gray-200"
            title="★つき予定一覧を開く"
          >
            <span>依頼書</span>
          </Link>
        </div>

        {/* 検索入力欄 */}
        <div className="relative flex-1 sm:w-64">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="予定を検索（例: 新宿、工期など）"
            className="w-full pl-9 pr-8 py-1.5 text-sm bg-gray-50 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-gray-800"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* 表示切替タブ */}
        <div className="flex bg-gray-100 p-1 rounded-lg flex-shrink-0">
          <button
            onClick={() => setViewMode('day')}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition ${viewMode === 'day' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600'}`}
          >
            日
          </button>
          <button
            onClick={() => setViewMode('week')}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition ${viewMode === 'week' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600'}`}
          >
            週
          </button>
          <button
            onClick={() => setViewMode('month')}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition ${viewMode === 'month' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600'}`}
          >
            月
          </button>
        </div>
      </div>
    </header>
  );
}