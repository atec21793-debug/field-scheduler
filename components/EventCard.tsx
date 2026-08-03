import React from 'react';
import { EventItem } from '@/app/page';

interface EventCardProps {
  event: EventItem;
  onClick: () => void;
}

export default function EventCard({ event, onClick }: EventCardProps) {
  return (
    <div
      onClick={onClick}
      style={{ backgroundColor: event.color || '#4b5563' }}
      className="w-full h-full text-white text-xs p-1 rounded shadow-sm cursor-pointer hover:opacity-90 flex flex-col justify-start overflow-hidden box-border whitespace-normal break-words"
    >
      <div className="leading-tight break-words">
        {event.title}
      </div>
      {event.address && (
        <div className="text-[10px] opacity-90 mt-0.5 break-words">
          {event.address}
        </div>
      )}
    </div>
  );
}