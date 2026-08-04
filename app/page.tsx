'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import CalendarHeader from '@/components/CalendarHeader';
import MonthView from '@/components/MonthView';
import WeekView from '@/components/WeekView';
import DayView from '@/components/DayView';
import EventModal from '@/components/EventModal';
import EventFormModal from '@/components/EventFormModal';

export type EventItem = {
  id: number;
  date: string;
  title: string;
  member: string | null;
  status: string;
  inserted_at: string;
  time: string | null;
  address: string | null;
  start_time: string | null;
  end_time: string | null;
  color: string | null;
};

export default function Home() {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('week');
  const [events, setEvents] = useState<EventItem[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [targetDateForCreate, setTargetDateForCreate] = useState<string>('');
  const [targetTimeForCreate, setTargetTimeForCreate] = useState<string>('09:00');

  const fetchEvents = async () => {
    const { data, error } = await supabase.from('events').select('*');
    if (error) console.error('Error fetching events:', error);
    else if (data) setEvents(data);
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleNavigate = (direction: 'prev' | 'today' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'today') {
      setCurrentDate(new Date());
      return;
    }
    const amount = direction === 'next' ? 1 : -1;
    if (viewMode === 'month') newDate.setMonth(newDate.getMonth() + amount);
    else if (viewMode === 'week') newDate.setDate(newDate.getDate() + amount * 7);
    else newDate.setDate(newDate.getDate() + amount);
    setCurrentDate(newDate);
  };

  const handleCellClick = (dateStr: string, timeStr: string = '09:00') => {
    setTargetDateForCreate(dateStr);
    setTargetTimeForCreate(timeStr);
    setIsCreateModalOpen(true);
  };

  return (
    <main className="flex flex-col h-screen bg-white">
      <CalendarHeader
        currentDate={currentDate}
        viewMode={viewMode}
        setViewMode={setViewMode}
        onNavigate={handleNavigate}
      />
      <div className="flex-1 overflow-auto">
        {viewMode === 'month' && (
          <MonthView currentDate={currentDate} events={events} onSelectEvent={(e) => { setSelectedEvent(e); setIsModalOpen(true); }} onCellClick={handleCellClick} />
        )}
        {viewMode === 'week' && (
          <WeekView 
            currentDate={currentDate} 
            events={events} 
            onSelectEvent={(e) => { setSelectedEvent(e); setIsModalOpen(true); }} 
            onCellClick={handleCellClick} 
            onUpdate={fetchEvents} 
          />
        )}
        {viewMode === 'day' && (
          <DayView currentDate={currentDate} events={events} onSelectEvent={(e) => { setSelectedEvent(e); setIsModalOpen(true); }} onCellClick={handleCellClick} />
        )}
      </div>

      {isModalOpen && selectedEvent && (
        <EventModal event={selectedEvent} onClose={() => setIsModalOpen(false)} onUpdate={fetchEvents} />
      )}

      {isCreateModalOpen && (
        <EventFormModal defaultDate={targetDateForCreate} defaultTime={targetTimeForCreate} onClose={() => setIsCreateModalOpen(false)} onCreated={fetchEvents} />
      )}
    </main>
  );
}