import React from 'react';
import { EventItem } from '@/app/page';

interface EventCardProps {
  event: EventItem;
  onClick: () => void;
  onDelete?: () => void;
}

export default function EventCard({ event, onClick, onDelete }: EventCardProps) {
  // 1. 完了状態の判定
  const isCompleted = event.status === 'completed' || (event as any).completed;

  // 2. タイトルを取得
  const title = event.title || '';

  // 3. タイトルの内容でフラグを判定
  const isUndecided = title.includes('日延未定'); // 未定のもの
  const isPostponed = title.includes('日延べ');  // 日程が決まって日延べされたもの

  // 4. 半透明（opacity-50）にする条件：
  // ・「日延べ」の文字が含まれている（日程が決まった側）
  // ・ または、完了していて、かつ「日延未定」ではないもの
  const shouldDim = isPostponed || (isCompleted && !isUndecided);

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

      {onDelete && (
        <button
          onClick={(e) => {
            e.stopPropagation();
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