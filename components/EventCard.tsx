import React from 'react';
import { EventItem } from '@/app/page';

interface EventCardProps {
  event: EventItem;
  onClick: () => void;
  onDelete?: () => void;
}

export default function EventCard({ event, onClick, onDelete }: EventCardProps) {
  const isCompleted = event.status === 'completed' || (event as any).completed;
  const title = event.title || '';
  const isUndecided = title.includes('日延未定');
  const isPostponed = title.includes('日延べ');
  const shouldDim = isPostponed || (isCompleted && !isUndecided);

  const handleAddressClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (event.address) {
      const mapUrl = `https://maps.google.com/?q=${encodeURIComponent(event.address)}`;
      window.open(mapUrl, '_blank', 'noopener,noreferrer');
    }
  };

  // ドラッグ開始時にイベントIDを転送する
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('text/plain', event.id.toString());
    e.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onClick={onClick}
      style={{ backgroundColor: event.color || '#4b5563' }}
      className={`w-full h-full text-white text-xs p-1 rounded shadow-sm cursor-grab active:cursor-grabbing hover:opacity-90 flex flex-col justify-between overflow-hidden box-border whitespace-normal break-words relative group transition-opacity ${
        shouldDim ? 'opacity-50' : 'opacity-100'
      }`}
    >
      <div>
        <div className="leading-tight break-words pr-4">
          {event.title}
        </div>
        {event.address && (
          <div 
            onClick={handleAddressClick}
            className="text-[10px] opacity-90 mt-0.5 break-words hover:underline cursor-pointer inline-block"
            title="クリックしてGoogleマップで開く"
          >
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