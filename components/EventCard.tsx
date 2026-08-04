import React from 'react';
import { EventItem } from '@/app/page';

interface EventCardProps {
  event: EventItem;
  onClick: () => void;
  onDelete?: () => void; // 削除用のコールバック（任意）
}

export default function EventCard({ event, onClick, onDelete }: EventCardProps) {
  // 1. 完了状態の判定
  const isCompleted = event.status === 'completed' || (event as any).completed;

  // 2. タイトルを取得
  const title = event.title || '';

  // 3. 「未定」や「日延未定」などの文字が含まれているか判定
  const isUndecided = title.includes('未定');

  // 4. 完了している かつ 「未定」ではない場合のみ半透明（opacity-50）にする
  // （＝日程が決まった日延べや通常の予定は半透明になり、未定のものは半透明にならない）
  const shouldDim = isCompleted && !isUndecided;

  return (
    <div
      onClick={onClick}
      style={{ backgroundColor: event.color || '#4b5563' }}
      className={`w-full h-full text-white text-xs p-1 rounded shadow-sm cursor-pointer hover:opacity-90 flex flex-col justify-between overflow-hidden box-border whitespace-normal break-words relative group transition-opacity ${
        shouldDim ? 'opacity-50' : 'opacity-100'
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