import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Download } from 'lucide-react';
import { api } from '../services/api';

export interface CalendarEvent {
  id: string;
  title: string;
  date: Date;
  type: 'class' | 'exam' | 'assignment' | 'event';
  description?: string;
}

export function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
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
      // Fetch both syllabus events and canvas assignments in parallel
      const [eventsResponse, assignmentsResponse] = await Promise.all([
        api.getEvents(),
        api.getCanvasAssignments(token || undefined)
      ]);

      let allEvents: CalendarEvent[] = [];

      // Process Syllabus Events
      if (eventsResponse.success && eventsResponse.data) {
        allEvents = eventsResponse.data.map((event: any) => ({
          id: event.id || Math.random().toString(),
          title: event.summary || 'Untitled Event',
          date: new Date(event.start_time),
          type: event.event_type || 'event',
          description: event.description || '',
        }));
      }

      // Process Canvas Assignments
      if (assignmentsResponse.success && assignmentsResponse.data) {
        const assignmentEvents: CalendarEvent[] = assignmentsResponse.data.map((a: any) => ({
          id: String(a.id),
          title: a.title,
          date: a.due_at ? new Date(a.due_at) : new Date(), // Use today if no date, or handle differently
          type: 'assignment',
          description: `${a.course_name} - ${a.description || ''}`,
        }));
        allEvents = [...allEvents, ...assignmentEvents];
      }

      setEvents(allEvents);

    } catch (error) {
      console.error('Failed to fetch events:', error);
      // Don't clear events if partial failure, or maybe just show what we have? 
      // ideally we handle them separately but for now:
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

  const exportAllEvents = async () => {
    try {
      const response = await api.syncCalendar(events.map(e => ({
        summary: e.title,
        description: e.description,
        start_time: e.date.toISOString(),
        end_time: new Date(e.date.getTime() + 60 * 60 * 1000).toISOString(),
        event_type: e.type,
      })), '');
      
      if (response.success) {
        alert('Events synced successfully!');
      } else {
        alert('Failed to sync events. Please try again.');
      }
    } catch (error) {
      console.error('Failed to sync events:', error);
      alert('Failed to sync events. Please try again.');
    }
  };

  const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentDate);
  const monthName = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6" style={{ borderWidth: '2px', borderColor: '#185177' }}>
        <div className="flex items-center justify-center h-64">
          <p style={{ color: '#185177' }}>Loading calendar...</p>
        </div>
      </div>
    );
  }

  const typeColors = {
    class: 'text-white border',
    exam: 'text-white border',
    assignment: 'text-white border',
    event: 'text-white border',
  };
  
  const typeBackgrounds = {
    class: '#185177',
    exam: '#c95603',
    assignment: '#e2711d',
    event: '#ffb627',
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6" style={{ borderWidth: '2px', borderColor: '#185177' }}>
      <div className="flex items-center justify-between mb-6">
        <h2 style={{ color: '#185177' }}>{monthName}</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={exportAllEvents}
            disabled={events.length === 0}
            className="flex items-center gap-2 px-3 py-2 text-sm text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: '#185177' }}
            onMouseEnter={(e) => {
              if (events.length > 0) {
                e.currentTarget.style.backgroundColor = '#e2711d';
              }
            }}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#185177'}
          >
            <Download className="w-4 h-4" />
            Export All
          </button>
          <button onClick={previousMonth} className="p-2 rounded-lg transition-colors" style={{ color: '#185177' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#ffc971'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button onClick={nextMonth} className="p-2 rounded-lg transition-colors" style={{ color: '#185177' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#ffc971'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2 mb-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="text-center text-sm py-2" style={{ color: '#c95603' }}>
            {day}
          </div>
        ))}
      </div>

      {events.length === 0 && (
        <div className="text-center py-8 mb-4">
          <p style={{ color: '#c95603' }} className="text-sm">
            No events found. Upload a syllabus or sync with Canvas to get started!
          </p>
        </div>
      )}

      <div className="grid grid-cols-7 gap-2">
        {Array.from({ length: startingDayOfWeek }).map((_, index) => (
          <div key={`empty-${index}`} className="aspect-square" />
        ))}
        
        {Array.from({ length: daysInMonth }).map((_, index) => {
          const day = index + 1;
          const dayEvents = getEventsForDay(day);
          const isToday = day === 17 && currentDate.getMonth() === 0;

          return (
            <div
              key={day}
              className="aspect-square border rounded-lg p-2 transition-colors"
              style={{ 
                borderColor: isToday ? '#185177' : 'rgba(24, 81, 119, 0.2)',
                backgroundColor: isToday ? '#fff9e6' : 'transparent',
                borderWidth: isToday ? '2px' : '1px'
              }}
              onMouseEnter={(e) => !isToday && (e.currentTarget.style.backgroundColor = '#fffcf5')}
              onMouseLeave={(e) => !isToday && (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              <div className="text-sm mb-1" style={{ color: isToday ? '#185177' : '#333' }}>
                {day}
              </div>
              <div className="space-y-1">
                {dayEvents.map(event => (
                  <button
                    key={event.id}
                    onClick={() => setSelectedEvent(event)}
                    className={`w-full text-xs px-1 py-0.5 rounded border truncate text-left ${typeColors[event.type]}`}
                    style={{ backgroundColor: typeBackgrounds[event.type], borderColor: typeBackgrounds[event.type] }}
                  >
                    {event.title}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {selectedEvent && (
        <div className="mt-6 p-4 rounded-lg border-2" style={{ backgroundColor: '#fffcf5', borderColor: '#185177' }}>
          <div className="flex items-start justify-between mb-2">
            <div>
              <h3 style={{ color: '#185177' }}>{selectedEvent.title}</h3>
              <p className="text-sm mt-1" style={{ color: '#c95603' }}>
                {selectedEvent.date.toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            </div>
            <span className={`text-xs px-2 py-1 rounded-full border ${typeColors[selectedEvent.type]}`}
              style={{ backgroundColor: typeBackgrounds[selectedEvent.type], borderColor: typeBackgrounds[selectedEvent.type] }}>
              {selectedEvent.type}
            </span>
          </div>
          {selectedEvent.description && (
            <p className="text-sm mb-4" style={{ color: '#185177' }}>{selectedEvent.description}</p>
          )}
          <button
            onClick={() => exportToGoogleCalendar(selectedEvent)}
            className="flex items-center gap-2 px-4 py-2 text-white rounded-lg transition-colors text-sm"
            style={{ backgroundColor: '#185177' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e2711d'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#185177'}
          >
            <Download className="w-4 h-4" />
            Export to Google Calendar
          </button>
        </div>
      )}
    </div>
  );
}
