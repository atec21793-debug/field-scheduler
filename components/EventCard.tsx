import React from 'react';
import { EventItem } from '@/app/page';

interface EventCardProps {
  event: EventItem;
  onClick: () => void;
  onDelete?: () => void; // 削除用のコールバック（任意）
}

export default function EventCard({ event, onClick, onDelete }: EventCardProps) {
  // タイトルに「[日延べ]」が含まれているか判定
  const isPostponed = event.title && event.title.includes('[日延べ]');

  return (
    <div
      onClick={onClick}
      style={{ backgroundColor: event.color || '#4b5563' }}
      className={`w-full h-full text-white text-xs p-1 rounded shadow-sm cursor-pointer hover:opacity-90 flex flex-col justify-between overflow-hidden box-border whitespace-normal break-words relative group ${
        isPostponed ? 'opacity-50' : ''
      }`}
    >
      <div>
        <div className="leading-tight break-words pr-4">
          {event.title}
        </div>
        {event.address && (
          <div className="text-[10px] opacity-90 mt-0.5 break-words">
            {event.address}
          </div>
        )}
      </div>

      {/* 削除ボタン（ホバー時または常時表示） */}
      {onDelete && (
        <button
          onClick={(e) => {
            e.stopPropagation(); // カード自体のクリックイベント（編集モーダルなど）が発火しないようにする
            if (confirm('この予定を削除しますか？')) {
              onDelete();
            }
          }}
          className="absolute top-1 right-1 text-white hover:text-red-200 bg-black/30 hover:bg-black/50 rounded w-4 h-4 flex items-center justify-center text-[10px]"
          title="削除"
        >
          ×
        </button>
      )}
    </div>
  );
}