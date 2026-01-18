import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Download, MoreHorizontal } from 'lucide-react';
import { api } from '../services/api';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';

export interface CalendarEvent {
  id: string;
  title: string;
  date: Date;
  type: 'class' | 'exam' | 'assignment' | 'event';
  description?: string;
  color_hex?: string;
}

export function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null); // For Day Detail Modal
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch events from backend on mount
  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    setLoading(true);
    const token = localStorage.getItem('canvas_token') || import.meta.env.VITE_CANVAS_TOKEN;

    try {
      const [eventsResponse, assignmentsResponse] = await Promise.all([
        api.getEvents(),
        api.getCanvasAssignments(token || undefined)
      ]);

      let allEvents: CalendarEvent[] = [];

      if (eventsResponse.success && eventsResponse.data) {
        allEvents = eventsResponse.data.map((event: any) => ({
          id: event.id || Math.random().toString(),
          title: event.summary || 'Untitled Event',
          date: new Date(event.start_time),
          type: event.event_type || 'event',
          description: event.description || '',
          color_hex: event.color_hex
        }));
      }

      if (assignmentsResponse.success && assignmentsResponse.data) {
        const assignmentEvents: CalendarEvent[] = assignmentsResponse.data.map((a: any) => ({
          id: String(a.id),
          title: a.title,
          date: a.due_at ? new Date(a.due_at) : new Date(),
          type: 'assignment',
          description: `${a.course_name} - ${a.description || ''}`,
          color_hex: '#1E3A5F' // Default or fetch real color if available
        }));
        allEvents = [...allEvents, ...assignmentEvents];
      }

      setEvents(allEvents);

    } catch (error) {
      console.error('Failed to fetch events:', error);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { daysInMonth, startingDayOfWeek };
  };

  const getEventsForDay = (day: number) => {
    return events.filter(event => {
      const eventDate = event.date;
      return (
        eventDate.getDate() === day &&
        eventDate.getMonth() === currentDate.getMonth() &&
        eventDate.getFullYear() === currentDate.getFullYear()
      );
    });
  };

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const exportToGoogleCalendar = (event: CalendarEvent) => {
    const startDate = event.date.toISOString().replace(/-|:|\.\d\d\d/g, '');
    const endDate = new Date(event.date.getTime() + 60 * 60 * 1000).toISOString().replace(/-|:|\.\d\d\d/g, '');
    const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.title)}&dates=${startDate}/${endDate}&details=${encodeURIComponent(event.description || '')}&sf=true&output=xml`;
    window.open(googleCalendarUrl, '_blank');
  };

  const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentDate);
  const monthName = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  // Helper to render an event pill
  const renderEventPill = (event: CalendarEvent, isSmall = false) => {
    const bgColor = event.color_hex || '#F4B400';
    return (
        <div 
            key={event.id}
            onClick={(e) => { e.stopPropagation(); setSelectedEvent(event); }}
            className={`w-full rounded px-1.5 py-0.5 mb-1 cursor-pointer truncate transition-opacity hover:opacity-80 text-white ${isSmall ? 'text-[10px]' : 'text-xs'}`}
            style={{ backgroundColor: bgColor }}
            title={event.title}
        >
            {event.title}
        </div>
    );
  };

  if (loading) return <div className="p-8 text-center text-[#1E3A5F]">Loading calendar...</div>;

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 border-2 border-[#1E3A5F]">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold" style={{ color: '#1E3A5F' }}>{monthName}</h2>
        <div className="flex items-center gap-2">
          <button onClick={previousMonth} className="p-2 rounded hover:bg-[#FDFCF0] text-[#1E3A5F]">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button onClick={nextMonth} className="p-2 rounded hover:bg-[#FDFCF0] text-[#1E3A5F]">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2 mb-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="text-center text-sm font-semibold py-2" style={{ color: '#F4B400' }}>
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-2">
        {Array.from({ length: startingDayOfWeek }).map((_, index) => (
          <div key={`empty-${index}`} className="aspect-square" />
        ))}
        
        {Array.from({ length: daysInMonth }).map((_, index) => {
          const day = index + 1;
          const dayEvents = getEventsForDay(day);
          const isToday = day === new Date().getDate() && currentDate.getMonth() === new Date().getMonth();
          const MAX_EVENTS = 2;

          return (
            <div
              key={day}
              onClick={() => {
                  if (dayEvents.length > 0) {
                      setSelectedDay(new Date(currentDate.getFullYear(), currentDate.getMonth(), day));
                  }
              }}
              className={`aspect-square border rounded-lg p-2 transition-colors relative overflow-hidden flex flex-col ${dayEvents.length > 0 ? 'cursor-pointer hover:bg-gray-50' : ''}`}
              style={{ 
                borderColor: isToday ? '#1E3A5F' : '#E2E8F0',
                borderWidth: isToday ? '2px' : '1px',
                backgroundColor: isToday ? '#FDFCF0' : 'white'
              }}
            >
              <div className="text-sm font-medium mb-1" style={{ color: isToday ? '#1E3A5F' : '#64748B' }}>
                {day}
              </div>
              
              <div className="flex-1 overflow-hidden">
                {dayEvents.slice(0, MAX_EVENTS).map(event => renderEventPill(event, true))}
                
                {dayEvents.length > MAX_EVENTS && (
                    <div className="text-[10px] text-gray-500 font-medium pl-1 mt-1 flex items-center gap-1">
                        <MoreHorizontal className="h-3 w-3" />
                        {dayEvents.length - MAX_EVENTS} more
                    </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Day Detail Modal */}
      <Dialog open={!!selectedDay} onOpenChange={(open) => !open && setSelectedDay(null)}>
        <DialogContent className="sm:max-w-md border-2 border-[#1E3A5F]">
          <DialogHeader>
            <DialogTitle style={{ color: '#1E3A5F' }}>
                {selectedDay?.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </DialogTitle>
            <DialogDescription>
                {getEventsForDay(selectedDay?.getDate() || 1).length} events scheduled
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            {selectedDay && getEventsForDay(selectedDay.getDate()).map(event => (
                <div key={event.id} 
                     className="p-3 rounded border flex items-center justify-between hover:bg-gray-50 cursor-pointer"
                     onClick={() => { setSelectedEvent(event); setSelectedDay(null); }}
                >
                    <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: event.color_hex || '#F4B400' }} />
                        <span className="font-medium text-sm text-[#1E3A5F]">{event.title}</span>
                    </div>
                    <Badge variant="outline" className="text-xs text-gray-500 border-gray-200">
                        {event.type}
                    </Badge>
                </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Event Detail Modal (Reusing existing selection logic but inside a Dialog ideally, staying simple here) */}
      <Dialog open={!!selectedEvent} onOpenChange={(open) => !open && setSelectedEvent(null)}>
        <DialogContent className="sm:max-w-md border-2 border-[#1E3A5F]">
            <DialogHeader>
                <div className="flex items-center gap-2 mb-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: selectedEvent?.color_hex || '#F4B400' }} />
                    <DialogTitle style={{ color: '#1E3A5F' }}>{selectedEvent?.title}</DialogTitle>
                </div>
                <DialogDescription>
                    {selectedEvent?.date.toLocaleString()}
                </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
                <p className="text-sm text-gray-700">{selectedEvent?.description || "No description provided."}</p>
                <div className="flex justify-end gap-2">
                    <button
                        onClick={() => selectedEvent && exportToGoogleCalendar(selectedEvent)}
                        className="flex items-center gap-2 px-4 py-2 text-white rounded-lg transition-colors text-sm font-medium"
                        style={{ backgroundColor: '#1E3A5F' }}
                    >
                        <Download className="w-4 h-4" />
                        Export to Google
                    </button>
                </div>
            </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}